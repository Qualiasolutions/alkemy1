/**
 * TTM Generation Panel Component
 * UI for configuring and launching TTM video generation
 */

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Download,
  Loader2,
  Play,
  Settings,
  Share2,
  Sparkles,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import {
  type CameraMovement,
  CameraMovementType,
  checkTTMStatus,
  createCircularTrajectory,
  createDollyZoom,
  createLinearTrajectory,
  createOrbitMovement,
  generateTTMVideo,
  MotionType,
  type Point2D,
  type TTMResponse,
} from '../services/ttmService'
import MotionTrajectoryEditor from './MotionTrajectoryEditor'

interface TTMGenerationPanelProps {
  imageUrl: string
  onVideoGenerated?: (videoUrl: string, thumbnailUrl: string) => void
  frameId?: string
  projectId?: string
  className?: string
}

interface GenerationPreset {
  name: string
  motionType: MotionType
  description: string
  icon: React.ReactNode
  getPrompt: (frameDescription?: string) => string
  getMotion: () => {
    trajectory?: Point2D[]
    cameraMovement?: CameraMovement
  }
}

export default function TTMGenerationPanel({
  imageUrl,
  onVideoGenerated,
  frameId,
  projectId,
  className = '',
}: TTMGenerationPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationResult, setGenerationResult] = useState<TTMResponse | null>(null)
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>('custom')
  const [error, setError] = useState<string | null>(null)
  const [isTTMAvailable, setIsTTMAvailable] = useState(false)
  const [showTrajectory, setShowTrajectory] = useState(false)

  // Generation parameters
  const [motionType, setMotionType] = useState<MotionType>(MotionType.OBJECT)
  const [prompt, setPrompt] = useState('')
  const [trajectory, setTrajectory] = useState<Point2D[]>([])
  const [cameraMovement, setCameraMovement] = useState<CameraMovement | undefined>()

  // Advanced parameters
  const [tweakIndex, setTweakIndex] = useState(3)
  const [tstrongIndex, setTstrongIndex] = useState(7)
  const [numFrames, setNumFrames] = useState(81)
  const [guidanceScale, setGuidanceScale] = useState(3.5)
  const [seed, setSeed] = useState<number | undefined>()

  // Check TTM availability on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const available = await checkTTMStatus()
        setIsTTMAvailable(available)
      } catch (error) {
        console.error('[TTMGenerationPanel] Failed to check TTM status:', error)
        setIsTTMAvailable(false)
      }
    }
    checkStatus()
  }, [])

  // Motion presets
  const motionPresets: GenerationPreset[] = [
    {
      name: 'linear',
      motionType: MotionType.OBJECT,
      description: 'Linear object movement',
      icon: <ChevronRight className="w-4 h-4" />,
      getPrompt: (desc) => `${desc} moving in a straight line`,
      getMotion: () => ({
        trajectory: createLinearTrajectory({ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 }, numFrames),
      }),
    },
    {
      name: 'circular',
      motionType: MotionType.OBJECT,
      description: 'Circular object motion',
      icon: <Sparkles className="w-4 h-4" />,
      getPrompt: (desc) => `${desc} moving in a circular path`,
      getMotion: () => ({
        trajectory: createCircularTrajectory({ x: 0.5, y: 0.5 }, 0.3, numFrames),
      }),
    },
    {
      name: 'pan',
      motionType: MotionType.CAMERA,
      description: 'Camera pan across scene',
      icon: <ChevronRight className="w-4 h-4" />,
      getPrompt: (desc) => `Camera panning across ${desc}`,
      getMotion: () => ({
        cameraMovement: {
          type: CameraMovementType.PAN,
          params: { dx: 0.3, dy: 0 },
        },
      }),
    },
    {
      name: 'dolly-zoom',
      motionType: MotionType.CAMERA,
      description: 'Dolly zoom effect',
      icon: <Zap className="w-4 h-4" />,
      getPrompt: (desc) => `${desc} with dramatic zoom`,
      getMotion: () => createDollyZoom(1.5, 0.3),
    },
    {
      name: 'orbit',
      motionType: MotionType.CAMERA,
      description: 'Camera orbit around subject',
      icon: <Sparkles className="w-4 h-4" />,
      getPrompt: (desc) => `Camera orbiting around ${desc}`,
      getMotion: () => createOrbitMovement(45, 0),
    },
  ]

  const handlePresetSelect = (presetName: string) => {
    const preset = motionPresets.find((p) => p.name === presetName)
    if (!preset) return

    setSelectedPreset(presetName)
    setMotionType(preset.motionType)
    const motion = preset.getMotion()

    if (motion.trajectory) {
      setTrajectory(motion.trajectory)
      setCameraMovement(undefined)
    } else if (motion.cameraMovement) {
      setCameraMovement(motion.cameraMovement)
      setTrajectory([])
    }

    // Set prompt from preset
    setPrompt(preset.getPrompt('the scene'))
  }

  // Helper function for number validation
  const validateNumberInput = (
    value: string,
    min: number,
    max: number,
    defaultValue: number
  ): number => {
    const parsed = parseFloat(value)
    if (Number.isNaN(parsed)) return defaultValue
    return Math.max(min, Math.min(max, parsed))
  }

  const handleGenerate = async () => {
    if (!isTTMAvailable) {
      setError('TTM service is not available. Please check your connection.')
      return
    }

    // Validate image URL
    if (!imageUrl || !imageUrl.startsWith('http')) {
      setError('Invalid image URL provided.')
      return
    }

    // Validate prompt
    if (!prompt.trim()) {
      setError('Please provide a motion description.')
      return
    }

    // Validate motion parameters
    if (motionType === MotionType.OBJECT) {
      if (!trajectory || trajectory.length < 2) {
        setError('Please draw a motion trajectory with at least 2 points or select a preset.')
        return
      }
      // Validate trajectory points are within [0,1] range
      if (trajectory.some((p) => p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1)) {
        setError('Invalid trajectory points. All points must be within the image bounds.')
        return
      }
    }

    if (motionType === MotionType.CAMERA) {
      if (!cameraMovement) {
        setError('Please specify camera movement parameters.')
        return
      }
    }

    // Validate advanced parameters
    if (isAdvancedMode) {
      if (tweakIndex < 0 || tweakIndex > 50) {
        setError('Tweak Index must be between 0 and 50.')
        return
      }
      if (tstrongIndex < 0 || tstrongIndex > 50) {
        setError('TStrong Index must be between 0 and 50.')
        return
      }
      if (numFrames < 16 || numFrames > 161 || numFrames % 16 !== 0) {
        setError('Number of frames must be between 16 and 161 in increments of 16.')
        return
      }
      if (guidanceScale < 1 || guidanceScale > 10) {
        setError('Guidance Scale must be between 1 and 10.')
        return
      }
    }

    const abortController = new AbortController()

    setIsGenerating(true)
    setError(null)
    setGenerationProgress(0)
    setGenerationResult(null)

    try {
      const response = await generateTTMVideo(
        imageUrl,
        {
          motionType,
          prompt: prompt.trim(),
          trajectory: motionType === MotionType.OBJECT ? trajectory : undefined,
          cameraMovement: motionType === MotionType.CAMERA ? cameraMovement : undefined,
          tweakIndex: isAdvancedMode ? tweakIndex : undefined,
          tstrongIndex: isAdvancedMode ? tstrongIndex : undefined,
          numFrames,
          guidanceScale,
          seed,
          projectId,
        },
        (progress) => {
          if (!abortController.signal.aborted) {
            setGenerationProgress(progress)
          }
        }
      )

      if (!abortController.signal.aborted) {
        setGenerationResult(response)

        if (response.status === 'completed' && response.videoUrl) {
          onVideoGenerated?.(response.videoUrl, response.thumbnailUrl || imageUrl)
        } else if (response.status === 'failed' && response.error) {
          setError(response.error)
        }
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : 'Generation failed'
        console.error('[TTMGenerationPanel] Generation failed:', err)

        // Handle specific error types
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          setError('Network error. Please check your connection and try again.')
        } else if (errorMessage.includes('timeout')) {
          setError('Generation timed out. Please try again with simpler parameters.')
        } else if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
          setError('Invalid parameters. Please check your motion settings.')
        } else if (errorMessage.includes('trajectory')) {
          setError('Invalid trajectory. Please draw a valid motion path.')
        } else {
          setError(errorMessage)
        }
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsGenerating(false)
      }
    }

    // Cleanup function
    return () => {
      abortController.abort()
    }
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">TTM Motion Control</h3>
            <p className="text-sm text-gray-400">Generate precise motion from still images</p>
          </div>
        </div>

        {/* Service Status */}
        <div
          className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            isTTMAvailable ? 'bg-[#DFEC2D]/20' : 'bg-red-600/20'
          }`}
        >
          {isTTMAvailable ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#DFEC2D]" />
              <span className="text-sm text-[#DFEC2D]">TTM Active</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">TTM Offline</span>
            </>
          )}
        </div>
      </div>

      {!isTTMAvailable && (
        <div className="mb-4 p-3 bg-#FDE047/20 border border-#FDE047/30 rounded-lg">
          <p className="text-sm text-#DFEC2D">
            TTM service is not available. Please ensure the TTM API server is running at the
            configured URL.
          </p>
        </div>
      )}

      {/* Preset Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">Quick Presets</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {motionPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset.name)}
              className={`p-3 rounded-lg border transition-all ${
                selectedPreset === preset.name
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                  : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                {preset.icon}
                <span className="text-xs">{preset.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trajectory Editor */}
      <AnimatePresence>
        {showTrajectory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <MotionTrajectoryEditor
              imageUrl={imageUrl}
              motionType={motionType}
              onTrajectoryComplete={setTrajectory}
              onCameraMovementComplete={setCameraMovement}
              className="mb-4"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="space-y-4">
        {/* Motion Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Motion Type</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setMotionType(MotionType.OBJECT)}
              className={`px-4 py-2 rounded-lg flex-1 ${
                motionType === MotionType.OBJECT
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              Object Motion
            </button>
            <button
              onClick={() => setMotionType(MotionType.CAMERA)}
              className={`px-4 py-2 rounded-lg flex-1 ${
                motionType === MotionType.CAMERA
                  ? 'bg-[var(--color-accent-primary)] text-black'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              Camera Motion
            </button>
          </div>
        </div>

        {/* Show Trajectory Editor Button */}
        {!showTrajectory && (
          <button
            onClick={() => setShowTrajectory(true)}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center justify-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Open Motion Editor</span>
          </button>
        )}

        {/* Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Motion Description</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the desired motion..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none"
            rows={3}
          />
        </div>

        {/* Advanced Settings */}
        <div>
          <button
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${isAdvancedMode ? 'rotate-90' : ''}`}
            />
            <span className="text-sm">Advanced Settings</span>
          </button>

          <AnimatePresence>
            {isAdvancedMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Tweak Index</label>
                    <input
                      type="number"
                      value={tweakIndex}
                      onChange={(e) => setTweakIndex(validateNumberInput(e.target.value, 0, 50, 3))}
                      min="0"
                      max="50"
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">TStrong Index</label>
                    <input
                      type="number"
                      value={tstrongIndex}
                      onChange={(e) =>
                        setTstrongIndex(validateNumberInput(e.target.value, 0, 50, 7))
                      }
                      min="0"
                      max="50"
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Frames</label>
                    <input
                      type="number"
                      value={numFrames}
                      onChange={(e) => {
                        const val = validateNumberInput(e.target.value, 16, 161, 81)
                        // Ensure it's a multiple of 16
                        setNumFrames(Math.round(val / 16) * 16)
                      }}
                      min="16"
                      max="161"
                      step="16"
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Guidance</label>
                    <input
                      type="number"
                      value={guidanceScale}
                      onChange={(e) =>
                        setGuidanceScale(validateNumberInput(e.target.value, 1, 10, 3.5))
                      }
                      min="1"
                      max="10"
                      step="0.5"
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Seed (optional)</label>
                  <input
                    type="number"
                    value={seed || ''}
                    onChange={(e) =>
                      setSeed(e.target.value ? parseInt(e.target.value, 10) : undefined)
                    }
                    placeholder="Random"
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-red-600/20 border border-red-600/30 rounded-lg"
          >
            <p className="text-sm text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generation Progress */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Generating...</span>
              <span className="text-sm text-gray-400">{Math.round(generationProgress * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[var(--color-accent-secondary)] to-[var(--color-accent-primary)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress * 100}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {generationResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 p-4 bg-gray-700/50 rounded-lg"
          >
            <h4 className="text-sm font-medium text-gray-300 mb-2">Generation Complete</h4>
            <div className="space-y-1 text-xs text-gray-400">
              <p>Frames: {generationResult.frames}</p>
              <p>Duration: {generationResult.durationSeconds?.toFixed(2)}s</p>
              <p>Generation time: {generationResult.generationTime?.toFixed(2)}s</p>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex space-x-2">
              {generationResult.videoUrl && (
                <a
                  href={generationResult.videoUrl}
                  download={`ttm-${frameId}.mp4`}
                  className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </a>
              )}
              {generationResult.thumbnailUrl && (
                <button
                  onClick={() => {
                    if (generationResult.thumbnailUrl) {
                      navigator.clipboard
                        .writeText(generationResult.thumbnailUrl)
                        .then(() => {
                          // Show success feedback
                          console.log('Thumbnail URL copied to clipboard')
                        })
                        .catch((err) => {
                          console.error('Failed to copy URL:', err)
                        })
                    }
                  }}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                  aria-label="Copy thumbnail URL"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Copy URL</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !isTTMAvailable}
        className={`mt-6 w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-gray-800 ${
          isGenerating || !isTTMAvailable
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-[var(--color-accent-secondary)] to-[var(--color-accent-primary)] text-black hover:from-[var(--color-accent-primary)] hover:to-[var(--color-accent-hover)]'
        }`}
        aria-describedby="generate-button-description"
        aria-busy={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5" aria-hidden="true" />
            <span>Generate Motion Video</span>
          </>
        )}
      </button>
      <div id="generate-button-description" className="sr-only">
        Generates a motion-controlled video from the still image using the TTM service. Requires TTM
        service to be available.
      </div>
    </div>
  )
}
