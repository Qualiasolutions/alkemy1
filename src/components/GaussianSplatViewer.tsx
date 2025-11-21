/**
 * Gaussian Splat Viewer Component
 * Renders 3D gaussian splat scenes with interactive controls
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Service was removed - component stubbed out for now
type GaussianWorld = {
    id: string;
    loaded: boolean;
};
import { useTheme } from '@/theme/ThemeContext';

interface GaussianSplatViewerProps {
    sourceUrl?: string;
    sourceFile?: File;
    onLoad?: (world: GaussianWorld) => void;
    onError?: (error: Error) => void;
    onProgress?: (progress: number) => void;
    height?: string;
    className?: string;
    showControls?: boolean;
    metadata?: {
        title?: string;
        description?: string;
        prompt?: string;
    };
}

export function GaussianSplatViewer({
    sourceUrl,
    sourceFile,
    onLoad,
    onError,
    onProgress,
    height = '600px',
    className = '',
    showControls = true,
    metadata
}: GaussianSplatViewerProps) {
    const { colors } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const worldRef = useRef<GaussianWorld | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [cameraMode, setCameraMode] = useState<'orbit' | 'fly' | 'locked'>('orbit');
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;
        if (!sourceUrl && !sourceFile) return;

        let mounted = true;

        const loadScene = async () => {
            // Gaussian splat service removed - feature temporarily disabled
            if (mounted) {
                setError('3D Gaussian Splat viewing is temporarily unavailable');
                setIsLoading(false);
                onError?.(new Error('GaussianSplatService not available'));
            }
        };

        const loadFile = async () => {
            // Gaussian splat service removed - feature temporarily disabled
            if (mounted) {
                setError('3D Gaussian Splat file loading is temporarily unavailable');
                setIsLoading(false);
                onError?.(new Error('GaussianSplatService not available'));
            }
        };

        if (sourceFile) {
            loadFile();
        } else if (sourceUrl) {
            loadScene();
        }

        return () => {
            mounted = false;
            // Service cleanup removed - no longer needed
            worldRef.current = null;
        };
    }, [sourceUrl, sourceFile]);

    const handleFullscreen = () => {
        if (!containerRef.current) return;

        if (!isFullscreen) {
            containerRef.current.requestFullscreen?.();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.();
            setIsFullscreen(false);
        }
    };

    const handleScreenshot = async () => {
        // Screenshot feature disabled - service not available
        console.warn('Screenshot feature temporarily unavailable');
    };

    const handleResetCamera = () => {
        // Camera reset disabled - service not available
        console.warn('Camera reset feature temporarily unavailable');
    };

    return (
        <div
            className={`relative ${className}`}
            style={{
                height,
                backgroundColor: colors.bg_secondary,
                borderRadius: '8px',
                overflow: 'hidden'
            }}
        >
            {/* Viewer Container */}
            <div
                ref={containerRef}
                className="w-full h-full"
                style={{
                    position: 'relative',
                    cursor: cameraMode === 'fly' ? 'crosshair' : 'grab'
                }}
            />

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{
                            backgroundColor: `${colors.bg_primary}CC`,
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <div className="text-center">
                            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
                                <motion.div
                                    className="h-full"
                                    style={{
                                        backgroundColor: colors.accent_primary,
                                        width: `${loadProgress}%`
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${loadProgress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            <p style={{ color: colors.text_primary }}>
                                Loading Gaussian Splat... {loadProgress}%
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Overlay */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                            backgroundColor: `${colors.bg_primary}CC`,
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <div className="text-center px-8">
                            <p style={{ color: '#ef4444' }} className="mb-2">
                                Error Loading Scene
                            </p>
                            <p style={{ color: colors.text_secondary }} className="text-sm">
                                {error}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls */}
            {showControls && !isLoading && !error && (
                <div className="absolute top-4 right-4 flex gap-2">
                    <button
                        onClick={handleScreenshot}
                        className="px-3 py-1.5 rounded-lg backdrop-blur-md transition-all hover:scale-105"
                        style={{
                            backgroundColor: `${colors.bg_secondary}CC`,
                            color: colors.text_primary,
                            border: `1px solid ${colors.border_primary}`
                        }}
                        title="Take Screenshot"
                    >
                        📸
                    </button>
                    <button
                        onClick={handleResetCamera}
                        className="px-3 py-1.5 rounded-lg backdrop-blur-md transition-all hover:scale-105"
                        style={{
                            backgroundColor: `${colors.bg_secondary}CC`,
                            color: colors.text_primary,
                            border: `1px solid ${colors.border_primary}`
                        }}
                        title="Reset Camera"
                    >
                        🔄
                    </button>
                    <button
                        onClick={handleFullscreen}
                        className="px-3 py-1.5 rounded-lg backdrop-blur-md transition-all hover:scale-105"
                        style={{
                            backgroundColor: `${colors.bg_secondary}CC`,
                            color: colors.text_primary,
                            border: `1px solid ${colors.border_primary}`
                        }}
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                        {isFullscreen ? '🔳' : '⬜'}
                    </button>
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className="px-3 py-1.5 rounded-lg backdrop-blur-md transition-all hover:scale-105"
                        style={{
                            backgroundColor: `${colors.bg_secondary}CC`,
                            color: colors.text_primary,
                            border: `1px solid ${colors.border_primary}`
                        }}
                        title="Info"
                    >
                        ℹ️
                    </button>
                </div>
            )}

            {/* Camera Mode Selector */}
            {showControls && !isLoading && !error && (
                <div className="absolute bottom-4 left-4 flex gap-2">
                    {(['orbit', 'fly', 'locked'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setCameraMode(mode)}
                            className={`px-3 py-1.5 rounded-lg backdrop-blur-md transition-all ${
                                cameraMode === mode ? 'scale-105' : 'opacity-75 hover:opacity-100'
                            }`}
                            style={{
                                backgroundColor: cameraMode === mode
                                    ? colors.accent_primary
                                    : `${colors.bg_secondary}CC`,
                                color: cameraMode === mode
                                    ? colors.bg_primary
                                    : colors.text_primary,
                                border: `1px solid ${cameraMode === mode ? colors.accent_primary : colors.border}`
                            }}
                        >
                            {mode === 'orbit' && '🔄 Orbit'}
                            {mode === 'fly' && '✈️ Fly'}
                            {mode === 'locked' && '🔒 Locked'}
                        </button>
                    ))}
                </div>
            )}

            {/* Info Panel */}
            <AnimatePresence>
                {showInfo && metadata && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute top-16 right-4 w-80 p-4 rounded-lg backdrop-blur-md"
                        style={{
                            backgroundColor: `${colors.bg_secondary}CC`,
                            border: `1px solid ${colors.border_primary}`
                        }}
                    >
                        {metadata.title && (
                            <h3 style={{ color: colors.text_primary }} className="font-semibold mb-2">
                                {metadata.title}
                            </h3>
                        )}
                        {metadata.prompt && (
                            <p style={{ color: colors.text_secondary }} className="text-sm mb-2">
                                <strong>Prompt:</strong> {metadata.prompt}
                            </p>
                        )}
                        {metadata.description && (
                            <p style={{ color: colors.text_secondary }} className="text-sm">
                                {metadata.description}
                            </p>
                        )}
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.border }}>
                            <p style={{ color: colors.text_tertiary }} className="text-xs">
                                <strong>Controls:</strong><br/>
                                • Left click + drag to orbit<br/>
                                • Right click + drag to pan<br/>
                                • Scroll to zoom<br/>
                                • W/A/S/D to move (Fly mode)
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}