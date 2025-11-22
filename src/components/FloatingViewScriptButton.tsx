import { motion } from 'framer-motion'
import type React from 'react'
import { useTheme } from '../theme/ThemeContext'

interface FloatingViewScriptButtonProps {
  onClick: () => void
}

const FloatingViewScriptButton: React.FC<FloatingViewScriptButtonProps> = ({ onClick }) => {
  const { isDark } = useTheme()

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-40 group ${
        isDark
          ? 'bg-gradient-to-br from-[#DFEC2D] to-[#FDE047] text-black'
          : 'bg-gradient-to-br from-[#DFEC2D] to-[#FDE047] text-gray-900'
      } rounded-full p-4 shadow-2xl hover:shadow-[#DFEC2D]/50 transition-all duration-300`}
      aria-label="View script"
    >
      {/* Animated glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-[#DFEC2D]/30"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Icon */}
      <div className="relative flex items-center gap-3">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>

        {/* Expandable label on hover */}
        <motion.span
          initial={{ width: 0, opacity: 0 }}
          whileHover={{ width: 'auto', opacity: 1 }}
          className="font-bold text-sm whitespace-nowrap overflow-hidden"
        >
          View Script
        </motion.span>
      </div>

      {/* Tooltip (shows on hover) */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        whileHover={{ opacity: 1, y: 0, scale: 1 }}
        className={`absolute bottom-full right-0 mb-3 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap pointer-events-none ${
          isDark
            ? 'bg-gray-900 text-white border border-gray-800'
            : 'bg-white text-gray-900 border border-gray-200'
        } shadow-lg`}
      >
        View Full Script
        <div
          className={`absolute top-full right-6 w-2 h-2 transform rotate-45 ${
            isDark
              ? 'bg-gray-900 border-r border-b border-gray-800'
              : 'bg-white border-r border-b border-gray-200'
          }`}
        />
      </motion.div>
    </motion.button>
  )
}

export default FloatingViewScriptButton
