import { supabase, isSupabaseConfigured } from './supabase';

export interface MediaAsset {
  id: string;
  project_id: string;
  user_id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  metadata?: any;
  created_at: string;
}

export interface MediaService {
  uploadFile: (projectId: string, userId: string, file: File, metadata?: any) => Promise<{ asset: MediaAsset | null; error: any }>;
  uploadBlob: (projectId: string, userId: string, blob: Blob, fileName: string, mimeType: string, metadata?: any) => Promise<{ asset: MediaAsset | null; error: any }>;
  getPublicUrl: (bucket: string, path: string) => string;
  deleteAsset: (assetId: string) => Promise<{ error: any }>;
  getProjectAssets: (projectId: string) => Promise<{ assets: MediaAsset[] | null; error: any }>;
  getUserAssets: (userId: string) => Promise<{ assets: MediaAsset[] | null; error: any }>;
  // Helper for converting blob URLs to Supabase storage
  uploadBlobUrl: (projectId: string, userId: string, blobUrl: string, fileName: string, metadata?: any) => Promise<{ asset: MediaAsset | null; error: any }>;
}

class MediaServiceImpl implements MediaService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = isSupabaseConfigured();
  }

  async uploadFile(projectId: string, userId: string, file: File, metadata?: any): Promise<{ asset: MediaAsset | null; error: any }> {
    if (!this.isConfigured) {
      return { asset: null, error: new Error('Supabase is not configured') };
    }

    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${userId}/${projectId}/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-media')
        .getPublicUrl(filePath);

      // Create database record
      const { data: assetData, error: dbError } = await supabase
        .from('media_assets')
        .insert([{
          project_id: projectId,
          user_id: userId,
          type: this.getFileType(file.type),
          url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          metadata: metadata || {},
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      return { asset: assetData, error: null };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { asset: null, error };
    }
  }

  async uploadBlob(projectId: string, userId: string, blob: Blob, fileName: string, mimeType: string, metadata?: any): Promise<{ asset: MediaAsset | null; error: any }> {
    if (!this.isConfigured) {
      return { asset: null, error: new Error('Supabase is not configured') };
    }

    try {
      // Convert blob to file
      const file = new File([blob], fileName, { type: mimeType });
      return this.uploadFile(projectId, userId, file, metadata);
    } catch (error) {
      console.error('Error uploading blob:', error);
      return { asset: null, error };
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    if (!this.isConfigured) {
      return '';
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async deleteAsset(assetId: string): Promise<{ error: any }> {
    if (!this.isConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      // First get the asset to find the file path
      const { data: asset, error: getError } = await supabase
        .from('media_assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (getError || !asset) {
        return { error: getError || new Error('Asset not found') };
      }

      // Delete from storage
      const filePath = this.extractFilePathFromUrl(asset.url);
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('project-media')
          .remove([filePath]);

        if (storageError) {
          console.warn('Error deleting file from storage:', storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', assetId);

      if (dbError) throw dbError;

      return { error: null };
    } catch (error) {
      console.error('Error deleting asset:', error);
      return { error };
    }
  }

  async getProjectAssets(projectId: string): Promise<{ assets: MediaAsset[] | null; error: any }> {
    if (!this.isConfigured) {
      return { assets: null, error: new Error('Supabase is not configured') };
    }

    try {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { assets: data, error: null };
    } catch (error) {
      console.error('Error getting project assets:', error);
      return { assets: null, error };
    }
  }

  async getUserAssets(userId: string): Promise<{ assets: MediaAsset[] | null; error: any }> {
    if (!this.isConfigured) {
      return { assets: null, error: new Error('Supabase is not configured') };
    }

    try {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { assets: data, error: null };
    } catch (error) {
      console.error('Error getting user assets:', error);
      return { assets: null, error };
    }
  }

  async uploadBlobUrl(projectId: string, userId: string, blobUrl: string, fileName: string, metadata?: any): Promise<{ asset: MediaAsset | null; error: any }> {
    if (!this.isConfigured) {
      return { asset: null, error: new Error('Supabase is not configured') };
    }

    try {
      // Convert blob URL to blob
      const response = await fetch(blobUrl);
      const blob = await response.blob();

      // Determine MIME type from the response or use a default
      const mimeType = blob.type || this.getMimeTypeFromFileName(fileName);

      return this.uploadBlob(projectId, userId, blob, fileName, mimeType, metadata);
    } catch (error) {
      console.error('Error uploading blob URL:', error);
      return { asset: null, error };
    }
  }

  // Helper methods
  private getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  private getMimeTypeFromFileName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeMap: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
    };

    return mimeMap[ext || ''] || 'application/octet-stream';
  }

  private extractFilePathFromUrl(url: string): string | null {
    try {
      // Extract file path from Supabase storage URL
      // Example: https://.../storage/v1/object/public/project-media/userId/projectId/fileName
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === 'project-media');

      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }

      return null;
    } catch (error) {
      console.error('Error extracting file path from URL:', error);
      return null;
    }
  }
}

// Export singleton instance as a function to avoid TDZ errors
// This ensures the instance is created only when accessed, not during module initialization
let mediaServiceInstance: MediaService | null = null;

function getMediaServiceInstance(): MediaService {
  if (!mediaServiceInstance) {
    mediaServiceInstance = new MediaServiceImpl();
  }
  return mediaServiceInstance;
}

// Export the appropriate service based on configuration
export function getMediaService(): MediaService | null {
  return isSupabaseConfigured() ? getMediaServiceInstance() : null;
}

// LAZY EXPORT: Use getter to prevent TDZ errors in minified builds
let _mediaService: MediaService | undefined;
export function getMediaServiceDirect(): MediaService {
  if (!_mediaService) {
    _mediaService = new MediaServiceImpl();
  }
  return _mediaService;
}