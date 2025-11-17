/**
 * Audio Provider Types
 *
 * Provider-agnostic interfaces for voice cloning and TTS services.
 * Designed to support multiple providers (OpenVoice, ElevenLabs, etc.) with easy switching.
 */

// ========================================================================================
// Core Audio Provider Interface
// ========================================================================================

export interface AudioProvider {
  readonly name: string;
  readonly type: AudioProviderType;
  readonly capabilities: AudioCapabilities;

  /**
   * Initialize the provider with API keys and configuration
   */
  initialize(config: AudioProviderConfig): Promise<void>;

  /**
   * Clone voice from reference audio sample
   */
  cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse>;

  /**
   * Generate speech from text with optional emotion/style
   */
  generateSpeech(request: SpeechGenerationRequest): Promise<SpeechGenerationResponse>;

  /**
   * Edit existing audio (emotion, style, paralinguistics)
   */
  editAudio(request: AudioEditRequest): Promise<AudioEditResponse>;

  /**
   * Get available voices/models
   */
  getVoices(): Promise<Voice[]>;

  /**
   * Check if provider is available and configured
   */
  isAvailable(): Promise<boolean>;
}

// ========================================================================================
// Provider Types and Configuration
// ========================================================================================

export enum AudioProviderType {
  OPENVOICE = 'openvoice',
  ELEVENLABS = 'elevenlabs',
  COQUI_TTS = 'coqui_tts',
  HUGGINGFACE = 'huggingface'
}

export interface AudioProviderConfig {
  provider: AudioProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  voiceId?: string;
  options?: Record<string, any>;
}

// ========================================================================================
// Provider Capabilities
// ========================================================================================

export interface AudioCapabilities {
  voiceCloning: boolean;
  emotionEditing: boolean;
  styleEditing: boolean;
  paralinguistics: boolean;
  multilingual: boolean;
  realTimeGeneration: boolean;
  maxAudioLength: number; // seconds
  supportedLanguages: string[];
  supportedEmotions: string[];
  supportedStyles: string[];
}

// ========================================================================================
// Request/Response Types
// ========================================================================================

// Voice Cloning
export interface VoiceCloneRequest {
  referenceAudio: File | Blob; // Audio sample (6+ seconds for OpenVoice)
  voiceName?: string;
  description?: string;
  language?: string;
}

export interface VoiceCloneResponse {
  voiceId: string;
  voiceName: string;
  status: 'success' | 'error';
  message?: string;
  sampleAudio?: string; // Base64 audio URL
  metadata?: {
    quality: number; // 0-100
    confidence: number; // 0-100
    processingTime: number; // ms
  };
}

// Speech Generation
export interface SpeechGenerationRequest {
  text: string;
  voiceId?: string;
  emotion?: string;
  style?: string;
  speed?: number; // 0.5 - 2.0
  pitch?: number; // 0 - 2
  language?: string;
  model?: string;
  outputFormat?: 'mp3' | 'wav' | 'ogg';
}

export interface SpeechGenerationResponse {
  audioUrl: string;
  audioBuffer?: ArrayBuffer;
  status: 'success' | 'error';
  message?: string;
  metadata?: {
    duration: number; // seconds
    sampleRate: number;
    characters: number;
    processingTime: number; // ms
  };
}

// Audio Editing
export interface AudioEditRequest {
  inputAudio: File | Blob;
  editType: 'emotion' | 'style' | 'paralinguistic' | 'speed' | 'denoise';
  editParams: {
    emotion?: string; // happy, sad, angry, etc.
    style?: string; // whisper, child, older, etc.
    paralinguistic?: string[]; // [Breathing], [Laughter], etc.
    speed?: number;
    removeNoise?: boolean;
    removeSilence?: boolean;
  };
  targetText?: string; // For text-based editing
}

export interface AudioEditResponse {
  audioUrl: string;
  audioBuffer?: ArrayBuffer;
  status: 'success' | 'error';
  message?: string;
  metadata?: {
    originalDuration: number;
    newDuration: number;
    processingTime: number; // ms
  };
}

// Voice Information
export interface Voice {
  id: string;
  name: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  age?: 'child' | 'young' | 'adult' | 'older';
  description?: string;
  previewUrl?: string;
  isCustom?: boolean; // Cloned voice
  metadata?: {
    quality?: number;
    provider?: string;
    model?: string;
  };
}

// ========================================================================================
// Film Production Specific Types
// ========================================================================================

export interface CharacterVoice {
  characterId: string;
  voiceId: string;
  provider: AudioProviderType;
  referenceAudio?: string; // Supabase URL
  cloneMetadata?: VoiceCloneResponse['metadata'];
  emotions: {
    [emotion: string]: string; // emotion -> voiceId mapping
  };
  lastUsed?: string; // ISO timestamp
}

export interface DialogueGeneration {
  characterId: string;
  text: string;
  emotion?: string;
  style?: string;
  sceneContext?: string;
  outputAudio?: string; // Supabase URL
  processingTime?: number;
}

export interface AudioPostProduction {
  timelineClipId: string;
  originalAudio: string;
  editedAudio?: string;
  edits: AudioEdit[];
  metadata: {
    duration: number;
    quality: number;
    lastModified: string;
  };
}

export interface AudioEdit {
  type: 'emotion' | 'style' | 'paralinguistic' | 'speed' | 'denoise';
  params: Record<string, any>;
  timestamp: string;
  provider: AudioProviderType;
}

// ========================================================================================
// Error Handling
// ========================================================================================

export enum AudioErrorCode {
  INITIALIZATION_FAILED = 'initialization_failed',
  MISSING_API_KEY = 'missing_api_key',
  INVALID_AUDIO_FORMAT = 'invalid_audio_format',
  AUDIO_TOO_SHORT = 'audio_too_short',
  AUDIO_TOO_LONG = 'audio_too_long',
  VOICE_NOT_FOUND = 'voice_not_found',
  PROCESSING_FAILED = 'processing_failed',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  NETWORK_ERROR = 'network_error',
  UNSUPPORTED_LANGUAGE = 'unsupported_language',
  UNSUPPORTED_EMOTION = 'unsupported_emotion'
}

export class AudioError extends Error {
  constructor(
    public code: AudioErrorCode,
    message: string,
    public provider: AudioProviderType,
    public details?: any
  ) {
    super(message);
    this.name = 'AudioError';
  }
}

// ========================================================================================
// Provider Configuration Schema
// ========================================================================================

export interface ProviderConfiguration {
  active: AudioProviderType;
  fallback?: AudioProviderType;
  providers: {
    [key in AudioProviderType]: {
      enabled: boolean;
      config?: AudioProviderConfig;
      priority: number; // 1 = highest
    };
  };
}

export const DEFAULT_PROVIDER_CONFIG: ProviderConfiguration = {
  active: AudioProviderType.OPENVOICE,
  providers: {
    [AudioProviderType.OPENVOICE]: {
      enabled: true,
      priority: 1
    },
    [AudioProviderType.ELEVENLABS]: {
      enabled: false,
      priority: 2,
      config: {
        apiKey: '', // User must provide
        baseUrl: 'https://api.elevenlabs.io'
      }
    },
    [AudioProviderType.COQUI_TTS]: {
      enabled: false,
      priority: 3
    },
    [AudioProviderType.HUGGINGFACE]: {
      enabled: false,
      priority: 4
    }
  }
};