/**
 * Audio Mixing Service - WebAudio API Integration
 *
 * Provides real-time multi-track audio mixing capabilities for the Alkemy timeline.
 * Uses WebAudio API for browser-based mixing preview and FFmpeg.wasm for final export.
 *
 * Features:
 * - Real-time playback with 3+ audio tracks
 * - Independent volume controls per track
 * - Waveform visualization
 * - Timeline synchronization with video playback
 * - Seek/scrub support
 * - Low-latency mixing (<100ms)
 *
 * Architecture:
 * - WebAudio API: Real-time preview during editing
 * - FFmpeg.wasm: Final mixed audio export (integrated with video rendering)
 */

export interface AudioTrack {
  id: string
  type: 'dialogue' | 'music' | 'effects' | 'ambient'
  url: string
  volume: number // 0.0 to 1.0
  isMuted: boolean
  audioBuffer: AudioBuffer | null
  sourceNode: AudioBufferSourceNode | null
  gainNode: GainNode | null
  startTime: number // timeline offset in seconds
  duration: number
}

export interface MixerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  tracks: AudioTrack[]
  masterVolume: number
}

export class AudioMixingService {
  private audioContext: AudioContext | null = null
  private masterGainNode: GainNode | null = null
  private tracks: Map<string, AudioTrack> = new Map()
  private playbackStartTime: number = 0
  private pausedAt: number = 0
  private isPlaying: boolean = false

  constructor() {
    this.initializeAudioContext()
  }

  /**
   * Add an audio track to the mixer
   */
  async addTrack(
    id: string,
    type: 'dialogue' | 'music' | 'effects' | 'ambient',
    url: string,
    startTime: number = 0,
    volume: number = 1.0
  ): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized')
    }

    try {
      // Fetch and decode audio file
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      // Create gain node for volume control
      const gainNode = this.audioContext.createGain()
      gainNode.gain.value = volume
      gainNode.connect(this.masterGainNode!)

      const track: AudioTrack = {
        id,
        type,
        url,
        volume,
        isMuted: false,
        audioBuffer,
        sourceNode: null,
        gainNode,
        startTime,
        duration: audioBuffer.duration,
      }

      this.tracks.set(id, track)
    } catch (error) {
      console.error(`Failed to load audio track ${id}:`, error)
      throw error
    }
  }

  /**
   * Remove a track from the mixer
   */
  removeTrack(id: string): void {
    const track = this.tracks.get(id)
    if (track) {
      this.stopTrack(track)
      if (track.gainNode) {
        track.gainNode.disconnect()
      }
      this.tracks.delete(id)
    }
  }

  /**
   * Update track volume
   */
  setTrackVolume(id: string, volume: number): void {
    const track = this.tracks.get(id)
    if (track?.gainNode) {
      track.volume = Math.max(0, Math.min(1, volume))
      track.gainNode.gain.value = track.isMuted ? 0 : track.volume
    }
  }

  /**
   * Mute/unmute a track
   */
  setTrackMuted(id: string, muted: boolean): void {
    const track = this.tracks.get(id)
    if (track?.gainNode) {
      track.isMuted = muted
      track.gainNode.gain.value = muted ? 0 : track.volume
    }
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * Start playback from current position
   */
  play(): void {
    if (!this.audioContext || this.isPlaying) return

    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const currentTime = this.pausedAt
    this.playbackStartTime = this.audioContext.currentTime - currentTime
    this.isPlaying = true

    // Start all tracks
    this.tracks.forEach((track) => {
      this.playTrack(track, currentTime)
    })
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.audioContext || !this.isPlaying) return

    this.pausedAt = this.audioContext.currentTime - this.playbackStartTime
    this.isPlaying = false

    // Stop all tracks
    this.tracks.forEach((track) => {
      this.stopTrack(track)
    })
  }

  /**
   * Stop playback and reset to beginning
   */
  stop(): void {
    this.pause()
    this.pausedAt = 0
  }

  /**
   * Seek to a specific time
   */
  seek(time: number): void {
    const wasPlaying = this.isPlaying

    if (wasPlaying) {
      this.pause()
    }

    this.pausedAt = time

    if (wasPlaying) {
      this.play()
    }
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    if (!this.audioContext) return 0

    if (this.isPlaying) {
      return this.audioContext.currentTime - this.playbackStartTime
    }
    return this.pausedAt
  }

  /**
   * Get total duration (longest track)
   */
  getDuration(): number {
    let maxDuration = 0
    this.tracks.forEach((track) => {
      const trackEnd = track.startTime + track.duration
      if (trackEnd > maxDuration) {
        maxDuration = trackEnd
      }
    })
    return maxDuration
  }

  /**
   * Get mixer state
   */
  getState(): MixerState {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      tracks: Array.from(this.tracks.values()),
      masterVolume: this.masterGainNode?.gain.value || 1.0,
    }
  }

  /**
   * Get waveform data for visualization
   */
  getWaveformData(trackId: string, width: number = 1000): Float32Array | null {
    const track = this.tracks.get(trackId)
    if (!track || !track.audioBuffer) return null

    const audioBuffer = track.audioBuffer
    const rawData = audioBuffer.getChannelData(0) // Use first channel
    const samples = width
    const blockSize = Math.floor(rawData.length / samples)
    const filteredData = new Float32Array(samples)

    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i
      let sum = 0
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j])
      }
      filteredData[i] = sum / blockSize
    }

    return filteredData
  }

  /**
   * Export mixed audio as blob (for timeline integration)
   */
  async exportMixedAudio(duration?: number): Promise<Blob> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized')
    }

    const exportDuration = duration || this.getDuration()
    const sampleRate = this.audioContext.sampleRate
    const numberOfChannels = 2 // Stereo
    const length = sampleRate * exportDuration

    // Create offline audio context for rendering
    const offlineContext = new OfflineAudioContext(numberOfChannels, length, sampleRate)

    const masterGain = offlineContext.createGain()
    masterGain.gain.value = this.masterGainNode?.gain.value || 1.0
    masterGain.connect(offlineContext.destination)

    // Render all tracks
    const promises: Promise<void>[] = []
    this.tracks.forEach((track) => {
      if (!track.audioBuffer) return

      const source = offlineContext.createBufferSource()
      source.buffer = track.audioBuffer

      const gainNode = offlineContext.createGain()
      gainNode.gain.value = track.isMuted ? 0 : track.volume

      source.connect(gainNode)
      gainNode.connect(masterGain)

      source.start(track.startTime)
      promises.push(Promise.resolve())
    })

    await Promise.all(promises)

    // Render the mixed audio
    const renderedBuffer = await offlineContext.startRendering()

    // Convert to WAV blob
    const wavBlob = this.audioBufferToWav(renderedBuffer)
    return wavBlob
  }

  /**
   * Convert AudioBuffer to WAV Blob
   */
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numberOfChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16

    const bytesPerSample = bitDepth / 8
    const blockAlign = numberOfChannels * bytesPerSample

    const data = new Float32Array(buffer.length * numberOfChannels)
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      const channelData = buffer.getChannelData(i)
      for (let j = 0; j < buffer.length; j++) {
        data[j * numberOfChannels + i] = channelData[j]
      }
    }

    const dataLength = data.length * bytesPerSample
    const bufferLength = 44 + dataLength
    const arrayBuffer = new ArrayBuffer(bufferLength)
    const view = new DataView(arrayBuffer)

    // WAV header
    this.writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + dataLength, true)
    this.writeString(view, 8, 'WAVE')
    this.writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true) // Format chunk size
    view.setUint16(20, format, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    this.writeString(view, 36, 'data')
    view.setUint32(40, dataLength, true)

    // Write audio data
    let offset = 44
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  /**
   * Play a single track
   */
  private playTrack(track: AudioTrack, currentTime: number): void {
    if (!this.audioContext || !track.audioBuffer || !track.gainNode) return

    // Stop existing source if playing
    this.stopTrack(track)

    // Create new source
    const source = this.audioContext.createBufferSource()
    source.buffer = track.audioBuffer
    source.connect(track.gainNode)

    // Calculate playback position
    const trackStartTime = track.startTime
    const offset = Math.max(0, currentTime - trackStartTime)

    if (offset < track.duration) {
      source.start(0, offset)
      track.sourceNode = source
    }
  }

  /**
   * Stop a single track
   */
  private stopTrack(track: AudioTrack): void {
    if (track.sourceNode) {
      try {
        track.sourceNode.stop()
      } catch (_e) {
        // Source may already be stopped
      }
      track.sourceNode.disconnect()
      track.sourceNode = null
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop()
    this.tracks.forEach((track) => {
      if (track.gainNode) {
        track.gainNode.disconnect()
      }
    })
    this.tracks.clear()

    if (this.masterGainNode) {
      this.masterGainNode.disconnect()
    }

    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}

/**
 * Global mixer instance (singleton pattern)
 */
let globalMixer: AudioMixingService | null = null

export function getAudioMixer(): AudioMixingService {
  if (!globalMixer) {
    globalMixer = new AudioMixingService()
  }
  return globalMixer
}

export function disposeAudioMixer(): void {
  if (globalMixer) {
    globalMixer.dispose()
    globalMixer = null
  }
}
