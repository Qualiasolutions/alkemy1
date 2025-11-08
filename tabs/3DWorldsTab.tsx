/**
 * Enterprise 3D Worlds Tab
 *
 * Production-ready 3D world generation with:
 * - Advanced Gaussian Splatting
 * - Rapier3D physics
 * - Professional camera controls
 * - Multi-format export
 * - Real-time performance monitoring
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { advancedWorldService, type AdvancedWorld, type AdvancedWorldOptions } from '@/services/advancedWorldService';
import { useTheme } from '@/theme/ThemeContext';
import type { ScriptAnalysis } from '@/types';

// Icon components - modern SVG icons
const GalleryIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const StatsIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const WorldIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const LoadingIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const CubeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const LightIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const PhysicsIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

interface ThreeDWorldsTabProps {
    scriptAnalysis: ScriptAnalysis | null;
}

export function ThreeDWorldsTab({ scriptAnalysis }: ThreeDWorldsTabProps) {
    const { colors } = useTheme();
    const viewerContainerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number>();

    const [activeWorld, setActiveWorld] = useState<AdvancedWorld | null>(null);
    const [worlds, setWorlds] = useState<AdvancedWorld[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationStatus, setGenerationStatus] = useState('');
    const [prompt, setPrompt] = useState('');
    const [quality, setQuality] = useState<'draft' | 'standard' | 'ultra'>('standard');
    const [cameraType, setCameraType] = useState<'orbit' | 'first-person' | 'cinematic'>('orbit');
    const [showStats, setShowStats] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Feature toggles
    const [features, setFeatures] = useState({
        physics: true,
        lighting: true,
        shadows: true,
        postprocessing: false,
        collisions: true,
        interactions: true
    });

    // Performance settings
    const [performance, setPerformance] = useState({
        lod: true,
        frustumCulling: true,
        instancing: true,
        targetFPS: 60
    });

    const handleGenerateWorld = async () => {
        if (!prompt.trim() || isGenerating) return;

        setIsGenerating(true);
        setGenerationProgress(0);
        setGenerationStatus('Initializing advanced world generation...');

        try {
            const options: AdvancedWorldOptions = {
                prompt: prompt.trim(),
                quality,
                features: {
                    ...features,
                    postprocessing: false // Disable for now due to three-stdlib issues
                },
                camera: {
                    type: cameraType,
                    autoRotate: cameraType === 'orbit',
                    fov: 75
                },
                performance,
                onProgress: (progress, status) => {
                    setGenerationProgress(progress);
                    setGenerationStatus(status);
                }
            };

            const world = await advancedWorldService.generateWorld(options);

            setWorlds(prev => [...prev, world]);
            setActiveWorld(world);

            // Attach to container after generation
            if (viewerContainerRef.current) {
                viewerContainerRef.current.innerHTML = '';
                viewerContainerRef.current.appendChild(world.renderer.domElement);
            }

            setGenerationStatus('World generation complete');
        } catch (error) {
            console.error('Failed to generate world:', error);
            setGenerationStatus(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteWorld = (worldId: string) => {
        advancedWorldService.disposeWorld(worldId);
        setWorlds(prev => prev.filter(w => w.id !== worldId));
        if (activeWorld?.id === worldId) {
            setActiveWorld(null);
            if (viewerContainerRef.current) {
                viewerContainerRef.current.innerHTML = '';
            }
        }
    };

    const handleSwitchWorld = (world: AdvancedWorld) => {
        setActiveWorld(world);
        if (viewerContainerRef.current) {
            viewerContainerRef.current.innerHTML = '';
            viewerContainerRef.current.appendChild(world.renderer.domElement);
        }
    };

    const handleExportWorld = async (format: 'gltf' | 'glb' | 'draco' | 'splat') => {
        if (!activeWorld) return;

        try {
            await advancedWorldService.exportWorld(activeWorld.id, format);
            setGenerationStatus(`Exported as ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Failed to export world:', error);
            setGenerationStatus(`Export failed`);
        }
    };

    const handleToggleStats = () => {
        advancedWorldService.toggleStats();
        setShowStats(!showStats);
    };

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return (
        <div className="h-full flex flex-col" style={{ backgroundColor: colors.bg_primary }}>
            {/* Header */}
            <div className="border-b px-6 py-4" style={{ borderColor: colors.border_primary }}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.accent_primary }}>
                        <WorldIcon className="w-5 h-5" style={{ color: colors.bg_primary }} />
                    </div>
                    <h2 className="text-xl font-semibold" style={{ color: colors.text_primary }}>
                        Enterprise 3D World Generator
                    </h2>
                </div>
                <p style={{ color: colors.text_secondary }}>
                    Advanced Gaussian Splatting with Rapier3D physics and real-time rendering
                </p>
            </div>

            {/* Top Toolbar */}
            <div className="border-b px-6 py-3 flex justify-between items-center" style={{ borderColor: colors.border_primary }}>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowGallery(!showGallery)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            showGallery ? 'ring-2' : ''
                        }`}
                        style={{
                            backgroundColor: showGallery ? colors.accent_primary : colors.bg_secondary,
                            color: showGallery ? colors.bg_primary : colors.text_primary,
                            border: `1px solid ${colors.border_primary}`
                        }}
                    >
                        <GalleryIcon className="w-4 h-4" />
                        Gallery ({worlds.length})
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            showSettings ? 'ring-2' : ''
                        }`}
                        style={{
                            backgroundColor: showSettings ? colors.accent_primary : colors.bg_secondary,
                            color: showSettings ? colors.bg_primary : colors.text_primary,
                            border: `1px solid ${colors.border_primary}`
                        }}
                    >
                        <SettingsIcon className="w-4 h-4" />
                        Settings
                    </button>
                    <button
                        onClick={handleToggleStats}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            showStats ? 'ring-2' : ''
                        }`}
                        style={{
                            backgroundColor: showStats ? colors.accent_primary : colors.bg_secondary,
                            color: showStats ? colors.bg_primary : colors.text_primary,
                            border: `1px solid ${colors.border_primary}`
                        }}
                    >
                        <StatsIcon className="w-4 h-4" />
                        {showStats ? 'Hide' : 'Show'} Stats
                    </button>
                </div>

                <div className="flex gap-4 text-xs" style={{ color: colors.text_tertiary }}>
                    <span>Advanced Engine</span>
                    <span>•</span>
                    <span>Rapier3D Physics</span>
                    <span>•</span>
                    <span>Gaussian Splatting</span>
                </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-b px-6 py-4 space-y-4"
                        style={{ borderColor: colors.border_primary }}
                    >
                        {/* Quality Settings */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.text_secondary }}>
                                Quality
                            </label>
                            <div className="flex gap-2">
                                {(['draft', 'standard', 'ultra'] as const).map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setQuality(q)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                                            quality === q ? 'ring-2' : ''
                                        }`}
                                        style={{
                                            backgroundColor: quality === q ? colors.accent_primary : colors.bg_secondary,
                                            color: quality === q ? colors.bg_primary : colors.text_primary,
                                            border: `1px solid ${colors.border_primary}`
                                        }}
                                    >
                                        {q === 'draft' ? 'Fast' : q === 'standard' ? 'Balanced' : 'Ultra'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Camera Type */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.text_secondary }}>
                                Camera
                            </label>
                            <div className="flex gap-2">
                                {(['orbit', 'first-person', 'cinematic'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setCameraType(type)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                                            cameraType === type ? 'ring-2' : ''
                                        }`}
                                        style={{
                                            backgroundColor: cameraType === type ? colors.accent_primary : colors.bg_secondary,
                                            color: cameraType === type ? colors.bg_primary : colors.text_primary,
                                            border: `1px solid ${colors.border_primary}`
                                        }}
                                    >
                                        {type === 'orbit' ? 'Orbit' : type === 'first-person' ? 'First Person' : 'Cinematic'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Features */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.text_secondary }}>
                                Features
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries({
                                    physics: { icon: PhysicsIcon, label: 'Physics' },
                                    lighting: { icon: LightIcon, label: 'Lighting' },
                                    shadows: { icon: LightIcon, label: 'Shadows' },
                                    postprocessing: { icon: CubeIcon, label: 'PostFX' },
                                    collisions: { icon: CubeIcon, label: 'Collisions' },
                                    interactions: { icon: CubeIcon, label: 'Interact' }
                                }).map(([key, { icon: Icon, label }]) => (
                                    <label
                                        key={key}
                                        className="flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-all hover:bg-opacity-10"
                                        style={{
                                            color: features[key as keyof typeof features] ? colors.accent_primary : colors.text_secondary,
                                            backgroundColor: features[key as keyof typeof features] ? `${colors.accent_primary}20` : 'transparent'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={features[key as keyof typeof features]}
                                            onChange={(e) =>
                                                setFeatures(prev => ({
                                                    ...prev,
                                                    [key]: e.target.checked
                                                }))
                                            }
                                            disabled={isGenerating}
                                            className="rounded"
                                        />
                                        <Icon className="w-4 h-4" />
                                        <span className="text-xs font-medium">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Performance */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.text_secondary }}>
                                Performance
                            </label>
                            <div className="flex gap-4 items-center">
                                {[
                                    { key: 'lod', label: 'LOD' },
                                    { key: 'frustumCulling', label: 'Culling' },
                                    { key: 'instancing', label: 'Instancing' }
                                ].map(({ key, label }) => (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer" style={{ color: colors.text_secondary }}>
                                        <input
                                            type="checkbox"
                                            checked={performance[key as keyof typeof performance]}
                                            onChange={(e) =>
                                                setPerformance(prev => ({ ...prev, [key]: e.target.checked }))
                                            }
                                            className="rounded"
                                        />
                                        <span className="text-xs font-medium">{label}</span>
                                    </label>
                                ))}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium" style={{ color: colors.text_secondary }}>
                                        Target FPS:
                                    </span>
                                    <select
                                        value={performance.targetFPS}
                                        onChange={(e) =>
                                            setPerformance(prev => ({ ...prev, targetFPS: Number(e.target.value) }))
                                        }
                                        className="px-2 py-1 rounded text-sm font-medium"
                                        style={{
                                            backgroundColor: colors.bg_secondary,
                                            color: colors.text_primary,
                                            border: `1px solid ${colors.border_primary}`
                                        }}
                                    >
                                        <option value={30}>30</option>
                                        <option value={60}>60</option>
                                        <option value={120}>120</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Section */}
            <div className="border-b px-6 py-4 space-y-4" style={{ borderColor: colors.border_primary }}>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.text_secondary }}>
                            World Description
                        </label>
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the 3D world you want to generate..."
                            className="w-full px-4 py-3 rounded-lg font-medium"
                            style={{
                                backgroundColor: colors.bg_secondary,
                                color: colors.text_primary,
                                border: `1px solid ${colors.border_primary}`
                            }}
                            disabled={isGenerating}
                        />
                    </div>
                    <button
                        onClick={handleGenerateWorld}
                        disabled={!prompt.trim() || isGenerating}
                        className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        style={{
                            backgroundColor: colors.accent_primary,
                            color: colors.bg_primary
                        }}
                    >
                        {isGenerating ? (
                            <>
                                <LoadingIcon className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <PlayIcon className="w-4 h-4" />
                                Generate World
                            </>
                        )}
                    </button>
                </div>

                {/* Generation Progress */}
                <AnimatePresence>
                    {isGenerating && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: colors.bg_tertiary }}>
                                <motion.div
                                    className="h-full"
                                    style={{
                                        backgroundColor: colors.accent_primary,
                                        width: `${generationProgress}%`
                                    }}
                                    animate={{ width: `${generationProgress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            <p className="text-sm font-medium" style={{ color: colors.text_secondary }}>
                                {generationStatus}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* 3D Viewer */}
                <div className="flex-1 p-6">
                    <div
                        ref={viewerContainerRef}
                        className="w-full h-full rounded-lg overflow-hidden relative"
                        style={{
                            backgroundColor: colors.bg_secondary,
                            border: `1px solid ${colors.border_primary}`
                        }}
                    >
                        {activeWorld && (
                            <div
                                className="absolute top-4 left-4 px-3 py-2 rounded-lg text-sm z-10 font-medium"
                                style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    color: 'white',
                                    pointerEvents: 'none',
                                    backdropFilter: 'blur(8px)'
                                }}
                            >
                                <p className="font-semibold mb-1">Controls:</p>
                                <p className="text-xs opacity-90">
                                    {cameraType === 'orbit' ? 'Left Click - Rotate | Right Click - Pan | Scroll - Zoom' :
                                     cameraType === 'first-person' ? 'WASD - Move | Mouse - Look' :
                                     'Cinematic mode - Automatic camera'}
                                </p>
                                {features.interactions && (
                                    <p className="text-xs opacity-90 mt-1">Click objects to interact</p>
                                )}
                            </div>
                        )}

                        {!activeWorld && (
                            <div className="w-full h-full flex items-center justify-center" style={{ color: colors.text_tertiary }}>
                                <div className="text-center max-w-md">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.accent_primary + '20' }}>
                                        <WorldIcon className="w-8 h-8" style={{ color: colors.accent_primary }} />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text_primary }}>
                                        Enterprise 3D World Generator
                                    </h3>
                                    <p className="text-sm mb-6" style={{ color: colors.text_secondary }}>
                                        Powered by advanced Gaussian Splatting and Rapier3D physics
                                    </p>
                                    <div className="flex justify-center gap-6 text-xs font-medium" style={{ color: colors.text_tertiary }}>
                                        <div className="flex items-center gap-1">
                                            <CheckIcon className="w-3 h-3" style={{ color: colors.accent_primary }} />
                                            Photorealistic
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckIcon className="w-3 h-3" style={{ color: colors.accent_primary }} />
                                            Physics-Based
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckIcon className="w-3 h-3" style={{ color: colors.accent_primary }} />
                                            Production Ready
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gallery Sidebar */}
                <AnimatePresence>
                    {showGallery && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: 320 }}
                            exit={{ width: 0 }}
                            className="border-l overflow-y-auto"
                            style={{ borderColor: colors.border_primary }}
                        >
                            <div className="p-4">
                                <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.text_primary }}>
                                    <GalleryIcon className="w-4 h-4" />
                                    World Gallery
                                </h3>

                                {worlds.length === 0 ? (
                                    <p className="text-sm text-center py-8" style={{ color: colors.text_tertiary }}>
                                        No worlds generated yet
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {worlds.map((world) => (
                                            <div
                                                key={world.id}
                                                onClick={() => handleSwitchWorld(world)}
                                                className={`p-3 rounded-lg cursor-pointer transition-all ${
                                                    activeWorld?.id === world.id ? 'ring-2' : 'hover:scale-[1.02]'
                                                }`}
                                                style={{
                                                    backgroundColor: activeWorld?.id === world.id
                                                        ? colors.bg_tertiary
                                                        : colors.bg_secondary,
                                                    borderColor: colors.accent_primary,
                                                    border: activeWorld?.id === world.id ? '2px solid' : '1px solid'
                                                }}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-medium text-sm truncate" style={{ color: colors.text_primary }}>
                                                        World {world.id.split('_').pop()?.substring(0, 8)}
                                                    </h4>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteWorld(world.id);
                                                        }}
                                                        className="p-1 rounded opacity-75 hover:opacity-100 transition-opacity"
                                                        style={{ color: '#ef4444' }}
                                                    >
                                                        <TrashIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="text-xs space-y-1">
                                                    <p style={{ color: colors.text_secondary }}>
                                                        Quality: <span className="capitalize">{quality}</span>
                                                    </p>
                                                    <p style={{ color: colors.text_secondary }}>
                                                        Splats: {world.metadata.splatCount.toLocaleString()}
                                                    </p>
                                                    <p style={{ color: colors.text_tertiary }}>
                                                        {new Date(world.metadata.lastUpdated).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Export Options */}
                            {activeWorld && (
                                <div className="p-4 border-t" style={{ borderColor: colors.border_primary }}>
                                    <h4 className="font-semibold mb-3 text-sm flex items-center gap-2" style={{ color: colors.text_primary }}>
                                        <DownloadIcon className="w-4 h-4" />
                                        Export World
                                    </h4>
                                    <div className="space-y-2">
                                        {(['glb', 'gltf', 'draco', 'splat'] as const).map((format) => (
                                            <button
                                                key={format}
                                                onClick={() => handleExportWorld(format)}
                                                className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                                                style={{
                                                    backgroundColor: colors.bg_secondary,
                                                    color: colors.text_primary,
                                                    border: `1px solid ${colors.border_primary}`
                                                }}
                                            >
                                                <DownloadIcon className="w-3 h-3" />
                                                Export as {format.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}