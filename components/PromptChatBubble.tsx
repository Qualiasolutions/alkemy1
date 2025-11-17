import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendIcon, SparklesIcon, ChevronDownIcon, ArrowLeftIcon, ArrowRightIcon } from './icons/Icons';

interface ChatMessage {
  id: string;
  text: string;
  type: 'user' | 'system';
  timestamp: Date;
}

interface PromptChatBubbleProps {
  onSendPrompt: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  suggestedPrompts?: string[];
}

const PromptChatBubble: React.FC<PromptChatBubbleProps> = ({
  onSendPrompt,
  isGenerating,
  placeholder = "Describe what you want to refine...",
  disabled = false,
  className = "",
  suggestedPrompts = [
    "Add cinematic lighting with golden hour effect",
    "Make the colors more vibrant and saturated",
    "Enhance facial details and expressions",
    "Add subtle film grain for cinematic feel",
    "Improve composition with rule of thirds",
    "Softer lighting with more dramatic shadows"
  ]
}) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!prompt.trim() || isGenerating || disabled) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: prompt.trim(),
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setShowSuggestions(false);
    setIsExpanded(true);

    const promptToSend = prompt.trim();
    setPrompt('');

    try {
      await onSendPrompt(promptToSend);

      // Add a success message after generation completes
      setTimeout(() => {
        const successMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          text: "✨ Image refined successfully! Check out the updated result.",
          type: 'system',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
      }, 500);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        text: `❌ Error: ${error instanceof Error ? error.message : 'Failed to refine image'}`,
        type: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSuggestedPrompt = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
    setIsExpanded(false);
  };

  return (
    <div className={`prompt-chat-bubble ${className}`}>
      <div className="relative bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-[#dfec2d]/20 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#dfec2d]/10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#dfec2d] rounded-full animate-pulse"></div>
            <h3 className="text-white font-semibold text-sm">AI Refinement Assistant</h3>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-white/60 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-all"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white/60 hover:text-white transition-transform"
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <ChevronDownIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages Area */}
        <AnimatePresence>
          {(isExpanded || messages.length > 0) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="max-h-48 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && showSuggestions && (
                  <div className="space-y-2">
                    <p className="text-white/60 text-xs font-medium mb-3">Quick suggestions:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {suggestedPrompts.slice(0, 3).map((suggestion, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleSuggestedPrompt(suggestion)}
                          className="text-left p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#dfec2d]/30 rounded-lg text-white/80 text-xs transition-all hover:scale-[1.02]"
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-[#dfec2d] to-[#b3e617] text-black font-medium'
                          : message.text.includes('✨')
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {message.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-4 border-t border-[#dfec2d]/10">
          <div className="relative group">
            <div className="relative bg-gray-800/50 rounded-xl border border-[#dfec2d]/20 focus-within:border-[#dfec2d]/50 transition-all">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={2}
                className="w-full px-4 py-3 bg-transparent text-white placeholder-white/50 focus:outline-none resize-none text-sm leading-relaxed pr-12"
                disabled={disabled || isGenerating}
              />

              {/* Send Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={isGenerating || !prompt.trim() || disabled}
                className={`absolute bottom-2 right-2 p-2 rounded-lg transition-all ${
                  isGenerating || !prompt.trim() || disabled
                    ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#dfec2d] to-[#b3e617] text-black hover:shadow-lg hover:shadow-[#dfec2d]/30'
                }`}
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
              </motion.button>
            </div>

            {/* Quick Actions */}
            {!prompt.trim() && !isGenerating && (
              <div className="flex items-center justify-between mt-2">
                <p className="text-white/40 text-xs">
                  Press Enter to send • Click suggestions above for quick edits
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-white/40 hover:text-white/60 text-xs"
                  >
                    <SparklesIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Processing Indicator */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full left-0 right-0 mb-2 flex justify-center"
          >
            <div className="bg-[#dfec2d] text-black px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
              <div className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin"></div>
              Refining your image...
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PromptChatBubble;