import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Brave Search API Proxy
 *
 * This serverless function proxies requests to Brave Search API to avoid CORS issues.
 * The Brave API key is stored securely in Vercel environment variables.
 */
const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Requested-With';

const applyCors = (req: VercelRequest, res: VercelResponse) => {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    res.setHeader('Access-Control-Max-Age', '86400');
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { query, count = 4, safesearch = 'strict' } = req.query;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                error: 'Missing required parameter: query'
            });
        }

        const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
        if (!BRAVE_API_KEY) {
            return res.status(500).json({
                error: 'Brave Search API key not configured'
            });
        }

        // Make request to Brave Search API
        const braveUrl = `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=${count}&safesearch=${safesearch}`;

        const response = await fetch(braveUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip',
                'X-Subscription-Token': BRAVE_API_KEY
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Brave API error:', response.status, errorText);
            return res.status(response.status).json({
                error: `Brave API error: ${response.status} ${response.statusText}`,
                details: errorText
            });
        }

        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        console.error('Brave proxy error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
