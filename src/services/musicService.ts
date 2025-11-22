/**
 * Music Composition Service
 *
 * AI-powered music generation for film scoring.
 * Supports multiple providers: Suno, Udio, Stable Audio, MusicGen, AIVA
 *
 * Features:
 * - Emotion-based music generation
 * - Genre flexibility (orchestral, electronic, ambient, rock, jazz)
 * - Stem export (when supported by provider)
 * - Scene-aware composition
 */

export interface MusicGenerationParams {
  prompt: string
  emotion?:
    | 'happy'
    | 'sad'
    | 'tense'
    | 'mysterious'
    | 'triumphant'
    | 'melancholic'
    | 'energetic'
    | 'peaceful'
  genre?:
    | 'orchestral'
    | 'electronic'
    | 'ambient'
    | 'rock'
    | 'jazz'
    | 'cinematic'
    | 'folk'
    | 'classical'
  duration?: number // in seconds (max 180 for most providers)
  tempo?: 'slow' | 'medium' | 'fast'
  intensity?: 'low' | 'medium' | 'high'
  withStems?: boolean // Request separate instrument stems if available
}

export interface MusicGenerationResult {
  id: string
  url: string
  duration: number
  provider: 'suno' | 'udio' | 'stable-audio' | 'musicgen' | 'aiva'
  stems?: {
    drums?: string
    bass?: string
    melody?: string
    vocals?: string
    other?: string
  }
  metadata: {
    prompt: string
    emotion?: string
    genre?: string
    generationTime: number // in milliseconds
  }
}

export type MusicProvider = 'suno' | 'udio' | 'stable-audio' | 'musicgen' | 'aiva'

/**
 * Generate music using the specified provider
 */
export async function generateMusic(
  params: MusicGenerationParams,
  provider: MusicProvider = 'udio',
  onProgress?: (progress: number) => void
): Promise<MusicGenerationResult> {
  const _startTime = Date.now()

  onProgress?.(0.1)

  switch (provider) {
    case 'suno':
      return generateWithSuno(params, onProgress)
    case 'udio':
      return generateWithUdio(params, onProgress)
    case 'stable-audio':
      return generateWithStableAudio(params, onProgress)
    case 'musicgen':
      return generateWithMusicGen(params, onProgress)
    case 'aiva':
      return generateWithAIVA(params, onProgress)
    default:
      throw new Error(`Unknown music provider: ${provider}`)
  }
}

/**
 * Suno API integration (unofficial 3rd party API)
 */
async function generateWithSuno(
  params: MusicGenerationParams,
  onProgress?: (progress: number) => void
): Promise<MusicGenerationResult> {
  const startTime = Date.now()

  // Build enhanced prompt with emotion and genre
  const enhancedPrompt = buildMusicPrompt(params)

  onProgress?.(0.2)

  try {
    // Call Suno API via serverless proxy
    const response = await fetch('/api/suno-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        prompt: enhancedPrompt,
        duration: params.duration || 120,
        make_instrumental: true, // No lyrics for background scores
        with_stems: params.withStems || false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Suno API error: ${response.statusText}`)
    }

    const data = await response.json()
    onProgress?.(0.5)

    // Poll for completion
    const result = await pollForCompletion(data.id, '/api/suno-proxy', 'suno', onProgress, 0.5, 1.0)

    return {
      id: result.id,
      url: result.audio_url,
      duration: params.duration || 120,
      provider: 'suno',
      stems: result.stems,
      metadata: {
        prompt: enhancedPrompt,
        emotion: params.emotion,
        genre: params.genre,
        generationTime: Date.now() - startTime,
      },
    }
  } catch (error) {
    console.error('Suno generation failed:', error)
    throw error
  }
}

/**
 * Udio API integration (unofficial 3rd party API)
 */
async function generateWithUdio(
  params: MusicGenerationParams,
  onProgress?: (progress: number) => void
): Promise<MusicGenerationResult> {
  const startTime = Date.now()
  const enhancedPrompt = buildMusicPrompt(params)

  onProgress?.(0.2)

  try {
    const response = await fetch('/api/udio-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        prompt: enhancedPrompt,
        duration: params.duration || 120,
        with_stems: params.withStems || false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Udio API error: ${response.statusText}`)
    }

    const data = await response.json()
    onProgress?.(0.5)

    const result = await pollForCompletion(data.id, '/api/udio-proxy', 'udio', onProgress, 0.5, 1.0)

    return {
      id: result.id,
      url: result.audio_url,
      duration: params.duration || 120,
      provider: 'udio',
      stems: result.stems,
      metadata: {
        prompt: enhancedPrompt,
        emotion: params.emotion,
        genre: params.genre,
        generationTime: Date.now() - startTime,
      },
    }
  } catch (error) {
    console.error('Udio generation failed:', error)
    throw error
  }
}

/**
 * Stable Audio 2.0 API integration (official API)
 */
async function generateWithStableAudio(
  params: MusicGenerationParams,
  onProgress?: (progress: number) => void
): Promise<MusicGenerationResult> {
  const startTime = Date.now()
  const enhancedPrompt = buildMusicPrompt(params)

  onProgress?.(0.2)

  try {
    const response = await fetch('/api/stable-audio-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        seconds_total: params.duration || 120,
        seconds_start: 0,
      }),
    })

    if (!response.ok) {
      throw new Error(`Stable Audio API error: ${response.statusText}`)
    }

    onProgress?.(0.7)

    const blob = await response.blob()
    const audioUrl = URL.createObjectURL(blob)

    onProgress?.(1.0)

    return {
      id: `stable-audio-${Date.now()}`,
      url: audioUrl,
      duration: params.duration || 120,
      provider: 'stable-audio',
      metadata: {
        prompt: enhancedPrompt,
        emotion: params.emotion,
        genre: params.genre,
        generationTime: Date.now() - startTime,
      },
    }
  } catch (error) {
    console.error('Stable Audio generation failed:', error)
    throw error
  }
}

/**
 * MusicGen (Meta) integration via Hugging Face Inference API
 */
async function generateWithMusicGen(
  params: MusicGenerationParams,
  onProgress?: (progress: number) => void
): Promise<MusicGenerationResult> {
  const startTime = Date.now()
  const enhancedPrompt = buildMusicPrompt(params)

  onProgress?.(0.2)

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/musicgen-large',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY || ''}`,
        },
        body: JSON.stringify({
          inputs: enhancedPrompt,
          parameters: {
            max_new_tokens: Math.floor((params.duration || 30) * 50), // Approximate token count
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`MusicGen API error: ${response.statusText}`)
    }

    onProgress?.(0.7)

    const blob = await response.blob()
    const audioUrl = URL.createObjectURL(blob)

    onProgress?.(1.0)

    return {
      id: `musicgen-${Date.now()}`,
      url: audioUrl,
      duration: params.duration || 30,
      provider: 'musicgen',
      metadata: {
        prompt: enhancedPrompt,
        emotion: params.emotion,
        genre: params.genre,
        generationTime: Date.now() - startTime,
      },
    }
  } catch (error) {
    console.error('MusicGen generation failed:', error)
    throw error
  }
}

/**
 * AIVA API integration (requires enterprise API access)
 */
async function generateWithAIVA(
  params: MusicGenerationParams,
  onProgress?: (progress: number) => void
): Promise<MusicGenerationResult> {
  const startTime = Date.now()

  onProgress?.(0.2)

  // AIVA uses a different approach - composer styles instead of text prompts
  const style = mapGenreToAIVAStyle(params.genre)

  try {
    const response = await fetch('/api/aiva-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'compose',
        style,
        duration: params.duration || 120,
        emotion: params.emotion,
        with_stems: params.withStems || false,
      }),
    })

    if (!response.ok) {
      throw new Error(`AIVA API error: ${response.statusText}`)
    }

    const data = await response.json()
    onProgress?.(0.5)

    const result = await pollForCompletion(
      data.composition_id,
      '/api/aiva-proxy',
      'aiva',
      onProgress,
      0.5,
      1.0
    )

    return {
      id: result.id,
      url: result.audio_url,
      duration: params.duration || 120,
      provider: 'aiva',
      stems: result.stems,
      metadata: {
        prompt: params.prompt,
        emotion: params.emotion,
        genre: params.genre,
        generationTime: Date.now() - startTime,
      },
    }
  } catch (error) {
    console.error('AIVA generation failed:', error)
    throw error
  }
}

/**
 * Build enhanced music prompt with emotion and genre
 */
function buildMusicPrompt(params: MusicGenerationParams): string {
  const parts: string[] = []

  if (params.genre) {
    parts.push(params.genre)
  }

  if (params.emotion) {
    parts.push(params.emotion)
  }

  if (params.tempo) {
    parts.push(`${params.tempo} tempo`)
  }

  if (params.intensity) {
    parts.push(`${params.intensity} intensity`)
  }

  parts.push('instrumental')
  parts.push('cinematic film score')

  if (params.prompt) {
    parts.push(params.prompt)
  }

  return parts.join(', ')
}

/**
 * Map genre to AIVA composer style
 */
function mapGenreToAIVAStyle(genre?: string): string {
  const genreMap: Record<string, string> = {
    orchestral: 'modern_cinematic',
    electronic: 'electronic',
    ambient: 'ambient',
    rock: 'rock',
    jazz: 'jazz',
    cinematic: 'epic',
    folk: 'world',
    classical: 'classical',
  }

  return genreMap[genre || 'cinematic'] || 'modern_cinematic'
}

/**
 * Poll API for generation completion
 */
async function pollForCompletion(
  id: string,
  endpoint: string,
  provider: string,
  onProgress?: (progress: number) => void,
  startProgress: number = 0.5,
  endProgress: number = 1.0
): Promise<any> {
  const maxAttempts = 60 // 2 minutes max (2s intervals)
  let attempts = 0

  while (attempts < maxAttempts) {
    const response = await fetch(`${endpoint}?action=status&id=${id}`)

    if (!response.ok) {
      throw new Error(`${provider} status check failed`)
    }

    const data = await response.json()

    if (data.status === 'completed') {
      onProgress?.(endProgress)
      return data
    }

    if (data.status === 'failed') {
      throw new Error(`${provider} generation failed: ${data.error || 'Unknown error'}`)
    }

    // Update progress
    const progress = startProgress + (endProgress - startProgress) * (attempts / maxAttempts)
    onProgress?.(progress)

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, 2000))
    attempts++
  }

  throw new Error(`${provider} generation timeout after ${maxAttempts * 2} seconds`)
}

/**
 * Check if music provider API key is configured
 */
export function isMusicProviderAvailable(provider: MusicProvider): boolean {
  switch (provider) {
    case 'suno':
      return !!process.env.SUNO_API_KEY
    case 'udio':
      return !!process.env.UDIO_API_KEY
    case 'stable-audio':
      return !!process.env.STABLE_AUDIO_API_KEY
    case 'musicgen':
      return true // Free via Hugging Face
    case 'aiva':
      return !!process.env.AIVA_API_KEY
    default:
      return false
  }
}
