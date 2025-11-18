// This is the new RefinementStudio implementation to replace the old one
// Replace lines 203-431 in SceneAssemblerTab.tsx

    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentImage, setCurrentImage] = useState(baseGeneration.url!);
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
                baseGeneration.aspectRatio,
                {
                    projectId: currentProject?.id || null,
                    userId: user?.id || null,
                    sceneId: scene?.id || null,
                    frameId: frame?.id || null
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
                onUpdateFrame(prevFrame => ({
                    ...prevFrame,
                    generations: [...(prevFrame.generations || []), {
                        id: `gen-${Date.now()}`,
                        url: refinedImageUrl,
                        aspectRatio: baseGeneration.aspectRatio,
                        isLoading: false
                    }],
                    refinedGenerationUrls: [...(prevFrame.refinedGenerationUrls || []), refinedImageUrl]
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
            onUpdateFrame(prev => ({
                ...prev,
                media: { ...prev.media, start_frame_url: currentImage },
                status: FrameStatus.GeneratedStill
            }));
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
                            <p className="text-xs text-white/60">Shot {frame?.shot_number || 'N/A'} • {baseGeneration.aspectRatio}</p>
                        </div>

                        {/* Prompt Input */}
                        <div className="space-y-3">
                            <label className="text-xs text-white/60 uppercase tracking-widest font-medium">Refinement Prompt</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (prompt.trim() && !isGenerating) handleRefine();
                                    }
                                }}
                                placeholder="Describe what you want to change..."
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#dfec2d] focus:border-transparent focus:bg-white/10 transition-all resize-none"
                                disabled={isGenerating}
                            />

                            <button
                                onClick={handleRefine}
                                disabled={!prompt.trim() || isGenerating}
                                className="w-full py-3 bg-[#dfec2d] hover:bg-[#b3e617] disabled:bg-white/10 disabled:text-white/50 text-black font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#dfec2d]/50 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
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
                                                    ? 'bg-[#dfec2d]/20 border-[#dfec2d]/50 text-white'
                                                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                    currentImage === version.url ? 'bg-[#dfec2d]' : 'bg-white/40'
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
                                <AlkemyLoadingIcon className="w-16 h-16 text-[#dfec2d] mb-4 animate-spin" />
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
                            className="w-full h-full object-contain"
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
                        className="absolute top-6 right-6 bg-[#dfec2d]/90 hover:bg-[#dfec2d] text-black font-semibold px-6 py-3 rounded-lg transition-all flex items-center gap-2 shadow-lg backdrop-blur-sm z-20"
                    >
                        <CheckIcon className="w-5 h-5" />
                        Set as Hero & Close
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
