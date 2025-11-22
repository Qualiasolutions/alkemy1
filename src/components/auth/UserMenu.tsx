import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/theme/ThemeContext'

interface UserMenuProps {
  onProfileClick?: () => void
  onSettingsClick?: () => void
  onProjectsClick?: () => void
}

const UserMenu: React.FC<UserMenuProps> = ({
  onProfileClick,
  onSettingsClick,
  onProjectsClick,
}) => {
  const { user, signOut } = useAuth()
  const { colors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!user) return null

  const getInitials = (name?: string) => {
    if (!name) return user.email?.[0]?.toUpperCase() || 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getSubscriptionBadge = () => {
    switch (user.subscription_tier) {
      case 'pro':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-primary)]">
            PRO
          </span>
        )
      case 'enterprise':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
            ENTERPRISE
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden border-2 border-white"
          style={{
            backgroundColor: user.avatar_url ? 'transparent' : colors.accent_secondary,
            color: user.avatar_url ? colors.text_primary : '#000000',
          }}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || user.email}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials(user.name)
          )}
        </div>

        {/* Name and chevron */}
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium hidden md:block"
            style={{ color: colors.text_primary }}
          >
            {user.name || user.email?.split('@')[0]}
          </span>
          {getSubscriptionBadge()}
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg overflow-hidden z-50 bg-black border border-white"
          >
            {/* User info header */}
            <div className="p-4 border-b border-white">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden border-2 border-white"
                  style={{
                    backgroundColor: user.avatar_url ? 'transparent' : colors.accent_secondary,
                    color: user.avatar_url ? colors.text_primary : '#000000',
                  }}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name || user.email}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-white">{user.name || 'User'}</p>
                  <p className="text-xs truncate text-gray-400">{user.email}</p>
                </div>
              </div>
              {getSubscriptionBadge()}
            </div>

            {/* Menu items */}
            <div className="py-2">
              <button
                onClick={() => {
                  onProjectsClick?.()
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-500/10 text-white transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                My Projects
              </button>

              <button
                onClick={() => {
                  onProfileClick?.()
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-500/10 text-white transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profile
              </button>

              <button
                onClick={() => {
                  onSettingsClick?.()
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-500/10 text-white transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </button>

              {/* Divider */}
              <div className="my-2 border-t border-white" />

              <button
                onClick={async () => {
                  await signOut()
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-500/10 text-white transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UserMenu
