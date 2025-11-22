# {{project_name}} - Product Requirements Document

**Author:** {{user_name}}
**Date:** {{date}}
**Version:** 1.0

---

## Executive Summary

Alkemy is an end-to-end AI video production platform designed for professional producers. It streamlines the entire creative process—from scriptwriting and moodboarding to asset generation, composition, animation, and final assembly—into a unified, automated workflow. By mimicking traditional film production stages (Casting, Location Scouting, Shooting, Editing) and powering them with advanced AI (specifically solving character consistency via InstantID/Flux-PuLID), Alkemy enables creators to produce high-quality, consistent narrative content at unprecedented speed.

### What Makes This Special

**The "Studio in a Box" Workflow:** Unlike disjointed AI tools that generate isolated images or clips, Alkemy offers a cohesive **linear pipeline** that understands the *context* of a project. It maintains **narrative consistency** (characters, locations, style) from the initial script all the way to the final timeline, effectively acting as an AI-powered production crew that automates the tedious parts of filmmaking while giving the producer creative control.

---

## Project Classification

**Technical Type:** saas_b2b
**Domain:** creative_ai
**Complexity:** high

**Project Type:** SaaS / Web Application (B2B Focus)
**Domain:** Creative AI / Video Production
**Complexity:** High (due to AI model integration and state management)

{{#if domain_context_summary}}

### Domain Context

The domain sits at the intersection of **Professional Video Production** and **Generative AI**. Key context includes:
- **Consistency is King:** The primary challenge in AI video is maintaining character and stylistic consistency across shots.
- **Workflow vs. Generation:** Professionals need a *workflow* tool, not just a *generation* toy. The value is in the assembly and management of assets.
- **Rapid Iteration:** The ability to swap actors, change locations, or regenerate shots instantly is a core requirement.
{{/if}}

---

## Success Criteria

1.  **Character Consistency:** Users can generate a character that maintains recognizable identity (facial features, style) across 10+ distinct shots/angles.
2.  **Location Consistency:** Users can generate a 3D environment and capture multiple consistent angles that serve as valid backgrounds for video generation.
3.  **Production Quality:** Final video output is High Definition (HD/4K) and accurately reflects the composed assets (Character + Location) using SOTA models (Veo, Kling, etc.).
4.  **Workflow Efficiency:** A producer can move from Script to a "Shooting" phase (generating usable assets) without technical model training (LoRA) downtime.

{{#if business_metrics}}

### Business Metrics

{{business_metrics}}
{{/if}}

---

## Product Scope

### MVP - Minimum Viable Product

### MVP - Minimum Viable Product

**Phase 1: Initialization**
- **Script:** Import (PDF/Text), AI Generate, or Manual Write.
- **Moodboard:** Auto-generate 10 image/video references based on script to define aesthetic.

**Phase 2: Asset Proposal**
- **Auto-Generation:** System proposes **10 different Actor personas** and **10 different Location environments** based on the script.
- **Selection:** User selects preferred assets or requests regeneration.

**Phase 3: Asset Finalization (Consistency)**
- **Character:** "Instant Casting" - Selected persona is processed via **InstantID/Flux-PuLID** to create a consistent identity model (replacing legacy LoRA training).
- **Location:** "Virtual Scouting" - Selected location is generated as a **3D World**. User navigates and captures specific angles/lenses ("Snapshots") to build the location dataset.

**Phase 4: Composition (The Stage)**
- **Setup:** Auto-place Character + Location Snapshot based on script scene.
- **Framing:** User adjusts composition (Close-up, Wide).
- **Action:** Generate high-fidelity static keyframe (Flux).

**Phase 5: Animation**
- **Input:** Upscaled keyframe from Composition.
- **Process:** Image-to-Video generation (Veo/Kling) with motion prompts.
- **Output:** Upscaled video clip.

**Phase 6: Timeline & Assembly**
- **Sequencing:** Auto-organize clips based on script order.
- **Editing:** Drag-and-drop reordering.
- **Regeneration:** "Reshoot" specific clips directly from the timeline.

### Growth Features (Post-MVP)

{{growth_features}}

### Vision (Future)

{{vision_features}}

---

{{#if domain_considerations}}

## Domain-Specific Requirements

{{domain_considerations}}

This section shapes all functional and non-functional requirements below.
{{/if}}

---

{{#if innovation_patterns}}

## Innovation & Novel Patterns

{{innovation_patterns}}

### Validation Approach

{{validation_approach}}
{{/if}}

---

**Tenant Model:**
- Single-tenant logical isolation. Each user's workspace is private.
- Shared resource pool for generation (GPU clusters).

**Permissions & Roles:**
- **Producer (Admin):** Full access to create projects, generate assets, and manage billing.
- **Collaborator (Editor):** Can edit scripts, generate assets, and modify timeline.
- **Viewer (Client):** Read-only access to view timeline and generated videos.

**Integrations:**
- **Auth/DB:** Supabase.
- **Inference:** Replicate / Fal.ai (for Flux/InstantID/Video Models).
- **Hosting:** Vercel.

---

**Visual Style:** "Cinematic Cyberpunk" / Premium Professional. Dark mode default to reduce eye strain during long editing sessions. High-contrast accent colors (Yellow/Cyber-Blue) for active states.

**Interaction Patterns:**
- **Linear Progression:** The UI navigation mirrors the production workflow (Script -> Cast -> Location -> Shoot -> Edit).
- **Visual-First:** Assets are represented by large thumbnails/previews, not just file names.
- **Direct Manipulation:** Drag-and-drop for timeline assembly and asset assignment.

### Key Interactions

1.  **"Virtual Photographer":** Navigating a 3D viewport to find the perfect angle, then clicking "Capture" to freeze that state as an asset.
2.  **"Casting Call":** Uploading a face and seeing it instantly applied to various test shots to confirm identity consistency.
3.  **"The Clapperboard":** A satisfying "Action" interaction that commits the composed static shot to the expensive video generation process.

---

## Functional Requirements

**Project Management:**
- FR1: Users can create, rename, and delete projects.
- FR2: Users can configure project settings (aspect ratio, resolution target).

**Scripting & Pre-production:**
- FR3: Users can import scripts (PDF/Text) or write directly in the editor.
- FR4: System automatically parses scripts into Scenes and Shots.
- FR5: Users can generate a visual moodboard based on script keywords.

**Character Engine (Casting):**
- FR6: Users can create a "Cast Member" by uploading a reference photo.
- FR7: System generates a consistent character model (InstantID/Flux-PuLID) without manual training.
- FR8: Users can generate character sheets (expressions, angles) to verify consistency.

**Location Engine (Scouting):**
- FR9: Users can generate a 3D environment prompt based on scene description.
- FR10: Users can navigate the generated 3D world (orbit/pan/zoom).
- FR11: Users can capture "Snapshots" from specific camera angles to use as background plates.

**Composition (Shooting):**
- FR12: Users can compose a shot by selecting a Cast Member and a Location Snapshot.
- FR13: Users can define camera framing (Close-up, Wide, Medium) and lighting.
- FR14: System generates a high-fidelity static keyframe combining character and location.

**Video Generation (Action):**
- FR15: Users can send a Keyframe to a video generation model (Veo/Kling/Gen-3).
- FR16: Users can provide motion prompts to guide the video generation.
- FR17: Users can preview and save generated video clips.

**Timeline & Assembly (Editing):**
- FR18: Users can drag and drop generated clips onto a sequential timeline.
- FR19: Users can reorder clips and preview the full sequence.
- FR20: Users can export the timeline as a single video file.

---

## Non-Functional Requirements

### Performance

- **Response Time:** UI interactions must be under 100ms.
- **Async Handling:** Long-running generation tasks (video/3D) must have robust progress indicators and background processing without blocking the UI.
- **Asset Loading:** Lazy loading for large image/video galleries to ensure smooth scrolling.

### Security

- **Data Isolation:** Strict Row Level Security (RLS) on Supabase to ensure users only access their own projects and assets.
- **Asset Protection:** Signed URLs for private media assets.
- **Authentication:** Secure OAuth/Email login via Supabase Auth.

### Scalability

- **Storage:** Architecture must support terabytes of generated video content via scalable object storage (Supabase Storage / S3).
- **Inference:** Backend must handle concurrent generation requests via queue system to external model providers.

---

_This PRD captures the essence of Alkemy - A revolutionary AI-powered video production studio that solves the consistency problem for professional creators._

_Created through collaborative discovery between {{user_name}} and AI facilitator._
