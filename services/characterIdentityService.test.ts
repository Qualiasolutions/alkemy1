/**
 * Unit Tests for Character Identity Service
 * Story 2.2: Character Identity Preview and Testing
 *
 * Test Coverage:
 * - testCharacterIdentity()
 * - generateAllTests()
 * - calculateSimilarity()
 * - approveCharacterIdentity()
 * - bulkTestCharacters()
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CharacterIdentity, CharacterIdentityTest, CharacterIdentityTestType } from '../types';
import {
  testCharacterIdentity,
  generateAllTests,
  calculateSimilarity,
  approveCharacterIdentity,
  bulkTestCharacters,
  getCharacterIdentityStatus
} from './characterIdentityService';

// Mock fetch globally
global.fetch = vi.fn();

describe('Character Identity Service - Story 2.2', () => {
  // Mock Image constructor for all tests
  class MockImage {
    onload: (() => void) | null = null;
    onerror: ((err: any) => void) | null = null;
    src: string = '';
    complete: boolean = true;
    width: number = 100;
    height: number = 100;

    constructor() {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
  }

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    (global.fetch as any).mockReset();
    // Setup Image mock
    global.Image = MockImage as any;
  });

  describe('getCharacterIdentityStatus', () => {
    it('should return "none" when identity is undefined', () => {
      expect(getCharacterIdentityStatus(undefined)).toBe('none');
    });

    it('should return "ready" when identity status is ready', () => {
      const identity: CharacterIdentity = {
        status: 'ready',
        referenceImages: ['image1.jpg'],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      expect(getCharacterIdentityStatus(identity)).toBe('ready');
    });

    it('should return "error" when identity status is error', () => {
      const identity: CharacterIdentity = {
        status: 'error',
        referenceImages: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        errorMessage: 'Test error'
      };
      expect(getCharacterIdentityStatus(identity)).toBe('error');
    });
  });

  describe('testCharacterIdentity - AC1, AC2', () => {
    it('should throw error when identity is not ready', async () => {
      const identity: CharacterIdentity = {
        status: 'preparing',
        referenceImages: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      await expect(testCharacterIdentity({
        characterId: 'char1',
        identity,
        testType: 'portrait'
      })).rejects.toThrow('Character identity must be ready before testing');
    });

    it('should throw error when falCharacterId is missing', async () => {
      const identity: CharacterIdentity = {
        status: 'ready',
        referenceImages: ['image1.jpg'],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      await expect(testCharacterIdentity({
        characterId: 'char1',
        identity,
        testType: 'portrait'
      })).rejects.toThrow('Character identity does not have Fal.ai character ID');
    });

    it('should generate test successfully with valid identity', async () => {
      const identity: CharacterIdentity = {
        status: 'ready',
        referenceImages: ['https://example.com/ref1.jpg'],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        technologyData: {
          type: 'reference',
          falCharacterId: 'fal-char-123'
        }
      };

      // Mock Fal.ai API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          images: [{ url: 'https://example.com/generated.jpg' }]
        })
      });

      const progressCallback = vi.fn();
      const test = await testCharacterIdentity({
        characterId: 'char1',
        identity,
        testType: 'portrait',
        onProgress: progressCallback
      });

      expect(test).toBeDefined();
      expect(test.testType).toBe('portrait');
      expect(test.generatedImageUrl).toBe('https://example.com/generated.jpg');
      expect(test.similarityScore).toBeGreaterThanOrEqual(0);
      expect(test.similarityScore).toBeLessThanOrEqual(100);
      expect(test.id).toContain('test-');
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should call progress callback with correct stages', async () => {
      const identity: CharacterIdentity = {
        status: 'ready',
        referenceImages: ['https://example.com/ref1.jpg'],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        technologyData: {
          type: 'reference',
          falCharacterId: 'fal-char-123'
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          images: [{ url: 'https://example.com/generated.jpg' }]
        })
      });

      const progressCallback = vi.fn();
      await testCharacterIdentity({
        characterId: 'char1',
        identity,
        testType: 'fullbody',
        onProgress: progressCallback
      });

      // Verify progress callback was called with different stages
      expect(progressCallback).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('Generating'));
      expect(progressCallback).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('Calculating'));
      expect(progressCallback).toHaveBeenCalledWith(100, 'Test complete');
    });
  });

  describe('generateAllTests - AC2 (Batch Testing)', () => {
    it('should generate all 5 test types', async () => {
      const identity: CharacterIdentity = {
        status: 'ready',
        referenceImages: ['https://example.com/ref1.jpg'],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        technologyData: {
          type: 'reference',
          falCharacterId: 'fal-char-123'
        }
      };

      // Mock Fal.ai API to return different images for each test type
      let callCount = 0;
      (global.fetch as any).mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          images: [{ url: `https://example.com/generated-${callCount++}.jpg` }]
        })
      }));

      const tests = await generateAllTests({
        characterId: 'char1',
        identity
      });

      expect(tests).toHaveLength(5);
      expect(tests.map(t => t.testType)).toEqual(['portrait', 'fullbody', 'profile', 'lighting', 'expression']);

      // Verify each test has required properties
      tests.forEach(test => {
        expect(test.id).toBeDefined();
        expect(test.generatedImageUrl).toContain('https://example.com/generated');
        expect(test.similarityScore).toBeGreaterThanOrEqual(0);
        expect(test.similarityScore).toBeLessThanOrEqual(100);
        expect(test.timestamp).toBeDefined();
      });
    });

    it('should track overall progress across all tests', async () => {
      const identity: CharacterIdentity = {
        status: 'ready',
        referenceImages: ['https://example.com/ref1.jpg'],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        technologyData: {
          type: 'reference',
          falCharacterId: 'fal-char-123'
        }
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          images: [{ url: 'https://example.com/generated.jpg' }]
        })
      });

      const progressCallback = vi.fn();
      await generateAllTests({
        characterId: 'char1',
        identity,
        onProgress: progressCallback
      });

      // Verify progress callback was called
      expect(progressCallback).toHaveBeenCalled();
      // Verify final progress is 100%
      expect(progressCallback).toHaveBeenCalledWith(100, 'All tests complete');
    });
  });

  describe('calculateSimilarity - AC3', () => {
    it('should return a similarity score between 0 and 100', async () => {
      const referenceImages = ['https://example.com/ref1.jpg'];
      const generatedImage = 'https://example.com/generated.jpg';

      const score = await calculateSimilarity(referenceImages, generatedImage);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return neutral score (75) on calculation error', async () => {
      const referenceImages = ['invalid-url'];
      const generatedImage = 'invalid-url';

      // Mock image loading to fail
      class FailingMockImage {
        onload: (() => void) | null = null;
        onerror: ((err: any) => void) | null = null;
        src: string = '';

        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error('Load failed'));
          }, 0);
        }
      }
      global.Image = FailingMockImage as any;

      const score = await calculateSimilarity(referenceImages, generatedImage);

      expect(score).toBe(75);
    });
  });

  describe('approveCharacterIdentity - AC5', () => {
    it('should update identity with approved status', async () => {
      const identity: CharacterIdentity = {
        status: 'ready',
        referenceImages: ['https://example.com/ref1.jpg'],
        createdAt: '2025-01-01T00:00:00Z',
        lastUpdated: '2025-01-01T00:00:00Z',
        technologyData: {
          type: 'reference',
          falCharacterId: 'fal-char-123'
        }
      };

      const approvedIdentity = await approveCharacterIdentity('char1', identity);

      expect(approvedIdentity.approvalStatus).toBe('approved');
      expect(approvedIdentity.lastUpdated).not.toBe(identity.lastUpdated);
      expect(new Date(approvedIdentity.lastUpdated).getTime()).toBeGreaterThan(
        new Date(identity.lastUpdated).getTime()
      );
    });

    it('should preserve all original identity properties', async () => {
      const identity: CharacterIdentity = {
        status: 'ready',
        referenceImages: ['https://example.com/ref1.jpg', 'https://example.com/ref2.jpg'],
        createdAt: '2025-01-01T00:00:00Z',
        lastUpdated: '2025-01-01T00:00:00Z',
        trainingCost: 0.10,
        technologyData: {
          type: 'reference',
          falCharacterId: 'fal-char-123',
          referenceStrength: 80
        }
      };

      const approvedIdentity = await approveCharacterIdentity('char1', identity);

      expect(approvedIdentity.status).toBe('ready');
      expect(approvedIdentity.referenceImages).toEqual(identity.referenceImages);
      expect(approvedIdentity.createdAt).toBe(identity.createdAt);
      expect(approvedIdentity.trainingCost).toBe(0.10);
      expect(approvedIdentity.technologyData).toEqual(identity.technologyData);
    });
  });

  describe('bulkTestCharacters - AC6', () => {
    it('should test multiple characters and return results map', async () => {
      const characters = [
        {
          id: 'char1',
          identity: {
            status: 'ready' as const,
            referenceImages: ['https://example.com/char1-ref.jpg'],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            technologyData: {
              type: 'reference' as const,
              falCharacterId: 'fal-char-1'
            }
          }
        },
        {
          id: 'char2',
          identity: {
            status: 'ready' as const,
            referenceImages: ['https://example.com/char2-ref.jpg'],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            technologyData: {
              type: 'reference' as const,
              falCharacterId: 'fal-char-2'
            }
          }
        }
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          images: [{ url: 'https://example.com/generated.jpg' }]
        })
      });

      const results = await bulkTestCharacters({ characters });

      expect(results.size).toBe(2);
      expect(results.has('char1')).toBe(true);
      expect(results.has('char2')).toBe(true);
      expect(results.get('char1')).toHaveLength(5);
      expect(results.get('char2')).toHaveLength(5);
    });

    it('should track progress across all characters', async () => {
      const characters = [
        {
          id: 'char1',
          identity: {
            status: 'ready' as const,
            referenceImages: ['https://example.com/ref.jpg'],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            technologyData: {
              type: 'reference' as const,
              falCharacterId: 'fal-char-1'
            }
          }
        }
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          images: [{ url: 'https://example.com/generated.jpg' }]
        })
      });

      const progressCallback = vi.fn();
      await bulkTestCharacters({
        characters,
        onProgress: progressCallback
      });

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(100, 'All characters tested');
    });
  });

  describe('Error Handling', () => {
    it('should handle Fal.ai API errors gracefully', async () => {
      const identity: CharacterIdentity = {
        status: 'ready',
        referenceImages: ['https://example.com/ref1.jpg'],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        technologyData: {
          type: 'reference',
          falCharacterId: 'fal-char-123'
        }
      };

      // Mock API error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'API rate limit exceeded' })
      });

      await expect(testCharacterIdentity({
        characterId: 'char1',
        identity,
        testType: 'portrait'
      })).rejects.toThrow('Test generation failed');
    });

    it('should handle missing image URL in API response', async () => {
      const identity: CharacterIdentity = {
        status: 'ready',
        referenceImages: ['https://example.com/ref1.jpg'],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        technologyData: {
          type: 'reference',
          falCharacterId: 'fal-char-123'
        }
      };

      // Mock API response without image URL
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: [] })
      });

      await expect(testCharacterIdentity({
        characterId: 'char1',
        identity,
        testType: 'portrait'
      })).rejects.toThrow('Fal.ai API did not return an image URL');
    });
  });

  describe('Test Type Prompts', () => {
    it('should use appropriate prompts for each test type', async () => {
      const identity: CharacterIdentity = {
        status: 'ready',
        referenceImages: ['https://example.com/ref1.jpg'],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        technologyData: {
          type: 'reference',
          falCharacterId: 'fal-char-123'
        }
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          images: [{ url: 'https://example.com/generated.jpg' }]
        })
      });
      global.fetch = fetchMock as any;

      // Test portrait
      await testCharacterIdentity({
        characterId: 'char1',
        identity,
        testType: 'portrait'
      });

      const portraitCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
      const portraitBody = JSON.parse(portraitCall[1].body);
      expect(portraitBody.body.prompt).toContain('headshot');
      expect(portraitBody.body.prompt).toContain('neutral expression');

      // Test lighting
      fetchMock.mockClear();
      await testCharacterIdentity({
        characterId: 'char1',
        identity,
        testType: 'lighting'
      });

      const lightingCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
      const lightingBody = JSON.parse(lightingCall[1].body);
      expect(lightingBody.body.prompt).toContain('cinematic lighting');
      expect(lightingBody.body.prompt).toContain('dramatic shadows');
    });
  });
});
