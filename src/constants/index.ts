export const THEME_COLORS = {
  background_primary: '#0B0B0B',
  background_secondary: '#121212',
  surface_card: '#161616',
  accent_primary: '#DFEC2D',
  accent_secondary: '#FDE047',
  text_primary: '#FFFFFF',
  text_secondary: '#B5B5B5',
  border_color: '#242424',
  divider_color: '#1A1A1A',
  hover_background: '#1B1B1B',
  active_background: '#202020',
  success: '#10B981',
  warning: '#F5A524',
  error: '#EF4444',
}

export const TABS_CONFIG = [
  {
    name: 'PRODUCTION',
    tabs: [
      { id: 'script', name: 'Script', icon: '/script.svg' },
      { id: 'moodboard', name: 'Moodboard', icon: '/moodboard.svg' },
      { id: 'cast_locations', name: 'Cast & Locations', icon: '/cast_locations.svg' },
      { id: '3d_worlds', name: 'Generate World', icon: '/worlds_3d.svg' },
      { id: 'compositing', name: 'Compositing', icon: '/compositing.svg' },
      { id: 'presentation', name: 'Presentation', icon: '/presentation.svg' },
    ],
  },
  {
    name: 'TOOLS',
    tabs: [
      { id: 'generate', name: 'Generate', icon: '/compositing.svg' },
      { id: 'timeline', name: 'Timeline', icon: '/timeline.svg' },
      { id: 'wan_transfer', name: 'Wan Transfer', icon: '/wan_transfer.svg' },
      { id: 'exports', name: 'Exports', icon: '/exports.svg' },
      { id: 'project_roadmap', name: 'Project Roadmap', icon: '/analytics.svg' }, // Renamed from BMAD Status
    ],
  },
]

// A flattened array for convenience in other parts of the app (e.g., setting the default tab in App.tsx)
export const TABS = TABS_CONFIG.flatMap((group) => group.tabs)

// ========================================================================================
// Audio Provider Configuration
// ========================================================================================

/**
 * Centralized audio provider configuration for voice cloning and TTS.
 * Switch between OpenVoice (free) and ElevenLabs (premium) by changing ACTIVE_PROVIDER.
 */
export const AUDIO_PROVIDER_CONFIG = {
  // Active provider (switch here to change provider globally)
  // Change this single line to switch from OpenVoice to ElevenLabs!
  ACTIVE_PROVIDER: (import.meta.env.VITE_AUDIO_PROVIDER || 'openvoice') as
    | 'openvoice'
    | 'elevenlabs',

  // OpenVoice Configuration (FREE - Default)
  OPENVOICE: {
    API_URL: import.meta.env.VITE_OPENVOICE_API_URL || 'http://localhost:8000',
    ENABLED: true,
  },

  // ElevenLabs Configuration (PREMIUM - Upgrade option)
  ELEVENLABS: {
    API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
    BASE_URL: 'https://api.elevenlabs.io',
    ENABLED: !!import.meta.env.VITE_ELEVENLABS_API_KEY,
  },
} as const

// Feature Flags
export const FEATURE_FLAGS = {
  VOICE_CLONING: true, // Enable voice cloning in Character Identity
  EMOTION_EDITING: true, // Enable emotion editing in Post Production
  AUDIO_POST_PRODUCTION: true, // Enable full audio editing suite
  PROVIDER_SWITCHING: true, // Allow users to switch audio providers in settings
} as const

// Audio Processing Limits
export const AUDIO_LIMITS = {
  MAX_REFERENCE_AUDIO_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_REFERENCE_AUDIO_DURATION: 6, // 6 seconds minimum for quality cloning
  MAX_AUDIO_GENERATION_LENGTH: 30, // 30 seconds for OpenVoice, 600 for ElevenLabs
  SUPPORTED_AUDIO_FORMATS: ['mp3', 'wav', 'ogg', 'm4a', 'flac'] as const,
} as const

// Supported Emotions (intersection of OpenVoice and ElevenLabs)
export const SUPPORTED_EMOTIONS = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'surprised',
  'whisper',
  'serious',
] as const

// Supported Audio Styles
export const SUPPORTED_STYLES = [
  'narrative',
  'conversational',
  'dramatic',
  'calm',
  'energetic',
] as const

export type SupportedEmotion = (typeof SUPPORTED_EMOTIONS)[number]
export type SupportedStyle = (typeof SUPPORTED_STYLES)[number]
