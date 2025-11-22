# Story 2.1: Script Editor

**Epic:** E2: Script & Breakdown (Phase 1)
**Status:** In Progress
**Priority:** High

## User Story

As a **Screenwriter**,
I want **a text editor to write my screenplay**,
So that **I can define the narrative.**

## Acceptance Criteria

- [ ] **AC-01:** Script Editor Interface
    - **Given** I am in the Script phase
    - **When** I view the page
    - **Then** I see a text editor area for writing the script

- [ ] **AC-02:** Auto-Save
    - **Given** I am typing in the editor
    - **When** I stop typing for a few seconds
    - **Then** my changes are auto-saved to the backend (`projects` table)

## Technical Notes

- **Data Model:** Use `projects.script_content` (Deviation from Epic's `scripts` table for MVP simplicity).
- **UI:** `ScriptEditor` component.
- **Logic:** Auto-save hook with debounce (already partially implemented in `ScriptPhase`).

## Dev Agent Record

- **Context Reference:** `docs/stories/story-2.1-context.xml` (To be generated)

## Implementation Record (Dev Agent)

- **UI Components:**
    - Verified `src/components/editor/ScriptEditor.tsx` uses Tiptap.
    - Added `Courier Prime` font to `index.html` for authentic screenplay look.
    - Verified styling injects `Courier Prime` for headings and paragraphs.

- **Integration:**
    - Verified `ScriptPhase.tsx` handles auto-saving via `useMutation` and `onUpdate`.

- **Status:** Ready for Review

## Senior Developer Review

**Date:** 2025-11-22
**Reviewer:** Senior Dev Agent

### Validation Results

| AC ID | Requirement | Result | Evidence/Notes |
|-------|-------------|--------|----------------|
| AC-01 | Script Editor Interface | ✅ Pass | `ScriptEditor.tsx` present and functional. |
| AC-02 | Auto-Save | ✅ Pass | Handled by `ScriptPhase.tsx` logic. |

### Findings

1.  **Enhancement (Minor):** `Courier Prime` font was missing from `index.html`.
    *   *Action:* Added to Google Fonts link.

### Outcome
**Status:** DONE
