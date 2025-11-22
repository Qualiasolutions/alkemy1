/**
 * File Upload Service
 *
 * Centralized file upload utilities for character reference images,
 * media assets, and other file-based operations.
 *
 * Epic 2: Character Identity - provides reference image upload and validation
 * General: Supports Supabase Storage and localStorage fallback
 *
 * @see docs/stories/epic-2-story-2.1-character-identity-training.md (AC1)
 */

import { isSupabaseConfigured, supabase } from './supabase'

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_FILE_SIZE_MB = 10
const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp']
const MIN_IMAGE_RESOLUTION = 512 // 512x512px minimum

export interface UploadValidation {
  valid: boolean
  warnings: string[]
  errors: string[]
}

export interface ImageDimensions {
  width: number
  height: number
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate reference image quality and format.
 *
 * **Story 2.1 - AC1**: Reference Image Upload Interface
 *
 * Checks:
 * - File size (<10MB)
 * - File format (JPEG, PNG, WebP)
 * - Resolution (>512x512px)
 *
 * @param file - File to validate
 * @returns UploadValidation result
 */
export async function validateReferenceImage(file: File): Promise<UploadValidation> {
  const warnings: string[] = []
  const errors: string[] = []

  // Check file size
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    errors.push(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`)
  }

  // Check file type
  if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
    errors.push(`File type not supported. Use JPEG, PNG, or WebP`)
  }

  // Check resolution (async)
  try {
    const dimensions = await getImageDimensions(file)

    if (dimensions.width < MIN_IMAGE_RESOLUTION || dimensions.height < MIN_IMAGE_RESOLUTION) {
      warnings.push(
        `Image resolution is low (${dimensions.width}x${dimensions.height}px). ` +
          `Recommended: at least ${MIN_IMAGE_RESOLUTION}x${MIN_IMAGE_RESOLUTION}px for best results.`
      )
    }

    // Check aspect ratio extremes (very wide or very tall)
    const aspectRatio = dimensions.width / dimensions.height
    if (aspectRatio > 3 || aspectRatio < 0.33) {
      warnings.push(
        `Unusual aspect ratio (${aspectRatio.toFixed(2)}). ` +
          `Square or near-square images work best for character references.`
      )
    }
  } catch (_error) {
    warnings.push('Could not verify image resolution. Upload may fail.')
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  }
}

/**
 * Get image dimensions from File object.
 *
 * @param file - Image file
 * @returns Promise<ImageDimensions>
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.width,
        height: img.height,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

// ============================================================================
// UPLOAD FUNCTIONS (Supabase Storage)
// ============================================================================

/**
 * Upload multiple files to Supabase Storage with progress tracking.
 *
 * **Story 2.1 - AC5**: Character Identity Data Storage
 *
 * @param files - Files to upload
 * @param destination - Storage bucket ('character-references' | 'character-models')
 * @param path - Path within bucket (e.g., 'user_id/project_id/character_id/')
 * @param onProgress - Progress callback (fileIndex, progress)
 * @returns Promise<string[]> - Array of public URLs
 */
export async function uploadMultipleFiles(
  files: File[],
  destination: 'character-references' | 'character-models',
  path: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    // Fallback to base64 data URLs if Supabase not configured
    console.log('[FileUploadService] Supabase not configured, using base64 fallback')
    return Promise.all(files.map((file) => imageToBase64(file)))
  }

  const uploadPromises = files.map(async (file, index) => {
    if (onProgress) onProgress(index, 0)

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `${path}${Date.now()}_${index}.${ext}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(destination).upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      throw new Error(`Upload failed for ${file.name}: ${error.message}`)
    }

    if (onProgress) onProgress(index, 100)

    // Get public URL
    const { data: urlData } = supabase.storage.from(destination).getPublicUrl(filename)

    return urlData.publicUrl
  })

  return Promise.all(uploadPromises)
}

/**
 * Upload single file to Supabase Storage.
 *
 * @param file - File to upload
 * @param destination - Storage bucket
 * @param path - Path within bucket
 * @returns Promise<string> - Public URL
 */
export async function uploadSingleFile(
  file: File,
  destination: 'character-references' | 'character-models',
  path: string
): Promise<string> {
  const urls = await uploadMultipleFiles([file], destination, path)
  return urls[0]
}

// ============================================================================
// IMAGE CONVERSION FUNCTIONS (localStorage fallback)
// ============================================================================

/**
 * Convert image File to base64 data URL (for localStorage storage).
 *
 * **Story 2.1 - AC5**: localStorage fallback when Supabase not configured
 *
 * @param file - Image file
 * @returns Promise<string> - Base64 data URL
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(reader.result as string)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Convert multiple images to base64 data URLs.
 *
 * @param files - Image files
 * @returns Promise<string[]> - Array of base64 data URLs
 */
export async function imagesToBase64(files: File[]): Promise<string[]> {
  return Promise.all(files.map((file) => imageToBase64(file)))
}

// ============================================================================
// IMAGE OPTIMIZATION
// ============================================================================

/**
 * Optimize image before storage (compress if needed).
 *
 * Reduces file size while maintaining visual quality to save storage space
 * and improve load times.
 *
 * @param file - Original image file
 * @param maxSizeMB - Maximum file size in MB (default: 2MB)
 * @param quality - JPEG quality (0-1, default: 0.85)
 * @returns Promise<File> - Optimized file
 */
export async function optimizeImage(
  file: File,
  maxSizeMB: number = 2,
  quality: number = 0.85
): Promise<File> {
  // If file is already small enough, return as-is
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Set canvas size to image size
      canvas.width = img.width
      canvas.height = img.height

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Draw image to canvas
      ctx.drawImage(img, 0, 0)

      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }

          // Create new File from blob
          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })

          resolve(optimizedFile)
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for optimization'))
    }

    img.src = url
  })
}

/**
 * Batch optimize multiple images.
 *
 * @param files - Image files to optimize
 * @param maxSizeMB - Maximum file size per image
 * @param quality - JPEG quality
 * @returns Promise<File[]> - Optimized files
 */
export async function optimizeImages(
  files: File[],
  maxSizeMB: number = 2,
  quality: number = 0.85
): Promise<File[]> {
  return Promise.all(files.map((file) => optimizeImage(file, maxSizeMB, quality)))
}

// ============================================================================
// DELETION FUNCTIONS
// ============================================================================

/**
 * Delete file from Supabase Storage.
 *
 * @param bucket - Storage bucket
 * @param path - File path
 * @returns Promise<void>
 */
export async function deleteFile(
  bucket: 'character-references' | 'character-models',
  path: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.log('[FileUploadService] Supabase not configured, nothing to delete')
    return
  }

  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Delete multiple files from Supabase Storage.
 *
 * @param bucket - Storage bucket
 * @param paths - File paths
 * @returns Promise<void>
 */
export async function deleteFiles(
  bucket: 'character-references' | 'character-models',
  paths: string[]
): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.log('[FileUploadService] Supabase not configured, nothing to delete')
    return
  }

  const { error } = await supabase.storage.from(bucket).remove(paths)

  if (error) {
    throw new Error(`Failed to delete files: ${error.message}`)
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get maximum file size in MB.
 *
 * @returns number
 */
export function getMaxFileSizeMB(): number {
  return MAX_FILE_SIZE_MB
}

/**
 * Get supported image formats.
 *
 * @returns string[]
 */
export function getSupportedFormats(): string[] {
  return [...SUPPORTED_IMAGE_FORMATS]
}

/**
 * Get minimum image resolution.
 *
 * @returns number
 */
export function getMinResolution(): number {
  return MIN_IMAGE_RESOLUTION
}

/**
 * Format file size for display.
 *
 * @param bytes - File size in bytes
 * @returns string - Formatted size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`
}
