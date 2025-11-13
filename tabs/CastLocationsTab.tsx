
import React, { useState, useEffect, useRef } from 'react';
import { AnalyzedCharacter, AnalyzedLocation, Generation, Moodboard, MoodboardTemplate, CharacterIdentity } from '../types';
import Button from '../components/Button';
import { UsersIcon, MapPinIcon, ArrowLeftIcon, AlkemyLoadingIcon, XIcon, PlusIcon, ImagePlusIcon, Trash2Icon, PaperclipIcon, ExpandIcon, CheckCircleIcon, AlertCircleIcon, UploadIcon } from '../components/icons/Icons';
import { generateStillVariants, refineVariant, upscaleImage } from '../services/aiService';
import { useTheme } from '../theme/ThemeContext';
import { motion } from 'framer-motion';
import CharacterIdentityModal from '../components/CharacterIdentityModal';
import { CharacterIdentityTestPanel } from '../components/CharacterIdentityTestPanel';
import { getCharacterIdentityStatus } from '../services/characterIdentityService';
import ImageCarousel from '../components/ImageCarousel';
import VideoGenerationPanel from '../components/VideoGenerationPanel';

// --- FullScreen Image Viewer Modal ---
const FullScreenImagePlayer: React.FC<{
    generation: Generation;
    onClose: () => void;
    onSetMain: () => void;
    onRefine: () => void;
}> = ({ generation, onClose, onSetMain, onRefine }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!generation.url) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                <img src={generation.url} alt="Fullscreen generated visual" className="max-w-full max-h-full object-contain" />
                <Button onClick={onClose} variant="secondary" className="absolute top-4 left-4 !text-sm !gap-2 !px-3 !py-2">
                    <ArrowLeftIcon className="w-4 h-4" /> Back
                </Button>
                <div className="absolute top-4 right-4 flex gap-2">
                     <Button onClick={onSetMain} variant="secondary">Set as Main</Button>
                     <Button onClick={onRefine} variant="primary">Refine</Button>
                </div>
            </div>
        </div>
    );
};


// --- STANDALONE MODAL COMPONENT ---
interface AddItemModalProps {
    type: 'character' | 'location';
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent, name: string, description: string) => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ type, isOpen, onClose, onSubmit }) => {
    const { isDark } = useTheme();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName('');
            setDescription('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 20 }}
                className={`w-full max-w-md rounded-2xl border overflow-hidden ${
                    isDark
                        ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border-gray-800'
                        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                }`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-6 py-5 border-b ${
                    isDark ? 'border-gray-800' : 'border-gray-200'
                }`}>
                    <h3 className={`text-xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        Add New {type === 'character' ? 'Character' : 'Location'}
                    </h3>
                    <p className={`text-sm mt-1 ${
                        isDark ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                        Enter details to create a new {type === 'character' ? 'character' : 'location'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={(e) => onSubmit(e, name, description)} className="p-6">
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="itemName" className={`block text-sm font-semibold mb-2 ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Name *
                            </label>
                            <input
                                id="itemName"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder={`e.g., ${type === 'character' ? 'John Smith' : 'City Streets'}`}
                                className={`w-full px-4 py-3 rounded-xl border transition-all ${
                                    isDark
                                        ? 'bg-[#0B0B0B] border-gray-800 text-white placeholder-gray-600 focus:border-teal-500 focus:bg-[#141414]'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:bg-gray-50'
                                } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label htmlFor="itemDescription" className={`block text-sm font-semibold mb-2 ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Description
                            </label>
                            <textarea
                                id="itemDescription"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder={`Describe the ${type}...`}
                                rows={4}
                                className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${
                                    isDark
                                        ? 'bg-[#0B0B0B] border-gray-800 text-white placeholder-gray-600 focus:border-teal-500 focus:bg-[#141414]'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:bg-gray-50'
                                } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="!px-6 !py-2.5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="!px-6 !py-2.5"
                        >
                            Add {type === 'character' ? 'Character' : 'Location'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// --- Refinement Studio (for Cast/Locations) ---
const RefinementStudio: React.FC<{
    baseGeneration: Generation;
    onClose: () => void;
    onSetMainImage: (imageUrl: string) => void;
    onUpdate: (updater: (prev: AnalyzedCharacter | AnalyzedLocation) => AnalyzedCharacter | AnalyzedLocation) => void;
}> = ({ baseGeneration, onClose, onSetMainImage, onUpdate }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentBaseImage, setCurrentBaseImage] = useState(baseGeneration.url!);
    const [sessionVariants, setSessionVariants] = useState<string[]>([]);
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [upscalingVariant, setUpscalingVariant] = useState<string | null>(null);
    const [upscaleProgress, setUpscaleProgress] = useState(0);
    
    const handleGenerate = async () => {
        if (!prompt.trim() || !currentBaseImage) return;
        setIsGenerating(true);
        try {
            const newUrl = await refineVariant(prompt, currentBaseImage, baseGeneration.aspectRatio);
            setSessionVariants(prev => [newUrl, ...prev]);

            onUpdate(prev => ({
                ...prev,
                generations: [...(prev.generations || []), { id: `gen-${Date.now()}`, url: newUrl, aspectRatio: baseGeneration.aspectRatio, isLoading: false }],
                refinedGenerationUrls: [...(prev.refinedGenerationUrls || []), newUrl],
            }));
            
            setCurrentBaseImage(newUrl);
            setPrompt('');
        } catch (error) {
            alert(`Error refining variant: ${error instanceof Error ? error.message : 'Unknown Error'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUpscale = async (imageUrl: string) => {
        setUpscalingVariant(imageUrl);
        setUpscaleProgress(0);
        try {
            const { image_url } = await upscaleImage(imageUrl, (progress) => {
                setUpscaleProgress(progress);
            });
            onUpdate(prev => ({ ...prev, upscaledImageUrl: image_url }));
            onSetMainImage(image_url);
            onClose();
        } catch (error) {
            alert(`Error upscaling image: ${error instanceof Error ? error.message : 'Unknown Error'}`);
        } finally {
            setUpscalingVariant(null);
            setUpscaleProgress(0);
        }
    };
    
    const allDisplayableVariants = [baseGeneration.url!, ...sessionVariants];

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

    return (
        <div className="fixed inset-0 bg-[#0B0B0B] flex flex-col z-50 p-6">
            <header className="flex-shrink-0 mb-4 flex justify-between items-center">
                <Button onClick={onClose} variant="secondary" className="!text-sm !gap-2 !px-3 !py-2"><ArrowLeftIcon className="w-4 h-4" /> Back to Studio</Button>
            </header>

            <div className="flex-1 flex flex-col overflow-hidden gap-6">
                <div className="flex-1 flex flex-row overflow-hidden gap-6">
                    <div className="w-2/3 h-full bg-black flex items-center justify-center rounded-lg overflow-hidden">
                       <img src={currentBaseImage} alt="Base for refinement" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-1/3 flex flex-col">
                         <h3 className="text-lg font-semibold text-gray-300 mb-4 flex-shrink-0">Refined Variants</h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                           {allDisplayableVariants.map((url, i) => (
                                <div 
                                    key={`${url}-${i}`}
                                    className={`relative group aspect-video rounded-lg overflow-hidden cursor-pointer transition-all ${currentBaseImage === url ? 'ring-2 ring-teal-500' : 'ring-2 ring-transparent'}`} 
                                    onClick={() => !upscalingVariant && setCurrentBaseImage(url)}
                                >
                                    <img src={url} alt={`Variant`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                     <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                        {upscalingVariant === url ? (
                                            <div className="text-center text-white">
                                                <p className="text-xs font-semibold mb-1">Upscaling...</p>
                                                <div className="w-24 bg-gray-600 rounded-full h-1"><div className="bg-teal-400 h-1 rounded-full" style={{width: `${upscaleProgress}%`}}></div></div>
                                            </div>
                                        ) : (
                                             <>
                                                <p className="text-white font-bold text-xs">{url === baseGeneration.url ? 'Original Image' : 'Click to refine this version'}</p>
                                                <div className="flex gap-2">
                                                    <Button variant="secondary" className="!text-xs !py-1 !px-3 !bg-white/90 !text-black" onClick={(e) => { e.stopPropagation(); onSetMainImage(url); }}>Set as Main</Button>
                                                    <Button variant="secondary" className="!text-xs !py-1 !px-3 !bg-teal-500/80 !text-white" onClick={(e) => { e.stopPropagation(); handleUpscale(url); }}>Upscale</Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                              {isGenerating && (
                                <div className="w-full aspect-video bg-gray-800/50 animate-pulse flex items-center justify-center rounded-lg">
                                    <svg className="w-8 h-8 text-gray-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-center pb-4">
                     <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="w-full max-w-4xl"
                    >
                        <div className="relative group">
                            {/* Gradient glow */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 rounded-[28px] opacity-20 group-hover:opacity-40 blur-xl transition-all duration-500" />

                            {/* Main container */}
                            <div className="relative backdrop-blur-2xl bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />

                                <div className="p-5 space-y-4">
                                    {attachedImage && (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="relative self-start p-1.5 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 ml-3"
                                        >
                                            <img src={attachedImage} alt="Attached reference" className="w-20 h-20 object-cover rounded-xl"/>
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                whileTap={{ scale: 0.9 }}
                                                type="button"
                                                onClick={() => setAttachedImage(null)}
                                                className="absolute -top-2 -right-2 bg-red-500/90 text-white rounded-full p-1.5 hover:bg-red-600 transition-all shadow-lg shadow-red-500/50"
                                            >
                                                <XIcon className="w-3.5 h-3.5" />
                                            </motion.button>
                                        </motion.div>
                                    )}

                                    <div className="relative bg-gray-800/40 rounded-2xl border border-gray-700/30 p-4 focus-within:border-teal-500/50 focus-within:bg-gray-800/60 transition-all">
                                        <div className="flex items-start gap-3">
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileAttach}/>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex-shrink-0 mt-1 p-2.5 text-gray-400 rounded-xl hover:bg-gradient-to-br hover:from-teal-500/20 hover:to-purple-500/20 hover:text-teal-400 transition-all border border-transparent hover:border-teal-500/30"
                                            >
                                                <PaperclipIcon className="w-5 h-5"/>
                                            </motion.button>
                                            <textarea
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder="e.g., make the character smile, add cinematic lighting..."
                                                rows={3}
                                                className="flex-1 bg-transparent text-base resize-none focus:outline-none max-h-40 py-2 text-gray-100 placeholder-gray-500 leading-relaxed"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                                                        e.preventDefault();
                                                        handleGenerate();
                                                    }
                                                }}
                                            />
                                            <div className="flex-shrink-0 bg-gradient-to-br from-gray-700/80 to-gray-800/80 text-white text-xs rounded-xl font-semibold px-4 py-2.5 border border-gray-600/50 shadow-lg">
                                                Gemini Nano Banana
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button
                                                onClick={handleGenerate}
                                                disabled={isGenerating || !prompt.trim()}
                                                isLoading={isGenerating}
                                                className="relative overflow-hidden !bg-gradient-to-r !from-white !via-gray-100 !to-white !text-black !font-bold !py-3 !px-8 !rounded-xl hover:!shadow-2xl hover:!shadow-teal-500/20 !transition-all disabled:!opacity-50 disabled:!cursor-not-allowed group/btn"
                                            >
                                                <span className="relative z-10 flex items-center gap-2">
                                                    Generate
                                                    <motion.span
                                                        animate={{ x: [0, 3, 0] }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                        className="text-teal-600"
                                                    >
                                                        →
                                                    </motion.span>
                                                </span>
                                                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/20 to-purple-500/0 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                            </Button>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};


type GenerationItem = {
    type: 'character' | 'location';
    data: AnalyzedCharacter | AnalyzedLocation;
}

const GenerationView: React.FC<{
    item: GenerationItem;
    onBack: () => void;
    onUpdateBatch: (updater: (prev: AnalyzedCharacter | AnalyzedLocation) => AnalyzedCharacter | AnalyzedLocation) => void;
    moodboard?: Moodboard;
    moodboardTemplates?: MoodboardTemplate[];
}> = ({ item, onBack, onUpdateBatch, moodboard, moodboardTemplates = [] }) => {
    const [detailedPrompt, setDetailedPrompt] = useState('');
    const [model, setModel] = useState<'Imagen' | 'Gemini Nano Banana' | 'Flux' | 'Flux Kontext Max Multi'>('Imagen');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [editingGeneration, setEditingGeneration] = useState<Generation | null>(null);
    const [viewingGeneration, setViewingGeneration] = useState<Generation | null>(null);
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'main' | 'identity'>('main');

    // Check if this is a character (not a location)
    const isCharacter = item.type === 'character';
    const character = isCharacter ? (item.data as AnalyzedCharacter) : null;
    
    const aspectRatioClasses: { [key: string]: string } = {
        '1:1': 'aspect-square', '16:9': 'aspect-video', '9:16': 'aspect-[9/16]',
        '4:3': 'aspect-[4/3]', '3:4': 'aspect-[3/4]',
    };

    const handleGenerate = async () => {
         if (!detailedPrompt.trim()) {
            alert("Please enter a prompt.");
            return;
        }
        const N_GENERATIONS = 2;
        const loadingGenerations: Generation[] = Array.from({ length: N_GENERATIONS }).map((_, i) => ({
            id: `${Date.now()}-${i}`, url: null, aspectRatio, isLoading: true, progress: 0
        }));

        onUpdateBatch(prevItem => ({
            ...prevItem,
            generations: [...(prevItem.generations || []), ...loadingGenerations]
        }));

        try {
            const referenceImages: string[] = [];
            if (attachedImage) {
                referenceImages.push(attachedImage);
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
                    console.log('[CastLocationsTab] Using character identity:', {
                        characterName: character.name,
                        loraUrl: character.identity.technologyData.falCharacterId.substring(0, 50) + '...',
                        scale: referenceStrength / 100
                    });
                }
            }

            const onProgress = (index: number, progress: number) => {
                onUpdateBatch(prevItem => {
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
                referenceImages,
                [],
                aspectRatio,
                N_GENERATIONS,
                moodboard,
                moodboardTemplates,
                isCharacter ? [character!.name] : undefined,
                !isCharacter ? (item.data as AnalyzedLocation).name : undefined,
                onProgress,
                undefined,
                characterIdentities // ✅ Pass character identity LoRAs
            );

            onUpdateBatch(prevItem => {
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

            onUpdateBatch(prevItem => ({
                ...prevItem,
                generations: (prevItem.generations || []).filter(g => !g.isLoading)
            }));
        }
    };
    
    const handleDeleteGeneration = (e: React.MouseEvent, idToDelete: string) => {
        e.stopPropagation();
        onUpdateBatch(prevItem => ({
            ...prevItem,
            generations: (prevItem.generations || []).filter(g => g.id !== idToDelete)
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

    const handleSetMainImage = (imageUrl: string) => {
        onUpdateBatch(prev => ({...prev, imageUrl}));
    };

    const handleSetMainAndCloseEditor = (imageUrl: string) => {
        handleSetMainImage(imageUrl);
        setEditingGeneration(null);
    };
    
    const LoadingSkeleton: React.FC<{ aspectRatio: string; progress: number }> = ({ aspectRatio, progress }) => (
        <div className="relative w-full h-64 bg-black/20 flex flex-col items-center justify-center rounded-lg">
            <div className="absolute inset-0 bg-gray-800/50 animate-pulse"></div>
            <div className="relative z-10 text-center text-white w-full max-w-[80%]">
                <AlkemyLoadingIcon className="w-12 h-12 mx-auto mb-3 animate-subtle-pulse" />
                <p className="font-semibold text-sm mb-2">Generating...</p>
                <div className="w-full bg-gray-600 rounded-full h-1.5">
                    <div className="bg-teal-500 h-1.5 rounded-full" style={{width: `${progress}%`}}></div>
                </div>
                <p className="font-mono text-xs mt-1">{Math.round(progress)}%</p>
            </div>
        </div>
    );

    if (editingGeneration) {
        return <RefinementStudio 
                  baseGeneration={editingGeneration}
                  onClose={() => setEditingGeneration(null)}
                  onSetMainImage={handleSetMainAndCloseEditor}
                  onUpdate={onUpdateBatch}
                />
    }

    // Get all valid generations (including loading ones)
    const allGenerations = item.data.generations || [];
    const validGenerations = allGenerations.filter(g => g.url && !g.isLoading);
    const currentImage = validGenerations[selectedImageIndex] || null;

    // Define image slots for better organization
    const imageSlots = [
        { id: 'main', label: 'Main', priority: 1, color: 'emerald' },
        { id: 'secondary', label: 'Secondary', priority: 2, color: 'blue' },
        { id: 'tertiary', label: 'Tertiary', priority: 3, color: 'purple' },
        { id: 'fourth', label: 'Fourth', priority: 4, color: 'pink' }
    ];

    return (
        <div className="fixed inset-0 bg-[#0B0B0B] flex flex-col z-50">
            {viewingGeneration && (
                <FullScreenImagePlayer
                    generation={viewingGeneration}
                    onClose={() => setViewingGeneration(null)}
                    onSetMain={() => {
                        if(viewingGeneration.url) handleSetMainImage(viewingGeneration.url);
                        setViewingGeneration(null);
                    }}
                    onRefine={() => {
                        setEditingGeneration(viewingGeneration);
                        setViewingGeneration(null);
                    }}
                />
            )}

            {/* Header */}
            <header className="flex-shrink-0 p-6 pb-4 border-b-2 border-teal-500/20 bg-gradient-to-r from-gray-900/50 via-gray-800/50 to-gray-900/50">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <Button onClick={onBack} variant="secondary" className="!text-sm !gap-2 !px-4 !py-2.5 flex-shrink-0 !border-2 !border-gray-700/50 hover:!border-teal-500/50">
                        <ArrowLeftIcon className="w-4 h-4" /> Back to List
                    </Button>
                    <h2 className="text-2xl font-bold text-white truncate flex-1 text-center bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">{item.data.name}</h2>
                    <div className="w-28 flex-shrink-0"></div>
                </div>

                {/* Tab Navigation (only show for characters) */}
                {isCharacter && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setActiveTab('main')}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
                                activeTab === 'main'
                                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/50 border-teal-400'
                                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300 border-gray-700/50 hover:border-teal-500/30'
                            }`}
                        >
                            Generation Studio
                        </button>
                        <button
                            onClick={() => setActiveTab('identity')}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 border-2 ${
                                activeTab === 'identity'
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 border-purple-400'
                                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300 border-gray-700/50 hover:border-purple-500/30'
                            }`}
                        >
                            <UploadIcon className="w-4 h-4" />
                            Character Identity
                        </button>
                    </div>
                )}
            </header>

            {/* Main Content: Conditional based on active tab */}
            {activeTab === 'identity' && isCharacter && character ? (
                <main className="flex-1 overflow-y-auto p-6">
                    <CharacterIdentityTestPanel
                        character={character}
                        onTestsComplete={(tests) => {
                            // Update character with new tests
                            onUpdateBatch(prev => ({
                                ...prev,
                                identity: {
                                    ...(prev as AnalyzedCharacter).identity!,
                                    tests
                                }
                            }));
                        }}
                        onApprovalChange={(approved) => {
                            // Update character approval status
                            onUpdateBatch(prev => ({
                                ...prev,
                                identity: {
                                    ...(prev as AnalyzedCharacter).identity!,
                                    approvalStatus: approved ? 'approved' : 'rejected'
                                }
                            }));
                        }}
                    />
                </main>
            ) : (
                <main className="flex-1 overflow-hidden flex">
                    {/* LEFT SIDEBAR: Image Slot Manager */}
                    <aside className="w-96 border-r-2 border-teal-500/20 flex flex-col bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
                    <div className="p-5 border-b-2 border-gray-800/50 bg-gray-900/30">
                        <h3 className="text-base font-bold text-teal-400 uppercase tracking-wide flex items-center gap-2">
                            <ImagePlusIcon className="w-5 h-5" />
                            Image Variants
                        </h3>
                        <p className="text-xs text-gray-500 mt-1.5 font-medium">{validGenerations.length} generated • {4 - validGenerations.length} slots available</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {/* Main image slot with enhanced border */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                Main Image
                            </h4>
                            {item.data.imageUrl ? (
                                <div
                                    className={`relative group rounded-xl overflow-hidden cursor-pointer border-3 transition-all ${!currentImage ? 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)]' : 'border-gray-700/50 hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`}
                                    onClick={() => setSelectedImageIndex(-1)}
                                >
                                    <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-xl pointer-events-none"></div>
                                    <img src={item.data.imageUrl} alt="Main" className="w-full h-64 object-contain bg-black/20" />
                                    <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-lg">MAIN</div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                        <p className="text-white font-bold text-sm">View Main Image</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative rounded-xl overflow-hidden border-3 border-dashed border-gray-700/50 bg-gray-800/20 h-64 flex items-center justify-center">
                                    <div className="text-center">
                                        <ImagePlusIcon className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500 font-semibold">No Main Image</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Generated variants with slot labels */}
                        {imageSlots.slice(1).map((slot, slotIndex) => {
                            const generation = validGenerations[slotIndex];
                            const isSelected = selectedImageIndex === slotIndex;
                            const borderColorClass = slot.color === 'blue' ? 'border-blue-500' : slot.color === 'purple' ? 'border-purple-500' : 'border-pink-500';
                            const shadowColorClass = slot.color === 'blue' ? 'shadow-[0_0_25px_rgba(59,130,246,0.4)]' : slot.color === 'purple' ? 'shadow-[0_0_25px_rgba(168,85,247,0.4)]' : 'shadow-[0_0_25px_rgba(236,72,153,0.4)]';
                            const bgColorClass = slot.color === 'blue' ? 'from-blue-500 to-cyan-500' : slot.color === 'purple' ? 'from-purple-500 to-pink-500' : 'from-pink-500 to-rose-500';

                            return (
                                <div key={slot.id} className="space-y-2">
                                    <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-${slot.color}-400`}>
                                        <div className={`w-2 h-2 rounded-full bg-${slot.color}-500 ${generation ? 'animate-pulse' : ''}`}></div>
                                        {slot.label}
                                    </h4>
                                    {generation ? (
                                        <div
                                            className={`relative group rounded-xl overflow-hidden cursor-pointer border-3 transition-all ${isSelected ? `${borderColorClass} ${shadowColorClass}` : 'border-gray-700/50 hover:border-teal-500/60 hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]'}`}
                                            onClick={() => setSelectedImageIndex(slotIndex)}
                                        >
                                            <div className={`absolute inset-0 border-2 ${borderColorClass}/50 rounded-xl pointer-events-none`}></div>
                                            <img src={generation.url!} alt={`${slot.label}`} className="w-full h-64 object-contain bg-black/20" />
                                            <div className={`absolute top-2.5 left-2.5 bg-gradient-to-r ${bgColorClass} text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-lg`}>#{slotIndex + 1}</div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSetMainImage(generation.url!);
                                                        }}
                                                        className="bg-emerald-500 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-emerald-400 transition shadow-lg border-2 border-emerald-400"
                                                    >
                                                        Set as Main
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingGeneration(generation);
                                                        }}
                                                        className="bg-teal-500 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-teal-400 transition shadow-lg border-2 border-teal-400"
                                                    >
                                                        Refine
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative rounded-xl overflow-hidden border-3 border-dashed border-gray-700/50 bg-gray-800/20 h-64 flex items-center justify-center">
                                            <div className="text-center">
                                                <ImagePlusIcon className="w-8 h-8 text-gray-600 mx-auto mb-1.5" />
                                                <p className="text-xs text-gray-500 font-semibold">Empty Slot</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Loading generations */}
                        {allGenerations.filter(g => g.isLoading).map((gen, idx) => (
                            <div key={gen.id} className="space-y-2">
                                <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                                    Generating #{validGenerations.length + idx + 1}
                                </h4>
                                <div className="rounded-xl overflow-hidden border-3 border-yellow-500/30">
                                    <LoadingSkeleton aspectRatio={gen.aspectRatio} progress={gen.progress || 0} />
                                </div>
                            </div>
                        ))}

                        {/* Empty state */}
                        {validGenerations.length === 0 && !allGenerations.some(g => g.isLoading) && (
                            <div className="text-center py-12">
                                <ImagePlusIcon className="w-16 h-16 text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm font-semibold">No generations yet</p>
                                <p className="text-gray-600 text-xs mt-1.5">Use the form below to create variants</p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* CENTER: Main Display - with enhanced borders */}
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-8" style={{ paddingBottom: '12rem' }}>
                    {currentImage ? (
                        <div className="relative max-w-full max-h-full">
                            <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/30 via-emerald-500/30 to-teal-500/30 rounded-3xl blur-2xl"></div>
                            <div className="relative border-4 border-teal-500/40 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(20,184,166,0.3)]">
                                <div className="absolute inset-0 border-2 border-teal-400/60 rounded-2xl pointer-events-none"></div>
                                <img
                                    src={currentImage.url!}
                                    alt="Selected"
                                    className="max-w-full max-h-full object-contain bg-black/20"
                                />
                            </div>
                        </div>
                    ) : item.data.imageUrl ? (
                        <div className="relative max-w-full max-h-full">
                            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-emerald-500/30 rounded-3xl blur-2xl"></div>
                            <div className="relative border-4 border-emerald-500/40 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                                <div className="absolute inset-0 border-2 border-emerald-400/60 rounded-2xl pointer-events-none"></div>
                                <img
                                    src={item.data.imageUrl}
                                    alt="Main"
                                    className="max-w-full max-h-full object-contain bg-black/20"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <ImagePlusIcon className="w-20 h-20 text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-bold mb-2">No image selected</p>
                            <p className="text-gray-600 text-sm">Generate variants using the form below</p>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDEBAR: Video Generation Panel */}
                <aside className="w-[500px] border-l-2 border-purple-500/20 flex flex-col bg-gradient-to-b from-[#0a0a0a] to-[#050505] overflow-hidden">
                    <VideoGenerationPanel
                        item={item}
                        moodboard={moodboard}
                        moodboardTemplates={moodboardTemplates}
                        onUpdateItem={onUpdateBatch}
                    />
                </aside>
                </main>
            )}

            {/* Footer (only show for main tab, not identity tab) */}
            {activeTab === 'main' && (
            <footer className="flex-shrink-0 p-6 pt-4 z-20 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/95 to-transparent border-t border-gray-800/50">
                 <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="relative group">
                        {/* Gradient glow effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 rounded-[28px] opacity-20 group-hover:opacity-40 blur-xl transition-all duration-500" />

                        {/* Main container */}
                        <div className="relative backdrop-blur-2xl bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden">
                            {/* Top gradient line */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />

                            <div className="p-5 space-y-4">
                                {/* Attached image */}
                                {attachedImage && (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="relative self-start p-1.5 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 ml-3"
                                    >
                                        <img src={attachedImage} alt="Attached reference" className="w-20 h-20 object-cover rounded-xl"/>
                                        <motion.button
                                            whileHover={{ scale: 1.1, rotate: 90 }}
                                            whileTap={{ scale: 0.9 }}
                                            type="button"
                                            onClick={() => setAttachedImage(null)}
                                            className="absolute -top-2 -right-2 bg-red-500/90 text-white rounded-full p-1.5 hover:bg-red-600 transition-all shadow-lg shadow-red-500/50"
                                        >
                                            <XIcon className="w-3.5 h-3.5" />
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* Input area */}
                                <div className="relative bg-gray-800/40 rounded-2xl border border-gray-700/30 p-4 focus-within:border-teal-500/50 focus-within:bg-gray-800/60 transition-all group/input">
                                    <div className="flex items-start gap-3">
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileAttach}/>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex-shrink-0 mt-1 p-2.5 text-gray-400 rounded-xl hover:bg-gradient-to-br hover:from-teal-500/20 hover:to-purple-500/20 hover:text-teal-400 transition-all border border-transparent hover:border-teal-500/30"
                                        >
                                            <PaperclipIcon className="w-5 h-5"/>
                                        </motion.button>
                                        <textarea
                                            value={detailedPrompt}
                                            onChange={(e) => setDetailedPrompt(e.target.value)}
                                            placeholder={`Describe a visual for ${item.data.name}...`}
                                            rows={3}
                                            className="flex-1 bg-transparent text-base resize-none focus:outline-none max-h-40 py-2 text-gray-100 placeholder-gray-500 leading-relaxed"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey && detailedPrompt.trim()) {
                                                    e.preventDefault();
                                                    handleGenerate();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Controls row */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <select
                                            value={model}
                                            onChange={e => setModel(e.target.value as 'Imagen' | 'Gemini Nano Banana' | 'Flux' | 'Flux Kontext Max Multi')}
                                            className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 hover:from-gray-700 hover:to-gray-800 text-white text-xs rounded-xl font-semibold px-4 py-2.5 appearance-none focus:outline-none cursor-pointer border border-gray-600/50 hover:border-teal-500/50 transition-all backdrop-blur-sm shadow-lg"
                                        >
                                            <option className="bg-gray-800 text-white">Imagen</option>
                                            <option className="bg-gray-800 text-white">Gemini Nano Banana</option>
                                            <option className="bg-gray-800 text-white">Flux</option>
                                            <option className="bg-gray-800 text-white" value="Flux Kontext Max Multi">Flux Kontext Max Multi (FAL)</option>
                                        </select>
                                        <select
                                            value={aspectRatio}
                                            onChange={e => setAspectRatio(e.target.value)}
                                            className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 hover:from-gray-700 hover:to-gray-800 text-white text-xs rounded-xl font-semibold px-4 py-2.5 appearance-none focus:outline-none cursor-pointer border border-gray-600/50 hover:border-teal-500/50 transition-all backdrop-blur-sm shadow-lg"
                                        >
                                            <option className="bg-gray-800 text-white">16:9</option>
                                            <option className="bg-gray-800 text-white">9:16</option>
                                            <option className="bg-gray-800 text-white">1:1</option>
                                            <option className="bg-gray-800 text-white">4:3</option>
                                            <option className="bg-gray-800 text-white">3:4</option>
                                        </select>
                                    </div>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={!detailedPrompt.trim()}
                                            className="relative overflow-hidden !bg-gradient-to-r !from-white !via-gray-100 !to-white !text-black !font-bold !py-3 !px-8 !rounded-xl hover:!shadow-2xl hover:!shadow-teal-500/20 !transition-all disabled:!opacity-50 disabled:!cursor-not-allowed disabled:hover:!scale-100 group/btn"
                                        >
                                            <span className="relative z-10 flex items-center gap-2">
                                                Generate
                                                <motion.span
                                                    animate={{ x: [0, 3, 0] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                    className="text-teal-600"
                                                >
                                                    →
                                                </motion.span>
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/20 to-purple-500/0 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
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
    );
};

const Card: React.FC<{
    item: AnalyzedCharacter | AnalyzedLocation;
    icon: React.ReactNode;
    onClick: () => void;
    onAttach: () => void;
    onDelete: () => void;
    onPrepareIdentity?: () => void;
}> = ({ item, icon, onClick, onAttach, onDelete, onPrepareIdentity }) => {
    const { isDark } = useTheme();
    const hasImage = !!item.imageUrl;
    const variantCount = item.generations?.length || 0;

    // Check if this is a character with identity status
    const character = 'identity' in item ? (item as AnalyzedCharacter) : null;
    const identityStatus = character ? getCharacterIdentityStatus(character.identity) : 'none';

    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`group relative rounded-2xl overflow-hidden ${
                isDark
                    ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800/50'
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            } hover:border-teal-500/50 transition-all hover:shadow-2xl ${
                isDark ? 'hover:shadow-teal-500/20' : 'hover:shadow-teal-500/30'
            }`}
        >
            {/* Status Badges */}
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
                {/* Image Status Badge */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                        hasImage
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-500/20 text-gray-500 border border-gray-500/30'
                    }`}
                >
                    {hasImage ? 'Ready' : 'Draft'}
                </motion.div>

                {/* Identity Status Badge (only for characters) */}
                {character && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        role="status"
                        aria-label={`Character identity status: ${identityStatus === 'ready' ? 'Ready' : identityStatus === 'preparing' ? 'Training in progress' : identityStatus === 'error' ? 'Error occurred' : 'Not prepared'}`}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1 ${
                            identityStatus === 'ready'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : identityStatus === 'preparing'
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : identityStatus === 'error'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-gray-500/20 text-gray-500 border border-gray-500/30'
                        }`}
                    >
                        {identityStatus === 'ready' && <CheckCircleIcon className="w-3 h-3" />}
                        {identityStatus === 'error' && <AlertCircleIcon className="w-3 h-3" />}
                        {identityStatus === 'preparing' && (
                            <svg className="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {identityStatus === 'ready' ? 'Identity' : identityStatus === 'preparing' ? 'Training' : identityStatus === 'error' ? 'Error' : 'No ID'}
                    </motion.div>
                )}
            </div>

            {/* Image Section */}
            <div onClick={onClick} className="cursor-pointer relative">
                <div className="aspect-[4/3] relative overflow-hidden bg-black/5">
                    {hasImage ? (
                        <>
                            <motion.img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.6 }}
                            />
                            {/* Gradient Overlays */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className={`absolute inset-0 bg-gradient-to-br ${
                                isDark ? 'from-teal-500/10 to-purple-500/10' : 'from-teal-400/20 to-purple-400/20'
                            } opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                        </>
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                            isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-200'
                        }`}>
                            <div className={`${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
                                {icon}
                            </div>
                        </div>
                    )}

                    {/* Hover Overlay with Actions */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <motion.div
                                initial={{ scale: 0 }}
                                whileHover={{ scale: 1.2 }}
                                className="text-white"
                            >
                                <ExpandIcon className="w-10 h-10" />
                            </motion.div>
                            <p className="text-white font-bold text-sm">Open Studio</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-3 left-3 flex gap-2 opacity-100 transition-opacity z-20">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            aria-label={`Delete ${item.name}`}
                            className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
                                isDark
                                    ? 'bg-black/70 text-gray-300 hover:bg-red-500/90 hover:text-white'
                                    : 'bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white'
                            }`}
                        >
                            <Trash2Icon className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); onAttach(); }}
                            aria-label={`Attach image for ${item.name}`}
                            className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
                                isDark
                                    ? 'bg-black/70 text-gray-300 hover:bg-teal-500/90 hover:text-white'
                                    : 'bg-white/90 text-gray-600 hover:bg-teal-500 hover:text-white'
                            }`}
                        >
                            <ImagePlusIcon className="w-4 h-4" />
                        </motion.button>
                        {/* Prepare Identity Button (only for characters) */}
                        {character && onPrepareIdentity && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onPrepareIdentity(); }}
                                aria-label={`Prepare identity for ${item.name}`}
                                className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
                                    isDark
                                        ? 'bg-black/70 text-gray-300 hover:bg-purple-500/90 hover:text-white'
                                        : 'bg-white/90 text-gray-600 hover:bg-purple-500 hover:text-white'
                                }`}
                            >
                                <UploadIcon className="w-4 h-4" />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                    <h5 className={`text-lg font-bold mb-2 line-clamp-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        {item.name}
                    </h5>
                    <p className={`text-sm leading-relaxed line-clamp-2 mb-4 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        {item.description}
                    </p>

                    {/* Footer with Stats */}
                    <div className={`flex items-center justify-between pt-3 border-t ${
                        isDark ? 'border-gray-800' : 'border-gray-200'
                    }`}>
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={hasImage ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`w-2 h-2 rounded-full ${hasImage ? 'bg-green-500' : 'bg-gray-500'}`}
                            />
                            <span className={`text-xs font-medium ${
                                hasImage
                                    ? 'text-green-400'
                                    : isDark ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                                {hasImage ? 'Image Set' : 'No Image'}
                            </span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                            variantCount > 0
                                ? isDark
                                    ? 'bg-teal-500/10 border border-teal-500/20'
                                    : 'bg-teal-50 border border-teal-200'
                                : isDark
                                    ? 'bg-gray-800/50 border border-gray-700'
                                    : 'bg-gray-100 border border-gray-200'
                        }`}>
                            <span className={`text-[10px] font-bold ${
                                variantCount > 0
                                    ? 'text-teal-400'
                                    : isDark ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                                {variantCount}
                            </span>
                            <span className={`text-[10px] font-medium ${
                                variantCount > 0
                                    ? isDark ? 'text-teal-300' : 'text-teal-600'
                                    : isDark ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                                {variantCount === 1 ? 'variant' : 'variants'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

interface CastLocationsTabProps {
    characters: AnalyzedCharacter[];
    setCharacters: React.Dispatch<React.SetStateAction<AnalyzedCharacter[]>>;
    locations: AnalyzedLocation[];
    setLocations: React.Dispatch<React.SetStateAction<AnalyzedLocation[]>>;
    moodboard?: Moodboard;
    moodboardTemplates?: MoodboardTemplate[];
}

const CastLocationsTab: React.FC<CastLocationsTabProps> = ({ characters, setCharacters, locations, setLocations, moodboard, moodboardTemplates = [] }) => {
    const [selectedItem, setSelectedItem] = useState<GenerationItem | null>(null);
    const [itemToUpdate, setItemToUpdate] = useState<{ id: string; type: 'character' | 'location' } | null>(null);
    const attachImageInputRef = useRef<HTMLInputElement>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState<'character' | 'location' | null>(null);
    const [identityModalCharacter, setIdentityModalCharacter] = useState<AnalyzedCharacter | null>(null);
    
    const handleItemUpdateBatch = (updater: (prev: AnalyzedCharacter | AnalyzedLocation) => AnalyzedCharacter | AnalyzedLocation) => {
         if (selectedItem?.type === 'character') {
            setCharacters(prevChars => prevChars.map(c => c.id === selectedItem.data.id ? updater(c) as AnalyzedCharacter : c));
        } else if (selectedItem?.type === 'location') {
            setLocations(prevLocs => prevLocs.map(l => l.id === selectedItem.data.id ? updater(l) as AnalyzedLocation : l));
        }
    };
    
    useEffect(() => {
        if (!selectedItem) return;

        const collection = selectedItem.type === 'character' ? characters : locations;
        const currentItemData = collection.find(item => item.id === selectedItem.data.id);
        if (!currentItemData) return;

        setSelectedItem(prev => {
            if (!prev) return null;
            if (prev.data === currentItemData) {
                return prev; // Avoid creating a new object when nothing changed
            }
            return { ...prev, data: currentItemData };
        });
    }, [characters, locations, selectedItem]);
    
    const handleAttachClick = (item: AnalyzedCharacter | AnalyzedLocation, type: 'character' | 'location') => {
        setItemToUpdate({ id: item.id, type });
        attachImageInputRef.current?.click();
    };

    const handleFileAttached = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0] && itemToUpdate) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                if (itemToUpdate.type === 'character') {
                    setCharacters(chars => chars.map(c => c.id === itemToUpdate.id ? { ...c, imageUrl } : c));
                } else {
                    setLocations(locs => locs.map(l => l.id === itemToUpdate.id ? { ...l, imageUrl } : l));
                }
                setItemToUpdate(null);
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const handleAddNewItem = (e: React.FormEvent, name: string, description: string) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (isAddModalOpen === 'character') {
            const newCharacter: AnalyzedCharacter = {
                id: `c${characters.length + 1}-${Date.now()}`,
                name: name.trim(),
                description: description.trim() || 'No description provided.',
                imageUrl: null,
                generations: [],
                refinedGenerationUrls: [],
                identity: undefined,
            };
            setCharacters(prev => [...prev, newCharacter]);
        } else if (isAddModalOpen === 'location') {
             const newLocation: AnalyzedLocation = {
                id: `l${locations.length + 1}-${Date.now()}`,
                name: name.trim(),
                description: description.trim() || 'No description provided.',
                imageUrl: null,
                generations: [],
                refinedGenerationUrls: [],
            };
            setLocations(prev => [...prev, newLocation]);
        }
        setIsAddModalOpen(null);
    };

    const handleDeleteItem = (id: string, type: 'character' | 'location') => {
        if (type === 'character') {
            setCharacters(prev => prev.filter(c => c.id !== id));
        } else {
            setLocations(prev => prev.filter(l => l.id !== id));
        }
    };

    const handleIdentitySuccess = (characterId: string, identity: CharacterIdentity) => {
        setCharacters(prev => prev.map(c => c.id === characterId ? { ...c, identity } : c));
        setIdentityModalCharacter(null);
    };


    if (selectedItem) {
        return <GenerationView
                  item={selectedItem}
                  onBack={() => setSelectedItem(null)}
                  onUpdateBatch={handleItemUpdateBatch}
                  moodboard={moodboard}
                  moodboardTemplates={moodboardTemplates}
                />;
    }

    const { isDark } = useTheme();

    return (
        <div className="min-h-full">
            <div className="space-y-12 pb-20">
                <AddItemModal
                    isOpen={!!isAddModalOpen}
                    type={isAddModalOpen!}
                    onClose={() => setIsAddModalOpen(null)}
                    onSubmit={handleAddNewItem}
                />
                {identityModalCharacter && (
                    <CharacterIdentityModal
                        isOpen={true}
                        characterId={identityModalCharacter.id}
                        characterName={identityModalCharacter.name}
                        onClose={() => setIdentityModalCharacter(null)}
                        onSuccess={(identity) => handleIdentitySuccess(identityModalCharacter.id, identity)}
                    />
                )}
                <input type="file" ref={attachImageInputRef} onChange={handleFileAttached} className="hidden" accept="image/*" />

                {/* Hero Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                >
                <div className="relative z-10">
                    <h2 className={`text-3xl font-bold mb-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        Cast & Locations
                    </h2>
                    <p className={`text-base max-w-2xl ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        Develop the visual identity for your characters and settings. Click any card to enter the Generation Studio and create stunning visuals.
                    </p>
                </div>
                {/* Decorative Gradient */}
                <div className={`absolute -top-8 -right-8 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
                    isDark ? 'bg-gradient-to-br from-teal-500 to-purple-500' : 'bg-gradient-to-br from-teal-400 to-purple-400'
                }`} />
            </motion.header>

            {/* Cast Section */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                            isDark
                                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                                : 'bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-200'
                        }`}>
                            <UsersIcon className={`w-6 h-6 ${
                                isDark ? 'text-purple-400' : 'text-purple-600'
                            }`} />
                        </div>
                        <div>
                            <h3 className={`text-2xl font-bold ${
                                isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                                Cast
                            </h3>
                            <p className={`text-sm ${
                                isDark ? 'text-gray-500' : 'text-gray-600'
                            }`}>
                                {characters.length} {characters.length === 1 ? 'character' : 'characters'}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsAddModalOpen('character')}
                        variant="secondary"
                        className="!py-2.5 !px-5 !rounded-xl !font-semibold"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Character</span>
                    </Button>
                </div>
                {characters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {characters.map((char, index) => (
                            <motion.div
                                key={char.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card
                                    item={char}
                                    icon={<UsersIcon className="w-12 h-12" />}
                                    onClick={() => setSelectedItem({ type: 'character', data: char })}
                                    onAttach={() => handleAttachClick(char, 'character')}
                                    onDelete={() => handleDeleteItem(char.id, 'character')}
                                    onPrepareIdentity={() => setIdentityModalCharacter(char)}
                                />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`flex flex-col items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed ${
                            isDark ? 'border-gray-800 bg-gray-900/20' : 'border-gray-300 bg-gray-50'
                        }`}
                    >
                        <UsersIcon className={`w-16 h-16 mb-4 ${
                            isDark ? 'text-gray-700' : 'text-gray-400'
                        }`} />
                        <p className={`text-lg font-semibold mb-2 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            No characters yet
                        </p>
                        <p className={`text-sm mb-6 ${
                            isDark ? 'text-gray-600' : 'text-gray-500'
                        }`}>
                            Add your first character to get started
                        </p>
                        <Button
                            onClick={() => setIsAddModalOpen('character')}
                            variant="primary"
                            className="!py-2.5 !px-6"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Add Character</span>
                        </Button>
                    </motion.div>
                )}
            </motion.section>

            {/* Locations Section */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                            isDark
                                ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30'
                                : 'bg-gradient-to-br from-teal-100 to-cyan-100 border border-teal-200'
                        }`}>
                            <MapPinIcon className={`w-6 h-6 ${
                                isDark ? 'text-teal-400' : 'text-teal-600'
                            }`} />
                        </div>
                        <div>
                            <h3 className={`text-2xl font-bold ${
                                isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                                Locations
                            </h3>
                            <p className={`text-sm ${
                                isDark ? 'text-gray-500' : 'text-gray-600'
                            }`}>
                                {locations.length} {locations.length === 1 ? 'location' : 'locations'}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsAddModalOpen('location')}
                        variant="secondary"
                        className="!py-2.5 !px-5 !rounded-xl !font-semibold"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Location</span>
                    </Button>
                </div>
                {locations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {locations.map((loc, index) => (
                            <motion.div
                                key={loc.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card
                                    item={loc}
                                    icon={<MapPinIcon className="w-12 h-12" />}
                                    onClick={() => setSelectedItem({ type: 'location', data: loc })}
                                    onAttach={() => handleAttachClick(loc, 'location')}
                                    onDelete={() => handleDeleteItem(loc.id, 'location')}
                                />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`flex flex-col items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed ${
                            isDark ? 'border-gray-800 bg-gray-900/20' : 'border-gray-300 bg-gray-50'
                        }`}
                    >
                        <MapPinIcon className={`w-16 h-16 mb-4 ${
                            isDark ? 'text-gray-700' : 'text-gray-400'
                        }`} />
                        <p className={`text-lg font-semibold mb-2 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            No locations yet
                        </p>
                        <p className={`text-sm mb-6 ${
                            isDark ? 'text-gray-600' : 'text-gray-500'
                        }`}>
                            Add your first location to get started
                        </p>
                        <Button
                            onClick={() => setIsAddModalOpen('location')}
                            variant="primary"
                            className="!py-2.5 !px-6"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Add Location</span>
                        </Button>
                    </motion.div>
                )}
            </motion.section>
            </div>
        </div>
    );
};

export default CastLocationsTab;
