# Story 1.2: Project Management (CRUD)

**Epic:** E1: Project Foundation & Studio Setup
**Status:** Ready for Review
**Priority:** High

## User Story

As a **Producer**,
I want **to create, rename, and delete projects**,
So that **I can manage my different video productions.**

## Acceptance Criteria

- [x] **AC-01:** Project List
    - **Given** I am on the dashboard home
    - **When** the page loads
    - **Then** I see a list of my existing projects
    - **And** each card shows the project name and last edited date

- [x] **AC-02:** Create Project
    - **Given** I am on the dashboard
    - **When** I click "New Project"
    - **Then** a modal appears asking for the project name
    - **When** I submit
    - **Then** a new project is created in Supabase
    - **And** I am redirected to the Script phase of the new project

- [x] **AC-03:** Delete Project
    - **Given** I see a project card
    - **When** I select "Delete" from the context menu
    - **Then** the project is removed from the list
    - **And** the record is deleted from Supabase

## Technical Notes

- **Database:**
    - Create `projects` table in Supabase:
        - `id` (uuid, primary key)
        - `name` (text)
        - `user_id` (uuid, references auth.users)
        - `created_at`, `updated_at`
    - Enable RLS (Row Level Security): Users can only see/edit their own projects.

- **UI Components:**
    - Use `Dialog` for the Create Project modal.
    - Use `DropdownMenu` for project actions (Rename, Delete).
    - Re-use the "Cyberpunk" card styling from Story 1.1.

- **State Management:**
    - Use React Query (`useQuery`, `useMutation`) for data fetching and caching.

## Dev Agent Record

- **Context Reference:** `docs/stories/story-1.2-context.xml` (To be generated)

## Implementation Record (Dev Agent)

- **Service Layer:**
    - Created `src/services/projectService.ts` with full CRUD support (`getProjects`, `getProject`, `createProject`, `updateProject`, `deleteProject`).
    - Integrated with Supabase `projects` table.

- **UI Components:**
    - Created `src/components/dashboard/ProjectList.tsx`: Displays projects in a responsive grid with "Cyberpunk" card styling. Includes "Delete" functionality.
    - Created `src/components/dashboard/CreateProjectDialog.tsx`: Modal for creating new projects, redirects to Script phase upon success.
    - Updated `src/App.tsx`: Added `CreateProjectDialog` to the dashboard header and integrated `ProjectList`.

- **Integration:**
    - Verified `ScriptPhase.tsx` correctly fetches project data using `projectService.getProject`.
    - Verified `ScriptEditor` integration.

- **Status:** Ready for Review

## Senior Developer Review

**Date:** 2025-11-22
**Reviewer:** Senior Dev Agent

### Validation Results

| AC ID | Requirement | Result | Evidence/Notes |
|-------|-------------|--------|----------------|
| AC-01 | Project List | ✅ Pass | Implemented in `ProjectList.tsx`. |
| AC-02 | Create Project | ✅ Pass | Implemented in `CreateProjectDialog.tsx`. |
| AC-03 | Delete Project | ✅ Pass | Implemented in `ProjectList.tsx`. |

### Findings

1.  **Technical Violation (Major):** Implementation used `useState`/`useEffect` instead of React Query as specified in Technical Notes.
    *   *Action:* Refactored `ProjectList.tsx` and `ScriptPhase.tsx` to use `@tanstack/react-query`.
    *   *Action:* Added `QueryClientProvider` to `index.tsx`.

2.  **Design Violation (Minor):** `ProjectList.tsx` used hardcoded colors (`bg-[#111]`, `text-red-400`) instead of Design System tokens.
    *   *Action:* Replaced with `var(--color-surface-elevated)` and `var(--color-error)`.

### Outcome
**Status:** DONE (Fixes applied during review)
