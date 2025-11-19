
import { ScriptAnalysis, AnalyzedScene, Frame, AnalyzedCharacter, AnalyzedLocation, FrameStatus, Generation, Moodboard, MoodboardSection, MoodboardTemplate } from '../types';
import { Type, GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { fallbackScriptAnalysis, fallbackMoodboardDescription, fallbackDirectorResponse, getFallbackImageUrl, getFallbackVideoBlobs } from './fallbackContent';
import { getGeminiApiKey, clearGeminiApiKey, getApiKeyValidationError, isValidGeminiApiKeyFormat } from './apiKeys';
import { getMediaService } from './mediaService';
import { logAIUsage, USAGE_ACTIONS } from './usageService';
// Flux API removed - using free Pollinations models instead
import { trackGenerationMetrics } from './analyticsService';
import { API_COST_ESTIMATES } from './apiConstants';
import { networkDetection } from './networkDetection';
import { generateImageWithPollinations, isPollinationsAvailable, type PollinationsImageModel } from './pollinationsService';
import { generateImageWithFlux, isFluxApiAvailable, type FluxModelVariant } from './fluxService';
// BFL service removed due to CORS issues - using FAL models only
import { ENHANCED_DIRECTOR_KNOWLEDGE } from './directorKnowledge';
// This file simulates interactions with external services like Gemini, Drive, and a backend API.

// FLUX_API_KEY removed - using free Pollinations instead
const GEMINI_PRO_MODEL_CANDIDATES = [
    'gemini-2.5-pro',
    'gemini-2.5-flash-002',
    'gemini-2.0-pro-exp-02-05',
    'gemini-1.5-pro-latest',
];

let cachedModelNames: string[] | null = null;
let inFlightModelList: Promise<string[]> | null = null;

const importMetaEnv = typeof import.meta !== 'undefined' ? (import.meta as any)?.env ?? {} : {};
const truthyStrings = new Set(['true', '1', 'yes', 'on']);

function resolveBooleanEnv(...keys: string[]): boolean {
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
}

const FORCE_DEMO_MODE = resolveBooleanEnv('VITE_FORCE_DEMO_MODE', 'FORCE_DEMO_MODE', 'USE_FALLBACK_MODE', 'VITE_USE_FALLBACK_MODE');

// Debug logging to diagnose demo mode issues (deferred to avoid circular dependency errors)
if (typeof window !== 'undefined') {
    setTimeout(() => {
        console.log('[AI Service] Configuration:', {
            FORCE_DEMO_MODE,
            hasGeminiKey: !!getGeminiApiKey(),
            prefersLiveGemini: prefersLiveGemini(),
            pollinationsAvailable: isPollinationsAvailable(),
            envVars: {
                VITE_FORCE_DEMO_MODE: importMetaEnv.VITE_FORCE_DEMO_MODE,
                FORCE_DEMO_MODE: typeof process !== 'undefined' ? process.env?.FORCE_DEMO_MODE : undefined,
                USE_FALLBACK_MODE: typeof process !== 'undefined' ? process.env?.USE_FALLBACK_MODE : undefined,
            }
        });
    }, 0);
}

function requireGeminiClient(): GoogleGenAI {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error('Gemini API key is not configured.');
    }

    // Validate API key format before attempting to use it
    const validationError = getApiKeyValidationError();
    if (validationError) {
        console.error('[AI Service] API key validation failed:', validationError);
        // Dispatch event to prompt user for a valid key
        window.dispatchEvent(new Event('invalid-api-key'));
        clearGeminiApiKey();
        throw new Error(validationError);
    }

    return new GoogleGenAI({ apiKey });
}

function shouldUseFallbackForError(error: unknown): boolean {
    if (FORCE_DEMO_MODE) return true;
    if (!error) return false;
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();

    // Check for authentication errors that should NOT use fallback (need user intervention)
    const isAuthError = [
        'unauthenticated',
        'credentials_missing',
        'api keys are not supported',
        'oauth2 access token',
        'invalid api key',
    ].some(fragment => normalized.includes(fragment));

    if (isAuthError) {
        console.error('[AI Service] Authentication error detected - user intervention required:', message);
        return false; // Don't use fallback, need to fix API key
    }

    return [
        'quota',
        'resource_exhausted',
        '429',
        'rate limit',
        'api key is not configured',
        'unauthorized',
        'forbidden'
    ].some(fragment => normalized.includes(fragment));
}

function prefersLiveGemini(): boolean {
    return !!getGeminiApiKey() && !FORCE_DEMO_MODE;
}

function handleApiError(error: unknown, model: string): Error {
    console.error(`Error with ${model} API:`, error);
    let message = `An unknown error occurred with ${model}.`;
    if (error instanceof Error) {
        const errorLower = error.message.toLowerCase();

        // Check for authentication/authorization errors first
        if (errorLower.includes('unauthenticated') || errorLower.includes('credentials_missing')) {
            window.dispatchEvent(new Event('invalid-api-key'));
            clearGeminiApiKey();
            resetModelListCache();
            message = 'Authentication failed: Your API key is invalid or in the wrong format. AI Studio keys (starting with "AQ.") cannot be used. Please generate a Google AI API key from https://aistudio.google.com/apikey';
        } else if (errorLower.includes('api keys are not supported') || errorLower.includes('oauth2 access token')) {
            window.dispatchEvent(new Event('invalid-api-key'));
            clearGeminiApiKey();
            resetModelListCache();
            message = 'Invalid API key format: This endpoint requires a Google AI API key (starting with "AIza"), not an AI Studio key. Generate one at https://aistudio.google.com/apikey';
        } else if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429')) {
            message = 'API quota exceeded. Please check your plan and billing details.';
        } else if (error.message.includes('503') || errorLower.includes('unavailable') || errorLower.includes('overloaded')) {
            message = 'Service temporarily unavailable. The API is experiencing high load. Please wait a moment and try again.';
        } else if (errorLower.includes('safety') || errorLower.includes('prohibited_content')) {
            message = 'Generation blocked by safety filters. The system will automatically retry with Pollinations API (free). Try simplifying your prompt or switching to a Pollinations model manually.';
        } else if (error.message.includes('Requested entity was not found.')) {
            // This is a specific error for an invalid/not found API key.
            // Dispatch a global event to notify the UI to re-prompt for a key.
            window.dispatchEvent(new Event('invalid-api-key'));
            clearGeminiApiKey();
            resetModelListCache();
            message = 'Your API Key was not found or is invalid. Please select a valid key.';
        } else {
            // Clean up generic messages
            message = error.message.replace(/\[\w+ \w+\]\s*/, ''); // Remove prefixes like [GoogleGenerativeAI Error]
        }
    }
    return new Error(message);
}

function isModelNotFoundError(error: unknown): boolean {
    if (!error) return false;

    const unwrapError = (err: any): boolean => {
        if (!err) return false;
        const status = typeof err.status === 'string' ? err.status.toLowerCase() : '';
        const code = typeof err.code === 'string' ? err.code : '';
        const message = typeof err.message === 'string' ? err.message.toLowerCase() : '';
        return status.includes('not_found') || code === '404' || message.includes('not found');
    };

    if (unwrapError((error as any)?.error)) {
        return true;
    }

    const message = error instanceof Error
        ? error.message
        : typeof error === 'string'
            ? error
            : '';

    const normalized = message.toLowerCase();
    return normalized.includes('not_found') ||
        normalized.includes('not found') ||
        normalized.includes('404');
}

/**
 * Check if an error is retryable (503, network errors, etc.)
 */
function isRetryableError(error: unknown): boolean {
    if (!error) return false;
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();

    return normalized.includes('503') ||
        normalized.includes('unavailable') ||
        normalized.includes('overloaded') ||
        normalized.includes('network') ||
        normalized.includes('timeout') ||
        normalized.includes('econnreset') ||
        normalized.includes('enotfound');
}

/**
 * Retry helper with exponential backoff for API calls
 */
async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    operationName: string = 'API call'
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            // Don't retry on final attempt
            if (attempt === maxRetries) {
                break;
            }

            // Only retry if error is retryable
            if (!isRetryableError(error)) {
                throw error;
            }

            // Calculate exponential backoff with jitter
            const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
            console.warn(`[${operationName}] Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${Math.round(delay)}ms...`, error);

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // All retries exhausted
    throw lastError;
}

function resetModelListCache(): void {
    cachedModelNames = null;
    inFlightModelList = null;
}

function extractModelNames(response: any): string[] {
    if (!response) return [];
    const collections = Array.isArray(response) ? response : (response?.models ?? response?.data ?? []);
    if (!Array.isArray(collections)) return [];
    return collections
        .map((entry) => {
            if (!entry) return '';
            if (typeof entry === 'string') return entry;
            const name = entry?.name ?? entry?.model;
            return typeof name === 'string' ? name : '';
        })
        .filter((name): name is string => typeof name === 'string' && name.length > 0);
}

async function getAvailableGeminiModels(ai: GoogleGenAI): Promise<string[]> {
    if (cachedModelNames) {
        return cachedModelNames;
    }
    if (inFlightModelList) {
        return inFlightModelList;
    }

    inFlightModelList = ai.models.list({ pageSize: 200 })
        .then((response: any) => {
            const names = extractModelNames(response);
            cachedModelNames = names;
            return names;
        })
        .catch((error: unknown) => {
            console.warn('[AI Service] Unable to list Gemini models. Falling back to static list.', error);
            return [];
        })
        .finally(() => {
            inFlightModelList = null;
        });

    return inFlightModelList;
}

function expandModelIdVariants(id: string): string[] {
    if (!id) return [];
    const clean = id.replace(/^models\//, '');
    const variants = new Set<string>();
    variants.add(clean);
    variants.add(`models/${clean}`);
    if (id !== clean) {
        variants.add(id);
    }
    return Array.from(variants);
}

async function buildModelAttemptList(ai: GoogleGenAI, preferred: string[]): Promise<string[]> {
    const availableModels = await getAvailableGeminiModels(ai);
    const availableSet = new Set(availableModels);
    const attempts: string[] = [];
    const seen = new Set<string>();

    const addAttempt = (modelId: string) => {
        if (!modelId || seen.has(modelId)) return;
        seen.add(modelId);
        attempts.push(modelId);
    };

    const findAvailableVariant = (candidate: string): string | null => {
        if (!candidate) return null;
        if (availableSet.has(candidate)) return candidate;
        const suffix = candidate.replace(/^models\//, '');
        const match = availableModels.find(name => name.endsWith(suffix));
        return match ?? null;
    };

    for (const baseId of preferred) {
        const variants = expandModelIdVariants(baseId);
        let resolved = false;
        for (const variant of variants) {
            const available = availableModels.length > 0 ? findAvailableVariant(variant) : variant;
            if (available) {
                addAttempt(available);
                resolved = true;
                break;
            }
        }
        if (!resolved) {
            variants.forEach(addAttempt);
        }
    }

    if (availableModels.length > 0) {
        const proFallback = availableModels.find(name => name.includes('gemini') && name.includes('pro'));
        if (proFallback) addAttempt(proFallback);

        const flashFallback = availableModels.find(name => name.includes('gemini') && name.includes('flash'));
        if (flashFallback) addAttempt(flashFallback);
    }

    if (attempts.length === 0) {
        preferred.flatMap(expandModelIdVariants).forEach(addAttempt);
    }

    return attempts;
}


// --- Helper Functions ---
const MAX_IMAGE_SIZE_MB = 20; // Google API actual limit for entire request (prompt + images)
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

/**
 * Validates if a base64 encoded image is within size limits
 */
function validateImageSize(base64Data: string, maxSizeBytes: number = MAX_IMAGE_SIZE_BYTES): { isValid: boolean; sizeBytes: number } {
    // Calculate approximate size from base64 (base64 adds ~33% overhead)
    const sizeBytes = Math.floor((base64Data.length * 3) / 4);
    return {
        isValid: sizeBytes <= maxSizeBytes,
        sizeBytes
    };
}

async function image_url_to_base64(url: string): Promise<{ mimeType: string; data: string }> {
    // Handle data URLs directly
    if (url.startsWith('data:')) {
        const parts = url.split(',');
        if (parts.length !== 2) {
            console.error("Malformed data URL passed to base64 converter:", url.substring(0, 100));
            throw new Error("Malformed data URL: must contain a single comma.");
        }
        const [meta, data] = parts;
        const mimeMatch = meta.match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        if (!mimeMatch) console.warn("Could not determine MIME type from data URL, defaulting to octet-stream.", meta);

        // Validate size for Gemini API
        const { isValid, sizeBytes } = validateImageSize(data);
        if (!isValid) {
            const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
            throw new Error(`Image is too large (${sizeMB}MB). Google API supports images up to ${MAX_IMAGE_SIZE_MB}MB for inline requests. Please use a smaller image or compress it. For larger files, consider using the Files API.`);
        }

        return { mimeType, data };
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status} when fetching image.`);
        }
        const blob = await response.blob();
        let mimeType = blob.type;

        // CRITICAL FIX: Ensure the fetched content is actually an image.
        // Some URLs might resolve with a 200 OK but return HTML or other content types.
        if (!mimeType || !mimeType.startsWith('image/')) {
            throw new Error(`The content from the URL is not a valid image. MIME type found: '${mimeType || 'unknown'}'. Please use a direct link to an image file.`);
        }

        // Convert unsupported image formats (AVIF, WEBP, etc.) to JPEG for Gemini API compatibility
        // Gemini API supports: image/jpeg, image/png, image/gif, image/webp
        const supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        let processedBlob = blob;

        if (!supportedFormats.includes(mimeType)) {
            console.log(`[Image Conversion] Converting unsupported format ${mimeType} to JPEG`);

            // Create an image element to load and convert the image
            const img = new Image();
            const imageUrl = URL.createObjectURL(blob);

            try {
                // Load image
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error(`Failed to load image for conversion from ${mimeType}`));
                    img.src = imageUrl;
                });

                // Create canvas and convert to JPEG
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    throw new Error('Failed to get canvas context for image conversion');
                }

                ctx.drawImage(img, 0, 0);

                // Convert to JPEG blob with high quality
                processedBlob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob(
                        (blob) => {
                            if (blob) resolve(blob);
                            else reject(new Error('Failed to convert image to JPEG'));
                        },
                        'image/jpeg',
                        0.95 // High quality
                    );
                });

                mimeType = 'image/jpeg';
                console.log(`[Image Conversion] Successfully converted to JPEG`);
            } finally {
                // Clean up
                URL.revokeObjectURL(imageUrl);
            }
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result !== 'string') {
                    return reject(new Error('Failed to read file as a data URL.'));
                }
                const base64data = reader.result.split(',')[1];
                if (!base64data) {
                    return reject(new Error('Could not extract base64 data from the data URL.'));
                }

                // Validate size before returning
                const { isValid, sizeBytes } = validateImageSize(base64data);
                if (!isValid) {
                    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
                    return reject(new Error(`Image is too large (${sizeMB}MB). Google API supports images up to ${MAX_IMAGE_SIZE_MB}MB for inline requests. Please use a smaller image or compress it. For larger files, consider using the Files API.`));
                }

                resolve({ mimeType, data: base64data });
            };
            reader.onerror = (error) => reject(new Error(`FileReader error: ${error}`));
            reader.readAsDataURL(processedBlob);
        });
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error(`Failed to fetch and encode image from URL: ${url}. Reason: ${errorMessage}`, e);
        // Re-throw a more user-friendly error.
        throw new Error(`Could not process a reference image from URL: ${url}. ${errorMessage}. Please ensure the URL is valid, publicly accessible, and links directly to an image.`);
    }
}

const MAX_PROMPT_LENGTH = 800; // Nano Banana performs best with concise prompts
const MAX_REFINEMENT_PROMPT_LENGTH = 400; // Refinement needs shorter prompts since it also processes reference image

export function buildSafePrompt(
    prompt: string,
    hasVisualReferences: boolean, // Keep for signature compatibility, though unused in this version
    type: 'still' | 'video' = 'still',
    isRefinement: boolean = false // New parameter for refinement operations
): { finalPrompt: string; wasAdjusted: boolean } {
    // NO PREFIX - Let the raw prompt through to avoid triggering safety filters
    // Gemini's safety filters are overly aggressive with certain keywords

    // Use more conservative limit for refinement operations
    const maxLength = isRefinement ? MAX_REFINEMENT_PROMPT_LENGTH : MAX_PROMPT_LENGTH;

    let adjustedPrompt = prompt;
    let wasAdjusted = false;

    // Truncate overly long prompts to prevent MAX_TOKENS and IMAGE_OTHER errors
    if (prompt.length > maxLength) {
        adjustedPrompt = prompt.substring(0, maxLength).trim();
        // Try to end at a sentence boundary for better coherence
        const lastPeriod = adjustedPrompt.lastIndexOf('.');
        const lastComma = adjustedPrompt.lastIndexOf(',');
        const cutPoint = Math.max(lastPeriod, lastComma);
        if (cutPoint > maxLength * 0.7) { // Only cut at punctuation if it's not too early
            adjustedPrompt = adjustedPrompt.substring(0, cutPoint + 1).trim();
        }
        wasAdjusted = true;
        console.warn(`[buildSafePrompt] Prompt truncated from ${prompt.length} to ${adjustedPrompt.length} characters to prevent API errors. Context: ${isRefinement ? 'refinement' : 'generation'}`);
    }

    // Return the prompt as-is (no prefix to avoid safety triggers)
    return { finalPrompt: adjustedPrompt, wasAdjusted };
}

export async function generateStillVariants(
    frame_id: string,
    model: string,
    prompt: string,
    reference_images: string[],
    avatar_refs: string[], // This argument is kept for signature compatibility but is unused.
    aspect_ratio: string,
    n: number = 1,
    moodboard?: Moodboard,
    moodboardTemplates: MoodboardTemplate[] = [],
    characterNames?: string[],
    locationName?: string,
    onProgress?: (index: number, progress: number) => void,
    context?: { projectId?: string; userId?: string; sceneId?: string; frameId?: string },
    characterIdentities?: Array<{ loraUrl: string; scale?: number }> // NEW: Character identity LoRAs
): Promise<{
    urls: string[],
    errors: (string | null)[],
    wasAdjusted: boolean,
    metadata: {
        promptUsed: string;
        referenceImages: string[];
        selectedCharacters: string[];
        selectedLocation: string;
        model: string;
    }
}> {
    console.log("[API Action] generateStillVariants", { frame_id, model, prompt, reference_images, n, aspect_ratio, moodboard, characterNames, locationName });

    const prioritizedImages = reference_images;

    let moodboardImages: string[] = [];
    if (moodboard) {
        const styleImg = moodboard.style?.items[0]?.url;
        const colorImg = moodboard.color?.items[0]?.url;
        const cineImg = moodboard.cinematography?.items[0]?.url;
        const otherImg = moodboard.other?.items[0]?.url;
        moodboardImages = [styleImg, colorImg, cineImg, otherImg].filter((url): url is string => !!url);
    }

    const MAX_REFERENCE_IMAGES = 8; // Increased from 5 to support professional moodboards
    const templateImages = moodboardTemplates.flatMap(board => board.items.map(item => item.url));
    // Prioritize user-curated template images over legacy moodboard images
    const combinedImages = [...new Set([...prioritizedImages, ...templateImages.slice(0, 6), ...moodboardImages.slice(0, 2)])];
    const allReferenceImages = combinedImages.slice(0, MAX_REFERENCE_IMAGES);

    const hasVisualReferences = allReferenceImages.length > 0;

    let contextualPrompt = prompt;
    if (characterNames && characterNames.length > 0) {
        contextualPrompt += ` featuring ${characterNames.join(' and ')}`;
    }
    if (locationName) {
        contextualPrompt += ` in the ${locationName}`;
    }

    // Inject moodboard AI summaries for visual style guidance
    if (moodboardTemplates.length > 0) {
        const summaries = moodboardTemplates
            .filter(board => board.aiSummary && board.aiSummary.trim().length > 0)
            .map(board => `${board.title}: ${board.aiSummary}`)
            .join('. ');

        if (summaries) {
            contextualPrompt += `\n\nVisual Style Reference: ${summaries}`;
        }
    }

    const { finalPrompt, wasAdjusted } = buildSafePrompt(contextualPrompt, hasVisualReferences);


    const urls: string[] = [];
    const errors: (string | null)[] = [];

    const generationPromises = Array.from({ length: n }).map((_, index) => {
        const startTime = Date.now();

        return generateVisual(
            finalPrompt,
            model,
            allReferenceImages,
            aspect_ratio,
            (progress) => { onProgress?.(index, progress); },
            `${frame_id}-${index}-${aspect_ratio}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            {
                ...context,
                frameId: context?.frameId || `${frame_id}-${index}`,
                sceneId: context?.sceneId || frame_id.split('-')[0],
            },
            characterIdentities // NEW: Pass character identity LoRAs
        )
            .then((result) => {
                // Track successful generation
                const duration = Date.now() - startTime;
                const estimatedCost = model === 'Flux Pro' || model === 'Flux Dev' ||
                    model === 'FLUX.1.1 Pro' || model === 'FLUX.1 Kontext' || model === 'FLUX Ultra' ? API_COST_ESTIMATES.image.flux :
                    model === 'Gemini Nano Banana' ? API_COST_ESTIMATES.image.nanoBanana :
                        model === 'FLUX Schnell' || model === 'FLUX Realism' || model === 'Stable Diffusion' ? 0 : // FREE!
                            API_COST_ESTIMATES.image.nanoBanana;

                trackGenerationMetrics(
                    context?.projectId || 'temp',
                    'image',
                    model,
                    duration / 1000, // Convert to seconds
                    estimatedCost,
                    true // success
                );

                return result;
            })
            .catch((error) => {
                // Track failed generation
                const duration = Date.now() - startTime;
                const estimatedCost = model === 'Flux Pro' || model === 'Flux Dev' ||
                    model === 'FLUX.1.1 Pro' || model === 'FLUX.1 Kontext' || model === 'FLUX Ultra' ? API_COST_ESTIMATES.image.flux :
                    model === 'Gemini Nano Banana' ? API_COST_ESTIMATES.image.nanoBanana :
                        model === 'FLUX Schnell' || model === 'FLUX Realism' || model === 'Stable Diffusion' ? 0 : // FREE!
                            API_COST_ESTIMATES.image.nanoBanana;

                trackGenerationMetrics(
                    context?.projectId || 'temp',
                    'image',
                    model,
                    duration / 1000,
                    0, // No cost for failed generation
                    false, // failure
                    error instanceof Error ? error.message : 'Unknown error'
                );

                throw error;
            });
    });

    const results = await Promise.allSettled(generationPromises);

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            urls.push(result.value.url);
            errors.push(result.value.fromFallback ? 'Fallback image generated – live AI service unavailable.' : (prefersLiveGemini() ? null : 'Fallback image generated – demo mode active.'));
        } else {
            if (shouldUseFallbackForError(result.reason)) {
                const fallbackUrl = getFallbackImageUrl(aspect_ratio, `${frame_id}-fallback-${index}`);
                urls.push(fallbackUrl);
                errors.push('Fallback image generated due to API quota or authorization failure.');
            } else {
                urls.push('');
                errors.push(result.reason instanceof Error ? result.reason.message : 'Unknown error during generation');
            }
        }
    });

    return {
        urls,
        errors,
        wasAdjusted,
        metadata: {
            promptUsed: finalPrompt,
            referenceImages: allReferenceImages,
            selectedCharacters: characterNames || [],
            selectedLocation: locationName || '',
            model: model
        }
    };
}


export async function animateFrame(
    prompt: string,
    reference_image_url: string,
    last_frame_image_url?: string | null,
    n: number = 1,
    aspectRatio: string = '16:9',
    onProgress?: (progress: number) => void,
    context?: { projectId?: string; userId?: string; sceneId?: string; frameId?: string },
    temperature?: number  // NEW: Allow different temperatures for variation
): Promise<string[]> {
    const startTime = Date.now();
    const model = 'veo-3.1-fast-generate-preview';

    if (!prefersLiveGemini()) {
        console.warn('[API Action] animateFrame using fallback videos because live service is unavailable.');
        onProgress?.(100);
        const fallbackBlobs = getFallbackVideoBlobs(n, `fallback-animate-${prompt}-${reference_image_url}`);
        if (!fallbackBlobs || !Array.isArray(fallbackBlobs)) {
            console.error('[animateFrame] getFallbackVideoBlobs returned invalid data');
            return [];
        }
        return fallbackBlobs.map(blob => URL.createObjectURL(blob));
    }
    console.log("[API Action] Animating frame with Veo", { prompt, hasLastFrame: !!last_frame_image_url, n });

    try {
        const ai = requireGeminiClient();

        const { mimeType, data } = await image_url_to_base64(reference_image_url);

        const imagePayload = {
            image: { imageBytes: data, mimeType: mimeType },
        };

        const motionPrompt = `Animate the provided image. Preserve the character's appearance, clothing, and background perfectly. The desired motion is: ${prompt}`;
        const hasVisualReferences = true; // Veo animate always has at least one reference image.
        const { finalPrompt } = buildSafePrompt(motionPrompt, hasVisualReferences, 'video');

        const supportedAspectRatios = ['16:9', '9:16'];
        const finalAspectRatio = supportedAspectRatios.includes(aspectRatio) ? aspectRatio : '16:9';
        if (!supportedAspectRatios.includes(aspectRatio)) {
            console.warn(`Veo only supports 16:9 and 9:16 aspect ratios. Defaulting to 16:9.`);
        }

        const config: any = {
            numberOfVideos: n,
            resolution: '720p',
            aspectRatio: finalAspectRatio,
            ...(temperature !== undefined ? { temperature } : {}),
        };

        if (last_frame_image_url) {
            const { mimeType: lastMimeType, data: lastData } = await image_url_to_base64(last_frame_image_url);
            config.lastFrame = {
                imageBytes: lastData,
                mimeType: lastMimeType,
            };
        }

        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: finalPrompt,
            ...imagePayload,
            config: config,
        });

        let progress = 0;
        onProgress?.(progress);

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
            progress = Math.min(99, progress + 5);
            onProgress?.(progress);
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        onProgress?.(100);

        const downloadLinks = operation.response?.generatedVideos?.map(v => v.video?.uri).filter((uri): uri is string => !!uri) || [];

        if (downloadLinks.length === 0) {
            if (operation.error) {
                throw new Error(`Video generation failed: ${operation.error.message || 'Unknown Veo API error'}`);
            }
            throw new Error("Video generation failed. The API completed without returning a video. This could be due to content safety filters.");
        }

        const videoBlobs = await Promise.all(downloadLinks.map(async (downloadLink, index) => {
            const apiKey = getGeminiApiKey();
            if (!apiKey) {
                throw new Error('Gemini API key is not available for downloading generated video.');
            }
            const response = await fetch(`${downloadLink}&key=${apiKey}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to download video: ${response.statusText} - ${errorText}`);
            }
            return response.blob();
        }));

        // Log usage for analytics
        if (context?.userId && context?.projectId) {
            await logAIUsage(
                context.userId,
                USAGE_ACTIONS.VIDEO_GENERATION,
                undefined, // Token count not available for Veo
                context.projectId,
                {
                    model: 'veo-3.1-fast-generate-preview',
                    prompt: prompt.substring(0, 200),
                    aspectRatio,
                    hasReferenceImage: true,
                    hasLastFrame: !!last_frame_image_url,
                    videoCount: videoBlobs.length,
                    totalSize: videoBlobs.reduce((sum, blob) => sum + blob.size, 0),
                    sceneId: context.sceneId,
                    frameId: context.frameId,
                }
            );
        }

        // Upload videos to Supabase Storage if context is available
        if (context?.projectId && context?.userId) {
            const uploadedUrls = await Promise.all(videoBlobs.map(async (blob, index) => {
                const fileName = `veo_animation_${aspectRatio}_${prompt.substring(0, 30).replace(/\s+/g, '_')}_${index}`;
                const { url, error } = await uploadVideoToSupabase(
                    blob,
                    fileName,
                    context.projectId!,
                    context.userId!,
                    {
                        model: 'veo-3.1-fast-generate-preview',
                        prompt: prompt.substring(0, 200),
                        aspectRatio,
                        generationType: 'video_animation',
                        hasReferenceImage: true,
                        hasLastFrame: !!last_frame_image_url,
                        sceneId: context.sceneId,
                        frameId: context.frameId,
                    }
                );

                if (error) {
                    console.warn(`Failed to upload video ${index} to Supabase, returning blob URL:`, error);
                    return URL.createObjectURL(blob);
                }
                return url;
            }));

            return uploadedUrls;
        }

        // Track successful video generation
        const duration = Date.now() - startTime;
        trackGenerationMetrics(
            context?.projectId || 'temp',
            'video',
            model,
            duration / 1000, // Convert to seconds
            API_COST_ESTIMATES.video.veo * n, // Cost per video * count
            true // success
        );

        // Return blob URLs if Supabase is not available
        return videoBlobs.map(blob => URL.createObjectURL(blob));

    } catch (error) {
        onProgress?.(100);

        // Track failed video generation
        const duration = Date.now() - startTime;
        trackGenerationMetrics(
            context?.projectId || 'temp',
            'video',
            model,
            duration / 1000,
            0, // No cost for failed generation
            false, // failure
            error instanceof Error ? error.message : 'Unknown error'
        );

        if (shouldUseFallbackForError(error)) {
            console.warn('[API Action] animateFrame fallback triggered due to API failure.');
            const fallbackBlobs = getFallbackVideoBlobs(n, `fallback-animate-${prompt}-${reference_image_url ?? 'none'}`);
            if (!fallbackBlobs || !Array.isArray(fallbackBlobs)) {
                console.error('[animateFrame] getFallbackVideoBlobs returned invalid data (error fallback)');
                return [];
            }
            return fallbackBlobs.map(blob => URL.createObjectURL(blob));
        }
        throw handleApiError(error, 'Veo (Animate)');
    }
}

export async function refineVariant(
    prompt: string,
    base_image_url: string,
    aspect_ratio: string,
    context?: { projectId?: string; userId?: string; sceneId?: string; frameId?: string }
): Promise<string> {
    console.log("[API Action] refineVariant", {
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        promptLength: prompt.length,
        base_image_url: base_image_url.substring(0, 50) + '...',
        aspect_ratio
    });

    // Validate base image before attempting refinement
    if (!base_image_url || !base_image_url.trim()) {
        throw new Error('Base image URL is required for refinement.');
    }

    // Use Gemini Nano Banana for refinement
    const refinementModel = 'Gemini Nano Banana';
    const hasVisualReferences = true;

    // Try with refinement-specific prompt optimization
    const { finalPrompt, wasAdjusted } = buildSafePrompt(prompt, hasVisualReferences, 'still', true);

    if (wasAdjusted) {
        console.warn(`[refineVariant] Prompt was adjusted for refinement. Original: ${prompt.length} chars, Final: ${finalPrompt.length} chars`);
    }

    try {
        const result = await generateVisual(
            finalPrompt,
            refinementModel,
            [base_image_url],
            aspect_ratio,
            undefined,
            `refine-${Date.now()}`,
            {
                ...context,
                frameId: context?.frameId || `refine-${Date.now()}`,
            }
        );

        console.log("[API Action] refineVariant successful", {
            resultLength: result.url.length,
            fromFallback: result.fromFallback,
            promptLength: finalPrompt.length
        });

        return result.url;

    } catch (error) {
        console.error("[API Action] refineVariant failed on first attempt:", error);

        // If refinement fails with IMAGE_OTHER error, try with an even simpler prompt
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('IMAGE_OTHER') || errorMessage.includes('model limitations')) {
            console.warn("[refineVariant] Retrying with simplified prompt...");

            try {
                // Extract just the core action words from the prompt
                const simplifiedPrompt = prompt
                    .split(/[,.]/)  // Split on commas and periods
                [0]              // Take first clause
                    .trim()
                    .substring(0, 100); // Maximum 100 chars for retry

                const { finalPrompt: retryPrompt } = buildSafePrompt(simplifiedPrompt, hasVisualReferences, 'still', true);

                console.log("[refineVariant] Retry prompt:", {
                    original: prompt.substring(0, 50),
                    simplified: simplifiedPrompt,
                    final: retryPrompt.substring(0, 100)
                });

                const retryResult = await generateVisual(
                    retryPrompt,
                    refinementModel,
                    [base_image_url],
                    aspect_ratio,
                    undefined,
                    `refine-retry-${Date.now()}`,
                    {
                        ...context,
                        frameId: context?.frameId || `refine-retry-${Date.now()}`,
                    }
                );

                console.log("[API Action] refineVariant successful on retry");
                return retryResult.url;

            } catch (retryError) {
                console.error("[API Action] refineVariant failed on retry:", retryError);

                // Provide detailed error message with troubleshooting
                const retryErrorMsg = retryError instanceof Error ? retryError.message : String(retryError);
                throw new Error(
                    `Image refinement failed after retry. This usually means the reference image is incompatible with Nano Banana. ` +
                    `Original error: ${errorMessage}. Retry error: ${retryErrorMsg}. ` +
                    `Suggestion: Try generating a new image instead of refining this one.`
                );
            }
        }

        // For other errors, provide context
        if (error instanceof Error) {
            throw new Error(`Image refinement failed: ${error.message}`);
        }
        throw error;
    }
}


export function upscaleImage(
    image_url: string,
    onProgress: (progress: number) => void
): Promise<{ image_url: string }> {
    console.log("[API Action] upscaleImage (simulated)", { image_url });

    return new Promise((resolve) => {
        let progress = 0;
        onProgress(progress);

        const interval = setInterval(() => {
            progress += 10;
            if (progress <= 100) {
                onProgress(progress);
            } else {
                clearInterval(interval);
                resolve({ image_url });
            }
        }, 300); // Simulate a 3-second upscale process
    });
}

export function upscaleVideo(
    video_url: string,
    onProgress: (progress: number) => void
): Promise<{ video_url: string }> {
    console.log("[API Action] upscaleVideo (simulated)", { video_url });

    return new Promise((resolve) => {
        let progress = 0;
        onProgress(progress);

        const interval = setInterval(() => {
            progress += 5; // Slower than image upscale
            if (progress <= 100) {
                onProgress(progress);
            } else {
                clearInterval(interval);
                resolve({ video_url });
            }
        }, 500); // Simulate a 10-second upscale process
    });
}

/**
 * Transfer motion from reference video to target avatar
 * This function now uses the real Wan API for motion transfer
 * @deprecated - Use transferMotionWan from wanService.ts directly for better control
 */
export async function transferMotion(
    referenceVideo: File,
    targetAvatarImageUrl: string,
    onProgress: (progress: number) => void
): Promise<string> {
    console.log("[API Action] transferMotion - delegating to Wan API", {
        videoName: referenceVideo.name,
        avatarUrl: targetAvatarImageUrl.substring(0, 50) + '...'
    });

    // Import dynamically to avoid circular dependencies
    const { transferMotionWan } = await import('./wanService');
    return transferMotionWan(referenceVideo, targetAvatarImageUrl, onProgress);
}

interface VisualGenerationResult {
    url: string;
    fromFallback: boolean;
}

// Helper function to upload base64 image to Supabase Storage
async function uploadImageToSupabase(
    base64Data: string,
    fileName: string,
    projectId: string | null,
    userId: string | null,
    metadata?: any
): Promise<{ url: string; assetId: string | null; error: any }> {
    const mediaService = getMediaService();
    if (!mediaService || !projectId || !userId) {
        return { url: base64Data, assetId: null, error: null };
    }

    try {
        // Convert base64 to blob
        const base64Response = await fetch(`data:image/jpeg;base64,${base64Data}`);
        const blob = await base64Response.blob();

        // Create a more descriptive filename
        const timestamp = Date.now();
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
        const fullFileName = `${sanitizedName}_${timestamp}.jpg`;

        // Upload to Supabase Storage
        const { asset, error } = await mediaService.uploadBlob(
            projectId,
            userId,
            blob,
            fullFileName,
            'image/jpeg',
            {
                ...metadata,
                generatedBy: 'ai',
                originalFileName: fileName,
                timestamp: timestamp.toString(),
            }
        );

        if (error || !asset) {
            console.warn('Failed to upload image to Supabase Storage:', error);
            return { url: base64Data, assetId: null, error };
        }

        console.log('Image uploaded successfully to Supabase Storage:', asset.url);
        return { url: asset.url, assetId: asset.id, error: null };
    } catch (error) {
        console.error('Error uploading image to Supabase Storage:', error);
        return { url: base64Data, assetId: null, error };
    }
}

// Helper function to upload video blob to Supabase Storage
async function uploadVideoToSupabase(
    videoBlob: Blob,
    fileName: string,
    projectId: string | null,
    userId: string | null,
    metadata?: any
): Promise<{ url: string; assetId: string | null; error: any }> {
    const mediaService = getMediaService();
    if (!mediaService || !projectId || !userId) {
        // Return blob URL if Supabase is not available
        return { url: URL.createObjectURL(videoBlob), assetId: null, error: null };
    }

    try {
        // Create a more descriptive filename
        const timestamp = Date.now();
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
        const fullFileName = `${sanitizedName}_${timestamp}.mp4`;

        // Upload to Supabase Storage
        const { asset, error } = await mediaService.uploadBlob(
            projectId,
            userId,
            videoBlob,
            fullFileName,
            'video/mp4',
            {
                ...metadata,
                generatedBy: 'ai',
                originalFileName: fileName,
                timestamp: timestamp.toString(),
                fileSize: videoBlob.size,
            }
        );

        if (error || !asset) {
            console.warn('Failed to upload video to Supabase Storage:', error);
            return { url: URL.createObjectURL(videoBlob), assetId: null, error };
        }

        console.log('Video uploaded successfully to Supabase Storage:', asset.url);
        return { url: asset.url, assetId: asset.id, error: null };
    } catch (error) {
        console.error('Error uploading video to Supabase Storage:', error);
        return { url: URL.createObjectURL(videoBlob), assetId: null, error };
    }
}

export async function generateVisual(
    prompt: string,
    model: string,
    reference_images: string[],
    aspect_ratio: string,
    onProgress?: (progress: number) => void,
    seed: string = `${model}-${prompt}`,
    context?: { projectId?: string; userId?: string; sceneId?: string; frameId?: string },
    characterIdentities?: Array<{ loraUrl: string; scale?: number }> // NEW: Character identity LoRAs
): Promise<VisualGenerationResult> {
    console.log("[generateVisual] Starting generation", {
        model,
        promptLength: prompt.length,
        referenceImageCount: reference_images.length,
        aspect_ratio,
        timestamp: new Date().toISOString(),
        context
    });

    // Validate network connectivity
    networkDetection.throwIfOffline('image generation');

    // Validate inputs before attempting generation
    if (!prompt || !prompt.trim()) {
        throw new Error("Please enter a prompt to generate an image.");
    }

    // Validate prompt length for Gemini models
    const MAX_SAFE_PROMPT_LENGTH = 1000; // Conservative limit to avoid API errors
    if (prompt.length > MAX_SAFE_PROMPT_LENGTH && (model.includes('Gemini') || model.includes('Nano Banana'))) {
        console.warn(`[generateVisual] Prompt length (${prompt.length}) exceeds safe limit. This may cause generation failures.`);
        throw new Error(
            `Prompt is too long (${prompt.length} characters). Please shorten it to under ${MAX_SAFE_PROMPT_LENGTH} characters to avoid API errors. ` +
            `Tip: Focus on the most important details and remove unnecessary descriptions.`
        );
    }

    // Validate reference image count for multimodal models
    const MAX_REFERENCE_IMAGES = 8; // Increased to match generateStillVariants
    if (reference_images.length > MAX_REFERENCE_IMAGES && model.includes('Gemini')) {
        console.warn(`[generateVisual] Too many reference images (${reference_images.length}). Maximum is ${MAX_REFERENCE_IMAGES}.`);
        throw new Error(
            `Too many reference images (${reference_images.length}). Gemini supports a maximum of ${MAX_REFERENCE_IMAGES} reference images. ` +
            `Please reduce the number of reference images or try a different model.`
        );
    }

    const canUseGemini = prefersLiveGemini();
    const canUsePollinations = isPollinationsAvailable();

    // Check if this is a Pollinations.AI model (FREE!)
    const isPollinationsModel = model === 'FLUX Schnell' || model === 'FLUX Realism' || model === 'FLUX Anime' || model === 'Stable Diffusion';

    // Check if this is a FAL.AI Flux model (with LoRA support)
    const isFalModel = model === 'FLUX.1.1 Pro (FAL)' || model === 'FLUX.1 Kontext (FAL)' || model === 'FLUX Ultra (FAL)' || model === 'Seadream v4 (FAL)';

    if (isFalModel) {
        // Route to FAL.AI service (paid, high quality)
        if (!isFluxApiAvailable()) {
            onProgress?.(100);
            return { url: getFallbackImageUrl(aspect_ratio, seed), fromFallback: true };
        }

        console.log("[generateVisual] Using FAL.AI for model:", model);

        try {
            const falModel: FluxModelVariant = model === 'FLUX.1.1 Pro (FAL)' ? 'FLUX.1.1 Pro' :
                model === 'FLUX.1 Kontext (FAL)' ? 'FLUX Dev' :
                model === 'FLUX Ultra (FAL)' ? 'FLUX Ultra' :
                model === 'Seadream v4 (FAL)' ? 'FLUX.1.1 Pro' :
                    'FLUX Ultra';

            // Convert aspect ratio to format expected by FAL.AI
            const falAspectRatio = aspect_ratio;

            const imageUrl = await generateImageWithFlux(
                prompt,
                falAspectRatio,
                onProgress,
                true, // raw mode for better quality
                falModel
            );

            console.log("[generateVisual] FAL.AI generation successful:", imageUrl);

            // Upload to Supabase if context is available
            if (context?.projectId && context?.userId) {
                try {
                    // imageUrl is a URL from FAL.AI, download and upload to Supabase
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const base64Data = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const result = reader.result as string;
                            resolve(result.split(',')[1]); // Remove data URL prefix
                        };
                        reader.readAsDataURL(blob);
                    });

                    const fileName = `${model.replace(/\s+/g, '_').replace('.', '_')}_${aspect_ratio}_${seed}`;
                    const { url: uploadedUrl, error } = await uploadImageToSupabase(
                        base64Data,
                        fileName,
                        context.projectId,
                        context.userId,
                        USAGE_ACTIONS.IMAGE_GENERATION,
                        undefined,
                        context.projectId,
                        {
                            model: model,
                            prompt: prompt.substring(0, 200),
                            aspectRatio: aspect_ratio,
                            sceneId: context.sceneId,
                            frameId: context.frameId,
                            seed,
                        }
                    );

                    if (error) {
                        console.warn('[generateVisual] Failed to upload to Supabase:', error);
                        return { url: imageUrl, fromFallback: false };
                    }

                    console.log('[generateVisual] FAL.AI image uploaded to Supabase:', uploadedUrl);
                    return { url: uploadedUrl, fromFallback: false };
                } catch (uploadError) {
                    console.warn('[generateVisual] Supabase upload failed, returning direct URL:', uploadError);
                    return { url: imageUrl, fromFallback: false };
                }
            }

            return { url: imageUrl, fromFallback: false };
        } catch (error) {
            console.error("[generateVisual] FAL.AI generation failed:", error);
            onProgress?.(100);
            return { url: getFallbackImageUrl(aspect_ratio, seed), fromFallback: true };
        }
    }

    if (isPollinationsModel) {
        // Route to Pollinations.AI service (100% FREE!)
        if (!canUsePollinations) {
            onProgress?.(100);
            return { url: getFallbackImageUrl(aspect_ratio, seed), fromFallback: true };
        }

        console.log("[generateVisual] Using Pollinations.AI for model:", model);

        try {
            const pollinationsModel: PollinationsImageModel = model as PollinationsImageModel;
            const imageUrl = await generateImageWithPollinations(
                prompt,
                pollinationsModel,
                aspect_ratio,
                onProgress,
                seed
            );

            // Upload to Supabase if context is available
            if (context?.projectId && context?.userId) {
                try {
                    // imageUrl is already a data URL from Pollinations service
                    const base64Data = imageUrl.split(',')[1];

                    const fileName = `${model.replace(/\s+/g, '_')}_${aspect_ratio}_${seed}`;
                    const { url: uploadedUrl, error } = await uploadImageToSupabase(
                        base64Data,
                        fileName,
                        context.projectId,
                        context.userId,
                        {
                            model: model,
                            prompt: prompt.substring(0, 200),
                            aspectRatio: aspect_ratio,
                            generationType: 'image_generation_pollinations',
                            sceneId: context.sceneId,
                            frameId: context.frameId,
                            provider: 'Pollinations.AI (FREE)'
                        }
                    );

                    if (!error) {
                        return { url: uploadedUrl, fromFallback: false };
                    }
                } catch (uploadError) {
                    console.warn('Failed to upload Pollinations.AI image to Supabase:', uploadError);
                }
            }

            return { url: imageUrl, fromFallback: false };
        } catch (error) {
            console.error('[generateVisual] Pollinations.AI generation failed:', error);
            if (shouldUseFallbackForError(error)) {
                return { url: getFallbackImageUrl(aspect_ratio, seed), fromFallback: true };
            }
            throw error;
        }
    }

    // Normalize model labels for Gemini models
    const normalizedModel = model === 'Gemini Nano Banana' ? 'Gemini Flash Image' : model;

    // Determine temperature based on model for creative variation
    let temperature: number | undefined = undefined;
    if (model === 'Gemini Nano Banana') {
        temperature = 0.7;  // Moderate variation
    }

    // Flux API removed - using free Pollinations for FLUX models instead
    const effectiveModel = normalizedModel;

    if (!canUseGemini) {
        onProgress?.(100);
        return { url: getFallbackImageUrl(aspect_ratio, seed), fromFallback: true };
    }

    console.log("[generateVisual] Model routing", {
        originalModel: model,
        normalizedModel,
        effectiveModel,
        hasReferenceImages: reference_images.length > 0,
        pollinationsAvailable: isPollinationsAvailable()
    });

    try {
        // FLUX API PATH removed - using Pollinations for free FLUX models
        if (false) { // Code path disabled
            console.log("[generateVisual] Using FLUX API via FAL.AI", {
                hasCharacterIdentities: !!characterIdentities && characterIdentities.length > 0,
                identityCount: characterIdentities?.length || 0
            });

            onProgress?.(10);

            // Prepare LoRA parameters from character identities
            const loras = characterIdentities?.map(identity => ({
                path: identity.loraUrl,
                scale: identity.scale ?? 1.0 // Default to full strength
            }));

            const imageUrl = await generateImageWithFlux(
                prompt,
                aspect_ratio,
                onProgress,
                true, // Enable raw mode for more photorealistic results
                fluxVariant,
                loras // Pass character identity LoRAs
            );

            // Log usage for analytics
            if (context?.userId && context?.projectId) {
                await logAIUsage(
                    context.userId,
                    USAGE_ACTIONS.IMAGE_GENERATION,
                    undefined, // Token count not available for FLUX
                    context.projectId,
                    {
                        model: getFluxModelDisplayName(fluxVariant),
                        prompt: prompt.substring(0, 200),
                        aspectRatio: aspect_ratio,
                        hasReferenceImages: false,
                        sceneId: context.sceneId,
                        frameId: context.frameId,
                        provider: 'FAL.AI'
                    }
                );
            }

            // Convert to base64 and upload to Supabase if context is available
            if (context?.projectId && context?.userId) {
                try {
                    // Fetch the image and convert to base64
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();

                    // Convert blob to base64
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const dataUrl = reader.result as string;
                            const base64Data = dataUrl.split(',')[1];
                            resolve(base64Data);
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });

                    const fileName = `flux_${aspect_ratio}_${seed}`;
                    const { url: uploadedUrl, error } = await uploadImageToSupabase(
                        base64,
                        fileName,
                        context.projectId,
                        context.userId,
                        {
                            model: getFluxModelDisplayName(fluxVariant),
                            prompt: prompt.substring(0, 200),
                            aspectRatio: aspect_ratio,
                            generationType: 'image_generation_flux',
                            sceneId: context.sceneId,
                            frameId: context.frameId,
                            provider: 'FAL.AI'
                        }
                    );

                    onProgress?.(100);

                    if (error) {
                        console.warn('Failed to upload FLUX image to Supabase, returning original URL:', error);
                        return { url: imageUrl, fromFallback: false };
                    }

                    return { url: uploadedUrl, fromFallback: false };
                } catch (uploadError) {
                    console.warn('Failed to process FLUX image for upload:', uploadError);
                    onProgress?.(100);
                    return { url: imageUrl, fromFallback: false };
                }
            }

            onProgress?.(100);
            return { url: imageUrl, fromFallback: false };
        }

        // === GEMINI API PATH (Gemini Flash Image for Nano Banana) ===
        const ai = requireGeminiClient();

        onProgress?.(10);
        await new Promise(res => setTimeout(res, 200));
        onProgress?.(30);

        if (effectiveModel === 'Gemini Flash Image') {
            const safetySettings = [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ];

            const imageParts = await Promise.all(
                reference_images.map(async (url) => {
                    const { mimeType, data } = await image_url_to_base64(url);
                    return { inlineData: { mimeType, data } };
                })
            );

            const textPart = { text: prompt };
            // Gemini image editing expects the base imagery before instructions (per Nano Banana docs).
            const parts = imageParts.length > 0 ? [...imageParts, textPart] : [textPart];

            const trimmedAspectRatio = aspect_ratio?.trim();
            const imageConfig = trimmedAspectRatio ? { aspectRatio: trimmedAspectRatio } : undefined;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: [{
                    role: 'user',
                    parts: parts
                }],
                config: {
                    responseModalities: ['IMAGE'],
                    ...(imageConfig ? { imageConfig } : {}),
                    ...(temperature !== undefined ? { temperature } : {})
                },
                safetySettings: safetySettings,
            });

            onProgress?.(100);

            const candidate = response.candidates?.[0];

            // Check for safety blocking first. The API may return a candidate with finishReason 'SAFETY'
            // or a promptFeedback object.
            if (response.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY') {
                const reason = response.promptFeedback?.blockReason || candidate?.finishReason;
                const ratings = candidate?.safetyRatings?.map(r => `${r.category.replace('HARM_CATEGORY_', '')}: ${r.probability}`).join(', ');
                let errorMessage = `Generation blocked for safety. Reason: ${reason}.`;
                if (ratings) {
                    errorMessage += ` Details: [${ratings}].`;
                }
                errorMessage += ' Please rephrase your prompt to be less ambiguous or explicit.';
                throw new Error(errorMessage);
            }

            // Extract image from response
            for (const part of candidate?.content?.parts || []) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageSizeKB = Math.floor((base64ImageBytes.length * 3 / 4) / 1024);
                    console.log("[generateVisual] Image generated successfully", {
                        effectiveModel,
                        imageSizeKB,
                        finishReason: candidate?.finishReason || 'STOP'
                    });

                    // Log usage for analytics
                    if (context?.userId && context?.projectId) {
                        // Estimate tokens for Gemini (rough approximation)
                        const estimatedTokens = Math.floor(prompt.length / 4) + reference_images.length * 1000;
                        await logAIUsage(
                            context.userId,
                            USAGE_ACTIONS.IMAGE_GENERATION,
                            estimatedTokens,
                            context.projectId,
                            {
                                model: effectiveModel,
                                prompt: prompt.substring(0, 200),
                                aspectRatio: aspect_ratio,
                                hasReferenceImages: true,
                                referenceImageCount: reference_images.length,
                                sceneId: context.sceneId,
                                frameId: context.frameId,
                                imageSizeKB: imageSizeKB,
                            }
                        );
                    }

                    onProgress?.(90); // Leave room for upload progress

                    // Upload to Supabase Storage if context is available
                    if (context?.projectId && context?.userId) {
                        const fileName = `${effectiveModel.replace(/\s+/g, '_')}_multimodal_${aspect_ratio}_${seed}`;
                        const { url, error } = await uploadImageToSupabase(
                            base64ImageBytes,
                            fileName,
                            context.projectId,
                            context.userId,
                            {
                                model: effectiveModel,
                                prompt: prompt.substring(0, 200),
                                aspectRatio: aspect_ratio,
                                generationType: 'image_generation_multimodal',
                                hasReferenceImages: true,
                                referenceImageCount: reference_images.length,
                                sceneId: context.sceneId,
                                frameId: context.frameId,
                                imageSizeKB: imageSizeKB,
                            }
                        );

                        onProgress?.(100);
                        if (error) {
                            console.warn('Failed to upload to Supabase, returning base64:', error);
                        }
                        return { url, fromFallback: false };
                    }

                    onProgress?.(100);
                    return { url: `data:image/png;base64,${base64ImageBytes}`, fromFallback: false };
                }
            }

            // Handle specific finish reasons with actionable error messages
            if (candidate?.finishReason) {
                const finishReason = candidate.finishReason;

                if (finishReason === 'NO_IMAGE') {
                    // The model decided not to generate an image
                    throw new Error(
                        'Nano Banana could not generate an image for this prompt. This may happen if: ' +
                        '(1) The prompt is too vague or complex, (2) Reference images are incompatible, or ' +
                        '(3) The request conflicts with model capabilities. Try simplifying your prompt or using different reference images.'
                    );
                }

                if (finishReason === 'IMAGE_OTHER') {
                    // Generic image generation failure
                    throw new Error(
                        'Image generation failed due to model limitations. Try: ' +
                        `(1) Shortening your prompt (keep it under ${MAX_PROMPT_LENGTH} characters), ` +
                        '(2) Using fewer or smaller reference images (under 20MB total for all images), ' +
                        '(3) Being more specific about what you want, or ' +
                        '(4) Removing complex editing instructions.'
                    );
                }

                if (finishReason === 'MAX_TOKENS' || finishReason === 'RECITATION') {
                    throw new Error(
                        `Generation stopped: ${finishReason}. ` +
                        (finishReason === 'MAX_TOKENS'
                            ? 'Prompt may be too long. Try a shorter description.'
                            : 'Content may be too similar to existing copyrighted material. Try a more original prompt.')
                    );
                }

                if (finishReason !== 'STOP') {
                    // Catch-all for other unexpected finish reasons
                    throw new Error(
                        `Generation failed with reason: ${finishReason}. ` +
                        'This may be due to prompt complexity, reference image issues, or API limitations. ' +
                        'Try simplifying your request.'
                    );
                }
            }

            // Generic fallback if no data is returned without a clear reason.
            throw new Error(
                "Nano Banana API returned no image data. This may be due to: " +
                "(1) Content safety filters, (2) Incompatible reference images, or (3) Prompt issues. " +
                "Try rephrasing your prompt or using different reference images."
            );

        } else {
            throw new Error(`The selected model "${effectiveModel}" is not currently supported.`);
        }
    } catch (error) {
        onProgress?.(100);

        // Special handling for safety errors - try Pollinations as fallback (FREE)
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isSafetyError = errorMessage.toLowerCase().includes('safety') ||
            errorMessage.includes('PROHIBITED_CONTENT') ||
            errorMessage.includes('HARM_CATEGORY');

        if (isSafetyError && isPollinationsAvailable() && reference_images.length === 0) {
            console.warn(`[generateVisual] Gemini blocked for safety. Retrying with Pollinations API (FREE) as fallback...`);
            try {
                const pollinationsUrl = await generateImageWithPollinations(
                    prompt,
                    'flux', // Use FLUX Schnell (free)
                    aspect_ratio
                );

                console.log('[generateVisual] Pollinations API fallback successful after Gemini safety block');

                // Log usage for analytics
                if (context?.userId && context?.projectId) {
                    await logAIUsage(
                        context.userId,
                        USAGE_ACTIONS.IMAGE_GENERATION,
                        undefined,
                        context.projectId,
                        {
                            model: 'FLUX Schnell (Pollinations - FREE Fallback)',
                            prompt: prompt.substring(0, 200),
                            aspectRatio: aspect_ratio,
                            wasGeminiFallback: true,
                            originalError: 'PROHIBITED_CONTENT',
                            sceneId: context.sceneId,
                            frameId: context.frameId,
                            provider: 'Pollinations.ai'
                        }
                    );
                }

                return { url: pollinationsUrl, fromFallback: false };
            } catch (pollinationsError) {
                console.error('[generateVisual] Pollinations API fallback also failed:', pollinationsError);
                // Continue to normal error handling below
            }
        }

        if (shouldUseFallbackForError(error)) {
            console.warn(`[API Action] generateVisual fallback triggered for ${effectiveModel}.`);
            return { url: getFallbackImageUrl(aspect_ratio, `${seed}-fallback`), fromFallback: true };
        }
        throw handleApiError(error, effectiveModel);
    }
}

export async function generateMoodboardDescription(section: MoodboardSection): Promise<string> {
    if (!prefersLiveGemini()) {
        return fallbackMoodboardDescription(section);
    }
    console.log("[API Action] generateMoodboardDescription", { notes: section.notes, itemCount: section.items.length });

    try {
        const ai = requireGeminiClient();

        const textPart = {
            text: `You are a professional cinematographer analyzing a moodboard for a film production. Analyze the provided images and extract detailed visual characteristics that will guide image generation.

User notes: "${section.notes || 'No notes provided.'}"

Analyze and extract the following aspects:

1. COLOR PALETTE: Identify dominant colors, color temperature (warm/cool), saturation levels, and color relationships (complementary, analogous, monochromatic)

2. LIGHTING: Describe lighting direction (front/side/back), quality (soft/hard shadows), color temperature (golden hour/blue hour/neutral), contrast ratio, and mood created by lighting

3. COMPOSITION: Note framing techniques (rule of thirds, symmetry, leading lines), depth of field, perspective (eye-level/high/low angle), and spatial relationships

4. TEXTURE & MATERIALS: Identify surface qualities (smooth/rough/glossy/matte), material properties (metal/fabric/organic), and tactile atmosphere

5. MOOD & ATMOSPHERE: Capture emotional tone, energy level (calm/dynamic), time period feel, and psychological impact

6. VISUAL STYLE: Identify artistic influences, era/period aesthetic, cultural references, and genre conventions

Synthesize these observations into a rich, descriptive paragraph (3-5 sentences) that captures the overall visual language. Focus on concrete details that image generation models can interpret. Be specific about colors, lighting qualities, and compositional elements.

Example output: "A gritty, rain-slicked neo-noir aesthetic featuring high-contrast chiaroscuro lighting with deep blacks and cool cyan highlights. The desaturated color palette emphasizes slate blues and amber streetlight warmth, creating urban decay atmosphere. Compositions favor Dutch angles and asymmetric framing with shallow depth of field, pulling focus to weathered textures and reflective surfaces. The overall mood evokes mystery and isolation through dimly lit, claustrophobic spaces with sharp rim lighting defining silhouettes."`};

        const imageParts = await Promise.all(
            section.items
                .filter(item => item.type === 'image')
                .slice(0, 8) // Increased to 8 images for comprehensive analysis
                .map(async (item) => {
                    const { mimeType, data } = await image_url_to_base64(item.url);
                    return { inlineData: { mimeType, data } };
                })
        );

        const contents = [
            {
                role: 'user',
                parts: [textPart, ...imageParts]
            }
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
        });

        return response.text;
    } catch (error) {
        if (shouldUseFallbackForError(error)) {
            console.warn('[API Action] generateMoodboardDescription using fallback content.');
            return fallbackMoodboardDescription(section);
        }
        throw handleApiError(error, 'Gemini');
    }
}

type DirectorConversationMessage = { author: 'user' | 'director'; text: string };

function sanitizeConversationHistory(history: DirectorConversationMessage[]): DirectorConversationMessage[] {
    return history
        .filter((entry) => entry && typeof entry.text === 'string' && entry.text.trim().length > 0)
        .slice(-8);
}

function buildConversationContents(history: DirectorConversationMessage[]) {
    return history.map((entry) => ({
        role: entry.author === 'user' ? 'user' : 'model',
        parts: [{ text: entry.text.trim() }]
    }));
}

async function extractCandidateText(response: any): Promise<string> {
    if (!response) return '';

    const candidates = response.candidates ?? [];
    for (const candidate of candidates) {
        const parts = candidate?.content?.parts;
        if (Array.isArray(parts)) {
            const text = parts
                .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
                .join('')
                .trim();
            if (text.length > 0) {
                return text;
            }
        }
    }

    const resText = typeof response.text === 'function' ? await response.text() : response.text;
    if (typeof resText === 'string' && resText.trim().length > 0) {
        return resText.trim();
    }

    return '';
}

export async function askTheDirector(
    analysis: ScriptAnalysis,
    query: string,
    history: DirectorConversationMessage[] = []
): Promise<string> {
    if (!prefersLiveGemini()) {
        return fallbackDirectorResponse(analysis, query);
    }
    console.log("[API Action] askTheDirector", { query });

    try {
        const ai = requireGeminiClient();

        // Use the enhanced system instructions from the knowledge base
        const baseSystemInstruction = ENHANCED_DIRECTOR_KNOWLEDGE.systemInstructions;
        const sanitizedHistory = sanitizeConversationHistory(history);
        const conversationContents = buildConversationContents(sanitizedHistory);

        // Check if query needs technical calculations
        let technicalContext = '';
        const queryLower = query.toLowerCase();

        // Add technical context if query involves specific technical aspects
        if (queryLower.includes('lens') || queryLower.includes('focal')) {
            technicalContext += '\n\nYou have access to comprehensive lens data including focal lengths from 8mm to 800mm with their characteristics.';
        }
        if (queryLower.includes('depth of field') || queryLower.includes('dof')) {
            technicalContext += '\n\nYou can calculate precise depth of field using hyperfocal distance formulas.';
        }
        if (queryLower.includes('lighting') || queryLower.includes('light')) {
            technicalContext += '\n\nYou have knowledge of three-point lighting, Rembrandt, high-key, low-key setups with specific ratios.';
        }
        if (queryLower.includes('color') || queryLower.includes('grade') || queryLower.includes('lut')) {
            technicalContext += '\n\nYou understand color grading including LUTs, color temperature (1800K-10000K), and genre-specific looks.';
        }
        if (queryLower.includes('movement') || queryLower.includes('dolly') || queryLower.includes('tracking')) {
            technicalContext += '\n\nYou know all camera movements: pan, tilt, dolly, tracking, crane, Steadicam, gimbal with specific speeds and techniques.';
        }

        const projectContext = `PROJECT CONTEXT:
Title: ${analysis.title}
Logline: ${analysis.logline}
Summary: ${analysis.summary}
Characters: ${analysis.characters.map(c => `${c.name}: ${c.description}`).join('\n')}
Locations: ${analysis.locations.map(l => `${l.name}: ${l.description}`).join('\n')}
Scenes Summary:
${analysis.scenes.map(s => `Scene ${s.sceneNumber} (${s.setting}): ${s.summary} | Mood: ${s.mood || 'Not specified'} | Time: ${s.time_of_day || 'Not specified'}`).join('\n')}

MOODBOARD VISUAL LANGUAGE:
${analysis.moodboardTemplates && analysis.moodboardTemplates.length > 0
                ? analysis.moodboardTemplates
                    .filter(board => board.aiSummary || board.description)
                    .map(board => `${board.title}: ${board.aiSummary || board.description || 'Visual references collected'}`)
                    .join('\n')
                : analysis.moodboard
                    ? `Cinematography: ${analysis.moodboard.cinematography.aiDescription || analysis.moodboard.cinematography.notes || 'Not defined.'}\nColor: ${analysis.moodboard.color.aiDescription || analysis.moodboard.color.notes || 'Not defined.'}\nStyle: ${analysis.moodboard.style.aiDescription || analysis.moodboard.style.notes || 'Not defined.'}`
                    : 'No moodboard defined yet.'}

TECHNICAL KNOWLEDGE AVAILABLE:${technicalContext || '\nFull cinematography database including lenses, lighting, movement, composition, and color grading.'}`;

        const dynamicSystemInstruction = `${baseSystemInstruction}

${projectContext}

Remember to stay concise (2-4 sentences or tight bullet points) and redirect casual conversation back to cinematography expertise.`;

        const contents = [
            {
                role: 'user',
                parts: [{ text: `Use the provided production context to answer as the Director of Photography.` }]
            },
            ...conversationContents
        ];

        if (!conversationContents.some(content => content.role === 'user')) {
            contents.push({ role: 'user', parts: [{ text: query }] });
        }

        const requestConfig = {
            systemInstruction: { role: 'system', parts: [{ text: dynamicSystemInstruction }] },
            temperature: 0.6,
            topP: 0.9,
            maxOutputTokens: 512,
            responseMimeType: 'text/plain',
        } as const;

        const resolvedAttempts = await buildModelAttemptList(ai, GEMINI_PRO_MODEL_CANDIDATES);
        const modelAttempts = resolvedAttempts.length > 0
            ? resolvedAttempts
            : GEMINI_PRO_MODEL_CANDIDATES.flatMap(expandModelIdVariants);
        let availabilityError: unknown = null;

        for (const modelId of modelAttempts) {
            try {
                const response = await ai.models.generateContent({
                    model: modelId,
                    contents,
                    config: requestConfig,
                });

                const finalText = await extractCandidateText(response);

                if (!finalText) {
                    console.warn(`[API Action] askTheDirector received empty response from ${modelId}, trying next candidate.`);
                    continue;
                }

                if (modelId !== modelAttempts[0]) {
                    console.info(`[API Action] askTheDirector using fallback Gemini model ${modelId}.`);
                }

                return finalText;
            } catch (error) {
                if (isModelNotFoundError(error)) {
                    console.warn(`[API Action] askTheDirector model ${modelId} unavailable.`, error);
                    availabilityError = error;
                    continue;
                }
                throw handleApiError(error, `Gemini (${modelId})`);
            }
        }

        if (availabilityError) {
            console.warn('[API Action] askTheDirector no preferred Gemini models available, returning fallback response.');
            return fallbackDirectorResponse(analysis, query);
        }

        throw new Error('The director returned an empty response.');
    } catch (error) {
        if (shouldUseFallbackForError(error)) {
            console.warn('[API Action] askTheDirector returning fallback response.');
            return fallbackDirectorResponse(analysis, query);
        }
        throw handleApiError(error, 'Gemini (Director)');
    }
}


// --- Existing AI Services adapted for new spec ---

export async function analyzeScript(
    scriptContent: string,
    onProgress?: (message: string) => void,
    context?: { projectId?: string; userId?: string }
): Promise<ScriptAnalysis> {
    if (!prefersLiveGemini()) {
        console.warn('[API Action] analyzeScript using fallback parser because live service is unavailable.');
        return fallbackScriptAnalysis(scriptContent);
    }
    console.log("Analyzing script with Gemini API...");
    try {
        const ai = requireGeminiClient();
        const analysisSchema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                logline: { type: Type.STRING },
                summary: { type: Type.STRING },
                scenes: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            setting: { type: Type.STRING },
                            summary: { type: Type.STRING },
                            time_of_day: { type: Type.STRING },
                            mood: { type: Type.STRING },
                            lighting: { type: Type.STRING },
                        },
                        required: ["id", "setting", "summary", "time_of_day", "mood", "lighting"],
                    },
                },
                characters: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                        required: ["id", "name", "description"],
                    },
                },
                locations: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                        required: ["id", "name", "description"],
                    },
                },
                props: { type: Type.ARRAY, items: { type: Type.STRING } },
                styling: { type: Type.ARRAY, items: { type: Type.STRING } },
                setDressing: { type: Type.ARRAY, items: { type: Type.STRING } },
                makeupAndHair: { type: Type.ARRAY, items: { type: Type.STRING } },
                sound: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["title", "logline", "summary", "scenes", "characters", "locations", "props", "styling", "setDressing", "makeupAndHair", "sound"],
        };
        const prompt = `You are a professional screenplay analyst.Analyze the following screenplay and provide the output in the requested JSON format. Generate a unique, short, URL-friendly string ID (e.g., "scene-1", "character-elena") for each scene, character, and location. Here is the script:\n\n${scriptContent}`;

        onProgress?.('Analyzing script structure...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        // Add scene numbers for easier reference, as AI might not generate them sequentially.
        const scenesWithNumbers = result.scenes.map((scene: AnalyzedScene, index: number) => ({
            ...scene,
            sceneNumber: index + 1,
        }));

        onProgress?.('Script analyzed. Generating initial shot lists in parallel...');

        // OPTIMIZATION: Generate frames for each scene in parallel to reduce total analysis time.
        const frameGenerationPromises = scenesWithNumbers.map(scene => {
            onProgress?.(`Generating shots for Scene ${scene.sceneNumber}: ${scene.setting}...`);
            return generateFramesForScene(scene)
                .then(frames => ({
                    ...scene, // Carry over original scene data
                    frames: frames.map(frame => ({
                        ...frame,
                        id: `${scene.id}-frame-${frame.shot_number}-${Date.now()}`,
                        status: FrameStatus.Draft,
                    }))
                }))
                .catch(frameError => {
                    console.warn(`Could not generate frames for Scene ${scene.sceneNumber}:`, frameError);
                    return {
                        ...scene,
                        frames: [] // Ensure frames array exists even on error
                    };
                });
        });

        const scenesWithFrames = await Promise.all(frameGenerationPromises);
        onProgress?.('Shot generation complete.');

        // Log usage for analytics
        if (context?.userId && context?.projectId) {
            // Estimate tokens based on script length and generated frames
            const estimatedTokens = Math.floor(scriptContent.length / 4) + (scenesWithFrames.length * 500);
            await logAIUsage(
                context.userId,
                USAGE_ACTIONS.SCRIPT_ANALYSIS,
                estimatedTokens,
                context.projectId,
                {
                    scriptLength: scriptContent.length,
                    sceneCount: scenesWithFrames.length,
                    totalFrames: scenesWithFrames.reduce((sum, scene) => sum + (scene.frames?.length || 0), 0),
                }
            );
        }

        return { ...result, scenes: scenesWithFrames, moodboardTemplates: result.moodboardTemplates ?? [] };
    } catch (error) {
        if (shouldUseFallbackForError(error)) {
            console.warn('[API Action] analyzeScript falling back to heuristic parser due to API failure.');
            return fallbackScriptAnalysis(scriptContent);
        }
        throw handleApiError(error, 'Gemini (Analysis)');
    }
}

export async function generateFramesForScene(scene: AnalyzedScene, directorialNotes?: string): Promise<Partial<Frame>[]> {
    if (!prefersLiveGemini()) {
        console.warn('[API Action] generateFramesForScene using fallback frame templates.');
        return [
            {
                shot_number: 1,
                description: `Fallback establishing shot for ${scene.setting}. Focus on the key emotion: ${scene.mood || 'unspecified mood'}.`,
                type: 'Wide Shot',
                camera_package: {
                    lens_mm: 35,
                    aperture: 'f/2.8',
                    iso: 800,
                    height: 'Eye Level',
                    angle: 'Straight On',
                    movement: 'Slow Push In'
                }
            }
        ];
    }
    console.log(`[API Action] Generating frames for Scene ${scene.sceneNumber} with notes: ${directorialNotes || 'None'}`);

    try {
        const ai = requireGeminiClient();

        const frameSchema = {
            type: Type.OBJECT,
            properties: {
                shot_number: { type: Type.INTEGER },
                description: { type: Type.STRING },
                type: { type: Type.STRING },
                duration: { type: Type.INTEGER },
                camera_package: {
                    type: Type.OBJECT,
                    properties: {
                        lens_mm: { type: Type.INTEGER },
                        aperture: { type: Type.STRING },
                        iso: { type: Type.INTEGER },
                        height: { type: Type.STRING },
                        angle: { type: Type.STRING },
                        movement: { type: Type.STRING },
                    },
                    required: ["lens_mm", "aperture", "iso", "height", "angle", "movement"],
                },
                lighting_tweak: { type: Type.STRING },
                framing: { type: Type.STRING },
                composition_rules: { type: Type.STRING },
                negative: { type: Type.STRING },
                audio_note: { type: Type.STRING },
                cast_names: { type: Type.ARRAY, items: { type: Type.STRING } },
                location_name: { type: Type.STRING },
            },
            required: ["shot_number", "description", "type", "camera_package"],
        };

        let prompt = `You are an expert Director of Photography for a major film studio. Your task is to create a detailed shot list for the following scene. Generate between 3 and 5 distinct shots that visually tell the story described in the summary. Each shot must have a detailed description and specific technical camera settings.

        **Scene Information:**
        - **Scene ${scene.sceneNumber}: ${scene.setting}**
        - Time of Day: ${scene.time_of_day}
        - Mood: ${scene.mood}
        - Lighting: ${scene.lighting}
        - Summary: ${scene.summary}`;

        if (directorialNotes) {
            prompt += `\n\n**IMPORTANT DIRECTOR'S NOTES (Prioritize these):**\n- ${directorialNotes}`;
        }

        // Wrap API call in retry logic to handle 503 errors
        const response = await retryWithBackoff(
            async () => {
                return await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                frames: {
                                    type: Type.ARRAY,
                                    items: frameSchema,
                                }
                            },
                            required: ["frames"],
                        },
                    }
                });
            },
            3, // max retries
            2000, // base delay (2 seconds)
            `Gemini Frame Generation (Scene ${scene.sceneNumber})`
        );

        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.frames || [];

    } catch (error) {
        throw handleApiError(error, 'Gemini (Frames)');
    }
}

/**
 * Analyze a video using Gemini AI to generate a descriptive prompt
 * @param videoUrl - URL of the video to analyze
 * @returns AI-generated description of the video content
 */
export async function analyzeVideoWithGemini(videoUrl: string): Promise<string> {
    console.log('[AI Service] Analyzing video:', videoUrl);

    try {
        // Use the requireGeminiClient helper which properly validates API key
        const genai = requireGeminiClient();

        // Fetch video as blob for Gemini API
        const videoResponse = await fetch(videoUrl);
        const videoBlob = await videoResponse.blob();
        const videoBase64 = await blobToBase64(videoBlob);

        const prompt = `Analyze this video clip and provide a detailed cinematographic description. Focus on:
- Camera movement and framing
- Subject/action in the scene
- Lighting and mood
- Any notable visual elements or composition

Provide a concise 2-3 sentence description suitable as a video prompt.`;

        const result = await genai.models.generateContent({
            model: 'gemini-2.5-flash-002',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: videoBlob.type || 'video/mp4',
                                data: videoBase64.split(',')[1] // Remove data:video/mp4;base64, prefix
                            }
                        }
                    ]
                }
            ]
        });

        const analysis = result.response.text();
        console.log('[AI Service] Video analysis complete:', analysis);

        // Note: Usage logging skipped as userId is not available in this context
        // TODO: Consider passing userId as parameter if usage tracking needed

        return analysis;

    } catch (error) {
        console.error('[AI Service] Video analysis failed:', error);

        // Note: Error logging skipped as userId is not available

        // Return fallback description instead of throwing
        return 'Video analysis unavailable. Please add a manual description.';
    }
}

// Helper function to convert blob to base64
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
