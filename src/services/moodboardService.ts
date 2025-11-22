import type { MoodboardItem, MoodboardTemplate } from '../types'
import { supabase } from './supabase'

// MCP Integration - Use Supabase as the backend storage
export class MoodboardService {
  static getInstance(): MoodboardService {
    if (!MoodboardService.instance) {
      MoodboardService.instance = new MoodboardService()
    }
    return MoodboardService.instance
  }

  // Save moodboard templates to Supabase
  async saveMoodboards(projectId: string, templates: MoodboardTemplate[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          moodboard_data: templates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)

      if (error) {
        console.error('[MoodboardService] Error saving moodboards:', error)
        throw error
      }

      console.log('[MoodboardService] Successfully saved moodboards for project:', projectId)
    } catch (error) {
      console.error('[MoodboardService] Failed to save moodboards:', error)
      throw error
    }
  }

  // Load moodboard templates from Supabase
  async loadMoodboards(projectId: string): Promise<MoodboardTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('moodboard_data')
        .eq('id', projectId)
        .single()

      if (error) {
        console.error('[MoodboardService] Error loading moodboards:', error)
        throw error
      }

      const templates = data?.moodboard_data || []
      console.log('[MoodboardService] Successfully loaded moodboards for project:', projectId)
      return templates
    } catch (error) {
      console.error('[MoodboardService] Failed to load moodboards:', error)
      throw error
    }
  }

  // Upload image to Supabase storage
  async uploadImage(projectId: string, file: File, itemId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${projectId}/moodboard/${itemId}.${fileExt}`

      const { data, error } = await supabase.storage.from('projects').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })

      if (error) {
        console.error('[MoodboardService] Error uploading image:', error)
        throw error
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('projects').getPublicUrl(fileName)

      console.log('[MoodboardService] Successfully uploaded image:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('[MoodboardService] Failed to upload image:', error)
      throw error
    }
  }

  // Delete image from Supabase storage
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl)
      const pathname = url.pathname
      // Remove /public/projects/ prefix
      const filePath = pathname.replace(/^\/public\/projects\//, '')

      const { error } = await supabase.storage.from('projects').remove([filePath])

      if (error) {
        console.error('[MoodboardService] Error deleting image:', error)
        throw error
      }

      console.log('[MoodboardService] Successfully deleted image:', imageUrl)
    } catch (error) {
      console.error('[MoodboardService] Failed to delete image:', error)
      throw error
    }
  }

  // Convert File objects to Supabase URLs and upload them
  async processAndUploadImages(
    projectId: string,
    items: MoodboardItem[],
    _existingItems: MoodboardItem[] = []
  ): Promise<MoodboardItem[]> {
    try {
      const processedItems: MoodboardItem[] = []

      for (const item of items) {
        // Check if this is a new blob URL (data URL or blob) that needs uploading
        if (item.url.startsWith('data:') || item.url.startsWith('blob:')) {
          // Convert data URL to File
          if (item.url.startsWith('data:')) {
            const response = await fetch(item.url)
            const blob = await response.blob()
            const file = new File([blob], `image-${item.id}.${blob.type.split('/')[1]}`, {
              type: blob.type,
            })

            const publicUrl = await this.uploadImage(projectId, file, item.id)
            processedItems.push({
              ...item,
              url: publicUrl,
              metadata: {
                ...item.metadata,
                source: 'upload',
                uploadedAt: new Date().toISOString(),
              },
            })
          } else {
            // Handle blob URLs - convert to data URL first
            const dataUrl = await this.blobToDataUrl(item.url)
            const response = await fetch(dataUrl)
            const blob = await response.blob()
            const file = new File([blob], `image-${item.id}.${blob.type.split('/')[1]}`, {
              type: blob.type,
            })

            const publicUrl = await this.uploadImage(projectId, file, item.id)
            processedItems.push({
              ...item,
              url: publicUrl,
              metadata: {
                ...item.metadata,
                source: 'upload',
                uploadedAt: new Date().toISOString(),
              },
            })
          }
        } else {
          // This is already a public URL, keep as is
          processedItems.push(item)
        }
      }

      return processedItems
    } catch (error) {
      console.error('[MoodboardService] Failed to process images:', error)
      throw error
    }
  }

  // Helper: Convert blob URL to data URL
  private async blobToDataUrl(blobUrl: string): Promise<string> {
    const response = await fetch(blobUrl)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Real-time subscription to moodboard changes
  subscribeToMoodboardChanges(
    projectId: string,
    callback: (templates: MoodboardTemplate[]) => void
  ): () => void {
    const subscription = supabase
      .channel(`moodboard-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        async (payload) => {
          if (payload.new?.moodboard_data) {
            callback(payload.new.moodboard_data)
          }
        }
      )
      .subscribe()

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(subscription)
    }
  }

  // Validate moodboard template
  validateTemplate(template: MoodboardTemplate): boolean {
    if (!template.id || !template.title) {
      return false
    }

    if (!Array.isArray(template.items)) {
      return false
    }

    if (template.items.length > 20) {
      // MAX_ITEMS
      return false
    }

    return true
  }

  // Get storage statistics
  async getStorageUsage(projectId: string): Promise<{
    totalImages: number
    totalSize: number
  }> {
    try {
      const { data, error } = await supabase.storage
        .from('projects')
        .list(`${projectId}/moodboard/`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        })

      if (error) {
        throw error
      }

      const totalImages = data?.length || 0
      const totalSize = data?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0

      return { totalImages, totalSize }
    } catch (error) {
      console.error('[MoodboardService] Error getting storage usage:', error)
      return { totalImages: 0, totalSize: 0 }
    }
  }
}

// Export singleton instance
export const moodboardService = MoodboardService.getInstance()

// React hook for moodboard state management
export const useMoodboardService = () => {
  return {
    saveMoodboards: moodboardService.saveMoodboards.bind(moodboardService),
    loadMoodboards: moodboardService.loadMoodboards.bind(moodboardService),
    uploadImage: moodboardService.uploadImage.bind(moodboardService),
    deleteImage: moodboardService.deleteImage.bind(moodboardService),
    processAndUploadImages: moodboardService.processAndUploadImages.bind(moodboardService),
    subscribeToMoodboardChanges:
      moodboardService.subscribeToMoodboardChanges.bind(moodboardService),
    validateTemplate: moodboardService.validateTemplate.bind(moodboardService),
    getStorageUsage: moodboardService.getStorageUsage.bind(moodboardService),
  }
}
