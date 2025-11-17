/**
 * TTM (Time-to-Move) Service for Alkemy AI Studio
 * Provides motion-controlled video generation from still images
 */

import { supabase } from './supabase';

// Configuration
const TTM_API_URL = import.meta.env.VITE_TTM_API_URL || 'http://localhost:8100';
const TTM_API_PREFIX = '/api/ttm';

// Types
export enum MotionType {
  OBJECT = 'object',
  CAMERA = 'camera'
}

export enum CameraMovementType {
  PAN = 'pan',
  ZOOM = 'zoom',
  ORBIT = 'orbit',
  DOLLY = 'dolly'
}

export interface Point2D {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
}

export interface CameraMovement {
  type: CameraMovementType;
  params: {
    dx?: number;      // Pan horizontal
    dy?: number;      // Pan vertical
    amount?: number;  // Zoom amount
    angle?: number;   // Orbit angle
  };
}

export interface TTMRequest {
  motionType: MotionType;
  prompt: string;
  trajectory?: Point2D[];        // For object motion
  cameraMovement?: CameraMovement; // For camera motion
  tweakIndex?: number;           // When to start denoising outside mask (0-50)
  tstrongIndex?: number;         // When to start denoising inside mask (0-50)
  numFrames?: number;            // Number of frames (default: 81)
  guidanceScale?: number;        // Guidance scale (default: 3.5)
  seed?: number;                 // Random seed for reproducibility
  projectId?: string;            // Alkemy project ID for storage
}

export interface TTMResponse {
  status: 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  frames?: number;
  generationTime?: number;
  error?: string;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0.0 to 1.0
  result?: TTMResponse;
}

// Default parameters based on motion type
const DEFAULTS = {
  object: {
    tweakIndex: 3,
    tstrongIndex: 7
  },
  camera: {
    tweakIndex: 2,
    tstrongIndex: 5
  },
  numFrames: 81,
  guidanceScale: 3.5,
  fps: 16
};

/**
 * Generate motion-controlled video from a still image
 *
 * @param imageUrl - URL or blob URL of the input image
 * @param request - TTM generation parameters
 * @param onProgress - Optional progress callback
 * @returns TTM response with video URL
 */
export async function generateTTMVideo(
  imageUrl: string,
  request: TTMRequest,
  onProgress?: (progress: number) => void
): Promise<TTMResponse> {
  try {
    console.log('[TTM Service] Starting generation:', {
      motionType: request.motionType,
      prompt: request.prompt,
      hasTrajectory: !!request.trajectory,
      hasCameraMovement: !!request.cameraMovement
    });

    // Validate request
    if (request.motionType === MotionType.OBJECT && !request.trajectory) {
      throw new Error('Object motion requires a trajectory');
    }
    if (request.motionType === MotionType.CAMERA && !request.cameraMovement) {
      throw new Error('Camera motion requires camera movement parameters');
    }

    // Apply defaults
    const motionDefaults = DEFAULTS[request.motionType];
    const finalRequest: TTMRequest = {
      ...request,
      tweakIndex: request.tweakIndex ?? motionDefaults.tweakIndex,
      tstrongIndex: request.tstrongIndex ?? motionDefaults.tstrongIndex,
      numFrames: request.numFrames ?? DEFAULTS.numFrames,
      guidanceScale: request.guidanceScale ?? DEFAULTS.guidanceScale
    };

    // Get current project ID from Supabase if not provided
    if (!finalRequest.projectId && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Could fetch active project from user preferences
        finalRequest.projectId = user.id; // Simplified for now
      }
    }

    // Fetch image as blob
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    // Prepare form data
    const formData = new FormData();
    formData.append('image', imageBlob, 'input.jpg');
    formData.append('request_json', JSON.stringify(finalRequest));

    // Submit generation request
    const response = await fetch(`${TTM_API_URL}${TTM_API_PREFIX}/generate`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'TTM generation failed');
    }

    const job: JobStatus = await response.json();
    console.log('[TTM Service] Job created:', job.jobId);

    // Poll for completion
    const result = await pollJobStatus(job.jobId, onProgress);

    if (result.status === 'failed') {
      throw new Error(result.result?.error || 'Generation failed');
    }

    console.log('[TTM Service] Generation completed:', result.result);
    return result.result!;

  } catch (error) {
    console.error('[TTM Service] Generation error:', error);
    throw error;
  }
}

/**
 * Poll job status until completion
 */
async function pollJobStatus(
  jobId: string,
  onProgress?: (progress: number) => void
): Promise<JobStatus> {
  const maxAttempts = 120; // 2 minutes with 1-second intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`${TTM_API_URL}${TTM_API_PREFIX}/status/${jobId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch job status');
    }

    const status: JobStatus = await response.json();

    if (onProgress) {
      onProgress(status.progress);
    }

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }

  throw new Error('Generation timeout');
}

/**
 * Create trajectory for simple linear motion
 *
 * @param start - Starting point (normalized)
 * @param end - Ending point (normalized)
 * @param numFrames - Number of frames
 * @returns Trajectory points
 */
export function createLinearTrajectory(
  start: Point2D,
  end: Point2D,
  numFrames: number = DEFAULTS.numFrames
): Point2D[] {
  const trajectory: Point2D[] = [];

  for (let i = 0; i < numFrames; i++) {
    const t = i / (numFrames - 1);
    trajectory.push({
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t
    });
  }

  return trajectory;
}

/**
 * Create trajectory for circular motion
 *
 * @param center - Center point (normalized)
 * @param radius - Radius (normalized)
 * @param numFrames - Number of frames
 * @param startAngle - Starting angle in degrees
 * @returns Trajectory points
 */
export function createCircularTrajectory(
  center: Point2D,
  radius: number,
  numFrames: number = DEFAULTS.numFrames,
  startAngle: number = 0
): Point2D[] {
  const trajectory: Point2D[] = [];

  for (let i = 0; i < numFrames; i++) {
    const t = i / (numFrames - 1);
    const angle = (startAngle + t * 360) * Math.PI / 180;
    trajectory.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    });
  }

  return trajectory;
}

/**
 * Create camera movement for dolly zoom effect
 *
 * @param zoomAmount - Amount to zoom (1.0 = no zoom, 2.0 = 2x zoom)
 * @param dollyAmount - Amount to dolly (move forward/back)
 * @returns Camera movement parameters
 */
export function createDollyZoom(
  zoomAmount: number = 1.5,
  dollyAmount: number = 0.3
): CameraMovement {
  return {
    type: CameraMovementType.ZOOM,
    params: {
      amount: zoomAmount - 1.0,
      dx: 0,
      dy: dollyAmount
    }
  };
}

/**
 * Create camera orbit movement
 *
 * @param angle - Orbit angle in degrees
 * @param elevation - Elevation change
 * @returns Camera movement parameters
 */
export function createOrbitMovement(
  angle: number = 30,
  elevation: number = 0
): CameraMovement {
  return {
    type: CameraMovementType.ORBIT,
    params: {
      angle,
      dy: elevation
    }
  };
}

/**
 * Integrate TTM with Alkemy's Frame animation
 * This can be used as an alternative to animateFrame in aiService.ts
 *
 * @param frame - Alkemy Frame object
 * @param motionType - Type of motion to apply
 * @param motionParams - Motion-specific parameters
 * @returns Updated frame with TTM video
 */
export async function animateFrameWithTTM(
  frame: any, // Import Frame type from types.ts
  motionType: MotionType,
  motionParams: {
    trajectory?: Point2D[];
    cameraMovement?: CameraMovement;
    prompt?: string;
  },
  onProgress?: (progress: number) => void
): Promise<{ videoUrl: string; thumbnailUrl: string }> {

  // Use frame's still image as input
  const imageUrl = frame.media?.start_frame_url;
  if (!imageUrl) {
    throw new Error('Frame must have a start frame image');
  }

  // Build prompt from frame description and camera package
  const prompt = motionParams.prompt || buildPromptFromFrame(frame, motionType);

  // Generate video with TTM
  const response = await generateTTMVideo(
    imageUrl,
    {
      motionType,
      prompt,
      trajectory: motionParams.trajectory,
      cameraMovement: motionParams.cameraMovement || buildCameraMovementFromFrame(frame),
      numFrames: frame.duration_frames || DEFAULTS.numFrames,
      projectId: frame.project_id
    },
    onProgress
  );

  if (response.status !== 'completed' || !response.videoUrl) {
    throw new Error(response.error || 'TTM generation failed');
  }

  return {
    videoUrl: response.videoUrl,
    thumbnailUrl: response.thumbnailUrl || imageUrl
  };
}

/**
 * Build motion prompt from frame metadata
 */
function buildPromptFromFrame(frame: any, motionType: MotionType): string {
  const parts = [frame.description];

  if (motionType === MotionType.CAMERA && frame.camera_package) {
    const cam = frame.camera_package;
    if (cam.movement) {
      parts.push(`Camera ${cam.movement}`);
    }
    if (cam.angle) {
      parts.push(`${cam.angle} angle`);
    }
  }

  return parts.join('. ');
}

/**
 * Build camera movement from frame's camera_package
 */
function buildCameraMovementFromFrame(frame: any): CameraMovement | undefined {
  if (!frame.camera_package?.movement) {
    return undefined;
  }

  const movement = frame.camera_package.movement.toLowerCase();

  if (movement.includes('pan')) {
    return {
      type: CameraMovementType.PAN,
      params: {
        dx: movement.includes('right') ? 0.3 : movement.includes('left') ? -0.3 : 0,
        dy: movement.includes('up') ? -0.3 : movement.includes('down') ? 0.3 : 0
      }
    };
  }

  if (movement.includes('zoom') || movement.includes('dolly')) {
    return createDollyZoom();
  }

  if (movement.includes('orbit') || movement.includes('arc')) {
    return createOrbitMovement();
  }

  return undefined;
}

/**
 * Check if TTM API is available
 */
export async function checkTTMStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${TTM_API_URL}/`);
    if (!response.ok) return false;

    const status = await response.json();
    return status.pipeline_loaded === true;
  } catch (error) {
    console.error('[TTM Service] API not available:', error);
    return false;
  }
}

export default {
  generateTTMVideo,
  animateFrameWithTTM,
  createLinearTrajectory,
  createCircularTrajectory,
  createDollyZoom,
  createOrbitMovement,
  checkTTMStatus
};