import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScriptAnalysis, AnalyzedScene, Frame, Generation, AnalyzedCharacter, AnalyzedLocation, Moodboard, FrameStatus } from '../types';
import Button from './Button';
import { generateStillVariants, refineVariant, upscaleImage } from '../services/aiService';
import { ArrowLeftIcon, AlkemyLoadingIcon, XIcon, ImagePlusIcon, Trash2Icon, ExpandIcon, CheckIcon, PaperclipIcon, SparklesIcon } from './icons/Icons';
import { useTheme } from '../theme/ThemeContext';
import { getCharacterIdentityStatus } from '../services/characterIdentityService';
import PromptChatBubble from './PromptChatBubble';

interface CastLocationGeneratorProps {
    item: { type: 'character' | 'location'; data: AnalyzedCharacter | AnalyzedLocation };
    onBack: () => void;
    onUpdateItem: (updater: (prev: AnalyzedCharacter | AnalyzedLocation) => AnalyzedCharacter | AnalyzedLocation) => void;
    onPrepareIdentity?: (loraImages?: string[]) => void;
    moodboard?: Moodboard;
    moodboardTemplates?: any[];
    characters?: AnalyzedCharacter[];
    locations?: AnalyzedLocation[];
    currentProject?: any;
    user?: any;
}

const aspectRatioClasses: { [key: string]: string } = {
    '1:1': 'aspect-square', '16:9': 'aspect-video', '9:16': 'aspect-[9/16]',
    '4:3': 'aspect-[4/3]', '3:4': 'aspect-[3/4]',
};

// New Simplified Refine Studio Component
const RefineStudio: React.FC<{
    baseGeneration: Generation;
    onClose: () => void;
    onUpdateItem: (updater: (prev: AnalyzedCharacter | AnalyzedLocation) => AnalyzedCharacter | AnalyzedLocation) => void;
    aspectRatio: string;
    item: { type: 'character' | 'location'; data: AnalyzedCharacter | AnalyzedLocation };
    currentProject?: any;
    user?: any;
}> = ({ baseGeneration, onClose, onUpdateItem, aspectRatio, item, currentProject, user }) => {
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
                aspectRatio,
                {
                    projectId: currentProject?.id,
                    userId: user?.id,
                    characterId: item.type === 'character' ? item.data.id : undefined,
                    locationId: item.type === 'location' ? item.data.id : undefined
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
                onUpdateItem(prevItem => ({
                    ...prevItem,
                    generations: [...(prevItem.generations || []), {
                        id: `gen-${Date.now()}`,
                        url: refinedImageUrl,
                        aspectRatio,
                        isLoading: false
                    }]
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
            onUpdateItem(prev => ({ ...prev, imageUrl: currentImage }));
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
                            <p className="text-xs text-white/60">{item.data.name} • {aspectRatio}</p>
                        </div>

                        {/* Prompt Input */}
                        <div className="space-y-3">
                            <label className="text-xs text-white/60 uppercase tracking-widest font-medium">Refinement Prompt</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe what you want to change..."
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#c8ff2f] focus:border-transparent focus:bg-white/10 transition-all resize-none"
                                disabled={isGenerating}
                            />

                            <button
                                onClick={handleRefine}
                                disabled={!prompt.trim() || isGenerating}
                                className="w-full py-3 bg-[#c8ff2f] hover:bg-[#b3e617] disabled:bg-white/10 disabled:text-white/50 text-black font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#c8ff2f]/50 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
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
                                                    ? 'bg-[#c8ff2f]/20 border-[#c8ff2f]/50 text-white'
                                                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                    currentImage === version.url ? 'bg-[#c8ff2f]' : 'bg-white/40'
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
                                <AlkemyLoadingIcon className="w-16 h-16 text-[#c8ff2f] mb-4 animate-spin" />
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
                        className="absolute top-6 right-6 bg-lime-400/90 hover:bg-lime-400 text-black font-semibold px-6 py-3 rounded-lg transition-all flex items-center gap-2 shadow-lg backdrop-blur-sm z-20"
                    >
                        <CheckIcon className="w-5 h-5" />
                        Set as Main & Close
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

const CastLocationGenerator: React.FC<CastLocationGeneratorProps> = ({
    item,
    onBack,
    onUpdateItem,
    onPrepareIdentity,
    moodboard,
    moodboardTemplates = [],
    characters = [],
    locations = [],
    currentProject,
    user
}) => {
    const { isDark } = useTheme();
    const [detailedPrompt, setDetailedPrompt] = useState('');
    const [model, setModel] = useState<'Imagen' | 'Gemini Nano Banana' | 'Flux' | 'Flux Kontext Max Multi'>('Imagen');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [attachedImages, setAttachedImages] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [viewingGeneration, setViewingGeneration] = useState<Generation | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [generationCount, setGenerationCount] = useState(4);
    const [refinementBase, setRefinementBase] = useState<Generation | null>(null);
    const [loraImages, setLoraImages] = useState<string[]>([]);

    // Check if this is a character (not a location)
    const isCharacter = item.type === 'character';
    const character = isCharacter ? (item.data as AnalyzedCharacter) : null;

    const handleGenerate = async () => {
        if (!detailedPrompt.trim()) {
            alert("Please enter a prompt.");
            return;
        }

        setIsGenerating(true);
        const N_GENERATIONS = generationCount;
        const loadingGenerations: Generation[] = Array.from({ length: N_GENERATIONS }).map((_, i) => ({
            id: `${Date.now()}-${i}`, url: null, aspectRatio, isLoading: true, progress: 0
        }));

        onUpdateItem(prevItem => ({
            ...prevItem,
            generations: [...(prevItem.generations || []), ...loadingGenerations]
        }));

        try {
            const referenceImages: string[] = [];

            // ✅ Proper attachment handling - Support multiple images for Flux Multi
            if (attachedImages.length > 0) {
                referenceImages.push(...attachedImages);
                console.log('[CastLocationGenerator] Using attached reference images:', attachedImages.length);
            }
            if (item.data.imageUrl) {
                referenceImages.push(item.data.imageUrl);
            }

            // ===== CHARACTER IDENTITY INTEGRATION =====
            let characterIdentities: Array<{ loraUrl: string; scale: number }> | undefined = undefined;

            if (isCharacter && character?.identity) {
                const identityStatus = getCharacterIdentityStatus(character.identity);
                if (identityStatus === 'ready' && character.identity.technologyData?.falCharacterId) {
                    const referenceStrength = character.identity.technologyData.referenceStrength || 80;
                    characterIdentities = [{
                        loraUrl: character.identity.technologyData.falCharacterId,
                        scale: referenceStrength / 100
                    }];
                    console.log('[CastLocationGenerator] Using character identity:', {
                        characterName: character.name,
                        loraUrl: character.identity.technologyData.falCharacterId.substring(0, 50) + '...',
                        scale: referenceStrength / 100
                    });
                }
            }

            const onProgress = (index: number, progress: number) => {
                onUpdateItem(prevItem => {
                    const newGenerations = [...(prevItem.generations || [])];
                    const loaderId = loadingGenerations[index].id;
                    const genIndex = newGenerations.findIndex(g => g.id === loaderId);
                    if (genIndex !== -1 && newGenerations[genIndex].isLoading) {
                        newGenerations[genIndex] = { ...newGenerations[genIndex], progress };
                    }
                    return { ...prevItem, generations: newGenerations };
                });
            };

            const { urls, errors } = await generateStillVariants(
                item.data.id,
                model,
                detailedPrompt,
                referenceImages, // ✅ Attached images will be used by Gemini API
                [],
                aspectRatio,
                N_GENERATIONS,
                moodboard,
                moodboardTemplates,
                isCharacter ? [character!.name] : undefined,
                !isCharacter ? (item.data as AnalyzedLocation).name : undefined,
                onProgress,
                {
                    projectId: currentProject?.id || null,
                    userId: user?.id || null,
                    characterId: isCharacter ? item.data.id : undefined,
                    locationId: !isCharacter ? item.data.id : undefined
                },
                characterIdentities
            );

            onUpdateItem(prevItem => {
                let currentGenerations = [...(prevItem.generations || [])];

                urls.forEach((url, i) => {
                    const error = errors[i];
                    const loaderId = loadingGenerations[i].id;
                    const index = currentGenerations.findIndex(g => g.id === loaderId);
                    if (index !== -1) {
                        currentGenerations[index] = { ...currentGenerations[index], url: url || null, isLoading: false, error: error || undefined };
                    }
                });
                return { ...prevItem, generations: currentGenerations.filter(g => g.url || g.isLoading || g.error) };
            });

        } catch (error) {
            console.error(`Failed to generate visual for ${item.data.name}:`, error);
            alert(`Error generating visual: ${error instanceof Error ? error.message : 'Unknown error'}`);

            onUpdateItem(prevItem => ({
                ...prevItem,
                generations: (prevItem.generations || []).filter(g => !g.isLoading)
            }));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteGeneration = (e: React.MouseEvent, idToDelete: string) => {
        e.stopPropagation();
        onUpdateItem(prevItem => ({
            ...prevItem,
            generations: (prevItem.generations || []).filter(g => g.id !== idToDelete)
        }));
    };

    const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const isFluxMulti = model === 'Flux Kontext Max Multi';

            // For Flux Multi, allow multiple files; for other models, only take the first one
            const filesToProcess = isFluxMulti ? files : [files[0]];

            filesToProcess.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const result = event.target?.result as string;
                    if (isFluxMulti) {
                        // Add to existing images for Flux Multi
                        setAttachedImages(prev => {
                            const updated = [...prev, result];
                            // Limit to 10 images maximum for performance
                            return updated.slice(-10);
                        });
                    } else {
                        // Replace single image for other models
                        setAttachedImages([result]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
        if (e.target) e.target.value = '';
    };

    const handleRemoveAttachedImage = (index: number) => {
        setAttachedImages(prev => prev.filter((_, i) => i !== index));
    };

    const isFluxMulti = model === 'Flux Kontext Max Multi';

    const handleSetMainImage = (imageUrl: string) => {
        onUpdateItem(prev => ({ ...prev, imageUrl }));
    };

    const handleAddToLora = (imageUrl: string) => {
        if (loraImages.length >= 25) {
            alert('Maximum 25 images allowed for LoRA training');
            return;
        }
        if (!loraImages.includes(imageUrl)) {
            setLoraImages(prev => [...prev, imageUrl]);
        }
    };

    const handleRemoveFromLora = (imageUrl: string) => {
        setLoraImages(prev => prev.filter(img => img !== imageUrl));
    };

    // Get all valid generations - moved here to avoid initialization errors
    const allGenerations = item.data.generations || [];
    const validGenerations = allGenerations.filter(g => g.url && !g.isLoading);

    // Download functionality
    const handleDownloadImage = (imageUrl: string, fileName?: string) => {
        try {
            const link = document.createElement('a');
            link.href = imageUrl;
            const defaultName = `${item.type}-${item.data.name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.png`;
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

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!viewingGeneration) return;

        const allImages = [
            ...(item.data.imageUrl ? [{ id: 'main', url: item.data.imageUrl } as Generation] : []),
            ...validGenerations
        ];

        if (allImages.length === 0) return;

        const currentIndex = allImages.findIndex(img => img.url === viewingGeneration.url);

        switch (e.key) {
            case 'Escape':
                setViewingGeneration(null);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : allImages.length - 1;
                setViewingGeneration(allImages[prevIndex]);
                setCurrentImageIndex(prevIndex);
                break;
            case 'ArrowRight':
                e.preventDefault();
                const nextIndex = currentIndex < allImages.length - 1 ? currentIndex + 1 : 0;
                setViewingGeneration(allImages[nextIndex]);
                setCurrentImageIndex(nextIndex);
                break;
            case 'd':
            case 'D':
                e.preventDefault();
                if (viewingGeneration.url) {
                    handleDownloadImage(viewingGeneration.url);
                }
                break;
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewingGeneration, validGenerations, item.data.imageUrl]);

    // Show refinement studio if base image is selected
    if (refinementBase) {
        return (
            <RefineStudio
                baseGeneration={refinementBase}
                onClose={() => setRefinementBase(null)}
                onUpdateItem={onUpdateItem}
                aspectRatio={aspectRatio}
                item={item}
                currentProject={currentProject}
                user={user}
            />
        );
    }

    return (
        <div className="fixed inset-0 flex bg-[#0a0a0a] overflow-hidden z-40">
            {/* LEFT SIDEBAR - Optimized for viewport */}
            <div className="w-72 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl border-r border-white/10 flex flex-col p-5 gap-3 h-full overflow-y-auto">
                {/* Header with Back Button */}
                <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                    <button
                        onClick={onBack}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-white truncate">{item.data.name}</h2>
                        <p className="text-xs text-white/60 capitalize">{item.type} Generation</p>
                    </div>
                </div>

                {/* Model Selector */}
                <div>
                    <label className="text-xs text-white/60 uppercase tracking-widest font-medium block mb-2">Model</label>
                    <select
                        value={model}
                        onChange={e => setModel(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 hover:border-white/20 transition-all focus:ring-2 focus:ring-[#c8ff2f] focus:outline-none"
                    >
                        <option value="Imagen" className="bg-[#0a0a0a]">Imagen</option>
                        <option value="Gemini Nano Banana" className="bg-[#0a0a0a]">Gemini Nano Banana</option>
                        <option value="Flux" className="bg-[#0a0a0a]">Flux</option>
                        <option value="Flux Kontext Max Multi" className="bg-[#0a0a0a]">Flux Kontext Max Multi (FAL)</option>
                    </select>
                </div>

                {/* Aspect Ratio Selector */}
                <div>
                    <label className="text-xs text-white/60 uppercase tracking-widest font-medium block mb-2">Aspect Ratio</label>
                    <select
                        value={aspectRatio}
                        onChange={e => setAspectRatio(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 hover:border-white/20 transition-all focus:ring-2 focus:ring-[#c8ff2f] focus:outline-none"
                    >
                        <option value="16:9" className="bg-[#0a0a0a]">16:9</option>
                        <option value="9:16" className="bg-[#0a0a0a]">9:16</option>
                        <option value="1:1" className="bg-[#0a0a0a]">1:1</option>
                        <option value="4:3" className="bg-[#0a0a0a]">4:3</option>
                        <option value="3:4" className="bg-[#0a0a0a]">3:4</option>
                    </select>
                </div>

                {/* Generation Count Selector */}
                <div>
                    <label className="text-xs text-white/60 uppercase tracking-widest font-medium block mb-2">Images to Generate</label>
                    <select
                        value={generationCount}
                        onChange={e => setGenerationCount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 hover:border-white/20 transition-all focus:ring-2 focus:ring-[#c8ff2f] focus:outline-none"
                        disabled={isGenerating}
                    >
                        <option value={1} className="bg-[#0a0a0a]">1 Image</option>
                        <option value={2} className="bg-[#0a0a0a]">2 Images</option>
                        <option value={3} className="bg-[#0a0a0a]">3 Images</option>
                        <option value={4} className="bg-[#0a0a0a]">4 Images</option>
                    </select>
                </div>

                {/* Main Image Preview - Prominent display with correct aspect ratio */}
                {item.data.imageUrl && (
                    <div>
                        <label className="text-xs text-white/60 uppercase tracking-widest font-medium block mb-2">Current Main Image</label>
                        <div className="relative group rounded-lg overflow-hidden border-2 border-lime-500/50">
                            <div className={`${aspectRatioClasses[aspectRatio] || 'aspect-[4/3]'}`}>
                                <img src={item.data.imageUrl} alt="Main" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-2 left-2 right-2">
                                    <p className="text-white text-xs font-semibold">Main Image ({aspectRatio})</p>
                                </div>
                            </div>
                            <div className="absolute top-2 left-2 bg-lime-500 text-black text-xs px-2 py-1 rounded font-semibold">
                                MAIN
                            </div>
                        </div>
                    </div>
                )}

                {/* Prompt Input - Optimized height for viewport fit */}
                <div className="flex flex-col gap-3">
                    <label className="text-xs text-white/60 uppercase tracking-widest font-medium">Prompt</label>
                    <div className="relative">
                        <textarea
                            value={detailedPrompt}
                            onChange={(e) => setDetailedPrompt(e.target.value)}
                            placeholder={`Describe ${item.data.name}...`}
                            className="w-full h-32 pr-12 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#c8ff2f] focus:border-transparent focus:bg-white/10 transition-all resize-none"
                            rows={6}
                        />
                        {/* Compact attachment button in top-right corner */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple={isFluxMulti}
                            onChange={handleFileAttach}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute top-3 right-3 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title={isFluxMulti ? 'Attach multiple reference images' : 'Attach reference image'}
                        >
                            <PaperclipIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Generate Button - Positioned to be always visible in viewport */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !detailedPrompt.trim()}
                    className="w-full py-3 bg-[#c8ff2f] hover:bg-[#b3e617] disabled:bg-white/10 disabled:text-white/50 text-black font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#c8ff2f]/50 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
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

                {/* Attached Images Preview - Support Multiple Images */}
                {attachedImages.length > 0 && (
                    <div className="relative">
                        <p className="text-xs text-white/60 mb-2">
                            {attachedImages.length} reference image{attachedImages.length > 1 ? 's' : ''} attached
                            {isFluxMulti && ' (Max 10)'}
                        </p>
                        <div className="space-y-2">
                            {attachedImages.map((image, index) => (
                                <div key={index} className="relative group rounded-lg overflow-hidden border border-white/20">
                                    <img src={image} alt={`Reference ${index + 1}`} className="w-full h-16 object-cover" />
                                    <button
                                        onClick={() => handleRemoveAttachedImage(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove image"
                                    >
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                                        #{index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {isFluxMulti && (
                            <p className="text-xs text-white/40 mt-1">
                                💡 {model === 'Flux Kontext Max Multi' ? 'Flux Multi can use multiple reference images' : 'Switch to Flux Kontext Max Multi for multiple images'}
                            </p>
                        )}
                    </div>
                )}

                {/* Character Identity Status - Moved to bottom */}
                {isCharacter && character && (
                    <div className="mt-auto pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <p className="text-xs text-white/60">Character Identity (LoRA)</p>
                                <div className="group relative">
                                    <svg className="w-3 h-3 text-white/30 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-64 p-3 bg-black/90 border border-white/20 rounded-lg text-[10px] text-white/80 z-50">
                                        <p className="font-semibold text-white mb-1">What is Character Identity?</p>
                                        <p>Train a LoRA (Low-Rank Adaptation) model on 3-5 images of your character. This ensures consistent appearance across all generated shots with 90-98% visual similarity.</p>
                                    </div>
                                </div>
                            </div>
                            {getCharacterIdentityStatus(character.identity) === 'ready' && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-lime-500/20 border border-lime-500/30">
                                    <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></div>
                                    <span className="text-[10px] font-semibold text-lime-400 uppercase tracking-wider">LoRA Active</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`w-2 h-2 rounded-full ${
                                getCharacterIdentityStatus(character.identity) === 'ready' ? 'bg-green-500' :
                                getCharacterIdentityStatus(character.identity) === 'preparing' ? 'bg-lime-500 animate-pulse' :
                                getCharacterIdentityStatus(character.identity) === 'error' ? 'bg-red-500' : 'bg-gray-500'
                            }`}></div>
                            <p className="text-xs text-white/80 capitalize">
                                {getCharacterIdentityStatus(character.identity) === 'ready' ? 'Trained & Ready' :
                                 getCharacterIdentityStatus(character.identity) === 'preparing' ? 'Training...' :
                                 getCharacterIdentityStatus(character.identity) === 'error' ? 'Training Failed' :
                                 'Not Trained'}
                            </p>
                        </div>
                        {getCharacterIdentityStatus(character.identity) === 'ready' ? (
                            <p className="text-[10px] text-white/40 mb-2">
                                ✓ All generated images will use this character's trained LoRA model
                            </p>
                        ) : (
                            <p className="text-[10px] text-white/40 mb-3">
                                Train a character identity to ensure consistent appearance across all shots
                            </p>
                        )}

                        {/* LoRA Training Images Section */}
                        {loraImages.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-white/60 font-medium">LoRA Training Images</p>
                                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        loraImages.length >= 6 && loraImages.length <= 12
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-lime-500/20 text-lime-900 border border-lime-500/30'
                                    }`}>
                                        {loraImages.length}/12
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                    {loraImages.map((imgUrl, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-purple-500/30">
                                            <img src={imgUrl} alt={`LoRA ${idx + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => handleRemoveFromLora(imgUrl)}
                                                className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove"
                                            >
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1 rounded">
                                                #{idx + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {loraImages.length < 6 && (
                                    <p className="text-[10px] text-lime-400 mt-2">
                                        ⚠️ Minimum 6 images required ({6 - loraImages.length} more needed)
                                    </p>
                                )}
                                {loraImages.length > 12 && (
                                    <p className="text-[10px] text-red-400 mt-2">
                                        ⚠️ Maximum 12 images allowed (remove {loraImages.length - 12})
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Train Button */}
                        {loraImages.length >= 6 && loraImages.length <= 12 && onPrepareIdentity && (
                            <button
                                onClick={() => onPrepareIdentity(loraImages)}
                                className="w-full mt-3 py-2.5 px-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Train Character Identity ({loraImages.length} images)
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* MAIN GALLERY AREA - Full screen expansion */}
            <div className="flex-1 h-full overflow-y-auto">
                <div className="p-4 md:p-6">
                    <div className="w-full">
                        {/* Initial Loading State - Show when first starting generation */}
                        {isGenerating && validGenerations.length === 0 && allGenerations.filter(g => g.isLoading).length === generationCount && (
                            <div className="flex flex-col items-center justify-center h-96 text-center">
                                <AlkemyLoadingIcon className="w-16 h-16 text-[#c8ff2f] mb-4 animate-spin" />
                                <h3 className="text-xl font-semibold text-white mb-2">Initializing generation...</h3>
                                <p className="text-white/60">Preparing to generate {generationCount} {generationCount === 1 ? 'image' : 'images'}</p>
                            </div>
                        )}

                        {/* Gallery Grid */}
                        {validGenerations.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {/* Generated Images Only - Main image shown in left sidebar */}
                                {validGenerations.map((gen, idx) => (
                                    <div
                                        key={gen.id}
                                        className="relative group cursor-pointer"
                                        onClick={() => setViewingGeneration(gen)}
                                    >
                                        <div className={`${aspectRatioClasses[gen.aspectRatio] || 'aspect-[4/3]'} relative overflow-hidden rounded-lg border border-white/20 hover:border-[#c8ff2f]/50 transition-all`}>
                                            <img src={gen.url!} alt={`Generation ${idx + 1}`} className="w-full h-full object-cover" />

                                            {/* Hover overlay with actions */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Action buttons - icon only with color palette */}
                                                <div className="absolute bottom-2 left-2 right-2 flex gap-2 justify-center">
                                                    {isCharacter ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (loraImages.includes(gen.url!)) {
                                                                    handleRemoveFromLora(gen.url!);
                                                                } else {
                                                                    handleAddToLora(gen.url!);
                                                                }
                                                            }}
                                                            className={`p-2.5 backdrop-blur-sm rounded-lg hover:scale-110 transition-all shadow-lg ${
                                                                loraImages.includes(gen.url!)
                                                                    ? 'bg-purple-500/90 text-white hover:bg-purple-600'
                                                                    : 'bg-[#c8ff2f]/90 text-black hover:bg-[#c8ff2f]'
                                                            }`}
                                                            title={loraImages.includes(gen.url!) ? 'Remove from LoRA' : 'Add to LoRA'}
                                                        >
                                                            {loraImages.includes(gen.url!) ? (
                                                                <XIcon className="w-4 h-4" />
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSetMainImage(gen.url!);
                                                            }}
                                                            className="p-2.5 bg-lime-500/90 backdrop-blur-sm text-black rounded-lg hover:bg-lime-500 hover:scale-110 transition-all shadow-lg"
                                                            title="Set as Main"
                                                        >
                                                            <CheckIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRefinementBase(gen);
                                                        }}
                                                        className="p-2.5 bg-purple-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-purple-500 hover:scale-110 transition-all shadow-lg"
                                                        title="Refine Image"
                                                    >
                                                        <SparklesIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownloadImage(gen.url!, `${item.type}-${item.data.name.replace(/[^a-zA-Z0-9]/g, '_')}-gen-${idx + 1}.png`);
                                                        }}
                                                        className="p-2.5 bg-[var(--color-accent-secondary)]/90 backdrop-blur-sm text-white rounded-lg hover:bg-[var(--color-accent-secondary)] hover:scale-110 transition-all shadow-lg"
                                                        title="Download"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
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
                                            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                                <div className="bg-[#c8ff2f] text-black text-xs px-2 py-1 rounded font-semibold">
                                                    #{idx + 1}
                                                </div>
                                                {isCharacter && loraImages.includes(gen.url!) && (
                                                    <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded font-semibold flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                                        </svg>
                                                        LoRA
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Loading States */}
                                {allGenerations.filter(g => g.isLoading).map((gen, idx) => (
                                    <div key={gen.id} className={`${aspectRatioClasses[gen.aspectRatio] || 'aspect-[4/3]'} relative overflow-hidden rounded-lg border border-lime-500/30 bg-black/20`}>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <AlkemyLoadingIcon className="w-8 h-8 text-white/60 mb-2 animate-spin" />
                                            <p className="text-white text-xs mb-2">Generating...</p>
                                            <div className="w-24 bg-gray-600 rounded-full h-1">
                                                <div className="bg-lime-500 h-1 rounded-full transition-all" style={{ width: `${gen.progress || 0}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="absolute top-2 right-2 bg-lime-500 text-black text-xs px-2 py-1 rounded font-semibold">
                                            #{validGenerations.length + idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center h-96 text-center">
                                <ImagePlusIcon className="w-16 h-16 text-white/20 mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">No images generated yet</h3>
                                <p className="text-white/60 mb-6">Enter a prompt and click Generate to create images for {item.data.name}</p>
                                <div className="text-sm text-white/40">
                                    {attachedImages.length > 0 ? (
                                        <span>✓ {attachedImages.length} reference image{attachedImages.length > 1 ? 's' : ''} attached</span>
                                    ) : (
                                        <span>💡 Tip: Attach reference images for better results {isFluxMulti ? '(Multiple supported)' : '(Single image)'}</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Full Screen Image Viewer */}
            {viewingGeneration && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setViewingGeneration(null)}>
                    <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                        <img src={viewingGeneration.url!} alt="Fullscreen" className="max-w-full max-h-full object-contain" />

                        {/* Navigation indicators */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                            <p className="text-white text-sm">
                                {currentImageIndex + 1} of {[(item.data.imageUrl ? 1 : 0), ...validGenerations].length} • Use arrow keys to navigate • Press 'D' to download
                            </p>
                        </div>

                        {/* Navigation arrows */}
                        <button
                            onClick={() => {
                                const allImages = [
                                    ...(item.data.imageUrl ? [{ id: 'main', url: item.data.imageUrl } as Generation] : []),
                                    ...validGenerations
                                ];
                                const currentIndex = allImages.findIndex(img => img.url === viewingGeneration.url);
                                const prevIndex = currentIndex > 0 ? currentIndex - 1 : allImages.length - 1;
                                setViewingGeneration(allImages[prevIndex]);
                                setCurrentImageIndex(prevIndex);
                            }}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <button
                            onClick={() => {
                                const allImages = [
                                    ...(item.data.imageUrl ? [{ id: 'main', url: item.data.imageUrl } as Generation] : []),
                                    ...validGenerations
                                ];
                                const currentIndex = allImages.findIndex(img => img.url === viewingGeneration.url);
                                const nextIndex = currentIndex < allImages.length - 1 ? currentIndex + 1 : 0;
                                setViewingGeneration(allImages[nextIndex]);
                                setCurrentImageIndex(nextIndex);
                            }}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Top controls */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                            <button
                                onClick={() => setViewingGeneration(null)}
                                className="p-3 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        if (viewingGeneration.url) {
                                            handleDownloadImage(viewingGeneration.url!);
                                        }
                                    }}
                                    className="px-4 py-2 bg-[var(--color-accent-secondary)] text-white rounded-lg hover:bg-[var(--color-accent-secondary)]/80 transition"
                                >
                                    Download
                                </button>
                                {viewingGeneration.id !== 'main' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setRefinementBase(viewingGeneration);
                                                setViewingGeneration(null);
                                            }}
                                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition flex items-center gap-2"
                                        >
                                            <SparklesIcon className="w-4 h-4" />
                                            Refine
                                        </button>
                                        {isCharacter ? (
                                            <button
                                                onClick={() => {
                                                    if (viewingGeneration.url) {
                                                        if (loraImages.includes(viewingGeneration.url)) {
                                                            handleRemoveFromLora(viewingGeneration.url);
                                                        } else {
                                                            handleAddToLora(viewingGeneration.url);
                                                        }
                                                    }
                                                    setViewingGeneration(null);
                                                }}
                                                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                                                    viewingGeneration.url && loraImages.includes(viewingGeneration.url)
                                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                                        : 'bg-lime-500 hover:bg-lime-600 text-white'
                                                }`}
                                            >
                                                {viewingGeneration.url && loraImages.includes(viewingGeneration.url) ? (
                                                    <>
                                                        <XIcon className="w-4 h-4" />
                                                        Remove from LoRA
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        Add to LoRA
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    if (viewingGeneration.url) handleSetMainImage(viewingGeneration.url);
                                                    setViewingGeneration(null);
                                                }}
                                                className="px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-600 transition"
                                            >
                                                Set as Main
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (viewingGeneration.id !== 'main') {
                                                    handleDeleteGeneration({} as React.MouseEvent, viewingGeneration.id);
                                        }
                                                setViewingGeneration(null);
                                            }}
                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CastLocationGenerator;