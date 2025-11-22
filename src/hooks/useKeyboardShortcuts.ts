import { useEffect } from 'react'

/**
 * Keyboard Shortcuts Hook
 * Enables power-user keyboard navigation
 */

interface ShortcutHandlers {
  onNewProject?: () => void
  onSaveProject?: () => void
  onLoadProject?: () => void
  onTabSwitch?: (tabNumber: number) => void
}

export const useKeyboardShortcuts = (handlers: ShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = event.target as HTMLElement
      const isTyping = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable

      // Get modifier key (Cmd on Mac, Ctrl on Windows/Linux)
      const modifier = event.metaKey || event.ctrlKey

      // Don't trigger shortcuts while typing
      if (isTyping && modifier) {
        // Allow certain shortcuts even while typing (like Cmd+S for save)
        if (event.key === 's' && modifier && handlers.onSaveProject) {
          event.preventDefault()
          handlers.onSaveProject()
          return
        }
        return
      }

      // Cmd/Ctrl + N - New Project
      if (event.key === 'n' && modifier && handlers.onNewProject) {
        event.preventDefault()
        handlers.onNewProject()
        return
      }

      // Cmd/Ctrl + S - Save Project
      if (event.key === 's' && modifier && handlers.onSaveProject) {
        event.preventDefault()
        handlers.onSaveProject()
        return
      }

      // Cmd/Ctrl + O - Load Project
      if (event.key === 'o' && modifier && handlers.onLoadProject) {
        event.preventDefault()
        handlers.onLoadProject()
        return
      }

      // Cmd/Ctrl + 1-9 - Switch Tabs
      if (modifier && /^[1-9]$/.test(event.key) && handlers.onTabSwitch) {
        event.preventDefault()
        const tabNumber = parseInt(event.key, 10)
        handlers.onTabSwitch(tabNumber - 1) // 0-indexed
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlers])
}
