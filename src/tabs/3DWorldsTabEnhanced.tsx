/**
 * Alkemy 3D World Labs Tab
 *
 * AI-powered 3D world generation with advanced features:
 * - Gaussian Splatting-based worlds
 * - Camera position marking and management
 * - Cinematic lighting presets
 * - Plausibility checking against script constraints
 * - Unreal Engine bridge
 * - Environment LoRA training
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { worldLabsService, type GeneratedWorld, type WorldGenerationRequest } from '../../services/worldLabsService';
import { plausibilityService, type PlausibilityReport } from '../../services/plausibilityService';
import { useTheme } from '../../theme/ThemeContext';
import type { ScriptAnalysis } from '../../types';
import FullScreenWorkspace from '../../components/FullScreenWorkspace';
import PlausibilityMeter from '../../components/3d/PlausibilityMeter';
import CameraPositionControls from '../../components/3d/CameraPositionControls';
import LightingPresets, { PRESETS, type LightingPreset } from '../../components/3d/LightingPresets';

interface ThreeDWorldsTabProps {
    scriptAnalysis: ScriptAnalysis | null;
    currentSceneId?: string;
}

interface SavedCameraPosition {
    id: string;
    name: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    fov: number;
    timestamp: string;
}

export function ThreeDWorldsTab({ scriptAnalysis, currentSceneId }: ThreeDWorldsTabProps) {
    const { colors } = useTheme();
    const viewerRef = useRef<HTMLDivElement>(null);
    const cameraRef = useRef<any>(null);

    const [worlds, setWorlds] = useState<GeneratedWorld[]>([]);
    const [activeWorld, setActiveWorld] = useState<GeneratedWorld | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [prompt, setPrompt] = useState('');

    // World Labs Features
    const [cameraPositions, setCameraPositions] = useState<SavedCameraPosition[]>([]);
    const [currentLightingPreset, setCurrentLightingPreset] = useState<string>('studio');
    const [plausibilityReport, setPlausibilityReport] = useState<PlausibilityReport | null>(null);
    const [unrealConnectionStatus, setUnrealConnectionStatus] = useState<string | null>(null);

    // Generation Settings
    const [quality, setQuality] = useState<'draft' | 'standard' | 'ultra'>('standard');
    const [enablePhysics, setEnablePhysics] = useState(true);
    const [enableLighting, setEnableLighting] = useState(true);
    const [enableInteractivity, setEnableInteractivity] = useState(true);

    // Check plausibility whenever prompt changes
    useEffect(() => {
        if (prompt.trim() && scriptAnalysis) {
            const report = plausibilityService.analyzeRequest(prompt, scriptAnalysis, currentSceneId);
            setPlausibilityReport(report);
        } else {
            setPlausibilityReport(null);
        }
    }, [prompt, scriptAnalysis, currentSceneId]);

    const handleGenerateWorld = async () => {
        if (!prompt.trim() || isGenerating) return;

        setIsGenerating(true);
        setProgress(0);
        setStatus('Initializing World Labs generator...');

        try {
            const request: WorldGenerationRequest = {
                input: prompt.trim(),
                type: 'text',
                quality,
                features: {
                    enablePhysics,
                    enableLighting,
                    enableInteractivity,
                    enableAI: true
                },
                onProgress: (progressValue, statusMessage) => {
                    setProgress(progressValue);
                    setStatus(statusMessage);
                }
            };

            const world = await worldLabsService.generateWorld(request);
            setWorlds(prev => [...prev, world]);
            setActiveWorld(world);
            setStatus('✅ World generation complete!');

            // Attach renderer to viewer
            if (viewerRef.current && world.renderer) {
                viewerRef.current.innerHTML = '';
                viewerRef.current.appendChild(world.renderer.renderer.domElement);
                cameraRef.current = world.renderer.camera;

                // Apply default lighting preset
                applyLightingPreset(PRESETS.find(p => p.id === 'studio')!);
            }

        } catch (error) {
            console.error('Failed to generate world:', error);
            setStatus(`❌ ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveCameraPosition = (name: string, position: any, rotation: any, fov: number) => {
        const newPosition: SavedCameraPosition = {
            id: `cam_${Date.now()}`,
            name,
            position,
            rotation,
            fov,
            timestamp: new Date().toISOString()
        };
        setCameraPositions(prev => [...prev, newPosition]);
    };

    const handleLoadCameraPosition = (position: SavedCameraPosition) => {
        if (!cameraRef.current) return;

        cameraRef.current.position.set(position.position.x, position.position.y, position.position.z);
        cameraRef.current.rotation.set(position.rotation.x, position.rotation.y, position.rotation.z);
        cameraRef.current.fov = position.fov;
        cameraRef.current.updateProjectionMatrix();
    };

    const handleDeleteCameraPosition = (id: string) => {
        setCameraPositions(prev => prev.filter(p => p.id !== id));
    };

    const applyLightingPreset = (preset: LightingPreset) => {
        if (!activeWorld || !activeWorld.scene) return;

        // Remove existing lights
        activeWorld.scene.children
            .filter((child: any) => child.isLight)
            .forEach((light: any) => activeWorld.scene.remove(light));

        // Add new lights based on preset
        const THREE = (window as any).THREE;
        if (!THREE) return;

        // Directional light (sun)
        const sun = new THREE.DirectionalLight(
            preset.config.sun.color,
            preset.config.sun.intensity
        );
        sun.position.set(...preset.config.sun.position);
        activeWorld.scene.add(sun);

        // Ambient light
        const ambient = new THREE.AmbientLight(
            preset.config.ambient.color,
            preset.config.ambient.intensity
        );
        activeWorld.scene.add(ambient);

        // Fog
        if (preset.config.fog?.enabled) {
            activeWorld.scene.fog = new THREE.FogExp2(
                preset.config.fog.color,
                preset.config.fog.density
            );
        } else {
            activeWorld.scene.fog = null;
        }

        setCurrentLightingPreset(preset.id);
    };

    const handleExportToUnreal = async () => {
        if (!activeWorld) return;

        try {
            setUnrealConnectionStatus('Connecting to Unreal Engine...');
            const result = await worldLabsService.exportToUnreal(activeWorld.id);
            setUnrealConnectionStatus(`✅ Connected: ${result.connectionString}`);

            setTimeout(() => setUnrealConnectionStatus(null), 5000);
        } catch (error) {
            setUnrealConnectionStatus(`❌ ${error instanceof Error ? error.message : 'Connection failed'}`);
        }
    };

    const handleTrainLoRA = async () => {
        if (!activeWorld) return;

        try {
            // Simulate taking screenshots from different angles
            const screenshots = ['url1', 'url2', 'url3', 'url4', 'url5'];
            const result = await worldLabsService.trainEnvironmentLoRA(activeWorld.id, screenshots);
            setStatus(`✅ LoRA training queued: ${result.loraId}`);
        } catch (error) {
            setStatus(`❌ ${error instanceof Error ? error.message : 'LoRA training failed'}`);
        }
    };

    return (
        <div className="h-full flex flex-col" style={{ backgroundColor: colors.bg_primary }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border_primary }}>
                <div>
                    <h1 className="text-2xl font-bold mb-1" style={{ color: colors.text_primary }}>
                        🌍 World Labs Generator
                    </h1>
                    <p className="text-sm" style={{ color: colors.text_secondary }}>
                        AI-powered Gaussian Splatting 3D worlds
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportToUnreal}
                        disabled={!activeWorld}
                        className="px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                        style={{
                            backgroundColor: colors.accent_secondary,
                            color: colors.bg_primary
                        }}
                    >
                        🎮 Export to Unreal
                    </button>
                    <button
                        onClick={handleTrainLoRA}
                        disabled={!activeWorld}
                        className="px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                        style={{
                            backgroundColor: colors.accent_primary,
                            color: colors.bg_primary
                        }}
                    >
                        🎨 Train Environment LoRA
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Controls */}
                <div className="w-96 border-r overflow-y-auto p-6 space-y-6"
                    style={{ borderColor: colors.border_primary }}>

                    {/* Generation Input */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.text_secondary }}>
                            World Description
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the 3D world you want to create..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg border resize-none"
                            style={{
                                backgroundColor: colors.bg_secondary,
                                borderColor: colors.border_secondary,
                                color: colors.text_primary
                            }}
                        />
                    </div>

                    {/* Plausibility Meter */}
                    {plausibilityReport && (
                        <PlausibilityMeter report={plausibilityReport} isLoading={false} />
                    )}

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
                                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                                    style={{
                                        backgroundColor: quality === q ? colors.accent_primary : colors.bg_tertiary,
                                        color: quality === q ? colors.bg_primary : colors.text_secondary
                                    }}
                                >
                                    {q.charAt(0).toUpperCase() + q.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Feature Toggles */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.text_secondary }}>
                            Features
                        </label>
                        <div className="space-y-2">
                            {[
                                { key: 'physics', label: 'Physics', value: enablePhysics, setter: setEnablePhysics },
                                { key: 'lighting', label: 'Advanced Lighting', value: enableLighting, setter: setEnableLighting },
                                { key: 'interactivity', label: 'Interactivity', value: enableInteractivity, setter: setEnableInteractivity }
                            ].map(({ key, label, value, setter }) => (
                                <label key={key} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={(e) => setter(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm" style={{ color: colors.text_primary }}>{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerateWorld}
                        disabled={!prompt.trim() || isGenerating}
                        className="w-full py-3 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                        style={{
                            backgroundColor: colors.accent_primary,
                            color: colors.bg_primary
                        }}
                    >
                        {isGenerating ? `Generating... ${progress}%` : '✨ Generate World'}
                    </button>

                    {/* Status */}
                    {status && (
                        <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: colors.bg_tertiary, color: colors.text_secondary }}>
                            {status}
                        </div>
                    )}

                    {unrealConnectionStatus && (
                        <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: colors.bg_tertiary, color: colors.text_secondary }}>
                            {unrealConnectionStatus}
                        </div>
                    )}

                    {/* Lighting Presets */}
                    {activeWorld && (
                        <LightingPresets
                            onApplyPreset={applyLightingPreset}
                            currentPresetId={currentLightingPreset}
                        />
                    )}
                </div>

                {/* Right Panel - 3D Viewer */}
                <div className="flex-1 relative">
                    <div ref={viewerRef} className="w-full h-full bg-black" />

                    {/* Camera Position Controls Overlay */}
                    {activeWorld && (
                        <div className="absolute top-4 right-4 z-10">
                            <CameraPositionControls
                                positions={cameraPositions}
                                onSavePosition={handleSaveCameraPosition}
                                onLoadPosition={handleLoadCameraPosition}
                                onDeletePosition={handleDeleteCameraPosition}
                                currentCamera={cameraRef.current}
                            />
                        </div>
                    )}

                    {/* Empty State */}
                    {!activeWorld && !isGenerating && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🌍</div>
                                <p className="text-xl font-medium mb-2" style={{ color: colors.text_primary }}>
                                    No world generated yet
                                </p>
                                <p className="text-sm" style={{ color: colors.text_tertiary }}>
                                    Enter a description and click Generate World
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ThreeDWorldsTab;
