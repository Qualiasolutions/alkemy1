---
last_sync: '2025-11-20T11:26:47.637Z'
auto_sync: true
---
# Story 2.3: Character Identity Integration with Shot Generation

**Epic**: Epic 2 - Character Identity Consistency System  
**PRD Reference**: Section 6, Epic 2, Story 2.3  
**Status**: Blocked (waiting for Story 2.2)
**Priority**: High (V2.0 Core Feature)
**Estimated Effort**: 7 story points
**Dependencies**: Story 2.1 (Training) - ✅ COMPLETE, Story 2.2 (Testing/Approval) - Not Started
**Last Updated**: 2025-11-11

---

## User Story

**As a** filmmaker,  
**I want** character identity automatically applied to all shot generations,  
**So that** I don't manually manage consistency across hundreds of shots.

---

## Business Value

Automatic identity application eliminates manual work, ensures consistency across entire productions, and enables filmmakers to focus on creative decisions instead of technical management.

**Success Metric**: >95% visual similarity maintained across all production shots; zero manual identity configuration per shot.

---

## Key Acceptance Criteria

1. **Automatic Identity Application**: When generating shots in SceneAssemblerTab, character identity applies automatically for approved characters
2. **Visual Indicators**: "✓ Character identity: John (active)" badge shows identity is applied
3. **Identity Strength Controls**: Slider (0-100%) to adjust adherence to reference (if technology supports)
4. **Multi-Character Shots**: Support 2+ characters with independent identities in same shot
5. **Identity Override**: Per-shot toggle to disable identity (silhouette, extreme distance shots)
6. **Performance**: Identity application adds <15% to generation time (NFR4)
7. **Batch Generation**: Character identity works with batch shot generation (queue processing)
8. **Error Handling**: Identity fails → fallback to standard generation with warning

---

## Technical Implementation

**Extend `aiService.ts`**:
```typescript
// Enhanced generateStillVariants with identity support
export async function generateStillVariants(
  prompt: string,
  moodboardImages: string[],
  characterIdentities?: CharacterIdentityReference[], // NEW
  identityStrength?: number, // 0-100 (NEW)
  onProgress?: (progress: number) => void
): Promise<Generation[]>
```

**Character Identity Reference Type**:
```typescript
interface CharacterIdentityReference {
  characterId: string;
  characterName: string;
  identityData: string; // LoRA model ID or reference image data
  enabled: boolean; // Per-shot toggle
  strength?: number; // Override global strength
}
```

**Integration Points**:
- `SceneAssemblerTab`: Pass character identities from scene analysis
- `Frame` type: Add `characterIdentities` field to track which identities were used
- Shot generation: Auto-detect characters in prompt, apply matching identities

---

## Definition of Done

- Automatic identity application functional
- Visual indicators implemented
- Multi-character support working
- Identity override toggle per-shot
- Performance target met (<15% overhead)
- Batch generation with identity functional
- Error handling and fallback complete
- Backward compatibility (projects without identity work)
- UAT with 5+ filmmakers (>95% similarity across all shots)

---

**Full AC details, migration/compatibility, and integration verification available in comprehensive story document.**

