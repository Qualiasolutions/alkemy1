import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ScriptAnalysis, Generation, TimelineClip, ContinuityIssue } from '../types';
import { askTheDirector, generateStillVariants, upscaleImage } from '../services/aiService';
import Button from './Button';
import PromptModal from './PromptModal';
import StyleLearningOptIn from './StyleLearningOptIn';
import { BrainIcon, SendIcon, XIcon } from './icons/Icons';
import {
    initializeVoiceRecognition,
    isVoiceRecognitionSupported,
    VoiceRecognitionService,
    getVoiceMode,
    setVoiceMode,
    VoiceMode,
    // Voice output (TTS) imports
    isVoiceSynthesisSupported,
    getAvailableVoices,
    speakText,
    stopSpeech,
    pauseSpeech,
    resumeSpeech,
    isSpeaking,
    isSpeechPaused,
    isVoiceOutputEnabled,
    setVoiceOutputEnabled,
    getSavedVoice,
    setSavedVoiceId,
    getSavedSpeechRate,
    setSavedSpeechRate,
} from '../services/voiceService';
import {
    isStyleLearningEnabled,
    setStyleLearningEnabled,
    hasShownOptInPrompt,
    setOptInPromptShown,
    trackPattern,
    getStyleSuggestion,
    getStyleLearningSummary,
} from '../services/styleLearningService';
import {
    analyzeContinuity,
    dismissWarning,
    generateContinuityReport,
} from '../services/continuityService';

type Author = 'user' | 'director';

interface Message {
  author: Author;
  text: string;
  isCommand?: boolean;
  images?: string[];
  promptData?: string; // Store the generated prompt for later viewing
  continuityIssues?: ContinuityIssue[]; // Continuity warnings to display
}

interface DirectorWidgetProps {
  scriptAnalysis: ScriptAnalysis | null;
  setScriptAnalysis: (analysis: ScriptAnalysis | ((prev: ScriptAnalysis | null) => ScriptAnalysis | null)) => void;
  timelineClips?: TimelineClip[]; // Optional timeline clips for continuity checking
}

const DEFAULT_SCRIPT_ANALYSIS: ScriptAnalysis = {
  title: 'Untitled Project',
  logline: 'No project has been analyzed yet.',
  summary: 'Start a project or analyze your script so the Director can tailor guidance to your story.',
  scenes: [],
  characters: [],
  locations: [],
  props: [],
  styling: [],
  setDressing: [],
  makeupAndHair: [],
  sound: [],
  moodboard: undefined,
  moodboardTemplates: [],
};

const WELCOME_MESSAGE = 'Hi! I\'m your Director of Photography, and I\'ve just reviewed your project. I\'m here to help bring your vision to life.\n\nWhether you need help with camera angles, lighting setups, visual mood, or generating images for your characters and locations - just ask me naturally. I\'m here to collaborate with you.\n\nWhat would you like to discuss?';
const WELCOME_MESSAGE_NO_CONTEXT = 'Hello! I\'m your Director of Photography. I\'m here to help you with cinematography, camera work, lighting, color grading, and visual storytelling.\n\nOnce you load or analyze a script, I\'ll have full context of your story. But I can already help you explore ideas, plan shots, or generate images.\n\nWhat\'s on your mind?';
const ACCENT_HEX = '#dfec2d';
const resolveGenerationModel = (model?: string): 'Imagen' | 'Gemini Nano Banana' | 'Flux' | 'Flux Kontext Max Multi' => {
  const normalized = (model ?? '').toLowerCase();
  if (normalized.includes('imagen')) return 'Imagen';
  if (normalized.includes('nano') || normalized.includes('banana') || normalized.includes('gemini') || normalized.includes('flash')) {
    return 'Gemini Nano Banana';
  }
  if (normalized.includes('kontext') || normalized.includes('max') || normalized.includes('multi')) {
    return 'Flux Kontext Max Multi';
  }
  return 'Flux';
};

const buildGenerationEntries = (urls: string[], errors: (string | null)[], aspectRatio: string): Generation[] => {
  const timestamp = Date.now();
  return urls.reduce<Generation[]>((acc, url, index) => {
    if (!url) {
      return acc;
    }
    acc.push({
      id: `director-${timestamp}-${index}`,
      url,
      aspectRatio,
      isLoading: false,
      error: errors[index] ?? undefined,
    });
    return acc;
  }, []);
};


const DirectorWidget: React.FC<DirectorWidgetProps> = ({ scriptAnalysis, setScriptAnalysis, timelineClips }) => {
  const hasProjectContext = Boolean(scriptAnalysis);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [{
    author: 'director',
    text: hasProjectContext ? WELCOME_MESSAGE : WELCOME_MESSAGE_NO_CONTEXT,
  }]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [promptModal, setPromptModal] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeRequestIdRef = useRef<number | null>(null);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const voiceService = useRef<VoiceRecognitionService | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Voice output (TTS) state
  const [voiceOutputSupported, setVoiceOutputSupported] = useState(false);
  const [voiceOutputActive, setVoiceOutputActive] = useState(false); // Opt-in (default: false)
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechRate, setSpeechRate] = useState(1.0); // 0.5 - 2.0
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Style learning state (Epic 1, Story 1.3)
  const [showOptInPrompt, setShowOptInPrompt] = useState(false);
  const [styleLearningActive, setStyleLearningActive] = useState(false);
  const [styleSummary, setStyleSummary] = useState<{ projectsAnalyzed: number; shotsTracked: number } | null>(null);

  // Continuity checking state (Epic 1, Story 1.4)
  const [continuityIssues, setContinuityIssues] = useState<ContinuityIssue[]>([]);
  const [lastContinuityCheck, setLastContinuityCheck] = useState<number | null>(null);

  const analysisForChat = scriptAnalysis ?? DEFAULT_SCRIPT_ANALYSIS;
  const welcomeMessage = hasProjectContext ? WELCOME_MESSAGE : WELCOME_MESSAGE_NO_CONTEXT;
  const canResetChat = messages.some((message, index) => {
    if (index === 0) return message.author !== 'director' || message.text !== welcomeMessage;
    return message.text.trim().length > 0;
  });

  const resetConversation = useCallback(() => {
    activeRequestIdRef.current = null;
    setIsLoading(false);
    setMessages([{ author: 'director', text: welcomeMessage }]);
    setPromptModal(null);
    setUserInput('');
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [setMessages, setPromptModal, setUserInput, setIsLoading, welcomeMessage]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].author === 'director' && (prev[0].text === WELCOME_MESSAGE || prev[0].text === WELCOME_MESSAGE_NO_CONTEXT)) {
        if (prev[0].text === welcomeMessage) {
          return prev;
        }
        return [{ author: 'director', text: welcomeMessage }];
      }
      return prev;
    });
  }, [welcomeMessage]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    }
  }, [isOpen]);

  // Initialize voice recognition on mount
  useEffect(() => {
    setVoiceSupported(isVoiceRecognitionSupported());

    if (isVoiceRecognitionSupported()) {
      initializeVoiceRecognition().then(service => {
        voiceService.current = service;

        // Handle transcription results
        service.onResult((transcript, isFinal, confidence) => {
          setVoiceTranscript(transcript);
          setVoiceError(null);

          // If final result, populate input field and stop listening
          if (isFinal) {
            setUserInput(transcript);
            setIsListening(false);
            setVoiceTranscript('');
            // Focus input so user can edit or submit
            setTimeout(() => textareaRef.current?.focus(), 100);
          }
        });

        // Handle errors
        service.onError((error) => {
          console.error('Voice recognition error:', error);
          setVoiceError(error);
          setIsListening(false);
          setVoiceTranscript('');
          stopWaveformAnimation();
        });

        // Handle recognition end
        service.onEnd(() => {
          setIsListening(false);
          setVoiceTranscript('');
          stopWaveformAnimation();
        });

        // Handle recognition start
        service.onStart(() => {
          setVoiceError(null);
          startWaveformAnimation();
        });
      }).catch(error => {
        console.error('Failed to initialize voice recognition:', error);
        setVoiceSupported(false);
      });
    }

    // Cleanup on unmount
    return () => {
      if (voiceService.current && isListening) {
        voiceService.current.stop();
      }
      stopWaveformAnimation();
    };
  }, []);

  // Initialize voice output (TTS) on mount
  useEffect(() => {
    setVoiceOutputSupported(isVoiceSynthesisSupported());

    if (isVoiceSynthesisSupported()) {
      // Load saved preferences asynchronously
      isVoiceOutputEnabled().then(savedEnabled => {
        setVoiceOutputActive(savedEnabled);
      });

      getSavedSpeechRate().then(savedRate => {
        // Validate speech rate to prevent non-finite values
        const validRate = isFinite(savedRate) && savedRate >= 0.5 && savedRate <= 2.0 ? savedRate : 1.0;
        setSpeechRate(validRate);
      });

      // Load available voices
      getAvailableVoices().then(voices => {
        setAvailableVoices(voices);

        // Try to restore saved voice
        getSavedVoice().then(savedVoice => {
          if (savedVoice) {
            setSelectedVoice(savedVoice);
          } else if (voices.length > 0) {
            // Default to first English voice
            const englishVoice = voices.find(v => v.lang.startsWith('en'));
            setSelectedVoice(englishVoice || voices[0]);
          }
        });
      });
    }

    // Cleanup on unmount
    return () => {
      stopSpeech();
    };
  }, []);

  // Initialize style learning (Epic 1, Story 1.3 - AC6: Privacy Controls)
  useEffect(() => {
    // Check if user has enabled style learning asynchronously
    isStyleLearningEnabled().then(enabled => {
      setStyleLearningActive(enabled);

      // Load style summary if enabled
      if (enabled) {
        getStyleLearningSummary().then(summary => {
          if (summary) {
            setStyleSummary(summary);
          }
        });
      }
    });

    // Show opt-in prompt if not shown before (one-time on first launch)
    hasShownOptInPrompt().then(shown => {
      if (!shown) {
        setShowOptInPrompt(true);
      }
    });
  }, []);

  // Update style summary when style learning is activated
  useEffect(() => {
    if (styleLearningActive) {
      getStyleLearningSummary().then(summary => {
        if (summary) {
          setStyleSummary(summary);
        }
      });
    }
  }, [styleLearningActive]);

  // Waveform animation functions
  const startWaveformAnimation = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw waveform bars
      const barCount = 5;
      const barWidth = 3;
      const barSpacing = 4;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.fillStyle = ACCENT_HEX;

      for (let i = 0; i < barCount; i++) {
        const offset = (i - Math.floor(barCount / 2)) * (barWidth + barSpacing);
        const phase = Date.now() / 300 + i * 0.5;
        const amplitude = Math.sin(phase) * 0.5 + 0.5;
        const barHeight = 10 + amplitude * 20;

        ctx.fillRect(
          centerX + offset - barWidth / 2,
          centerY - barHeight / 2,
          barWidth,
          barHeight
        );
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, []);

  const stopWaveformAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, []);

  // Handle microphone button click
  const handleMicrophoneClick = useCallback(() => {
    if (!voiceService.current) return;

    if (isListening) {
      voiceService.current.stop();
      setIsListening(false);
      setVoiceTranscript('');
      stopWaveformAnimation();
    } else {
      voiceService.current.start();
      setIsListening(true);
      setVoiceError(null);
    }
  }, [isListening, stopWaveformAnimation]);

  // Handle voice output (speak director response)
  const handleSpeakResponse = useCallback((text: string) => {
    if (!voiceOutputActive || !voiceOutputSupported) return;

    // Stop any current speech (auto-interrupt)
    stopSpeech();

    speakText(
      text,
      {
        voice: selectedVoice,
        rate: speechRate,
        pitch: 1.0,
        volume: 1.0,
      },
      {
        onStart: () => setIsSpeakingNow(true),
        onEnd: () => setIsSpeakingNow(false),
        onError: (error) => {
          console.error('TTS error:', error);
          setIsSpeakingNow(false);
          // Silent fallback - text is still visible in chat
        },
      }
    );
  }, [voiceOutputActive, voiceOutputSupported, selectedVoice, speechRate]);

  // Handle voice output toggle
  const handleToggleVoiceOutput = useCallback(() => {
    const newValue = !voiceOutputActive;
    setVoiceOutputActive(newValue);
    setVoiceOutputEnabled(newValue);

    // Stop any current speech when disabling
    if (!newValue) {
      stopSpeech();
      setIsSpeakingNow(false);
    }
  }, [voiceOutputActive]);

  // Handle voice selection change
  const handleVoiceChange = useCallback((voiceId: string) => {
    const voice = availableVoices.find(v => v.name === voiceId) || null;
    setSelectedVoice(voice);
    if (voice) {
      setSavedVoiceId(voice.name);
    }
  }, [availableVoices]);

  // Handle speech rate change
  const handleRateChange = useCallback((rate: number) => {
    // Validate speech rate to prevent non-finite values
    const validRate = isFinite(rate) && rate >= 0.5 && rate <= 2.0 ? rate : 1.0;
    setSpeechRate(validRate);
    setSavedSpeechRate(validRate);
  }, []);

  // Handle pause/resume speech
  const handleTogglePauseSpeech = useCallback(() => {
    if (isSpeechPaused()) {
      resumeSpeech();
    } else if (isSpeaking()) {
      pauseSpeech();
    }
  }, []);

  // Handle stop speech
  const handleStopSpeech = useCallback(() => {
    stopSpeech();
    setIsSpeakingNow(false);
  }, []);

  // Handle style learning opt-in (Epic 1, Story 1.3 - AC6: Privacy Controls)
  const handleEnableStyleLearning = useCallback(() => {
    setStyleLearningEnabled(true);
    setStyleLearningActive(true);
    setOptInPromptShown();
    setShowOptInPrompt(false);

    // Initialize summary
    getStyleLearningSummary().then(summary => {
      if (summary) {
        setStyleSummary(summary);
      }
    });
  }, []);

  const handleDeclineStyleLearning = useCallback(() => {
    setStyleLearningEnabled(false);
    setStyleLearningActive(false);
    setOptInPromptShown();
    setShowOptInPrompt(false);
  }, []);

  // Handle dismissing continuity issues (Story 1.4, AC4)
  const handleDismissIssue = useCallback((issueId: string, reason?: string) => {
    dismissWarning(issueId, reason);
    // Remove from local state
    setContinuityIssues(prev => prev.filter(issue => issue.id !== issueId));
    // Update messages to remove the dismissed issue
    setMessages(prev => prev.map(msg => {
      if (msg.continuityIssues) {
        return {
          ...msg,
          continuityIssues: msg.continuityIssues.filter(issue => issue.id !== issueId)
        };
      }
      return msg;
    }));
  }, []);

  const parseCommand = (input: string) => {
    const lowerInput = input.toLowerCase();

    // Check for continuity checking commands (Story 1.4)
    if (lowerInput.match(/check\s+continuity|continuity\s+check|analyze\s+continuity/i)) {
      return { type: 'continuity', subType: 'check' };
    }
    if (lowerInput.match(/show\s+continuity\s+report|continuity\s+report|report\s+continuity/i)) {
      return { type: 'continuity', subType: 'report' };
    }

    // Check for generate command
    const generateMatch = lowerInput.match(/generate\s+(\d+)\s+(flux|imagen|kontext|max|multi)?\s*(?:images?|photos?)?\s*(?:of|for)?\s*(.+?)(?:\s+(\d+):(\d+))?$/i);
    if (generateMatch) {
      const count = parseInt(generateMatch[1], 10);
      const model = generateMatch[2] || 'flux';
      const subject = generateMatch[3].trim();
      const aspectRatio = generateMatch[4] && generateMatch[5] ? `${generateMatch[4]}:${generateMatch[5]}` : '16:9';
      return { type: 'generate', count, model, subject, aspectRatio };
    }

    // Check for upscale command
    const upscaleMatch = lowerInput.match(/upscale\s+(?:the\s+)?(.+?)(?:\s+image)?$/i);
    if (upscaleMatch) {
      const subject = upscaleMatch[1].trim();
      return { type: 'upscale', subject };
    }

    // Check for lens recommendation command
    const lensMatch = lowerInput.match(/recommend\s+lens\s+(?:for\s+)?(.+)/i);
    if (lensMatch) {
      return { type: 'technical', subType: 'lens', query: lensMatch[1].trim() };
    }

    // Check for lighting setup command
    const lightingMatch = lowerInput.match(/(?:setup|suggest)\s+lighting\s+(?:for\s+)?(.+)/i);
    if (lightingMatch) {
      return { type: 'technical', subType: 'lighting', query: lightingMatch[1].trim() };
    }

    // Check for DOF calculation command
    const dofMatch = lowerInput.match(/calculate\s+(?:dof|depth\s+of\s+field)\s+(?:for\s+)?f\/?([\d.]+)\s+(?:at\s+)?([\d.]+)m?\s+(?:with\s+)?([\d]+)mm/i);
    if (dofMatch) {
      const fStop = parseFloat(dofMatch[1]);
      const distance = parseFloat(dofMatch[2]);
      const focalLength = parseInt(dofMatch[3], 10);
      return { type: 'technical', subType: 'dof', fStop, distance, focalLength };
    }

    // Check for camera movement suggestion
    const movementMatch = lowerInput.match(/suggest\s+(?:camera\s+)?movement\s+(?:for\s+)?(.+)/i);
    if (movementMatch) {
      return { type: 'technical', subType: 'movement', query: movementMatch[1].trim() };
    }

    // Check for color grading command
    const colorMatch = lowerInput.match(/color\s+grade\s+(?:for\s+)?(.+)/i);
    if (colorMatch) {
      return { type: 'technical', subType: 'color', query: colorMatch[1].trim() };
    }

    return null;
  };

  const executeCommand = useCallback(async (command: any, conversationHistory: Message[], rawInput: string) => {
    const analysisContext = scriptAnalysis ?? DEFAULT_SCRIPT_ANALYSIS;

    try {
      // Handle continuity commands (Story 1.4)
      if (command.type === 'continuity') {
        if (!timelineClips || timelineClips.length < 2) {
          return {
            success: false,
            message: 'No timeline clips available for continuity analysis. Add at least 2 clips to your timeline first.'
          };
        }

        if (command.subType === 'check') {
          // Run continuity analysis
          const issues = await analyzeContinuity(timelineClips, analysisContext, (progress) => {
            // Progress callback - could show progress in UI in future
            console.log(`Continuity analysis progress: ${progress}%`);
          });

          setContinuityIssues(issues);
          setLastContinuityCheck(Date.now());

          if (issues.length === 0) {
            return {
              success: true,
              message: '✅ **Continuity Check Complete**\n\nNo continuity issues detected! Your timeline looks great.',
              continuityIssues: []
            };
          }

          const criticalCount = issues.filter(i => i.severity === 'critical').length;
          const warningCount = issues.filter(i => i.severity === 'warning').length;
          const infoCount = issues.filter(i => i.severity === 'info').length;

          return {
            success: true,
            message: `**Continuity Check Complete**\n\nFound ${issues.length} continuity issue${issues.length > 1 ? 's' : ''}:\n• 🔴 ${criticalCount} critical\n• 🟡 ${warningCount} warning${warningCount > 1 ? 's' : ''}\n• 🔵 ${infoCount} info\n\nSee details below. You can dismiss issues or use suggested fixes.`,
            continuityIssues: issues
          };
        }

        if (command.subType === 'report') {
          if (continuityIssues.length === 0 && !lastContinuityCheck) {
            return {
              success: false,
              message: 'No continuity analysis has been run yet. Use "check continuity" first.'
            };
          }

          const report = generateContinuityReport(continuityIssues);
          return {
            success: true,
            message: report
          };
        }
      }

      // Handle new technical commands
      if (command.type === 'technical') {
        const { askTheDirector } = await import('../services/aiService');
        let query = '';

        switch (command.subType) {
          case 'lens':
            query = `The user asked: "${rawInput}". Recommend the best lens focal length for ${command.query}. Include specific mm values and explain the creative impact in concise language.`;
            break;
          case 'lighting':
            query = `The user asked: "${rawInput}". Provide a lighting setup for ${command.query}. Include key/fill ratio, light placement, and color temperature in Kelvin.`;
            break;
          case 'dof':
            const { calculateDepthOfField } = await import('../services/directorKnowledge');
            const dofResult = calculateDepthOfField(command.focalLength, command.fStop, command.distance);
            return {
              success: true,
              message: `**Depth of Field Calculation:**\n• Focal Length: ${command.focalLength}mm\n• Aperture: f/${command.fStop}\n• Focus Distance: ${command.distance}m\n\n**Results:**\n• Near Focus: ${dofResult.near.toFixed(2)}m\n• Far Focus: ${dofResult.far === Infinity ? 'Infinity' : dofResult.far.toFixed(2) + 'm'}\n• Total DOF: ${dofResult.total === Infinity ? 'Infinity' : dofResult.total.toFixed(2) + 'm'}\n• Hyperfocal Distance: ${dofResult.hyperfocal.toFixed(2)}m\n\n*Tip: At f/${command.fStop}, everything from ${dofResult.near.toFixed(2)}m to ${dofResult.far === Infinity ? 'infinity' : dofResult.far.toFixed(2) + 'm'} will be in acceptable focus.*`
            };
          case 'movement':
            query = `The user asked: "${rawInput}". Suggest a camera movement approach for ${command.query}. Include specific equipment and typical movement speed.`;
            break;
          case 'color':
            query = `The user asked: "${rawInput}". Recommend a color grading approach for ${command.query}. Include color temperature, LUT direction, and tint adjustments.`;
            break;
        }

        if (query) {
          const response = await askTheDirector(analysisContext, query, conversationHistory);
          return {
            success: true,
            message: response
          };
        }
      }

      if (!scriptAnalysis) {
        return {
          success: false,
          message: 'Load or analyze a project to run director image commands.'
        };
      }

      if (command.type === 'generate') {
        const resolvedModel = resolveGenerationModel(command.model);
        // Find matching character or location
        const character = scriptAnalysis.characters.find(c =>
          c.name.toLowerCase().includes(command.subject.toLowerCase()) ||
          command.subject.toLowerCase().includes(c.name.toLowerCase())
        );

        const location = scriptAnalysis.locations.find(l =>
          l.name.toLowerCase().includes(command.subject.toLowerCase()) ||
          command.subject.toLowerCase().includes(l.name.toLowerCase())
        );

        if (character) {
          // Generate character images
          const prompt = `Cinematic film still for a fictional movie (SFW): ${character.description}`;
          const { urls, errors } = await generateStillVariants(
            `director_char_${character.name}`,
            resolvedModel,
            prompt,
            [],
            [],
            command.aspectRatio,
            command.count,
            scriptAnalysis.moodboard || null,
            scriptAnalysis.moodboardTemplates || [],
            [character.name],
            '',
            () => {}
          );

          if (urls.length > 0) {
            const newGenerations = buildGenerationEntries(urls, errors, command.aspectRatio);

            setScriptAnalysis(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                characters: prev.characters.map(c => {
                  if (c.name !== character.name) return c;
                  const existingGenerations = c.generations || [];
                  return {
                    ...c,
                    imageUrl: urls[0] ?? c.imageUrl ?? null,
                    generations: [...existingGenerations, ...newGenerations],
                  };
                })
              };
            });

            // Track pattern for style learning (AC1: Creative Pattern Tracking)
            if (styleLearningActive) {
              // Extract shot type from character description or prompt if present
              const description = character.description.toLowerCase();
              let shotType: string | undefined;
              if (description.includes('close-up') || description.includes('close up')) shotType = 'close-up';
              else if (description.includes('medium shot') || description.includes('mid shot')) shotType = 'medium-shot';
              else if (description.includes('wide shot') || description.includes('establishing')) shotType = 'wide-shot';

              if (shotType) {
                trackPattern('shotType', shotType).catch(err =>
                  console.warn('Failed to track shot type pattern:', err)
                );
              }
            }

            return {
              success: true,
              message: `Generated ${urls.length} image${urls.length > 1 ? 's' : ''} for ${character.name}`,
              images: urls
            };
          } else {
            return {
              success: false,
              message: `Failed to generate images for ${character.name}: ${errors.join(', ')}`
            };
          }
        } else if (location) {
          // Generate location images
          const prompt = `Cinematic film still for a fictional movie (SFW): ${location.description}`;
          const { urls, errors } = await generateStillVariants(
            `director_loc_${location.name}`,
            resolvedModel,
            prompt,
            [],
            [],
            command.aspectRatio,
            command.count,
            scriptAnalysis.moodboard || null,
            scriptAnalysis.moodboardTemplates || [],
            [],
            location.name,
            () => {}
          );

          if (urls.length > 0) {
            const newGenerations = buildGenerationEntries(urls, errors, command.aspectRatio);

            setScriptAnalysis(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                locations: prev.locations.map(l => {
                  if (l.name !== location.name) return l;
                  const existingGenerations = l.generations || [];
                  return {
                    ...l,
                    imageUrl: urls[0] ?? l.imageUrl ?? null,
                    generations: [...existingGenerations, ...newGenerations],
                  };
                })
              };
            });

            return {
              success: true,
              message: `Generated ${urls.length} image${urls.length > 1 ? 's' : ''} for ${location.name}`,
              images: urls
            };
          } else {
            return {
              success: false,
              message: `Failed to generate images for ${location.name}: ${errors.join(', ')}`
            };
          }
        } else {
          return {
            success: false,
            message: `Could not find character or location matching "${command.subject}"`
          };
        }
      } else if (command.type === 'upscale') {
        // Find matching character or location with an existing image
        const character = scriptAnalysis.characters.find(c =>
          (c.name.toLowerCase().includes(command.subject.toLowerCase()) ||
          command.subject.toLowerCase().includes(c.name.toLowerCase())) &&
          c.imageUrl
        );

        const location = scriptAnalysis.locations.find(l =>
          (l.name.toLowerCase().includes(command.subject.toLowerCase()) ||
          command.subject.toLowerCase().includes(l.name.toLowerCase())) &&
          l.imageUrl
        );

        if (character && character.imageUrl) {
          const { image_url: upscaledUrl } = await upscaleImage(character.imageUrl, () => {});

          setScriptAnalysis(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              characters: prev.characters.map(c =>
                c.name === character.name
                  ? { ...c, upscaledImageUrl: upscaledUrl }
                  : c
              )
            };
          });

          return {
            success: true,
            message: `Successfully upscaled image for ${character.name}`,
            images: [upscaledUrl]
          };
        } else if (location && location.imageUrl) {
          const { image_url: upscaledUrl } = await upscaleImage(location.imageUrl, () => {});

          setScriptAnalysis(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              locations: prev.locations.map(l =>
                l.name === location.name
                  ? { ...l, upscaledImageUrl: upscaledUrl }
                  : l
              )
            };
          });

          return {
            success: true,
            message: `Successfully upscaled image for ${location.name}`,
            images: [upscaledUrl]
          };
        } else {
          return {
            success: false,
            message: `Could not find "${command.subject}" with an existing image to upscale`
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    return null;
  }, [scriptAnalysis, setScriptAnalysis, timelineClips, continuityIssues, lastContinuityCheck, styleLearningActive]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isLoading) return;

    const requestId = Date.now();
    activeRequestIdRef.current = requestId;

    const lowerInput = trimmedInput.toLowerCase();
    const promptRequest = lowerInput.includes('prompt');

    const nextMessages = [...messages, { author: 'user' as Author, text: trimmedInput }];
    setMessages(nextMessages);
    setUserInput('');
    setPromptModal(null);
    setIsLoading(true);

    try {
      const command = parseCommand(trimmedInput);

      if (command) {
        const result = await executeCommand(command, nextMessages, trimmedInput);
        if (activeRequestIdRef.current !== requestId) return;
        if (result) {
          const directorMessage = result.message;
          setMessages([
            ...nextMessages,
            {
              author: 'director',
              text: directorMessage,
              isCommand: true,
              images: result.images,
              continuityIssues: result.continuityIssues // Add continuity issues to message
            }
          ]);
          // Speak the response if voice output is enabled
          handleSpeakResponse(directorMessage);
        } else {
          if (activeRequestIdRef.current !== requestId) return;
          const errorMessage = "Sorry, I couldn't execute that command. Please check your syntax.";
          setMessages([
            ...nextMessages,
            {
              author: 'director',
              text: errorMessage,
              isCommand: true
            }
          ]);
          // Speak the error message if voice output is enabled
          handleSpeakResponse(errorMessage);
        }
      } else {
        let reply = await askTheDirector(analysisForChat, trimmedInput, nextMessages);
        if (activeRequestIdRef.current !== requestId) return;

        // Inject style-adapted suggestions (AC3: Style-Adapted Suggestions)
        if (styleLearningActive) {
          try {
            const styleSuggestion = await getStyleSuggestion({
              sceneEmotion: trimmedInput.toLowerCase().includes('emotion') ? trimmedInput : undefined,
              shotType: trimmedInput.toLowerCase().includes('shot') ? trimmedInput : undefined,
              lighting: trimmedInput.toLowerCase().includes('light') ? trimmedInput : undefined,
            });

            if (styleSuggestion) {
              reply += `\n\n---\n\n**Your Style Preferences:**\n${styleSuggestion}`;
            }
          } catch (err) {
            console.warn('Failed to get style suggestion:', err);
          }
        }

        if (promptRequest) {
          const preparedPrompt = reply.trim();
          setPromptModal(preparedPrompt);
          const promptReadyMessage = "Sure—your prompt is ready. Tap the popup to copy it to your clipboard.";
          setMessages([
            ...nextMessages,
            {
              author: 'director',
              text: promptReadyMessage,
              promptData: preparedPrompt // Store the prompt in the message
            }
          ]);
          // Speak the prompt ready message if voice output is enabled
          handleSpeakResponse(promptReadyMessage);
        } else {
          setMessages([...nextMessages, { author: 'director', text: reply }]);
          // Speak the response if voice output is enabled
          handleSpeakResponse(reply);
        }
      }
    } catch (error) {
      if (activeRequestIdRef.current !== requestId) return;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const fullErrorMessage = `Sorry, I encountered an error: ${errorMessage}`;
      setMessages([
        ...nextMessages,
        {
          author: 'director',
          text: fullErrorMessage,
        },
      ]);
      // Speak the error message if voice output is enabled
      handleSpeakResponse(fullErrorMessage);
    } finally {
      if (activeRequestIdRef.current === requestId) {
        activeRequestIdRef.current = null;
        setIsLoading(false);
      }
    }
  };
  const widgetLabel = 'AI Director';

  return (
    <>
      {/* Fixed position container for the chat widget */}
      <div className="fixed bottom-6 right-6 z-[60] pointer-events-none">
        <div className="pointer-events-auto">
          {isOpen ? (
            <div className="relative w-[440px] max-h-[calc(100vh-8rem)] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#14171f] to-[#0d0f16] shadow-[0_50px_100px_rgba(3,7,18,0.9),0_0_80px_rgba(223,236,45,0.15)] backdrop-blur-2xl before:absolute before:inset-0 before:rounded-3xl before:p-[1px] before:bg-gradient-to-b before:from-[rgba(223,236,45,0.2)] before:via-transparent before:to-transparent before:-z-10">
              {/* Header */}
              <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-[rgba(223,236,45,0.08)] to-transparent px-6 py-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(223,236,45,0.25)] to-[rgba(223,236,45,0.1)] shadow-[0_0_20px_rgba(223,236,45,0.3)] ${isSpeakingNow ? 'animate-pulse' : ''}`}
                    style={{ color: ACCENT_HEX }}
                  >
                    <BrainIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white truncate">AI Director Assistant</h3>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 truncate">
                      {isSpeakingNow ? '🔊 Speaking...' : 'Creative Partner'}
                    </p>
                    {/* Style Learning Badge (AC4: Style Learning Indicator) */}
                    {styleLearningActive && styleSummary && styleSummary.shotsTracked > 0 && (
                      <p className="text-[9px] text-[#dfec2d] truncate mt-0.5">
                        💡 Learning your style: {styleSummary.shotsTracked} shots tracked
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Voice output toggle button */}
                  {voiceOutputSupported && (
                    <button
                      type="button"
                      onClick={handleToggleVoiceOutput}
                      className={`rounded-full border ${voiceOutputActive ? 'border-[rgba(223,236,45,0.5)] bg-[rgba(223,236,45,0.15)]' : 'border-white/10 bg-white/5'} p-2 text-white/70 transition-all hover:bg-white/10 hover:text-white hover:scale-105`}
                      title={voiceOutputActive ? 'Voice output enabled' : 'Voice output disabled'}
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    </button>
                  )}
                  {/* Voice settings button */}
                  {voiceOutputSupported && (
                    <button
                      type="button"
                      onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                      className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition-all hover:bg-white/10 hover:text-white hover:scale-105"
                      title="Voice settings"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={resetConversation}
                    disabled={!canResetChat}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70 transition-all hover:bg-white/12 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    New Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsOpen(false); setPromptModal(null); }}
                    className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition-all hover:bg-white/10 hover:text-white hover:scale-105"
                    aria-label="Close director assistant"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </header>

              {/* Voice Settings Panel */}
              {showVoiceSettings && voiceOutputSupported && (
                <div className="border-b border-white/10 bg-gradient-to-r from-[rgba(223,236,45,0.05)] to-transparent px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider">Voice Output Settings</h4>
                    <button
                      type="button"
                      onClick={() => setShowVoiceSettings(false)}
                      className="shrink-0 rounded-full border border-white/10 bg-white/5 p-1.5 text-white/70 transition-all hover:bg-white/10 hover:text-white hover:scale-105"
                      aria-label="Close voice settings"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Voice Selection */}
                  <div className="space-y-2">
                    <label className="text-xs text-white/70">Voice</label>
                    <select
                      value={selectedVoice?.name || ''}
                      onChange={(e) => handleVoiceChange(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#13161d] px-3 py-2 text-sm text-white/90 outline-none focus:border-[rgba(223,236,45,0.5)] focus:ring-2 focus:ring-[rgba(223,236,45,0.2)]"
                    >
                      {availableVoices.map(voice => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speech Rate */}
                  <div className="space-y-2">
                    <label className="text-xs text-white/70 flex items-center justify-between">
                      <span>Speech Rate</span>
                      <span className="text-[rgba(223,236,45,0.9)]">{speechRate.toFixed(1)}x</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speechRate}
                      onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                      className="w-full accent-[#dfec2d]"
                    />
                    <div className="flex justify-between text-[10px] text-white/40">
                      <span>0.5x (Slow)</span>
                      <span>1.0x (Normal)</span>
                      <span>2.0x (Fast)</span>
                    </div>
                  </div>

                  {/* Preview Button */}
                  <button
                    type="button"
                    onClick={() => speakText('This is a preview of the voice output settings.', { voice: selectedVoice, rate: speechRate, pitch: 1.0, volume: 1.0 }, { onStart: () => setIsSpeakingNow(true), onEnd: () => setIsSpeakingNow(false) })}
                    className="w-full rounded-lg border border-[rgba(223,236,45,0.3)] bg-[rgba(223,236,45,0.1)] px-4 py-2 text-sm font-medium text-gray-900 transition-all hover:bg-[rgba(223,236,45,0.2)] hover:shadow-[0_0_15px_rgba(223,236,45,0.2)]"
                  >
                    Preview Voice
                  </button>
                </div>
              )}

              {/* Playback Controls (when speaking) */}
              {isSpeakingNow && (
                <div className="border-b border-white/10 bg-gradient-to-r from-[rgba(223,236,45,0.1)] to-transparent px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#dfec2d] animate-pulse" />
                    <span className="text-xs text-white/70">Director is speaking...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTogglePauseSpeech}
                      className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/70 transition-all hover:bg-white/10 hover:text-white"
                      title={isSpeechPaused() ? 'Resume' : 'Pause'}
                    >
                      {isSpeechPaused() ? (
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      ) : (
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleStopSpeech}
                      className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/70 transition-all hover:bg-white/10 hover:text-white"
                      title="Stop"
                    >
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 6h12v12H6z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {!hasProjectContext && (
                <div className="border-b border-white/10 bg-white/5 px-6 py-3 text-xs text-white/70">
                  Analyze a script or load a project to give me full context. I can still help you craft prompts, lenses, and lighting setups right away.
                </div>
              )}

              {/* Messages Area */}
              <div className="flex h-[520px] flex-col">
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.author}-${index}`}
                      className={`flex gap-3 ${message.author === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.author === 'director' && (
                        <span
                          className="mt-1 shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(223,236,45,0.2)] to-[rgba(223,236,45,0.05)] shadow-inner"
                          style={{ color: ACCENT_HEX }}
                        >
                          <BrainIcon className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg ${
                          message.author === 'user'
                            ? 'rounded-br-sm bg-gradient-to-r from-[#1ad8b1] to-[#0ea887] text-white shadow-[0_4px_20px_rgba(26,216,177,0.3)]'
                            : message.isCommand
                              ? 'rounded-bl-sm bg-gradient-to-r from-[#1f2530] to-[#191e28] text-white/90 border border-[rgba(223,236,45,0.2)]'
                              : 'rounded-bl-sm bg-[#1a1f29] text-white/85'
                        }`}
                      >
                        <span className="whitespace-pre-wrap break-words">{message.text}</span>
                        {message.images && message.images.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {message.images.slice(0, 4).map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Generated ${idx + 1}`}
                                className="w-full h-24 object-cover rounded-lg hover:opacity-90 transition cursor-pointer border border-white/10"
                                onClick={() => window.open(img, '_blank')}
                              />
                            ))}
                          </div>
                        )}
                        {message.promptData && (
                          <button
                            onClick={() => setPromptModal(message.promptData!)}
                            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#dfec2d]/30 bg-[#dfec2d]/10 px-4 py-2 text-xs font-medium text-[#dfec2d] transition-all hover:border-[#dfec2d]/50 hover:bg-[#dfec2d]/20 hover:text-[#dfec2d] hover:shadow-[0_0_15px_rgba(223,236,45,0.2)]"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Prompt
                          </button>
                        )}
                        {/* Continuity Issues (Story 1.4) */}
                        {message.continuityIssues && message.continuityIssues.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.continuityIssues.map((issue) => (
                              <div
                                key={issue.id}
                                className={`rounded-lg border px-3 py-2 text-xs ${
                                  issue.severity === 'critical'
                                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                    : issue.severity === 'warning'
                                      ? 'border-#dfec2d/30 bg-#dfec2d/10 text-lime-300'
                                      : 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">
                                        {issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵'}
                                      </span>
                                      <span className="font-semibold">
                                        {issue.type === 'lighting-jump' ? 'Lighting Jump' : issue.type === 'costume-change' ? 'Costume Change' : 'Spatial Mismatch'}
                                      </span>
                                    </div>
                                    <p className="text-white/80">{issue.description}</p>
                                    <p className="text-white/60 italic">💡 {issue.suggestedFix}</p>
                                    <p className="text-[10px] text-white/40">
                                      Between: Scene {issue.clip1.sceneNumber || issue.clip1.shot_number || 'N/A'} → Scene {issue.clip2.sceneNumber || issue.clip2.shot_number || 'N/A'}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleDismissIssue(issue.id)}
                                    className="shrink-0 rounded-md border border-white/20 bg-white/5 px-2 py-1 text-[10px] text-white/70 transition-all hover:bg-white/10 hover:text-white"
                                    title="Dismiss this warning"
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-3 text-sm text-white/70">
                      <span
                        className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(223,236,45,0.2)] to-[rgba(223,236,45,0.05)]"
                        style={{ color: ACCENT_HEX }}
                      >
                        <BrainIcon className="h-3.5 w-3.5 animate-pulse" />
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/50" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/50" style={{ animationDelay: '100ms' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/50" style={{ animationDelay: '200ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="shrink-0 border-t border-white/10 bg-gradient-to-b from-[#0f1117] to-[#0a0d12] px-6 py-4 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
                  {/* Voice listening indicator */}
                  {isListening && (
                    <div className="mb-3 flex items-center gap-3 rounded-xl border border-[rgba(223,236,45,0.3)] bg-[rgba(223,236,45,0.1)] px-4 py-2.5">
                      <div className="relative flex items-center justify-center">
                        <canvas
                          ref={canvasRef}
                          width="40"
                          height="40"
                          className="absolute"
                        />
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[rgba(223,236,45,0.3)] to-[rgba(223,236,45,0.1)] animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-[#dfec2d]">Listening...</div>
                        <div className="text-[10px] text-white/50">
                          {voiceTranscript || 'Speak now...'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleMicrophoneClick}
                        className="text-xs text-white/70 hover:text-white transition-colors"
                      >
                        Stop
                      </button>
                    </div>
                  )}

                  {/* Voice error indicator */}
                  {voiceError && (
                    <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
                      {voiceError}
                    </div>
                  )}

                  <div className="relative flex items-end gap-3">
                    <div className="flex-1">
                      <textarea
                        value={userInput}
                        onChange={(event) => setUserInput(event.target.value)}
                        ref={textareaRef}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
                          }
                        }}
                        rows={1}
                        placeholder="Ask the director or type a command..."
                        className="w-full resize-none rounded-2xl border border-white/10 bg-gradient-to-b from-[#13161d] to-[#0e1015] px-4 py-3 text-sm text-white/90 outline-none transition-all placeholder:text-white/30 focus:border-[rgba(223,236,45,0.5)] focus:ring-2 focus:ring-[rgba(223,236,45,0.2)] focus:shadow-[0_0_20px_rgba(223,236,45,0.15)]"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Microphone button */}
                    {voiceSupported && (
                      <button
                        type="button"
                        onClick={handleMicrophoneClick}
                        disabled={isLoading}
                        className={`shrink-0 rounded-xl p-3 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                          isListening
                            ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-[0_4px_15px_rgba(239,68,68,0.4)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.5)]'
                            : 'border border-white/10 bg-gradient-to-b from-[#13161d] to-[#0e1015] hover:border-[rgba(223,236,45,0.3)] hover:bg-[rgba(223,236,45,0.05)]'
                        }`}
                        title={isListening ? 'Stop listening' : 'Start voice input'}
                      >
                        <svg
                          className="h-4 w-4 text-white/90"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                      </button>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isLoading || !userInput.trim()}
                      className="shrink-0 !rounded-xl !px-4 !py-3 !bg-gradient-to-r !from-[#dfec2d] !to-[#c4d319] !text-black hover:!from-[#e8f03f] hover:!to-[#dfec2d] shadow-[0_4px_15px_rgba(223,236,45,0.3)] hover:shadow-[0_6px_20px_rgba(223,236,45,0.4)] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <SendIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Command hints */}
                  <div className="mt-2.5 space-y-1 text-[10px] text-white/30 leading-relaxed">
                    <div className="flex flex-wrap gap-x-2 items-center">
                      <span className="shrink-0">💡</span>
                      <span>"What lens would work best for an emotional close-up?" • "How should I light this scene?"</span>
                    </div>
                    <div className="flex flex-wrap gap-x-2 items-center">
                      <span className="shrink-0">🎬</span>
                      <span>"Generate images of Elena" • "Check my timeline for continuity issues"</span>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsOpen(true)}
              variant="primary"
              className="group !rounded-full !px-6 !py-3.5 !text-black shadow-[0_20px_40px_rgba(223,236,45,0.35)] hover:shadow-[0_25px_50px_rgba(223,236,45,0.4)] transition-all hover:scale-105"
            >
              <BrainIcon className="h-5 w-5 transition group-hover:scale-110 group-hover:rotate-12" />
              <span className="font-semibold text-base">{widgetLabel}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Prompt Modal - Separate from widget, higher z-index */}
      {promptModal && (
        <PromptModal prompt={promptModal} onClose={() => setPromptModal(null)} />
      )}

      {/* Style Learning Opt-In Modal (AC6: Privacy Controls) */}
      {showOptInPrompt && (
        <StyleLearningOptIn
          onEnable={handleEnableStyleLearning}
          onDecline={handleDeclineStyleLearning}
        />
      )}
    </>
  );
};

export default DirectorWidget;
