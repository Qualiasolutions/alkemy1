/**
 * Continuity Checking Service (Epic 1, Story 1.4)
 *
 * Detects continuity errors in timeline clips:
 * - Lighting jumps (brightness/color temperature changes)
 * - Costume changes (appearance inconsistencies)
 * - Spatial mismatches (screen direction violations)
 *
 * Storage Strategy:
 * - Dismissed warnings: localStorage (per-project)
 */

import { TimelineClip, ContinuityIssue, ContinuityIssueType, ContinuityIssueSeverity, ScriptAnalysis } from '../types';

// localStorage keys
const DISMISSED_WARNINGS_KEY = 'alkemy_continuity_dismissed_warnings';

/**
 * Run full continuity analysis on timeline clips
 * AC1: Continuity Analysis Capabilities
 */
export async function analyzeContinuity(
  timelineClips: TimelineClip[],
  scriptAnalysis: ScriptAnalysis | null,
  onProgress: (progress: number) => void
): Promise<ContinuityIssue[]> {
  if (!timelineClips || timelineClips.length < 2) {
    return [];
  }

  const issues: ContinuityIssue[] = [];
  const dismissedIds = getDismissedWarnings();

  onProgress(0);

  // Analyze adjacent clips for continuity issues
  for (let i = 0; i < timelineClips.length - 1; i++) {
    const clip1 = timelineClips[i];
    const clip2 = timelineClips[i + 1];

    // Skip if clips are from different scenes (no continuity required)
    if (clip1.sceneNumber !== null && clip2.sceneNumber !== null && clip1.sceneNumber !== clip2.sceneNumber) {
      continue;
    }

    // Detect lighting jumps
    const lightingIssue = await detectLightingJumps(clip1, clip2);
    if (lightingIssue && !dismissedIds.includes(lightingIssue.id)) {
      issues.push(lightingIssue);
    }

    // Detect costume changes (simplified - checks description keywords)
    const costumeIssue = await detectCostumeChanges(clip1, clip2, scriptAnalysis);
    if (costumeIssue && !dismissedIds.includes(costumeIssue.id)) {
      issues.push(costumeIssue);
    }

    // Detect spatial mismatches (simplified heuristic)
    const spatialIssue = await detectSpatialMismatches(clip1, clip2);
    if (spatialIssue && !dismissedIds.includes(spatialIssue.id)) {
      issues.push(spatialIssue);
    }

    onProgress(((i + 1) / (timelineClips.length - 1)) * 100);
  }

  onProgress(100);
  return issues;
}

/**
 * Detect lighting jumps between adjacent clips
 * AC1: Lighting consistency detection
 *
 * Note: This is a simplified heuristic-based implementation.
 * A production version would use computer vision to analyze actual pixel data.
 */
export async function detectLightingJumps(
  clip1: TimelineClip,
  clip2: TimelineClip
): Promise<ContinuityIssue | null> {
  // Heuristic: Check for lighting-related keywords in descriptions
  const lightingKeywords = ['dark', 'bright', 'dim', 'shadowy', 'sunny', 'golden hour', 'twilight', 'night', 'day', 'noon'];

  const desc1 = clip1.description.toLowerCase();
  const desc2 = clip2.description.toLowerCase();

  const hasLighting1 = lightingKeywords.some(kw => desc1.includes(kw));
  const hasLighting2 = lightingKeywords.some(kw => desc2.includes(kw));

  // Detect conflicting lighting descriptions
  const isDarkToLight = (desc1.includes('dark') || desc1.includes('night')) && (desc2.includes('bright') || desc2.includes('day') || desc2.includes('sunny'));
  const isLightToDark = (desc1.includes('bright') || desc1.includes('day') || desc1.includes('sunny')) && (desc2.includes('dark') || desc2.includes('night'));

  if (isDarkToLight || isLightToDark) {
    const sceneId = clip1.sceneNumber !== null ? `Scene ${clip1.sceneNumber}` : null;

    return {
      id: `lighting-${clip1.timelineId}-${clip2.timelineId}`,
      type: 'lighting-jump',
      severity: 'critical',
      clip1,
      clip2,
      sceneId,
      description: `Lighting jump detected between Shot ${clip1.shot_number || '?'} and Shot ${clip2.shot_number || '?'}${sceneId ? ` in ${sceneId}` : ''}. Lighting shifts from ${isDarkToLight ? 'dark to bright' : 'bright to dark'} without transition.`,
      suggestedFix: `Consider regenerating Shot ${clip2.shot_number || '?'} with consistent lighting from Shot ${clip1.shot_number || '?'}, or add a transition shot to smooth the lighting change.`,
      autoFixCommand: `regenerate-shot-${clip2.timelineId}-with-lighting-from-${clip1.timelineId}`,
      dismissed: false,
    };
  }

  return null;
}

/**
 * Detect costume changes between adjacent clips
 * AC1: Costume consistency detection
 *
 * Note: This is a simplified keyword-based implementation.
 * A production version would use CLIP embeddings for visual similarity.
 */
export async function detectCostumeChanges(
  clip1: TimelineClip,
  clip2: TimelineClip,
  scriptAnalysis: ScriptAnalysis | null
): Promise<ContinuityIssue | null> {
  // Heuristic: Check for clothing/appearance keywords in descriptions
  const costumeKeywords = ['wearing', 'dressed', 'outfit', 'shirt', 'pants', 'dress', 'coat', 'jacket', 'hat', 'red', 'blue', 'green', 'black', 'white'];

  const desc1 = clip1.description.toLowerCase();
  const desc2 = clip2.description.toLowerCase();

  const hasCostume1 = costumeKeywords.some(kw => desc1.includes(kw));
  const hasCostume2 = costumeKeywords.some(kw => desc2.includes(kw));

  // Extract color mentions
  const colors1 = extractColors(desc1);
  const colors2 = extractColors(desc2);

  // Detect color mismatches
  if (colors1.length > 0 && colors2.length > 0) {
    const hasConflict = colors1.some(c1 => colors2.some(c2 => c1 !== c2));

    if (hasConflict && hasCostume1 && hasCostume2) {
      const sceneId = clip1.sceneNumber !== null ? `Scene ${clip1.sceneNumber}` : null;

      return {
        id: `costume-${clip1.timelineId}-${clip2.timelineId}`,
        type: 'costume-change',
        severity: 'warning',
        clip1,
        clip2,
        sceneId,
        description: `Possible costume change between Shot ${clip1.shot_number || '?'} and Shot ${clip2.shot_number || '?'}${sceneId ? ` in ${sceneId}` : ''}. Color descriptions differ (${colors1.join(', ')} vs ${colors2.join(', ')}).`,
        suggestedFix: `Verify if this costume change is intentional. If not, regenerate Shot ${clip2.shot_number || '?'} with matching costume from Shot ${clip1.shot_number || '?'}.`,
        dismissed: false,
      };
    }
  }

  return null;
}

/**
 * Detect spatial mismatches (screen direction violations)
 * AC1: Spatial continuity detection
 *
 * Note: This is a simplified heuristic-based implementation.
 * A production version would use computer vision to detect character positions and movement.
 */
export async function detectSpatialMismatches(
  clip1: TimelineClip,
  clip2: TimelineClip
): Promise<ContinuityIssue | null> {
  // Heuristic: Check for directional keywords
  const desc1 = clip1.description.toLowerCase();
  const desc2 = clip2.description.toLowerCase();

  // Detect screen direction violations
  const exitsLeft1 = desc1.includes('exits left') || desc1.includes('walks left') || desc1.includes('moves left');
  const exitsRight1 = desc1.includes('exits right') || desc1.includes('walks right') || desc1.includes('moves right');
  const entersLeft2 = desc2.includes('enters left') || desc2.includes('enters from left');
  const entersRight2 = desc2.includes('enters right') || desc2.includes('enters from right');

  // Screen direction rule: exit left → should enter from right (and vice versa)
  if ((exitsLeft1 && entersLeft2) || (exitsRight1 && entersRight2)) {
    const sceneId = clip1.sceneNumber !== null ? `Scene ${clip1.sceneNumber}` : null;

    return {
      id: `spatial-${clip1.timelineId}-${clip2.timelineId}`,
      type: 'spatial-mismatch',
      severity: 'info',
      clip1,
      clip2,
      sceneId,
      description: `Spatial mismatch between Shot ${clip1.shot_number || '?'} and Shot ${clip2.shot_number || '?'}${sceneId ? ` in ${sceneId}` : ''}. Character exits ${exitsLeft1 ? 'left' : 'right'}, but next shot shows them entering from the ${entersLeft2 ? 'left' : 'right'} (should be ${exitsLeft1 ? 'right' : 'left'} for proper screen direction).`,
      suggestedFix: `Regenerate Shot ${clip2.shot_number || '?'} with character entering from ${exitsLeft1 ? 'right' : 'left'} to maintain screen direction continuity.`,
      dismissed: false,
    };
  }

  return null;
}

/**
 * Extract color keywords from description
 */
function extractColors(description: string): string[] {
  const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey'];
  return colors.filter(color => description.includes(color));
}

/**
 * Get dismissed warnings (localStorage per-project)
 * AC4: Correction Options - Track Dismissed Warnings
 */
export function getDismissedWarnings(): string[] {
  try {
    const stored = localStorage.getItem(DISMISSED_WARNINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Dismiss a warning
 * AC4: Correction Options - Manual Override
 */
export function dismissWarning(issueId: string, reason: string): void {
  const dismissed = getDismissedWarnings();
  if (!dismissed.includes(issueId)) {
    dismissed.push(issueId);
    localStorage.setItem(DISMISSED_WARNINGS_KEY, JSON.stringify(dismissed));
  }
}

/**
 * Clear all dismissed warnings (for testing or reset)
 */
export function clearDismissedWarnings(): void {
  localStorage.removeItem(DISMISSED_WARNINGS_KEY);
}

/**
 * Export continuity report as text summary
 * AC5: Continuity Report
 *
 * Note: PDF export would require a library like jsPDF (not included to keep bundle size small)
 */
export function generateContinuityReport(issues: ContinuityIssue[]): string {
  if (issues.length === 0) {
    return 'No continuity issues detected. Timeline looks good!';
  }

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  let report = `Continuity Analysis Report\n`;
  report += `==========================\n\n`;
  report += `Summary: ${issues.length} continuity issue${issues.length > 1 ? 's' : ''} detected\n`;
  report += `  - ${criticalCount} critical\n`;
  report += `  - ${warningCount} warning${warningCount > 1 ? 's' : ''}\n`;
  report += `  - ${infoCount} info\n\n`;
  report += `Detailed Issues:\n`;
  report += `================\n\n`;

  issues.forEach((issue, index) => {
    const severityIcon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
    report += `${index + 1}. ${severityIcon} ${issue.type.toUpperCase()}\n`;
    report += `   ${issue.description}\n`;
    report += `   Suggested Fix: ${issue.suggestedFix}\n\n`;
  });

  return report;
}
