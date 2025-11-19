
// Pollinations.AI API Service - 100% FREE Image Generation
// No API key required! Community-funded open-source project
// Supports: FLUX Schnell, FLUX Realism, FLUX Anime, Stable Diffusion Turbo

import { getFallbackImageUrl } from './fallbackContent';

const importMetaEnv = typeof import.meta !== 'undefined' ? (import.meta as any)?.env ?? {} : {};
const truthyStrings = new Set(['true', '1', 'yes', 'on']);

function resolveBooleanEnv(...keys: string[]): boolean {
    for (const key of keys) {
        const candidates = [
            typeof importMetaEnv[key] === 'string' ? importMetaEnv[key] : undefined,
            typeof process !== 'undefined' ? process.env?.[key] : undefined
        ];
        for (const candidate of candidates) {
            if (typeof candidate === 'string') {
                const normalized = candidate.trim().toLowerCase();
                if (truthyStrings.has(normalized)) {
                    return true;
                }
            }
        }
    }
    return false;
}

const FORCE_DEMO_MODE = resolveBooleanEnv('VITE_FORCE_DEMO_MODE', 'FORCE_DEMO_MODE', 'USE_FALLBACK_MODE', 'VITE_USE_FALLBACK_MODE');

const API_BASE_URL = 'https://image.pollinations.ai/prompt';

// Available models on Pollinations.AI
export type PollinationsImageModel = 'FLUX Schnell' | 'FLUX Realism' | 'FLUX Anime' | 'Stable Diffusion';

const MODEL_IDS: Record<PollinationsImageModel, string> = {
    'FLUX Schnell': 'flux',
    'FLUX Realism': 'flux-realism',
    'FLUX Anime': 'flux-anime',
    'Stable Diffusion': 'turbo',
};

/**
 * Convert aspect ratio to width/height dimensions
 */
const aspectRatioToDimensions = (aspectRatio: string): { width: number; height: number } => {
    const ratioMap: Record<string, { width: number; height: number }> = {
        '1:1': { width: 1024, height: 1024 },
        '16:9': { width: 1344, height: 768 },
        '9:16': { width: 768, height: 1344 },
        '4:3': { width: 1024, height: 768 },
        '3:4': { width: 768, height: 1024 },
    };
    return ratioMap[aspectRatio] || ratioMap['16:9'];
};

/**
 * Generate image using Pollinations.AI (100% FREE!)
 *
 * @param prompt - Text description of the image
 * @param model - Model to use (FLUX Schnell, FLUX Realism, etc.)
 * @param aspectRatio - Aspect ratio (16:9, 1:1, etc.)
 * @param onProgress - Progress callback (0-100)
 * @param seed - Optional seed for reproducibility
 * @returns Promise resolving to image URL
 */
export async function generateImageWithPollinations(
    prompt: string,
    model: PollinationsImageModel,
    aspectRatio: string,
    onProgress?: (progress: number) => void,
    seed?: number,
    loraOptions?: { path: string; scale?: number }
): Promise<string> {
    if (FORCE_DEMO_MODE) {
        console.warn('[Pollinations.AI] Demo mode active – returning placeholder image.');
        onProgress?.(100);
        return getFallbackImageUrl(aspectRatio, `pollinations-fallback-${model}`);
    }

    try {
        console.log('[Pollinations.AI] Generating image...', {
            model,
            prompt: prompt.substring(0, 100),
            aspectRatio,
            seed
        });

        onProgress?.(20);

        const { width, height } = aspectRatioToDimensions(aspectRatio);
        const modelId = MODEL_IDS[model];

        // Encode prompt for URL
        const encodedPrompt = encodeURIComponent(prompt);

        // Construct URL with parameters
        const params = new URLSearchParams({
            width: width.toString(),
            height: height.toString(),
            model: modelId,
            nologo: 'true', // Remove Pollinations watermark
            enhance: 'true', // Enhance prompt quality
        });

        if (seed !== undefined) {
            params.append('seed', seed.toString());
        }

        if (loraOptions?.path) {
            params.append('lora', loraOptions.path);
            if (loraOptions.scale) {
                params.append('lora_scale', loraOptions.scale.toString());
            }
        }

        // Add LoRA support if provided in the prompt or context (we'll need to update the function signature next)
        // For now, we'll assume the prompt might contain magic LoRA syntax or we'll add a specific param later.

        const imageUrl = `${API_BASE_URL}/${encodedPrompt}?${params.toString()}`;

        onProgress?.(40);

        console.log('[Pollinations.AI] Fetching image from URL...');

        // Fetch the image to verify it exists and convert to base64
        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw new Error(`Failed to generate image: ${response.status} ${response.statusText}`);
        }

        onProgress?.(80);

        // Convert to blob and then to data URL for consistency
        const blob = await (response as Response).blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to convert image to data URL'));
            reader.readAsDataURL(blob);
        });

        onProgress?.(100);

        console.log('[Pollinations.AI] Image generation complete!', {
            model,
            size: `${width}x${height}`
        });

        return dataUrl;

    } catch (error) {
        console.error('[Pollinations.AI] Error during image generation:', error);
        onProgress?.(100);

        let errorMessage = 'Image generation failed. ';
        if (error instanceof Error) {
            errorMessage += error.message;
        } else {
            errorMessage += 'An unknown error occurred.';
        }

        throw new Error(errorMessage);
    }
};

/**
 * Check if Pollinations.AI is available (always true - no API key needed!)
 */
export function isPollinationsAvailable(): boolean {
    return !FORCE_DEMO_MODE; // Always available unless in demo mode
}

/**
 * Get display name for Pollinations.AI models
 */
export function getPollinationsModelDisplayName(model: PollinationsImageModel): string {
    return model; // Model names are already display-friendly
};

/**
 * Get all available Pollinations models
 */
export function getAvailablePollinationsModels(): PollinationsImageModel[] {
    return ['FLUX Schnell', 'FLUX Realism', 'FLUX Anime', 'Stable Diffusion'];
};
