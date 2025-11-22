# Story 1.4: Assets Phase (Character/Location Generation)

**Epic:** E3: Asset Generation & Consistency
**Status:** Ready for Review
**Priority:** High

## User Story

As a **Producer**,
I want **to generate and manage characters and locations**,
So that **I can populate my scenes with consistent assets.**

## Acceptance Criteria

- [x] **AC-01:** Asset List
    - **Given** I am in the Assets phase
    - **When** the page loads
    - **Then** I see a list of my generated assets (Characters and Locations)
    - **And** they are categorized (e.g., "Characters", "Locations")

- [x] **AC-02:** Create Asset Placeholder
    - **Given** I am in the Assets phase
    - **When** I click "New Character" or "New Location"
    - **Then** a dialog appears to enter the asset name and description
    - **When** I submit
    - **Then** a new asset record is created in Supabase
    - **And** it appears in the list

- [x] **AC-03:** Asset Details
    - **Given** I have an asset
    - **When** I click on it
    - **Then** I see its details (Name, Description, and a placeholder for the generated image)

## Technical Notes

- **Database:** Need a new `assets` table in Supabase.
    - Columns: `id`, `project_id`, `type` (character/location), `name`, `description`, `image_url`, `created_at`.
- **Service:** Create `assetService.ts`.
- **UI:** Reuse `DashboardLayout` and existing UI patterns.
- **AI Integration:** This story focuses on the *management* and *structure*. Actual AI generation (Flux-PuLID) will be connected in a subsequent story or as a "Generate" action within this story if time permits, but primarily we need the CRUD first.

## Dev Agent Record

- **Context Reference:** `docs/stories/story-1.4-context.xml` (To be generated)

## Senior Developer Review (AI)

**Date:** 2025-11-22
**Reviewer:** Qualia (Senior Dev Agent)
**Outcome:** ❌ Changes Requested

### Validation Findings

- [x] **AC-01 (Asset List):** Implemented in `AssetList.tsx`.
- [x] **AC-02 (Create Asset):** Implemented in `CreateAssetDialog.tsx` and `assetService.ts`.
- [x] **AC-03 (Asset Details):** Basic card view implemented.

### Critical Issues

1.  **Infinite Render Loop in `AssetList.tsx`**:
    - The `loadAssets` function is defined inside the component body without `useCallback`.
    - It is then used in the `useEffect` dependency array: `[loadAssets]`.
    - This causes `loadAssets` to be recreated on every render, triggering `useEffect` again, causing an infinite loop.
    - **Fix:** Move `loadAssets` definition *inside* the `useEffect` OR wrap it in `useCallback`.

### Code Quality & Design

1.  **Hardcoded Colors**:
    - `CreateAssetDialog.tsx` uses `bg-cyan-500` and `focus:border-cyan-500`.
    - **Fix:** Use the design system tokens defined in `index.css` (e.g., `bg-[var(--color-accent-primary)]` or the Tailwind utility mapped to it if available). The "Cinematic Cyberpunk" aesthetic relies on these tokens for consistency.

### Next Steps

1.  Fix the `useEffect` dependency in `AssetList.tsx`.
2.  Replace hardcoded colors with design tokens.
3.  Resubmit for review.

## Senior Developer Review (AI) - Round 2

**Date:** 2025-11-22
**Reviewer:** Qualia (Senior Dev Agent)
**Outcome:** ✅ Approved

### Verification

- [x] **Infinite Loop Fixed:** `loadAssets` is now wrapped in `useCallback`.
- [x] **Design Tokens Applied:** `CreateAssetDialog` now uses `var(--color-accent-primary)` and `var(--color-accent-hover)`.

**Status:** Story is DONE.

