# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alkemy AI Studio V2.0 Alpha is a production-ready AI-powered film generation platform that transforms scripts into complete visual productions. The application uses React 19, TypeScript, and integrates with Google Gemini AI, Fal.ai Flux models, and Supabase for authentication and data persistence.

**Production URL**: https://alkemy1-eg7kssml0-qualiasolutionscy.vercel.app (latest deployment)

## Development Commands

### Essential Commands
```bash
# Development
npm run dev              # Start dev server on port 3000 with hot reload
npm run build            # Production build (optimizes with Terser, code splitting)
npm run preview          # Preview production build locally

# Testing
npm test                 # Run unit tests with Vitest
npm run test:ui          # Interactive test UI with Vitest
npm run test:coverage    # Generate coverage reports (HTML, JSON, text)

# Single test execution
npm test -- CharacterIdentityService.test.ts    # Run specific test file
npm test -t "should train LoRA model"           # Run tests matching pattern
```

### Deployment
```bash
# Deploy to Vercel production
vercel --prod

# View production logs
vercel logs https://alkemy1-i4q9n2e8r-qualiasolutionscy.vercel.app

# Pull environment variables from Vercel
vercel env pull .env.vercel.production --environment=production
```

## Architecture Overview

### Core Application Structure

The application follows a **tab-based workflow** architecture with distinct production phases:

1. **Pre-Production**: Script analysis, moodboard creation, character/location management
2. **Production**: 3D world generation, scene assembly, compositing
3. **Post-Production**: Timeline editing, exports, analytics

**Key architectural patterns**:
- **State Management**: Centralized project state in `App.tsx` with React hooks for UI preferences
- **Service Layer**: All AI/API interactions isolated in `/services` directory
- **Component Hierarchy**: Smart containers in `/tabs`, presentational components in `/components`
- **Type Safety**: Comprehensive TypeScript types in `types.ts` (478 lines covering entire domain model)

### Critical Services Architecture

#### AI Service (`services/aiService.ts`)
**Purpose**: Unified interface for all AI generation (images, videos, script analysis)

**Key patterns**:
- **Model Fallback Chain**: Attempts multiple Gemini models (`gemini-2.5-pro` → `gemini-2.5-flash-002` → fallback)
- **Safety Filter Bypass**: Automatically retries with Flux API if Gemini blocks for content safety
- **Supabase Integration**: Uploads all generated media to Supabase Storage with metadata tracking
- **Progress Callbacks**: Real-time progress updates for long-running operations

**Critical functions**:
- `analyzeScript()`: Parses screenplay into structured JSON (scenes, characters, locations, frames)
- `generateStillVariants()`: Generates N image variants with reference images and character identity LoRAs
- `animateFrame()`: Uses Veo 3.1 to animate still images with motion prompts
- `askTheDirector()`: AI cinematography assistant with technical knowledge base

**Model routing logic**:
- **Imagen 4.0**: Text-to-image generation (no reference images)
- **Gemini Flash Image**: Image editing/refinement with reference images (multimodal)
- **Flux Pro/Dev**: High-quality photorealistic generation via Fal.ai API
- **Veo 3.1**: Video animation from still images

#### Character Identity Service (`services/characterIdentityService.ts`)
**Purpose**: LoRA-based character consistency system (Epic 2)

**Architecture**:
- Trains custom Flux LoRA models using Fal.ai API
- Achieves 90-98% visual similarity across generations
- Stores LoRA weights URLs in character identity metadata
- Integrates with `generateStillVariants()` for automatic character injection
- Full UI integration with Train Character button, status badges, and visual feedback

**Critical flow**:
1. Upload 6-12 reference images via CharacterIdentityModal
2. Train Flux LoRA model (5-10 minutes) with progress tracking
3. Store `loraUrl` in `character.identity.technologyData.falCharacterId`
4. Pass LoRA parameters to all subsequent image generations
5. Visual status indicators: "Identity" (ready), "Training" (preparing), "Error" (failed), "No ID" (none)

**Important callback**: `onPrepareIdentity` callback must be wired from CastLocationsTab → CastLocationGenerator to sync identity state during generation (fixed in commit 5d23fca)

#### Supabase Integration (`services/supabase.ts`)
**Purpose**: Authentication, project persistence, media storage

**Database schema**:
- `projects`: User projects with script_content, script_analysis JSON, timeline_clips
- `user_preferences`: UI state, active tab, sidebar expansion per user
- `media_assets`: Uploaded images/videos with metadata, linked to projects
- `usage_logs`: AI usage tracking for analytics (token counts, costs, performance)

**RLS Security**: Row-Level Security policies ensure users only access their own data

**Storage buckets**:
- `projects/{projectId}/images/`: AI-generated images
- `projects/{projectId}/videos/`: AI-generated videos
- `projects/{projectId}/uploads/`: User-uploaded media

#### Save Manager (`services/saveManager.ts`)
**Purpose**: Optimistic updates with debounced cloud sync

**Architecture**:
- Debounces rapid saves (5-second window)
- Optimistic local state updates
- Background sync to Supabase
- Conflict resolution for concurrent edits

### Component Architecture

#### Tab Components (`/tabs`)
**Pattern**: Each tab is a smart container managing its own state and service interactions

**Key tabs by workflow phase**:
- **Pre-Production**:
  - `ScriptTab.tsx`: Script upload, analysis trigger
  - `MoodboardTab.tsx`: Reference image management, AI-powered search
  - `CastLocationsTab.tsx`: Character/location generation, identity training
- **Production**:
  - `SceneAssemblerTab.tsx`: Shot-by-shot compositing with image/video generation
  - `ThreeDWorldsTab.tsx`: 3D world generation (infrastructure ready)
- **Post-Production**:
  - `PostProductionTab.tsx`: Timeline editing, exports
  - `AnalyticsTab.tsx`: Quality analysis, performance metrics, cost tracking

#### Shared Components (`/components`)
- **AI Interaction**: `DirectorWidget.tsx` (AI cinematography assistant, voice + text commands)
- **Generation**: `VideoGenerationPanel.tsx`, `CharacterIdentityModal.tsx`, `TestPanel.tsx`
- **UI/UX**: `SaveStatusIndicator.tsx`, `GenerationContextPanel.tsx`, `VideoFullscreenView.tsx`
- **Core**: Reusable forms, modals, buttons, layout components with Radix UI foundation

### State Management Patterns

**Project State** (`App.tsx`):
```typescript
const [projectState, setProjectState] = useState({
  scriptContent: string | null,
  scriptAnalysis: ScriptAnalysis | null,
  timelineClips: TimelineClip[],
  roadmapBlocks: RoadmapBlock[],
  ui: { leftWidth, rightWidth, timelineHeight, zoom, playhead }
});
```

**User Preferences** (Supabase):
- Active tab, sidebar expansion persisted per user
- Migration from localStorage on first login
- Real-time sync across devices

**Media Assets** (Supabase Storage):
- All AI-generated content uploaded with metadata
- Blob URLs converted to permanent Supabase URLs
- Base64 → Blob → Upload flow for all generations

## Key Data Models

### ScriptAnalysis
The central domain object representing a fully analyzed screenplay:
```typescript
{
  title: string,
  logline: string,
  summary: string,
  scenes: AnalyzedScene[],      // Scenes with frames (shots)
  characters: AnalyzedCharacter[], // With optional identity LoRAs
  locations: AnalyzedLocation[],
  moodboard?: Moodboard,
  moodboardTemplates?: MoodboardTemplate[]
}
```

### Frame (Shot)
Represents a single shot in a scene with full technical specification:
```typescript
{
  id: string,
  shot_number: number,
  description: string,
  status: FrameStatus,          // Draft → GeneratingStill → VideoReady
  camera_package: {             // Technical camera settings
    lens_mm, aperture, iso, height, angle, movement
  },
  media: {
    start_frame_url?: string,   // Hero still image
    animated_video_url?: string,
    video_upscaled_url?: string
  },
  generations?: Generation[],   // Variant images
  videoGenerations?: Generation[]
}
```

### CharacterIdentity
Epic 2 feature for consistent character appearance:
```typescript
{
  status: 'none' | 'preparing' | 'ready' | 'error',
  referenceImages: string[],    // 6-12 training images
  technologyData: {
    type: 'lora',
    falCharacterId: string,     // Fal.ai LoRA model ID
  },
  tests?: CharacterIdentityTest[] // Visual similarity tests
}
```

## Environment Configuration

### Required Environment Variables
```bash
# Core AI (Required)
VITE_GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_KEY=your_gemini_api_key

# Character Identity (Required for Epic 2)
FAL_API_KEY=your_fal_api_key

# Supabase (Required for auth/persistence)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Optional APIs
FLUX_API_KEY=your_flux_key
BRAVE_SEARCH_API_KEY=your_brave_key
LUMA_API_KEY=your_luma_key
```

### Development Server Features
- **Hot Module Replacement**: Fast development iteration with Vite HMR
- **Brave Search Proxy**: CORS handling for image search API via `/api/brave-proxy` (dev only)
- **Environment Management**: Automatic Vercel env var detection with local fallback
- **Path Aliases**: `@/` mapped to project root for clean imports

### Vercel Deployment
- API keys configured in Vercel Dashboard → Environment Variables
- `vite.config.ts` defines all environment variables at build time with proper precedence
- **Multi-environment support**: Development, staging, production configurations
- **Bundle optimization**: Automatic code splitting, vendor chunks, WASM support
- Production mode: `process.env` prioritized over local `.env`

## Testing Strategy

### Current Test Coverage
- Unit tests: `services/characterIdentityService.test.ts`
- Component tests: `components/CharacterIdentityTestPanel.test.tsx`
- E2E tests: `qa-epic-1-stories-1.3-1.4.test.ts`

### Test Framework
- **Vitest**: Fast unit test runner with Vite integration
- **@testing-library/react**: Component testing with React 19 support
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM testing environment
- **Coverage**: V8 provider with HTML/JSON/text reports

### Running Tests
```bash
npm test                    # Run all tests with Vitest
npm run test:ui             # Interactive test UI with live reload
npm run test:coverage       # Generate comprehensive coverage report

# Targeted testing
npm test -- --reporter=verbose                    # Detailed output
npm test -- --run                                # Single run (no watch mode)
npm test CharacterIdentityService.test.ts        # Specific file
npm test -t "LoRA training"                      # Pattern matching
```

### Critical Test Scenarios
1. **Script Analysis**: Upload script → verify JSON parsing and scene extraction
2. **Character Identity**: Train LoRA → test visual similarity (90-98% accuracy)
3. **Image Generation**: Generate variants → verify Supabase upload and metadata
4. **Video Animation**: Animate frame → verify Veo 3.1 API flow with progress tracking
5. **Save/Load**: Create project → save → reload → verify state persistence
6. **Voice Commands**: Test director widget integration with speech recognition
7. **RLS Security**: Verify user data isolation through Row-Level Security policies

## Common Development Tasks

### Adding a New AI Model
1. Add model identifier to `aiService.ts` model list
2. Update `generateVisual()` routing logic
3. Add cost estimate to `analyticsService.ts`
4. Update model selector UI in `VideoGenerationPanel.tsx`

### Adding a New Tab
1. Create tab component in `/tabs`
2. Add tab configuration to `constants.ts` TABS array
3. Update `renderContent()` switch in `App.tsx`
4. Add icon to `/components/icons/Icons.tsx`

### Integrating a New API Service
1. Create service file in `/services`
2. Export service functions with consistent error handling
3. Add usage logging via `logAIUsage()`
4. Update analytics cost tracking
5. Add Supabase storage integration for generated media

### Modifying Project Schema
1. Update types in `types.ts`
2. Update Supabase migration in `/supabase/migrations`
3. Run migration: `npm run supabase:db push`
4. Update serialization in `App.tsx` getSerializableState()
5. Test backward compatibility with existing projects

## Known Issues & Workarounds

### Image Size Limits
**Issue**: Gemini API has 20MB limit for inline images
**Workaround**: `validateImageSize()` in aiService checks before upload, rejects oversized images

### Safety Filters
**Issue**: Gemini blocks legitimate prompts for false positives
**Workaround**: Automatic retry with Flux API when safety error detected

### Blob URL Persistence
**Issue**: Blob URLs don't persist across sessions
**Workaround**: Convert to base64 before localStorage save, convert back on load

### Supabase RLS Policies
**Issue**: Slow auth.uid() re-evaluation in RLS policies
**Workaround**: Optimized policies to O(1) auth checks (see SECURITY_FIXES.md)

### Character Identity Callback Wiring
**Issue**: Character identity state not syncing during generation in CastLocationGenerator
**Root Cause**: Missing `onPrepareIdentity` callback prop from CastLocationsTab to CastLocationGenerator
**Fix**: Wire the callback through component hierarchy (commit 5d23fca)
**Symptom**: Characters show "No ID" status during generation despite having trained LoRA

## Project Status

**Current Epic Status** (as of 2025-11-12):
- ✅ Epic 1: Director Voice (Voice I/O, style learning, continuity checking)
- ✅ Epic 2: Character Identity (LoRA training, 90-98% consistency)
- ✅ Epic 6: Analytics (Quality analysis, performance metrics)
- ⚪ Epic 3: 3D Worlds (Infrastructure ready, not started)
- ⚪ Epic 4: Voice Acting (Awaiting prioritization)
- ⚪ Epic 5: Audio Production (Service stubs exist)

**Bundle Size**: 164KB gzipped (optimized with code splitting)
**Build Time**: ~18 seconds
**TypeScript Errors**: 0

## Documentation References

- **Project Roadmap**: `/docs/ROADMAP.html`
- **Epic Status**: `/docs/EPIC_STATUS_UPDATE.md`
- **Quality Checklist**: `/docs/qa/QUALITY_CHECKPOINT_2025-11-12.md`
- **Character Identity Guide**: `/docs/EPIC2_STORY_2.1_FIX_COMPLETE.md`
- **LoRA Implementation Summary**: `/LORA_IMPLEMENTATION_SUMMARY.md` (comprehensive UI integration guide)
- **LoRA Integration Test Report**: `/LORA_INTEGRATION_TEST_REPORT.md` (detailed testing results)
- **Supabase Setup**: `/SUPABASE_SETUP.md`
- **Security Fixes**: `/supabase/SECURITY_FIXES.md`

## Code Style & Conventions

- **TypeScript**: Strict mode enabled, no `any` types except where necessary
- **React**: Functional components with hooks, no class components
- **Async/Await**: Preferred over promises for readability
- **Error Handling**: All service functions throw typed errors, caught at component level
- **Logging**: Console logs prefixed with service name (e.g., `[AI Service]`, `[Database]`)
- **Comments**: JSDoc for public APIs, inline comments for complex logic only

## Performance Considerations

### Build Performance & Optimization

#### Bundle Optimization (164KB gzipped)
- **Code Splitting**: Intelligent vendor chunks (React, Three.js, Supabase, Recharts, FFmpeg)
- **Service Chunks**: AI services, data services, generation services separated
- **Lazy Loading**: Heavy components (3D viewers, video panels) loaded on demand
- **WASM Support**: FFmpeg.wasm and 3D processing libraries properly configured
- **Terser Minification**: Debug info removal, class name preservation for compatibility
- **Aggressive Optimization**: 62% reduction from 426KB to 164KB through improved chunking strategy

#### API Cost Management
- **Debounced Saves**: 5-second debounce prevents redundant Supabase writes
- **Model Selection**: Gemini Flash for speed, Imagen/Flux for quality
- **Safety Filter Fallback**: Automatic retry with Flux API when Gemini blocks content
- **Image Caching**: Supabase Storage URLs cached in project state
- **Progress Tracking**: Real-time progress prevents duplicate generation requests
- **Usage Analytics**: Comprehensive logging via `logAIUsage()` for cost tracking

#### Database Query Optimization
- **RLS Policy Optimization**: O(1) auth checks, indexed foreign keys (improved from O(n))
- **Batch Operations**: Parallel frame generation, bulk timeline transfers
- **Connection Pooling**: Supabase client reuse and query deduplication
- **Real-time Subscriptions**: Efficient live data sync across browser tabs

### Known Performance Limitations
- **3D Rendering**: Gaussian Splatting requires WebGL 2.0 and decent GPU
- **Video Processing**: FFmpeg.wasm operations are CPU-intensive in browser
- **Large Scripts**: Scripts >100K characters may hit Gemini token limits
- **Character Training**: LoRA training takes 5-10 minutes on Fal.ai infrastructure

---

**Last Updated**: 2025-11-15
**Codebase Version**: V2.0 Alpha
**Maintained By**: Qualia Solutions
**Recent Major Updates**: LoRA character identity training UI complete with full integration (Epic 2)

## Quick Start for New Developers

1. **Environment Setup**:
   ```bash
   # Clone and install
   git clone https://github.com/QualiaSound/alkemy.git
   cd alkemy
   npm install

   # Configure environment variables (see section above)
   cp .env.example .env.local  # If template exists
   ```

2. **First Run**:
   ```bash
   npm run dev     # Starts on http://localhost:3000
   ```

3. **Test the Application**:
   - Upload a sample script in the Script tab
   - Try voice commands with the Director Widget (Epic 1)
   - Train a character identity (Epic 2) requires FAL_API_KEY
   - Generate scenes and check analytics

4. **Key Files to Understand**:
   - `src/App.tsx` - Main application state and routing
   - `src/services/aiService.ts` - All AI model integrations
   - `src/types.ts` - Complete TypeScript domain model
   - `vite.config.ts` - Build configuration and proxy setup
