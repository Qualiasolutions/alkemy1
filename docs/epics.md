# Alkemy - Epic Breakdown

**Author:** Qualia
**Date:** 2025-11-22
**Project Level:** Brownfield Refactor
**Target Scale:** MVP (Phase 4 Implementation)

---

## Overview

This document provides the complete epic and story breakdown for **Alkemy**, decomposing the requirements from the [PRD](./prd.md) into implementable stories. It aligns with the **"Studio in a Box"** vision and the technical decision to prioritize **Zero-Shot (Flux-PuLID)** character consistency over traditional LoRA training.

**Living Document Notice:** This is the initial version. It will be updated after UX Design and Architecture workflows add interaction and technical details to stories.

### Epics Summary

| ID | Title | Goal | Phase |
| -- | ----- | ---- | ----- |
| **E1** | **Project Foundation & Studio Setup** | Initialize the "Studio" environment, project management, and core UI shell. | Foundation |
| **E2** | **Script & Breakdown (Phase 1)** | Enable users to write scripts and have AI break them down into scenes/shots. | Script |
| **E3** | **Asset Generation & Consistency (Phase 2)** | Generate consistent characters using Flux-PuLID and locations. | Assets |
| **E4** | **3D Staging & Blocking (Phase 3)** | Visualize shots in a 3D space for composition control. | Stage |
| **E5** | **Composition & Layering (Phase 4)** | Combine 3D stage renders with AI assets for final image generation. | Composite |
| **E6** | **Animation & Timeline (Phase 5)** | Turn static compositions into video and assemble the final cut. | Animate |

---

## Functional Requirements Inventory

- **FR-01:** Project Management (CRUD)
- **FR-02:** Script Editor with AI Breakdown
- **FR-03:** Character Consistency (Zero-Shot)
- **FR-04:** Asset Management (Locations, Props)
- **FR-05:** 3D Scene Blocking (Three.js)
- **FR-06:** Image Composition (Img2Img/ControlNet)
- **FR-07:** Video Generation (I2V)
- **FR-08:** Timeline Editing

---

## FR Coverage Map

- **E1:** FR-01
- **E2:** FR-02
- **E3:** FR-03, FR-04
- **E4:** FR-05
- **E5:** FR-06
- **E6:** FR-07, FR-08

---

## Epic 1: Project Foundation & Studio Setup

**Goal:** Establish the core application shell, authentication, and project state management to support the multi-phase workflow.

### Story 1.1: Cyberpunk Shell & Navigation
As a **Producer**,
I want **a unified application shell with phase-based navigation**,
So that **I can easily move between Script, Assets, Stage, and Timeline phases.**

**Acceptance Criteria:**
**Given** I am logged in
**When** I view the dashboard
**Then** I see the "Cyberpunk" themed sidebar with active states for the 5 phases
**And** the layout uses the defined `dashboard-layout` component

**Technical Notes:** Implement `DashboardLayout` using Shadcn/UI + Tailwind. Setup React Router for `/project/:id/script`, `/project/:id/assets`, etc.

### Story 1.2: Project Management (CRUD)
As a **Producer**,
I want **to create, rename, and delete projects**,
So that **I can manage my different video productions.**

**Acceptance Criteria:**
**Given** I am on the home screen
**When** I click "New Project"
**Then** a new project is created in Supabase and I am redirected to the Script phase

**Technical Notes:** Supabase `projects` table. RLS policies.

---

## Epic 2: Script & Breakdown (Phase 1)

**Goal:** Transform raw ideas into a structured list of scenes and shots.

### Story 2.1: Script Editor
As a **Screenwriter**,
I want **a text editor to write my screenplay**,
So that **I can define the narrative.**

**Acceptance Criteria:**
**Given** I am in the Script phase
**When** I type in the editor
**Then** my changes are auto-saved to the `scripts` table

**Technical Notes:** Simple textarea or Tiptap editor. Auto-save hook.

### Story 2.2: AI Script Breakdown
As a **Producer**,
I want **AI to analyze my script and generate a shot list**,
So that **I don't have to manually create every scene card.**

**Acceptance Criteria:**
**Given** I have a script
**When** I click "Breakdown"
**Then** an Edge Function calls an LLM (Claude/GPT) to parse the text
**And** returns a JSON array of scenes/shots which populate the sidebar

**Technical Notes:** Edge Function `breakdown-script`. Prompt engineering for JSON output.

---

## Epic 3: Asset Generation & Consistency (Phase 2)

**Goal:** Create the "Cast" and "Locations" using Zero-Shot AI methods for consistency.

### Story 3.1: Async Job Queue Implementation
As a **Developer**,
I want **a robust system for handling long-running AI tasks**,
So that **the UI doesn't freeze or timeout during generation.**

**Acceptance Criteria:**
**Given** a generation request
**When** it is sent to the backend
**Then** a record is created in `generations` table with status `pending`
**And** the client polls/subscribes to this record for updates

**Technical Notes:** Core architecture pattern. `useGeneration` hook.

### Story 3.2: Character Creator (Flux-PuLID)
As a **Casting Director**,
I want **to upload a reference photo and generate a character model**,
So that **I can use this actor in multiple shots.**

**Acceptance Criteria:**
**Given** a reference photo
**When** I submit it to the "Cast" tab
**Then** the system uses Flux-PuLID (via Replicate/Fal) to register this identity
**And** saves the "trigger word" or embedding reference for future prompts

**Technical Notes:** Integration with Replicate/Fal.ai Flux-PuLID endpoint.

### Story 3.3: Location Scout (Text-to-Image)
As a **Producer**,
I want **to generate location backgrounds from descriptions**,
So that **I have environments for my scenes.**

**Acceptance Criteria:**
**Given** a text description
**When** I click generate
**Then** 4 variations are returned
**And** I can select one to save as a "Location" asset

---

## Epic 4: 3D Staging & Blocking (Phase 3)

**Goal:** Visualize the scene in 3D to control composition.

### Story 4.1: R3F Scene Setup
As a **Director**,
I want **a 3D viewport where I can place objects**,
So that **I can block out the scene.**

**Acceptance Criteria:**
**Given** I am in the Stage phase
**When** I open a scene
**Then** I see a 3D grid (Three.js/R3F)
**And** I can orbit the camera

**Technical Notes:** React Three Fiber canvas. `OrbitControls`.

### Story 4.2: Asset Placement
As a **Director**,
I want **to drag character/prop cards into the 3D scene**,
So that **I can position them.**

**Acceptance Criteria:**
**Given** a list of assets
**When** I drag one onto the canvas
**Then** a 3D placeholder (capsule/cube) appears at that location

---

## Epic 5: Composition & Layering (Phase 4)

**Goal:** Render the final high-fidelity images.

### Story 5.1: Image-to-Image Composition
As a **Cinematographer**,
I want **to use my 3D stage screenshot as a guide for AI generation**,
So that **the final image matches my blocking.**

**Acceptance Criteria:**
**Given** a 3D stage setup
**When** I click "Render"
**Then** the system takes a snapshot of the viewport
**And** sends it to the Image Gen API (ControlNet/Img2Img) with the prompt
**And** returns the high-fidelity result

---

## Epic 6: Animation & Timeline (Phase 5)

**Goal:** Create motion and assemble the video.

### Story 6.1: Video Generation (I2V)
As a **Editor**,
I want **to animate my static shots**,
So that **they become video clips.**

**Acceptance Criteria:**
**Given** a rendered image
**When** I select "Animate"
**Then** it is sent to the Video Gen API (Runway/Luma)
**And** the resulting video is saved to the asset library

### Story 6.2: Timeline Assembly
As a **Editor**,
I want **to arrange my clips in a timeline**,
So that **I can watch the full movie.**

**Acceptance Criteria:**
**Given** a set of video clips
**When** I drag them onto the timeline
**Then** they play in sequence

---

## FR Coverage Matrix

| FR | E1 | E2 | E3 | E4 | E5 | E6 |
| -- | -- | -- | -- | -- | -- | -- |
| FR-01 | X | | | | | |
| FR-02 | | X | | | | |
| FR-03 | | | X | | | |
| FR-04 | | | X | | | |
| FR-05 | | | | X | | |
| FR-06 | | | | | X | |
| FR-07 | | | | | | X |
| FR-08 | | | | | | X |

---

## Summary

This breakdown provides a clear, linear path for implementing the Alkemy platform. It starts with the **Foundation (E1)**, moves to the **Creative Input (E2)**, establishes the **AI Assets (E3)** using the recommended Zero-Shot approach, and then proceeds through the **Visual Production (E4, E5)** to the final **Output (E6)**.

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._
