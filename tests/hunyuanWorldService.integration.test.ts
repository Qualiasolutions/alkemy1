/**
 * HunyuanWorld Service Integration Tests
 *
 * These are REAL integration tests that test actual service functionality.
 * They use the real @gradio/client library to verify the service works.
 *
 * Note: These tests will make actual API calls to HuggingFace Spaces.
 * They may be slow or fail if the Space is down or busy.
 *
 * To run: npm test -- tests/hunyuanWorldService.integration.test.ts
 * To skip: Add .skip to describe() blocks
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { hunyuanWorldService } from '@/services/hunyuanWorldService'

describe.skip('HunyuanWorldService - Integration Tests (Real API)', () => {
  beforeEach(() => {
    // Reset client before each test
    hunyuanWorldService.resetClient()
  })

  it('should initialize and check service status', async () => {
    const status = await hunyuanWorldService.getServiceStatus()

    expect(status).toHaveProperty('available')
    expect(status).toHaveProperty('apiStatus')
    expect(status).toHaveProperty('activeJobs')

    console.log('Service status:', status)
  }, 30000) // 30 second timeout for network calls

  it('should validate service is available', () => {
    const available = hunyuanWorldService.isAvailable()
    expect(available).toBe(true)
  })

  it('should track active jobs', () => {
    const activeJobs = hunyuanWorldService.getActiveJobs()
    expect(Array.isArray(activeJobs)).toBe(true)
  })

  // This test actually generates a 3D model - only run manually
  it.skip('should generate a simple 3D preview (SLOW - Real API call)', async () => {
    const progressUpdates: string[] = []

    const result = await hunyuanWorldService.generatePreview(
      'A simple cube',
      (progress, status) => {
        console.log(`[${progress}%] ${status}`)
        progressUpdates.push(status)
      }
    )

    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    expect(result.startsWith('http')).toBe(true)
    expect(progressUpdates.length).toBeGreaterThan(0)

    console.log('Generated model URL:', result)
  }, 300000) // 5 minute timeout for actual generation
})

describe('HunyuanWorldService - Unit Tests (No External Calls)', () => {
  it('should be defined', () => {
    expect(hunyuanWorldService).toBeDefined()
  })

  it('should have required methods', () => {
    expect(typeof hunyuanWorldService.generateWorld).toBe('function')
    expect(typeof hunyuanWorldService.generatePreview).toBe('function')
    expect(typeof hunyuanWorldService.getServiceStatus).toBe('function')
    expect(typeof hunyuanWorldService.isAvailable).toBe('function')
    expect(typeof hunyuanWorldService.getActiveJobs).toBe('function')
    expect(typeof hunyuanWorldService.resetClient).toBe('function')
  })

  it('should reject generation without prompt or image', async () => {
    await expect(
      hunyuanWorldService.generateWorld({
        quality: 'fast',
        format: 'glb',
      } as any)
    ).rejects.toThrow(/prompt or image is required/i)
  })

  it('should return true for isAvailable', () => {
    expect(hunyuanWorldService.isAvailable()).toBe(true)
  })

  it('should initialize with no active jobs', () => {
    const jobs = hunyuanWorldService.getActiveJobs()
    expect(Array.isArray(jobs)).toBe(true)
    // Note: May have jobs from other tests, so just check it's an array
  })
})
