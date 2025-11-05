/**
 * 3D World Generation Service - Powered by Emu3-Gen
 *
 * Generates navigable 3D worlds using Emu3-Gen multimodal model.
 * Creates spatiotemporally consistent multi-view environments for immersive exploration.
 *
 * Model: baaivision/emu3-gen via Replicate API
 * Features:
 * - Multi-view generation for cube-map/skybox
 * - Spatiotemporally consistent world modeling
 * - Progressive exploration with dynamic view generation
 * - Seamless navigation through AI-generated environments
 */

import { generateNavigableWorld, exploreWorldDirection, generateWorldPreview, type WorldGenerationOptions, type GeneratedWorld, type WorldView } from './emuWorldService';

export interface Generate3DWorldOptions {
    prompt: string;
    onProgress?: (progress: number, status: string) => void;
}

export interface Generate3DWorldResult {
    modelUrl: string; // For backward compatibility, returns primary view URL
    thumbnailUrl?: string;
    generationId: string;
    world?: GeneratedWorld; // Full world data with all views
}

/**
 * Generate a navigable 3D world from a text prompt
 *
 * This function generates multiple views of an environment that can be assembled
 * into a navigable 3D space using cube mapping or skybox techniques.
 *
 * @param options Generation options including prompt and progress callback
 * @returns Promise with generated world data including multi-view images
 */
export async function generate3DWorld(options: Generate3DWorldOptions): Promise<Generate3DWorldResult> {
    const { prompt, onProgress } = options;

    try {
        onProgress?.(5, 'Initializing Emu3-Gen world generation...');

        // Generate complete navigable world with 6 views
        const world = await generateNavigableWorld({
            prompt,
            numViews: 6, // Generate all 6 cube faces
            guidanceScale: 3,
            onProgress: (progress, status) => {
                // Map 0-100 progress from world generation to 5-95 in total flow
                const mappedProgress = 5 + (progress * 0.9);
                onProgress?.(mappedProgress, status);
            }
        });

        onProgress?.(98, 'Finalizing world data...');

        // Use front view as primary/thumbnail for backward compatibility
        const frontView = world.views.find(v => v.direction === 'front');
        const modelUrl = frontView?.imageUrl || world.views[0].imageUrl;

        onProgress?.(100, 'World generation complete!');

        return {
            modelUrl, // Primary front view
            thumbnailUrl: modelUrl,
            generationId: world.id,
            world // Complete world data with all views
        };

    } catch (error) {
        console.error('3D world generation error:', error);
        throw new Error(
            error instanceof Error
                ? `Failed to generate 3D world: ${error.message}`
                : 'Failed to generate 3D world'
        );
    }
}

/**
 * Generate a quick preview of the world (front view only)
 * Useful for fast feedback before generating full world
 */
export async function generateWorldQuickPreview(
    prompt: string,
    onProgress?: (progress: number, status: string) => void
): Promise<string> {
    try {
        return await generateWorldPreview(prompt, onProgress);
    } catch (error) {
        console.error('World preview error:', error);
        throw new Error(
            error instanceof Error
                ? `Failed to generate preview: ${error.message}`
                : 'Failed to generate preview'
        );
    }
}

/**
 * Explore world in a specific direction
 * Generates new view as user navigates beyond initial world boundaries
 */
export async function exploreWorld(
    world: GeneratedWorld,
    direction: WorldView['direction'],
    onProgress?: (progress: number, status: string) => void
): Promise<WorldView> {
    try {
        return await exploreWorldDirection(world, direction, onProgress);
    } catch (error) {
        console.error('World exploration error:', error);
        throw new Error(
            error instanceof Error
                ? `Failed to explore world: ${error.message}`
                : 'Failed to explore world'
        );
    }
}

/**
 * Validate if a URL is a valid image for world generation
 * (Images are used for cube-map textures)
 */
export function isValid3DModelUrl(url: string): boolean {
    if (!url) return false;

    // Accept image URLs (used for skybox textures)
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.glb', '.gltf'];
    const lowerUrl = url.toLowerCase();

    return validExtensions.some(ext => lowerUrl.includes(ext)) || url.startsWith('blob:') || url.startsWith('http');
}

/**
 * Download world view from URL and convert to blob URL for local use
 */
export async function download3DModel(imageUrl: string): Promise<string> {
    try {
        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw new Error(`Failed to download world view: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        return blobUrl;
    } catch (error) {
        console.error('World view download error:', error);
        throw new Error('Failed to download world view');
    }
}

/**
 * Convert world views to cube map texture URLs
 * Returns object with URLs for each face of the cube map
 */
export function worldViewsToCubeMap(world: GeneratedWorld): Record<string, string> {
    const cubeMap: Record<string, string> = {};

    world.views.forEach(view => {
        cubeMap[view.direction] = view.imageUrl;
    });

    return cubeMap;
}

/**
 * Check if world generation is available
 */
export function isWorldGenerationAvailable(): boolean {
    // Emu3-Gen is always available via Replicate proxy
    return true;
}
