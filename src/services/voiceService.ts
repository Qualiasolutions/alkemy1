/**
 * Voice Recognition Service
 *
 * Implements voice input functionality using Web Speech API for the DirectorWidget.
 * Provides push-to-talk and continuous listening modes with film terminology support.
 *
 * Research: Based on Epic R3a validation (Web Speech API - free fallback with 78% accuracy)
 * Integration: Used by DirectorWidget for hands-free command input
 */

// SpeechRecognition API types (browser-native)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

// Service interface
export interface VoiceRecognitionService {
  start: () => void
  stop: () => void
  onResult: (callback: (transcript: string, isFinal: boolean, confidence: number) => void) => void
  onError: (callback: (error: string) => void) => void
  onEnd: (callback: () => void) => void
  onStart: (callback: () => void) => void
  isSupported: () => boolean
}

// Voice mode preference type
export type VoiceMode = 'push-to-talk' | 'always-listening' | 'text-only'

// Import userDataService for persisting preferences
import { userDataService } from './userDataService'

// Temporary cache for non-authenticated users (in-memory only)
let voiceModeCache: VoiceMode | null = null
let privacyWarningCache: boolean | null = null

/**
 * Initialize Web Speech API voice recognition
 *
 * @returns Promise<VoiceRecognitionService> - Service object with start/stop/callback methods
 * @throws Error if Web Speech API is not supported
 */
export async function initializeVoiceRecognition(): Promise<VoiceRecognitionService> {
  if (!isVoiceRecognitionSupported()) {
    throw new Error(
      'Voice recognition not supported in this browser. Please use Chrome, Edge, or Safari.'
    )
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    throw new Error('SpeechRecognition API not found')
  }

  const recognition = new SpeechRecognition()

  // Configure for film terminology recognition
  recognition.continuous = true // Keep listening until explicitly stopped
  recognition.interimResults = true // Show real-time transcription
  recognition.lang = 'en-US' // English language
  recognition.maxAlternatives = 1 // Only need top result

  // Callback storage
  let resultCallback: ((transcript: string, isFinal: boolean, confidence: number) => void) | null =
    null
  let errorCallback: ((error: string) => void) | null = null
  let endCallback: (() => void) | null = null
  let startCallback: (() => void) | null = null

  // Set up event handlers
  recognition.onresult = (event: SpeechRecognitionEvent) => {
    if (!resultCallback) return

    const last = event.results.length - 1
    const result = event.results[last]
    const transcript = result[0].transcript
    const confidence = result[0].confidence
    const isFinal = result.isFinal

    resultCallback(transcript, isFinal, confidence)
  }

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (!errorCallback) return

    let errorMessage = event.error

    // Provide user-friendly error messages
    switch (event.error) {
      case 'no-speech':
        errorMessage = 'No speech detected. Please try again.'
        break
      case 'aborted':
        errorMessage = 'Voice recognition was stopped.'
        break
      case 'audio-capture':
        errorMessage = 'Microphone not found. Please check your audio settings.'
        break
      case 'not-allowed':
        errorMessage = 'Microphone access denied. Please enable in browser settings.'
        break
      case 'network':
        errorMessage = 'Network error. Please check your internet connection.'
        break
      default:
        errorMessage = `Voice recognition error: ${event.error}`
    }

    errorCallback(errorMessage)
  }

  recognition.onend = () => {
    if (endCallback) {
      endCallback()
    }
  }

  recognition.onstart = () => {
    if (startCallback) {
      startCallback()
    }
  }

  return {
    start: () => {
      try {
        recognition.start()
      } catch (_error) {
        if (errorCallback) {
          errorCallback('Failed to start voice recognition. Please try again.')
        }
      }
    },
    stop: () => {
      try {
        recognition.stop()
      } catch (_error) {
        // Ignore errors on stop (may already be stopped)
      }
    },
    onResult: (callback) => {
      resultCallback = callback
    },
    onError: (callback) => {
      errorCallback = callback
    },
    onEnd: (callback) => {
      endCallback = callback
    },
    onStart: (callback) => {
      startCallback = callback
    },
    isSupported: () => true,
  }
}

/**
 * Check if Web Speech API voice recognition is available in the current browser
 *
 * @returns boolean - true if supported, false otherwise
 */
export function isVoiceRecognitionSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

/**
 * Get current voice mode preference
 *
 * @param userId - Optional user ID for database lookup
 * @returns Promise<VoiceMode> - 'push-to-talk' (default), 'always-listening', or 'text-only'
 */
export async function getVoiceMode(userId?: string): Promise<VoiceMode> {
  // For authenticated users, use database
  if (userId) {
    const prefs = await userDataService.getUserPreferences(userId)
    return prefs.voiceSettings.mode || 'push-to-talk'
  }

  // For anonymous users, use in-memory cache
  return voiceModeCache || 'push-to-talk'
}

/**
 * Set voice mode preference
 *
 * @param mode - 'push-to-talk', 'always-listening', or 'text-only'
 * @param userId - Optional user ID for database persistence
 */
export async function setVoiceMode(mode: VoiceMode, userId?: string): Promise<void> {
  // For authenticated users, persist to database
  if (userId) {
    await userDataService.updateVoiceSettings(userId, { mode })
  } else {
    // For anonymous users, use in-memory cache only
    voiceModeCache = mode
  }
}

/**
 * Check if privacy warning for always-listening mode has been shown
 *
 * @param userId - Optional user ID for database lookup
 * @returns Promise<boolean> - true if warning has been shown, false if needs to be displayed
 */
export async function hasShownPrivacyWarning(userId?: string): Promise<boolean> {
  // For authenticated users, use database
  if (userId) {
    const prefs = await userDataService.getUserPreferences(userId)
    return prefs.voiceSettings.privacyWarningShown || false
  }

  // For anonymous users, use in-memory cache
  return privacyWarningCache || false
}

/**
 * Mark privacy warning as shown (for always-listening mode)
 *
 * @param userId - Optional user ID for database persistence
 */
export async function markPrivacyWarningShown(userId?: string): Promise<void> {
  // For authenticated users, persist to database
  if (userId) {
    await userDataService.updateVoiceSettings(userId, { privacyWarningShown: true })
  } else {
    // For anonymous users, use in-memory cache only
    privacyWarningCache = true
  }
}

/**
 * Get browser-specific instructions for enabling microphone access
 *
 * @returns string - HTML string with instructions
 */
export function getMicrophoneInstructions(): string {
  const userAgent = navigator.userAgent.toLowerCase()

  if (userAgent.includes('chrome') && !userAgent.includes('edge')) {
    return `
            <strong>Chrome:</strong> Click the camera icon in the address bar, then select "Allow" for microphone access.
            <br/>Alternatively, go to chrome://settings/content/microphone and add this site to the "Allow" list.
        `
  } else if (userAgent.includes('firefox')) {
    return `
            <strong>Firefox:</strong> Click the microphone icon in the address bar, then select "Allow".
            <br/>Alternatively, go to about:preferences#privacy, scroll to "Permissions", and manage microphone access.
        `
  } else if (userAgent.includes('safari')) {
    return `
            <strong>Safari:</strong> Go to Safari > Settings for This Website, then change "Microphone" to "Allow".
            <br/>Or go to System Preferences > Security & Privacy > Privacy > Microphone and enable Safari.
        `
  } else if (userAgent.includes('edge') || userAgent.includes('edg')) {
    return `
            <strong>Edge:</strong> Click the lock icon in the address bar, then change "Microphone" to "Allow".
            <br/>Alternatively, go to edge://settings/content/microphone and add this site to the "Allow" list.
        `
  } else {
    return `
            <strong>Instructions:</strong> Please check your browser's settings to enable microphone access for this website.
        `
  }
}

/**
 * Request microphone permission from the browser
 * This is a helper that triggers the permission prompt if not already granted
 *
 * @returns Promise<boolean> - true if permission granted, false if denied
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    // Try to access microphone via getUserMedia (triggers permission prompt)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // Stop the stream immediately (we just needed permission)
    stream.getTracks().forEach((track) => track.stop())

    return true
  } catch (error) {
    console.error('Microphone permission denied:', error)
    return false
  }
}

// ========================================================================================
// Voice Output (Text-to-Speech) - Story 1.2
// ========================================================================================

/**
 * Voice output (TTS) functionality using Web Speech API SpeechSynthesis.
 * Provides text-to-speech for Director responses with playback controls.
 *
 * Research: Based on Epic R3a validation (Web Speech API TTS - free, browser-native)
 * Integration: Used by DirectorWidget for hands-free response output
 */

// TTS types
export interface TTSOptions {
  voice?: SpeechSynthesisVoice | null
  rate?: number // 0.5 - 2.0 (default 1.0)
  pitch?: number // 0 - 2 (default 1.0)
  volume?: number // 0 - 1 (default 1.0)
}

export interface TTSCallbacks {
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
  onPause?: () => void
  onResume?: () => void
}

// Temporary cache for voice output preferences (non-authenticated users)
let voiceOutputEnabledCache: boolean | null = null
let voiceOutputVoiceIdCache: string | null = null
let voiceOutputRateCache: number | null = null

// Current utterance tracking (for pause/resume/stop)
let _currentUtterance: SpeechSynthesisUtterance | null = null
let isPaused = false

/**
 * Check if Web Speech API TTS is available in the current browser
 *
 * @returns boolean - true if supported, false otherwise
 */
export function isVoiceSynthesisSupported(): boolean {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

/**
 * Get all available voices from the browser
 * Note: Some browsers load voices asynchronously, so this may need to be called after a delay
 *
 * @returns Promise<SpeechSynthesisVoice[]> - Array of available voices
 */
export async function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices()

    if (voices.length > 0) {
      resolve(voices)
    } else {
      // Some browsers need time to load voices
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices()
        resolve(voices)
      }

      // Fallback timeout (5 seconds)
      setTimeout(() => {
        voices = window.speechSynthesis.getVoices()
        resolve(voices)
      }, 5000)
    }
  })
}

/**
 * Get the default voice (first English voice, or first voice available)
 *
 * @returns Promise<SpeechSynthesisVoice | null>
 */
export async function getDefaultVoice(): Promise<SpeechSynthesisVoice | null> {
  const voices = await getAvailableVoices()

  // Try to find English voice
  const englishVoice = voices.find((voice) => voice.lang.startsWith('en'))
  if (englishVoice) return englishVoice

  // Fallback to first available voice
  return voices.length > 0 ? voices[0] : null
}

/**
 * Synthesize text to speech and play audio
 *
 * @param text - Text to speak
 * @param options - TTS options (voice, rate, pitch, volume)
 * @param callbacks - Event callbacks (onStart, onEnd, onError, onPause, onResume)
 */
export function speakText(
  text: string,
  options: TTSOptions = {},
  callbacks: TTSCallbacks = {}
): void {
  if (!isVoiceSynthesisSupported()) {
    if (callbacks.onError) {
      callbacks.onError(new Error('Text-to-speech not supported in this browser'))
    }
    return
  }

  // Stop any current playback
  stopSpeech()

  // Create new utterance
  const utterance = new SpeechSynthesisUtterance(text)

  // Apply options
  if (options.voice) {
    utterance.voice = options.voice
  }
  utterance.rate = options.rate ?? 1.0
  utterance.pitch = options.pitch ?? 1.0
  utterance.volume = options.volume ?? 1.0
  utterance.lang = 'en-US'

  // Set up event handlers
  utterance.onstart = () => {
    isPaused = false
    if (callbacks.onStart) callbacks.onStart()
  }

  utterance.onend = () => {
    _currentUtterance = null
    isPaused = false
    if (callbacks.onEnd) callbacks.onEnd()
  }

  utterance.onerror = (event) => {
    _currentUtterance = null
    isPaused = false
    if (callbacks.onError) {
      callbacks.onError(new Error(`Speech synthesis error: ${event.error}`))
    }
  }

  utterance.onpause = () => {
    isPaused = true
    if (callbacks.onPause) callbacks.onPause()
  }

  utterance.onresume = () => {
    isPaused = false
    if (callbacks.onResume) callbacks.onResume()
  }

  // Store current utterance
  _currentUtterance = utterance

  // Speak
  try {
    window.speechSynthesis.speak(utterance)
  } catch (error) {
    _currentUtterance = null
    if (callbacks.onError) {
      callbacks.onError(error as Error)
    }
  }
}

/**
 * Pause current speech playback
 */
export function pauseSpeech(): void {
  if (!isVoiceSynthesisSupported()) return

  if (window.speechSynthesis.speaking && !isPaused) {
    window.speechSynthesis.pause()
  }
}

/**
 * Resume paused speech playback
 */
export function resumeSpeech(): void {
  if (!isVoiceSynthesisSupported()) return

  if (isPaused) {
    window.speechSynthesis.resume()
  }
}

/**
 * Stop current speech playback and clear queue
 */
export function stopSpeech(): void {
  if (!isVoiceSynthesisSupported()) return

  window.speechSynthesis.cancel()
  _currentUtterance = null
  isPaused = false
}

/**
 * Check if speech is currently playing
 *
 * @returns boolean - true if speaking, false otherwise
 */
export function isSpeaking(): boolean {
  if (!isVoiceSynthesisSupported()) return false
  return window.speechSynthesis.speaking
}

/**
 * Check if speech is currently paused
 *
 * @returns boolean - true if paused, false otherwise
 */
export function isSpeechPaused(): boolean {
  return isPaused
}

// ========================================================================================
// Voice Output Preferences (Database/Cache)
// ========================================================================================

/**
 * Check if voice output is enabled (user preference)
 *
 * @param userId - Optional user ID for database lookup
 * @returns Promise<boolean> - true if enabled, false if disabled (default: false, opt-in)
 */
export async function isVoiceOutputEnabled(userId?: string): Promise<boolean> {
  // For authenticated users, use database
  if (userId) {
    const prefs = await userDataService.getUserPreferences(userId)
    return prefs.voiceSettings.outputEnabled || false
  }

  // For anonymous users, use in-memory cache
  return voiceOutputEnabledCache || false
}

/**
 * Set voice output enabled preference
 *
 * @param enabled - true to enable, false to disable
 * @param userId - Optional user ID for database persistence
 */
export async function setVoiceOutputEnabled(enabled: boolean, userId?: string): Promise<void> {
  // For authenticated users, persist to database
  if (userId) {
    await userDataService.updateVoiceSettings(userId, { outputEnabled: enabled })
  } else {
    // For anonymous users, use in-memory cache only
    voiceOutputEnabledCache = enabled
  }
}

/**
 * Get saved voice preference (voice ID)
 *
 * @param userId - Optional user ID for database lookup
 * @returns Promise<string | null> - Saved voice name, or null if not set
 */
export async function getSavedVoiceId(userId?: string): Promise<string | null> {
  // For authenticated users, use database
  if (userId) {
    const prefs = await userDataService.getUserPreferences(userId)
    return prefs.voiceSettings.outputVoiceId
  }

  // For anonymous users, use in-memory cache
  return voiceOutputVoiceIdCache
}

/**
 * Set voice preference (save voice ID)
 *
 * @param voiceId - Voice name to save
 * @param userId - Optional user ID for database persistence
 */
export async function setSavedVoiceId(voiceId: string, userId?: string): Promise<void> {
  // For authenticated users, persist to database
  if (userId) {
    await userDataService.updateVoiceSettings(userId, { outputVoiceId: voiceId })
  } else {
    // For anonymous users, use in-memory cache only
    voiceOutputVoiceIdCache = voiceId
  }
}

/**
 * Get saved speech rate preference
 *
 * @param userId - Optional user ID for database lookup
 * @returns Promise<number> - Speech rate (0.5 - 2.0), default 1.0
 */
export async function getSavedSpeechRate(userId?: string): Promise<number> {
  // For authenticated users, use database
  if (userId) {
    const prefs = await userDataService.getUserPreferences(userId)
    const rate = prefs.voiceSettings.speechRate
    if (rate && rate >= 0.5 && rate <= 2.0) {
      return rate
    }
  } else if (voiceOutputRateCache !== null) {
    // For anonymous users, use in-memory cache
    return voiceOutputRateCache
  }

  return 1.0 // Default
}

/**
 * Set speech rate preference
 *
 * @param rate - Speech rate (0.5 - 2.0)
 * @param userId - Optional user ID for database persistence
 */
export async function setSavedSpeechRate(rate: number, userId?: string): Promise<void> {
  // Clamp to valid range
  const clampedRate = Math.max(0.5, Math.min(2.0, rate))

  // For authenticated users, persist to database
  if (userId) {
    await userDataService.updateVoiceSettings(userId, { speechRate: clampedRate })
  } else {
    // For anonymous users, use in-memory cache only
    voiceOutputRateCache = clampedRate
  }
}

/**
 * Get saved voice object from saved voice ID
 *
 * @param userId - Optional user ID for database lookup
 * @returns Promise<SpeechSynthesisVoice | null> - Saved voice or null
 */
export async function getSavedVoice(userId?: string): Promise<SpeechSynthesisVoice | null> {
  const savedId = await getSavedVoiceId(userId)
  if (!savedId) return null

  const voices = await getAvailableVoices()
  return voices.find((voice) => voice.name === savedId) || null
}
