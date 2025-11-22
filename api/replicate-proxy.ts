/**
 * Vercel Serverless Function - Replicate API Proxy for Emu3-Gen
 *
 * Proxies requests to Replicate AI API to avoid CORS issues in the browser.
 * This function runs server-side and can safely make cross-origin requests.
 *
 * Replicate Model: baaivision/emu3-gen
 * Docs: https://replicate.com/baaivision/emu3-gen
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const REPLICATE_API_BASE_URL = 'https://api.replicate.com/v1'
const EMU_MODEL_VERSION = 'baaivision/emu3-gen'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST method for the actual proxy
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get API key from environment
  const apiKey = process.env.REPLICATE_API_TOKEN
  if (!apiKey) {
    console.error('REPLICATE_API_TOKEN not found in environment')
    return res.status(500).json({
      error: 'World generation requires a Replicate API key to be configured on the server.',
    })
  }

  try {
    const { action, payload } = req.body || {}

    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' })
    }

    // Handle different actions
    switch (action) {
      case 'create_prediction':
        return await createPrediction(apiKey, payload, res)

      case 'get_prediction':
        return await getPrediction(apiKey, payload.predictionId, res)

      case 'cancel_prediction':
        return await cancelPrediction(apiKey, payload.predictionId, res)

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` })
    }
  } catch (error) {
    console.error('Replicate API proxy error:', error)
    return res.status(500).json({
      error: 'Failed to proxy request to Replicate API',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

async function createPrediction(apiKey: string, payload: any, res: VercelResponse) {
  const url = `${REPLICATE_API_BASE_URL}/predictions`

  const body: Record<string, any> = {
    version: payload.version || EMU_MODEL_VERSION,
    input: payload.input || {},
  }

  if (payload.webhook) {
    body.webhook = payload.webhook
    body.webhook_events_filter = ['completed']
  }

  console.log('Creating Replicate prediction:', { model: body.version, input: body.input })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'wait', // Wait for result if possible
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  console.log('Replicate prediction created:', {
    id: data.id,
    status: data.status,
  })

  return res.status(response.status).json(data)
}

async function getPrediction(apiKey: string, predictionId: string, res: VercelResponse) {
  if (!predictionId) {
    return res.status(400).json({ error: 'Missing predictionId' })
  }

  const url = `${REPLICATE_API_BASE_URL}/predictions/${predictionId}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()

  return res.status(response.status).json(data)
}

async function cancelPrediction(apiKey: string, predictionId: string, res: VercelResponse) {
  if (!predictionId) {
    return res.status(400).json({ error: 'Missing predictionId' })
  }

  const url = `${REPLICATE_API_BASE_URL}/predictions/${predictionId}/cancel`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()

  return res.status(response.status).json(data)
}
