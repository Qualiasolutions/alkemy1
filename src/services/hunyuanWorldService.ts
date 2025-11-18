/**
 * HunyuanWorld 1.0 Service - Real Gradio API Integration
 *
 * Production-ready 3D world generation using Tencent's Hunyuan3D-2
 * Via HuggingFace Gradio Space API
 *
 * Features:
 * - True AI-generated 3D models (GLB/GLTF/OBJ/PLY/STL formats)
 * - Text-to-3D and Image-to-3D generation
 * - High-quality textured meshes
 * - Multiple quality modes (Turbo/Fast/Standard)
 * - Supabase Storage integration
 * - Free to use via HuggingFace
 */

import { Client } from '@gradio/client';
import { supabase } from '../../services/supabase';

export interface HunyuanWorldOptions {
    prompt?: string;
    image?: File | Blob;
    quality?: 'turbo' | 'fast' | 'standard';
    resolution?: 'low' | 'standard' | 'high';
    format?: 'glb' | 'obj' | 'ply' | 'stl';
    includeTextures?: boolean;
    simplifyMesh?: boolean;
    targetFaceCount?: number;
    onProgress?: (progress: number, status: string) => void;
}

export interface HunyuanWorldResult {
    id: string;
    modelUrl: string;
    thumbnailUrl?: string;
    metadata: {
        prompt?: string;
        vertices: number;
        triangles: number;
        generationTime: number;
        modelSize: number;
        quality: string;
        format: string;
        seed: number;
        createdAt: string;
    };
}

export interface HunyuanWorldGenerationJob {
    id: string;
    prompt?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    statusMessage: string;
    result?: HunyuanWorldResult;
    error?: string;
    startedAt: Date;
    completedAt?: Date;
}

class HunyuanWorldService {
    private activeJobs: Map<string, HunyuanWorldGenerationJob> = new Map();
    private readonly GRADIO_SPACE = 'tencent/Hunyuan3D-2';
    private client: any = null;

    /**
     * Reset client connection (useful for testing or reconnection)
     */
    resetClient() {
        this.client = null;
    }

    /**
     * Initialize Gradio client connection
     */
    private async getClient() {
        if (!this.client) {
            try {
                const hfToken = import.meta.env.HF_TOKEN;
                this.client = await Client.connect(this.GRADIO_SPACE, {
                    hf_token: hfToken || undefined
                });
            } catch (error) {
                console.error('[HunyuanWorld] Failed to connect to Gradio Space:', error);
                throw new Error('Failed to connect to HunyuanWorld service. Please try again later.');
            }
        }
        return this.client;
    }

    /**
     * Call Gradio API with retry logic, timeout, and exponential backoff
     * FIXED: Proper cleanup of intervals and timeouts to prevent race conditions
     */
    private async callGradioWithRetry(
        client: any,
        endpoint: string,
        params: any,
        onProgress?: (progress: number, status: string) => void,
        maxRetries = 3,
        timeoutMs = 600000 // 10 minute timeout per attempt (increased from 5min)
    ): Promise<any> {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            let heartbeatInterval: NodeJS.Timeout | null = null;
            let timeoutHandle: NodeJS.Timeout | null = null;

            try {
                // Use submit() instead of predict() for better queue visibility
                const job = client.submit(endpoint, params);

                // Create generation promise with heartbeat detection
                const generationPromise = new Promise<any>(async (resolve, reject) => {
                    let result: any;
                    let lastMessageTime = Date.now();

                    // Set up timeout
                    timeoutHandle = setTimeout(() => {
                        if (heartbeatInterval) clearInterval(heartbeatInterval);
                        reject(new Error('Generation timeout - GPU queue is overloaded. Please try again later.'));
                    }, timeoutMs);

                    // Set up heartbeat detection (more lenient - 10 minutes)
                    heartbeatInterval = setInterval(() => {
                        const timeSinceLastMessage = Date.now() - lastMessageTime;
                        if (timeSinceLastMessage > 600000) { // 10 minutes without updates
                            if (heartbeatInterval) clearInterval(heartbeatInterval);
                            if (timeoutHandle) clearTimeout(timeoutHandle);
                            reject(new Error('Generation stalled - no server response for 10 minutes'));
                        }
                    }, 60000); // Check every 60 seconds

                    try {
                        for await (const message of job) {
                            lastMessageTime = Date.now();

                            if (message.type === 'status') {
                                if (message.stage === 'pending') {
                                    const queueInfo = message.queue_position ? ` (position ${message.queue_position} in queue)` : '';
                                    const estimatedTime = message.queue_position ? ` (~${Math.ceil(message.queue_position * 2)} min estimated)` : '';
                                    onProgress?.(20, `Waiting for GPU${queueInfo}${estimatedTime}...`);
                                } else if (message.stage === 'processing') {
                                    onProgress?.(50, 'GPU allocated - generating 3D model...');
                                } else if (message.stage === 'complete') {
                                    result = message;
                                    break;
                                } else if (message.stage === 'error') {
                                    throw new Error(message.message || 'Generation failed');
                                }
                            } else if (message.type === 'data') {
                                result = message;
                                break;
                            }
                        }

                        // Clean up
                        if (heartbeatInterval) clearInterval(heartbeatInterval);
                        if (timeoutHandle) clearTimeout(timeoutHandle);

                        resolve(result);
                    } catch (error) {
                        // Clean up on error
                        if (heartbeatInterval) clearInterval(heartbeatInterval);
                        if (timeoutHandle) clearTimeout(timeoutHandle);
                        reject(error);
                    }
                });

                // Wait for generation to complete
                return await generationPromise;

            } catch (error: any) {
                // Ensure cleanup even if error occurs
                if (heartbeatInterval) clearInterval(heartbeatInterval);
                if (timeoutHandle) clearTimeout(timeoutHandle);

                const isLastAttempt = attempt === maxRetries - 1;

                // Extract meaningful error message
                let errorMessage = 'Unknown error';
                if (error.message && error.message !== "'Error'") {
                    errorMessage = error.message;
                } else if (error.stage === 'error') {
                    errorMessage = 'GPU allocation failed - Space is busy';
                } else if (error.type === 'status') {
                    errorMessage = `Generation failed at ${error.stage} stage`;
                }

                console.error(`[HunyuanWorld] Attempt ${attempt + 1}/${maxRetries} failed:`, errorMessage);

                if (isLastAttempt) {
                    throw new Error(`${errorMessage}. The HunyuanWorld Space is currently overloaded. Try again in a few minutes or use a different quality setting.`);
                }

                // Exponential backoff: 5s, 10s, 20s
                const waitTime = 5000 * Math.pow(2, attempt);
                console.log(`[HunyuanWorld] Retry ${attempt + 1}/${maxRetries} after ${waitTime}ms`);
                onProgress?.(15, `GPU busy - retrying in ${waitTime / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);

                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        throw new Error('Maximum retry attempts reached');
    }

    /**
     * Map quality setting to generation steps
     */
    private getStepsForQuality(quality: 'turbo' | 'fast' | 'standard'): number {
        switch (quality) {
            case 'turbo': return 15;
            case 'fast': return 25;
            case 'standard': return 30;
            default: return 30;
        }
    }

    /**
     * Map resolution setting to octree resolution
     */
    private getOctreeResolution(resolution: 'low' | 'standard' | 'high'): number {
        switch (resolution) {
            case 'low': return 128;
            case 'standard': return 256;
            case 'high': return 512;
            default: return 256;
        }
    }

    /**
     * Generate a 3D world using HunyuanWorld 1.0
     *
     * @param options Generation options with prompt/image and callbacks
     * @returns Promise with generated world result
     */
    async generateWorld(options: HunyuanWorldOptions): Promise<HunyuanWorldResult> {
        const {
            prompt,
            image,
            quality = 'fast',
            resolution = 'standard',
            format = 'glb',
            includeTextures = true,
            simplifyMesh = false,
            targetFaceCount = 10000,
            onProgress
        } = options;

        const jobId = `hunyuan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();

        // Create job tracking
        const job: HunyuanWorldGenerationJob = {
            id: jobId,
            prompt: prompt || 'Image-to-3D generation',
            status: 'pending',
            progress: 0,
            statusMessage: 'Initializing HunyuanWorld generation...',
            startedAt: new Date()
        };

        this.activeJobs.set(jobId, job);

        try {
            // Validate inputs
            if (!prompt && !image) {
                throw new Error('Either prompt or image is required for 3D generation');
            }

            onProgress?.(5, 'Connecting to Hunyuan3D-2 API...');

            // Connect to Gradio client
            const client = await this.getClient();

            onProgress?.(10, 'Preparing generation parameters...');

            // Calculate generation parameters
            const steps = this.getStepsForQuality(quality);
            const octreeResolution = this.getOctreeResolution(resolution);
            const seed = Math.floor(Math.random() * 1000000);

            job.status = 'processing';
            job.statusMessage = 'Generating 3D shape...';
            onProgress?.(20, 'Generating 3D shape with AI...');

            // Call the appropriate API based on whether we want textures
            const apiEndpoint = includeTextures ? '/generation_all' : '/shape_generation';

            console.log('[HunyuanWorld] Calling Gradio API:', {
                endpoint: apiEndpoint,
                prompt,
                hasImage: !!image,
                steps,
                octreeResolution,
                seed
            });

            // Use retry logic with queue visibility
            const result = await this.callGradioWithRetry(
                client,
                apiEndpoint,
                {
                    caption: prompt || null,
                    image: image || null,
                    mv_image_front: null,
                    mv_image_back: null,
                    mv_image_left: null,
                    mv_image_right: null,
                    steps: steps,
                    guidance_scale: 5,
                    seed: seed,
                    octree_resolution: octreeResolution,
                    check_box_rembg: true,
                    num_chunks: 8000,
                    randomize_seed: false
                },
                onProgress
            );

            console.log('[HunyuanWorld] Raw API response:', result);

            onProgress?.(70, 'Processing generated 3D model...');

            // Extract file paths from result
            if (!result || !result.data) {
                throw new Error('Invalid response from Gradio API - no data returned');
            }

            const [shapeFile, textureFile, htmlOutput, meshStats, resultSeed] = result.data;

            console.log('[HunyuanWorld] Generation result:', {
                shapeFile,
                hasTexture: !!textureFile,
                meshStats,
                seed: resultSeed
            });

            onProgress?.(80, 'Exporting to desired format...');

            // If format is not GLB, we need to export
            let finalModelFile = shapeFile;
            if (format !== 'glb') {
                const exportResult = await client.predict('/on_export_click', {
                    file_out: shapeFile,
                    file_out2: textureFile || shapeFile,
                    file_type: format,
                    reduce_face: simplifyMesh,
                    export_texture: includeTextures,
                    target_face_num: targetFaceCount
                });

                const [exportHtml, exportedFile] = exportResult.data;
                finalModelFile = exportedFile;
            }

            onProgress?.(85, 'Uploading to cloud storage...');

            // Download the generated file
            const modelBlob = await this.downloadFile(finalModelFile.url || finalModelFile);

            // Upload to Supabase
            const uploadResult = await this.uploadToSupabase(modelBlob, jobId, format);

            onProgress?.(95, 'Finalizing world metadata...');

            // Create final result
            const generationTime = Date.now() - startTime;
            const finalResult: HunyuanWorldResult = {
                id: jobId,
                modelUrl: uploadResult.modelUrl,
                thumbnailUrl: uploadResult.thumbnailUrl,
                metadata: {
                    prompt: prompt || 'Image-to-3D',
                    vertices: meshStats?.vertices || 0,
                    triangles: meshStats?.faces || 0,
                    generationTime,
                    modelSize: modelBlob.size,
                    quality,
                    format,
                    seed: resultSeed,
                    createdAt: new Date().toISOString()
                }
            };

            // Note: Usage logging disabled for now - needs proper integration
            // TODO: Add proper usage tracking for 3D generation

            job.status = 'completed';
            job.progress = 100;
            job.statusMessage = 'World generation complete!';
            job.result = finalResult;
            job.completedAt = new Date();

            onProgress?.(100, 'HunyuanWorld generation complete!');

            return finalResult;

        } catch (error) {
            console.error('[HunyuanWorld Service] Generation failed:', error);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

            job.status = 'failed';
            job.statusMessage = `Generation failed: ${errorMessage}`;
            job.error = errorMessage;

            // Note: Usage logging disabled for now - needs proper integration
            // TODO: Add proper usage tracking for failed generations

            throw new Error(`HunyuanWorld generation failed: ${errorMessage}`);
        } finally {
            // Clean up job after 10 minutes
            setTimeout(() => {
                this.activeJobs.delete(jobId);
            }, 10 * 60 * 1000);
        }
    }

    /**
     * Generate a quick preview (turbo mode, no textures)
     */
    async generatePreview(prompt: string, onProgress?: (progress: number, status: string) => void): Promise<string> {
        const result = await this.generateWorld({
            prompt,
            quality: 'turbo',
            resolution: 'low',
            format: 'glb',
            includeTextures: false,
            onProgress
        });
        return result.modelUrl;
    }

    /**
     * Download file from HuggingFace/Gradio
     */
    private async downloadFile(fileUrlOrPath: string | { url: string }): Promise<Blob> {
        const url = typeof fileUrlOrPath === 'string' ? fileUrlOrPath : fileUrlOrPath.url;

        // Handle relative paths from Gradio
        const fullUrl = url.startsWith('http') ? url : `https://tencent-hunyuan3d-2.hf.space/file=${url}`;

        const response = await fetch(fullUrl);
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }

        return await response.blob();
    }

    /**
     * Upload generated model to Supabase Storage
     * FIXED: Use correct bucket name (project-media instead of projects)
     */
    private async uploadToSupabase(modelBlob: Blob, jobId: string, format: string): Promise<{
        modelUrl: string;
        thumbnailUrl: string;
    }> {
        try {
            // Upload main model to correct bucket
            const modelPath = `3d-models/${jobId}/model.${format}`;
            const { data: modelUpload, error: modelError } = await supabase.storage
                .from('project-media') // FIXED: Changed from 'projects' to 'project-media'
                .upload(modelPath, modelBlob, {
                    contentType: this.getContentType(format),
                    upsert: true
                });

            if (modelError) {
                throw new Error(`Model upload failed: ${modelError.message}`);
            }

            // Get public URL
            const { data: modelUrl } = supabase.storage
                .from('project-media') // FIXED: Changed from 'projects' to 'project-media'
                .getPublicUrl(modelPath);

            // For now, use model URL as thumbnail (in future could generate actual thumbnail)
            const thumbnailUrl = modelUrl.publicUrl;

            return {
                modelUrl: modelUrl.publicUrl,
                thumbnailUrl
            };

        } catch (error) {
            console.error('[HunyuanWorld Service] Upload failed:', error);
            throw new Error(`Failed to upload to storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get content type for 3D model format
     */
    private getContentType(format: string): string {
        switch (format) {
            case 'glb':
                return 'model/gltf-binary';
            case 'gltf':
                return 'model/gltf+json';
            case 'obj':
                return 'model/obj';
            case 'ply':
                return 'model/ply';
            case 'stl':
                return 'model/stl';
            default:
                return 'application/octet-stream';
        }
    }

    /**
     * Get job status by ID
     */
    getJobStatus(jobId: string): HunyuanWorldGenerationJob | undefined {
        return this.activeJobs.get(jobId);
    }

    /**
     * Get all active jobs
     */
    getActiveJobs(): HunyuanWorldGenerationJob[] {
        return Array.from(this.activeJobs.values());
    }

    /**
     * Check if HunyuanWorld service is available
     */
    isAvailable(): boolean {
        // Always available via HuggingFace Spaces
        return true;
    }

    /**
     * Get service status and capabilities
     */
    async getServiceStatus(): Promise<{
        available: boolean;
        apiStatus: 'online' | 'offline' | 'error';
        activeJobs: number;
    }> {
        try {
            // Try to connect to Gradio client
            await this.getClient();

            return {
                available: true,
                apiStatus: 'online',
                activeJobs: this.activeJobs.size
            };
        } catch (error) {
            return {
                available: false,
                apiStatus: 'error',
                activeJobs: this.activeJobs.size
            };
        }
    }
}

// Export singleton instance
export const hunyuanWorldService = new HunyuanWorldService();