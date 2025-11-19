# Vercel Deployment Guide

## Deployment Architecture Overview

Alkemy AI Studio V2.0 is designed for seamless deployment on Vercel's serverless platform. The application leverages Vercel's Edge Network, automatic scaling, and integrated CI/CD capabilities for production-grade performance.

### Deployment Architecture

```
Vercel Platform/
├── Edge Functions/
│   ├── API Proxies (CORS handling)
│   ├── Auth callbacks
│   └── Dynamic routes
├── Static Assets/
│   ├── React SPA
│   ├── Static images/media
│   └── Client-side JavaScript
├── Serverless Functions/
│   ├── Image search proxy
│   ├── API key management
│   └── External service integration
└── Infrastructure/
    ├── Environment variables
    ├── Domain configuration
    └── Build optimization
```

## Vercel Configuration

### vercel.json Configuration

```json
{
  "version": 2,
  "name": "alkemy-ai-studio",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "api/**/*.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "rewrites": [
    {
      "source": "/api/brave-proxy",
      "destination": "/api/brave-proxy.ts"
    },
    {
      "source": "/api/auth/callback",
      "destination": "/api/auth/callback.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        },
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate=300"
        }
      ]
    },
    {
      "source": "/(.*)\\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|avif|woff|woff2)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "VITE_GEMINI_API_KEY": "@gemini_api_key",
    "VITE_FAL_API_KEY": "@fal_api_key"
  },
  "build": {
    "env": {
      "VITE_SUPABASE_URL": "@supabase_url",
      "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key",
      "VITE_GEMINI_API_KEY": "@gemini_api_key",
      "VITE_FAL_API_KEY": "@fal_api_key"
    }
  },
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "framework": "vite"
}
```

### Vite Configuration for Vercel

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          utils: ['clsx', 'tailwind-merge'],
          three: ['three', '@react-three/fiber', '@react-three/drei']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  define: {
    // Environment variables that should be available at build time
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
});
```

## Environment Configuration

### Environment Variables Setup

#### Production Environment Variables

```bash
# Core AI Services
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Service API Keys
VITE_GEMINI_API_KEY=your_google_gemini_api_key
VITE_FAL_API_KEY=your_fal_ai_api_key
VITE_BRAVE_SEARCH_API_KEY=your_brave_search_api_key

# Optional Services
VITE_LUMA_API_KEY=your_luma_api_key
VITE_FLUX_API_KEY=your_flux_api_key

# Application Configuration
VITE_APP_ENV=production
VITE_APP_VERSION=2.0.0
VITE_ENABLE_ANALYTICS=true
VITE_LOG_LEVEL=warn

# Feature Flags
VITE_ENABLE_VOICE_FEATURES=true
VITE_ENABLE_3D_WORLDS=true
VITE_ENABLE_ADVANCED_ANALYTICS=true
```

#### Development Environment Variables (.env.local)

```bash
# Development overrides
VITE_APP_ENV=development
VITE_LOG_LEVEL=debug
VITE_ENABLE_ANALYTICS=false

# Development API endpoints
VITE_API_BASE_URL=http://localhost:3000

# Debug flags
VITE_DEBUG_AI_SERVICES=false
VITE_DEBUG_RENDERING=false
VITE_DEBUG_PERFORMANCE=false
```

### Environment Variable Management

```typescript
// src/config/env.ts
interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  ai: {
    gemini: {
      apiKey: string;
      models: {
        text: string;
        vision: string;
      };
    };
    fal: {
      apiKey: string;
      endpoint: string;
    };
    brave: {
      apiKey: string;
      endpoint: string;
    };
  };
  app: {
    env: 'development' | 'staging' | 'production';
    version: string;
    buildDate: string;
    debug: boolean;
  };
  features: {
    voice: boolean;
    threeD: boolean;
    analytics: boolean;
  };
}

function getEnvConfig(): EnvConfig {
  return {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    },
    ai: {
      gemini: {
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
        models: {
          text: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-pro',
          vision: import.meta.env.VITE_GEMINI_VISION_MODEL || 'gemini-2.5-flash-002'
        }
      },
      fal: {
        apiKey: import.meta.env.VITE_FAL_API_KEY,
        endpoint: import.meta.env.VITE_FAL_ENDPOINT || 'https://fal.run'
      },
      brave: {
        apiKey: import.meta.env.VITE_BRAVE_SEARCH_API_KEY,
        endpoint: import.meta.env.VITE_BRAVE_ENDPOINT || 'https://api.search.brave.com'
      }
    },
    app: {
      env: import.meta.env.VITE_APP_ENV as 'development' | 'staging' | 'production',
      version: import.meta.env.VITE_APP_VERSION || '2.0.0',
      buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),
      debug: import.meta.env.VITE_APP_ENV === 'development'
    },
    features: {
      voice: import.meta.env.VITE_ENABLE_VOICE_FEATURES === 'true',
      threeD: import.meta.env.VITE_ENABLE_3D_WORLDS === 'true',
      analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
    }
  };
}

// Validate required environment variables
function validateEnvConfig(config: EnvConfig): void {
  const requiredVars = [
    ['supabase.url', config.supabase.url],
    ['supabase.anonKey', config.supabase.anonKey],
    ['ai.gemini.apiKey', config.ai.gemini.apiKey],
    ['ai.fal.apiKey', config.ai.fal.apiKey]
  ];

  const missing = requiredVars.filter(([key, value]) => !value);

  if (missing.length > 0) {
    const missingVars = missing.map(([key]) => key).join(', ');
    throw new Error(`Missing required environment variables: ${missingVars}`);
  }
}

export const envConfig = getEnvConfig();
validateEnvConfig(envConfig);
```

## Deployment Workflow

### Automated Deployment Pipeline

#### GitHub Actions for Vercel Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run type checking
        run: npm run type-check

      - name: Build application
        run: npm run build
        env:
          VITE_APP_ENV: production
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          VITE_FAL_API_KEY: ${{ secrets.FAL_API_KEY }}

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel env pull .env.production --environment=production
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Deploy Preview for PR
        if: github.event_name == 'pull_request'
        run: vercel --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Manual Deployment Commands

#### Development Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

#### Environment Management

```bash
# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add GEMINI_API_KEY
vercel env add FAL_API_KEY

# List environment variables
vercel env ls

# Pull environment variables to local
vercel env pull .env.local

# Remove environment variable
vercel env rm VARIABLE_NAME
```

## API Integration on Vercel

### Serverless Functions

#### Image Search Proxy

```typescript
// api/brave-proxy.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
const BRAVE_API_ENDPOINT = 'https://api.search.brave.com/res/v1/images/search';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, count = 20, offset = 0 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // Make request to Brave Search API
    const searchUrl = new URL(BRAVE_API_ENDPOINT);
    searchUrl.searchParams.set('q', q);
    searchUrl.searchParams.set('count', count.toString());
    searchUrl.searchParams.set('offset', offset.toString());
    searchUrl.searchParams.set('safesearch', 'moderate');
    searchUrl.searchParams.set('country', 'us');
    searchUrl.searchParams.set('search_lang', 'en');

    const response = await fetch(searchUrl.toString(), {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_API_KEY!
      }
    });

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform and cache results
    const transformedResults = data.results?.map((result: any) => ({
      id: createHash('md5').update(result.url).digest('hex'),
      title: result.title,
      url: result.url,
      thumbnail: result.properties?.thumbnail?.src,
      width: result.properties?.thumbnail?.width,
      height: result.properties?.thumbnail?.height,
      source: result.source
    })) || [];

    // Cache response for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

    return res.status(200).json({
      results: transformedResults,
      total: data.web?.results?.length || 0,
      query: q
    });

  } catch (error) {
    console.error('Brave proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

#### Auth Callback Handler

```typescript
// api/auth/callback.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return res.status(400).json({ error: 'Invalid authorization code' });
    }

    // Redirect to app with session
    const redirectUrl = `${process.env.APP_URL}/auth/callback?session=${encodeURIComponent(JSON.stringify(data.session))}`;

    return res.redirect(302, redirectUrl);

  } catch (error) {
    console.error('Auth callback error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Edge Functions for Performance

```typescript
// api/edge/config.ts
import { defineEdgeFunction } from '@vercel/edge';

export const config = {
  runtime: 'edge',
  regions: ['iad1', 'sfo1', 'hnd1'] // Multiple regions for global distribution
};

export default defineEdgeFunction(async (request: Request) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle different edge routes
  switch (path) {
    case '/api/edge/config':
      return handleConfigRequest(request);
    case '/api/edge/health':
      return handleHealthCheck();
    default:
      return new Response('Not Found', { status: 404 });
  }
});

async function handleConfigRequest(request: Request): Promise<Response> {
  // Return client configuration
  const config = {
    apiEndpoints: {
      ai: '/api/ai',
      images: '/api/brave-proxy',
      auth: '/api/auth'
    },
    features: {
      voice: process.env.ENABLE_VOICE_FEATURES === 'true',
      threeD: process.env.ENABLE_3D_WORLDS === 'true',
      analytics: process.env.ENABLE_ANALYTICS === 'true'
    },
    limits: {
      maxImageSize: 10 * 1024 * 1024, // 10MB
      maxVideoSize: 100 * 1024 * 1024, // 100MB
      maxGenerationRequests: 100 // per hour
    }
  };

  return new Response(JSON.stringify(config), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300' // 5 minutes
    }
  });
}

async function handleHealthCheck(): Promise<Response> {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    region: process.env.VERCEL_REGION || 'unknown'
  };

  return new Response(JSON.stringify(health), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
```

## Performance Optimization

### Build Optimization

#### Bundle Analysis and Optimization

```typescript
// vite.config.ts (continued)
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true
      },
      mangle: {
        keep_classnames: true,
        keep_fnames: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI components
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast'
          ],

          // Styling and utilities
          'style-vendor': [
            'clsx',
            'tailwind-merge',
            'class-variance-authority'
          ],

          // Three.js and 3D libraries
          'three-vendor': [
            'three',
            '@react-three/fiber',
            '@react-three/drei',
            '@react-three/postprocessing'
          ],

          // Media processing
          'media-vendor': [
            '@ffmpeg/ffmpeg',
            '@ffmpeg/util'
          ],

          // Charts and analytics
          'chart-vendor': [
            'recharts',
            'date-fns'
          ],

          // Supabase and database
          'db-vendor': [
            '@supabase/supabase-js',
            '@supabase/auth-helpers-react'
          ]
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'three',
      '@react-three/fiber'
    ]
  }
});
```

### Caching Strategy

#### Multi-Level Caching

```typescript
// src/utils/cache.ts
interface CacheConfig {
  ttl: number;
  staleWhileRevalidate?: number;
  maxAge?: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private subscriptions = new Map<string, Set<() => void>>();

  interface CacheEntry {
    data: any;
    timestamp: number;
    ttl: number;
    staleWhileRevalidate?: number;
  }

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // Return fresh cache
    if (cached && now < cached.timestamp + cached.ttl) {
      return cached.data;
    }

    // Return stale cache while revalidating
    if (cached && config.staleWhileRevalidate &&
        now < cached.timestamp + cached.ttl + config.staleWhileRevalidate) {
      // Background revalidation
      this.backgroundRevalidate(key, fetcher, config);
      return cached.data;
    }

    // Fetch fresh data
    const data = await fetcher();
    this.set(key, data, config);
    return data;
  }

  private async backgroundRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<void> {
    try {
      const data = await fetcher();
      this.set(key, data, config);
      this.notifySubscribers(key);
    } catch (error) {
      console.warn('Background revalidation failed:', error);
    }
  }

  private set<T>(key: string, data: T, config: CacheConfig): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: config.ttl,
      staleWhileRevalidate: config.staleWhileRevalidate
    });
  }

  subscribe(key: string, callback: () => void): () => void {
    const subscribers = this.subscriptions.get(key) || new Set();
    subscribers.add(callback);
    this.subscriptions.set(key, subscribers);

    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscriptions.delete(key);
      }
    };
  }

  private notifySubscribers(key: string): void {
    const subscribers = this.subscriptions.get(key);
    if (subscribers) {
      subscribers.forEach(callback => callback());
    }
  }
}

// API-specific cache configurations
export const cacheConfigs = {
  user: { ttl: 5 * 60 * 1000, staleWhileRevalidate: 10 * 60 * 1000 }, // 5 min, 10 min SWR
  project: { ttl: 10 * 60 * 1000, staleWhileRevalidate: 20 * 60 * 1000 }, // 10 min, 20 min SWR
  images: { ttl: 60 * 60 * 1000, staleWhileRevalidate: 120 * 60 * 1000 }, // 1 hour, 2 hours SWR
  config: { ttl: 15 * 60 * 1000, staleWhileRevalidate: 30 * 60 * 1000 }, // 15 min, 30 min SWR
};
```

## Monitoring and Analytics

### Vercel Analytics Integration

```typescript
// src/utils/analytics.ts
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

class AnalyticsManager {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private flushInterval: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
  }

  track(name: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.getUserId()
    };

    this.events.push(event);

    // Flush immediately for critical events
    if (this.isCriticalEvent(name)) {
      this.flush();
    }
  }

  trackPageView(path: string): void {
    this.track('page_view', {
      path,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    });
  }

  trackGeneration(type: string, success: boolean, duration: number): void {
    this.track('generation', {
      type,
      success,
      duration,
      timestamp: Date.now()
    });
  }

  trackError(error: Error, context?: string): void {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    });
  }

  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events: eventsToSend })
      });
    } catch (error) {
      console.error('Failed to flush analytics:', error);
      // Re-add events if flush failed
      this.events.unshift(...eventsToSend);
    }
  }

  private startFlushTimer(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string | undefined {
    // Get user ID from auth context or local storage
    return localStorage.getItem('user_id') || undefined;
  }

  private isCriticalEvent(eventName: string): boolean {
    const criticalEvents = ['generation_error', 'auth_error', 'payment_error'];
    return criticalEvents.includes(eventName);
  }

  // Cleanup on page unload
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

export const analytics = new AnalyticsManager();

// Hook for React integration
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackGeneration: analytics.trackGeneration.bind(analytics),
    trackError: analytics.trackError.bind(analytics)
  };
}
```

### Error Tracking and Monitoring

```typescript
// src/utils/error-tracking.ts
interface ErrorReport {
  error: Error;
  context: ErrorContext;
  timestamp: number;
  userId?: string;
  sessionId: string;
  buildVersion?: string;
}

interface ErrorContext {
  component?: string;
  action?: string;
  route?: string;
  userAgent?: string;
  url?: string;
  additional?: Record<string, any>;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  trackError(error: Error, context: Partial<ErrorContext> = {}): void {
    const report: ErrorReport = {
      error,
      context: {
        component: context.component,
        action: context.action,
        route: window.location.pathname,
        userAgent: navigator.userAgent,
        url: window.location.href,
        additional: context.additional
      },
      timestamp: Date.now(),
      userId: this.getUserId(),
      sessionId: this.sessionId,
      buildVersion: import.meta.env.VITE_APP_VERSION
    };

    this.sendErrorReport(report);
  }

  trackAsyncError(
    promise: Promise<any>,
    context: Partial<ErrorContext> = {}
  ): Promise<any> {
    return promise.catch(error => {
      this.trackError(error, context);
      throw error;
    });
  }

  private async sendErrorReport(report: ErrorReport): Promise<void> {
    try {
      await fetch('/api/analytics/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        component: 'global',
        action: 'uncaught_error'
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        component: 'global',
        action: 'unhandled_promise_rejection'
      });
    });
  }

  private generateSessionId(): string {
    return `error_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string | undefined {
    return localStorage.getItem('user_id') || undefined;
  }
}

export const errorTracker = ErrorTracker.getInstance();

// React hook for error tracking
export function useErrorTracker() {
  return {
    trackError: errorTracker.trackError.bind(errorTracker),
    trackAsyncError: errorTracker.trackAsyncError.bind(errorTracker)
  };
}
```

## Security Configuration

### Security Headers and CSP

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-DNS-Prefetch-Control",
          "value": "on"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.supabase.co https://fal.run https://generativelanguage.googleapis.com; media-src 'self' blob:; worker-src 'self' blob:;"
        }
      ]
    }
  ]
}
```

### API Rate Limiting

```typescript
// api/utils/rate-limiter.ts
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: VercelRequest) => string;
}

class RateLimiter {
  private requests = new Map<string, number[]>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Cleanup old entries periodically
    setInterval(() => this.cleanup(), this.config.windowMs);
  }

  isAllowed(req: VercelRequest): boolean {
    const key = this.config.keyGenerator ? this.config.keyGenerator(req) : this.getDefaultKey(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this key
    let timestamps = this.requests.get(key) || [];

    // Remove old requests outside the window
    timestamps = timestamps.filter(timestamp => timestamp > windowStart);

    // Check if under the limit
    if (timestamps.length < this.config.maxRequests) {
      timestamps.push(now);
      this.requests.set(key, timestamps);
      return true;
    }

    return false;
  }

  private getDefaultKey(req: VercelRequest): string {
    // Use IP address as default key
    return req.headers['x-forwarded-for'] as string ||
           req.headers['x-real-ip'] as string ||
           'unknown';
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter(timestamp => timestamp > windowStart);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }
}

// Usage example
const imageSearchRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
  keyGenerator: (req) => req.headers['x-user-id'] as string || 'anonymous'
});
```

## Deployment Best Practices

### Pre-Deployment Checklist

```markdown
## Deployment Checklist

### Environment Setup
- [ ] All environment variables configured in Vercel dashboard
- [ ] Development environment variables pulled locally
- [ ] Database migrations applied to production
- [ ] Supabase RLS policies verified
- [ ] API keys validated and tested

### Build Process
- [ ] Application builds successfully (`npm run build`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] All tests pass (`npm test`)
- [ ] Bundle size analysis reviewed
- [ ] Performance budgets met

### Security Review
- [ ] No hardcoded secrets in code
- [ ] Environment variables are properly scoped
- [ ] CSP headers configured
- [ ] CORS policies are appropriate
- [ ] Rate limiting implemented

### Performance Optimization
- [ ] Images optimized and properly sized
- [ ] Code splitting implemented
- [ ] Caching strategies configured
- [ ] Service worker registered
- [ ] Bundle size optimized

### Functionality Testing
- [ ] Core user journeys tested
- [ ] AI service integrations working
- [ ] Authentication flow tested
- [ ] Error handling verified
- [ ] Responsive design checked

### Monitoring Setup
- [ ] Analytics configured
- [ ] Error tracking enabled
- [ ] Performance monitoring set up
- [ ] Uptime monitoring configured
- [ ] Alert thresholds set
```

### Rollback Strategy

```bash
# Rollback commands
vercel rollback                    # Rollback to previous deployment
vercel rollback [deployment-url]  # Rollback to specific deployment
vercel rollback --scope [scope]   # Rollback specific scope (prod/previews)

# View deployment history
vercel list                       # List recent deployments
vercel ls [project-name]          # List deployments for specific project

# Promote preview to production
vercel promote [preview-url]      # Promote preview deployment to production
```

---

**Document Version**: v2.0
**Last Updated**: 2025-11-19
**Related Documents**: [Environment Setup](./environment-setup.md), [API Integrations](./api-integrations.md), [Performance Optimization](../5-quality/performance-optimization.md)
**Next Review**: 2025-12-19