import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * FrameSet.app Proxy
 *
 * This serverless function proxies requests to FrameSet.app to avoid CORS issues.
 * FrameSet.app is a specialized search engine for film frames and movie screenshots.
 */
const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Requested-With'

const applyCors = (req: VercelRequest, res: VercelResponse) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS)
  res.setHeader('Access-Control-Max-Age', '86400')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const { url } = req.query

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: url',
      })
    }

    // Validate that the URL is from frameset.app to prevent open redirect attacks
    if (!url.includes('frameset.app') && !url.includes('frameset.app/search')) {
      return res.status(400).json({
        error: 'Invalid URL: Only frameset.app URLs are allowed',
      })
    }

    // Make request to FrameSet.app
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'Mozilla/5.0 (compatible; Alkemy-AI-Studio/1.0; +https://alkemy.ai)',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('FrameSet.app API error:', response.status, errorText)
      return res.status(response.status).json({
        error: `FrameSet.app error: ${response.status} ${response.statusText}`,
        details: errorText,
      })
    }

    // Return the HTML content for parsing by the client
    const contentType = response.headers.get('content-type') || 'text/html'
    res.setHeader('Content-Type', contentType)

    const data = await response.text()
    res.status(200).send(data)
  } catch (error) {
    console.error('FrameSet proxy error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
