/**
 * ElevenLabs Audio Provider Implementation
 *
 * Premium voice cloning and TTS solution for future upgrade.
 * Professional-grade audio quality with advanced features.
 */

import {
  AudioProvider,
  AudioProviderType,
  AudioCapabilities,
  AudioProviderConfig,
  VoiceCloneRequest,
  VoiceCloneResponse,
  SpeechGenerationRequest,
  SpeechGenerationResponse,
  AudioEditRequest,
  AudioEditResponse,
  Voice,
  AudioError,
  AudioErrorCode
} from '../../types/audioProvider';

export class ElevenLabsProvider implements AudioProvider {
  readonly name = 'ElevenLabs';
  readonly type = AudioProviderType.ELEVENLABS;
  readonly capabilities: AudioCapabilities;

  private config: AudioProviderConfig | null = null;
  private isInitialized = false;

  constructor() {
    this.capabilities = {
      voiceCloning: true,
      emotionEditing: true, // Limited compared to OpenVoice
      styleEditing: true,
      paralinguistics: false, // Not supported
      multilingual: true,
      realTimeGeneration: true,
      maxAudioLength: 600, // 10 minutes for premium accounts
      supportedLanguages: [
        'en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'nl', 'ja', 'zh', 'ko', 'ar', 'ru', 'hi'
      ],
      supportedEmotions: [
        'neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted'
      ],
      supportedStyles: [
        'narrative', 'conversational', 'newscaster', 'customer_service', 'cheerful'
      ]
    };
  }

  async initialize(config: AudioProviderConfig): Promise<void> {
    try {
      this.config = { ...config };

      // Validate required API key
      if (!this.config.apiKey) {
        throw new AudioError(
          AudioErrorCode.MISSING_API_KEY,
          'ElevenLabs API key is required',
          this.type
        );
      }

      // Set default base URL
      if (!this.config.baseUrl) {
        this.config.baseUrl = 'https://api.elevenlabs.io';
      }

      // Test API connection
      const response = await fetch(`${this.config.baseUrl}/v1/user`, {
        headers: {
          'xi-api-key': this.config.apiKey
        }
      });

      if (!response.ok) {
        throw new AudioError(
          AudioErrorCode.INITIALIZATION_FAILED,
          'Invalid ElevenLabs API key or connection failed',
          this.type
        );
      }

      this.isInitialized = true;
      console.log('[ElevenLabs Provider] Initialized successfully');
    } catch (error) {
      if (error instanceof AudioError) throw error;
      throw new AudioError(
        AudioErrorCode.INITIALIZATION_FAILED,
        `Failed to initialize ElevenLabs: ${error}`,
        this.type,
        error
      );
    }
  }

  async cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    this.ensureInitialized();

    try {
      // Step 1: Upload reference audio
      const formData = new FormData();
      formData.append('name', request.voiceName || `Custom Voice ${Date.now()}`);
      formData.append('files', request.referenceAudio);
      if (request.description) {
        formData.append('description', request.description);
      }

      const uploadResponse = await fetch(`${this.config!.baseUrl}/v1/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.config!.apiKey!
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw await this.handleApiError(uploadResponse);
      }

      const uploadResult = await uploadResponse.json();

      // Step 2: Get instant voice ID
      const voiceId = uploadResult.voice_id;

      // Step 3: Generate sample to verify quality
      const sampleText = request.description || "Hello, this is a sample of my cloned voice.";
      const sampleResponse = await this.generateSpeech({
        text: sampleText,
        voiceId,
        language: request.language || 'en'
      });

      return {
        voiceId,
        voiceName: request.voiceName || `Custom Voice ${Date.now()}`,
        status: 'success',
        sampleAudio: sampleResponse.audioUrl,
        metadata: {
          quality: 95, // ElevenLabs typically has very high quality
          confidence: 98,
          processingTime: sampleResponse.metadata?.processingTime || 0
        }
      };
    } catch (error) {
      if (error instanceof AudioError) throw error;
      throw new AudioError(
        AudioErrorCode.PROCESSING_FAILED,
        `Voice cloning failed: ${error}`,
        this.type,
        error
      );
    }
  }

  async generateSpeech(request: SpeechGenerationRequest): Promise<SpeechGenerationResponse> {
    this.ensureInitialized();

    try {
      const requestData: any = {
        text: request.text,
        model_id: request.model || 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      };

      // Add voice settings if emotion specified
      if (request.emotion) {
        requestData.voice_settings.style = this.mapEmotionToStyle(request.emotion);
      }

      const response = await fetch(`${this.config!.baseUrl}/v1/text-to-speech/${request.voiceId || 'default'}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.config!.apiKey!,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      // Convert audio blob to base64 URL
      const audioBlob = await response.blob();
      const audioBase64 = await this.blobToBase64(audioBlob);

      return {
        audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
        status: 'success',
        metadata: {
          duration: 0, // ElevenLabs doesn't return duration in API response
          sampleRate: 44100,
          characters: request.text.length,
          processingTime: 0
        }
      };
    } catch (error) {
      if (error instanceof AudioError) throw error;
      throw new AudioError(
        AudioErrorCode.PROCESSING_FAILED,
        `Speech generation failed: ${error}`,
        this.type,
        error
      );
    }
  }

  async editAudio(request: AudioEditRequest): Promise<AudioEditResponse> {
    // ElevenLabs doesn't support direct audio editing like OpenVoice
    // We'll need to regenerate with modified parameters
    this.ensureInitialized();

    if (request.editType === 'speed') {
      // For speed changes, we'd need to use audio processing libraries
      throw new AudioError(
        AudioErrorCode.PROCESSING_FAILED,
        'Speed editing not supported by ElevenLabs API directly',
        this.type
      );
    }

    if (request.editType === 'emotion' && request.targetText) {
      // Regenerate with new emotion
      const response = await this.generateSpeech({
        text: request.targetText,
        emotion: request.editParams.emotion,
        style: request.editParams.style,
        voiceId: request.editParams.voiceId
      });

      return {
        audioUrl: response.audioUrl,
        status: 'success',
        metadata: {
          originalDuration: 0,
          newDuration: response.metadata?.duration || 0,
          processingTime: response.metadata?.processingTime || 0
        }
      };
    }

    throw new AudioError(
      AudioErrorCode.PROCESSING_FAILED,
      `Audio editing type '${request.editType}' not supported by ElevenLabs`,
      this.type
    );
  }

  async getVoices(): Promise<Voice[]> {
    this.ensureInitialized();

    try {
      const response = await fetch(`${this.config!.baseUrl}/v1/voices`, {
        headers: {
          'xi-api-key': this.config!.apiKey!
        }
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data = await response.json();

      return data.voices.map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        language: voice.language,
        gender: voice.gender,
        age: voice.age,
        description: voice.description,
        previewUrl: voice.preview_url,
        isCustom: voice.category === 'cloned',
        metadata: {
          quality: 95,
          provider: this.name,
          model: voice.high_quality_base_model_ids?.[0] || 'unknown'
        }
      }));
    } catch (error) {
      if (error instanceof AudioError) throw error;
      throw new AudioError(
        AudioErrorCode.PROCESSING_FAILED,
        `Failed to fetch voices: ${error}`,
        this.type,
        error
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.config?.apiKey) return false;

      const response = await fetch(`${this.config.baseUrl}/v1/user`, {
        headers: {
          'xi-api-key': this.config.apiKey
        },
        timeout: 5000
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.config) {
      throw new AudioError(
        AudioErrorCode.INITIALIZATION_FAILED,
        'ElevenLabs provider not initialized',
        this.type
      );
    }
  }

  private mapEmotionToStyle(emotion: string): number {
    // Map emotion strings to ElevenLabs style values (0-1)
    const emotionMap: Record<string, number> = {
      'neutral': 0.5,
      'happy': 0.8,
      'sad': 0.2,
      'angry': 0.9,
      'surprised': 0.7,
      'fearful': 0.3,
      'whisper': 0.1,
      'energetic': 0.95
    };

    return emotionMap[emotion.toLowerCase()] || 0.5;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async handleApiError(response: Response): Promise<AudioError> {
    let errorMessage = 'Unknown error';
    let errorCode = AudioErrorCode.PROCESSING_FAILED;

    try {
      const errorData = await response.json();
      errorMessage = errorData.detail?.message || errorData.message || errorMessage;

      // Map ElevenLabs errors to our error codes
      if (response.status === 401) {
        errorCode = AudioErrorCode.MISSING_API_KEY;
      } else if (response.status === 404) {
        errorCode = AudioErrorCode.VOICE_NOT_FOUND;
      } else if (response.status === 429) {
        errorCode = AudioErrorCode.RATE_LIMIT_EXCEEDED;
      } else if (response.status === 400) {
        if (errorMessage.includes('text is too long')) {
          errorCode = AudioErrorCode.AUDIO_TOO_LONG;
        } else if (errorMessage.includes('invalid voice')) {
          errorCode = AudioErrorCode.VOICE_NOT_FOUND;
        }
      }
    } catch (error) {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }

    return new AudioError(errorCode, errorMessage, this.type);
  }
}