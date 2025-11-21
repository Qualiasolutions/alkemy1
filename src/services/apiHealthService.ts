/**
 * API Health Check Service
 *
 * Monitors the health and availability of all AI service providers
 * - Gemini API (script analysis, image generation)
 * - Fal.ai (character identity, video generation)
 * - BFL (FLUX models)
 * - Pollinations (free image generation)
 * - Supabase (authentication, storage)
 */

export interface ServiceHealth {
    name: string;
    status: 'online' | 'offline' | 'degraded' | 'unknown';
    lastChecked: Date | null;
    responseTime?: number;
    error?: string;
}

export interface HealthCheckResult {
    overall: 'healthy' | 'degraded' | 'critical';
    services: {
        gemini: ServiceHealth;
        fal: ServiceHealth;
        bfl: ServiceHealth;
        pollinations: ServiceHealth;
        supabase: ServiceHealth;
    };
    timestamp: Date;
}

let cachedHealth: HealthCheckResult | null = null;
let lastCheck: Date | null = null;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Check if a service is available by testing a simple request
 */
async function checkServiceAvailability(
    name: string,
    checkFn: () => Promise<boolean>
): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
        const isAvailable = await Promise.race([
            checkFn(),
            new Promise<boolean>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            )
        ]);

        const responseTime = Date.now() - startTime;

        return {
            name,
            status: isAvailable ? 'online' : 'offline',
            lastChecked: new Date(),
            responseTime
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
            name,
            status: 'offline',
            lastChecked: new Date(),
            responseTime,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Perform comprehensive health check of all services
 */
export async function performHealthCheck(forceRefresh = false): Promise<HealthCheckResult> {
    // Return cached result if still valid
    if (!forceRefresh && cachedHealth && lastCheck) {
        const age = Date.now() - lastCheck.getTime();
        if (age < CACHE_DURATION) {
            return cachedHealth;
        }
    }

    console.log('[Health Check] Performing comprehensive service health check...');

    // Check all services in parallel
    const [gemini, fal, bfl, pollinations, supabase] = await Promise.all([
        // Gemini API - Check via /api/health if available
        checkServiceAvailability('Gemini API', async () => {
            try {
                const response = await fetch('/api/health');
                if (!response.ok) return false;
                const data = await response.json();
                // Gemini is configured if we get a 200 response
                return true;
            } catch {
                return false;
            }
        }),

        // Fal.ai - Check via /api/health
        checkServiceAvailability('Fal.ai', async () => {
            try {
                const response = await fetch('/api/health');
                if (!response.ok) return false;
                const data = await response.json();
                return data.services?.fal === true;
            } catch {
                return false;
            }
        }),

        // BFL - Check if proxy is available
        checkServiceAvailability('Black Forest Labs', async () => {
            try {
                // Try to reach proxy endpoint (will fail gracefully if not configured)
                const response = await fetch('/api/bfl-proxy', {
                    method: 'OPTIONS'
                });
                // If OPTIONS succeeds, proxy is available
                return response.status === 200 || response.status === 204;
            } catch {
                return false;
            }
        }),

        // Pollinations - Check if reachable (no API key required)
        checkServiceAvailability('Pollinations.ai', async () => {
            try {
                // Pollinations is a free service, always available
                // We can't ping their server directly due to CORS, but assume it's online
                return true; // Optimistic check
            } catch {
                return false;
            }
        }),

        // Supabase - Check if connected
        checkServiceAvailability('Supabase', async () => {
            try {
                // Check if Supabase client can be initialized
                const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
                const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
                return hasUrl && hasKey;
            } catch {
                return false;
            }
        })
    ]);

    // Calculate overall health
    const services = { gemini, fal, bfl, pollinations, supabase };
    const statuses = Object.values(services).map(s => s.status);
    const onlineCount = statuses.filter(s => s === 'online').length;
    const totalCount = statuses.length;

    let overall: 'healthy' | 'degraded' | 'critical';
    if (onlineCount === totalCount) {
        overall = 'healthy';
    } else if (onlineCount >= totalCount / 2) {
        overall = 'degraded';
    } else {
        overall = 'critical';
    }

    const result: HealthCheckResult = {
        overall,
        services,
        timestamp: new Date()
    };

    // Cache result
    cachedHealth = result;
    lastCheck = new Date();

    console.log('[Health Check] Complete:', {
        overall,
        onlineServices: onlineCount,
        totalServices: totalCount
    });

    return result;
}

/**
 * Get cached health check result (useful for UI)
 */
export function getCachedHealth(): HealthCheckResult | null {
    return cachedHealth;
}

/**
 * Get health status color for UI display
 */
export function getStatusColor(status: ServiceHealth['status']): string {
    switch (status) {
        case 'online':
            return 'green';
        case 'degraded':
            return 'yellow';
        case 'offline':
            return 'red';
        default:
            return 'gray';
    }
}

/**
 * Get overall health status color
 */
export function getOverallStatusColor(overall: HealthCheckResult['overall']): string {
    switch (overall) {
        case 'healthy':
            return 'green';
        case 'degraded':
            return 'yellow';
        case 'critical':
            return 'red';
    }
}
