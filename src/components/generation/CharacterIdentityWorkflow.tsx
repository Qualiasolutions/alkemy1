import { motion } from 'framer-motion'
import type React from 'react'
import { useState } from 'react'
import Button from '@/components/Button'
import { DEMO_CHARACTERS } from '@/data/generationDemoData'
import {
  characterIdentityService,
  type GeneratedCharacterImage,
  type TrainedCharacterIdentity,
} from '@/services/characterIdentityService'
import { useTheme } from '@/theme/ThemeContext'
import ExportPanel from './ExportPanel'
import ResultsGallery, { type GalleryItem } from './ResultsGallery'

interface CharacterIdentityWorkflowProps {
  onComplete?: (identity: TrainedCharacterIdentity) => void
}

const CharacterIdentityWorkflow: React.FC<CharacterIdentityWorkflowProps> = ({ onComplete }) => {
  const { colors } = useTheme()
  const [step, setStep] = useState<'upload' | 'training' | 'preview' | 'export'>('upload')
  const [characterName, setCharacterName] = useState('')
  const [characterDescription, setCharacterDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [trainedIdentity, setTrainedIdentity] = useState<TrainedCharacterIdentity | null>(null)
  const [generatedImages, setGeneratedImages] = useState<GeneratedCharacterImage[]>([])
  const [_isTraining, setIsTraining] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [trainingStatus, setTrainingStatus] = useState('')
  const [useDemoMode, setUseDemoMode] = useState(true)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + selectedFiles.length > 10) {
      alert('Maximum 10 reference images allowed')
      return
    }

    setSelectedFiles((prev) => [...prev, ...files])

    // Generate preview URLs
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrls((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleTrain = async () => {
    if (useDemoMode) {
      // Use demo character
      setIsTraining(true)
      setTrainingStatus('Loading demo character...')
      setTrainingProgress(0)

      // Simulate training progress
      const progressInterval = setInterval(() => {
        setTrainingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 10
        })
      }, 200)

      setTimeout(() => {
        const demoChar = DEMO_CHARACTERS[0]
        setTrainedIdentity(demoChar)
        setIsTraining(false)
        setStep('preview')
        onComplete?.(demoChar)
      }, 2000)

      return
    }

    // Real training
    if (!characterName || selectedFiles.length < 3) {
      alert('Please provide a character name and at least 3 reference images')
      return
    }

    setIsTraining(true)
    setStep('training')

    try {
      const identity = await characterIdentityService.trainCharacterIdentity({
        name: characterName,
        referenceImages: selectedFiles,
        description: characterDescription,
        onProgress: (progress, status) => {
          setTrainingProgress(progress)
          setTrainingStatus(status)
        },
      })

      setTrainedIdentity(identity)
      setStep('preview')
      onComplete?.(identity)
    } catch (error) {
      console.error('Training failed:', error)
      alert('Training failed. Please try again.')
      setStep('upload')
    } finally {
      setIsTraining(false)
    }
  }

  const handleGeneratePreview = async () => {
    if (!trainedIdentity) return

    setIsGenerating(true)

    try {
      const images = await characterIdentityService.generateBatchPreview(trainedIdentity)
      setGeneratedImages(images)
    } catch (error) {
      console.error('Generation failed:', error)
      alert('Generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExport = (format: string) => {
    if (!trainedIdentity) return

    const exportData = characterIdentityService.exportIdentity(trainedIdentity.id)

    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${trainedIdentity.name.replace(/\s+/g, '_')}_identity.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleLoadDemo = (demoIndex: number) => {
    const demoChar = DEMO_CHARACTERS[demoIndex]
    setTrainedIdentity(demoChar)
    setCharacterName(demoChar.name)
    setCharacterDescription(demoChar.description)
    setPreviewUrls(demoChar.referenceUrls)
    setStep('preview')
    onComplete?.(demoChar)
  }

  const galleryItems: GalleryItem[] = generatedImages.map((img) => ({
    id: img.generatedAt,
    url: img.url,
    title: img.pose,
    description: img.prompt,
    metadata: {
      consistency_score: img.consistencyScore,
      generated_at: img.generatedAt,
    },
    type: 'image',
  }))

  return (
    <div className="space-y-6">
      {/* Upload Step */}
      {step === 'upload' && (
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
            <h2 className="text-2xl font-bold mb-4" style={{ color: colors.text_primary }}>
              Train Character Identity
            </h2>

            {/* Demo Mode Toggle */}
            <div
              className="mb-6 p-4 rounded-lg"
              style={{
                background: 'rgba(16, 163, 127, 0.1)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: colors.accent_primary,
              }}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useDemoMode}
                  onChange={(e) => setUseDemoMode(e.target.checked)}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-semibold" style={{ color: colors.text_primary }}>
                    Use Demo Mode
                  </p>
                  <p className="text-sm" style={{ color: colors.text_secondary }}>
                    Instantly load a pre-trained character for testing
                  </p>
                </div>
              </label>
            </div>

            {useDemoMode ? (
              <div className="space-y-4">
                <p style={{ color: colors.text_secondary }}>
                  Select a demo character to explore the workflow:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {DEMO_CHARACTERS.map((char, index) => (
                    <motion.button
                      key={char.id}
                      onClick={() => handleLoadDemo(index)}
                      className="p-4 rounded-lg text-left transition-all"
                      style={{
                        background: colors.background_secondary,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: colors.border_color,
                      }}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <img
                        src={char.referenceUrls[0]}
                        alt={char.name}
                        className="w-full h-32 object-cover rounded mb-3"
                      />
                      <h3 className="font-bold mb-1" style={{ color: colors.text_primary }}>
                        {char.name}
                      </h3>
                      <p className="text-xs mb-2" style={{ color: colors.text_tertiary }}>
                        {char.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <div
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            background: 'rgba(16, 163, 127, 0.2)',
                            color: colors.accent_primary,
                          }}
                        >
                          {char.consistencyScore.toFixed(1)}% Consistency
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label
                      className="block font-semibold mb-2"
                      style={{ color: colors.text_primary }}
                    >
                      Character Name *
                    </label>
                    <input
                      type="text"
                      value={characterName}
                      onChange={(e) => setCharacterName(e.target.value)}
                      placeholder="e.g., Sarah Connor"
                      className="w-full px-4 py-3 rounded-lg"
                      style={{
                        background: colors.background_secondary,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: colors.border_color,
                        color: colors.text_primary,
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block font-semibold mb-2"
                      style={{ color: colors.text_primary }}
                    >
                      Description (optional)
                    </label>
                    <textarea
                      value={characterDescription}
                      onChange={(e) => setCharacterDescription(e.target.value)}
                      placeholder="Brief character description..."
                      rows={3}
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
                </div>

                {/* File Upload */}
                <div>
                  <label
                    className="block font-semibold mb-2"
                    style={{ color: colors.text_primary }}
                  >
                    Reference Images * (3-10 images)
                  </label>
                  <div
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-opacity-60"
                    style={{ borderColor: colors.accent_primary }}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <svg
                      className="mx-auto mb-4"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={colors.text_secondary}
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <p style={{ color: colors.text_primary }}>Click to upload or drag and drop</p>
                    <p className="text-sm mt-1" style={{ color: colors.text_tertiary }}>
                      JPG, PNG up to 10MB each
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Preview Grid */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                    {previewUrls.map((url, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group"
                      >
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFile(index)
                          }}
                          className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 opacity-0 group-hover:opacity-100 transition"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <Button
            onClick={handleTrain}
            variant="primary"
            disabled={!useDemoMode && (!characterName || selectedFiles.length < 3)}
            className="w-full !py-4"
          >
            {useDemoMode
              ? 'Continue with Demo Character'
              : `Train Character Identity (${selectedFiles.length}/10 images)`}
          </Button>
        </motion.div>
      )}

      {/* Training Step */}
      {step === 'training' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
            Training Character Identity
          </h3>
          <p className="mb-6" style={{ color: colors.text_secondary }}>
            {trainingStatus}
          </p>
          <div className="max-w-md mx-auto">
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: colors.border_color }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${trainingProgress}%` }}
                className="h-full"
                style={{ background: colors.accent_primary }}
              />
            </div>
            <p className="text-sm mt-2" style={{ color: colors.text_tertiary }}>
              {trainingProgress}%
            </p>
          </div>
        </motion.div>
      )}

      {/* Preview Step */}
      {step === 'preview' && trainedIdentity && (
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
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text_primary }}>
                  {trainedIdentity.name}
                </h2>
                <p style={{ color: colors.text_secondary }}>{trainedIdentity.description}</p>
                <div className="flex items-center gap-4 mt-4">
                  <div
                    className="px-3 py-1 rounded"
                    style={{ background: 'rgba(16, 163, 127, 0.2)', color: colors.accent_primary }}
                  >
                    {trainedIdentity.consistencyScore.toFixed(1)}% Consistency Score
                  </div>
                  <div
                    className="px-3 py-1 rounded"
                    style={{
                      background: colors.background_secondary,
                      color: colors.text_secondary,
                    }}
                  >
                    {trainedIdentity.referenceUrls.length} Reference Images
                  </div>
                </div>
              </div>
              <Button onClick={handleGeneratePreview} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Preview Images'}
              </Button>
            </div>

            {/* Character Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(trainedIdentity.features).map(([key, value]) => (
                <div
                  key={key}
                  className="p-3 rounded-lg"
                  style={{ background: colors.background_secondary }}
                >
                  <p
                    className="text-xs font-semibold uppercase mb-1"
                    style={{ color: colors.text_tertiary }}
                  >
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-sm" style={{ color: colors.text_primary }}>
                    {Array.isArray(value) ? value.join(', ') : value}
                  </p>
                </div>
              ))}
            </div>

            {/* Reference Images */}
            <h3 className="font-bold mb-3" style={{ color: colors.text_primary }}>
              Reference Images
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {trainedIdentity.referenceUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Reference ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              ))}
            </div>
          </div>

          {/* Generated Results */}
          {generatedImages.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: colors.text_primary }}>
                Generated Preview Images
              </h3>
              <ResultsGallery items={galleryItems} columns={4} />
            </div>
          )}

          {/* Export Panel */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Button onClick={() => setStep('upload')} variant="secondary" className="w-full">
                Train Another Character
              </Button>
            </div>
            <ExportPanel data={trainedIdentity} dataType="character" onExport={handleExport} />
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default CharacterIdentityWorkflow
