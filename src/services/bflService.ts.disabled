/**
 * Black Forest Labs (BFL) FLUX API Service
 * Official FLUX API integration for high-quality image generation
 * Documentation: https://docs.bfl.ai/
 */

// Environment variable with proper typing
const BFL_API_KEY = (process.env.BFL_API_KEY ?? import.meta.env.VITE_BFL_API_KEY ?? '').trim();

// API endpoints
const BFL_ENDPOINTS = {
  'FLUX Kontext': 'https://api.bfl.ai/v1/flux-kontext-pro',
  'FLUX 1.1 Pro': 'https://api.bfl.ai/v1/flux-pro-1.1',
  'FLUX 1.1 Pro Ultra': 'https://api.bfl.ai/v1/flux-pro-1.1-ultra',
} as const;

export type BFLModel = keyof typeof BFL_ENDPOINTS;

// Request types
export interface BFLKontextRequest {
  prompt: string;
  aspect_ratio?: string; // "1:1" | "16:9" | "9:16" | etc.
  seed?: number;
  prompt_upsampling?: boolean;
  safety_tolerance?: number; // 0-6
  output_format?: 'jpeg' | 'png';
  webhook_url?: string;
  webhook_secret?: string;
}

export interface BFLProRequest {
  prompt: string;
  width?: number;
  height?: number;
  prompt_upsampling?: boolean;
  seed?: number;
  safety_tolerance?: number; // 0-6
  output_format?: 'jpeg' | 'png';
  webhook_url?: string;
}

export interface BFLInitialResponse {
  id: string;
  status?: string;
}

export interface BFLPollResponse {
  id: string;
  status: 'Pending' | 'Request Moderated' | 'Content Moderated' | 'Ready' | 'Error' | 'Request Failed';
  result?: {
    sample: string; // Image URL (expires in 10 minutes)
    prompt?: string;
    width?: number;
    height?: number;
  };
  error?: string;
}

export interface BFLGenerationResult {
  imageUrl: string;
  id: string;
  seed?: number;
}

/**
 * Check if BFL API is available
 */
export function isBFLApiAvailable(): boolean {
  return !!BFL_API_KEY && BFL_API_KEY.length > 0;
}

/**
 * Convert aspect ratio string to BFL format
 * BFL supports 3:7 (portrait) to 7:3 (landscape), ~1MP output
 */
function convertAspectRatio(aspectRatio: string): string {
  const aspectMap: Record<string, string> = {
    '1:1': '1:1',
    '16:9': '16:9',
    '9:16': '9:16',
    '4:3': '4:3',
    '3:4': '3:4',
    '21:9': '21:9', // Cinematic
    '9:21': '9:21',
  };
  return aspectMap[aspectRatio] || '1:1';
}

/**
 * Convert aspect ratio to width/height for FLUX 1.1 Pro
 */
export function aspectRatioToSizeFor11Pro(aspectRatio: string): { width: number; height: number } {
  const sizeMap: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1440, height: 810 },
    '9:16': { width: 810, height: 1440 },
    '4:3': { width: 1152, height: 864 },
    '3:4': { width: 864, height: 1152 },
    '21:9': { width: 1440, height: 617 },
    '9:21': { width: 617, height: 1440 },
  };
  return sizeMap[aspectRatio] || { width: 1024, height: 1024 };
}

/**
 * Get result from BFL API
 */
async function getResult(
  id: string,
  onProgress?: (progress: number) => void
): Promise<BFLPollResponse> {
  const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
  const pollInterval = 2000; // 2 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Progress feedback (30-90% range during polling)
    const progress = 30 + ((attempt / maxAttempts) * 60);
    onProgress?.(Math.min(90, progress));

    try {
      const response = await fetch(`https://api.bfl.ai/v1/get_result?id=${id}`, {
        method: 'GET',
        headers: {
          'x-key': BFL_API_KEY,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[BFL Service] Get result failed:', response.status, errorText);

        if (response.status === 402) {
          throw new Error('Insufficient BFL API credits. Please check your account at https://api.bfl.ai/');
        }
        if (response.status === 429) {
          throw new Error('BFL API rate limit exceeded. Please wait and retry.');
        }
        if (response.status === 401) {
          throw new Error('BFL API authentication failed. Please check your API key.');
        }

        // Don't throw on 404, it might just mean not ready yet
        if (response.status !== 404) {
          throw new Error(`BFL API get result failed: ${response.status} - ${errorText}`);
        }
      } else {
        const result: BFLPollResponse = await response.json();

        if (result.status === 'Ready') {
          return result;
        }

        if (result.status === 'Error' || result.status === 'Request Failed') {
          throw new Error(`BFL generation failed: ${result.error || 'Unknown error'}`);
        }

        if (result.status === 'Content Moderated' || result.status === 'Request Moderated') {
          throw new Error(`Content blocked by BFL safety filters: ${result.error || 'Moderation triggered'}`);
        }
      }
    } catch (error) {
      // If it's one of our known errors, re-throw
      if (error instanceof Error && (
        error.message.includes('BFL API') ||
        error.message.includes('BFL generation')
      )) {
        throw error;
      }
      // Otherwise, it's likely a network error, continue polling
      console.warn('[BFL Service] Polling error (will retry):', error);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('BFL generation timeout after 2 minutes. Please try again.');
}

/**
 * Download and store image (10-minute expiration)
 */
async function downloadAndStoreImage(
  imageUrl: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    onProgress?.(92);

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const blob = await response.blob();

    onProgress?.(95);

    // Convert to data URL for immediate use
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[BFL Service] Image download failed:', error);
    throw new Error(`Failed to download generated image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate image with FLUX Kontext (context-aware with reference images)
 */
export async function generateWithFluxKontext(
  params: BFLKontextRequest,
  onProgress?: (progress: number) => void
): Promise<BFLGenerationResult> {
  if (!isBFLApiAvailable()) {
    throw new Error('BFL API key is not configured. Please set BFL_API_KEY in environment variables.');
  }

  if (!params.prompt || !params.prompt.trim()) {
    throw new Error('Please enter a prompt to generate an image.');
  }

  console.log('[BFL Service] Starting FLUX Kontext generation', {
    prompt: params.prompt.substring(0, 100),
    aspectRatio: params.aspect_ratio,
    timestamp: new Date().toISOString()
  });

  try {
    onProgress?.(10);

    // Convert aspect ratio
    const aspect_ratio = params.aspect_ratio ? convertAspectRatio(params.aspect_ratio) : '1:1';

    const requestBody: BFLKontextRequest = {
      prompt: params.prompt.trim(),
      aspect_ratio,
      seed: params.seed,
      prompt_upsampling: params.prompt_upsampling ?? false,
      safety_tolerance: params.safety_tolerance ?? 2,
      output_format: params.output_format ?? 'jpeg',
      webhook_url: params.webhook_url,
      webhook_secret: params.webhook_secret,
    };

    onProgress?.(20);

    const response = await fetch(BFL_ENDPOINTS['FLUX Kontext'], {
      method: 'POST',
      headers: {
        'x-key': BFL_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BFL Service] Initial request failed:', response.status, errorText);

      if (response.status === 401) {
        throw new Error('BFL API authentication failed. Please check your API key.');
      }
      if (response.status === 402) {
        throw new Error('Insufficient BFL API credits. Please check your account at https://api.bfl.ai/');
      }
      if (response.status === 429) {
        throw new Error('BFL API rate limit exceeded (max 24 concurrent requests). Please retry in a moment.');
      }
      if (response.status === 400) {
        throw new Error(`BFL API request error: ${errorText}. Please check your parameters.`);
      }

      throw new Error(`BFL API error: ${response.status} - ${errorText}`);
    }

    const initialResult: BFLInitialResponse = await response.json();

    console.log('[BFL Service] Generation started:', initialResult.id);
    onProgress?.(30);

    // Get result with polling
    const result = await getResult(initialResult.id, onProgress);

    if (!result.result?.sample) {
      throw new Error('BFL API returned no image. This may be due to content filters or an API issue.');
    }

    onProgress?.(90);

    // Download image immediately (10-minute expiration)
    const imageUrl = await downloadAndStoreImage(result.result.sample, onProgress);

    console.log('[BFL Service] FLUX Kontext generation successful');
    onProgress?.(100);

    return {
      imageUrl,
      id: initialResult.id,
      seed: params.seed,
    };

  } catch (error) {
    onProgress?.(100);

    if (error instanceof Error) {
      throw error;
    }

    console.error('[BFL Service] Unexpected error:', error);
    throw new Error(`FLUX Kontext generation failed: ${String(error)}`);
  }
}

/**
 * Generate image with FLUX 1.1 Pro (standard text-to-image)
 */
export async function generateWithFlux11Pro(
  params: BFLProRequest,
  onProgress?: (progress: number) => void
): Promise<BFLGenerationResult> {
  if (!isBFLApiAvailable()) {
    throw new Error('BFL API key is not configured. Please set BFL_API_KEY in environment variables.');
  }

  if (!params.prompt || !params.prompt.trim()) {
    throw new Error('Please enter a prompt to generate an image.');
  }

  console.log('[BFL Service] Starting FLUX 1.1 Pro generation', {
    prompt: params.prompt.substring(0, 100),
    width: params.width,
    height: params.height,
    timestamp: new Date().toISOString()
  });

  try {
    onProgress?.(10);

    const requestBody: BFLProRequest = {
      prompt: params.prompt.trim(),
      width: params.width ?? 1024,
      height: params.height ?? 1024,
      prompt_upsampling: params.prompt_upsampling ?? false,
      seed: params.seed,
      safety_tolerance: params.safety_tolerance ?? 2,
      output_format: params.output_format ?? 'jpeg',
      webhook_url: params.webhook_url,
    };

    onProgress?.(20);

    const response = await fetch(BFL_ENDPOINTS['FLUX 1.1 Pro'], {
      method: 'POST',
      headers: {
        'x-key': BFL_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BFL Service] Initial request failed:', response.status, errorText);

      if (response.status === 401) {
        throw new Error('BFL API authentication failed. Please check your API key.');
      }
      if (response.status === 402) {
        throw new Error('Insufficient BFL API credits. Please check your account at https://api.bfl.ai/');
      }
      if (response.status === 429) {
        throw new Error('BFL API rate limit exceeded (max 24 concurrent requests). Please retry in a moment.');
      }
      if (response.status === 400) {
        throw new Error(`BFL API request error: ${errorText}. Please check your parameters.`);
      }

      throw new Error(`BFL API error: ${response.status} - ${errorText}`);
    }

    const initialResult: BFLInitialResponse = await response.json();

    console.log('[BFL Service] Generation started:', initialResult.id);
    onProgress?.(30);

    // Get result with polling
    const result = await getResult(initialResult.id, onProgress);

    if (!result.result?.sample) {
      throw new Error('BFL API returned no image. This may be due to content filters or an API issue.');
    }

    onProgress?.(90);

    // Download image immediately (10-minute expiration)
    const imageUrl = await downloadAndStoreImage(result.result.sample, onProgress);

    console.log('[BFL Service] FLUX 1.1 Pro generation successful');
    onProgress?.(100);

    return {
      imageUrl,
      id: initialResult.id,
      seed: params.seed,
    };

  } catch (error) {
    onProgress?.(100);

    if (error instanceof Error) {
      throw error;
    }

    console.error('[BFL Service] Unexpected error:', error);
    throw new Error(`FLUX 1.1 Pro generation failed: ${String(error)}`);
  }
}

/**
 * Generate image with FLUX 1.1 Pro Ultra (maximum quality)
 */
export async function generateWithFluxUltra(
  params: BFLProRequest,
  onProgress?: (progress: number) => void
): Promise<BFLGenerationResult> {
  if (!isBFLApiAvailable()) {
    throw new Error('BFL API key is not configured. Please set BFL_API_KEY in environment variables.');
  }

  if (!params.prompt || !params.prompt.trim()) {
    throw new Error('Please enter a prompt to generate an image.');
  }

  console.log('[BFL Service] Starting FLUX 1.1 Pro Ultra generation (maximum quality)', {
    prompt: params.prompt.substring(0, 100),
    width: params.width,
    height: params.height,
    timestamp: new Date().toISOString()
  });

  try {
    onProgress?.(10);

    const requestBody: BFLProRequest = {
      prompt: params.prompt.trim(),
      width: params.width ?? 1024,
      height: params.height ?? 1024,
      prompt_upsampling: params.prompt_upsampling ?? false,
      seed: params.seed,
      safety_tolerance: params.safety_tolerance ?? 2,
      output_format: params.output_format ?? 'jpeg',
      webhook_url: params.webhook_url,
    };

    onProgress?.(20);

    const response = await fetch(BFL_ENDPOINTS['FLUX 1.1 Pro Ultra'], {
      method: 'POST',
      headers: {
        'x-key': BFL_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BFL Service] Initial request failed:', response.status, errorText);

      if (response.status === 401) {
        throw new Error('BFL API authentication failed. Please check your API key.');
      }
      if (response.status === 402) {
        throw new Error('Insufficient BFL API credits. Please check your account at https://api.bfl.ai/');
      }
      if (response.status === 429) {
        throw new Error('BFL API rate limit exceeded (max 24 concurrent requests). Please retry in a moment.');
      }
      if (response.status === 400) {
        throw new Error(`BFL API request error: ${errorText}. Please check your parameters.`);
      }

      throw new Error(`BFL API error: ${response.status} - ${errorText}`);
    }

    const initialResult: BFLInitialResponse = await response.json();

    console.log('[BFL Service] Generation started:', initialResult.id);
    onProgress?.(30);

    // Get result with polling
    const result = await getResult(initialResult.id, onProgress);

    if (!result.result?.sample) {
      throw new Error('BFL API returned no image. This may be due to content filters or an API issue.');
    }

    onProgress?.(90);

    // Download image immediately (10-minute expiration)
    const imageUrl = await downloadAndStoreImage(result.result.sample, onProgress);

    console.log('[BFL Service] FLUX 1.1 Pro Ultra generation successful');
    onProgress?.(100);

    return {
      imageUrl,
      id: initialResult.id,
      seed: params.seed,
    };

  } catch (error) {
    onProgress?.(100);

    if (error instanceof Error) {
      throw error;
    }

    console.error('[BFL Service] Unexpected error:', error);
    throw new Error(`FLUX 1.1 Pro Ultra generation failed: ${String(error)}`);
  }
}

/**
 * Generate multiple images in parallel with BFL
 */
export async function generateMultipleWithBFL(
  prompt: string,
  count: number,
  aspectRatio: string = '16:9',
  model: BFLModel = 'FLUX 1.1 Pro',
  onProgress?: (index: number, progress: number) => void
): Promise<BFLGenerationResult[]> {
  // Rate limit: max 24 concurrent requests
  const MAX_CONCURRENT = 24;
  const batchSize = Math.min(count, MAX_CONCURRENT);

  const results: BFLGenerationResult[] = [];

  for (let i = 0; i < count; i += batchSize) {
    const batch = Array.from({ length: Math.min(batchSize, count - i) }, (_, batchIndex) => {
      const index = i + batchIndex;

      if (model === 'FLUX Kontext') {
        return generateWithFluxKontext(
          {
            prompt,
            aspect_ratio: aspectRatio,
          },
          (progress) => onProgress?.(index, progress)
        );
      } else if (model === 'FLUX 1.1 Pro Ultra') {
        const { width, height } = aspectRatioToSizeFor11Pro(aspectRatio);
        return generateWithFluxUltra(
          {
            prompt,
            width,
            height,
          },
          (progress) => onProgress?.(index, progress)
        );
      } else {
        const { width, height } = aspectRatioToSizeFor11Pro(aspectRatio);
        return generateWithFlux11Pro(
          {
            prompt,
            width,
            height,
          },
          (progress) => onProgress?.(index, progress)
        );
      }
    });

    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Helper function to check if a model is a BFL model
 */
export function isBFLModel(model: string): boolean {
  return model === 'FLUX 1.1 Pro' ||
         model === 'FLUX Kontext' ||
         model === 'FLUX 1.1 Pro Ultra' ||
         model.includes('BFL');
}