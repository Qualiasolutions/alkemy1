# Story 2.3: Script Upload

**Epic:** E2: Script & Breakdown (Phase 1)
**Status:** In Progress
**Priority:** High

## User Story

As a **Screenwriter**,
I want **to upload my existing script (PDF/TXT)**,
So that **I don't have to re-type it into the editor.**

## Acceptance Criteria

- [ ] **AC-01:** File Upload Interface
    - **Given** I am in the Script phase
    - **When** I click "Upload Script"
    - **Then** I can select a file (PDF or TXT) from my computer

- [ ] **AC-02:** Text Extraction (TXT)
    - **Given** I select a .txt file
    - **When** the upload is complete
    - **Then** the text content is extracted and populates the Script Editor

- [ ] **AC-03:** Text Extraction (PDF)
    - **Given** I select a .pdf file
    - **When** the upload is complete
    - **Then** the text content is extracted (using PDF.js) and populates the Script Editor

## Technical Notes

- **Library:** Use `pdfjs-dist` for PDF text extraction on the client side.
- **UI:** Simple `input type="file"` hidden, triggered by a Button.
- **State:** Updates the `ScriptEditor` content state.

## Dev Agent Record

- **Context Reference:** `docs/stories/story-2.3-context.xml` (To be generated)

## Implementation Record (Dev Agent)

- **UI Components:**
    - Created `src/components/editor/ScriptUpload.tsx` with file input and PDF/TXT handling.
    - Integrated `ScriptUpload` into `ScriptPhase.tsx`.

- **Logic:**
    - Implemented text extraction for TXT files.
    - Implemented PDF text extraction using `pdfjs-dist` (via global CDN).
    - Connected upload action to `updateMutation` to save content to Supabase.

- **Status:** DONE
