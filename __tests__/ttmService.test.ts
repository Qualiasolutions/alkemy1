/**
 * TTM Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateTTMVideo,
  createLinearTrajectory,
  createCircularTrajectory,
  createDollyZoom,
  createOrbitMovement,
  animateFrameWithTTM,
  checkTTMStatus,
  MotionType,
  CameraMovementType
} from '../services/ttmService';

// Mock fetch
global.fetch = vi.fn() as any;

// Mock Supabase
vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    }
  }
}));

describe('TTM Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Trajectory Generation', () => {
    it('should create linear trajectory', () => {
      const start = { x: 0.1, y: 0.2 };
      const end = { x: 0.9, y: 0.8 };
      const frames = 5;

      const trajectory = createLinearTrajectory(start, end, frames);

      expect(trajectory).toHaveLength(frames);
      expect(trajectory[0]).toEqual(start);
      expect(trajectory[frames - 1]).toEqual(end);

      // Check intermediate points
      expect(trajectory[2].x).toBeCloseTo(0.5, 1);
      expect(trajectory[2].y).toBeCloseTo(0.5, 1);
    });

    it('should create circular trajectory', () => {
      const center = { x: 0.5, y: 0.5 };
      const radius = 0.3;
      const frames = 8;

      const trajectory = createCircularTrajectory(center, radius, frames);

      expect(trajectory).toHaveLength(frames);

      // Check it's a circle
      for (let i = 0; i < frames; i++) {
        const angle = (i / (frames - 1)) * Math.PI * 2;
        const expectedX = center.x + radius * Math.cos(angle);
        const expectedY = center.y + radius * Math.sin(angle);

        expect(trajectory[i].x).toBeCloseTo(expectedX, 1);
        expect(trajectory[i].y).toBeCloseTo(expectedY, 1);
      }
    });
  });

  describe('Camera Movement', () => {
    it('should create dolly zoom movement', () => {
      const movement = createDollyZoom(1.5, 0.3);

      expect(movement.type).toBe(CameraMovementType.ZOOM);
      expect(movement.params.amount).toBe(0.5); // 1.5 - 1.0
      expect(movement.params.dy).toBe(0.3);
    });

    it('should create orbit movement', () => {
      const movement = createOrbitMovement(45, 10);

      expect(movement.type).toBe(CameraMovementType.ORBIT);
      expect(movement.params.angle).toBe(45);
      expect(movement.params.dy).toBe(10);
    });
  });

  describe('TTM Status Check', async () => {
    it('should return false when API is not available', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const isAvailable = await checkTTMStatus();
      expect(isAvailable).toBe(false);
    });

    it('should return true when API is available', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ pipeline_loaded: true })
      });

      const isAvailable = await checkTTMStatus();
      expect(isAvailable).toBe(true);
    });

    it('should return false when pipeline is not loaded', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ pipeline_loaded: false })
      });

      const isAvailable = await checkTTMStatus();
      expect(isAvailable).toBe(false);
    });
  });

  describe('Video Generation', () => {
    const mockImageUrl = 'https://example.com/image.jpg';
    const mockRequest = {
      motionType: MotionType.OBJECT,
      prompt: 'Test motion',
      trajectory: [{ x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 }]
    };

    it('should generate video successfully', async () => {
      // Mock initial job creation
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jobId: 'test-job-123',
          status: 'pending',
          progress: 0
        })
      });

      // Mock polling for completion
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jobId: 'test-job-123',
          status: 'completed',
          progress: 1.0,
          result: {
            status: 'completed',
            videoUrl: 'https://example.com/video.mp4',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            durationSeconds: 5.06,
            frames: 81,
            generationTime: 25.4
          }
        })
      });

      // Mock image fetch
      vi.mocked(fetch).mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob())
      } as any);

      const result = await generateTTMVideo(mockImageUrl, mockRequest);

      expect(result.status).toBe('completed');
      expect(result.videoUrl).toBe('https://example.com/video.mp4');
      expect(result.frames).toBe(81);
      expect(result.durationSeconds).toBeCloseTo(5.06);
    });

    it('should handle generation failure', async () => {
      // Mock initial job creation
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jobId: 'test-job-123',
          status: 'pending',
          progress: 0
        })
      });

      // Mock polling for failure
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jobId: 'test-job-123',
          status: 'failed',
          progress: 0.5,
          result: {
            status: 'failed',
            error: 'Generation failed: Out of memory'
          }
        })
      });

      // Mock image fetch
      vi.mocked(fetch).mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob())
      } as any);

      await expect(generateTTMVideo(mockImageUrl, mockRequest))
        .rejects.toThrow('Generation failed: Out of memory');
    });

    it('should validate request parameters', async () => {
      const invalidRequest = {
        motionType: MotionType.OBJECT,
        prompt: 'Test',
        trajectory: [] // Empty trajectory for object motion
      };

      await expect(generateTTMVideo(mockImageUrl, invalidRequest))
        .rejects.toThrow('Object motion requires a trajectory');
    });
  });

  describe('Frame Animation Integration', () => {
    const mockFrame = {
      id: 'frame-1',
      shot_number: 1,
      description: 'A person walking',
      media: {
        start_frame_url: 'https://example.com/frame.jpg'
      },
      camera_package: {
        movement: 'pan right',
        lens_mm: 35,
        aperture: 2.8
      },
      project_id: 'project-123'
    };

    it('should animate frame with TTM', async () => {
      // Mock TTM service
      vi.mock('./ttmService').doMockImplementation(() => ({
        ...vi.importActual('./ttmService'),
        generateTTMVideo: vi.fn().mockResolvedValue({
          status: 'completed',
          videoUrl: 'https://example.com/ttm-video.mp4',
          thumbnailUrl: 'https://example.com/ttm-thumb.jpg'
        })
      }));

      const result = await animateFrameWithTTM(
        mockFrame,
        MotionType.CAMERA,
        {
          cameraMovement: {
            type: CameraMovementType.PAN,
            params: { dx: 0.3 }
          }
        }
      );

      expect(result.videoUrl).toBe('https://example.com/ttm-video.mp4');
      expect(result.thumbnailUrl).toBe('https://example.com/ttm-thumb.jpg');
    });

    it('should build prompt from frame metadata', async () => {
      // Mock TTM service
      vi.mock('./ttmService').doMockImplementation(() => ({
        ...vi.importActual('./ttmService'),
        generateTTMVideo: vi.fn().mockResolvedValue({
          status: 'completed',
          videoUrl: 'https://example.com/video.mp4'
        })
      }));

      await animateFrameWithTTM(
        mockFrame,
        MotionType.CAMERA,
        {
          cameraMovement: {
            type: CameraMovementType.PAN,
            params: { dx: 0.3 }
          }
        }
      );

      // Check that generateTTMVideo was called with the correct prompt
      expect(vi.mocked(generateTTMVideo)).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          prompt: expect.stringContaining('Camera pan right')
        })
      );
    });

    it('should require still image for animation', async () => {
      const frameWithoutImage = { ...mockFrame, media: {} };

      await expect(animateFrameWithTTM(
        frameWithoutImage,
        MotionType.OBJECT,
        { trajectory: [{ x: 0, y: 0 }] }
      )).rejects.toThrow('Frame must have a start frame image');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(checkTTMStatus()).resolves.toBe(false);
    });

    it('should handle malformed responses', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(checkTTMStatus()).resolves.toBe(false);
    });

    it('should handle timeout during generation', async () => {
      // Mock job creation
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jobId: 'test-job-123',
          status: 'pending',
          progress: 0
        })
      });

      // Mock infinite pending (would timeout after 120 polls)
      for (let i = 0; i < 125; i++) {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            jobId: 'test-job-123',
            status: 'processing',
            progress: 0.5
          })
        });
      }

      // Mock image fetch
      vi.mocked(fetch).mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob())
      } as any);

      await expect(generateTTMVideo(
        'https://example.com/image.jpg',
        {
          motionType: MotionType.OBJECT,
          prompt: 'Test',
          trajectory: [{ x: 0, y: 0 }, { x: 1, y: 0 }]
        }
      )).rejects.toThrow('Generation timeout');
    });
  });

  describe('Type Safety', () => {
    it('should enforce MotionType enum', () => {
      const validMotionTypes = [MotionType.OBJECT, MotionType.CAMERA];
      expect(validMotionTypes).toContain('object');
      expect(validMotionTypes).toContain('camera');
    });

    it('should enforce CameraMovementType enum', () => {
      const validCameraTypes = [
        CameraMovementType.PAN,
        CameraMovementType.ZOOM,
        CameraMovementType.ORBIT,
        CameraMovementType.DOLLY
      ];
      expect(validCameraTypes).toContain('pan');
      expect(validCameraTypes).toContain('zoom');
      expect(validCameraTypes).toContain('orbit');
      expect(validCameraTypes).toContain('dolly');
    });
  });
});