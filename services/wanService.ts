
// Wan 2.2 API Service for Motion Transfer
// Using AI/ML API's Wan 2.2 VACE Fun Pose API

import { getFallbackVideoBlobs } from './fallbackContent';

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

const resolveWanApiKey = (): string => {
    try {
        const importMeta = typeof import.meta !== 'undefined' ? (import.meta as any) : undefined;
        const candidates = [
            importMeta?.env?.VITE_WAN_API_KEY,
            importMeta?.env?.WAN_API_KEY,
            typeof process !== 'undefined' ? process.env?.WAN_API_KEY : undefined
        ];
        for (const candidate of candidates) {
            if (typeof candidate === 'string' && candidate.trim()) {
                return candidate.trim();
            }
        }
    } catch (error) {
        console.warn('[Wan API] Unable to resolve API key from environment:', error);
    }
    return '';
};

const WAN_API_KEY = resolveWanApiKey();
const FORCE_DEMO_MODE = resolveBooleanEnv('VITE_FORCE_DEMO_MODE', 'FORCE_DEMO_MODE', 'USE_FALLBACK_MODE', 'VITE_USE_FALLBACK_MODE');
const prefersLiveWan = (): boolean => !!WAN_API_KEY && !FORCE_DEMO_MODE;

const shouldFallbackForWanError = (error: unknown): boolean => {
    if (FORCE_DEMO_MODE) return true;
    if (!error) return false;
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();
    return [
        '401',
        'unauthorized',
        'forbidden',
        'quota',
        'rate limit'
    ].some(fragment => normalized.includes(fragment));
};
const API_BASE_URL = 'https://api.aimlapi.com/v2/video/generations';

interface WanGenerationRequest {
    model: string;
    video_url: string;
    image_url?: string;
    identity_image_url?: string;
    prompt?: string;
    resolution?: '240p' | '360p' | '480p' | '580p' | '720p' | 'auto';
    num_frames?: number;
    frames_per_second?: number;
    seed?: number;
}

interface WanGenerationResponse {
    id: string;
    status: 'waiting' | 'generating' | 'completed' | 'failed';
    video?: {
        url: string;
    };
    error?: string;
}

/**
 * Convert video File to base64 data URL for upload
 */
const videoFileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to read video file as data URL'));
            }
        };
        reader.onerror = () => reject(new Error('FileReader error reading video'));
        reader.readAsDataURL(file);
    });
};

/**
 * Upload video to temporary hosting or convert to accessible URL
 * For now, we'll use data URL directly if API supports it
 * Otherwise, you may need to implement upload to cloud storage
 */
const prepareVideoUrl = async (videoFile: File): Promise<string> => {
    // For Wan API, we'll try using data URL first
    // If the API doesn't support data URLs, you'll need to upload to cloud storage
    const dataUrl = await videoFileToBase64(videoFile);

    // Check if the data URL is too large (> 10MB encoded)
    if (dataUrl.length > 10 * 1024 * 1024) {
        console.warn('Video file is very large. Consider implementing cloud storage upload.');
    }

    return dataUrl;
};

/**
 * Convert image URL to base64 if needed
 */
const prepareImageUrl = async (imageUrl: string): Promise<string> => {
    // If already a data URL, return as-is
    if (imageUrl.startsWith('data:')) {
        return imageUrl;
    }

    // If it's a blob URL, we need to fetch and convert
    if (imageUrl.startsWith('blob:')) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Failed to convert blob URL'));
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Failed to convert blob URL:', error);
            return imageUrl; // Fall back to original URL
        }
    }

    // Return external URL as-is
    return imageUrl;
};

/**
 * Create a motion transfer generation request
 */
const createGeneration = async (
    videoUrl: string,
    targetImageUrl: string,
    prompt: string = 'Transfer motion from video to character'
): Promise<string> => {
    if (!WAN_API_KEY) {
        throw new Error('WAN_API_KEY is not configured. Please add it to your environment variables.');
    }

    const requestBody: WanGenerationRequest = {
        model: 'alibaba/wan2.2-vace-fun-a14b-pose',
        video_url: videoUrl,
        image_url: targetImageUrl,
        identity_image_url: targetImageUrl,
        prompt: prompt,
        resolution: '720p',
        num_frames: 81,
        frames_per_second: 16,
    };

    console.log('[Wan API] Creating generation request...');

    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${WAN_API_KEY}`,
            'x-api-key': WAN_API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Wan API] Generation request failed:', errorText);
        throw new Error(`Failed to create generation: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }

    const data = await response.json();

    if (!data.id) {
        throw new Error('API did not return a generation ID');
    }

    console.log('[Wan API] Generation created with ID:', data.id);
    return data.id;
};

/**
 * Check the status of a generation
 */
const checkGenerationStatus = async (generationId: string): Promise<WanGenerationResponse> => {
    if (!WAN_API_KEY) {
        throw new Error('WAN_API_KEY is not configured.');
    }

    const response = await fetch(`${API_BASE_URL}/${generationId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${WAN_API_KEY}`,
            'x-api-key': WAN_API_KEY,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to check status: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: WanGenerationResponse = await response.json();
    return data;
};

/**
 * Poll for generation completion with timeout
 */
const pollForCompletion = async (
    generationId: string,
    onProgress: (progress: number) => void,
    maxWaitTime: number = 300000, // 5 minutes
    pollInterval: number = 3000 // 3 seconds
): Promise<string> => {
    const startTime = Date.now();
    let currentProgress = 40; // Start at 40% after request is sent

    while (Date.now() - startTime < maxWaitTime) {
        const status = await checkGenerationStatus(generationId);

        console.log('[Wan API] Status:', status.status);

        if (status.status === 'completed') {
            if (!status.video?.url) {
                throw new Error('Generation completed but no video URL was returned');
            }
            onProgress(100);
            console.log('[Wan API] Generation completed:', status.video.url);
            return status.video.url;
        }

        if (status.status === 'failed') {
            throw new Error(status.error || 'Generation failed without error message');
        }

        // Update progress based on time elapsed
        const elapsed = Date.now() - startTime;
        const progressPercent = Math.min(90, 40 + Math.floor((elapsed / maxWaitTime) * 50));
        if (progressPercent > currentProgress) {
            currentProgress = progressPercent;
            onProgress(currentProgress);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Generation timed out after 5 minutes. Please try again.');
};

/**
 * Main function: Transfer motion from reference video to target avatar
 *
 * @param referenceVideo - The source video file with motion to transfer
 * @param targetAvatarImageUrl - The target character image URL
 * @param onProgress - Callback for progress updates (0-100)
 * @returns Promise resolving to the generated video URL
 */
export const transferMotionWan = async (
    referenceVideo: File,
    targetAvatarImageUrl: string,
    onProgress: (progress: number) => void
): Promise<string> => {
    try {
        if (!prefersLiveWan()) {
            console.warn('[Wan API] Fallback mode active – returning stock animation.');
            onProgress(100);
            const [fallbackBlob] = await getFallbackVideoBlobs(1, `wan-fallback-${targetAvatarImageUrl}`);
            return URL.createObjectURL(fallbackBlob);
        }
        console.log('[Wan API] Starting motion transfer...', {
            videoName: referenceVideo.name,
            videoSize: `${(referenceVideo.size / 1024 / 1024).toFixed(2)}MB`,
            targetImage: targetAvatarImageUrl.substring(0, 50) + '...'
        });

        // Step 1: Prepare video URL (0-20%)
        onProgress(5);
        console.log('[Wan API] Converting video to URL...');
        const videoUrl = await prepareVideoUrl(referenceVideo);
        onProgress(15);

        // Step 2: Prepare image URL (20-25%)
        console.log('[Wan API] Preparing target image...');
        const imageUrl = await prepareImageUrl(targetAvatarImageUrl);
        onProgress(20);

        // Step 3: Create generation request (25-40%)
        console.log('[Wan API] Sending generation request...');
        const generationId = await createGeneration(
            videoUrl,
            imageUrl,
            'Transfer the motion and expressions from the reference video to the target character while preserving the character\'s appearance'
        );
        onProgress(40);

        // Step 4: Poll for completion (40-100%)
        console.log('[Wan API] Polling for completion...');
        const resultVideoUrl = await pollForCompletion(generationId, onProgress);

        console.log('[Wan API] Motion transfer complete!');
        return resultVideoUrl;

    } catch (error) {
        console.error('[Wan API] Error during motion transfer:', error);
        onProgress(100); // Set to 100 to stop loading indicator

        if (shouldFallbackForWanError(error)) {
            console.warn('[Wan API] Falling back to stock animation due to service error.');
            const [fallbackBlob] = await getFallbackVideoBlobs(1, `wan-fallback-${targetAvatarImageUrl}`);
            return URL.createObjectURL(fallbackBlob);
        }

        // Provide user-friendly error messages
        let errorMessage = 'Motion transfer failed. ';
        if (error instanceof Error) {
            if (error.message.includes('not configured')) {
                errorMessage += 'API key is not configured. Please contact support.';
            } else if (error.message.includes('timed out')) {
                errorMessage += 'The generation took too long. Please try with a shorter video.';
            } else if (error.message.includes('Failed to create generation')) {
                errorMessage += 'Could not start generation. Please check your API key and try again.';
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
 * Check if Wan API is available (key configured)
 */
export const isWanApiAvailable = (): boolean => {
    return !!WAN_API_KEY && WAN_API_KEY.length > 0;
};
