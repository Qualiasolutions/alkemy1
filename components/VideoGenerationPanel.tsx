import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalyzedCharacter, AnalyzedLocation, Moodboard, MoodboardTemplate } from '../types';
import Button from './Button';
import { FileVideoIcon, SparklesIcon, XIcon, PaperclipIcon, PlayIcon, PauseIcon, DownloadIcon, RefreshCwIcon } from './icons/Icons';
import { transferMotionWan } from '../services/wanService';

interface VideoGenerationPanelProps {
    item: {
        type: 'character' | 'location';
        data: AnalyzedCharacter | AnalyzedLocation;
    };
    moodboard?: Moodboard;
    moodboardTemplates?: MoodboardTemplate[];
    onUpdateItem: (updater: (prev: AnalyzedCharacter | AnalyzedLocation) => AnalyzedCharacter | AnalyzedLocation) => void;
}

interface VideoGeneration {
    id: string;
    prompt: string;
    url?: string;
    status: 'generating' | 'ready' | 'error';
    progress: number;
    error?: string;
    thumbnailUrl?: string;
    duration?: number;
}

const VideoGenerationPanel: React.FC<VideoGenerationPanelProps> = ({ item, moodboard, moodboardTemplates, onUpdateItem }) => {
    const [videoPrompt, setVideoPrompt] = useState('');
    const [videoGenerations, setVideoGenerations] = useState<VideoGeneration[]>([]);
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<VideoGeneration | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

    // Auto-generate videos when user enters a prompt and presses enter
    const handleGenerateVideo = async () => {
        if (!videoPrompt.trim() || isGenerating) return;

        const newVideoId = `video-${Date.now()}`;
        const newVideo: VideoGeneration = {
            id: newVideoId,
            prompt: videoPrompt,
            status: 'generating',
            progress: 0
        };

        setVideoGenerations(prev => [newVideo, ...prev]);
        setIsGenerating(true);

        try {
            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setVideoGenerations(prev => prev.map(v =>
                    v.id === newVideoId
                        ? { ...v, progress: Math.min(v.progress + 10, 90) }
                        : v
                ));
            }, 500);

            // Use the main image as reference if available
            const referenceImage = attachedImage || item.data.imageUrl;

            if (!referenceImage) {
                throw new Error('Reference image is required for video generation');
            }

            // Generate the video using WAN service
            const videoUrl = await transferMotionWan(
                referenceImage, // sourceUrl
                videoPrompt,    // prompt
                4,             // videoDuration (4 seconds)
                undefined,     // seed (optional)
                1.5           // cfgScale (optional)
            );

            clearInterval(progressInterval);

            // Update the video with the generated URL
            setVideoGenerations(prev => prev.map(v =>
                v.id === newVideoId
                    ? {
                        ...v,
                        url: videoUrl,
                        status: 'ready',
                        progress: 100,
                        duration: 4 // Default 4 second video
                    }
                    : v
            ));

            // Clear prompt after successful generation
            setVideoPrompt('');
            setAttachedImage(null);

            // Update the item with the new video
            onUpdateItem(prev => ({
                ...prev,
                videoGenerations: [
                    ...(prev.videoGenerations || []),
                    { id: newVideoId, url: videoUrl, prompt: videoPrompt }
                ]
            }));

        } catch (error) {
            console.error('Failed to generate video:', error);
            setVideoGenerations(prev => prev.map(v =>
                v.id === newVideoId
                    ? {
                        ...v,
                        status: 'error',
                        error: error instanceof Error ? error.message : 'Failed to generate video',
                        progress: 0
                    }
                    : v
            ));
        } finally {
            setIsGenerating(false);
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

    const handleRetryVideo = (video: VideoGeneration) => {
        setVideoPrompt(video.prompt);
        setVideoGenerations(prev => prev.filter(v => v.id !== video.id));
        handleGenerateVideo();
    };

    const handleDownloadVideo = (videoUrl: string, prompt: string) => {
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = `${item.data.name}-${prompt.slice(0, 30)}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 p-5 border-b-2 border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileVideoIcon className="w-5 h-5 text-purple-400" />
                    Video Generation
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                    Create dynamic videos for {item.data.name}
                </p>
            </div>

            {/* Video List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <AnimatePresence>
                    {videoGenerations.map((video) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                                video.status === 'generating'
                                    ? 'border-yellow-500/30 bg-yellow-900/10'
                                    : video.status === 'error'
                                    ? 'border-red-500/30 bg-red-900/10'
                                    : 'border-purple-500/30 bg-purple-900/10 hover:border-purple-400/50'
                            }`}
                        >
                            {/* Video Player or Loading State */}
                            <div className="h-64 relative bg-black/50">
                                {video.status === 'generating' ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 relative">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                                className="absolute inset-0 rounded-full border-4 border-purple-500/30"
                                            />
                                            <motion.div
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                                className="absolute inset-2 rounded-full border-4 border-pink-500/30"
                                            />
                                        </div>
                                        <p className="text-white font-semibold text-sm mt-4">Generating video...</p>
                                        <div className="w-48 bg-gray-700 rounded-full h-2 mt-3">
                                            <motion.div
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${video.progress}%` }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">{video.progress}%</p>
                                    </div>
                                ) : video.status === 'error' ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                        <XIcon className="w-10 h-10 text-red-500 mb-2" />
                                        <p className="text-red-400 text-sm font-semibold">Generation Failed</p>
                                        <p className="text-gray-500 text-xs mt-1 text-center">{video.error}</p>
                                        <button
                                            onClick={() => handleRetryVideo(video)}
                                            className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                                        >
                                            <RefreshCwIcon className="w-3 h-3" />
                                            Retry
                                        </button>
                                    </div>
                                ) : video.url ? (
                                    <div className="relative group">
                                        <video
                                            ref={(el) => { if (el) videoRefs.current[video.id] = el; }}
                                            src={video.url}
                                            className="w-full h-full object-contain"
                                            loop
                                            muted
                                            playsInline
                                            onMouseEnter={(e) => e.currentTarget.play()}
                                            onMouseLeave={(e) => e.currentTarget.pause()}
                                        />
                                        {/* Video Controls Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                                <button
                                                    onClick={() => {
                                                        const video = videoRefs.current[video.id];
                                                        if (video) {
                                                            if (video.paused) video.play();
                                                            else video.pause();
                                                        }
                                                    }}
                                                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all"
                                                >
                                                    <PlayIcon className="w-4 h-4 text-white" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadVideo(video.url!, video.prompt)}
                                                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all"
                                                >
                                                    <DownloadIcon className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Video Info */}
                            <div className="p-3 border-t border-purple-500/20">
                                <p className="text-xs text-gray-300 line-clamp-2">{video.prompt}</p>
                                {video.duration && (
                                    <p className="text-xs text-gray-500 mt-1">{video.duration}s video</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Empty State */}
                {videoGenerations.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileVideoIcon className="w-16 h-16 text-purple-700 mb-4" />
                        <p className="text-gray-400 font-semibold mb-2">No videos yet</p>
                        <p className="text-gray-500 text-sm">Enter a prompt below to generate videos</p>
                    </div>
                )}
            </div>

            {/* Generation Form */}
            <div className="flex-shrink-0 p-5 border-t-2 border-purple-500/20 bg-gradient-to-t from-[#0a0a0a] to-transparent">
                <div className="space-y-3">
                    {/* Attached Image Preview */}
                    {attachedImage && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative inline-block"
                        >
                            <img
                                src={attachedImage}
                                alt="Reference"
                                className="w-20 h-20 object-cover rounded-lg border-2 border-purple-500/30"
                            />
                            <button
                                onClick={() => setAttachedImage(null)}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-all"
                            >
                                <XIcon className="w-3 h-3 text-white" />
                            </button>
                        </motion.div>
                    )}

                    {/* Input Area */}
                    <div className="relative bg-gray-800/40 rounded-xl border border-purple-500/30 p-3 focus-within:border-purple-400/50 transition-all">
                        <div className="flex items-start gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileAttach}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-shrink-0 p-2 text-gray-400 hover:text-purple-400 rounded-lg hover:bg-purple-500/10 transition-all"
                            >
                                <PaperclipIcon className="w-4 h-4" />
                            </button>
                            <textarea
                                value={videoPrompt}
                                onChange={(e) => setVideoPrompt(e.target.value)}
                                placeholder={`Describe a video scene for ${item.data.name}...`}
                                rows={2}
                                className="flex-1 bg-transparent text-sm resize-none focus:outline-none text-gray-100 placeholder-gray-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && videoPrompt.trim()) {
                                        e.preventDefault();
                                        handleGenerateVideo();
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Generate Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerateVideo}
                        disabled={!videoPrompt.trim() || isGenerating}
                        className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                            !videoPrompt.trim() || isGenerating
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                        }`}
                    >
                        <SparklesIcon className="w-4 h-4" />
                        {isGenerating ? 'Generating...' : 'Generate Video'}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default VideoGenerationPanel;