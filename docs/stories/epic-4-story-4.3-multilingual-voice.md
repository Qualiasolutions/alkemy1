---
last_sync: '2025-11-21T10:28:18.277Z'
auto_sync: true
---
# Story 4.3: Multilingual Voice Synthesis

**Epic**: Epic 4 - Voice & Dialogue Production
**PRD Reference**: Section 6, Epic 4, Story 4.3
**Status**: Not Started
**Priority**: Medium (V2.1 Feature)
**Estimated Effort**: 7 story points
**Dependencies**: Story 4.1 (Voice Selection), Story 4.2 (Dialogue Generation)
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker creating content for international audiences,
**I want to** generate dialogue in multiple languages with natural-sounding accents,
**So that** I can localize my films without hiring multilingual voice actors.

---

## Business Value

**Problem Statement**:
Localization is expensive and time-consuming, often requiring separate voice actor recording sessions for each language. Filmmakers need cost-effective multilingual production capabilities to reach global audiences.

**Value Proposition**:
Multilingual voice synthesis enables filmmakers to:
- Generate dialogue in 20+ languages instantly
- Maintain character voice consistency across languages
- Support regional accents and dialects
- Produce localized versions for international markets at minimal cost

**Success Metric**: >30% of projects generate dialogue in 2+ languages; >85% user satisfaction with localization quality.

---

## Key Acceptance Criteria

### AC1: Language Selection Interface
**Given** I am generating dialogue for a character,
**When** I access language settings,
**Then** I should see:
- Language selector dropdown with 20+ languages:
  - English (US, UK, Australian, Indian accents)
  - Spanish (Spain, Latin America)
  - French (France, Canadian)
  - German, Italian, Portuguese, Russian
  - Mandarin, Japanese, Korean, Hindi
  - Arabic, Turkish, Dutch, Polish
- Regional accent selector (where applicable)
- "Auto-Detect from Script" option (analyzes screenplay language)
- Language assignment per character or per scene

**Language Data Model**:
```typescript
interface LanguageSettings {
  language: string; // ISO 639-1 code (e.g., 'en', 'es', 'zh')
  region?: string; // ISO 3166-1 alpha-2 (e.g., 'US', 'ES', 'CN')
  accent?: string; // e.g., 'british', 'australian'
}

interface Character {
  // ... existing fields
  language?: LanguageSettings;
}
```

**Verification**:
- Select 5 different languages for different characters
- Test regional accent variations
- Verify auto-detect identifies correct screenplay language

---

### AC2: Voice Library Multilingual Support
**Given** I select a language for a character,
**When** I browse the voice library,
**Then** the system should:
- Filter voices to only show speakers fluent in selected language
- Display language tags: "🌐 English (US), Spanish (MX)"
- Maintain voice quality across languages (use multilingual TTS models)
- Preserve character voice timbre when switching languages (if supported by provider)

**Multilingual Voice Matching**:
- If voice doesn't support selected language, suggest closest match
- Warning: "Selected voice doesn't support [language]. Suggest: [Alternative Voice]"

**Verification**:
- Select Spanish, verify voice library filters correctly
- Test voice consistency across languages (same character, different languages)

---

### AC3: Translation Integration
**Given** I have dialogue in one language and want to generate it in another,
**When** I click "Translate Dialogue",
**Then** the system should:
- Use Gemini API for high-quality translation
- Preserve emotional context and tone
- Maintain cultural appropriateness (idioms, expressions)
- Display side-by-side comparison: Original | Translated
- Allow manual edits before generation

**Translation Workflow**:
1. User selects target language
2. System translates all dialogue lines
3. User reviews and edits translations
4. Generate audio with translated text

**Translation API Pattern**:
```typescript
export async function translateDialogue(
  lines: DialogueLine[],
  targetLanguage: LanguageSettings,
  onProgress?: (progress: number) => void
): Promise<DialogueLine[]>; // Returns translated lines
```

**Verification**:
- Translate 10-line scene from English to Spanish
- Verify translation quality and cultural appropriateness
- Test manual edit functionality

---

### AC4: Phonetic Pronunciation Overrides
**Given** dialogue contains names, brands, or technical terms,
**When** I need to control pronunciation,
**Then** I should be able to:
- Mark words with phonetic spelling: "Alkemy [al-kuh-mee]"
- Use IPA notation for precise control: "Gemini [ˈdʒɛmɪnaɪ]"
- Save pronunciation dictionary per project (reusable)
- Preview pronunciation before final generation

**Pronunciation Dictionary**:
```typescript
interface PronunciationDictionary {
  [word: string]: {
    phonetic: string;
    ipa?: string;
    language: string;
  };
}
```

**Verification**:
- Add 5 custom pronunciations for technical terms
- Generate dialogue and verify correct pronunciation
- Test pronunciation dictionary persistence

---

### AC5: Accent Consistency Validation
**Given** a character speaks in a specific accent,
**When** dialogue is generated across multiple scenes,
**Then** the system should:
- Maintain consistent accent throughout production
- Detect accent drift (e.g., British → American mid-scene)
- Display warnings for inconsistencies
- Lock accent settings per character

**Accent Validation**:
```typescript
interface AccentConsistencyReport {
  characterId: string;
  detectedAccents: { sceneId: string; accent: string; confidence: number }[];
  inconsistencies: { sceneId: string; expectedAccent: string; actualAccent: string }[];
}
```

**Verification**:
- Generate dialogue for character across 5 scenes
- Intentionally change accent mid-production
- Verify system detects and warns about inconsistency

---

### AC6: Multilingual Project Management
**Given** I am creating a film in multiple languages,
**When** I access project language settings,
**Then** I should see:
- **Primary Language**: Default language for project
- **Secondary Languages**: List of localization targets
- Language versioning:
  - "Version: English (Original)"
  - "Version: Spanish (Dubbed)"
  - "Version: French (Dubbed)"
- Bulk actions:
  - "Generate All Languages" for scene
  - "Export Multilingual Package" (all audio tracks)

**Language Version Switching**:
- Toggle between language versions in UI
- Preview dialogue in different languages side-by-side
- Track generation status per language (e.g., "English: ✅ Complete, Spanish: 🔄 In Progress")

**Verification**:
- Create project with 3 language versions
- Generate dialogue for all versions
- Switch between versions and verify correct audio plays

---

### AC7: Subtitle Generation
**Given** I have generated multilingual dialogue,
**When** I export the project,
**Then** I should be able to:
- Auto-generate subtitles (SRT, VTT formats)
- Sync subtitles to dialogue timestamps
- Export subtitles for each language version
- Embed subtitles in video export (optional)

**Subtitle File Format** (SRT):
```
1
00:00:01,000 --> 00:00:03,500
Hello, how are you?

2
00:00:03,500 --> 00:00:06,000
I'm doing great, thanks!
```

**Verification**:
- Generate subtitles for English and Spanish versions
- Verify timestamp accuracy
- Test subtitle embedding in video export

---

### AC8: Director Agent Multilingual Assistance
**Given** I need help with multilingual production,
**When** I ask Director Agent language-related questions,
**Then** Director should:
- Recommend appropriate languages based on target audience
- Suggest culturally appropriate voice characteristics
- Provide translation quality feedback
- Recommend accent choices for character backgrounds

**Example Queries**:
> User: "What language should I use for a film about a French detective?"
> Director: "Recommend **French (France)** for authenticity. Consider casting a voice with a Parisian accent for the detective character."

> User: "Should I translate idioms literally?"
> Director: "No, idioms should be localized. For example, 'It's raining cats and dogs' → Spanish 'Llueve a cántaros' (It's raining pitchers)."

**Verification**:
- Ask Director for language recommendations
- Request cultural localization advice
- Test translation quality feedback

---

## Integration Verification

### IV1: Voice Selection Integration (Story 4.1)
**Requirement**: Language settings filter voice library correctly.

**Verification Steps**:
1. Assign Spanish language to character
2. Open voice library
3. Verify only Spanish-speaking voices appear

**Expected Result**: Language-aware voice filtering.

---

### IV2: Dialogue Generation Integration (Story 4.2)
**Requirement**: Multilingual dialogue generates with correct language settings.

**Verification Steps**:
1. Set character language to French
2. Generate dialogue
3. Verify audio is in French with correct accent

**Expected Result**: Seamless language integration in generation workflow.

---

### IV3: Timeline Integration (Story 4.4)
**Requirement**: Timeline supports multiple language tracks.

**Verification Steps**:
1. Generate dialogue in 2 languages
2. Transfer to timeline
3. Verify language tracks are separate and switchable

**Expected Result**: Multi-language audio track management.

---

## Migration/Compatibility

### MC1: Existing Projects Default to English
**Requirement**: Projects created before multilingual feature default to English.

**Verification Steps**:
1. Load legacy project
2. Generate dialogue
3. Verify defaults to English (US)

**Expected Result**: Backward compatibility with English default.

---

### MC2: Voice Provider Language Support
**Requirement**: Graceful degradation when provider doesn't support language.

**Verification Steps**:
1. Select rare language (e.g., Icelandic)
2. Attempt dialogue generation
3. Verify fallback message: "Language not supported by current provider. Recommend [alternative]"

**Expected Result**: Helpful error message with alternatives.

---

## Technical Implementation Notes

### Service Layer

**Extend `services/voiceService.ts`**:
```typescript
export async function getSupportedLanguages(
  provider: 'elevenlabs' | 'google' | 'openai'
): Promise<LanguageSettings[]>;

export async function translateDialogue(
  lines: DialogueLine[],
  targetLanguage: LanguageSettings,
  onProgress?: (progress: number) => void
): Promise<DialogueLine[]>;

export async function generateSubtitles(
  dialogue: DialogueLine[],
  format: 'srt' | 'vtt'
): Promise<string>; // Returns subtitle file content

export async function validateAccentConsistency(
  characterId: string,
  scenes: AnalyzedScene[]
): Promise<AccentConsistencyReport>;

// Pronunciation dictionary management
export async function addPronunciation(
  word: string,
  phonetic: string,
  language: string
): Promise<void>;

export async function getPronunciationDictionary(
  projectId: string
): Promise<PronunciationDictionary>;
```

### Data Storage

**Supabase Table**:
```sql
CREATE TABLE project_languages (
  project_id UUID REFERENCES projects(id),
  language_code TEXT NOT NULL, -- ISO 639-1
  region_code TEXT, -- ISO 3166-1
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (project_id, language_code, region_code)
);

CREATE TABLE pronunciation_dictionary (
  project_id UUID REFERENCES projects(id),
  word TEXT NOT NULL,
  phonetic TEXT NOT NULL,
  ipa TEXT,
  language_code TEXT NOT NULL,
  PRIMARY KEY (project_id, word, language_code)
);
```

**localStorage Fallback**:
```typescript
{
  "alkemy_project_languages": {
    "projectId1": {
      "primary": { language: 'en', region: 'US' },
      "secondary": [
        { language: 'es', region: 'MX' },
        { language: 'fr', region: 'FR' }
      ]
    }
  },
  "alkemy_pronunciation_dictionary": {
    "projectId1": {
      "Alkemy": { phonetic: "al-kuh-mee", ipa: "ˈælkəmi", language: "en" }
    }
  }
}
```

### Translation API

**Google Cloud Translation (Gemini)**:
```typescript
const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GOOGLE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    q: line.text,
    target: targetLanguage.language,
    format: 'text'
  })
});
```

### Subtitle Generation

**SRT Format Generator**:
```typescript
function generateSRT(dialogue: DialogueLine[]): string {
  return dialogue.map((line, index) => {
    const startTime = formatTimestamp(line.startTime);
    const endTime = formatTimestamp(line.endTime);
    return `${index + 1}\n${startTime} --> ${endTime}\n${line.text}\n`;
  }).join('\n');
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`;
}
```

---

## Definition of Done

- [ ] Language selection interface with 20+ languages
- [ ] Voice library multilingual filtering
- [ ] Translation integration with Gemini API
- [ ] Phonetic pronunciation overrides
- [ ] Accent consistency validation
- [ ] Multilingual project management
- [ ] Subtitle generation (SRT, VTT)
- [ ] Director Agent multilingual assistance
- [ ] Integration verification complete
- [ ] Migration/compatibility verified
- [ ] Code reviewed and approved
- [ ] User acceptance testing (>30% multilingual usage, >85% quality satisfaction)
- [ ] CLAUDE.md updated

---

## Dependencies

### Prerequisites
- **Story 4.1** (Voice Selection) completed
- **Story 4.2** (Dialogue Generation) completed

### Related Stories
- **Story 4.4** (Timeline Integration): Multi-language audio tracks
- **Story 5.3** (Audio Mixing): Mix multilingual dialogue

---

## Testing Strategy

### Unit Tests
- Translation API integration
- SRT/VTT subtitle generation
- Pronunciation dictionary management

### Integration Tests
- Language selection → voice library filtering
- Translation → dialogue generation workflow
- Accent consistency validation

### Manual Testing
- Translation quality assessment (5+ languages)
- Voice quality across languages
- User acceptance testing (multilingual workflow UX)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 4, Story 4.3
- **ISO 639-1 Language Codes**: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
- **Google Cloud Translation**: https://cloud.google.com/translate/docs
- **SRT Format Specification**: https://www.matroska.org/technical/subtitles.html

---

**END OF STORY**
