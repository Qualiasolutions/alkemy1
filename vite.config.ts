import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

const createBraveProxyDevPlugin = (apiKey: string | undefined): Plugin => ({
    name: 'alkemy-dev-brave-proxy',
    apply: 'serve',
    configureServer(server) {
        server.middlewares.use('/api/brave-proxy', async (req, res, next) => {
            if (req.method === 'OPTIONS') {
                res.statusCode = 204;
                res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                res.end();
                return;
            }

            if (req.method !== 'GET') {
                res.statusCode = 405;
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
            }

            if (!apiKey) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'BRAVE_SEARCH_API_KEY is not configured for dev proxy' }));
                return;
            }

            try {
                const requestUrl = new URL(req.url ?? '', 'http://localhost');
                const query = requestUrl.searchParams.get('query');
                const count = requestUrl.searchParams.get('count') ?? '4';
                const safesearch = requestUrl.searchParams.get('safesearch') ?? 'moderate';

                if (!query) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: 'Missing required parameter: query' }));
                    return;
                }

                const braveUrl = `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=${count}&safesearch=${safesearch}`;
                const braveResponse = await fetch(braveUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Encoding': 'gzip',
                        'X-Subscription-Token': apiKey
                    }
                });

                const body = await braveResponse.text();
                res.statusCode = braveResponse.status;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*');
                res.end(body);
            } catch (error) {
                console.error('[dev-brave-proxy] Failed:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to reach Brave API' }));
            }
        });
    }
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Vercel automatically exposes environment variables at build time
    // Prioritize Vercel's env vars, fall back to local .env
    const geminiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    const fluxKey = process.env.FLUX_API_KEY || env.FLUX_API_KEY || '';
    const wanKey = process.env.WAN_API_KEY || env.WAN_API_KEY || '';
    const lumaKey = process.env.LUMA_API_KEY || env.LUMA_API_KEY || '';
    const braveSearchKey = process.env.BRAVE_SEARCH_API_KEY || env.BRAVE_SEARCH_API_KEY || '';
    const braveProxyUrl = process.env.BRAVE_PROXY_URL || env.BRAVE_PROXY_URL || '/api/brave-proxy';

    // Supabase configuration
    const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '';

    // Explicitly set demo mode to false (only enable via env var if needed)
    const forceDemoMode = process.env.FORCE_DEMO_MODE || env.FORCE_DEMO_MODE || 'false';
    const useFallbackMode = process.env.USE_FALLBACK_MODE || env.USE_FALLBACK_MODE || 'false';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        wasm(),
        topLevelAwait(),
        ...(mode === 'development' ? [createBraveProxyDevPlugin(braveSearchKey)] : [])
      ],
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'ui-vendor': ['framer-motion'],
              'three-vendor': ['three'],
            },
          },
        },
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: false,
            drop_debugger: true,
          },
          mangle: {
            // Prevent mangling of class names to avoid initialization issues
            keep_classnames: true,
            keep_fnames: true,
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
        'process.env.FLUX_API_KEY': JSON.stringify(fluxKey),
        'process.env.WAN_API_KEY': JSON.stringify(wanKey),
        'process.env.LUMA_API_KEY': JSON.stringify(lumaKey),
        'process.env.BRAVE_SEARCH_API_KEY': JSON.stringify(braveSearchKey),
        'process.env.BRAVE_PROXY_URL': JSON.stringify(braveProxyUrl),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
        'process.env.FORCE_DEMO_MODE': JSON.stringify(forceDemoMode),
        'process.env.USE_FALLBACK_MODE': JSON.stringify(useFallbackMode),
        // Also expose via import.meta.env for better client-side access
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
        'import.meta.env.VITE_FORCE_DEMO_MODE': JSON.stringify(forceDemoMode),
        'import.meta.env.VITE_USE_FALLBACK_MODE': JSON.stringify(useFallbackMode),
        'import.meta.env.VITE_BRAVE_PROXY_URL': JSON.stringify(braveProxyUrl),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
        exclude: ['@dimforge/rapier3d', '@mkkellogg/gaussian-splats-3d'],
      },
    };
});
