---
last_sync: '2025-11-21T10:28:17.969Z'
auto_sync: true
---
# Story 4.4: Dialogue Timeline Integration

**Epic**: Epic 4 - Voice & Dialogue Production
**PRD Reference**: Section 6, Epic 4, Story 4.4
**Status**: Not Started
**Priority**: High (V2.1 Feature)
**Estimated Effort**: 6 story points
**Dependencies**: Story 4.2 (Dialogue Generation), Timeline Tab (existing)
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** integrate generated dialogue into my video timeline,
**So that** I can sync dialogue with visuals and edit the complete audio-visual production.

---

## Business Value

**Problem Statement**:
Dialogue audio generated separately from video creates workflow friction. Filmmakers need seamless integration between dialogue and video tracks to produce complete scenes with synchronized audio-visual elements.

**Value Proposition**:
Timeline dialogue integration enables filmmakers to:
- Automatically sync dialogue with corresponding video shots
- Edit dialogue timing and volume alongside visuals
- Mix dialogue with music and sound effects in unified timeline
- Export complete scenes with perfectly synchronized audio

**Success Metric**: >80% of generated dialogue is successfully transferred to timeline with correct sync; >90% user satisfaction with timeline audio workflow.

---

## Key Acceptance Criteria

### AC1: Dialogue Track in Timeline
**Given** the Timeline Tab displays video clips,
**When** I transfer dialogue to timeline,
**Then** I should see:
- Separate audio track below video track: "🎤 Dialogue"
- Each dialogue clip represented as waveform visualization
- Character name labels on dialogue clips
- Timestamp markers showing sync with video
- Volume controls per clip

**Timeline Structure**:
```
Video Track:  [Shot 1: 0-5s] [Shot 2: 5-12s] [Shot 3: 12-18s]
Dialogue:     [Line 1: 2-4s]  [Line 2: 6-9s]  [Line 3: 14-17s]
Music:        [Track 1: 0-20s]
Effects:      [Footsteps: 1-2s] [Door: 10s]
```

**Verification**:
- Transfer 5 dialogue clips to timeline
- Verify each clip displays waveform
- Test volume adjustment per clip

---

### AC2: Automatic Dialogue Sync
**Given** I have generated dialogue for a scene with video shots,
**When** I click "Auto-Sync Dialogue to Timeline",
**Then** the system should:
- Analyze screenplay timing cues (e.g., "INT. OFFICE - DAY")
- Match dialogue lines to corresponding video shots
- Position dialogue clips at appropriate timestamps
- Account for:
  - Shot duration (dialogue fits within shot)
  - Character on-screen timing (dialogue plays when character visible)
  - Natural pauses between lines

**Auto-Sync Algorithm**:
```typescript
interface SyncRule {
  dialogueLineId: string;
  targetShotId: string;
  startOffset: number; // Seconds from shot start
  confidence: number; // 0-100% sync confidence
}

export async function autoSyncDialogue(
  dialogue: DialogueLine[],
  shots: Frame[],
  scriptAnalysis: ScriptAnalysis
): Promise<SyncRule[]>;
```

**Verification**:
- Auto-sync 10-line dialogue scene
- Verify dialogue clips align with correct shots
- Test with various scene structures (long shots, quick cuts)

---

### AC3: Manual Dialogue Positioning
**Given** I want to adjust dialogue timing manually,
**When** I interact with dialogue clips in timeline,
**Then** I should be able to:
- Drag-and-drop clips to reposition
- Trim clip start/end points (non-destructive)
- Split clips at playhead position
- Delete clips (with undo support)
- Copy/paste clips across timeline

**Editing Controls**:
- Handles on clip edges for trimming
- Snap-to-grid (0.1s intervals) with toggle
- Playhead scrubbing for precise positioning
- Keyboard shortcuts:
  - `S`: Split clip at playhead
  - `Delete`: Remove clip
  - `Cmd/Ctrl + C/V`: Copy/paste

**Verification**:
- Drag dialogue clip to new position
- Trim 2 seconds from clip start
- Split clip and verify both halves remain functional

---

### AC4: Dialogue Waveform Visualization
**Given** dialogue is displayed in timeline,
**When** I view the timeline,
**Then** I should see:
- Waveform visualization showing audio amplitude
- Color-coded by character (e.g., Sarah = blue, John = green)
- Peak indicators for loud dialogue (clipping warnings)
- Silence detection (visual gaps in waveform)

**Waveform Rendering**:
- Use Web Audio API to extract audio data
- Canvas-based rendering for performance
- Zoom levels: 1x, 2x, 5x, 10x (detailed editing)

**Verification**:
- Load dialogue clip and verify waveform renders
- Test zoom levels (waveform detail increases)
- Verify clipping warnings for loud audio

---

### AC5: Dialogue Volume and Fade Controls
**Given** I want to adjust dialogue audio levels,
**When** I access clip controls,
**Then** I should be able to:
- Volume slider per clip (-∞ to +6 dB)
- Fade-in duration (0-2 seconds)
- Fade-out duration (0-2 seconds)
- Mute toggle
- Solo toggle (mute all other tracks)

**Volume Automation** (Advanced):
- Keyframe-based volume curves
- Auto-ducking (lower dialogue when music plays)

**Verification**:
- Adjust volume for 3 clips to different levels
- Add 0.5s fade-in and fade-out
- Test mute and solo functionality

---

### AC6: Multi-Character Dialogue Mixing
**Given** a scene has dialogue from multiple characters,
**When** dialogue overlaps or occurs in quick succession,
**Then** the system should:
- Display overlapping clips on separate lanes (auto-expand dialogue track)
- Visual indicators for overlap (amber highlight)
- Recommend spacing for natural conversation flow
- Auto-mix overlapping dialogue (slight volume reduction to avoid clipping)

**Dialogue Lane Management**:
```
Dialogue (Sarah):  [Line 1: 2-4s]          [Line 3: 10-12s]
Dialogue (John):            [Line 2: 5-7s] [Line 4: 11-13s] ← Overlap!
```

**Verification**:
- Create scene with 2 characters talking
- Test overlapping dialogue clips
- Verify auto-mix prevents clipping

---

### AC7: Dialogue Export Options
**Given** I have completed dialogue editing in timeline,
**When** I export the project,
**Then** I should be able to:
- Export dialogue track separately as:
  - WAV (lossless, professional)
  - MP3 (compressed, web-friendly)
  - AAC (modern codec)
- Export dialogue with video (Story 5.4 integration)
- Export dialogue only (no music/effects) for ADR/dubbing

**Export Settings**:
- Sample rate: 44.1kHz, 48kHz
- Bit depth: 16-bit, 24-bit
- Channels: Mono, Stereo
- Normalization: Auto-level dialogue to -16 LUFS (broadcast standard)

**Verification**:
- Export dialogue as WAV and MP3
- Verify audio quality matches timeline playback
- Test normalization (dialogue levels consistent)

---

### AC8: Timeline Playback with Dialogue
**Given** I have dialogue in timeline,
**When** I press Play,
**Then** the system should:
- Play video and dialogue in perfect sync
- Handle multiple audio tracks (dialogue + music + effects)
- Maintain sync during scrubbing (playhead drag)
- Support playback speed adjustment (0.5x, 1x, 1.5x, 2x)
- Display real-time audio meters (VU meters) for each track

**Performance Target**:
- Sync accuracy: <50ms drift over 5-minute timeline
- Smooth playback at 1080p with 3+ audio tracks

**Verification**:
- Play timeline with video + dialogue + music
- Scrub playhead and verify sync maintained
- Test 2x playback speed with dialogue

---

## Integration Verification

### IV1: Dialogue Generation Integration (Story 4.2)
**Requirement**: Generated dialogue transfers to timeline seamlessly.

**Verification Steps**:
1. Generate dialogue in Compositing Tab
2. Click "Add to Timeline"
3. Verify dialogue appears in timeline at correct position

**Expected Result**: One-click transfer from generation to timeline.

---

### IV2: Music and Effects Integration (Story 5.3)
**Requirement**: Dialogue mixes with music and effects tracks.

**Verification Steps**:
1. Add dialogue, music, and sound effects to timeline
2. Play timeline
3. Verify all tracks mix correctly without clipping

**Expected Result**: Multi-track audio mixing functional.

---

### IV3: Video Export Integration (Story 5.4)
**Requirement**: Dialogue exports with video as single file.

**Verification Steps**:
1. Complete timeline with dialogue and video
2. Export as MP4
3. Verify exported video includes dialogue audio in sync

**Expected Result**: Complete audio-visual export.

---

## Migration/Compatibility

### MC1: Existing Projects Without Dialogue
**Requirement**: Projects created before dialogue feature work unchanged.

**Verification Steps**:
1. Load legacy project with video-only timeline
2. Verify timeline renders correctly (no dialogue track shown)
3. Add dialogue and verify dialogue track appears

**Expected Result**: Backward compatibility with graceful upgrade path.

---

### MC2: Timeline State Persistence
**Requirement**: Dialogue timeline edits persist across sessions.

**Verification Steps**:
1. Edit dialogue in timeline (position, volume, fades)
2. Save project
3. Reload project
4. Verify all dialogue edits restored correctly

**Expected Result**: Complete timeline state persistence.

---

## Technical Implementation Notes

### Timeline Data Model

**Extend `TimelineClip` Type**:
```typescript
interface TimelineClip {
  // ... existing fields (id, type, media, startTime, duration)
  trackType?: 'video' | 'dialogue' | 'music' | 'effects';
  characterId?: string; // For dialogue clips
  dialogueLineId?: string; // Reference to DialogueLine
  volume: number; // -∞ to +6 dB
  fadeIn: number; // Seconds
  fadeOut: number; // Seconds
  lane?: number; // For multi-lane dialogue (overlapping clips)
}
```

### Service Layer

**Create `services/timelineAudioService.ts`**:
```typescript
export async function autoSyncDialogue(
  dialogue: DialogueLine[],
  shots: Frame[],
  scriptAnalysis: ScriptAnalysis
): Promise<SyncRule[]>;

export async function exportDialogueTrack(
  clips: TimelineClip[],
  format: 'wav' | 'mp3' | 'aac',
  settings: ExportSettings
): Promise<Blob>;

export async function mixAudioTracks(
  tracks: TimelineClip[][],
  duration: number
): Promise<AudioBuffer>;

// Waveform rendering
export async function generateWaveform(
  audioUrl: string,
  width: number,
  height: number
): Promise<ImageData>;

// Auto-ducking (lower music when dialogue plays)
export async function applyAutoDucking(
  dialogueClips: TimelineClip[],
  musicClips: TimelineClip[]
): Promise<TimelineClip[]>; // Returns musicClips with volume adjustments
```

### Web Audio API Integration

**Audio Playback**:
```typescript
const audioContext = new AudioContext();

async function playTimeline(clips: TimelineClip[], startTime: number) {
  for (const clip of clips) {
    const response = await fetch(clip.media);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    // Apply volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = dbToLinear(clip.volume);

    // Apply fades
    const now = audioContext.currentTime;
    if (clip.fadeIn > 0) {
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(dbToLinear(clip.volume), now + clip.fadeIn);
    }

    source.connect(gainNode).connect(audioContext.destination);
    source.start(now + clip.startTime - startTime);
  }
}

function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}
```

### Waveform Rendering

**Canvas-Based Visualization**:
```typescript
function renderWaveform(audioBuffer: AudioBuffer, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  const data = audioBuffer.getChannelData(0); // Mono or left channel
  const step = Math.ceil(data.length / canvas.width);
  const amp = canvas.height / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#3b82f6'; // Blue waveform

  for (let i = 0; i < canvas.width; i++) {
    let min = 1.0;
    let max = -1.0;
    for (let j = 0; j < step; j++) {
      const datum = data[(i * step) + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
  }
}
```

---

## Definition of Done

- [ ] Dialogue track in timeline UI implemented
- [ ] Automatic dialogue sync functional
- [ ] Manual dialogue positioning working
- [ ] Waveform visualization rendering
- [ ] Volume and fade controls implemented
- [ ] Multi-character dialogue mixing
- [ ] Dialogue export options functional
- [ ] Timeline playback with dialogue sync (<50ms drift)
- [ ] Integration verification complete
- [ ] Migration/compatibility verified
- [ ] Code reviewed and approved
- [ ] User acceptance testing (>80% sync success, >90% satisfaction)
- [ ] CLAUDE.md updated

---

## Dependencies

### Prerequisites
- **Story 4.2** (Dialogue Generation) completed
- **Timeline Tab** (existing FramesTab.tsx)

### Related Stories
- **Story 5.3** (Audio Mixing): Mix dialogue with music/effects
- **Story 5.4** (Audio Export): Export complete audio-visual production

---

## Testing Strategy

### Unit Tests
- Auto-sync algorithm accuracy
- Waveform rendering performance
- Audio mixing logic (no clipping)

### Integration Tests
- Dialogue generation → timeline transfer workflow
- Timeline playback sync accuracy
- Export dialogue with video

### Performance Tests
- Timeline playback with 10+ audio clips
- Waveform rendering for 10-minute audio
- Memory usage with large timelines

### Manual Testing
- Audio-visual sync quality assessment
- User acceptance testing (timeline editing UX)
- Cross-browser Web Audio API compatibility

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 4, Story 4.4
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **Broadcast Audio Levels (LUFS)**: https://www.itu.int/rec/R-REC-BS.1770

---

**END OF STORY**
