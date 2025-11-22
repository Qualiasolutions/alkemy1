/**
 * Sound Effects Service
 *
 * AI-powered sound effects generation and library search.
 * Supports: ElevenLabs SFX, AudioCraft AudioGen, Freesound library
 *
 * Features:
 * - Text-to-SFX generation
 * - Foley sound creation (footsteps, doors, ambient)
 * - Environmental audio
 * - Sound library search and download
 */

export interface SFXGenerationParams {
  prompt: string
  duration?: number // in seconds (typically 1-30s)
  category?: 'foley' | 'ambient' | 'environmental' | 'impact' | 'transition' | 'nature' | 'urban'
  intensity?: 'subtle' | 'moderate' | 'intense'
}

export interface SFXGenerationResult {
  id: string
  url: string
  duration: number
  provider: 'elevenlabs' | 'audiocraft' | 'freesound'
  metadata: {
    prompt: string
    category?: string
    generationTime: number
  }
}

export interface FreesoundSearchResult {
  id: string
  name: string
  url: string
  previewUrl: string
  downloadUrl: string
  duration: number
  license: string
  username: string
  tags: string[]
}

export type SFXProvider = 'elevenlabs' | 'audiocraft' | 'freesound'

/**
 * Generate sound effects using the specified provider
 */
export async function generateSoundEffect(
  params: SFXGenerationParams,
  provider: SFXProvider = 'elevenlabs',
  onProgress?: (progress: number) => void
): Promise<SFXGenerationResult> {
  onProgress?.(0.1)

  switch (provider) {
    case 'elevenlabs':
      return generateWithElevenLabs(params, onProgress)
    case 'audiocraft':
      return generateWithAudioCraft(params, onProgress)
    case 'freesound':
      return searchFreesound(params, onProgress)
    default:
      throw new Error(`Unknown SFX provider: ${provider}`)
  }
}

/**
 * ElevenLabs Sound Effects API integration
 */
async function generateWithElevenLabs(
  params: SFXGenerationParams,
  onProgress?: (progress: number) => void
): Promise<SFXGenerationResult> {
  const startTime = Date.now()

  onProgress?.(0.2)

  try {
    // ElevenLabs SFX API via serverless proxy
    const response = await fetch('/api/elevenlabs-sfx-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: buildSFXPrompt(params),
        duration_seconds: params.duration || null, // null = AI decides
        prompt_influence: 0.8, // How much to follow the prompt
      }),
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs SFX API error: ${response.statusText}`)
    }

    onProgress?.(0.7)

    const data = await response.json()

    // ElevenLabs returns 4 SFX variations per generation
    // We'll use the first one for simplicity
    const audioUrl = data.audio_urls[0]

    onProgress?.(1.0)

    return {
      id: `elevenlabs-sfx-${Date.now()}`,
      url: audioUrl,
      duration: params.duration || 5,
      provider: 'elevenlabs',
      metadata: {
        prompt: params.prompt,
        category: params.category,
        generationTime: Date.now() - startTime,
      },
    }
  } catch (error) {
    console.error('ElevenLabs SFX generation failed:', error)
    throw error
  }
}

/**
 * AudioCraft AudioGen (Meta) integration via Hugging Face
 */
async function generateWithAudioCraft(
  params: SFXGenerationParams,
  onProgress?: (progress: number) => void
): Promise<SFXGenerationResult> {
  const startTime = Date.now()

  onProgress?.(0.2)

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/audiogen-medium',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY || ''}`,
        },
        body: JSON.stringify({
          inputs: buildSFXPrompt(params),
          parameters: {
            max_new_tokens: Math.floor((params.duration || 5) * 50),
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`AudioCraft API error: ${response.statusText}`)
    }

    onProgress?.(0.7)

    const blob = await response.blob()
    const audioUrl = URL.createObjectURL(blob)

    onProgress?.(1.0)

    return {
      id: `audiocraft-${Date.now()}`,
      url: audioUrl,
      duration: params.duration || 5,
      provider: 'audiocraft',
      metadata: {
        prompt: params.prompt,
        category: params.category,
        generationTime: Date.now() - startTime,
      },
    }
  } catch (error) {
    console.error('AudioCraft generation failed:', error)
    throw error
  }
}

/**
 * Freesound library search
 */
async function searchFreesound(
  params: SFXGenerationParams,
  onProgress?: (progress: number) => void
): Promise<SFXGenerationResult> {
  const startTime = Date.now()

  onProgress?.(0.3)

  try {
    // Search Freesound API
    const response = await fetch('/api/freesound-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'search',
        query: params.prompt,
        filter: `duration:[0 TO ${params.duration || 30}]`,
        sort: 'rating_desc',
        page_size: 1,
      }),
    })

    if (!response.ok) {
      throw new Error(`Freesound API error: ${response.statusText}`)
    }

    const data = await response.json()

    onProgress?.(0.7)

    if (!data.results || data.results.length === 0) {
      throw new Error('No matching sound effects found in Freesound library')
    }

    const sound = data.results[0]

    // Download the preview MP3 (or full file if available)
    const audioUrl = sound.previews['preview-hq-mp3'] || sound.previews['preview-lq-mp3']

    onProgress?.(1.0)

    return {
      id: `freesound-${sound.id}`,
      url: audioUrl,
      duration: sound.duration,
      provider: 'freesound',
      metadata: {
        prompt: params.prompt,
        category: params.category,
        generationTime: Date.now() - startTime,
      },
    }
  } catch (error) {
    console.error('Freesound search failed:', error)
    throw error
  }
}

/**
 * Search Freesound library (returns multiple results)
 */
export async function searchFreesoundLibrary(
  query: string,
  filters?: {
    duration?: [number, number] // [min, max] in seconds
    license?: string
    tag?: string
  },
  limit: number = 10
): Promise<FreesoundSearchResult[]> {
  try {
    const filterParams: string[] = []

    if (filters?.duration) {
      filterParams.push(`duration:[${filters.duration[0]} TO ${filters.duration[1]}]`)
    }

    if (filters?.license) {
      filterParams.push(`license:"${filters.license}"`)
    }

    if (filters?.tag) {
      filterParams.push(`tag:"${filters.tag}"`)
    }

    const response = await fetch('/api/freesound-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'search',
        query,
        filter: filterParams.join(' '),
        sort: 'rating_desc',
        page_size: limit,
      }),
    })

    if (!response.ok) {
      throw new Error(`Freesound search failed: ${response.statusText}`)
    }

    const data = await response.json()

    return data.results.map((sound: any) => ({
      id: sound.id.toString(),
      name: sound.name,
      url: sound.url,
      previewUrl: sound.previews['preview-hq-mp3'] || sound.previews['preview-lq-mp3'],
      downloadUrl: sound.download,
      duration: sound.duration,
      license: sound.license,
      username: sound.username,
      tags: sound.tags,
    }))
  } catch (error) {
    console.error('Freesound library search failed:', error)
    return []
  }
}

/**
 * Build enhanced SFX prompt
 */
function buildSFXPrompt(params: SFXGenerationParams): string {
  const parts: string[] = []

  if (params.category) {
    parts.push(params.category)
  }

  if (params.intensity) {
    parts.push(params.intensity)
  }

  parts.push(params.prompt)

  return parts.join(' ')
}

/**
 * Generate common foley sounds library
 */
export async function generateFoleyLibrary(
  provider: SFXProvider = 'elevenlabs',
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, SFXGenerationResult>> {
  const foleyPrompts = [
    { key: 'footsteps_wood', prompt: 'footsteps on wooden floor', duration: 3 },
    { key: 'footsteps_concrete', prompt: 'footsteps on concrete', duration: 3 },
    { key: 'footsteps_gravel', prompt: 'footsteps on gravel', duration: 3 },
    { key: 'door_open', prompt: 'wooden door opening', duration: 2 },
    { key: 'door_close', prompt: 'wooden door closing', duration: 2 },
    { key: 'door_creak', prompt: 'creaky door', duration: 3 },
    { key: 'glass_break', prompt: 'glass breaking', duration: 2 },
    { key: 'paper_rustle', prompt: 'paper rustling', duration: 3 },
    { key: 'chair_scrape', prompt: 'chair scraping on floor', duration: 2 },
    { key: 'keys_jingle', prompt: 'keys jingling', duration: 2 },
    { key: 'phone_ring', prompt: 'old telephone ringing', duration: 5 },
    { key: 'car_door', prompt: 'car door closing', duration: 2 },
    { key: 'engine_start', prompt: 'car engine starting', duration: 4 },
    { key: 'rain_light', prompt: 'light rain on roof', duration: 10 },
    { key: 'rain_heavy', prompt: 'heavy rain pouring', duration: 10 },
    { key: 'wind_gentle', prompt: 'gentle wind blowing', duration: 10 },
    { key: 'wind_strong', prompt: 'strong wind howling', duration: 10 },
    { key: 'crowd_chatter', prompt: 'crowd of people chatting', duration: 10 },
    { key: 'birds_chirping', prompt: 'birds chirping morning', duration: 10 },
    { key: 'city_ambient', prompt: 'urban city street ambience', duration: 15 },
  ]

  const library = new Map<string, SFXGenerationResult>()
  let completed = 0

  for (const { key, prompt, duration } of foleyPrompts) {
    try {
      const result = await generateSoundEffect({ prompt, duration, category: 'foley' }, provider)

      library.set(key, result)
      completed++
      onProgress?.(completed, foleyPrompts.length)
    } catch (error) {
      console.error(`Failed to generate ${key}:`, error)
    }
  }

  return library
}

/**
 * Check if SFX provider API key is configured
 */
export function isSFXProviderAvailable(provider: SFXProvider): boolean {
  switch (provider) {
    case 'elevenlabs':
      return !!process.env.ELEVENLABS_API_KEY
    case 'audiocraft':
      return true // Free via Hugging Face
    case 'freesound':
      return !!process.env.FREESOUND_API_KEY
    default:
      return false
  }
}

/**
 * Get recommended provider based on availability
 */
export function getRecommendedSFXProvider(): SFXProvider {
  if (isSFXProviderAvailable('elevenlabs')) return 'elevenlabs'
  if (isSFXProviderAvailable('freesound')) return 'freesound'
  return 'audiocraft' // Fallback to free option
}
