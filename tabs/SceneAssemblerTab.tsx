
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScriptAnalysis, AnalyzedScene, Frame, Generation, AnalyzedCharacter, AnalyzedLocation, Moodboard, FrameStatus } from '../types';
import Button from '../components/Button';
import { generateStillVariants, refineVariant, upscaleImage, animateFrame, upscaleVideo, analyzeVideoWithGemini } from '../services/aiService';
import { generateVideoFromImageWan } from '../services/wanService';
import { generateVideoWithKling, refineVideoWithWAN } from '../services/videoFalService';
import { ArrowLeftIcon, FilmIcon, PlusIcon, AlkemyLoadingIcon, Trash2Icon, XIcon, ImagePlusIcon, FourKIcon, PlayIcon, PaperclipIcon, ArrowRightIcon, SendIcon, CheckIcon, ExpandIcon, ChevronDownIcon, DownloadIcon, SparklesIcon } from '../components/icons/Icons';
import ImageCarousel from '../components/ImageCarousel';
import MiniDirectorWidget from '../components/MiniDirectorWidget';
import GenerationContextPanel from '../components/GenerationContextPanel';
import { loadGenerationContext, type CharacterWithIdentity } from '../services/generationContext';
import { GlowCard } from '@/components/ui/spotlight-card';

type Workspace = 'grid' | 'still-studio' | 'refine-studio' | 'animate-studio' | 'image-upscale-studio' | 'video-upscale-studio';

const aspectRatioClasses: { [key: string]: string } = {
    '1:1': 'aspect-square', '16:9': 'aspect-video', '9:16': 'aspect-[9/16]',
    '4:3': 'aspect-[4/3]', '3:4': 'aspect-[3/4]',
};

// --- FullScreen Video Player Modal ---
const FullScreenVideoPlayer: React.FC<{
    url: string;
    onClose: () => void;
    onSelect: () => void;
}> = ({ url, onClose, onSelect }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    
    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            {/* Fixed Header with Controls */}
            <div className="fixed top-0 left-0 right-0 z-60 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                <button
                    onClick={onClose}
                    className="text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors backdrop-blur-sm"
                    aria-label="Close viewer"
                >
                    <XIcon className="w-6 h-6" />
                </button>
                <Button
                    onClick={onSelect}
                    variant="primary"
                    className="shadow-lg"
                >
                    Select Video
                </Button>
            </div>

            {/* Video Container */}
            <div className="flex-1 flex items-center justify-center p-4">
                <video src={url} controls autoPlay loop className="max-w-full max-h-full rounded-lg" />
            </div>
        </div>
    );
};

// FullScreenImagePlayer component removed - clicking on images now directly opens RefinementStudio


// --- Shared Loading Component ---
const LoadingSkeleton: React.FC<{ aspectRatio: string; progress: number }> = ({ aspectRatio, progress }) => (
    <div className={`relative w-full h-full bg-black/20 flex flex-col items-center justify-center rounded-lg ${aspectRatioClasses[aspectRatio] || 'aspect-square'}`}>
        <div className="absolute inset-0 bg-gray-800/50 animate-pulse"></div>
        <div className="relative z-10 text-center text-white w-full max-w-[80%]">
            <AlkemyLoadingIcon className="w-12 h-12 mx-auto mb-3 animate-subtle-pulse" />
            <p className="font-semibold text-sm mb-2">Generating...</p>
            <div className="w-full bg-gray-600 rounded-full h-1.5">
                <div className="bg-[var(--color-accent-primary)] h-1.5 rounded-full" style={{width: `${progress}%`}}></div>
            </div>
            <p className="font-mono text-xs mt-1">{Math.round(progress)}%</p>
        </div>
    </div>
);


// --- Refinement Studio (for Shots) - Clean Design from Cast Locations ---
const RefinementStudio: React.FC<{
    baseGeneration: Generation;
    onClose: () => void;
    onUpdateFrame: (updater: (prev: Frame) => Frame) => void;
    currentProject?: any;
    user?: any;
    scene?: AnalyzedScene;
    frame?: Frame;
}> = ({ baseGeneration, onClose, onUpdateFrame, currentProject, user, scene, frame }) => {
    const [prompt, setPrompt] = useState('');
    const [currentImage, setCurrentImage] = useState(baseGeneration.url);
    const [isGenerating, setIsGenerating] = useState(false);
    const [refinementHistory, setRefinementHistory] = useState<Array<{id: string, url: string, prompt: string, timestamp: Date}>>([
        { id: 'initial', url: baseGeneration.url!, prompt: 'Initial Image', timestamp: new Date() }
    ]);

    const handleRefine = async () => {
        if (!prompt.trim() || !currentImage) return;

        setIsGenerating(true);
        try {
            const refinedImageUrl = await refineVariant(
                prompt,
                currentImage,
                baseGeneration.aspectRatio,
                {
                    projectId: currentProject?.id,
                    userId: user?.id,
                    sceneId: scene?.id,
                    frameId: frame?.id
                }
            );

            if (refinedImageUrl) {
                const newRefinement = {
                    id: `refine-${Date.now()}`,
                    url: refinedImageUrl,
                    prompt: prompt,
                    timestamp: new Date()
                };

                setRefinementHistory(prev => [...prev, newRefinement]);
                setCurrentImage(refinedImageUrl);
                onUpdateFrame(prevFrame => ({
                    ...prevFrame,
                    generations: [...(prevFrame.generations || []), {
                        id: `gen-${Date.now()}`,
                        url: refinedImageUrl,
                        aspectRatio: baseGeneration.aspectRatio,
                        isLoading: false
                    }],
                    refinedGenerationUrls: [...(prevFrame.refinedGenerationUrls || []), refinedImageUrl]
                }));
            } else {
                throw new Error('No refined image returned from AI service');
            }
        } catch (error) {
            console.error('Refinement failed:', error);
            alert('Refinement failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsGenerating(false);
            setPrompt('');
        }
    };

    const handleSetMainAndClose = () => {
        if (currentImage) {
            onUpdateFrame(prev => ({
                ...prev,
                media: { ...prev.media, start_frame_url: currentImage },
                status: FrameStatus.GeneratedStill
            }));
            onClose();
        }
    };

    const handleSelectVersion = (version: typeof refinementHistory[0]) => {
        setCurrentImage(version.url);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2">
            <div className="w-full h-full bg-[#0a0a0a] text-white flex overflow-hidden rounded-xl">
                {/* Left Sidebar */}
                <div className="w-72 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl border-r border-white/10 flex flex-col p-6 relative z-10">
                    <div className="flex-1 flex flex-col space-y-4">
                        <div>
                            <h2 className="text-lg font-bold text-white mb-2">Refine Studio</h2>
                            <p className="text-xs text-white/60">Scene {scene?.sceneNumber} • Shot {frame?.shot_number} • {baseGeneration.aspectRatio}</p>
                        </div>

                        {/* Prompt Input */}
                        <div className="space-y-3">
                            <label className="text-xs text-white/60 uppercase tracking-widest font-medium">Refinement Prompt</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe what you want to change..."
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#dfec2d] focus:border-transparent focus:bg-white/10 transition-all resize-none"
                                disabled={isGenerating}
                            />

                            <button
                                onClick={handleRefine}
                                disabled={!prompt.trim() || isGenerating}
                                className="w-full py-3 bg-[#dfec2d] hover:bg-[#b3e617] disabled:bg-white/10 disabled:text-white/50 text-black font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#dfec2d]/50 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                        Refining...
                                    </>
                                ) : (
                                    <>
                                        Apply Refinement
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Refinement History */}
                        {refinementHistory.length > 1 && (
                            <div className="mt-6">
                                <h3 className="text-xs text-white/60 uppercase tracking-widest font-medium mb-3">Refinement History</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {refinementHistory.slice().reverse().map((version, index) => (
                                        <button
                                            key={version.id}
                                            onClick={() => handleSelectVersion(version)}
                                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                                                currentImage === version.url
                                                    ? 'bg-[#dfec2d]/20 border-[#dfec2d]/50 text-white'
                                                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                    currentImage === version.url ? 'bg-[#dfec2d]' : 'bg-white/40'
                                                }`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {version.prompt}
                                                    </p>
                                                    <p className="text-xs text-white/50">
                                                        {index === 0 ? 'Just now' : `${index} version${index > 1 ? 's' : ''} ago`}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-white/10">
                            <p className="text-xs text-white/40">
                                {refinementHistory.length} version{refinementHistory.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Image Area */}
                <div className="flex-1 relative overflow-hidden bg-[#0a0a0a]">
                    {/* Loading State */}
                    {isGenerating && (
                        <div className="absolute inset-0 bg-black/70 z-10 flex items-center justify-center">
                            <div className="flex flex-col items-center text-center">
                                <AlkemyLoadingIcon className="w-16 h-16 text-[#dfec2d] mb-4 animate-spin" />
                                <h3 className="text-xl font-semibold text-white mb-2">Refining image...</h3>
                                <p className="text-white/60">Applying: "{prompt}"</p>
                            </div>
                        </div>
                    )}

                    {/* Image Container - Full Height */}
                    {currentImage && (
                        <img
                            src={currentImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-6 left-6 p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all z-20"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleSetMainAndClose}
                        className="absolute top-6 right-6 bg-[#dfec2d]/90 hover:bg-[#dfec2d] text-black font-semibold px-6 py-3 rounded-lg transition-all flex items-center gap-2 shadow-lg backdrop-blur-sm z-20"
                    >
                        <CheckIcon className="w-5 h-5" />
                        Save
                    </button>

                    {/* Image info overlay */}
                    <div className="absolute bottom-6 left-6 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
                        <p className="text-white text-sm">
                            Current version • {refinementHistory.findIndex(v => v.url === currentImage) + 1} of {refinementHistory.length}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const useDropdownDirection = (
    isOpen: boolean,
    containerRef: React.RefObject<HTMLElement>,
    dependencies: unknown[] = []
) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [direction, setDirection] = useState<'up' | 'down'>('down');

    useEffect(() => {
        if (!isOpen) {
            // Reset to down when closed, but don't trigger re-render if already down
            setDirection(prev => prev === 'down' ? prev : 'down');
            return;
        }

        const trigger = containerRef.current;
        const menu = menuRef.current;
        if (!trigger || !menu) return;

        let frame: number | null = null;

        const measureDirection = () => {
            frame = null;
            const triggerRect = trigger.getBoundingClientRect();
            const menuHeight = menu.offsetHeight;
            const spaceBelow = window.innerHeight - triggerRect.bottom;
            const spaceAbove = triggerRect.top;
            const nextDirection = spaceBelow < menuHeight && spaceAbove > spaceBelow ? 'up' : 'down';
            setDirection(prev => (prev === nextDirection ? prev : nextDirection));
        };

        const scheduleMeasure = () => {
            if (frame !== null) return;
            frame = requestAnimationFrame(measureDirection);
        };

        // Immediate synchronous measurement on open to prevent flicker
        measureDirection();

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => scheduleMeasure())
            : null;

        resizeObserver?.observe(menu);
        resizeObserver?.observe(trigger);

        window.addEventListener('resize', scheduleMeasure, { passive: true });
        window.addEventListener('scroll', scheduleMeasure, { passive: true, capture: true });

        return () => {
            if (frame !== null) {
                cancelAnimationFrame(frame);
            }
            window.removeEventListener('resize', scheduleMeasure);
            window.removeEventListener('scroll', scheduleMeasure, true);
            resizeObserver?.disconnect();
        };
    }, [isOpen, containerRef, ...dependencies]);

    return { menuRef, direction };
};


// --- Custom Multi-Select Dropdown ---
const CharacterMultiSelect: React.FC<{
    characters: AnalyzedCharacter[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}> = ({ characters, selectedIds, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { menuRef, direction } = useDropdownDirection(isOpen, dropdownRef, [characters.length]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleCharacter = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(cid => cid !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const selectedCount = selectedIds.length;
    const displayText = selectedCount === 0
        ? 'Characters'
        : selectedCount === 1
            ? characters.find(c => c.id === selectedIds[0])?.name || 'Character'
            : `${selectedCount} selected`;

    const verticalOffset = direction === 'down' ? -10 : 10;

    return (
        <div ref={dropdownRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 hover:from-gray-700 hover:to-gray-800 text-white text-xs rounded-xl font-semibold px-4 py-2.5 focus:outline-none cursor-pointer max-w-[160px] border border-gray-600/50 hover:border-gray-500/70 transition-all shadow-lg backdrop-blur-sm flex items-center justify-between gap-2 min-w-[120px]"
            >
                <span className="truncate">{displayText}</span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                >
                    <ChevronDownIcon className="w-4 h-4" />
                </motion.span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key={direction}
                        ref={menuRef}
                        initial={{ opacity: 0, y: verticalOffset }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: verticalOffset }}
                        transition={{ duration: 0.2 }}
                        className={`absolute ${direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 w-56 bg-[var(--color-surface-elevated)] border border-[var(--color-border-color)] rounded-xl shadow-xl backdrop-blur-xl z-50 overflow-hidden`}
                    >
                        <div className="max-h-64 overflow-y-auto p-2">
                            {characters.length === 0 ? (
                                <div className="px-3 py-2 text-xs text-[var(--color-text-secondary)] text-center">
                                    No characters available
                                </div>
                            ) :
                                characters.map(char => {
                                    const hasIdentity = char.identity?.status === 'ready';
                                    return (
                                        <label
                                            key={char.id}
                                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[var(--color-hover-background)] cursor-pointer transition-colors group"
                                        >
                                            <div className="relative flex-shrink-0">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(char.id)}
                                                    onChange={() => toggleCharacter(char.id)}
                                                    className="w-4 h-4 rounded border-2 border-[var(--color-border-color)] bg-transparent checked:bg-[#dfec2d] checked:border-[#dfec2d] cursor-pointer appearance-none transition-colors"
                                                />
                                                {selectedIds.includes(char.id) && (
                                                    <CheckIcon className="w-3 h-3 text-white absolute top-0.5 left-0.5 pointer-events-none" />
                                                )}
                                            </div>
                                            {char.imageUrl && (
                                                <img
                                                    src={char.imageUrl}
                                                    alt={char.name}
                                                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                                />
                                            )}
                                            <span className="text-sm text-[var(--color-text-primary)] truncate flex-1">
                                                {char.name}
                                            </span>
                                            {hasIdentity && (
                                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#dfec2d]/20 text-[#dfec2d] border border-[#dfec2d]/30 flex-shrink-0">
                                                    ID
                                                </span>
                                            )}
                                        </label>
                                    );
                                })
                            }
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Custom Location Dropdown ---
const LocationSelect: React.FC<{
    locations: AnalyzedLocation[];
    selectedId: string;
    onChange: (id: string) => void;
}> = ({ locations, selectedId, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { menuRef, direction } = useDropdownDirection(isOpen, dropdownRef, [locations.length]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLocation = locations.find(l => l.id === selectedId);
    const displayText = selectedLocation?.name || 'Location';
    const verticalOffset = direction === 'down' ? -10 : 10;

    return (
        <div ref={dropdownRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 hover:from-gray-700 hover:to-gray-800 text-white text-xs rounded-xl font-semibold px-4 py-2.5 focus:outline-none cursor-pointer max-w-[160px] border border-gray-600/50 hover:border-gray-500/70 transition-all shadow-lg backdrop-blur-sm flex items-center justify-between gap-2 min-w-[120px]"
            >
                <span className="truncate">{displayText}</span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                >
                    <ChevronDownIcon className="w-4 h-4" />
                </motion.span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key={direction}
                        ref={menuRef}
                        initial={{ opacity: 0, y: verticalOffset }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: verticalOffset }}
                        transition={{ duration: 0.2 }}
                        className={`absolute ${direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 w-56 bg-[var(--color-surface-elevated)] border border-[var(--color-border-color)] rounded-xl shadow-xl backdrop-blur-xl z-50 overflow-hidden`}
                    >
                        <div className="max-h-64 overflow-y-auto p-2">
                            {/* Empty/None option */}
                            <div
                                onClick={() => {
                                    onChange('');
                                    setIsOpen(false);
                                }}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-hover-background)] cursor-pointer transition-colors group ${selectedId === '' ? 'bg-[#dfec2d]/10' : ''}`}
                            >
                                <span className="text-sm text-[var(--color-text-secondary)] truncate flex-1">
                                    No location
                                </span>
                            </div>

                            {locations.length === 0 ? (
                                <div className="px-3 py-2 text-xs text-[var(--color-text-secondary)] text-center">
                                    No locations available
                                </div>
                            ) : (
                                locations.map(location => (
                                    <div
                                        key={location.id}
                                        onClick={() => {
                                            onChange(location.id);
                                            setIsOpen(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-hover-background)] cursor-pointer transition-colors group ${selectedId === location.id ? 'bg-[#dfec2d]/10' : ''}`}
                                    >
                                        {location.imageUrl && (
                                            <img
                                                src={location.imageUrl}
                                                alt={location.name}
                                                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                            />
                                        )}
                                        <span className="text-sm text-[var(--color-text-primary)] truncate flex-1">
                                            {location.name}
                                        </span>
                                        {selectedId === location.id && (
                                            <CheckIcon className="w-4 h-4 text-[#dfec2d] flex-shrink-0" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Still Image Generation Studio ---
const StillStudio: React.FC<{
    frame: Frame;
    scene: AnalyzedScene;
    onBack: () => void;
    onUpdateFrame: (updater: (prev: Frame) => Frame) => void;
    onEnterRefinement: (generation: Generation) => void;
    moodboard?: Moodboard;
    moodboardTemplates?: import('../types').MoodboardTemplate[];
    characters: AnalyzedCharacter[];
    locations: AnalyzedLocation[];
    currentProject?: any;
    user?: any;
}> = ({ frame, scene, onBack, onUpdateFrame, onEnterRefinement, moodboard, moodboardTemplates, characters, locations, currentProject, user }) => {
    const [detailedPrompt, setDetailedPrompt] = useState('');
    const [model, setModel] = useState<string>('Gemini Nano Banana'); // Default model
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');
    const [promptWasAdjusted, setPromptWasAdjusted] = useState(false);
    const [viewingMetadata, setViewingMetadata] = useState<Generation | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);


    const handleGenerate = async () => {
        if (!detailedPrompt.trim()) {
            alert("Please enter a prompt.");
            return;
        }
        setPromptWasAdjusted(false);
        setIsGenerating(true);
        const N_GENERATIONS = 1;
        const loadingGenerations: Generation[] = Array.from({ length: N_GENERATIONS }).map((_, i) => ({
            id: `${Date.now()}-${i}`, url: null, aspectRatio, isLoading: true, progress: 0
        }));

        onUpdateFrame(prevFrame => ({
            ...prevFrame,
            generations: [...(prevFrame.generations || []), ...loadingGenerations]
        }));

        try {
            const selectedCharacters = characters.filter(c => selectedCharacterIds.includes(c.id));
            const selectedLocation = locations.find(l => l.id === selectedLocationId);
            const characterImages = selectedCharacters.map(c => c.imageUrl).filter((url): url is string => !!url);
            const locationImage = selectedLocation?.imageUrl ? [selectedLocation.imageUrl] : [];
            const attachedImages = attachedImage ? [attachedImage] : [];
            const referenceImages = [...attachedImages, ...characterImages, ...locationImage];
            const characterNames = selectedCharacters.map(c => c.name);
            const locationName = selectedLocation?.name;

            // ===== CHARACTER IDENTITY INTEGRATION =====
            const characterIdentities = selectedCharacters
                .map(char => char.identity)
                .filter(identity => identity?.status === 'ready' && identity?.technologyData?.falCharacterId)
                .map(identity => ({
                    loraUrl: identity!.technologyData!.falCharacterId!,
                    scale: (identity!.technologyData!.referenceStrength || 80) / 100
                }));

            if (characterIdentities.length > 0) {
                console.log('[SceneAssemblerTab] Using character identities:', {
                    count: characterIdentities.length,
                    characterNames: selectedCharacters
                        .filter(c => c.identity?.status === 'ready')
                        .map(c => c.name)
                });
            }

            const onProgress = (index: number, progress: number) => {
                onUpdateFrame(prevFrame => {
                    const newGenerations = [...(prevFrame.generations || [])];
                    const loaderId = loadingGenerations[index].id;
                    const genIndex = newGenerations.findIndex(g => g.id === loaderId);
                    if (genIndex !== -1 && newGenerations[genIndex].isLoading) {
                        newGenerations[genIndex] = { ...newGenerations[genIndex], progress };
                    }
                    return { ...prevFrame, generations: newGenerations };
                });
            };

            const { urls, errors, wasAdjusted, metadata } = await generateStillVariants(frame.id, model, detailedPrompt, referenceImages, [], aspectRatio, N_GENERATIONS, moodboard, moodboardTemplates || [], characterNames, locationName, onProgress, {
                projectId: currentProject?.id || null,
                userId: user?.id || null,
                sceneId: scene.id,
                frameId: frame.id
            }, characterIdentities.length > 0 ? characterIdentities : undefined);

            if (wasAdjusted) {
                setPromptWasAdjusted(true);
            }

            onUpdateFrame(prevFrame => {
                let currentGenerations = [...(prevFrame.generations || [])];
                urls.forEach((url, i) => {
                    const error = errors[i];
                    const loaderId = loadingGenerations[i].id;
                    const index = currentGenerations.findIndex(g => g.id === loaderId);
                    if (index !== -1) {
                         currentGenerations[index] = {
                            ...currentGenerations[index],
                            url: url || null,
                            isLoading: false,
                            error: error || undefined,
                            // Store metadata with each generation
                            promptUsed: metadata.promptUsed,
                            referenceImages: metadata.referenceImages,
                            selectedCharacters: metadata.selectedCharacters,
                            selectedLocation: metadata.selectedLocation,
                            model: metadata.model
                         };
                    }
                });
                return { ...prevFrame, generations: currentGenerations.filter(g => g.url || g.isLoading || g.error) };
            });

        } catch (error) {
            console.error(`Failed to generate visual for Shot ${frame.shot_number}:`, error);
            alert(`Error generating visual: ${error instanceof Error ? error.message : 'Unknown error'}`);
            onUpdateFrame(prevFrame => ({
                ...prevFrame,
                generations: (prevFrame.generations || []).filter(g => !g.isLoading)
            }));
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleDeleteGeneration = (e: React.MouseEvent, idToDelete: string) => {
        e.stopPropagation();
        onUpdateFrame(prevFrame => ({
            ...prevFrame,
            generations: (prevFrame.generations || []).filter(g => g.id !== idToDelete)
        }));
    };

    const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setAttachedImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const handleSetFrame = (type: 'start' | 'end', imageUrl: string) => {
        onUpdateFrame(prev => ({
            ...prev,
            media: {
                ...prev.media,
                [type === 'start' ? 'start_frame_url' : 'end_frame_url']: imageUrl,
            },
            status: FrameStatus.GeneratedStill
        }));
    };

    // Manual image assignment handlers
    const handleAssignImage = (slot: 'main' | '2nd' | '3rd' | '4th', imageUrl: string) => {
        const slotMapping = {
            'main': 'start_frame_url',
            '2nd': 'secondary_image_url',
            '3rd': 'tertiary_image_url',
            '4th': 'quaternary_image_url'
        };

        onUpdateFrame(prev => ({
            ...prev,
            media: {
                ...prev.media,
                [slotMapping[slot]]: imageUrl,
            },
            status: FrameStatus.GeneratedStill
        }));
    };

    const handleClearSlot = (slot: 'main' | '2nd' | '3rd' | '4th') => {
        const slotMapping = {
            'main': 'start_frame_url',
            '2nd': 'secondary_image_url',
            '3rd': 'tertiary_image_url',
            '4th': 'quaternary_image_url'
        };

        onUpdateFrame(prev => ({
            ...prev,
            media: {
                ...prev.media,
                [slotMapping[slot]]: null,
            }
        }));
    };

    const handleDownload = (imageUrl: string, fileName?: string) => {
        try {
            const link = document.createElement('a');
            link.href = imageUrl;
            const defaultName = `frame-${frame.shot_number || 'unknown'}-${scene.sceneNumber || 'unknown'}-${Date.now()}.png`;
            link.download = fileName || defaultName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed. Please try right-clicking the image instead.');
        }
    };

    // Get all valid generations
    const allGenerations = frame.generations || [];
    const validGenerations = allGenerations.filter(g => g.url && !g.isLoading);

    return (
        <div className="fixed inset-0 bg-[#0B0B0B] flex flex-col z-50">

            {/* Metadata Modal */}
            <AnimatePresence>
                {viewingMetadata && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-8"
                        onClick={() => setViewingMetadata(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl p-6 max-w-2xl w-full border border-gray-700/50 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Generation Metadata</h3>
                                <button
                                    onClick={() => setViewingMetadata(null)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <XIcon className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {viewingMetadata.promptUsed && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-400 mb-1">Prompt Used:</p>
                                        <p className="text-white text-sm bg-gray-800/50 rounded-lg p-3">{viewingMetadata.promptUsed}</p>
                                    </div>
                                )}
                                {viewingMetadata.model && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-400 mb-1">Model:</p>
                                        <p className="text-white text-sm">{viewingMetadata.model}</p>
                                    </div>
                                )}
                                {viewingMetadata.selectedCharacters && viewingMetadata.selectedCharacters.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-400 mb-1">Characters:</p>
                                        <p className="text-white text-sm">{viewingMetadata.selectedCharacters.join(', ')}</p>
                                    </div>
                                )}
                                {viewingMetadata.selectedLocation && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-400 mb-1">Location:</p>
                                        <p className="text-white text-sm">{viewingMetadata.selectedLocation}</p>
                                    </div>
                                )}
                                {viewingMetadata.referenceImages && viewingMetadata.referenceImages.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-400 mb-2">Reference Images ({viewingMetadata.referenceImages.length}):</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {viewingMetadata.referenceImages.slice(0, 6).map((url, idx) => (
                                                <img key={idx} src={url} alt={`Ref ${idx + 1}`} className="w-full aspect-video object-cover rounded-lg border border-gray-700" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="flex-shrink-0 p-6 pb-4 border-b border-gray-800/50">
                <div className="flex items-center justify-between gap-4">
                    <Button onClick={onBack} variant="secondary" className="!text-sm !gap-2 !px-3 !py-2 flex-shrink-0">
                        <ArrowLeftIcon className="w-4 h-4" /> Back to Compositing
                    </Button>
                    <h2 className="text-xl font-bold text-white truncate flex-1 text-center">Shot {frame.shot_number} - Still Studio</h2>
                    <div className="w-24 flex-shrink-0"></div>
                </div>
            </header>

            {/* Main Content: Left Sidebar + Main Grid */}
            <main className="flex-1 overflow-hidden flex">
                {/* LEFT SIDEBAR: Prompt Controls */}
                <aside className="w-72 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl border-r border-white/10 flex flex-col p-6 gap-6 h-full overflow-y-auto">
                    {/* Prompt Input */}
                    <div className="space-y-3">
                        <label className="text-xs text-white/60 uppercase tracking-widest font-medium">Prompt</label>
                        <div className="relative">
                            <textarea
                                value={detailedPrompt}
                                onChange={(e) => setDetailedPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (detailedPrompt.trim()) handleGenerate();
                                    }
                                }}
                                placeholder="Describe your shot in detail..."
                                rows={6}
                                className="w-full h-32 pr-12 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#dfec2d] focus:border-transparent focus:bg-white/10 transition-all resize-none"
                            />
                            {/* Attachment button in top-right corner */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute top-3 right-3 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                title="Attach reference image"
                            >
                                <PaperclipIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Model Selector */}
                    <div className="space-y-3">
                        <label className="text-xs text-white/60 uppercase tracking-widest font-medium block">Model</label>
                        <select
                            value={model}
                            onChange={e => setModel(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 hover:border-white/20 transition-all focus:ring-2 focus:ring-[#dfec2d] focus:outline-none"
                        >
                            <option value="Gemini Nano Banana" className="bg-[#0a0a0a]">Nano Banana</option>
                            <option value="FLUX 1.1" className="bg-[#0a0a0a]">FLUX 1.1</option>
                            <option value="Stable Diffusion" className="bg-[#0a0a0a]">Stable Diffusion</option>
                            <option value="FLUX.1 Kontext (BFL)" className="bg-[#0a0a0a]">FLUX Kontext (BFL)</option>
                            <option value="FLUX Ultra (BFL)" className="bg-[#0a0a0a]">FLUX Ultra (BFL)</option>
                        </select>
                    </div>

                    {/* Aspect Ratio */}
                    <div className="space-y-3">
                        <label className="text-xs text-white/60 uppercase tracking-widest font-medium block">Aspect Ratio</label>
                        <select
                            value={aspectRatio}
                            onChange={e => setAspectRatio(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 hover:border-white/20 transition-all focus:ring-2 focus:ring-[#dfec2d] focus:outline-none"
                        >
                            <option value="16:9" className="bg-[#0a0a0a]">16:9</option>
                            <option value="9:16" className="bg-[#0a0a0a]">9:16</option>
                            <option value="1:1" className="bg-[#0a0a0a]">1:1</option>
                            <option value="4:3" className="bg-[#0a0a0a]">4:3</option>
                            <option value="3:4" className="bg-[#0a0a0a]">3:4</option>
                        </select>
                    </div>

                    {/* Character & Location in One Row */}
                    <div className="space-y-3">
                        <label className="text-xs text-white/60 uppercase tracking-widest font-medium block">Character & Location</label>
                        <div className="grid grid-cols-2 gap-2">
                            <CharacterMultiSelect
                                characters={characters}
                                selectedIds={selectedCharacterIds}
                                onChange={setSelectedCharacterIds}
                            />
                            <LocationSelect
                                locations={locations}
                                selectedId={selectedLocationId}
                                onChange={setSelectedLocationId}
                            />
                        </div>
                    </div>

                    {/* Attached Image Preview */}
                    {attachedImage && (
                        <div className="relative rounded-lg overflow-hidden border border-white/20">
                            <img src={attachedImage} alt="Attached reference" className="w-full h-16 object-cover"/>
                            <button
                                type="button"
                                onClick={() => setAttachedImage(null)}
                                className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove image"
                            >
                                <XIcon className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                                Reference
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <div className="space-y-3">
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileAttach}/>
                        <button
                            onClick={handleGenerate}
                            disabled={!detailedPrompt.trim() || isGenerating}
                            className="w-full py-3 bg-[#dfec2d] hover:bg-[#b3e617] disabled:bg-white/10 disabled:text-white/50 text-black font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#dfec2d]/50 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    Generate
                                    <span className="text-xs">({validGenerations.length} images)</span>
                                </>
                            )}
                        </button>

                        {promptWasAdjusted && (
                            <div className="text-xs text-lime-900/90 px-3 py-2 bg-[#dfec2d]/10 rounded-xl border border-[#dfec2d]/20">
                                <span className="font-semibold">Note:</span> Prompt was adjusted for safety.
                            </div>
                        )}
                    </div>

                    {/* Hero Frames - Compact Sidebar Display */}
                    {(frame.media?.start_frame_url || frame.media?.end_frame_url) && (
                        <div className="space-y-3">
                            <label className="text-xs text-white/60 uppercase tracking-widest font-medium block">Selected Frames</label>
                            <div className="space-y-2">
                                {frame.media.start_frame_url && (
                                    <div className="relative rounded-lg overflow-hidden border-2 border-[#dfec2d]/50 bg-black">
                                        <img src={frame.media.start_frame_url} alt="Start Frame" className="w-full h-16 object-cover" />
                                        <div className="absolute top-1 left-1 bg-[#dfec2d] text-black text-[10px] px-1.5 py-0.5 rounded font-bold">
                                            START
                                        </div>
                                    </div>
                                )}
                                {frame.media.end_frame_url && (
                                    <div className="relative rounded-lg overflow-hidden border-2 border-[var(--color-accent-secondary)]/50 bg-black">
                                        <img src={frame.media.end_frame_url} alt="End Frame" className="w-full h-16 object-cover" />
                                        <div className="absolute top-1 left-1 bg-[var(--color-accent-secondary)] text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                            END
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </aside>

                {/* MAIN AREA: 3-Column Image Grid */}
                <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 bg-[#0a0a0a]">
                    {/* Generated Images Grid */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest font-medium">Generations</h3>
                        </div>

                        {validGenerations.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {validGenerations.map((gen, index) => (
                                    <div
                                        key={gen.id}
                                        className="relative group cursor-pointer"
                                        onClick={() => onEnterRefinement(gen)}
                                    >
                                        <GlowCard
                                            glowColor="purple"
                                            customSize={true}
                                            className="w-full !p-0 overflow-hidden"
                                        >
                                            <div className={`${aspectRatioClasses[gen.aspectRatio] || 'aspect-[4/3]'} relative overflow-hidden rounded-lg`}>
                                                <img src={gen.url!} alt={`Generation ${index + 1}`} className="w-full h-full object-cover" />

                                            {/* Hover overlay with actions */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Action buttons - icon only with color palette */}
                                                <div className="absolute bottom-2 left-2 right-2 flex gap-2 justify-center flex-wrap">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSetFrame('start', gen.url!);
                                                        }}
                                                        className="p-2.5 bg-[#dfec2d]/90 backdrop-blur-sm text-black rounded-lg hover:bg-[#dfec2d] hover:scale-110 transition-all shadow-lg"
                                                        title="Set as Start Frame"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSetFrame('end', gen.url!);
                                                        }}
                                                        className="p-2.5 bg-[var(--color-accent-secondary)]/90 backdrop-blur-sm text-white rounded-lg hover:bg-[var(--color-accent-secondary)] hover:scale-110 transition-all shadow-lg"
                                                        title="Set as End Frame"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEnterRefinement(gen);
                                                        }}
                                                        className="p-2.5 bg-purple-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-purple-500 hover:scale-110 transition-all shadow-lg"
                                                        title="Refine Image"
                                                    >
                                                        <SparklesIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(gen.url!);
                                                        }}
                                                        className="p-2.5 bg-[#dfec2d]/100/90 backdrop-blur-sm text-white rounded-lg hover:bg-[#dfec2d]/100 hover:scale-110 transition-all shadow-lg"
                                                        title="Download"
                                                    >
                                                        <DownloadIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteGeneration(e, gen.id);
                                                        }}
                                                        className="p-2.5 bg-red-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-red-500 hover:scale-110 transition-all shadow-lg"
                                                        title="Delete"
                                                    >
                                                        <Trash2Icon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                {/* Navigation hint */}
                                                <div className="absolute top-2 left-2 text-white text-xs opacity-75">
                                                    Click to view • Use arrow keys to navigate
                                                </div>
                                            </div>
                                            <div className="absolute top-2 right-2 bg-[#dfec2d] text-black text-xs px-2 py-1 rounded font-semibold">
                                                #{index + 1}
                                            </div>
                                            </div>
                                        </GlowCard>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 text-center">
                                <ImagePlusIcon className="w-16 h-16 text-white/20 mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">No images generated yet</h3>
                                <p className="text-white/60 mb-6">Enter a prompt and click Generate to create images</p>
                            </div>
                        )}
                    </div>

                    {/* Loading Generations */}
                    {allGenerations.filter(g => g.isLoading).length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest font-medium mb-4">Generating...</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {allGenerations.filter(g => g.isLoading).map((gen, idx) => (
                                    <div key={gen.id} className={`${aspectRatioClasses[gen.aspectRatio] || 'aspect-[4/3]'} relative overflow-hidden rounded-lg border border-[#dfec2d]/30 bg-black/20`}>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <AlkemyLoadingIcon className="w-8 h-8 text-white/60 mb-2 animate-spin" />
                                            <p className="text-white text-xs mb-2">Generating...</p>
                                            <div className="w-24 bg-gray-600 rounded-full h-1">
                                                <div className="bg-[#dfec2d] h-1 rounded-full transition-all" style={{ width: `${gen.progress || 0}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="absolute top-2 right-2 bg-[#dfec2d] text-black text-xs px-2 py-1 rounded font-semibold">
                                            #{validGenerations.length + idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// --- Animate Studio ---
const AnimateStudio: React.FC<{
    frame: Frame;
    onBack: () => void;
    onUpdateFrame: (updater: (prev: Frame) => Frame) => void;
    currentProject?: any;
    user?: any;
    scene?: AnalyzedScene;
}> = ({ frame, onBack, onUpdateFrame, currentProject, user, scene }) => {
    const [motionPrompt, setMotionPrompt] = useState('');
    const [videoModel, setVideoModel] = useState<'Veo 3.1' | 'Kling 2.1 Pro' | 'WAN 2.1' | 'Wan'>('Veo 3.1');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [frameToUpload, setFrameToUpload] = useState<'start' | 'end' | null>(null);
    const [fullScreenVideoUrl, setFullScreenVideoUrl] = useState<string | null>(null);


    const isGenerating = frame.videoGenerations?.some(g => g.isLoading) ?? false;
    
    const handleFrameControlClick = (type: 'start' | 'end') => {
        setFrameToUpload(type);
        fileInputRef.current?.click();
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0] && frameToUpload) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                onUpdateFrame(prev => ({
                    ...prev,
                    media: {
                        ...prev.media,
                        [frameToUpload === 'start' ? 'start_frame_url' : 'end_frame_url']: imageUrl,
                    }
                }));
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
        setFrameToUpload(null);
    };

    const handleRemoveFrame = (type: 'start' | 'end') => {
        onUpdateFrame(prev => {
            const newMedia = { ...prev.media };
            if (type === 'start') {
                newMedia.start_frame_url = null;
            } else {
                newMedia.end_frame_url = null;
            }
            return { ...prev, media: newMedia };
        });
    };

    const handleGenerate = async () => {
        const startFrame = frame.media?.upscaled_start_frame_url || frame.media?.start_frame_url;
        if (!startFrame) {
            alert("Please set a Start Frame first.");
            return;
        }

        // WAN 2.1 requires a reference image
        if (videoModel === 'WAN 2.1' && !startFrame) {
            alert('WAN 2.1 requires a reference image.');
            return;
        }

        const N_VIDEO_GENERATIONS = 1;
        const loadingGenerations: Generation[] = Array.from({ length: N_VIDEO_GENERATIONS }).map((_, i) => ({
            id: `vgen-${Date.now()}-${i}`, url: null, aspectRatio: '16:9', isLoading: true, progress: 0
        }));

        onUpdateFrame(prevFrame => ({
            ...prevFrame,
            status: FrameStatus.RenderingVideo,
            progress: 0,
            videoGenerations: [...(prevFrame.videoGenerations || []), ...loadingGenerations]
        }));

        try {
            const onProgress = (progress: number) => {
                 onUpdateFrame(prevFrame => {
                    const newGenerations = [...(prevFrame.videoGenerations || [])];
                    loadingGenerations.forEach(loader => {
                         const genIndex = newGenerations.findIndex(g => g.id === loader.id);
                         if (genIndex !== -1 && newGenerations[genIndex].isLoading) {
                             newGenerations[genIndex] = { ...newGenerations[genIndex], progress };
                         }
                    });
                    // Use the average progress for the main frame progress bar
                    const totalProgress = newGenerations.reduce((sum, gen) => sum + (gen.progress || 0), 0);
                    const avgProgress = newGenerations.length > 0 ? totalProgress / newGenerations.length : 0;
                    return { ...prevFrame, videoGenerations: newGenerations, progress };
                });
            };

            const endFrame = frame.media?.end_frame_url || null;

            const startFrameGeneration = (frame.generations || []).find(g => g.url === frame.media?.start_frame_url);
            let aspectRatio = startFrameGeneration?.aspectRatio || '16:9';

            let videoUrls: string[];

            // All models now use Veo 3.1 via Gemini API with different temperatures for variation
            if (aspectRatio !== '16:9' && aspectRatio !== '9:16') {
                console.warn(`Veo only supports 16:9 and 9:16. Defaulting from ${aspectRatio} to 16:9.`);
                aspectRatio = '16:9';
            }

            // Route to appropriate video generation service based on model selection
            if (videoModel === 'Veo 3.1') {
                // Use Gemini Veo 3.1
                videoUrls = await animateFrame(
                    motionPrompt,
                    startFrame,
                    endFrame,
                    N_VIDEO_GENERATIONS,
                    aspectRatio,
                    onProgress,
                    {
                        projectId: currentProject?.id || null,
                        userId: user?.id || null,
                        sceneId: scene?.id || null,
                        frameId: frame.id
                    },
                    0.6  // Default Veo temperature
                );
            } else if (videoModel === 'Wan') {
                // Use Wan API for image-to-video
                const promises = Array.from({ length: N_VIDEO_GENERATIONS }, (_, i) =>
                    generateVideoFromImageWan(
                        startFrame,
                        motionPrompt,
                        5, // duration in seconds
                        undefined, // seed
                        1.5, // cfgScale
                        (progress) => onProgress(progress)
                    )
                );
                videoUrls = await Promise.all(promises);
            } else if (videoModel === 'Kling 2.1 Pro') {
                // Use Kling 2.1 Pro for image-to-video
                const promises = Array.from({ length: N_VIDEO_GENERATIONS }, async (_, i) => {
                    return await generateVideoWithKling(
                        motionPrompt,
                        startFrame,
                        5, // duration in seconds
                        aspectRatio as '16:9' | '9:16' | '1:1',
                        (progress) => onProgress(progress)
                    );
                });
                videoUrls = await Promise.all(promises);
            } else if (videoModel === 'WAN 2.1') {
                // WAN 2.1 requires a reference image
                if (!startFrame) {
                    throw new Error('WAN 2.1 requires a reference image. Please upload a start frame.');
                }
                const promises = Array.from({ length: N_VIDEO_GENERATIONS }, async (_, i) => {
                    return await refineVideoWithWAN(
                        motionPrompt,
                        startFrame,
                        4, // duration in seconds
                        aspectRatio as '16:9' | '9:16' | '1:1',
                        (progress) => onProgress(progress)
                    );
                });
                videoUrls = await Promise.all(promises);
            } else {
                throw new Error(`Unknown video model: ${videoModel}`);
            }

            onUpdateFrame(prevFrame => {
                let currentGenerations = [...(prevFrame.videoGenerations || [])];
                const newlyCompletedVideos: Generation[] = [];

                videoUrls.forEach((url, i) => {
                    if (i < loadingGenerations.length) {
                        const loaderId = loadingGenerations[i].id;
                        const index = currentGenerations.findIndex(g => g.id === loaderId);
                        if (index !== -1) {
                            const completedVideo = { ...currentGenerations[index], url, isLoading: false, progress: 100 };
                            currentGenerations[index] = completedVideo;
                            newlyCompletedVideos.push(completedVideo);
                        }
                    }
                });

                // Auto-analyze newly completed videos
                newlyCompletedVideos.forEach(video => {
                    if (video.url) {
                        handleAnalyzeVideo(video);
                    }
                });

                return {
                    ...prevFrame,
                    videoGenerations: currentGenerations.filter(g => g.url || g.isLoading),
                    status: FrameStatus.UpscaledImageReady // Revert to this status, as a video isn't officially selected yet
                };
            });

        } catch (error) {
            console.error("Failed to generate video variant:", error);
            alert(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            onUpdateFrame(prevFrame => ({
                ...prevFrame,
                videoGenerations: (prevFrame.videoGenerations || []).map(g => g.isLoading ? {...g, isLoading: false, error: 'Generation failed'} : g),
                status: FrameStatus.Error
            }));
        }
    };

    const handleSelectVideo = (videoUrl: string) => {
        if (!videoUrl) return;
        onUpdateFrame(prev => ({
            ...prev,
            media: { ...prev.media, animated_video_url: videoUrl },
            status: FrameStatus.AnimatedVideoReady,
        }));
        setFullScreenVideoUrl(null);
        // Stay in AnimateStudio - user can manually click "Back" when done
    };

    const handleAnalyzeVideo = async (video: Generation) => {
        if (!video.url) return;

        console.log('[AnimateStudio] Analyzing video:', video.id);

        try {
            const analysis = await analyzeVideoWithGemini(video.url);

            onUpdateFrame(prev => ({
                ...prev,
                videoGenerations: prev.videoGenerations?.map(v =>
                    v.id === video.id ? { ...v, analysisPrompt: analysis } : v
                )
            }));

            console.log('[AnimateStudio] Video analysis complete:', analysis);
        } catch (error) {
            console.error('[AnimateStudio] Video analysis failed:', error);
        }
    };

    const videoGenerations = frame.videoGenerations || [];
    const selectedVideoIndex = frame.selectedVideoIndex ?? 0;
    const setSelectedVideoIndex = (index: number) => {
        onUpdateFrame(prev => ({ ...prev, selectedVideoIndex: index }));
    };
    const selectedVideo = videoGenerations[selectedVideoIndex] || videoGenerations.find(g => g.url && !g.isLoading);

    return (
        <div className="fixed inset-0 bg-[#0B0B0B] flex flex-col z-50">
            {fullScreenVideoUrl && (
                <FullScreenVideoPlayer
                    url={fullScreenVideoUrl}
                    onClose={() => setFullScreenVideoUrl(null)}
                    onSelect={() => handleSelectVideo(fullScreenVideoUrl)}
                />
            )}

            {/* Header */}
            <header className="flex-shrink-0 p-6 pb-4 border-b border-gray-800/50">
                <div className="flex items-center justify-between gap-4">
                    <Button onClick={onBack} variant="secondary" className="!text-sm !gap-2 !px-3 !py-2 flex-shrink-0">
                        <ArrowLeftIcon className="w-4 h-4" /> Back to Compositing
                    </Button>
                    <h2 className="text-xl font-bold text-white truncate flex-1 text-center">Shot {frame.shot_number} - Animate Studio</h2>
                    <div className="w-24 flex-shrink-0"></div>
                </div>
            </header>

            {/* Main Content: Three-Column Layout */}
            <main className="flex-1 overflow-hidden flex">
                {/* LEFT COLUMN: Controls */}
                <aside className="w-[320px] border-r border-gray-800/50 flex flex-col bg-gradient-to-b from-[#0d0f16]/90 to-[#0B0B0B]/90 overflow-y-auto">
                    <div className="p-4 space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Animation Settings</h3>

                            {/* Frame Upload Section */}
                            <div className="mb-4 p-3 rounded-lg border border-[#dfec2d]/30 bg-gray-800/20">
                                <label className="text-xs text-gray-400 mb-2 block font-semibold">Frames</label>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

                                {/* Start Frame */}
                                <div className="mb-3">
                                    <p className="text-xs text-gray-500 mb-1">Hero Frame</p>
                                    <div className="relative group">
                                        <div className="w-full aspect-video rounded-xl border-2 border-[#dfec2d]/60 flex items-center justify-center bg-gray-800/40 overflow-hidden backdrop-blur-sm hover:border-[#dfec2d] transition-all">
                                            {((frame.media?.upscaled_start_frame_url && frame.media.upscaled_start_frame_url.trim()) || (frame.media?.start_frame_url && frame.media.start_frame_url.trim())) ? (
                                                <img src={frame.media?.upscaled_start_frame_url || frame.media?.start_frame_url} alt="Starting frame" className="w-full h-full object-cover"/>
                                            ) : (
                                                <p className="text-xs text-gray-500">Not Set</p>
                                            )}
                                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button onClick={() => handleFrameControlClick('start')} className="p-2 text-black bg-[#dfec2d]/80 rounded-xl hover:bg-[#dfec2d] hover:scale-110 transition-all border border-[#dfec2d]" title="Upload Start Frame">
                                                    <ImagePlusIcon className="w-4 h-4"/>
                                                </button>
                                                {(frame.media?.start_frame_url || frame.media?.upscaled_start_frame_url) && (
                                                    <button onClick={() => handleRemoveFrame('start')} className="p-2 text-white bg-red-500/20 rounded-xl hover:bg-red-500/30 hover:scale-110 transition-all border border-red-500/50" title="Remove Start Frame">
                                                        <Trash2Icon className="w-4 h-4"/>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* End Frame */}
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">End Frame (Optional)</p>
                                    <div className="relative group">
                                        <div className="w-full aspect-video rounded-xl border-2 border-[#dfec2d]/40 flex items-center justify-center bg-gray-800/40 overflow-hidden backdrop-blur-sm hover:border-[#dfec2d] transition-all">
                                            {frame.media?.end_frame_url ? (
                                                <img src={frame.media.end_frame_url} alt="Ending frame" className="w-full h-full object-cover"/>
                                            ) : (
                                                <p className="text-xs text-gray-500">Not Set</p>
                                            )}
                                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button onClick={() => handleFrameControlClick('end')} className="p-2 text-black bg-[#dfec2d]/80 rounded-xl hover:bg-[#dfec2d] hover:scale-110 transition-all border border-[#dfec2d]" title="Upload End Frame">
                                                    <ImagePlusIcon className="w-4 h-4"/>
                                                </button>
                                                {frame.media?.end_frame_url && (
                                                    <button onClick={() => handleRemoveFrame('end')} className="p-2 text-white bg-red-500/20 rounded-xl hover:bg-red-500/30 hover:scale-110 transition-all border border-red-500/50" title="Remove End Frame">
                                                        <Trash2Icon className="w-4 h-4"/>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Video Model Selector */}
                            <div className="mb-4 p-3 rounded-lg border border-[#dfec2d]/30 bg-gray-800/20">
                                <label className="text-xs text-gray-400 mb-2 block font-semibold">Video Model</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['Veo 3.1', 'Kling 2.1 Pro', 'WAN 2.1', 'Wan'] as const).map((model) => (
                                        <button
                                            key={model}
                                            onClick={() => setVideoModel(model)}
                                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${
                                                videoModel === model
                                                    ? 'bg-[#dfec2d] text-black border-[#dfec2d]'
                                                    : 'bg-gray-800/60 text-gray-400 border-gray-700/30 hover:bg-gray-700/60 hover:border-[#dfec2d]/50'
                                            }`}
                                        >
                                            {model}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Motion Prompt */}
                            <div className="mb-4 p-3 rounded-lg border border-[#dfec2d]/30 bg-gray-800/20">
                                <label className="text-xs text-gray-400 mb-2 block font-semibold">Motion Description</label>
                                <textarea
                                    value={motionPrompt}
                                    onChange={(e) => setMotionPrompt(e.target.value)}
                                    placeholder="Describe the motion, e.g., slow dolly zoom in, camera pans left..."
                                    rows={4}
                                    className="w-full bg-gray-800/40 text-white text-sm rounded-xl p-3 border border-[#dfec2d]/30 focus:border-[#dfec2d] focus:bg-gray-800/60 transition-all resize-none focus:outline-none placeholder-gray-500"
                                />
                            </div>

                            {/* Animate Button */}
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                isLoading={isGenerating}
                                className="w-full !bg-gradient-to-r !from-white !via-gray-100 !to-white !text-black !font-bold !py-3 !px-6 !rounded-xl hover:!shadow-2xl hover:!scale-105 !transition-all disabled:!opacity-50 disabled:!cursor-not-allowed disabled:hover:!scale-100 !text-sm"
                            >
                                {isGenerating ? 'Animating...' : 'Animate'}
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* CENTER COLUMN: Video Player */}
                <div className="flex-1 flex flex-col items-center justify-center bg-black p-8">
                    {selectedVideo ? (
                        <div className="relative w-full max-w-4xl space-y-4">
                            {selectedVideo.isLoading ? (
                                <div className="aspect-video rounded-2xl overflow-hidden border-2 border-gray-800">
                                    <LoadingSkeleton aspectRatio="16:9" progress={selectedVideo.progress || 0} />
                                </div>
                            ) : selectedVideo.url ? (
                                <>
                                    <div className="relative group">
                                        <video
                                            src={selectedVideo.url}
                                            muted
                                            loop
                                            autoPlay
                                            playsInline
                                            className="w-full aspect-video rounded-2xl border-4 border-teal-500/30 shadow-[0_0_40px_rgba(20,184,166,0.2)] object-cover"
                                        />
                                        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 via-#dfec2d/20 to-teal-500/20 rounded-2xl -z-10 blur-xl"></div>

                                        {/* Overlay Controls */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-end justify-center pb-8 gap-3">
                                            <Button
                                                onClick={() => handleSelectVideo(selectedVideo.url!)}
                                                variant="primary"
                                                className="!bg-white !text-black !font-bold !py-2 !px-6 !rounded-lg hover:!bg-gray-100 !transition-all !shadow-lg"
                                            >
                                                Use this video
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    const a = document.createElement('a');
                                                    a.href = selectedVideo.url!;
                                                    a.download = `video-${selectedVideo.id}.mp4`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                }}
                                                variant="secondary"
                                                className="!bg-black/70 !text-white !py-2 !px-6 !rounded-lg hover:!bg-black/90 !transition-all !backdrop-blur-sm"
                                            >
                                                Download
                                            </Button>
                                            <Button
                                                onClick={() => setFullScreenVideoUrl(selectedVideo.url!)}
                                                variant="secondary"
                                                className="!bg-black/70 !text-white !p-2 !rounded-lg hover:!bg-black/90 !transition-all !backdrop-blur-sm"
                                            >
                                                <ExpandIcon className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* AI Analysis Panel - Next to Video */}
                                    <div className="p-5 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl border border-[#dfec2d]/30 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <SparklesIcon className="w-5 h-5 text-[#dfec2d]" />
                                            <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                                                AI Video Analysis
                                            </h4>
                                        </div>

                                        {selectedVideo.analysisPrompt ? (
                                            <p className="text-sm text-gray-300 leading-relaxed">
                                                {selectedVideo.analysisPrompt}
                                            </p>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                                                    <div className="bg-[#dfec2d] h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                                                </div>
                                                <p className="text-xs text-gray-400 whitespace-nowrap">Analyzing...</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="aspect-video rounded-2xl border-2 border-red-500/50 bg-red-900/20 flex flex-col items-center justify-center">
                                    <p className="text-red-400 font-semibold mb-2">Generation Failed</p>
                                    <p className="text-gray-400 text-sm max-w-md text-center">{selectedVideo.error}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500/20 to-#dfec2d/20 flex items-center justify-center">
                                <PlayIcon className="w-12 h-12 text-teal-400" />
                            </div>
                            <p className="text-gray-500 text-lg mb-2">No videos generated yet</p>
                            <p className="text-gray-600 text-sm">Set frames and describe motion to animate</p>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Video Gallery & Analysis */}
                <aside className="w-[360px] border-l border-gray-800/50 flex flex-col bg-gradient-to-b from-[#0d0f16]/90 to-[#0B0B0B]/90 overflow-y-auto">
                    <div className="p-4 space-y-4">
                        {/* Video Gallery */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">
                                Generated Videos ({videoGenerations.filter(v => v.url && !v.isLoading).length})
                            </h3>

                            <div className="space-y-3">
                                {videoGenerations.map((video, index) => {
                                    const actualIndex = index;

                                    // Show loading state for videos being generated
                                    if (video.isLoading) {
                                        return (
                                            <div
                                                key={video.id}
                                                className="relative rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-900/50"
                                            >
                                                <div className="w-full aspect-video flex items-center justify-center">
                                                    <div className="text-center">
                                                        <AlkemyLoadingIcon className="w-8 h-8 mx-auto mb-2 animate-pulse text-[#dfec2d]" />
                                                        <p className="text-xs text-gray-400 mb-2">Generating...</p>
                                                        {video.progress !== undefined && video.progress > 0 && (
                                                            <>
                                                                <div className="w-32 mx-auto bg-gray-800 rounded-full h-1 mb-1">
                                                                    <div
                                                                        className="bg-[#dfec2d] h-1 rounded-full transition-all"
                                                                        style={{ width: `${video.progress}%` }}
                                                                    />
                                                                </div>
                                                                <p className="text-xs text-gray-500">{Math.round(video.progress)}%</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Show completed videos
                                    if (video.url) {
                                        return (
                                            <div
                                                key={video.id}
                                                onClick={() => setSelectedVideoIndex(actualIndex)}
                                                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                                    selectedVideoIndex === actualIndex
                                                        ? 'border-[#dfec2d] ring-2 ring-[#dfec2d]/50'
                                                        : 'border-gray-700 hover:border-gray-500'
                                                }`}
                                            >
                                                <video
                                                    src={video.url}
                                                    className="w-full aspect-video object-cover"
                                                    muted
                                                    loop
                                                    playsInline
                                                    onMouseEnter={(e) => e.currentTarget.play()}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.pause();
                                                        e.currentTarget.currentTime = 0;
                                                    }}
                                                />

                                                {/* Video Number Badge */}
                                                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white">
                                                    #{videoGenerations.filter(v => v.url).indexOf(video) + 1}
                                                </div>

                                                {/* Selected Indicator */}
                                                {selectedVideoIndex === actualIndex && (
                                                    <div className="absolute top-2 right-2 bg-[#dfec2d] backdrop-blur-sm p-1 rounded-full">
                                                        <CheckIcon className="w-3 h-3 text-black" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    return null;
                                })}
                            </div>

                            {videoGenerations.filter(v => v.url && !v.isLoading).length === 0 && (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    No videos yet
                                </div>
                            )}
                        </div>

                    </div>
                </aside>
            </main>
        </div>
    );
};

// --- Image/Video Upscale Studios ---
const ProgressStudio: React.FC<{
    title: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    progress: number;
    onBack: () => void;
}> = ({ title, mediaUrl, mediaType, progress, onBack }) => (
    <div className="h-full flex flex-col">
        <header className="flex-shrink-0 p-4"><Button onClick={onBack} variant="secondary" className="!text-sm !gap-2 !px-3 !py-2"><ArrowLeftIcon className="w-4 h-4" /> Back to Compositing</Button></header>
        <main className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-full max-w-2xl aspect-video rounded-lg bg-black mb-6 overflow-hidden flex items-center justify-center">
                {mediaType === 'image' ? <img src={mediaUrl} className="w-full h-full object-contain" /> : <video src={mediaUrl} muted loop playsInline className="w-full h-full object-contain" />}
            </div>
            <h3 className="text-2xl font-bold">{title}</h3>
            <p className="text-gray-400 mb-4">Enhancing to 4K resolution...</p>
            <div className="w-full max-w-md bg-gray-700 rounded-full h-2.5">
                <div className="bg-[var(--color-accent-primary)] h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
            </div>
            <p className="mt-2 font-mono">{Math.round(progress)}%</p>
        </main>
    </div>
);

// --- Shot Card ---
const ShotCard: React.FC<{
    frame: Frame;
    onCompose: () => void;
    onReAnimate: () => void;
    onUpscaleImage: () => void;
    onUpscaleVideo: () => void;
    onDelete: () => void;
    onTransfer: () => void;
}> = ({ frame, onCompose, onReAnimate, onUpscaleImage, onUpscaleVideo, onDelete, onTransfer }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const status = frame.status;
    const { start_frame_url, upscaled_start_frame_url, animated_video_url, video_upscaled_url } = frame.media || {};
    
    const isStillReady = status === FrameStatus.GeneratedStill && !!start_frame_url;
    const isImageUpscaled = status === FrameStatus.UpscaledImageReady && !!upscaled_start_frame_url;
    const isAnimationReady = status === FrameStatus.AnimatedVideoReady;
    const isVideoUpscaled = status === FrameStatus.UpscaledVideoReady;

    const displayUrl = video_upscaled_url || animated_video_url || upscaled_start_frame_url || start_frame_url;
    const isVideo = !!(animated_video_url || video_upscaled_url);

    const handleMouseEnter = () => {
        if (videoRef.current) {
            videoRef.current.play().catch(e => {}); // Ignore play errors on hover
        }
    };

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    const getBorderColorClass = (status: FrameStatus): string => {
        switch (status) {
            case FrameStatus.GeneratedStill:
                return 'border-[#dfec2d]/50';
            case FrameStatus.UpscaledImageReady:
                return 'border-[#dfec2d]/50';
            case FrameStatus.AnimatedVideoReady:
            case FrameStatus.UpscaledVideoReady:
                return 'border-purple-500/50';
            default:
                return 'border-white/20';
        }
    };

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`group bg-white/5 backdrop-blur-sm border-2 rounded-lg overflow-hidden flex flex-col gap-3 transition-all hover:bg-white/10 hover:border-white/30 ${getBorderColorClass(status)}`}
        >
            {/* Media Display */}
            <div className="relative aspect-video bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                {displayUrl ? (
                    isVideo
                        ? <video ref={videoRef} src={displayUrl} muted loop playsInline className="w-full h-full object-cover" />
                        : <img src={displayUrl} alt={`Shot ${frame.shot_number}`} className="w-full h-full object-cover" />
                ) : (
                    <button onClick={onCompose} className="group relative text-white/60 hover:text-white transition-all duration-300 flex flex-col items-center justify-center p-4 hover:bg-white/5 rounded-lg w-full h-full">
                        <div className="relative">
                            <FilmIcon className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform"/>
                            <div className="absolute -inset-2 bg-gradient-to-r from-[#dfec2d]/20 to-#dfec2d/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                        </div>
                        <span className="text-xs font-medium group-hover:text-[#dfec2d] transition-colors">Click to Generate</span>
                        <span className="text-xs text-white/40 mt-1 group-hover:text-white/60 transition-colors">Compose still</span>
                    </button>
                )}

                {/* Progress Indicators */}
                {(status === FrameStatus.UpscalingImage || status === FrameStatus.UpscalingVideo || status === FrameStatus.RenderingVideo) && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                        <div className="w-full max-w-[80%] bg-white/20 rounded-full h-2 mb-3">
                            <div className="bg-[#dfec2d] h-2 rounded-full transition-all" style={{width: `${frame.progress || 0}%`}}></div>
                        </div>
                        <p className="text-sm font-medium">{
                            status === FrameStatus.UpscalingImage ? 'Upscaling Image...' :
                            status === FrameStatus.UpscalingVideo ? 'Upscaling Video...' :
                            'Animating...'
                        }</p>
                    </div>
                )}

                {/* Status Badge */}
                {displayUrl && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                        {isVideoUpscaled ? 'Video Ready' :
                         isAnimationReady ? 'Animated' :
                         isImageUpscaled ? 'Upscaled' :
                         isStillReady ? 'Still Ready' : 'Processing'}
                    </div>
                )}
            </div>

            {/* Info and Actions */}
            <div className="p-3 flex flex-col gap-3">
                <div>
                    <h5 className="font-semibold text-white text-sm">Shot {frame.shot_number}</h5>
                    <p className="text-xs text-white/60 h-8 overflow-hidden line-clamp-2">{frame.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button onClick={onCompose} className="!text-xs !py-2 !bg-[#dfec2d] hover:!bg-[#b3e617] !text-black !font-medium !rounded !transition-all">
                        <FilmIcon className="w-3 h-3 inline mr-1" />
                        Compose
                    </Button>
                    <Button onClick={onReAnimate} disabled={!isStillReady && !isImageUpscaled && !isAnimationReady && !isVideoUpscaled} className="!text-xs !py-2 !bg-white/10 hover:!bg-white/20 !text-white !font-medium !rounded !transition-all disabled:!opacity-50">
                        Animate
                    </Button>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between">
                    {isVideoUpscaled ? (
                        frame.transferredToTimeline
                            ? <div className="flex items-center gap-1 text-[#dfec2d] text-xs">
                                <CheckIcon className="w-3 h-3" />
                                Transferred
                            </div>
                            : <Button onClick={onTransfer} className="!text-xs !py-1.5 !px-3 !bg-[#dfec2d] hover:!bg-[#dfec2d] !text-black !font-medium !rounded !transition-all">
                                To Timeline
                            </Button>
                    ) : isAnimationReady ? (
                        <Button onClick={onUpscaleVideo} className="!text-xs !py-1.5 !px-3 !bg-purple-500 hover:!bg-purple-600 !text-white !font-medium !rounded !transition-all">
                            Upscale Video
                        </Button>
                    ) : isImageUpscaled ? (
                        <Button onClick={onReAnimate} className="!text-xs !py-1.5 !px-3 !bg-white/10 hover:!bg-white/20 !text-white !font-medium !rounded !transition-all">
                            Animate
                        </Button>
                    ) : (
                        <Button onClick={onUpscaleImage} disabled={!isStillReady} className="!text-xs !py-1.5 !px-3 !bg-white/10 hover:!bg-white/20 !text-white !font-medium !rounded !transition-all disabled:!opacity-50">
                            Upscale Image
                        </Button>
                    )}

                    <button
                        onClick={onDelete}
                        aria-label={`Delete shot ${frame.shot_number}`}
                        className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                    >
                        <Trash2Icon className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Component ---
interface CompositingTabProps {
  scriptAnalysis: ScriptAnalysis | null;
  onUpdateAnalysis: React.Dispatch<React.SetStateAction<ScriptAnalysis | null>>;
  onAddScene: () => void;
  onTransferToTimeline: (frame: Frame, scene: AnalyzedScene) => void;
  onTransferAllToTimeline: () => void;
  onBack: () => void;
  currentProject?: any;
  user?: any;
}

const CompositingTab: React.FC<CompositingTabProps> = ({ scriptAnalysis, onUpdateAnalysis, onAddScene, onTransferToTimeline, onTransferAllToTimeline, onBack, currentProject, user }) => {
    const [activeWorkspace, setActiveWorkspace] = useState<Workspace>('grid');
    const [selectedItem, setSelectedItem] = useState<{ frame: Frame; scene: AnalyzedScene } | null>(null);
    const [refinementBase, setRefinementBase] = useState<Generation | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleUpdateFrame = (updater: (prev: Frame) => Frame) => {
        if (!selectedItem) return;
        const { scene, frame } = selectedItem;
        onUpdateAnalysis(prevAnalysis => {
            if (!prevAnalysis) return null;
            const updatedScenes = prevAnalysis.scenes.map(s => {
                if (s.id !== scene.id) return s;
                const updatedFrames = (s.frames || []).map(f => {
                    if (f.id !== frame.id) return f;
                    const updated = updater(f);
                    setSelectedItem(sf => sf ? { ...sf, frame: updated } : null); 
                    return updated;
                });
                return { ...s, frames: updatedFrames };
            });
            return { ...prevAnalysis, scenes: updatedScenes };
        });
    };
    
    const handleAddShot = (sceneId: string) => onUpdateAnalysis(prev => prev ? { ...prev, scenes: prev.scenes.map(scene => scene.id === sceneId ? { ...scene, frames: [...(scene.frames || []), { id: `${scene.id}-fr${(scene.frames?.length || 0) + 1}-${Date.now()}`, shot_number: (scene.frames?.length || 0) + 1, description: `New shot for scene ${scene.sceneNumber}`, status: FrameStatus.Draft, generations: [], refinedGenerationUrls: [] }] } : scene) } : null);
    const handleDeleteShot = (frameId: string, sceneId: string) => onUpdateAnalysis(prev => prev ? { ...prev, scenes: prev.scenes.map(scene => scene.id === sceneId ? { ...scene, frames: (scene.frames || []).filter(f => f.id !== frameId) } : scene) } : null);
    
    // FIX: Replaced the overly generic Promise<{ [key: string]: string }> with a more specific type to improve type safety.
    const runProcess = async (frame: Frame, processFn: (url: string, onProgress: (p: number) => void) => Promise<{ video_url?: string; image_url?: string }>, startStatus: FrameStatus, endStatus: FrameStatus, startUrlKey: keyof Frame['media'], endUrlKey: keyof Frame['media']) => {
        const startUrl = frame.media?.[startUrlKey];
        if (!startUrl || typeof startUrl !== 'string') return;

        const updateFrameProgress = (progress: number) => {
            onUpdateAnalysis(p => p ? { ...p, scenes: p.scenes.map(s => ({ ...s, frames: (s.frames || []).map(f => f.id === frame.id ? { ...f, progress } : f) }))} : null);
        };
        
        onUpdateAnalysis(p => p ? { ...p, scenes: p.scenes.map(s => ({ ...s, frames: (s.frames || []).map(f => f.id === frame.id ? { ...f, status: startStatus, progress: 0 } : f) }))} : null);

        try {
            const result = await processFn(startUrl, updateFrameProgress);
            const mediaUrl = result.video_url || result.image_url;
            onUpdateAnalysis(p => p ? { ...p, scenes: p.scenes.map(s => ({ ...s, frames: (s.frames || []).map(f => f.id === frame.id ? { ...f, status: endStatus, progress: 100, media: { ...f.media, [endUrlKey]: mediaUrl } } : f) }))} : null);
        } catch (error) {
            console.error(`${startStatus} failed:`, error);
            onUpdateAnalysis(p => p ? { ...p, scenes: p.scenes.map(s => ({ ...s, frames: (s.frames || []).map(f => f.id === frame.id ? { ...f, status: FrameStatus.Error, progress: 0 } : f) }))} : null);
        }
        setActiveWorkspace('grid');
    };

    const handleUpscaleImage = (frame: Frame) => runProcess(frame, upscaleImage, FrameStatus.UpscalingImage, FrameStatus.UpscaledImageReady, 'start_frame_url', 'upscaled_start_frame_url');
    const handleUpscaleVideo = (frame: Frame) => runProcess(frame, upscaleVideo, FrameStatus.UpscalingVideo, FrameStatus.UpscaledVideoReady, 'animated_video_url', 'video_upscaled_url');
    
    const handleSetWorkspace = (workspace: Workspace, frame: Frame, scene: AnalyzedScene) => {
        setSelectedItem({ frame, scene });
        setActiveWorkspace(workspace);
    };

    if (!scriptAnalysis) {
        return (
            <div className="fixed inset-0 flex bg-[#0a0a0a] overflow-hidden z-40">
                {/* LEFT SIDEBAR - Controls */}
                <div className="w-72 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl border-r border-white/10 flex flex-col p-5 gap-3 h-full overflow-y-auto">
                    {/* Header with Back Button */}
                    <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                        <Button onClick={onBack} variant="secondary" className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                            <ArrowLeftIcon className="w-4 h-4" />
                        </Button>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-white truncate">Compositing</h2>
                            <p className="text-xs text-white/60">Scene Assembly</p>
                        </div>
                    </div>

                    {/* Scene Controls */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h3 className="text-xs text-white/60 uppercase tracking-widest font-medium mb-3">Get Started</h3>
                            <Button onClick={onAddScene} className="w-full bg-[#dfec2d] hover:bg-[#b3e617] text-black font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
                                <PlusIcon className="w-4 h-4" />
                                Add First Scene
                            </Button>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 h-full overflow-y-auto flex items-center justify-center">
                    <div className="text-center">
                        <FilmIcon className="w-24 h-24 text-white/20 mb-6 mx-auto" />
                        <h2 className="text-3xl font-bold text-white mb-4">Compositing</h2>
                        <p className="text-lg text-white/60 max-w-md mb-8">
                            Analyze a script or manually add scenes to begin composing your film.
                        </p>
                        <Button onClick={onAddScene} className="bg-[#dfec2d] hover:bg-[#b3e617] text-black font-semibold rounded-lg transition-all flex items-center gap-2 px-8 py-3">
                            <PlusIcon className="w-5 h-5" />
                            Add First Scene
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
    
    const renderWorkspace = () => {
        if (!selectedItem) return null;
        switch (activeWorkspace) {
            case 'still-studio':
                return <StillStudio frame={selectedItem.frame} scene={selectedItem.scene} onBack={() => setActiveWorkspace('grid')} onUpdateFrame={handleUpdateFrame} onEnterRefinement={(gen) => { setRefinementBase(gen); setActiveWorkspace('refine-studio'); }} moodboard={scriptAnalysis.moodboard} moodboardTemplates={scriptAnalysis.moodboardTemplates} characters={scriptAnalysis.characters} locations={scriptAnalysis.locations} currentProject={currentProject} user={user} />;
            case 'refine-studio':
                if (!refinementBase) return null;
                return <RefinementStudio baseGeneration={refinementBase} onClose={() => setActiveWorkspace('still-studio')} onUpdateFrame={handleUpdateFrame} currentProject={currentProject} user={user} scene={selectedItem.scene} frame={selectedItem.frame} />;
            case 'animate-studio':
                return <AnimateStudio frame={selectedItem.frame} onBack={() => setActiveWorkspace('grid')} onUpdateFrame={handleUpdateFrame} currentProject={currentProject} user={user} scene={selectedItem.scene} />;
            case 'image-upscale-studio':
            case 'video-upscale-studio':
                const isVideo = activeWorkspace === 'video-upscale-studio';
                return <ProgressStudio title={isVideo ? 'Upscaling Video' : 'Upscaling Image'} mediaUrl={isVideo ? selectedItem.frame.media?.animated_video_url! : selectedItem.frame.media?.start_frame_url!} mediaType={isVideo ? 'video' : 'image'} progress={selectedItem.frame.progress || 0} onBack={() => setActiveWorkspace('grid')} />;
            default: return null;
        }
    };

    if (activeWorkspace !== 'grid') {
        return <div className="fixed inset-0 bg-[#0B0B0B] z-50">{renderWorkspace()}</div>;
    }

    return (
        <div className="fixed inset-0 flex bg-[#0a0a0a] overflow-hidden z-40">
            {/* LEFT SIDEBAR - Controls */}
            <div className="w-72 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl border-r border-white/10 flex flex-col p-5 gap-3 h-full overflow-y-auto">
                {/* Header with Back Button */}
                <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                    <Button onClick={onBack} variant="secondary" className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-white truncate">Compositing</h2>
                        <p className="text-xs text-white/60">Scene Assembly</p>
                    </div>
                </div>

                {/* Scene Controls */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h3 className="text-xs text-white/60 uppercase tracking-widest font-medium mb-3">Scenes</h3>
                        <Button onClick={onAddScene} className="w-full bg-[#dfec2d] hover:bg-[#b3e617] text-black font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
                            <PlusIcon className="w-4 h-4" />
                            Add Scene
                        </Button>
                    </div>

                    {/* Transfer All */}
                    <div>
                        <Button onClick={onTransferAllToTimeline} className="w-full bg-[#dfec2d] hover:bg-[#dfec2d] text-black font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
                            <SendIcon className="w-4 h-4" />
                            Transfer All to Timeline
                        </Button>
                    </div>
                </div>

                {/* Scene List */}
                <div className="flex-1 overflow-y-auto">
                    <h3 className="text-xs text-white/60 uppercase tracking-widest font-medium mb-3">Scene List</h3>
                    <div className="space-y-3">
                        {scriptAnalysis.scenes.map(scene => (
                            <div key={scene.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-white">Scene {scene.sceneNumber}</h4>
                                    <Button onClick={() => handleAddShot(scene.id)} className="p-1.5 bg-[#dfec2d] hover:bg-[#b3e617] text-black rounded transition-all">
                                        <PlusIcon className="w-3 h-3" />
                                    </Button>
                                </div>
                                <p className="text-xs text-white/60 mb-2 truncate">{scene.setting}</p>
                                <p className="text-xs text-white/40">
                                    {scene.frames ? scene.frames.length : 0} shot{(scene.frames?.length || 0) !== 1 ? 's' : ''}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN GALLERY AREA */}
            <div className="flex-1 h-full overflow-y-auto">
                <div className="p-4 md:p-6">
                    <div className="w-full">
                        {scriptAnalysis.scenes.length === 0 ? (
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center h-96 text-center">
                                <FilmIcon className="w-16 h-16 text-white/20 mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">No scenes yet</h3>
                                <p className="text-white/60 mb-6">Add scenes to begin compositing your film</p>
                            </div>
                        ) : (
                            /* Scene Grid */
                            <div className="space-y-8">
                                {scriptAnalysis.scenes.map(scene => (
                                    <div key={scene.id}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-bold text-white">
                                                Scene {scene.sceneNumber}: <span className="font-normal text-white/60">{scene.setting}</span>
                                            </h3>
                                            <Button onClick={() => handleAddShot(scene.id)} className="bg-[#dfec2d] hover:bg-[#b3e617] text-black font-semibold rounded-lg transition-all flex items-center gap-2">
                                                <PlusIcon className="w-4 h-4" />
                                                Add Shot
                                            </Button>
                                        </div>

                                        {scene.frames && scene.frames.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                                {scene.frames.map(frame => (
                                                    <ShotCard
                                                        key={frame.id}
                                                        frame={frame}
                                                        onCompose={() => handleSetWorkspace('still-studio', frame, scene)}
                                                        onReAnimate={() => handleSetWorkspace('animate-studio', frame, scene)}
                                                        onUpscaleImage={() => handleUpscaleImage(frame)}
                                                        onUpscaleVideo={() => handleUpscaleVideo(frame)}
                                                        onDelete={() => handleDeleteShot(frame.id, scene.id)}
                                                        onTransfer={() => onTransferToTimeline(frame, scene)}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                                                <FilmIcon className="w-12 h-12 text-white/20 mb-3 mx-auto" />
                                                <p className="text-white/60">No shots defined for this scene yet</p>
                                                <p className="text-white/40 text-sm mt-1">Click "Add Shot" to create shots for this scene</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompositingTab;
