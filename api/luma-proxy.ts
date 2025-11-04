/**
 * Vercel Serverless Function - Luma API Proxy
 *
 * Proxies requests to Luma AI API to avoid CORS issues in the browser.
 * This function runs server-side and can safely make cross-origin requests.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const LUMA_API_BASE_URL = 'https://api.lumalabs.ai/dream-machine/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST and GET methods
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment
    const apiKey = process.env.LUMA_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            error: '3D World Generation requires a Luma API key to be configured on the server.'
        });
    }

    try {
        const { endpoint, method = 'GET', body } = req.body || {};

        // Validate endpoint
        if (!endpoint || typeof endpoint !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid endpoint parameter' });
        }

        // Construct full URL
        const url = `${LUMA_API_BASE_URL}${endpoint}`;

        // Make request to Luma API
        const lumaResponse = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            ...(body && { body: JSON.stringify(body) })
        });

        // Get response data
        const data = await lumaResponse.json().catch(() => ({}));

        // Return response with same status code
        return res.status(lumaResponse.status).json(data);

    } catch (error) {
        console.error('Luma API proxy error:', error);
        return res.status(500).json({
            error: 'Failed to proxy request to Luma API',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
