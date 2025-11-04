/**
 * 3D World Generation Service
 *
 * Integrates Luma AI Genie API for text-to-3D landscape generation
 * suitable for cinematic production environments.
 *
 * NOTE: This requires a Luma API key. Users should set LUMA_API_KEY in environment variables
 * or configure it through the application settings.
 */

const LUMA_API_BASE_URL = 'https://api.lumalabs.ai/dream-machine/v1';

export interface Generate3DWorldOptions {
    prompt: string;
    onProgress?: (progress: number, status: string) => void;
}

export interface Generate3DWorldResult {
    modelUrl: string;
    thumbnailUrl?: string;
    generationId: string;
}

/**
 * Generate a 3D world/landscape from a text prompt using Luma Genie API
 *
 * @param options Generation options including prompt and progress callback
 * @returns Promise with generated model URL in GLTF/GLB format
 */
export async function generate3DWorld(options: Generate3DWorldOptions): Promise<Generate3DWorldResult> {
    const { prompt, onProgress } = options;

    // Get API key from environment or throw error
    const apiKey = process.env.LUMA_API_KEY;

    if (!apiKey) {
        throw new Error(
            '3D World Generation requires a Luma API key. Please configure LUMA_API_KEY in your environment variables or contact support to enable this feature.'
        );
    }

    try {
        // Enhance prompt for cinematic landscape generation
        const enhancedPrompt = enhancePromptForLandscape(prompt);

        onProgress?.(10, 'Initiating 3D world generation...');

        // Step 1: Create generation task using Luma Genie API
        const generationResponse = await fetch(`${LUMA_API_BASE_URL}/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: enhancedPrompt,
                aspect_ratio: '16:9',
                model: 'genie-1.0',
            }),
        });

        if (!generationResponse.ok) {
            const errorData = await generationResponse.json().catch(() => ({}));
            throw new Error(
                `Luma API error (${generationResponse.status}): ${errorData.message || generationResponse.statusText}`
            );
        }

        const generationData = await generationResponse.json();
        const generationId = generationData.id;

        if (!generationId) {
            throw new Error('Failed to get generation ID from Luma API');
        }

        onProgress?.(30, 'Generating 3D landscape...');

        // Step 2: Poll for completion
        const modelUrl = await pollForCompletion(generationId, apiKey, onProgress);

        onProgress?.(100, 'Generation complete!');

        return {
            modelUrl,
            generationId,
            thumbnailUrl: generationData.thumbnail_url,
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
 * Enhance user prompt for better landscape generation
 */
function enhancePromptForLandscape(userPrompt: string): string {
    // Add cinematic context to improve generation quality
    const landscapeKeywords = [
        'landscape', 'terrain', 'environment', 'scene', 'world',
        'mountains', 'forest', 'desert', 'city', 'urban'
    ];

    const hasLandscapeContext = landscapeKeywords.some(keyword =>
        userPrompt.toLowerCase().includes(keyword)
    );

    if (!hasLandscapeContext) {
        return `Cinematic 3D environment: ${userPrompt}, detailed terrain with atmospheric perspective`;
    }

    return `Cinematic 3D ${userPrompt}, high detail, professional production quality`;
}

/**
 * Poll Luma API for generation completion
 */
async function pollForCompletion(
    generationId: string,
    apiKey: string,
    onProgress?: (progress: number, status: string) => void
): Promise<string> {
    const maxAttempts = 120; // 120 attempts = 2 minutes max wait
    const pollInterval = 1000; // 1 second between polls

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        try {
            const statusResponse = await fetch(`${LUMA_API_BASE_URL}/generations/${generationId}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            });

            if (!statusResponse.ok) {
                throw new Error(`Status check failed: ${statusResponse.statusText}`);
            }

            const statusData = await statusResponse.json();
            const status = statusData.state;
            const progress = 30 + Math.floor((attempt / maxAttempts) * 60);

            // Update progress based on status
            if (status === 'pending' || status === 'queued') {
                onProgress?.(progress, 'Queued for generation...');
                continue;
            }

            if (status === 'processing' || status === 'generating') {
                onProgress?.(progress, 'Generating 3D landscape...');
                continue;
            }

            // Check for completion
            if (status === 'completed') {
                const modelUrl = statusData.assets?.glb || statusData.assets?.gltf;

                if (!modelUrl) {
                    throw new Error('Generation completed but no 3D model URL provided');
                }

                return modelUrl;
            }

            // Check for failure
            if (status === 'failed') {
                throw new Error(statusData.failure_reason || 'Generation failed');
            }

        } catch (error) {
            console.error(`Polling attempt ${attempt + 1} failed:`, error);
            // Continue polling unless it's the last attempt
            if (attempt === maxAttempts - 1) {
                throw error;
            }
        }
    }

    throw new Error('Generation timed out after 2 minutes');
}

/**
 * Validate if a URL is a valid 3D model format
 */
export function isValid3DModelUrl(url: string): boolean {
    if (!url) return false;

    const validExtensions = ['.glb', '.gltf', '.obj', '.fbx'];
    const lowerUrl = url.toLowerCase();

    return validExtensions.some(ext => lowerUrl.includes(ext)) || url.startsWith('blob:');
}

/**
 * Download 3D model from URL and convert to blob URL for local use
 */
export async function download3DModel(modelUrl: string): Promise<string> {
    try {
        const response = await fetch(modelUrl);

        if (!response.ok) {
            throw new Error(`Failed to download model: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        return blobUrl;
    } catch (error) {
        console.error('Model download error:', error);
        throw new Error('Failed to download 3D model');
    }
}
