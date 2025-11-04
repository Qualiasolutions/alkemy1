import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ScriptAnalysis } from '../types';
import { askTheDirector, generateStillVariants, upscaleImage } from '../services/aiService';
import Button from './Button';
import { BrainIcon, SendIcon, XIcon } from './icons/Icons';

type Author = 'user' | 'director';

interface Message {
  author: Author;
  text: string;
  isCommand?: boolean;
  images?: string[];
}

interface DirectorWidgetProps {
  scriptAnalysis: ScriptAnalysis | null;
  setScriptAnalysis: (analysis: ScriptAnalysis | ((prev: ScriptAnalysis | null) => ScriptAnalysis | null)) => void;
}

const WELCOME_MESSAGE = 'Welcome. I have reviewed the project materials. How can I assist you with the creative direction?\n\nI can also execute commands like:\n• "Generate 3 flux images of [character/location] 16:9"\n• "Upscale the [character/location] image"';
const ACCENT_HEX = '#10A37F';

const DirectorWidget: React.FC<DirectorWidgetProps> = ({ scriptAnalysis, setScriptAnalysis }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ author: 'director', text: WELCOME_MESSAGE }]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canChat = !!scriptAnalysis;

  useEffect(() => {
    if (!canChat) {
      setMessages([{ author: 'director', text: WELCOME_MESSAGE }]);
      setIsOpen(false);
    }
  }, [canChat]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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

    return null;
  };

  const executeCommand = useCallback(async (command: any) => {
    if (!scriptAnalysis) return null;

    try {
      if (command.type === 'generate') {
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
            command.model === 'flux' ? 'black-forest-labs/FLUX.1' : 'black-forest-labs/FLUX.1',
            prompt,
            [],
            [],
            command.aspectRatio,
            command.count,
            scriptAnalysis.moodboard || null,
            [character.name],
            '',
            () => {}
          );

          if (urls.length > 0) {
            // Update character with new images
            setScriptAnalysis(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                characters: prev.characters.map(c =>
                  c.name === character.name
                    ? { ...c, image_url: urls[0], additionalImages: [...(c.additionalImages || []), ...urls.slice(1)] }
                    : c
                )
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
            command.model === 'flux' ? 'black-forest-labs/FLUX.1' : 'black-forest-labs/FLUX.1',
            prompt,
            [],
            [],
            command.aspectRatio,
            command.count,
            scriptAnalysis.moodboard || null,
            [],
            location.name,
            () => {}
          );

          if (urls.length > 0) {
            // Update location with new images
            setScriptAnalysis(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                locations: prev.locations.map(l =>
                  l.name === location.name
                    ? { ...l, image_url: urls[0], additionalImages: [...(l.additionalImages || []), ...urls.slice(1)] }
                    : l
                )
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
          c.image_url
        );

        const location = scriptAnalysis.locations.find(l =>
          (l.name.toLowerCase().includes(command.subject.toLowerCase()) ||
          command.subject.toLowerCase().includes(l.name.toLowerCase())) &&
          l.image_url
        );

        if (character && character.image_url) {
          const { image_url } = await upscaleImage(character.image_url, () => {});

          setScriptAnalysis(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              characters: prev.characters.map(c =>
                c.name === character.name
                  ? { ...c, upscaledImageUrl: image_url }
                  : c
              )
            };
          });

          return {
            success: true,
            message: `Successfully upscaled image for ${character.name}`,
            images: [image_url]
          };
        } else if (location && location.image_url) {
          const { image_url } = await upscaleImage(location.image_url, () => {});

          setScriptAnalysis(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              locations: prev.locations.map(l =>
                l.name === location.name
                  ? { ...l, upscaledImageUrl: image_url }
                  : l
              )
            };
          });

          return {
            success: true,
            message: `Successfully upscaled image for ${location.name}`,
            images: [image_url]
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

    const nextMessages = [...messages, { author: 'user' as Author, text: trimmedInput }];
    setMessages(nextMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      // Check if it's a command
      const command = parseCommand(trimmedInput);

      if (command) {
        // Execute the command
        const result = await executeCommand(command);
        if (result) {
          setMessages([...nextMessages, {
            author: 'director',
            text: result.message,
            isCommand: true,
            images: result.images
          }]);
        } else {
          setMessages([...nextMessages, {
            author: 'director',
            text: 'Sorry, I couldn\'t execute that command. Please check your syntax.',
            isCommand: true
          }]);
        }
      } else {
        // Regular chat with the director
        const reply = await askTheDirector(scriptAnalysis!, trimmedInput);
        setMessages([...nextMessages, { author: 'director', text: reply }]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessages([
        ...nextMessages,
        {
          author: 'director',
          text: `Sorry, I encountered an error: ${errorMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const widgetLabel = useMemo(() => (canChat ? 'AI Director' : 'Analyze script first'), [canChat]);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen && canChat ? (
        <div className="relative w-[420px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#14171f] to-[#0d0f16] shadow-[0_40px_90px_rgba(3,7,18,0.75)] backdrop-blur-2xl">
          <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-[rgba(16,163,127,0.08)] to-transparent px-6 py-5">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(16,163,127,0.25)] to-[rgba(16,163,127,0.1)] shadow-[0_0_20px_rgba(16,163,127,0.3)]"
                style={{ color: ACCENT_HEX }}
              >
                <BrainIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-white">AI Director Assistant</h3>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Creative Partner & Executor</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white/70 transition-all hover:bg-white/10 hover:text-white hover:scale-105"
              aria-label="Close director assistant"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </header>

          <div className="flex h-[480px] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {messages.map((message, index) => (
                <div
                  key={`${message.author}-${index}`}
                  className={`flex gap-3 ${message.author === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.author === 'director' && (
                    <span
                      className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(16,163,127,0.2)] to-[rgba(16,163,127,0.05)] shadow-inner"
                      style={{ color: ACCENT_HEX }}
                    >
                      <BrainIcon className="h-4 w-4" />
                    </span>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-lg ${
                      message.author === 'user'
                        ? 'rounded-br-sm bg-gradient-to-r from-[#1ad8b1] to-[#0ea887] text-white shadow-[0_4px_20px_rgba(26,216,177,0.3)]'
                        : message.isCommand
                          ? 'rounded-bl-sm bg-gradient-to-r from-[#1f2530] to-[#191e28] text-white/90 border border-[rgba(16,163,127,0.2)]'
                          : 'rounded-bl-sm bg-[#1a1f29] text-white/85'
                    }`}
                  >
                    <span className="whitespace-pre-wrap">{message.text}</span>
                    {message.images && message.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {message.images.slice(0, 4).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Generated ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg hover:opacity-90 transition cursor-pointer"
                            onClick={() => window.open(img, '_blank')}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(16,163,127,0.2)] to-[rgba(16,163,127,0.05)]"
                    style={{ color: ACCENT_HEX }}
                  >
                    <BrainIcon className="h-4 w-4 animate-pulse" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/50" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/50" style={{ animationDelay: '100ms' }} />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/50" style={{ animationDelay: '200ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="border-t border-white/10 bg-[#0f1117] px-6 py-5">
              <div className="relative">
                <textarea
                  value={userInput}
                  onChange={(event) => setUserInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
                    }
                  }}
                  rows={2}
                  placeholder="Ask the director or type a command..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-gradient-to-b from-[#13161d] to-[#0e1015] px-5 py-3.5 pr-28 text-sm text-white/90 outline-none transition-all placeholder:text-white/30 focus:border-[rgba(16,163,127,0.5)] focus:ring-2 focus:ring-[rgba(16,163,127,0.2)] focus:shadow-[0_0_20px_rgba(16,163,127,0.15)]"
                  disabled={!canChat || isLoading}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!canChat || isLoading || !userInput.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 !rounded-xl !px-4 !py-2.5 !bg-gradient-to-r !from-[#10A37F] !to-[#0d8a68] hover:!from-[#12b88d] hover:!to-[#0f9673] shadow-[0_4px_15px_rgba(16,163,127,0.3)]"
                >
                  <SendIcon className="h-4 w-4" />
                  <span className="font-medium">Send</span>
                </Button>
              </div>
              <div className="mt-2 flex gap-2 text-[10px] text-white/30">
                <span>💡 Commands:</span>
                <span>"Generate 3 flux images of Elena 16:9"</span>
                <span>•</span>
                <span>"Upscale the cafe image"</span>
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
  );
};

export default DirectorWidget;