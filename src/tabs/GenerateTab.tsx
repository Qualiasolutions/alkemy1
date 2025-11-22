import { motion } from 'framer-motion'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  AlkemyLoadingIcon,
  DownloadIcon,
  FilmIcon,
  FourKIcon,
  ImagePlusIcon,
  PaperclipIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from '../components/icons/Icons'
import { animateFrame, generateVisual, refineVariant, upscaleImage } from '../services/aiService'
import {
  generateVideoWithKling,
  generateVideoWithVeo2,
  refineVideoWithWAN,
} from '../services/videoFalService'
import { generateVideoFromImageWan, generateVideoFromTextWan } from '../services/wanService'
import { useTheme } from '../theme/ThemeContext'

interface GenerateTabProps {
  user?: any
}

interface GeneratedItem {
  url: string
  type: 'image' | 'video'
  prompt: string
  model: string
  aspectRatio: string
  timestamp: number
  id: string
}

const GenerateTab: React.FC<GenerateTabProps> = ({ user }) => {
  const { isDark } = useTheme()
  const [mode, setMode] = useState<'image' | 'video'>('image')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState<string>('FLUX 1.1')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [generationCount, setGenerationCount] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedMedia, setGeneratedMedia] = useState<GeneratedItem[]>([])
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<GeneratedItem | null>(null)
  const [fullscreenItem, setFullscreenItem] = useState<GeneratedItem | null>(null)
  const [refinePrompt, setRefinePrompt] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [isUpscaling, setIsUpscaling] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const advancedToolsRef = useRef<HTMLDivElement>(null)
  const leftPanelRef = useRef<HTMLDivElement>(null)

  // Image models - Removed BFL models that have CORS issues
  const imageModels = [
    'Gemini Nano Banana', // Google Gemini
    'FLUX 1.1', // Pollinations (FREE)
    'Stable Diffusion', // Pollinations (FREE)
    'FLUX.1 Kontext (BFL)', // BFL service
    'FLUX Ultra (BFL)', // BFL service
  ]

  // Video models
  const videoModels = ['Veo 3.1 Fast', 'Kling 2.1 Master', 'Kling 2.1 Pro', 'WAN 2.1', 'Veo 2']

  const aspectRatios = ['16:9', '9:16', '1:1', '4:3', '3:4']

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenItem) {
        setFullscreenItem(null)
      }
      if (fullscreenItem && generatedMedia.length > 1) {
        if (e.key === 'ArrowLeft') {
          const currentIndex = generatedMedia.findIndex((item) => item.id === fullscreenItem.id)
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : generatedMedia.length - 1
          setFullscreenItem(generatedMedia[prevIndex])
          setSelectedItem(generatedMedia[prevIndex])
        } else if (e.key === 'ArrowRight') {
          const currentIndex = generatedMedia.findIndex((item) => item.id === fullscreenItem.id)
          const nextIndex = currentIndex < generatedMedia.length - 1 ? currentIndex + 1 : 0
          setFullscreenItem(generatedMedia[nextIndex])
          setSelectedItem(generatedMedia[nextIndex])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    // Scroll to advanced tools with proper ref
    const _scrollToAdvancedTools = () => {
      if (advancedToolsRef.current && leftPanelRef.current) {
        leftPanelRef.current.scrollTo({
          top: advancedToolsRef.current.offsetTop - 20,
          behavior: 'smooth',
        })
      }
    }

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fullscreenItem, generatedMedia])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt.')
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      if (mode === 'image') {
        // Generate multiple images
        const promises = Array.from({ length: generationCount }).map(async (_, index) => {
          const result = await generateVisual(
            prompt,
            model,
            attachedImage ? [attachedImage] : [],
            aspectRatio,
            (prog) => setProgress(Math.floor((index * 100 + prog) / generationCount)),
            `standalone-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            undefined,
            undefined
          )
          return {
            url: result.url,
            type: 'image' as const,
            prompt,
            model,
            aspectRatio,
            timestamp: Date.now(),
            id: `img-${Date.now()}-${index}`,
          }
        })

        const results = await Promise.all(promises)
        setGeneratedMedia((prev) => [...results, ...prev])
      } else {
        // Generate video with different models
        let videoUrl: string
        let referenceImageUrl = attachedImage

        try {
          if (model === 'Kling 2.1 Master' || model === 'Kling 2.1 Pro') {
            // Kling models - Master supports text-to-video, Pro is image-to-video only
            console.log(`[Video Generation] Using ${model}...`)

            // Pro tier requires a reference image
            if (model === 'Kling 2.1 Pro' && !referenceImageUrl) {
              // Generate reference image first
              setProgress(10)
              const imageResult = await generateVisual(
                `A single cinematic frame: ${prompt}. Professional photography, detailed, high quality.`,
                'FLUX.1.1 Pro (FAL)',
                [],
                aspectRatio,
                (prog) => setProgress(10 + Math.floor(prog * 0.3)),
                `video-frame-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                undefined,
                undefined
              )
              referenceImageUrl = imageResult.url
            }

            videoUrl = await generateVideoWithKling(
              prompt,
              referenceImageUrl,
              5, // duration
              aspectRatio as '16:9' | '9:16' | '1:1',
              (prog) => setProgress(prog)
            )
          } else if (model === 'WAN 2.1' || model === 'Veo 2') {
            // WAN 2.1 and Veo 2 require reference images
            console.log(`[Video Generation] Using ${model}...`)
            if (!referenceImageUrl) {
              // Generate reference image first
              setProgress(10)
              const imageResult = await generateVisual(
                `A single cinematic frame: ${prompt}. Professional photography, detailed, high quality.`,
                'FLUX.1.1 Pro (FAL)',
                [],
                aspectRatio,
                (prog) => setProgress(10 + Math.floor(prog * 0.3)),
                `video-frame-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                undefined,
                undefined
              )
              referenceImageUrl = imageResult.url
            }
            setProgress(40)

            if (model === 'WAN 2.1') {
              videoUrl = await refineVideoWithWAN(
                prompt,
                referenceImageUrl,
                4, // duration
                aspectRatio as '16:9' | '9:16' | '1:1',
                (prog) => setProgress(prog)
              )
            } else {
              // Veo 2
              videoUrl = await generateVideoWithVeo2(
                prompt,
                referenceImageUrl,
                5, // duration
                aspectRatio as '16:9' | '9:16' | '1:1',
                (prog) => setProgress(prog)
              )
            }
          } else if (model === 'WAN Video') {
            // WAN supports both text-to-video and image-to-video
            console.log('[Video Generation] Using WAN Video...')
            if (referenceImageUrl) {
              videoUrl = await generateVideoFromImageWan(
                referenceImageUrl,
                prompt,
                4, // videoDuration in seconds
                undefined, // seed
                1.5, // cfgScale
                (prog) => setProgress(prog)
              )
            } else {
              videoUrl = await generateVideoFromTextWan(
                prompt,
                4, // videoDuration in seconds (not aspectRatio!)
                undefined, // seed
                1.5, // cfgScale
                (prog) => setProgress(prog)
              )
            }
          } else {
            // Default: Veo 3.1 Fast
            console.log('[Video Generation] Using Veo 3.1 Fast...')

            // If no reference image, generate one from the prompt first
            if (!referenceImageUrl) {
              console.log('[Video Generation] No reference image, generating one from prompt...')
              setProgress(10)

              const imageResult = await generateVisual(
                `A single cinematic frame: ${prompt}. Professional photography, detailed, high quality.`,
                'FLUX.1.1 Pro (FAL)',
                [],
                aspectRatio,
                (prog) => setProgress(10 + Math.floor(prog * 0.3)),
                `video-frame-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                undefined,
                undefined
              )
              referenceImageUrl = imageResult.url
            }

            setProgress(40)
            const videos = await animateFrame(
              prompt,
              referenceImageUrl,
              null,
              1,
              aspectRatio,
              (prog) => setProgress(40 + Math.floor(prog * 0.6)),
              undefined,
              undefined
            )
            videoUrl = videos[0] // Take first video
          }

          const newItem = {
            url: videoUrl,
            type: 'video' as const,
            prompt,
            model,
            aspectRatio,
            timestamp: Date.now(),
            id: `vid-${Date.now()}`,
          }

          setGeneratedMedia((prev) => [newItem, ...prev])
          console.log(`[Video Generation] Successfully generated video using ${model}`)
        } catch (error) {
          console.error(`[Video Generation] Failed with ${model}:`, error)
          throw new Error(
            `Video generation failed with ${model}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    } catch (error) {
      console.error('Generation failed:', error)
      alert(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  const handleRefine = async () => {
    if (!selectedItem || !refinePrompt.trim() || selectedItem.type !== 'image') return

    setIsRefining(true)
    try {
      const refinedUrl = await refineVariant(
        refinePrompt,
        selectedItem.url,
        selectedItem.aspectRatio,
        undefined
      )

      if (refinedUrl) {
        const newItem: GeneratedItem = {
          url: refinedUrl,
          type: 'image',
          prompt: `${selectedItem.prompt} → ${refinePrompt}`,
          model: selectedItem.model,
          aspectRatio: selectedItem.aspectRatio,
          timestamp: Date.now(),
          id: `refined-${Date.now()}`,
        }
        setGeneratedMedia((prev) => [newItem, ...prev])
        setRefinePrompt('')
        alert('Refinement complete! Check the gallery for the refined image.')
      }
    } catch (error) {
      console.error('Refinement failed:', error)
      alert(`Refinement failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRefining(false)
    }
  }

  const handleUpscale = async (item: GeneratedItem) => {
    if (item.type !== 'image') return

    setIsUpscaling(true)
    try {
      const upscaledUrl = await upscaleImage(item.url, undefined)

      if (upscaledUrl) {
        const newItem: GeneratedItem = {
          url: upscaledUrl,
          type: 'image',
          prompt: `${item.prompt} [4K Upscaled]`,
          model: item.model,
          aspectRatio: item.aspectRatio,
          timestamp: Date.now(),
          id: `upscaled-${Date.now()}`,
        }
        setGeneratedMedia((prev) => [newItem, ...prev])
        alert('Upscaling complete! Check the gallery for the 4K version.')
      }
    } catch (error) {
      console.error('Upscaling failed:', error)
      alert(`Upscaling failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUpscaling(false)
    }
  }

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setAttachedImage(result)
      }
      reader.readAsDataURL(file)
    }
    if (e.target) e.target.value = ''
  }

  const handleDownload = (item: GeneratedItem) => {
    try {
      const link = document.createElement('a')
      link.href = item.url
      link.download = `alkemy-${item.type}-${item.id}.${item.type === 'image' ? 'png' : 'mp4'}`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try right-clicking and saving instead.')
    }
  }

  const handleDelete = (id: string) => {
    setGeneratedMedia((prev) => prev.filter((item) => item.id !== id))
    if (selectedItem?.id === id) setSelectedItem(null)
  }

  const handleExportAll = () => {
    generatedMedia.forEach((item, index) => {
      setTimeout(() => handleDownload(item), index * 200)
    })
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all generated media?')) {
      setGeneratedMedia([])
      setSelectedItem(null)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 p-4 sm:p-6 bg-gradient-to-b from-white/5 to-transparent flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 truncate">
              AI Media Generator
            </h1>
            <p className="text-white/60 text-xs sm:text-sm">
              Professional standalone image and video generation with advanced editing tools
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {generatedMedia.length > 0 && (
              <>
                <button
                  onClick={handleExportAll}
                  className="px-4 py-2 bg-[#DFEC2D] text-black rounded-lg hover:bg-[#FDE047] transition-all flex items-center gap-2 font-semibold"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Export All ({generatedMedia.length})
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2"
                >
                  <Trash2Icon className="w-4 h-4" />
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Controls */}
        <div
          ref={leftPanelRef}
          className="w-full sm:w-96 border-r border-white/10 p-4 sm:p-6 overflow-y-auto bg-gradient-to-b from-white/5 to-white/[0.02] flex-shrink-0"
        >
          {/* Mode Selector */}
          <div className="mb-6">
            <label className="text-xs text-white/60 uppercase tracking-widest font-medium block mb-3">
              Generation Mode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('image')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === 'image'
                    ? 'bg-[#DFEC2D] text-black'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <ImagePlusIcon className="w-5 h-5" />
                Image
              </button>
              <button
                onClick={() => setMode('video')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === 'video'
                    ? 'bg-[#DFEC2D] text-black'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <FilmIcon className="w-5 h-5" />
                Video
              </button>
            </div>
          </div>

          {/* Model & Settings */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs text-white/60 uppercase tracking-widest font-medium block mb-2">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 hover:border-white/20 transition-all focus:ring-2 focus:ring-[#DFEC2D] focus:outline-none"
                disabled={isGenerating}
              >
                {(mode === 'image' ? imageModels : videoModels).map((m) => (
                  <option key={m} value={m} className="bg-[#0a0a0a]">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/60 uppercase tracking-widest font-medium block mb-2">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 hover:border-white/20 transition-all focus:ring-2 focus:ring-[#DFEC2D] focus:outline-none"
                disabled={isGenerating}
              >
                {aspectRatios.map((ratio) => (
                  <option key={ratio} value={ratio} className="bg-[#0a0a0a]">
                    {ratio}
                  </option>
                ))}
              </select>
            </div>

            {mode === 'image' && (
              <div>
                <label className="text-xs text-white/60 uppercase tracking-widest font-medium block mb-2">
                  Generation Count
                </label>
                <select
                  value={generationCount}
                  onChange={(e) => setGenerationCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 hover:border-white/20 transition-all focus:ring-2 focus:ring-[#DFEC2D] focus:outline-none"
                  disabled={isGenerating}
                >
                  <option value={1} className="bg-[#0a0a0a]">
                    1 Image
                  </option>
                  <option value={2} className="bg-[#0a0a0a]">
                    2 Images
                  </option>
                  <option value={3} className="bg-[#0a0a0a]">
                    3 Images
                  </option>
                  <option value={4} className="bg-[#0a0a0a]">
                    4 Images
                  </option>
                  <option value={6} className="bg-[#0a0a0a]">
                    6 Images
                  </option>
                </select>
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div className="mb-6">
            <label className="text-xs text-white/60 uppercase tracking-widest font-medium block mb-2">
              {mode === 'image' ? 'Image Prompt' : 'Motion Description'}
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'image'
                    ? 'Describe the image you want to generate...'
                    : 'Describe the motion/animation...'
                }
                className="w-full h-32 pr-12 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#DFEC2D] focus:border-transparent focus:bg-white/10 transition-all resize-none"
                disabled={isGenerating}
              />
              {mode === 'image' && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileAttach}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-3 right-3 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    title="Attach reference image"
                    disabled={isGenerating}
                  >
                    <PaperclipIcon className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Reference Image */}
          {mode === 'video' && (
            <div className="mb-6">
              <label className="text-xs text-white/60 uppercase tracking-widest font-medium block mb-2">
                Reference Image (Optional)
              </label>
              {attachedImage ? (
                <div className="relative group rounded-lg overflow-hidden border border-white/20">
                  <img src={attachedImage} alt="Reference" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => setAttachedImage(null)}
                    className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileAttach}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-12 border-2 border-dashed border-white/20 rounded-lg hover:border-[#DFEC2D]/50 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-2"
                    disabled={isGenerating}
                  >
                    <ImagePlusIcon className="w-8 h-8 text-white/40" />
                    <span className="text-sm text-white/60">Click to upload (optional)</span>
                    <span className="text-xs text-white/40">Or leave empty for text-to-video</span>
                  </button>
                </>
              )}
              <p className="text-xs text-white/40 mt-2">
                {attachedImage
                  ? 'Veo will animate this image with your motion prompt'
                  : 'Without an image, AI will generate a frame first, then animate it'}
              </p>
            </div>
          )}

          {mode === 'image' && attachedImage && (
            <div className="mb-6">
              <label className="text-xs text-white/60 uppercase tracking-widest font-medium block mb-2">
                Reference Image
              </label>
              <div className="relative group rounded-lg overflow-hidden border border-white/20">
                <img src={attachedImage} alt="Reference" className="w-full h-32 object-cover" />
                <button
                  onClick={() => setAttachedImage(null)}
                  className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3 bg-[#DFEC2D] hover:bg-[#FDE047] disabled:bg-white/10 disabled:text-white/50 text-black font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#DFEC2D]/50 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                {mode === 'video' && !attachedImage && progress < 40 ? (
                  <>Generating frame... {progress}%</>
                ) : mode === 'video' && !attachedImage ? (
                  <>Animating video... {progress}%</>
                ) : (
                  <>Generating... {progress}%</>
                )}
              </>
            ) : (
              <>
                Generate{' '}
                {mode === 'image' && generationCount > 1
                  ? `${generationCount} Images`
                  : mode === 'image'
                    ? 'Image'
                    : 'Video'}
              </>
            )}
          </button>

          {/* Advanced Tools */}
          {selectedItem && selectedItem.type === 'image' && (
            <div ref={advancedToolsRef} className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Advanced Tools
              </h3>

              {/* Refine Tool */}
              <div className="mb-4">
                <label className="text-xs text-white/60 uppercase tracking-widest font-medium block mb-2">
                  Refine Image
                </label>
                <textarea
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder="Describe what you want to change..."
                  className="w-full h-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#DFEC2D] focus:border-transparent focus:bg-white/10 transition-all resize-none mb-2"
                  disabled={isRefining}
                />
                <button
                  onClick={handleRefine}
                  disabled={!refinePrompt.trim() || isRefining}
                  className="w-full py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 disabled:bg-white/5 disabled:text-white/30 disabled:border-white/10 rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                >
                  {isRefining ? (
                    <>
                      <span className="w-3 h-3 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></span>
                      Refining...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4" />
                      Apply Refinement
                    </>
                  )}
                </button>
              </div>

              {/* Upscale Tool */}
              <div>
                <button
                  onClick={() => handleUpscale(selectedItem)}
                  disabled={isUpscaling}
                  className="w-full py-2 bg-[#DFEC2D]/20 border border-[#DFEC2D]/30 text-[#DFEC2D] hover:bg-[#DFEC2D]/30 disabled:bg-white/5 disabled:text-white/30 disabled:border-white/10 rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                >
                  {isUpscaling ? (
                    <>
                      <span className="w-3 h-3 border-2 border-[#DFEC2D] border-t-transparent rounded-full animate-spin"></span>
                      Upscaling...
                    </>
                  ) : (
                    <>
                      <FourKIcon className="w-4 h-4" />
                      Upscale to 4K
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Gallery */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-w-0">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <AlkemyLoadingIcon className="w-16 h-16 text-[#DFEC2D] mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Generating{' '}
                {mode === 'image'
                  ? `${generationCount} image${generationCount > 1 ? 's' : ''}`
                  : 'video'}
                ...
              </h3>
              <p className="text-white/60 max-w-md break-words">
                {prompt.substring(0, 150)}
                {prompt.length > 150 ? '...' : ''}
              </p>
              <div className="w-full max-w-md bg-gray-600 rounded-full h-2 mt-4">
                <div
                  className="bg-[#DFEC2D] h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ) : generatedMedia.length > 0 ? (
            <div className="space-y-6">
              {/* Gallery Stats */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-white">
                  Generated Media ({generatedMedia.length})
                </h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white/10 text-white/60 text-xs rounded font-medium">
                    {generatedMedia.filter((i) => i.type === 'image').length} Images
                  </span>
                  <span className="px-3 py-1 bg-white/10 text-white/60 text-xs rounded font-medium">
                    {generatedMedia.filter((i) => i.type === 'video').length} Videos
                  </span>
                </div>
              </div>

              {/* Horizontal Scrollable Gallery */}
              <div className="overflow-x-auto pb-4 -mx-4 px-4">
                <div className="flex gap-4 w-max">
                  {generatedMedia.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative group rounded-lg overflow-hidden border transition-all cursor-pointer flex-shrink-0 ${
                        selectedItem?.id === item.id
                          ? 'border-[#DFEC2D] ring-2 ring-[#DFEC2D]/50'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      style={{ width: '320px', flexShrink: 0 }}
                      onClick={() => {
                        setSelectedItem(item)
                        setFullscreenItem(item)
                      }}
                    >
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.prompt}
                          className="w-full aspect-video object-cover"
                        />
                      ) : (
                        <video src={item.url} className="w-full aspect-video object-cover" />
                      )}

                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                          <p className="text-xs text-white/80 line-clamp-2">{item.prompt}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownload(item)
                              }}
                              className="flex-1 py-1.5 px-2 bg-[#DFEC2D] text-black rounded text-xs font-semibold hover:bg-[#FDE047] transition-all flex items-center justify-center gap-1"
                            >
                              <DownloadIcon className="w-3 h-3" />
                              Download
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(item.id)
                              }}
                              className="py-1.5 px-2 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-all"
                            >
                              <Trash2Icon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                          <span className="px-2 py-1 bg-black/70 text-white text-xs rounded font-medium uppercase">
                            {item.type}
                          </span>
                          <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded font-medium">
                            {item.model}
                          </span>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {selectedItem?.id === item.id && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-[#DFEC2D] rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-black"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Gallery Guide */}
              <div className="text-center text-white/40 text-xs">
                💡 Click any image or video to view fullscreen • Scroll horizontally to see all
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              {mode === 'image' ? (
                <ImagePlusIcon className="w-16 h-16 text-white/20 mb-4" />
              ) : (
                <FilmIcon className="w-16 h-16 text-white/20 mb-4" />
              )}
              <h3 className="text-xl font-semibold text-white mb-2">No media generated yet</h3>
              <p className="text-white/60 mb-6 max-w-md">
                {mode === 'image'
                  ? 'Enter a prompt and click Generate to create images with AI'
                  : 'Describe your video and optionally upload a reference image to animate'}
              </p>
              <div className="text-sm text-white/40 space-y-2 max-w-md">
                <p className="font-semibold text-white/60">💡 Pro Tips:</p>
                <ul className="text-left list-disc list-inside space-y-1">
                  {mode === 'image' ? (
                    <>
                      <li>Be specific with lighting, style, and mood</li>
                      <li>Use reference images for better accuracy</li>
                      <li>Select images to refine or upscale them</li>
                    </>
                  ) : (
                    <>
                      <li>Describe the scene and desired motion</li>
                      <li>Reference image is optional (AI generates one if missing)</li>
                      <li>Veo 3.1 preserves character appearance</li>
                      <li>Text-to-video: AI creates initial frame then animates</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Viewer */}
      {fullscreenItem && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setFullscreenItem(null)}
        >
          <div
            className="relative w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media Display */}
            {fullscreenItem.type === 'image' ? (
              <img
                src={fullscreenItem.url}
                alt={fullscreenItem.prompt}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={fullscreenItem.url}
                controls
                autoPlay
                loop
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 max-w-2xl min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <span className="px-3 py-1 bg-[#DFEC2D] text-black text-xs font-bold rounded uppercase">
                      {fullscreenItem.type}
                    </span>
                    <span className="px-3 py-1 bg-white/10 text-white/80 text-xs font-medium rounded">
                      {fullscreenItem.model}
                    </span>
                    <span className="px-3 py-1 bg-white/10 text-white/80 text-xs font-medium rounded">
                      {fullscreenItem.aspectRatio}
                    </span>
                  </div>
                  <p className="text-white text-sm leading-relaxed break-words">
                    {fullscreenItem.prompt}
                  </p>
                </div>
                <button
                  onClick={() => setFullscreenItem(null)}
                  className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex-shrink-0"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                {/* Download */}
                <button
                  onClick={() => handleDownload(fullscreenItem)}
                  className="px-6 py-3 bg-[#DFEC2D] text-black rounded-lg hover:bg-[#FDE047] transition-all flex items-center gap-2 font-semibold shadow-lg"
                >
                  <DownloadIcon className="w-5 h-5" />
                  Download
                </button>

                {/* Image-only tools */}
                {fullscreenItem.type === 'image' && (
                  <>
                    {/* Refine */}
                    <button
                      onClick={() => {
                        setSelectedItem(fullscreenItem)
                        setFullscreenItem(null)
                        // Scroll to advanced tools using the ref
                        setTimeout(scrollToAdvancedTools, 100)
                      }}
                      className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all flex items-center gap-2 font-semibold shadow-lg"
                    >
                      <SparklesIcon className="w-5 h-5" />
                      Refine Image
                    </button>

                    {/* Upscale */}
                    <button
                      onClick={() => {
                        setFullscreenItem(null)
                        handleUpscale(fullscreenItem)
                      }}
                      disabled={isUpscaling}
                      className="px-6 py-3 bg-[#DFEC2D]/20 border-2 border-[#DFEC2D] text-[#DFEC2D] rounded-lg hover:bg-[#DFEC2D]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-semibold shadow-lg"
                    >
                      {isUpscaling ? (
                        <>
                          <span className="w-4 h-4 border-2 border-[#DFEC2D] border-t-transparent rounded-full animate-spin"></span>
                          Upscaling...
                        </>
                      ) : (
                        <>
                          <FourKIcon className="w-5 h-5" />
                          Upscale to 4K
                        </>
                      )}
                    </button>
                  </>
                )}

                {/* Delete */}
                <button
                  onClick={() => {
                    handleDelete(fullscreenItem.id)
                    setFullscreenItem(null)
                  }}
                  className="px-6 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2 font-semibold shadow-lg"
                >
                  <Trash2Icon className="w-5 h-5" />
                  Delete
                </button>
              </div>

              {/* Quick Info */}
              <div className="mt-4 text-center">
                <p className="text-white/60 text-xs">
                  Press ESC to close • ← → to navigate • Click outside to exit fullscreen
                </p>
              </div>
            </div>

            {/* Navigation Arrows (if multiple items) */}
            {generatedMedia.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const currentIndex = generatedMedia.findIndex(
                      (item) => item.id === fullscreenItem.id
                    )
                    const prevIndex =
                      currentIndex > 0 ? currentIndex - 1 : generatedMedia.length - 1
                    setFullscreenItem(generatedMedia[prevIndex])
                    setSelectedItem(generatedMedia[prevIndex])
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const currentIndex = generatedMedia.findIndex(
                      (item) => item.id === fullscreenItem.id
                    )
                    const nextIndex =
                      currentIndex < generatedMedia.length - 1 ? currentIndex + 1 : 0
                    setFullscreenItem(generatedMedia[nextIndex])
                    setSelectedItem(generatedMedia[nextIndex])
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default GenerateTab
