import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ScriptAnalysis, Generation } from '../types';
import { askTheDirector, generateStillVariants, upscaleImage } from '../services/aiService';
import Button from './Button';
import PromptModal from './PromptModal';
import { BrainIcon, SendIcon, XIcon } from './icons/Icons';

type Author = 'user' | 'director';

interface Message {
  author: Author;
  text: string;
  isCommand?: boolean;
  images?: string[];
  promptData?: string; // Store the generated prompt for later viewing
}

interface DirectorWidgetProps {
  scriptAnalysis: ScriptAnalysis | null;
  setScriptAnalysis: (analysis: ScriptAnalysis | ((prev: ScriptAnalysis | null) => ScriptAnalysis | null)) => void;
}

const WELCOME_MESSAGE = 'Welcome. I am your Director of Photography with comprehensive cinematography expertise. I have reviewed the project materials.\n\nHow can I assist you with the creative direction?\n\n**Technical Commands Available:**\n• "Generate 3 flux images of [character/location] 16:9"\n• "Upscale the [character/location] image"\n• "Recommend lens for [shot type]"\n• "Setup lighting for [mood]"\n• "Calculate DOF for f/2.8 at 3m with 85mm"\n• "Suggest camera movement for [emotion]"\n• "Color grade for [genre/mood]"\n\nAsk me anything about lenses (8-800mm), lighting setups, camera movements, composition rules, or color grading. I provide specific technical parameters for professional cinematography.';
const ACCENT_HEX = '#10A37F';
const resolveGenerationModel = (model?: string): 'Imagen' | 'Gemini Nano Banana' | 'Flux' => {
  const normalized = (model ?? '').toLowerCase();
  if (normalized.includes('imagen')) return 'Imagen';
  if (normalized.includes('nano') || normalized.includes('banana') || normalized.includes('gemini') || normalized.includes('flash')) {
    return 'Gemini Nano Banana';
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


const DirectorWidget: React.FC<DirectorWidgetProps> = ({ scriptAnalysis, setScriptAnalysis }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ author: 'director', text: WELCOME_MESSAGE }]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [promptModal, setPromptModal] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeRequestIdRef = useRef<number | null>(null);

  const canChat = !!scriptAnalysis;
  const canResetChat = messages.some((message, index) => {
    if (index === 0) return message.author !== 'director' || message.text !== WELCOME_MESSAGE;
    return message.text.trim().length > 0;
  });

  const resetConversation = useCallback(() => {
    activeRequestIdRef.current = null;
    setIsLoading(false);
    setMessages([{ author: 'director', text: WELCOME_MESSAGE }]);
    setPromptModal(null);
    setUserInput('');
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [setMessages, setPromptModal, setUserInput, setIsLoading]);

  useEffect(() => {
    if (!canChat) {
      setMessages([{ author: 'director', text: WELCOME_MESSAGE }]);
      setIsOpen(false);
      setPromptModal(null);
      setUserInput('');
    }
  }, [canChat]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && canChat) {
      textareaRef.current?.focus();
    }
  }, [isOpen, canChat]);

  const parseCommand = (input: string) => {
    const lowerInput = input.toLowerCase();

    // Check for generate command
    const generateMatch = lowerInput.match(/generate\s+(\d+)\s+(flux|imagen)?\s*(?:images?|photos?)?\s*(?:of|for)?\s*(.+?)(?:\s+(\d+):(\d+))?$/i);
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
    if (!scriptAnalysis) return null;

    try {
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
          const response = await askTheDirector(scriptAnalysis, query, conversationHistory);
          return {
            success: true,
            message: response
          };
        }
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
  }, [scriptAnalysis, setScriptAnalysis]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || !canChat || isLoading) return;

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
          setMessages([
            ...nextMessages,
            {
              author: 'director',
              text: result.message,
              isCommand: true,
              images: result.images
            }
          ]);
        } else {
          if (activeRequestIdRef.current !== requestId) return;
          setMessages([
            ...nextMessages,
            {
              author: 'director',
              text: "Sorry, I couldn't execute that command. Please check your syntax.",
              isCommand: true
            }
          ]);
        }
      } else {
        const reply = await askTheDirector(scriptAnalysis!, trimmedInput, nextMessages);
        if (activeRequestIdRef.current !== requestId) return;
        if (promptRequest) {
          const preparedPrompt = reply.trim();
          setPromptModal(preparedPrompt);
          setMessages([
            ...nextMessages,
            {
              author: 'director',
              text: "Sure—your prompt is ready. Tap the popup to copy it to your clipboard.",
              promptData: preparedPrompt // Store the prompt in the message
            }
          ]);
        } else {
          setMessages([...nextMessages, { author: 'director', text: reply }]);
        }
      }
    } catch (error) {
      if (activeRequestIdRef.current !== requestId) return;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessages([
        ...nextMessages,
        {
          author: 'director',
          text: `Sorry, I encountered an error: ${errorMessage}`,
        },
      ]);
    } finally {
      if (activeRequestIdRef.current === requestId) {
        activeRequestIdRef.current = null;
        setIsLoading(false);
      }
    }
  };
  const widgetLabel = useMemo(() => (canChat ? 'AI Director' : 'Analyze script first'), [canChat]);

  return (
    <>
      {/* Fixed position container for the chat widget */}
      <div className="fixed bottom-6 right-6 z-40 pointer-events-none">
        <div className="pointer-events-auto">
          {isOpen && canChat ? (
            <div className="relative w-[440px] max-h-[calc(100vh-8rem)] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#14171f] to-[#0d0f16] shadow-[0_50px_100px_rgba(3,7,18,0.9),0_0_80px_rgba(16,163,127,0.15)] backdrop-blur-2xl before:absolute before:inset-0 before:rounded-3xl before:p-[1px] before:bg-gradient-to-b before:from-[rgba(16,163,127,0.2)] before:via-transparent before:to-transparent before:-z-10">
              {/* Header */}
              <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-[rgba(16,163,127,0.08)] to-transparent px-6 py-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(16,163,127,0.25)] to-[rgba(16,163,127,0.1)] shadow-[0_0_20px_rgba(16,163,127,0.3)]"
                    style={{ color: ACCENT_HEX }}
                  >
                    <BrainIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white truncate">AI Director Assistant</h3>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 truncate">Creative Partner</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                          className="mt-1 shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(16,163,127,0.2)] to-[rgba(16,163,127,0.05)] shadow-inner"
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
                              ? 'rounded-bl-sm bg-gradient-to-r from-[#1f2530] to-[#191e28] text-white/90 border border-[rgba(16,163,127,0.2)]'
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
                            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-teal-400/30 bg-teal-500/10 px-4 py-2 text-xs font-medium text-teal-300 transition-all hover:border-teal-400/50 hover:bg-teal-500/20 hover:text-teal-200 hover:shadow-[0_0_15px_rgba(45,212,191,0.2)]"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Prompt
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-3 text-sm text-white/70">
                      <span
                        className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(16,163,127,0.2)] to-[rgba(16,163,127,0.05)]"
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
                        className="w-full resize-none rounded-2xl border border-white/10 bg-gradient-to-b from-[#13161d] to-[#0e1015] px-4 py-3 text-sm text-white/90 outline-none transition-all placeholder:text-white/30 focus:border-[rgba(16,163,127,0.5)] focus:ring-2 focus:ring-[rgba(16,163,127,0.2)] focus:shadow-[0_0_20px_rgba(16,163,127,0.15)]"
                        disabled={!canChat || isLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!canChat || isLoading || !userInput.trim()}
                      className="shrink-0 !rounded-xl !px-4 !py-3 !bg-gradient-to-r !from-[#10A37F] !to-[#0d8a68] hover:!from-[#12b88d] hover:!to-[#0f9673] shadow-[0_4px_15px_rgba(16,163,127,0.3)] hover:shadow-[0_6px_20px_rgba(16,163,127,0.4)] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <SendIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Command hints */}
                  <div className="mt-2.5 space-y-1 text-[10px] text-white/30 leading-relaxed">
                    <div className="flex flex-wrap gap-x-2 items-center">
                      <span className="shrink-0">💡</span>
                      <span>"Generate 3 flux images of Elena 16:9" • "Upscale the cafe image"</span>
                    </div>
                    <div className="flex flex-wrap gap-x-2 items-center">
                      <span className="shrink-0">🎬</span>
                      <span>"Recommend lens for close-up" • "Calculate DOF for f/2.8 at 3m with 85mm"</span>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => canChat && setIsOpen(true)}
              variant="primary"
              disabled={!canChat}
              className="group !rounded-full !px-6 !py-3.5 shadow-[0_20px_40px_rgba(16,163,127,0.35)] hover:shadow-[0_25px_50px_rgba(16,163,127,0.4)] transition-all hover:scale-105"
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
    </>
  );
};

export default DirectorWidget;
