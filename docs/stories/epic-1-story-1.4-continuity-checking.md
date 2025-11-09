# Story 1.4: Continuity Checking and Feedback

**Epic**: Epic 1 - Director Agent Voice Enhancement
**PRD Reference**: Section 6, Epic 1, Story 1.4
**Status**: Not Started
**Priority**: Medium (V2.0 Enhancement)
**Estimated Effort**: 10 story points
**Dependencies**: None (can run in parallel with other Epic 1 stories)
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** the Director to identify continuity errors in my timeline,
**So that** I can fix issues before final render.

---

## Business Value

**Problem Statement**:
Filmmakers often miss continuity errors during production:
- **Lighting jumps** between shots in the same scene (bright → dark → bright)
- **Costume changes** that don't match (character wears blue, then red, then blue in consecutive shots)
- **Spatial mismatches** (character exits left, next shot they enter from left - should enter from right)
- **Screen direction violations** (180-degree rule breaks)

These errors are difficult to catch until final review, requiring costly reshoots or extensive post-production fixes. By the time they're discovered, it's often too late to regenerate shots easily.

**Value Proposition**:
Continuity checking enables proactive error detection:
- **Pre-render validation**: Catch errors before final export
- **AI-powered analysis**: Detect visual inconsistencies humans might miss
- **Actionable suggestions**: Director proposes fixes (e.g., "Regenerate Shot 12 with Scene 10 lighting settings")
- **Learning integration**: Style profile helps Director understand "intentional" vs. "error" deviations

**Success Metric**: >80% of continuity issues detected by Director are rated as "accurate/helpful" by filmmakers.

---

## Acceptance Criteria

### AC1: Continuity Analysis Capabilities
**Given** I have timeline clips from the same scene,
**When** the Director performs continuity analysis,
**Then** it should detect the following types of errors:

**1. Lighting Jumps**:
- Significant brightness changes between adjacent shots in the same scene
- Color temperature shifts (warm → cool → warm)
- Detection threshold: >20% brightness change OR >15% color temperature change

**2. Costume Changes**:
- Character appearance inconsistencies (color, style, accessories)
- Detection: CLIP embedding similarity <0.8 for same character across adjacent shots

**3. Spatial Mismatches**:
- Screen direction violations (character exits left, should enter from right)
- Impossible geography (character walks from A→B, next shot they're at C without transition)

**Verification**:
- Create test timeline with 3 intentional continuity errors (1 lighting, 1 costume, 1 spatial)
- Run continuity analysis
- Verify all 3 errors are detected

---

### AC2: Continuity Check Triggers
**Given** I am working on my project,
**When** continuity checks are triggered,
**Then** they should occur in the following scenarios:

**Automatic Triggers**:
1. **Pre-Render Validation**: Before export, Director runs full continuity analysis
2. **After Timeline Edits**: After adding/moving clips, Director runs analysis (debounced, 5-second delay)

**Manual Triggers**:
1. **Director Command**: "Check continuity" or "Analyze timeline"
2. **Button in Timeline**: "Check Continuity" button in timeline toolbar

**Non-Blocking**:
- All continuity checks run asynchronously (no UI blocking)
- Progress indicator during analysis
- Results appear when complete (no forced modal)

**Verification**:
- Add clip to timeline, verify analysis runs automatically after 5s
- Click export, verify pre-render analysis runs
- Type "Check continuity", verify manual analysis runs
- Click "Check Continuity" button, verify manual analysis runs

---

### AC3: Continuity Warnings in Director Chat
**Given** continuity issues are detected,
**When** I view the Director chat,
**Then** warnings should appear with the following format:

**Warning Structure**:
- **Severity Indicator**: 🔴 Critical, 🟡 Warning, 🔵 Info
- **Issue Type**: Lighting jump, costume change, spatial mismatch
- **Location**: Shot numbers and scene reference (e.g., "Shot 12 and Shot 13 - Scene 4")
- **Explanation**: Brief description of the issue
- **Suggested Fix**: Actionable recommendation (e.g., "Regenerate Shot 12 with Scene 10 lighting settings")

**Example Warnings**:
- 🔴 **Critical**: "Lighting jump between Shot 12 and Shot 13 in Scene 4. Shot 12 is 40% darker than Shot 13. Suggest regenerating Shot 12 with 'golden hour' lighting."
- 🟡 **Warning**: "Possible costume change for character 'Sarah' between Shot 5 and Shot 6. Sarah's shirt changes from blue to red. Intentional?"
- 🔵 **Info**: "Spatial mismatch: Character exits left in Shot 8, enters from left in Shot 9 (should enter from right for continuity)."

**Verification**:
- Create timeline with 1 critical, 1 warning, 1 info issue
- Run continuity check
- Verify all 3 appear in Director chat with correct severity and format

---

### AC4: Correction Options
**Given** a continuity warning is displayed,
**When** I interact with the warning,
**Then** I should see the following correction options:

**1. Director Suggests Fixes**:
- **One-Click Actions**: "Fix lighting", "Regenerate shot", "Apply Scene X settings"
- **Detailed Suggestion**: Director explains the fix (e.g., "I'll regenerate Shot 12 using the lighting settings from Shot 10 to match continuity")

**2. Manual Override**:
- **Dismiss Warning**: "Ignore this warning" (with reason dropdown: "Intentional", "Not an issue", "Will fix manually")
- **Track Dismissed Warnings**: Store in project state (don't re-warn)

**Verification**:
- Click "Fix lighting" → verify shot regeneration is queued with correct settings
- Click "Ignore this warning" → verify warning disappears and doesn't reappear
- Run continuity check again → verify dismissed warning is not re-reported

---

### AC5: Continuity Report
**Given** continuity analysis is complete,
**When** I request a continuity report,
**Then** I should see a summary view with:

**Report Contents**:
- **Summary**: "3 continuity issues detected (1 critical, 1 warning, 1 info)"
- **Detailed List**: All issues with:
  - Thumbnails of affected shots (side-by-side comparison)
  - Issue description
  - Suggested fix
  - Dismiss button
- **Export as PDF**: Download report for review/sharing

**Access Points**:
- Director command: "Show continuity report"
- Timeline toolbar: "Continuity Report" button
- Pre-render modal: "View Full Report" link

**Verification**:
- Run continuity check with 3 issues
- Type "Show continuity report"
- Verify report displays with summary + detailed list + thumbnails
- Click "Export as PDF", verify PDF downloads

---

### AC6: Visual Indicators in Timeline
**Given** continuity issues are detected,
**When** I view the timeline,
**Then** affected clips should have visual indicators:

**Timeline UI Enhancements**:
- **Warning Badge**: Small warning icon on clips with continuity issues
- **Hover Tooltip**: Hover over badge → see issue description
- **Click Action**: Click badge → jump to issue in Director chat or open report

**Badge Colors**:
- 🔴 Red badge: Critical issue
- 🟡 Yellow badge: Warning
- 🔵 Blue badge: Info

**Verification**:
- Add 3 clips with continuity issues to timeline
- Verify badges appear on affected clips
- Hover over badge, verify tooltip shows issue description
- Click badge, verify Director chat jumps to warning or report opens

---

### AC7: Integration with Style Learning
**Given** style learning is enabled (Story 1.3),
**When** the Director analyzes continuity,
**Then** it should consider learned style patterns:

**Style-Aware Analysis**:
- **Intentional Deviations**: If filmmaker consistently uses lighting jumps for dramatic effect, don't flag as error
- **Pattern Recognition**: If filmmaker always uses warm lighting for romantic scenes, flag cool lighting as potential error
- **Context-Aware Warnings**: "You typically use consistent lighting within scenes, but Scene 4 has a jump - intentional?"

**Verification**:
- Complete 2 projects with consistent lighting within scenes
- Start new project with intentional lighting jump for dramatic effect
- Run continuity check
- Verify Director asks "This is unusual for your style - intentional?" instead of flagging as critical error

---

### AC8: Performance - Non-Blocking Analysis
**Given** continuity analysis is running,
**When** I continue working on my project,
**Then** the analysis should not block the UI:

**Performance Requirements**:
- **Async Execution**: Analysis runs in background (Web Worker or async function)
- **Progress Indicator**: Visual feedback during analysis (progress bar, estimated time)
- **Interruptible**: I can cancel analysis if needed
- **No UI Freeze**: Timeline editing, clip playback, navigation remain responsive

**Verification**:
- Start continuity check on 30-minute project (100+ clips)
- Navigate to different tabs
- Edit timeline (add/remove clips)
- Verify no UI freeze or degraded performance
- Verify analysis completes in background

---

## Integration Verification

### IV1: Continuity Analysis Uses Existing Timeline Clip Data
**Requirement**: Continuity analysis uses existing timeline clip data (no schema changes to `TimelineClip` type).

**Verification Steps**:
1. Inspect `TimelineClip` type definition (types.ts)
2. Verify continuity analysis only reads existing fields:
   - `media` (image/video URLs for visual comparison)
   - `sceneId` (group clips by scene for analysis)
   - `frameId` (link to original frame data)
3. Verify no new required fields added to `TimelineClip`

**Expected Result**: `TimelineClip` type unchanged, continuity analysis is read-only.

---

### IV2: Suggestions Integrate With Command Execution
**Requirement**: Suggestions integrate with existing command execution workflow (Director can trigger regenerations).

**Verification Steps**:
1. Continuity warning appears: "Regenerate Shot 12 with Scene 10 lighting settings"
2. Click "Fix lighting" button
3. Verify `executeCommand()` is called with appropriate parameters
4. Verify shot regeneration workflow executes (same as manual command)

**Expected Result**: Continuity fixes use existing command infrastructure, no new execution paths.

---

### IV3: Continuity Checks Do Not Block Timeline Editing
**Requirement**: Continuity checks do not block timeline editing (async analysis with progress indicator).

**Verification Steps**:
1. Start continuity analysis on large project (100+ clips)
2. Immediately edit timeline (trim clip, add new clip, reorder)
3. Verify edits apply without delay
4. Verify analysis completes in background
5. Verify results appear when complete (no lost work)

**Expected Result**: Timeline editing remains responsive during analysis, no blocking operations.

---

## Migration/Compatibility

### MC1: Existing Projects Can Run Continuity Checks
**Requirement**: Existing projects can run continuity checks (no preparation required).

**Verification Steps**:
1. Load project created before continuity checking feature (from `.alkemy.json`)
2. Run continuity analysis
3. Verify analysis works (no errors, no missing data)
4. Verify warnings appear if issues exist

**Expected Result**: Continuity checking works with existing projects, no migration or data transformation required.

---

### MC2: Continuity Warnings Are Non-Blocking
**Requirement**: Continuity warnings are non-blocking (filmmaker can ignore and export anyway).

**Verification Steps**:
1. Run continuity check, detect 3 critical issues
2. Ignore all warnings (dismiss or just proceed)
3. Click export
4. Verify export proceeds without blocking confirmation modal
5. (Optional) Show warning toast: "3 continuity issues detected - export anyway?"

**Expected Result**: Filmmaker has final say, continuity warnings are suggestions not blockers.

---

## Technical Implementation Notes

### Service Layer Architecture

**New Service Module**: `services/continuityService.ts`

**Key Functions**:
```typescript
// Run full continuity analysis on timeline clips
export async function analyzeContinuity(
  timelineClips: TimelineClip[],
  scriptAnalysis: ScriptAnalysis,
  onProgress: (progress: number) => void
): Promise<ContinuityIssue[]>;

// Detect lighting jumps between adjacent clips
export async function detectLightingJumps(
  clip1: TimelineClip,
  clip2: TimelineClip
): Promise<ContinuityIssue | null>;

// Detect costume changes (CLIP embedding similarity)
export async function detectCostumeChanges(
  clip1: TimelineClip,
  clip2: TimelineClip,
  character: Character
): Promise<ContinuityIssue | null>;

// Detect spatial mismatches (screen direction, geography)
export async function detectSpatialMismatches(
  clip1: TimelineClip,
  clip2: TimelineClip
): Promise<ContinuityIssue | null>;

// Get dismissed warnings (don't re-report)
export function getDismissedWarnings(): string[]; // Array of issue IDs

// Dismiss a warning
export function dismissWarning(issueId: string, reason: string): void;

// Export continuity report as PDF
export async function exportContinuityReport(issues: ContinuityIssue[]): Promise<Blob>;
```

### Data Model

**ContinuityIssue Type** (add to `types.ts`):
```typescript
interface ContinuityIssue {
  id: string; // Unique ID for dismissal tracking
  type: 'lighting-jump' | 'costume-change' | 'spatial-mismatch';
  severity: 'critical' | 'warning' | 'info';
  clip1: TimelineClip; // First affected clip
  clip2: TimelineClip; // Second affected clip
  sceneId: string; // Scene where issue occurs
  description: string; // Human-readable description
  suggestedFix: string; // Actionable recommendation
  autoFixCommand?: string; // Optional command to auto-fix (e.g., "regenerate-shot")
  dismissed: boolean; // User dismissed this warning
  dismissalReason?: string; // "Intentional", "Not an issue", "Will fix manually"
}
```

### DirectorWidget Integration

**Component File**: `components/DirectorWidget.tsx` (extend existing component)

**New State**:
```typescript
const [continuityIssues, setContinuityIssues] = useState<ContinuityIssue[]>([]);
const [continuityAnalysisRunning, setContinuityAnalysisRunning] = useState<boolean>(false);
const [continuityAnalysisProgress, setContinuityAnalysisProgress] = useState<number>(0);
```

**New Commands**:
- "Check continuity" → trigger manual analysis
- "Show continuity report" → display summary view
- "Fix lighting" / "Regenerate shot" → execute suggested fix

### Timeline UI Integration

**Component File**: `tabs/FramesTab.tsx` (extend existing timeline)

**New UI Elements**:
- **Check Continuity Button**: Timeline toolbar, triggers manual analysis
- **Continuity Report Button**: Timeline toolbar, opens report modal
- **Warning Badges**: On timeline clips with issues (🔴🟡🔵)
- **Hover Tooltips**: Show issue description on badge hover

### Visual Analysis (AI/ML)

**Lighting Jump Detection**:
1. Extract representative frames from each clip (mid-point frame)
2. Convert to LAB color space
3. Calculate average brightness (L channel)
4. Calculate color temperature (A/B channels)
5. Compare adjacent clips:
   - Brightness delta >20% → lighting jump
   - Color temperature delta >15% → lighting jump

**Costume Change Detection** (CLIP embeddings):
1. Extract character crops from each clip (using character bounding box if available)
2. Generate CLIP image embeddings
3. Calculate cosine similarity between adjacent clips
4. Similarity <0.8 → potential costume change

**Spatial Mismatch Detection** (heuristic):
1. Analyze character position in frame (left, center, right)
2. Analyze character movement direction (if video)
3. Check screen direction consistency:
   - Exit left → should enter from right
   - Exit right → should enter from left
4. Flag violations

### Gemini API Integration

**AI-Powered Analysis** (for complex cases):
```typescript
// Use Gemini 2.0 Flash Thinking for continuity reasoning
const prompt = `Analyze these two consecutive shots for continuity errors:

Shot 1: ${clip1.prompt}
Shot 2: ${clip2.prompt}
Scene: ${scene.description}

Check for:
1. Lighting consistency
2. Costume consistency for character "${character.name}"
3. Spatial continuity (screen direction, geography)

Respond with JSON:
{
  "hasIssue": boolean,
  "issueType": "lighting-jump" | "costume-change" | "spatial-mismatch",
  "severity": "critical" | "warning" | "info",
  "description": string,
  "suggestedFix": string
}`;

const result = await askTheDirector(prompt, projectContext);
```

### localStorage Keys

**Continuity Preferences**:
- `alkemy_continuity_dismissed_warnings`: Array of dismissed issue IDs (per project)

### Performance Optimization

**Web Worker for Analysis** (if needed):
```typescript
// continuityWorker.ts
self.onmessage = async (e) => {
  const { clips, scriptAnalysis } = e.data;
  const issues = await analyzeContinuity(clips, scriptAnalysis, (progress) => {
    self.postMessage({ type: 'progress', progress });
  });
  self.postMessage({ type: 'complete', issues });
};
```

---

## Definition of Done

- [ ] Continuity analysis capabilities implemented (lighting jumps, costume changes, spatial mismatches)
- [ ] Continuity check triggers working (automatic pre-render, after timeline edits, manual command/button)
- [ ] Continuity warnings display in Director chat (severity indicators, issue descriptions, suggested fixes)
- [ ] Correction options functional (one-click fixes, dismiss with reason, dismissed warnings tracked)
- [ ] Continuity report implemented (summary, detailed list with thumbnails, PDF export)
- [ ] Visual indicators in timeline (warning badges on clips, hover tooltips, click actions)
- [ ] Style learning integration (style-aware analysis, context-aware warnings)
- [ ] Performance optimized (async analysis, no UI blocking, <5s for 30-min project)
- [ ] Integration verification complete (uses existing timeline data, integrates with command execution, non-blocking)
- [ ] Migration/compatibility verified (existing projects work, warnings are non-blocking)
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Dismissed warnings persist across sessions (localStorage per project)
- [ ] Code reviewed and approved by engineering lead
- [ ] User acceptance testing with 5+ filmmakers (>80% "accurate/helpful" target)
- [ ] CLAUDE.md updated with continuity checking documentation

---

## Dependencies

### Prerequisite
- None (can run in parallel with other Epic 1 stories)

### Related Stories
- **Story 1.1** (Voice Input): "Check continuity" voice command
- **Story 1.2** (Voice Output): Speak continuity warnings
- **Story 1.3** (Style Learning): Style-aware continuity analysis

### External Dependencies
- CLIP embeddings for costume change detection (Gemini vision API or local CLIP model)
- Gemini 2.0 Flash Thinking for complex continuity reasoning (optional, for advanced cases)
- PDF generation library for continuity report export (e.g., jsPDF)

---

## Testing Strategy

### Unit Tests
- `continuityService.ts` functions (detectLightingJumps, detectCostumeChanges, detectSpatialMismatches)
- Issue severity classification logic
- Dismissed warnings tracking (localStorage read/write)

### Integration Tests
- Full continuity analysis workflow (timeline → analysis → warnings → fixes)
- Auto-fix command execution (suggested fix → regeneration)
- Style learning integration (intentional deviations vs. errors)

### End-to-End Tests (Playwright)
- Create timeline with 3 continuity errors
- Run continuity check (manual + automatic triggers)
- Verify all 3 errors detected and displayed
- Test correction workflow (one-click fix, dismiss)
- Export continuity report (PDF download)

### Manual Testing
- User acceptance testing (5+ filmmakers, accuracy rating)
- False positive/negative analysis (precision/recall metrics)
- Style-aware analysis validation (intentional deviations correctly identified)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 1, Story 1.4
- **Architecture**: `docs/brownfield-architecture.md` - Timeline architecture, AI service patterns
- **Existing Component**: `tabs/FramesTab.tsx` - Timeline editing UI
- **Timeline Type**: `types.ts` - `TimelineClip` data model
- **AI Service**: `services/aiService.ts` - `askTheDirector()` for complex continuity reasoning
- **Story 1.3**: Style Learning (for style-aware analysis)

---

**END OF STORY**

*Next Steps: Assign to development team for implementation (can run in parallel with other Epic 1 stories).*
