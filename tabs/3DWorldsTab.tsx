/**
 * Alkemy 3D Generator Tab
 *
 * AI-powered 3D world generation for film production
 * True AI-generated 3D models with professional quality output
 *
 * Features:
 * - Simple, clean interface
 * - Fast generation (1-3 minutes)
 * - High-quality GLB/GLTF/OBJ/PLY/STL output
 * - Real-time progress tracking
 * - Cloud storage integration
 * - Multiple export formats
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hunyuanWorldService, type HunyuanWorldResult, type HunyuanWorldGenerationJob } from '@/services/hunyuanWorldService';
import { useTheme } from '@/theme/ThemeContext';
import type { ScriptAnalysis } from '@/types';

// Modern SVG Icons
const WorldIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const GenerateIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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

const GalleryIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

interface ThreeDWorldsTabProps {
    scriptAnalysis: ScriptAnalysis | null;
}

export function ThreeDWorldsTab({ scriptAnalysis }: ThreeDWorldsTabProps) {
    const { colors } = useTheme();
    const viewerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [worlds, setWorlds] = useState<HunyuanWorldResult[]>([]);
    const [activeWorld, setActiveWorld] = useState<HunyuanWorldResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [prompt, setPrompt] = useState('');
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [quality, setQuality] = useState<'turbo' | 'fast' | 'standard'>('fast');
    const [resolution, setResolution] = useState<'low' | 'standard' | 'high'>('standard');
    const [format, setFormat] = useState<'glb' | 'obj' | 'ply' | 'stl'>('glb');
    const [showGallery, setShowGallery] = useState(false);
    const [serviceStatus, setServiceStatus] = useState<{
        available: boolean;
        apiStatus: 'online' | 'offline' | 'error';
        activeJobs: number;
    }>({ available: false, apiStatus: 'offline', activeJobs: 0 });

    // Check service status on mount
    useEffect(() => {
        const checkStatus = async () => {
            const status = await hunyuanWorldService.getServiceStatus();
            setServiceStatus(status);
        };
        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // Cancel generation
    const handleCancelGeneration = () => {
        if (abortController) {
            abortController.abort();
            setIsGenerating(false);
            setStatus('Generation cancelled by user');
            setAbortController(null);
        }
    };

    // Generate world from prompt
    const handleGenerateWorld = async () => {
        if (!prompt.trim() || isGenerating) return;

        const controller = new AbortController();
        setAbortController(controller);
        setIsGenerating(true);
        setProgress(0);
        setStatus('Initializing Alkemy 3D Generator...');

        try {
            const world = await hunyuanWorldService.generateWorld({
                prompt: prompt.trim(),
                quality,
                resolution,
                format,
                includeTextures: true,
                onProgress: (progressValue, statusMessage) => {
                    setProgress(progressValue);
                    setStatus(statusMessage);
                }
            });

            setWorlds(prev => [...prev, world]);
            setActiveWorld(world);

            setStatus('✅ World generation complete!');

        } catch (error) {
            console.error('Failed to generate world:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Don't show error if user cancelled
            if (controller.signal.aborted) {
                return;
            }

            setStatus(`❌ ${errorMessage}`);

            // Show helpful message for common issues
            if (errorMessage.includes('timeout') || errorMessage.includes('stalled')) {
                setStatus(`❌ ${errorMessage} The HunyuanWorld Space is experiencing delays. Try again later.`);
            } else if (errorMessage.includes('GPU') || errorMessage.includes('busy') || errorMessage.includes('high load')) {
                setStatus(`❌ ${errorMessage} Click "Generate" to retry.`);
            }
        } finally {
            setIsGenerating(false);
            setAbortController(null);
        }
    };

    // Generate world from script scene
    const handleGenerateFromScript = async () => {
        if (!scriptAnalysis?.scenes.length) return;

        const firstScene = scriptAnalysis.scenes[0];
        const scenePrompt = `A 3D world representing: ${firstScene.description}. ${firstScene.location ? `Setting: ${firstScene.location}.` : ''} Mood: ${firstScene.mood || 'neutral'}. Style: Cinematic, detailed, realistic.`;

        setPrompt(scenePrompt);
        await handleGenerateWorld();
    };

    // Delete world
    const handleDeleteWorld = (worldId: string) => {
        setWorlds(prev => prev.filter(w => w.id !== worldId));
        if (activeWorld?.id === worldId) {
            setActiveWorld(null);
        }
    };

    // Download world
    const handleDownloadWorld = async (world: HunyuanWorldResult) => {
        try {
            const response = await fetch(world.modelUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `world-${world.id.substring(0, 8)}.${world.metadata.format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setStatus(`Downloaded ${world.metadata.format.toUpperCase()} file`);
        } catch (error) {
            console.error('Download failed:', error);
            setStatus('Download failed');
        }
    };

    // Load world in 3D viewer
    useEffect(() => {
        if (!activeWorld || !viewerRef.current) return;

        const loadModel = async () => {
            const viewer = viewerRef.current;
            if (!viewer) return;

            viewer.innerHTML = '';

            // Create Three.js viewer for GLB/GLTF models
            if (activeWorld.metadata.format === 'glb' || activeWorld.metadata.format === 'gltf') {
                try {
                    const { scene, GLTFLoader } = await import('three');
                    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');

                    const renderer = new THREE.WebGLRenderer({ antialias: true });
                    const camera = new THREE.PerspectiveCamera(75, viewer.clientWidth / viewer.clientHeight, 0.1, 1000);

                    renderer.setSize(viewer.clientWidth, viewer.clientHeight);
                    renderer.setClearColor(0xf0f0f0);
                    viewer.appendChild(renderer.domElement);

                    const controls = new OrbitControls(camera, renderer.domElement);
                    controls.enableDamping = true;
                    controls.dampingFactor = 0.05;

                    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
                    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
                    directionalLight.position.set(5, 5, 5);

                    const scene3D = new THREE.Scene();
                    scene3D.add(ambientLight);
                    scene3D.add(directionalLight);

                    const loader = new GLTFLoader();
                    loader.load(activeWorld.modelUrl, (gltf) => {
                        scene3D.add(gltf.scene);

                        const box = new THREE.Box3().setFromObject(gltf.scene);
                        const center = box.getCenter(new THREE.Vector3());
                        const size = box.getSize(new THREE.Vector3());

                        gltf.scene.position.sub(center);
                        camera.position.set(size.x, size.y, size.z * 2);
                        controls.target.set(0, 0, 0);
                        controls.update();

                        const animate = () => {
                            requestAnimationFrame(animate);
                            controls.update();
                            renderer.render(scene3D, camera);
                        };
                        animate();
                    });

                } catch (error) {
                    console.error('Failed to load 3D model:', error);
                    viewer.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-center p-8">
                            <div>
                                <p class="text-lg font-semibold mb-2">3D Viewer Error</p>
                                <p class="text-sm opacity-75">Could not load 3D model</p>
                                <a href="${activeWorld.modelUrl}" download class="mt-4 inline-block px-4 py-2 bg-[var(--color-accent-primary)] text-black rounded hover:bg-[var(--color-accent-hover)]">
                                    Download Model
                                </a>
                            </div>
                        </div>
                    `;
                }
            } else {
                // For other formats, show download link
                viewer.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center text-center p-8">
                        <div>
                            <p class="text-lg font-semibold mb-2">3D Model Ready</p>
                            <p class="text-sm opacity-75 mb-4">Format: ${activeWorld.metadata.format.toUpperCase()}</p>
                            <a href="${activeWorld.modelUrl}" download class="inline-block px-4 py-2 bg-[var(--color-accent-primary)] text-black rounded hover:bg-[var(--color-accent-hover)]">
                                Download ${activeWorld.metadata.format.toUpperCase()} File
                            </a>
                        </div>
                    </div>
                `;
            }
        };

        loadModel();
    }, [activeWorld]);

    return (
        <div className="h-full flex flex-col" style={{ backgroundColor: colors.bg_primary }}>
            {/* Header */}
            <div className="border-b px-6 py-4" style={{ borderColor: colors.border_primary }}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.accent_primary }}>
                        <WorldIcon className="w-5 h-5" style={{ color: colors.bg_primary }} />
                    </div>
                    <h2 className="text-xl font-semibold" style={{ color: colors.text_primary }}>
                        Alkemy 3D Generator
                    </h2>
                    <div className="flex items-center gap-1">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{
                                backgroundColor: serviceStatus.available
                                    ? colors.accent_primary
                                    : '#ef4444'
                            }}
                        ></div>
                        <span className="text-xs font-medium" style={{ color: colors.text_secondary }}>
                            {serviceStatus.available ? 'Online' : 'Offline'}
                            {serviceStatus.apiStatus === 'error' && ' (GPU Queue Busy)'}
                        </span>
                    </div>
                </div>
                <p style={{ color: colors.text_secondary }}>
                    AI-powered 3D world generation for professional film production
                </p>
            </div>

            {/* Controls */}
            <div className="border-b px-6 py-4" style={{ borderColor: colors.border_primary }}>
                <div className="flex gap-4 items-end">
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

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.text_secondary }}>
                            Quality
                        </label>
                        <select
                            value={quality}
                            onChange={(e) => setQuality(e.target.value as any)}
                            className="px-4 py-3 rounded-lg font-medium"
                            style={{
                                backgroundColor: colors.bg_secondary,
                                color: colors.text_primary,
                                border: `1px solid ${colors.border_primary}`
                            }}
                            disabled={isGenerating}
                        >
                            <option value="turbo">Turbo (15 steps)</option>
                            <option value="fast">Fast (25 steps)</option>
                            <option value="standard">Standard (30 steps)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.text_secondary }}>
                            Resolution
                        </label>
                        <select
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value as any)}
                            className="px-4 py-3 rounded-lg font-medium"
                            style={{
                                backgroundColor: colors.bg_secondary,
                                color: colors.text_primary,
                                border: `1px solid ${colors.border_primary}`
                            }}
                            disabled={isGenerating}
                        >
                            <option value="low">Low (128)</option>
                            <option value="standard">Standard (256)</option>
                            <option value="high">High (512)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.text_secondary }}>
                            Format
                        </label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as any)}
                            className="px-4 py-3 rounded-lg font-medium"
                            style={{
                                backgroundColor: colors.bg_secondary,
                                color: colors.text_primary,
                                border: `1px solid ${colors.border_primary}`
                            }}
                            disabled={isGenerating}
                        >
                            <option value="glb">GLB</option>
                            <option value="obj">OBJ</option>
                            <option value="ply">PLY</option>
                            <option value="stl">STL</option>
                        </select>
                    </div>

                    {isGenerating ? (
                        <button
                            onClick={handleCancelGeneration}
                            className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-[1.02] flex items-center gap-2"
                            style={{
                                backgroundColor: '#ef4444',
                                color: 'white'
                            }}
                        >
                            <TrashIcon className="w-4 h-4" />
                            Cancel
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerateWorld}
                            disabled={!prompt.trim() || !serviceStatus.available}
                            className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            style={{
                                backgroundColor: colors.accent_primary,
                                color: colors.bg_primary
                            }}
                        >
                            <GenerateIcon className="w-4 h-4" />
                            Generate
                        </button>
                    )}
                </div>

                {/* Quick Actions */}
                {scriptAnalysis?.scenes.length > 0 && (
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={handleGenerateFromScript}
                            disabled={isGenerating}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
                            style={{
                                backgroundColor: colors.bg_secondary,
                                color: colors.text_primary,
                                border: `1px solid ${colors.border_primary}`
                            }}
                        >
                            Generate from Script Scene
                        </button>
                    </div>
                )}

                {/* Progress */}
                <AnimatePresence>
                    {(isGenerating || status) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4"
                        >
                            {isGenerating && (
                                <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: colors.bg_tertiary }}>
                                    <motion.div
                                        className="h-full"
                                        style={{
                                            backgroundColor: colors.accent_primary,
                                            width: `${progress}%`
                                        }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            )}
                            <p className="text-sm font-medium" style={{ color: colors.text_secondary }}>
                                {status}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Toolbar */}
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
                </div>

                <div className="flex gap-4 text-xs" style={{ color: colors.text_tertiary }}>
                    <span>Alkemy 3D</span>
                    <span>•</span>
                    <span>Professional Quality</span>
                    <span>•</span>
                    <span>AI-Powered</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* 3D Viewer */}
                <div className="flex-1 p-6">
                    <div
                        ref={viewerRef}
                        className="w-full h-full rounded-lg overflow-hidden relative"
                        style={{
                            backgroundColor: colors.bg_secondary,
                            border: `1px solid ${colors.border_primary}`
                        }}
                    >
                        {!activeWorld && (
                            <div className="w-full h-full flex items-center justify-center" style={{ color: colors.text_tertiary }}>
                                <div className="text-center max-w-md">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.accent_primary + '20' }}>
                                        <WorldIcon className="w-8 h-8" style={{ color: colors.accent_primary }} />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text_primary }}>
                                        Alkemy 3D Generator
                                    </h3>
                                    <p className="text-sm mb-6" style={{ color: colors.text_secondary }}>
                                        Professional AI-powered 3D world generation for film production
                                    </p>
                                    <div className="flex justify-center gap-6 text-xs font-medium" style={{ color: colors.text_tertiary }}>
                                        <div className="flex items-center gap-1">
                                            <CheckIcon className="w-3 h-3" style={{ color: colors.accent_primary }} />
                                            AI-Powered
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckIcon className="w-3 h-3" style={{ color: colors.accent_primary }} />
                                            High Quality
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
                                                onClick={() => setActiveWorld(world)}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-medium text-sm truncate" style={{ color: colors.text_primary }}>
                                                        {world.metadata.prompt.substring(0, 30)}...
                                                    </h4>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownloadWorld(world);
                                                            }}
                                                            className="p-1 rounded opacity-75 hover:opacity-100 transition-opacity"
                                                            style={{ color: colors.accent_primary }}
                                                        >
                                                            <DownloadIcon className="w-3 h-3" />
                                                        </button>
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
                                                </div>
                                                <div className="text-xs space-y-1">
                                                    <p style={{ color: colors.text_secondary }}>
                                                        Quality: <span className="capitalize">{world.metadata.quality}</span>
                                                    </p>
                                                    <p style={{ color: colors.text_secondary }}>
                                                        Vertices: {world.metadata.vertices.toLocaleString()}
                                                    </p>
                                                    <p style={{ color: colors.text_secondary }}>
                                                        Format: {world.metadata.format.toUpperCase()}
                                                    </p>
                                                    <p style={{ color: colors.text_tertiary }}>
                                                        {new Date(world.metadata.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}