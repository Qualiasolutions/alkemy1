---
last_sync: '2025-11-21T10:29:33.828Z'
auto_sync: true
---
# Story 4.2: Dialogue Generation from Script

**Epic**: Epic 4 - Voice & Dialogue Production
**PRD Reference**: Section 6, Epic 4, Story 4.2
**Status**: Not Started
**Priority**: High (V2.1 Feature)
**Estimated Effort**: 8 story points
**Dependencies**: Story 4.1 (Voice Selection), Epic R3a
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** automatically generate dialogue audio from my screenplay,
**So that** I don't need to record voice actors or manually produce dialogue tracks.

---

## Business Value

**Problem Statement**:
Hiring voice actors and recording dialogue is expensive, time-consuming, and requires professional audio equipment. Filmmakers need a fast, cost-effective way to generate high-quality dialogue that matches their script.

**Value Proposition**:
AI dialogue generation enables filmmakers to:
- Generate production-quality dialogue instantly from screenplay
- Iterate on delivery (emotion, pacing, emphasis) without re-recording
- Support multiple languages and accents automatically
- Produce complete dialogue tracks for entire films in minutes

**Success Metric**: >70% of projects use AI dialogue generation for at least 50% of scenes; average generation time <30 seconds per scene.

---

## Key Acceptance Criteria

### AC1: Scene Dialogue Extraction
**Given** I have an analyzed screenplay,
**When** I view a scene in the Compositing Tab,
**Then** I should see:
- List of all dialogue lines in scene with:
  - Character name
  - Dialogue text
  - Emotional context (from Director Agent analysis)
  - Voice assignment indicator (🔊 if assigned, ⚠️ if not)
- "Generate All Dialogue" button for entire scene
- Individual "Generate" button per dialogue line
- Bulk selection checkboxes for partial generation

**Dialogue Line Data Model**:
```typescript
interface DialogueLine {
  id: string;
  sceneId: string;
  characterId: string;
  text: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'excited';
  emphasis?: string[]; // Words to emphasize
  pacing?: 'slow' | 'normal' | 'fast';
  audioUrl?: string;
  generationStatus: 'pending' | 'generating' | 'ready' | 'error';
  generatedAt?: string;
}
```

**Verification**:
- Load screenplay with 10+ dialogue lines
- Verify all lines display with character assignments
- Test bulk selection and deselection

---

### AC2: Single Line Generation
**Given** I click "Generate" on a dialogue line,
**When** the generation process starts,
**Then** the following should occur:
- Status changes to "generating" with spinner
- Progress callback displays estimated time
- Voice parameters from character assignment are used
- Emotion and pacing applied to TTS generation
- On completion:
  - Audio URL stored in `audioUrl` field
  - Status changes to "ready"
  - Inline audio player appears with waveform
  - Duration and file size displayed

**Generation API Pattern**:
```typescript
export async function generateDialogue(
  line: DialogueLine,
  voice: VoiceProfile,
  onProgress?: (progress: number) => void
): Promise<string>; // Returns audio URL
```

**Verification**:
- Generate single dialogue line
- Verify audio plays correctly
- Test progress tracking during generation

---

### AC3: Batch Scene Generation
**Given** I click "Generate All Dialogue" for a scene,
**When** batch generation starts,
**Then** the system should:
- Queue all dialogue lines for generation
- Process lines sequentially (avoid API rate limits)
- Display overall progress: "Generating dialogue 5/12..."
- Individual line progress indicators
- Pause/Cancel buttons during generation
- On completion:
  - All lines have audio URLs
  - Summary: "12 lines generated in 2m 34s"
  - Auto-save project state

**Rate Limiting**:
- Max 3 concurrent requests per provider
- Exponential backoff on API errors
- Estimated total time calculation

**Verification**:
- Generate dialogue for scene with 10+ lines
- Test pause and resume functionality
- Verify all lines complete successfully

---

### AC4: Emotion and Emphasis Control
**Given** I want to adjust dialogue delivery,
**When** I access advanced controls for a line,
**Then** I should see:
- **Emotion Selector**: Dropdown with 6 emotions (neutral, happy, sad, angry, fearful, excited)
- **Emphasis Editor**: Click words in text to toggle emphasis (bold = emphasized)
- **Pacing Slider**: Slow / Normal / Fast
- **Pause Insertion**: Add pauses with `...` or `[pause:2s]` markers
- "Preview" button to test settings before committing
- "Regenerate" button to replace existing audio

**Emphasis Syntax**:
- User clicks "Hello" in text → stored as `emphasis: ['Hello']`
- TTS provider applies emphasis via SSML or API parameters

**Verification**:
- Adjust emotion, emphasis, and pacing for dialogue line
- Preview with different settings
- Regenerate and verify changes applied

---

### AC5: Director Agent Dialogue Coaching
**Given** I want AI assistance with dialogue delivery,
**When** I ask Director Agent "How should this line be delivered?",
**Then** Director should:
- Analyze line in scene context
- Recommend emotion and pacing
- Suggest emphasis on key words
- Provide cinematography reasoning (e.g., "Slow pacing for dramatic tension")
- One-click "Apply Suggestions" button

**Example Query**:
> User: "How should Sarah deliver 'I can't believe you did this'?"
> Director: "Recommend **angry** emotion with **slow** pacing. Emphasize 'can't' and 'this' for accusatory tone. This matches the betrayal scene context."

**Verification**:
- Ask Director for delivery suggestions on 5+ lines
- Verify suggestions are contextually appropriate
- Test "Apply Suggestions" functionality

---

### AC6: Multi-Character Conversation Flow
**Given** a scene has dialogue between 2+ characters,
**When** dialogue is generated,
**Then** the system should:
- Maintain natural conversation pacing
- Add subtle pauses between character turns (0.5-1s)
- Detect overlapping dialogue (e.g., "[INTERRUPTING]") and handle appropriately
- Generate conversation as single audio file OR individual clips (user choice)

**Conversation Assembly Options**:
- **Individual Clips**: Each line as separate audio (default, easier editing)
- **Merged Conversation**: Single audio file with natural pauses (faster workflow)

**Verification**:
- Generate dialogue for scene with 3+ characters
- Test both individual and merged output modes
- Verify natural conversation pacing

---

### AC7: Dialogue Regeneration and Variants
**Given** I'm not satisfied with generated dialogue,
**When** I click "Regenerate",
**Then** I should have options:
- **Regenerate with Same Settings**: Re-roll for different delivery
- **Regenerate with Adjustments**: Modify emotion/pacing first
- **Generate Variants**: Create 3 alternative deliveries to choose from
- Keep/discard original version

**Variant Comparison**:
- Play all 3 variants side-by-side
- Select preferred version
- Delete unwanted variants

**Verification**:
- Regenerate dialogue line 3 times
- Generate 3 variants and compare
- Verify only selected variant is saved

---

### AC8: Dialogue Export and Management
**Given** I have generated dialogue for multiple scenes,
**When** I access dialogue management,
**Then** I should be able to:
- View all generated dialogue in project (list view)
- Filter by character, scene, or status
- Bulk export all dialogue as:
  - Individual WAV files (one per line)
  - Single merged audio track (entire script)
  - CSV with metadata (character, text, audio URL, timestamps)
- Download dialogue package for external editing (e.g., Pro Tools)

**Export Package Structure**:
```
dialogue-export/
├── scene-1/
│   ├── character1-line1.wav
│   ├── character2-line2.wav
├── scene-2/
│   └── ...
└── dialogue-manifest.csv
```

**Verification**:
- Generate dialogue for 3+ scenes
- Export as individual files
- Export as merged track
- Verify CSV manifest accuracy

---

## Integration Verification

### IV1: Voice Assignment Integration (Story 4.1)
**Requirement**: Dialogue generation uses character voice assignments automatically.

**Verification Steps**:
1. Assign voice to character (Story 4.1)
2. Generate dialogue for that character
3. Verify audio uses assigned voice and parameters

**Expected Result**: Seamless handoff from voice assignment to generation.

---

### IV2: Timeline Integration (Story 4.4)
**Requirement**: Generated dialogue can be transferred to timeline for editing.

**Verification Steps**:
1. Generate dialogue for scene
2. Transfer to timeline via "Add to Timeline" button
3. Verify dialogue appears in timeline at correct position

**Expected Result**: Dialogue audio clips sync with timeline timestamps.

---

### IV3: Script Analysis Integration
**Requirement**: Dialogue lines extracted from `scriptAnalysis.scenes[].dialogue`.

**Verification Steps**:
1. Analyze screenplay with dialogue
2. Verify dialogue lines populate correctly in Compositing Tab
3. Test with various screenplay formats (Final Draft, Fountain)

**Expected Result**: Accurate dialogue extraction across screenplay formats.

---

## Migration/Compatibility

### MC1: Scenes Without Dialogue
**Requirement**: Scenes with no dialogue should not break workflow.

**Verification Steps**:
1. Load scene with no dialogue lines
2. Verify "No dialogue in this scene" message displays
3. Scene generation workflow still functional (stills/video)

**Expected Result**: Graceful handling of non-dialogue scenes.

---

### MC2: Projects Without Voice Assignments
**Requirement**: Dialogue generation works with default voices.

**Verification Steps**:
1. Generate dialogue for character without voice assignment
2. Verify system uses default Google TTS voice
3. Prompt user to assign voice for better quality

**Expected Result**: Functional dialogue generation with helpful upgrade prompt.

---

## Technical Implementation Notes

### Service Layer

**Extend `services/voiceService.ts`**:
```typescript
export async function generateDialogue(
  line: DialogueLine,
  voice: VoiceProfile,
  onProgress?: (progress: number) => void
): Promise<string>; // Returns audio URL

export async function generateSceneDialogue(
  lines: DialogueLine[],
  voices: Record<string, VoiceProfile>,
  onProgress?: (progress: number, lineIndex: number) => void
): Promise<Record<string, string>>; // lineId → audioUrl

export async function generateDialogueVariants(
  line: DialogueLine,
  voice: VoiceProfile,
  count: number
): Promise<string[]>; // Array of audio URLs

export async function exportDialoguePackage(
  projectId: string,
  format: 'individual' | 'merged' | 'csv'
): Promise<Blob>;

// SSML generation for emphasis and emotion
function buildSSML(
  text: string,
  emotion: string,
  emphasis: string[],
  pacing: string
): string {
  // Convert to SSML for providers that support it
  // Example: <speak><prosody rate="slow"><emphasis level="strong">Hello</emphasis></prosody></speak>
}
```

### Data Storage

**Extend `AnalyzedScene` Type**:
```typescript
interface AnalyzedScene {
  // ... existing fields
  dialogue?: DialogueLine[];
}
```

**Supabase Table**:
```sql
CREATE TABLE dialogue_audio (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  scene_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  text TEXT NOT NULL,
  emotion TEXT,
  emphasis TEXT[], -- Array of emphasized words
  pacing TEXT,
  audio_url TEXT,
  duration_seconds FLOAT,
  provider TEXT,
  generated_at TIMESTAMP DEFAULT NOW()
);
```

**localStorage Fallback**:
```typescript
{
  "alkemy_dialogue_audio": {
    "sceneId1": {
      "lineId1": { /* DialogueLine */ },
      "lineId2": { /* DialogueLine */ }
    }
  }
}
```

### Provider-Specific Implementation

**ElevenLabs API**:
```typescript
const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
  method: 'POST',
  headers: {
    'xi-api-key': ELEVENLABS_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: line.text,
    model_id: 'eleven_monolingual_v1',
    voice_settings: {
      stability: voice.parameters.stability / 100,
      similarity_boost: voice.parameters.clarity / 100
    }
  })
});
```

**Google Cloud TTS**:
```typescript
const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GOOGLE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    input: { ssml: buildSSML(line.text, emotion, emphasis, pacing) },
    voice: { languageCode: 'en-US', name: voice.voiceId },
    audioConfig: { audioEncoding: 'MP3', pitch: voice.parameters.pitch, speakingRate: speedMap[pacing] }
  })
});
```

---

## Definition of Done

- [ ] Scene dialogue extraction functional
- [ ] Single line generation working
- [ ] Batch scene generation with progress tracking
- [ ] Emotion, emphasis, and pacing controls implemented
- [ ] Director Agent dialogue coaching functional
- [ ] Multi-character conversation flow handling
- [ ] Dialogue regeneration and variants working
- [ ] Dialogue export and management complete
- [ ] Integration verification complete (voice assignment, timeline, script analysis)
- [ ] Migration/compatibility verified
- [ ] Code reviewed and approved
- [ ] User acceptance testing (>70% usage, <30s generation time)
- [ ] CLAUDE.md updated

---

## Dependencies

### Prerequisites
- **Story 4.1** (Voice Selection) completed
- **Epic R3a** completed (voice technology validation)

### Related Stories
- **Story 4.4** (Timeline Integration): Dialogue clips in timeline
- **Story 5.3** (Audio Mixing): Mix dialogue with music/effects

---

## Testing Strategy

### Unit Tests
- SSML generation logic
- Dialogue line extraction from script analysis
- Emotion/emphasis parameter application

### Integration Tests
- Voice assignment → dialogue generation workflow
- Batch generation with multiple voices
- Provider fallback logic

### Performance Tests
- Generation time for 50-line scene
- Concurrent request handling
- Memory usage with large dialogue sets

### Manual Testing
- Dialogue quality assessment across emotions
- Natural conversation flow testing
- User acceptance testing (delivery control UX)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 4, Story 4.2
- **Story 4.1**: Voice selection integration
- **SSML Specification**: https://www.w3.org/TR/speech-synthesis11/

---

**END OF STORY**
