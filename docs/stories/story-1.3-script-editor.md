# Story 1.3: Script Editor (Tiptap)

**Epic:** E1: Project Foundation & Studio Setup
**Status:** Ready for Review
**Priority:** High

## User Story

As a **Producer**,
I want **a rich text editor optimized for screenwriting**,
So that **I can write my script and have it automatically saved.**

## Acceptance Criteria

- [x] **AC-01:** Rich Text Editing
    - **Given** I am in the Script phase
    - **When** I type in the editor
    - **Then** I can format text (bold, italic, headers)
    - **And** the experience is smooth and responsive

- [x] **AC-02:** Screenplay Formatting (Basic)
    - **Given** I am writing a script
    - **When** I use formatting options
    - **Then** I can distinguish between Scene Headings, Action, Characters, and Dialogue (visually)

- [x] **AC-03:** Auto-Save
    - **Given** I have made changes
    - **When** I stop typing for a few seconds
    - **Then** the content is automatically saved to the `projects` table in Supabase
    - **And** a "Saved" indicator appears

- [x] **AC-04:** Load Content
    - **Given** I open an existing project
    - **When** the Script phase loads
    - **Then** the editor is populated with the previously saved script content

## Technical Notes

- **Library:** Use `@tiptap/react`, `@tiptap/starter-kit`.
- **Extensions:**
    - `Placeholder` extension for empty state.
    - Custom styling for screenplay elements (e.g., centered Character names).
- **State Management:**
    - Local state for immediate typing response.
    - `useDebounce` or similar for auto-saving to `projectService.updateProject`.
- **Database:**
    - Update `script_content` column in `projects` table.

## Dev Agent Record

- **Context Reference:** `docs/stories/story-1.3-context.xml` (To be generated)
