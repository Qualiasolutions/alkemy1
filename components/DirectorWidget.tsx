import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScriptAnalysis } from '../types';
import { askTheDirector } from '../services/aiService';
import Button from './Button';
import { THEME_COLORS } from '../constants';
import { BrainIcon, SendIcon, XIcon } from './icons/Icons';

type Author = 'user' | 'director';

interface Message {
  author: Author;
  text: string;
}

interface DirectorWidgetProps {
  scriptAnalysis: ScriptAnalysis | null;
}

const getWelcomeMessage = (): Message => ({
  author: 'director',
  text: 'Welcome. I have reviewed the project materials. How can I assist you with the creative direction?',
});

const DirectorWidget: React.FC<DirectorWidgetProps> = ({ scriptAnalysis }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([getWelcomeMessage()]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canChat = !!scriptAnalysis;

  useEffect(() => {
    if (!canChat) {
      setMessages([getWelcomeMessage()]);
      setIsOpen(false);
    }
  }, [canChat]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || !canChat || isLoading) return;

    const nextMessages = [...messages, { author: 'user', text: trimmedInput }];
    setMessages(nextMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const reply = await askTheDirector(scriptAnalysis!, trimmedInput);
      setMessages([...nextMessages, { author: 'director', text: reply }]);
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

  const widgetLabel = useMemo(
    () => (canChat ? 'Director' : 'Analyze script to chat'),
    [canChat]
  );

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {isOpen && canChat ? (
        <div className="relative w-[360px] overflow-hidden rounded-3xl border border-white/10 bg-[#111318]/95 shadow-[0_30px_70px_rgba(3,7,18,0.65)] backdrop-blur-xl">
          <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(16,163,127,0.2)] text-[${THEME_COLORS.accent_primary}]`}
              >
                <BrainIcon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">Director Assistant</h3>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Creative partner</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close director assistant"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </header>

          <div className="flex h-[360px] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.author}-${index}`}
                  className={`flex gap-3 ${message.author === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.author === 'director' && (
                    <span
                      className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(16,163,127,0.15)] text-[${THEME_COLORS.accent_primary}]`}
                    >
                      <BrainIcon className="h-4 w-4" />
                    </span>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      message.author === 'user'
                        ? 'rounded-br-sm bg-gradient-to-r from-[#1ad8b1]/80 to-[#118f71]/80 text-[#04281f]'
                        : 'rounded-bl-sm bg-[#171c24] text-white/85'
                    }`}
                  >
                    <span className="whitespace-pre-wrap">{message.text}</span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(16,163,127,0.15)] text-[${THEME_COLORS.accent_primary}]`}
                  >
                    <BrainIcon className="h-4 w-4 animate-pulse" />
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-white/50" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-white/50" style={{ animationDelay: '100ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-white/50" style={{ animationDelay: '200ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="border-t border-white/10 bg-[#10131a] px-5 py-4">
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
                  rows={1}
                  placeholder="Ask the director..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-[#0c1017] px-4 py-3 pr-24 text-sm text-white/90 outline-none transition focus:border-[rgba(16,163,127,0.55)] focus:ring-2 focus:ring-[rgba(16,163,127,0.35)]"
                  disabled={!canChat || isLoading}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!canChat || isLoading || !userInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 !rounded-xl !px-4 !py-2"
                >
                  <SendIcon className="h-4 w-4" />
                  <span>Send</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => canChat && setIsOpen(true)}
          variant="primary"
          disabled={!canChat}
          className="group !rounded-full !px-5 !py-3 shadow-[0_18px_38px_rgba(16,163,127,0.28)]"
        >
          <BrainIcon className="h-4 w-4 transition group-hover:scale-110" />
          <span className="font-semibold">{widgetLabel}</span>
        </Button>
      )}
    </div>
  );
};

export default DirectorWidget;
