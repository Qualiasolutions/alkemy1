

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Moodboard, MoodboardSection, MoodboardItem } from '../types';
import { THEME_COLORS } from '../constants';
import { UploadCloudIcon, CameraIcon, PaletteIcon, SparklesIcon, ImageIcon, Trash2Icon, EnterIcon, BrainIcon, ArrowLeftIcon } from '../components/icons/Icons';
import Button from '../components/Button';
import { generateMoodboardDescription } from '../services/aiService';
import { useTheme } from '../theme/ThemeContext';

// --- Collage Studio Modal ---
const CollageStudio: React.FC<{
    title: string;
    isOpen: boolean;
    onClose: () => void;
    sectionData: MoodboardSection;
    onUpdate: (updater: (prev: MoodboardSection) => MoodboardSection) => void;
}> = ({ title, isOpen, onClose, sectionData, onUpdate }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback((files: FileList) => {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const url = event.target?.result as string;
                const type = file.type.startsWith('video') ? 'video' : 'image';
                const newItem: MoodboardItem = { id: `item-${Date.now()}-${Math.random()}`, url, type };
                // Use functional update to ensure we're updating the latest state
                onUpdate(prevSectionData => ({ ...prevSectionData, items: [...prevSectionData.items, newItem] }));
            };
            reader.readAsDataURL(file);
        });
    }, [onUpdate]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
        if (e.target) e.target.value = ''; // Reset file input to allow re-uploading the same file
    };

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);
    
    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };

    const handleDeleteItem = (itemId: string) => {
        onUpdate(prevSectionData => ({
            ...prevSectionData,
            items: prevSectionData.items.filter(item => item.id !== itemId)
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-8" onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragEnter} onDragLeave={onDragLeave}>
             <header className="flex justify-between items-center mb-6 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-4">
                    <Button onClick={onClose} variant="secondary" className="!text-sm !gap-2 !px-3 !py-2">
                        <ArrowLeftIcon className="w-4 h-4" /> Back
                    </Button>
                    <h2 className="text-2xl font-bold text-white">Moodboard Studio: <span className="text-teal-400">{title}</span></h2>
                </div>
                <Button onClick={onClose} variant="secondary">Close Studio</Button>
            </header>
            <main
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 overflow-y-auto rounded-lg p-4 transition-colors cursor-pointer ${isDragging ? `bg-teal-500/10 border-2 border-dashed border-teal-400` : 'bg-transparent border-2 border-dashed border-transparent'}`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                />
                
                {sectionData.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 rounded-lg">
                        <UploadCloudIcon className="w-12 h-12 mb-4" />
                        <p className="text-xl font-semibold text-gray-400">Drag & drop or click to upload</p>
                        <p>You can select multiple images and videos at once.</p>
                    </div>
                ) : (
                    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
                        {sectionData.items.map(item => (
                            <div key={item.id} className="relative group mb-4 break-inside-avoid rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                                {item.type === 'image' ? (
                                    <img src={item.url} alt="moodboard reference" className="w-full h-auto" />
                                ) : (
                                    <video src={item.url} muted loop autoPlay playsInline className="w-full h-auto" />
                                )}
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                     <button onClick={() => handleDeleteItem(item.id)} className="w-10 h-10 bg-red-500/50 text-white rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors" title="Delete Item">
                                        <Trash2Icon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};


// --- Reusable Moodboard Section Component ---
interface MoodboardSectionProps {
  title: string;
  staticDescription: string;
  icon: React.ReactNode;
  sectionData: MoodboardSection;
  onEnterStudio: () => void;
  onUpdate: (newSectionData: MoodboardSection) => void;
}

const MoodboardSectionComponent: React.FC<MoodboardSectionProps> = ({ title, staticDescription, icon, sectionData, onEnterStudio, onUpdate }) => {
    const { isDark } = useTheme();
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

    const handleGenerateDescription = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsGeneratingDesc(true);
        try {
            const description = await generateMoodboardDescription(sectionData);
            onUpdate({ ...sectionData, aiDescription: description });
        } catch (error) {
            alert(`Error generating description: ${error instanceof Error ? error.message : 'Unknown Error'}`);
        } finally {
            setIsGeneratingDesc(false);
        }
    };

    const displayDescription = sectionData.aiDescription || staticDescription;
    const visibleItems = sectionData.items.slice(0, 4); // Show max 4 images
    const remainingCount = sectionData.items.length - 4;

    return (
        <div className={`group relative bg-[${THEME_COLORS.surface_card}] border border-[${THEME_COLORS.border_color}] rounded-xl overflow-hidden hover:border-[${THEME_COLORS.accent_primary}]/50 transition-all hover:shadow-lg hover:shadow-teal-500/10`}>
            {/* Header */}
            <div className="p-4 border-b border-[${THEME_COLORS.border_color}]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex-shrink-0 bg-[${THEME_COLORS.background_primary}] rounded-lg flex items-center justify-center text-[${THEME_COLORS.accent_primary}]`}>
                            {icon}
                        </div>
                        <h3 className="text-lg font-bold">{title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                            sectionData.items.length > 0
                                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                                : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                        }`}>
                            {sectionData.items.length} {sectionData.items.length === 1 ? 'item' : 'items'}
                        </span>
                    </div>
                </div>
                <p className={`text-xs text-[${THEME_COLORS.text_secondary}] line-clamp-2 leading-relaxed`}>
                    {displayDescription}
                </p>
            </div>

            {/* Image Grid Preview */}
            <div
                onClick={onEnterStudio}
                className="relative cursor-pointer h-48 bg-[${THEME_COLORS.background_primary}] overflow-hidden"
            >
                {sectionData.items.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 h-full p-1">
                        {visibleItems.map((item, index) => (
                            <div
                                key={item.id}
                                className="relative overflow-hidden rounded-md group/item"
                            >
                                {item.type === 'video' ? (
                                    <video
                                        src={item.url}
                                        muted
                                        loop
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                                    />
                                ) : (
                                    <img
                                        src={item.url}
                                        alt={`${title} reference ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                                    />
                                )}
                                {index === 3 && remainingCount > 0 && (
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                                        <span className="text-white text-2xl font-bold">+{remainingCount}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <ImageIcon className="w-12 h-12 mb-2 opacity-40" />
                        <p className="text-sm font-medium">No references</p>
                        <p className="text-xs text-gray-600 mt-1">Click to add</p>
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <EnterIcon className="w-10 h-10 text-white" />
                    <p className="font-bold text-white text-sm">Open Studio</p>
                    <p className="text-xs text-gray-300">Add & manage references</p>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-[${THEME_COLORS.border_color}] flex items-center justify-between">
                <Button
                    onClick={handleGenerateDescription}
                    isLoading={isGeneratingDesc}
                    disabled={isGeneratingDesc}
                    variant="secondary"
                    className="!text-xs !gap-1.5 !px-2.5 !py-1.5"
                >
                    <BrainIcon className="w-3.5 h-3.5" />
                    <span>AI Description</span>
                </Button>
                <button
                    onClick={onEnterStudio}
                    className={`text-xs font-medium transition-colors ${
                        isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
                    }`}
                >
                    Manage →
                </button>
            </div>
        </div>
    );
};


// --- Main Moodboard Tab Component ---
const MoodboardTab: React.FC<{
  moodboard?: Moodboard;
  onUpdateMoodboard: (updater: React.SetStateAction<Moodboard | undefined>) => void;
  scriptAnalyzed: boolean;
}> = ({ moodboard, onUpdateMoodboard, scriptAnalyzed }) => {
  const [activeStudio, setActiveStudio] = useState<keyof Moodboard | null>(null);

  if (!scriptAnalyzed) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
        <div className={`p-10 border border-dashed border-[${THEME_COLORS.border_color}] rounded-2xl`}>
          <h2 className="text-3xl font-bold mb-2">Awaiting Script Analysis</h2>
          <p className="text-lg text-gray-400 max-w-md">Please analyze a script in the 'Script' tab to unlock the Moodboard.</p>
        </div>
      </div>
    );
  }

  if (!moodboard) return null;

  const handleUpdateSection = (
    sectionName: keyof Moodboard,
    updater: MoodboardSection | ((prev: MoodboardSection) => MoodboardSection)
  ) => {
    onUpdateMoodboard(prevMoodboard => {
        if (!prevMoodboard) return undefined;
        const prevSection = prevMoodboard[sectionName];
        const newSectionData = typeof updater === 'function' ? updater(prevSection) : updater;
        return { ...prevMoodboard, [sectionName]: newSectionData };
    });
  };

  const sections: { key: keyof Moodboard, title: string, desc: string, icon: React.ReactNode }[] = [
    { 
      key: 'cinematography', 
      title: 'Cinematography', 
      desc: "Define the film's visual language. Add references for lighting (e.g., chiaroscuro, high-key), camera work (handheld, static), composition (rule of thirds, symmetry), and lens choices (wide-angle, anamorphic).",
      icon: <CameraIcon />
    },
    { 
      key: 'color', 
      title: 'Color', 
      desc: "Establish the color palette and grade. Upload swatches or frames that capture the desired hue, saturation, and contrast.",
      icon: <PaletteIcon />
    },
    { 
      key: 'style', 
      title: 'Style', 
      desc: "Set the overall art direction and aesthetic. This could be a specific art movement (Bauhaus, Film Noir), a director's style (Wes Anderson, David Fincher), or a general feel (gritty realism, ethereal fantasy).",
      icon: <SparklesIcon />
    },
    { 
      key: 'other', 
      title: 'Other', 
      desc: "A space for miscellaneous visual ideas that don't fit elsewhere, such as specific textures, architectural details, or abstract concepts.",
      icon: <ImageIcon />
    },
  ];

  const activeSectionDetails = sections.find(sec => sec.key === activeStudio);

  return (
    <div>
        {activeStudio && activeSectionDetails && (
            <CollageStudio
                title={activeSectionDetails.title}
                isOpen={!!activeStudio}
                onClose={() => setActiveStudio(null)}
                sectionData={moodboard[activeStudio]}
                onUpdate={(updater) => handleUpdateSection(activeStudio, updater)}
            />
        )}
      <h2 className={`text-2xl font-bold mb-1 text-[${THEME_COLORS.text_primary}]`}>Moodboard</h2>
      <p className={`text-md text-[${THEME_COLORS.text_secondary}] mb-6`}>Define the visual and tonal direction for your project. References added here will influence all AI generations.</p>
      
      <div className="space-y-8">
        {sections.map(sec => (
          <MoodboardSectionComponent 
            key={sec.key}
            title={sec.title}
            staticDescription={sec.desc}
            icon={sec.icon}
            sectionData={moodboard[sec.key]}
            onEnterStudio={() => setActiveStudio(sec.key)}
            onUpdate={(newSectionData) => handleUpdateSection(sec.key, newSectionData)}
          />
        ))}
      </div>
    </div>
  );
};

export default MoodboardTab;