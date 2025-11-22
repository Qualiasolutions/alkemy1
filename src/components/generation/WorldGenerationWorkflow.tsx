import { motion } from 'framer-motion'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import Button from '@/components/Button'
import { DEMO_WORLD_PROMPTS } from '@/data/generationDemoData'
import {
  type GeneratedWorld,
  type WorldGenerationRequest,
  worldLabsService,
} from '@/services/worldLabsService'
import { useTheme } from '@/theme/ThemeContext'
import ExportPanel from './ExportPanel'

interface WorldGenerationWorkflowProps {
  onComplete?: (world: GeneratedWorld) => void
}

const WorldGenerationWorkflow: React.FC<WorldGenerationWorkflowProps> = ({ onComplete }) => {
  const { colors } = useTheme()
  const [inputType, setInputType] = useState<'text' | 'image'>('text')
  const [prompt, setPrompt] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [quality, setQuality] = useState<'draft' | 'standard' | 'ultra'>('standard')
  const [enablePhysics, setEnablePhysics] = useState(true)
  const [enableLighting, setEnableLighting] = useState(true)
  const [enableInteractivity, setEnableInteractivity] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStatus, setGenerationStatus] = useState('')
  const [generatedWorld, setGeneratedWorld] = useState<GeneratedWorld | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLoadDemoPrompt = (demoPrompt: (typeof DEMO_WORLD_PROMPTS)[0]) => {
    setPrompt(demoPrompt.prompt)
    setQuality(demoPrompt.recommendedQuality)
  }

  const handleGenerate = async () => {
    if (inputType === 'text' && !prompt) {
      alert('Please enter a prompt')
      return
    }
    if (inputType === 'image' && !imageFile) {
      alert('Please upload an image')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationStatus('Starting generation...')

    try {
      const request: WorldGenerationRequest = {
        input: inputType === 'text' ? prompt : imageFile!,
        type: inputType,
        quality,
        features: {
          enablePhysics,
          enableLighting,
          enableInteractivity,
          enableAI: false,
        },
        onProgress: (progress, status) => {
          setGenerationProgress(progress)
          setGenerationStatus(status)
        },
      }

      const world = await worldLabsService.generateWorld(request)
      setGeneratedWorld(world)
      onComplete?.(world)

      // Render world to canvas
      if (canvasRef.current) {
        const canvas = canvasRef.current
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        world.renderer.renderer.setSize(canvas.width, canvas.height)
        canvas.appendChild(world.renderer.renderer.domElement)

        // Start render loop
        const animate = () => {
          requestAnimationFrame(animate)
          world.renderer.render()
        }
        animate()
      }
    } catch (error) {
      console.error('World generation failed:', error)
      alert('World generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExport = async (format: string) => {
    if (!generatedWorld) return

    try {
      const blob = await worldLabsService.exportWorld(generatedWorld.id, format as any)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `world_${Date.now()}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  useEffect(() => {
    return () => {
      if (generatedWorld) {
        worldLabsService.disposeWorld(generatedWorld.id)
      }
    }
  }, [generatedWorld])

  return (
    <div className="space-y-6">
      {!generatedWorld ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div
            className="p-6 rounded-xl"
            style={{
              background: colors.surface_card,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: colors.border_color,
            }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: colors.text_primary }}>
              Generate 3D World
            </h2>

            {/* Input Type Selection */}
            <div className="flex gap-4 mb-6">
              <Button
                onClick={() => setInputType('text')}
                variant={inputType === 'text' ? 'primary' : 'secondary'}
                className="flex-1"
              >
                Text Prompt
              </Button>
              <Button
                onClick={() => setInputType('image')}
                variant={inputType === 'image' ? 'primary' : 'secondary'}
                className="flex-1"
              >
                Image to 3D
              </Button>
            </div>

            {/* Text Input */}
            {inputType === 'text' && (
              <div className="space-y-4">
                <div>
                  <label
                    className="block font-semibold mb-2"
                    style={{ color: colors.text_primary }}
                  >
                    World Description
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the 3D world you want to create..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg resize-none"
                    style={{
                      background: colors.background_secondary,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: colors.border_color,
                      color: colors.text_primary,
                    }}
                  />
                </div>

                {/* Demo Prompts */}
                <div>
                  <p
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.text_secondary }}
                  >
                    Or try a demo prompt:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {DEMO_WORLD_PROMPTS.slice(0, 4).map((demo) => (
                      <button
                        key={demo.id}
                        onClick={() => handleLoadDemoPrompt(demo)}
                        className="p-3 rounded-lg text-left text-sm transition-all hover:scale-[1.02]"
                        style={{
                          background: colors.background_secondary,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: colors.border_color,
                        }}
                      >
                        <p className="font-semibold mb-1" style={{ color: colors.text_primary }}>
                          {demo.name}
                        </p>
                        <p className="text-xs line-clamp-2" style={{ color: colors.text_tertiary }}>
                          {demo.prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Image Input */}
            {inputType === 'image' && (
              <div>
                <label className="block font-semibold mb-2" style={{ color: colors.text_primary }}>
                  Upload Reference Image
                </label>
                <div
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-opacity-60"
                  style={{ borderColor: colors.accent_primary }}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                  ) : (
                    <>
                      <svg
                        className="mx-auto mb-4"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={colors.text_secondary}
                        strokeWidth="2"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <p style={{ color: colors.text_primary }}>Click to upload reference image</p>
                      <p className="text-sm mt-1" style={{ color: colors.text_tertiary }}>
                        JPG, PNG up to 10MB
                      </p>
                    </>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Quality Selection */}
            <div className="mt-6">
              <label className="block font-semibold mb-3" style={{ color: colors.text_primary }}>
                Quality Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['draft', 'standard', 'ultra'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className="p-4 rounded-lg transition-all"
                    style={{
                      background:
                        quality === q ? 'rgba(16, 163, 127, 0.1)' : colors.background_secondary,
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: quality === q ? colors.accent_primary : colors.border_color,
                    }}
                  >
                    <p className="font-bold capitalize" style={{ color: colors.text_primary }}>
                      {q}
                    </p>
                    <p className="text-xs mt-1" style={{ color: colors.text_tertiary }}>
                      {q === 'draft' && '~5s, Fast preview'}
                      {q === 'standard' && '~10s, Balanced'}
                      {q === 'ultra' && '~15s, Best quality'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Toggles */}
            <div
              className="mt-6 p-4 rounded-lg space-y-3"
              style={{ background: colors.background_secondary }}
            >
              <p className="font-semibold mb-3" style={{ color: colors.text_primary }}>
                World Features
              </p>
              {[
                {
                  key: 'physics',
                  label: 'Physics Simulation',
                  value: enablePhysics,
                  setter: setEnablePhysics,
                },
                {
                  key: 'lighting',
                  label: 'Dynamic Lighting',
                  value: enableLighting,
                  setter: setEnableLighting,
                },
                {
                  key: 'interactivity',
                  label: 'Interactive Elements',
                  value: enableInteractivity,
                  setter: setEnableInteractivity,
                },
              ].map((feature) => (
                <label key={feature.key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feature.value}
                    onChange={(e) => feature.setter(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span style={{ color: colors.text_secondary }}>{feature.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          {isGenerating ? (
            <div
              className="p-12 rounded-xl text-center"
              style={{ background: colors.surface_card }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-4 border-t-transparent rounded-full mx-auto mb-6"
                style={{ borderColor: colors.accent_primary }}
              />
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.text_primary }}>
                Generating 3D World
              </h3>
              <p className="mb-6" style={{ color: colors.text_secondary }}>
                {generationStatus}
              </p>
              <div className="max-w-md mx-auto">
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: colors.border_color }}
                >
                  <motion.div
                    animate={{ width: `${generationProgress}%` }}
                    className="h-full"
                    style={{ background: colors.accent_primary }}
                  />
                </div>
                <p className="text-sm mt-2" style={{ color: colors.text_tertiary }}>
                  {generationProgress}%
                </p>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleGenerate}
              variant="primary"
              disabled={(inputType === 'text' && !prompt) || (inputType === 'image' && !imageFile)}
              className="w-full !py-4"
            >
              Generate 3D World
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 3D Viewer */}
          <div
            className="p-6 rounded-xl"
            style={{
              background: colors.surface_card,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: colors.border_color,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ color: colors.text_primary }}>
                Generated 3D World
              </h2>
              <div className="flex gap-2">
                <div
                  className="px-3 py-1 rounded text-sm font-semibold"
                  style={{ background: 'rgba(16, 163, 127, 0.2)', color: colors.accent_primary }}
                >
                  {quality.toUpperCase()} Quality
                </div>
              </div>
            </div>

            <div
              className="relative w-full aspect-video rounded-lg overflow-hidden"
              style={{ background: colors.background_primary }}
            >
              <canvas ref={canvasRef} className="w-full h-full" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div
                  className="px-4 py-2 rounded-lg backdrop-blur-md"
                  style={{ background: 'rgba(0, 0, 0, 0.6)' }}
                >
                  <p className="text-sm text-white">Use WASD to move, Mouse to look around</p>
                </div>
              </div>
            </div>

            {/* World Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-3 rounded-lg" style={{ background: colors.background_secondary }}>
                <p
                  className="text-xs font-semibold uppercase mb-1"
                  style={{ color: colors.text_tertiary }}
                >
                  Gaussian Splats
                </p>
                <p className="text-lg font-bold" style={{ color: colors.text_primary }}>
                  {generatedWorld.metadata.gaussianSplats.length.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: colors.background_secondary }}>
                <p
                  className="text-xs font-semibold uppercase mb-1"
                  style={{ color: colors.text_tertiary }}
                >
                  Physics Objects
                </p>
                <p className="text-lg font-bold" style={{ color: colors.text_primary }}>
                  {generatedWorld.metadata.physicsWorld.dynamicObjects.length}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: colors.background_secondary }}>
                <p
                  className="text-xs font-semibold uppercase mb-1"
                  style={{ color: colors.text_tertiary }}
                >
                  Interactions
                </p>
                <p className="text-lg font-bold" style={{ color: colors.text_primary }}>
                  {generatedWorld.metadata.interactionPoints.length}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: colors.background_secondary }}>
                <p
                  className="text-xs font-semibold uppercase mb-1"
                  style={{ color: colors.text_tertiary }}
                >
                  Render Mode
                </p>
                <p className="text-sm font-bold" style={{ color: colors.text_primary }}>
                  WebGL 2.0
                </p>
              </div>
            </div>
          </div>

          {/* Export & Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Button
                onClick={() => setGeneratedWorld(null)}
                variant="secondary"
                className="w-full"
              >
                Generate Another World
              </Button>
            </div>
            <ExportPanel data={generatedWorld} dataType="world" onExport={handleExport} />
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default WorldGenerationWorkflow
