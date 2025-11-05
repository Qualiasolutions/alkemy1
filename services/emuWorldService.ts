/**
 * Emu3-Gen World Generation Service
 *
 * Generates navigable 3D worlds using Emu3-Gen model from Replicate.
 * Uses multi-view generation to create spatiotemporally consistent environments.
 *
 * Strategy:
 * 1. Generate multiple views of the same world from different angles
 * 2. Create skybox/panorama from these views
 * 3. Allow user to navigate and generate new views as they explore
 *
 * Model: baaivision/emu3-gen via Replicate
 */

const REPLICATE_PROXY_URL = '/api/replicate-proxy';
const EMU3_GEN_VERSION = 'f65f4d8e2625bc9261768c129ec143c26c51f1aa11e12f2276a92fbfdf2359cd';

export interface WorldGenerationOptions {
    prompt: string;
    numViews?: number; // Number of views to generate initially (default: 6 for skybox)
    guidanceScale?: number; // CFG scale (default: 3)
    onProgress?: (progress: number, status: string) => void;
}

export interface WorldView {
    id: string;
    imageUrl: string;
    direction: 'front' | 'back' | 'left' | 'right' | 'up' | 'down';
    position: { x: number; y: number; z: number };
}

export interface GeneratedWorld {
    id: string;
    prompt: string;
    views: WorldView[];
    centerPosition: { x: number; y: number; z: number };
}

/**
 * Generate a navigable 3D world from a text prompt
 * Creates multiple views from different angles for skybox generation
 * Uses parallel generation in batches to reduce total time
 */
export async function generateNavigableWorld(
    options: WorldGenerationOptions
): Promise<GeneratedWorld> {
    const { prompt, numViews = 6, guidanceScale = 3, onProgress } = options;

    try {
        onProgress?.(5, 'Initializing world generation...');

        // Generate views for all 6 directions (cube map)
        const directions: WorldView['direction'][] = ['front', 'back', 'left', 'right', 'up', 'down'];
        const views: WorldView[] = [];

        // Generate in two parallel batches to avoid rate limiting
        // Batch 1: Front, left, right (main horizontal views)
        // Batch 2: Back, up, down (secondary views)
        const batch1: WorldView['direction'][] = ['front', 'left', 'right'];
        const batch2: WorldView['direction'][] = ['back', 'up', 'down'];

        // Generate batch 1 in parallel
        onProgress?.(10, 'Generating primary views (front, left, right)...');
        const batch1Promises = batch1.map(async (direction) => {
            const directionalPrompt = enhancePromptForDirection(prompt, direction);
            const imageUrl = await generateSingleView(directionalPrompt, guidanceScale, (elapsed) => {
                console.log(`[${direction}] ${elapsed}s elapsed...`);
            });
            return {
                id: `view-${direction}-${Date.now()}`,
                imageUrl,
                direction,
                position: getPositionForDirection(direction)
            };
        });

        const batch1Results = await Promise.all(batch1Promises);
        views.push(...batch1Results);
        onProgress?.(50, 'Primary views complete! Generating secondary views...');

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate batch 2 in parallel
        onProgress?.(55, 'Generating secondary views (back, up, down)...');
        const batch2Promises = batch2.map(async (direction) => {
            const directionalPrompt = enhancePromptForDirection(prompt, direction);
            const imageUrl = await generateSingleView(directionalPrompt, guidanceScale, (elapsed) => {
                console.log(`[${direction}] ${elapsed}s elapsed...`);
            });
            return {
                id: `view-${direction}-${Date.now()}`,
                imageUrl,
                direction,
                position: getPositionForDirection(direction)
            };
        });

        const batch2Results = await Promise.all(batch2Promises);
        views.push(...batch2Results);
        onProgress?.(95, 'All views generated! Finalizing world...');

        onProgress?.(100, 'World generation complete!');

        return {
            id: `world-${Date.now()}`,
            prompt,
            views,
            centerPosition: { x: 0, y: 0, z: 0 }
        };

    } catch (error) {
        console.error('World generation error:', error);
        throw new Error(
            error instanceof Error
                ? `Failed to generate world: ${error.message}`
                : 'Failed to generate world'
        );
    }
}

/**
 * Generate a single view/image using Emu3-Gen
 */
async function generateSingleView(
    prompt: string,
    guidanceScale: number = 3,
    onProgress?: (elapsed: number) => void
): Promise<string> {
    try {
        // Create prediction
        const createResponse = await fetch(REPLICATE_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'create_prediction',
                payload: {
                    version: EMU3_GEN_VERSION,
                    input: {
                        prompt: prompt,
                        guidance_scale: guidanceScale,
                        positive_prompt: 'masterpiece, film grained, best quality, cinematic, highly detailed, photorealistic',
                        negative_prompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name'
                    }
                }
            })
        });

        if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({}));
            throw new Error(`Prediction creation failed: ${JSON.stringify(errorData)}`);
        }

        const prediction = await createResponse.json();

        // Poll for completion with progress reporting
        const imageUrl = await pollForPredictionComplete(prediction.id, onProgress);

        return imageUrl;

    } catch (error) {
        console.error('Single view generation error:', error);
        throw error;
    }
}

/**
 * Poll Replicate API for prediction completion with exponential backoff
 */
async function pollForPredictionComplete(predictionId: string, onProgress?: (elapsed: number) => void): Promise<string> {
    const maxAttempts = 180; // 180 attempts = up to 6 minutes max wait
    const initialPollInterval = 2000; // Start with 2 seconds
    const maxPollInterval = 5000; // Max 5 seconds between polls
    const startTime = Date.now();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Exponential backoff: gradually increase wait time
        const pollInterval = Math.min(
            initialPollInterval * Math.pow(1.05, attempt),
            maxPollInterval
        );

        await new Promise(resolve => setTimeout(resolve, pollInterval));

        try {
            const statusResponse = await fetch(REPLICATE_PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get_prediction',
                    payload: {
                        predictionId
                    }
                })
            });

            if (!statusResponse.ok) {
                throw new Error(`Status check failed: ${statusResponse.statusText}`);
            }

            const prediction = await statusResponse.json();
            const status = prediction.status;

            // Report progress
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            onProgress?.(elapsed);

            // Check for completion
            if (status === 'succeeded') {
                const imageUrl = prediction.output;

                if (!imageUrl) {
                    throw new Error('Prediction succeeded but no image URL provided');
                }

                return imageUrl;
            }

            // Check for failure
            if (status === 'failed') {
                throw new Error(prediction.error || 'Prediction failed');
            }

            if (status === 'canceled') {
                throw new Error('Prediction was canceled');
            }

            // Continue polling if still processing
            if (status === 'starting' || status === 'processing') {
                continue;
            }

        } catch (error) {
            console.error(`Polling attempt ${attempt + 1} failed:`, error);
            // Continue polling unless it's the last attempt
            if (attempt === maxAttempts - 1) {
                throw error;
            }
        }
    }

    throw new Error('Prediction timed out after 6 minutes');
}

/**
 * Enhance prompt for specific viewing direction
 */
function enhancePromptForDirection(basePrompt: string, direction: WorldView['direction']): string {
    const directionalHints: Record<WorldView['direction'], string> = {
        'front': 'forward-facing view, main focal point',
        'back': 'rear view, looking back',
        'left': 'left side view, looking left',
        'right': 'right side view, looking right',
        'up': 'looking upward, sky view, ceiling perspective',
        'down': 'looking downward, ground view, floor perspective'
    };

    return `Cinematic ${basePrompt}, ${directionalHints[direction]}, consistent environment, wide angle, immersive 3D world, spatially coherent`;
}

/**
 * Get 3D position for each direction (for skybox mapping)
 */
function getPositionForDirection(direction: WorldView['direction']): { x: number; y: number; z: number } {
    const positions: Record<WorldView['direction'], { x: number; y: number; z: number }> = {
        'front': { x: 0, y: 0, z: -1 },
        'back': { x: 0, y: 0, z: 1 },
        'left': { x: -1, y: 0, z: 0 },
        'right': { x: 1, y: 0, z: 0 },
        'up': { x: 0, y: 1, z: 0 },
        'down': { x: 0, y: -1, z: 0 }
    };

    return positions[direction];
}

/**
 * Extend world by generating new view in specific direction
 * Used for exploration - generate adjacent views as user moves
 */
export async function exploreWorldDirection(
    currentWorld: GeneratedWorld,
    direction: WorldView['direction'],
    onProgress?: (progress: number, status: string) => void
): Promise<WorldView> {
    try {
        onProgress?.(30, `Exploring ${direction}...`);

        // Generate contextual prompt based on existing world
        const explorationPrompt = `${currentWorld.prompt}, continuing in ${direction} direction, same environment style`;

        const imageUrl = await generateSingleView(explorationPrompt, 3);

        const newView: WorldView = {
            id: `explore-${direction}-${Date.now()}`,
            imageUrl,
            direction,
            position: getPositionForDirection(direction)
        };

        onProgress?.(100, 'Exploration complete!');

        return newView;

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
 * Generate quick preview (single front view) for fast feedback
 */
export async function generateWorldPreview(
    prompt: string,
    onProgress?: (progress: number, status: string) => void
): Promise<string> {
    try {
        onProgress?.(50, 'Generating preview...');

        const previewPrompt = enhancePromptForDirection(prompt, 'front');
        const imageUrl = await generateSingleView(previewPrompt, 3);

        onProgress?.(100, 'Preview ready!');

        return imageUrl;

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
 * Check if Replicate API is available
 */
export function isReplicateApiAvailable(): boolean {
    // Will be checked server-side by proxy
    return true;
}
