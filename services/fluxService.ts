/**
 * FLUX LoRA Training Service
 * SPECIALIZED FOR CHARACTER IDENTITY TRAINING ONLY
 * Integrates with FAL.AI for FLUX.1.1, FLUX.1 Kontext, and FLUX Ultra models
 * Original Flux API removed - focused exclusively on LoRA training and character consistency
 */

// FAL models use FAL_API_KEY, not FLUX_API_KEY
const FLUX_API_KEY = (
    import.meta.env.VITE_FAL_API_KEY ||
    import.meta.env.FAL_API_KEY ||
    process.env.FAL_API_KEY ||
    process.env.VITE_FAL_API_KEY ||
    ''
).trim();

// Supported Flux model variants for Fal.ai - SPECIALIZED FOR LoRA TRAINING ONLY
// Original Flux API removed - now focusing exclusively on character identity training
const FLUX_MODEL_CONFIG = {
    'FLUX.1.1': {
        apiUrl: 'https://fal.run/fal-ai/flux-1.1-pro',
        displayName: 'FLUX.1.1 Pro',
    },
    'FLUX.1 Kontext': {
        apiUrl: 'https://fal.run/fal-ai/flux-1-kontext',
        displayName: 'FLUX.1 Kontext',
    },
    'FLUX Ultra': {
        apiUrl: 'https://fal.run/fal-ai/flux-ultra',
        displayName: 'FLUX Ultra',
    },
    'Seadream v4': {
        apiUrl: 'https://fal.run/fal-ai/bytedance/seedream/v4/text-to-image',
        displayName: 'Seadream v4 - 4K Quality',
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
    raw?: boolean; // Enable "raw" mode for more photographic results
    loras?: Array<{
        path: string; // LoRA model URL
        scale: number; // Strength (0-1)
    }>; // NEW: Character identity LoRA models
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

/**
 * Check if FLUX API is available
 */
export function isFluxApiAvailable(): boolean {
    return !!FLUX_API_KEY && FLUX_API_KEY.length > 0;
}

/**
 * Convert aspect ratio string to width/height dimensions
 * FLUX supports up to 1440px on longest side for optimal quality
 */
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

/**
 * Generate image using FLUX API via FAL.AI
 * @param prompt - Text prompt for image generation
 * @param aspectRatio - Aspect ratio (e.g., "16:9", "1:1")
 * @param onProgress - Progress callback (0-100)
 * @param raw - Enable raw mode for more photorealistic results
 * @returns URL of generated image
 */
export async function generateImageWithFlux(
    prompt: string,
    aspectRatio: string = '16:9',
    onProgress?: (progress: number) => void,
    raw: boolean = false,
    variant: FluxModelVariant = 'FLUX.1 Kontext',
    loras?: Array<{ path: string; scale: number }> // NEW: Character identity LoRAs
): Promise<string> {
    if (!isFluxApiAvailable()) {
        throw new Error('FLUX API key is not configured. Please set FLUX_API_KEY in environment variables.');
    }

    if (!prompt || !prompt.trim()) {
        throw new Error('Please enter a prompt to generate an image.');
    }

    const modelConfig = FLUX_MODEL_CONFIG[variant] ?? FLUX_MODEL_CONFIG['FLUX.1 Kontext'];

    console.log('[FLUX Service] Starting generation', {
        prompt: prompt.substring(0, 100),
        aspectRatio,
        raw,
        modelVariant: variant,
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
            num_inference_steps: 28, // Good balance of quality and speed
            guidance_scale: 3.5, // FLUX Pro uses lower guidance scale
            num_images: 1,
            enable_safety_checker: true,
            output_format: 'jpeg',
            raw: raw, // Enable raw mode for more photographic results
        };

        // Add LoRA parameters if character identity is provided
        if (loras && loras.length > 0) {
            requestBody.loras = loras;
            console.log('[FLUX Service] Using character identity LoRAs:', loras.map(l => ({ path: l.path.substring(0, 50) + '...', scale: l.scale })));
        }

        onProgress?.(30);

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
                error: errorText
            });

            if (response.status === 401) {
                throw new Error('FLUX API authentication failed. Please check your API key.');
            } else if (response.status === 429) {
                throw new Error('FLUX API rate limit exceeded. Please try again later.');
            } else if (response.status === 400) {
                throw new Error(`FLUX API request error: ${errorText}. Please check your prompt.`);
            }

            throw new Error(`Fal.ai service temporarily unavailable due to Egress Excess overloading the backend. Please try again in a few minutes. Technical details: ${response.status} - ${errorText}`);
        }

        const result: FluxGenerationResult = await response.json();

        onProgress?.(90);

        if (!result.images || result.images.length === 0) {
            throw new Error('FLUX API returned no images. This may be due to content safety filters or an invalid prompt.');
        }

        const imageUrl = result.images[0].url;

        console.log('[FLUX Service] Generation successful', {
            imageUrl: imageUrl.substring(0, 50) + '...',
            dimensions: `${result.images[0].width}x${result.images[0].height}`,
            inferenceTime: result.timings.inference,
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
        throw new Error(`FLUX generation failed (${variant}): ${String(error)}`);
    }
};

/**
 * Generate multiple images in parallel with FLUX
 */
export async function generateMultipleImagesWithFlux(
    prompt: string,
    count: number,
    aspectRatio: string = '16:9',
    onProgress?: (index: number, progress: number) => void,
    raw: boolean = false,
    variant: FluxModelVariant = 'FLUX.1 Kontext'
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
