import type React from 'react'
import { createContext, type ReactNode, useContext, useEffect } from 'react'

// Simple no-op theme context to prevent crashes when removing theme system
interface ThemeContextType {
  isDark: boolean
  colors: any
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  colors: {},
  toggleTheme: () => {},
})

export const useTheme = () => useContext(ThemeContext)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const value: ThemeContextType = {
    isDark: true, // Always dark
    colors: {}, // Empty colors object
    toggleTheme: () => {}, // No-op function
  }

  // Add dark class to HTML element for Tailwind dark: styles
  useEffect(() => {
    if (typeof window !== 'undefined' && window.document) {
      const documentElement = window.document.documentElement
      documentElement.classList.add('dark')
    }
  }, [])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
