
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScriptAnalysis, AnalyzedScene, Frame, Generation, AnalyzedCharacter, AnalyzedLocation, Moodboard, FrameStatus } from '../types';
import Button from '../components/Button';
import { generateStillVariants, refineVariant, upscaleImage, animateFrame, upscaleVideo } from '../services/aiService';
import { ArrowLeftIcon, FilmIcon, PlusIcon, AlkemyLoadingIcon, Trash2Icon, XIcon, ImagePlusIcon, FourKIcon, PlayIcon, PaperclipIcon, ArrowRightIcon, SendIcon, CheckIcon, ExpandIcon, BoxIcon } from '../components/icons/Icons';
import ThreeDWorldViewer from '../components/3DWorldViewer';
import { generate3DWorld } from '../services/3dWorldService';

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
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                <video src={url} controls autoPlay loop className="max-w-full max-h-full" />
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors"
                    aria-label="Close viewer"
                >
                    <XIcon className="w-6 h-6" />
                </button>
                <Button
                    onClick={onSelect}
                    variant="primary"
                    className="absolute top-4 right-4"
                >
                    Select Video
                </Button>
            </div>
        </div>
    );
};

// --- FullScreen Image Viewer Modal ---
const FullScreenImagePlayer: React.FC<{
    generation: Generation;
    onClose: () => void;
    onSetFrame: (type: 'start' | 'end', imageUrl: string) => void;
    onRefine: () => void;
}> = ({ generation, onClose, onSetFrame, onRefine }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!generation.url) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                <img src={generation.url} alt="Fullscreen generated shot" className="max-w-full max-h-full object-contain" />
                <Button onClick={onClose} variant="secondary" className="absolute top-4 left-4 !text-sm !gap-2 !px-3 !py-2">
                    <ArrowLeftIcon className="w-4 h-4" /> Back
                </Button>
                <div className="absolute top-4 right-4 flex gap-2">
                     <Button onClick={() => onSetFrame('start', generation.url!)} variant="secondary">Set as Hero Frame</Button>
                     <Button onClick={() => onSetFrame('end', generation.url!)} variant="secondary">Set as End Frame</Button>
                     <Button onClick={onRefine} variant="primary">Refine</Button>
                </div>
            </div>
        </div>
    );
};


// --- Shared Loading Component ---
const LoadingSkeleton: React.FC<{ aspectRatio: string; progress: number }> = ({ aspectRatio, progress }) => (
    <div className={`relative w-full h-full bg-black/20 flex flex-col items-center justify-center rounded-lg ${aspectRatioClasses[aspectRatio] || 'aspect-square'}`}>
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


// --- Refinement Studio (for Shots) ---
const RefinementStudio: React.FC<{
    baseGeneration: Generation;
    onClose: () => void;
    onUpdateFrame: (updater: (prev: Frame) => Frame) => void;
}> = ({ baseGeneration, onClose, onUpdateFrame }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentBaseImage, setCurrentBaseImage] = useState(baseGeneration.url!);
    const [sessionVariants, setSessionVariants] = useState<string[]>([]);
    const [upscalingVariant, setUpscalingVariant] = useState<string | null>(null);
    const [upscaleProgress, setUpscaleProgress] = useState(0);

    const handleGenerate = async () => {
        if (!prompt.trim() || !currentBaseImage) return;
        setIsGenerating(true);
        try {
            const newUrl = await refineVariant(prompt, currentBaseImage, baseGeneration.aspectRatio);
            setSessionVariants(prev => [newUrl, ...prev]);
            
            onUpdateFrame(prevFrame => ({
                ...prevFrame,
                generations: [...(prevFrame.generations || []), { id: `gen-${Date.now()}`, url: newUrl, aspectRatio: baseGeneration.aspectRatio, isLoading: false }],
                refinedGenerationUrls: [...(prevFrame.refinedGenerationUrls || []), newUrl],
            }));
            
            setCurrentBaseImage(newUrl);
            setPrompt('');
        } catch (error) {
            alert(`Error refining variant: ${error instanceof Error ? error.message : 'Unknown Error'}`);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSetMainImage = (imageUrl: string) => {
        onUpdateFrame(prev => ({...prev, media: { ...prev.media, start_frame_url: imageUrl }, status: FrameStatus.GeneratedStill }));
    };

    const handleSetMainAndClose = (imageUrl: string) => {
        handleSetMainImage(imageUrl);
        onClose();
    };

    const handleUpscale = async (imageUrl: string) => {
        setUpscalingVariant(imageUrl);
        setUpscaleProgress(0);
        try {
            const { image_url } = await upscaleImage(imageUrl, (progress) => {
                setUpscaleProgress(progress);
            });
            onUpdateFrame(prev => ({ ...prev, media: { ...prev.media, upscaled_start_frame_url: image_url }, status: FrameStatus.UpscaledImageReady }));
            onClose(); // Close refinement studio after upscale
        } catch (error) {
            alert(`Error upscaling image: ${error instanceof Error ? error.message : 'Unknown Error'}`);
        } finally {
            setUpscalingVariant(null);
            setUpscaleProgress(0);
        }
    };
    
    const allDisplayableVariants = [baseGeneration.url!, ...sessionVariants];

    return (
        <div className="fixed inset-0 bg-[#0B0B0B] flex flex-col z-50 p-6">
            <header className="flex-shrink-0 mb-4 flex justify-between items-center">
                <Button onClick={onClose} variant="secondary" className="!text-sm !gap-2 !px-3 !py-2"><ArrowLeftIcon className="w-4 h-4" /> Back to Still Studio</Button>
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
                                                    <Button variant="secondary" className="!text-xs !py-1 !px-3 !bg-white/90 !text-black" onClick={(e) => { e.stopPropagation(); handleSetMainAndClose(url); }}>Set as Main</Button>
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

                <div className="flex-shrink-0 flex justify-center pb-2">
                     <div className="w-full max-w-4xl">
                        {/* Multi-layered animated gradient glow container */}
                        <div className="relative group">
                            {/* Animated gradient glow */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 rounded-[28px] opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500"></div>

                            {/* Main content container with glassmorphism */}
                            <div className="relative backdrop-blur-2xl bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 rounded-3xl p-5 border border-gray-700/30 shadow-2xl">
                                {/* Input area with gradient border on focus */}
                                <div className="relative group/input">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/0 via-purple-500/0 to-pink-500/0 group-focus-within/input:from-teal-500/20 group-focus-within/input:via-purple-500/20 group-focus-within/input:to-pink-500/20 rounded-2xl blur transition-all duration-300"></div>
                                    <div className="relative flex items-center gap-3 bg-gray-800/40 rounded-2xl p-3 border border-gray-700/30 focus-within:border-teal-500/50 focus-within:bg-gray-800/60 transition-all">
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    if (prompt.trim() && !isGenerating) handleGenerate();
                                                }
                                            }}
                                            placeholder="e.g., make the character smile, add cinematic lighting... (Press Enter)"
                                            rows={1}
                                            className="flex-1 bg-transparent text-base resize-none focus:outline-none max-h-32 py-1 text-gray-100 placeholder-gray-500"
                                        />
                                        <div className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 text-white text-xs rounded-xl font-semibold px-4 py-2.5 whitespace-nowrap border border-gray-600/50 shadow-lg backdrop-blur-sm">
                                            Gemini Nano Banana
                                        </div>
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={isGenerating || !prompt.trim()}
                                            isLoading={isGenerating}
                                            className="!bg-gradient-to-r !from-white !via-gray-100 !to-white !text-black !font-bold !py-2.5 !px-6 !rounded-xl hover:!shadow-2xl hover:!scale-105 !transition-all flex-shrink-0 disabled:!opacity-50 disabled:!cursor-not-allowed disabled:hover:!scale-100 !gap-2 !shadow-lg"
                                        >
                                            <span>Refine</span>
                                            <motion.span
                                                animate={{ x: [0, 3, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                                className="text-lg"
                                            >
                                                →
                                            </motion.span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
}> = ({ frame, onBack, onUpdateFrame, onEnterRefinement, moodboard, moodboardTemplates, characters, locations }) => {
    const [detailedPrompt, setDetailedPrompt] = useState('');
    const [model, setModel] = useState<'Imagen' | 'Gemini Nano Banana' | 'Flux'>('Imagen');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');
    const [promptWasAdjusted, setPromptWasAdjusted] = useState(false);
    const [viewingGeneration, setViewingGeneration] = useState<Generation | null>(null);


    const handleGenerate = async () => {
        if (!detailedPrompt.trim()) {
            alert("Please enter a prompt.");
            return;
        }
        setPromptWasAdjusted(false);
        const N_GENERATIONS = 2;
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

            const { urls, errors, wasAdjusted } = await generateStillVariants(frame.id, model, detailedPrompt, referenceImages, [], aspectRatio, N_GENERATIONS, moodboard, moodboardTemplates || [], characterNames, locationName, onProgress);
            
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
                         currentGenerations[index] = { ...currentGenerations[index], url: url || null, isLoading: false, error: error || undefined };
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

    return (
        <div className="flex flex-col h-full">
            {viewingGeneration && (
                <FullScreenImagePlayer
                    generation={viewingGeneration}
                    onClose={() => setViewingGeneration(null)}
                    onSetFrame={(type, url) => {
                        handleSetFrame(type, url);
                        setViewingGeneration(null);
                    }}
                    onRefine={() => {
                        onEnterRefinement(viewingGeneration);
                        setViewingGeneration(null);
                    }}
                />
            )}
            <header className="flex-shrink-0 p-6 pb-4"><Button onClick={onBack} variant="secondary" className="!text-sm !gap-2 !px-3 !py-2"><ArrowLeftIcon className="w-4 h-4" /> Back to Compositing</Button></header>

            <main className="flex-1 overflow-y-auto px-6 pb-8">
                 <div>
                    {(frame.media?.start_frame_url || frame.media?.end_frame_url) && (
                        <div className="mb-8">
                            <h4 className={`text-lg font-semibold mb-3 text-[var(--color-text-primary)]`}>Hero Frames</h4>
                            <div className="flex gap-4 justify-center">
                                {frame.media.start_frame_url && (
                                    <div className="text-center">
                                        <img src={frame.media.start_frame_url} alt="Start frame" className="rounded-lg w-72 h-40 object-cover border-2 border-green-500"/>
                                        <p className="text-xs text-gray-400 mt-1">Hero Frame</p>
                                    </div>
                                )}
                                {frame.media.end_frame_url && (
                                    <div className="text-center">
                                        <img src={frame.media.end_frame_url} alt="End frame" className="rounded-lg w-72 h-40 object-cover border-2 border-blue-500"/>
                                        <p className="text-xs text-gray-400 mt-1">End Frame</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(frame.generations || []).map((generation) => (
                           <div key={generation.id} onClick={() => generation.url && setViewingGeneration(generation)} className={`relative group rounded-lg overflow-hidden ${aspectRatioClasses[generation.aspectRatio] || 'aspect-square'} bg-black/10 ${generation.url ? 'cursor-pointer' : ''}`}>
                                {generation.isLoading ? <LoadingSkeleton aspectRatio={generation.aspectRatio} progress={generation.progress || 0} /> : 
                                 generation.url ? (
                                    <>
                                        <img src={generation.url} alt={`Generated shot`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                                            <ExpandIcon className="w-8 h-8 text-white" />
                                        </div>
                                        <button onClick={(e) => handleDeleteGeneration(e, generation.id)} className="absolute top-1.5 right-1.5 p-1 bg-black/50 rounded-full text-gray-300 hover:text-red-500 hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100" aria-label="Delete"><Trash2Icon className="w-3 h-3" /></button>
                                    </>
                                ) : (
                                    <div className="p-2 text-center flex flex-col items-center justify-center h-full bg-red-900/20">
                                        <p className="text-xs text-red-400 font-semibold">Generation Failed</p>
                                        <p className="text-[10px] text-gray-400 mt-1 line-clamp-3">{generation.error}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="flex-shrink-0 p-6 pt-4 border-t border-gray-800/50">
                 <div className="max-w-4xl mx-auto">
                    {/* Multi-layered animated gradient glow container */}
                    <div className="relative group">
                        {/* Animated gradient glow */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 rounded-[28px] opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500"></div>

                        {/* Main content container with glassmorphism */}
                        <div className="relative backdrop-blur-2xl bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 rounded-3xl p-5 border border-gray-700/30 shadow-2xl">
                            {promptWasAdjusted && (
                                <div className="text-xs text-yellow-400/90 px-4 py-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20 mb-3 backdrop-blur-sm">
                                    <span className="font-semibold">Note:</span> Your prompt was adjusted for safety.
                                </div>
                            )}
                            {attachedImage && (
                                <div className="relative self-start p-1.5 bg-gray-800/60 backdrop-blur-sm rounded-2xl ml-3 mb-3 border border-gray-700/50 shadow-lg">
                                    <img src={attachedImage} alt="Attached reference" className="w-20 h-20 object-cover rounded-xl"/>
                                    <button type="button" onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-red-500/90 text-white rounded-full p-1 hover:bg-red-600 hover:scale-110 transition-all shadow-lg">
                                        <XIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            {/* Input area with gradient border on focus */}
                            <div className="relative group/input mb-3">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/0 via-purple-500/0 to-pink-500/0 group-focus-within/input:from-teal-500/20 group-focus-within/input:via-purple-500/20 group-focus-within/input:to-pink-500/20 rounded-2xl blur transition-all duration-300"></div>
                                <div className="relative flex items-center gap-3 bg-gray-800/40 rounded-2xl p-3 border border-gray-700/30 focus-within:border-teal-500/50 focus-within:bg-gray-800/60 transition-all">
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileAttach}/>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 rounded-xl hover:bg-gray-700/50 hover:text-white transition-all hover:scale-110">
                                        <PaperclipIcon className="w-5 h-5"/>
                                    </button>
                                    <textarea
                                        value={detailedPrompt}
                                        onChange={(e) => setDetailedPrompt(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                if (detailedPrompt.trim()) handleGenerate();
                                            }
                                        }}
                                        placeholder="Describe your shot in detail... (Press Enter to generate)"
                                        rows={1}
                                        className="flex-1 bg-transparent text-base resize-none focus:outline-none max-h-32 py-1 text-gray-100 placeholder-gray-500"
                                    />
                                </div>
                            </div>

                            {/* Controls row */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <select value={model} onChange={e => setModel(e.target.value as 'Imagen' | 'Gemini Nano Banana' | 'Flux')} className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 hover:from-gray-700 hover:to-gray-800 text-black text-xs rounded-xl font-semibold px-4 py-2.5 appearance-none focus:outline-none cursor-pointer border border-gray-600/50 hover:border-gray-500/70 transition-all shadow-lg backdrop-blur-sm">
                                        <option>Imagen</option><option>Gemini Nano Banana</option><option>Flux</option>
                                    </select>
                                    <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as string)} className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 hover:from-gray-700 hover:to-gray-800 text-black text-xs rounded-xl font-semibold px-4 py-2.5 appearance-none focus:outline-none cursor-pointer border border-gray-600/50 hover:border-gray-500/70 transition-all shadow-lg backdrop-blur-sm">
                                        <option>16:9</option><option>9:16</option><option>1:1</option><option>4:3</option><option>3:4</option>
                                    </select>
                                    <select value={selectedLocationId} onChange={e => setSelectedLocationId(e.target.value)} className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 hover:from-gray-700 hover:to-gray-800 text-black text-xs rounded-xl font-semibold px-4 py-2.5 appearance-none focus:outline-none cursor-pointer max-w-[140px] border border-gray-600/50 hover:border-gray-500/70 transition-all shadow-lg backdrop-blur-sm">
                                        <option value="">Location</option>
                                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                    <select multiple value={selectedCharacterIds} onChange={e => setSelectedCharacterIds(Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value))} className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 hover:from-gray-700 hover:to-gray-800 text-black text-xs rounded-xl font-semibold px-4 py-2.5 appearance-none focus:outline-none cursor-pointer max-w-[140px] border border-gray-600/50 hover:border-gray-500/70 transition-all shadow-lg backdrop-blur-sm">
                                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                {/* Modern Generate button with animated arrow */}
                                <Button
                                    onClick={handleGenerate}
                                    disabled={!detailedPrompt.trim()}
                                    className="!bg-gradient-to-r !from-white !via-gray-100 !to-white !text-black !font-bold !py-2.5 !px-6 !rounded-xl hover:!shadow-2xl hover:!scale-105 !transition-all disabled:!opacity-50 disabled:!cursor-not-allowed disabled:hover:!scale-100 !gap-2 !shadow-lg"
                                >
                                    <span>Generate</span>
                                    <motion.span
                                        animate={{ x: [0, 3, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                        className="text-lg"
                                    >
                                        →
                                    </motion.span>
                                </Button>
                            </div>
                        </div>
                    </div>
                 </div>
            </footer>
        </div>
    );
};

// --- Animate Studio ---
const AnimateStudio: React.FC<{
    frame: Frame;
    onBack: () => void;
    onUpdateFrame: (updater: (prev: Frame) => Frame) => void;
}> = ({ frame, onBack, onUpdateFrame }) => {
    const [motionPrompt, setMotionPrompt] = useState('');
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
            if (aspectRatio !== '16:9' && aspectRatio !== '9:16') {
                console.warn(`Veo only supports 16:9 and 9:16. Defaulting from ${aspectRatio} to 16:9.`);
                aspectRatio = '16:9';
            }

            const videoBlobs = await animateFrame(motionPrompt, startFrame, endFrame, N_VIDEO_GENERATIONS, aspectRatio, onProgress);
            const videoUrls = videoBlobs.map(blob => URL.createObjectURL(blob));

            onUpdateFrame(prevFrame => {
                let currentGenerations = [...(prevFrame.videoGenerations || [])];
                videoUrls.forEach((url, i) => {
                    if (i < loadingGenerations.length) {
                        const loaderId = loadingGenerations[i].id;
                        const index = currentGenerations.findIndex(g => g.id === loaderId);
                        if (index !== -1) {
                            currentGenerations[index] = { ...currentGenerations[index], url, isLoading: false, progress: 100 };
                        }
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
        onBack();
    };

    return (
        <div className="fixed inset-0 bg-[#0B0B0B] flex flex-col z-50">
            {fullScreenVideoUrl && (
                <FullScreenVideoPlayer
                    url={fullScreenVideoUrl}
                    onClose={() => setFullScreenVideoUrl(null)}
                    onSelect={() => handleSelectVideo(fullScreenVideoUrl)}
                />
            )}
            <header className="flex-shrink-0 p-6 pb-4">
                <Button onClick={onBack} variant="secondary" className="!text-sm !gap-2 !px-3 !py-2"><ArrowLeftIcon className="w-4 h-4" /> Back to Compositing</Button>
            </header>
            <main className="flex-1 overflow-y-auto px-6 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                    {(frame.videoGenerations || []).map(gen => (
                        <div key={gen.id} className="relative aspect-video group bg-black rounded-lg border border-gray-800 flex items-center justify-center overflow-hidden">
                           {gen.isLoading ? (
                                <LoadingSkeleton aspectRatio="16:9" progress={gen.progress || 0} />
                           ) : gen.url ? (
                                <>
                                    <video src={gen.url} muted loop autoPlay playsInline className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <Button onClick={() => setFullScreenVideoUrl(gen.url!)} variant="secondary" className="!p-3">
                                            <ExpandIcon className="w-5 h-5" />
                                        </Button>
                                        <Button onClick={() => handleSelectVideo(gen.url!)} variant="primary">Use This Video</Button>
                                    </div>
                                </>
                           ) : (
                                <div className="p-2 text-center flex flex-col items-center justify-center h-full bg-red-900/20">
                                    <p className="text-xs text-red-400 font-semibold">Generation Failed</p>
                                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-3">{gen.error}</p>
                                </div>
                           )}
                        </div>
                    ))}
                    {(!frame.videoGenerations || frame.videoGenerations.length === 0) && !isGenerating && (
                         <div className="md:col-span-2 aspect-video bg-gray-900/50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-700">
                             <p className="text-gray-500">Video generations will appear here</p>
                        </div>
                    )}
                </div>
            </main>
            <footer className="flex-shrink-0 p-6 pt-4 border-t border-gray-800/50">
                 <div className="max-w-3xl mx-auto">
                    <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl p-4 rounded-3xl flex flex-col gap-3 shadow-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        <div className="flex items-center justify-center gap-4 px-2 mb-2">
                            <div className="text-center relative group">
                                <div className="w-28 h-16 object-cover rounded-xl border-2 border-green-500/80 flex items-center justify-center bg-gray-800/40 overflow-hidden backdrop-blur-sm hover:border-green-400 transition-all">
                                    {(frame.media?.upscaled_start_frame_url || frame.media?.start_frame_url) ? (
                                        <img src={frame.media?.upscaled_start_frame_url || frame.media?.start_frame_url} alt="Starting frame" className="w-full h-full object-cover"/>
                                    ) : (
                                        <p className="text-xs text-gray-500 p-1">Not Set</p>
                                    )}
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-sm">
                                        <button onClick={() => handleFrameControlClick('start')} className="p-2 text-white bg-green-500/20 rounded-xl hover:bg-green-500/30 hover:scale-110 transition-all border border-green-500/50" title="Upload Start Frame"><ImagePlusIcon className="w-4 h-4"/></button>
                                        {(frame.media?.start_frame_url || frame.media?.upscaled_start_frame_url) && (
                                            <button onClick={() => handleRemoveFrame('start')} className="p-2 text-white bg-red-500/20 rounded-xl hover:bg-red-500/30 hover:scale-110 transition-all border border-red-500/50" title="Remove Start Frame"><Trash2Icon className="w-4 h-4"/></button>
                                        )}
                                    </div>
                                </div>
                                <label className="text-xs text-gray-400 mt-2 block font-semibold">Hero Frame</label>
                            </div>
                            <div className="text-gray-500 self-center pb-4"><ArrowRightIcon className="w-7 h-7"/></div>
                             <div className="text-center relative group">
                                <div className="w-28 h-16 object-cover rounded-xl border-2 border-blue-500/80 flex items-center justify-center bg-gray-800/40 overflow-hidden backdrop-blur-sm hover:border-blue-400 transition-all">
                                    {frame.media?.end_frame_url ? (
                                        <img src={frame.media.end_frame_url} alt="Ending frame" className="w-full h-full object-cover"/>
                                    ) : (
                                        <p className="text-xs text-gray-500 p-1">Not Set</p>
                                    )}
                                     <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-sm">
                                        <button onClick={() => handleFrameControlClick('end')} className="p-2 text-white bg-blue-500/20 rounded-xl hover:bg-blue-500/30 hover:scale-110 transition-all border border-blue-500/50" title="Upload End Frame"><ImagePlusIcon className="w-4 h-4"/></button>
                                        {frame.media?.end_frame_url && (
                                            <button onClick={() => handleRemoveFrame('end')} className="p-2 text-white bg-red-500/20 rounded-xl hover:bg-red-500/30 hover:scale-110 transition-all border border-red-500/50" title="Remove End Frame"><Trash2Icon className="w-4 h-4"/></button>
                                        )}
                                    </div>
                                </div>
                                <label className="text-xs text-gray-400 mt-2 block font-semibold">End Frame</label>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-800/40 rounded-2xl p-3 border border-gray-700/30 focus-within:border-teal-500/50 focus-within:bg-gray-800/60 transition-all">
                            <textarea
                                value={motionPrompt}
                                onChange={(e) => setMotionPrompt(e.target.value)}
                                placeholder="Describe the motion, e.g., slow dolly zoom in, camera pans left..."
                                rows={1}
                                className="flex-1 bg-transparent text-base resize-none focus:outline-none max-h-32 py-1 text-gray-100 placeholder-gray-500"
                            />
                             <Button onClick={handleGenerate} disabled={isGenerating} isLoading={isGenerating} className="!bg-gradient-to-r !from-white !to-gray-100 !text-black !font-bold !py-2.5 !px-6 !rounded-xl hover:!shadow-lg hover:!scale-105 !transition-all disabled:!opacity-50 disabled:!cursor-not-allowed disabled:hover:!scale-100">Animate</Button>
                        </div>
                    </div>
                 </div>
            </footer>
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
                <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
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
                return 'border-green-500';
            case FrameStatus.UpscaledImageReady:
                return 'border-yellow-500';
            case FrameStatus.AnimatedVideoReady:
            case FrameStatus.UpscaledVideoReady:
                return 'border-red-500';
            default:
                return `border-[var(--color-border-color)]`;
        }
    };

    return (
        <div 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`group bg-[var(--color-surface-card)] rounded-lg border-2 p-3 flex flex-col gap-3 ${getBorderColorClass(status)}`}
        >
            {/* Media Display */}
            <div className="relative aspect-video bg-[#0B0B0B] rounded-md flex items-center justify-center overflow-hidden">
                {displayUrl ? (
                    isVideo 
                        ? <video ref={videoRef} src={displayUrl} muted loop playsInline className="w-full h-full object-cover" /> 
                        : <img src={displayUrl} alt={`Shot ${frame.shot_number}`} className="w-full h-full object-cover" />
                ) : (
                    <button onClick={onCompose} className="text-gray-500 hover:text-white transition-colors">
                        <FilmIcon className="w-8 h-8"/>
                    </button>
                )}
                
                {/* Progress Indicators */}
                {(status === FrameStatus.UpscalingImage || status === FrameStatus.UpscalingVideo || status === FrameStatus.RenderingVideo) && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                        <div className="w-full max-w-[80%] bg-gray-600 rounded-full h-1.5"><div className="bg-teal-500 h-1.5 rounded-full" style={{width: `${frame.progress || 0}%`}}></div></div>
                        <p className="text-xs mt-2">{
                            status === FrameStatus.UpscalingImage ? 'Upscaling Image...' :
                            status === FrameStatus.UpscalingVideo ? 'Upscaling Video...' :
                            'Animating...'
                        }</p>
                    </div>
                )}
            </div>

            {/* Info and Actions */}
            <div>
                <h5 className="font-semibold truncate">Shot {frame.shot_number}</h5>
                <p className={`text-sm text-[var(--color-text-secondary)] h-10 overflow-hidden`}>{frame.description}</p>
            </div>
            
            <div className="mt-auto grid grid-cols-3 gap-2 text-center">
                <Button onClick={onCompose} variant="secondary" className="!text-xs !py-1.5 !px-2">Compose Still</Button>
                <Button onClick={onReAnimate} disabled={!isStillReady && !isImageUpscaled && !isAnimationReady && !isVideoUpscaled} variant="secondary" className="!text-xs !py-1.5 !px-2">Animate</Button>
                {isVideoUpscaled ? (
                    frame.transferredToTimeline 
                        ? <Button disabled variant="default" className="!text-xs !py-1.5 !px-2 !bg-green-800/20 !text-green-400 !border-green-800"><CheckIcon className="w-4 h-4"/> Transferred</Button>
                        : <Button onClick={onTransfer} variant="secondary" className="!text-xs !py-1.5 !px-2 !border-teal-500 !text-teal-400 hover:!bg-teal-500/20">To Timeline</Button>
                ) : isAnimationReady ? (
                    <Button onClick={onUpscaleVideo} variant="secondary" className="!text-xs !py-1.5 !px-2">Upscale Video</Button>
                ) : (
                    <Button onClick={onUpscaleImage} disabled={!isStillReady} variant="secondary" className="!text-xs !py-1.5 !px-2">Upscale Image</Button>
                )}
            </div>
            
            <button onClick={onDelete} aria-label={`Delete shot ${frame.shot_number}`} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-colors"><Trash2Icon className="w-4 h-4"/></button>
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
}

const CompositingTab: React.FC<CompositingTabProps> = ({ scriptAnalysis, onUpdateAnalysis, onAddScene, onTransferToTimeline, onTransferAllToTimeline }) => {
    const [activeWorkspace, setActiveWorkspace] = useState<Workspace>('grid');
    const [selectedItem, setSelectedItem] = useState<{ frame: Frame; scene: AnalyzedScene } | null>(null);
    const [refinementBase, setRefinementBase] = useState<Generation | null>(null);

    // 3D World Viewer state
    const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
    const [generated3DModelUrl, setGenerated3DModelUrl] = useState<string | null>(null);
    const [generatedWorld, setGeneratedWorld] = useState<import('../services/emuWorldService').GeneratedWorld | null>(null);

    const handleGenerate3DWorld = async (prompt: string) => {
        try {
            const result = await generate3DWorld({
                prompt,
                onProgress: (progress, status) => {
                    console.log(`3D Generation: ${progress}% - ${status}`);
                }
            });
            setGenerated3DModelUrl(result.modelUrl);
            setGeneratedWorld(result.world || null); // Store full world data
        } catch (error) {
            console.error('Failed to generate 3D world:', error);
            throw error;
        }
    };

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
        return <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center"><div className={`p-10 border border-dashed border-[var(--color-border-color)] rounded-2xl`}><h2 className="text-3xl font-bold mb-2">Compositing</h2><p className="text-lg text-gray-400 max-w-md">Analyze a script or manually add scenes to begin.</p><Button onClick={onAddScene} variant="primary" className="mt-6"><PlusIcon className="w-5 h-5" />Add First Scene</Button></div></div>;
    }
    
    const renderWorkspace = () => {
        if (!selectedItem) return null;
        switch (activeWorkspace) {
            case 'still-studio':
                return <StillStudio frame={selectedItem.frame} scene={selectedItem.scene} onBack={() => setActiveWorkspace('grid')} onUpdateFrame={handleUpdateFrame} onEnterRefinement={(gen) => { setRefinementBase(gen); setActiveWorkspace('refine-studio'); }} moodboard={scriptAnalysis.moodboard} moodboardTemplates={scriptAnalysis.moodboardTemplates} characters={scriptAnalysis.characters} locations={scriptAnalysis.locations} />;
            case 'refine-studio':
                if (!refinementBase) return null;
                return <RefinementStudio baseGeneration={refinementBase} onClose={() => setActiveWorkspace('still-studio')} onUpdateFrame={handleUpdateFrame} />;
            case 'animate-studio':
                return <AnimateStudio frame={selectedItem.frame} onBack={() => setActiveWorkspace('grid')} onUpdateFrame={handleUpdateFrame} />;
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
        <div className="space-y-10">
            <ThreeDWorldViewer
                isOpen={is3DViewerOpen}
                onClose={() => setIs3DViewerOpen(false)}
                generatedModelUrl={generated3DModelUrl}
                generatedWorld={generatedWorld}
                onGenerate={handleGenerate3DWorld}
            />

            <header className="space-y-4">
              <div>
                <h2 className={`text-2xl font-bold mb-1 text-[var(--color-text-primary)]`}>Compositing</h2>
                <p className={`text-md text-[var(--color-text-secondary)]`}>Compose stills, then upscale and animate each shot to build your film.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={onAddScene} variant="secondary" className="!py-2 !px-4"><PlusIcon className="w-4 h-4" /><span>Add Scene</span></Button>
                <Button onClick={() => setIs3DViewerOpen(true)} variant="secondary" className="!py-2 !px-4 !border-teal-500 !text-teal-400 hover:!bg-teal-500/20"><BoxIcon className="w-4 h-4" /><span>3D World Viewer</span></Button>
                <Button onClick={onTransferAllToTimeline} variant="primary" className="!py-2 !px-4"><SendIcon className="w-4 h-4" /><span>Transfer All to Timeline</span></Button>
              </div>
            </header>

            {scriptAnalysis.scenes.map(scene => (
                 <section key={scene.id}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={`text-xl font-semibold text-[var(--color-text-primary)]`}>Scene {scene.sceneNumber}: <span className="font-normal text-gray-400">{scene.setting}</span></h3>
                        <Button onClick={() => handleAddShot(scene.id)} variant="secondary" className="!py-2 !px-4"><PlusIcon className="w-4 h-4" /><span>Add Shot</span></Button>
                    </div>
                    {(scene.frames && scene.frames.length > 0) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                        <div className={`text-center py-8 bg-[var(--color-surface-card)] border border-dashed border-[var(--color-border-color)] rounded-lg`}>
                            <p className={`text-[var(--color-text-secondary)]`}>No shots defined for this scene yet.</p>
                        </div>
                    )}
                </section>
            ))}
        </div>
    );
};

export default CompositingTab;
