/**
 * Style Learning Opt-In Prompt (Epic 1, Story 1.3, AC6: Privacy Controls)
 *
 * One-time prompt shown to users on first launch after feature deployment.
 * Allows users to enable/disable style learning with clear privacy explanation.
 */

import type React from 'react'
import Button from './Button'

interface StyleLearningOptInProps {
  onEnable: () => void
  onDecline: () => void
}

const StyleLearningOptIn: React.FC<StyleLearningOptInProps> = ({ onEnable, onDecline }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-[#14171f] to-[#0d0f16] p-8 shadow-[0_50px_100px_rgba(3,7,18,0.9)]">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(223,236,45,0.3)] to-[rgba(223,236,45,0.1)]">
            <svg
              className="h-8 w-8 text-[#DFEC2D]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-3 text-center text-xl font-bold text-white">
          Help the Director Learn Your Style?
        </h2>

        {/* Description */}
        <p className="mb-6 text-center text-sm leading-relaxed text-white/70">
          The Director can track your creative patterns—shot types, lens choices, lighting, and
          color grading—to provide personalized suggestions that match your style.
        </p>

        {/* Privacy info */}
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/80">
            What's tracked:
          </h3>
          <ul className="space-y-1 text-xs text-white/60">
            <li>• Shot types (close-ups, wide shots, etc.)</li>
            <li>• Lens preferences (focal lengths)</li>
            <li>• Lighting patterns (natural, low-key, etc.)</li>
            <li>• Color grading choices</li>
          </ul>
          <p className="mt-3 text-xs text-white/50">
            Your data is stored{' '}
            {typeof window !== 'undefined' && localStorage.getItem('alkemy_supabase_configured')
              ? 'in your account'
              : 'locally on this device'}{' '}
            and never shared.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onDecline} className="flex-1 !rounded-xl !py-3">
            No Thanks
          </Button>
          <Button variant="primary" onClick={onEnable} className="flex-1 !rounded-xl !py-3">
            Enable Style Learning
          </Button>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center text-[10px] text-white/40">
          You can change this anytime in Director settings
        </p>
      </div>
    </div>
  )
}

export default StyleLearningOptIn
