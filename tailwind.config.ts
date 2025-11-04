import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './tabs/**/*.{ts,tsx}',
    './theme/**/*.{ts,tsx}',
    './types.ts'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
