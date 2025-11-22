/**
 * Vercel Serverless Function - Image Proxy
 * Proxies image downloads to bypass CORS restrictions
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  try {
    console.log('[Image Proxy] Fetching:', url)

    const response = await fetch(url, {
      headers: {
        Accept: 'image/jpeg,image/png,image/webp,image/*',
        'User-Agent': 'Alkemy-Image-Proxy/1.0',
      },
    })

    if (!response.ok) {
      console.error('[Image Proxy] Fetch failed:', response.status)
      return res.status(response.status).json({
        error: `Failed to fetch image: ${response.statusText}`,
      })
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000')

    return res.status(200).send(Buffer.from(buffer))
  } catch (error) {
    console.error('[Image Proxy] Error:', error)
    return res.status(500).json({
      error: 'Failed to proxy image',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
