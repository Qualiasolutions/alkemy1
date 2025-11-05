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
 */
export async function generateNavigableWorld(
    options: WorldGenerationOptions
): Promise<GeneratedWorld> {
    const { prompt, numViews = 6, guidanceScale = 3, onProgress } = options;

    try {
        onProgress?.(10, 'Initializing world generation...');

        // Generate views for all 6 directions (cube map)
        const directions: WorldView['direction'][] = ['front', 'back', 'left', 'right', 'up', 'down'];
        const views: WorldView[] = [];

        // Generate each view with directional prompt
        for (let i = 0; i < numViews; i++) {
            const direction = directions[i];
            const progress = 10 + (i / numViews) * 80;

            onProgress?.(progress, `Generating ${direction} view...`);

            const directionalPrompt = enhancePromptForDirection(prompt, direction);

            const imageUrl = await generateSingleView(directionalPrompt, guidanceScale);

            views.push({
                id: `view-${direction}-${Date.now()}`,
                imageUrl,
                direction,
                position: getPositionForDirection(direction)
            });

            // Small delay to avoid rate limiting
            if (i < numViews - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

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
    guidanceScale: number = 3
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

        // Poll for completion
        const imageUrl = await pollForPredictionComplete(prediction.id);

        return imageUrl;

    } catch (error) {
        console.error('Single view generation error:', error);
        throw error;
    }
}

/**
 * Poll Replicate API for prediction completion
 */
async function pollForPredictionComplete(predictionId: string): Promise<string> {
    const maxAttempts = 60; // 60 attempts = 2 minutes max wait
    const pollInterval = 2000; // 2 seconds between polls

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
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

    throw new Error('Prediction timed out after 2 minutes');
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
