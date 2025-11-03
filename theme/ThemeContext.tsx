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
}

export const THEMES: Record<ThemeMode, ThemePalette> = {
  dark: {
    bg_primary: '#0B0B0B',
    bg_secondary: '#161616',
    bg_tertiary: '#1C1C1C',
    text_primary: '#FFFFFF',
    text_secondary: '#A0A0A0',
    text_tertiary: '#707070',
    accent_primary: '#10A37F',
    accent_secondary: '#1AD8B1',
    border_primary: '#2A2A2A',
    border_secondary: '#404040',
  },
  light: {
    bg_primary: '#FFFFFF',
    bg_secondary: '#F5F5F5',
    bg_tertiary: '#EBEBEB',
    text_primary: '#0B0B0B',
    text_secondary: '#505050',
    text_tertiary: '#808080',
    accent_primary: '#0FB98D',
    accent_secondary: '#0D8F74',
    border_primary: '#D4D4D4',
    border_secondary: '#B0B0B0',
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
