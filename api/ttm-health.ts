/**
 * TTM Service Health Check Endpoint
 * 
 * Verifies that TTM_API_URL is properly configured and accessible.
 * This allows the UI to show warnings if the TTM service is unavailable.
 *
 * Usage: GET /api/ttm-health
 * Returns: { status: 'ok' | 'error' | 'unavailable', services: { ttm: boolean }, message?: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({
            status: 'error',
            message: 'Method not allowed. Use GET.'
        });
    }

    try {
        // Check if TTM server URL is configured
        const ttmServerUrl = process.env.TTM_SERVER_URL;
        if (!ttmServerUrl || ttmServerUrl === 'http://localhost:8100') {
            return res.status(200).json({
                status: 'unavailable',
                services: {
                    ttm: false,
                },
                message: 'TTM_SERVER_URL not configured. Motion generation will not work.',
                timestamp: new Date().toISOString(),
                setupInstructions: {
                    step1: 'Deploy TTM API to Railway, RunPod, Modal, or self-hosted server',
                    step2: 'Set TTM_SERVER_URL environment variable in Vercel',
                    step3: 'Redeploy Vercel application'
                }
            });
        }

        // Test connectivity to TTM server
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
            const response = await fetch(`${ttmServerUrl}/`, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Alkemy-TTM-Health-Check/1.0'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                return res.status(200).json({
                    status: 'error',
                    services: {
                        ttm: false,
                    },
                    message: `TTM server returned status ${response.status}`,
                    serverUrl: ttmServerUrl,
                    timestamp: new Date().toISOString(),
                });
            }

            const data = await response.json();
            const isPipelineLoaded = data.pipeline_loaded === true;
            
            return res.status(200).json({
                status: isPipelineLoaded ? 'ok' : 'degraded',
                services: {
                    ttm: isPipelineLoaded,
                },
                message: isPipelineLoaded
                    ? 'TTM service is fully operational'
                    : 'TTM server is running but model not loaded',
                serverUrl: ttmServerUrl,
                serverInfo: {
                    device: data.device,
                    pipeline_loaded: data.pipeline_loaded,
                    supabase_configured: data.supabase_configured,
                },
                timestamp: new Date().toISOString(),
            });

        } catch (fetchError) {
            clearTimeout(timeoutId);
            
            let errorMessage = 'Failed to connect to TTM server';
            if (fetchError.name === 'AbortError') {
                errorMessage = 'TTM server connection timeout';
            } else if (fetchError.code === 'ECONNREFUSED') {
                errorMessage = 'TTM server connection refused';
            }

            return res.status(200).json({
                status: 'error',
                services: {
                    ttm: false,
                },
                message: errorMessage,
                serverUrl: ttmServerUrl,
                error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            });
        }

    } catch (error) {
        console.error('[TTM Health Check] Error:', error);
        
        return res.status(500).json({
            status: 'error',
            services: {
                ttm: false,
            },
            message: 'Health check failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        });
    }
}
