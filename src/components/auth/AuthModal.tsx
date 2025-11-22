import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'
import { useState } from 'react'
import { supabase } from '@/services/supabase'
import { useTheme } from '../../theme/ThemeContext'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
  onSuccess?: () => void
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const { colors } = useTheme()
  // Always using dark theme
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>(initialMode)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState('')

  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  const handleForgotPassword = () => {
    setMode('forgot-password')
    setResetMessage('')
    setResetError('')
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setResetError('Please enter your email address')
      return
    }

    setIsLoading(true)
    setResetError('')
    setResetMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setResetError(error.message)
      } else {
        setResetMessage('Password reset link sent! Check your email inbox.')
        // Clear the email field
        setEmail('')
      }
    } catch (error) {
      setResetError('An unexpected error occurred. Please try again.')
      console.error('Password reset error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
              style={{ backgroundColor: colors.bg_primary }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="px-6 py-4 border-b flex items-center justify-between"
                style={{ borderColor: colors.border_primary }}
              >
                <h2 className="text-xl font-semibold" style={{ color: colors.text_primary }}>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'register' && 'Create Account'}
                  {mode === 'forgot-password' && 'Reset Password'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {mode === 'login' && (
                    <LoginForm
                      key="login"
                      onSuccess={handleSuccess}
                      onSwitchToRegister={() => setMode('register')}
                      onForgotPassword={handleForgotPassword}
                    />
                  )}

                  {mode === 'register' && (
                    <RegisterForm
                      key="register"
                      onSuccess={handleSuccess}
                      onSwitchToLogin={() => setMode('login')}
                    />
                  )}

                  {mode === 'forgot-password' && (
                    <motion.div
                      key="forgot-password"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-full"
                    >
                      <p className="mb-4 text-sm" style={{ color: colors.text_secondary }}>
                        Enter your email address and we'll send you a link to reset your password.
                      </p>

                      {/* Success Message */}
                      {resetMessage && (
                        <div
                          className="mb-4 p-3 rounded-lg text-sm"
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                          }}
                        >
                          {resetMessage}
                        </div>
                      )}

                      {/* Error Message */}
                      {resetError && (
                        <div
                          className="mb-4 p-3 rounded-lg text-sm"
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                          }}
                        >
                          {resetError}
                        </div>
                      )}

                      {!resetMessage && (
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                          <div>
                            <label
                              htmlFor="reset-email"
                              className="block text-sm font-medium mb-2"
                              style={{ color: colors.text_secondary }}
                            >
                              Email
                            </label>
                            <input
                              id="reset-email"
                              type="email"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value)
                                if (resetError) setResetError('')
                              }}
                              required
                              disabled={isLoading}
                              className="w-full px-4 py-2 rounded-lg border transition-colors disabled:opacity-50"
                              style={{
                                backgroundColor: colors.bg_secondary,
                                borderColor: resetError ? '#ef4444' : colors.border_primary,
                                color: colors.text_primary,
                              }}
                              placeholder="you@example.com"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isLoading || !email.trim()}
                            className="w-full py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            style={{
                              backgroundColor:
                                isLoading || !email.trim() ? '#94a3b8' : colors.accent_primary,
                              color: '#FFFFFF',
                            }}
                          >
                            {isLoading ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                                Sending...
                              </>
                            ) : (
                              'Send Reset Link'
                            )}
                          </button>
                        </form>
                      )}

                      <div className="mt-4 text-center">
                        <button
                          type="button"
                          onClick={() => setMode('login')}
                          className="text-sm hover:underline transition-colors"
                          style={{ color: colors.accent_primary }}
                        >
                          Back to Sign In
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AuthModal
