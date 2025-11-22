# Story 1.1: Cyberpunk Shell & Navigation

**Epic:** E1: Project Foundation & Studio Setup
**Status:** Ready for Review
**Priority:** High

## User Story

As a **Producer**,
I want **a unified application shell with phase-based navigation**,
So that **I can easily move between Script, Assets, Stage, and Timeline phases.**

## Acceptance Criteria

- [x] **AC-01:** Dashboard Layout
    - **Given** I am logged in
    - **When** I view the dashboard
    - **Then** the layout uses the defined `dashboard-layout` component
    - **And** it occupies the full viewport height

- [x] **AC-02:** Phase Navigation
    - **Given** I am on the dashboard
    - **When** I look at the sidebar
    - **Then** I see navigation items for: Script, Assets, Stage, Composition, Timeline
    - **And** the current phase is highlighted

- [x] **AC-03:** Cyberpunk Aesthetic
    - **Given** the sidebar is visible
    - **When** I interact with it
    - **Then** it reflects the "Cinematic Cyberpunk" design (dark mode, neon accents)

- [x] **AC-04:** Routing
    - **Given** I click a navigation item
    - **When** the route changes (e.g., to `/project/:id/assets`)
    - **Then** the main content area updates to show that route's content

## Technical Notes

- Implement `DashboardLayout` using Shadcn/UI + Tailwind.
- Setup React Router for:
    - `/project/:id/script`
    - `/project/:id/assets`
    - `/project/:id/stage`
    - `/project/:id/composite`
    - `/project/:id/timeline`
- Use `lucide-react` for icons.
- Ensure responsive behavior (collapsible sidebar on mobile).

## Dev Agent Record

- **Context Reference:** `docs/stories/story-1.1-context.xml` (To be generated)

## Senior Developer Review

**Date:** 2025-11-22
**Reviewer:** Senior Dev Agent

### Validation Results

| AC ID | Requirement | Result | Evidence/Notes |
|-------|-------------|--------|----------------|
| AC-01 | Dashboard Layout | ✅ Pass | Implemented in `DashboardLayout.tsx`. |
| AC-02 | Phase Navigation | ✅ Pass | Sidebar present with correct items. |
| AC-03 | Cyberpunk Aesthetic | ⚠️ Fix | Hardcoded colors used instead of Design System tokens. |
| AC-04 | Routing | ✅ Pass | Routes configured in `App.tsx`. |

### Findings

1.  **Design Violation (Major):** `Sidebar.tsx` uses hardcoded colors (`text-cyan-400`, `from-cyan-500`, `rgba(...)`) which deviate from the project's Design System (defined in `index.css` with `--color-accent-primary`, etc.).
    *   *Location:* `src/components/layout/Sidebar.tsx`
    *   *Recommendation:* Refactor to use CSS variables (`var(--color-accent-primary)`, `var(--shadow-glow)`).

### Outcome
**Status:** Changes Requested (Auto-fixing)

## Implementation Fixes (Dev Agent)

- **Design System Application:**
    - Refactored `Sidebar.tsx` to remove hardcoded colors (`cyan-400`, `purple-400`, etc.).
    - Applied `var(--color-accent-primary)` and `var(--shadow-glow)` tokens for active states and highlights.
    - Updated user profile gradient to use `accent-primary` -> `accent-secondary`.

## Final Approval

- **Verified:** Fixes applied and syntax corrected.
- **Status:** DONE
