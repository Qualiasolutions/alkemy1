// Black Forest Labs API Service
// Official FLUX model provider

export type BFLModel = 'flux-pro-1.1' | 'flux-pro' | 'flux-dev';

interface BFLResponse {
    id: string;
    status: string;
    result?: {
        sample: string; // URL to generated image
    };
}

/**
 * Check if BFL API is available
 */
export function isBFLApiAvailable(): boolean {
    const apiKey = import.meta.env.VITE_BFL_API_KEY ||
                   import.meta.env.BFL_API_KEY ||
                   process.env.BFL_API_KEY;
    return !!apiKey;
}

/**
 * Generate image using Black Forest Labs API
 */
export async function generateImageWithBFL(
    prompt: string,
    aspectRatio: string = '16:9',
    onProgress?: (progress: number) => void,
    model: BFLModel = 'flux-pro-1.1',
    seed?: number
): Promise<string> {
    const apiKey = import.meta.env.VITE_BFL_API_KEY ||
                   import.meta.env.BFL_API_KEY ||
                   process.env.BFL_API_KEY;

    if (!apiKey) {
        throw new Error('BFL API key not configured');
    }

    console.log('[BFL] Starting generation with model:', model);
    onProgress?.(10);

    // Map aspect ratios to dimensions
    const dimensions: Record<string, { width: number; height: number }> = {
        '1:1': { width: 1024, height: 1024 },
        '16:9': { width: 1344, height: 768 },
        '9:16': { width: 768, height: 1344 },
        '4:3': { width: 1152, height: 896 },
        '3:4': { width: 896, height: 1152 },
        '21:9': { width: 1536, height: 640 },
        '9:21': { width: 640, height: 1536 }
    };

    const { width, height } = dimensions[aspectRatio] || dimensions['16:9'];

    try {
        // Step 1: Submit generation request
        const response = await fetch('https://api.bfl.ml/v1/flux-pro-1.1', {
            method: 'POST',
            headers: {
                'X-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt,
                width,
                height,
                prompt_upsampling: false,
                seed: seed || Math.floor(Math.random() * 1000000),
                safety_tolerance: 2,
                output_format: 'jpeg'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`BFL API error: ${response.status} - ${errorText}`);
        }

        const data: BFLResponse = await response.json();
        onProgress?.(40);

        // Step 2: Poll for result
        const taskId = data.id;
        let result = data;
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds max wait

        while (result.status === 'pending' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const statusResponse = await fetch(`https://api.bfl.ml/v1/get_result?id=${taskId}`, {
                headers: {
                    'X-Key': apiKey
                }
            });

            if (!statusResponse.ok) {
                throw new Error(`Failed to check status: ${statusResponse.status}`);
            }

            result = await statusResponse.json();
            attempts++;

            // Update progress
            const progress = 40 + (attempts / maxAttempts) * 50;
            onProgress?.(Math.min(progress, 90));
        }

        if (result.status === 'Ready' && result.result?.sample) {
            onProgress?.(100);
            console.log('[BFL] Generation successful');
            return result.result.sample;
        } else {
            throw new Error(`Generation failed: ${result.status}`);
        }
    } catch (error) {
        console.error('[BFL] Generation failed:', error);
        throw error;
    }
}