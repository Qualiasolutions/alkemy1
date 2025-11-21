import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon, CopyIcon, CheckIcon } from './icons/Icons';

interface PromptModalProps {
  prompt: string;
  onClose: () => void;
}

const PromptModal: React.FC<PromptModalProps> = ({ prompt, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timeout);
  }, [copied]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch (error) {
      console.warn('Failed to copy prompt', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = prompt;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#14171f] to-[#0d0f16] shadow-[0_50px_150px_rgba(3,7,18,0.9)] text-white"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[rgba(16,163,127,0.08)] to-transparent px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-3 w-3 rounded-full bg-gradient-to-br from-teal-400 to-#DFEC2D shadow-[0_0_20px_rgba(45,212,191,0.6)] animate-pulse" />
              <h2 className="text-base font-semibold uppercase tracking-[0.3em] text-white/90">
                Prompt Ready
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white/70 transition-all hover:bg-white/10 hover:text-white hover:scale-105 hover:border-white/20"
              aria-label="Close prompt modal"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </header>

          {/* Content */}
          <div className="relative px-6 py-6 space-y-4">
            <p className="text-sm text-white/60 leading-relaxed">
              Click the prompt below to copy it to your clipboard. You can paste it directly into your image or video generation workflow.
            </p>

            {/* Prompt Display with Click-to-Copy */}
            <button
              type="button"
              onClick={handleCopy}
              className="group relative w-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-6 text-left text-white transition-all hover:border-[rgba(16,163,127,0.4)] hover:bg-white/10 hover:shadow-[0_0_30px_rgba(16,163,127,0.15)] active:scale-[0.99]"
            >
              {/* Prompt Text */}
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-white/90 font-mono break-words max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-2">
                {prompt}
              </pre>

              {/* Hover Effect Border */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-transparent transition-all group-hover:border-[rgba(16,163,127,0.2)]" />

              {/* Copy Badge */}
              <span className={`absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] transition-all ${
                copied
                  ? 'border-#DFEC2D/50 bg-#DFEC2D/20 text-#DFEC2D shadow-[0_0_20px_rgba(223,236,45,0.3)]'
                  : 'border-white/10 bg-black/50 text-white/60 group-hover:border-teal-400/50 group-hover:bg-teal-500/10 group-hover:text-teal-400'
              }`}>
                {copied ? (
                  <>
                    <CheckIcon className="h-3.5 w-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon className="h-3.5 w-3.5" /> Click to Copy
                  </>
                )}
              </span>
            </button>

            {/* Success Message */}
            {copied && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm text-#DFEC2D"
              >
                ✓ Prompt copied to clipboard successfully!
              </motion.p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PromptModal;
