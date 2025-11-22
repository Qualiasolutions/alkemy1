/**
 * Comprehensive Health Check Endpoint for Alkemy AI Studio
 *
 * Verifies that all required services are properly configured:
 * - FAL_API_KEY (for Character Identity training)
 * - TTM_SERVER_URL (for motion-controlled video generation)
 *
 * Usage: GET /api/health
 * Returns: { status: 'ok' | 'degraded' | 'error', services: {...}, message?: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed. Use GET.',
    })
  }

  try {
    // Check FAL API key
    const falApiKey = process.env.FAL_API_KEY
    const hasFalKey = !!falApiKey && falApiKey.length > 0

    // Check TTM server URL
    const ttmServerUrl = process.env.TTM_SERVER_URL
    let ttmStatus = false
    let ttmInfo = null

    if (ttmServerUrl && ttmServerUrl !== 'http://localhost:8100') {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

        const response = await fetch(`${ttmServerUrl}/`, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Alkemy-Health-Check/1.0',
          },
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          ttmStatus = data.pipeline_loaded === true
          ttmInfo = {
            device: data.device,
            pipeline_loaded: data.pipeline_loaded,
            supabase_configured: data.supabase_configured,
          }
        }
      } catch (error) {
        console.warn('[Health Check] TTM server unavailable:', error)
        ttmStatus = false
      }
    }

    // Determine overall status
    const services = {
      fal: hasFalKey,
      ttm: ttmStatus,
    }

    const serviceCount = Object.keys(services).length
    const healthyCount = Object.values(services).filter(Boolean).length

    let status: 'ok' | 'degraded' | 'error' = 'ok'
    let message = 'All services configured and operational'

    if (healthyCount === 0) {
      status = 'error'
      message = 'No services configured. Alkemy will have limited functionality.'
    } else if (healthyCount < serviceCount) {
      status = 'degraded'
      message = 'Some services unavailable. Some features may not work.'
    }

    // Return health status with detailed information
    res.status(200).json({
      status,
      services,
      message,
      details: {
        fal: {
          configured: hasFalKey,
          description: hasFalKey
            ? 'Character Identity training available'
            : 'Character Identity training will not work. Set FAL_API_KEY environment variable.',
          setupInstructions: !hasFalKey
            ? [
                '1. Get API key from https://fal.ai/dashboard',
                '2. Set FAL_API_KEY environment variable in Vercel',
                '3. Redeploy Vercel application',
              ]
            : undefined,
        },
        ttm: {
          configured: !!ttmServerUrl && ttmServerUrl !== 'http://localhost:8100',
          available: ttmStatus,
          serverUrl: ttmServerUrl,
          description: ttmStatus
            ? 'Motion-controlled video generation available'
            : 'Motion generation unavailable. See setup instructions.',
          serverInfo: ttmInfo,
          setupInstructions:
            !ttmServerUrl || ttmServerUrl === 'http://localhost:8100'
              ? [
                  '1. Deploy TTM API to Railway, RunPod, Modal, or self-hosted server',
                  '2. Set TTM_SERVER_URL environment variable in Vercel',
                  '3. Redeploy Vercel application',
                  'See: /DEPLOYMENT_TTM.md for detailed instructions',
                ]
              : ttmStatus === false
                ? [
                    '1. Check TTM server is running and accessible',
                    '2. Verify model is loaded in TTM server',
                    '3. Check server logs for errors',
                  ]
                : undefined,
        },
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    })
  } catch (error) {
    console.error('[Health Check] Error:', error)

    res.status(500).json({
      status: 'error',
      services: {
        fal: false,
        ttm: false,
      },
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
}
