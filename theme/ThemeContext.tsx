import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemePalette {
  bg_primary: string;
  bg_secondary: string;
  bg_tertiary: string;
  text_primary: string;
  text_secondary: string;
  text_tertiary: string;
  accent_primary: string;
  accent_secondary: string;
  border_primary: string;
  border_secondary: string;
  // Enhanced modern theme additions
  gradient_primary: string;
  gradient_secondary: string;
  glass_bg: string;
  glass_border: string;
  shadow_primary: string;
  shadow_secondary: string;
}

export const THEMES: Record<ThemeMode, ThemePalette> = {
  dark: {
    // Refined dark palette with subtle warmth
    bg_primary: '#0A0A0B',        // Deep blue-black
    bg_secondary: '#141414',      // Soft black
    bg_tertiary: '#1A1A1C',       // Dark slate
    text_primary: '#FFFFFF',
    text_secondary: '#B4B4B4',    // Softer secondary text
    text_tertiary: '#7A7A7A',     // Enhanced tertiary contrast
    accent_primary: '#dfec2d',    // Yellow accent
    accent_secondary: '#dfec2d',  // Yellow accent
    border_primary: '#2A2A2D',    // Subtle borders with hint of blue
    border_secondary: '#3A3A3D',  // Enhanced border visibility
    // Modern additions
    gradient_primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradient_secondary: '#dfec2d',
    glass_bg: 'rgba(255, 255, 255, 0.05)',
    glass_border: 'rgba(255, 255, 255, 0.1)',
    shadow_primary: '0 8px 32px rgba(0, 0, 0, 0.3)',
    shadow_secondary: '0 4px 16px rgba(0, 0, 0, 0.2)',
  },
  light: {
    // Clean, modern light theme
    bg_primary: '#FFFFFF',
    bg_secondary: '#FAFAFA',      // Softer off-white
    bg_tertiary: '#F0F0F0',       // Light gray
    text_primary: '#0A0A0A',      // Softer black
    text_secondary: '#5A5A5A',    // Enhanced readability
    text_tertiary: '#8A8A8A',     // Better contrast
    accent_primary: '#dfec2d',    // Yellow accent
    accent_secondary: '#dfec2d',  // Yellow accent
    border_primary: '#E0E0E0',    // Subtle borders
    border_secondary: '#D0D0D0',  // Clear dividers
    // Modern additions
    gradient_primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradient_secondary: '#dfec2d',
    glass_bg: 'rgba(255, 255, 255, 0.7)',
    glass_border: 'rgba(255, 255, 255, 0.8)',
    shadow_primary: '0 8px 32px rgba(0, 0, 0, 0.1)',
    shadow_secondary: '0 4px 16px rgba(0, 0, 0, 0.05)',
  },
};

export const DEFAULT_THEME_MODE: ThemeMode = 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemePalette;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

let activeThemeMode: ThemeMode = DEFAULT_THEME_MODE;

export function setActiveThemeMode(mode: ThemeMode) {
  activeThemeMode = mode;
}

export function getActiveThemeMode(): ThemeMode {
  return activeThemeMode;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const persisted = window.localStorage.getItem('alkemy-ai-studio-theme');
    if (persisted === 'dark' || persisted === 'light') {
      return persisted as ThemeMode;
    }
    return DEFAULT_THEME_MODE;
  });

  useEffect(() => {
    setActiveThemeMode(mode);
    window.localStorage.setItem('alkemy-ai-studio-theme', mode);
    document.documentElement.dataset.theme = mode;

    // Update body classes for theme
    if (mode === 'dark') {
      document.body.classList.remove('bg-white', 'text-black');
      document.body.classList.add('bg-[#0B0B0B]', 'text-white');
    } else {
      document.body.classList.remove('bg-[#0B0B0B]', 'text-white');
      document.body.classList.add('bg-white', 'text-black');
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const value: ThemeContextValue = {
    mode,
    colors: THEMES[mode],
    toggleTheme,
    setTheme,
    isDark: mode === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
