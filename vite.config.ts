import { defineConfig, loadEnv, type Plugin } from 'vite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
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
    // FLUX_API_KEY removed - using free Pollinations for FLUX models
    const togetherKey = process.env.TOGETHER_AI_API_KEY || env.TOGETHER_AI_API_KEY || '';
    const wanKey = process.env.WAN_API_KEY || env.WAN_API_KEY || '';
    const lumaKey = process.env.LUMA_API_KEY || env.LUMA_API_KEY || '';
    const braveSearchKey = process.env.BRAVE_SEARCH_API_KEY || env.BRAVE_SEARCH_API_KEY || '';
    const braveProxyUrl = process.env.BRAVE_PROXY_URL || env.BRAVE_PROXY_URL || '/api/brave-proxy';

    // HunyuanWorld configuration
    const hunyuanApiUrl = process.env.VITE_HUNYUAN_API_URL || env.VITE_HUNYUAN_API_URL || 'https://api.hunyuan-3d.com';
    const hunyuanApiKey = process.env.HUNYUAN_API_KEY || env.HUNYUAN_API_KEY || '';

    // Video and audio generation APIs
    const kieApiKey = process.env.VITE_KIE_API_KEY || env.VITE_KIE_API_KEY || '';
    const segmindApiKey = process.env.VITE_SEGMIND_API_KEY || env.VITE_SEGMIND_API_KEY || '';
    const vertexAiApiKey = process.env.VITE_VERTEX_AI_API_KEY || env.VITE_VERTEX_AI_API_KEY || '';

    // Supabase configuration
    // Trim all keys to remove any accidental whitespace or newlines that break WebSocket connections
    const supabaseUrl = (process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim();
    const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '').trim();

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
            manualChunks: (id) => {
              // Vendor chunks
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                  return 'react-vendor';
                }
                if (id.includes('framer-motion') || id.includes('@radix-ui')) {
                  return 'ui-vendor';
                }
                if (id.includes('three') || id.includes('@react-three') || id.includes('gaussian')) {
                  return 'three-vendor';
                }
                if (id.includes('supabase')) {
                  return 'supabase-vendor';
                }
                if (id.includes('recharts')) {
                  return 'recharts-vendor';
                }
                if (id.includes('d3')) {
                  return 'd3-vendor';
                }
                if (id.includes('ffmpeg')) {
                  return 'ffmpeg-vendor';
                }
              }
              // Service chunks - keep core services together
              if (id.includes('/services/')) {
                if (id.includes('aiService') || id.includes('directorKnowledge')) {
                  return 'ai-services';
                }
                if (id.includes('supabase') || id.includes('characterIdentity')) {
                  return 'data-services';
                }
                if (id.includes('wanService') || id.includes('fluxService') || id.includes('lumaService') || id.includes('hunyuanWorld')) {
                  return 'generation-services';
                }
              }
            },
          },
        },
        chunkSizeWarningLimit: 800,
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
        // FLUX_API_KEY removed - using free Pollinations
        'process.env.TOGETHER_AI_API_KEY': JSON.stringify(togetherKey),
        'process.env.WAN_API_KEY': JSON.stringify(wanKey),
        'process.env.LUMA_API_KEY': JSON.stringify(lumaKey),
        'process.env.BRAVE_SEARCH_API_KEY': JSON.stringify(braveSearchKey),
        'process.env.BRAVE_PROXY_URL': JSON.stringify(braveProxyUrl),
        'process.env.HUNYUAN_API_KEY': JSON.stringify(hunyuanApiKey),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
        'process.env.FORCE_DEMO_MODE': JSON.stringify(forceDemoMode),
        'process.env.USE_FALLBACK_MODE': JSON.stringify(useFallbackMode),
        // Also expose via import.meta.env for better client-side access
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
        'import.meta.env.VITE_TOGETHER_AI_API_KEY': JSON.stringify(togetherKey),
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
        'import.meta.env.VITE_FORCE_DEMO_MODE': JSON.stringify(forceDemoMode),
        'import.meta.env.VITE_USE_FALLBACK_MODE': JSON.stringify(useFallbackMode),
        'import.meta.env.VITE_BRAVE_PROXY_URL': JSON.stringify(braveProxyUrl),
        'import.meta.env.VITE_HUNYUAN_API_URL': JSON.stringify(hunyuanApiUrl),
        'import.meta.env.VITE_WAN_API_KEY': JSON.stringify(wanKey),
        'import.meta.env.WAN_API_KEY': JSON.stringify(wanKey),
        'import.meta.env.VITE_KIE_API_KEY': JSON.stringify(kieApiKey),
        'import.meta.env.VITE_SEGMIND_API_KEY': JSON.stringify(segmindApiKey),
        'import.meta.env.VITE_VERTEX_AI_API_KEY': JSON.stringify(vertexAiApiKey),
      },
      resolve: {
        alias: {
          '@': dirname(fileURLToPath(import.meta.url)),
        }
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
        exclude: ['@dimforge/rapier3d', '@mkkellogg/gaussian-splats-3d'],
      },
    };
});
