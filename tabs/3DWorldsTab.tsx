/**
 * 3D Worlds Tab
 * Interface for generating, importing, and viewing 3D worlds with Gaussian Splatting
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GaussianSplatViewer } from '@/components/GaussianSplatViewer';
import { enhanced3DWorldService, type Enhanced3DWorld, type WorldType } from '@/services/enhanced3DWorldService';
import { useTheme } from '@/theme/ThemeContext';
import type { ScriptAnalysis } from '@/types';

interface ThreeDWorldsTabProps {
    scriptAnalysis: ScriptAnalysis | null;
}

export function ThreeDWorldsTab({ scriptAnalysis }: ThreeDWorldsTabProps) {
    const { colors } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const viewerContainerRef = useRef<HTMLDivElement>(null);

    const [activeWorld, setActiveWorld] = useState<Enhanced3DWorld | null>(null);
    const [worlds, setWorlds] = useState<Enhanced3DWorld[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationStatus, setGenerationStatus] = useState('');
    const [prompt, setPrompt] = useState('');
    const [worldType, setWorldType] = useState<WorldType>('emu-world');
    const [showGallery, setShowGallery] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const demoScenes = enhanced3DWorldService.getDemoScenes();

    const handleGenerateWorld = async () => {
        if (!prompt.trim() || isGenerating) return;

        setIsGenerating(true);
        setGenerationProgress(0);
        setGenerationStatus('Initializing generation...');

        try {
            const world = await enhanced3DWorldService.createWorld({
                type: worldType,
                prompt: prompt.trim(),
                container: viewerContainerRef.current || undefined,
                onProgress: (progress, status) => {
                    setGenerationProgress(progress);
                    setGenerationStatus(status);
                }
            });

            setWorlds(prev => [...prev, world]);
            setActiveWorld(world);
            setGenerationStatus('Generation complete!');
        } catch (error) {
            console.error('Failed to generate world:', error);
            setGenerationStatus('Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isSupported = file.name.match(/\.(ply|splat|ksplat|spz)$/i);
        if (!isSupported) {
            alert('Please upload a supported file format: .ply, .splat, .ksplat, or .spz');
            return;
        }

        setSelectedFile(file);
        setIsGenerating(true);
        setGenerationProgress(0);
        setGenerationStatus('Loading file...');

        try {
            const world = await enhanced3DWorldService.createWorld({
                type: 'gaussian-splat',
                sourceFile: file,
                container: viewerContainerRef.current || undefined,
                onProgress: (progress, status) => {
                    setGenerationProgress(progress);
                    setGenerationStatus(status);
                }
            });

            setWorlds(prev => [...prev, world]);
            setActiveWorld(world);
            setGenerationStatus('File loaded successfully!');
        } catch (error) {
            console.error('Failed to load file:', error);
            setGenerationStatus('Failed to load file');
        } finally {
            setIsGenerating(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleLoadDemo = async (demoUrl: string, demoName: string) => {
        setIsGenerating(true);
        setGenerationProgress(0);
        setGenerationStatus('Loading demo scene...');

        try {
            const world = await enhanced3DWorldService.createWorld({
                type: 'gaussian-splat',
                sourceUrl: demoUrl,
                container: viewerContainerRef.current || undefined,
                onProgress: (progress, status) => {
                    setGenerationProgress(progress);
                    setGenerationStatus(status);
                }
            });

            world.metadata = {
                ...world.metadata,
                title: demoName,
                isDemo: true
            };

            setWorlds(prev => [...prev, world]);
            setActiveWorld(world);
            setGenerationStatus('Demo loaded successfully!');
        } catch (error) {
            console.error('Failed to load demo:', error);
            setGenerationStatus('Failed to load demo');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportScreenshot = async () => {
        if (!activeWorld) return;

        try {
            const screenshot = await enhanced3DWorldService.exportWorld(
                activeWorld.id,
                'screenshot'
            );

            if (screenshot) {
                const link = document.createElement('a');
                link.href = screenshot;
                link.download = `world-${activeWorld.id}.png`;
                link.click();
            }
        } catch (error) {
            console.error('Failed to export screenshot:', error);
        }
    };

    const handleDeleteWorld = (worldId: string) => {
        enhanced3DWorldService.disposeWorld(worldId);
        setWorlds(prev => prev.filter(w => w.id !== worldId));
        if (activeWorld?.id === worldId) {
            setActiveWorld(null);
        }
    };

    return (
        <div
            className="h-full flex flex-col"
            style={{ backgroundColor: colors.bg_primary }}
        >
            {/* Header */}
            <div
                className="border-b px-6 py-4"
                style={{ borderColor: colors.border_primary }}
            >
                <h2
                    className="text-xl font-semibold mb-2"
                    style={{ color: colors.text_primary }}
                >
                    3D Worlds
                </h2>
                <p style={{ color: colors.text_secondary }}>
                    Generate, import, and explore immersive 3D environments using Gaussian Splatting technology
                </p>
            </div>

            {/* Controls */}
            <div
                className="border-b px-6 py-4"
                style={{ borderColor: colors.border_primary }}
            >
                <div className="flex gap-4 items-end">
                    {/* Generation Type Selector */}
                    <div className="flex-none">
                        <label
                            className="block text-sm mb-2"
                            style={{ color: colors.text_secondary }}
                        >
                            Generation Type
                        </label>
                        <select
                            value={worldType}
                            onChange={(e) => setWorldType(e.target.value as WorldType)}
                            className="px-3 py-2 rounded-lg"
                            style={{
                                backgroundColor: colors.bg_secondary,
                                color: colors.text_primary,
                                border: `1px solid ${colors.border_primary}`
                            }}
                        >
                            <option value="emu-world">Emu3-Gen World</option>
                            <option value="gaussian-splat">Import Splat</option>
                        </select>
                    </div>

                    {/* Prompt Input */}
                    {worldType === 'emu-world' && (
                        <div className="flex-1">
                            <label
                                className="block text-sm mb-2"
                                style={{ color: colors.text_secondary }}
                            >
                                World Description
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe the 3D world you want to generate..."
                                    className="flex-1 px-3 py-2 rounded-lg"
                                    style={{
                                        backgroundColor: colors.bg_secondary,
                                        color: colors.text_primary,
                                        border: `1px solid ${colors.border_primary}`
                                    }}
                                    disabled={isGenerating}
                                />
                                <button
                                    onClick={handleGenerateWorld}
                                    disabled={!prompt.trim() || isGenerating}
                                    className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: colors.accent_primary,
                                        color: colors.bg_primary
                                    }}
                                >
                                    {isGenerating ? 'Generating...' : 'Generate'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* File Upload */}
                    {worldType === 'gaussian-splat' && (
                        <div className="flex-1">
                            <label
                                className="block text-sm mb-2"
                                style={{ color: colors.text_secondary }}
                            >
                                Upload Gaussian Splat File
                            </label>
                            <div className="flex gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".ply,.splat,.ksplat,.spz"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                                    style={{
                                        backgroundColor: colors.accent_primary,
                                        color: colors.bg_primary
                                    }}
                                    disabled={isGenerating}
                                >
                                    Choose File
                                </button>
                                {selectedFile && (
                                    <span
                                        className="py-2 px-3"
                                        style={{ color: colors.text_secondary }}
                                    >
                                        {selectedFile.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowGallery(!showGallery)}
                            className="px-3 py-2 rounded-lg transition-all hover:scale-105"
                            style={{
                                backgroundColor: colors.bg_secondary,
                                color: colors.text_primary,
                                border: `1px solid ${colors.border_primary}`
                            }}
                        >
                            {showGallery ? 'Hide' : 'Show'} Gallery ({worlds.length})
                        </button>
                        {activeWorld && (
                            <button
                                onClick={handleExportScreenshot}
                                className="px-3 py-2 rounded-lg transition-all hover:scale-105"
                                style={{
                                    backgroundColor: colors.bg_secondary,
                                    color: colors.text_primary,
                                    border: `1px solid ${colors.border_primary}`
                                }}
                            >
                                📸 Export
                            </button>
                        )}
                    </div>
                </div>

                {/* Generation Progress */}
                <AnimatePresence>
                    {isGenerating && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4"
                        >
                            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
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
                            <p
                                className="text-sm"
                                style={{ color: colors.text_secondary }}
                            >
                                {generationStatus}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Demo Scenes */}
            <div
                className="px-6 py-3 border-b"
                style={{ borderColor: colors.border_primary }}
            >
                <p
                    className="text-sm mb-2"
                    style={{ color: colors.text_secondary }}
                >
                    Demo Scenes:
                </p>
                <div className="flex gap-2 flex-wrap">
                    {demoScenes.gaussianSplat.map((demo) => (
                        <button
                            key={demo.name}
                            onClick={() => handleLoadDemo(demo.url, demo.name)}
                            className="px-3 py-1.5 rounded-lg text-sm transition-all hover:scale-105"
                            style={{
                                backgroundColor: colors.bg_secondary,
                                color: colors.text_primary,
                                border: `1px solid ${colors.border_primary}`
                            }}
                            disabled={isGenerating}
                        >
                            {demo.name}
                        </button>
                    ))}
                    {demoScenes.prompts.map((demo) => (
                        <button
                            key={demo.name}
                            onClick={() => {
                                setPrompt(demo.prompt);
                                setWorldType(demo.type);
                            }}
                            className="px-3 py-1.5 rounded-lg text-sm transition-all hover:scale-105"
                            style={{
                                backgroundColor: colors.bg_secondary,
                                color: colors.text_primary,
                                border: `1px solid ${colors.border_primary}`
                            }}
                        >
                            💡 {demo.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Viewer */}
                <div className="flex-1 p-6">
                    <div
                        ref={viewerContainerRef}
                        className="w-full h-full rounded-lg overflow-hidden"
                        style={{
                            backgroundColor: colors.bg_secondary,
                            border: `1px solid ${colors.border}`
                        }}
                    >
                        {activeWorld?.gaussianWorld && (
                            <div className="w-full h-full">
                                {/* The viewer is already attached to the container by the service */}
                                <div
                                    className="w-full h-full flex items-center justify-center"
                                    style={{ color: colors.text_secondary }}
                                >
                                    {/* Viewer renders here */}
                                </div>
                            </div>
                        )}
                        {activeWorld?.emuWorld && (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                    <img
                                        src={activeWorld.emuWorld.modelUrl}
                                        alt="Emu World"
                                        className="max-w-full max-h-full rounded-lg"
                                    />
                                    <p
                                        className="mt-4 text-sm"
                                        style={{ color: colors.text_secondary }}
                                    >
                                        Emu3-Gen World (Multi-view available)
                                    </p>
                                </div>
                            </div>
                        )}
                        {!activeWorld && (
                            <div
                                className="w-full h-full flex items-center justify-center"
                                style={{ color: colors.text_tertiary }}
                            >
                                <div className="text-center">
                                    <div className="text-6xl mb-4">🌍</div>
                                    <p>Generate or import a 3D world to begin</p>
                                    <p className="text-sm mt-2">
                                        Support for .ply, .splat, .ksplat, and .spz files
                                    </p>
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
                                <h3
                                    className="font-semibold mb-4"
                                    style={{ color: colors.text_primary }}
                                >
                                    World Gallery
                                </h3>
                                {worlds.length === 0 ? (
                                    <p
                                        className="text-sm"
                                        style={{ color: colors.text_tertiary }}
                                    >
                                        No worlds generated yet
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {worlds.map((world) => (
                                            <div
                                                key={world.id}
                                                onClick={() => setActiveWorld(world)}
                                                className={`p-3 rounded-lg cursor-pointer transition-all hover:scale-102 ${
                                                    activeWorld?.id === world.id ? 'ring-2' : ''
                                                }`}
                                                style={{
                                                    backgroundColor: activeWorld?.id === world.id
                                                        ? colors.bg_tertiary
                                                        : colors.bg_secondary,
                                                    borderColor: colors.accent_primary,
                                                }}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4
                                                        className="font-medium text-sm"
                                                        style={{ color: colors.text_primary }}
                                                    >
                                                        {world.metadata?.title || world.prompt || 'Untitled'}
                                                    </h4>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteWorld(world.id);
                                                        }}
                                                        className="text-xs opacity-75 hover:opacity-100"
                                                        style={{ color: '#ef4444' }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                                <p
                                                    className="text-xs"
                                                    style={{ color: colors.text_secondary }}
                                                >
                                                    Type: {world.type}
                                                </p>
                                                <p
                                                    className="text-xs"
                                                    style={{ color: colors.text_tertiary }}
                                                >
                                                    {new Date(world.createdAt).toLocaleTimeString()}
                                                </p>
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