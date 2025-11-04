/**
 * Vercel Serverless Function - Luma API Proxy
 *
 * Proxies requests to Luma AI API to avoid CORS issues in the browser.
 * This function runs server-side and can safely make cross-origin requests.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const LUMA_API_BASE_URL = 'https://api.lumalabs.ai/dream-machine/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST method for the actual proxy
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment
    const apiKey = process.env.LUMA_API_KEY;
    if (!apiKey) {
        console.error('LUMA_API_KEY not found in environment');
        return res.status(500).json({
            error: '3D World Generation requires a Luma API key to be configured on the server.'
        });
    }

    try {
        const { endpoint, method = 'GET', body } = req.body || {};

        // Validate endpoint
        if (!endpoint || typeof endpoint !== 'string') {
            console.error('Invalid endpoint:', endpoint);
            return res.status(400).json({ error: 'Missing or invalid endpoint parameter' });
        }

        // Construct full URL
        const url = `${LUMA_API_BASE_URL}${endpoint}`;

        console.log('Proxying request to Luma API:', {
            url,
            method,
            hasBody: !!body
        });

        // Make request to Luma API
        const fetchOptions: RequestInit = {
            method: method,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            }
        };

        // Only add body for POST/PUT/PATCH requests
        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            fetchOptions.body = JSON.stringify(body);
        }

        const lumaResponse = await fetch(url, fetchOptions);

        // Get response data
        const data = await lumaResponse.json().catch(() => ({}));

        console.log('Luma API response:', {
            status: lumaResponse.status,
            ok: lumaResponse.ok,
            hasData: !!data
        });

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
