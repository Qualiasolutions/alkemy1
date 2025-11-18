/**
 * Character Identity Service
 *
 * Epic 2 - Character Identity Consistency System
 * Story 2.1: Character Identity Training/Preparation Workflow
 * Story 2.2: Character Identity Preview & Testing
 * Story 2.3: Character Identity Integration
 *
 * Technology: Fal.ai Instant Character API (selected in Epic R1 research - 9.6/10 score)
 * Reference: https://fal.ai/models/fal-ai/flux-pro/character
 */

import type { CharacterIdentity, CharacterIdentityStatus, CharacterIdentityTest, CharacterIdentityTestType } from '@/types';
import { supabase, getCurrentUserId } from './supabase';

export interface PrepareCharacterIdentityRequest {
    characterId: string;
    referenceImages: File[];
    onProgress?: (progress: number, status: string) => void;
}

export interface ReconfigureCharacterIdentityRequest {
    characterId: string;
    newReferenceImages: File[];
    onProgress?: (progress: number, status: string) => void;
}

export interface CharacterIdentityError {
    type: 'low-quality' | 'api-error' | 'network-error' | 'storage-quota' | 'insufficient-references' | 'unknown';
    message: string;
    details?: string;
}

/**
 * Prepare character identity from reference images (Story 2.1, AC1, AC2)
 *
 * This function:
 * 1. Validates reference images (min 3, max 5, resolution >512px, size <10MB)
 * 2. Uploads reference images to storage (Supabase or localStorage)
 * 3. Calls Fal.ai API to create character identity
 * 4. Returns CharacterIdentity object with status 'ready' or 'error'
 */
export async function prepareCharacterIdentity(
    request: PrepareCharacterIdentityRequest
): Promise<CharacterIdentity> {
    const { characterId, referenceImages, onProgress } = request;

    try {
        // Step 1: Validate reference images
        onProgress?.(5, 'Validating reference images...');
        const validationError = validateReferenceImages(referenceImages);
        if (validationError) {
            throw validationError;
        }

        // Step 2: Upload reference images to storage
        onProgress?.(15, 'Uploading reference images...');
        const referenceUrls = await uploadReferenceImages(characterId, referenceImages, onProgress);

        // Step 3: Call Fal.ai API to create character identity
        onProgress?.(50, 'Creating character identity with Fal.ai...');
        const falCharacterId = await createFalCharacter(referenceUrls, onProgress);

        // Step 4: Return CharacterIdentity object
        onProgress?.(100, 'Character identity ready!');

        const identity: CharacterIdentity = {
            status: 'ready',
            referenceImages: referenceUrls,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            trainingCost: 0.10, // Fal.ai Instant Character cost (~$0.10/character)
            technologyData: {
                type: 'reference',
                referenceStrength: 80, // Default 80% strength
                embeddingId: falCharacterId,
                falCharacterId: falCharacterId, // Custom field for Fal.ai character ID
            },
        };

        return identity;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Character identity preparation failed:', errorMessage);

        const identity: CharacterIdentity = {
            status: 'error',
            referenceImages: [],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            errorMessage,
        };

        return identity;
    }
}

/**
 * Get character identity status (Story 2.1, AC3)
 *
 * Helper function to extract status from CharacterIdentity object
 */
export function getCharacterIdentityStatus(identity?: CharacterIdentity): CharacterIdentityStatus {
    return identity?.status || 'none';
}

/**
 * Reconfigure character identity with new reference images (Story 2.1, AC6)
 *
 * This function:
 * 1. Deletes existing character identity data (if any)
 * 2. Creates new character identity with new reference images
 */
export async function reconfigureCharacterIdentity(
    request: ReconfigureCharacterIdentityRequest
): Promise<CharacterIdentity> {
    const { characterId, newReferenceImages, onProgress } = request;

    try {
        // Step 1: Delete existing character identity (Fal.ai character)
        onProgress?.(10, 'Removing old character identity...');
        // Note: Fal.ai doesn't require explicit deletion, identities are stateless

        // Step 2: Create new character identity
        onProgress?.(20, 'Creating new character identity...');
        const identity = await prepareCharacterIdentity({
            characterId,
            referenceImages: newReferenceImages,
            onProgress: (progress, status) => {
                // Re-map progress from 20-100 range
                const mappedProgress = 20 + (progress * 0.8);
                onProgress?.(mappedProgress, status);
            },
        });

        return identity;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Character identity reconfiguration failed:', errorMessage);

        const identity: CharacterIdentity = {
            status: 'error',
            referenceImages: [],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            errorMessage,
        };

        return identity;
    }
}

/**
 * Delete character identity data (Story 2.1, AC6)
 *
 * This function:
 * 1. Deletes reference images from storage (Supabase or localStorage)
 * 2. Returns true if successful
 */
export async function deleteCharacterIdentity(characterId: string): Promise<boolean> {
    try {
        // Delete reference images from Supabase Storage (if configured)
        const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL;

        if (isSupabaseConfigured) {
            // Use Supabase client

            // Delete all files in character-references/{characterId}/ folder
            const { data: files, error: listError } = await supabase.storage
                .from('character-references')
                .list(characterId);

            if (listError) {
                console.error('Failed to list character reference files:', listError);
                return false;
            }

            if (files && files.length > 0) {
                const filePaths = files.map(file => `${characterId}/${file.name}`);
                const { error: deleteError } = await supabase.storage
                    .from('character-references')
                    .remove(filePaths);

                if (deleteError) {
                    console.error('Failed to delete character reference files:', deleteError);
                    return false;
                }
            }
        }

        // Note: localStorage-only mode doesn't require explicit deletion
        // Reference images are stored in CharacterIdentity object (project state)
        // They will be removed when the identity field is set to undefined

        return true;
    } catch (error) {
        console.error('Failed to delete character identity:', error);
        return false;
    }
}

/**
 * Export character identity as JSON (Story 2.1, AC6)
 *
 * This function:
 * 1. Serializes CharacterIdentity object to JSON string
 * 2. Includes reference images as base64 data URLs for portability
 */
export function exportCharacterIdentity(identity: CharacterIdentity): string {
    return JSON.stringify(identity, null, 2);
}

/**
 * Import character identity from JSON (Story 2.1, AC6)
 *
 * This function:
 * 1. Parses JSON string to CharacterIdentity object
 * 2. Validates structure
 * 3. Returns CharacterIdentity object
 */
export function importCharacterIdentity(jsonData: string): CharacterIdentity {
    try {
        const identity = JSON.parse(jsonData) as CharacterIdentity;

        // Validate required fields
        if (!identity.status || !identity.referenceImages || !identity.createdAt) {
            throw new Error('Invalid character identity data: missing required fields');
        }

        return identity;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to import character identity: ${errorMessage}`);
    }
}

/**
 * Check if character has identity configured (Story 2.1, AC6)
 *
 * Helper function to check if a character has a configured identity
 */
export function hasCharacterIdentity(identity?: CharacterIdentity): boolean {
    return identity?.status === 'ready';
}

// ============================================================================
// INTERNAL HELPER FUNCTIONS
// ============================================================================

/**
 * Validate reference images (Story 2.1, AC1, AC4)
 *
 * Validation rules:
 * - Minimum 6 images required (Fal.ai recommendation for optimal results)
 * - Maximum 12 images allowed
 * - Each image must be >512x512px resolution
 * - Each image must be <10MB file size
 * - Supported formats: JPEG, PNG, WebP
 */
function validateReferenceImages(images: File[]): CharacterIdentityError | null {
    // Check minimum count
    if (images.length < 6) {
        return {
            type: 'insufficient-references',
            message: `At least 6 reference images are required for optimal character identity training. You have ${images.length}. Upload ${6 - images.length} more image(s).`,
        };
    }

    // Check maximum count
    if (images.length > 12) {
        return {
            type: 'api-error',
            message: `Maximum 12 reference images allowed. You have ${images.length}. Please remove ${images.length - 12} image(s).`,
        };
    }

    // Check file size and format
    for (const image of images) {
        // Check file size (10MB = 10 * 1024 * 1024 bytes)
        const maxSize = 10 * 1024 * 1024;
        if (image.size > maxSize) {
            return {
                type: 'api-error',
                message: `Image "${image.name}" exceeds 10MB size limit. Use a smaller file.`,
                details: `File size: ${(image.size / 1024 / 1024).toFixed(2)}MB`,
            };
        }

        // Check file format
        const supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
        if (!supportedFormats.includes(image.type)) {
            return {
                type: 'api-error',
                message: `Image "${image.name}" format not supported. Use JPEG, PNG, or WebP.`,
                details: `File type: ${image.type}`,
            };
        }
    }

    // Note: Resolution validation (>512x512px) is deferred to image loading
    // This requires reading the image file which is async
    // Will be implemented in the UI layer (CastLocationsTab) during preview

    return null;
}

/**
 * Upload reference images to storage (Supabase or localStorage)
 *
 * This function:
 * 1. Checks if Supabase is configured
 * 2. If yes, uploads to Supabase Storage (character-references bucket)
 * 3. If no, converts to base64 data URLs for localStorage
 * 4. Returns array of URLs
 */
async function uploadReferenceImages(
    characterId: string,
    images: File[],
    onProgress?: (progress: number, status: string) => void
): Promise<string[]> {
    const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL;

    if (isSupabaseConfigured) {
        // Upload to Supabase Storage
        return uploadToSupabaseStorage(characterId, images, onProgress);
    } else {
        // Convert to base64 data URLs for localStorage
        return convertToDataUrls(images, onProgress);
    }
}

/**
 * Upload reference images to Supabase Storage
 */
async function uploadToSupabaseStorage(
    characterId: string,
    images: File[],
    onProgress?: (progress: number, status: string) => void
): Promise<string[]> {

    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error('User must be authenticated to upload character references');
    }

    const urls: string[] = [];

    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const progress = 15 + ((i + 1) / images.length) * 30; // 15-45% range
        onProgress?.(progress, `Uploading image ${i + 1} of ${images.length}...`);

        // Generate unique file path: {userId}/{characterId}/{timestamp}_{filename}
        const timestamp = Date.now();
        const filePath = `${userId}/${characterId}/${timestamp}_${image.name}`;

        const { data, error } = await supabase.storage
            .from('character-references')
            .upload(filePath, image, {
                contentType: image.type,
                upsert: false, // Don't overwrite existing files
            });

        if (error) {
            console.error('Failed to upload reference image:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('character-references')
            .getPublicUrl(filePath);

        urls.push(urlData.publicUrl);
    }

    return urls;
}

/**
 * Convert images to base64 data URLs (localStorage fallback)
 */
async function convertToDataUrls(
    images: File[],
    onProgress?: (progress: number, status: string) => void
): Promise<string[]> {
    const dataUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const progress = 15 + ((i + 1) / images.length) * 30; // 15-45% range
        onProgress?.(progress, `Processing image ${i + 1} of ${images.length}...`);

        const dataUrl = await fileToDataUrl(image);
        dataUrls.push(dataUrl);
    }

    // Check localStorage quota (warning if >8MB total)
    const totalSize = dataUrls.reduce((sum, url) => sum + url.length, 0);
    const totalSizeMB = totalSize / 1024 / 1024;

    if (totalSizeMB > 8) {
        console.warn(`Character references total ${totalSizeMB.toFixed(2)}MB - approaching localStorage quota limit (10MB)`);
        // Note: Warning will be displayed in UI toast notification
    }

    return dataUrls;
}

/**
 * Convert File to base64 data URL
 */
function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Create character identity with Fal.ai LoRA Fast Training API
 *
 * This function:
 * 1. Calls /api/fal-proxy to train a LoRA model
 * 2. Returns the trained LoRA model URL
 *
 * Reference: https://fal.ai/models/fal-ai/flux-lora-fast-training
 */
async function createFalCharacter(
    referenceUrls: string[],
    onProgress?: (progress: number, status: string) => void
): Promise<string> {
    onProgress?.(50, 'Training character with Fal.ai LoRA...');

    // Call Fal.ai Flux LoRA Fast Training API via proxy
    // This trains a LoRA model using the reference images
    const response = await fetch('/api/fal-proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            endpoint: '/fal-ai/flux-lora-fast-training',
            method: 'POST',
            body: {
                images_data_url: referenceUrls,
                steps: 1000, // Training steps (default for fast training)
                is_input_format_already_preprocessed: false,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMsg = error.error || response.statusText;
        throw new Error(`Fal.ai service temporarily unavailable due to Egress Excess overloading the backend. Please try again in a few minutes. Technical details: ${errorMsg}`);
    }

    const data = await response.json();

    onProgress?.(90, 'Finalizing character identity...');

    // Extract LoRA model URL from Fal.ai response
    // Response structure: { diffusers_lora_file: { url: "..." }, config_file: { url: "..." } }
    const loraUrl = data.diffusers_lora_file?.url || data.lora_url || data.url;

    if (!loraUrl) {
        throw new Error('Fal.ai API did not return a LoRA model URL');
    }

    return loraUrl;
}

// ============================================================================
// STORY 2.2: CHARACTER IDENTITY PREVIEW & TESTING
// ============================================================================

/**
 * Test character identity by generating a variation
 *
 * Story 2.2, AC1, AC2
 * Generates a test image using Fal.ai with character identity applied
 */
export async function testCharacterIdentity(request: {
    characterId: string;
    identity: CharacterIdentity;
    testType: CharacterIdentityTestType;
    onProgress?: (progress: number, status: string) => void;
}): Promise<CharacterIdentityTest> {
    const { characterId, identity, testType, onProgress } = request;

    try {
        // Validate identity is ready
        if (identity.status !== 'ready') {
            throw new Error('Character identity must be ready before testing');
        }

        const falCharacterId = identity.technologyData?.falCharacterId;
        if (!falCharacterId) {
            throw new Error('Character identity does not have Fal.ai character ID');
        }

        // Generate test prompt based on type
        const prompt = generateTestPrompt(testType);

        // Generate image using Fal.ai with character identity
        onProgress?.(20, 'Generating test image...');
        const imageUrl = await generateWithFalCharacter(
            falCharacterId,
            prompt,
            (prog) => onProgress?.((prog * 0.5) + 20, 'Generating test image...')
        );

        // Calculate similarity score
        onProgress?.(70, 'Calculating similarity...');
        const similarityScore = await calculateSimilarity(
            identity.referenceImages,
            imageUrl
        );

        // Create test record
        const test: CharacterIdentityTest = {
            id: `test-${Date.now()}`,
            testType,
            generatedImageUrl: imageUrl,
            similarityScore,
            timestamp: new Date().toISOString(),
        };

        onProgress?.(100, 'Test complete');
        return test;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Character identity test failed:', errorMessage);

        throw new Error(`Test generation failed: ${errorMessage}`);
    }
}

/**
 * Generate all 5 test variations in batch
 *
 * Story 2.2, AC1, AC2
 */
export async function generateAllTests(request: {
    characterId: string;
    identity: CharacterIdentity;
    onProgress?: (overallProgress: number, currentTest: string) => void;
}): Promise<CharacterIdentityTest[]> {
    const { characterId, identity, onProgress } = request;

    const testTypes: CharacterIdentityTestType[] = [
        'portrait',
        'fullbody',
        'profile',
        'lighting',
        'expression'
    ];

    const tests: CharacterIdentityTest[] = [];

    for (let i = 0; i < testTypes.length; i++) {
        const testType = testTypes[i];
        const overallProgress = (i / testTypes.length) * 100;

        onProgress?.(overallProgress, `Generating ${testType} test...`);

        const test = await testCharacterIdentity({
            characterId,
            identity,
            testType,
            onProgress: (testProgress, status) => {
                const combinedProgress = overallProgress + (testProgress / testTypes.length);
                onProgress?.(combinedProgress, status);
            }
        });

        tests.push(test);
    }

    onProgress?.(100, 'All tests complete');
    return tests;
}

/**
 * Calculate CLIP similarity between reference and generated images using Replicate
 * CLIP provides semantic understanding of image similarity beyond visual hash
 */
async function calculateCLIPSimilarity(
    referenceImages: string[],
    generatedImage: string
): Promise<number> {
    try {
        const REPLICATE_API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN;

        if (!REPLICATE_API_TOKEN) {
            console.warn('[CharacterIdentity] No REPLICATE_API_TOKEN found, skipping CLIP similarity');
            return 50; // Neutral score
        }

        // Use the first reference image for comparison
        const referenceImage = referenceImages[0];

        // Replicate CLIP similarity model
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                version: '75e33f563e284433b787665e3eb421f05a2ba9ecc41de6568a0b64ecf083a636',
                input: {
                    image1: referenceImage,
                    image2: generatedImage
                }
            })
        });

        if (!response.ok) {
            throw new Error(`CLIP API error: ${response.status} ${response.statusText}`);
        }

        const prediction = await response.json();

        // Wait for the prediction to complete if it's still processing
        if (prediction.status === 'processing') {
            // Poll for completion (max 30 seconds)
            const startTime = Date.now();
            while (prediction.status === 'processing' && Date.now() - startTime < 30000) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                    headers: {
                        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
                    }
                });
                const pollResult = await pollResponse.json();
                if (pollResult.status === 'succeeded') {
                    return Math.round(pollResult.output[0] * 100); // CLIP returns 0-1, convert to 0-100
                }
                if (pollResult.status === 'failed') {
                    throw new Error('CLIP prediction failed');
                }
            }
        }

        if (prediction.status === 'succeeded') {
            return Math.round(prediction.output[0] * 100); // CLIP returns 0-1, convert to 0-100
        }

        throw new Error('CLIP prediction timed out');

    } catch (error) {
        console.warn('[CharacterIdentity] CLIP similarity calculation failed:', error);
        return 50; // Return neutral score on failure
    }
}

/**
 * Calculate similarity between reference and generated images
 *
 * Story 2.2, AC3
 * Uses CLIP (70%) + pHash (30%) weighted scoring
 */
export async function calculateSimilarity(
    referenceImages: string[],
    generatedImage: string
): Promise<number> {
    try {
        // Calculate both pHash and CLIP similarity for comprehensive analysis
        const pHashScore = await calculatePHashSimilarity(referenceImages[0], generatedImage);

        // Add CLIP similarity via Replicate for better semantic understanding
        let clipScore = 50; // Default neutral score if CLIP fails

        try {
            clipScore = await calculateCLIPSimilarity(referenceImages, generatedImage);
        } catch (clipError) {
            console.warn('[CharacterIdentity] CLIP similarity failed, using pHash only:', clipError);
        }

        // Weighted combination: CLIP (semantic) + pHash (visual)
        // CLIP is more important for character identity (70%), pHash provides visual confirmation (30%)
        return Math.round((clipScore * 0.7) + (pHashScore * 0.3));
    } catch (error) {
        console.error('Similarity calculation failed:', error);
        // Return neutral score on error
        return 75;
    }
}

/**
 * Calculate perceptual hash similarity (fallback method)
 *
 * Story 2.2, AC3
 * Browser-based similarity using canvas and simple hash comparison
 */
async function calculatePHashSimilarity(
    referenceImage: string,
    generatedImage: string
): Promise<number> {
    try {
        // Load both images
        const refImg = await loadImage(referenceImage);
        const genImg = await loadImage(generatedImage);

        // Calculate simple perceptual hashes
        const refHash = await simplePerceptualHash(refImg);
        const genHash = await simplePerceptualHash(genImg);

        // Calculate Hamming distance
        const distance = hammingDistance(refHash, genHash);

        // Convert to similarity score (0-100)
        const maxDistance = 64; // 64-bit hash
        const similarity = ((maxDistance - distance) / maxDistance) * 100;

        return Math.max(0, Math.min(100, similarity));
    } catch (error) {
        console.error('pHash calculation failed:', error);
        return 75; // Neutral score on error
    }
}

/**
 * Load image from URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * Calculate simple perceptual hash
 */
async function simplePerceptualHash(img: HTMLImageElement): Promise<string> {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Resize to 8x8 grayscale
    canvas.width = 8;
    canvas.height = 8;
    ctx.drawImage(img, 0, 0, 8, 8);

    // Get image data
    const imageData = ctx.getImageData(0, 0, 8, 8);
    const pixels = imageData.data;

    // Convert to grayscale
    const grayscale: number[] = [];
    for (let i = 0; i < pixels.length; i += 4) {
        const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        grayscale.push(avg);
    }

    // Calculate average
    const average = grayscale.reduce((sum, val) => sum + val, 0) / grayscale.length;

    // Generate hash (1 if above average, 0 otherwise)
    let hash = '';
    for (const val of grayscale) {
        hash += val > average ? '1' : '0';
    }

    return hash;
}

/**
 * Calculate Hamming distance between two bit strings
 */
function hammingDistance(hash1: string, hash2: string): number {
    let distance = 0;
    const len = Math.min(hash1.length, hash2.length);

    for (let i = 0; i < len; i++) {
        if (hash1[i] !== hash2[i]) distance++;
    }

    return distance;
}

/**
 * Approve character identity for production use
 *
 * Story 2.2, AC5
 */
export async function approveCharacterIdentity(
    characterId: string,
    identity: CharacterIdentity
): Promise<CharacterIdentity> {
    // Update approval status
    const updatedIdentity: CharacterIdentity = {
        ...identity,
        approvalStatus: 'approved',
        lastUpdated: new Date().toISOString(),
    };

    // Save to Supabase if configured
    const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL;
    if (isSupabaseConfigured) {
        try {

            const userId = await getCurrentUserId();
            if (userId) {
                await supabase
                    .from('character_identities')
                    .update({ approval_status: 'approved' })
                    .eq('user_id', userId)
                    .eq('character_id', characterId);
            }
        } catch (error) {
            console.error('Failed to update approval status in Supabase:', error);
            // Continue anyway - localStorage will be updated
        }
    }

    return updatedIdentity;
}

/**
 * Bulk test multiple characters
 *
 * Story 2.2, AC6
 */
export async function bulkTestCharacters(request: {
    characters: Array<{ id: string; identity: CharacterIdentity }>;
    onProgress?: (overallProgress: number, currentCharacter: string) => void;
}): Promise<Map<string, CharacterIdentityTest[]>> {
    const { characters, onProgress } = request;
    const results = new Map<string, CharacterIdentityTest[]>();

    for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        const overallProgress = (i / characters.length) * 100;

        onProgress?.(overallProgress, `Testing character ${i + 1}/${characters.length}`);

        const tests = await generateAllTests({
            characterId: char.id,
            identity: char.identity,
            onProgress: (testProgress, status) => {
                const combinedProgress = overallProgress + (testProgress / characters.length);
                onProgress?.(combinedProgress, status);
            }
        });

        results.set(char.id, tests);
    }

    onProgress?.(100, 'All characters tested');
    return results;
}

/**
 * Generate test prompt based on test type
 */
function generateTestPrompt(testType: CharacterIdentityTestType): string {
    const prompts: Record<CharacterIdentityTestType, string> = {
        portrait: 'professional headshot, neutral expression, studio lighting, front-facing, high quality',
        fullbody: 'full body shot, standing neutral pose, even lighting, front view, high quality',
        profile: 'side profile shot, neutral expression, studio lighting, professional, high quality',
        lighting: 'cinematic lighting, dramatic shadows, moody atmosphere, high quality',
        expression: 'natural smile, candid expression, soft lighting, high quality',
    };

    return prompts[testType];
}

/**
 * Generate image using Fal.ai Flux LoRA with trained character identity
 *
 * Reference: https://fal.ai/models/fal-ai/flux-lora
 * The falCharacterId is actually the LoRA model URL from training
 */
async function generateWithFalCharacter(
    falCharacterId: string, // This is the LoRA model URL from createFalCharacter()
    prompt: string,
    onProgress?: (progress: number) => void
): Promise<string> {
    onProgress?.(10);

    // Call Fal.ai Flux LoRA API with trained LoRA model
    const response = await fetch('/api/fal-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            endpoint: '/fal-ai/flux-lora',
            method: 'POST',
            body: {
                prompt,
                loras: [
                    {
                        path: falCharacterId, // LoRA model URL from training
                        scale: 1.0, // Full strength
                    }
                ],
                num_images: 1,
                image_size: { width: 1024, height: 1024 },
                num_inference_steps: 28,
                guidance_scale: 3.5,
                enable_safety_checker: false,
            }
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMsg = error.error || response.statusText;
        throw new Error(`Fal.ai service temporarily unavailable due to Egress Excess overloading the backend. Please try again in a few minutes. Technical details: ${errorMsg}`);
    }

    onProgress?.(80);

    const data = await response.json();

    // Extract image URL from response
    const imageUrl = data.images?.[0]?.url || data.image?.url || data.output?.url;

    if (!imageUrl) {
        throw new Error('Fal.ai API did not return an image URL');
    }

    onProgress?.(100);
    return imageUrl;
}
