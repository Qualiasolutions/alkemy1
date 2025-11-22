# UX Design Specification: {{project_name}}

> **Document Status**: Draft
> **Date**: {{date}}
> **Author**: {{user_name}}
> **Version**: 1.0

## 1. Executive Summary

### 1.1 Design Vision Statement

To create a cinematic, immersive, and high-tech production environment. The interface should feel like a futuristic command center—sleek, dark, and powerful. It embodies a 'Lumina Dark' aesthetic with vibrant neon accents and deep blacks, inspiring a sense of cutting-edge creativity and precision.

### 1.2 Core User Value Proposition

Alkemy empowers producers with a linear, context-aware workflow that feels effortless. By combining the structure of traditional production with the speed of AI, it removes friction and technical barriers, allowing creators to focus purely on storytelling. The UI acts as a calm, supportive canvas for their vision.

---

## 2. User Personas & Empathy

### 2.1 Primary Persona: Sarah, the Independent Producer

- **Role**: Indie Filmmaker / Content Creator (Age 28-40)
- **Core Motivation**: Wants to tell high-quality visual stories without the budget for a full crew or the technical expertise for complex node-based AI tools.
- **Key Frustration**: "I spend more time wrestling with ComfyUI nodes and trying to get a character to look the same than I do actually directing the story."
- **"I want to..."**: "Input my script, cast my characters once, and have them appear consistently across every shot, so I can focus on the edit and the vibe."

### 2.2 Secondary Persona: Marcus, the Agency Creative Director

- **Role**: Creative Director at a boutique ad agency.
- **Core Motivation**: Speed and consistency for client pitches. Needs to iterate fast on "mood films".
- **Key Frustration**: Inconsistent results from current tools make it hard to sell a vision to clients.

---

## 3. User Journey & Flows

### 3.1 Critical User Journey: The "Script-to-Screen" Pipeline

The core workflow where Sarah takes a raw script and transforms it into a rough cut video.

**Key Steps**:
1.  **Initialization**: Sarah imports a script. Alkemy analyzes it and breaks it down into scenes and shots.
2.  **Casting (Assets)**: She defines her characters (using InstantID/Flux). She "casts" them once, and they are assigned to every relevant shot.
3.  **Visualization (Stage)**: She reviews the generated images for each shot. She swaps angles or expressions using simple controls (not prompts).
4.  **Assembly (Timeline)**: She sees the shots arranged on a timeline. She adjusts timing and adds camera movement.
5.  **Export**: She renders the final video.

### 3.2 Secondary Flow: The "Character Lab"

A dedicated space where Sarah builds and refines her "Cast". She uploads reference photos, tweaks traits, and saves "Actors" that can be reused across multiple projects.

---

## 4. Information Architecture

### 4.1 Sitemap / Navigation Structure

The application uses a **Linear Process Navigation** (Tabs) that guides the user through the production stages:

1.  **Dashboard**: Project Management, Recent Projects, Templates.
2.  **Script & Vision**:
    *   **Script Editor**: Text input, Scene detection, Dialogue parsing.
    *   **Moodboard**: Visual reference gathering.
        *   *Cinematic Search Integration*: Unified search across high-quality film databases (Film Grab, Shotdeck, Screen Musings, Movie Stills DB, Frameset).
        *   *Layout Inspiration*: **Frameset.app** style - A dense, immersive masonry grid of high-resolution film stills.
        *   *Director/DoP Filter*: Search by specific cinematographers (e.g., from ScreenMusings) to capture distinct visual styles.
        *   *Uploads*: Import local references.
        *   *Style Definition*: Global style prompts based on moodboard.
3.  **Casting (Assets)**:
    *   **Character Lab**: Create/Edit consistent characters (InstantID).
    *   **Location Scout**: Define recurring environments.
4.  **Stage (Visualization)**:
    *   **Shot List**: Scene-by-scene breakdown.
    *   **Viewport**: Main generation area (Text-to-Image, Image-to-Image).
5.  **Timeline (Assembly)**:
    *   **Sequencer**: Multi-track video editor.
    *   **Animate**: Motion controls (Runway/Pika integration).
    *   **Export**: Render final output.

### 4.2 Key Screen Inventory

1.  **The Vision Board (Script Tab)**: A split-screen layout.
    *   *Left*: Clean, distraction-free script editor.
    *   *Right*: Masonry grid moodboard. Users drag images from the right into specific scenes on the left to attach style references.
2.  **The Casting Room**: A grid of "Headshots". Clicking one opens a detail view to refine facial features and clothing.
3.  **The Stage**: The primary workspace.
    *   *Center*: Large high-res image viewer.
    *   *Bottom*: Filmstrip of generated shots.
    *   *Right*: Contextual controls (Camera angle, lighting, expression) - *No complex node graphs visible*.
4.  **The Timeline**: A familiar non-linear editor (NLE) layout. Tracks for Video, Audio, and Effects.

---

## 5. Visual Design System

### 5.1 Design Aesthetic & Mood

- **Style**: Lumina Dark (Cinematic Cyberpunk)
- **Mood**: Immersive, High-Tech, Premium, Bold. Uses deep contrasts and glowing accents to create a futuristic feel.
- **Inspiration**: Lumina Video (Aura), Linear (Dark Mode), Cyberpunk aesthetics, Pro video tools (DaVinci Resolve).

### 5.2 Color Palette

- **Primary**: `#F97316` (Neon Orange) - Vibrant, glowing primary actions.
- **Secondary**: `#94A3B8` (Slate 400) - Muted text and secondary elements.
- **Accent**: `#A855F7` (Neon Purple) - Subtle secondary glows and gradients.
- **Background**: `#020617` (Rich Black) - Deep, immersive background.
- **Surface**: `#0F172A` (Dark Slate) - Cards and panels with subtle borders.
- **Text**: `#F8FAFC` (Off-White) - High readability against dark backgrounds.

### 5.3 Typography

- **Headings**: **Inter**, Weight 600/700, Tight tracking.
- **Body**: **Inter**, Weight 400/500, Relaxed line height for readability.
- **Scale**: Modular scale (1.2) for clear hierarchy.

### 5.4 UI Components & Patterns

- **Cards**: Dark surface (`bg-slate-900`), thin borders (`border-white/10`), subtle glow on hover.
- **Buttons**: Neon gradients with glow effects. Primary: Orange/Purple gradient.
- **Inputs**: Dark backgrounds (`bg-white/5`) with glowing focus rings.
- **Glassmorphism**: Heavy usage on panels and overlays (`backdrop-blur-xl bg-black/50`).
- **Animations**: `fadeSlideIn`, glowing pulse effects, smooth color transitions.

---

## 6. Interaction Design

### 6.1 Key Interactions & Micro-interactions

- **Drag & Drop Casting**: Dragging a character face from the "Cast" sidebar onto a scene in the script instantly assigns them.
- **Hover Previews**: Hovering over a timeline clip plays a low-res preview instantly.
- **"Director's Lens"**: Right-clicking any generated image offers "Variations", "Upscale", or "Use as Reference" immediately.
- **Scrubbing**: Smooth, frame-accurate scrubbing on the timeline with audio waveforms.

### 6.2 Feedback Mechanisms

- **Generation Status**: Subtle progress bars (neon orange) on the specific clip being generated, not a global blocker.
- **Success/Error**: Non-intrusive toast notifications at the bottom right.
- **AI Thinking**: When AI is processing, the relevant UI element pulses gently with the primary neon color.

---

## 7. Content Strategy

### 7.1 Voice & Tone

- **Professional**: Uses industry-standard film terminology (Scene, Shot, Take, Focal Length, ISO).
- **Encouraging**: "Ready to Render" instead of "Export". "Cast Your Scene" instead of "Select Assets".
- **Concise**: Minimal labels, relying on recognizable iconography where possible.

### 7.2 Key Content Requirements

- **Tooltips**: Every technical control (e.g., "Denoising Strength") must have a tooltip explaining its artistic effect.
- **Empty States**: "No Scenes Yet? Import a script to get started." (Action-oriented).

---

## 8. Accessibility & Responsiveness

### 8.1 Accessibility Standards

- **Contrast**: Ensure neon text has sufficient contrast against dark backgrounds (WCAG AA).
- **Keyboard Navigation**: Full keyboard shortcuts for playback (Space), cutting (C), and navigation (J/K/L).
- **Reduced Motion**: Respect user settings to disable heavy UI animations/parallax.

### 8.2 Responsive Breakpoints

- **Desktop First**: Optimized for 1920x1080 and up.
- **Laptop**: 1366x768 (Collapsible sidebars).
- **Tablet/Mobile**: View-only mode for reviewing renders (not for editing).

---

## 9. Implementation Guidance

### 9.1 Handoff Notes

### 9.1 Handoff Notes

- **Tailwind Config**: Ensure the `neon-orange` and `neon-purple` colors are defined in `tailwind.config.ts` with specific glow shadows (`box-shadow`).
- **Icons**: Use `Lucide React` for a clean, consistent icon set.
- **Fonts**: Preload `Inter` to prevent FOUT.
- **Layout**: Use CSS Grid for the masonry moodboard to handle variable aspect ratios gracefully.

---

## Appendix

### Related Documents

- Product Requirements: `{{prd_file}}`
- Product Brief: `{{brief_file}}`
- Brainstorming: `{{brainstorm_file}}`

### Core Interactive Deliverables

This UX Design Specification was created through visual collaboration:

- **Color Theme Visualizer**: {{color_themes_html}}
  - Interactive HTML showing all color theme options explored
  - Live UI component examples in each theme
  - Side-by-side comparison and semantic color usage

- **Design Direction Mockups**: {{design_directions_html}}
  - Interactive HTML with 6-8 complete design approaches
  - Full-screen mockups of key screens
  - Design philosophy and rationale for each direction

### Optional Enhancement Deliverables

_This section will be populated if additional UX artifacts are generated through follow-up workflows._

<!-- Additional deliverables added here by other workflows -->

### Next Steps & Follow-Up Workflows

This UX Design Specification can serve as input to:

- **Wireframe Generation Workflow** - Create detailed wireframes from user flows
- **Figma Design Workflow** - Generate Figma files via MCP integration
- **Interactive Prototype Workflow** - Build clickable HTML prototypes
- **Component Showcase Workflow** - Create interactive component library
- **AI Frontend Prompt Workflow** - Generate prompts for v0, Lovable, Bolt, etc.
- **Solution Architecture Workflow** - Define technical architecture with UX context

### Version History

| Date     | Version | Changes                         | Author        |
| -------- | ------- | ------------------------------- | ------------- |
| {{date}} | 1.0     | Initial UX Design Specification | {{user_name}} |

---

_This UX Design Specification was created through collaborative design facilitation, not template generation. All decisions were made with user input and are documented with rationale._
