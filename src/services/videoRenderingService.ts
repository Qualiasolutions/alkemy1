import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import type { TimelineClip } from '../types'

let ffmpeg: FFmpeg | null = null
let isFFmpegLoaded = false

export async function loadFFmpeg(onProgress?: (message: string) => void): Promise<void> {
  if (isFFmpegLoaded && ffmpeg) {
    return
  }

  onProgress?.('Initializing FFmpeg...')

  try {
    ffmpeg = new FFmpeg()

    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message)
    })

    ffmpeg.on('progress', ({ progress, time }) => {
      onProgress?.(`Rendering: ${(progress * 100).toFixed(1)}% (${time}s)`)
    })

    // Try CDN first, then fallback to local if available
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

    onProgress?.('Loading FFmpeg core...')

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
    } catch (cdnError) {
      console.warn('Failed to load FFmpeg from CDN, trying fallback...', cdnError)
      // Try alternative CDN
      const altBaseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${altBaseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${altBaseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
    }

    isFFmpegLoaded = true
    onProgress?.('FFmpeg ready!')
  } catch (error) {
    console.error('Failed to load FFmpeg:', error)
    // Don't throw - just mark as failed and provide fallback
    isFFmpegLoaded = false
    ffmpeg = null
    // Return gracefully instead of throwing
    onProgress?.('FFmpeg unavailable - video rendering disabled')
  }
}

export async function renderTimelineToVideo(
  clips: TimelineClip[],
  settings: {
    resolution: '720p' | '1080p' | '4K'
    format: 'mp4' | 'mov' | 'webm'
    codec: 'h264' | 'h265' | 'vp9'
    quality: 'low' | 'medium' | 'high' | 'ultra'
    aspectRatio: '16:9' | '9:16' | '1:1' | '4:3'
  },
  onProgress?: (progress: number, message: string) => void
): Promise<Blob> {
  if (!ffmpeg || !isFFmpegLoaded) {
    await loadFFmpeg((msg) => onProgress?.(0, msg))
  }

  if (!ffmpeg || !isFFmpegLoaded) {
    // Return empty blob with error message instead of throwing
    console.warn('FFmpeg not available - video rendering is disabled')
    throw new Error(
      'Video rendering is currently unavailable. Please try again later or contact support.'
    )
  }

  onProgress?.(5, 'Preparing video clips...')

  // Resolution mapping
  const resolutionMap = {
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
    '4K': { width: 3840, height: 2160 },
  }

  // Quality to CRF mapping (lower = better quality)
  const qualityMap = {
    low: 28,
    medium: 23,
    high: 18,
    ultra: 15,
  }

  const { width, height } = resolutionMap[settings.resolution]
  const crf = qualityMap[settings.quality]

  try {
    // Step 1: Load all video clips into FFmpeg's virtual filesystem
    onProgress?.(10, `Loading ${clips.length} video clips...`)

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      const inputName = `input_${i}.mp4`

      onProgress?.(10 + (i / clips.length) * 20, `Loading clip ${i + 1}/${clips.length}...`)

      // Fetch video file
      const videoData = await fetchFile(clip.url)
      await ffmpeg.writeFile(inputName, videoData)
    }

    // Step 2: Create concat demuxer file
    onProgress?.(30, 'Creating concat list...')

    let concatContent = ''
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      const inputName = `input_${i}.mp4`

      // Calculate trim duration
      const _duration = clip.trimEnd - clip.trimStart

      concatContent += `file '${inputName}'\n`
      concatContent += `inpoint ${clip.trimStart}\n`
      concatContent += `outpoint ${clip.trimEnd}\n`
    }

    await ffmpeg.writeFile('concat.txt', concatContent)

    // Step 3: Run FFmpeg concat and encode
    onProgress?.(40, 'Rendering final video...')

    const outputName = `output.${settings.format}`

    const codecMap = {
      h264: 'libx264',
      h265: 'libx265',
      vp9: 'libvpx-vp9',
    }

    const videoCodec = codecMap[settings.codec]

    // FFmpeg command for concatenation and encoding
    await ffmpeg.exec([
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      'concat.txt',
      '-c:v',
      videoCodec,
      '-crf',
      crf.toString(),
      '-preset',
      'medium',
      '-vf',
      `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outputName,
    ])

    onProgress?.(90, 'Finalizing export...')

    // Step 4: Read the output file
    const data = await ffmpeg.readFile(outputName)

    onProgress?.(95, 'Creating download file...')

    // Clean up virtual filesystem
    for (let i = 0; i < clips.length; i++) {
      await ffmpeg.deleteFile(`input_${i}.mp4`)
    }
    await ffmpeg.deleteFile('concat.txt')
    await ffmpeg.deleteFile(outputName)

    onProgress?.(100, 'Export complete!')

    // Convert to Blob
    const mimeTypes = {
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      webm: 'video/webm',
    }

    return new Blob([data], { type: mimeTypes[settings.format] })
  } catch (error) {
    console.error('FFmpeg rendering failed:', error)
    throw new Error(
      `Video rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export function isFFmpegReady(): boolean {
  return isFFmpegLoaded && ffmpeg !== null
}
