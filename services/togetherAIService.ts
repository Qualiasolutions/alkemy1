
// Together.AI API Service for Image and Video Generation
// Supports: FLUX Schnell, Seedream 4.0, Kling 2.1, Seedance 1.0 Lite

import { getFallbackImageUrl, getFallbackVideoBlobs } from './fallbackContent';

const importMetaEnv = typeof import.meta !== 'undefined' ? (import.meta as any)?.env ?? {} : {};
const truthyStrings = new Set(['true', '1', 'yes', 'on']);

const resolveBooleanEnv = (...keys: string[]): boolean => {
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
};

const resolveTogetherApiKey = (): string => {
    try {
        const importMeta = typeof import.meta !== 'undefined' ? (import.meta as any) : undefined;
        const candidates = [
            importMeta?.env?.VITE_TOGETHER_AI_API_KEY,
            importMeta?.env?.TOGETHER_AI_API_KEY,
            typeof process !== 'undefined' ? process.env?.TOGETHER_AI_API_KEY : undefined,
            typeof process !== 'undefined' ? process.env?.VITE_TOGETHER_AI_API_KEY : undefined
        ];
        for (const candidate of candidates) {
            if (typeof candidate === 'string' && candidate.trim()) {
                return candidate.trim();
            }
        }
    } catch (error) {
        console.warn('[Together.AI] Unable to resolve API key from environment:', error);
    }
    return '';
};

const TOGETHER_AI_API_KEY = resolveTogetherApiKey();
const FORCE_DEMO_MODE = resolveBooleanEnv('VITE_FORCE_DEMO_MODE', 'FORCE_DEMO_MODE', 'USE_FALLBACK_MODE', 'VITE_USE_FALLBACK_MODE');
const prefersLiveTogether = (): boolean => !!TOGETHER_AI_API_KEY && !FORCE_DEMO_MODE;

const shouldFallbackForTogetherError = (error: unknown): boolean => {
    if (FORCE_DEMO_MODE) return true;
    if (!error) return false;
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();
    return [
        '401',
        'unauthorized',
        'forbidden',
        'quota',
        'rate limit',
        'resource_exhausted'
    ].some(fragment => normalized.includes(fragment));
};

const API_BASE_URL = 'https://api.together.xyz/v1';

// === IMAGE GENERATION MODELS ===

export type TogetherImageModel = 'Flux Schnell' | 'Seedream 4.0';

const IMAGE_MODEL_IDS: Record<TogetherImageModel, string> = {
    'Flux Schnell': 'black-forest-labs/FLUX.1-schnell-Free',
    'Seedream 4.0': 'ByteDance/Seedream-4.0',
};

interface ImageGenerationRequest {
    model: string;
    prompt: string;
    width?: number;
    height?: number;
    steps?: number;
    n?: number;
    response_format?: 'url' | 'b64_json';
}

interface ImageGenerationResponse {
    data: Array<{
        b64_json?: string;
        url?: string;
    }>;
}

/**
 * Convert aspect ratio to width/height dimensions for Together.AI
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
 * Generate image using Together.AI models (Flux Schnell or Seedream 4.0)
 */
export const generateImageWithTogether = async (
    prompt: string,
    model: TogetherImageModel,
    aspectRatio: string,
    onProgress?: (progress: number) => void,
    numImages: number = 1
): Promise<string[]> => {
    if (!prefersLiveTogether()) {
        console.warn('[Together.AI] Fallback mode active – returning placeholder images.');
        onProgress?.(100);
        return Array.from({ length: numImages }, (_, i) =>
            getFallbackImageUrl(aspectRatio, `together-fallback-${model}-${i}`)
        );
    }

    if (!TOGETHER_AI_API_KEY) {
        throw new Error('TOGETHER_AI_API_KEY is not configured. Please add it to your environment variables.');
    }

    try {
        console.log('[Together.AI] Generating image...', {
            model,
            prompt: prompt.substring(0, 100),
            aspectRatio,
            numImages
        });

        onProgress?.(20);

        const { width, height } = aspectRatioToDimensions(aspectRatio);
        const modelId = IMAGE_MODEL_IDS[model];

        const requestBody: ImageGenerationRequest = {
            model: modelId,
            prompt: prompt,
            width,
            height,
            steps: model === 'Flux Schnell' ? 4 : 20, // Flux Schnell is fast (4 steps), Seedream needs more
            n: numImages,
            response_format: 'b64_json',
        };

        onProgress?.(40);

        const response = await fetch(`${API_BASE_URL}/images/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOGETHER_AI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Together.AI] Image generation failed:', errorText);
            throw new Error(`Failed to generate image: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
        }

        onProgress?.(80);

        const data: ImageGenerationResponse = await response.json();

        if (!data.data || data.data.length === 0) {
            throw new Error('API did not return any images');
        }

        onProgress?.(100);

        // Convert base64 to data URLs
        const imageUrls = data.data.map((item, index) => {
            if (item.b64_json) {
                return `data:image/png;base64,${item.b64_json}`;
            } else if (item.url) {
                return item.url;
            } else {
                throw new Error(`Image ${index} has no URL or base64 data`);
            }
        });

        console.log('[Together.AI] Image generation complete!', {
            count: imageUrls.length,
            model
        });

        return imageUrls;

    } catch (error) {
        console.error('[Together.AI] Error during image generation:', error);
        onProgress?.(100);

        if (shouldFallbackForTogetherError(error)) {
            console.warn('[Together.AI] Falling back to placeholder images due to service error.');
            return Array.from({ length: numImages }, (_, i) =>
                getFallbackImageUrl(aspectRatio, `together-fallback-${model}-${i}`)
            );
        }

        let errorMessage = 'Image generation failed. ';
        if (error instanceof Error) {
            if (error.message.includes('not configured')) {
                errorMessage += 'API key is not configured. Please add TOGETHER_AI_API_KEY to your environment.';
            } else {
                errorMessage += error.message;
            }
        } else {
            errorMessage += 'An unknown error occurred.';
        }

        throw new Error(errorMessage);
    }
};

// === VIDEO GENERATION MODELS ===

export type TogetherVideoModel = 'Kling 2.1 Pro' | 'Kling 2.1 Master' | 'Seedance 1.0 Lite';

const VIDEO_MODEL_IDS: Record<TogetherVideoModel, string> = {
    'Kling 2.1 Pro': 'kwaivgI/kling-2.1-pro',
    'Kling 2.1 Master': 'kwaivgI/kling-2.1-master',
    'Seedance 1.0 Lite': 'ByteDance/Seedance-1.0-lite',
};

interface VideoGenerationRequest {
    model: string;
    prompt?: string;
    image_url?: string;
    duration?: number;
    aspect_ratio?: string;
}

interface VideoGenerationResponse {
    id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    output?: {
        video_url: string;
    };
    error?: string;
}

/**
 * Generate video from image using Together.AI models (Kling 2.1 or Seedance)
 */
export const generateVideoFromImageTogether = async (
    imageUrl: string,
    prompt: string,
    model: TogetherVideoModel,
    aspectRatio: string = '16:9',
    duration: number = 5,
    onProgress?: (progress: number) => void
): Promise<string> => {
    if (!prefersLiveTogether()) {
        console.warn('[Together.AI] Fallback mode active – returning placeholder video.');
        onProgress?.(100);
        const [fallbackBlob] = getFallbackVideoBlobs(1, `together-video-fallback-${model}`);
        return URL.createObjectURL(fallbackBlob);
    }

    if (!TOGETHER_AI_API_KEY) {
        throw new Error('TOGETHER_AI_API_KEY is not configured. Please add it to your environment variables.');
    }

    try {
        console.log('[Together.AI] Generating video from image...', {
            model,
            imageUrl: imageUrl.substring(0, 50) + '...',
            prompt: prompt.substring(0, 100),
            aspectRatio,
            duration
        });

        onProgress?.(10);

        const modelId = VIDEO_MODEL_IDS[model];

        // Convert blob URLs to base64 if needed
        let processedImageUrl = imageUrl;
        if (imageUrl.startsWith('blob:')) {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            processedImageUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        }

        onProgress?.(20);

        const requestBody: VideoGenerationRequest = {
            model: modelId,
            image_url: processedImageUrl,
            prompt: prompt,
            duration: duration,
            aspect_ratio: aspectRatio,
        };

        const response = await fetch(`${API_BASE_URL}/video/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOGETHER_AI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Together.AI] Video generation request failed:', errorText);
            throw new Error(`Failed to generate video: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
        }

        const data: VideoGenerationResponse = await response.json();

        if (!data.id) {
            throw new Error('API did not return a generation ID');
        }

        console.log('[Together.AI] Video generation started with ID:', data.id);
        onProgress?.(40);

        // Poll for completion
        const videoUrl = await pollForVideoCompletion(data.id, onProgress);

        console.log('[Together.AI] Video generation complete!');
        return videoUrl;

    } catch (error) {
        console.error('[Together.AI] Error during video generation:', error);
        onProgress?.(100);

        if (shouldFallbackForTogetherError(error)) {
            console.warn('[Together.AI] Falling back to placeholder video due to service error.');
            const [fallbackBlob] = getFallbackVideoBlobs(1, `together-video-fallback-${model}`);
            return URL.createObjectURL(fallbackBlob);
        }

        let errorMessage = 'Video generation failed. ';
        if (error instanceof Error) {
            if (error.message.includes('not configured')) {
                errorMessage += 'API key is not configured. Please add TOGETHER_AI_API_KEY to your environment.';
            } else {
                errorMessage += error.message;
            }
        } else {
            errorMessage += 'An unknown error occurred.';
        }

        throw new Error(errorMessage);
    }
};

/**
 * Poll for video generation completion
 */
const pollForVideoCompletion = async (
    generationId: string,
    onProgress?: (progress: number) => void,
    maxWaitTime: number = 300000, // 5 minutes
    pollInterval: number = 5000 // 5 seconds
): Promise<string> => {
    const startTime = Date.now();
    let currentProgress = 40;

    while (Date.now() - startTime < maxWaitTime) {
        const response = await fetch(`${API_BASE_URL}/video/generations/${generationId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOGETHER_AI_API_KEY}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to check status: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data: VideoGenerationResponse = await response.json();

        console.log('[Together.AI] Video status:', data.status);

        if (data.status === 'completed') {
            if (!data.output?.video_url) {
                throw new Error('Video generation completed but no video URL was returned');
            }
            onProgress?.(100);
            return data.output.video_url;
        }

        if (data.status === 'failed') {
            throw new Error(data.error || 'Video generation failed without error message');
        }

        // Update progress based on time elapsed
        const elapsed = Date.now() - startTime;
        const progressPercent = Math.min(95, 40 + Math.floor((elapsed / maxWaitTime) * 55));
        if (progressPercent > currentProgress) {
            currentProgress = progressPercent;
            onProgress?.(currentProgress);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Video generation timed out after 5 minutes. Please try again.');
};

/**
 * Check if Together.AI API is available (key configured)
 */
export const isTogetherApiAvailable = (): boolean => {
    return !!TOGETHER_AI_API_KEY && TOGETHER_AI_API_KEY.length > 0;
};

/**
 * Get display name for Together.AI models
 */
export const getTogetherModelDisplayName = (model: TogetherImageModel | TogetherVideoModel): string => {
    return model; // Model names are already display-friendly
};
