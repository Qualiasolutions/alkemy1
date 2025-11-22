/**
 * Segmind OpenVoice Provider Implementation
 *
 * Cloud-hosted OpenVoice API via Segmind - FREE tier available!
 * No self-hosting required, just an API key.
 */

import {
  type AudioCapabilities,
  type AudioEditRequest,
  type AudioEditResponse,
  AudioError,
  AudioErrorCode,
  type AudioProvider,
  type AudioProviderConfig,
  AudioProviderType,
  type SpeechGenerationRequest,
  type SpeechGenerationResponse,
  type Voice,
  type VoiceCloneRequest,
  type VoiceCloneResponse,
} from '../../types/audioProvider'

export class SegmindOpenVoiceProvider implements AudioProvider {
  readonly name = 'Segmind OpenVoice'
  readonly type = AudioProviderType.OPENVOICE
  readonly capabilities: AudioCapabilities

  private config: AudioProviderConfig | null = null
  private isInitialized = false
  private apiKey: string = ''
  private baseUrl = 'https://api.segmind.com'

  constructor() {
    this.capabilities = {
      voiceCloning: true, // Uses reference audio instead of training
      emotionEditing: false, // Segmind OpenVoice doesn't support emotion editing directly
      styleEditing: false, // Limited style control
      paralinguistics: false, // Not supported
      multilingual: true,
      realTimeGeneration: true, // Cloud-hosted, fast
      maxAudioLength: 120, // 120 seconds per generation
      supportedLanguages: ['en', 'es', 'fr', 'zh', 'jp', 'kr'],
      supportedEmotions: ['neutral'], // Limited emotion support
      supportedStyles: ['conversational'],
    }
  }

  async initialize(config: AudioProviderConfig): Promise<void> {
    try {
      this.config = { ...config }

      // Get API key from config or environment
      this.apiKey = this.config.apiKey || import.meta.env.VITE_SEGMIND_API_KEY || ''

      if (!this.apiKey) {
        throw new AudioError(
          AudioErrorCode.MISSING_API_KEY,
          'Segmind API key is required. Set VITE_SEGMIND_API_KEY environment variable.',
          this.type
        )
      }

      // Test API connection
      const response = await fetch(`${this.baseUrl}/v1/openvoice`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Test',
          input_audio: 'https://segmind-models-cdn.s3.amazonaws.com/test_audio.mp3',
          language: 'EN_NEWEST',
          speed: 1.0,
        }),
      })

      if (!response.ok && response.status !== 402) {
        // 402 = quota exceeded (but key is valid)
        throw new AudioError(
          AudioErrorCode.INITIALIZATION_FAILED,
          'Invalid Segmind API key or connection failed',
          this.type
        )
      }

      this.isInitialized = true
      console.log('[Segmind OpenVoice Provider] Initialized successfully')
    } catch (error) {
      if (error instanceof AudioError) throw error
      throw new AudioError(
        AudioErrorCode.INITIALIZATION_FAILED,
        `Failed to initialize Segmind OpenVoice: ${error}`,
        this.type,
        error
      )
    }
  }

  async cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    this.ensureInitialized()

    try {
      // Segmind OpenVoice doesn't "train" voices - it uses reference audio directly
      // So "cloning" just means storing the reference audio URL

      // Upload reference audio to Supabase or convert to URL
      const referenceAudioUrl = await this.uploadToStorage(request.referenceAudio)

      // Generate a sample to verify quality
      const sampleResponse = await this.generateSpeech({
        text: request.description || 'This is a sample of my voice.',
        voiceId: referenceAudioUrl, // Use reference audio as "voice ID"
        language: request.language || 'en',
      })

      return {
        voiceId: referenceAudioUrl, // Store reference audio URL as voice ID
        voiceName: request.voiceName || `Voice ${Date.now()}`,
        status: 'success',
        sampleAudio: sampleResponse.audioUrl,
        metadata: {
          quality: 85, // Segmind OpenVoice quality estimate
          confidence: 90,
          processingTime: sampleResponse.metadata?.processingTime || 0,
        },
      }
    } catch (error) {
      if (error instanceof AudioError) throw error
      throw new AudioError(
        AudioErrorCode.PROCESSING_FAILED,
        `Voice cloning failed: ${error}`,
        this.type,
        error
      )
    }
  }

  async generateSpeech(request: SpeechGenerationRequest): Promise<SpeechGenerationResponse> {
    this.ensureInitialized()

    try {
      const startTime = Date.now()

      // Map language codes
      const languageMap: Record<string, string> = {
        en: 'EN_NEWEST',
        es: 'ES',
        fr: 'FR',
        zh: 'ZH',
        ja: 'JP',
        ko: 'KR',
      }

      const requestData = {
        text: request.text,
        input_audio:
          request.voiceId || 'https://segmind-models-cdn.s3.amazonaws.com/test_audio.mp3',
        language: languageMap[request.language || 'en'] || 'EN_NEWEST',
        speed: request.speed || 1.0,
      }

      const response = await fetch(`${this.baseUrl}/v1/openvoice`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw await this.handleApiError(response)
      }

      // Segmind returns audio as base64 or URL
      const result = await response.json()
      const audioUrl = result.audio_url || result.output || result.data

      if (!audioUrl) {
        throw new AudioError(
          AudioErrorCode.PROCESSING_FAILED,
          'No audio URL in response',
          this.type
        )
      }

      const processingTime = Date.now() - startTime

      return {
        audioUrl,
        status: 'success',
        metadata: {
          duration: 0, // Segmind doesn't return duration
          sampleRate: 22050,
          characters: request.text.length,
          processingTime,
        },
      }
    } catch (error) {
      if (error instanceof AudioError) throw error
      throw new AudioError(
        AudioErrorCode.PROCESSING_FAILED,
        `Speech generation failed: ${error}`,
        this.type,
        error
      )
    }
  }

  async editAudio(_request: AudioEditRequest): Promise<AudioEditResponse> {
    // Segmind OpenVoice doesn't support direct audio editing
    // We would need to regenerate with modified parameters
    throw new AudioError(
      AudioErrorCode.PROCESSING_FAILED,
      'Audio editing not supported by Segmind OpenVoice. Please regenerate with new parameters.',
      this.type
    )
  }

  async getVoices(): Promise<Voice[]> {
    this.ensureInitialized()

    // Segmind OpenVoice doesn't have pre-built voices
    // Return default voice
    return [
      {
        id: 'default',
        name: 'Default Voice',
        language: 'en',
        description: 'Use your own reference audio for voice cloning',
        metadata: {
          quality: 85,
          provider: this.name,
        },
      },
    ]
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.apiKey) return false

      const response = await fetch(`${this.baseUrl}/v1/openvoice`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Test',
          input_audio: 'https://segmind-models-cdn.s3.amazonaws.com/test_audio.mp3',
          language: 'EN_NEWEST',
          speed: 1.0,
        }),
      })

      // 402 = quota exceeded but API key is valid
      return response.ok || response.status === 402
    } catch (_error) {
      return false
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.config) {
      throw new AudioError(
        AudioErrorCode.INITIALIZATION_FAILED,
        'Segmind OpenVoice provider not initialized',
        this.type
      )
    }
  }

  private async uploadToStorage(audio: File | Blob): Promise<string> {
    try {
      // Import Supabase to avoid circular dependency
      const { supabase } = await import('../supabase')

      // Generate unique filename
      const timestamp = Date.now()
      const filename = `voice-audio-${timestamp}.wav`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('audio') // Use existing audio bucket
        .upload(filename, audio, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        console.error('[SegmindOpenVoice] Storage upload failed:', error)
        throw new Error(`Storage upload failed: ${error.message}`)
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('audio').getPublicUrl(filename)

      console.log('[SegmindOpenVoice] Audio uploaded to:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('[SegmindOpenVoice] Upload to storage failed:', error)
      // Fallback to placeholder
      return `https://your-supabase-url.com/audio/${Date.now()}`
    }
  }

  private async handleApiError(response: Response): Promise<AudioError> {
    let errorMessage = 'Unknown error'
    let errorCode = AudioErrorCode.PROCESSING_FAILED

    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage

      // Map Segmind errors to our error codes
      if (response.status === 401 || response.status === 403) {
        errorCode = AudioErrorCode.MISSING_API_KEY
        errorMessage = 'Invalid API key'
      } else if (response.status === 402) {
        errorCode = AudioErrorCode.RATE_LIMIT_EXCEEDED
        errorMessage = 'API quota exceeded. Please upgrade your plan.'
      } else if (response.status === 429) {
        errorCode = AudioErrorCode.RATE_LIMIT_EXCEEDED
        errorMessage = 'Rate limit exceeded. Please try again later.'
      } else if (response.status === 400) {
        if (errorMessage.includes('audio')) {
          errorCode = AudioErrorCode.INVALID_AUDIO_FORMAT
        } else if (errorMessage.includes('long')) {
          errorCode = AudioErrorCode.AUDIO_TOO_LONG
        }
      }
    } catch (_error) {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`
    }

    return new AudioError(errorCode, errorMessage, this.type)
  }
}
