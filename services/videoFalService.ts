/**
 * FAL.AI Video Generation Service
 * Integrates with FAL.AI API for high-quality video generation
 * Supports: Kling 2.5, SeedDream v4
 */

import { getFallbackVideoBlobs } from './fallbackContent';

const importMetaEnv = typeof import.meta !== 'undefined' ? (import.meta as any)?.env ?? {} : {};

const resolveFalApiKey = (): string => {
    try {
        // Fixed environment variable resolution - check FAL_API_KEY first, then VITE_FAL_API_KEY
        const candidates = [
            importMetaEnv.FAL_API_KEY,        // Check this first
            importMetaEnv.VITE_FAL_API_KEY,   // Then this
        ];
        for (const candidate of candidates) {
            if (typeof candidate === 'string' && candidate.trim()) {
                return candidate.trim().replace(/\n/g, ''); // Remove newlines
            }
        }
    } catch (error) {
        console.warn('[Video FAL Service] Unable to resolve API key from environment:', error);
    }
    return '';
};

const FAL_API_KEY = resolveFalApiKey();

// Debug logging for environment variable resolution
console.log('[Video FAL Service] Environment Variables:', {
    FAL_API_KEY: !!importMetaEnv.FAL_API_KEY,
    FAL_API_KEY_Length: importMetaEnv.FAL_API_KEY?.length,
    VITE_FAL_API_KEY: !!importMetaEnv.VITE_FAL_API_KEY,
    VITE_FAL_API_KEY_Length: importMetaEnv.VITE_FAL_API_KEY?.length,
    RESOLVED_KEY: !!FAL_API_KEY,
    RESOLVED_KEY_Length: FAL_API_KEY?.length,
    ENV_Source: 'import.meta.env'
});

// Video model configurations
// Updated 2025-11-19: Fixed endpoints to match Fal.ai API v2.1
const VIDEO_MODEL_CONFIG = {
    'Kling 2.1 Pro': {
        apiUrl: 'https://fal.run/fal-ai/kling-video/v2.1/pro/text-to-video',
        imageToVideoUrl: 'https://fal.run/fal-ai/kling-video/v2.1/pro/image-to-video',
        displayName: 'Kling 2.1 Pro',
        description: 'Professional-grade cinematic video generation with enhanced motion',
        supportsImageToVideo: true,
        supportsTextToVideo: true,
        maxDuration: 10, // seconds
    },
    'Kling 2.1 Standard': {
        apiUrl: 'https://fal.run/fal-ai/kling-video/v2.1/standard/text-to-video',
        imageToVideoUrl: 'https://fal.run/fal-ai/kling-video/v2.1/standard/image-to-video',
        displayName: 'Kling 2.1 Standard',
        description: 'Cost-efficient high-quality video generation',
        supportsImageToVideo: true,
        supportsTextToVideo: true,
        maxDuration: 10, // seconds
    },
    'WAN 2.1': {
        apiUrl: 'https://fal.run/fal-ai/wan-i2v',
        imageToVideoUrl: 'https://fal.run/fal-ai/wan-i2v',
        displayName: 'WAN 2.1',
        description: 'Professional-grade image-to-video with high motion diversity',
        supportsImageToVideo: true,
        supportsTextToVideo: false,
        maxDuration: 5, // seconds
        refinementOnly: true,
    },
    'Veo 2': {
        apiUrl: 'https://fal.run/fal-ai/veo2/image-to-video',
        imageToVideoUrl: 'https://fal.run/fal-ai/veo2/image-to-video',
        displayName: 'Veo 2 (Google)',
        description: 'Realistic motion and high-quality output up to 8 seconds',
        supportsImageToVideo: true,
        supportsTextToVideo: false,
        maxDuration: 8, // seconds
        refinementOnly: true,
    },
} as const;

export type VideoModelVariant = keyof typeof VIDEO_MODEL_CONFIG;

export const VIDEO_MODEL_VARIANTS = Object.keys(VIDEO_MODEL_CONFIG) as VideoModelVariant[];

export function isVideoModelVariant(model: string): model is VideoModelVariant {
    return VIDEO_MODEL_VARIANTS.includes(model as VideoModelVariant);
};

export function getVideoModelDisplayName(variant: VideoModelVariant): string {
    return VIDEO_MODEL_CONFIG[variant]?.displayName ?? variant;
};

export function getVideoModelDescription(variant: VideoModelVariant): string {
    return VIDEO_MODEL_CONFIG[variant]?.description ?? '';
};

export function isRefinementOnlyModel(variant: VideoModelVariant): boolean {
    return VIDEO_MODEL_CONFIG[variant]?.refinementOnly ?? false;
};

export interface VideoGenerationParams {
    prompt: string;
    image_url?: string; // For image-to-video
    aspect_ratio?: '16:9' | '9:16' | '1:1';
    duration?: number; // Duration in seconds
    seed?: number;
    cfg_scale?: number; // Guidance scale
}

export interface VideoGenerationResult {
    video: {
        url: string;
        duration?: number;
    };
    seed?: number;
    timings?: {
        inference: number;
    };
}

/**
 * Check if FAL video API is available
 */
export function isVideoFalApiAvailable(): boolean {
    return !!FAL_API_KEY && FAL_API_KEY.length > 0;
};

/**
 * Generate video using FAL.AI API
 * @param prompt - Text prompt for video generation
 * @param variant - Video model variant (Kling 2.5, SeedDream v4)
 * @param referenceImageUrl - Optional reference image for image-to-video
 * @param duration - Video duration in seconds
 * @param aspectRatio - Video aspect ratio
 * @param onProgress - Progress callback (0-100)
 * @returns URL of generated video
 */
export async function generateVideoWithFal(
    prompt: string,
    variant: VideoModelVariant = 'Kling 2.5',
    referenceImageUrl?: string,
    duration: number = 5,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
    onProgress?: (progress: number) => void,
    seed?: number,
    cfgScale?: number
): Promise<string> {
    if (!isVideoFalApiAvailable()) {
        throw new Error('FAL API key is not configured. Please set FAL_API_KEY in environment variables.');
    }

    if (!prompt || !prompt.trim()) {
        throw new Error('Please enter a prompt to generate a video.');
    }

    const modelConfig = VIDEO_MODEL_CONFIG[variant];

    // Check if model supports the requested generation type
    if (referenceImageUrl && !modelConfig.supportsImageToVideo) {
        throw new Error(`${modelConfig.displayName} does not support image-to-video generation.`);
    }

    if (!referenceImageUrl && !modelConfig.supportsTextToVideo) {
        throw new Error(`${modelConfig.displayName} requires a reference image (image-to-video only).`);
    }

    // Clamp duration to model max
    const clampedDuration = Math.min(duration, modelConfig.maxDuration);

    console.log('[Video FAL Service] Starting video generation', {
        prompt: prompt.substring(0, 100),
        variant,
        hasReferenceImage: !!referenceImageUrl,
        duration: clampedDuration,
        aspectRatio,
        seed,
        cfgScale,
        timestamp: new Date().toISOString()
    });

    try {
        onProgress?.(10);

        // Choose the appropriate endpoint
        const apiUrl = referenceImageUrl && modelConfig.imageToVideoUrl
            ? modelConfig.imageToVideoUrl
            : modelConfig.apiUrl;

        const requestBody: any = {
            prompt: prompt.trim(),
            aspect_ratio: aspectRatio,
        };

        // Add model-specific parameters
        if (variant === 'Kling 2.5') {
            requestBody.duration = clampedDuration;
            if (referenceImageUrl) {
                requestBody.image_url = referenceImageUrl;
            }
            if (seed !== undefined) {
                requestBody.seed = seed;
            }
            if (cfgScale !== undefined) {
                requestBody.cfg_scale = cfgScale;
            } else {
                requestBody.cfg_scale = 1.5; // Default for Kling
            }
        } else if (variant === 'SeedDream v4') {
            // SeedDream requires reference image
            if (!referenceImageUrl) {
                throw new Error('SeedDream v4 requires a reference image.');
            }
            requestBody.image_url = referenceImageUrl;
            requestBody.duration = clampedDuration;
            if (seed !== undefined) {
                requestBody.seed = seed;
            }
        }

        onProgress?.(30);

        console.log('[Video FAL Service] Sending request to:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${FAL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        onProgress?.(50);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Video FAL Service] API Error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText,
                endpoint: apiUrl,
                model: variant
            });

            if (response.status === 401) {
                throw new Error('FAL API authentication failed. Please check your API key.');
            } else if (response.status === 429) {
                throw new Error('FAL API rate limit exceeded. Please try again later.');
            } else if (response.status === 400) {
                throw new Error(`FAL API request error: ${errorText}. Please check your prompt and parameters.`);
            } else if (response.status === 404) {
                throw new Error(`FAL API endpoint not found (${variant}). This model may not be available or the endpoint has changed. Technical details: ${response.status} - ${errorText}`);
            }

            throw new Error(`FAL API error (${variant}): ${response.status} - ${errorText}`);
        }

        const result: VideoGenerationResult = await response.json();

        onProgress?.(90);

        if (!result.video || !result.video.url) {
            throw new Error('FAL API returned no video. This may be due to content safety filters or an invalid prompt.');
        }

        const videoUrl = result.video.url;

        console.log('[Video FAL Service] Video generation successful', {
            videoUrl: videoUrl.substring(0, 50) + '...',
            duration: result.video.duration,
            inferenceTime: result.timings?.inference,
            seed: result.seed,
            modelVariant: variant
        });

        onProgress?.(100);

        return videoUrl;

    } catch (error) {
        onProgress?.(100);

        if (error instanceof Error) {
            throw error;
        }

        console.error('[Video FAL Service] Unexpected error:', error);
        throw new Error(`Video generation failed (${variant}): ${String(error)}`);
    }
};

/**
 * Generate video using Kling 2.1 Pro specifically
 * Convenience wrapper for the most common use case
 */
export async function generateVideoWithKling(
    prompt: string,
    referenceImageUrl?: string,
    duration: number = 5,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
    onProgress?: (progress: number) => void
): Promise<string> {
    return generateVideoWithFal(prompt, 'Kling 2.1 Pro', referenceImageUrl, duration, aspectRatio, onProgress);
};

/**
 * Generate video using WAN 2.1 (image-to-video refinement - requires reference image)
 */
export async function refineVideoWithWAN(
    prompt: string,
    referenceImageUrl: string,
    duration: number = 4,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
    onProgress?: (progress: number) => void
): Promise<string> {
    if (!referenceImageUrl) {
        throw new Error('WAN 2.1 requires a reference image for video generation.');
    }
    return generateVideoWithFal(prompt, 'WAN 2.1', referenceImageUrl, duration, aspectRatio, onProgress);
};

/**
 * Generate video using Veo 2 (Google - image-to-video - requires reference image)
 */
export async function generateVideoWithVeo2(
    prompt: string,
    referenceImageUrl: string,
    duration: number = 5,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
    onProgress?: (progress: number) => void
): Promise<string> {
    if (!referenceImageUrl) {
        throw new Error('Veo 2 requires a reference image for video generation.');
    }
    return generateVideoWithFal(prompt, 'Veo 2', referenceImageUrl, duration, aspectRatio, onProgress);
};
