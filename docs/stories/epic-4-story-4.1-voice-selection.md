---
last_sync: '2025-11-21T10:29:34.074Z'
auto_sync: true
---
# Story 4.1: Character Voice Selection and Casting

**Epic**: Epic 4 - Voice & Dialogue Production
**PRD Reference**: Section 6, Epic 4, Story 4.1
**Status**: Not Started
**Priority**: High (V2.1 Feature)
**Estimated Effort**: 6 story points
**Dependencies**: Epic R3a (Voice I/O Research)
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** select and assign unique AI voices to each character,
**So that** dialogue sounds natural and matches character personalities.

---

## Business Value

**Problem Statement**:
Generated dialogue lacks emotional depth and character differentiation when using generic text-to-speech. Filmmakers need control over voice characteristics (age, accent, tone) to bring characters to life.

**Value Proposition**:
Character voice casting enables filmmakers to:
- Assign distinct voices that match character profiles (age, gender, personality)
- Preview voice samples before committing to dialogue generation
- Adjust voice parameters (pitch, speed, emotion) per character
- Maintain voice consistency across entire production

**Success Metric**: >80% of projects use custom voice casting for at least 2 characters; >90% user satisfaction with voice quality.

---

## Key Acceptance Criteria

### AC1: Voice Library Browser
**Given** I am viewing a character in Cast & Locations Tab,
**When** I click "Assign Voice",
**Then** I should see:
- Voice library with 20+ AI voices organized by:
  - Gender (Male, Female, Non-binary)
  - Age (Child, Teen, Adult, Senior)
  - Accent (American, British, Australian, etc.)
  - Personality (Confident, Shy, Energetic, Calm)
- Preview button for each voice (plays 10-second sample)
- Filter controls to narrow selection
- Search by voice name or characteristics

**Verification**:
- Load voice library with 20+ voices
- Test filter combinations (e.g., "Female + British + Confident")
- Verify preview audio plays correctly

---

### AC2: Voice Assignment to Character
**Given** I have selected a voice from the library,
**When** I click "Assign to Character",
**Then** the following should occur:
- Character profile updates with voice metadata:
  ```typescript
  interface Character {
    // ... existing fields
    voice?: {
      voiceId: string;
      voiceName: string;
      provider: 'elevenlabs' | 'google' | 'openai';
      parameters: {
        pitch: number; // -20 to +20 semitones
        speed: number; // 0.5x to 2.0x
        stability: number; // 0-100% (voice consistency)
        clarity: number; // 0-100% (articulation)
      };
      previewUrl?: string;
    };
  }
  ```
- Visual indicator: "🔊 Voice: [Voice Name]" badge on character card
- "Test Dialogue" button appears to preview voice with sample line

**Verification**:
- Assign voice to character
- Verify character state updates correctly
- Test dialogue preview plays with assigned voice

---

### AC3: Voice Parameter Customization
**Given** I have assigned a voice to a character,
**When** I access voice settings,
**Then** I should see customization controls:
- **Pitch**: Slider (-20 to +20 semitones) with real-time preview
- **Speed**: Slider (0.5x to 2.0x) with real-time preview
- **Stability**: Slider (0-100%) - higher = more consistent, lower = more expressive
- **Clarity**: Slider (0-100%) - higher = clearer articulation
- "Reset to Defaults" button
- "Save Custom Preset" button (saves parameters for reuse)

**Preview Behavior**:
- Sample dialogue line plays as parameters adjust
- Debounced updates (300ms) to avoid API spam
- Loading indicator during preview generation

**Verification**:
- Adjust all parameters and verify preview updates
- Save custom preset and verify it persists
- Test reset to defaults functionality

---

### AC4: Multi-Voice Management
**Given** I have multiple characters with assigned voices,
**When** I view the character list,
**Then** I should see:
- Voice indicators for each character
- Bulk actions:
  - "Assign Voices to All Characters" (AI auto-matching based on character descriptions)
  - "Clear All Voices"
  - "Export Voice Assignments" (JSON file)
- Voice conflict warnings (e.g., "3 characters use same voice")

**AI Auto-Matching**:
- Analyzes character descriptions from script analysis
- Suggests appropriate voice for each character
- User reviews and approves suggestions before assignment

**Verification**:
- Assign voices to 5+ characters
- Test AI auto-matching with character descriptions
- Verify conflict warnings display correctly

---

### AC5: Voice Provider Integration
**Given** the app integrates with multiple TTS providers,
**When** voice generation is triggered,
**Then** the system should:
- Support multiple providers:
  - **ElevenLabs**: Premium quality, emotional range (requires API key)
  - **Google Cloud TTS**: Reliable, cost-effective (uses existing Gemini key)
  - **OpenAI TTS**: Natural, expressive (requires API key)
- Fallback order: ElevenLabs → OpenAI → Google (based on availability)
- Provider selection per character (if multiple keys configured)
- API key management in settings (encrypted storage)

**Provider Availability Check**:
```typescript
interface VoiceProviderStatus {
  elevenlabs: { available: boolean; quotaRemaining?: number };
  google: { available: boolean };
  openai: { available: boolean; quotaRemaining?: number };
}
```

**Verification**:
- Configure API keys for 2+ providers
- Test voice generation with each provider
- Verify fallback behavior when primary provider unavailable

---

### AC6: Voice Consistency Validation
**Given** I have assigned a voice to a character,
**When** dialogue is generated for that character,
**Then** the system should:
- Use the same voice parameters for all dialogue lines
- Display warning if voice parameters change mid-project
- Track voice version (if provider updates voice model)
- Option to lock voice settings (prevent accidental changes)

**Validation Checks**:
- Voice ID matches across all character dialogue
- Parameters (pitch, speed) remain consistent
- Provider remains consistent (or uses same voice clone if switching)

**Verification**:
- Generate dialogue for character in multiple scenes
- Verify voice consistency across all lines
- Test voice lock feature

---

### AC7: Voice Preview with Script Context
**Given** I want to test a voice with actual script dialogue,
**When** I click "Preview with Script Line",
**Then** the system should:
- Display character's first 3 dialogue lines from script
- Allow selection of which line to preview
- Generate audio with full voice parameters
- Play preview inline with waveform visualization
- Option to regenerate with different parameters

**Verification**:
- Select character with dialogue lines in script
- Preview multiple lines with different voice settings
- Verify waveform displays during playback

---

### AC8: Voice Cloning (Advanced - Optional)
**Given** I want to use a custom voice (e.g., my own or an actor's),
**When** I access voice cloning features,
**Then** I should be able to:
- Upload 1-5 minutes of clean audio samples
- Train custom voice model (if provider supports - e.g., ElevenLabs)
- Preview cloned voice quality
- Assign cloned voice to character
- Warning: "Voice cloning requires consent from voice owner"

**Legal Safeguards**:
- Consent acknowledgment checkbox
- Terms of service link for voice cloning policies
- Watermarking/attribution for cloned voices

**Verification**:
- Upload audio samples for voice cloning
- Test cloned voice preview
- Verify legal safeguards display correctly

---

## Integration Verification

### IV1: Character State Integration
**Requirement**: Voice assignments persist in character data across sessions.

**Verification Steps**:
1. Assign voices to 3 characters
2. Save project to localStorage/Supabase
3. Reload project
4. Verify all voice assignments restored correctly

**Expected Result**: Voice metadata persists and restores accurately.

---

### IV2: Dialogue Generation Integration (Story 4.2)
**Requirement**: Assigned voices are used automatically when generating dialogue.

**Verification Steps**:
1. Assign voice to character
2. Generate dialogue for character (Story 4.2 workflow)
3. Verify generated audio uses assigned voice and parameters

**Expected Result**: Seamless handoff from voice assignment to dialogue generation.

---

### IV3: Timeline Integration (Story 4.4)
**Requirement**: Dialogue audio clips include voice metadata for editing.

**Verification Steps**:
1. Generate dialogue with assigned voice
2. Transfer dialogue to timeline
3. Verify timeline clip includes voice provider and parameters in metadata

**Expected Result**: Voice metadata available for re-rendering or adjustments.

---

## Migration/Compatibility

### MC1: Projects Without Voice Assignments
**Requirement**: Existing projects work with default voices.

**Verification Steps**:
1. Load project created before voice feature
2. Generate dialogue for character without assigned voice
3. Verify system uses default voice (Google TTS)

**Expected Result**: Graceful degradation to default voice provider.

---

### MC2: Voice Provider Migration
**Requirement**: Switch voice providers without losing assignments.

**Verification Steps**:
1. Assign ElevenLabs voice to character
2. Remove ElevenLabs API key (simulate provider unavailable)
3. Generate dialogue
4. Verify fallback to Google with closest matching voice

**Expected Result**: Smooth provider fallback with minimal quality loss.

---

## Technical Implementation Notes

### Service Layer

**Create `services/voiceService.ts`**:
```typescript
export interface VoiceProfile {
  id: string;
  name: string;
  provider: 'elevenlabs' | 'google' | 'openai';
  gender: 'male' | 'female' | 'neutral';
  age: 'child' | 'teen' | 'adult' | 'senior';
  accent: string;
  description: string;
  previewUrl: string;
  parameters: {
    pitch: number;
    speed: number;
    stability: number;
    clarity: number;
  };
}

export async function getVoiceLibrary(): Promise<VoiceProfile[]>;
export async function previewVoice(
  voiceId: string,
  text: string,
  parameters?: Partial<VoiceProfile['parameters']>
): Promise<string>; // Returns audio URL
export async function assignVoiceToCharacter(
  characterId: string,
  voice: VoiceProfile
): Promise<void>;
export async function autoMatchVoices(
  characters: Character[]
): Promise<Record<string, VoiceProfile>>; // AI-powered voice suggestions
export async function cloneVoice(
  audioSamples: File[],
  voiceName: string
): Promise<VoiceProfile>;
```

### Data Storage

**Supabase Table**:
```sql
CREATE TABLE character_voices (
  character_id UUID PRIMARY KEY,
  voice_id TEXT NOT NULL,
  voice_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE custom_voices (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  voice_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  voice_id TEXT NOT NULL, -- Provider's voice clone ID
  created_at TIMESTAMP DEFAULT NOW()
);
```

**localStorage Fallback**:
```typescript
{
  "alkemy_character_voices": {
    "characterId1": { /* VoiceProfile */ },
    "characterId2": { /* VoiceProfile */ }
  }
}
```

### Voice Provider SDKs

**ElevenLabs**:
```typescript
import { ElevenLabsClient } from 'elevenlabs';
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
```

**Google Cloud TTS**:
```typescript
// Uses existing Gemini API credentials
// Endpoint: https://texttospeech.googleapis.com/v1/text:synthesize
```

**OpenAI TTS**:
```typescript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const audio = await openai.audio.speech.create({ /* ... */ });
```

---

## Definition of Done

- [ ] Voice library with 20+ voices implemented
- [ ] Voice assignment to characters functional
- [ ] Voice parameter customization working
- [ ] Multi-voice management with AI auto-matching
- [ ] Voice provider integration (Google TTS minimum, ElevenLabs/OpenAI optional)
- [ ] Voice consistency validation implemented
- [ ] Script context preview functional
- [ ] Voice cloning feature (optional, if provider supports)
- [ ] Integration verification complete (character state, dialogue generation, timeline)
- [ ] Migration/compatibility verified
- [ ] Code reviewed and approved
- [ ] User acceptance testing (>80% voice casting usage, >90% satisfaction)
- [ ] CLAUDE.md updated

---

## Dependencies

### Prerequisites
- **Epic R3a** completed (voice technology validation)

### Related Stories
- **Story 4.2** (Dialogue Generation): Uses assigned voices
- **Story 4.4** (Timeline Integration): Voice metadata in clips

---

## Testing Strategy

### Unit Tests
- Voice library filtering and search
- Voice parameter validation
- AI voice auto-matching algorithm

### Integration Tests
- Voice assignment → dialogue generation workflow
- Provider fallback logic
- Voice persistence across sessions

### Manual Testing
- Voice quality assessment across providers
- User acceptance testing (voice selection UX)
- Cross-browser audio playback compatibility

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 4, Story 4.1
- **Epic R3a**: Voice I/O research findings
- **ElevenLabs Docs**: https://docs.elevenlabs.io/
- **Google Cloud TTS**: https://cloud.google.com/text-to-speech
- **OpenAI TTS**: https://platform.openai.com/docs/guides/text-to-speech

---

**END OF STORY**
