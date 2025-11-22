/**
 * Modern Button Component with Advanced Animations
 * Includes ripple effects, smooth transitions, and loading states
 */

import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/theme/ThemeContext'

interface ModernButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  icon,
  iconPosition = 'left',
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  const { colors } = useTheme()

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const id = Date.now()

    setRipples((prev) => [...prev, { x, y, id }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id))
    }, 600)
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: colors.accent_primary,
          color: '#FFFFFF',
          border: 'none',
        }
      case 'secondary':
        return {
          background: colors.bg_tertiary,
          color: colors.text_primary,
          border: `1px solid ${colors.border_primary}`,
        }
      case 'outline':
        return {
          background: 'transparent',
          color: colors.accent_primary,
          border: `1px solid ${colors.accent_primary}`,
        }
      case 'ghost':
        return {
          background: 'transparent',
          color: colors.text_secondary,
          border: 'none',
        }
      case 'gradient':
        return {
          background: colors.gradient_secondary,
          color: '#FFFFFF',
          border: 'none',
        }
      default:
        return {
          background: colors.accent_primary,
          color: '#FFFFFF',
          border: 'none',
        }
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          borderRadius: '0.5rem',
        }
      case 'lg':
        return {
          padding: '0.875rem 2rem',
          fontSize: '1rem',
          borderRadius: '0.875rem',
        }
      default:
        return {
          padding: '0.625rem 1.5rem',
          fontSize: '0.875rem',
          borderRadius: '0.75rem',
        }
    }
  }

  return (
    <motion.button
      className={cn(
        'relative overflow-hidden font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      style={{
        ...getVariantStyles(),
        ...getSizeStyles(),
        focusRingColor: colors.accent_primary,
      }}
      whileHover={
        !disabled && !loading
          ? {
              scale: 1.05,
              transition: { duration: 0.2 },
            }
          : undefined
      }
      whileTap={
        !disabled && !loading
          ? {
              scale: 0.95,
              transition: { duration: 0.1 },
            }
          : undefined
      }
      onClick={(e) => {
        if (!disabled && !loading) {
          createRipple(e)
          onClick?.()
        }
      }}
      disabled={disabled || loading}
    >
      {/* Ripple Effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute bg-white/20 rounded-full pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Loading Spinner */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* Button Content */}
      <div className={cn('flex items-center gap-2', loading && 'opacity-0')}>
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </div>
    </motion.button>
  )
}
