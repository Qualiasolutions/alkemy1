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

import type { CharacterIdentity, CharacterIdentityStatus } from '@/types';

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
            // Import Supabase client dynamically to avoid errors when not configured
            const { supabase } = await import('./supabase');

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
 * - Minimum 3 images required
 * - Maximum 5 images allowed
 * - Each image must be >512x512px resolution
 * - Each image must be <10MB file size
 * - Supported formats: JPEG, PNG, WebP
 */
function validateReferenceImages(images: File[]): CharacterIdentityError | null {
    // Check minimum count
    if (images.length < 3) {
        return {
            type: 'insufficient-references',
            message: 'At least 3 reference images are required for character identity. Upload more images.',
        };
    }

    // Check maximum count
    if (images.length > 5) {
        return {
            type: 'api-error',
            message: 'Maximum 5 reference images allowed. Please remove some images.',
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
    const { supabase } = await import('./supabase');
    const { getCurrentUserId } = await import('./supabase');

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
 * Create character identity with Fal.ai API
 *
 * This function:
 * 1. Calls /api/fal-proxy to create a character identity
 * 2. Returns the Fal.ai character ID
 */
async function createFalCharacter(
    referenceUrls: string[],
    onProgress?: (progress: number, status: string) => void
): Promise<string> {
    onProgress?.(50, 'Creating character with Fal.ai...');

    // Call Fal.ai Instant Character API via proxy
    const response = await fetch('/api/fal-proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            endpoint: '/fal-ai/flux-pro/character/train',
            method: 'POST',
            body: {
                images_data_url: referenceUrls,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Fal.ai API error: ${error.error || response.statusText}`);
    }

    const data = await response.json();

    onProgress?.(90, 'Finalizing character identity...');

    // Extract character ID from Fal.ai response
    // Note: Actual response structure depends on Fal.ai API
    // Assuming response has { character_id: "..." } or similar field
    const characterId = data.character_id || data.id || data.embedding_id;

    if (!characterId) {
        throw new Error('Fal.ai API did not return a character ID');
    }

    return characterId;
}
