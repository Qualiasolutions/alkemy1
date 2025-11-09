# Story 6.4: Director Agent Analytics Integration

**Epic**: Epic 6 - Project Quality Analytics & Feedback
**PRD Reference**: Section 6, Epic 6, Story 6.4
**Status**: Not Started
**Priority**: Medium (V2.2 Enhancement)
**Estimated Effort**: 4 story points
**Dependencies**: Story 6.1 (Creative Quality Analysis), Story 6.2 (Technical Performance Analytics), Story 6.3 (Analytics Dashboard)
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** the Director Agent to provide analytics insights and quality feedback during my workflow,
**So that** I can optimize quality and performance without manually reviewing dashboards.

---

## Business Value

**Problem Statement**:
Analytics data from Stories 6.1-6.3 exists in dashboards and reports, but filmmakers must:
- Manually navigate to the Analytics Tab to see insights
- Interpret raw metrics and charts themselves
- Context-switch between creative work and analytics review

This friction reduces analytics adoption and prevents real-time optimization during production.

**Value Proposition**:
Integrating analytics with the Director Agent enables:
- **Proactive Quality Feedback**: Director warns filmmakers about continuity errors, color inconsistency, or lighting issues in real-time
- **Contextual Suggestions**: Director recommends optimizations based on current workflow (e.g., "Switch to Flux model to reduce costs")
- **Conversational Analytics**: Filmmakers ask questions like "What's my error rate?" or "How much have I spent?" without leaving their workflow
- **Actionable Automation**: Director can execute analytics-driven actions (e.g., "Fix lighting in Scene 5" → regenerates shots with corrected lighting)

**Success Metric**: >70% of filmmakers who enable analytics use Director for analytics queries at least once per project; Director-driven optimizations reduce costs by 15% on average.

---

## Acceptance Criteria

### AC1: Director Analytics Summary Command
**Given** I have completed a project with analytics enabled,
**When** I ask the Director "Summarize my project analytics" (or similar),
**Then** the Director should provide a conversational summary with:

**Summary Content**:
1. **Overall Quality Assessment**:
   - "Your project quality score is 87/100 - strong overall performance."
   - Highlights: "Color consistency is excellent (92/100), lighting is good (85/100)."
   - Areas for improvement: "Look Bible adherence is lower (78/100) - some shots deviate from moodboard."
2. **Technical Performance Summary**:
   - "Total project cost: $8.50 (within budget)"
   - "Average generation time: 15 seconds per image, 42 seconds per video"
   - "Error rate: 8% (low) - most operations succeeded on first attempt"
3. **Top Recommendations** (3-5 suggestions):
   - "Switch from Imagen to Flux to reduce image costs by 35%"
   - "Regenerate Shots 12, 18, and 24 to improve color consistency with Scene 2"
   - "Your success rate is 92% - excellent! Keep using current prompts."

**Director Tone**:
- Conversational and friendly (not robotic)
- Balances praise with constructive feedback
- Focuses on actionable insights (not raw numbers)

**Verification**:
- Ask Director for analytics summary
- Verify summary includes quality, cost, and recommendations
- Verify tone is conversational and balanced

---

### AC2: Director Analytics Query Handling
**Given** I am working on a project,
**When** I ask the Director analytics-related questions,
**Then** the Director should answer with relevant data:

**Example Queries and Expected Responses**:
1. **"What's my error rate?"**
   - "Your error rate is 8% (6 failed generations out of 75 total). Most errors were API timeouts - your network connection may have been unstable."
2. **"How much have I spent on this project?"**
   - "Total cost: $8.50. Breakdown: Images ($2.35), Videos ($4.50), Audio ($1.20). Video animation is your largest expense."
3. **"Which scenes have continuity issues?"**
   - "I detected 3 continuity issues: Scene 4 (lighting jump between Shots 12-13), Scene 7 (costume change in Shot 24), Scene 10 (spatial mismatch). Would you like me to suggest fixes?"
4. **"How can I reduce costs?"**
   - "Top cost-saving tips: (1) Switch from Imagen to Flux for images (-$0.90/project), (2) Skip video upscaling for draft exports (-30% video costs), (3) Reuse music stems across scenes (-$0.50/project). Total potential savings: $2.15 (25%)."
5. **"What's my quality score?"**
   - "Your overall quality score is 87/100. Breakdown: Color consistency (92), Lighting coherence (85), Look Bible adherence (78). You're doing great - focus on improving Look Bible adherence for even better results."
6. **"Show me my most expensive operations"**
   - "Top 3 most expensive operations: (1) Video animation for Shot 18 ($0.45 - longer duration), (2) Video animation for Shot 7 ($0.40), (3) Image generation for Shot 12 ($0.12 - used Imagen). Video animation accounts for 53% of total costs."

**Natural Language Understanding**:
- Director should recognize variations (e.g., "How much did I spend?" = "What's my project cost?")
- Director should handle typos and informal phrasing
- Director should ask clarifying questions if ambiguous (e.g., "Which scene do you want analytics for?")

**Verification**:
- Ask Director 10+ analytics questions (from examples above)
- Verify answers are accurate and conversational
- Test variations and typos

---

### AC3: Proactive Quality Warnings
**Given** I am actively working on a project,
**When** analytics detects quality issues,
**Then** the Director should proactively warn me:

**Warning Triggers**:
1. **Continuity Error Detected** (after adding clip to timeline):
   - Director message: "⚠️ I noticed a lighting jump between Shots 12 and 13 (Scene 4). Would you like me to suggest a fix?"
   - Options: "Yes, suggest fix" or "Ignore warning"
2. **Color Consistency Drop** (after generating shot):
   - Director message: "⚠️ This shot's color palette deviates from your moodboard (color consistency: 65/100). Should I regenerate with Look Bible enforcement?"
   - Options: "Regenerate" or "Keep as is"
3. **Look Bible Violation** (after generating shot):
   - Director message: "⚠️ This shot doesn't match your Look Bible (adherence: 58/100). The lighting is cooler than your established style. Want to adjust?"
   - Options: "Regenerate with Look Bible" or "Dismiss"
4. **High Error Rate Detected** (after 3 consecutive errors):
   - Director message: "🔴 I've detected 3 consecutive generation errors. This might be an API issue or network problem. Would you like to pause and troubleshoot?"
   - Options: "Troubleshoot" (opens help modal) or "Continue anyway"
5. **Cost Threshold Exceeded** (after project cost exceeds $10):
   - Director message: "💰 Your project cost is $10.50 - above average. Consider switching to Flux model or skipping upscaling to reduce costs."
   - Options: "View cost breakdown" or "Dismiss"

**Warning Behavior**:
- Warnings appear as Director chat messages (not intrusive modals)
- Warnings are dismissible (user can ignore and continue)
- Warnings track dismissed items (don't re-warn for same issue)
- Warnings respect user preferences (can be disabled in Settings)

**Verification**:
- Trigger each warning type (intentionally create continuity errors, color deviations, etc.)
- Verify warnings appear in Director chat
- Test "Suggest fix" and "Regenerate" options
- Test dismissing warnings

---

### AC4: Director-Driven Optimization Actions
**Given** the Director suggests an optimization,
**When** I ask the Director to execute it,
**Then** the Director should perform the action automatically:

**Executable Actions**:
1. **"Switch to Flux model for remaining shots"**:
   - Director updates default model preference to Flux
   - Director confirms: "✓ Switched to Flux model. Estimated savings: $0.90 for remaining 30 shots."
2. **"Regenerate Shot 12 with Look Bible enforcement"**:
   - Director queues regeneration with Look Bible parameters
   - Director tracks progress: "Regenerating Shot 12... 80% complete"
   - Director confirms: "✓ Shot 12 regenerated with Look Bible adherence: 94/100. Much better!"
3. **"Fix lighting in Scene 5"**:
   - Director analyzes Scene 5 shots for lighting inconsistencies
   - Director suggests corrections: "I'll regenerate Shots 18, 20, and 22 with consistent lighting from Shot 17."
   - Director executes regeneration
   - Director confirms: "✓ Scene 5 lighting fixed. Lighting coherence improved from 72 to 88."
4. **"Export cost report as PDF"**:
   - Director generates PDF report (from Story 6.3)
   - Director confirms: "✓ Cost report exported. Download link: [filename.pdf]"

**Action Confirmation**:
- Director always confirms before executing expensive actions (e.g., "This will regenerate 3 shots ($0.45). Proceed?")
- Director tracks action progress (progress bar or percentage)
- Director reports results (success/failure, new metrics)

**Verification**:
- Ask Director to execute each action type
- Verify Director confirms before expensive actions
- Verify actions complete successfully
- Test action failure scenarios (API errors, etc.)

---

### AC5: Director Analytics Context Awareness
**Given** I am working in different tabs (Script, Compositing, Timeline, etc.),
**When** I interact with the Director,
**Then** the Director should provide tab-specific analytics insights:

**Context-Aware Insights**:
1. **Script Tab**:
   - "Your script has 8 scenes and 24 shots. Based on current costs, this project will cost approximately $12. Want to optimize?"
2. **Compositing Tab** (SceneAssemblerTab):
   - "You're generating Shot 12 (Scene 4). FYI: Scene 4 has a lighting consistency issue between Shots 12-13. Keep lighting consistent!"
3. **Timeline Tab**:
   - "Your timeline has 3 continuity issues (Scenes 4, 7, 10). Would you like me to highlight them?"
   - Clicking "highlight" adds visual badges to affected clips
4. **Analytics Tab**:
   - "Your quality score is 87/100. Top areas for improvement: Look Bible adherence (78). Want recommendations?"
5. **Export Tab**:
   - "You're about to export 24 shots (total duration: 4 minutes). Estimated render time: 2 minutes. Proceed?"

**Context Detection**:
- Director detects current tab via React context or state
- Director tailors suggestions to current workflow step
- Director surfaces relevant metrics for current context

**Verification**:
- Navigate to each tab
- Ask Director for analytics insights
- Verify insights are relevant to current tab context

---

### AC6: Director Analytics Settings and Preferences
**Given** I want to customize Director analytics behavior,
**When** I access Director settings,
**Then** I should see the following analytics-related options:

**Settings**:
1. **Enable/Disable Proactive Warnings**:
   - Toggle: "Proactive quality warnings" (default: enabled)
   - Sub-toggles: "Continuity warnings", "Color consistency warnings", "Cost warnings", "Error warnings"
2. **Warning Thresholds**:
   - Cost warning threshold: Slider (default: $10, range: $5-$50)
   - Error rate warning threshold: Slider (default: 20%, range: 10%-50%)
   - Quality score warning threshold: Slider (default: 70, range: 50-90)
3. **Analytics Query Preferences**:
   - Verbosity: Radio buttons ("Concise", "Balanced", "Detailed")
   - Include raw numbers: Checkbox (default: unchecked - conversational summaries only)
4. **Auto-Execution Permissions**:
   - Allow Director to auto-regenerate shots for quality fixes: Checkbox (default: unchecked - require confirmation)
   - Allow Director to switch models for cost optimization: Checkbox (default: unchecked)

**Settings Persistence**:
- Settings saved to localStorage: `alkemy_director_analytics_prefs`
- Settings sync to Supabase (if configured) for cross-device consistency

**Verification**:
- Adjust each setting
- Verify behavior changes accordingly (e.g., disable cost warnings → no cost warnings appear)
- Verify settings persist across sessions

---

### AC7: Director Analytics Performance
**Given** the Director is integrated with analytics,
**When** I use Director features,
**Then** performance should not degrade:

**Performance Requirements**:
- Analytics queries respond within <1 second
- Proactive warnings appear within <2 seconds of trigger event
- Director chat remains responsive (no UI blocking)
- Analytics data fetching happens in background (no loading spinners in chat)

**Verification**:
- Measure Director response time for analytics queries (10+ queries, average <1s)
- Trigger proactive warnings and measure latency (<2s)
- Verify no UI blocking during analytics operations

---

### AC8: Director Analytics Error Handling
**Given** analytics data is unavailable or corrupted,
**When** I ask the Director for analytics insights,
**Then** the Director should handle errors gracefully:

**Error Scenarios**:
1. **No analytics data available** (analytics disabled):
   - Director: "Analytics is not enabled for this project. Would you like to enable it? You'll get quality scores, cost tracking, and optimization suggestions."
   - Options: "Enable analytics" or "No thanks"
2. **Analytics data corrupted** (localStorage/Supabase error):
   - Director: "I'm having trouble loading analytics data. This might be a storage issue. Try refreshing the page or checking your network connection."
3. **Incomplete analytics data** (partial data):
   - Director: "I have partial analytics data for this project. Some metrics may be unavailable. Would you like to view what's available?"
4. **Analytics service error** (Supabase down, API error):
   - Director: "Analytics service is temporarily unavailable. You can still use all creative features - analytics will resume when the service is back."

**Verification**:
- Simulate each error scenario (disable analytics, corrupt localStorage, disconnect network)
- Verify Director provides helpful error messages
- Verify core Director features still work (creative queries, generation commands)

---

## Integration Verification

### IV1: Director Analytics Does Not Break Existing Features
**Requirement**: Analytics integration does not impact existing Director features (text chat, voice I/O, command parsing).

**Verification Steps**:
1. Test existing Director commands (image generation, technical queries, creative advice)
2. Verify all existing commands work identically with analytics integration
3. Verify no performance degradation for non-analytics queries

**Expected Result**: Existing Director features work unchanged, analytics is purely additive.

---

### IV2: Director Uses Analytics Data From Stories 6.1 and 6.2
**Requirement**: Director correctly reads and interprets data from both creative quality analysis (6.1) and technical performance (6.2).

**Verification Steps**:
1. Complete project with full analytics (creative + technical)
2. Ask Director for analytics summary
3. Verify summary includes creative quality scores (color, lighting, Look Bible)
4. Verify summary includes technical performance metrics (cost, time, errors)

**Expected Result**: Director synthesizes data from both analytics sources accurately.

---

### IV3: Director Actions Trigger Analytics Updates
**Requirement**: When Director executes optimization actions (regenerate shots, switch models), analytics data updates in real-time.

**Verification Steps**:
1. Ask Director to regenerate a shot for quality improvement
2. Wait for regeneration to complete
3. Query Director for updated analytics ("What's my quality score now?")
4. Verify quality score reflects the regenerated shot

**Expected Result**: Analytics updates immediately after Director-driven actions complete.

---

## Migration/Compatibility

### MC1: Director Works Without Analytics Enabled
**Requirement**: Director analytics features degrade gracefully when analytics is disabled (no errors, clear messaging).

**Verification Steps**:
1. Disable analytics in Settings
2. Ask Director for analytics summary
3. Verify Director explains analytics is disabled and offers to enable it
4. Verify all non-analytics Director features still work

**Expected Result**: Director gracefully handles analytics being disabled, no errors.

---

### MC2: Existing Director Conversations Preserved
**Requirement**: Analytics integration does not clear existing Director chat history or conversation context.

**Verification Steps**:
1. Have a conversation with Director (ask 5+ questions)
2. Enable analytics integration (if not already enabled)
3. Verify chat history is preserved
4. Ask Director an analytics question
5. Verify Director remembers previous conversation context

**Expected Result**: Analytics integration is seamless, conversation history intact.

---

## Technical Implementation Notes

### Service Layer Architecture

**Extend Existing Service**: `services/aiService.ts`

**New Function**:
```typescript
// Ask the Director with analytics context
export async function askTheDirectorWithAnalytics(
  query: string,
  projectId: string,
  scriptAnalysis: ScriptAnalysis,
  creativeQuality?: CreativeQualityReport,
  performanceMetrics?: TechnicalPerformanceMetrics,
  onProgress?: (progress: number) => void
): Promise<string>;
```

**Analytics Query Detection**:
```typescript
// Detect if query is analytics-related
function isAnalyticsQuery(query: string): boolean {
  const analyticsKeywords = [
    'cost', 'spent', 'expense', 'budget',
    'error', 'failure', 'issue',
    'quality', 'score', 'rating',
    'continuity', 'consistency',
    'analytics', 'report', 'summary',
    'optimize', 'reduce', 'improve'
  ];
  return analyticsKeywords.some(keyword => query.toLowerCase().includes(keyword));
}
```

### DirectorWidget Integration

**Component File**: `components/DirectorWidget.tsx` (extend existing component)

**New State**:
```typescript
const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(false);
const [creativeQuality, setCreativeQuality] = useState<CreativeQualityReport | null>(null);
const [performanceMetrics, setPerformanceMetrics] = useState<TechnicalPerformanceMetrics | null>(null);
const [proactiveWarningsEnabled, setProactiveWarningsEnabled] = useState<boolean>(true);
```

**Proactive Warning System**:
```typescript
// Monitor for quality issues and trigger warnings
useEffect(() => {
  if (!analyticsEnabled || !proactiveWarningsEnabled) return;

  // Listen for continuity errors (after timeline clip added)
  const handleContinuityError = (error: ContinuityIssue) => {
    appendDirectorMessage({
      role: 'assistant',
      content: `⚠️ I noticed a ${error.type} between ${error.location}. Would you like me to suggest a fix?`,
      actions: ['suggest-fix', 'ignore']
    });
  };

  // Listen for color consistency drops (after shot generation)
  const handleColorInconsistency = (shot: Frame, score: number) => {
    if (score < 70) {
      appendDirectorMessage({
        role: 'assistant',
        content: `⚠️ This shot's color palette deviates from your moodboard (color consistency: ${score}/100). Should I regenerate with Look Bible enforcement?`,
        actions: ['regenerate', 'keep']
      });
    }
  };

  // Subscribe to analytics events
  window.addEventListener('alkemy:continuity-error', handleContinuityError);
  window.addEventListener('alkemy:color-inconsistency', handleColorInconsistency);

  return () => {
    window.removeEventListener('alkemy:continuity-error', handleContinuityError);
    window.removeEventListener('alkemy:color-inconsistency', handleColorInconsistency);
  };
}, [analyticsEnabled, proactiveWarningsEnabled]);
```

### Director Knowledge Enhancement

**Update**: `services/directorKnowledge.ts`

**Add Analytics Knowledge**:
```typescript
export const ANALYTICS_KNOWLEDGE = `
You are the Director Agent with access to comprehensive project analytics. Use this data to provide personalized, actionable insights.

ANALYTICS DATA INTERPRETATION:
- Quality scores are 0-100 (higher is better)
  - 90-100: Excellent
  - 80-89: Good
  - 70-79: Fair (room for improvement)
  - <70: Needs attention

- Error rates are percentages (lower is better)
  - <5%: Excellent
  - 5-10%: Good
  - 10-20%: Fair
  - >20%: High (investigate)

- Costs are in USD (context: typical project costs $5-15)

PROACTIVE WARNING GUIDELINES:
- Only warn for critical issues (not minor deviations)
- Always suggest actionable fixes (not just point out problems)
- Balance warnings with praise (acknowledge what's working well)
- Allow users to dismiss warnings (respect their creative choices)

OPTIMIZATION SUGGESTIONS:
- Prioritize cost savings >10%
- Suggest model switches only when quality is maintained
- Recommend workflow changes that save time without sacrificing quality

CONVERSATIONAL TONE:
- Be friendly and encouraging (not robotic)
- Use filmmaker terminology (not technical jargon)
- Explain "why" behind suggestions (educate, don't just command)
`;
```

### Event System for Proactive Warnings

**Custom Events** (fired by analytics services):
```typescript
// In analyticsService.ts
function detectContinuityError(clip: TimelineClip, previousClip: TimelineClip) {
  const error = analyzeContinuity(clip, previousClip);
  if (error) {
    window.dispatchEvent(new CustomEvent('alkemy:continuity-error', { detail: error }));
  }
}

function detectColorInconsistency(shot: Frame, lookBible: LookBible) {
  const score = analyzeColorConsistency(shot, lookBible);
  if (score < 70) {
    window.dispatchEvent(new CustomEvent('alkemy:color-inconsistency', { detail: { shot, score } }));
  }
}
```

### localStorage Keys

**Director Analytics Preferences**:
- `alkemy_director_analytics_prefs`: `{ proactiveWarnings: boolean; thresholds: {...}; verbosity: string }`

---

## Definition of Done

- [ ] Director analytics summary command implemented ("Summarize my project analytics")
- [ ] Director analytics query handling functional (10+ query types supported)
- [ ] Proactive quality warnings implemented (continuity, color, Look Bible, errors, cost)
- [ ] Director-driven optimization actions working (switch models, regenerate shots, fix lighting, export reports)
- [ ] Director analytics context awareness functional (tab-specific insights)
- [ ] Director analytics settings and preferences implemented (warnings, thresholds, verbosity)
- [ ] Director analytics performance validated (<1s query response, <2s warnings)
- [ ] Director analytics error handling implemented (no data, corrupted data, service errors)
- [ ] Integration verification complete (existing features preserved, analytics data usage, action triggers)
- [ ] Migration/compatibility verified (works without analytics, conversation history preserved)
- [ ] Event system for proactive warnings implemented
- [ ] Director knowledge base updated with analytics interpretation guidelines
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Code reviewed and approved by engineering lead
- [ ] User acceptance testing with 5+ filmmakers (>70% analytics query usage target, 15% cost reduction target)
- [ ] CLAUDE.md updated with Director analytics integration documentation

---

## Dependencies

### Prerequisite
- **Story 6.1** (Creative Quality Analysis): Provides creative quality data
- **Story 6.2** (Technical Performance Analytics): Provides performance data
- **Story 6.3** (Analytics Dashboard): Provides UI components and reporting

### Related Stories
- **Story 1.1** (Voice Input): Voice commands for analytics queries
- **Story 1.2** (Voice Output): Spoken analytics summaries
- **Story 1.3** (Style Learning): Director learns optimization patterns
- **Story 1.4** (Continuity Checking): Director warns about continuity errors

### External Dependencies
- Existing Director Agent (DirectorWidget.tsx)
- Existing analytics services (analyticsService.ts, from 6.1 and 6.2)
- Gemini 2.0 API (for natural language understanding of analytics queries)

---

## Testing Strategy

### Unit Tests
- Analytics query detection (verify keywords trigger analytics mode)
- Director response generation (verify accuracy of analytics summaries)
- Proactive warning triggers (verify events fire correctly)

### Integration Tests
- Director + analytics workflow (ask query → receive accurate response)
- Director-driven actions → analytics updates (regenerate shot → quality score improves)
- Proactive warnings → user actions (warning appears → user executes fix)

### End-to-End Tests (Playwright)
- Complete project with analytics enabled
- Ask Director 10+ analytics questions
- Trigger proactive warnings (intentionally create continuity errors, etc.)
- Execute Director-driven optimization actions

### Manual Testing
- User acceptance testing (5+ filmmakers, analytics query usage + cost reduction)
- Voice input testing (speak analytics queries, verify accuracy)
- Accessibility testing (screen reader, keyboard navigation)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 6, Story 6.4
- **Story 6.1**: Creative quality analysis data source
- **Story 6.2**: Technical performance data source
- **Story 6.3**: Analytics dashboard and reports
- **Existing Component**: `components/DirectorWidget.tsx` - Current Director implementation
- **AI Service**: `services/aiService.ts` - `askTheDirector()` function
- **Director Knowledge**: `services/directorKnowledge.ts` - Cinematography knowledge base

---

**END OF STORY**

*Next Steps: Implement after Stories 6.1, 6.2, and 6.3 are complete, completing Epic 6: Project Quality Analytics & Feedback.*
