/**
 * AnimateStudioTTM Component
 * Enhanced animation studio with TTM motion control integration
 */

import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useState } from 'react'
import { animateFrame } from '../services/aiService'
import { animateFrameWithTTM, checkTTMStatus, MotionType } from '../services/ttmService'
import type { Frame } from '../types'
import {
  ArrowLeftIcon,
  DownloadIcon,
  FilmIcon,
  PlayIcon,
  Settings,
  SparklesIcon,
  Zap,
} from './icons/Icons'
import TTMGenerationPanel from './TTMGenerationPanel'

interface AnimateStudioTTMProps {
  frame: Frame
  onBack: () => void
  onUpdateFrame: (frame: Frame) => void
  currentProject: any
  user: any
  scene: any
}

type AnimationMethod = 'ttm' | 'veo' | 'kling' | 'wan'

export default function AnimateStudioTTM({
  frame,
  onBack,
  onUpdateFrame,
  currentProject,
  user,
  scene,
}: AnimateStudioTTMProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  const [animationMethod, setAnimationMethod] = useState<AnimationMethod>('ttm')
  const [isTTMAvailable, setIsTTMAvailable] = useState(false)
  const [motionPrompt, setMotionPrompt] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Check TTM availability on mount
  React.useEffect(() => {
    checkTTMStatus().then(setIsTTMAvailable)
  }, [])

  // Generate motion prompt based on frame metadata
  React.useEffect(() => {
    if (frame.camera_package?.movement) {
      const cam = frame.camera_package
      setMotionPrompt(`Camera ${cam.movement} across ${frame.description || 'the scene'}`)
    } else {
      setMotionPrompt(`Animate ${frame.description || 'the subject'} with controlled motion`)
    }
  }, [frame])

  const handleGenerateVideo = useCallback(
    async (
      method: AnimationMethod,
      _videoUrl?: string,
      motionType?: MotionType,
      trajectory?: any[],
      cameraMovement?: any
    ) => {
      if (isGenerating) return

      setIsGenerating(true)
      setGenerationProgress(0)

      try {
        let resultVideoUrl: string

        switch (method) {
          case 'ttm': {
            // Use TTM service for precise motion control
            const response = await animateFrameWithTTM(
              frame,
              motionType || MotionType.CAMERA,
              {
                trajectory,
                cameraMovement,
                prompt: motionPrompt,
              },
              setGenerationProgress
            )
            resultVideoUrl = response.videoUrl
            break
          }

          case 'veo':
            // Use existing Veo 3.1 service
            resultVideoUrl = await animateFrame(
              motionPrompt,
              frame.media?.start_frame_url,
              frame.media?.end_frame_url || frame.media?.start_frame_url,
              (progress) => setGenerationProgress(progress * 100),
              scene,
              frame
            )
            break

          case 'kling':
            // Use Kling service (if available)
            // This would need to be implemented
            throw new Error('Kling service not yet integrated')

          case 'wan':
            // Use Wan service (if available)
            // This would need to be implemented
            throw new Error('Wan service not yet integrated')

          default:
            throw new Error('Unknown animation method')
        }

        setGeneratedVideoUrl(resultVideoUrl)

        // Update frame with generated video
        const updatedFrame: Frame = {
          ...frame,
          media: {
            ...frame.media,
            animated_video_url: resultVideoUrl,
          },
          status: 'VideoReady' as any,
        }

        onUpdateFrame(updatedFrame)
      } catch (error) {
        console.error('[AnimateStudioTTM] Generation failed:', error)
      } finally {
        setIsGenerating(false)
        setGenerationProgress(0)
      }
    },
    [frame, motionPrompt, isGenerating, onUpdateFrame, scene]
  )

  const handleTTMVideoGenerated = (videoUrl: string, thumbnailUrl: string) => {
    setGeneratedVideoUrl(videoUrl)

    // Update frame with TTM video
    const updatedFrame: Frame = {
      ...frame,
      media: {
        ...frame.media,
        animated_video_url: videoUrl,
      },
      status: 'VideoReady' as any,
      // Store TTM metadata for future reference
      ttm_metadata: {
        method: 'ttm',
        generatedAt: new Date().toISOString(),
        thumbnailUrl,
      },
    }

    onUpdateFrame(updatedFrame)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Animation Studio</h2>
            <p className="text-sm text-gray-400">
              Frame {frame.shot_number}: {frame.description}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {generatedVideoUrl && (
            <button
              onClick={() => {
                const a = document.createElement('a')
                a.href = generatedVideoUrl
                a.download = `frame-${frame.shot_number}-animated.mp4`
                a.click()
              }}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Download</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Controls */}
        <div className="w-96 p-4 border-r border-gray-700 overflow-y-auto">
          {/* Animation Method Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Animation Method</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'ttm',
                  name: 'TTM Motion',
                  icon: <Zap className="w-4 h-4" />,
                  description: 'Precise motion control',
                  available: isTTMAvailable,
                },
                {
                  id: 'veo',
                  name: 'Veo 3.1',
                  icon: <FilmIcon className="w-4 h-4" />,
                  description: 'AI video generation',
                  available: true,
                },
                {
                  id: 'kling',
                  name: 'Kling AI',
                  icon: <SparklesIcon className="w-4 h-4" />,
                  description: 'High quality video',
                  available: false,
                },
                {
                  id: 'wan',
                  name: 'Wan Video',
                  icon: <FilmIcon className="w-4 h-4" />,
                  description: 'Text-to-video',
                  available: false,
                },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() =>
                    method.available && setAnimationMethod(method.id as AnimationMethod)
                  }
                  disabled={!method.available}
                  className={`p-3 rounded-lg border transition-all ${
                    animationMethod === method.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : method.available
                        ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                        : 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    {method.icon}
                    <span className="text-xs font-medium">{method.name}</span>
                    <span className="text-xs opacity-75">{method.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Motion Prompt */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Motion Description</h3>
            <textarea
              value={motionPrompt}
              onChange={(e) => setMotionPrompt(e.target.value)}
              placeholder="Describe the desired motion..."
              className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 resize-none"
            />
          </div>

          {/* TTM Panel (if selected) */}
          <AnimatePresence>
            {animationMethod === 'ttm' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <TTMGenerationPanel
                  imageUrl={frame.media?.start_frame_url || ''}
                  onVideoGenerated={handleTTMVideoGenerated}
                  frameId={`frame-${frame.shot_number}`}
                  projectId={currentProject?.id}
                  className="mb-4"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Traditional Animation Controls (if not TTM) */}
          <AnimatePresence>
            {animationMethod !== 'ttm' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button
                  onClick={() => handleGenerateVideo(animationMethod)}
                  disabled={isGenerating}
                  className="w-full py-3 bg-gradient-to-r from-[var(--color-accent-secondary)] to-[var(--color-accent-primary)] hover:from-[var(--color-accent-primary)] hover:to-[var(--color-accent-hover)] text-black rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      <span>Generate Animation</span>
                    </>
                  )}
                </button>

                {/* Progress Bar */}
                <AnimatePresence>
                  {isGenerating && generationProgress > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-4"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Progress</span>
                        <span className="text-xs text-gray-400">
                          {Math.round(generationProgress)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[var(--color-accent-secondary)] to-[var(--color-accent-primary)] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Camera Settings Reference */}
          {frame.camera_package && (
            <div className="mt-6 p-3 bg-gray-800/50 rounded-lg">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Camera Settings</span>
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-1 text-xs text-gray-400"
                  >
                    <p>Camera: {frame.camera_package.camera}</p>
                    <p>Lens: {frame.camera_package.lens_mm}mm</p>
                    <p>Aperture: f/{frame.camera_package.aperture}</p>
                    <p>Movement: {frame.camera_package.movement || 'Static'}</p>
                    <p>Angle: {frame.camera_package.angle || 'Eye level'}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Still Image Preview */}
          {!generatedVideoUrl && (
            <div className="max-w-3xl">
              <img
                src={frame.media?.start_frame_url}
                alt={`Frame ${frame.shot_number}`}
                className="w-full h-auto rounded-lg shadow-2xl"
              />
              <div className="mt-4 text-center">
                <p className="text-gray-400">Select animation method and generate video</p>
              </div>
            </div>
          )}

          {/* Video Preview */}
          <AnimatePresence>
            {generatedVideoUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-4xl w-full"
              >
                <video
                  src={generatedVideoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
                <div className="mt-4 text-center">
                  <p className="text-[#DFEC2D] flex items-center justify-center space-x-2">
                    <CheckIcon className="w-4 h-4" />
                    <span>Animation complete!</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
