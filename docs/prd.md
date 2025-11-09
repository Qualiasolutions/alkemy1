# Alkemy AI Film Studio - Product Requirements Document (V2 Enhancement)

**Document Version**: 2.0
**Last Updated**: 2025-11-09
**Status**: Draft
**Author**: Product Management (John)

---

## Table of Contents

1. [Intro Project Analysis and Context](#1-intro-project-analysis-and-context)
2. [Requirements](#2-requirements)
3. [User Interface Enhancement Goals](#3-user-interface-enhancement-goals)
4. [Technical Constraints and Integration Requirements](#4-technical-constraints-and-integration-requirements)
5. [Epic and Story Structure](#5-epic-and-story-structure)
6. [Release Roadmap](#6-release-roadmap)
7. [Success Metrics](#7-success-metrics)

---

## 1. Intro Project Analysis and Context

### 1.1 Analysis Source

**Status**: ✅ IDE-based fresh analysis completed

Comprehensive analysis of the Alkemy AI Studio codebase including:
- Full CLAUDE.md documentation review
- Service layer architecture examination (22 service modules)
- Tab-based UI workflow analysis (11 existing tabs)
- Current feature implementation mapping

---

### 1.2 Current Project State

**Alkemy AI Studio** is a **React-based AI film production application** that transforms scripts into complete visual productions using Google's Gemini ecosystem (Imagen, Veo 3.1, Gemini 2.5 Pro).

**Primary Purpose**: Empower filmmakers to create shot-by-shot visual compositions from screenplays through AI-powered generation.

**Current Capabilities (V1 Foundation)**:
- Script upload and AI-powered analysis (character/scene/location extraction)
- Visual reference moodboarding with multi-source image search (Brave/Pexels/Unsplash)
- Character and location asset generation
- 3D world creation (World Labs-inspired procedural generation)
- Shot composition with cinematic image generation (Flux/Imagen/Nano Banana)
- Video animation pipeline (Veo 3.1)
- Timeline editing with FFmpeg.wasm rendering
- Motion transfer capabilities (Wan 2.2)
- DirectorWidget AI assistant (text-based cinematography guidance)

**Technical Foundation**:
- React 19.2 + TypeScript 5.8.2
- Vite build system with Tailwind CSS 3.4.17
- Framer Motion animations
- Supabase authentication (optional)
- localStorage + cloud persistence
- Vercel deployment with serverless API proxies

---

### 1.3 Available Documentation

**✅ Comprehensive Documentation Available:**
- ✅ Tech Stack Documentation (CLAUDE.md - 650+ lines)
- ✅ Source Tree/Architecture (component organization, service patterns)
- ✅ API Documentation (all 22 services documented with usage patterns)
- ✅ External API Documentation (Gemini, Flux, Veo, Wan integrations)
- ✅ Technical Debt Documentation (troubleshooting, legacy service notes)
- ⚠️ **PARTIAL:** UX/UI Guidelines (theme system exists, no formal design system)
- ⚠️ **PARTIAL:** Coding Standards (conventions listed, not formalized)

**Assessment**: Existing documentation is sufficient for PRD creation. No need for `document-project` task.

---

### 1.4 Enhancement Scope Definition

**Enhancement Type**: ☑️ **New Feature Addition** (Production-critical capabilities + community/growth features)

**Enhancement Description**:
Transform Alkemy from a visual-focused foundation into a **complete end-to-end AI film production studio** by adding critical missing production capabilities and growth features. This enhancement bridges the gap between the current exploratory implementation and the full vision outlined in the roadmap.

**Core Enhancement Areas**:
1. **Voice-Driven Interaction** - Enable hands-free workflow via Director Agent voice I/O
2. **Character Identity Consistency** - Ensure characters appear identical across all shots
3. **Explorable 3D Locations** - Navigate environments, mark camera positions, preview lighting
4. **Professional Audio Production** - Voice synthesis, music composition, sound effects, mixing
5. **Quality Analytics** - AI-powered creative feedback and performance tracking
6. **Community & Marketplace** - Social features, asset sharing, educational content

**Impact Assessment**: ☑️ **Significant Impact** (substantial new features + architectural components)

**Rationale**:
- New service layers required (voice I/O, music composition, analytics)
- DirectorWidget enhancement (voice input/output integration)
- Character system overhaul (identity preservation mechanism - technology TBD)
- Timeline audio mixing capabilities
- New tabs (Voices, Music/Sound, Analytics, Community, Marketplace)
- **No breaking changes** to existing core pipeline

---

### 1.5 Goals and Background Context

**Goals**:
1. Enable **voice-controlled workflow** for hands-free filmmaking and accessibility
2. Ensure **character identity consistency** across all shots to eliminate continuity errors
3. Deliver **complete audio production** (dialogue, music, foley) within the platform
4. Provide filmmakers with **AI-powered quality feedback** and creative analytics
5. Build **community features** for sharing, learning, and monetizing creative assets
6. Position Alkemy as the **"Unreal Engine for AI Filmmaking"** - the definitive platform

**Background Context**:

The current Alkemy implementation delivers strong visual generation capabilities but lacks **production-critical audio features** and **character consistency mechanisms** that prevent filmmakers from creating complete, professional films without external tools.

The roadmap vision articulates a comprehensive platform where filmmakers can:
- Work entirely via voice commands when desired
- Trust that characters remain visually identical across all shots
- Compose music and sound design within the same platform
- Receive AI-powered creative guidance throughout production
- Share work and monetize assets within a creator community

This enhancement delivers those capabilities through a **research-validated, phased approach** that:
1. **Validates technical approaches** before committing development resources (Research Epics)
2. **Delivers incrementally** via V2.0 (core features), V2.1 (immersive features), V2.2 (growth features)
3. **Maintains compatibility** with existing projects and workflows

---

### 1.6 Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial PRD | 2025-11-09 | 2.0 | Brownfield enhancement PRD for V2 roadmap features with research-first approach | PM Agent (John) |

---

## 2. Requirements

### Overview

These requirements describe **WHAT filmmakers need to accomplish**, not HOW the system implements it. Each requirement maps to a user capability from the roadmap. Technical implementation decisions (e.g., character identity preservation method, 3D world rendering technology, voice service selection) are deferred to specialist research agents via dedicated Research Epics.

**Key Principles**:
- Requirements focus on **user-facing capabilities** and **measurable outcomes**
- **No technology prescriptions** - implementation is determined by research outcomes
- **Research callouts** (🔬) identify areas requiring technical investigation
- Compatibility requirements ensure new capabilities integrate with existing foundation

---

### 2.1 Functional Requirements

#### **FR-DA: Director Agent Enhancement**

**Core Presence & Context Awareness**
- **FR-DA1**: The Director Agent shall be accessible as a persistent widget in the bottom-right of the screen throughout all tabs
- **FR-DA2**: The Director Agent shall have complete read access to the current project state (script, characters, locations, scenes, moodboard, Look Bible, timeline)
- **FR-DA3**: The Director Agent shall be embeddable within specific workflow pages (generation pages, compositing, timeline) for contextual assistance
- **FR-DA4**: The Director Agent shall maintain conversation history within the current project session

**Voice Interaction**
- **FR-DA5**: The Director Agent shall accept voice input as an alternative to text chat
- **FR-DA6**: The Director Agent shall provide spoken responses for hands-free workflow
- **FR-DA7**: Voice mode shall be toggleable (text-only, voice-only, hybrid)
- **FR-DA8**: Voice commands shall support full film terminology (cameras, lenses, lighting, editing rhythm)
- **🔬 RESEARCH REQUIRED**: Evaluate Web Speech API vs. dedicated voice services for low-latency voice I/O

**Creative Assistance Capabilities**
- **FR-DA9**: The Director Agent shall answer cinematography questions (camera angles, lenses, lighting, composition)
- **FR-DA10**: The Director Agent shall generate optimized prompts for image/video generation based on project context
- **FR-DA11**: The Director Agent shall suggest creative decisions based on scene emotion and Look Bible consistency
- **FR-DA12**: The Director Agent shall provide continuity feedback when reviewing shots or timeline

**Task Execution**
- **FR-DA13**: The Director Agent shall execute delegated tasks (e.g., "generate 3 variations of this shot", "find similar reference images")
- **FR-DA14**: The Director Agent shall initiate generation workflows on behalf of the user
- **FR-DA15**: The Director Agent shall queue multiple operations and report progress
- **FR-DA16**: The Director Agent shall validate creative decisions against project constraints (Look Bible, character consistency, continuity)

**Learning & Adaptation**
- **FR-DA17**: The Director Agent shall track filmmaker's creative patterns (preferred shot types, lens choices, color grades)
- **FR-DA18**: The Director Agent shall adapt suggestions based on learned preferences (e.g., "You typically use 50mm for close-ups")
- **FR-DA19**: The Director Agent shall maintain a persistent filmmaker style profile across sessions
- **FR-DA20**: The Director Agent shall surface relevant project history across all tabs (e.g., "This location was used in Scene 2")

**Continuity & Quality Assurance**
- **FR-DA21**: The Director Agent shall analyze timeline clips for continuity errors (lighting jumps, costume changes, spatial mismatches)
- **FR-DA22**: The Director Agent shall provide correction suggestions when continuity issues are detected
- **FR-DA23**: The Director Agent shall validate shots against Look Bible before transfer to timeline

---

#### **FR-CI: Character Identity Consistency**

- **FR-CI1**: Characters shall maintain identical visual appearance across all generated shots, regardless of angle, lighting, or scene
- **FR-CI2**: Filmmakers shall be able to upload or generate reference images for each character
- **FR-CI3**: The system shall provide a character preview panel to test appearance variations before scene generation
- **FR-CI4**: Character identity preservation shall work with existing image generation services (Flux, Imagen)
- **FR-CI5**: [Optional] The system shall support transferring motion from real-actor reference videos to generated characters
- **🔬 RESEARCH REQUIRED (Epic R1)**: Evaluate optimal approach for character identity preservation (LoRA training, Flux Dev consistent character, alternative APIs, hybrid approaches)

---

#### **FR-3D: Explorable 3D Location Environments**

- **FR-3D1**: Filmmakers shall be able to explore location environments in navigable 3D space
- **FR-3D2**: Camera positions (A/B/C angles) shall be markable and savable within 3D environments
- **FR-3D3**: Lighting conditions shall be previewable and adjustable (Golden Hour, Overcast, Neon, Studio, etc.)
- **FR-3D4**: Location environments shall be reusable as Location Assets across projects
- **FR-3D5**: Set design elements (props, layout) shall be adjustable within 3D environments
- **FR-3D6**: 3D navigation shall support standard controls (WASD + mouse, or equivalent)
- **FR-3D7**: Camera position data shall export in a format compatible with shot generation workflow
- **🔬 RESEARCH REQUIRED (Epic R2)**: Compare World Labs-inspired procedural generation vs. Unreal Engine integration vs. Gaussian Splatting vs. emerging 2025 solutions

---

#### **FR-LB: Visual Identity System (Look Bible)**

- **FR-LB1**: The system shall automatically analyze moodboard references to generate a Look Bible (color, contrast, lighting style)
- **FR-LB2**: All visual generations (characters, locations, shots) shall automatically inherit Look Bible styling
- **FR-LB3**: The Director Agent shall enforce Look Bible consistency across all assets
- **FR-LB4**: Filmmakers shall be able to adjust Look Bible parameters and regenerate assets with updated styling
- **FR-LB5**: Look Bible application shall not break existing moodboard or image generation workflows

---

#### **FR-VO: Voice & Dialogue Production**

- **FR-VO1**: Each character shall have a unique, consistent voice across all dialogue
- **FR-VO2**: Filmmakers shall preview multiple voice options per character before selection
- **FR-VO3**: Generated dialogue shall match emotional tone, accent, and performance requirements
- **FR-VO4**: The system shall support multilingual voice generation with lip-sync capability
- **FR-VO5**: Voice casting shall be manageable via Director Agent (text or voice commands)
- **FR-VO6**: Dialogue audio shall integrate seamlessly with timeline clips
- **🔬 RESEARCH REQUIRED (Epic R3a)**: Evaluate voice synthesis services (ElevenLabs vs. alternatives) for quality, cost, multilingual support

---

#### **FR-AU: Sound, Music & Effects**

- **FR-AU1**: The system shall automatically score music matched to scene emotion and genre
- **FR-AU2**: Ambient sound, foley effects, and environmental audio shall be generated automatically
- **FR-AU3**: Audio levels shall be balanced and mixed professionally
- **FR-AU4**: Multiple mix versions shall be exportable (master mix, dialogue-only, music-only, alt language mixes)
- **FR-AU5**: Timeline shall support multi-stem audio editing (dialogue, music, effects as separate tracks)
- **FR-AU6**: Real-time audio playback shall work during timeline editing
- **🔬 RESEARCH REQUIRED (Epic R3b)**: Identify AI music composition API/service, foley generation solutions, evaluate WebAudio API for real-time mixing

---

#### **FR-TL: Timeline & Assembly Enhancement**

- **FR-TL1**: Shot clips shall assemble automatically in script order upon generation completion
- **FR-TL2**: Filmmakers shall be able to trim, grade, and apply transitions in real-time
- **FR-TL3**: The Director Agent shall suggest pacing and continuity improvements
- **FR-TL4**: Timeline shall support audio mixing (dialogue, music, effects) with waveform visualization and level controls
- **FR-TL5**: Audio mixing shall preserve existing video rendering pipeline (FFmpeg.wasm)

---

#### **FR-AN: Analytics & Creative Feedback**

- **FR-AN1**: The system shall evaluate color consistency, lighting coherence, and Look Bible adherence
- **FR-AN2**: Filmmakers shall receive creative performance reports with actionable improvement suggestions
- **FR-AN3**: Technical performance tracking shall include render time, GPU/API cost, and error rates
- **FR-AN4**: The Director Agent shall summarize project quality and suggest optimizations
- **FR-AN5**: Analytics shall not track personally identifiable user behavior (privacy-focused)

---

#### **FR-CH: Community Hub**

- **FR-CH1**: Filmmakers shall upload completed films to the Alkemy Gallery
- **FR-CH2**: Creator profiles and portfolios shall be buildable within the platform
- **FR-CH3**: Monthly competitions shall be supported (Best Thriller, Commercial, Comedy categories)
- **FR-CH4**: Community tutorials, news, and highlights shall be accessible
- **FR-CH5**: Gallery films shall be viewable by authenticated and anonymous users

---

#### **FR-MK: Marketplace & Academy**

- **FR-MK1**: Filmmakers shall buy and sell creative assets (Look Bibles, character models, LUTs, sound packs)
- **FR-MK2**: Asset creators shall earn revenue from shared assets
- **FR-MK3**: Professional courses via Alkemy Academy shall be accessible
- **FR-MK4**: Asset licensing and attribution shall be managed automatically
- **FR-MK5**: Payment processing shall support standard methods (credit card, PayPal, etc.)

---

#### **FR-CO: Team Collaboration**

- **FR-CO1**: Multiple collaborators shall work on the same project with real-time synchronization
- **FR-CO2**: Role-based permissions shall be assignable (Director, Editor, Producer, etc.)
- **FR-CO3**: Comments, approvals, and version control shall support asynchronous collaboration
- **FR-CO4**: Cloud sync shall keep all team members on the same project version
- **FR-CO5**: Collaboration features shall require Supabase configuration (not available in localStorage-only mode)

---

### 2.2 Non-Functional Requirements

**Performance**
- **NFR1**: Director Agent voice command latency shall not exceed 2 seconds from utterance to action execution
- **NFR2**: Character identity consistency shall achieve >95% visual similarity score across variations (measured via CLIP/FaceNet embeddings)
- **NFR3**: 3D environment navigation shall maintain 60fps on target hardware (specify: desktop with modern GPU)
- **NFR4**: Look Bible application shall not increase generation time by more than 15%
- **NFR5**: Voice synthesis quality shall be indistinguishable from professional voice actors in blind tests (>80% pass rate)
- **NFR6**: Music composition shall generate emotionally appropriate scores in <30 seconds
- **NFR7**: Timeline audio mixing shall support real-time playback without buffering for projects up to 30 minutes
- **NFR8**: Analytics reports shall generate in <5 seconds for projects up to 30 minutes duration

**Scalability**
- **NFR9**: Community Hub shall support 100,000+ concurrent users at launch
- **NFR10**: Marketplace transactions shall complete with <1 second confirmation
- **NFR11**: Team collaboration shall support up to 10 concurrent editors per project

**Compatibility**
- **NFR12**: The system shall maintain existing performance characteristics for current features (script analysis, image generation, timeline rendering)
- **NFR13**: All new features shall gracefully degrade when optional APIs are unavailable
- **NFR14**: New features shall work in modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**Security & Privacy**
- **NFR15**: Voice data shall not be stored permanently unless explicitly opted-in by user
- **NFR16**: Analytics shall be privacy-focused (no PII tracking without consent)
- **NFR17**: Marketplace transactions shall use secure payment processing (PCI DSS compliant)

---

### 2.3 Compatibility Requirements

- **CR1**: New voice-driven capabilities shall not break existing keyboard/mouse workflows (both modes supported)
- **CR2**: Character identity system shall integrate with existing CastLocationsTab without refactoring UI patterns
- **CR3**: 3D location environments shall export compatible formats for existing compositing workflow
- **CR4**: Look Bible application shall work with existing moodboard and image generation services (Flux, Imagen)
- **CR5**: Voice & dialogue shall integrate with existing timeline clips without changing TimelineClip data model
- **CR6**: Audio mixing shall preserve existing video rendering pipeline (FFmpeg.wasm)
- **CR7**: Analytics shall leverage existing Supabase usage tracking infrastructure
- **CR8**: Community Hub shall use existing authentication system (Supabase Auth)
- **CR9**: Marketplace shall integrate with existing project persistence (localStorage + cloud)
- **CR10**: Team collaboration shall extend existing AuthContext without breaking single-user mode
- **CR11**: All new features shall support existing project save/load functionality (.alkemy.json format)
- **CR12**: Existing projects shall be upgradable to use new features (character identity, audio, etc.) without data loss

---

## 3. User Interface Enhancement Goals

### 3.1 Integration with Existing UI

**Design System Consistency**
- New UI elements shall use the existing theme system (`useTheme()` hook) for color tokens
- All new components shall follow existing naming conventions (PascalCase, functional components)
- Animations shall use Framer Motion for consistency with existing transitions
- New tabs shall integrate with the existing `TABS_CONFIG` structure in `constants.ts`

**Component Reuse**
- New features shall leverage existing components where applicable:
  - `Button.tsx` for all interactive buttons
  - `Toast.tsx` for notifications
  - `SkeletonLoader.tsx` for loading states
  - `EmptyState.tsx` for empty views
  - Existing auth components (`LoginForm`, `RegisterForm`, `AuthModal`, `UserMenu`)

**DirectorWidget Enhancement**
- Voice I/O controls shall be added to the existing DirectorWidget without breaking text chat
- Continuity feedback shall appear as inline suggestions in the chat interface
- Style learning indicators shall be visible but non-intrusive (e.g., subtle badge or status text)
- Widget shall remain collapsible and positioned bottom-right

---

### 3.2 Modified/New Screens and Views

**Enhanced Existing Tabs:**
1. **Cast & Locations Tab** - Add character identity testing panel (preview variations before approval)
2. **3D Worlds Tab** - Add camera position marking UI, lighting preset selector, WASD/mouse navigation controls
3. **Timeline Tab** - Add audio mixing controls (dialogue/music/effects level sliders, waveform visualization)
4. **Exports Tab** - Add multilingual export options, format presets (master/trailer/social cuts)

**New Tabs:**
1. **Voices Tab** - Character voice selection, preview player, casting interface
2. **Music & Sound Tab** - AI composer controls, foley management, mix preview
3. **Analytics Tab** - Creative and technical performance reports, quality scores, optimization suggestions
4. **Community Hub Tab** - Gallery browse/upload, competitions, tutorials, creator profiles
5. **Marketplace Tab** - Asset browse/purchase/sell, revenue dashboard, Alkemy Academy access

**DirectorWidget Visual Enhancements:**
1. Voice input toggle (microphone button with pulsing state during listening)
2. Style learning status indicator (e.g., "Learning your style: 12 projects analyzed")
3. Continuity alert badges (e.g., "3 continuity issues detected - tap for details")

---

### 3.3 UI Consistency Requirements

- **UCR1**: New tabs shall maintain the existing sidebar navigation pattern (collapsed/expanded states)
- **UCR2**: All generation workflows shall follow the existing progress callback pattern with real-time UI updates
- **UCR3**: Voice controls shall be visually distinct but not disruptive (e.g., pulsing microphone icon, subtle audio waveform)
- **UCR4**: Audio waveforms in Timeline shall use the existing theme color palette for visual consistency
- **UCR5**: Community Hub and Marketplace shall use the existing authentication flow (Supabase Auth)
- **UCR6**: Analytics visualizations shall follow existing design language (dark mode first, light mode compatible)
- **UCR7**: All new modals/overlays shall use the existing modal pattern (see `PromptModal.tsx`)
- **UCR8**: Loading states for new features shall use `SkeletonLoader` or existing loading patterns
- **UCR9**: Empty states shall use `EmptyState.tsx` component with contextual messaging
- **UCR10**: Error messages shall use `Toast` component with appropriate severity (error, warning, info, success)

---

## 4. Technical Constraints and Integration Requirements

### 4.1 Existing Technology Stack

**Languages**: TypeScript 5.8.2, JavaScript (ES2020+)

**Frameworks**:
- React 19.2.0 (functional components with hooks)
- Vite (build tool, dev server on port 3000)
- Tailwind CSS 3.4.17 with PostCSS and Autoprefixer
- Framer Motion (animations)

**AI & Generation APIs**:
- Google Gemini 2.5 Pro (script analysis, prompt generation)
- Google Imagen (image generation)
- Google Veo 3.1 (video animation)
- Flux (alternative image generation)
- Wan 2.2 (motion transfer)
- Brave Search API (image search)
- Pexels API (curated photos)
- Unsplash API (professional photography)

**Database & Authentication**:
- Supabase (optional cloud persistence, authentication)
- localStorage (fallback/default persistence)

**Infrastructure**:
- Vercel (hosting, serverless functions in `api/` directory)
- FFmpeg.wasm (client-side video rendering)
- Three.js (3D world rendering)

**External Dependencies**:
- `@google/genai` SDK
- `@ffmpeg/ffmpeg` and `@ffmpeg/util`
- `@supabase/supabase-js`
- `three` (3D rendering)
- `react-router-dom` v7 (routing)

**Constraints**:
- API keys managed via environment variables (`.env.local`) and exposed through `vite.config.ts`
- CORS-safe API proxies via Vercel serverless functions (`/api/luma-proxy`, `/api/replicate-proxy`, `/api/brave-proxy`)
- localStorage quota limits require serialization optimization (blob URLs → base64)
- Gemini API key validation flow handles both AI Studio and Google AI API keys

---

### 4.2 Integration Approach

**Database Integration Strategy**:
- New features (voice profiles, style learning, analytics) shall store data in Supabase tables when configured
- Graceful degradation to localStorage for users without Supabase configuration
- Existing `projectService.ts` pattern shall be extended for new data models:
  - Character voice mappings (`character_voices` table)
  - Music stems and audio assets (`audio_assets` table)
  - Analytics events (`analytics_events` table)
  - Style learning profiles (`user_style_profiles` table)

**API Integration Strategy**:
- New AI services (voice synthesis, music composition) shall follow the existing serverless proxy pattern
- Create new proxy functions in `api/` directory for CORS-restricted APIs:
  - `/api/voice-proxy` (voice synthesis service)
  - `/api/music-proxy` (music composition service)
- API key management shall use existing `services/apiKeys.ts` pattern
- Error handling shall use existing `handleApiError()` pattern from `aiService.ts`
- All new services shall support progress callbacks for real-time UI updates

**Frontend Integration Strategy**:
- New tabs shall register in `constants.ts` `TABS_CONFIG` array under appropriate phase (Development, Production, Media)
- New service modules shall follow existing naming convention:
  - `services/voiceService.ts` (voice I/O and synthesis)
  - `services/musicService.ts` (music composition and stems)
  - `services/analyticsService.ts` (quality analytics)
  - `services/communityService.ts` (gallery, competitions)
  - `services/marketplaceService.ts` (asset transactions)
- State management shall extend existing App.tsx centralized project state pattern
- New components shall use existing `components/` organization (reusable UI) and `tabs/` (feature views)

**Testing Integration Strategy**:
- Playwright test suite shall be created for new features (currently no tests exist)
- Tests shall colocate with features (e.g., `tabs/VoicesTab.spec.ts`)
- Integration tests shall validate new service layers against API contracts
- E2E tests shall cover critical user journeys (voice command → generation, character identity workflow, audio mixing)

---

### 4.3 Code Organization and Standards

**File Structure Approach**:
- New services: `services/voiceService.ts`, `services/musicService.ts`, `services/analyticsService.ts`, `services/communityService.ts`, `services/marketplaceService.ts`
- New tabs: `tabs/VoicesTab.tsx`, `tabs/MusicSoundTab.tsx`, `tabs/AnalyticsTab.tsx`, `tabs/CommunityHubTab.tsx`, `tabs/MarketplaceTab.tsx`
- New components: `components/VoicePreview.tsx`, `components/AudioMixer.tsx`, `components/AnalyticsChart.tsx`, `components/CameraPositionMarker.tsx`
- Voice I/O integration: Extend `components/DirectorWidget.tsx` (do not create separate component)

**Naming Conventions**:
- Components: PascalCase (e.g., `VoicePreview.tsx`)
- Hooks: Prefix with `use` (e.g., `useVoiceRecognition.ts`, `useAudioMixing.ts`)
- Services: camelCase files (e.g., `voiceService.ts`), exported functions are camelCase
- Types: PascalCase interfaces/types in `types.ts`

**Coding Standards**:
- 4-space indentation (existing convention)
- Functional components with hooks exclusively (no class components)
- Use `@/*` import alias for all project imports
- Functional state updates for nested state (`setScriptAnalysis((prev) => ...)`)
- Progress callbacks for all async operations (`onProgress?: (progress: number) => void`)
- Error boundaries for new feature areas to prevent full app crashes

**Documentation Standards**:
- All new services shall document functions with JSDoc comments
- CLAUDE.md shall be updated with new service descriptions (following existing pattern in "Advanced Services" section)
- README updates not required (deployment-focused, not feature-focused)
- Research epic outcomes shall be documented in `docs/research/` directory

---

### 4.4 Deployment and Operations

**Build Process Integration**:
- Vite build configuration (`vite.config.ts`) shall expose new environment variables via `define` config
- Manual chunk splitting shall be updated if new large dependencies are added (e.g., voice recognition libraries → `voice-vendor` chunk)
- Terser minification shall preserve class/function names for new services

**Deployment Strategy**:
- Auto-deploy on push to `main` branch (existing Vercel integration)
- New environment variables shall be added to Vercel dashboard:
  - `VOICE_API_KEY` (voice service - TBD based on Epic R3a research)
  - `MUSIC_API_KEY` (music composition service - TBD based on Epic R3b research)
  - Character identity API key (TBD based on Epic R1 research)
  - Existing keys remain: `GEMINI_API_KEY`, `FLUX_API_KEY`, `VITE_SUPABASE_URL`, etc.
- Feature flags for gradual rollout (e.g., `ENABLE_VOICE_MODE`, `ENABLE_COMMUNITY_HUB`)

**Monitoring and Logging**:
- Client-side errors shall log to console (existing pattern, no external monitoring in V2.0)
- New features shall use existing `Toast` component for user-facing error messages
- Analytics events shall log via `services/usageService.ts` when Supabase is configured
- (Future) Consider adding Sentry or similar for production error tracking

**Configuration Management**:
- `.env.local` for local development (never committed)
- `.env.example` shall be updated with new API key descriptions
- Vercel environment variables for production
- Feature flags managed via environment variables (default: disabled)

---

### 4.5 Risk Assessment and Mitigation

**Technical Risks**:
1. **Voice I/O latency** - Web Speech API may have >2s latency on some browsers
   - *Mitigation*: Research Epic R3a to evaluate dedicated voice services (Deepgram, AssemblyAI) vs. Web Speech API
2. **Character identity consistency** - Chosen solution may be complex/expensive/slow
   - *Mitigation*: Research Epic R1 to compare LoRA vs. Flux Dev vs. emerging solutions before committing
3. **3D world performance** - Complex environments may not hit 60fps on target hardware
   - *Mitigation*: Research Epic R2 to benchmark performance; implement quality presets (Draft/Standard/Ultra) with adaptive detail
4. **Audio mixing complexity** - Real-time audio playback with multiple stems may require deep WebAudio API expertise
   - *Mitigation*: Research Epic R3b to prototype audio mixing in isolation before timeline integration
5. **Build size bloat** - New dependencies (voice libs, audio processing) may significantly increase bundle size
   - *Mitigation*: Code-split new tabs, lazy-load heavy libraries, monitor bundle size in CI

**Integration Risks**:
1. **State management complexity** - Adding voice profiles, music stems, analytics data may bloat project state
   - *Mitigation*: Evaluate separating analytics/community data from core project state; use normalized data structures
2. **API key proliferation** - Multiple new services increase setup friction for users
   - *Mitigation*: Implement graceful degradation (core features work without optional APIs); provide clear setup wizard
3. **localStorage quota** - Audio data (music stems, voice clips) may exceed 5-10MB quota
   - *Mitigation*: Store audio in Supabase Storage when configured, fall back to temporary blob URLs with cleanup

**Deployment Risks**:
1. **API cost explosion** - Voice synthesis and music generation may be expensive at scale
   - *Mitigation*: Implement usage quotas, tier-based limits via Supabase; cost monitoring dashboard for admin
2. **Breaking changes** - New features may inadvertently break existing functionality
   - *Mitigation*: Explicit brownfield migration/compatibility stories in each implementation epic; comprehensive regression testing

**User Experience Risks**:
1. **Feature discoverability** - Users may not find new voice/audio features
   - *Mitigation*: Onboarding tooltips, Director Agent proactively suggests new capabilities
2. **Overwhelming UI** - Too many new tabs/features may confuse users
   - *Mitigation*: Phased rollout (V2.0 → V2.1 → V2.2); progressive disclosure of advanced features

**Mitigation Strategies Summary**:
- **Research-first approach** - Technical spikes before implementation (R1, R2, R3a, R3b)
- **Feature flags** - New capabilities behind environment variables for gradual rollout
- **Graceful degradation** - Core filmmaking pipeline works without optional enhancements
- **Performance budgets** - Define acceptable latency/bundle size thresholds before development
- **Incremental releases** - V2.0 (core), V2.1 (immersive), V2.2 (growth) to reduce big-bang risk

---

## 5. Epic and Story Structure

### 5.1 Epic Approach

**Epic Structure Decision**: **Multiple focused epics organized by production pipeline stage and research validation**

**Rationale**:
Given the scope of this enhancement (voice I/O, character identity, 3D worlds, audio production, analytics, community features), a single mega-epic would be unmanageable. Instead, we organize epics by:

1. **Research Phase** - Validate technical approaches before committing development resources
2. **Implementation Phase** - Deliver capabilities in release-aligned waves

This structure allows:
- **Parallel workstreams** - Voice team, audio team, community team can work concurrently
- **Research validation** - Technology decisions are data-driven, not assumption-driven
- **Incremental value delivery** - Each implementation epic delivers a complete workflow enhancement
- **Clear dependencies** - Research → Implementation → Integration flow

**Epic Organization**:
- **Research Epics (R1-R3b)**: Validate technical approaches, build PoCs, recommend solutions
- **Implementation Epics (1-7c)**: Deliver user-facing capabilities based on research outcomes
- **Integration Epic (8)**: Cross-feature testing and polish

---

### 5.2 Epic Dependencies

```
RESEARCH PHASE (can run in parallel)
├── Epic R1: Character Identity Research
├── Epic R2: 3D World Generation Research (note: review R1 findings for character rendering)
├── Epic R3a: Voice I/O Research
└── Epic R3b: Audio Production Research

V2.0 IMPLEMENTATION (depends on research)
├── Epic 1: Director Agent Voice Enhancement (depends on R3a)
├── Epic 2: Character Identity System (depends on R1)
└── Epic 5: Music, Sound & Audio Mixing (depends on R3b)

V2.1 IMPLEMENTATION
├── Epic 3: Explorable 3D Locations (depends on R2)
└── Epic 4: Voice & Dialogue Production (depends on R3a, R3b)

V2.2 IMPLEMENTATION
├── Epic 6: Project Quality Analytics
└── Epic 7a: Community Hub

V3 (DEFERRED)
├── Epic 7b: Asset Marketplace
└── Epic 7c: Alkemy Academy

INTEGRATION
└── Epic 8: Cross-Feature Integration Testing (runs after each release phase)
```

---

## 6. Epic Details

---

### **RESEARCH EPICS** (Technical Validation)

---

### **Epic R1: Character Identity Consistency Research**

**Epic Goal**: Evaluate and recommend the optimal technical approach for maintaining character visual identity across all generated shots.

**Success Metric**: Technology recommendation approved by stakeholders with complexity score <7/10 and implementation cost estimate <40 story points.

**Integration Requirements**: Solution must integrate with existing `CastLocationsTab` and `generateStillVariants()` workflow without breaking current character generation.

**Research Questions**:
1. How do LoRA training approaches compare in quality, speed, and cost?
2. Are there simpler alternatives (Flux Dev consistent character, IPAdapter, ReferenceNet, ComfyUI workflows)?
3. What is the end-to-end latency for character identity application?
4. Can real-actor motion transfer (Wan 2.2) integrate with the chosen solution?
5. What are the storage/bandwidth requirements for character models?

---

#### **Story R1.1: Character Identity Technology Landscape Analysis**

As a **technical researcher**,
I want to **survey all available character identity consistency technologies**,
so that **we can build a comprehensive decision matrix**.

**Acceptance Criteria**:
1. Document 5+ technologies with pros/cons (LoRA, Flux Dev, IPAdapter, ReferenceNet, ComfyUI workflows, Consistent Character API services)
2. Evaluate each on: visual consistency (%), training time, inference latency, API cost per generation, ease of integration
3. Identify showstoppers and dealbreakers for each approach (e.g., requires local GPU, incompatible with Vercel serverless)
4. Deliver written report with recommendation tiers:
   - **Tier 1**: Recommended (meets all requirements)
   - **Tier 2**: Viable with caveats (meets most requirements, has trade-offs)
   - **Tier 3**: Not Recommended (fails critical requirements)
5. Include cost projections for 1000 character generations/month

**Integration Verification**:
- **IV1**: Confirm each technology can accept reference images in formats already supported (JPEG, PNG, WebP)
- **IV2**: Validate API/SDK compatibility with existing Vercel serverless architecture
- **IV3**: Ensure no breaking changes to existing `Character` type in `types.ts`

---

#### **Story R1.2: Character Identity Proof-of-Concept Prototypes**

As a **technical researcher**,
I want to **build working prototypes of the top 3 technologies**,
so that **we can validate real-world performance**.

**Acceptance Criteria**:
1. Implement prototypes for top 3 candidates from R1.1
2. Test each with same reference character across 5 variations:
   - Close-up portrait (well-lit)
   - Wide shot full-body (outdoor lighting)
   - Profile view (side angle)
   - Low-light scene (dramatic lighting)
   - Action pose (dynamic movement)
3. Measure visual consistency scores:
   - CLIP similarity scores (>0.85 target)
   - FaceNet embeddings distance (<0.6 target)
   - Human evaluation (>90% "same character" recognition)
4. Measure end-to-end latency:
   - Training time (if applicable)
   - Inference time per generation
   - Total time from reference upload to first consistent shot
5. Document integration complexity:
   - Lines of code required
   - External dependencies added
   - API setup steps
6. Deliver side-by-side comparison gallery and performance spreadsheet

**Integration Verification**:
- **IV1**: Prototypes integrate with existing `generateStillVariants()` function signature
- **IV2**: Generated images follow existing blob URL → base64 persistence pattern
- **IV3**: No performance degradation to existing image generation workflows (baseline < 15% slowdown)

---

#### **Story R1.3: Character Identity Technology Recommendation**

As a **product team**,
I want **a final recommendation with implementation plan**,
so that **we can proceed confidently with character identity development**.

**Acceptance Criteria**:
1. Final recommendation document (5-10 pages) with:
   - Chosen technology and detailed justification
   - Performance benchmarks (speed, quality, cost)
   - Risk assessment and mitigation strategies
2. Implementation plan with:
   - Estimated effort (story points/time)
   - Required new dependencies and infrastructure
   - API key requirements
3. Cost projections:
   - Development cost (team hours)
   - Operational cost (API usage at 1k, 10k, 100k generations/month)
4. Fallback strategy if primary approach fails during implementation
5. Stakeholder sign-off obtained (product, engineering, design)

**Integration Verification**:
- **IV1**: Implementation plan explicitly addresses brownfield integration (no breaking changes to existing features)
- **IV2**: Migration path defined for existing projects to use character identity retroactively
- **IV3**: Backward compatibility confirmed (projects created before character identity still work)

---

### **Epic R2: 3D World Generation Research**

**Epic Goal**: Evaluate and recommend the optimal technical approach for creating explorable 3D location environments with camera position marking.

**Success Metric**: Technology recommendation with 60fps performance benchmark on target hardware and implementation cost <50 story points.

**Integration Requirements**: Solution must render in-browser with Three.js and export formats compatible with existing compositing workflow.

**Research Questions**:
1. Can the existing World Labs-inspired procedural service deliver production-quality environments?
2. Is Unreal Engine integration feasible for web deployment (Pixel Streaming, WebAssembly builds)?
3. Are Gaussian Splatting approaches mature enough for real-time interaction?
4. What are the performance trade-offs on target hardware (desktop, laptop, mobile)?
5. Can 3D environments integrate with character identity system for in-world character previews?

---

#### **Story R2.1: 3D World Technology Landscape Analysis**

As a **technical researcher**,
I want to **survey 3D world generation and rendering technologies**,
so that **we understand all viable options**.

**Acceptance Criteria**:
1. Document 5+ approaches:
   - Existing `proceduralWorldService.ts`
   - Unreal Engine Pixel Streaming
   - Unreal Engine WebAssembly builds
   - Gaussian Splatting (3DGS, Luma, etc.)
   - NeRF-based approaches
   - Matterport-style 3D capture
2. Evaluate on:
   - Visual quality (photorealism, lighting accuracy)
   - Interactivity (camera controls, object manipulation, physics)
   - Browser performance (FPS on target hardware, memory usage)
   - Export formats (GLTF, USD, FBX compatibility)
   - Generation speed (prompt → explorable environment)
3. Identify integration complexity for each approach
4. Deliver decision matrix report with recommendation tiers

**Integration Verification**:
- **IV1**: All approaches render via Three.js or compatible WebGL/WebGPU renderer
- **IV2**: Camera position data exports as JSON compatible with existing `Frame` type
- **IV3**: Lighting presets map to existing shot generation parameters (time of day, weather, studio setups)

---

#### **Story R2.2: 3D World Proof-of-Concept Prototypes**

As a **technical researcher**,
I want to **build interactive demos of the top 3 technologies**,
so that **we can validate user experience**.

**Acceptance Criteria**:
1. Create 3 working demos of same location (e.g., "Industrial Warehouse"):
   - Interior space with props and lighting
   - Doors, windows, architectural details
   - Realistic materials (metal, concrete, glass)
2. Implement for each prototype:
   - Camera WASD/mouse controls (or equivalent navigation)
   - Position marking UI (click to place A/B/C camera markers)
   - Lighting preset switcher (Golden Hour, Overcast, Neon, Studio)
3. Test lighting preset application:
   - Verify visual change is noticeable and accurate
   - Measure preset switch latency (<2s target)
4. Measure performance on target hardware:
   - Desktop with RTX 3060 or equivalent (>60fps target)
   - High-end laptop (M1 Max or equivalent) (>45fps target)
   - Mid-range laptop (>30fps target or graceful quality degradation)
5. Gather user feedback:
   - 5+ filmmakers test each prototype
   - Rate interaction quality (1-10 scale)
   - Identify usability issues
6. Deliver interactive demo links and performance spreadsheet

**Integration Verification**:
- **IV1**: Demos integrate with existing `3DWorldViewer` component pattern
- **IV2**: Position/lighting data persists in existing project state structure (no schema changes to `ScriptAnalysis` type)
- **IV3**: No breaking changes to existing 3D world tab functionality (legacy procedural worlds still work)

---

#### **Story R2.3: 3D World Technology Recommendation**

As a **product team**,
I want **a final recommendation with performance benchmarks**,
so that **we can commit to a 3D world solution**.

**Acceptance Criteria**:
1. Chosen technology with performance data:
   - FPS benchmarks on all target hardware tiers
   - Memory usage and load times
   - Visual quality examples (screenshots, videos)
2. Implementation roadmap with development phases:
   - Phase 1: Core navigation and rendering
   - Phase 2: Camera position marking
   - Phase 3: Lighting presets
   - Phase 4: Advanced features (props, physics, etc.)
3. Fallback strategy if primary approach fails:
   - Simplified fallback option (e.g., static 360° panorama with hotspot markers)
   - Criteria for triggering fallback
4. Cost analysis:
   - API costs (if applicable - e.g., Luma Gaussian Splatting)
   - Infrastructure requirements (server costs for Pixel Streaming, etc.)
   - Development cost estimate
5. Integration plan with character identity system (if R1 is complete)

**Integration Verification**:
- **IV1**: Recommendation addresses brownfield integration (existing projects can add 3D locations)
- **IV2**: Export formats validated with existing `generateStillVariants()` workflow (camera data → shot generation)
- **IV3**: Performance acceptable with all other features active (voice, audio, analytics)

---

### **Epic R3a: Voice I/O Research (Director Agent)**

**Epic Goal**: Evaluate and recommend technical approaches for voice input/output in the Director Agent widget to enable hands-free workflow.

**Success Metric**: Voice I/O solution with <2s latency and >90% film terminology accuracy, implementation cost <30 story points.

**Integration Requirements**: Solution must integrate with existing DirectorWidget chat interface without breaking text chat functionality.

**Research Questions**:
1. Web Speech API vs. dedicated voice services (Deepgram, AssemblyAI, Whisper) - which meets latency requirements?
2. How accurate is each solution for film terminology (camera models, lens focal lengths, lighting terms)?
3. What are the browser compatibility and API complexity trade-offs?
4. Which voice synthesis service provides the best quality/cost ratio for Director responses?
5. Can round-trip voice latency (command → processing → spoken response) meet <5s target?

---

#### **Story R3a.1: Voice I/O Technology Evaluation**

As a **technical researcher**,
I want to **compare voice recognition and synthesis technologies**,
so that **we select solutions meeting latency and quality requirements**.

**Acceptance Criteria**:
1. **Voice Recognition Evaluation** - Test the following for voice input:
   - Web Speech API (browser native)
   - Deepgram
   - AssemblyAI
   - OpenAI Whisper (via API)
2. Measure for each:
   - Latency (utterance end → transcription available)
   - Accuracy with film terminology:
     - Camera angles (close-up, wide shot, over-the-shoulder, etc.)
     - Lens focal lengths (24mm, 50mm, 85mm, etc.)
     - Character names from test script
     - Technical jargon (depth of field, key light, practical, etc.)
   - Browser compatibility (Chrome, Firefox, Safari, Edge)
   - API complexity (setup steps, SDK size)
3. **Voice Synthesis Evaluation** - Test the following for voice output:
   - Web Speech API (browser TTS)
   - ElevenLabs
   - PlayHT
   - Resemble AI
4. Measure for each:
   - Quality (naturalness, prosody, emotion)
   - Latency (text → audio playback start)
   - Voice customization (pitch, speed, voice selection)
5. **Round-Trip Latency Test**:
   - Measure end-to-end: spoken command → AI processing → spoken response
   - Test with realistic Director queries ("Generate 3 images of John in the warehouse")
   - Target: <5 seconds total
6. Document cost per minute for production usage (1000 queries/month)
7. Deliver comparison spreadsheet and audio samples

**Integration Verification**:
- **IV1**: Voice recognition integrates with existing DirectorWidget chat interface (transcription → `parseCommand()`)
- **IV2**: Voice synthesis works with existing `askTheDirector()` response flow (response text → audio playback)
- **IV3**: Voice controls are toggleable without breaking text chat (graceful degradation)

---

#### **Story R3a.2: Film Terminology Accuracy Testing**

As a **technical researcher**,
I want to **test voice recognition accuracy with real filmmaker commands**,
so that **we ensure the Director understands film language**.

**Acceptance Criteria**:
1. Create test dataset of 100 filmmaker commands:
   - 30 shot generation commands ("Generate a close-up of Sarah with 85mm lens")
   - 30 technical queries ("What's the hyperfocal distance for f/2.8 at 5 meters?")
   - 20 Director requests ("Suggest camera movement for a tense chase scene")
   - 20 character/location queries ("Show me all images of the warehouse location")
2. Test each command with top 3 voice recognition solutions from R3a.1
3. Measure accuracy:
   - Exact match (transcription 100% correct)
   - Actionable match (transcription accurate enough for command execution)
   - Failed match (transcription unusable)
4. Target: >90% actionable match rate
5. Identify problematic terms (e.g., "f/1.4" vs. "F 1.4" vs. "f one point four")
6. Document workarounds or custom vocabulary training needed
7. Deliver accuracy report and recommended solution

**Integration Verification**:
- **IV1**: Actionable commands execute correctly via existing `executeCommand()` logic
- **IV2**: Failed matches degrade gracefully (Director asks for clarification, not silent failure)
- **IV3**: Custom vocabulary (if needed) integrates without breaking existing text commands

---

#### **Story R3a.3: Voice I/O Technology Recommendation**

As a **product team**,
I want **final recommendations for voice I/O**,
so that **we can implement Director Agent voice enhancement**.

**Acceptance Criteria**:
1. Chosen voice recognition solution with:
   - Latency benchmarks (<2s target)
   - Accuracy report (>90% actionable match)
   - Cost analysis (development + operational)
2. Chosen voice synthesis solution with:
   - Quality samples (audio files)
   - Latency benchmarks
   - Voice customization options
3. Implementation plan:
   - Estimated effort (story points/time)
   - API key requirements
   - Browser compatibility notes
4. Fallback strategy:
   - Graceful degradation if voice service unavailable
   - Text-only mode always functional
5. UX recommendations:
   - Push-to-talk vs. always-listening
   - Visual feedback during listening/processing
   - Error handling for misrecognized commands

**Integration Verification**:
- **IV1**: Implementation plan addresses DirectorWidget integration (no separate voice component)
- **IV2**: Text chat remains primary interface, voice is optional enhancement
- **IV3**: Voice mode works across all tabs where DirectorWidget is active

---

### **Epic R3b: Audio Production Research (Music, Sound, Mixing)**

**Epic Goal**: Evaluate and recommend technical approaches for AI music composition, sound effects generation, and real-time audio mixing in the timeline.

**Success Metric**: Audio production solution with <30s music generation, professional mix quality, and implementation cost <40 story points.

**Integration Requirements**: Solutions must integrate with existing timeline architecture and FFmpeg.wasm rendering pipeline.

**Research Questions**:
1. Which AI music composition service supports emotion-based generation and stem export?
2. Are foley/SFX generation services mature enough for production use?
3. Can WebAudio API handle real-time multi-stem mixing (3+ tracks) in-browser?
4. How does audio mixing integrate with existing video rendering (FFmpeg.wasm)?
5. What are the storage/bandwidth requirements for audio assets?

---

#### **Story R3b.1: AI Music and Audio Services Evaluation**

As a **technical researcher**,
I want to **evaluate AI music composition and audio generation services**,
so that **we can deliver professional audio production capabilities**.

**Acceptance Criteria**:
1. **Music Composition Evaluation** - Test the following services:
   - Suno
   - Udio
   - Stable Audio
   - Soundful
   - AIVA
2. Measure for each:
   - **Emotion-based generation**:
     - Test prompts: "Happy upbeat", "Tense suspense", "Melancholic sadness", "Epic adventure"
     - Quality rating (1-10 scale, 5+ evaluators)
   - **Genre flexibility**:
     - Test: Orchestral, Electronic, Ambient, Rock, Jazz
     - Authenticity rating
   - **Stem export**:
     - Can it export separate instrument tracks (drums, bass, melody, etc.)?
     - Stem formats (WAV, MP3, FLAC)
   - **Generation speed**:
     - Time from prompt to playable audio
     - Target: <30 seconds for 1-minute track
   - **Cost**: Per-generation pricing, subscription tiers
3. **Foley/SFX Evaluation** - Test the following:
   - AudioStack
   - ElevenLabs Sound Effects
   - Stable Audio (SFX mode)
   - Manual foley libraries (freesound.org, etc.)
4. Measure quality, speed, cost, and variety (footsteps, door sounds, ambient noise, etc.)
5. Deliver comparison spreadsheet and audio samples

**Integration Verification**:
- **IV1**: Generated audio integrates with existing timeline clip data model (`TimelineClip` type)
- **IV2**: Audio files can be stored in Supabase Storage or blob URLs (follow existing pattern)
- **IV3**: Music generation does not block UI (async with progress callbacks)

---

#### **Story R3b.2: WebAudio API Multi-Stem Mixing Prototype**

As a **technical researcher**,
I want to **prototype real-time audio mixing in the browser**,
so that **we validate WebAudio API feasibility for timeline mixing**.

**Acceptance Criteria**:
1. Build working prototype with WebAudio API:
   - Load 3+ audio tracks (dialogue, music, effects)
   - Independent volume controls (0-100% sliders)
   - Real-time playback with mixing (all tracks audible simultaneously)
   - Waveform visualization for each track
2. Test performance:
   - Measure playback latency (target: <100ms)
   - Test with projects up to 30 minutes duration
   - Monitor memory usage and CPU load
3. Implement timeline sync:
   - Audio playback synchronized with video timeline position
   - Seek/scrub support (jump to arbitrary timestamp)
4. Test browser compatibility (Chrome, Firefox, Safari, Edge)
5. Identify limitations:
   - Maximum number of simultaneous tracks
   - File format restrictions
   - Browser-specific issues
6. Deliver interactive demo and technical report

**Integration Verification**:
- **IV1**: Audio mixing works with existing FFmpeg.wasm for final render (WebAudio for preview, FFmpeg for export)
- **IV2**: Timeline clips maintain existing video data, audio is additive enhancement
- **IV3**: No breaking changes to existing timeline playback (video-only projects still work)

---

#### **Story R3b.3: Voice and Audio Technology Recommendations**

As a **product team**,
I want **final recommendations for audio production services**,
so that **we can implement the audio production pipeline**.

**Acceptance Criteria**:
1. Chosen music composition service with:
   - Cost analysis (per-generation, subscription)
   - Quality samples (5+ genres, 5+ emotions)
   - Stem export capability confirmation
2. Chosen foley/SFX solution with:
   - Library size and variety
   - Generation vs. library approach recommendation
3. Audio mixing architecture design:
   - WebAudio API for real-time preview
   - FFmpeg.wasm for final render with mixed audio
   - State management for audio stems (dialogue, music, effects)
4. Storage strategy:
   - Supabase Storage for generated audio (when configured)
   - Blob URL fallback for localStorage-only mode
   - Cleanup strategy for temporary audio (prevent quota issues)
5. Implementation plan:
   - Estimated effort (story points/time)
   - API key requirements
   - New dependencies (audio processing libraries)

**Integration Verification**:
- **IV1**: Audio services integrate via serverless proxy pattern (`/api/music-proxy`)
- **IV2**: Timeline audio mixing preserves existing video rendering workflow
- **IV3**: Backward compatibility (projects without audio still render correctly)

---

### **IMPLEMENTATION EPICS** (Capability Delivery)

---

### **Epic 1: Director Agent Voice Enhancement**

**Epic Goal**: Enhance the existing DirectorWidget with voice input/output capabilities, continuity checking, and style learning to enable hands-free filmmaking workflow.

**Success Metric**: Director Agent supports voice commands with <2s latency, >90% accuracy, and filmmakers rate voice mode >8/10 in usability testing.

**Dependencies**: Epic R3a (Voice I/O Research) must be completed first.

**Integration Requirements**: Extend existing DirectorWidget without breaking text chat functionality. Voice mode is optional and toggleable.

---

#### **Story 1.1: Voice Input Integration**

As a **filmmaker**,
I want to **speak commands to the Director Agent**,
so that **I can work hands-free while composing shots**.

**Acceptance Criteria**:
1. DirectorWidget displays microphone button in chat input area
2. Microphone button visual states:
   - Idle (gray icon)
   - Listening (pulsing red icon with waveform animation)
   - Processing (spinning loader)
   - Error (error icon with tooltip)
3. Voice input workflow:
   - User clicks microphone button (or keyboard shortcut)
   - Voice recognition starts (visual feedback)
   - User speaks command
   - Transcription appears in chat input field (editable before submission)
   - User submits (Enter key or "Send" button)
4. Film terminology recognition accuracy >90% (measured with test dataset from R3a.2)
5. Voice mode settings:
   - Push-to-talk (default)
   - Always-listening (experimental, privacy warning)
   - Text-only (disable voice)
6. Voice input works across all tabs where DirectorWidget is active
7. Error handling:
   - Microphone permission denied → clear error message with instructions
   - Network error → graceful fallback to text input
   - Recognition timeout → "I didn't catch that, please try again"

**Integration Verification**:
- **IV1**: Existing text chat functionality remains unchanged (voice is additive, not replacement)
- **IV2**: Voice commands trigger same `parseCommand()` and `executeCommand()` logic as text commands
- **IV3**: No performance degradation when voice is disabled (zero overhead for non-voice users)
- **IV4**: Voice input state persists across tab switches (user preference saved to localStorage)

**Migration/Compatibility**:
- **MC1**: Existing projects work without voice (no data migration required)
- **MC2**: Users without microphone access can still use all features (text chat always available)

---

#### **Story 1.2: Voice Output and Spoken Responses**

As a **filmmaker**,
I want **the Director Agent to speak responses**,
so that **I can receive guidance without looking at the screen**.

**Acceptance Criteria**:
1. Director responses synthesize to speech when voice output is enabled
2. Voice output settings:
   - Enabled/Disabled toggle (separate from voice input)
   - Voice selection (if supported by chosen service from R3a)
   - Speech rate control (0.5x - 2.0x)
3. Voice output workflow:
   - Director generates text response (existing `askTheDirector()` flow)
   - Text displays in chat (always, regardless of voice setting)
   - If voice output enabled: Text synthesizes to speech and plays
4. Playback controls:
   - Pause/resume button for current response
   - Stop button (interrupt and clear queue)
   - Auto-interrupt on new command (user speaks, playback stops)
5. Visual feedback during playback:
   - Speaking indicator on Director avatar/widget
   - Progress bar showing playback position
6. Audio queue management:
   - Only one response plays at a time
   - Queued responses are discarded when new command is issued
7. Error handling:
   - Voice synthesis fails → text remains visible, silent fallback
   - Audio playback blocked by browser → prompt user to enable audio

**Integration Verification**:
- **IV1**: Voice output does not block UI interactions (user can navigate tabs, issue new commands)
- **IV2**: Chat history displays text even when spoken (accessibility, searchability)
- **IV3**: Voice playback errors degrade gracefully to text-only mode (no crash, clear error message)

**Migration/Compatibility**:
- **MC1**: Voice output is opt-in (default: disabled, text-only)
- **MC2**: Users can mix voice input + text output or vice versa (independent toggles)

---

#### **Story 1.3: Style Learning and Personalization**

As a **filmmaker**,
I want **the Director to learn my creative preferences**,
so that **suggestions improve over time and match my style**.

**Acceptance Criteria**:
1. Director tracks filmmaker's creative patterns:
   - Shot type frequency (close-ups, wide shots, etc.)
   - Lens choices (preferred focal lengths)
   - Lighting patterns (low-key, high-key, natural, etc.)
   - Color grade preferences (warm, cool, desaturated, etc.)
2. Style profile data storage:
   - Supabase: `user_style_profiles` table (when configured)
   - localStorage: `alkemy_director_style_profile` key (fallback)
3. Style-adapted suggestions:
   - Director mentions patterns: "You typically use 50mm for close-ups in this project"
   - Director suggests shortcuts: "Based on your style, I recommend warm lighting for this romantic scene"
   - Director highlights deviations: "This is your first wide shot in this scene - intentional?"
4. Style learning indicator:
   - Badge in DirectorWidget header: "Learning your style: 12 projects analyzed"
   - Tooltip explains what data is tracked
5. Style profile management:
   - View style profile (modal with stats and patterns)
   - Reset style profile (clear all learned data)
   - Export style profile (JSON download)
6. Privacy controls:
   - Style learning is opt-in (prompt on first use)
   - Clear explanation of what data is collected
   - Local-only option (no cloud sync)

**Integration Verification**:
- **IV1**: Style tracking does not impact existing command execution performance (<50ms overhead per command)
- **IV2**: New style data integrates with existing project state serialization (no breaking changes to `.alkemy.json` format)
- **IV3**: Style learning is optional and can be disabled (graceful degradation to generic suggestions)

**Migration/Compatibility**:
- **MC1**: Existing projects gain style tracking automatically when feature is enabled (retroactive analysis of project history)
- **MC2**: Users can opt out of style learning without losing other Director features

---

#### **Story 1.4: Continuity Checking and Feedback**

As a **filmmaker**,
I want **the Director to identify continuity errors in my timeline**,
so that **I can fix issues before final render**.

**Acceptance Criteria**:
1. Continuity analysis capabilities:
   - **Lighting jumps**: Detect significant lighting changes between adjacent shots in same scene
   - **Costume changes**: Detect character appearance inconsistencies (color, style)
   - **Spatial mismatches**: Detect screen direction violations, impossible geography
2. Continuity check triggers:
   - Automatic: Before export (pre-render validation)
   - Manual: Director command "Check continuity" or "Analyze timeline"
   - Automatic: After adding/moving clips in timeline (debounced, non-blocking)
3. Continuity warnings in Director chat:
   - Inline suggestions: "Possible lighting jump between Shot 12 and Shot 13 - Scene 4"
   - Severity indicators: 🔴 Critical, 🟡 Warning, 🔵 Info
   - Explanation: Brief description of detected issue
4. Correction options:
   - Director suggests fixes: "Regenerate Shot 12 with Scene 10 lighting settings?"
   - One-click actions: "Fix lighting", "Regenerate shot", "Ignore warning"
   - Manual override: Dismiss warning (track dismissed warnings)
5. Continuity report:
   - Summary view: "3 continuity issues detected"
   - Detailed list with timestamps and thumbnails
   - Export report as PDF (for review)
6. Visual indicators in timeline:
   - Warning badges on clips with continuity issues
   - Hover tooltip shows issue description

**Integration Verification**:
- **IV1**: Continuity analysis uses existing timeline clip data (no schema changes to `TimelineClip` type)
- **IV2**: Suggestions integrate with existing command execution workflow (Director can trigger regenerations)
- **IV3**: Continuity checks do not block timeline editing (async analysis with progress indicator)

**Migration/Compatibility**:
- **MC1**: Existing projects can run continuity checks (no preparation required)
- **MC2**: Continuity warnings are non-blocking (filmmaker can ignore and export anyway)

---

### **Epic 2: Character Identity Consistency System**

**Epic Goal**: Implement the character identity solution validated in Epic R1, ensuring characters appear visually identical across all generated shots.

**Success Metric**: Character identity achieves >95% visual similarity (CLIP/FaceNet) and filmmakers rate consistency >9/10 in blind tests.

**Dependencies**: Epic R1 (Character Identity Research) must be completed first.

**Integration Requirements**: Integrate with existing `CastLocationsTab` and `generateStillVariants()` workflow without breaking current character generation.

**Note**: Story details will be finalized after Epic R1 research outcomes. The structure below is a template pending technology selection.

---

#### **Story 2.1: Character Identity Training/Preparation Workflow**

As a **filmmaker**,
I want to **prepare character references for identity consistency**,
so that **the system can generate identical-looking characters across all shots**.

**Acceptance Criteria** (Template - adjust based on R1 technology choice):
1. Character reference upload interface in `CastLocationsTab`:
   - Upload 3-5 reference images per character (different angles, expressions)
   - Preview reference images with crop/adjust tools
   - Reference image quality validation (resolution, clarity checks)
2. [If LoRA/training-based approach]:
   - Training progress indicator with ETA
   - Training status: Queued → Training → Completed → Ready
   - Training results preview (test variations)
3. [If reference-based approach (Flux Dev, IPAdapter)]:
   - Reference image preprocessing (automatic or manual)
   - Reference strength slider (how closely to match reference)
4. Character identity status indicator:
   - 🔴 No identity (standard generation, no consistency)
   - 🟡 Preparing identity (training/processing in progress)
   - 🟢 Identity ready (can generate consistent shots)
5. Error handling:
   - Low-quality reference images → warning with suggestions
   - Training/processing failures → clear error message with retry option

**Integration Verification**:
- **IV1**: Character reference upload uses existing file upload patterns (drag-drop, file picker)
- **IV2**: Character identity data stores in `Character` type (extend existing interface, no breaking changes)
- **IV3**: Training/processing progress uses existing progress callback pattern

---

#### **Story 2.2: Character Identity Preview and Testing**

As a **filmmaker**,
I want to **test character appearance variations before committing to production**,
so that **I can ensure quality meets expectations**.

**Acceptance Criteria** (Template):
1. Character identity test panel in `CastLocationsTab`:
   - "Test Identity" button (enabled when identity is ready)
   - Test variations:
     - Close-up portrait
     - Wide shot full-body
     - Profile view
     - Different lighting (bright, low-key, dramatic)
     - Different expressions (happy, sad, neutral, surprised)
2. Test generation workflow:
   - Select test variation type
   - Generate preview (uses character identity system)
   - Display result with similarity score (% match to reference)
3. Comparison view:
   - Side-by-side: Reference image vs. Generated test
   - Similarity metrics displayed (CLIP score, visual assessment)
4. Approval workflow:
   - Approve identity (mark as production-ready)
   - Reject identity (regenerate/retrain with different settings)
   - Adjust settings (if technology supports tuning)
5. Test history:
   - Save test results for comparison
   - Track improvements across iterations

**Integration Verification**:
- **IV1**: Test generation uses existing `generateStillVariants()` with identity parameters
- **IV2**: Test results display in existing image carousel/grid components
- **IV3**: Approval status stores in character data (persist across sessions)

---

#### **Story 2.3: Character Identity Integration with Shot Generation**

As a **filmmaker**,
I want **character identity automatically applied to all shot generations**,
so that **I don't manually manage consistency across hundreds of shots**.

**Acceptance Criteria** (Template):
1. Shot generation with character identity:
   - When generating shots in `SceneAssemblerTab`, character identity applies automatically
   - Visual indicator shows identity is active ("✓ Character identity: John")
   - Identity strength/fidelity controls (if supported by technology)
2. Multi-character shots:
   - Support 2+ characters with identities in same shot
   - Each character maintains their identity independently
3. Identity override:
   - Option to disable identity for specific shots (e.g., silhouette, extreme distance)
   - Temporary identity disable (keeps character data, just doesn't apply)
4. Performance optimization:
   - Identity application does not increase generation time >15% (NFR4)
   - Batch generation with identity works (multiple shots, queue processing)
5. Error handling:
   - Identity application fails → fallback to standard generation with warning
   - Character identity data missing → clear error message

**Integration Verification**:
- **IV1**: Identity integration preserves existing `generateStillVariants()` function signature (backward compatible)
- **IV2**: Shots with identity use existing blob URL → base64 persistence pattern (no storage format changes)
- **IV3**: Projects without character identity still generate shots normally (graceful degradation)

**Migration/Compatibility**:
- **MC1**: Existing projects can add character identities retroactively (upload references for existing characters)
- **MC2**: Projects created before character identity feature still load and function (no data migration required)
- **MC3**: Character generations without identity still work (feature is optional enhancement)

---

### **Epic 3: Explorable 3D Location Environments**

**Epic Goal**: Implement the 3D world solution validated in Epic R2, allowing filmmakers to explore locations in 3D space and mark camera positions.

**Success Metric**: 3D environments achieve 60fps on target hardware and filmmakers rate navigation experience >8/10.

**Dependencies**: Epic R2 (3D World Research) must be completed first.

**Integration Requirements**: Render in-browser with Three.js, export camera data compatible with existing shot generation workflow.

**Note**: Story details will be finalized after Epic R2 research outcomes. The structure below is a template pending technology selection.

---

*(Template stories - details TBD based on R2 outcomes)*

#### **Story 3.1: 3D Location Generation and Loading**
*(Generate/load 3D environments from text or image prompts)*

#### **Story 3.2: 3D Navigation and Camera Controls**
*(WASD + mouse controls, smooth camera movement, collision detection)*

#### **Story 3.3: Camera Position Marking System**
*(Mark A/B/C positions, save camera POV data, export to shot generation)*

#### **Story 3.4: Lighting Preset System**
*(Golden Hour, Overcast, Neon, Studio presets with real-time application)*

#### **Story 3.5: Location Assets and Reusability**
*(Save locations as reusable assets, cross-project sharing)*

---

### **Epic 4: Voice & Dialogue Production**

**Epic Goal**: Deliver complete voice and dialogue capabilities - character voice selection, multilingual synthesis, and timeline integration.

**Success Metric**: Voice synthesis quality rated >8/10 (indistinguishable from professional voice actors), multilingual lip-sync achieves >90% accuracy.

**Dependencies**: Epic R3a (Voice I/O Research) and Epic R3b (Audio Production Research) must be completed first.

**Integration Requirements**: Voice audio integrates with timeline clips, supports multi-language export.

---

*(Template stories - details TBD based on R3a/R3b outcomes)*

#### **Story 4.1: Character Voice Selection and Casting**
*(Browse voice library, preview voices, assign to characters)*

#### **Story 4.2: Dialogue Generation from Script**
*(Auto-generate dialogue audio from script text, emotion/performance controls)*

#### **Story 4.3: Multilingual Voice Synthesis**
*(Translate project to any language, lip-sync generation, voice consistency across languages)*

#### **Story 4.4: Dialogue Timeline Integration**
*(Dialogue audio on timeline, sync with video clips, waveform editing)*

---

### **Epic 5: Music, Sound & Audio Mixing**

**Epic Goal**: Implement AI music composition, foley generation, and real-time timeline audio mixing.

**Success Metric**: Music generation <30s, audio mixing supports real-time playback, filmmakers rate audio quality >8/10.

**Dependencies**: Epic R3b (Audio Production Research) must be completed first.

**Integration Requirements**: Audio mixing works with existing timeline, integrates with FFmpeg.wasm for final render.

---

*(Template stories - details TBD based on R3b outcomes)*

#### **Story 5.1: AI Music Composition**
*(Emotion-based music generation, genre controls, stem export)*

#### **Story 5.2: Sound Effects and Foley Generation**
*(Ambient sound, footsteps, environmental audio, SFX library)*

#### **Story 5.3: Timeline Audio Mixing**
*(Multi-stem mixing UI, waveform visualization, level controls, real-time playback)*

#### **Story 5.4: Audio Export and Rendering**
*(Mix audio with FFmpeg.wasm, multi-format export, alternate language mixes)*

---

### **Epic 6: Project Quality Analytics & Feedback**

**Epic Goal**: Provide filmmakers with AI-powered creative feedback and technical performance analytics.

**Success Metric**: Analytics reports generate in <5s, filmmakers find >80% of suggestions actionable.

**Integration Requirements**: Analytics leverage existing project data, Supabase usage tracking for technical metrics.

---

*(Template stories)*

#### **Story 6.1: Creative Quality Analysis**
*(Look Bible adherence, color consistency, lighting coherence scoring)*

#### **Story 6.2: Technical Performance Analytics**
*(Render times, API costs, error rates, efficiency metrics)*

#### **Story 6.3: Analytics Dashboard and Reports**
*(Visual analytics UI, exportable PDF reports, trend tracking)*

#### **Story 6.4: Director Agent Analytics Integration**
*(Director summarizes quality, suggests improvements, actionable feedback)*

---

### **Epic 7a: Community Hub (Social & Gallery)**

**Epic Goal**: Launch community features - gallery for sharing films, competitions, and creator profiles.

**Success Metric**: Community Hub supports 100,000+ concurrent users, >10% of users upload films in first month.

**Integration Requirements**: Uses existing Supabase authentication, project persistence.

---

*(Template stories)*

#### **Story 7a.1: Film Gallery and Browse**
*(Upload films, browse gallery, search/filter, view counts)*

#### **Story 7a.2: Creator Profiles and Portfolios**
*(Profile creation, portfolio management, follow system)*

#### **Story 7a.3: Monthly Competitions**
*(Competition system, voting, categories, winners)*

#### **Story 7a.4: Community Tutorials and Highlights**
*(Tutorial library, community news, featured work)*

---

### **Epic 7b: Asset Marketplace** (V3 - Deferred)

**Epic Goal**: Enable buying/selling creative assets (Look Bibles, LUTs, sound packs).

*(Deferred to V3 - not part of V2 scope)*

---

### **Epic 7c: Alkemy Academy** (V3 - Deferred)

**Epic Goal**: Launch educational content platform with professional courses.

*(Deferred to V3 - not part of V2 scope)*

---

### **Epic 8: Cross-Feature Integration Testing**

**Epic Goal**: Validate that all new features work together seamlessly and meet performance/quality targets when used in combination.

**Success Metric**: End-to-end workflow (script → voice commands → character identity → 3D locations → audio production → export) completes successfully with >90% user satisfaction.

**Integration Requirements**: Tests run after each release phase (V2.0, V2.1, V2.2) to validate cross-feature compatibility.

---

#### **Story 8.1: V2.0 Integration Testing**

As a **QA engineer**,
I want to **test Director voice + character identity + audio mixing together**,
so that **we ensure V2.0 features work seamlessly in combination**.

**Acceptance Criteria**:
1. End-to-end workflow test:
   - Start new project via voice command
   - Upload script via voice command
   - Create character with identity via voice command
   - Generate shots with character identity via voice command
   - Add music and mix audio via voice command
   - Export final film via voice command
2. Performance validation:
   - Workflow completes without errors
   - Performance targets met (latency, FPS, generation times)
   - No memory leaks or resource exhaustion
3. Cross-feature compatibility:
   - Character identity works with voice-generated prompts
   - Audio mixing works with video clips generated using character identity
   - Director Agent continuity checks work with all new features
4. Error recovery:
   - Test failure scenarios (voice recognition fails, character identity fails, audio fails)
   - Validate graceful degradation (user can complete workflow via alternative methods)
5. Browser compatibility:
   - Test on Chrome, Firefox, Safari, Edge (latest versions)
   - Identify and document browser-specific issues
6. User acceptance testing:
   - 5+ filmmakers complete end-to-end workflow
   - Collect feedback and satisfaction scores
   - Identify usability issues and pain points

**Integration Verification**:
- **IV1**: All features work together without conflicts (no broken interactions)
- **IV2**: Performance remains acceptable with all features active (no >20% degradation vs. single-feature use)
- **IV3**: Existing features (script analysis, timeline, export) still work correctly (regression testing)

---

#### **Story 8.2: V2.1 Integration Testing**
*(Test 3D worlds + voice/dialogue with V2.0 features)*

#### **Story 8.3: V2.2 Integration Testing**
*(Test analytics + community with all previous features)*

---

## 6. Release Roadmap

### V2.0 Release: Core Production Features

**Target Date**: Q1 2025 (TBD after research epics complete)

**Included Epics**:
- Epic 1: Director Agent Voice Enhancement
- Epic 2: Character Identity Consistency System
- Epic 5: Music, Sound & Audio Mixing
- Epic 8.1: V2.0 Integration Testing

**Key Capabilities Delivered**:
- Voice-controlled filmmaking workflow (hands-free operation)
- Character visual consistency across all shots
- Professional audio production (music, sound, mixing)
- Enhanced Director Agent (voice I/O, style learning, continuity checking)

**Success Criteria**:
- Voice command latency <2s, >90% accuracy
- Character identity >95% visual similarity
- Music generation <30s, professional quality
- End-to-end workflow (script → voice → character → audio → export) completes successfully

---

### V2.1 Release: Immersive Features

**Target Date**: Q2 2025 (TBD)

**Included Epics**:
- Epic 3: Explorable 3D Location Environments
- Epic 4: Voice & Dialogue Production
- Epic 8.2: V2.1 Integration Testing

**Key Capabilities Delivered**:
- Navigable 3D location environments with camera marking
- Character voice casting and dialogue generation
- Multilingual voice synthesis with lip-sync

**Success Criteria**:
- 3D navigation 60fps on target hardware
- Voice synthesis quality >8/10 rating
- Multilingual lip-sync >90% accuracy

---

### V2.2 Release: Growth Features

**Target Date**: Q3 2025 (TBD)

**Included Epics**:
- Epic 6: Project Quality Analytics & Feedback
- Epic 7a: Community Hub (Social & Gallery)
- Epic 8.3: V2.2 Integration Testing

**Key Capabilities Delivered**:
- AI-powered creative feedback and analytics
- Community gallery and competitions
- Creator profiles and portfolios

**Success Criteria**:
- Analytics reports <5s generation
- Community Hub supports 100k concurrent users
- >10% user upload rate in first month

---

### V3+ (Future Roadmap)

**Target Date**: 2026+

**Deferred Features**:
- Epic 7b: Asset Marketplace (payment processing, licensing, revenue sharing)
- Epic 7c: Alkemy Academy (educational courses, certifications)
- Epic 9: Product & Business Analytics (user behavior, conversion, retention)
- Future Innovations: Real-time studio, AR/VR collaboration, emotion layering

---

## 7. Success Metrics

### Epic-Level Success Metrics

| Epic | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| R1: Character Identity Research | Technology recommendation approved | Complexity <7/10, Cost <40 SP | Stakeholder approval + scorecard |
| R2: 3D World Research | Performance benchmark met | 60fps on target hardware | FPS measurement in prototypes |
| R3a: Voice I/O Research | Latency + accuracy targets | <2s latency, >90% accuracy | Test dataset evaluation |
| R3b: Audio Research | Generation speed + quality | Music <30s, quality >8/10 | Timed tests + blind rating |
| Epic 1: Director Voice | Voice mode usability | >8/10 user rating | User acceptance testing |
| Epic 2: Character Identity | Visual similarity | >95% CLIP/FaceNet score | Automated similarity testing |
| Epic 3: 3D Locations | Navigation experience | >8/10 user rating, 60fps | UAT + performance monitoring |
| Epic 4: Voice/Dialogue | Synthesis quality | >8/10 rating, >90% lip-sync accuracy | Blind tests + technical validation |
| Epic 5: Audio Mixing | Real-time playback | <5s analytics generation | Playback latency measurement |
| Epic 6: Analytics | Report speed + usefulness | <5s generation, >80% actionable | Performance testing + feedback surveys |
| Epic 7a: Community Hub | User engagement | 100k concurrent users, >10% upload rate | Server metrics + analytics |
| Epic 8: Integration | End-to-end success | >90% user satisfaction | UAT with complete workflow |

---

### Release-Level Success Metrics

**V2.0 Success Criteria**:
- 100% of V2.0 epics complete (1, 2, 5, 8.1)
- Voice-to-export workflow success rate >95% (no critical bugs)
- Performance targets met (voice <2s, character >95%, music <30s)
- User satisfaction >8/10 (survey after 1 month)

**V2.1 Success Criteria**:
- 100% of V2.1 epics complete (3, 4, 8.2)
- 3D worlds + voice/dialogue integration validated
- Performance targets met (3D 60fps, voice quality >8/10)
- User retention >80% from V2.0 to V2.1

**V2.2 Success Criteria**:
- 100% of V2.2 epics complete (6, 7a, 8.3)
- Community Hub launches with >10% user upload rate
- Analytics adoption >50% (users view analytics reports)
- Platform ready for V3 monetization features (marketplace)

---

### Product-Level Success Metrics (V2 Overall)

**User Outcomes**:
- Filmmakers can create complete films (script → export) without leaving Alkemy
- Manual intervention rate <10% (most tasks automated or AI-assisted)
- Project completion rate >60% (projects that start reach export)

**Technical Performance**:
- System uptime >99.5%
- Average generation time per shot <2 minutes (image + video + upscaling)
- API cost per project <$5 (target for sustainability)

**Business Outcomes** (if applicable):
- User retention (30-day) >50%
- User growth month-over-month >10%
- Community engagement (forum posts, uploads, comments) >1000/week

---

## Appendices

### A. Glossary

- **Look Bible**: Project-specific visual identity (color palette, lighting style, contrast) derived from moodboard references
- **Character Identity**: System ensuring characters appear visually identical across all generated shots
- **Director Agent**: AI-powered cinematography assistant (DirectorWidget) providing creative guidance and task execution
- **3D Location Environment**: Navigable 3D space representing a film location, with camera marking and lighting preview
- **Stem**: Individual audio track (e.g., drums, bass, melody) that can be mixed independently
- **Timeline Clip**: Video or audio segment in the editing timeline
- **Continuity Error**: Visual inconsistency between shots in the same scene (lighting, costume, spatial mismatch)

### B. Technology Selection Criteria

**Character Identity (Epic R1)**:
- Visual consistency score (CLIP/FaceNet similarity)
- Training time (if applicable)
- Inference latency
- API cost per generation
- Integration complexity (lines of code, dependencies)
- Browser compatibility

**3D Worlds (Epic R2)**:
- Visual quality (photorealism, lighting accuracy)
- Performance (FPS on target hardware)
- Interactivity (camera controls, navigation smoothness)
- Export formats (GLTF, USD compatibility)
- Generation speed (prompt → explorable environment)

**Voice I/O (Epic R3a)**:
- Latency (utterance → transcription, text → audio)
- Accuracy (film terminology recognition)
- Quality (naturalness, prosody)
- Browser compatibility
- Cost per minute

**Audio Production (Epic R3b)**:
- Music quality (emotion accuracy, genre authenticity)
- Generation speed (<30s target)
- Stem export capability
- WebAudio API compatibility for real-time mixing

### C. Open Questions

*(To be resolved during research epics or early implementation)*

1. **Storage Strategy**: Should audio/video assets store in Supabase or temporary blob URLs by default?
2. **Tier System**: Do we implement usage tiers (Free, Pro, Enterprise) in V2, or defer to V3?
3. **Offline Mode**: Should core features work offline (PWA with service worker), or require network?
4. **Mobile Support**: Do we support mobile browsers in V2, or desktop-only?
5. **API Key Management**: Self-service key management UI, or admin-only configuration?

### D. Research Epic Deliverables

Each research epic (R1, R2, R3a, R3b) will deliver:
1. **Technology Comparison Report** (spreadsheet + written summary)
2. **Proof-of-Concept Prototypes** (interactive demos)
3. **Final Recommendation Document** (5-10 pages with implementation plan)
4. **Cost Analysis** (development + operational costs)
5. **Risk Assessment** (technical risks + mitigation strategies)

---

**END OF DOCUMENT**

---

*This PRD is a living document. Updates will be tracked in the Change Log (Section 1.6).*
