# Story 3.2: Character Creator (Flux/PuLID)

**Epic:** E3: Asset Generation & Consistency
**Status:** In Progress
**Priority:** High

## User Story

As a **Producer**,
I want **to generate consistent character reference sheets using Flux-PuLID**,
So that **my characters look the same across different shots.**

## Acceptance Criteria

- [ ] **AC-01:** Character Generation Interface
    - **Given** I am in the Assets Phase
    - **When** I select "New Character"
    - **Then** I see options to upload a reference photo (optional) or describe the character
    - **And** I can select "Generate Reference Sheet"

- [ ] **AC-02:** Flux/PuLID Integration
    - **Given** I have provided a description or reference
    - **When** I click "Generate"
    - **Then** the system calls the AI generation service (Flux model with PuLID)
    - **And** returns a character sheet (Front, Side, 45-degree views)

- [ ] **AC-03:** Save Character Identity
    - **Given** a generated character sheet
    - **When** I click "Save"
    - **Then** the character is saved to the project assets
    - **And** the reference image is stored for future "Identity-Consistent" generations

## Technical Notes

- **AI Service:**
    - Use Replicate or similar API to host Flux-PuLID model.
    - Fallback: Mock the API response for MVP if API key is not available.
- **UI:**
    - `CharacterCreator` component.
    - File upload for reference image.
    - Prompt input for text description.
- **Data:**
    - Store `reference_image_url` in `assets` table (add column if missing or use `image_url`).
    - Store `trigger_word` or `embedding_id` if applicable.

## Dev Agent Record

- **Context Reference:** `docs/stories/story-3.2-context.xml` (To be generated)

## Implementation Record (Dev Agent)

- **UI Components:**
    - Created `src/components/assets/CharacterCreator.tsx`:
        - Implemented form for character name, description, and reference image upload.
        - Added "Generate" button with loading state (simulated Flux/PuLID call).
        - Added preview card for generated image.
        - Implemented "Save to Assets" functionality.
    - Updated `src/pages/AssetsPhase.tsx`:
        - Added `Tabs` to switch between "Asset Library" and "Character Creator".
        - Integrated `CharacterCreator` component.

- **Status:** Ready for Review

## Senior Developer Review

**Date:** 2025-11-22
**Reviewer:** Senior Dev Agent

### Validation Results

| AC ID | Requirement | Result | Evidence/Notes |
|-------|-------------|--------|----------------|
| AC-01 | Character Interface | ✅ Pass | Implemented in `CharacterCreator.tsx`. |
| AC-02 | Flux/PuLID Integration | ⚠️ Partial | Mocked for MVP. API call structure is ready. |
| AC-03 | Save Identity | ✅ Pass | Saves to `assets` table. |

### Findings

1.  **Linting Violation (Minor):** `CharacterCreator.tsx` had unused imports and `img` tag warnings.
    *   *Action:* Removed unused `CardContent`. Suppressed `img` warning (valid for Vite).
2.  **Linting Violation (Minor):** `AssetsPhase.tsx` used non-null assertion `id!`.
    *   *Action:* Added conditional rendering to safely handle undefined `id`.

### Outcome
**Status:** DONE (Fixes applied during review)
