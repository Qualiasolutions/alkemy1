
import React, { useState, useEffect, useRef } from 'react';
import { AnalyzedCharacter, AnalyzedLocation, Generation, Moodboard } from '../types';
import { THEME_COLORS } from '../constants';
import Button from '../components/Button';
import { UsersIcon, MapPinIcon, ArrowLeftIcon, AlkemyLoadingIcon, XIcon, PlusIcon, ImagePlusIcon, Trash2Icon, PaperclipIcon, ExpandIcon } from '../components/icons/Icons';
import { generateStillVariants, refineVariant, upscaleImage } from '../services/aiService';

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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className={`bg-[${THEME_COLORS.surface_card}] rounded-xl border border-[${THEME_COLORS.border_color}] p-6 w-full max-w-md`} onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-4">Add New {type === 'character' ? 'Character' : 'Location'}</h3>
                <form onSubmit={(e) => onSubmit(e, name, description)}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="itemName" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                            <input
                                id="itemName"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className={`w-full bg-[${THEME_COLORS.background_primary}] border border-[${THEME_COLORS.border_color}] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[${THEME_COLORS.accent_primary}]`}
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                            <textarea
                                id="itemDescription"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                className={`w-full bg-[${THEME_COLORS.background_primary}] border border-[${THEME_COLORS.border_color}] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[${THEME_COLORS.accent_primary}]`}
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="primary">Add {type === 'character' ? 'Character' : 'Location'}</Button>
                    </div>
                </form>
            </div>
        </div>
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
        <div className="absolute inset-0 bg-[#0B0B0B] flex flex-col z-20 p-4 pt-20">
            <header className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center">
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

                <div className="flex-shrink-0 flex justify-center pb-2">
                     <div className="w-full max-w-4xl">
                         <div className="bg-[#1C1C1C] p-3 rounded-2xl flex flex-col gap-2 shadow-2xl w-full border border-gray-700">
                             {attachedImage && (
                                <div className="relative self-start p-1 bg-black/20 rounded-lg ml-3">
                                    <img src={attachedImage} alt="Attached reference" className="w-16 h-16 object-cover rounded"/>
                                    <button type="button" onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors">
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                             <div className="flex items-center gap-3">
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileAttach}/>
                                <button onClick={() => fileInputRef.current?.click()} className="p-1 text-gray-400 rounded-lg hover:bg-white/10 transition-colors">
                                    <PaperclipIcon className="w-5 h-5"/>
                                </button>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g., make the character smile, add cinematic lighting"
                                    rows={1}
                                    className="flex-1 bg-transparent text-sm resize-none focus:outline-none max-h-24 text-gray-200 placeholder-gray-500"
                                />
                                <div className="bg-gray-700 text-white text-xs rounded-full font-semibold px-3 py-1.5 whitespace-nowrap">
                                    Model: Gemini Flash Image
                                </div>
                                <Button 
                                    onClick={handleGenerate} 
                                    disabled={isGenerating || !prompt.trim()} 
                                    isLoading={isGenerating} 
                                    className="!bg-gray-300 !text-black !font-bold !py-2 !px-4 rounded-lg flex-shrink-0"
                                >
                                    Generate
                                </Button>
                            </div>
                        </div>
                    </div>
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
}> = ({ item, onBack, onUpdateBatch, moodboard }) => {
    const [detailedPrompt, setDetailedPrompt] = useState('');
    const [model, setModel] = useState<'Imagen' | 'Gemini Flash Image' | 'Flux'>('Imagen');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [editingGeneration, setEditingGeneration] = useState<Generation | null>(null);
    const [viewingGeneration, setViewingGeneration] = useState<Generation | null>(null);
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
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
                item.data.id, model, detailedPrompt, referenceImages, [], aspectRatio, N_GENERATIONS, moodboard, undefined, undefined, onProgress
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

    if (editingGeneration) {
        return <RefinementStudio 
                  baseGeneration={editingGeneration}
                  onClose={() => setEditingGeneration(null)}
                  onSetMainImage={handleSetMainAndCloseEditor}
                  onUpdate={onUpdateBatch}
                />
    }

    return (
        <div className="absolute inset-0 bg-[#0B0B0B] flex flex-col z-10">
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
            <header className="absolute top-0 left-0 p-4 z-20"><Button onClick={onBack} variant="secondary" className="!text-sm !gap-2 !px-3 !py-2"><ArrowLeftIcon className="w-4 h-4" /> Back to List</Button></header>
            
            <main className="flex-1 overflow-y-auto pt-20 pb-40">
                <div className="px-4">
                    {item.data.imageUrl && (
                        <div className="mb-8">
                            <h4 className={`text-lg font-semibold mb-3 text-[${THEME_COLORS.text_primary}]`}>Main Visual</h4>
                            <img src={item.data.imageUrl} alt={`Main visual for ${item.data.name}`} className="rounded-lg max-w-lg mx-auto aspect-video object-cover" />
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(item.data.generations || []).map((generation) => (
                           <div key={generation.id} onClick={() => generation.url && setViewingGeneration(generation)} className={`relative group rounded-lg overflow-hidden ${aspectRatioClasses[generation.aspectRatio] || 'aspect-square'} bg-black/10 ${generation.url ? 'cursor-pointer' : ''}`}>
                                {generation.isLoading ? <LoadingSkeleton aspectRatio={generation.aspectRatio} progress={generation.progress || 0} /> : 
                                 generation.url ? (
                                    <>
                                        <img src={generation.url} alt={`Generated visual`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
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

            <footer className="absolute bottom-0 left-0 right-0 p-4 z-20">
                 <div className="max-w-3xl mx-auto">
                    <div className="bg-[#1C1C1C] p-3 rounded-2xl flex flex-col gap-2.5 shadow-2xl border border-gray-700">
                        {attachedImage && (
                            <div className="relative self-start p-1 bg-black/20 rounded-lg ml-3">
                                <img src={attachedImage} alt="Attached reference" className="w-16 h-16 object-cover rounded"/>
                                <button type="button" onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors">
                                    <XIcon className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileAttach}/>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors">
                                <PaperclipIcon className="w-6 h-6"/>
                            </button>
                            <textarea
                                value={detailedPrompt}
                                onChange={(e) => setDetailedPrompt(e.target.value)}
                                placeholder={`Describe a visual for ${item.data.name}...`}
                                rows={1}
                                className="flex-1 bg-transparent text-base resize-none focus:outline-none max-h-24 pt-1 text-gray-200 placeholder-gray-500"
                            />
                        </div>
                         <div className="flex items-center justify-between pl-10">
                             <div className="flex items-center gap-2">
                                <select value={model} onChange={e => setModel(e.target.value as 'Imagen' | 'Gemini Flash Image' | 'Flux')} className="bg-gray-700 text-white text-xs rounded-full font-semibold px-3 py-1.5 appearance-none focus:outline-none cursor-pointer">
                                    <option>Imagen</option>
                                    <option>Gemini Flash Image</option>
                                    <option>Flux</option>
                                </select>
                                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="bg-gray-700 text-white text-xs rounded-full font-semibold px-3 py-1.5 appearance-none focus:outline-none cursor-pointer">
                                    <option>16:9</option><option>9:16</option><option>1:1</option><option>4:3</option><option>3:4</option>
                                </select>
                            </div>
                            <div className="flex items-center">
                                <Button onClick={handleGenerate} disabled={!detailedPrompt.trim()} className="!bg-white !text-black !font-bold !py-2 !px-5 rounded-lg">Generate</Button>
                            </div>
                        </div>
                    </div>
                 </div>
            </footer>
        </div>
    );
};

const Card: React.FC<{
    item: AnalyzedCharacter | AnalyzedLocation;
    icon: React.ReactNode;
    onClick: () => void;
    onAttach: () => void;
    onDelete: () => void;
}> = ({ item, icon, onClick, onAttach, onDelete }) => {
    const truncatedDescription = item.description.length > 100
        ? item.description.substring(0, 100) + '...'
        : item.description;

    return (
        <div className={`relative group bg-[${THEME_COLORS.surface_card}] rounded-lg border border-[${THEME_COLORS.border_color}] p-4 flex flex-col hover:border-[${THEME_COLORS.accent_primary}] transition-colors`}>
            <div onClick={onClick} className="cursor-pointer flex flex-col flex-grow">
                <div className={`aspect-video bg-[${THEME_COLORS.background_primary}] rounded-md mb-3 flex items-center justify-center overflow-hidden`}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : icon}
                </div>
                <h5 className="font-semibold">{item.name}</h5>
                <p className={`text-sm text-[${THEME_COLORS.text_secondary}] flex-grow mb-3 h-12 overflow-hidden`}>{truncatedDescription}</p>
                <div className={`text-xs text-[${THEME_COLORS.text_secondary}] mt-auto pt-2`}>
                    {item.generations?.length || 0} generations
                </div>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onAttach(); }}
                aria-label={`Attach image for ${item.name}`}
                className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
                <ImagePlusIcon className="w-5 h-5" />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                aria-label={`Delete ${item.name}`}
                className="absolute top-2 left-2 p-1.5 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
                <Trash2Icon className="w-4 h-4" />
            </button>
        </div>
    );
};

interface CastLocationsTabProps {
    characters: AnalyzedCharacter[];
    setCharacters: React.Dispatch<React.SetStateAction<AnalyzedCharacter[]>>;
    locations: AnalyzedLocation[];
    setLocations: React.Dispatch<React.SetStateAction<AnalyzedLocation[]>>;
    moodboard?: Moodboard;
}

const CastLocationsTab: React.FC<CastLocationsTabProps> = ({ characters, setCharacters, locations, setLocations, moodboard }) => {
    const [selectedItem, setSelectedItem] = useState<GenerationItem | null>(null);
    const [itemToUpdate, setItemToUpdate] = useState<{ id: string; type: 'character' | 'location' } | null>(null);
    const attachImageInputRef = useRef<HTMLInputElement>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState<'character' | 'location' | null>(null);
    
    const handleItemUpdateBatch = (updater: (prev: AnalyzedCharacter | AnalyzedLocation) => AnalyzedCharacter | AnalyzedLocation) => {
         if (selectedItem?.type === 'character') {
            setCharacters(prevChars => prevChars.map(c => c.id === selectedItem.data.id ? updater(c) as AnalyzedCharacter : c));
        } else if (selectedItem?.type === 'location') {
            setLocations(prevLocs => prevLocs.map(l => l.id === selectedItem.data.id ? updater(l) as AnalyzedLocation : l));
        }
    };
    
    useEffect(() => {
        if (selectedItem) {
            const collection = selectedItem.type === 'character' ? characters : locations;
            const currentItemData = collection.find(item => item.id === selectedItem.data.id);
            if (currentItemData) {
                setSelectedItem(prev => prev ? { ...prev, data: currentItemData } : null);
            }
        }
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


    if (selectedItem) {
        return <GenerationView 
                  item={selectedItem} 
                  onBack={() => setSelectedItem(null)} 
                  onUpdateBatch={handleItemUpdateBatch}
                  moodboard={moodboard}
                />;
    }

    return (
        <div className="space-y-10">
            <AddItemModal 
                isOpen={!!isAddModalOpen}
                type={isAddModalOpen!}
                onClose={() => setIsAddModalOpen(null)}
                onSubmit={handleAddNewItem}
            />
            <input type="file" ref={attachImageInputRef} onChange={handleFileAttached} className="hidden" accept="image/*" />
            <header className="flex justify-between items-start">
              <div>
                <h2 className={`text-2xl font-bold mb-1 text-[${THEME_COLORS.text_primary}]`}>Cast & Locations</h2>
                <p className={`text-md text-[${THEME_COLORS.text_secondary}]`}>Develop the look for your characters and settings. Click any card to enter the Generation Studio.</p>
              </div>
            </header>
            
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-xl font-semibold text-[${THEME_COLORS.text_primary}]`}>Cast ({characters.length})</h3>
                    <Button onClick={() => setIsAddModalOpen('character')} variant="secondary" className="!py-2 !px-4">
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Character</span>
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {characters.map(char => (
                        <Card 
                            key={char.id} 
                            item={char} 
                            icon={<UsersIcon className="w-8 h-8 text-gray-600" />} 
                            onClick={() => setSelectedItem({ type: 'character', data: char })}
                            onAttach={() => handleAttachClick(char, 'character')}
                            onDelete={() => handleDeleteItem(char.id, 'character')}
                        />
                    ))}
                </div>
            </section>
            
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-xl font-semibold text-[${THEME_COLORS.text_primary}]`}>Locations ({locations.length})</h3>
                     <Button onClick={() => setIsAddModalOpen('location')} variant="secondary" className="!py-2 !px-4">
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Location</span>
                    </Button>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {locations.map(loc => (
                        <Card 
                            key={loc.id} 
                            item={loc} 
                            icon={<MapPinIcon className="w-8 h-8 text-gray-600" />} 
                            onClick={() => setSelectedItem({ type: 'location', data: loc })}
                            onAttach={() => handleAttachClick(loc, 'location')}
                            onDelete={() => handleDeleteItem(loc.id, 'location')}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default CastLocationsTab;
