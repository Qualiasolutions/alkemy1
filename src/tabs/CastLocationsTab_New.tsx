import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import Button from '../components/Button'
import { CharacterIdentityTestPanel } from '../components/CharacterIdentityTestPanel'
import {
  AlkemyLoadingIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ImagePlusIcon,
  PaperclipIcon,
  SparklesIcon,
  XIcon,
} from '../components/icons/Icons'
import { generateStillVariants } from '../services/aiService'
import { getCharacterIdentityStatus } from '../services/characterIdentityService'
import { useTheme } from '../theme/ThemeContext'
import type {
  AnalyzedCharacter,
  AnalyzedLocation,
  Generation,
  Moodboard,
  MoodboardTemplate,
} from '../types'

// ====================================================================
// REDESIGNED PROFESSIONAL GENERATION VIEW
// ====================================================================

type GenerationItem = {
  type: 'character' | 'location'
  data: AnalyzedCharacter | AnalyzedLocation
}

type ImageSlot = {
  id: string
  label: string
  priority: number
  url: string | null
  generation: Generation | null
  isLoading: boolean
  progress: number
}

const GenerationView: React.FC<{
  item: GenerationItem
  onBack: () => void
  onUpdateBatch: (
    updater: (prev: AnalyzedCharacter | AnalyzedLocation) => AnalyzedCharacter | AnalyzedLocation
  ) => void
  moodboard?: Moodboard
  moodboardTemplates?: MoodboardTemplate[]
}> = ({ item, onBack, onUpdateBatch, moodboard, moodboardTemplates = [] }) => {
  const { isDark } = useTheme()
  const [detailedPrompt, setDetailedPrompt] = useState('')
  const [model, setModel] = useState<
    'Imagen' | 'Gemini Nano Banana' | 'Flux' | 'Flux Kontext Max Multi'
  >('Flux')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'main' | 'identity'>('main')
  const [selectedSlot, setSelectedSlot] = useState<string>('main')
  const [numVariants, setNumVariants] = useState(4)

  // Check if this is a character
  const isCharacter = item.type === 'character'
  const character = isCharacter ? (item.data as AnalyzedCharacter) : null

  // Create image slots structure
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([
    {
      id: 'main',
      label: 'Main',
      priority: 1,
      url: item.data.imageUrl,
      generation: null,
      isLoading: false,
      progress: 0,
    },
    {
      id: 'secondary',
      label: 'Secondary',
      priority: 2,
      url: null,
      generation: null,
      isLoading: false,
      progress: 0,
    },
    {
      id: 'tertiary',
      label: 'Tertiary',
      priority: 3,
      url: null,
      generation: null,
      isLoading: false,
      progress: 0,
    },
    {
      id: 'fourth',
      label: 'Fourth',
      priority: 4,
      url: null,
      generation: null,
      isLoading: false,
      progress: 0,
    },
  ])

  // Sync generations to slots
  useEffect(() => {
    const gens = item.data.generations || []
    setImageSlots((prev) => {
      const updated = [...prev]
      // Main slot
      updated[0].url = item.data.imageUrl

      // Fill other slots with generations
      gens.slice(0, 3).forEach((gen, idx) => {
        if (gen.url && !gen.isLoading) {
          updated[idx + 1].url = gen.url
          updated[idx + 1].generation = gen
        }
      })

      return updated
    })
  }, [item.data])

  const handleGenerate = async () => {
    if (!detailedPrompt.trim()) {
      alert('Please enter a prompt.')
      return
    }

    const N_GENERATIONS = numVariants
    const loadingGenerations: Generation[] = Array.from({ length: N_GENERATIONS }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      url: null,
      aspectRatio,
      isLoading: true,
      progress: 0,
    }))

    // Update slots to show loading
    setImageSlots((prev) => {
      const updated = [...prev]
      loadingGenerations.forEach((_gen, idx) => {
        if (idx + 1 < updated.length) {
          updated[idx + 1].isLoading = true
          updated[idx + 1].progress = 0
        }
      })
      return updated
    })

    onUpdateBatch((prevItem) => ({
      ...prevItem,
      generations: [...(prevItem.generations || []), ...loadingGenerations],
    }))

    try {
      const referenceImages: string[] = []
      if (attachedImage) referenceImages.push(attachedImage)
      if (item.data.imageUrl) referenceImages.push(item.data.imageUrl)

      // ===== CHARACTER IDENTITY INTEGRATION =====
      let characterIdentities: Array<{ loraUrl: string; scale: number }> | undefined

      if (isCharacter && character?.identity) {
        const identityStatus = getCharacterIdentityStatus(character.identity)
        if (identityStatus === 'ready' && character.identity.technologyData?.falCharacterId) {
          const referenceStrength = character.identity.technologyData.referenceStrength || 80
          characterIdentities = [
            {
              loraUrl: character.identity.technologyData.falCharacterId,
              scale: referenceStrength / 100,
            },
          ]
          console.log('[CastLocationsTab] Using character identity:', {
            characterName: character.name,
            loraUrl: `${character.identity.technologyData.falCharacterId.substring(0, 50)}...`,
            scale: referenceStrength / 100,
          })
        }
      }

      const onProgress = (index: number, progress: number) => {
        setImageSlots((prev) => {
          const updated = [...prev]
          if (index + 1 < updated.length) {
            updated[index + 1].progress = progress
          }
          return updated
        })
      }

      const { urls, errors } = await generateStillVariants(
        item.data.id,
        model,
        detailedPrompt,
        referenceImages,
        [],
        aspectRatio,
        N_GENERATIONS,
        moodboard,
        moodboardTemplates,
        isCharacter ? [character?.name] : undefined,
        !isCharacter ? (item.data as AnalyzedLocation).name : undefined,
        onProgress,
        undefined,
        characterIdentities // Pass character identity LoRAs
      )

      // Update slots with results
      setImageSlots((prev) => {
        const updated = [...prev]
        urls.forEach((url, idx) => {
          if (idx + 1 < updated.length) {
            updated[idx + 1].url = url || null
            updated[idx + 1].isLoading = false
            updated[idx + 1].progress = 100
          }
        })
        return updated
      })

      onUpdateBatch((prevItem) => {
        const currentGenerations = [...(prevItem.generations || [])]
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
        return {
          ...prevItem,
          generations: currentGenerations.filter((g) => g.url || g.isLoading || g.error),
        }
      })
    } catch (error) {
      console.error(`Failed to generate visual for ${item.data.name}:`, error)
      alert(`Error generating visual: ${error instanceof Error ? error.message : 'Unknown error'}`)

      setImageSlots((prev) =>
        prev.map((slot) => ({
          ...slot,
          isLoading: false,
        }))
      )

      onUpdateBatch((prevItem) => ({
        ...prevItem,
        generations: (prevItem.generations || []).filter((g) => !g.isLoading),
      }))
    }
  }

  const handleSetMain = (slotId: string) => {
    const slot = imageSlots.find((s) => s.id === slotId)
    if (slot?.url) {
      onUpdateBatch((prev) => ({ ...prev, imageUrl: slot.url! }))
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

  const selectedSlotData = imageSlots.find((s) => s.id === selectedSlot)

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0B0B0B] via-[#0F0F0F] to-[#0B0B0B] flex flex-col z-50">
      {/* Professional Header */}
      <header className="flex-shrink-0 px-8 py-6 border-b border-gray-800/80 backdrop-blur-xl bg-black/40">
        <div className="flex items-center justify-between gap-6 mb-6">
          <Button
            onClick={onBack}
            variant="secondary"
            className="!text-sm !gap-2 !px-4 !py-2.5 !rounded-xl !border-gray-700 hover:!border-teal-500/50 !transition-all"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to List
          </Button>
          <div className="flex-1 text-center">
            <h2 className="text-2xl font-bold text-white mb-1">{item.data.name}</h2>
            <p className="text-sm text-gray-400">
              {item.type === 'character' ? 'Character' : 'Location'} Generation Studio
            </p>
          </div>
          <div className="w-32"></div>
        </div>

        {/* Tab Navigation (only for characters) */}
        {isCharacter && (
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setActiveTab('main')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'main'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300 border border-gray-700'
              }`}
            >
              Image Generation
            </button>
            <button
              onClick={() => setActiveTab('identity')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                activeTab === 'identity'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300 border border-gray-700'
              }`}
            >
              <SparklesIcon className="w-4 h-4" />
              Character Identity
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      {activeTab === 'identity' && isCharacter && character ? (
        <main className="flex-1 overflow-y-auto p-8">
          <CharacterIdentityTestPanel
            character={character}
            onTestsComplete={(tests) => {
              onUpdateBatch((prev) => ({
                ...prev,
                identity: {
                  ...(prev as AnalyzedCharacter).identity!,
                  tests,
                },
              }))
            }}
            onApprovalChange={(approved) => {
              onUpdateBatch((prev) => ({
                ...prev,
                identity: {
                  ...(prev as AnalyzedCharacter).identity!,
                  approvalStatus: approved ? 'approved' : 'rejected',
                },
              }))
            }}
          />
        </main>
      ) : (
        <main className="flex-1 overflow-hidden flex gap-6 p-8">
          {/* LEFT: Image Slots Grid */}
          <aside className="w-96 flex flex-col gap-4">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl border border-gray-700/50 p-4 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-1">
                Image Variants
              </h3>
              <p className="text-xs text-gray-500 mb-4">Click to select, generate to fill slots</p>

              <div className="space-y-3">
                {imageSlots.map((slot, _idx) => (
                  <motion.div
                    key={slot.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`relative group rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${
                      selectedSlot === slot.id
                        ? 'border-teal-500 shadow-lg shadow-teal-500/30'
                        : 'border-gray-700/50 hover:border-teal-500/50'
                    }`}
                  >
                    <div className="aspect-video relative bg-black/40">
                      {slot.isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <AlkemyLoadingIcon className="w-8 h-8 animate-subtle-pulse text-teal-400 mb-2" />
                          <div className="w-3/4 bg-gray-700 rounded-full h-1">
                            <div
                              className="bg-teal-500 h-1 rounded-full transition-all"
                              style={{ width: `${slot.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{Math.round(slot.progress)}%</p>
                        </div>
                      ) : slot.url ? (
                        <>
                          <img
                            src={slot.url}
                            alt={slot.label}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <ImagePlusIcon className="w-8 h-8 text-gray-600 mx-auto mb-1" />
                            <p className="text-xs text-gray-600">Empty</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Slot Label */}
                    <div
                      className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md ${
                        slot.id === 'main'
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-gray-900/90 text-gray-300'
                      }`}
                    >
                      {slot.label}
                    </div>

                    {/* Set Main Button */}
                    {slot.url && slot.id !== 'main' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetMain(slot.id)
                        }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500 hover:bg-emerald-400 text-white text-xs px-3 py-1.5 rounded-lg font-semibold shadow-lg"
                      >
                        Set Main
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </aside>

          {/* CENTER: Main Display */}
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-black/60 to-gray-900/40 rounded-3xl border-2 border-gray-800/50 p-12 backdrop-blur-sm">
            {selectedSlotData?.url ? (
              <div className="relative max-w-full max-h-full">
                <motion.img
                  key={selectedSlotData.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={selectedSlotData.url}
                  alt={selectedSlotData.label}
                  className="max-w-full max-h-full object-contain rounded-2xl border-4 border-teal-500/40 shadow-2xl shadow-teal-500/20"
                />
                {/* Glow effect */}
                <div className="absolute -inset-2 bg-gradient-to-r from-teal-500/20 via-emerald-500/20 to-cyan-500/20 rounded-3xl -z-10 blur-2xl"></div>
              </div>
            ) : selectedSlotData?.isLoading ? (
              <div className="text-center">
                <AlkemyLoadingIcon className="w-16 h-16 text-teal-400 animate-subtle-pulse mx-auto mb-4" />
                <p className="text-gray-300 text-lg font-semibold">
                  Generating {selectedSlotData.label}...
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {Math.round(selectedSlotData.progress)}% complete
                </p>
              </div>
            ) : (
              <div className="text-center">
                <ImagePlusIcon className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">
                  No image in {selectedSlotData?.label} slot
                </p>
                <p className="text-gray-600 text-sm">Generate variants using the form below</p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Footer Generation Controls (only for main tab) */}
      {activeTab === 'main' && (
        <footer className="flex-shrink-0 p-8 pt-6 border-t border-gray-800/80 backdrop-blur-xl bg-black/60">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-5xl mx-auto"
          >
            {/* Professional Generation Card */}
            <div className="relative group">
              {/* Animated gradient glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 rounded-[32px] opacity-20 group-hover:opacity-30 blur-2xl transition-all duration-700" />

              <div className="relative backdrop-blur-2xl bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 rounded-[28px] border-2 border-gray-700/50 shadow-2xl overflow-hidden">
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />

                <div className="p-6 space-y-5">
                  {/* Attached image preview */}
                  <AnimatePresence>
                    {attachedImage && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: -10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -10 }}
                        className="relative inline-block p-2 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl border border-gray-700/50 backdrop-blur-sm"
                      >
                        <img
                          src={attachedImage}
                          alt="Reference"
                          className="w-24 h-24 object-cover rounded-xl"
                        />
                        <motion.button
                          whileHover={{ scale: 1.15, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setAttachedImage(null)}
                          className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full p-1.5 hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/40"
                        >
                          <XIcon className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Prompt input area */}
                  <div className="relative bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5 focus-within:border-teal-500/50 focus-within:bg-gray-800/70 transition-all">
                    <div className="flex items-start gap-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileAttach}
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-shrink-0 mt-1.5 p-3 text-gray-400 rounded-xl hover:bg-gradient-to-br hover:from-teal-500/20 hover:to-purple-500/20 hover:text-teal-400 transition-all border border-transparent hover:border-teal-500/30 group/attach"
                      >
                        <PaperclipIcon className="w-5 h-5 group-hover/attach:rotate-45 transition-transform" />
                      </motion.button>
                      <textarea
                        value={detailedPrompt}
                        onChange={(e) => setDetailedPrompt(e.target.value)}
                        placeholder={`Describe the visual for ${item.data.name}... (e.g., "cinematic portrait, dramatic lighting, golden hour")`}
                        rows={3}
                        className="flex-1 bg-transparent text-base resize-none focus:outline-none text-gray-100 placeholder-gray-500 leading-relaxed"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && detailedPrompt.trim()) {
                            e.preventDefault()
                            handleGenerate()
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Controls row */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Model Selector */}
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value as any)}
                        className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 hover:from-gray-700 hover:to-gray-800 text-white text-sm rounded-xl font-semibold px-5 py-3 appearance-none cursor-pointer border border-gray-600/50 hover:border-teal-500/50 transition-all shadow-lg backdrop-blur-sm"
                      >
                        <option value="Imagen">Imagen</option>
                        <option value="Gemini Nano Banana">Gemini Nano Banana</option>
                        <option value="Flux">Flux Pro</option>
                        <option value="Flux Kontext Max Multi">Flux Kontext Max Multi</option>
                      </select>

                      {/* Aspect Ratio */}
                      <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 hover:from-gray-700 hover:to-gray-800 text-white text-sm rounded-xl font-semibold px-5 py-3 appearance-none cursor-pointer border border-gray-600/50 hover:border-teal-500/50 transition-all shadow-lg backdrop-blur-sm"
                      >
                        <option value="16:9">16:9 Landscape</option>
                        <option value="9:16">9:16 Portrait</option>
                        <option value="1:1">1:1 Square</option>
                        <option value="4:3">4:3 Classic</option>
                        <option value="3:4">3:4 Portrait</option>
                      </select>

                      {/* Variants Count */}
                      <select
                        value={numVariants}
                        onChange={(e) => setNumVariants(Number(e.target.value))}
                        className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 hover:from-gray-700 hover:to-gray-800 text-white text-sm rounded-xl font-semibold px-5 py-3 appearance-none cursor-pointer border border-gray-600/50 hover:border-purple-500/50 transition-all shadow-lg backdrop-blur-sm"
                      >
                        <option value={1}>1 Variant</option>
                        <option value={2}>2 Variants</option>
                        <option value={3}>3 Variants</option>
                        <option value={4}>4 Variants</option>
                      </select>

                      {/* Character Identity Badge */}
                      {isCharacter &&
                        character?.identity &&
                        getCharacterIdentityStatus(character.identity) === 'ready' && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 rounded-xl backdrop-blur-sm"
                          >
                            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-semibold text-emerald-300">
                              Identity Active
                            </span>
                          </motion.div>
                        )}
                    </div>

                    {/* Generate Button */}
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleGenerate}
                        disabled={!detailedPrompt.trim()}
                        className="relative overflow-hidden !bg-gradient-to-r !from-teal-500 !via-cyan-500 !to-teal-500 !text-white !font-bold !py-3.5 !px-10 !rounded-xl hover:!shadow-2xl hover:!shadow-teal-500/30 !transition-all disabled:!opacity-50 disabled:!cursor-not-allowed group/btn !border-0"
                      >
                        <span className="relative z-10 flex items-center gap-2.5 text-base">
                          <SparklesIcon className="w-5 h-5" />
                          Generate {numVariants > 1 ? `${numVariants} Variants` : 'Image'}
                          <motion.span
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            →
                          </motion.span>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity animate-shimmer" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </footer>
      )}
    </div>
  )
}

// ====================================================================
// REST OF THE COMPONENTS (Cards, Modals, etc.) - UNCHANGED
// ====================================================================

// ... (Keep all the other components from the original file)

export default GenerationView
