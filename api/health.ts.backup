/**
 * Health Check Endpoint for LoRA Character Identity Service
 *
 * Verifies that FAL_API_KEY is properly configured on the server.
 * This allows the UI to show warnings if the API key is missing.
 *
 * Usage: GET /api/health
 * Returns: { status: 'ok' | 'error', services: { fal: boolean }, message?: string }
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

    // Check if FAL_API_KEY is configured
    const falApiKey = process.env.FAL_API_KEY;
    const hasFalKey = !!falApiKey && falApiKey.length > 0;

    // Return health status
    const status = hasFalKey ? 'ok' : 'degraded';

    res.status(200).json({
        status,
        services: {
            fal: hasFalKey,
        },
        message: hasFalKey
            ? 'All services configured'
            : 'FAL_API_KEY not configured. Character Identity training will not work.',
        timestamp: new Date().toISOString(),
    });
}
