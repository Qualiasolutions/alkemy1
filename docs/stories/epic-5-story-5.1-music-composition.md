---
last_sync: '2025-11-20T11:26:45.301Z'
auto_sync: true
---
# Story 5.1: AI Music Composition

**Epic**: Epic 5 - Music, Sound & Audio Mixing
**PRD Reference**: Section 6, Epic 5, Story 5.1
**Status**: Not Started
**Priority**: High (V2.0 Core Feature)
**Estimated Effort**: 8 story points
**Dependencies**: Epic R3b (Audio Production Research)
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** generate original music scores that match my film's mood and genre,
**So that** I can enhance emotional impact without hiring composers or licensing expensive tracks.

---

## Business Value

**Problem Statement**:
Professional music composition is expensive ($500-$5000+ per track) and licensing popular music has strict legal constraints. Filmmakers need affordable, royalty-free music that emotionally resonates with their scenes.

**Value Proposition**:
AI music composition enables filmmakers to:
- Generate unlimited original music tracks instantly
- Match music to scene emotion and genre automatically
- Iterate on compositions without additional costs
- Own full rights to generated music (royalty-free)

**Success Metric**: >60% of projects use AI-generated music for at least 50% of scenes; >85% user satisfaction with music quality.

---

## Key Acceptance Criteria

### AC1: Music Generation Interface
**Given** I am working on a scene,
**When** I access the music composer,
**Then** I should see:
- **Mood Selector**: Dropdown with 12+ moods:
  - Happy, Sad, Tense, Romantic, Energetic, Calm, Mysterious, Epic, Playful, Dark, Uplifting, Melancholic
- **Genre Selector**: Dropdown with 15+ genres:
  - Orchestral, Electronic, Jazz, Rock, Ambient, Piano, Cinematic, Folk, Hip-Hop, Classical, World, Lo-Fi, Synthwave
- **Duration Slider**: 10s - 5min (default: match scene duration)
- **Tempo Control**: BPM slider (60-180 BPM) or presets (Slow, Medium, Fast)
- **Instrumentation Preferences**: Checkboxes (Piano, Strings, Drums, Bass, Synth, Guitar, etc.)
- "Generate Music" button

**Verification**:
- Select "Tense + Orchestral + 120s duration"
- Generate music and verify it matches selections
- Test 5 different mood/genre combinations

---

### AC2: Scene-Based Music Generation
**Given** I have analyzed a screenplay with emotional beats,
**When** I click "Generate Music for Scene",
**Then** the system should:
- Analyze scene description and dialogue for emotional context
- Auto-select appropriate mood and genre
- Generate music that:
  - Matches scene duration
  - Aligns with emotional arc (e.g., builds tension, resolves)
  - Complements dialogue (softer during speaking, swells between lines)
- Display preview with scene metadata: "Scene 5: INT. WAREHOUSE - Tension, 2m 30s"

**AI Analysis Pattern**:
```typescript
export async function analyzeMusicNeeds(
  scene: AnalyzedScene
): Promise<MusicSpecification> {
  // Returns: { mood, genre, duration, tempo, dynamics }
}
```

**Verification**:
- Generate music for 3 different scene types (action, romance, horror)
- Verify music matches scene emotion
- Test with various scene durations

---

### AC3: Music Provider Integration
**Given** the app integrates with music generation APIs,
**When** music is generated,
**Then** the system should support multiple providers:
- **Suno AI**: High-quality, versatile (requires API key)
- **Udio**: Professional composition (requires API key)
- **MusicGen (Hugging Face)**: Free, open-source (slower, lower quality)
- **Google MusicLM**: Integrated with Gemini (if available)

**Provider Selection**:
- Fallback order: Suno → Udio → MusicGen (based on API key availability)
- Provider quality indicators: "⭐⭐⭐ Premium" vs "⭐⭐ Standard"
- Cost estimates: "$0.10 per track (Suno)" vs "Free (MusicGen)"

**Verification**:
- Configure 2+ music providers
- Generate music with each
- Verify quality differences and fallback logic

---

### AC4: Music Variations and Iterations
**Given** I have generated a music track,
**When** I want alternative versions,
**Then** I should be able to:
- Click "Generate Variations" → creates 3 alternative versions
- Adjust parameters and regenerate
- "Extend Track" → adds 30s-1min continuation
- "Remix" → changes instrumentation while keeping melody
- Keep/discard versions

**Variation Types**:
- **Structural Variation**: Same mood, different melody
- **Instrumental Variation**: Same melody, different instruments
- **Tempo Variation**: Faster/slower version

**Verification**:
- Generate 3 variations of same music spec
- Extend 60s track to 90s
- Remix orchestral track to electronic

---

### AC5: Music Library Management
**Given** I have generated multiple music tracks,
**When** I access the music library,
**Then** I should see:
- Grid view of all generated tracks with:
  - Waveform thumbnail
  - Mood/genre tags
  - Duration
  - Used in projects indicator
- Filter controls: Mood, Genre, Duration, Date
- Search by tags or description
- "Favorite" star ratings
- Bulk actions: Delete, Export, Add to Timeline

**Library Organization**:
```typescript
interface MusicTrack {
  id: string;
  userId: string;
  mood: string;
  genre: string;
  duration: number;
  tempo: number;
  audioUrl: string;
  waveformUrl?: string;
  isFavorite: boolean;
  usedInProjects: string[]; // Project IDs
  createdAt: string;
}
```

**Verification**:
- Generate 10+ tracks with different moods/genres
- Filter by mood and verify correct tracks display
- Test favorite/unfavorite functionality

---

### AC6: Director Agent Music Recommendations
**Given** I need help selecting music,
**When** I ask Director Agent for music advice,
**Then** Director should:
- Analyze scene context and recommend mood/genre
- Explain music theory reasoning (e.g., "Minor key creates sadness")
- Suggest tempo and instrumentation
- Reference famous film scores for inspiration
- One-click "Generate Recommended Music"

**Example Queries**:
> User: "What music should I use for a chase scene?"
> Director: "Recommend **Energetic + Electronic + 140 BPM**. Fast tempo and driving beat create urgency. Reference: *Mad Max: Fury Road* (Junkie XL)."

> User: "How do I make this romantic scene more emotional?"
> Director: "Suggest **Romantic + Piano + Slow tempo**. Solo piano is intimate and vulnerable. Add strings for climactic moments."

**Verification**:
- Ask Director for music recommendations for 5 scene types
- Verify recommendations match scene emotion
- Test "Generate Recommended Music" functionality

---

### AC7: Music Licensing and Attribution
**Given** I have generated music,
**When** I export my project,
**Then** the system should:
- Include licensing metadata with each track:
  - "Generated by [Provider] via Alkemy AI Studio"
  - "Royalty-free for commercial use"
  - Attribution requirements (if any)
- Export license documentation as PDF
- Watermark option for demo projects (remove watermark on export)

**License Information**:
```typescript
interface MusicLicense {
  trackId: string;
  provider: string;
  generatedAt: string;
  commercialUse: boolean;
  attributionRequired: boolean;
  attributionText?: string;
}
```

**Verification**:
- Generate music and verify license metadata
- Export project with license PDF
- Test attribution text generation

---

### AC8: Music Export Options
**Given** I have finalized music for my project,
**When** I export music,
**Then** I should be able to:
- Export individual tracks as:
  - WAV (lossless, professional)
  - MP3 (compressed, web-friendly)
  - FLAC (lossless, smaller than WAV)
- Export full music pack (all project tracks in ZIP)
- Export with stems (if provider supports - e.g., separate drums, melody, bass tracks)

**Export Settings**:
- Sample rate: 44.1kHz, 48kHz
- Bit depth: 16-bit, 24-bit
- Normalization: Auto-level to -16 LUFS

**Verification**:
- Export track as WAV, MP3, FLAC
- Verify file quality matches preview
- Test ZIP package export

---

## Integration Verification

### IV1: Timeline Integration (Story 5.3)
**Requirement**: Generated music transfers to timeline music track.

**Verification Steps**:
1. Generate music track
2. Click "Add to Timeline"
3. Verify music appears in timeline music track

**Expected Result**: Seamless music → timeline workflow.

---

### IV2: Scene Duration Sync
**Requirement**: Music generation matches scene duration automatically.

**Verification Steps**:
1. Analyze scene with 90s duration
2. Generate music for scene
3. Verify music track is exactly 90s

**Expected Result**: Automatic duration matching.

---

### IV3: Director Agent Integration
**Requirement**: Director provides contextual music recommendations.

**Verification Steps**:
1. Ask Director for music advice on scene
2. Click "Generate Recommended Music"
3. Verify music matches Director's suggestion

**Expected Result**: AI-powered music curation.

---

## Migration/Compatibility

### MC1: Projects Without Generated Music
**Requirement**: Projects can use uploaded music files instead.

**Verification Steps**:
1. Upload MP3 file to project
2. Add to timeline
3. Verify playback works correctly

**Expected Result**: Support for user-uploaded music files.

---

### MC2: Provider Fallback
**Requirement**: Music generation works even if primary provider unavailable.

**Verification Steps**:
1. Configure only MusicGen (free provider)
2. Generate music
3. Verify fallback succeeds with quality warning

**Expected Result**: Graceful degradation to free provider.

---

## Technical Implementation Notes

### Service Layer

**Create `services/musicService.ts`**:
```typescript
export interface MusicSpecification {
  mood: string;
  genre: string;
  duration: number; // Seconds
  tempo: number; // BPM
  instrumentation?: string[]; // ['piano', 'strings', 'drums']
}

export async function generateMusic(
  spec: MusicSpecification,
  onProgress?: (progress: number) => void
): Promise<string>; // Returns audio URL

export async function generateMusicVariations(
  trackId: string,
  count: number
): Promise<string[]>; // Array of audio URLs

export async function extendMusic(
  trackId: string,
  additionalDuration: number
): Promise<string>;

export async function analyzeMusicNeeds(
  scene: AnalyzedScene
): Promise<MusicSpecification>;

export async function exportMusicLibrary(
  projectId: string,
  format: 'wav' | 'mp3' | 'flac'
): Promise<Blob>; // ZIP file

// Provider-specific implementations
async function generateWithSuno(spec: MusicSpecification): Promise<string>;
async function generateWithUdio(spec: MusicSpecification): Promise<string>;
async function generateWithMusicGen(spec: MusicSpecification): Promise<string>;
```

### Data Storage

**Supabase Table**:
```sql
CREATE TABLE music_library (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  mood TEXT NOT NULL,
  genre TEXT NOT NULL,
  duration_seconds INT NOT NULL,
  tempo_bpm INT,
  audio_url TEXT NOT NULL,
  waveform_url TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  provider TEXT NOT NULL,
  license_info JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_music_library_user_mood ON music_library(user_id, mood);
CREATE INDEX idx_music_library_genre ON music_library(genre);
```

**localStorage Fallback**:
```typescript
{
  "alkemy_music_library": {
    "trackId1": { /* MusicTrack */ },
    "trackId2": { /* MusicTrack */ }
  }
}
```

### Music Provider APIs

**Suno AI** (Recommended):
```typescript
const response = await fetch('https://api.suno.ai/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUNO_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: `${spec.mood} ${spec.genre} music, ${spec.tempo} BPM`,
    duration: spec.duration,
    instrumental: true
  })
});
```

**MusicGen (Hugging Face - Free)**:
```typescript
const response = await fetch('https://api-inference.huggingface.co/models/facebook/musicgen-medium', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${HF_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    inputs: `${spec.mood} ${spec.genre} instrumental`,
    parameters: { duration: spec.duration }
  })
});
```

---

## Definition of Done

- [ ] Music generation interface with mood/genre/duration controls
- [ ] Scene-based automatic music generation
- [ ] Music provider integration (Suno, Udio, MusicGen)
- [ ] Music variations and track extension
- [ ] Music library management with filtering
- [ ] Director Agent music recommendations
- [ ] Music licensing and attribution metadata
- [ ] Music export options (WAV, MP3, FLAC, stems)
- [ ] Integration verification complete
- [ ] Migration/compatibility verified
- [ ] Code reviewed and approved
- [ ] User acceptance testing (>60% usage, >85% satisfaction)
- [ ] CLAUDE.md updated

---

## Dependencies

### Prerequisites
- **Epic R3b** completed (audio production research)

### Related Stories
- **Story 5.3** (Audio Mixing): Mix music with dialogue/effects
- **Story 5.4** (Audio Export): Export complete audio production

---

## Testing Strategy

### Unit Tests
- Music specification validation
- Duration calculation accuracy
- License metadata generation

### Integration Tests
- Music generation → timeline workflow
- Provider fallback logic
- Library filtering and search

### Manual Testing
- Music quality assessment across moods/genres
- User acceptance testing (music selection UX)
- Cross-browser audio playback compatibility

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 5, Story 5.1
- **Epic R3b**: Audio production research
- **Suno AI**: https://suno.ai/
- **MusicGen**: https://huggingface.co/facebook/musicgen-medium

---

**END OF STORY**
