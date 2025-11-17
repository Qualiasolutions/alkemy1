import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MoodboardTemplate, MoodboardItem, MoodboardSection } from '../types';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeContext';
import { PlusIcon, UploadCloudIcon, Trash2Icon, SparklesIcon, ImageIcon, XIcon, SearchIcon, DownloadIcon, RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/icons/Icons';
import { generateMoodboardDescription } from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import { searchImages, SearchedImage } from '../services/imageSearchService';
import ImageCarousel from '../components/ImageCarousel';

const MAX_ITEMS = 20;

const createTemplate = (count: number): MoodboardTemplate => ({
  id: `moodboard-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  title: count === 0 ? 'Master Moodboard' : `Moodboard ${count + 1}`,
  description: count === 0 ? 'Primary visual language for the project.' : '',
  items: [],
  createdAt: new Date().toISOString(),
});

// Enhanced Moodboard AI Summary Component
interface MoodboardAISummaryProps {
  summary: string | undefined;
  isGenerating: boolean;
  onRegenerate: () => void;
  disabled?: boolean;
}

const MoodboardAISummary: React.FC<MoodboardAISummaryProps> = ({
  summary,
  isGenerating,
  onRegenerate,
  disabled = false
}) => {
  const { isDark } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden ${
        isDark
          ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800/50'
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
      }`}
    >
      {/* Header with action button */}
      <div className={`px-6 py-4 border-b ${
        isDark ? 'border-gray-800/50' : 'border-gray-200'
      } bg-gradient-to-r from-purple-500/10 via-teal-500/10 to-pink-500/10 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <motion.div
            animate={isGenerating ? {
              rotate: 360,
              scale: [1, 1.2, 1]
            } : {}}
            transition={{ duration: 2, repeat: isGenerating ? Infinity : 0 }}
          >
            <SparklesIcon className="w-5 h-5 text-purple-400" />
          </motion.div>
          <h4 className={`text-lg font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            AI Visual Language
          </h4>
        </div>

        <Button
          variant="secondary"
          onClick={onRegenerate}
          disabled={isGenerating || disabled}
          className="!text-xs !py-2 !px-3"
        >
          <RefreshCwIcon className={`w-3 h-3 mr-1 ${
            isGenerating ? 'animate-spin' : ''
          }`} />
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
      </div>

      {/* Content */}
      <div className="p-6">
        {isGenerating ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, width: 0 }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  width: `${85 - i * 5}%`
                }}
                transition={{
                  opacity: { duration: 1.5, repeat: Infinity, delay: i * 0.15 },
                  width: { duration: 0.5, delay: i * 0.1 }
                }}
                className={`h-3 rounded ${
                  isDark ? 'bg-gray-800' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        ) : summary ? (
          <div className="space-y-4">
            {/* Parse summary into paragraphs */}
            {summary.split('\n\n').filter(p => p.trim()).map((paragraph, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`text-sm leading-relaxed ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {paragraph}
              </motion.p>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <SparklesIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {disabled ? 'Add images to generate AI summary' : 'No AI summary generated yet'}
            </p>
            <p className="text-xs mt-2 opacity-70">
              Generate a visual language description to align your team
            </p>
          </div>
        )}
      </div>

      {/* Bottom accent */}
      <div className="h-1 bg-gradient-to-r from-purple-500/50 via-teal-500/50 to-pink-500/50" />
    </motion.div>
  );
};

type MoodboardTabProps = {
  moodboardTemplates: MoodboardTemplate[];
  onUpdateMoodboardTemplates: (updater: React.SetStateAction<MoodboardTemplate[]>) => void;
  scriptAnalyzed: boolean;
};

const MoodboardTab: React.FC<MoodboardTabProps> = ({ moodboardTemplates, onUpdateMoodboardTemplates, scriptAnalyzed }) => {
  const { isDark } = useTheme();
  const [activeId, setActiveId] = useState<string | null>(moodboardTemplates[0]?.id ?? null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fullscreenView, setFullscreenView] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showWebSearch, setShowWebSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState<{ message: string; progress: number }>({ message: '', progress: 0 });
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isAddingBulkImages, setIsAddingBulkImages] = useState(false);


  useEffect(() => {
    if (!scriptAnalyzed) return;
    if (moodboardTemplates.length === 0) {
      const template = createTemplate(0);
      onUpdateMoodboardTemplates(prev => [...prev, template]);
      setActiveId(template.id);
    } else if (!activeId || !moodboardTemplates.some(board => board.id === activeId)) {
      setActiveId(moodboardTemplates[0]?.id ?? null);
    }
  }, [scriptAnalyzed, moodboardTemplates, activeId, onUpdateMoodboardTemplates]);

  const activeBoard = useMemo(() => moodboardTemplates.find(board => board.id === activeId) ?? null, [moodboardTemplates, activeId]);

  const handleCreateBoard = () => {
    onUpdateMoodboardTemplates(prev => {
      const template = createTemplate(prev.length);
      setActiveId(template.id);
      return [...prev, template];
    });
  };

  const handleDeleteBoard = (id: string) => {
    onUpdateMoodboardTemplates(prev => {
      const updated = prev.filter(board => board.id !== id);
      if (id === activeId) {
        setActiveId(updated[0]?.id ?? null);
      }
      return updated;
    });
  };

  const updateBoard = useCallback((id: string, updater: (board: MoodboardTemplate) => MoodboardTemplate) => {
    onUpdateMoodboardTemplates(prev => prev.map(board => (board.id === id ? updater(board) : board)));
  }, [onUpdateMoodboardTemplates]);

  const handleFiles = (files: FileList) => {
    if (!activeBoard) return;
    const remainingSlots = MAX_ITEMS - activeBoard.items.length;
    const fileArray = Array.from(files).slice(0, remainingSlots);
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = event => {
        const url = event.target?.result as string;
        const type: MoodboardItem['type'] = file.type.startsWith('video') ? 'video' : 'image';
        const newItem: MoodboardItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          url,
          type,
          metadata: { title: file.name },
        };
        updateBoard(activeBoard.id, board => ({ ...board, items: [...board.items, newItem] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = event => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (!event.dataTransfer.files?.length) return;
    handleFiles(event.dataTransfer.files);
  };

  const handleGenerateSummary = async () => {
    if (!activeBoard || activeBoard.items.length === 0) return;
    setIsGeneratingSummary(true);
    try {
      const section: MoodboardSection = {
        notes: activeBoard.description ?? '',
        items: activeBoard.items,
        aiDescription: activeBoard.aiSummary,
      };
      const summary = await generateMoodboardDescription(section);
      updateBoard(activeBoard.id, board => ({ ...board, aiSummary: summary }));
    } catch (error) {
      console.error('Failed to generate moodboard summary', error);
      alert(`Could not generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleWebSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a search query.");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setSelectedImages(new Set()); // Clear previous selections
    setSearchProgress({ message: 'Starting search...', progress: 0 });

    try {
      const moodboardContext = activeBoard?.description || undefined;
      const results = await searchImages(searchQuery, moodboardContext, (progress) => {
        setSearchProgress({ message: progress.message, progress: progress.progress });
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search images:', error);
      alert(`Error searching images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddImageToMoodboard = async (imageUrl: string) => {
    if (!activeBoard) {
      alert('No active moodboard. Please create or select a moodboard first.');
      return;
    }

    if (activeBoard.items.length >= MAX_ITEMS) {
      alert(`Moodboard is full! Maximum ${MAX_ITEMS} items allowed.`);
      return;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const newItem: MoodboardItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        url: dataUrl,
        type: 'image',
        metadata: { title: 'Web search result' },
      };

      updateBoard(activeBoard.id, board => ({ ...board, items: [...board.items, newItem] }));
      return true; // Success indicator
    } catch (error) {
      console.error('Failed to add image:', error);
      alert('Failed to add image to moodboard. Please try another.');
      return false;
    }
  };

  const handleAddSelectedImagesToMoodboard = async () => {
    if (!activeBoard) {
      alert('No active moodboard. Please create or select a moodboard first.');
      return;
    }

    const remainingSlots = MAX_ITEMS - activeBoard.items.length;
    const imagesToAdd = Array.from(selectedImages).slice(0, remainingSlots);

    if (imagesToAdd.length === 0) {
      alert('No images selected.');
      return;
    }

    if (imagesToAdd.length < selectedImages.size) {
      alert(`Only ${imagesToAdd.length} images will be added due to moodboard limit.`);
    }

    setIsAddingBulkImages(true);
    let successCount = 0;
    let failedCount = 0;

    try {
      const newItems: MoodboardItem[] = [];

      for (const imageUrl of imagesToAdd) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });

          const newItem: MoodboardItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            url: dataUrl,
            type: 'image',
            metadata: { title: 'Web search result' },
          };

          newItems.push(newItem);
          successCount++;
        } catch (error) {
          console.error('Failed to add image:', error);
          failedCount++;
        }
      }

      if (newItems.length > 0) {
        updateBoard(activeBoard.id, board => ({
          ...board,
          items: [...board.items, ...newItems]
        }));
      }

      // Clear selection and close modal
      setSelectedImages(new Set());
      setShowWebSearch(false);

      if (successCount > 0) {
        alert(`Successfully added ${successCount} image${successCount > 1 ? 's' : ''} to moodboard${failedCount > 0 ? `. ${failedCount} failed.` : '.'}`);
      } else {
        alert('Failed to add images to moodboard.');
      }
    } catch (error) {
      console.error('Failed to add images:', error);
      alert('An error occurred while adding images.');
    } finally {
      setIsAddingBulkImages(false);
    }
  };

  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageUrl)) {
        newSet.delete(imageUrl);
      } else {
        newSet.add(imageUrl);
      }
      return newSet;
    });
  };

  // Auto-advance slideshow every 4 seconds
  useEffect(() => {
    if (!fullscreenView || !activeBoard || activeBoard.items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % activeBoard.items.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [fullscreenView, activeBoard]);

  const handleOpenFullscreen = (index: number) => {
    setCurrentSlideIndex(index);
    setFullscreenView(true);
  };

  if (!scriptAnalyzed) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300/40 bg-white/40 text-center text-slate-500 dark:border-slate-700/60 dark:bg-white/5 dark:text-slate-400">
        <ImageIcon className="mb-4 h-10 w-10" />
        <p className="max-w-md text-lg font-medium">Analyze a script first to unlock the Moodboard studio.</p>
        <p className="max-w-sm text-sm opacity-80">Once the script is processed, you can craft visual templates that influence every generation.</p>
      </div>
    );
  }

  return (
    <div className="grid h-full gap-6 lg:grid-cols-[320px_1fr]">
      <aside className={`flex h-full flex-col rounded-3xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'} p-5 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Moodboard Templates</h2>
            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Each board subtly informs all visual generations.</p>
          </div>
          <Button variant="primary" onClick={handleCreateBoard} className="!px-3 !py-2 !text-xs">
            <PlusIcon className="h-4 w-4" />
            Add
          </Button>
        </div>
        <div className="mt-4 space-y-3 overflow-y-auto pr-2">
          {moodboardTemplates.map(board => {
            const isActive = board.id === activeId;
            return (
              <button
                key={board.id}
                onClick={() => setActiveId(board.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-#dfec2d/40 bg-#dfec2d/10 text-lime-100'
                    : isDark
                      ? 'border-white/5 bg-white/5 text-white/70 hover:border-white/15 hover:bg-white/10'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-#dfec2d/40 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-semibold">{board.title}</div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    board.items.length > 0
                      ? 'bg-#dfec2d/15 text-lime-300'
                      : 'bg-slate-500/15 text-slate-400'
                  }`}>
                    {board.items.length}/{MAX_ITEMS}
                  </span>
                </div>
                {board.description && (
                  <p className="mt-1 truncate text-[11px] opacity-70">{board.description}</p>
                )}
                {moodboardTemplates.length > 1 && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteBoard(board.id);
                    }}
                    className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-white/50 hover:text-white"
                  >
                    <Trash2Icon className="h-3 w-3" /> Remove
                  </button>
                )}
              </button>
            );
          })}
          {moodboardTemplates.length === 0 && (
            <p className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
              Create a board to begin collecting references.
            </p>
          )}
        </div>
      </aside>

      <section className={`flex h-full flex-col rounded-3xl border ${isDark ? 'border-white/10 bg-[#0C101A]' : 'border-slate-200 bg-white'} shadow-lg`}>
        {activeBoard ? (
          <div className="flex h-full flex-col">
            {/* Compact Header */}
            <header className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
              <input
                value={activeBoard.title}
                onChange={(event) => updateBoard(activeBoard.id, board => ({ ...board, title: event.target.value }))}
                className={`text-xl font-bold outline-none transition ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-slate-900'}`}
                placeholder="Moodboard title"
              />
              <Button
                variant="primary"
                onClick={() => setShowWebSearch(true)}
                className="!px-4 !py-2 !text-sm flex items-center gap-2"
              >
                <SearchIcon className="h-4 w-4" />
                Web Search
              </Button>
            </header>

            {/* Main Content Area - Two Columns */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 p-6 overflow-hidden">
              {/* Left Column - Image Display */}
              <div
                className={`relative flex flex-col gap-4 rounded-2xl border-2 border-dashed transition ${
                  dragActive
                    ? 'border-#dfec2d bg-#dfec2d/10'
                    : isDark
                      ? 'border-white/10 bg-white/5'
                      : 'border-slate-200 bg-slate-50'
                }`}
                onDragEnter={(event) => { event.preventDefault(); event.stopPropagation(); setDragActive(true); }}
                onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); }}
                onDragLeave={(event) => { event.preventDefault(); event.stopPropagation(); setDragActive(false); }}
                onDrop={handleDrop}
              >
                <input
                  id="moodboard-file-input"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = event.target.files;
                    if (files?.length) {
                      handleFiles(files);
                      event.target.value = '';
                    }
                  }}
                />

                {activeBoard.items.length === 0 ? (
                  <label
                    htmlFor="moodboard-file-input"
                    className={`flex h-full flex-col items-center justify-center gap-3 text-center text-sm cursor-pointer px-8 py-12 ${
                      isDark ? 'text-white/60' : 'text-slate-500'
                    }`}
                  >
                    <UploadCloudIcon className="h-10 w-10" />
                    <p className={`text-base font-medium ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Drop images or click to upload</p>
                    <p className="text-xs opacity-70 max-w-md leading-relaxed">High-quality stills, lighting references, frames, palette swatches. Up to {MAX_ITEMS} items.</p>
                  </label>
                ) : (
                  <div className="flex flex-col p-4 gap-4 h-full">
                    {/* Main Carousel View */}
                    <div className="flex-1 relative min-h-0">
                      <ImageCarousel
                        images={activeBoard.items.map(item => ({
                          url: item.url,
                          title: item.metadata?.title,
                        }))}
                        currentIndex={currentSlideIndex}
                        onIndexChange={setCurrentSlideIndex}
                        showArrows={true}
                        showDots={false}
                        enableKeyboard={true}
                        aspectRatio="16/9"
                        className="h-full"
                      />
                      {/* Delete button overlay on current image */}
                      <button
                        type="button"
                        onClick={() => {
                          const itemToRemove = activeBoard.items[currentSlideIndex];
                          updateBoard(activeBoard.id, board => ({ ...board, items: board.items.filter(i => i.id !== itemToRemove.id) }));
                          if (currentSlideIndex >= activeBoard.items.length - 1) {
                            setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
                          }
                        }}
                        className="absolute right-6 top-6 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 transition hover:bg-black/80 hover:text-white"
                        aria-label="Remove current reference"
                      >
                        <Trash2Icon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Thumbnail Grid - Max 6 per row */}
                    <div className="relative max-h-40 overflow-y-auto">
                      {/* Thumbnail Container - Grid Layout */}
                      <div
                        className="grid grid-cols-6 gap-2 pb-2"
                        style={{
                          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                        }}
                      >
                        {activeBoard.items.map((item, index) => (
                          <button
                            key={item.id}
                            onClick={() => setCurrentSlideIndex(index)}
                            className={`aspect-video rounded-lg overflow-hidden border-2 transition ${
                              index === currentSlideIndex
                                ? 'border-#dfec2d ring-2 ring-#dfec2d/50'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            {item.type === 'video' ? (
                              <video src={item.url} className="w-full h-full object-cover" />
                            ) : (
                              <img src={item.url} alt={item.metadata?.title || 'Thumbnail'} className="w-full h-full object-cover" />
                            )}
                          </button>
                        ))}
                        {activeBoard.items.length < MAX_ITEMS && (
                          <label
                            htmlFor="moodboard-file-input"
                            className={`aspect-video cursor-pointer flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs transition ${
                              isDark
                                ? 'border-white/20 text-white/60 hover:border-#dfec2d/40 hover:text-lime-200'
                                : 'border-slate-300 text-slate-500 hover:border-#dfec2d hover:text-#b3e617'
                            }`}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Description & AI Summary */}
              <div className="flex flex-col gap-4 overflow-y-auto">
                {/* Compact Description */}
                <div className={`rounded-2xl border p-4 ${
                  isDark
                    ? 'border-white/10 bg-white/5'
                    : 'border-slate-200 bg-white'
                }`}>
                  <label className={`block text-xs font-semibold mb-2 ${
                    isDark ? 'text-white/70' : 'text-slate-600'
                  }`}>
                    Description
                  </label>
                  <textarea
                    value={activeBoard.description}
                    onChange={(event) => updateBoard(activeBoard.id, board => ({ ...board, description: event.target.value }))}
                    placeholder="Brief notes about this moodboard..."
                    className={`w-full px-3 py-2 rounded-lg border outline-none transition resize-none ${
                      isDark
                        ? 'border-white/10 bg-white/5 text-white/80 placeholder:text-white/30 focus:border-#dfec2d/40'
                        : 'border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:border-#dfec2d/40'
                    }`}
                    rows={2}
                  />
                </div>

                {/* AI Summary Component */}
                <MoodboardAISummary
                  summary={activeBoard.aiSummary}
                  isGenerating={isGeneratingSummary}
                  onRegenerate={handleGenerateSummary}
                  disabled={activeBoard.items.length === 0}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-sm text-slate-500 dark:text-white/50">
            <ImageIcon className="mb-4 h-10 w-10" />
            <p>No moodboard selected. Create one to begin.</p>
          </div>
        )}
      </section>

      {/* Web Search Modal */}
      <AnimatePresence>
        {showWebSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
            onClick={() => setShowWebSearch(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl border ${isDark ? 'border-white/10 bg-[#0C101A]' : 'border-slate-200 bg-white'} shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Web Image Search</h3>
                    {selectedImages.size > 0 && (
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          isDark ? 'bg-#dfec2d/20 text-#dfec2d' : 'bg-#dfec2d/30 text-#8A9B1A'
                        }`}>
                          {selectedImages.size} selected
                        </span>
                        <Button
                          variant="primary"
                          onClick={handleAddSelectedImagesToMoodboard}
                          disabled={isAddingBulkImages}
                          className="!px-4 !py-2 !text-sm"
                        >
                          {isAddingBulkImages ? 'Adding...' : `Add ${selectedImages.size} to Moodboard`}
                        </Button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowWebSearch(false);
                      setSelectedImages(new Set()); // Clear selections on close
                    }}
                    className={`p-2 rounded-full transition ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-900'}`}
                  >
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for reference images..."
                    className={`flex-1 px-4 py-3 rounded-xl border outline-none transition ${
                      isDark
                        ? 'border-white/10 bg-white/5 text-white/80 focus:border-#dfec2d/40'
                        : 'border-slate-200 bg-slate-50 text-slate-700 focus:border-#dfec2d/40'
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleWebSearch();
                      }
                    }}
                  />
                  <Button
                    variant="primary"
                    onClick={handleWebSearch}
                    disabled={!searchQuery.trim() || isSearching}
                    className="!px-6 !py-3"
                  >
                    <SearchIcon className="h-4 w-4 mr-2" />
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {isSearching && (
                  <div className="mt-4 p-4 bg-lime-900/20 border border-#dfec2d/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-#dfec2d border-t-transparent rounded-full animate-spin"></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-lime-300">{searchProgress.message}</p>
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                          <div className="bg-#dfec2d h-2 rounded-full transition-all" style={{ width: `${searchProgress.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                {searchResults.length > 0 && (
                  <>
                    <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Search Results ({searchResults.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {searchResults.map((result, index) => {
                        const isSelected = selectedImages.has(result.url);
                        return (
                          <div
                            key={index}
                            className={`relative group rounded-lg overflow-hidden aspect-video bg-black/10 cursor-pointer border-2 transition-all ${
                              isSelected
                                ? 'border-#dfec2d ring-2 ring-#dfec2d/50 scale-95'
                                : 'border-transparent hover:border-white/20'
                            }`}
                            onClick={() => toggleImageSelection(result.url)}
                          >
                            <img src={result.url} alt={result.title} className="w-full h-full object-cover" />

                            {/* Selection indicator overlay */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-#dfec2d/30 flex items-center justify-center">
                                <div className="bg-#dfec2d rounded-full p-2">
                                  <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            )}

                            {/* Hover overlay with info */}
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity ${
                              isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                            }`}>
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="text-xs font-semibold text-white mb-1 line-clamp-2">{result.title}</p>
                                <p className="text-[10px] text-gray-300">{result.source}</p>
                                <p className="text-[10px] text-#dfec2d mt-1">Click to select</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {!isSearching && searchResults.length === 0 && searchQuery && (
                  <p className={`text-center py-12 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    No results found. Try a different search query.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Slideshow */}
      <AnimatePresence>
        {fullscreenView && activeBoard && activeBoard.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setFullscreenView(false)}
          >
            <button
              onClick={() => setFullscreenView(false)}
              className="absolute top-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
              aria-label="Close fullscreen"
            >
              <XIcon className="h-6 w-6" />
            </button>

            <div className="w-full h-full flex items-center justify-center p-8">
              <AnimatePresence mode="wait">
                {activeBoard.items.map((item, index) => {
                  if (index !== currentSlideIndex) return null;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      {item.type === 'video' ? (
                        <video
                          src={item.url}
                          className="max-w-full max-h-full object-contain"
                          autoPlay
                          muted
                          loop
                          style={{ aspectRatio: '16/9' }}
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={item.metadata?.title || 'Moodboard reference'}
                          className="max-w-full max-h-full object-contain"
                          style={{ aspectRatio: '16/9' }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Slide indicators */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
              {activeBoard.items.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlideIndex(index);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlideIndex
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodboardTab;
