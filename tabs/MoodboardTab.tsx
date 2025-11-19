import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { MoodboardTemplate, MoodboardItem, MoodboardSection } from '../types';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeContext';
import { PlusIcon, UploadCloudIcon, Trash2Icon, SparklesIcon, ImageIcon, XIcon, SearchIcon, DownloadIcon, RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon, ExpandIcon, CheckCircleIcon } from '../components/icons/Icons';
import { generateMoodboardDescription } from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import { searchImages, SearchedImage } from '../services/imageSearchService';
import ImageCarousel from '../components/ImageCarousel';
import { fetchImageWithCORS } from '../utils/corsImageFetcher';
import FullScreenWorkspace from '../components/FullScreenWorkspace';
import CompactMoodboardHeader from '../components/CompactMoodboardHeader';

const MAX_ITEMS = 20;
const AUTO_GENERATE_THRESHOLD = 10;

const createTemplate = (count: number): MoodboardTemplate => ({
  id: `moodboard-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  title: count === 0 ? 'Master Moodboard' : `Moodboard ${count + 1}`,
  description: '',
  items: [],
  createdAt: new Date().toISOString(),
  autoGenerationTriggered: false,
});

// Format AI output to remove ** markdown and apply custom formatting
const formatAIOutput = (text: string, isDark: boolean): React.ReactNode[] => {
  if (!text) return [];

  return text.split('\n\n').filter(p => p.trim()).map((paragraph, i) => {
    // Remove ** markdown syntax
    let cleaned = paragraph.replace(/\*\*/g, '');

    // Check if it's a heading (starts with # or all caps short line)
    const isHeading = cleaned.startsWith('#') || (cleaned.length < 50 && cleaned === cleaned.toUpperCase());
    cleaned = cleaned.replace(/^#+\s*/, ''); // Remove # symbols

    if (isHeading) {
      return (
        <h5 key={i} className={`text-base font-bold mb-2 ${
          isDark ? 'text-teal-400' : 'text-teal-600'
        }`}>
          {cleaned}
        </h5>
      );
    }

    // Check if it's a list item
    if (cleaned.match(/^[-•]\s/)) {
      return (
        <li key={i} className={`text-sm leading-relaxed ml-4 ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {cleaned.replace(/^[-•]\s*/, '')}
        </li>
      );
    }

    return (
      <p key={i} className={`text-sm leading-relaxed ${
        isDark ? 'text-gray-300' : 'text-gray-600'
      }`}>
        {cleaned}
      </p>
    );
  });
};

// Compact AI Output Panel Component
interface AIOutputPanelProps {
  summary: string | undefined;
  isGenerating: boolean;
  isDark: boolean;
}

const AIOutputPanel: React.FC<AIOutputPanelProps> = ({ summary, isGenerating, isDark }) => {
  return (
    <div className={`rounded-xl overflow-hidden sticky top-4 border backdrop-blur-sm ${
      isDark
        ? 'bg-gray-900/50 border-gray-800'
        : 'bg-white/70 border-gray-200'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <SparklesIcon className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''} ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`} />
        <h4 className={`text-sm font-medium ${
          isDark ? 'text-gray-200' : 'text-gray-700'
        }`}>AI Analysis</h4>
      </div>

      {/* Content */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {isGenerating ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 rounded animate-pulse ${
                  isDark ? 'bg-gray-800' : 'bg-gray-200'
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : summary ? (
          <div className={`text-sm leading-relaxed space-y-2 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {summary.split('\n').filter(p => p.trim()).map((paragraph, i) => (
              <p key={i}>{paragraph.replace(/\*\*/g, '')}</p>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <SparklesIcon className={`w-8 h-8 mx-auto mb-2 opacity-30`} />
            <p className="text-xs">Add {AUTO_GENERATE_THRESHOLD}+ images for AI analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

type MoodboardTabProps = {
  moodboardTemplates: MoodboardTemplate[];
  onUpdateMoodboardTemplates: (updater: React.SetStateAction<MoodboardTemplate[]>) => void;
};

const MoodboardTab: React.FC<MoodboardTabProps> = ({ moodboardTemplates, onUpdateMoodboardTemplates }) => {
  const { isDark, colors } = useTheme();

  // State
  const [activeId, setActiveId] = useState<string | null>(
    moodboardTemplates.length > 0 ? moodboardTemplates[0].id : null
  );
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fullscreenView, setFullscreenView] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);

  // Web search state
  const [showWebSearch, setShowWebSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState({ message: '', progress: 0 });
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isAddingBulkImages, setIsAddingBulkImages] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  const activeMoodboard = useMemo(
    () => moodboardTemplates.find(m => m.id === activeId),
    [moodboardTemplates, activeId]
  );

  // Auto-select first moodboard if none selected
  useEffect(() => {
    if (!activeId && moodboardTemplates.length > 0) {
      setActiveId(moodboardTemplates[0].id);
    }
  }, [activeId, moodboardTemplates]);

  // Auto-generation trigger at 10 images
  useEffect(() => {
    if (!activeMoodboard) return;

    const shouldAutoGenerate =
      activeMoodboard.items.length >= AUTO_GENERATE_THRESHOLD &&
      !activeMoodboard.autoGenerationTriggered &&
      !isGeneratingSummary;

    if (shouldAutoGenerate) {
      console.log('[MoodboardTab] Auto-generating AI summary at', activeMoodboard.items.length, 'images');
      handleGenerateSummary(true); // true = auto-generation
    }
  }, [activeMoodboard?.items.length, activeMoodboard?.id]);

  // Update title
  const handleTitleChange = useCallback((newTitle: string) => {
    if (!activeId) return;
    onUpdateMoodboardTemplates(templates =>
      templates.map(t => t.id === activeId ? { ...t, title: newTitle, updatedAt: new Date().toISOString() } : t)
    );
  }, [activeId, onUpdateMoodboardTemplates]);

  // Update description
  const handleDescriptionChange = useCallback((newDescription: string) => {
    if (!activeId) return;
    onUpdateMoodboardTemplates(templates =>
      templates.map(t => t.id === activeId ? { ...t, description: newDescription, updatedAt: new Date().toISOString() } : t)
    );
  }, [activeId, onUpdateMoodboardTemplates]);

  // Add new moodboard
  const handleAddTemplate = useCallback(() => {
    console.log('[MoodboardTab] handleAddTemplate called, current templates:', moodboardTemplates.length);
    const newTemplate = createTemplate(moodboardTemplates.length);
    console.log('[MoodboardTab] Created new template:', newTemplate);
    onUpdateMoodboardTemplates(prev => {
      const updated = [...prev, newTemplate];
      console.log('[MoodboardTab] Updated templates:', updated);
      return updated;
    });
    setActiveId(newTemplate.id);
    console.log('[MoodboardTab] Set active ID to:', newTemplate.id);
  }, [moodboardTemplates.length, onUpdateMoodboardTemplates]);

  // Delete moodboard
  const handleDeleteTemplate = useCallback((id: string) => {
    if (moodboardTemplates.length === 1) {
      alert('Cannot delete the last moodboard. At least one must remain.');
      return;
    }

    if (confirm('Are you sure you want to delete this moodboard?')) {
      onUpdateMoodboardTemplates(prev => prev.filter(t => t.id !== id));
      if (activeId === id) {
        setActiveId(moodboardTemplates.find(t => t.id !== id)?.id || null);
      }
    }
  }, [moodboardTemplates, activeId, onUpdateMoodboardTemplates]);

  // Set cover image
  const handleSetCoverImage = useCallback((imageId: string) => {
    if (!activeId) return;
    onUpdateMoodboardTemplates(templates =>
      templates.map(t =>
        t.id === activeId
          ? { ...t, coverImageId: imageId, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }, [activeId, onUpdateMoodboardTemplates]);

  // Upload images
  const handleUpload = useCallback((files: FileList | File[]) => {
    if (!activeMoodboard || activeMoodboard.items.length >= MAX_ITEMS) return;

    const fileArray = Array.from(files);
    const remainingSlots = MAX_ITEMS - activeMoodboard.items.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);

    filesToUpload.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const newItem: MoodboardItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          url,
          type: file.type.startsWith('video') ? 'video' : 'image',
          metadata: {
            title: file.name,
            source: 'upload'
          }
        };

        onUpdateMoodboardTemplates(templates =>
          templates.map(t =>
            t.id === activeId
              ? {
                  ...t,
                  items: [...t.items, newItem],
                  updatedAt: new Date().toISOString(),
                  // Set as cover if it's the first image
                  coverImageId: t.items.length === 0 ? newItem.id : t.coverImageId
                }
              : t
          )
        );
      };
      reader.readAsDataURL(file);
    });
  }, [activeMoodboard, activeId, onUpdateMoodboardTemplates]);

  // Delete image
  const handleDeleteItem = useCallback((itemId: string) => {
    if (!activeId) return;
    onUpdateMoodboardTemplates(templates =>
      templates.map(t => {
        if (t.id !== activeId) return t;

        const updatedItems = t.items.filter(item => item.id !== itemId);
        const updatedCoverId = t.coverImageId === itemId
          ? (updatedItems[0]?.id || undefined)
          : t.coverImageId;

        // Reset auto-generation flag if items drop below threshold
        const resetAutoGen = updatedItems.length < AUTO_GENERATE_THRESHOLD;

        return {
          ...t,
          items: updatedItems,
          coverImageId: updatedCoverId,
          updatedAt: new Date().toISOString(),
          ...(resetAutoGen && { autoGenerationTriggered: false })
        };
      })
    );
  }, [activeId, onUpdateMoodboardTemplates]);

  // Generate AI summary
  const handleGenerateSummary = useCallback(async (isAutoGeneration = false) => {
    if (!activeMoodboard || activeMoodboard.items.length === 0) return;

    setIsGeneratingSummary(true);

    try {
      const section: MoodboardSection = {
        notes: activeMoodboard.description || '',
        items: activeMoodboard.items,
      };

      const summary = await generateMoodboardDescription(section);

      onUpdateMoodboardTemplates(templates =>
        templates.map(t =>
          t.id === activeId
            ? {
                ...t,
                aiSummary: summary,
                lastAutoGeneratedAt: new Date().toISOString(),
                autoGenerationTriggered: isAutoGeneration ? true : t.autoGenerationTriggered,
                updatedAt: new Date().toISOString()
              }
            : t
        )
      );

      console.log(`[MoodboardTab] AI summary ${isAutoGeneration ? 'auto-' : ''}generated successfully`);
    } catch (error) {
      console.error('[MoodboardTab] Error generating AI summary:', error);
      alert('Failed to generate AI summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [activeMoodboard, activeId, onUpdateMoodboardTemplates]);

  // Web search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setSelectedImages(new Set());

    try {
      const results = await searchImages(searchQuery, (progress) => {
        setSearchProgress(progress);
      });
      setSearchResults(results);
    } catch (error) {
      console.error('[MoodboardTab] Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleAddBulkImages = useCallback(async () => {
    if (!activeMoodboard || selectedImages.size === 0) return;

    setIsAddingBulkImages(true);
    const selectedUrls = Array.from(selectedImages);
    const remainingSlots = MAX_ITEMS - activeMoodboard.items.length;
    const urlsToAdd = selectedUrls.slice(0, remainingSlots);

    try {
      const newItems: MoodboardItem[] = [];

      for (const url of urlsToAdd) {
        try {
          const dataUrl = await fetchImageWithCORS(url);
          const resultData = searchResults.find(r => r.url === url);

          newItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            url: dataUrl,
            type: 'image',
            metadata: {
              source: resultData?.source || 'Web Search',
              title: resultData?.title,
              description: resultData?.description
            }
          });
        } catch (err) {
          console.warn('[MoodboardTab] Failed to fetch image:', url, err);
        }
      }

      if (newItems.length > 0) {
        onUpdateMoodboardTemplates(templates =>
          templates.map(t =>
            t.id === activeId
              ? {
                  ...t,
                  items: [...t.items, ...newItems],
                  updatedAt: new Date().toISOString(),
                  coverImageId: t.items.length === 0 ? newItems[0].id : t.coverImageId
                }
              : t
          )
        );
      }

      setShowWebSearch(false);
      setSelectedImages(new Set());
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('[MoodboardTab] Error adding bulk images:', error);
      alert('Failed to add some images. Please try again.');
    } finally {
      setIsAddingBulkImages(false);
    }
  }, [activeMoodboard, selectedImages, searchResults, activeId, onUpdateMoodboardTemplates]);

  // Drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
  }, [handleUpload]);

  // Get cover image URL
  const getCoverImageUrl = useCallback((template: MoodboardTemplate): string | null => {
    if (template.items.length === 0) return null;

    if (template.coverImageId) {
      const coverImage = template.items.find(item => item.id === template.coverImageId);
      if (coverImage) return coverImage.url;
    }

    // Fallback to first image
    return template.items[0]?.url || null;
  }, []);

  // Check if regenerate should be enabled
  const canRegenerate = useMemo(() => {
    if (!activeMoodboard) return false;
    if (!activeMoodboard.aiSummary) return false; // No initial generation yet
    if (activeMoodboard.items.length < AUTO_GENERATE_THRESHOLD) return false;

    // Check if new images added since last generation
    if (activeMoodboard.lastAutoGeneratedAt) {
      const hasNewItems = activeMoodboard.items.some(item => {
        // This is a simplification; in production, you'd track item timestamps
        return true; // Enable if any items exist
      });
      return hasNewItems;
    }

    return true;
  }, [activeMoodboard]);

  // If no moodboards exist, show empty state with option to create first one
  if (moodboardTemplates.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md mx-auto">
          <ImageIcon className={`w-20 h-20 mx-auto mb-6 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Create Your First Moodboard
          </h3>
          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Start building visual references for your project. Upload images, search the web, and let AI analyze your visual language.
          </p>
          <div className="flex justify-center">
            <Button
              variant="primary"
              onClick={() => {
                console.log('[MoodboardTab] Creating first moodboard...');
                handleAddTemplate();
              }}
              className="!px-6 !py-3"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Moodboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Compact Moodboard Header */}
      <CompactMoodboardHeader
        moodboardTemplates={moodboardTemplates}
        activeId={activeId}
        onSetActiveId={setActiveId}
        onAddTemplate={handleAddTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        getCoverImageUrl={getCoverImageUrl}
        onWebSearch={() => setShowWebSearch(true)}
        onRegenerateAI={() => handleGenerateSummary(false)}
        canRegenerate={canRegenerate}
        isGeneratingSummary={isGeneratingSummary}
      />

      {/* Detail View */}
      {activeMoodboard ? (
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            {/* Left: Main Content */}
            <div className="space-y-4">
              {/* Title */}
              <input
                type="text"
                value={activeMoodboard.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={`w-full text-xl font-bold bg-transparent border-b transition-colors px-0 focus:outline-none ${
                  isDark
                    ? 'border-gray-700 text-white focus:border-teal-400'
                    : 'border-gray-300 text-gray-900 focus:border-teal-600'
                }`}
                placeholder="Moodboard Title"
              />

              {/* Description */}
              <textarea
                value={activeMoodboard.description || ''}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border transition-all resize-none text-sm focus:outline-none ${
                  isDark
                    ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-teal-400'
                    : 'bg-white border-gray-300 text-gray-700 focus:border-teal-600'
                }`}
                placeholder="Add notes about this moodboard..."
                rows={2}
              />

              {/* Image Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-medium ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Images ({activeMoodboard.items.length}/{MAX_ITEMS})
                  </h3>
                </div>

                {activeMoodboard.items.length === 0 ? (
                  <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? `${isDark ? 'border-teal-400 bg-teal-400/5' : 'border-teal-600 bg-teal-600/5'}`
                        : `${isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-300 hover:border-gray-400'}`
                    }`}
                  >
                    <UploadCloudIcon className={`w-12 h-12 mx-auto mb-3 ${
                      dragActive
                        ? (isDark ? 'text-teal-400' : 'text-teal-600')
                        : (isDark ? 'text-gray-600' : 'text-gray-400')
                    }`} />
                    <h4 className={`text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Drop images here
                    </h4>
                    <p className={`text-xs mb-3 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      or click to browse
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      className="!text-xs"
                    >
                      Choose Files
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={(e) => e.target.files && handleUpload(e.target.files)}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 ${
                      dragActive ? (isDark ? 'ring-2 ring-teal-400' : 'ring-2 ring-teal-600') : ''
                    }`}
                  >
                    {activeMoodboard.items.map((item) => {
                      const isCover = item.id === activeMoodboard.coverImageId;

                      return (
                        <div
                          key={item.id}
                          className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                          onClick={() => handleSetCoverImage(item.id)}
                        >
                          <img
                            src={item.url}
                            alt={item.metadata?.title || 'Moodboard item'}
                            className="w-full h-full object-cover"
                          />

                          {/* Cover badge */}
                          {isCover && (
                            <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              isDark ? 'bg-teal-400 text-black' : 'bg-teal-600 text-white'
                            }`}>
                              Cover
                            </div>
                          )}

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item.id);
                            }}
                            className="absolute top-1 right-1 p-1 rounded bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2Icon className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Add more button */}
                    {activeMoodboard.items.length < MAX_ITEMS && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`aspect-square rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
                          isDark
                            ? 'border-gray-700 hover:border-gray-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-center">
                          <PlusIcon className={`w-6 h-6 mx-auto ${
                            isDark ? 'text-gray-600' : 'text-gray-400'
                          }`} />
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Compact AI Panel */}
            <div>
              <AIOutputPanel
                summary={activeMoodboard.aiSummary}
                isGenerating={isGeneratingSummary}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ImageIcon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Select a moodboard to view details
            </p>
          </div>
        </div>
      )}

      {/* Web Search Modal */}
      <AnimatePresence>
        {showWebSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowWebSearch(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative max-w-6xl w-full max-h-[90vh] overflow-auto rounded-3xl backdrop-blur-sm border ${
                isDark
                  ? 'bg-gray-900/95 border-gray-800'
                  : 'bg-white/95 border-gray-200'
              } shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
                isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Web Image Search
                  </h3>
                  <button
                    onClick={() => setShowWebSearch(false)}
                    className={`p-2 rounded-lg ${
                      isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for reference images..."
                    className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white focus:ring-teal-400/50'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-teal-600/50'
                    }`}
                  />
                  <Button
                    variant="primary"
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    <SearchIcon className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>

                {isSearching && (
                  <div className="mt-4">
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <RefreshCwIcon className="w-4 h-4 animate-spin" />
                      <span>{searchProgress.message}</span>
                    </div>
                    <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${
                            isDark ? 'bg-teal-400' : 'bg-teal-600'
                          }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${searchProgress.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Results */}
              <div className="p-6">
                {searchResults.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {searchResults.map((result) => {
                        const isSelected = selectedImages.has(result.url);

                        return (
                          <motion.div
                            key={result.url}
                            whileHover={{ scale: 1.05 }}
                            className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer ${
                              isSelected
                                ? (isDark ? 'ring-4 ring-teal-400' : 'ring-4 ring-teal-600')
                                : (isDark ? 'ring-1 ring-gray-700' : 'ring-1 ring-gray-300')
                            }`}
                            onClick={() => {
                              const newSelected = new Set(selectedImages);
                              if (isSelected) {
                                newSelected.delete(result.url);
                              } else {
                                newSelected.add(result.url);
                              }
                              setSelectedImages(newSelected);
                            }}
                          >
                            <img
                              src={result.thumbnailUrl || result.url}
                              alt={result.title}
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className={`absolute inset-0 flex items-center justify-center ${
                                  isDark ? 'bg-teal-400/20' : 'bg-teal-600/20'
                                }`}>
                                <CheckCircleIcon className={`w-8 h-8 ${
                                    isDark ? 'text-teal-400' : 'text-teal-600'
                                  }`} />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                              <p className="text-xs text-white truncate">{result.title}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {selectedImages.size > 0 && (
                      <div className="sticky bottom-0 mt-6 pt-4 border-t border-gray-800">
                        <Button
                          variant="primary"
                          onClick={handleAddBulkImages}
                          disabled={isAddingBulkImages}
                          className="w-full"
                        >
                          {isAddingBulkImages ? (
                            <>
                              <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                              Adding {selectedImages.size} images...
                            </>
                          ) : (
                            <>
                              <DownloadIcon className="w-4 h-4 mr-2" />
                              Add {selectedImages.size} selected image{selectedImages.size > 1 ? 's' : ''}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                ) : !isSearching && (
                  <div className="text-center py-12">
                    <SearchIcon className={`w-16 h-16 mx-auto mb-4 ${
                      isDark ? 'text-gray-700' : 'text-gray-300'
                    }`} />
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Search for reference images to add to your moodboard
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => e.target.files && handleUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );
};

export default MoodboardTab;
