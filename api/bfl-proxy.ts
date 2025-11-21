/**
 * Vercel Serverless Function - Black Forest Labs API Proxy
 *
 * Proxies requests to BFL API (api.bfl.ml) to avoid CORS issues in the browser.
 * This function runs server-side and can safely make cross-origin requests.
 *
 * Supports:
 * - FLUX Pro 1.1
 * - FLUX Pro
 * - FLUX Dev
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const BFL_API_BASE_URL = 'https://api.bfl.ml/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Key');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Get API key from environment
    const apiKey = process.env.BFL_API_KEY || process.env.VITE_BFL_API_KEY;
    if (!apiKey) {
        console.error('[BFL Proxy] BFL_API_KEY not found in environment');
        return res.status(500).json({
            error: 'Black Forest Labs API requires an API key to be configured on the server.'
        });
    }

    try {
        const { endpoint, method = 'POST', body } = req.body || {};

        // Validate endpoint
        if (!endpoint || typeof endpoint !== 'string') {
            console.error('[BFL Proxy] Invalid endpoint:', endpoint);
            return res.status(400).json({ error: 'Missing or invalid endpoint parameter' });
        }

        // Construct full URL
        const url = `${BFL_API_BASE_URL}${endpoint}`;

        console.log('[BFL Proxy] Proxying request to BFL API:', {
            url,
            method,
            hasBody: !!body,
            timestamp: new Date().toISOString()
        });

        // Make request to BFL API
        const fetchOptions: RequestInit = {
            method: method,
            headers: {
                'X-Key': apiKey,
                'Content-Type': 'application/json',
            }
        };

        // Only add body for POST/PUT/PATCH requests
        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            fetchOptions.body = JSON.stringify(body);
        }

        const bflResponse = await fetch(url, fetchOptions);

        // Get response data
        const data = await bflResponse.json().catch(() => ({}));

        console.log('[BFL Proxy] BFL API response:', {
            status: bflResponse.status,
            ok: bflResponse.ok,
            hasData: !!data,
            timestamp: new Date().toISOString()
        });

        // Return response with same status code
        return res.status(bflResponse.status).json(data);

    } catch (error) {
        console.error('[BFL Proxy] API proxy error:', error);
        return res.status(500).json({
            error: 'Failed to proxy request to BFL API',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
