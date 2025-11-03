

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Moodboard, MoodboardSection, MoodboardItem } from '../types';
import { THEME_COLORS } from '../constants';
import { UploadCloudIcon, CameraIcon, PaletteIcon, SparklesIcon, ImageIcon, Trash2Icon, EnterIcon, BrainIcon } from '../components/icons/Icons';
import Button from '../components/Button';
import { generateMoodboardDescription } from '../services/aiService';

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
                <h2 className="text-2xl font-bold text-white">Moodboard Studio: <span className="text-teal-400">{title}</span></h2>
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
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

    useEffect(() => {
        if (sectionData.items.length > 1) {
            const timer = setInterval(() => {
                setCurrentItemIndex(prevIndex => (prevIndex + 1) % sectionData.items.length);
            }, 4000);
            return () => clearInterval(timer);
        }
    }, [sectionData.items.length]);

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

    return (
    <div className={`bg-[${THEME_COLORS.surface_card}] border border-[${THEME_COLORS.border_color}] rounded-xl p-6`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-10 h-10 flex-shrink-0 bg-[${THEME_COLORS.background_primary}] rounded-md flex items-center justify-center text-[${THEME_COLORS.accent_primary}]`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">{title}</h3>
          <p className={`text-sm text-[${THEME_COLORS.text_secondary}] max-w-2xl`}>{displayDescription}</p>
        </div>
        <Button onClick={handleGenerateDescription} isLoading={isGeneratingDesc} disabled={isGeneratingDesc} variant="secondary" className="!text-xs !gap-1.5 !px-3 !py-1.5">
            <BrainIcon className="w-4 h-4" />
            <span>Generate Description</span>
        </Button>
      </div>
      
      <div 
        onClick={onEnterStudio} 
        className="relative group aspect-video bg-[#0B0B0B] rounded-lg cursor-pointer flex items-center justify-center text-gray-500 overflow-hidden mt-4"
      >
          {sectionData.items.length > 0 ? (
                sectionData.items.map((item, index) => (
                    <div
                        key={item.id}
                        className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out group-hover:scale-105"
                        style={{ 
                            opacity: index === currentItemIndex ? 1 : 0,
                            transition: 'opacity 2s ease-in-out, transform 0.3s ease-in-out'
                        }}
                    >
                        {item.type === 'video' ?
                            <video src={item.url} muted loop autoPlay playsInline className="w-full h-full object-cover" /> :
                            <img src={item.url} alt={`${title} hero`} className="w-full h-full object-cover" />
                        }
                    </div>
                ))
            ) : (
              <div className="text-center">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                  <p className="font-semibold">No References Uploaded</p>
              </div>
          )}
           <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <EnterIcon className="w-8 h-8 text-white mb-2" />
              <p className="font-bold text-white">Enter Studio</p>
              <p className="text-xs text-gray-300">{sectionData.items.length} items</p>
          </div>
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