---
last_sync: '2025-11-21T10:29:36.936Z'
auto_sync: true
---
# Story 1.3: Style Learning and Personalization

**Epic**: Epic 1 - Director Agent Voice Enhancement
**PRD Reference**: Section 6, Epic 1, Story 1.3
**Status**: Not Started
**Priority**: Medium (V2.0 Enhancement)
**Estimated Effort**: 8 story points
**Dependencies**: None (can run in parallel with Stories 1.1-1.2)
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** the Director to learn my creative preferences,
**So that** suggestions improve over time and match my style.

---

## Business Value

**Problem Statement**:
The Director Agent currently provides generic cinematography advice without understanding individual filmmaker preferences. Every user receives identical suggestions regardless of their creative style, genre focus, or recurring patterns. This forces filmmakers to repeatedly specify preferences (e.g., "I prefer 50mm for close-ups") and ignore irrelevant suggestions.

**Value Proposition**:
Style learning enables personalized guidance, allowing the Director to:
- Recognize a filmmaker's recurring shot preferences (lens choices, camera angles, lighting patterns)
- Suggest shortcuts based on learned patterns ("You typically use warm lighting for romantic scenes")
- Highlight deviations that might be unintentional ("This is your first wide shot in this scene - intentional?")
- Provide context-aware advice that aligns with the filmmaker's established style

**Success Metric**: >60% of filmmakers who complete 3+ projects report that Director suggestions "match their style" (post-project survey).

---

## Acceptance Criteria

### AC1: Creative Pattern Tracking
**Given** I am working on a project,
**When** I make creative decisions (shot types, lens choices, lighting, color grading),
**Then** the Director should track the following patterns:
- **Shot Type Frequency**: Close-ups, wide shots, medium shots, over-the-shoulder, etc.
- **Lens Choices**: Preferred focal lengths (24mm, 50mm, 85mm, etc.) for each shot type
- **Lighting Patterns**: Low-key, high-key, natural, studio, golden hour, etc.
- **Color Grade Preferences**: Warm, cool, desaturated, vibrant, film-like, etc.
- **Camera Movement**: Dolly, crane, tracking shots, static shots, handheld, etc.

**Data Tracked Per Project**:
```json
{
  "projectId": "abc123",
  "userId": "user456",
  "patterns": {
    "shotTypes": {
      "close-up": 45,
      "wide": 12,
      "medium": 28,
      "over-the-shoulder": 8
    },
    "lensChoices": {
      "close-up": { "50mm": 30, "85mm": 15 },
      "wide": { "24mm": 10, "35mm": 2 }
    },
    "lighting": {
      "natural": 35,
      "low-key": 20,
      "high-key": 10
    },
    "colorGrade": {
      "warm": 40,
      "desaturated": 15
    }
  },
  "lastUpdated": "2025-11-09T12:00:00Z"
}
```

**Verification**:
- Generate 20 shots with varying parameters
- Query style profile data
- Verify patterns are accurately tracked

---

### AC2: Style Profile Data Storage
**Given** style learning is enabled,
**When** creative patterns are tracked,
**Then** the data should be stored as follows:

**When Supabase is configured**:
- Store in `user_style_profiles` table (schema TBD, see Technical Notes)
- Cloud sync across devices
- Persist across projects

**When Supabase is NOT configured** (localStorage-only mode):
- Store in localStorage under key: `alkemy_director_style_profile`
- Local-only, per-device
- No cloud sync

**Verification**:
- Test with Supabase configured (verify database row created)
- Test without Supabase (verify localStorage key created)
- Verify data persists across browser refresh

---

### AC3: Style-Adapted Suggestions
**Given** the Director has tracked creative patterns across 1+ projects,
**When** I ask for creative advice or the Director provides suggestions,
**Then** the suggestions should reference learned patterns:

**Example Suggestions**:
- "You typically use 50mm for close-ups in this project"
- "Based on your style, I recommend warm lighting for this romantic scene"
- "You've used natural lighting in 80% of your shots - would you like to continue that pattern?"
- "This is your first wide shot in this scene - intentional, or should we add more variety?"
- "Your color grading is usually warm, but this shot feels cool - is that the look you want?"

**Verification**:
- Complete 1 project with 20+ shots
- Ask Director for suggestions in new project
- Verify at least 2 suggestions reference learned patterns

---

### AC4: Style Learning Indicator
**Given** style learning is enabled,
**When** I view the DirectorWidget,
**Then** I should see a style learning status indicator in the widget header:
- **Badge Text**: "Learning your style: 12 projects analyzed"
- **Tooltip**: Explains what data is tracked ("Shot types, lens choices, lighting, color grading")
- **Color**: Subtle badge (not intrusive), e.g., light blue background

**Verification**:
- Complete 3 projects
- Verify badge shows "Learning your style: 3 projects analyzed"
- Hover over badge, verify tooltip appears

---

### AC5: Style Profile Management
**Given** I want to view or manage my style profile,
**When** I access the DirectorWidget settings menu,
**Then** I should see the following options:
- **View Style Profile**: Opens modal with stats and patterns
- **Reset Style Profile**: Clears all learned data (with confirmation dialog)
- **Export Style Profile**: Downloads JSON file with all data

**Style Profile Modal Contents**:
- **Summary Stats**: Total projects analyzed, total shots tracked
- **Shot Type Distribution**: Pie chart or bar chart
- **Preferred Lenses**: Table showing focal length preferences per shot type
- **Lighting Patterns**: Distribution chart
- **Color Grade Preferences**: Distribution chart

**Verification**:
- Click "View Style Profile"
- Verify modal opens with all tracked data
- Test reset (confirm data is cleared)
- Test export (verify JSON file downloads)

---

### AC6: Privacy Controls
**Given** style learning is a privacy-sensitive feature,
**When** I first launch the app after the feature is deployed,
**Then** I should see a one-time opt-in prompt:

**Prompt Content**:
- **Title**: "Help the Director Learn Your Style?"
- **Description**: "The Director can track your creative patterns (shot types, lens choices, lighting) to provide personalized suggestions. This data is stored [locally/in your account] and never shared."
- **Options**:
  - **Enable Style Learning** (primary button)
  - **No Thanks** (secondary button, can enable later in settings)
- **Checkbox**: "Don't show this again"

**Privacy Features**:
- Clear explanation of what data is collected
- Opt-in (not opt-out) by default
- Option to disable in settings at any time
- Local-only mode (no cloud sync if user prefers)

**Verification**:
- Launch app in fresh browser session
- Verify opt-in prompt appears once
- Verify selection persists (localStorage: `alkemy_style_learning_enabled`)

---

### AC7: Style Learning Across Projects
**Given** I have completed multiple projects,
**When** the Director analyzes my overall style,
**Then** it should aggregate patterns across all projects:
- **Cross-Project Patterns**: Consistent preferences across projects (e.g., "You always use warm lighting for romantic scenes")
- **Project-Specific Patterns**: Unique patterns per project (e.g., "In this project, you're using more wide shots than usual")
- **Trend Analysis**: Evolution of style over time (e.g., "You've been using more 85mm lately")

**Verification**:
- Complete 3 projects with different styles
- Ask Director "What's my overall style?"
- Verify response references cross-project patterns

---

### AC8: Performance - Low Overhead
**Given** style learning is enabled,
**When** I use the Director Agent,
**Then** pattern tracking should have minimal performance impact:
- **Tracking Overhead**: <50ms per command execution (NFR from PRD)
- **No UI Blocking**: Pattern tracking runs asynchronously
- **Memory Usage**: <5MB additional memory for style profile data

**Verification**:
- Benchmark Director response time with/without style learning
- Verify <50ms difference
- Monitor memory usage during 100 command executions

---

## Integration Verification

### IV1: Tracking Does Not Impact Command Execution
**Requirement**: Style tracking does not impact existing command execution performance (<50ms overhead per command).

**Verification Steps**:
1. Benchmark Director command execution time (baseline, without style learning)
2. Enable style learning
3. Execute 100 commands (shot generation, technical queries, creative advice)
4. Measure average execution time
5. Verify overhead <50ms

**Expected Result**: Minimal performance impact, no user-noticeable delays.

---

### IV2: Style Data Integrates With Project State Serialization
**Requirement**: New style data integrates with existing project state serialization (no breaking changes to `.alkemy.json` format).

**Verification Steps**:
1. Complete project with style learning enabled
2. Download project as `.alkemy.json` file
3. Load project in fresh browser session
4. Verify style profile data is NOT included in project file (it's user-level, not project-level)
5. Verify project loads correctly without style data

**Expected Result**: Style profile is user-scoped (persists across projects), not project-scoped (saved in `.alkemy.json`).

---

### IV3: Style Learning is Optional and Can Be Disabled
**Requirement**: Style learning is optional and can be disabled (graceful degradation to generic suggestions).

**Verification Steps**:
1. Disable style learning in settings
2. Use Director Agent (ask for suggestions)
3. Verify suggestions are generic (no personalized references)
4. Verify no style tracking occurs

**Expected Result**: Director works identically to pre-style-learning version when disabled.

---

## Migration/Compatibility

### MC1: Existing Projects Gain Style Tracking
**Requirement**: Existing projects gain style tracking automatically when feature is enabled (retroactive analysis of project history).

**Verification Steps**:
1. Load project created before style learning feature (from `.alkemy.json`)
2. Enable style learning
3. Generate new shots in the project
4. Verify style profile tracks new patterns
5. (Optional) Analyze historical project data if available

**Expected Result**: Style learning works with existing projects, no migration required.

---

### MC2: Users Can Opt Out Without Losing Features
**Requirement**: Users can opt out of style learning without losing other Director features.

**Verification Steps**:
1. Disable style learning in settings
2. Verify all Director features still work:
   - Text chat
   - Voice input/output (if enabled)
   - Image generation commands
   - Technical calculations
   - Creative advice (generic, not personalized)
3. Verify no errors or degraded performance

**Expected Result**: Style learning is purely additive, opting out does not break anything.

---

## Technical Implementation Notes

### Data Model

**Supabase Table Schema** (if configured):
```sql
CREATE TABLE user_style_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patterns JSONB NOT NULL DEFAULT '{}',
  total_projects INTEGER DEFAULT 0,
  total_shots INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_style_profiles_user_id ON user_style_profiles(user_id);
```

**localStorage Schema** (fallback):
```json
{
  "userId": "local-user-id",
  "patterns": {
    "shotTypes": { "close-up": 45, "wide": 12 },
    "lensChoices": { "close-up": { "50mm": 30, "85mm": 15 } },
    "lighting": { "natural": 35, "low-key": 20 },
    "colorGrade": { "warm": 40, "desaturated": 15 }
  },
  "totalProjects": 3,
  "totalShots": 85,
  "lastUpdated": "2025-11-09T12:00:00Z"
}
```

### Service Layer Architecture

**New Service Module**: `services/styleLearningService.ts`

**Key Functions**:
```typescript
// Track a creative decision (shot type, lens, lighting, etc.)
export function trackPattern(
  patternType: 'shotType' | 'lensChoice' | 'lighting' | 'colorGrade',
  value: string,
  context?: { shotType?: string } // For lens choices
): void;

// Get current style profile
export function getStyleProfile(): Promise<StyleProfile>;

// Get style-adapted suggestions
export function getStyleSuggestion(context: {
  sceneEmotion?: string;
  shotType?: string;
  lighting?: string;
}): Promise<string>;

// Reset style profile (clear all data)
export async function resetStyleProfile(): Promise<void>;

// Export style profile as JSON
export function exportStyleProfile(): string;

// Check if style learning is enabled
export function isStyleLearningEnabled(): boolean;

// Enable/disable style learning
export function setStyleLearningEnabled(enabled: boolean): void;
```

### DirectorWidget Integration

**Component File**: `components/DirectorWidget.tsx` (extend existing component)

**New State**:
```typescript
const [styleLearningEnabled, setStyleLearningEnabled] = useState<boolean>(false);
const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
const [showStyleOptIn, setShowStyleOptIn] = useState<boolean>(false);
```

**New UI Elements**:
- Style learning badge in widget header ("Learning your style: X projects")
- Style profile modal (view stats, reset, export)
- Style learning opt-in prompt (one-time)
- Settings toggle (enable/disable style learning)

### Pattern Tracking Integration

**When to Track Patterns**:
1. **Shot Generation** (`generateStillVariants()`):
   - Track shot type, lens choice, lighting
2. **Image Selection** (user selects generated image):
   - Track color grade preference (if detectible)
3. **Director Commands** (`executeCommand()`):
   - Parse commands for explicit preferences (e.g., "use 50mm lens" → track lens preference)
4. **Timeline Assembly** (clips transferred to timeline):
   - Track overall project patterns (shot type distribution)

**Example Integration**:
```typescript
// In DirectorWidget.tsx, after executing shot generation command
const shotType = extractShotType(command); // "close-up", "wide", etc.
const lens = extractLens(command); // "50mm", "85mm", etc.
const lighting = extractLighting(command); // "natural", "low-key", etc.

if (isStyleLearningEnabled()) {
  trackPattern('shotType', shotType);
  trackPattern('lensChoice', lens, { shotType });
  trackPattern('lighting', lighting);
}
```

### Supabase Integration

**Service File**: `services/styleLearningService.ts`

**Pattern Tracking** (dual persistence):
```typescript
export async function trackPattern(patternType, value, context) {
  if (!isStyleLearningEnabled()) return;

  // Update local state
  const profile = await getStyleProfile();
  profile.patterns[patternType][value] = (profile.patterns[patternType][value] || 0) + 1;

  // Save to Supabase (if configured)
  if (isSupabaseConfigured()) {
    await supabase
      .from('user_style_profiles')
      .upsert({
        user_id: getCurrentUserId(),
        patterns: profile.patterns,
        total_shots: profile.totalShots + 1,
        updated_at: new Date().toISOString()
      });
  } else {
    // Fallback to localStorage
    localStorage.setItem('alkemy_director_style_profile', JSON.stringify(profile));
  }
}
```

### localStorage Keys

**Style Learning Preferences**:
- `alkemy_style_learning_enabled`: `boolean`
- `alkemy_style_learning_opt_in_shown`: `boolean` (one-time prompt)
- `alkemy_director_style_profile`: `StyleProfile` (full JSON object, fallback storage)

---

## Definition of Done

- [ ] Creative pattern tracking implemented (shot types, lenses, lighting, color grading)
- [ ] Style profile data storage working (Supabase + localStorage fallback)
- [ ] Style-adapted suggestions functional (Director references learned patterns)
- [ ] Style learning indicator visible in DirectorWidget header
- [ ] Style profile management UI complete (view, reset, export)
- [ ] Privacy controls implemented (opt-in prompt, clear data explanation)
- [ ] Cross-project pattern aggregation working
- [ ] Performance overhead <50ms validated (benchmark testing)
- [ ] Integration verification complete (no command execution impact, project serialization compatible, optional/disable-able)
- [ ] Migration/compatibility verified (existing projects gain tracking, opt-out does not break features)
- [ ] Supabase migration created (`user_style_profiles` table)
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Style preferences persist across sessions (localStorage + Supabase)
- [ ] Code reviewed and approved by engineering lead
- [ ] User acceptance testing with 5+ filmmakers (>60% "matches my style" target)
- [ ] CLAUDE.md updated with style learning documentation

---

## Dependencies

### Prerequisite
- None (can run in parallel with Stories 1.1-1.2)

### Related Stories
- **Story 1.1** (Voice Input): Voice commands tracked for style learning
- **Story 1.2** (Voice Output): Voice interactions tracked
- **Story 1.4** (Continuity Checking): Style profile informs continuity expectations

### External Dependencies
- Supabase (optional, for cloud sync) - existing infrastructure
- localStorage (required, for fallback storage)

---

## Testing Strategy

### Unit Tests
- `styleLearningService.ts` functions (track, get, reset, export)
- Pattern aggregation logic (cross-project, project-specific, trends)
- Dual persistence (Supabase + localStorage fallback)

### Integration Tests
- Pattern tracking during shot generation workflow
- Style-adapted suggestions from Director
- Opt-in/opt-out state management

### End-to-End Tests (Playwright)
- Complete 3 projects, verify style profile accumulates data
- View style profile modal, verify stats are accurate
- Reset style profile, verify data is cleared
- Export style profile, verify JSON file is valid

### Manual Testing
- Complete 3+ projects with different styles
- Ask Director for suggestions, verify personalization
- User acceptance testing (5+ filmmakers, post-project survey)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 1, Story 1.3
- **Architecture**: `docs/brownfield-architecture.md` - Supabase integration patterns
- **Existing Component**: `components/DirectorWidget.tsx` - Command execution and suggestion logic
- **Supabase Service**: `services/supabase.ts` - Database client
- **Project Service**: `services/projectService.ts` - Project data persistence patterns

---

**END OF STORY**

*Next Steps: Assign to development team for implementation (can run in parallel with Stories 1.1-1.2).*
