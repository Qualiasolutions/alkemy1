import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Vercel automatically exposes environment variables at build time
    // Prioritize Vercel's env vars, fall back to local .env
    const geminiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    const fluxKey = process.env.FLUX_API_KEY || env.FLUX_API_KEY || '';
    const wanKey = process.env.WAN_API_KEY || env.WAN_API_KEY || '';
    const lumaKey = process.env.LUMA_API_KEY || env.LUMA_API_KEY || '';

    // Explicitly set demo mode to false (only enable via env var if needed)
    const forceDemoMode = process.env.FORCE_DEMO_MODE || env.FORCE_DEMO_MODE || 'false';
    const useFallbackMode = process.env.USE_FALLBACK_MODE || env.USE_FALLBACK_MODE || 'false';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
        'process.env.FLUX_API_KEY': JSON.stringify(fluxKey),
        'process.env.WAN_API_KEY': JSON.stringify(wanKey),
        'process.env.LUMA_API_KEY': JSON.stringify(lumaKey),
        'process.env.FORCE_DEMO_MODE': JSON.stringify(forceDemoMode),
        'process.env.USE_FALLBACK_MODE': JSON.stringify(useFallbackMode),
        // Also expose via import.meta.env for better client-side access
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
        'import.meta.env.VITE_FORCE_DEMO_MODE': JSON.stringify(forceDemoMode),
        'import.meta.env.VITE_USE_FALLBACK_MODE': JSON.stringify(useFallbackMode),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
