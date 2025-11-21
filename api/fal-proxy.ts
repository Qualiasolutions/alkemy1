/**
 * Vercel Serverless Function - Fal.ai API Proxy
 *
 * Proxies requests to Fal.ai Instant Character API to avoid CORS issues in the browser.
 * This function runs server-side and can safely make cross-origin requests.
 *
 * Epic 2 - Character Identity Consistency System
 * Story 2.1 - Character Identity Training/Preparation Workflow
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const FAL_API_BASE_URL = 'https://fal.run';

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

    // Get API key from environment with sanitization
    const apiKey = (process.env.FAL_API_KEY || process.env.VITE_FAL_API_KEY || '').trim().replace(/\n/g, '');
    if (!apiKey) {
        console.error('[Fal Proxy] FAL_API_KEY not found in environment');
        return res.status(500).json({
            error: 'Character Identity requires a Fal.ai API key to be configured on the server.'
        });
    }

    try {
        const { endpoint, method = 'POST', body } = req.body || {};

        // Validate endpoint
        if (!endpoint || typeof endpoint !== 'string') {
            console.error('Invalid endpoint:', endpoint);
            return res.status(400).json({ error: 'Missing or invalid endpoint parameter' });
        }

        // Construct full URL
        const url = `${FAL_API_BASE_URL}${endpoint}`;

        console.log('Proxying request to Fal.ai API:', {
            url,
            method,
            hasBody: !!body
        });

        // Make request to Fal.ai API
        const fetchOptions: RequestInit = {
            method: method,
            headers: {
                'Authorization': `Key ${apiKey}`,
                'Content-Type': 'application/json',
            }
        };

        // Only add body for POST/PUT/PATCH requests
        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            fetchOptions.body = JSON.stringify(body);
        }

        const falResponse = await fetch(url, fetchOptions);

        // Get response data
        const data = await falResponse.json().catch(() => ({}));

        console.log('Fal.ai API response:', {
            status: falResponse.status,
            ok: falResponse.ok,
            hasData: !!data
        });

        // Return response with same status code
        return res.status(falResponse.status).json(data);

    } catch (error) {
        console.error('Fal.ai API proxy error:', error);
        return res.status(500).json({
            error: 'Failed to proxy request to Fal.ai API',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
