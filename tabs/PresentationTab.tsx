
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ScriptAnalysis, AnalyzedCharacter, AnalyzedLocation, AnalyzedScene, Frame, MoodboardItem, MoodboardTemplate } from '../types';
import { CameraIcon, UsersIcon, MapPinIcon, FilmIcon, ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon, DownloadIcon } from '../components/icons/Icons';
import Button from '../components/Button';


const ItemGalleryModal: React.FC<{
    item: AnalyzedCharacter | AnalyzedLocation;
    onClose: () => void;
}> = ({ item, onClose }) => {
    const uniqueImages = useMemo(() => {
        return [...new Set([item.imageUrl, ...(item.generations || []).map(g => g.url), ...(item.refinedGenerationUrls || [])].filter((url): url is string => !!url))];
    }, [item]);

    const initialIndex = item.imageUrl ? uniqueImages.indexOf(item.imageUrl) : 0;
    const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

    const goToNext = useCallback(() => {
        if (uniqueImages.length > 0) {
            setCurrentIndex(prevIndex => (prevIndex + 1) % uniqueImages.length);
        }
    }, [uniqueImages.length]);

    const goToPrevious = useCallback(() => {
         if (uniqueImages.length > 0) {
            setCurrentIndex(prevIndex => (prevIndex - 1 + uniqueImages.length) % uniqueImages.length);
        }
    }, [uniqueImages.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                goToNext();
            } else if (e.key === 'ArrowLeft') {
                goToPrevious();
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [goToNext, goToPrevious, onClose]);
    
    if (uniqueImages.length === 0) {
        return (
             <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="text-white text-center">
                    <p>No images available for {item.name}.</p>
                    <Button onClick={onClose} variant="secondary" className="mt-4">Close</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>

                {/* Main Image */}
                <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                    <img
                        src={uniqueImages[currentIndex]}
                        alt={`${item.name} gallery image ${currentIndex + 1}`}
                        className="max-w-full max-h-full object-contain block"
                    />
                </div>

                {/* Back Button */}
                <Button onClick={onClose} variant="secondary" className="absolute top-4 left-4 !text-sm !gap-2 !px-3 !py-2 !bg-black/50 !border-gray-600 hover:!bg-black/80 text-white hover:text-white">
                    <ArrowLeftIcon className="w-4 h-4" /> Back
                </Button>


                {/* Previous Button */}
                {uniqueImages.length > 1 && (
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors"
                        aria-label="Previous image"
                    >
                        <ChevronLeftIcon className="w-8 h-8" />
                    </button>
                )}

                {/* Next Button */}
                {uniqueImages.length > 1 && (
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors"
                        aria-label="Next image"
                    >
                        <ChevronRightIcon className="w-8 h-8" />
                    </button>
                )}
                
                {/* Counter */}
                {uniqueImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 rounded-full px-4 py-2 text-sm">
                        {currentIndex + 1} / {uniqueImages.length}
                    </div>
                )}
            </div>
        </div>
    );
};

const CharacterCastingCard: React.FC<{
    character: AnalyzedCharacter;
    onViewImages: () => void;
}> = ({ character, onViewImages }) => {
    return (
        <div className={`bg-[var(--color-surface-card)] rounded-lg border border-[var(--color-border-color)] p-6 flex flex-col gap-6`}>
            <div className="w-full">
                 <button onClick={onViewImages} className="relative aspect-w-3 aspect-h-4 bg-[var(--color-surface-card)] rounded-xl overflow-hidden mb-4 group block w-full text-left border border-[var(--color-border-color)] hover:border-emerald-500/50 transition-all">
                    {character.imageUrl
                        ? <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        : <div className="flex items-center justify-center h-full"><UsersIcon className={`w-12 h-12 text-[var(--color-text-secondary)]`} /></div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow">
                            <CameraIcon className="w-4 h-4" />
                            <span>View Image Gallery</span>
                        </div>
                    </div>
                </button>
                <h3 className="text-xl font-bold">{character.name}</h3>
                <p className={`text-sm text-[var(--color-text-secondary)] mt-1`}>{character.description}</p>
            </div>
        </div>
    );
};


const LocationCard: React.FC<{ location: AnalyzedLocation }> = ({ location }) => (
     <div className={`bg-[var(--color-surface-card)] rounded-xl overflow-hidden border border-[var(--color-border-color)] hover:border-emerald-500/50 h-full w-full transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10`}>
        <div className="aspect-video bg-[var(--color-surface-elevated)] flex items-center justify-center">
            {location.imageUrl
                ? <img src={location.imageUrl} alt={location.name} className="w-full h-full object-cover" />
                : <MapPinIcon className={`w-8 h-8 text-[var(--color-text-secondary)]`} />
            }
        </div>
        <div className="p-4">
            <h5 className="font-semibold text-[var(--color-text-primary)] truncate">{location.name}</h5>
        </div>
    </div>
);

const StoryboardShot: React.FC<{ frame: Frame, shotNumber: number }> = ({ frame, shotNumber }) => (
    <div className="flex flex-col">
        <div className="aspect-video bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border-color)] flex items-center justify-center mb-2 overflow-hidden">
             {frame.media?.start_frame_url
                ? <img src={frame.media.start_frame_url} alt={`Shot ${shotNumber}`} className="w-full h-full object-cover" />
                : <FilmIcon className={`w-8 h-8 text-[var(--color-text-secondary)]`} />
            }
        </div>
        <p className="text-xs font-semibold text-[var(--color-text-primary)]">Shot {shotNumber}</p>
        <p className="text-xs text-[var(--color-text-secondary)] leading-snug">{frame.description}</p>
    </div>
);

const StoryboardScene: React.FC<{ scene: AnalyzedScene }> = ({ scene }) => (
    <div>
        <h4 className="text-lg font-bold mb-3 pb-2 border-b border-[var(--color-border-color)] text-[var(--color-text-primary)]">Scene {scene.sceneNumber}: {scene.setting}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
            {scene.frames?.map((frame, index) => (
                <StoryboardShot key={frame.id} frame={frame} shotNumber={index + 1} />
            ))}
        </div>
    </div>
);

const MoodboardCategory: React.FC<{ title: string; items: MoodboardItem[] }> = ({ title, items }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (items.length > 1) {
            const timer = setInterval(() => {
                setCurrentIndex(prevIndex => (prevIndex + 1) % items.length);
            }, 4000);
            return () => clearInterval(timer);
        }
    }, [items.length]);

    if (items.length === 0) {
        return null; // Don't render empty categories
    }

    return (
        <div>
            <h3 className="text-xl font-semibold mb-3">{title}</h3>
            <div className="relative w-full aspect-video bg-[#0B0B0B] rounded-lg overflow-hidden">
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
                        style={{ opacity: index === currentIndex ? 1 : 0 }}
                    >
                        {item.type === 'image'
                            ? <img src={item.url} alt="moodboard item" className="w-full h-full object-cover" />
                            : <video src={item.url} muted loop autoPlay playsInline className="w-full h-full object-cover" />
                        }
                    </div>
                ))}
            </div>
        </div>
    );
};

const MoodboardTemplateCard: React.FC<{ board: MoodboardTemplate }> = ({ board }) => {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h3 className="text-lg font-semibold text-white">{board.title}</h3>
                    {board.description && <p className="text-xs text-white/50 mt-1">{board.description}</p>}
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/50">{board.items.length} refs</span>
            </div>
            {board.aiSummary && (
                <p className="mt-3 text-sm leading-relaxed text-white/70">{board.aiSummary}</p>
            )}
            {board.items.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {board.items.slice(0, 6).map(item => (
                        <div key={item.id} className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20">
                            <img src={item.url} alt={item.metadata?.title || 'Moodboard reference'} className="h-28 w-full object-cover" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-4 flex h-28 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-white/40">No references yet</div>
            )}
        </div>
    );
};



const PresentationTab: React.FC<{ scriptAnalysis: ScriptAnalysis | null }> = ({ scriptAnalysis }) => {
    const [viewingItem, setViewingItem] = useState<AnalyzedCharacter | AnalyzedLocation | null>(null);

    if (!scriptAnalysis) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
                <div className={`p-10 border border-dashed border-[var(--color-border-color)] rounded-2xl`}>
                    <h2 className="text-3xl font-bold mb-2">Presentation Deck</h2>
                    <p className="text-lg text-gray-400 max-w-md">Analyze a script to automatically generate a presentation with storyboards, characters, and moodboards.</p>
                </div>
            </div>
        );
    }
    
    const { title, logline, characters, locations, scenes, moodboard } = scriptAnalysis;
    const hasMoodboardItems = moodboard && (
        moodboard.cinematography.items.length > 0 ||
        moodboard.color.items.length > 0 ||
        moodboard.style.items.length > 0 ||
        moodboard.other.items.length > 0
    );

    return (
        <div className="space-y-12">
             {viewingItem && <ItemGalleryModal item={viewingItem} onClose={() => setViewingItem(null)} />}
            <header className="text-center">
                <h1 className="text-4xl font-bold mb-2">{title}</h1>
                <p className={`text-lg text-[var(--color-text-secondary)]`}>{logline}</p>
            </header>

            <section>
                <h2 className="text-2xl font-bold mb-4">Moodboard</h2>
                <div className="space-y-8">
                    {scriptAnalysis.moodboardTemplates && scriptAnalysis.moodboardTemplates.some(board => board.items.length > 0) ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {scriptAnalysis.moodboardTemplates.map(board => (
                                <MoodboardTemplateCard key={board.id} board={board} />
                            ))}
                        </div>
                    ) : moodboard && hasMoodboardItems ? (
                        <>
                            <MoodboardCategory title="Cinematography" items={moodboard.cinematography.items} />
                            <MoodboardCategory title="Color" items={moodboard.color.items} />
                            <MoodboardCategory title="Style" items={moodboard.style.items} />
                            <MoodboardCategory title="Other" items={moodboard.other.items} />
                        </>
                    ) : (
                        <div className={`flex items-center justify-center h-48 bg-[var(--color-surface-card)] rounded-lg border border-dashed border-[var(--color-border-color)]`}>
                            <p className={`text-sm text-[var(--color-text-secondary)]`}>No references added to moodboard yet.</p>
                        </div>
                    )}
                </div>
            </section>
            
            <section>
                <h2 className="text-2xl font-bold mb-4">Cast</h2>
                <div className="space-y-8">
                    {characters.map(char => (
                        <CharacterCastingCard 
                            key={char.id} 
                            character={char} 
                            onViewImages={() => setViewingItem(char)}
                        />
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4">Locations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {locations.map(loc => (
                        <button key={loc.id} onClick={() => setViewingItem(loc)} className="text-left w-full h-full transition-transform duration-200 hover:scale-105">
                           <LocationCard location={loc} />
                        </button>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4">Storyboard</h2>
                <div className="space-y-8">
                    {scenes.map(scene => <StoryboardScene key={scene.id} scene={scene} />)}
                </div>
            </section>
        </div>
    );
};

export default PresentationTab;
