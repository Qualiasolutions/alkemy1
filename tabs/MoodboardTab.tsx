import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MoodboardTemplate, MoodboardItem, MoodboardSection } from '../types';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeContext';
import { PlusIcon, UploadCloudIcon, Trash2Icon, SparklesIcon, ImageIcon, XIcon } from '../components/icons/Icons';
import { generateMoodboardDescription } from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_ITEMS = 20;

const createTemplate = (count: number): MoodboardTemplate => ({
  id: `moodboard-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  title: count === 0 ? 'Master Moodboard' : `Moodboard ${count + 1}`,
  description: count === 0 ? 'Primary visual language for the project.' : '',
  items: [],
  createdAt: new Date().toISOString(),
});

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
                    ? 'border-teal-500/40 bg-teal-500/10 text-teal-100 shadow-[0_12px_30px_rgba(15,118,110,0.35)]'
                    : isDark
                      ? 'border-white/5 bg-white/5 text-white/70 hover:border-white/15 hover:bg-white/10'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-teal-400/40 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-semibold">{board.title}</div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    board.items.length > 0
                      ? 'bg-emerald-500/15 text-emerald-300'
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
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 p-6">
              <div className="flex-1 space-y-3">
                <input
                  value={activeBoard.title}
                  onChange={(event) => updateBoard(activeBoard.id, board => ({ ...board, title: event.target.value }))}
                  className={`w-full text-2xl font-semibold outline-none transition ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-slate-900'}`}
                  placeholder="Moodboard title"
                />
                <textarea
                  value={activeBoard.description ?? ''}
                  onChange={(event) => updateBoard(activeBoard.id, board => ({ ...board, description: event.target.value }))}
                  className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white/80 focus:border-teal-400/40'
                      : 'border-slate-200 bg-slate-50 text-slate-700 focus:border-teal-400/40'
                  }`}
                  rows={3}
                  placeholder="Describe the emotion, lighting, composition, or references you're targeting."
                />
              </div>
              <div className={`flex w-full max-w-[260px] flex-col gap-2 rounded-2xl border p-4 text-xs ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white/70'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}>
                <div className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <SparklesIcon className="h-4 w-4" />
                  AI Summary
                </div>
                {activeBoard.aiSummary ? (
                  <p className={`leading-relaxed ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{activeBoard.aiSummary}</p>
                ) : (
                  <p className={`leading-relaxed ${isDark ? 'text-white/60' : 'text-slate-500'}`}>Generate a quick synopsis to align collaborators on tone.</p>
                )}
                <Button
                  variant="secondary"
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary || activeBoard.items.length === 0}
                  className="!mt-2 !py-2 text-xs"
                >
                  {isGeneratingSummary ? 'Summarizing…' : 'Generate AI Summary'}
                </Button>
              </div>
            </header>

            <div
              className={`relative m-6 flex-1 overflow-y-auto rounded-3xl border-2 border-dashed transition ${
                dragActive
                  ? 'border-teal-400 bg-teal-500/10'
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
              <div className="flex h-full flex-col">
                {activeBoard.items.length === 0 ? (
                  <label
                    htmlFor="moodboard-file-input"
                    className={`flex h-full flex-col items-center justify-center gap-3 text-center text-sm cursor-pointer ${
                      isDark ? 'text-white/60' : 'text-slate-500'
                    }`}
                  >
                    <UploadCloudIcon className="h-10 w-10" />
                    <p className={`text-base font-medium ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Drop images or click to upload</p>
                    <p className="text-xs opacity-70">High-quality stills, lighting references, frames, palette swatches. Up to {MAX_ITEMS} items.</p>
                  </label>
                ) : (
                  <div className="grid w-full grid-cols-2 gap-4 p-4 md:grid-cols-3 xl:grid-cols-4">
                    {activeBoard.items.map((item, index) => (
                      <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 aspect-video cursor-pointer" onClick={() => handleOpenFullscreen(index)}>
                        {item.type === 'video' ? (
                          <video src={item.url} className="w-full h-full object-cover" autoPlay muted loop />
                        ) : (
                          <img src={item.url} alt={item.metadata?.title || 'Moodboard reference'} className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateBoard(activeBoard.id, board => ({ ...board, items: board.items.filter(i => i.id !== item.id) }));
                          }}
                          className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 opacity-0 transition group-hover:opacity-100"
                          aria-label="Remove reference"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {activeBoard.items.length < MAX_ITEMS && (
                      <label htmlFor="moodboard-file-input" className={`flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed text-xs transition ${
                        isDark
                          ? 'border-white/20 text-white/60 hover:border-teal-400/40 hover:text-teal-200'
                          : 'border-slate-300 text-slate-500 hover:border-teal-400 hover:text-teal-600'
                      }`}>
                        <UploadCloudIcon className="h-6 w-6" />
                        Add more references
                      </label>
                    )}
                  </div>
                )}
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
