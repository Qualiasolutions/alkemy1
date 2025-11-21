import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ScriptAnalysis, Generation } from '../types';
import { askTheDirector, generateStillVariants, upscaleImage } from '../services/aiService';
import { BrainIcon, SendIcon, ChevronDownIcon, ChevronUpIcon } from './icons/Icons';

type Author = 'user' | 'director';

interface Message {
  author: Author;
  text: string;
  isCommand?: boolean;
  images?: string[];
}

interface MiniDirectorWidgetProps {
  scriptAnalysis: ScriptAnalysis | null;
  setScriptAnalysis: (analysis: ScriptAnalysis | ((prev: ScriptAnalysis | null) => ScriptAnalysis | null)) => void;
}

const DEFAULT_SCRIPT_ANALYSIS: ScriptAnalysis = {
  title: 'Untitled Project',
  logline: 'No project has been analyzed yet.',
  summary: 'Start a project or analyze your script.',
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

const ACCENT_HEX = '#10A37F';

const resolveGenerationModel = (model?: string): 'Imagen' | 'Gemini Nano Banana' | 'FLUX.1.1' | 'FLUX.1 Kontext' | 'FLUX Ultra' => {
  const normalized = (model ?? '').toLowerCase();
  if (normalized.includes('imagen')) return 'Imagen';
  if (normalized.includes('nano') || normalized.includes('banana') || normalized.includes('gemini') || normalized.includes('flash')) {
    return 'Gemini Nano Banana';
  }
  if (normalized.includes('1.1') || normalized.includes('pro')) {
    return 'FLUX.1.1';
  }
  if (normalized.includes('kontext') || normalized.includes('context')) {
    return 'FLUX.1 Kontext';
  }
  if (normalized.includes('ultra')) {
    return 'FLUX Ultra';
  }
  return 'FLUX.1.1'; // Default to newest model
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

const MiniDirectorWidget: React.FC<MiniDirectorWidgetProps> = ({ scriptAnalysis, setScriptAnalysis }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const activeRequestIdRef = useRef<number | null>(null);

  const analysisForChat = scriptAnalysis ?? DEFAULT_SCRIPT_ANALYSIS;

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const parseCommand = (input: string) => {
    const lowerInput = input.toLowerCase();

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
      // Handle technical commands
      if (command.type === 'technical') {
        let query = '';

        switch (command.subType) {
          case 'lens':
            query = `Recommend the best lens focal length for ${command.query}. Include specific mm values.`;
            break;
          case 'lighting':
            query = `Provide a lighting setup for ${command.query}. Include key/fill ratio and color temperature.`;
            break;
          case 'dof':
            const { calculateDepthOfField } = await import('../services/directorKnowledge');
            const dofResult = calculateDepthOfField(command.focalLength, command.fStop, command.distance);
            return {
              success: true,
              message: `DOF: ${dofResult.near.toFixed(1)}m to ${dofResult.far === Infinity ? '∞' : dofResult.far.toFixed(1) + 'm'} (${command.focalLength}mm, f/${command.fStop}, ${command.distance}m)`
            };
          case 'movement':
            query = `Suggest a camera movement for ${command.query}. Include specific equipment.`;
            break;
          case 'color':
            query = `Recommend color grading for ${command.query}. Include color temperature.`;
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
          message: 'Load a project to run commands.'
        };
      }

      if (command.type === 'generate') {
        const resolvedModel = resolveGenerationModel(command.model);
        const character = scriptAnalysis.characters.find(c =>
          c.name.toLowerCase().includes(command.subject.toLowerCase()) ||
          command.subject.toLowerCase().includes(c.name.toLowerCase())
        );

        const location = scriptAnalysis.locations.find(l =>
          l.name.toLowerCase().includes(command.subject.toLowerCase()) ||
          command.subject.toLowerCase().includes(l.name.toLowerCase())
        );

        if (character) {
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
              message: `✓ Generated ${urls.length} image${urls.length > 1 ? 's' : ''} for ${character.name}`,
              images: urls
            };
          } else {
            return {
              success: false,
              message: `✗ Failed to generate for ${character.name}`
            };
          }
        } else if (location) {
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
              message: `✓ Generated ${urls.length} image${urls.length > 1 ? 's' : ''} for ${location.name}`,
              images: urls
            };
          } else {
            return {
              success: false,
              message: `✗ Failed to generate for ${location.name}`
            };
          }
        } else {
          return {
            success: false,
            message: `Could not find "${command.subject}"`
          };
        }
      } else if (command.type === 'upscale') {
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
            message: `✓ Upscaled ${character.name}`,
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
            message: `✓ Upscaled ${location.name}`,
            images: [upscaledUrl]
          };
        } else {
          return {
            success: false,
            message: `No image found for "${command.subject}"`
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    return null;
  }, [scriptAnalysis, setScriptAnalysis]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isLoading) return;

    const requestId = Date.now();
    activeRequestIdRef.current = requestId;

    const nextMessages = [...messages, { author: 'user' as Author, text: trimmedInput }];
    setMessages(nextMessages);
    setUserInput('');
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
              text: "Command not recognized.",
              isCommand: true
            }
          ]);
        }
      } else {
        const reply = await askTheDirector(analysisForChat, trimmedInput, nextMessages);
        if (activeRequestIdRef.current !== requestId) return;
        setMessages([...nextMessages, { author: 'director', text: reply }]);
      }
    } catch (error) {
      if (activeRequestIdRef.current !== requestId) return;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessages([
        ...nextMessages,
        {
          author: 'director',
          text: `Error: ${errorMessage}`,
        },
      ]);
    } finally {
      if (activeRequestIdRef.current === requestId) {
        activeRequestIdRef.current = null;
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="w-full rounded-xl border border-white/10 bg-gradient-to-b from-[#14171f]/90 to-[#0d0f16]/90 shadow-lg backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between gap-2 border-b border-white/10 bg-gradient-to-r from-[rgba(16,163,127,0.08)] to-transparent px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(16,163,127,0.25)] to-[rgba(16,163,127,0.1)] shadow-[0_0_15px_rgba(16,163,127,0.25)]"
            style={{ color: ACCENT_HEX }}
          >
            <BrainIcon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-semibold text-white truncate">AI Director</h3>
            <p className="text-[9px] uppercase tracking-wider text-white/40 truncate">Creative Assistant</p>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full p-1 text-white/60 transition-all hover:bg-white/10 hover:text-white"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex flex-col">
          {/* Messages */}
          {messages.length > 0 && (
            <div className="max-h-48 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.slice(-5).map((message, index) => (
                <div
                  key={`${message.author}-${index}`}
                  className={`flex gap-2 ${message.author === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.author === 'director' && (
                    <span
                      className="mt-0.5 shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(16,163,127,0.2)] to-[rgba(16,163,127,0.05)]"
                      style={{ color: ACCENT_HEX }}
                    >
                      <BrainIcon className="h-2.5 w-2.5" />
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
                      message.author === 'user'
                        ? 'rounded-br-sm bg-gradient-to-r from-[#1ad8b1] to-[#0ea887] text-white'
                        : message.isCommand
                          ? 'rounded-bl-sm bg-gradient-to-r from-[#1f2530] to-[#191e28] text-white/90 border border-[rgba(16,163,127,0.2)]'
                          : 'rounded-bl-sm bg-[#1a1f29] text-white/85'
                    }`}
                  >
                    <span className="whitespace-pre-wrap break-words">{message.text}</span>
                    {message.images && message.images.length > 0 && (
                      <div className="mt-1.5 grid grid-cols-2 gap-1">
                        {message.images.slice(0, 2).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Generated ${idx + 1}`}
                            className="w-full h-16 object-cover rounded hover:opacity-90 transition cursor-pointer border border-white/10"
                            onClick={() => window.open(img, '_blank')}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span
                    className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(16,163,127,0.2)] to-[rgba(16,163,127,0.05)]"
                    style={{ color: ACCENT_HEX }}
                  >
                    <BrainIcon className="h-2.5 w-2.5 animate-pulse" />
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50" style={{ animationDelay: '100ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50" style={{ animationDelay: '200ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-white/10 bg-gradient-to-b from-[#0f1117]/80 to-[#0a0d12]/80 px-3 py-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                ref={inputRef}
                placeholder="Ask director or command..."
                className="flex-1 rounded-lg border border-white/10 bg-gradient-to-b from-[#13161d] to-[#0e1015] px-3 py-2 text-xs text-white/90 outline-none transition-all placeholder:text-white/30 focus:border-[rgba(16,163,127,0.5)] focus:ring-1 focus:ring-[rgba(16,163,127,0.2)]"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !userInput.trim()}
                className="shrink-0 rounded-lg bg-gradient-to-r from-[#10A37F] to-[#0d8a68] p-2 text-white shadow-lg hover:from-[#12b88d] hover:to-[#0f9673] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <SendIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-1.5 text-[9px] text-white/25 leading-relaxed">
              💡 "Generate 3 flux images of [name] 16:9" • "Upscale [name]" • "Recommend lens for [shot]"
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MiniDirectorWidget;
