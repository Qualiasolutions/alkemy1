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
        'process.env.LUMA_API_KEY': JSON.stringify(lumaKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
