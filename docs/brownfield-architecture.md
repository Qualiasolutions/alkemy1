# Alkemy AI Film Studio - Brownfield Architecture Document

## Introduction

This document captures the **CURRENT STATE** of the Alkemy AI Film Studio codebase, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on V2 enhancements.

### Document Scope

**Focused on areas relevant to: V2 Enhancement (Voice I/O, Character Identity, 3D Worlds, Audio Production, Analytics, Community Features)**

This document emphasizes modules and patterns that will be affected by the planned V2 roadmap features outlined in `docs/prd.md`.

### Change Log

| Date       | Version | Description                                   | Author               |
| ---------- | ------- | --------------------------------------------- | -------------------- |
| 2025-11-09 | 1.0     | Initial brownfield analysis for V2 enhancement | BMad Orchestrator |

---

## Quick Reference - Key Files and Entry Points

###

 Critical Files for Understanding the System

**Entry Points:**
- **Main Entry**: `index.tsx` (React root mount point)
- **Application Root**: `App.tsx` (main app logic, routing, state management)
- **Theme Provider**: `theme/ThemeContext.tsx` (theme system)
- **Auth Provider**: `contexts/AuthContext.tsx` (Supabase authentication)

**Configuration:**
- **Vite Config**: `vite.config.ts` (build, dev server, env variables)
- **TypeScript Config**: `tsconfig.json` (@ alias, React JSX)
- **Tailwind Config**: `tailwind.config.ts` (theme tokens)
- **Supabase Config**: `supabase/config.toml` (database configuration)

**Core Business Logic:**
- **AI Service**: `services/aiService.ts` (Gemini API integration, generation workflows)
- **Project Service**: `services/projectService.ts` (Supabase project CRUD)
- **Media Service**: `services/mediaService.ts` (Supabase Storage for uploads)
- **Usage Service**: `services/usageService.ts` (analytics tracking)

**State Management:**
- **App State**: `App.tsx` (centralized project state in `projectState`)
- **Types**: `types.ts` (TypeScript interfaces for all data models)

**Key UI Components:**
- **DirectorWidget**: `components/DirectorWidget.tsx` (AI assistant - **ENHANCEMENT TARGET**)
- **Tabs**: `tabs/` directory (feature-specific views)
- **Sidebar**: `components/Sidebar.tsx` (navigation)

---

### V2 Enhancement Impact Areas

Based on the PRD (`docs/prd.md`), the following files/modules will be **heavily affected** by V2 development:

**Director Agent Enhancement (Epic 1):**
- `components/DirectorWidget.tsx` - Add voice I/O, style learning, continuity checking
- `services/aiService.ts` - Extend `askTheDirector()` for enhanced capabilities
- `services/directorKnowledge.ts` - Expand cinematography knowledge base

**Character Identity System (Epic 2):**
- `tabs/CastLocationsTab.tsx` - Add character identity training/testing UI
- `services/aiService.ts` - Integrate character identity preservation (technology TBD from Epic R1)
- `types.ts` - Extend `AnalyzedCharacter` type with identity model data

**3D Worlds (Epic 3):**
- `tabs/3DWorldsTab.tsx` - Add camera marking, lighting presets, navigation controls
- `services/worldLabsService.ts` OR new service (depends on Epic R2 research)
- `components/3DWorldViewer.tsx` - Enhance viewer for interactive navigation

**Voice & Dialogue (Epic 4):**
- New: `tabs/VoicesTab.tsx` - Voice selection and casting interface
- New: `services/voiceService.ts` - Voice synthesis integration (depends on Epic R3a)
- `tabs/FramesTab.simple.tsx` - Integrate dialogue audio with timeline clips

**Audio Production (Epic 5):**
- New: `tabs/MusicSoundTab.tsx` - Music composition and sound effects UI
- New: `services/musicService.ts` - AI music composition (depends on Epic R3b)
- New: `components/AudioMixer.tsx` - Multi-stem audio mixing controls
- `tabs/FramesTab.simple.tsx` - Add audio mixing to timeline

**Analytics (Epic 6):**
- New: `tabs/AnalyticsTab.tsx` - Quality analytics and performance reports
- New: `services/analyticsService.ts` - Creative feedback and technical metrics
- Extend: `services/usageService.ts` - Additional analytics events

**Community Hub (Epic 7a):**
- New: `tabs/CommunityHubTab.tsx` - Gallery, competitions, profiles
- New: `services/communityService.ts` - Gallery uploads, competition logic
- Extend: `services/projectService.ts` - Public project sharing

---

## High Level Architecture

### Technical Summary

Alkemy AI Film Studio is a **React-based single-page application (SPA)** that leverages Google's Gemini ecosystem (Imagen, Veo 3.1, Gemini 2.5 Pro) to transform screenplays into complete visual productions.

**Architecture Pattern**: **Centralized State Management** in `App.tsx` with **Service Layer Abstraction** for external APIs.

**Key Characteristics:**
- **Client-side AI generation** - All AI calls happen in-browser (via service modules)
- **Dual persistence** - Authenticated users (Supabase), anonymous users (localStorage)
- **Tab-based workflow** - Multi-stage production pipeline (script → moodboard → cast → compositing → timeline → export)
- **Serverless API proxies** - Vercel functions bypass CORS restrictions
- **Progressive web app** - Works in modern browsers, mobile-responsive (partial)

---

### Actual Tech Stack

| Category                   | Technology             | Version   | Notes                                                    |
| -------------------------- | ---------------------- | --------- | -------------------------------------------------------- |
| **Runtime**                | Node.js (dev)          | 18+       | Vite dev server, build process                           |
| **Frontend Framework**     | React                  | 19.2.0    | Latest (uses functional components exclusively)          |
| **Build Tool**             | Vite                   | 6.2.0     | Dev server (port 3000), production bundler               |
| **Language**               | TypeScript             | 5.8.2     | Strict mode, `@/*` path alias                            |
| **Styling**                | Tailwind CSS           | 3.4.17    | PostCSS, custom theme variables in `index.css`           |
| **Animation**              | Framer Motion          | 12.23.24  | Page transitions, UI animations                          |
| **Routing**                | React Router DOM       | 7.9.5     | Client-side routing (`/`, `/reset-password`, `/auth/callback`) |
| **State Management**       | React Hooks (useState) | Built-in  | Centralized in `App.tsx`, no Redux/Zustand for app state |
| **3D Rendering**           | Three.js               | 0.181.0   | 3D world visualization                                   |
| **Gaussian Splatting**     | @mkkellogg/gaussian-splats-3d | 0.4.7 | Advanced 3D rendering (experimental)                    |
| **Physics Engine**         | @dimforge/rapier3d     | 0.15.0    | 3D physics simulation (not actively used yet)            |
| **Video Processing**       | FFmpeg.wasm            | 0.12.15   | Client-side video rendering/concatenation                |
| **Database**               | Supabase (PostgreSQL)  | -         | Optional cloud persistence                               |
| **Authentication**         | Supabase Auth          | 2.79.0    | Email/password, OAuth (Google, GitHub)                   |
| **File Storage**           | Supabase Storage       | -         | Media uploads (images, videos)                           |
| **Deployment**             | Vercel                 | -         | Auto-deploy on `main` branch push                        |
| **Serverless Functions**   | Vercel Functions       | Node 20   | API proxies in `api/` directory                          |
| **AI/ML APIs**             | Google Gemini          | 2.5 Pro   | Script analysis, prompt generation                       |
|                            | Google Imagen          | Latest    | Image generation                                         |
|                            | Google Veo             | 3.1       | Video animation                                          |
|                            | Flux (BFL API)         | -         | Alternative image generation                             |
|                            | Wan 2.2                | -         | Motion transfer (experimental)                           |
|                            | Brave Search API       | -         | Moodboard image search                                   |
|                            | Pexels API             | -         | Curated photo search                                     |
|                            | Unsplash API           | -         | Professional photography search                          |

**Critical Dependencies for V2:**
- **Voice I/O**: TBD based on Epic R3a research (Web Speech API vs. dedicated services)
- **Character Identity**: TBD based on Epic R1 research (LoRA, Flux Dev, etc.)
- **Music Composition**: TBD based on Epic R3b research (Suno, Udio, Stable Audio, etc.)

---

### Repository Structure Reality Check

- **Type**: Monorepo (single package.json, no workspaces)
- **Package Manager**: npm (package-lock.json present)
- **Notable**: No src/ directory - components, services, tabs live in root-level folders

---

## Source Tree and Module Organization

### Project Structure (Actual)

```text
alkemy/
├── api/                         # Vercel serverless functions (CORS proxies)
│   ├── luma-proxy.ts            # Luma AI 3D generation proxy
│   ├── replicate-proxy.ts       # Replicate API proxy (Emu3-Gen)
│   └── brave-proxy.ts           # Brave Search API proxy
├── .bmad-core/                  # BMad Method framework files
├── components/                  # Reusable UI components
│   ├── auth/                    # Authentication components (LoginForm, RegisterForm, etc.)
│   ├── icons/Icons.tsx          # SVG icon components
│   ├── DirectorWidget.tsx       # AI cinematography assistant (**V2 CRITICAL**)
│   ├── SplashScreen.tsx         # App loading screen
│   ├── WelcomeScreen.tsx        # First-time user experience
│   ├── Toast.tsx                # Notification system
│   ├── Button.tsx               # Reusable button component
│   ├── Sidebar.tsx              # Navigation sidebar
│   ├── 3DWorldViewer.tsx        # Three.js 3D world renderer
│   └── [other components]
├── constants/                   # App constants
│   └── constants.ts             # TABS_CONFIG, theme colors (legacy)
├── contexts/                    # React contexts
│   └── AuthContext.tsx          # Supabase authentication state
├── data/                        # Static data
│   └── demoProject.ts           # Demo project content
├── docs/                        # Documentation
│   ├── prd.md                   # V2 Enhancement PRD (**REFERENCE THIS**)
│   └── brownfield-architecture.md # THIS DOCUMENT
├── hooks/                       # Custom React hooks
│   └── useKeyboardShortcuts.ts  # Power-user shortcuts
├── lib/                         # Utility libraries
├── pages/                       # React Router pages
│   ├── ResetPasswordPage.tsx    # Password reset flow
│   └── AuthCallbackPage.tsx     # OAuth callback handler
├── public/                      # Static assets
├── scripts/                     # Build/deployment scripts
├── services/                    # API service layer (**V2 CRITICAL**)
│   ├── aiService.ts             # Gemini API integration (HUGE FILE - 78KB)
│   ├── apiKeys.ts               # API key management (localStorage + env vars)
│   ├── fluxService.ts           # Flux image generation
│   ├── wanService.ts            # Wan 2.2 motion transfer
│   ├── worldLabsService.ts      # 3D world generation (procedural)
│   ├── proceduralWorldService.ts # Legacy 3D world service
│   ├── gaussianSplatService.ts  # Gaussian Splatting support
│   ├── imageSearchService.ts    # Multi-source image search (Brave/Pexels/Unsplash)
│   ├── videoRenderingService.ts # FFmpeg.wasm video rendering
│   ├── commandHistory.ts        # Undo/redo command pattern
│   ├── directorKnowledge.ts     # Cinematography knowledge base
│   ├── fallbackContent.ts       # Mock content for development
│   ├── projectService.ts        # Supabase project CRUD
│   ├── mediaService.ts          # Supabase Storage uploads
│   ├── usageService.ts          # Analytics tracking
│   └── supabase.ts              # Supabase client initialization
├── supabase/                    # Supabase configuration
│   ├── config.toml              # Local dev config
│   ├── migrations/              # Database migrations
│   │   ├── 001_initial_schema.sql
│   │   └── 002_security_performance_fixes.sql
│   └── SECURITY_FIXES.md        # Security patch documentation
├── tabs/                        # Feature-specific tab views (**V2 EXPANSION**)
│   ├── ScriptTab.tsx            # Script upload & analysis
│   ├── MoodboardTab.tsx         # Visual reference management
│   ├── CastLocationsTab.tsx     # Character & location generation (**V2 ENHANCE**)
│   ├── 3DWorldsTab.tsx          # 3D world creation (**V2 ENHANCE**)
│   ├── SceneAssemblerTab.tsx    # Shot composition (compositing tab)
│   ├── FramesTab.simple.tsx     # Timeline editing (**V2 ENHANCE - audio mixing**)
│   ├── WanTransferTab.tsx       # Motion transfer (experimental)
│   ├── PostProductionTab.tsx    # Color grading placeholder
│   ├── ExportsTab.tsx           # Video export
│   ├── PresentationTab.tsx      # Project overview
│   ├── RoadmapTab.tsx           # Roadmap visualization
│   └── [V2 NEW TABS TBD]        # VoicesTab, MusicSoundTab, AnalyticsTab, CommunityHubTab
├── theme/                       # Theme system
│   └── ThemeContext.tsx         # Dark/light mode with CSS variables
├── types/                       # TypeScript type definitions
│   └── types.ts                 # All data models (**V2 WILL EXTEND**)
├── App.tsx                      # Main app logic (**V2 STATE MANAGEMENT**)
├── index.tsx                    # React root mount
├── index.css                    # Global styles, Tailwind directives, CSS vars
├── constants.ts                 # TABS_CONFIG (root-level, NOT in constants/ folder!)
├── vite.config.ts               # Build configuration, env variable exposure
├── tailwind.config.ts           # Tailwind theme configuration
├── tsconfig.json                # TypeScript configuration (@ alias)
├── package.json                 # Dependencies
└── .vercel/                     # Vercel deployment metadata
```

### Key Modules and Their Purpose

**1. App State Management (`App.tsx` - 1342 lines)**
- **Purpose**: Centralized project state, routing, authentication flow
- **Pattern**: Single `projectState` object containing `scriptContent`, `scriptAnalysis`, `timelineClips`, `roadmapBlocks`, `ui`
- **Persistence**: Supabase (authenticated users) OR localStorage (anonymous users)
- **Serialization**: Blob URLs → base64 for persistence (see `getSerializableState()`, `blobUrlToBase64()`)
- **Critical**: `setScriptAnalysis` supports functional updates - `setScriptAnalysis((prev) => ({...prev, ...changes}))`
- **V2 Impact**: Will need to extend `projectState` with voice profiles, character identity models, audio stems, analytics data

**2. AI Service Layer (`services/aiService.ts` - 78KB, 2000+ lines)**
- **Purpose**: Centralized Gemini API integration
- **Key Functions**:
  - `analyzeScript()` - Script → structured JSON (characters, scenes, locations)
  - `generateFramesForScene()` - Scene → shot descriptions with camera data
  - `generateStillVariants()` - Batch image generation (Imagen/Flux)
  - `animateFrame()` - Still image → video (Veo 3.1)
  - `askTheDirector()` - Director Agent natural language queries
- **Safety Engineering**: `buildSafePrompt()` wraps all prompts with "SFW fictional movie" prefix
- **Progress Tracking**: All functions accept `onProgress?: (progress: number, message?: string) => void` callbacks
- **Error Handling**: `handleApiError()` centralizes error messages
- **V2 Impact**: Will integrate with new voice, music, character identity services

**3. DirectorWidget (`components/DirectorWidget.tsx`)**
- **Purpose**: Persistent AI cinematography assistant (bottom-right chat widget)
- **Current Features**:
  - Natural language command parsing (`parseCommand()`)
  - Image generation commands ("Generate 3 flux images of John")
  - Technical queries (DOF calculations, lens recommendations)
  - Inline image display in chat
- **State**: Conversation history in component state (not persisted)
- **Integration**: Calls `aiService.askTheDirector()` + `aiService.generateStillVariants()`
- **V2 CRITICAL**: Epic 1 will add voice I/O, style learning, continuity checking

**4. Project Persistence (`services/projectService.ts`)**
- **Purpose**: Supabase project CRUD operations
- **Pattern**: Graceful degradation to localStorage when Supabase unavailable
- **Key Functions**:
  - `createProject(userId, title)` - Create new project in database
  - `getProjects(userId)` - Fetch user's project list
  - `saveProjectData(projectId, data)` - Persist script, analysis, timeline clips
  - `updateLastAccessed(projectId)` - Track project access for sorting
- **Data Flow**: `App.tsx` calls `projectService` → Supabase `projects` table
- **V2 Impact**: Will need to handle new data types (voice profiles, character models, audio assets)

**5. Timeline System (`tabs/FramesTab.simple.tsx`)**
- **Purpose**: Video editing interface
- **State**: `timelineClips: TimelineClip[]` in `App.tsx`
- **Clip Model**:
  ```typescript
  TimelineClip {
    id, timelineId, sceneNumber, shot_number,
    description, url (blob or base64),
    sourceDuration, trimStart, trimEnd
  }
  ```
- **Rendering**: FFmpeg.wasm concatenates clips (`services/videoRenderingService.ts`)
- **Blob URL Handling**: Blob URLs converted to base64 for persistence, restored on load
- **V2 CRITICAL**: Epic 5 will add multi-stem audio mixing (dialogue, music, effects tracks)

---

## Data Models and APIs

### Data Models

Instead of duplicating, reference actual model files:

**Primary Types** (`types.ts`):
- **ScriptAnalysis** - Top-level project structure (title, scenes, characters, locations, moodboard)
- **AnalyzedScene** - Scene metadata with `frames: Frame[]` array
- **Frame** - Shot-level data with `status: FrameStatus`, `media: FrameMedia`, technical specs
- **AnalyzedCharacter** - Character data with `generations: Generation[]` (image variants)
- **AnalyzedLocation** - Location data with `generations: Generation[]`
- **Generation** - Tracks AI generation attempts (loading states, error messages)
- **TimelineClip** - Video clip in editing timeline
- **Project** - Supabase project record (user_id, title, script_content, script_analysis, etc.)
- **User** - User profile with subscription tiers (free, pro, enterprise)
- **Moodboard** - Visual reference categories (cinematography, color, style, other)
- **MoodboardTemplate** - Reusable moodboard presets

**Frame Status Lifecycle**:
```
Draft → GeneratingStill → GeneratedStill → UpscalingImage → UpscaledImageReady →
QueuedVideo → RenderingVideo → AnimatedVideoReady → UpscalingVideo → UpscaledVideoReady →
(transferred to timeline)
```

**V2 Extensions Needed** (based on PRD requirements):
- **CharacterIdentity** - Character model data (LoRA weights, reference embeddings, etc.)
- **VoiceProfile** - Character voice mappings (voice ID, synthesis settings)
- **AudioStem** - Music/dialogue/effects audio track data
- **StyleProfile** - Director Agent learned preferences (shot types, lens choices, color grades)
- **AnalyticsEvent** - Quality metrics, performance tracking
- **CommunityProject** - Public gallery project metadata

---

### API Specifications

**External APIs** (configured via Vercel environment variables):

| API               | Purpose                          | Auth Method        | Proxy Required | Key Variable            |
| ----------------- | -------------------------------- | ------------------ | -------------- | ----------------------- |
| Gemini 2.5 Pro    | Script analysis, prompt generation | API Key            | No             | GEMINI_API_KEY          |
| Imagen            | Image generation                 | API Key (Gemini)   | No             | GEMINI_API_KEY          |
| Veo 3.1           | Video animation                  | API Key (Gemini)   | No             | GEMINI_API_KEY          |
| Flux (BFL)        | Alternative image generation     | API Key            | No             | FLUX_API_KEY            |
| Wan 2.2           | Motion transfer                  | API Key            | No             | WAN_API_KEY             |
| Luma AI           | 3D world generation (legacy)     | API Key            | Yes            | LUMA_API_KEY            |
| Replicate         | Emu3-Gen world generation        | API Key            | Yes            | REPLICATE_API_TOKEN     |
| Brave Search      | Web image search                 | API Key            | Yes            | BRAVE_SEARCH_API_KEY    |
| Pexels            | Curated photo search             | API Key            | No             | VITE_PEXELS_API_KEY     |
| Unsplash          | Professional photography         | Access Key         | No             | VITE_UNSPLASH_ACCESS_KEY|
| Supabase          | Database, auth, storage          | URL + Anon Key     | No             | VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY |

**Serverless API Proxy Pattern** (`api/` directory):
- **Purpose**: Bypass CORS restrictions, hide API keys from client
- **Example**: `api/brave-proxy.ts` proxies Brave Search API requests
- **Pattern**:
  1. Client calls `/api/brave-proxy` with request body
  2. Vercel function fetches from external API with server-side API key (from env vars)
  3. Returns response to client with CORS headers
- **V2 Impact**: New proxies needed for voice, music services (if required)

**Internal API Contracts**:
- **aiService.ts exports**: All functions accept progress callbacks, return promises
- **projectService.ts exports**: All functions return `{ data, error }` tuples (Supabase pattern)
- **mediaService.ts exports**: Upload returns signed URL, handles file size limits

---

## Technical Debt and Known Issues

### Critical Technical Debt

**1. AI Service Monolith (`aiService.ts` - 78KB)**
- **Issue**: Single file contains all AI integration logic (2000+ lines)
- **Impact**: Hard to maintain, slow to load, difficult to test in isolation
- **Workaround**: None - refactoring deferred to V3
- **V2 Consideration**: New AI services (voice, music) should be separate modules from day 1

**2. Blob URL Memory Management**
- **Issue**: Timeline clips with blob URLs can leak memory if not explicitly revoked
- **Current Handling**: Blob URLs persist for timeline playback, revoked in `FramesTab` unmount
- **Risk**: Long editing sessions with many clips may exhaust memory
- **V2 Impact**: Audio stems will also use blob URLs - need robust cleanup strategy

**3. localStorage Quota Limits**
- **Issue**: Base64-encoded videos can exceed 5-10MB localStorage quota
- **Mitigation**: `getSerializableState()` strips large generation arrays before save
- **Current Status**: Works for typical projects (< 20 shots), fails for large projects
- **V2 Impact**: Audio data (music stems, voice clips) will worsen this - **MUST use Supabase Storage**

**4. No Automated Tests**
- **Issue**: Playwright installed (`@playwright/test@^1.56.1`) but zero tests written
- **Impact**: Regression risk high, manual QA required for all changes
- **V2 Requirement**: PRD mandates testing integration for research/implementation epics

**5. DirectorWidget Context Limitations**
- **Issue**: Director only has access to current `scriptAnalysis` snapshot - no cross-tab awareness
- **Missing**: Director can't suggest improvements based on timeline edits, moodboard selections
- **V2 Epic 1**: Will add "production lifecycle awareness" to address this

**6. State Serialization Complexity**
- **Issue**: Blob URLs → base64 conversion is async, can cause race conditions during save
- **Current Handling**: `await getSerializableState()` before localStorage write
- **Risk**: If save happens mid-generation, incomplete data may persist
- **V2 Impact**: More async data (voice models, audio rendering) increases complexity

**7. Supabase Migration Status**
- **Issue**: Only 2 migrations applied (`001_initial_schema.sql`, `002_security_performance_fixes.sql`)
- **Missing**: No migrations for V2 data models yet (character_voices, audio_assets, style_profiles, etc.)
- **Action Required**: Create migrations before Epic implementation

---

### Workarounds and Gotchas

**1. API Key Environment Variable Naming**
- **Gotcha**: Client-side env vars must start with `VITE_` (Vite convention)
- **Example**: `VITE_SUPABASE_URL` exposed to client, `GEMINI_API_KEY` only on server (proxy functions)
- **V2 Impact**: New services must follow this pattern

**2. Functional State Updates Required**
- **Gotcha**: `setScriptAnalysis` must be called with functional updater for nested changes
- **Correct**: `setScriptAnalysis((prev) => ({...prev, characters: updatedCharacters}))`
- **Incorrect**: `setScriptAnalysis({...scriptAnalysis, characters: updatedCharacters})` (race condition)
- **V2 Impact**: All new state setters must support functional updates

**3. Theme CSS Variables**
- **Gotcha**: Theme system uses CSS variables (`var(--color-text-primary)`), but legacy `constants.ts` has hardcoded colors
- **Current**: Components should use `useTheme()` hook, but some use hardcoded values
- **V2 Impact**: New components MUST use `useTheme()` for dynamic theming

**4. Tab Registration**
- **Gotcha**: New tabs must be registered in **TWO** places:
  1. `constants.ts` `TABS_CONFIG` array (for sidebar navigation)
  2. `App.tsx` `renderContent()` switch statement (for rendering)
- **Missing either**: Tab appears in sidebar but doesn't render, or renders but isn't navigable
- **V2 Impact**: New tabs (Voices, Music, Analytics, Community) must follow this pattern

**5. FFmpeg.wasm Cold Start**
- **Gotcha**: First FFmpeg.wasm load can take 30+ seconds (downloads ~30MB from CDN)
- **Workaround**: Lazy-load FFmpeg only when first export is triggered
- **User Experience**: Show loading indicator, don't block UI
- **V2 Impact**: Audio mixing may also need FFmpeg - consider pre-loading if audio tab is visited

**6. Vercel Environment Variable Encryption**
- **Gotcha**: Vercel encrypts env vars in dashboard - can't read values via CLI (`vercel env ls` shows "Encrypted")
- **Workaround**: Set vars via Vercel dashboard, pull to `.env.local` for dev (`vercel env pull`)
- **V2 Impact**: New API keys must be set in Vercel dashboard before deployment

**7. Supabase Auth Redirect Flow**
- **Gotcha**: OAuth callbacks require `/auth/callback` route with exact `AuthCallbackPage` implementation
- **Current**: Works for Google/GitHub OAuth
- **V2 Impact**: No changes needed for V2, but new OAuth providers require additional config

---

## Integration Points and External Dependencies

### External Services

| Service            | Purpose                      | Integration Type | Key Files                                     | Cost Model         | V2 Status            |
| ------------------ | ---------------------------- | ---------------- | --------------------------------------------- | ------------------ | -------------------- |
| Gemini 2.5 Pro     | Script analysis              | REST API         | `services/aiService.ts`                       | Pay-per-token      | **Active**           |
| Imagen             | Image generation             | REST API (Gemini)| `services/aiService.ts`                       | Pay-per-generation | **Active**           |
| Veo 3.1            | Video animation              | REST API (Gemini)| `services/aiService.ts`                       | Pay-per-generation | **Active**           |
| Flux (BFL)         | Image generation (alt)       | REST API         | `services/fluxService.ts`                     | Pay-per-generation | **Active**           |
| Wan 2.2            | Motion transfer              | REST API         | `services/wanService.ts`                      | Pay-per-generation | **Experimental**     |
| Luma AI            | 3D world generation          | REST API         | `services/3dWorldService.ts`, `api/luma-proxy.ts` | Expensive (not recommended) | **Legacy**   |
| Replicate          | Emu3-Gen world generation    | REST API         | `services/emuWorldService.ts`, `api/replicate-proxy.ts` | Expensive ($0.35+) | **Legacy** |
| Brave Search       | Web image search             | REST API         | `services/imageSearchService.ts`, `api/brave-proxy.ts` | Pay-per-query | **Active**     |
| Pexels             | Curated photo search         | REST API         | `services/imageSearchService.ts`              | Free               | **Active**           |
| Unsplash           | Professional photography     | REST API         | `services/imageSearchService.ts`              | Free               | **Active**           |
| Supabase           | Database + Auth + Storage    | PostgreSQL + REST| `services/supabase.ts`, `services/projectService.ts`, `services/mediaService.ts` | Freemium | **Active** |

**V2 New Services (TBD from Research Epics)**:
- **Voice I/O** (Epic R3a): TBD (Web Speech API, Deepgram, AssemblyAI, etc.)
- **Voice Synthesis** (Epic R3a): TBD (ElevenLabs, PlayHT, Resemble AI, etc.)
- **Music Composition** (Epic R3b): TBD (Suno, Udio, Stable Audio, Soundful, AIVA)
- **Character Identity** (Epic R1): TBD (LoRA training, Flux Dev, IPAdapter, ReferenceNet, etc.)
- **3D Worlds** (Epic R2): TBD (current World Labs service, Unreal Engine, Gaussian Splatting, etc.)

---

### Internal Integration Points

**Frontend ↔ Backend Communication**:
- **Pattern**: REST API (Vercel serverless functions in `api/`)
- **CORS**: Handled by proxy functions (add `Access-Control-Allow-Origin: *` headers)
- **Authentication**: Supabase JWT tokens in Authorization header (when authenticated)

**State Management Flow**:
```
User Action (Tab Component)
  ↓
State Setter (setScriptAnalysis, setTimelineClips, etc.)
  ↓
App.tsx projectState update
  ↓
Auto-save (every 2 minutes)
  ↓
Supabase (authenticated) OR localStorage (anonymous)
```

**AI Generation Flow**:
```
User Clicks "Generate"
  ↓
Tab Component calls aiService function (generateStillVariants, animateFrame, etc.)
  ↓
aiService makes API request (Gemini, Flux, etc.)
  ↓
Progress callback updates UI (loading states)
  ↓
Blob URL or base64 result stored in state
  ↓
Auto-save persists to database/localStorage
```

**Timeline Rendering Flow**:
```
User Clicks "Export"
  ↓
ExportsTab calls videoRenderingService.renderTimelineToVideo()
  ↓
FFmpeg.wasm loads (if first time - 30s cold start)
  ↓
Concatenates timeline clips with transitions
  ↓
Returns blob URL of final video
  ↓
User downloads via browser download
```

---

## Development and Deployment

### Local Development Setup

**Prerequisites**:
- Node.js 18+ (recommended: 20+)
- npm (comes with Node.js)
- Git

**Actual Steps That Work**:
```bash
# 1. Clone repository
git clone <repo-url>
cd alkemy

# 2. Install dependencies
npm install

# 3. Create .env.local file (copy from .env.example)
cp .env.example .env.local

# 4. Add API keys to .env.local
# Required: GEMINI_API_KEY
# Optional: FLUX_API_KEY, WAN_API_KEY, BRAVE_SEARCH_API_KEY, etc.
# Optional (auth): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# 5. Start dev server
npm run dev
# Server runs on http://localhost:3000 (accessible on network via 0.0.0.0)

# 6. (Optional) Set up Supabase locally
# Follow supabase/SECURITY_FIXES.md for database migrations
npx supabase start  # Requires Docker
npx supabase db push
```

**Known Setup Issues**:
- **FFmpeg.wasm**: First video export downloads ~30MB from CDN (slow on poor connection)
- **Supabase**: Local Supabase requires Docker (heavyweight, skip if testing without auth)
- **API Keys**: Gemini API key is REQUIRED - app won't load without it (shows API key prompt)

---

### Build and Deployment Process

**Build Command**: `npm run build`
- Vite bundles to `dist/` directory
- Manual chunk splitting (see `vite.config.ts`):
  - `react-vendor` (React, React DOM, React Router DOM)
  - `ui-vendor` (Framer Motion)
  - `three-vendor` (Three.js)
- Terser minification preserves class/function names (required for FFmpeg.wasm)

**Deployment**: Vercel (auto-deploy on `main` branch push)
- **Project Name**: `alkemy1`
- **Default URL**: `https://alkemy1.vercel.app`
- **Build Command**: `npm run build` (Vercel auto-detects from package.json)
- **Output Directory**: `dist`
- **Node Version**: 20.x (Vercel default)

**Environment Variables** (set in Vercel dashboard):
```
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional (features degrade gracefully if missing)
FLUX_API_KEY=your_flux_key
WAN_API_KEY=your_wan_key
LUMA_API_KEY=your_luma_key
REPLICATE_API_TOKEN=your_replicate_key
BRAVE_SEARCH_API_KEY=your_brave_key
VITE_PEXELS_API_KEY=your_pexels_key
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key

# Optional (authentication)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Deployment Gotchas**:
- **VITE_ prefix**: Client-side env vars MUST start with `VITE_` or they won't be exposed
- **API keys in proxies**: Server-side keys (GEMINI_API_KEY, LUMA_API_KEY) are only accessible in `api/` functions
- **Newline characters**: Vercel env vars with trailing `\n` cause auth failures - re-add keys if seeing "invalid API key" errors

---

## Testing Reality

### Current Test Coverage

- **Unit Tests**: 0% (Playwright installed but no tests written)
- **Integration Tests**: 0%
- **E2E Tests**: 0%
- **Manual Testing**: Primary QA method

**Test Infrastructure Available**:
- **Playwright**: `@playwright/test@^1.56.1` installed as dev dependency
- **Recommended Structure**: Colocate tests with features (e.g., `tabs/FramesTab.spec.ts`)

**V2 Testing Requirements** (from PRD):
- Research epics must include proof-of-concept validation tests
- Implementation epics must include integration tests for new services
- Epic 8 (Cross-Feature Integration) requires end-to-end workflow tests

**Running Tests** (when implemented):
```bash
npx playwright test                  # Run all tests
npx playwright test --ui             # Interactive mode
npx playwright test tabs/FramesTab   # Run specific test file
```

---

## V2 Enhancement - Impact Analysis

### Files That Will Need Modification

Based on `docs/prd.md` requirements, the following existing files will be **modified**:

**Epic 1 (Director Agent Voice Enhancement)**:
1. `components/DirectorWidget.tsx` - Add voice input/output controls, style learning UI, continuity alerts
2. `services/aiService.ts` - Extend `askTheDirector()` with enhanced context awareness
3. `services/directorKnowledge.ts` - Add continuity checking algorithms, style pattern recognition
4. `types.ts` - Add `StyleProfile`, `ContinuityWarning` types

**Epic 2 (Character Identity System)**:
1. `tabs/CastLocationsTab.tsx` - Add character identity training UI, preview panel
2. `services/aiService.ts` - Integrate character identity preservation in `generateStillVariants()`
3. `types.ts` - Extend `AnalyzedCharacter` with `identityModel: CharacterIdentity`

**Epic 3 (3D Worlds)**:
1. `tabs/3DWorldsTab.tsx` - Add camera position marking, lighting preset selector
2. `services/worldLabsService.ts` OR new service - Enhanced 3D generation (depends on Epic R2)
3. `components/3DWorldViewer.tsx` - WASD controls, camera marker UI

**Epic 5 (Audio Mixing)**:
1. `tabs/FramesTab.simple.tsx` - Add audio stem tracks, waveform visualization, level controls
2. `services/videoRenderingService.ts` - Integrate multi-stem audio mixing with FFmpeg.wasm
3. `types.ts` - Extend `TimelineClip` with `audioStems: AudioStem[]`

**Epic 6 (Analytics)**:
1. `services/usageService.ts` - Add quality analytics events
2. `components/DirectorWidget.tsx` - Display analytics summaries in chat

**Epic 7a (Community Hub)**:
1. `services/projectService.ts` - Add `publishProject()`, `getPublicProjects()` functions
2. `App.tsx` - Add public/private project toggle

---

### New Files/Modules Needed

**Epic 1 (Director Voice)**:
- `services/voiceService.ts` - Voice I/O integration (speech recognition + synthesis)
- `types.ts` additions - `VoiceCommand`, `StyleProfile`, `ContinuityWarning`

**Epic 2 (Character Identity)**:
- `services/characterIdentityService.ts` - Character model training/inference (technology TBD)
- `types.ts` additions - `CharacterIdentity`, `IdentityTestResult`

**Epic 3 (3D Worlds)**:
- Potentially new service (depends on Epic R2 research - Unreal Engine, Gaussian Splatting, etc.)
- `components/CameraPositionMarker.tsx` - UI for marking camera positions in 3D space

**Epic 4 (Voice & Dialogue)**:
- `tabs/VoicesTab.tsx` - Voice selection and casting interface
- `services/voiceSynthesisService.ts` - Voice synthesis integration (separate from voice I/O)
- `types.ts` additions - `VoiceProfile`, `DialogueAudio`

**Epic 5 (Music & Sound)**:
- `tabs/MusicSoundTab.tsx` - Music composition and sound effects UI
- `services/musicService.ts` - AI music composition integration
- `services/audioMixingService.ts` - Multi-stem mixing logic (may extend `videoRenderingService.ts`)
- `components/AudioMixer.tsx` - Audio waveform and level controls
- `types.ts` additions - `AudioStem`, `MusicCompositionSettings`

**Epic 6 (Analytics)**:
- `tabs/AnalyticsTab.tsx` - Quality analytics dashboard
- `services/analyticsService.ts` - Creative feedback and performance metrics
- `components/AnalyticsChart.tsx` - Data visualization components
- `types.ts` additions - `AnalyticsEvent`, `QualityReport`

**Epic 7a (Community Hub)**:
- `tabs/CommunityHubTab.tsx` - Gallery, competitions, profiles
- `services/communityService.ts` - Gallery uploads, competition logic
- `types.ts` additions - `CommunityProject`, `Competition`, `CreatorProfile`

**Epic 7b (Marketplace) - DEFERRED TO V3**
**Epic 7c (Alkemy Academy) - DEFERRED TO V3**

---

### Integration Considerations

**State Management**:
- New V2 data (voice profiles, character models, audio stems) must integrate with existing `projectState` in `App.tsx`
- Options:
  1. **Extend `projectState`** - Add `voiceProfiles`, `characterModels`, `audioStems` keys (simplest)
  2. **Separate contexts** - Create `VoiceContext`, `AudioContext` to avoid bloating main state (more complex)
- **Recommendation**: Start with extending `projectState`, refactor to contexts if state becomes unwieldy (>2000 lines)

**Persistence**:
- Large V2 data (character model weights, audio stems) **MUST** use Supabase Storage, NOT localStorage
- localStorage should only store **references** (URLs) to Supabase Storage assets
- Follow existing pattern in `mediaService.ts` for uploads

**UI Consistency**:
- All new tabs must use `useTheme()` hook for dynamic theming
- Follow existing `Button` component, `Toast` notifications, `SkeletonLoader` patterns
- New modals must follow `PromptModal.tsx` pattern (Framer Motion animations, glassmorphic background)

**API Service Pattern**:
- New services (voice, music, character identity) must follow `aiService.ts` patterns:
  - Progress callbacks: `onProgress?: (progress: number, message?: string) => void`
  - Error handling: `try/catch` with user-friendly error messages via `Toast`
  - Graceful degradation: Check if API key available before attempting generation

**Routing**:
- New tabs (Voices, Music, Analytics, Community) must be registered in `constants.ts` `TABS_CONFIG`
- Must be rendered in `App.tsx` `renderContent()` switch statement
- Community Hub may need new routes (`/gallery/:projectId`, `/competitions`, etc.) via React Router

---

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
# Development
npm run dev              # Start Vite dev server on port 3000

# Build
npm run build            # Production build to dist/

# Preview
npm run preview          # Preview production build locally

# Deployment (via Vercel CLI)
vercel                   # Deploy to preview URL
vercel --prod            # Deploy to production
vercel env ls            # List environment variables (shows "Encrypted")
vercel env pull          # Pull env vars to .env.local for dev

# Supabase (local development)
npx supabase start       # Start local Supabase (requires Docker)
npx supabase stop        # Stop local Supabase
npx supabase db push     # Apply migrations to local database
npx supabase db reset    # Reset local database (WARNING: destroys data)

# Testing (when tests are implemented)
npx playwright test      # Run all Playwright tests
npx playwright test --ui # Run tests in interactive UI mode
```

### Debugging and Troubleshooting

**Logs**:
- **Browser Console**: All client-side errors logged to console (F12 Dev Tools)
- **Vercel Logs**: `vercel logs` or view in Vercel dashboard
- **Supabase Logs**: Supabase dashboard > Logs tab (for auth errors, database errors)

**Debug Mode**:
- **Vite Dev Server**: Automatically shows detailed errors in browser overlay
- **React DevTools**: Install browser extension for component inspection

**Common Issues**:

| Issue                               | Symptom                                      | Solution                                                                 |
| ----------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| API key not working                 | "Invalid API key" error, generations fail    | Check Vercel env vars for newlines, use `AIza` keys not `AQ.` keys      |
| FFmpeg slow to load                 | First export takes 30+ seconds               | Expected - FFmpeg.wasm downloads from CDN, cache improves subsequent loads |
| localStorage quota exceeded         | "QuotaExceededError" on save                 | Sign in to use Supabase, or clear old projects from localStorage        |
| Blob URLs not playing              | Video clips show black screen in timeline    | Check blob URLs not revoked - persist during playback, only revoke on cleanup |
| Supabase auth redirect fails        | OAuth callback hangs or redirects to error page | Verify `/auth/callback` route configured, check Supabase dashboard allowed URLs |
| Theme not applying                  | Colors revert to hardcoded values            | Component using `constants.ts` instead of `useTheme()` - fix component   |
| Tab appears in sidebar but won't render | Clicking tab does nothing                  | Missing `renderContent()` case in App.tsx - add switch case              |

---

## V2 Development Workflow Recommendations

Based on this brownfield analysis and the V2 PRD, recommended development sequence:

### Phase 1: Research & Validation (Epics R1, R2, R3a, R3b)
1. **Run research epics in parallel** (R1, R2, R3a, R3b can be concurrent)
2. **Create proof-of-concept prototypes** for each technology candidate
3. **Document research outcomes** in `docs/research/` directory
4. **Make technology decisions** before any implementation epics

### Phase 2: V2.0 Implementation (Core Production Features)
1. **Epic 1**: Director Agent Voice Enhancement
   - Create `services/voiceService.ts`
   - Modify `components/DirectorWidget.tsx`
   - Add voice I/O UI controls
2. **Epic 2**: Character Identity System
   - Create `services/characterIdentityService.ts` (using technology from Epic R1)
   - Modify `tabs/CastLocationsTab.tsx`
   - Extend `types.ts` with `CharacterIdentity`
3. **Epic 5**: Music, Sound & Audio Mixing
   - Create `services/musicService.ts` (using technology from Epic R3b)
   - Create `tabs/MusicSoundTab.tsx`
   - Modify `tabs/FramesTab.simple.tsx` for audio mixing
4. **Epic 8.1**: V2.0 Integration Testing
   - Write Playwright tests for voice + character + audio workflows

### Phase 3: V2.1 Implementation (Immersive Features)
1. **Epic 3**: Explorable 3D Locations
2. **Epic 4**: Voice & Dialogue Production
3. **Epic 8.2**: V2.1 Integration Testing

### Phase 4: V2.2 Implementation (Growth Features)
1. **Epic 6**: Analytics
2. **Epic 7a**: Community Hub
3. **Epic 8.3**: V2.2 Integration Testing

---

## Conclusion

This brownfield architecture document provides AI agents with a comprehensive understanding of:
- **Current implementation state** (V1 foundation with ~50% of V2 features partially built)
- **Technical debt and workarounds** (aiService monolith, blob URL management, localStorage limits)
- **V2 integration points** (which files to modify, which to create new)
- **Deployment reality** (Vercel + Supabase, serverless API proxies)

**Key Takeaways for V2 Development**:
1. **Research first** - Don't implement until technology decisions validated (Epics R1-R3b)
2. **Extend, don't rewrite** - Most V2 features enhance existing modules, not replace them
3. **Use Supabase Storage** - New V2 data (character models, audio stems) too large for localStorage
4. **Follow existing patterns** - Service layer abstraction, progress callbacks, error handling via Toast
5. **Test as you go** - No tests exist currently - V2 must establish testing culture

For detailed V2 requirements and success metrics, see `docs/prd.md`.

---

**Document Status**: ✅ Complete - Ready for V2 development

**Next Actions**:
1. Create research spike plans (Epic R1, R2, R3a, R3b)
2. Set up Supabase migrations for V2 data models
3. Create Playwright test infrastructure
4. Begin Epic R1 (Character Identity Research)
