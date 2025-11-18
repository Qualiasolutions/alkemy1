/**
 * QA Tests for Epic 1 Stories 1.3 and 1.4
 *
 * Story 1.3: Style Learning & Personalization
 * Story 1.4: Continuity Checking and Feedback
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isStyleLearningEnabled,
  setStyleLearningEnabled,
  hasShownOptInPrompt,
  setOptInPromptShown,
  trackPattern,
  getStyleProfile,
  getStyleSuggestion,
  resetStyleProfile,
  exportStyleProfile,
  getStyleLearningSummary,
} from './services/styleLearningService';

import {
  analyzeContinuity,
  detectLightingJumps,
  detectCostumeChanges,
  detectSpatialMismatches,
  getDismissedWarnings,
  dismissWarning,
  clearDismissedWarnings,
  generateContinuityReport,
} from './services/continuityService';

import { TimelineClip } from './types';

describe('Epic 1 Story 1.3: Style Learning & Personalization', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('AC6: Privacy Controls (Opt-in System)', () => {
    it('should default to style learning disabled', async () => {
      expect(await isStyleLearningEnabled()).toBe(false);
    });

    it('should allow enabling style learning', async () => {
      await setStyleLearningEnabled(true);
      expect(await isStyleLearningEnabled()).toBe(true);
    });

    it('should allow disabling style learning', async () => {
      await setStyleLearningEnabled(true);
      await setStyleLearningEnabled(false);
      expect(await isStyleLearningEnabled()).toBe(false);
    });

    it('should track if opt-in prompt has been shown', async () => {
      expect(await hasShownOptInPrompt()).toBe(false);
      await setOptInPromptShown();
      expect(await hasShownOptInPrompt()).toBe(true);
    });
  });

  describe('AC1: Creative Pattern Tracking', () => {
    beforeEach(async () => {
      await setStyleLearningEnabled(true);
    });

    it('should track shot type patterns', async () => {
      await trackPattern('shotTypes', 'close-up');
      await trackPattern('shotTypes', 'close-up');
      await trackPattern('shotTypes', 'wide-shot');

      const profile = await getStyleProfile();
      expect(profile.patterns.shotTypes['close-up']).toBe(2);
      expect(profile.patterns.shotTypes['wide-shot']).toBe(1);
      expect(profile.totalShots).toBe(3);
    });

    it('should track lens choices by shot type', async () => {
      await trackPattern('lensChoice', '50mm', { shotType: 'close-up' });
      await trackPattern('lensChoice', '85mm', { shotType: 'close-up' });
      await trackPattern('lensChoice', '50mm', { shotType: 'close-up' });

      const profile = await getStyleProfile();
      expect(profile.patterns.lensChoices['close-up']['50mm']).toBe(2);
      expect(profile.patterns.lensChoices['close-up']['85mm']).toBe(1);
    });

    it('should track lighting patterns', async () => {
      await trackPattern('lighting', 'natural');
      await trackPattern('lighting', 'natural');
      await trackPattern('lighting', 'low-key');

      const profile = await getStyleProfile();
      expect(profile.patterns.lighting['natural']).toBe(2);
      expect(profile.patterns.lighting['low-key']).toBe(1);
    });

    it('should not track patterns when style learning is disabled', async () => {
      setStyleLearningEnabled(false);
      await trackPattern('shotTypes', 'close-up');

      const profile = await getStyleProfile().catch(() => null);
      expect(profile).toBeNull();
    });
  });

  describe('AC3: Style-Adapted Suggestions', () => {
    beforeEach(async () => {
      await setStyleLearningEnabled(true);
      // Track enough patterns to get suggestions (>10 shots)
      for (let i = 0; i < 12; i++) {
        await trackPattern('shotTypes', 'close-up');
        await trackPattern('lensChoice', '50mm', { shotType: 'close-up' });
        await trackPattern('lighting', 'natural');
      }
    });

    it('should provide suggestions when enough data exists', async () => {
      const suggestion = await getStyleSuggestion({
        shotType: 'close-up',
        lighting: 'natural',
      });

      expect(suggestion).toBeTruthy();
      expect(suggestion).toContain('50mm');
      expect(suggestion).toContain('natural');
    });

    it('should return null when insufficient data (<10 shots)', async () => {
      await resetStyleProfile();
      await setStyleLearningEnabled(true);

      await trackPattern('shotTypes', 'close-up');
      const suggestion = await getStyleSuggestion({ shotType: 'close-up' });

      expect(suggestion).toBeNull();
    });
  });

  describe('AC5: Style Profile Management', () => {
    beforeEach(async () => {
      await setStyleLearningEnabled(true);
      await trackPattern('shotTypes', 'close-up');
      await trackPattern('lighting', 'natural');
    });

    it('should reset style profile', async () => {
      await resetStyleProfile();
      const profile = await getStyleProfile();

      expect(profile.totalShots).toBe(0);
      expect(profile.patterns.shotTypes).toEqual({});
    });

    it('should export style profile as JSON', async () => {
      const exported = await exportStyleProfile();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty('userId');
      expect(parsed).toHaveProperty('patterns');
      expect(parsed).toHaveProperty('totalShots');
    });
  });

  describe('AC4: Style Learning Indicator', () => {
    beforeEach(async () => {
      await resetStyleProfile(); // Clear profile first for test isolation
      await setStyleLearningEnabled(true);
      await trackPattern('shotTypes', 'close-up');
    });

    it('should provide summary stats for badge', async () => {
      const summary = await getStyleLearningSummary();

      expect(summary).toBeTruthy();
      expect(summary?.shotsTracked).toBe(1);
    });

    it('should return null when style learning disabled', async () => {
      await setStyleLearningEnabled(false);
      const summary = await getStyleLearningSummary();

      expect(summary).toBeNull();
    });
  });
});

describe('Epic 1 Story 1.4: Continuity Checking', () => {
  const createMockClip = (id: string, sceneNumber: number, description: string, shotNumber: number): TimelineClip => ({
    id,
    timelineId: `timeline-${id}`,
    sceneNumber,
    shot_number: shotNumber,
    description,
    url: `https://example.com/${id}.mp4`,
    sourceDuration: 5,
    trimStart: 0,
    trimEnd: 5,
  });

  beforeEach(() => {
    clearDismissedWarnings();
  });

  describe('AC1: Lighting Jump Detection', () => {
    it('should detect dark-to-bright lighting jumps', async () => {
      const clip1 = createMockClip('1', 1, 'Dark night scene with character', 1);
      const clip2 = createMockClip('2', 1, 'Bright sunny day outdoors', 2);

      const issue = await detectLightingJumps(clip1, clip2);

      expect(issue).toBeTruthy();
      expect(issue?.type).toBe('lighting-jump');
      expect(issue?.severity).toBe('critical');
      expect(issue?.description).toContain('dark to bright');
    });

    it('should detect bright-to-dark lighting jumps', async () => {
      const clip1 = createMockClip('1', 1, 'Bright sunny afternoon', 1);
      const clip2 = createMockClip('2', 1, 'Dark shadowy room at night', 2);

      const issue = await detectLightingJumps(clip1, clip2);

      expect(issue).toBeTruthy();
      expect(issue?.type).toBe('lighting-jump');
      expect(issue?.description).toContain('bright to dark');
    });

    it('should not flag consistent lighting', async () => {
      const clip1 = createMockClip('1', 1, 'Bright sunny day', 1);
      const clip2 = createMockClip('2', 1, 'Bright sunny afternoon', 2);

      const issue = await detectLightingJumps(clip1, clip2);

      expect(issue).toBeNull();
    });
  });

  describe('AC1: Costume Change Detection', () => {
    it('should detect costume color changes', async () => {
      const clip1 = createMockClip('1', 1, 'Character wearing red shirt', 1);
      const clip2 = createMockClip('2', 1, 'Character wearing blue jacket', 2);

      const issue = await detectCostumeChanges(clip1, clip2, null);

      expect(issue).toBeTruthy();
      expect(issue?.type).toBe('costume-change');
      expect(issue?.severity).toBe('warning');
      expect(issue?.description).toContain('costume change');
    });

    it('should not flag non-costume descriptions', async () => {
      const clip1 = createMockClip('1', 1, 'Wide establishing shot of city', 1);
      const clip2 = createMockClip('2', 1, 'Close-up of building', 2);

      const issue = await detectCostumeChanges(clip1, clip2, null);

      expect(issue).toBeNull();
    });
  });

  describe('AC1: Spatial Mismatch Detection', () => {
    it('should detect screen direction violations (exit left, enter left)', async () => {
      const clip1 = createMockClip('1', 1, 'Character exits left', 1);
      const clip2 = createMockClip('2', 1, 'Character enters from left', 2);

      const issue = await detectSpatialMismatches(clip1, clip2);

      expect(issue).toBeTruthy();
      expect(issue?.type).toBe('spatial-mismatch');
      expect(issue?.severity).toBe('info');
      expect(issue?.description).toContain('Spatial mismatch');
    });

    it('should not flag correct screen direction (exit left, enter right)', async () => {
      const clip1 = createMockClip('1', 1, 'Character exits left', 1);
      const clip2 = createMockClip('2', 1, 'Character enters from right', 2);

      const issue = await detectSpatialMismatches(clip1, clip2);

      expect(issue).toBeNull();
    });
  });

  describe('AC1: Full Timeline Analysis', () => {
    it('should analyze timeline and detect multiple issues', async () => {
      const clips: TimelineClip[] = [
        createMockClip('1', 1, 'Bright day scene', 1),
        createMockClip('2', 1, 'Dark night scene', 2), // Lighting jump
        createMockClip('3', 1, 'Bright day scene', 3), // Another lighting jump
      ];

      const issues = await analyzeContinuity(clips, null, () => {});

      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(i => i.type === 'lighting-jump')).toBe(true);
    });

    it('should not analyze clips from different scenes', async () => {
      const clips: TimelineClip[] = [
        createMockClip('1', 1, 'Bright day scene', 1),
        createMockClip('2', 2, 'Dark night scene', 2), // Different scene
      ];

      const issues = await analyzeContinuity(clips, null, () => {});

      expect(issues.length).toBe(0); // No issues across scenes
    });
  });

  describe('AC4: Dismissed Warnings Tracking', () => {
    it('should track dismissed warnings', () => {
      dismissWarning('issue-1', 'Intentional');
      const dismissed = getDismissedWarnings();

      expect(dismissed).toContain('issue-1');
    });

    it('should not re-report dismissed warnings', async () => {
      const clips: TimelineClip[] = [
        createMockClip('1', 1, 'Bright day scene', 1),
        createMockClip('2', 1, 'Dark night scene', 2),
      ];

      const issues1 = await analyzeContinuity(clips, null, () => {});
      expect(issues1.length).toBeGreaterThan(0);

      // Dismiss first issue
      dismissWarning(issues1[0].id, 'Intentional');

      // Re-run analysis
      const issues2 = await analyzeContinuity(clips, null, () => {});

      // Should have fewer issues (dismissed one not included)
      expect(issues2.length).toBe(issues1.length - 1);
    });

    it('should clear dismissed warnings', () => {
      dismissWarning('issue-1', 'Intentional');
      clearDismissedWarnings();
      const dismissed = getDismissedWarnings();

      expect(dismissed).toEqual([]);
    });
  });

  describe('AC5: Continuity Report Generation', () => {
    it('should generate text report with summary', async () => {
      const clips: TimelineClip[] = [
        createMockClip('1', 1, 'Bright day scene', 1),
        createMockClip('2', 1, 'Dark night scene', 2),
      ];

      const issues = await analyzeContinuity(clips, null, () => {});
      const report = generateContinuityReport(issues);

      expect(report).toContain('Continuity Analysis Report');
      expect(report).toContain('Summary');
      expect(report).toContain('critical');
    });

    it('should handle zero issues gracefully', () => {
      const report = generateContinuityReport([]);

      expect(report).toContain('No continuity issues detected');
    });
  });
});
