import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import Button from '../components/Button'
import {
  AlkemyLoadingIcon,
  ArrowLeftIcon,
  DownloadIcon,
  PaperclipIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from '../components/icons/Icons'
import { generateStillVariants } from '../services/aiService'
import { type SearchedImage, searchImages } from '../services/imageSearchService'
import type { Generation, Moodboard, MoodboardTemplate } from '../types'

const aspectRatioClasses: { [key: string]: string } = {
  '1:1': 'aspect-square',
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  '4:3': 'aspect-[4/3]',
  '3:4': 'aspect-[3/4]',
}

const LoadingSkeleton: React.FC<{ aspectRatio: string; progress: number }> = ({
  aspectRatio,
  progress,
}) => (
  <div
    className={`relative w-full h-full bg-black/20 flex flex-col items-center justify-center rounded-lg ${aspectRatioClasses[aspectRatio] || 'aspect-square'}`}
  >
    <div className="absolute inset-0 bg-gray-800/50 animate-pulse"></div>
    <div className="relative z-10 text-center text-white w-full max-w-[80%]">
      <AlkemyLoadingIcon className="w-12 h-12 mx-auto mb-3 animate-subtle-pulse" />
      <p className="font-semibold text-sm mb-2">Generating...</p>
      <div className="w-full bg-gray-600 rounded-full h-1.5">
        <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="font-mono text-xs mt-1">{Math.round(progress)}%</p>
    </div>
  </div>
)

const SimpleFullScreenViewer: React.FC<{
  imageUrl: string
  onClose: () => void
}> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Fullscreen generated visual"
          className="max-w-full max-h-full object-contain"
        />
        <Button
          onClick={onClose}
          variant="secondary"
          className="absolute top-4 left-4 !text-sm !gap-2 !px-3 !py-2"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </Button>
      </div>
    </div>
  )
}

const ImageGenTab: React.FC<{
  moodboard?: Moodboard
  moodboardTemplates?: MoodboardTemplate[]
}> = ({ moodboard, moodboardTemplates = [] }) => {
  const [mode, setMode] = useState<'generate' | 'search'>('search')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState<
    'Imagen' | 'Gemini Nano Banana' | 'Flux' | 'FLUX.1.1 Pro' | 'FLUX.1 Kontext' | 'FLUX Ultra'
  >('Imagen')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [promptWasAdjusted, setPromptWasAdjusted] = useState(false)
  const [viewingUrl, setViewingUrl] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchedImage[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState<{ message: string; progress: number }>({
    message: '',
    progress: 0,
  })

  const handleSearch = async () => {
    if (!prompt.trim()) {
      alert('Please enter a search query.')
      return
    }

    setIsSearching(true)
    setSearchResults([])
    setSearchProgress({ message: 'Starting search...', progress: 0 })

    try {
      const moodboardContext = moodboard
        ? `Cinematography: ${moodboard.cinematography?.notes || 'N/A'}. Color: ${moodboard.color?.notes || 'N/A'}.`
        : undefined

      const results = await searchImages(prompt, moodboardContext, (progress) => {
        setSearchProgress({ message: progress.message, progress: progress.progress })
      })

      setSearchResults(results)
    } catch (error) {
      console.error('Failed to search images:', error)
      alert(`Error searching images: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSearching(false)
    }
  }

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })

      // Add to generations gallery
      const newGen: Generation = {
        id: `search-${Date.now()}`,
        url: dataUrl,
        aspectRatio: aspectRatio,
        isLoading: false,
      }
      setGenerations((prev) => [...prev, newGen])
    } catch (error) {
      console.error('Failed to download image:', error)
      alert('Failed to download image. Please try another.')
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt.')
      return
    }
    setPromptWasAdjusted(false)
    const N_GENERATIONS = 2
    const loadingGenerations: Generation[] = Array.from({ length: N_GENERATIONS }).map((_, i) => ({
      id: `gen-${Date.now()}-${i}`,
      url: null,
      aspectRatio,
      isLoading: true,
      progress: 0,
    }))

    setGenerations((prev) => [...prev, ...loadingGenerations])

    try {
      const referenceImages = attachedImage ? [attachedImage] : []

      const onProgress = (index: number, progress: number) => {
        setGenerations((prev) => {
          const newGenerations = [...prev]
          const loaderId = loadingGenerations[index].id
          const genIndex = newGenerations.findIndex((g) => g.id === loaderId)
          if (genIndex !== -1 && newGenerations[genIndex].isLoading) {
            newGenerations[genIndex] = { ...newGenerations[genIndex], progress }
          }
          return newGenerations
        })
      }

      const { urls, errors, wasAdjusted } = await generateStillVariants(
        'image-gen-tab',
        model,
        prompt,
        referenceImages,
        [],
        aspectRatio,
        N_GENERATIONS,
        moodboard,
        moodboardTemplates,
        undefined,
        undefined,
        onProgress
      )

      if (wasAdjusted) {
        setPromptWasAdjusted(true)
      }

      setGenerations((prev) => {
        const currentGenerations = [...prev]
        urls.forEach((url, i) => {
          const error = errors[i]
          const loaderId = loadingGenerations[i].id
          const index = currentGenerations.findIndex((g) => g.id === loaderId)
          if (index !== -1) {
            currentGenerations[index] = {
              ...currentGenerations[index],
              url: url || null,
              isLoading: false,
              error: error || undefined,
            }
          }
        })
        return currentGenerations.filter((g) => g.url || g.isLoading || g.error)
      })
    } catch (error) {
      console.error('Failed to generate images:', error)
      alert(`Error generating images: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setGenerations((prev) => prev.filter((g) => !g.isLoading))
    }
  }

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        setAttachedImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
    if (e.target) e.target.value = ''
  }

  return (
    <div className="h-full flex flex-col">
      {viewingUrl && (
        <SimpleFullScreenViewer imageUrl={viewingUrl} onClose={() => setViewingUrl(null)} />
      )}
      <header className="mb-6 flex-shrink-0">
        <h2 className={`text-2xl font-bold mb-1 text-[var(--color-text-primary)]`}>Image Studio</h2>
        <p className={`text-md text-[var(--color-text-secondary)] max-w-3xl`}>
          Search the web for reference images or generate custom visuals using AI.
        </p>

        {/* Mode Switcher */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setMode('search')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              mode === 'search'
                ? 'bg-#DFEC2D text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <SearchIcon className="w-4 h-4 inline mr-2" />
            Web Search
          </button>
          <button
            onClick={() => setMode('generate')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              mode === 'generate'
                ? 'bg-#DFEC2D text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <AlkemyLoadingIcon className="w-4 h-4 inline mr-2" />
            AI Generate
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pr-4">
        {mode === 'search' && (
          <>
            {isSearching && (
              <div className="mb-4 p-4 bg-yellow-900/20 border border-#DFEC2D/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlkemyLoadingIcon className="w-5 h-5 animate-spin text-#DFEC2D" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-300">
                      {searchProgress.message}
                    </p>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-#DFEC2D h-2 rounded-full transition-all"
                        style={{ width: `${searchProgress.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-[var(--color-text-primary)]">
                  Search Results ({searchResults.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="relative group rounded-lg overflow-hidden aspect-video bg-black/10 cursor-pointer"
                    >
                      <img
                        src={result.url}
                        alt={result.title}
                        className="w-full h-full object-cover"
                        onClick={() => setViewingUrl(result.url)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-xs font-semibold text-white mb-1 line-clamp-2">
                            {result.title}
                          </p>
                          <p className="text-[10px] text-gray-300">{result.source}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadImage(result.url)
                          }}
                          className="absolute top-2 right-2 p-2 bg-#DFEC2D rounded-full text-white hover:bg-#FDE047 transition-colors"
                          aria-label="Add to gallery"
                        >
                          <DownloadIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {generations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-[var(--color-text-primary)]">
              {mode === 'search' ? 'Your Gallery' : 'Generated Images'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generations.map((generation) => (
                <div
                  key={generation.id}
                  onClick={() => generation.url && setViewingUrl(generation.url)}
                  className={`relative group rounded-lg overflow-hidden ${aspectRatioClasses[generation.aspectRatio] || 'aspect-square'} bg-black/10 ${generation.url ? 'cursor-pointer' : ''}`}
                >
                  {generation.isLoading ? (
                    <LoadingSkeleton
                      aspectRatio={generation.aspectRatio}
                      progress={generation.progress || 0}
                    />
                  ) : generation.url ? (
                    <>
                      <img
                        src={generation.url}
                        alt={`Generated shot`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setGenerations((g) => g.filter((gen) => gen.id !== generation.id))
                        }}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/50 rounded-full text-gray-300 hover:text-red-500 hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Delete"
                      >
                        <Trash2Icon className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="p-2 text-center flex flex-col items-center justify-center h-full bg-red-900/20">
                      <p className="text-xs text-red-400 font-semibold">Generation Failed</p>
                      <p className="text-[10px] text-gray-400 mt-1 line-clamp-3">
                        {generation.error}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="pt-6 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#1C1C1C] p-3 rounded-2xl flex flex-col gap-2.5 shadow-2xl border border-gray-700">
            {promptWasAdjusted && (
              <div className="text-xs text-#DFEC2D/80 px-4">
                Note: Your prompt was adjusted for safety.
              </div>
            )}
            {attachedImage && (
              <div className="relative self-start p-1 bg-black/20 rounded-lg ml-3">
                <img
                  src={attachedImage}
                  alt="Attached reference"
                  className="w-16 h-16 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              {mode === 'generate' && (
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
                    className="p-1.5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <PaperclipIcon className="w-6 h-6" />
                  </button>
                </>
              )}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'search'
                    ? 'Search for reference images...'
                    : 'Describe the image you want to create...'
                }
                rows={1}
                className="flex-1 bg-transparent text-base resize-none focus:outline-none max-h-24 pt-1 text-gray-200 placeholder-gray-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    mode === 'search' ? handleSearch() : handleGenerate()
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between pl-10">
              {mode === 'generate' && (
                <div className="flex items-center gap-2">
                  <select
                    value={model}
                    onChange={(e) =>
                      setModel(
                        e.target.value as
                          | 'Imagen'
                          | 'Gemini Nano Banana'
                          | 'Flux'
                          | 'FLUX.1.1 Pro'
                          | 'FLUX.1 Kontext'
                          | 'FLUX Ultra'
                      )
                    }
                    className="bg-gray-700 text-black text-xs rounded-full font-semibold px-3 py-1.5 appearance-none focus:outline-none cursor-pointer"
                  >
                    <option>Imagen</option>
                    <option>Gemini Nano Banana</option>
                    <option>Flux</option>
                    <option value="FLUX.1.1 Pro">FLUX.1.1 Pro (FAL.AI)</option>
                    <option value="FLUX.1 Kontext">FLUX.1 Kontext (FAL.AI)</option>
                    <option value="FLUX Ultra">FLUX Ultra (FAL.AI)</option>
                  </select>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="bg-gray-700 text-black text-xs rounded-full font-semibold px-3 py-1.5 appearance-none focus:outline-none cursor-pointer"
                  >
                    <option>16:9</option>
                    <option>9:16</option>
                    <option>1:1</option>
                    <option>4:3</option>
                    <option>3:4</option>
                  </select>
                </div>
              )}
              <div className="flex items-center ml-auto">
                {mode === 'search' ? (
                  <Button
                    onClick={handleSearch}
                    disabled={!prompt.trim() || isSearching}
                    className="!bg-#DFEC2D !text-white !font-bold !py-2 !px-5 rounded-lg hover:!bg-#FDE047"
                  >
                    <SearchIcon className="w-4 h-4 inline mr-2" />
                    {isSearching ? 'Searching...' : 'Search Web'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim()}
                    className="!bg-white !text-black !font-bold !py-2 !px-5 rounded-lg"
                  >
                    Generate
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ImageGenTab
