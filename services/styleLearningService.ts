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
import { userDataService } from './userDataService';

// Temporary cache for non-authenticated users (in-memory only)
let styleLearningEnabledCache: boolean | null = null;
let styleOptInShownCache: boolean | null = null;
let styleProfileCache: StyleProfile | null = null;

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
 * @param userId - Optional user ID for database lookup
 */
export async function isStyleLearningEnabled(userId?: string): Promise<boolean> {
  // For authenticated users, use database
  if (userId) {
    const prefs = await userDataService.getUserPreferences(userId);
    return prefs.styleLearningEnabled || false;
  }

  // For anonymous users, use in-memory cache
  return styleLearningEnabledCache || false;
}

/**
 * Enable or disable style learning
 * @param enabled - Enable or disable style learning
 * @param userId - Optional user ID for database persistence
 */
export async function setStyleLearningEnabled(enabled: boolean, userId?: string): Promise<void> {
  // For authenticated users, persist to database
  if (userId) {
    await userDataService.updatePreference(userId, 'styleLearningEnabled', enabled);
  } else {
    // For anonymous users, use in-memory cache only
    styleLearningEnabledCache = enabled;
  }
}

/**
 * Check if opt-in prompt has been shown
 * @param userId - Optional user ID for database lookup
 */
export async function hasShownOptInPrompt(userId?: string): Promise<boolean> {
  // For authenticated users, use database
  if (userId) {
    const prefs = await userDataService.getUserPreferences(userId);
    return prefs.styleOptInShown || false;
  }

  // For anonymous users, use in-memory cache
  return styleOptInShownCache || false;
}

/**
 * Mark opt-in prompt as shown
 * @param userId - Optional user ID for database persistence
 */
export async function setOptInPromptShown(userId?: string): Promise<void> {
  // For authenticated users, persist to database
  if (userId) {
    await userDataService.updatePreference(userId, 'styleOptInShown', true);
  } else {
    // For anonymous users, use in-memory cache only
    styleOptInShownCache = true;
  }
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
 * Get style profile from Supabase or cache
 */
export async function getStyleProfile(userId?: string): Promise<StyleProfile> {
  const enabledCheck = await isStyleLearningEnabled(userId);
  if (!enabledCheck) {
    throw new Error('Style learning is not enabled');
  }

  // Try Supabase first (if configured)
  if (await isSupabaseConfigured()) {
    const supabaseUserId = userId || await getCurrentUserId();
    if (supabaseUserId) {
      try {
        const { data, error } = await supabase
          .from('user_style_profiles')
          .select('*')
          .eq('user_id', supabaseUserId)
          .maybeSingle();

        if (data && !error) {
          return {
            userId: supabaseUserId,
            patterns: data.patterns as StylePatterns,
            totalProjects: data.total_projects,
            totalShots: data.total_shots,
            lastUpdated: data.updated_at,
            createdAt: data.created_at,
          };
        }

        // No profile exists yet - this is fine, we'll create one below
      } catch (err) {
        console.warn('Failed to fetch style profile from Supabase, using cache', err);
      }
    }
  }

  // For anonymous users, use in-memory cache
  if (styleProfileCache) {
    return styleProfileCache;
  }

  // Create new profile (fresh copy of patterns to avoid shared object mutation)
  const newProfile: StyleProfile = {
    userId: userId || (await getCurrentUserId()) || 'local-user',
    patterns: {
      shotTypes: {},
      lensChoices: {},
      lighting: {},
      colorGrade: {},
      cameraMovement: {},
    },
    totalProjects: 0,
    totalShots: 0,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  // Cache for anonymous users
  if (!userId) {
    styleProfileCache = newProfile;
  }

  return newProfile;
}

/**
 * Save style profile to Supabase and/or cache
 */
async function saveStyleProfile(profile: StyleProfile): Promise<void> {
  // For anonymous users, save to cache
  if (!profile.userId || profile.userId === 'local-user') {
    styleProfileCache = profile;
    return;
  }

  // Save to Supabase (if configured)
  if (await isSupabaseConfigured()) {
    const userId = profile.userId || await getCurrentUserId();
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
        // Fall back to cache on error
        styleProfileCache = profile;
      }
    }
  } else {
    // No Supabase, use cache
    styleProfileCache = profile;
  }
}

/**
 * Track a creative pattern (AC1: Creative Pattern Tracking)
 *
 * @param patternType - Type of pattern (shotType, lensChoice, lighting, colorGrade, cameraMovement)
 * @param value - Value of the pattern (e.g., "close-up", "50mm", "natural")
 * @param context - Optional context (e.g., shotType for lens choices)
 * @param userId - Optional user ID for database operations
 */
export async function trackPattern(
  patternType: PatternType,
  value: string,
  context?: { shotType?: string },
  userId?: string
): Promise<void> {
  const enabled = await isStyleLearningEnabled(userId);
  if (!enabled) return;
  if (!value) return;

  try {
    const profile = await getStyleProfile(userId);

    // Update patterns
    if (patternType === 'lensChoice' && context?.shotType) {
      // Lens choices are nested by shot type
      // Initialize lensChoices object if not present (defensive)
      if (!profile.patterns.lensChoices) {
        profile.patterns.lensChoices = {};
      }
      if (!profile.patterns.lensChoices[context.shotType]) {
        profile.patterns.lensChoices[context.shotType] = {};
      }
      const count = profile.patterns.lensChoices[context.shotType][value] || 0;
      profile.patterns.lensChoices[context.shotType][value] = count + 1;
    } else {
      // Other patterns are flat dictionaries
      const patternCategory = profile.patterns[patternType];
      if (!patternCategory) {
        console.warn(`Pattern category '${patternType}' not found in profile, skipping tracking`);
        return;
      }
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
 * @param userId - Optional user ID for database lookup
 * @returns Personalized suggestion or null if no patterns learned
 */
export async function getStyleSuggestion(context: {
  sceneEmotion?: string;
  shotType?: string;
  lighting?: string;
}, userId?: string): Promise<string | null> {
  const enabled = await isStyleLearningEnabled(userId);
  if (!enabled) return null;

  try {
    const profile = await getStyleProfile(userId);

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

    // Suggest lighting based on scene emotion or lighting context
    if ((context.sceneEmotion || context.lighting) && profile.patterns.lighting) {
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
    patterns: {
      shotTypes: {},
      lensChoices: {},
      lighting: {},
      colorGrade: {},
      cameraMovement: {},
    },
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
 * @param userId - Optional user ID for database lookup
 */
export async function exportStyleProfile(userId?: string): Promise<string> {
  const profile = await getStyleProfile(userId);
  return JSON.stringify(profile, null, 2);
}

/**
 * Get summary stats for style learning badge - AC4: Style Learning Indicator
 * @param userId - Optional user ID for database lookup
 */
export async function getStyleLearningSummary(userId?: string): Promise<{ projectsAnalyzed: number; shotsTracked: number } | null> {
  const enabled = await isStyleLearningEnabled(userId);
  if (!enabled) return null;

  try {
    const profile = await getStyleProfile(userId);
    return {
      projectsAnalyzed: profile.totalProjects,
      shotsTracked: profile.totalShots,
    };
  } catch {
    return null;
  }
}
