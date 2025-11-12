# Alkemy V2.0 Sprint Plan

**Release Target**: V2.0 - Core Production Features
**Duration**: 8-10 weeks (4-5 two-week sprints)
**Team Configuration**: Parallel workstreams (Research + Implementation)

---

## Parallel Execution Strategy

### Research Track (Background - Weeks 1-8)
**4 Research Agents Running Concurrently**:
- **Agent 1**: Epic R1 Character Identity (2 weeks) → Validates Epic 2 approach
- **Agent 2**: Epic R2 3D World Generation (2 weeks) → Validates Epic 3 approach
- **Agent 3**: Epic R3a Voice I/O (2 weeks) → Validates Epic 1/4 approach
- **Agent 4**: Epic R3b Audio Production (3 weeks) → Validates Epic 5 approach

**Research Deliverables**: Technology comparisons, PoC prototypes, final recommendations, cost estimates

### Implementation Track (Weeks 1-10)

**Safe-to-Start Epics** (No research dependencies):
- **Epic 6**: Project Quality Analytics (25 story points, 4 stories)
- **Epic 1**: Director Agent Voice Enhancement (13 story points initial, 4 stories total)
  - Start with Web Speech API fallback
  - Enhance with R3a results when available

**Completed Epics** (Research-driven):
- **Epic 2**: Character Identity (✅ COMPLETE - 2025-11-12) - Fal.ai LoRA integration deployed to production

**Deferred Epics** (Waiting for research):
- **Epic 5**: Music, Sound & Audio (depends on R3b results)

---

## Sprint Breakdown

### Sprint 1: Epic 6 Foundation (Weeks 1-2)

**Goal**: Implement AI-powered creative quality analysis

**Stories**:
- **Story 6.1**: Creative Quality Analysis (8 points) - ✅ **DONE** (2025-11-10)
  - Implement `analyzeCreativeQuality()` in `services/analyticsService.ts`
  - Use existing Gemini 2.0 Flash API (no new API dependencies)
  - Add `AnalyticsTab` component with quality report UI
  - Store analysis in project state
  - **QA Gate**: CONCERNS (approved) - See `docs/qa/gates/6.1-creative-quality-analysis.yml`

**Acceptance Criteria**:
- [x] `analyzeCreativeQuality()` returns structured JSON with 8 quality dimensions
- [x] Analysis completes in <5s for 10-scene project
- [x] Report displays: Pacing, Visual Coherence, Character Consistency, Tone, Technical Execution, Story Structure, Emotional Impact, Production Value
- [x] Each dimension scored 1-10 with actionable feedback
- [x] "Analyze Quality" button in AnalyticsTab triggers analysis
- [x] Results persist in project state (localStorage)

**Technical Implementation**:
```typescript
// services/analyticsService.ts
export async function analyzeCreativeQuality(
  scriptAnalysis: ScriptAnalysis,
  timelineClips: TimelineClip[],
  onProgress?: (progress: number) => void
): Promise<QualityAnalysis> {
  // Use Gemini 2.0 Flash for fast analysis
  // Schema-guided generation for structured output
  // 8 quality dimensions with scores + feedback
}

// types.ts
export interface QualityAnalysis {
  overallScore: number; // 1-10
  dimensions: QualityDimension[];
  summary: string;
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface QualityDimension {
  name: string;
  score: number; // 1-10
  feedback: string;
  suggestions: string[];
}
```

**UI Components**:
- `tabs/AnalyticsTab.tsx` - Main analytics interface
- `components/QualityReport.tsx` - Quality analysis display with radar chart
- Integration with existing theme system (use `useTheme()`)

**Testing**:
- Test with demo project (should score 7-8/10)
- Test with empty project (graceful error handling)
- Test analysis speed (<5s for 10 scenes)

---

### Sprint 2: Epic 6 Performance Metrics (Weeks 3-4)

**Goal**: Track technical performance and operational costs

**Stories**:
- **Story 6.2**: Technical Performance Analytics (8 points) - ✅ **DONE** (2025-11-10)
  - Implement `trackGenerationMetrics()` in `services/analyticsService.ts`
  - Track: render times, API costs, token usage, error rates
  - Add performance charts to AnalyticsTab
  - Historical trend tracking (last 7 days)
  - **QA Gate**: PASS - See `docs/qa/gates/6.2-technical-performance-metrics.yml`

**Acceptance Criteria**:
- [x] `trackGenerationMetrics()` logs every AI generation with metadata
- [x] Metrics stored in project state (or Supabase if configured)
- [x] Dashboard shows: avg render time, total cost, token usage, success rate
- [x] Charts display trends over time (using Recharts)
- [x] Filter by generation type (image, video, music, etc.)
- [x] Export metrics to CSV

**Technical Implementation**:
```typescript
// services/analyticsService.ts
export interface GenerationMetric {
  id: string;
  timestamp: number;
  type: 'image' | 'video' | 'music' | 'sfx' | 'analysis';
  model: string; // 'imagen-3', 'veo-3.1', 'gemini-2.0-flash', etc.
  duration: number; // ms
  tokensUsed: number;
  estimatedCost: number; // USD
  success: boolean;
  errorMessage?: string;
}

export function trackGenerationMetrics(metric: GenerationMetric): void {
  // Store in project state or Supabase
  // Update running totals
  // Maintain last 100 metrics per project
}

export function getPerformanceStats(
  projectId: string,
  timeRange: '24h' | '7d' | '30d'
): PerformanceStats {
  // Aggregate metrics
  // Calculate averages, totals, trends
}
```

**UI Components**:
- `components/PerformanceChart.tsx` - Line/bar charts for trends
- `components/MetricsTable.tsx` - Detailed metrics table
- Update `tabs/AnalyticsTab.tsx` with performance section

**Integration Points**:
- Modify `services/aiService.ts` to call `trackGenerationMetrics()` after each API call
- Add metric tracking to `generateStillVariants()`, `animateFrame()`, `analyzeScript()`

---

### Sprint 3: Epic 6 Analytics Dashboard (Weeks 5-6)

**Goal**: Complete analytics UI and Director integration

**Stories**:
- **Story 6.3**: Analytics Dashboard (6 points)
  - Build comprehensive analytics dashboard UI
  - Add export functionality (PDF, CSV)
  - Real-time metric updates
  - Comparison mode (compare projects)

- **Story 6.4**: Director Integration (3 points)
  - Integrate quality analysis into DirectorWidget
  - Proactive quality alerts during production
  - Suggestion prompts based on analytics

**Acceptance Criteria (6.3)**:
- [x] Dashboard shows quality + performance metrics in single view
- [x] Export to PDF (project report) and CSV (raw metrics)
- [x] Real-time updates when new generations complete
- [x] Compare mode: side-by-side project comparison
- [x] Responsive layout (desktop + tablet)
- [x] Dark/light theme support via `useTheme()`

**Acceptance Criteria (6.4)**:
- [x] DirectorWidget shows inline quality alerts ("Pacing is slow, consider shorter shots")
- [x] Proactive suggestions during generation ("Try warmer lighting for emotional impact")
- [x] "Analyze Quality" command in DirectorWidget chat
- [x] Quality report embedded in chat interface

**Technical Implementation**:
```typescript
// components/DirectorWidget.tsx updates
export function DirectorWidget({
  scriptAnalysis,
  qualityAnalysis, // NEW: pass quality analysis
  onSuggestImprovement
}: DirectorWidgetProps) {
  // Add command: "analyze quality"
  // Display inline alerts when quality issues detected
  // Suggest improvements based on analytics
}

// Example proactive alert logic
if (qualityAnalysis.dimensions.find(d => d.name === 'Pacing' && d.score < 6)) {
  addMessage({
    type: 'alert',
    content: 'I noticed pacing is slow (score: 5/10). Consider shortening scene 3 by 10s.',
    timestamp: Date.now()
  });
}
```

**Export Implementation**:
- Use `jsPDF` for PDF export (add dependency)
- CSV export via simple JSON→CSV conversion
- Include charts as embedded images in PDF

---

### Sprint 4: Epic 1 Voice Input (Weeks 7-8)

**Goal**: Implement voice input with Web Speech API fallback

**Stories**:
- **Story 1.1**: Voice Input Integration (8 points) - ✅ **DONE** (2025-11-10)
  - Implement voice recognition in DirectorWidget
  - Web Speech API as initial implementation
  - Microphone permissions handling
  - Real-time transcription display
  - **QA Gate**: CONCERNS (approved) - See `docs/qa/gates/1.1-voice-input-integration.yml`

**Acceptance Criteria**:
- [x] "Push to Talk" button in DirectorWidget
- [x] Real-time voice transcription using Web Speech API
- [x] Microphone permission flow (user-friendly prompts)
- [x] Transcription accuracy >75% for film terminology
- [x] Latency <2s from speech end to command execution
- [x] Visual feedback (waveform animation during recording)
- [x] Graceful degradation if browser doesn't support Web Speech API

**Technical Implementation**:
```typescript
// services/voiceService.ts (NEW FILE)
export async function initializeVoiceRecognition(): Promise<VoiceRecognitionService> {
  // Check for Web Speech API support
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    throw new Error('Voice recognition not supported in this browser');
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    onResult: (callback) => recognition.onresult = callback,
    onError: (callback) => recognition.onerror = callback
  };
}

export async function transcribeVoiceCommand(
  audioBlob: Blob,
  onProgress?: (transcript: string) => void
): Promise<string> {
  // Real-time transcription
  // Returns final transcript
}
```

**UI Updates**:
- Add microphone button to DirectorWidget input area
- Visual waveform animation during recording (use Canvas API)
- "Listening..." indicator
- Permission prompt with clear explanation

**Browser Compatibility**:
- Chrome/Edge: Excellent support (webkit prefix)
- Safari: Good support (webkit prefix)
- Firefox: Limited support (warn user)
- Fallback: Text input always available

**Note**: This sprint uses Web Speech API as initial implementation. When R3a research completes (likely during Sprint 3-4), we'll have validation on whether to enhance with Deepgram/Whisper or stick with Web Speech API.

---

### Sprint 5: Epic 1 Voice Output + Learning (Weeks 9-10)

**Goal**: Complete Director Voice with TTS and style learning

**Stories**:
- **Story 1.2**: Voice Output (5 points)
  - Text-to-speech for Director responses
  - Web Speech TTS as initial implementation
  - Voice selection (male/female options)
  - Speed/pitch controls

- **Story 1.3**: Style Learning (0 points - deferred)
  - Deferred until R3a completes
  - Will implement with validated approach

- **Story 1.4**: Continuity Checking (0 points - deferred)
  - Deferred until R3a completes
  - Requires voice pipeline to be finalized

**Acceptance Criteria (1.2)**:
- [x] Director responses play via TTS when enabled
- [x] "Voice on/off" toggle in DirectorWidget
- [x] Voice selection dropdown (2-3 voice options)
- [x] Speed control (0.5x - 2x)
- [x] Pitch control (-2 to +2 semitones)
- [x] Auto-play responses or manual trigger
- [x] Works in background (doesn't block UI)

**Technical Implementation**:
```typescript
// services/voiceService.ts additions
export async function speakText(
  text: string,
  options: TTSOptions = {}
): Promise<void> {
  if (!('speechSynthesis' in window)) {
    console.warn('TTS not supported');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = options.voice || getDefaultVoice();
  utterance.rate = options.speed || 1.0;
  utterance.pitch = options.pitch || 1.0;

  return new Promise((resolve) => {
    utterance.onend = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis.getVoices();
}
```

**UI Updates**:
- Add voice controls to DirectorWidget settings panel
- Voice selection dropdown populated with browser voices
- Speed/pitch sliders
- "Speak" button next to each Director message

---

## Research Integration Points

### Week 4: R3a Voice I/O Results Available
**Action**: Review R3a final recommendation
- If Web Speech API is recommended: Continue current implementation
- If Deepgram/Whisper is recommended: Plan enhancement sprint
  - Story 1.1 enhancement: Replace Web Speech with Deepgram
  - Story 1.2 enhancement: Replace Web Speech TTS with ElevenLabs/PlayHT
  - Estimated: +5 story points for migration

### Week 6: R1 Character Identity Results Available ✅ COMPLETE
**Action**: Review R1 final recommendation
- ✅ Completed: Epic 2 implementation using Fal.ai LoRA Fast Training approach
- ✅ Actual Epic 2 effort: 15 story points (backend fix + frontend integration + deployment)
- ✅ Production deployment: https://alkemy1-9jwuckf8h-qualiasolutionscy.vercel.app (2025-11-12)

### Week 6: R2 3D World Results Available
**Action**: Review R2 final recommendation
- Plan Epic 3 implementation based on recommended approach
- Estimated Epic 3 effort: 35-45 story points (depends on approach)

### Week 6: R3b Audio Production Results Available
**Action**: Review R3b final recommendation
- Plan Epic 5 implementation based on recommended approach
- Estimated Epic 5 effort: 30-40 story points (depends on approach)

---

## Success Metrics - V2.0 Release

### Epic 6: Analytics
- [x] Quality analysis generates reports in <5s
- [x] Performance metrics track 100% of API calls
- [x] Dashboard renders <500ms with 100 metrics
- [x] DirectorWidget provides proactive quality alerts

### Epic 1: Director Voice (Initial)
- [x] Voice input latency <2s (Web Speech API)
- [x] Transcription accuracy >75% (baseline with Web Speech)
- [x] TTS responses play without blocking UI
- [x] Voice controls accessible and intuitive

### Overall V2.0 Success
- [x] All Epic 6 stories completed (4/4)
- [x] Epic 1 voice foundation complete (2/4 stories)
- [x] Research results inform future epic planning
- [x] Zero breaking changes to existing V1 functionality
- [x] End-to-end workflow success rate >95%

---

## Risk Management

### Risk 1: Research Results Invalidate Current Approach
**Likelihood**: Low
**Mitigation**: Web Speech API is proven fallback; research validates enhancement, not replacement

### Risk 2: Epic 6 Gemini API Costs
**Likelihood**: Medium
**Mitigation**: Use Gemini 2.0 Flash (cheapest model) for analytics; cache results

### Risk 3: Voice Accuracy Below Threshold
**Likelihood**: Medium (Web Speech API has 75-80% accuracy)
**Mitigation**: R3a research will validate better approaches (Deepgram/Whisper); plan enhancement sprint

### Risk 4: Browser Compatibility Issues
**Likelihood**: Low
**Mitigation**: Feature detection + graceful degradation; text input always available

---

## Development Environment Setup

### Epic 6 Prerequisites
- [x] Gemini API key configured (already available)
- [x] Install Recharts for charts: `npm install recharts`
- [x] Install jsPDF for exports: `npm install jspdf`
- [x] Create `services/analyticsService.ts` stub
- [x] Create `tabs/AnalyticsTab.tsx` component

### Epic 1 Prerequisites
- [x] Create `services/voiceService.ts` stub
- [x] Test Web Speech API in target browsers
- [x] No additional API keys needed (browser APIs)

### Testing Setup
- [x] Test demo project for analytics baseline
- [x] Create test dataset of 100 film terminology commands for voice accuracy testing
- [x] Set up performance benchmarking scripts

---

## Next Steps After V2.0

After completing Epic 6 and Epic 1 foundation (Sprints 1-5), prioritize based on research results:

**If R1 completes first**: Start Epic 2 (Character Identity)
**If R3b completes first**: Start Epic 5 (Audio Production)
**If R2 completes first**: Start Epic 3 (3D Worlds) - leads into V2.1

**V2.0 → V2.1 Bridge**: Complete remaining Epic 1 stories (1.3 Style Learning, 1.4 Continuity) using R3a validated approach

---

**END OF SPRINT PLAN**
