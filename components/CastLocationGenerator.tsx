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

// Refinement Studio Component - Latest Version with Left Sidebar Layout
const RefinementStudio: React.FC<{
    baseGeneration: Generation;
    onClose: () => void;
    onUpdateItem: (updater: (prev: AnalyzedCharacter | AnalyzedLocation) => AnalyzedCharacter | AnalyzedLocation) => void;
    aspectRatio: string;
    item: { type: 'character' | 'location'; data: AnalyzedCharacter | AnalyzedLocation };
    currentProject?: any;
    user?: any;
}> = ({ baseGeneration, onClose, onUpdateItem, aspectRatio, item, currentProject, user }) => {
    const [prompt, setPrompt] = useState('');
    const [imageVersions, setImageVersions] = useState<{id: number, prompt: string, image: string, isLoading?: boolean}[]>([
        { id: 0, prompt: 'Initial', image: baseGeneration.url! }
    ]);
    const [currentImageId, setCurrentImageId] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);

    const currentImage = imageVersions.find(v => v.id === currentImageId);

    const handleRefine = useCallback(async () => {
        if (prompt.trim() && currentImage?.image) {
            // Create a loading state first
            const loadingVersion = {
                id: imageVersions.length,
                prompt: prompt,
                image: baseGeneration.url!,
                isLoading: true
            };
            setImageVersions(prev => [...prev, loadingVersion]);
            setCurrentImageId(loadingVersion.id);
            setIsGenerating(true);

            try {
                // Call the AI service for actual image refinement using the existing refineVariant function
                const refinedImageUrl = await refineVariant(
                    prompt, // Refinement prompt
                    currentImage.image, // Base image to refine
                    aspectRatio, // Aspect ratio
                    {
                        projectId: currentProject?.id,
                        userId: user?.id,
                        characterId: item.type === 'character' ? item.data.id : undefined,
                        locationId: item.type === 'location' ? item.data.id : undefined
                    }
                );

                if (refinedImageUrl) {
                    const refinedVersion = {
                        id: loadingVersion.id,
                        prompt: prompt,
                        image: refinedImageUrl
                    };

                    setImageVersions(prev =>
                        prev.map(v => v.id === loadingVersion.id ? refinedVersion : v)
                    );

                    onUpdateItem(prevItem => ({
                        ...prevItem,
                        generations: [...(prevItem.generations || []), { id: `gen-${Date.now()}`, url: refinedImageUrl, aspectRatio, isLoading: false }],
                        refinedGenerationUrls: [...(prevItem.refinedGenerationUrls || []), refinedImageUrl],
                    }));
                } else {
                    throw new Error('No refined image returned from AI service');
                }
            } catch (error) {
                console.error('Refinement failed:', error);
                // Remove loading version on error
                setImageVersions(prev => prev.filter(v => v.id !== loadingVersion.id));
                setCurrentImageId(imageVersions.length - 2); // Go back to previous valid image

                // Show error message
                alert('Refinement failed: ' + (error instanceof Error ? error.message : 'Unknown error') + '. Please try again with a different prompt.');
            } finally {
                setIsGenerating(false);
                setPrompt('');
            }
        }
    }, [prompt, currentImage, imageVersions.length, baseGeneration.url!, aspectRatio, item, currentProject, user, onUpdateItem]);

    const handleSetMainAndClose = () => {
        if (currentImage?.image) {
            onUpdateItem(prev => ({ ...prev, imageUrl: currentImage.image }));
            onClose();
        }
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
            <div className="w-[98vw] h-[98vh] bg-gray-900/95 backdrop-blur-sm rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-white font-semibold">Refine Studio</h1>
                            <p className="text-gray-400 text-sm">
                                {item.data.name} • {aspectRatio} • {imageVersions.length} versions
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSetMainAndClose}
                        className="bg-emerald-400 hover:bg-emerald-500 text-black font-semibold rounded-full px-6 py-2.5 transition-all flex items-center gap-2"
                    >
                        <CheckIcon className="w-5 h-5" />
                        Set as Main & Close
                    </button>
                </div>

                {/* Main Container */}
                <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
                    <div className="m-4 border-2 border-emerald-400 rounded-2xl bg-gray-800 overflow-hidden flex flex-col flex-1">

                        {/* Top Section: Left Prompt + Right Image */}
                        <div className="flex flex-1 overflow-hidden min-h-0">
                            {/* Left Side - Prompt Refinement Window */}
                            <div className="w-72 bg-gray-900 border-r border-gray-700 flex flex-col p-6 overflow-y-auto">
                                <h2 className="text-white font-semibold mb-4">Refine Prompt</h2>

                                {/* Prompt Input */}
                                <div className="mb-6 flex-shrink-0">
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Enter refinement prompt..."
                                        className="w-full h-24 bg-gray-800 text-white placeholder-gray-500 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-gray-600"
                                    />
                                    <button
                                        onClick={handleRefine}
                                        className="w-full mt-3 bg-emerald-400 hover:bg-emerald-500 text-black font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!prompt.trim() || isGenerating}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                                Refining...
                                            </>
                                        ) : (
                                            <>
                                                Apply Refinement
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Applied Refinements List */}
                                {imageVersions.length > 1 && (
                                    <div>
                                        <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3">Applied Refinements</h3>
                                        <div className="space-y-2">
                                            {imageVersions.slice(1).map((version) => (
                                                <button
                                                    key={version.id}
                                                    onClick={() => setCurrentImageId(version.id)}
                                                    className={`w-full text-left p-2 rounded-lg text-xs transition ${
                                                        currentImageId === version.id
                                                            ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/40'
                                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                                                    }`}
                                                >
                                                    {version.isLoading ? (
                                                        <div className="flex items-center">
                                                            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mr-2" />
                                                            Processing...
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {version.prompt.substring(0, 40)}
                                                            {version.prompt.length > 40 ? '...' : ''}
                                                        </>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Side - Current Image Display */}
                            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-4 overflow-hidden">
                                <div className="w-full h-full flex items-center justify-center">
                                    {currentImage && (
                                        <div className="relative w-full h-full bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                                            {currentImage.isLoading ? (
                                                <div className="flex flex-col items-center justify-center">
                                                    <AlkemyLoadingIcon className="w-12 h-12 text-emerald-400 mb-4 animate-spin" />
                                                    <p className="text-gray-400">Refining image...</p>
                                                </div>
                                            ) : (
                                                <img
                                                    src={currentImage.image}
                                                    alt="Current version"
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section - Version History Blocks */}
                        {imageVersions.length > 1 && (
                            <div className="border-t border-gray-700 bg-gray-800 p-4 flex gap-3 overflow-x-auto">
                                <h3 className="text-gray-400 text-xs uppercase tracking-wide whitespace-nowrap self-center mr-2">Versions:</h3>
                                {imageVersions.map((version) => (
                                    <button
                                        key={version.id}
                                        onClick={() => setCurrentImageId(version.id)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                                            currentImageId === version.id
                                                ? 'border-emerald-400'
                                                : 'border-gray-600 hover:border-gray-500'
                                        }`}
                                    >
                                        {version.isLoading ? (
                                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : (
                                            <img
                                                src={version.image}
                                                alt={`Version ${version.id}`}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
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
            <RefinementStudio
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
                        <div className="relative group rounded-lg overflow-hidden border-2 border-emerald-500/50">
                            <div className={`${aspectRatioClasses[aspectRatio] || 'aspect-[4/3]'}`}>
                                <img src={item.data.imageUrl} alt="Main" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-2 left-2 right-2">
                                    <p className="text-white text-xs font-semibold">Main Image ({aspectRatio})</p>
                                </div>
                            </div>
                            <div className="absolute top-2 left-2 bg-emerald-500 text-black text-xs px-2 py-1 rounded font-semibold">
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
                {isCharacter && character?.identity && (
                    <div className="mt-auto pt-4 border-t border-white/10">
                        <p className="text-xs text-white/60 mb-2">Character Identity</p>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                                getCharacterIdentityStatus(character.identity) === 'ready' ? 'bg-green-500' : 'bg-yellow-500'
                            }`}></div>
                            <p className="text-xs text-white/80">
                                {getCharacterIdentityStatus(character.identity)}
                            </p>
                        </div>
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
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSetMainImage(gen.url!);
                                                        }}
                                                        className="p-2.5 bg-[#c8ff2f]/90 backdrop-blur-sm text-black rounded-lg hover:bg-[#c8ff2f] hover:scale-110 transition-all shadow-lg"
                                                        title="Set as Main"
                                                    >
                                                        <CheckIcon className="w-4 h-4" />
                                                    </button>
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
                                                        className="p-2.5 bg-blue-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-blue-500 hover:scale-110 transition-all shadow-lg"
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
                                            <div className="absolute top-2 right-2 bg-[#c8ff2f] text-black text-xs px-2 py-1 rounded font-semibold">
                                                #{idx + 1}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Loading States */}
                                {allGenerations.filter(g => g.isLoading).map((gen, idx) => (
                                    <div key={gen.id} className={`${aspectRatioClasses[gen.aspectRatio] || 'aspect-[4/3]'} relative overflow-hidden rounded-lg border border-yellow-500/30 bg-black/20`}>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <AlkemyLoadingIcon className="w-8 h-8 text-white/60 mb-2 animate-spin" />
                                            <p className="text-white text-xs mb-2">Generating...</p>
                                            <div className="w-24 bg-gray-600 rounded-full h-1">
                                                <div className="bg-yellow-500 h-1 rounded-full transition-all" style={{ width: `${gen.progress || 0}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded font-semibold">
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
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
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
                                        <button
                                            onClick={() => {
                                                if (viewingGeneration.url) handleSetMainImage(viewingGeneration.url);
                                                setViewingGeneration(null);
                                            }}
                                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                                        >
                                            Set as Main
                                        </button>
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