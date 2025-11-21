/**
 * Kie.ai Video Service
 *
 * Service for video generation using Kie.ai's Veo 3.1 API
 * Provides 93% cost savings compared to Fal.ai for video animation
 *
 * Cost Comparison (8-second video):
 * - Veo 3 Fast: $0.30-$0.40 (Kie.ai) vs $6.00 (Fal.ai)
 * - Veo 3 Quality: $1.25-$2.00 (Kie.ai) vs $6.00 (Fal.ai)
 *
 * API Documentation: https://docs.kie.ai/veo3-api/quickstart
 */

const KIE_API_BASE = 'https://api.kie.ai';
const KIE_API_KEY = import.meta.env.VITE_KIE_API_KEY;

export interface KieVideoGenerationOptions {
  prompt: string;
  imageUrls?: string[];
  model?: 'veo3' | 'veo3_fast';
  aspectRatio?: '16:9' | '9:16' | 'Auto';
  seeds?: number;
  callBackUrl?: string;
  watermark?: string;
  enableTranslation?: boolean;
  generationType?: 'TEXT_2_VIDEO' | 'FIRST_AND_LAST_FRAMES_2_VIDEO' | 'REFERENCE_2_VIDEO';
}

export interface KieVideoGenerationResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface KieVideoStatus {
  code: number;
  msg: string;
  data: {
    taskId: string;
    successFlag: number; // 0=generating, 1=success, 2=failed, 3=generation failed
    resultUrls?: string; // JSON array of video URLs
    createTime?: string;
    updateTime?: string;
  };
}

export interface Kie1080pVideoResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    video1080pUrl?: string;
    status: string;
  };
}

/**
 * Generate a video using Kie.ai Veo 3.1 API
 *
 * @param options Video generation options
 * @returns Task ID for status polling
 * @throws Error if API key is missing or request fails
 */
export async function generateKieVideo(
  options: KieVideoGenerationOptions
): Promise<string> {
  if (!KIE_API_KEY) {
    throw new Error('[Kie.ai Service] API key not configured. Set VITE_KIE_API_KEY environment variable.');
  }

  const {
    prompt,
    imageUrls,
    model = 'veo3_fast', // Default to fast model for cost savings
    aspectRatio = '16:9',
    seeds,
    callBackUrl,
    watermark,
    enableTranslation = true,
    generationType,
  } = options;

  console.log('[Kie.ai Service] Generating video:', {
    model,
    aspectRatio,
    hasImages: !!imageUrls,
    imageCount: imageUrls?.length || 0,
  });

  try {
    const response = await fetch(`${KIE_API_BASE}/api/v1/veo/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        imageUrls,
        model,
        aspectRatio,
        seeds,
        callBackUrl,
        watermark,
        enableTranslation,
        generationType,
      }),
    });

    const data: KieVideoGenerationResponse = await response.json();

    if (!response.ok || data.code !== 200) {
      throw new Error(`Kie.ai API error: ${data.msg || 'Unknown error'}`);
    }

    console.log('[Kie.ai Service] Video generation task started:', data.data.taskId);
    return data.data.taskId;
  } catch (error) {
    console.error('[Kie.ai Service] Video generation failed:', error);
    throw error;
  }
}

/**
 * Check the status of a Kie.ai video generation task
 *
 * @param taskId Task ID from generateKieVideo
 * @returns Task status and video URLs if complete
 */
export async function getKieVideoStatus(taskId: string): Promise<KieVideoStatus> {
  if (!KIE_API_KEY) {
    throw new Error('[Kie.ai Service] API key not configured.');
  }

  try {
    const response = await fetch(
      `${KIE_API_BASE}/api/v1/veo/record-info?taskId=${taskId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
        },
      }
    );

    const data: KieVideoStatus = await response.json();

    if (!response.ok || data.code !== 200) {
      throw new Error(`Kie.ai status check failed: ${data.msg || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    console.error('[Kie.ai Service] Status check failed:', error);
    throw error;
  }
}

/**
 * Poll for video completion with automatic retries
 *
 * @param taskId Task ID to poll
 * @param maxWaitTime Maximum wait time in milliseconds (default: 10 minutes)
 * @param pollInterval Polling interval in milliseconds (default: 30 seconds)
 * @param onProgress Optional progress callback
 * @returns Array of video URLs when complete
 */
export async function waitForKieVideoCompletion(
  taskId: string,
  maxWaitTime: number = 600000, // 10 minutes
  pollInterval: number = 30000, // 30 seconds
  onProgress?: (status: string) => void
): Promise<string[]> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const status = await getKieVideoStatus(taskId);

    if (onProgress) {
      const statusText = getStatusText(status.data.successFlag);
      onProgress(statusText);
    }

    // Success
    if (status.data.successFlag === 1 && status.data.resultUrls) {
      const videoUrls = JSON.parse(status.data.resultUrls) as string[];
      console.log('[Kie.ai Service] Video generation complete:', videoUrls);
      return videoUrls;
    }

    // Failed
    if (status.data.successFlag === 2 || status.data.successFlag === 3) {
      throw new Error(`Video generation failed: ${status.msg}`);
    }

    // Still generating, wait and retry
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Video generation timeout - exceeded maximum wait time');
}

/**
 * Get 1080p HD version of a 16:9 video (optional upgrade)
 * Only available for 16:9 aspect ratio videos
 *
 * @param taskId Task ID of completed video
 * @returns 1080p video URL
 */
export async function getKie1080pVideo(taskId: string): Promise<string> {
  if (!KIE_API_KEY) {
    throw new Error('[Kie.ai Service] API key not configured.');
  }

  try {
    const response = await fetch(
      `${KIE_API_BASE}/api/v1/veo/get-1080p-video?taskId=${taskId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
        },
      }
    );

    const data: Kie1080pVideoResponse = await response.json();

    if (!response.ok || data.code !== 200) {
      throw new Error(`1080p video request failed: ${data.msg || 'Unknown error'}`);
    }

    if (!data.data.video1080pUrl) {
      throw new Error('1080p video not available yet. Please wait a few minutes and retry.');
    }

    console.log('[Kie.ai Service] 1080p video ready:', data.data.video1080pUrl);
    return data.data.video1080pUrl;
  } catch (error) {
    console.error('[Kie.ai Service] 1080p video fetch failed:', error);
    throw error;
  }
}

/**
 * Animate a still image using Kie.ai Veo 3 Fast
 * This is the primary cost-saving function for Alkemy's hybrid strategy
 *
 * @param imageUrl URL of the image to animate
 * @param prompt Motion description
 * @param options Additional options
 * @returns Video URL when complete
 */
export async function animateImageWithKie(
  imageUrl: string,
  prompt: string,
  options: {
    model?: 'veo3' | 'veo3_fast';
    aspectRatio?: '16:9' | '9:16' | 'Auto';
    onProgress?: (status: string) => void;
    get1080p?: boolean;
  } = {}
): Promise<string> {
  const {
    model = 'veo3_fast',
    aspectRatio = '16:9',
    onProgress,
    get1080p = false,
  } = options;

  console.log('[Kie.ai Service] Starting image animation:', {
    imageUrl,
    prompt,
    model,
    aspectRatio,
  });

  // Step 1: Start generation
  const taskId = await generateKieVideo({
    prompt,
    imageUrls: [imageUrl],
    model,
    aspectRatio,
    enableTranslation: true,
    generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
  });

  // Step 2: Wait for completion
  const videoUrls = await waitForKieVideoCompletion(taskId, 600000, 30000, onProgress);

  if (videoUrls.length === 0) {
    throw new Error('No video URLs returned from Kie.ai');
  }

  const videoUrl = videoUrls[0];

  // Step 3: Optionally get 1080p version (only for 16:9)
  if (get1080p && aspectRatio === '16:9') {
    try {
      // Wait a bit for 1080p processing
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute
      const hdUrl = await getKie1080pVideo(taskId);
      return hdUrl;
    } catch (error) {
      console.warn('[Kie.ai Service] 1080p upgrade failed, using standard resolution:', error);
      return videoUrl;
    }
  }

  return videoUrl;
}

/**
 * Get cost estimate for Kie.ai video generation
 * Based on current pricing: https://kie.ai/billing
 *
 * @param model Model to use
 * @param duration Video duration in seconds (currently fixed at 8 seconds)
 * @param get1080p Whether to get 1080p upgrade
 * @returns Estimated cost in USD
 */
export function estimateKieCost(
  model: 'veo3' | 'veo3_fast',
  duration: number = 8,
  get1080p: boolean = false
): number {
  // Kie.ai credit pricing: $0.005 per credit
  const CREDIT_COST = 0.005;

  // Veo 3 Fast: 60-80 credits per 8-second video (recently reduced)
  // Veo 3 Quality: 250-400 credits per 8-second video (recently reduced)
  let credits: number;

  if (model === 'veo3_fast') {
    credits = 70; // Average: (60 + 80) / 2
  } else {
    credits = 325; // Average: (250 + 400) / 2
  }

  // Scale by duration (8 seconds is base)
  const durationMultiplier = duration / 8;
  credits *= durationMultiplier;

  // 1080p upgrade adds ~20% to cost (estimate)
  if (get1080p) {
    credits *= 1.2;
  }

  return credits * CREDIT_COST;
}

/**
 * Get human-readable status text
 */
function getStatusText(successFlag: number): string {
  switch (successFlag) {
    case 0:
      return 'Generating video...';
    case 1:
      return 'Video generation complete';
    case 2:
      return 'Video generation failed';
    case 3:
      return 'Task created but generation failed';
    default:
      return 'Unknown status';
  }
}
