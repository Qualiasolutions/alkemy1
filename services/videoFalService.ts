/**
 * FAL.AI Video Generation Service
 * Integrates with FAL.AI API for high-quality video generation
 * Supports: Kling 2.5, SeedDream v4
 */

import { getFallbackVideoBlobs } from './fallbackContent';

const importMetaEnv = typeof import.meta !== 'undefined' ? (import.meta as any)?.env ?? {} : {};

const resolveFalApiKey = (): string => {
    try {
        const candidates = [
            importMetaEnv.VITE_FAL_API_KEY,
            importMetaEnv.FAL_API_KEY,
            typeof process !== 'undefined' ? process.env?.FAL_API_KEY : undefined,
            typeof process !== 'undefined' ? process.env?.VITE_FAL_API_KEY : undefined
        ];
        for (const candidate of candidates) {
            if (typeof candidate === 'string' && candidate.trim()) {
                return candidate.trim();
            }
        }
    } catch (error) {
        console.warn('[Video FAL Service] Unable to resolve API key from environment:', error);
    }
    return '';
};

const FAL_API_KEY = resolveFalApiKey();

// Video model configurations
const VIDEO_MODEL_CONFIG = {
    'Kling 2.5': {
        apiUrl: 'https://fal.run/fal-ai/kling-video/v2/pro/text-to-video',
        imageToVideoUrl: 'https://fal.run/fal-ai/kling-video/v2/pro/image-to-video',
        displayName: 'Kling 2.5 Pro',
        description: 'High-quality cinematic video generation',
        supportsImageToVideo: true,
        supportsTextToVideo: true,
        maxDuration: 10, // seconds
    },
    'SeedDream v4': {
        apiUrl: 'https://fal.run/fal-ai/seeddream/v4/image-to-video',
        displayName: 'SeedDream v4',
        description: 'Image refinement and animation (refining only)',
        supportsImageToVideo: true,
        supportsTextToVideo: false,
        maxDuration: 5, // seconds
        refinementOnly: true,
    },
} as const;

export type VideoModelVariant = keyof typeof VIDEO_MODEL_CONFIG;

export const VIDEO_MODEL_VARIANTS = Object.keys(VIDEO_MODEL_CONFIG) as VideoModelVariant[];

export const isVideoModelVariant = (model: string): model is VideoModelVariant => {
    return VIDEO_MODEL_VARIANTS.includes(model as VideoModelVariant);
};

export const getVideoModelDisplayName = (variant: VideoModelVariant): string => {
    return VIDEO_MODEL_CONFIG[variant]?.displayName ?? variant;
};

export const getVideoModelDescription = (variant: VideoModelVariant): string => {
    return VIDEO_MODEL_CONFIG[variant]?.description ?? '';
};

export const isRefinementOnlyModel = (variant: VideoModelVariant): boolean => {
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
export const isVideoFalApiAvailable = (): boolean => {
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
export const generateVideoWithFal = async (
    prompt: string,
    variant: VideoModelVariant = 'Kling 2.5',
    referenceImageUrl?: string,
    duration: number = 5,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
    onProgress?: (progress: number) => void,
    seed?: number,
    cfgScale?: number
): Promise<string> => {
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
                error: errorText
            });

            if (response.status === 401) {
                throw new Error('FAL API authentication failed. Please check your API key.');
            } else if (response.status === 429) {
                throw new Error('FAL API rate limit exceeded. Please try again later.');
            } else if (response.status === 400) {
                throw new Error(`FAL API request error: ${errorText}. Please check your prompt and parameters.`);
            }

            throw new Error(`Fal.ai service temporarily unavailable due to Egress Excess overloading the backend. Please try again in a few minutes. Technical details: ${response.status} - ${errorText}`);
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
 * Generate video using Kling 2.5 specifically
 * Convenience wrapper for the most common use case
 */
export const generateVideoWithKling = async (
    prompt: string,
    referenceImageUrl?: string,
    duration: number = 5,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
    onProgress?: (progress: number) => void
): Promise<string> => {
    return generateVideoWithFal(prompt, 'Kling 2.5', referenceImageUrl, duration, aspectRatio, onProgress);
};

/**
 * Generate video using SeedDream v4 (refinement only - requires reference image)
 */
export const refineVideoWithSeedDream = async (
    prompt: string,
    referenceImageUrl: string,
    duration: number = 4,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
    onProgress?: (progress: number) => void
): Promise<string> => {
    if (!referenceImageUrl) {
        throw new Error('SeedDream v4 requires a reference image for video refinement.');
    }
    return generateVideoWithFal(prompt, 'SeedDream v4', referenceImageUrl, duration, aspectRatio, onProgress);
};
