
import React, { useState, useRef, useEffect } from 'react';
import Button from '../components/Button';
import { generateStillVariants } from '../services/aiService';
import { Generation, Moodboard, MoodboardTemplate } from '../types';
import { AlkemyLoadingIcon, PaperclipIcon, XIcon, Trash2Icon, ArrowLeftIcon } from '../components/icons/Icons';

const aspectRatioClasses: { [key: string]: string } = {
    '1:1': 'aspect-square', '16:9': 'aspect-video', '9:16': 'aspect-[9/16]',
    '4:3': 'aspect-[4/3]', '3:4': 'aspect-[3/4]',
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

const SimpleFullScreenViewer: React.FC<{
    imageUrl: string;
    onClose: () => void;
}> = ({ imageUrl, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                <img src={imageUrl} alt="Fullscreen generated visual" className="max-w-full max-h-full object-contain" />
                <Button onClick={onClose} variant="secondary" className="absolute top-4 left-4 !text-sm !gap-2 !px-3 !py-2">
                    <ArrowLeftIcon className="w-4 h-4" /> Back
                </Button>
            </div>
        </div>
    );
};


const ImageGenTab: React.FC<{ moodboard?: Moodboard; moodboardTemplates?: MoodboardTemplate[] }> = ({ moodboard, moodboardTemplates = [] }) => {
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState<'Imagen' | 'Gemini Nano Banana' | 'Flux'>('Imagen');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [promptWasAdjusted, setPromptWasAdjusted] = useState(false);
    const [viewingUrl, setViewingUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            alert("Please enter a prompt.");
            return;
        }
        setPromptWasAdjusted(false);
        const N_GENERATIONS = 2;
        const loadingGenerations: Generation[] = Array.from({ length: N_GENERATIONS }).map((_, i) => ({
            id: `gen-${Date.now()}-${i}`, url: null, aspectRatio, isLoading: true, progress: 0
        }));

        setGenerations(prev => [...prev, ...loadingGenerations]);

        try {
            const referenceImages = attachedImage ? [attachedImage] : [];
            
            const onProgress = (index: number, progress: number) => {
                 setGenerations(prev => {
                    const newGenerations = [...prev];
                    const loaderId = loadingGenerations[index].id;
                    const genIndex = newGenerations.findIndex(g => g.id === loaderId);
                    if (genIndex !== -1 && newGenerations[genIndex].isLoading) {
                        newGenerations[genIndex] = { ...newGenerations[genIndex], progress };
                    }
                    return newGenerations;
                });
            };

            const { urls, errors, wasAdjusted } = await generateStillVariants('image-gen-tab', model, prompt, referenceImages, [], aspectRatio, N_GENERATIONS, moodboard, moodboardTemplates, undefined, undefined, onProgress);

            if (wasAdjusted) {
                setPromptWasAdjusted(true);
            }

            setGenerations(prev => {
                let currentGenerations = [...prev];
                urls.forEach((url, i) => {
                    const error = errors[i];
                    const loaderId = loadingGenerations[i].id;
                    const index = currentGenerations.findIndex(g => g.id === loaderId);
                    if (index !== -1) {
                         currentGenerations[index] = { ...currentGenerations[index], url: url || null, isLoading: false, error: error || undefined };
                    }
                });
                return currentGenerations.filter(g => g.url || g.isLoading || g.error);
            });

        } catch (error) {
            console.error('Failed to generate images:', error);
            alert(`Error generating images: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setGenerations(prev => prev.filter(g => !g.isLoading));
        }
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

    return (
        <div className="h-full flex flex-col">
            {viewingUrl && <SimpleFullScreenViewer imageUrl={viewingUrl} onClose={() => setViewingUrl(null)} />}
            <header className="mb-6 flex-shrink-0">
                <h2 className={`text-2xl font-bold mb-1 text-[var(--color-text-primary)]`}>Image Generation Studio</h2>
                <p className={`text-md text-[var(--color-text-secondary)] max-w-3xl`}>A dedicated space to experiment with prompts and generate high-quality visuals using the robust Safe Promptizer.</p>
            </header>
            
            <main className="flex-1 overflow-y-auto pr-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {generations.map((generation) => (
                       <div key={generation.id} onClick={() => generation.url && setViewingUrl(generation.url)} className={`relative group rounded-lg overflow-hidden ${aspectRatioClasses[generation.aspectRatio] || 'aspect-square'} bg-black/10 ${generation.url ? 'cursor-pointer' : ''}`}>
                            {generation.isLoading ? <LoadingSkeleton aspectRatio={generation.aspectRatio} progress={generation.progress || 0} /> : 
                             generation.url ? (
                                <>
                                    <img src={generation.url} alt={`Generated shot`} className="w-full h-full object-cover" />
                                    <button onClick={() => setGenerations(g => g.filter(gen => gen.id !== generation.id))} className="absolute top-1.5 right-1.5 p-1 bg-black/50 rounded-full text-gray-300 hover:text-red-500 hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100" aria-label="Delete"><Trash2Icon className="w-3 h-3" /></button>
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
            </main>

            <footer className="pt-6 flex-shrink-0">
                 <div className="max-w-3xl mx-auto">
                    <div className="bg-[#1C1C1C] p-3 rounded-2xl flex flex-col gap-2.5 shadow-2xl border border-gray-700">
                        {promptWasAdjusted && (
                            <div className="text-xs text-yellow-400/80 px-4">Note: Your prompt was adjusted for safety.</div>
                        )}
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
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the image you want to create..."
                                rows={1}
                                className="flex-1 bg-transparent text-base resize-none focus:outline-none max-h-24 pt-1 text-gray-200 placeholder-gray-500"
                            />
                        </div>
                         <div className="flex items-center justify-between pl-10">
                             <div className="flex items-center gap-2">
                                <select value={model} onChange={e => setModel(e.target.value as 'Imagen' | 'Gemini Nano Banana' | 'Flux')} className="bg-gray-700 text-black text-xs rounded-full font-semibold px-3 py-1.5 appearance-none focus:outline-none cursor-pointer">
                                    <option>Imagen</option>
                                    <option>Gemini Nano Banana</option>
                                    <option>Flux</option>
                                </select>
                                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="bg-gray-700 text-black text-xs rounded-full font-semibold px-3 py-1.5 appearance-none focus:outline-none cursor-pointer">
                                    <option>16:9</option><option>9:16</option><option>1:1</option><option>4:3</option><option>3:4</option>
                                </select>
                            </div>
                            <div className="flex items-center">
                                <Button onClick={handleGenerate} disabled={!prompt.trim()} className="!bg-white !text-black !font-bold !py-2 !px-5 rounded-lg">Generate</Button>
                            </div>
                        </div>
                    </div>
                 </div>
            </footer>
        </div>
    );
};

export default ImageGenTab;
