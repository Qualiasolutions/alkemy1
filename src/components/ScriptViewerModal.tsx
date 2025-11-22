import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'
import { useTheme } from '../theme/ThemeContext'
import { XIcon } from './icons/Icons'

interface ScriptViewerModalProps {
  isOpen: boolean
  onClose: () => void
  scriptContent: string
  scriptTitle?: string
}

const ScriptViewerModal: React.FC<ScriptViewerModalProps> = ({
  isOpen,
  onClose,
  scriptContent,
  scriptTitle = 'Script',
}) => {
  const { isDark } = useTheme()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`relative w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden ${
                isDark
                  ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0B0B0B] border border-gray-800/50'
                  : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
              } shadow-2xl flex flex-col`}
            >
              {/* Header */}
              <div
                className={`sticky top-0 z-10 px-6 py-4 border-b ${
                  isDark ? 'border-gray-800/50 bg-[#1A1A1A]/95' : 'border-gray-200 bg-white/95'
                } backdrop-blur-sm flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${isDark ? 'bg-[#DFEC2D]/20' : 'bg-[#DFEC2D]/30'}`}
                  >
                    <svg
                      className="w-6 h-6 text-[#DFEC2D]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {scriptTitle}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {scriptContent.length.toLocaleString()} characters
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-all ${
                    isDark
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                  }`}
                  aria-label="Close script viewer"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Script Content */}
              <div
                className={`flex-1 overflow-y-auto p-8 ${isDark ? 'bg-[#0F0F0F]' : 'bg-gray-50'}`}
              >
                <div
                  className={`rounded-xl p-6 ${
                    isDark
                      ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0B0B0B] border border-gray-800/30'
                      : 'bg-white border border-gray-200'
                  } shadow-inner`}
                >
                  <pre
                    className={`text-sm whitespace-pre-wrap break-words font-mono leading-relaxed ${
                      isDark ? 'text-gray-300' : 'text-gray-800'
                    }`}
                  >
                    {scriptContent}
                  </pre>
                </div>
              </div>

              {/* Footer with subtle gradient accent */}
              <div
                className={`h-1 ${
                  isDark
                    ? 'bg-gradient-to-r from-[#DFEC2D]/30 via-[#DFEC2D]/50 to-[#DFEC2D]/30'
                    : 'bg-gradient-to-r from-[#DFEC2D]/40 via-[#DFEC2D]/60 to-[#DFEC2D]/40'
                }`}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ScriptViewerModal
