
import React, { useState, useRef, useMemo, useCallback } from 'react';
import { ScriptAnalysis, AnalyzedCharacter } from '../types';
import Button from '../components/Button';
import { UploadCloudIcon, UsersIcon, FilmIcon, XIcon, AlkemyLoadingIcon, ArrowRightIcon, AlertCircleIcon } from '../components/icons/Icons';
import { transferMotionWan, isWanApiAvailable } from '../services/wanService';

interface WanTransferTabProps {
  scriptAnalysis: ScriptAnalysis | null;
}

const WanTransferTab: React.FC<WanTransferTabProps> = ({ scriptAnalysis }) => {
  const [referenceVideo, setReferenceVideo] = useState<File | null>(null);
  const [referenceVideoUrl, setReferenceVideoUrl] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const charactersWithImages = useMemo(() => {
    return scriptAnalysis?.characters.filter(c => !!c.imageUrl) || [];
  }, [scriptAnalysis]);

  const selectedCharacter = useMemo(() => {
    return charactersWithImages.find(c => c.id === selectedCharacterId);
  }, [selectedCharacterId, charactersWithImages]);

  const handleFileChange = (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith('video/')) {
        setReferenceVideo(file);
        const url = URL.createObjectURL(file);
        setReferenceVideoUrl(url);
    } else {
        alert("Please select a valid video file.");
    }
  };
  
  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files);
        }
    }, []);
    
    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };

  const handleRemoveVideo = () => {
    if (referenceVideoUrl) {
        URL.revokeObjectURL(referenceVideoUrl);
    }
    setReferenceVideo(null);
    setReferenceVideoUrl(null);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        if (customAvatarUrl) {
            URL.revokeObjectURL(customAvatarUrl);
        }
        const url = URL.createObjectURL(file);
        setCustomAvatarUrl(url);
        setSelectedCharacterId(''); // Deselect character when custom avatar is uploaded
    } else {
        alert("Please select a valid image file.");
    }
    if (e.target) e.target.value = '';
  };
  
  const handleTransfer = async () => {
    const targetImageUrl = customAvatarUrl || selectedCharacter?.imageUrl;
    if (!referenceVideo || !targetImageUrl) {
        alert("Please provide a reference video and a target avatar.");
        return;
    }

    if (!isWanApiAvailable()) {
        alert("Wan API is not configured. Please add WAN_API_KEY to your environment variables.");
        return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGeneratedVideoUrl(null);
    try {
        const resultUrl = await transferMotionWan(referenceVideo, targetImageUrl, setProgress);
        setGeneratedVideoUrl(resultUrl);
    } catch (error) {
        alert(error instanceof Error ? error.message : "An unknown error occurred during motion transfer.");
    } finally {
        setIsGenerating(false);
    }
  };
  
  const targetAvatarDisplayUrl = customAvatarUrl || selectedCharacter?.imageUrl;

  if (!scriptAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
        <div className={`p-10 border border-dashed border-[var(--color-border-color)] rounded-2xl`}>
          <h2 className="text-3xl font-bold mb-2">Wan 2.5 Motion-Transfer</h2>
          <p className="text-lg text-gray-400 max-w-md">Please analyze a script in the 'Script' tab to access characters for motion transfer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="mb-6">
        <h2 className={`text-2xl font-bold mb-1 text-[var(--color-text-primary)]`}>Wan 2.5 Motion-Transfer</h2>
        <p className={`text-md text-[var(--color-text-secondary)] max-w-3xl`}>Upload a reference video of a real actor and transfer their motion and expressions to your target Avatar.</p>
      </header>


      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Step 1: Reference Motion */}
        <div className={`bg-[var(--color-surface-card)] border border-[var(--color-border-color)] rounded-xl p-6`}>
            <h3 className="text-lg font-semibold mb-4">1. Reference Motion</h3>
            {referenceVideoUrl ? (
                 <div className="relative">
                    <video src={referenceVideoUrl} controls loop className="w-full rounded-lg aspect-video" />
                    <button onClick={handleRemoveVideo} className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-500 transition-colors">
                        <XIcon className="w-4 h-4" />
                    </button>
                 </div>
            ) : (
                <div 
                    onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragEnter} onDragLeave={onDragLeave}
                    onClick={() => videoInputRef.current?.click()}
                    className={`p-10 border-2 border-dashed border-[var(--color-border-color)] rounded-2xl w-full aspect-video cursor-pointer transition-colors duration-300 flex flex-col items-center justify-center text-center ${isDragging ? `border-[var(--color-accent-primary)] bg-[var(--color-hover-background)]` : ''}`}
                >
                    <UploadCloudIcon className="w-10 h-10 text-gray-500 mb-2" />
                    <p className="font-semibold text-gray-400">Upload Reference Video</p>
                    <p className="text-xs text-gray-500">Drag & drop or click</p>
                </div>
            )}
            <input type="file" ref={videoInputRef} onChange={(e) => handleFileChange(e.target.files)} accept="video/*" className="hidden" />
        </div>

        {/* Step 2: Target Avatar */}
        <div className={`bg-[var(--color-surface-card)] border border-[var(--color-border-color)] rounded-xl p-6`}>
            <h3 className="text-lg font-semibold mb-4">2. Target Avatar</h3>
            <div className="flex items-center gap-2 mb-4">
                <select
                    value={selectedCharacterId}
                    onChange={e => { setSelectedCharacterId(e.target.value); setCustomAvatarUrl(null); }}
                    className={`flex-1 bg-[var(--color-background-primary)] border border-[var(--color-border-color)] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]`}
                >
                    <option value="">Select from cast...</option>
                    {charactersWithImages.map(char => (
                        <option key={char.id} value={char.id}>{char.name}</option>
                    ))}
                </select>
                <Button variant="secondary" onClick={() => avatarInputRef.current?.click()}>Upload</Button>
            </div>
             <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
            <div className="aspect-video bg-[#0B0B0B] rounded-md flex items-center justify-center overflow-hidden">
                {targetAvatarDisplayUrl ? (
                    <img src={targetAvatarDisplayUrl} alt="Target Avatar" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center text-gray-500">
                        <UsersIcon className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-sm">Select a character or upload a custom avatar.</p>
                    </div>
                )}
            </div>
        </div>
        
        {/* Step 3: Generate */}
        <div className={`bg-[var(--color-surface-card)] border border-[var(--color-border-color)] rounded-xl p-6`}>
             <h3 className="text-lg font-semibold mb-4">3. Generate Output</h3>
             <div className="aspect-video bg-[#0B0B0B] rounded-md flex items-center justify-center overflow-hidden mb-4">
                {isGenerating ? (
                     <div className="relative z-10 text-center text-white w-full max-w-[80%]">
                        <AlkemyLoadingIcon className="w-12 h-12 mx-auto mb-3 animate-subtle-pulse" />
                        <p className="font-semibold text-sm mb-2">Transferring Motion...</p>
                        <div className="w-full bg-gray-600 rounded-full h-1.5">
                            <div className="bg-teal-500 h-1.5 rounded-full" style={{width: `${progress}%`}}></div>
                        </div>
                        <p className="font-mono text-xs mt-1">{Math.round(progress)}%</p>
                    </div>
                ) : generatedVideoUrl ? (
                    <video src={generatedVideoUrl} controls loop className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center text-gray-500">
                        <FilmIcon className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-sm">Your result will appear here.</p>
                    </div>
                )}
             </div>
             <Button
                onClick={handleTransfer}
                variant="primary"
                className="w-full"
                isLoading={isGenerating}
                disabled={isGenerating || !referenceVideo || !targetAvatarDisplayUrl}
             >
                <ArrowRightIcon className="w-4 h-4" />
                Transfer Motion
             </Button>
        </div>
      </main>
    </div>
  );
};

export default WanTransferTab;
