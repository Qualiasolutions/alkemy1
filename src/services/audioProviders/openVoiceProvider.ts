/**
 * OpenVoice Audio Provider Implementation
 *
 * Free, CPU-based voice cloning and TTS solution.
 * Serves as the default provider for Alkemy AI Studio.
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

export class OpenVoiceProvider implements AudioProvider {
  readonly name = 'OpenVoice'
  readonly type = AudioProviderType.OPENVOICE
  readonly capabilities: AudioCapabilities

  private config: AudioProviderConfig | null = null
  private isInitialized = false

  constructor() {
    this.capabilities = {
      voiceCloning: true,
      emotionEditing: true,
      styleEditing: true,
      paralinguistics: true,
      multilingual: true,
      realTimeGeneration: false, // CPU-based, slower
      maxAudioLength: 30, // 30 seconds per generation
      supportedLanguages: ['en', 'zh', 'es', 'fr', 'ja', 'ko'],
      supportedEmotions: [
        'neutral',
        'happy',
        'sad',
        'angry',
        'surprised',
        'whisper',
        'child',
        'older',
        'serious',
      ],
      supportedStyles: ['narrative', 'conversational', 'dramatic', 'calm', 'energetic'],
    }
  }

  async initialize(config: AudioProviderConfig): Promise<void> {
    try {
      this.config = { ...config }

      // Validate configuration
      if (!this.config.baseUrl) {
        this.config.baseUrl = process.env.OPENVOICE_API_URL || 'http://localhost:8000'
      }

      // Test connection to OpenVoice service
      const response = await fetch(`${this.config.baseUrl}/health`)
      if (!response.ok) {
        throw new AudioError(
          AudioErrorCode.INITIALIZATION_FAILED,
          'OpenVoice service not responding',
          this.type
        )
      }

      this.isInitialized = true
      console.log('[OpenVoice Provider] Initialized successfully')
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.INITIALIZATION_FAILED,
        `Failed to initialize OpenVoice: ${error}`,
        this.type,
        error
      )
    }
  }

  async cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    this.ensureInitialized()

    try {
      const formData = new FormData()
      formData.append('reference_audio', request.referenceAudio)
      if (request.voiceName) {
        formData.append('voice_name', request.voiceName)
      }
      if (request.description) {
        formData.append('description', request.description)
      }
      if (request.language) {
        formData.append('language', request.language)
      }

      const response = await fetch(`${this.config?.baseUrl}/api/clone-voice`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw await this.handleApiError(response)
      }

      const result = await response.json()

      return {
        voiceId: result.voice_id,
        voiceName: request.voiceName || `Custom Voice ${Date.now()}`,
        status: 'success',
        sampleAudio: result.sample_audio,
        metadata: {
          quality: result.quality || 85,
          confidence: result.confidence || 90,
          processingTime: result.processing_time || 0,
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
      const requestData = {
        text: request.text,
        voice_id: request.voiceId || 'default',
        emotion: request.emotion || 'neutral',
        style: request.style || 'conversational',
        speed: request.speed || 1.0,
        pitch: request.pitch || 1.0,
        language: request.language || 'en',
        output_format: request.outputFormat || 'mp3',
      }

      const response = await fetch(`${this.config?.baseUrl}/api/generate-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw await this.handleApiError(response)
      }

      const result = await response.json()

      return {
        audioUrl: result.audio_url,
        status: 'success',
        metadata: {
          duration: result.duration || 0,
          sampleRate: result.sample_rate || 22050,
          characters: request.text.length,
          processingTime: result.processing_time || 0,
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

  async editAudio(request: AudioEditRequest): Promise<AudioEditResponse> {
    this.ensureInitialized()

    try {
      const formData = new FormData()
      formData.append('input_audio', request.inputAudio)
      formData.append('edit_type', request.editType)
      formData.append('edit_params', JSON.stringify(request.editParams))

      if (request.targetText) {
        formData.append('target_text', request.targetText)
      }

      const response = await fetch(`${this.config?.baseUrl}/api/edit-audio`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw await this.handleApiError(response)
      }

      const result = await response.json()

      return {
        audioUrl: result.audio_url,
        status: 'success',
        metadata: {
          originalDuration: result.original_duration || 0,
          newDuration: result.new_duration || 0,
          processingTime: result.processing_time || 0,
        },
      }
    } catch (error) {
      if (error instanceof AudioError) throw error
      throw new AudioError(
        AudioErrorCode.PROCESSING_FAILED,
        `Audio editing failed: ${error}`,
        this.type,
        error
      )
    }
  }

  async getVoices(): Promise<Voice[]> {
    this.ensureInitialized()

    try {
      const response = await fetch(`${this.config?.baseUrl}/api/voices`)

      if (!response.ok) {
        throw await this.handleApiError(response)
      }

      const voicesData = await response.json()

      return voicesData.map((voice: any) => ({
        id: voice.id,
        name: voice.name,
        language: voice.language,
        gender: voice.gender,
        age: voice.age,
        description: voice.description,
        previewUrl: voice.preview_url,
        isCustom: voice.is_custom || false,
        metadata: {
          quality: voice.quality,
          provider: this.name,
          model: voice.model,
        },
      }))
    } catch (error) {
      if (error instanceof AudioError) throw error
      throw new AudioError(
        AudioErrorCode.PROCESSING_FAILED,
        `Failed to fetch voices: ${error}`,
        this.type,
        error
      )
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.config?.baseUrl) return false

      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000,
      })

      return response.ok
    } catch (_error) {
      return false
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.config) {
      throw new AudioError(
        AudioErrorCode.INITIALIZATION_FAILED,
        'OpenVoice provider not initialized',
        this.type
      )
    }
  }

  private async handleApiError(response: Response): Promise<AudioError> {
    let errorMessage = 'Unknown error'
    let errorCode = AudioErrorCode.PROCESSING_FAILED

    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage

      // Map OpenVoice errors to our error codes
      if (response.status === 400) {
        if (errorMessage.includes('audio format')) {
          errorCode = AudioErrorCode.INVALID_AUDIO_FORMAT
        } else if (errorMessage.includes('too short')) {
          errorCode = AudioErrorCode.AUDIO_TOO_SHORT
        } else if (errorMessage.includes('too long')) {
          errorCode = AudioErrorCode.AUDIO_TOO_LONG
        }
      } else if (response.status === 401) {
        errorCode = AudioErrorCode.MISSING_API_KEY
      } else if (response.status === 404) {
        errorCode = AudioErrorCode.VOICE_NOT_FOUND
      } else if (response.status === 429) {
        errorCode = AudioErrorCode.RATE_LIMIT_EXCEEDED
      } else if (response.status >= 500) {
        errorCode = AudioErrorCode.NETWORK_ERROR
      }
    } catch (_error) {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`
    }

    return new AudioError(errorCode, errorMessage, this.type)
  }
}

// ========================================================================================
// OpenVoice Backend Service Setup (for reference)
// ========================================================================================

/*
This provider expects a running OpenVoice service with the following API endpoints:

POST /api/clone-voice
  - reference_audio: File (6+ seconds)
  - voice_name?: string
  - description?: string
  - language?: string
  Returns: { voice_id, sample_audio, quality, confidence, processing_time }

POST /api/generate-speech
  - text: string
  - voice_id?: string
  - emotion?: string
  - style?: string
  - speed?: number
  - pitch?: number
  - language?: string
  - output_format?: string
  Returns: { audio_url, duration, sample_rate, processing_time }

POST /api/edit-audio
  - input_audio: File
  - edit_type: string
  - edit_params: JSON
  - target_text?: string
  Returns: { audio_url, original_duration, new_duration, processing_time }

GET /api/voices
  Returns: Array of voice objects

GET /health
  Returns: { status: 'healthy' }

To set up OpenVoice backend:
1. pip install -e .[all]
2. pip install git+https://github.com/myshell-ai/MeloTTS.git
3. Create FastAPI server with above endpoints
4. Run on CPU (no GPU required)
5. Configure OPENVOICE_API_URL environment variable
*/
