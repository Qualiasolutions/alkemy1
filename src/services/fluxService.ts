/**
 * FLUX LoRA Training Service
 * SPECIALIZED FOR CHARACTER IDENTITY TRAINING ONLY
 * Integrates with FAL.AI for FLUX Pro models
 * UPDATED 2025-11-19: Fixed API endpoints to match FAL.AI actual URLs
 */

// FAL models use FAL_API_KEY, not FLUX_API_KEY
// Fixed environment variable resolution - check FAL_API_KEY first, then VITE_FAL_API_KEY
const FLUX_API_KEY = (
    import.meta.env.FAL_API_KEY ||
    import.meta.env.VITE_FAL_API_KEY ||
    ''
).trim().replace(/\n/g, ''); // Remove literal newline characters

// Debug logging for environment variable resolution
console.log('[FLUX Service] Environment Variables:', {
    FAL_API_KEY: !!import.meta.env.FAL_API_KEY,
    FAL_API_KEY_Length: import.meta.env.FAL_API_KEY?.length,
    VITE_FAL_API_KEY: !!import.meta.env.VITE_FAL_API_KEY,
    VITE_FAL_API_KEY_Length: import.meta.env.VITE_FAL_API_KEY?.length,
    RESOLVED_KEY: !!FLUX_API_KEY,
    RESOLVED_KEY_Length: FLUX_API_KEY?.length,
    ENV_Source: 'import.meta.env'
});

// Supported Flux model variants for Fal.ai - CORRECTED ENDPOINTS (2025-11-19)
// Previous endpoints were incorrect and returned 404 errors
const FLUX_MODEL_CONFIG = {
    'FLUX Pro': {
        apiUrl: 'https://fal.run/fal-ai/flux-pro',
        displayName: 'FLUX Pro',
    },
    'FLUX.1.1 Pro': {
        apiUrl: 'https://fal.run/fal-ai/flux-pro/v1.1',
        displayName: 'FLUX.1.1 Pro',
    },
    'FLUX Ultra': {
        apiUrl: 'https://fal.run/fal-ai/flux-pro/v1.1-ultra',
        displayName: 'FLUX Ultra',
    },
    'FLUX Dev': {
        apiUrl: 'https://fal.run/fal-ai/flux/dev',
        displayName: 'FLUX Dev',
    },
    'FLUX LoRA': {
        apiUrl: 'https://fal.run/fal-ai/flux-lora',
        displayName: 'FLUX LoRA',
    }
} as const;

export type FluxModelVariant = keyof typeof FLUX_MODEL_CONFIG;

export function getFluxModelDisplayName(variant: FluxModelVariant): string {
    return FLUX_MODEL_CONFIG[variant]?.displayName ?? variant;
};

export const FLUX_MODEL_VARIANTS = Object.keys(FLUX_MODEL_CONFIG) as FluxModelVariant[];

export function isFluxModelVariant(model: string): model is FluxModelVariant {
    return FLUX_MODEL_VARIANTS.includes(model as FluxModelVariant);
};

export interface FluxGenerationParams {
    prompt: string;
    image_size?: {
        width: number;
        height: number;
    };
    num_inference_steps?: number;
    guidance_scale?: number;
    num_images?: number;
    enable_safety_checker?: boolean;
    output_format?: 'jpeg' | 'png';
    aspect_ratio?: string;
    raw?: boolean;
    loras?: Array<{
        path: string;
        scale: number;
    }>;
}

export interface FluxGenerationResult {
    images: Array<{
        url: string;
        width: number;
        height: number;
        content_type: string;
    }>;
    timings: {
        inference: number;
    };
    seed: number;
    has_nsfw_concepts: boolean[];
    prompt: string;
}

export function isFluxApiAvailable(): boolean {
    const available = !!FLUX_API_KEY && FLUX_API_KEY.length > 0;
    console.log('[FLUX Service] API Available:', available, 'Key length:', FLUX_API_KEY?.length);
    return available;
}

const getImageDimensions = (aspectRatio: string): { width: number; height: number } => {
    const aspectMap: Record<string, { width: number; height: number }> = {
        '1:1': { width: 1024, height: 1024 },
        '16:9': { width: 1440, height: 810 },
        '9:16': { width: 810, height: 1440 },
        '4:3': { width: 1152, height: 864 },
        '3:4': { width: 864, height: 1152 },
        '21:9': { width: 1440, height: 617 },
        '9:21': { width: 617, height: 1440 },
    };

    return aspectMap[aspectRatio] || aspectMap['16:9'];
};

export async function generateImageWithFlux(
    prompt: string,
    aspectRatio: string = '16:9',
    onProgress?: (progress: number) => void,
    raw: boolean = false,
    variant: FluxModelVariant = 'FLUX.1.1 Pro',
    loras?: Array<{ path: string; scale: number }>
): Promise<string> {
    if (!isFluxApiAvailable()) {
        throw new Error('FAL API key is not configured. Please set FAL_API_KEY or VITE_FAL_API_KEY in environment variables.');
    }

    if (!prompt || !prompt.trim()) {
        throw new Error('Please enter a prompt to generate an image.');
    }

    const modelConfig = FLUX_MODEL_CONFIG[variant];
    
    if (!modelConfig) {
        console.error('[FLUX Service] Invalid model variant:', variant, 'Available:', FLUX_MODEL_VARIANTS);
        throw new Error('Invalid FLUX model variant: ' + variant);
    }

    console.log('[FLUX Service] Starting generation', {
        prompt: prompt.substring(0, 100),
        aspectRatio,
        raw,
        modelVariant: variant,
        apiUrl: modelConfig.apiUrl,
        hasLoras: !!loras && loras.length > 0,
        loraCount: loras?.length || 0,
        timestamp: new Date().toISOString()
    });

    try {
        onProgress?.(10);

        const dimensions = getImageDimensions(aspectRatio);

        const requestBody: FluxGenerationParams = {
            prompt: prompt.trim(),
            image_size: dimensions,
            num_inference_steps: 28,
            guidance_scale: 3.5,
            num_images: 1,
            enable_safety_checker: true,
            output_format: 'jpeg',
            raw: raw,
        };

        if (loras && loras.length > 0) {
            requestBody.loras = loras;
            console.log('[FLUX Service] Using character identity LoRAs:', loras.map(l => ({ path: l.path.substring(0, 50) + '...', scale: l.scale })));
        }

        onProgress?.(30);

        console.log('[FLUX Service] Making API request to:', modelConfig.apiUrl);

        const response = await fetch(modelConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${FLUX_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        onProgress?.(60);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[FLUX Service] API Error:', {
                status: response.status,
                statusText: response.statusText,
                url: modelConfig.apiUrl,
                error: errorText
            });

            if (response.status === 401) {
                throw new Error('FAL API authentication failed. Please check your API key configuration.');
            } else if (response.status === 404) {
                throw new Error('FAL API endpoint not found: ' + modelConfig.apiUrl + '. This model may not be available.');
            } else if (response.status === 429) {
                throw new Error('FAL API rate limit exceeded. Please try again later.');
            } else if (response.status === 400) {
                throw new Error('FAL API request error: ' + errorText + '. Please check your prompt.');
            }

            throw new Error('FAL API error (' + response.status + '): ' + errorText);
        }

        const result: FluxGenerationResult = await response.json();

        onProgress?.(90);

        if (!result.images || result.images.length === 0) {
            throw new Error('FAL API returned no images. This may be due to content safety filters or an invalid prompt.');
        }

        const imageUrl = result.images[0].url;

        console.log('[FLUX Service] Generation successful', {
            imageUrl: imageUrl.substring(0, 50) + '...',
            dimensions: `${result.images[0].width}x${result.images[0].height}`,
            inferenceTime: result.timings?.inference,
            seed: result.seed,
            hasNsfwConcepts: result.has_nsfw_concepts[0],
            modelVariant: variant
        });

        onProgress?.(100);

        return imageUrl;

    } catch (error) {
        onProgress?.(100);

        if (error instanceof Error) {
            throw error;
        }

        console.error('[FLUX Service] Unexpected error:', error);
        throw new Error('FLUX generation failed (' + variant + '): ' + String(error));
    }
};

export async function generateMultipleImagesWithFlux(
    prompt: string,
    count: number,
    aspectRatio: string = '16:9',
    onProgress?: (index: number, progress: number) => void,
    raw: boolean = false,
    variant: FluxModelVariant = 'FLUX.1.1 Pro'
): Promise<string[]> {
    const promises = Array.from({ length: count }, (_, index) =>
        generateImageWithFlux(
            prompt,
            aspectRatio,
            (progress) => onProgress?.(index, progress),
            raw,
            variant
        )
    );

    return Promise.all(promises);
};
