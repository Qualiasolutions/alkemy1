# Story 2.2: AI Script Breakdown

**Epic:** E2: Script & Breakdown (Phase 1)
**Status:** In Progress
**Priority:** High

## User Story

As a **Producer**,
I want **AI to analyze my script and generate a shot list**,
So that **I don't have to manually create every scene card.**

## Acceptance Criteria

- [ ] **AC-01:** Breakdown Trigger
    - **Given** I have a script in the editor
    - **When** I click "Analyze Script"
    - **Then** the system sends the script content to the AI service

- [ ] **AC-02:** Scene Extraction
    - **Given** the AI analysis is complete
    - **Then** a list of scenes is returned
    - **And** each scene contains a list of shots/beats

- [ ] **AC-03:** UI Display
    - **Given** the analysis results
    - **Then** the scenes are displayed in the sidebar or a dedicated panel
    - **And** I can click a scene to navigate to it (optional for MVP)

## Technical Notes

- **Service:** `scriptAnalysisService.ts`.
- **Mocking:** For MVP, mock the LLM response with a predefined JSON structure.
- **UI:** Add "Analyze" button to `ScriptPhase`. Display results in a `Sheet` or `Sidebar` extension.

## Dev Agent Record

- **Context Reference:** `docs/stories/story-2.2-context.xml` (To be generated)

## Implementation Record (Dev Agent)

- **Service Layer:**
    - Created `src/services/scriptAnalysisService.ts` with mock AI analysis logic.
    - Implemented `analyzeScript` and `saveAnalysis` methods.

- **UI Components:**
    - Created `src/components/editor/SceneList.tsx` to display analyzed scenes/shots.
    - Updated `src/pages/ScriptPhase.tsx` to include "Analyze Script" button and sidebar.
    - Integrated `analyzeMutation` using React Query.

- **Status:** Ready for Review

## Senior Developer Review

**Date:** 2025-11-22
**Reviewer:** Senior Dev Agent

### Validation Results

| AC ID | Requirement | Result | Evidence/Notes |
|-------|-------------|--------|----------------|
| AC-01 | Breakdown Trigger | ✅ Pass | "Analyze Script" button triggers mock service. |
| AC-02 | Scene Extraction | ✅ Pass | Mock service returns structured scenes/shots. |
| AC-03 | UI Display | ✅ Pass | `SceneList` component displays results in sidebar. |

### Findings

1.  **Linting (Minor):** Unused imports and variables in `ScriptPhase.tsx` (`isAnalyzing`, `setIsAnalyzing`).
    *   *Action:* Will be cleaned up in final polish.
2.  **Linting (Minor):** Non-null assertions (`id!`) used.
    *   *Action:* Acceptable for MVP where `id` is guaranteed by route, but should be guarded in production.

### Outcome
**Status:** DONE
