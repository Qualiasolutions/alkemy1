/**
 * TTM API Proxy for Vercel
 * 
 * This proxy forwards TTM requests to the external GPU server
 * since Vercel Functions cannot run the PyTorch TTM model directly.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// TTM server URL - should be configured in environment variables
const TTM_SERVER_URL = process.env.TTM_SERVER_URL || 'http://localhost:8100';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Check if TTM server is configured
        if (!TTM_SERVER_URL || TTM_SERVER_URL === 'http://localhost:8100') {
            return res.status(503).json({
                error: 'TTM server not configured',
                message: 'Set TTM_SERVER_URL environment variable',
                status: 'unavailable'
            });
        }

        // Build target URL
        const reqUrl = req.url || '';
        const ttmPath = reqUrl.replace('/api/ttm', '') || '/';
        const url = `${TTM_SERVER_URL}/api/ttm${ttmPath}`;
        
        console.log('[TTM Proxy] Forwarding request:', {
            method: req.method,
            url,
            hasBody: !!req.body
        });

        // Prepare request options
        const options: RequestInit = {
            method: req.method,
            headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
                'User-Agent': 'Alkemy-TTM-Proxy/1.0'
            }
        };

        // Handle request body for POST/PUT requests
        if (req.method && ['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
            if (req.headers['content-type']?.includes('multipart/form-data')) {
                // For form data, we need to reconstruct the FormData
                // This is complex in serverless environments, so we'll proxy as-is
                options.body = req.body as any;
            } else {
                options.body = JSON.stringify(req.body);
            }
        }

        // Make request to TTM server
        const response = await fetch(url, options);
        
        // Handle response
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[TTM Proxy] Server error:', {
                status: response.status,
                statusText: response.statusText,
                errorText
            });
            
            return res.status(response.status).json({
                error: 'TTM server error',
                status: response.status,
                message: errorText
            });
        }

        // Get response content type
        const contentType = response.headers.get('content-type');
        
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        // Handle different response types
        if (contentType?.includes('application/json')) {
            const data = await response.json();
            return res.status(response.status).json(data);
        } else if (contentType?.includes('video/')) {
            // For video downloads, stream the response
            const buffer = await response.arrayBuffer();
            return res.status(response.status).send(Buffer.from(buffer));
        } else {
            const text = await response.text();
            return res.status(response.status).send(text);
        }

    } catch (error) {
        console.error('[TTM Proxy] Error:', error);
        
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
            status: 'error'
        });
    }
}
