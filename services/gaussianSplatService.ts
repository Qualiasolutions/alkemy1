/**
 * Gaussian Splatting Service for 3D World Generation
 * Handles loading, rendering, and exporting gaussian splat scenes
 */

import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

interface GaussianSplatOptions {
    cameraUp?: number[];
    initialCameraPosition?: number[];
    initialCameraLookAt?: number[];
    sphericalHarmonicsDegree?: number;
    renderMode?: GaussianSplats3D.RenderMode;
    antialiased?: boolean;
    sharedMemoryForWorkers?: boolean;
    integerBasedSort?: boolean;
    dynamicScene?: boolean;
    webXRMode?: GaussianSplats3D.WebXRMode;
    gpuAcceleratedSort?: boolean;
}

export interface GaussianWorld {
    viewer: GaussianSplats3D.Viewer;
    sceneId: string;
    metadata?: {
        title?: string;
        description?: string;
        prompt?: string;
        generatedAt?: Date;
        format?: string;
    };
}

class GaussianSplatService {
    private viewers: Map<string, GaussianWorld> = new Map();
    private defaultOptions: GaussianSplatOptions = {
        cameraUp: [0, -1, -0.6],
        initialCameraPosition: [-1, -4, 6],
        initialCameraLookAt: [0, 4, 0],
        sphericalHarmonicsDegree: 2,
        renderMode: GaussianSplats3D.RenderMode.OnChange,
        antialiased: true,
        sharedMemoryForWorkers: true,
        integerBasedSort: true,
        dynamicScene: false,
        gpuAcceleratedSort: true
    };

    /**
     * Create a new gaussian splat viewer
     */
    async createViewer(
        container: HTMLElement,
        options?: GaussianSplatOptions
    ): Promise<GaussianSplats3D.Viewer> {
        const viewerOptions = {
            ...this.defaultOptions,
            ...options,
            rootElement: container
        };

        const viewer = new GaussianSplats3D.Viewer(viewerOptions);
        return viewer;
    }

    /**
     * Load a gaussian splat scene from URL
     */
    async loadSplatScene(
        viewer: GaussianSplats3D.Viewer,
        url: string,
        options?: {
            splatAlphaRemovalThreshold?: number;
            showLoadingUI?: boolean;
            position?: number[];
            rotation?: number[];
            scale?: number[];
            onProgress?: (progress: number) => void;
        }
    ): Promise<void> {
        const sceneOptions = {
            splatAlphaRemovalThreshold: options?.splatAlphaRemovalThreshold ?? 1,
            showLoadingUI: options?.showLoadingUI ?? true,
            position: options?.position ?? [0, 0, 0],
            rotation: options?.rotation ?? [0, 0, 0, 1],
            scale: options?.scale ?? [1, 1, 1]
        };

        await viewer.addSplatScene(url, sceneOptions, options?.onProgress);
    }

    /**
     * Load a gaussian splat scene from file
     */
    async loadSplatFile(
        viewer: GaussianSplats3D.Viewer,
        file: File,
        options?: {
            onProgress?: (progress: number) => void;
        }
    ): Promise<void> {
        const url = URL.createObjectURL(file);
        try {
            await this.loadSplatScene(viewer, url, options);
        } finally {
            // Clean up the object URL after loading
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    }

    /**
     * Create and load a complete gaussian world
     */
    async createGaussianWorld(
        container: HTMLElement,
        sourceUrl: string,
        metadata?: GaussianWorld['metadata'],
        onProgress?: (progress: number) => void
    ): Promise<GaussianWorld> {
        const viewer = await this.createViewer(container);
        await this.loadSplatScene(viewer, sourceUrl, { onProgress });

        const sceneId = `scene_${Date.now()}`;
        const world: GaussianWorld = {
            viewer,
            sceneId,
            metadata: {
                ...metadata,
                generatedAt: new Date()
            }
        };

        this.viewers.set(sceneId, world);
        return world;
    }

    /**
     * Load multiple splat scenes for comparison
     */
    async loadMultipleSplats(
        viewer: GaussianSplats3D.Viewer,
        urls: string[],
        onProgress?: (index: number, progress: number) => void
    ): Promise<void> {
        for (let i = 0; i < urls.length; i++) {
            await this.loadSplatScene(viewer, urls[i], {
                position: [i * 5, 0, 0], // Offset each scene
                onProgress: (progress) => onProgress?.(i, progress)
            });
        }
    }

    /**
     * Get camera position and orientation
     */
    getCameraState(viewer: GaussianSplats3D.Viewer) {
        const camera = viewer.camera;
        return {
            position: camera.position.toArray(),
            rotation: camera.quaternion.toArray(),
            fov: camera.fov,
            aspect: camera.aspect
        };
    }

    /**
     * Set camera position and orientation
     */
    setCameraState(
        viewer: GaussianSplats3D.Viewer,
        state: {
            position?: number[];
            rotation?: number[];
            fov?: number;
        }
    ) {
        const camera = viewer.camera;
        if (state.position) {
            camera.position.fromArray(state.position);
        }
        if (state.rotation) {
            camera.quaternion.fromArray(state.rotation);
        }
        if (state.fov) {
            camera.fov = state.fov;
        }
        camera.updateProjectionMatrix();
    }

    /**
     * Animate camera along a path
     */
    animateCameraPath(
        viewer: GaussianSplats3D.Viewer,
        path: Array<{ position: number[]; lookAt: number[]; duration: number }>,
        onComplete?: () => void
    ) {
        let currentIndex = 0;

        const animateToNext = () => {
            if (currentIndex >= path.length) {
                onComplete?.();
                return;
            }

            const point = path[currentIndex];
            // Simple linear interpolation - could be enhanced with easing
            const startPos = viewer.camera.position.toArray();
            const targetPos = point.position;
            const steps = 60 * (point.duration / 1000); // 60 FPS
            let step = 0;

            const animate = () => {
                if (step >= steps) {
                    currentIndex++;
                    animateToNext();
                    return;
                }

                const t = step / steps;
                const pos = startPos.map((s, i) => s + (targetPos[i] - s) * t);
                viewer.camera.position.fromArray(pos);
                viewer.camera.lookAt(...point.lookAt);
                viewer.camera.updateProjectionMatrix();

                step++;
                requestAnimationFrame(animate);
            };

            animate();
        };

        animateToNext();
    }

    /**
     * Export camera path for timeline integration
     */
    exportCameraPath(
        viewer: GaussianSplats3D.Viewer,
        keyframes: Array<{ time: number }>
    ) {
        return keyframes.map(kf => ({
            time: kf.time,
            camera: this.getCameraState(viewer)
        }));
    }

    /**
     * Take a screenshot of the current view
     */
    async takeScreenshot(viewer: GaussianSplats3D.Viewer): Promise<string> {
        const canvas = viewer.renderer.domElement;
        return canvas.toDataURL('image/png');
    }

    /**
     * Dispose of a viewer and clean up resources
     */
    disposeViewer(sceneId: string) {
        const world = this.viewers.get(sceneId);
        if (world) {
            world.viewer.dispose();
            this.viewers.delete(sceneId);
        }
    }

    /**
     * Dispose of all viewers
     */
    disposeAll() {
        for (const [sceneId] of this.viewers) {
            this.disposeViewer(sceneId);
        }
    }

    /**
     * Get supported file formats
     */
    getSupportedFormats(): string[] {
        return ['.ply', '.splat', '.ksplat', '.spz'];
    }

    /**
     * Check if a file is a supported format
     */
    isSupportedFile(file: File): boolean {
        const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
        return extension ? this.getSupportedFormats().includes(extension) : false;
    }

    /**
     * Get demo splat URLs for testing
     * Note: Hugging Face URLs require authentication, use public demos or uploaded files
     */
    getDemoScenes(): Array<{ name: string; url: string; description: string }> {
        return [
            {
                name: 'Sample Scene',
                url: 'https://antimatter15.com/splat-data/train.splat',
                description: 'Demo gaussian splat scene'
            }
        ];
    }
}

// Export singleton instance
export const gaussianSplatService = new GaussianSplatService();

// Export types and classes for external use
export { GaussianSplats3D };