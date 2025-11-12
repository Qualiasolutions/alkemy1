/**
 * Style Learning Service (Epic 1, Story 1.3)
 *
 * Tracks filmmaker creative patterns (shot types, lens choices, lighting, color grading)
 * and provides style-adapted suggestions based on learned preferences.
 *
 * Storage Strategy:
 * - Primary: Supabase `user_style_profiles` table (when configured)
 * - Fallback: localStorage (device-specific, no cloud sync)
 */

import { StyleProfile, StylePatterns, PatternType } from '../types';
import { supabase } from './supabase';

// localStorage keys
const STYLE_LEARNING_ENABLED_KEY = 'alkemy_style_learning_enabled';
const STYLE_PROFILE_KEY = 'alkemy_director_style_profile';
const STYLE_OPT_IN_SHOWN_KEY = 'alkemy_style_learning_opt_in_shown';

// Default empty patterns
const DEFAULT_PATTERNS: StylePatterns = {
  shotTypes: {},
  lensChoices: {},
  lighting: {},
  colorGrade: {},
  cameraMovement: {},
};

/**
 * Check if style learning is enabled (opt-in)
 */
export function isStyleLearningEnabled(): boolean {
  return localStorage.getItem(STYLE_LEARNING_ENABLED_KEY) === 'true';
}

/**
 * Enable or disable style learning
 */
export function setStyleLearningEnabled(enabled: boolean): void {
  localStorage.setItem(STYLE_LEARNING_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Check if opt-in prompt has been shown
 */
export function hasShownOptInPrompt(): boolean {
  return localStorage.getItem(STYLE_OPT_IN_SHOWN_KEY) === 'true';
}

/**
 * Mark opt-in prompt as shown
 */
export function setOptInPromptShown(): void {
  localStorage.setItem(STYLE_OPT_IN_SHOWN_KEY, 'true');
}

/**
 * Check if Supabase is configured (user is authenticated)
 */
async function isSupabaseConfigured(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return Boolean(session);
  } catch {
    return false;
  }
}

/**
 * Get current user ID (from Supabase session)
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Get style profile from Supabase or localStorage
 */
export async function getStyleProfile(): Promise<StyleProfile> {
  if (!isStyleLearningEnabled()) {
    throw new Error('Style learning is not enabled');
  }

  // Try Supabase first (if configured)
  if (await isSupabaseConfigured()) {
    const userId = await getCurrentUserId();
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('user_style_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (data && !error) {
          return {
            userId,
            patterns: data.patterns as StylePatterns,
            totalProjects: data.total_projects,
            totalShots: data.total_shots,
            lastUpdated: data.updated_at,
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.warn('Failed to fetch style profile from Supabase, falling back to localStorage', err);
      }
    }
  }

  // Fallback to localStorage
  const storedProfile = localStorage.getItem(STYLE_PROFILE_KEY);
  if (storedProfile) {
    try {
      return JSON.parse(storedProfile);
    } catch {
      console.warn('Failed to parse stored style profile, creating new one');
    }
  }

  // Create new profile
  const newProfile: StyleProfile = {
    userId: (await getCurrentUserId()) || 'local-user',
    patterns: DEFAULT_PATTERNS,
    totalProjects: 0,
    totalShots: 0,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  return newProfile;
}

/**
 * Save style profile to Supabase and/or localStorage
 */
async function saveStyleProfile(profile: StyleProfile): Promise<void> {
  // Save to localStorage (always, as fallback)
  localStorage.setItem(STYLE_PROFILE_KEY, JSON.stringify(profile));

  // Save to Supabase (if configured)
  if (await isSupabaseConfigured()) {
    const userId = await getCurrentUserId();
    if (userId) {
      try {
        await supabase
          .from('user_style_profiles')
          .upsert({
            user_id: userId,
            patterns: profile.patterns,
            total_projects: profile.totalProjects,
            total_shots: profile.totalShots,
            updated_at: profile.lastUpdated,
          });
      } catch (err) {
        console.warn('Failed to save style profile to Supabase', err);
      }
    }
  }
}

/**
 * Track a creative pattern (AC1: Creative Pattern Tracking)
 *
 * @param patternType - Type of pattern (shotType, lensChoice, lighting, colorGrade, cameraMovement)
 * @param value - Value of the pattern (e.g., "close-up", "50mm", "natural")
 * @param context - Optional context (e.g., shotType for lens choices)
 */
export async function trackPattern(
  patternType: PatternType,
  value: string,
  context?: { shotType?: string }
): Promise<void> {
  if (!isStyleLearningEnabled()) return;
  if (!value) return;

  try {
    const profile = await getStyleProfile();

    // Update patterns
    if (patternType === 'lensChoice' && context?.shotType) {
      // Lens choices are nested by shot type
      if (!profile.patterns.lensChoices[context.shotType]) {
        profile.patterns.lensChoices[context.shotType] = {};
      }
      const count = profile.patterns.lensChoices[context.shotType][value] || 0;
      profile.patterns.lensChoices[context.shotType][value] = count + 1;
    } else {
      // Other patterns are flat dictionaries
      const patternCategory = profile.patterns[patternType];
      const count = patternCategory[value] || 0;
      patternCategory[value] = count + 1;
    }

    // Update totals
    profile.totalShots += 1;
    profile.lastUpdated = new Date().toISOString();

    // Save profile
    await saveStyleProfile(profile);
  } catch (err) {
    console.error('Failed to track pattern:', err);
  }
}

/**
 * Get style-adapted suggestion based on learned patterns (AC3: Style-Adapted Suggestions)
 *
 * @param context - Context for suggestion (sceneEmotion, shotType, lighting)
 * @returns Personalized suggestion or null if no patterns learned
 */
export async function getStyleSuggestion(context: {
  sceneEmotion?: string;
  shotType?: string;
  lighting?: string;
}): Promise<string | null> {
  if (!isStyleLearningEnabled()) return null;

  try {
    const profile = await getStyleProfile();

    // Need at least 10 shots to provide meaningful suggestions
    if (profile.totalShots < 10) return null;

    const suggestions: string[] = [];

    // Suggest lens based on shot type
    if (context.shotType && profile.patterns.lensChoices[context.shotType]) {
      const lenses = profile.patterns.lensChoices[context.shotType];
      const mostUsedLens = Object.entries(lenses)
        .sort(([, a], [, b]) => b - a)[0];

      if (mostUsedLens) {
        const [lens, count] = mostUsedLens;
        const percentage = Math.round((count / profile.totalShots) * 100);
        suggestions.push(`You typically use ${lens} for ${context.shotType} shots (${percentage}% of the time)`);
      }
    }

    // Suggest lighting based on scene emotion
    if (context.sceneEmotion && profile.patterns.lighting) {
      const lightingTypes = Object.entries(profile.patterns.lighting)
        .sort(([, a], [, b]) => b - a);

      if (lightingTypes.length > 0) {
        const [mostUsedLighting, count] = lightingTypes[0];
        const percentage = Math.round((count / profile.totalShots) * 100);
        suggestions.push(`Based on your style, you favor ${mostUsedLighting} lighting (${percentage}% of your shots)`);
      }
    }

    // Suggest color grading
    if (profile.patterns.colorGrade) {
      const colorGrades = Object.entries(profile.patterns.colorGrade)
        .sort(([, a], [, b]) => b - a);

      if (colorGrades.length > 0) {
        const [mostUsedGrade, count] = colorGrades[0];
        const percentage = Math.round((count / profile.totalShots) * 100);
        suggestions.push(`Your color grading is usually ${mostUsedGrade} (${percentage}% of shots)`);
      }
    }

    return suggestions.length > 0 ? suggestions.join('\n\n') : null;
  } catch (err) {
    console.error('Failed to get style suggestion:', err);
    return null;
  }
}

/**
 * Reset style profile (clear all data) - AC5: Style Profile Management
 */
export async function resetStyleProfile(): Promise<void> {
  const userId = (await getCurrentUserId()) || 'local-user';

  const newProfile: StyleProfile = {
    userId,
    patterns: DEFAULT_PATTERNS,
    totalProjects: 0,
    totalShots: 0,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  await saveStyleProfile(newProfile);

  // Also delete from Supabase if configured
  if (await isSupabaseConfigured()) {
    const supabaseUserId = await getCurrentUserId();
    if (supabaseUserId) {
      try {
        await supabase
          .from('user_style_profiles')
          .delete()
          .eq('user_id', supabaseUserId);
      } catch (err) {
        console.warn('Failed to delete style profile from Supabase', err);
      }
    }
  }
}

/**
 * Export style profile as JSON - AC5: Style Profile Management
 */
export async function exportStyleProfile(): Promise<string> {
  const profile = await getStyleProfile();
  return JSON.stringify(profile, null, 2);
}

/**
 * Get summary stats for style learning badge - AC4: Style Learning Indicator
 */
export async function getStyleLearningSummary(): Promise<{ projectsAnalyzed: number; shotsTracked: number } | null> {
  if (!isStyleLearningEnabled()) return null;

  try {
    const profile = await getStyleProfile();
    return {
      projectsAnalyzed: profile.totalProjects,
      shotsTracked: profile.totalShots,
    };
  } catch {
    return null;
  }
}
