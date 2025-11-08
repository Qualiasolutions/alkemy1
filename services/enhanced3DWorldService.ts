/**
 * Enhanced 3D World Service
 * Combines Gaussian Splatting with existing 3D generation capabilities
 */

import { generate3DWorld, generateWorldQuickPreview, type Generate3DWorldResult } from './3dWorldService';
import { gaussianSplatService, type GaussianWorld } from './gaussianSplatService';

export type WorldType = 'gaussian-splat' | 'emu-world' | 'import';

export interface Enhanced3DWorldOptions {
    prompt?: string;
    type: WorldType;
    sourceFile?: File;
    sourceUrl?: string;
    container?: HTMLElement;
    onProgress?: (progress: number, status: string) => void;
}

export interface Enhanced3DWorld {
    id: string;
    type: WorldType;
    prompt?: string;
    gaussianWorld?: GaussianWorld;
    emuWorld?: Generate3DWorldResult;
    lumaWorld?: any;
    createdAt: Date;
    metadata?: Record<string, any>;
}

class Enhanced3DWorldService {
    private worlds: Map<string, Enhanced3DWorld> = new Map();

    /**
     * Generate or import a 3D world based on type
     */
    async createWorld(options: Enhanced3DWorldOptions): Promise<Enhanced3DWorld> {
        const worldId = `world_${Date.now()}`;
        const { type, prompt, sourceFile, sourceUrl, container, onProgress } = options;

        const world: Enhanced3DWorld = {
            id: worldId,
            type,
            prompt,
            createdAt: new Date()
        };

        try {
            switch (type) {
                case 'gaussian-splat':
                    if (sourceFile && container) {
                        // Import gaussian splat from file
                        onProgress?.(10, 'Loading gaussian splat file...');
                        const viewer = await gaussianSplatService.createViewer(container);
                        await gaussianSplatService.loadSplatFile(viewer, sourceFile, {
                            onProgress: (progress) => onProgress?.(10 + progress * 0.8, 'Loading splat data...')
                        });

                        world.gaussianWorld = {
                            viewer,
                            sceneId: worldId,
                            metadata: {
                                title: sourceFile.name,
                                format: 'gaussian-splat',
                                generatedAt: new Date()
                            }
                        };
                        onProgress?.(100, 'Gaussian splat loaded successfully!');
                    } else if (sourceUrl && container) {
                        // Load gaussian splat from URL
                        onProgress?.(10, 'Fetching gaussian splat from URL...');
                        world.gaussianWorld = await gaussianSplatService.createGaussianWorld(
                            container,
                            sourceUrl,
                            { prompt, title: prompt },
                            (progress) => onProgress?.(10 + progress * 0.8, 'Loading splat data...')
                        );
                        onProgress?.(100, 'Gaussian splat loaded successfully!');
                    }
                    break;

                case 'emu-world':
                    if (prompt) {
                        // Generate world using Emu3-Gen
                        onProgress?.(5, 'Generating 3D world with Emu3-Gen...');
                        world.emuWorld = await generate3DWorld({
                            prompt,
                            onProgress: (progress, status) => onProgress?.(progress * 0.9, status)
                        });
                        onProgress?.(95, 'Processing generated world...');
                        world.metadata = {
                            views: world.emuWorld.world?.views
                        };
                        onProgress?.(100, 'Emu world generated successfully!');
                    }
                    break;


                case 'import':
                    // Handle generic 3D model import
                    if (sourceFile) {
                        const ext = sourceFile.name.toLowerCase().split('.').pop();
                        if (gaussianSplatService.isSupportedFile(sourceFile) && container) {
                            // It's a gaussian splat file
                            return this.createWorld({
                                ...options,
                                type: 'gaussian-splat'
                            });
                        } else {
                            throw new Error(`Unsupported file format: ${ext}`);
                        }
                    }
                    break;
            }

            this.worlds.set(worldId, world);
            return world;

        } catch (error) {
            console.error('Failed to create 3D world:', error);
            throw error;
        }
    }

    /**
     * Generate preview for any world type
     */
    async generatePreview(prompt: string, type: WorldType = 'emu-world'): Promise<string> {
        switch (type) {
            case 'emu-world':
                return generateWorldQuickPreview(prompt);
            default:
                throw new Error(`Preview not available for type: ${type}`);
        }
    }

    /**
     * Export world in various formats
     */
    async exportWorld(
        worldId: string,
        format: 'screenshot' | 'camera-path' | 'metadata'
    ): Promise<any> {
        const world = this.worlds.get(worldId);
        if (!world) {
            throw new Error('World not found');
        }

        switch (format) {
            case 'screenshot':
                if (world.gaussianWorld) {
                    return gaussianSplatService.takeScreenshot(world.gaussianWorld.viewer);
                }
                break;

            case 'camera-path':
                if (world.gaussianWorld) {
                    // Export camera animation path
                    const keyframes = [
                        { time: 0 },
                        { time: 1000 },
                        { time: 2000 }
                    ];
                    return gaussianSplatService.exportCameraPath(
                        world.gaussianWorld.viewer,
                        keyframes
                    );
                }
                break;

            case 'metadata':
                return {
                    id: world.id,
                    type: world.type,
                    prompt: world.prompt,
                    createdAt: world.createdAt,
                    metadata: world.metadata
                };
        }
    }

    /**
     * Animate camera through the world
     */
    async animateWorldCamera(
        worldId: string,
        path: Array<{ position: number[]; lookAt: number[]; duration: number }>
    ): Promise<void> {
        const world = this.worlds.get(worldId);
        if (!world?.gaussianWorld) {
            throw new Error('World not found or not a gaussian splat');
        }

        return new Promise((resolve) => {
            gaussianSplatService.animateCameraPath(
                world.gaussianWorld.viewer,
                path,
                resolve
            );
        });
    }

    /**
     * Get list of demo scenes
     */
    getDemoScenes() {
        return {
            gaussianSplat: gaussianSplatService.getDemoScenes(),
            prompts: [
                {
                    name: 'Fantasy Castle',
                    prompt: 'A majestic fantasy castle on a floating island with waterfalls',
                    type: 'emu-world' as WorldType
                },
                {
                    name: 'Cyberpunk City',
                    prompt: 'Neon-lit cyberpunk city street at night with holographic advertisements',
                    type: 'emu-world' as WorldType
                },
                {
                    name: 'Ancient Temple',
                    prompt: 'Ancient temple ruins overgrown with vines in a misty jungle',
                    type: 'emu-world' as WorldType
                }
            ]
        };
    }

    /**
     * Dispose of a world and clean up resources
     */
    disposeWorld(worldId: string) {
        const world = this.worlds.get(worldId);
        if (world) {
            if (world.gaussianWorld) {
                gaussianSplatService.disposeViewer(world.gaussianWorld.sceneId);
            }
            this.worlds.delete(worldId);
        }
    }

    /**
     * Get world by ID
     */
    getWorld(worldId: string): Enhanced3DWorld | undefined {
        return this.worlds.get(worldId);
    }

    /**
     * Get all worlds
     */
    getAllWorlds(): Enhanced3DWorld[] {
        return Array.from(this.worlds.values());
    }
}

// Export singleton instance
export const enhanced3DWorldService = new Enhanced3DWorldService();

// Re-export types for convenience
export type { GaussianWorld } from './gaussianSplatService';
export type { Generate3DWorldResult } from './3dWorldService';