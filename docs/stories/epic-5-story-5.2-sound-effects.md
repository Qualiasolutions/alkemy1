# Story 5.2: Sound Effects and Foley Generation

**Epic**: Epic 5 - Music, Sound & Audio Mixing
**PRD Reference**: Section 6, Epic 5, Story 5.2
**Status**: Not Started
**Priority**: Medium (V2.0 Core Feature)
**Estimated Effort**: 6 story points
**Dependencies**: Epic R3b (Audio Production Research)
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** generate realistic sound effects and foley that sync with my visuals,
**So that** my scenes have professional audio depth without recording custom sounds.

---

## Business Value

**Problem Statement**:
Sound design is crucial for immersion but requires expensive sound libraries ($100-$1000+) or professional foley artists. Filmmakers need affordable, high-quality sound effects that match their specific scenes.

**Value Proposition**:
AI sound effects generation enables filmmakers to:
- Generate unlimited custom sound effects on-demand
- Match SFX precisely to visual actions (footsteps, doors, impacts)
- Create ambient soundscapes for environmental realism
- Avoid licensing restrictions and legal complexity

**Success Metric**: >50% of projects use AI-generated sound effects for at least 30% of scenes; >80% user satisfaction with SFX quality.

---

## Key Acceptance Criteria

### AC1: Sound Effect Library Browser
**Given** I need a sound effect for my scene,
**When** I access the SFX library,
**Then** I should see:
- **Category Browser**:
  - Foley (Footsteps, Clothing, Handling)
  - Impacts (Punches, Crashes, Explosions)
  - Ambience (City, Nature, Interior)
  - Mechanical (Doors, Vehicles, Machinery)
  - Human (Breathing, Coughing, Crowd)
  - Weather (Rain, Thunder, Wind)
  - UI/Interface (Beeps, Clicks, Whooshes)
- Pre-generated SFX library (500+ common sounds)
- Search functionality with natural language (e.g., "heavy footsteps on wood")
- Preview button for each sound (plays 2-5 second sample)
- "Add to Scene" button

**Verification**:
- Browse 5 categories and preview sounds
- Search "door slam" and verify relevant results
- Add 3 sounds to scene

---

### AC2: Custom Sound Effect Generation
**Given** I need a specific sound not in the library,
**When** I click "Generate Custom SFX",
**Then** I should see:
- Text prompt input: "Describe the sound you need..."
- Example prompts:
  - "Heavy footsteps on gravel, slow pace"
  - "Old wooden door creaking open slowly"
  - "Glass shattering on concrete floor"
  - "Car engine starting and revving"
- Duration slider: 1s - 30s
- "Generate" button with progress indicator

**AI Generation Pattern**:
```typescript
export async function generateSoundEffect(
  description: string,
  duration: number,
  onProgress?: (progress: number) => void
): Promise<string>; // Returns audio URL
```

**Verification**:
- Generate 5 custom sound effects with different descriptions
- Verify sounds match descriptions
- Test various durations (1s, 5s, 15s)

---

### AC3: Scene-Based Automatic SFX Detection
**Given** I have video shots with visible actions,
**When** I click "Auto-Detect SFX Needs",
**Then** the system should:
- Analyze video frames with Gemini Vision
- Detect actions requiring sound effects:
  - Character walking → Footsteps
  - Door visible → Door open/close
  - Car in frame → Engine, tire sounds
  - Rain visible → Rain ambience
- Generate suggestion list: "We detected 5 actions that need SFX"
- One-click "Generate All Detected SFX"

**Detection Data Model**:
```typescript
interface SFXSuggestion {
  shotId: string;
  timestamp: number; // Seconds into shot
  action: string; // "door_close", "footsteps", etc.
  description: string; // "Wooden door closing slowly"
  confidence: number; // 0-100%
  audioUrl?: string; // After generation
}
```

**Verification**:
- Upload shot with character walking
- Run auto-detection
- Verify "footsteps" suggestion appears with timestamp

---

### AC4: Foley Sync with Visuals
**Given** I have generated a sound effect for a specific action,
**When** I sync it with video,
**Then** the system should:
- Display video with waveform overlay
- Drag-and-drop SFX to precise timestamp
- Visual sync markers (e.g., foot hitting ground = waveform peak)
- "Auto-Sync" option: AI aligns SFX to visual action
- Fine-tune controls: ±0.1s adjustment

**Auto-Sync Algorithm**:
```typescript
export async function autoSyncSFXToVisual(
  videoUrl: string,
  sfxUrl: string,
  action: string // e.g., "footsteps"
): Promise<{ timestamp: number; confidence: number }[]>;
```

**Verification**:
- Generate footstep SFX
- Auto-sync to walking character video
- Verify sync accuracy (<100ms error)

---

### AC5: Ambient Soundscape Generation
**Given** I want background ambience for my scene,
**When** I click "Generate Soundscape",
**Then** I should see:
- **Environment Selector**:
  - Urban (City traffic, sirens, crowds)
  - Nature (Forest birds, wind, rustling)
  - Interior (Air conditioning, clock ticking, distant murmurs)
  - Industrial (Factory hum, machinery)
  - Sci-Fi (Computer beeps, spaceship hum)
- **Intensity Slider**: Subtle → Prominent
- **Duration**: Match scene duration
- Layered ambience (multiple ambient elements combined)

**Soundscape Composition**:
```typescript
interface Soundscape {
  environment: string;
  intensity: number; // 0-100%
  layers: {
    layer1: { sound: 'traffic', volume: 0.6 };
    layer2: { sound: 'wind', volume: 0.3 };
    layer3?: { sound: 'birds', volume: 0.4 };
  };
}
```

**Verification**:
- Generate "Urban" soundscape for 2-minute scene
- Verify multiple ambient layers present
- Test intensity slider (subtle vs prominent difference)

---

### AC6: SFX Variation Generator
**Given** I need multiple versions of the same sound,
**When** I click "Generate Variations",
**Then** the system should:
- Create 3-5 variations of same sound type
- Variations differ in:
  - Pitch (e.g., higher/lower footstep)
  - Timing (e.g., faster/slower)
  - Intensity (e.g., softer/louder)
- "Randomize" button for instant variety

**Use Case**: Multiple footsteps, different punch impacts, varied door creaks

**Verification**:
- Generate 5 footstep variations
- Verify perceptible differences between variations
- Use variations in scene and verify natural variety

---

### AC7: Director Agent SFX Recommendations
**Given** I need guidance on sound design,
**When** I ask Director Agent for SFX advice,
**Then** Director should:
- Analyze scene context and recommend appropriate sounds
- Explain sound design principles (e.g., "Off-screen sounds expand world")
- Suggest layering techniques (e.g., "Combine distant traffic + close footsteps")
- Reference iconic film sound design

**Example Queries**:
> User: "What sounds do I need for a tense warehouse scene?"
> Director: "Recommend **Footstep Foley** (echoing in empty space), **Ambient Hum** (industrial ventilation), **Distant Creaks** (tension-building). Sparse sound design creates suspense. Reference: *Alien* (silence + industrial hum)."

**Verification**:
- Ask Director for SFX recommendations for 5 scene types
- Verify recommendations match scene mood
- Test "Generate Recommended SFX" functionality

---

### AC8: SFX Export and Management
**Given** I have generated multiple sound effects,
**When** I manage my SFX library,
**Then** I should be able to:
- View all generated SFX in project
- Filter by category, duration, or usage
- Tag sounds with custom labels ("explosion_small", "footstep_concrete")
- Bulk export as WAV, MP3, or FLAC
- Download SFX pack (ZIP) for external editing

**SFX Library Organization**:
```typescript
interface SoundEffectTrack {
  id: string;
  userId: string;
  projectId: string;
  category: string;
  description: string;
  duration: number;
  audioUrl: string;
  tags: string[];
  usedInShots: string[]; // Shot IDs
  createdAt: string;
}
```

**Verification**:
- Generate 15+ SFX across different categories
- Tag sounds with custom labels
- Export SFX pack and verify all files included

---

## Integration Verification

### IV1: Timeline Integration (Story 5.3)
**Requirement**: Generated SFX transfers to timeline effects track.

**Verification Steps**:
1. Generate sound effect
2. Click "Add to Timeline"
3. Verify SFX appears in timeline effects track at correct timestamp

**Expected Result**: Seamless SFX → timeline workflow.

---

### IV2: Video Shot Integration
**Requirement**: Auto-detect SFX needs from video analysis.

**Verification Steps**:
1. Upload video shot with visible action
2. Run auto-detection
3. Verify SFX suggestions match visual actions

**Expected Result**: AI-powered SFX curation.

---

### IV3: Audio Mixing Integration (Story 5.3)
**Requirement**: SFX mixes with dialogue and music without clipping.

**Verification Steps**:
1. Add SFX, dialogue, and music to timeline
2. Play timeline
3. Verify all tracks mix cleanly

**Expected Result**: Multi-track SFX mixing functional.

---

## Migration/Compatibility

### MC1: Projects Without SFX
**Requirement**: Projects can function without sound effects.

**Verification Steps**:
1. Create project with dialogue and music only
2. Verify timeline plays correctly
3. Add SFX later and verify integration

**Expected Result**: Optional SFX support.

---

### MC2: Uploaded SFX Files
**Requirement**: Support user-uploaded sound effects.

**Verification Steps**:
1. Upload custom WAV file as SFX
2. Add to timeline
3. Verify playback and mixing work

**Expected Result**: Hybrid AI + uploaded SFX workflow.

---

## Technical Implementation Notes

### Service Layer

**Create `services/sfxService.ts`**:
```typescript
export async function generateSoundEffect(
  description: string,
  duration: number,
  onProgress?: (progress: number) => void
): Promise<string>; // Returns audio URL

export async function generateSFXVariations(
  sfxId: string,
  count: number
): Promise<string[]>;

export async function generateSoundscape(
  environment: string,
  intensity: number,
  duration: number
): Promise<string>;

export async function detectSFXNeeds(
  videoUrl: string
): Promise<SFXSuggestion[]>;

export async function autoSyncSFXToVisual(
  videoUrl: string,
  sfxUrl: string,
  action: string
): Promise<{ timestamp: number; confidence: number }[]>;

// Pre-generated library
export async function loadSFXLibrary(): Promise<SoundEffectTrack[]>;
```

### Data Storage

**Supabase Table**:
```sql
CREATE TABLE sfx_library (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_seconds FLOAT NOT NULL,
  audio_url TEXT NOT NULL,
  tags TEXT[],
  provider TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sfx_library_category ON sfx_library(category);
CREATE INDEX idx_sfx_library_tags ON sfx_library USING GIN(tags);
```

**localStorage Fallback**:
```typescript
{
  "alkemy_sfx_library": {
    "sfxId1": { /* SoundEffectTrack */ },
    "sfxId2": { /* SoundEffectTrack */ }
  }
}
```

### SFX Provider APIs

**ElevenLabs Sound Effects** (Recommended):
```typescript
const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
  method: 'POST',
  headers: {
    'xi-api-key': ELEVENLABS_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: description,
    duration_seconds: duration
  })
});
```

**AudioCraft (Meta - Free)**:
```typescript
const response = await fetch('https://api-inference.huggingface.co/models/facebook/audiogen-medium', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${HF_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    inputs: description,
    parameters: { duration: duration }
  })
});
```

---

## Definition of Done

- [ ] SFX library browser with 500+ pre-generated sounds
- [ ] Custom sound effect generation
- [ ] Scene-based automatic SFX detection
- [ ] Foley sync with visuals (auto-sync + manual)
- [ ] Ambient soundscape generation
- [ ] SFX variation generator
- [ ] Director Agent SFX recommendations
- [ ] SFX export and library management
- [ ] Integration verification complete
- [ ] Migration/compatibility verified
- [ ] Code reviewed and approved
- [ ] User acceptance testing (>50% usage, >80% satisfaction)
- [ ] CLAUDE.md updated

---

## Dependencies

### Prerequisites
- **Epic R3b** completed (audio production research)

### Related Stories
- **Story 5.3** (Audio Mixing): Mix SFX with dialogue/music
- **Story 5.4** (Audio Export): Export complete audio production

---

## Testing Strategy

### Unit Tests
- SFX description parsing
- Duration validation
- Auto-sync algorithm accuracy

### Integration Tests
- SFX generation → timeline workflow
- Video analysis → SFX suggestions
- Provider fallback logic

### Manual Testing
- SFX quality assessment across categories
- Sync accuracy testing (visual action → sound)
- User acceptance testing (SFX selection UX)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 5, Story 5.2
- **Epic R3b**: Audio production research
- **ElevenLabs Sound Generation**: https://elevenlabs.io/sound-effects
- **AudioCraft**: https://github.com/facebookresearch/audiocraft

---

**END OF STORY**
