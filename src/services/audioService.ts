/**
 * Audio Service - Provider Agnostic Audio Processing
 *
 * Main service that manages audio providers (OpenVoice, ElevenLabs, etc.)
 * and provides a unified interface for voice cloning, TTS, and audio editing.
 *
 * Switching providers is as simple as changing the configuration:
 * await audioService.switchProvider(AudioProviderType.ELEVENLABS);
 */

import {
  type AudioEditRequest,
  type AudioEditResponse,
  AudioError,
  AudioErrorCode,
  type AudioProvider,
  type AudioProviderConfig,
  type AudioProviderType,
  type CharacterVoice,
  DEFAULT_PROVIDER_CONFIG,
  type DialogueGeneration,
  type ProviderConfiguration,
  type SpeechGenerationRequest,
  type SpeechGenerationResponse,
  type Voice,
  type VoiceCloneRequest,
  type VoiceCloneResponse,
} from '../types/audioProvider'
import { supabase } from './supabase'

export class AudioService {
  private providers: Map<AudioProviderType, AudioProvider> = new Map()
  private activeProvider: AudioProviderType
  private config: ProviderConfiguration

  constructor() {
    this.config = { ...DEFAULT_PROVIDER_CONFIG }
    this.activeProvider = this.config.active

    // Initialize available providers
    this.initializeProviders()
  }

  async switchProvider(
    providerType: AudioProviderType,
    config?: AudioProviderConfig
  ): Promise<void> {
    const provider = this.providers.get(providerType)
    if (!provider) {
      throw new AudioError(
        AudioErrorCode.VOICE_NOT_FOUND,
        `Provider ${providerType} not available`,
        providerType
      )
    }

    try {
      // Initialize the provider with configuration
      const providerConfig = config || this.config.providers[providerType].config
      await provider.initialize(providerConfig || {})

      // Switch to the new provider
      this.activeProvider = providerType
      this.config.active = providerType

      console.log(`[AudioService] Switched to ${provider.name} provider`)

      // Persist configuration change
      await this.saveConfiguration()
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.INITIALIZATION_FAILED,
        `Failed to switch to ${providerType}: ${error}`,
        providerType,
        error
      )
    }
  }

  async getActiveProvider(): Promise<AudioProvider> {
    const provider = this.providers.get(this.activeProvider)
    if (!provider) {
      throw new AudioError(
        AudioErrorCode.VOICE_NOT_FOUND,
        `Active provider ${this.activeProvider} not available`,
        this.activeProvider
      )
    }

    const isAvailable = await provider.isAvailable()
    if (!isAvailable) {
      // Try to fall back to next available provider
      return await this.getFallbackProvider()
    }

    return provider
  }

  private async getFallbackProvider(): Promise<AudioProvider> {
    for (const [providerType, config] of Object.entries(this.config.providers)) {
      if (config.enabled && providerType !== this.activeProvider) {
        const provider = this.providers.get(providerType as AudioProviderType)
        if (provider && (await provider.isAvailable())) {
          console.warn(`[AudioService] Falling back to ${provider.name}`)
          this.activeProvider = providerType as AudioProviderType
          return provider
        }
      }
    }

    throw new AudioError(
      AudioErrorCode.NETWORK_ERROR,
      'No audio providers are available',
      this.activeProvider
    )
  }

  // ========================================================================================
  // Core Audio Operations
  // ========================================================================================

  async cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    const provider = await this.getActiveProvider()
    return await provider.cloneVoice(request)
  }

  async generateSpeech(request: SpeechGenerationRequest): Promise<SpeechGenerationResponse> {
    const provider = await this.getActiveProvider()
    return await provider.generateSpeech(request)
  }

  async editAudio(request: AudioEditRequest): Promise<AudioEditResponse> {
    const provider = await this.getActiveProvider()
    return await provider.editAudio(request)
  }

  async getVoices(): Promise<Voice[]> {
    const provider = await this.getActiveProvider()
    return await provider.getVoices()
  }

  async isAvailable(): Promise<boolean> {
    try {
      const provider = await this.getActiveProvider()
      return await provider.isAvailable()
    } catch (_error) {
      return false
    }
  }

  // ========================================================================================
  // Film Production Specific Methods
  // ========================================================================================

  /**
   * Clone voice for a specific character and store in Supabase
   */
  async cloneCharacterVoice(
    characterId: string,
    characterName: string,
    referenceAudio: File,
    description?: string
  ): Promise<CharacterVoice> {
    try {
      // Clone voice with current provider
      const cloneResponse = await this.cloneVoice({
        referenceAudio,
        voiceName: `${characterName} Voice`,
        description: description || `Voice for character ${characterName}`,
      })

      if (cloneResponse.status !== 'success') {
        throw new Error(cloneResponse.message || 'Voice cloning failed')
      }

      // Upload reference audio to Supabase Storage
      const audioUrl = await this.uploadAudioToSupabase(
        referenceAudio,
        `characters/${characterId}/reference`
      )

      // Create character voice record
      const characterVoice: CharacterVoice = {
        characterId,
        voiceId: cloneResponse.voiceId,
        provider: this.activeProvider,
        referenceAudio: audioUrl,
        cloneMetadata: cloneResponse.metadata,
        emotions: {}, // Will be populated as emotions are generated
        lastUsed: new Date().toISOString(),
      }

      // Store in Supabase
      await this.saveCharacterVoice(characterVoice)

      console.log(`[AudioService] Cloned voice for character ${characterName}`)
      return characterVoice
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.PROCESSING_FAILED,
        `Failed to clone character voice: ${error}`,
        this.activeProvider,
        error
      )
    }
  }

  /**
   * Generate dialogue for a character with emotion
   */
  async generateCharacterDialogue(
    characterVoice: CharacterVoice,
    text: string,
    emotion?: string,
    sceneContext?: string
  ): Promise<DialogueGeneration> {
    try {
      // Enhance text with scene context if provided
      let enhancedText = text
      if (sceneContext) {
        enhancedText = `${text} [Context: ${sceneContext}]`
      }

      // Generate speech with character's voice
      const startTime = Date.now()
      const response = await this.generateSpeech({
        text: enhancedText,
        voiceId: characterVoice.voiceId,
        emotion,
        language: 'en',
      })

      if (response.status !== 'success') {
        throw new Error(response.message || 'Dialogue generation failed')
      }

      // Upload generated audio to Supabase
      const audioBlob = await this.urlToBlob(response.audioUrl)
      const audioUrl = await this.uploadAudioToSupabase(
        audioBlob,
        `dialogue/${characterVoice.characterId}/${Date.now()}`
      )

      const dialogue: DialogueGeneration = {
        characterId: characterVoice.characterId,
        text,
        emotion,
        sceneContext,
        outputAudio: audioUrl,
        processingTime: Date.now() - startTime,
      }

      // Update character voice last used
      characterVoice.lastUsed = new Date().toISOString()
      await this.saveCharacterVoice(characterVoice)

      console.log(`[AudioService] Generated dialogue for character ${characterVoice.characterId}`)
      return dialogue
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.PROCESSING_FAILED,
        `Failed to generate dialogue: ${error}`,
        this.activeProvider,
        error
      )
    }
  }

  /**
   * Edit dialogue emotion or style in post-production
   */
  async editDialogueEmotion(
    originalAudio: string, // Supabase URL
    newEmotion: string,
    targetText: string,
    characterVoice?: CharacterVoice
  ): Promise<AudioEditResponse> {
    try {
      // Download audio from Supabase
      const audioBlob = await this.downloadAudioFromSupabase(originalAudio)

      // Edit audio with current provider
      const response = await this.editAudio({
        inputAudio: audioBlob,
        editType: 'emotion',
        editParams: {
          emotion: newEmotion,
          voiceId: characterVoice?.voiceId,
        },
        targetText,
      })

      if (response.status !== 'success') {
        throw new Error(response.message || 'Audio editing failed')
      }

      // Upload edited audio to Supabase
      const editedAudioBlob = await this.urlToBlob(response.audioUrl)
      const editedAudioUrl = await this.uploadAudioToSupabase(
        editedAudioBlob,
        `edited/${Date.now()}`
      )

      return {
        ...response,
        audioUrl: editedAudioUrl,
      }
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.PROCESSING_FAILED,
        `Failed to edit dialogue emotion: ${error}`,
        this.activeProvider,
        error
      )
    }
  }

  // ========================================================================================
  // Configuration Management
  // ========================================================================================

  async loadConfiguration(): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_preferences')
        .select('audio_provider_config')
        .eq('user_id', user.id)
        .single()

      if (data?.audio_provider_config) {
        this.config = { ...DEFAULT_PROVIDER_CONFIG, ...data.audio_provider_config }
        this.activeProvider = this.config.active

        // Reinitialize providers with loaded config
        for (const [providerType, config] of Object.entries(this.config.providers)) {
          if (config.enabled && config.config) {
            try {
              await this.switchProvider(providerType as AudioProviderType, config.config)
            } catch (error) {
              console.warn(`Failed to initialize ${providerType}:`, error)
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load audio provider configuration:', error)
    }
  }

  private async saveConfiguration(): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        audio_provider_config: this.config,
      })
    } catch (error) {
      console.warn('Failed to save audio provider configuration:', error)
    }
  }

  getConfiguration(): ProviderConfiguration {
    return { ...this.config }
  }

  async updateProviderConfig(
    providerType: AudioProviderType,
    config: AudioProviderConfig
  ): Promise<void> {
    this.config.providers[providerType].config = config
    await this.saveConfiguration()

    // If this is the active provider, reinitialize it
    if (this.activeProvider === providerType) {
      await this.switchProvider(providerType, config)
    }
  }

  // ========================================================================================
  // Utility Methods
  // ========================================================================================

  private async uploadAudioToSupabase(audioFile: File | Blob, path: string): Promise<string> {
    const file =
      audioFile instanceof File
        ? audioFile
        : new File([audioFile], 'audio.mp3', {
            type: 'audio/mpeg',
          })

    const { data, error } = await supabase.storage
      .from('audio-assets')
      .upload(`${path}/${Date.now()}.mp3`, file)

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from('audio-assets').getPublicUrl(data.path)

    return publicUrl
  }

  private async downloadAudioFromSupabase(url: string): Promise<Blob> {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to download audio')
    return await response.blob()
  }

  private async urlToBlob(url: string): Promise<Blob> {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch audio URL')
    return await response.blob()
  }

  private async saveCharacterVoice(characterVoice: CharacterVoice): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Store character voice in user_preferences or a dedicated table
    await supabase.from('character_voices').upsert({
      user_id: user.id,
      character_id: characterVoice.characterId,
      voice_data: characterVoice,
    })
  }

  // ========================================================================================
  // Health and Monitoring
  // ========================================================================================

  async getProviderStatus(): Promise<Record<AudioProviderType, boolean>> {
    const status: Record<string, boolean> = {}

    for (const [providerType, provider] of this.providers) {
      try {
        status[providerType] = await provider.isAvailable()
      } catch (_error) {
        status[providerType] = false
      }
    }

    return status as Record<AudioProviderType, boolean>
  }

  async testProvider(providerType: AudioProviderType): Promise<boolean> {
    const provider = this.providers.get(providerType)
    if (!provider) return false

    try {
      return await provider.isAvailable()
    } catch (_error) {
      return false
    }
  }
}

// ========================================================================================
// Singleton Instance
// ========================================================================================

export const audioService = new AudioService()

// Initialize on app startup
export async function initializeAudioService(): Promise<void> {
  try {
    await audioService.loadConfiguration()
    console.log('[AudioService] Initialized successfully')
  } catch (error) {
    console.warn('[AudioService] Initialization failed:', error)
  }
}
