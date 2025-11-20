---
last_sync: '2025-11-20T11:26:44.826Z'
auto_sync: true
---
# Story 5.3: Timeline Audio Mixing

**Epic**: Epic 5 - Music, Sound & Audio Mixing
**PRD Reference**: Section 6, Epic 5, Story 5.3
**Status**: Not Started
**Priority**: High (V2.0 Core Feature)
**Estimated Effort**: 7 story points
**Dependencies**: Story 5.1 (Music), Story 5.2 (SFX), Story 4.4 (Dialogue Timeline)
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** mix dialogue, music, and sound effects in a unified timeline,
**So that** I can create professional audio productions with balanced, polished soundtracks.

---

## Business Value

**Problem Statement**:
Professional audio mixing requires expensive DAWs (Digital Audio Workstations) like Pro Tools ($600+) and specialized training. Filmmakers need simple, integrated mixing tools that produce broadcast-quality audio without leaving their editing environment.

**Value Proposition**:
Integrated audio mixing enables filmmakers to:
- Balance dialogue, music, and effects in one interface
- Apply professional mixing techniques automatically (ducking, EQ, compression)
- Achieve broadcast-standard audio levels (-16 LUFS)
- Export polished soundtracks without external tools

**Success Metric**: >70% of projects use timeline audio mixing; >85% user satisfaction with audio quality; 100% of exports meet broadcast loudness standards.

---

## Key Acceptance Criteria

### AC1: Multi-Track Timeline View
**Given** I have added dialogue, music, and SFX to my project,
**When** I view the timeline,
**Then** I should see 4 audio tracks:
- **Track 1: Dialogue** - Voice recordings (blue waveforms)
- **Track 2: Music** - Background score (purple waveforms)
- **Track 3: Sound Effects** - Foley and ambient (orange waveforms)
- **Track 4: Video** - Visual layer with reference audio

**Timeline Layout**:
```
Video:     [Shot 1 ▶] [Shot 2 ▶] [Shot 3 ▶]
Dialogue:  [Line 1 🔊] [Gap      ] [Line 2 🔊]
Music:     [Track 1 🎵━━━━━━━━━━━━━━━━━━━]
SFX:       [Footsteps] [Door 🚪] [Thunder ⚡]
```

**Track Controls (Per Track)**:
- Solo (S) - Mute all other tracks
- Mute (M) - Silence this track
- Volume fader (-∞ to +6 dB)
- Pan control (L-C-R)

**Verification**:
- Add clips to all 4 tracks
- Test solo/mute functionality
- Adjust volume faders and verify level changes

---

### AC2: Audio Clip Editing
**Given** I have audio clips in the timeline,
**When** I edit them,
**Then** I should be able to:
- **Trim**: Drag clip edges to shorten (non-destructive)
- **Split**: Cut clip at playhead position (S key)
- **Fade In/Out**: Drag fade handles on clip edges (0-2s)
- **Volume Envelope**: Click clip to add keyframes, drag to adjust volume curve
- **Crossfade**: Overlap clips to auto-crossfade
- **Ripple Delete**: Remove clip and shift following clips left

**Clip Controls**:
- Right-click menu: Duplicate, Delete, Normalize, Reverse
- Keyboard shortcuts: `Cmd+C/V` (copy/paste), `Delete` (remove)

**Verification**:
- Trim 3 clips to different lengths
- Add fade-in to music clip
- Create volume automation curve
- Test crossfade between two music tracks

---

### AC3: Auto-Ducking (Music under Dialogue)
**Given** I have both dialogue and music in the timeline,
**When** I enable "Auto-Duck Music",
**Then** the system should:
- Detect dialogue clips in timeline
- Automatically lower music volume when dialogue plays
- Ducking amount slider: -3dB to -12dB (default: -6dB)
- Smooth fade-in/out during ducking (100-500ms)
- Visual indicator: Music waveform dims during ducking

**Auto-Ducking Algorithm**:
```typescript
export async function applyAutoDucking(
  dialogueClips: TimelineClip[],
  musicClips: TimelineClip[],
  duckAmount: number // -3 to -12 dB
): Promise<TimelineClip[]>; // Returns musicClips with volume automation
```

**Verification**:
- Add dialogue and music to timeline
- Enable auto-ducking
- Verify music lowers during dialogue (visual + audio)
- Test different ducking amounts (-3dB vs -12dB)

---

### AC4: Audio Level Monitoring
**Given** I am mixing audio,
**When** timeline is playing or exporting,
**Then** I should see:
- **VU Meters** (Volume Unit) for each track:
  - Green zone: -20 to -10 dBFS (optimal)
  - Yellow zone: -10 to -3 dBFS (caution)
  - Red zone: -3 to 0 dBFS (clipping risk)
- **Master Meter**: Combined output level
- **LUFS Meter**: Loudness Units relative to Full Scale (broadcast standard)
- Clipping warnings: "⚠️ Dialogue track clipping at 0:45"

**Target Levels**:
- Dialogue: -12 to -6 dBFS (clear, intelligible)
- Music: -18 to -12 dBFS (supportive, not overpowering)
- SFX: -20 to -10 dBFS (present, not distracting)
- Master: -16 LUFS ±1 (broadcast standard)

**Verification**:
- Play timeline and observe VU meters
- Intentionally clip audio and verify warning appears
- Check LUFS reading matches -16 target

---

### AC5: Automatic Mix Balancing
**Given** I have mixed audio that's unbalanced,
**When** I click "Auto-Balance Mix",
**Then** the system should:
- Analyze all tracks and detect level imbalances
- Recommend volume adjustments:
  - "Dialogue too quiet: +4dB recommended"
  - "Music overpowering: -6dB recommended"
- One-click "Apply Recommendations"
- Preserve relative balance between clips (proportional adjustment)

**AI Mix Analysis**:
```typescript
export async function analyzeMixBalance(
  tracks: TimelineClip[][]
): Promise<MixRecommendation[]>;

interface MixRecommendation {
  trackType: 'dialogue' | 'music' | 'sfx';
  currentLevel: number; // dBFS
  recommendedLevel: number; // dBFS
  adjustment: number; // +/- dB
  reason: string; // "Dialogue is 10dB quieter than broadcast standard"
}
```

**Verification**:
- Create intentionally unbalanced mix
- Run auto-balance
- Verify recommendations are accurate
- Apply and verify improved balance

---

### AC6: Audio Effects and Processing
**Given** I want to enhance audio quality,
**When** I access audio effects,
**Then** I should see:
- **EQ (Equalizer)**: 3-band (Low, Mid, High) with ±12dB adjustment
- **Compression**: Auto-level loud/soft parts (threshold, ratio)
- **Reverb**: Add room ambience (dry/wet mix)
- **Noise Reduction**: Remove background hiss/hum
- **Normalize**: Auto-adjust to target level (-16 LUFS)

**Effect Chain** (per clip or track):
```typescript
interface AudioEffects {
  eq?: { low: number; mid: number; high: number }; // -12 to +12 dB
  compression?: { threshold: number; ratio: number }; // e.g., -18dB, 4:1
  reverb?: { wetDryMix: number }; // 0-100%
  noiseReduction?: { strength: number }; // 0-100%
  normalize?: { targetLUFS: number }; // -16 default
}
```

**Verification**:
- Apply EQ to dialogue (boost mids for clarity)
- Add compression to music (even out dynamics)
- Apply reverb to footsteps (room ambience)
- Test noise reduction on dialogue clip

---

### AC7: Director Agent Mixing Advice
**Given** I need help with audio mixing,
**When** I ask Director Agent for mixing advice,
**Then** Director should:
- Analyze current mix levels
- Recommend adjustments for clarity and balance
- Explain mixing principles (e.g., "Dialogue should be loudest element")
- Suggest EQ and compression settings
- Reference professional film mixes

**Example Queries**:
> User: "Why can't I hear the dialogue clearly?"
> Director: "Your music is -10dBFS while dialogue is -14dBFS. Recommend **lowering music by 4dB** or **boosting dialogue by 2dB**. Dialogue should be 3-6dB louder than music for clarity. Enable **Auto-Duck** for automatic balancing."

> User: "How do I make dialogue sound more professional?"
> Director: "Apply **EQ**: boost 2-4kHz for presence, cut below 80Hz to remove rumble. Add light **compression** (4:1 ratio, -18dB threshold) to even out levels. Target -12dBFS average."

**Verification**:
- Ask Director for mixing advice on unbalanced mix
- Verify recommendations improve audio clarity
- Test "Apply Director's Suggestions" functionality

---

### AC8: Mix Presets and Templates
**Given** I want to apply professional mixing quickly,
**When** I access mix presets,
**Then** I should see:
- **Dialogue-Heavy Preset**: Dialogue +3dB, Music -6dB, SFX -3dB
- **Cinematic Preset**: Music prominent, balanced dialogue
- **Documentary Preset**: Dialogue dominant, subtle music
- **Action Preset**: SFX prominent, music energetic
- **Custom Presets**: Save current mix as template

**Preset Application**:
- One-click apply to entire timeline
- Preview before committing
- Undo/redo support

**Verification**:
- Apply 3 different presets to same timeline
- Verify clear audible differences
- Save custom preset and reuse in different project

---

## Integration Verification

### IV1: Dialogue Integration (Story 4.4)
**Requirement**: Dialogue clips from Story 4.4 mix seamlessly with music/SFX.

**Verification Steps**:
1. Generate dialogue via Story 4.4
2. Add music and SFX
3. Enable auto-ducking
4. Verify clean mix without clipping

**Expected Result**: Multi-track mixing functional.

---

### IV2: Music Integration (Story 5.1)
**Requirement**: Generated music integrates with timeline mixing.

**Verification Steps**:
1. Generate music via Story 5.1
2. Add to timeline music track
3. Apply volume automation
4. Verify music responds to faders and effects

**Expected Result**: Music tracks fully mixable.

---

### IV3: SFX Integration (Story 5.2)
**Requirement**: Sound effects layer correctly with dialogue/music.

**Verification Steps**:
1. Generate SFX via Story 5.2
2. Add to timeline SFX track
3. Verify SFX audible but not overpowering
4. Test auto-balance recommendations

**Expected Result**: Balanced 3-track mix (dialogue, music, SFX).

---

## Migration/Compatibility

### MC1: Projects Without Audio Mixing
**Requirement**: Legacy projects with basic audio work with new mixing tools.

**Verification Steps**:
1. Load project with dialogue-only timeline
2. Add music and SFX
3. Apply auto-balance
4. Verify smooth upgrade

**Expected Result**: Backward compatibility with graceful enhancement.

---

### MC2: Mix State Persistence
**Requirement**: All mix settings persist across sessions.

**Verification Steps**:
1. Apply effects, automation, and fades to timeline
2. Save project
3. Reload project
4. Verify all mix settings restored

**Expected Result**: Complete mix state preservation.

---

## Technical Implementation Notes

### Service Layer

**Create `services/audioMixingService.ts`**:
```typescript
export async function applyAutoDucking(
  dialogueClips: TimelineClip[],
  musicClips: TimelineClip[],
  duckAmount: number
): Promise<TimelineClip[]>;

export async function analyzeMixBalance(
  tracks: TimelineClip[][]
): Promise<MixRecommendation[]>;

export async function applyAudioEffects(
  audioBuffer: AudioBuffer,
  effects: AudioEffects
): Promise<AudioBuffer>;

export async function normalizeToLUFS(
  audioBuffer: AudioBuffer,
  targetLUFS: number
): Promise<AudioBuffer>;

export async function measureLoudness(
  audioBuffer: AudioBuffer
): Promise<{ peak: number; rms: number; lufs: number }>;

// Preset management
export async function applyMixPreset(
  preset: MixPreset,
  tracks: TimelineClip[][]
): Promise<TimelineClip[][]>;
```

### Web Audio API Effects

**EQ Implementation**:
```typescript
function applyEQ(audioContext: AudioContext, source: AudioBufferSourceNode, eq: { low: number; mid: number; high: number }) {
  const lowShelf = audioContext.createBiquadFilter();
  lowShelf.type = 'lowshelf';
  lowShelf.frequency.value = 200;
  lowShelf.gain.value = eq.low;

  const mid = audioContext.createBiquadFilter();
  mid.type = 'peaking';
  mid.frequency.value = 2000;
  mid.Q.value = 1;
  mid.gain.value = eq.mid;

  const highShelf = audioContext.createBiquadFilter();
  highShelf.type = 'highshelf';
  highShelf.frequency.value = 8000;
  highShelf.gain.value = eq.high;

  source.connect(lowShelf).connect(mid).connect(highShelf);
  return highShelf;
}
```

**Compression Implementation**:
```typescript
function applyCompression(audioContext: AudioContext, source: AudioNode, compression: { threshold: number; ratio: number }) {
  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = compression.threshold;
  compressor.ratio.value = compression.ratio;
  compressor.attack.value = 0.003; // 3ms
  compressor.release.value = 0.25; // 250ms

  source.connect(compressor);
  return compressor;
}
```

### LUFS Measurement

**ITU-R BS.1770 Algorithm** (simplified):
```typescript
function calculateLUFS(audioBuffer: AudioBuffer): number {
  const channelData = audioBuffer.getChannelData(0);
  let sum = 0;
  for (let i = 0; i < channelData.length; i++) {
    sum += channelData[i] * channelData[i];
  }
  const rms = Math.sqrt(sum / channelData.length);
  const lufs = -0.691 + 10 * Math.log10(rms);
  return lufs;
}
```

---

## Definition of Done

- [ ] Multi-track timeline view (dialogue, music, SFX, video)
- [ ] Audio clip editing (trim, split, fade, volume automation)
- [ ] Auto-ducking functional
- [ ] Audio level monitoring (VU meters, LUFS)
- [ ] Automatic mix balancing with AI recommendations
- [ ] Audio effects (EQ, compression, reverb, noise reduction, normalize)
- [ ] Director Agent mixing advice
- [ ] Mix presets and templates
- [ ] Integration verification complete (dialogue, music, SFX)
- [ ] Migration/compatibility verified
- [ ] Code reviewed and approved
- [ ] User acceptance testing (>70% usage, >85% satisfaction, 100% broadcast compliance)
- [ ] CLAUDE.md updated

---

## Dependencies

### Prerequisites
- **Story 4.4** (Dialogue Timeline) completed
- **Story 5.1** (Music) completed
- **Story 5.2** (SFX) completed

### Related Stories
- **Story 5.4** (Audio Export): Export mixed audio production

---

## Testing Strategy

### Unit Tests
- Auto-ducking algorithm accuracy
- LUFS measurement precision
- Audio effect calculations

### Integration Tests
- Multi-track playback sync
- Effect chain processing
- Mix preset application

### Performance Tests
- Mixing 10+ audio clips in real-time
- Effect processing latency
- Memory usage with large timelines

### Manual Testing
- Audio quality assessment (before/after mixing)
- User acceptance testing (mixing workflow UX)
- Broadcast loudness compliance verification

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 5, Story 5.3
- **ITU-R BS.1770**: Loudness measurement standard
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **Mixing Best Practices**: https://www.soundonsound.com/techniques/mixing-dialogue

---

**END OF STORY**
