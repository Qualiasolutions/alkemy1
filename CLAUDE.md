# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alkemy AI Studio is an AI-powered film generation platform that transforms scripts into complete visual productions. Built with React 19, TypeScript, Vite, and TailwindCSS, it integrates multiple AI services (Google Gemini, Fal.ai Flux LoRA, HuggingFace, Pollinations) and uses Supabase for authentication and persistence.

**Latest Production**: https://alkemy1-7ait0xi2i-qualiasolutionscy.vercel.app (2025-11-19)

## Development Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:3000
npm run build            # Production build with code splitting
npm run preview          # Preview production build locally
npm run type-check       # TypeScript type checking without build
npm run lint             # Run ESLint

# Testing
npm test                 # Run all tests with Vitest
npm run test:ui          # Interactive test UI
npm run test:coverage    # Generate coverage reports

# Run specific tests
npm test -- CharacterIdentityService.test.ts
npm test -t "should train LoRA model"

# Deployment
vercel --prod            # Deploy to Vercel production
vercel logs <url>        # View production logs
vercel env pull .env.vercel.production --environment=production
```

## Architecture Overview

### Application Structure

**Tab-Based Workflow** organized around film production phases:
- **Pre-Production**: Script analysis, moodboard, cast/locations (`ScriptTab`, `MoodboardTab`, `CastLocationsTab`)
- **Production**: Scene assembly, 3D worlds (`SceneAssemblerTab`, `GenerateWorldTab`)
- **Post-Production**: Timeline editing, exports, analytics (`PostProductionTab`, `AnalyticsTab`)

**Core Patterns**:
- **State Management**: Centralized in `App.tsx`, user preferences in Supabase, optimistic updates via `saveManager.ts`
- **Service Layer**: All AI/API logic in `/services`, isolated from UI components
- **Tab Containers**: Smart components in `/tabs` manage state and service interactions
- **Presentational Components**: Reusable UI in `/components` (Radix UI foundation)
- **Type Safety**: Complete domain model in `types.ts` (~500 lines)

### Key Services

#### AI Service (`services/aiService.ts`)
Central hub for all AI generation with multi-provider fallback:

**Model Routing**:
- Script analysis: Gemini 2.5 Pro → Flash → fallback content
- Image generation: Pollinations (free) → Flux API → HuggingFace
- Video generation: HuggingFace AnimateDiff/SVD → Veo (when available)
- Safety filter handling: Auto-retry with alternative providers

**Critical Functions**:
- `analyzeScript()`: Parses screenplay → JSON (scenes, characters, locations, frames)
- `generateStillVariants()`: Image generation with LoRA injection for character identity
- `animateFrame()`: Video animation from still images
- `askTheDirector()`: AI cinematography assistant with technical knowledge base

**Integration Points**: Uploads all generated media to Supabase Storage, logs usage via `usageService`

#### Character Identity Service (`services/characterIdentityService.ts`)
LoRA-based character consistency (Epic 2):

**Workflow**:
1. Validate 3-12 reference images (>512px, <10MB each)
2. Upload to Supabase Storage (`character-references` bucket)
3. Train Flux LoRA via Fal.ai API (5-10 min, dual-path CORS handling)
4. Store LoRA URL in `character.identity.technologyData.falCharacterId`
5. Auto-inject LoRA parameters into all subsequent image generations

**Status States**: `none` | `preparing` | `ready` | `error`

**IMPORTANT**: `onPrepareIdentity` callback must propagate from `CastLocationsTab` → `CastLocationGenerator` to sync identity state during generation.

#### Supabase Service (`services/supabase.ts`)
Authentication, persistence, and media storage:

**Tables**:
- `projects`: Script content, analysis JSON, timeline clips
- `user_preferences`: UI state (active tab, sidebar expansion)
- `media_assets`: Generated images/videos with metadata
- `usage_logs`: AI usage tracking (tokens, costs, performance)

**Storage Buckets**:
- `projects/{projectId}/images/` - Generated images
- `projects/{projectId}/videos/` - Generated videos
- `character-references/{characterId}/` - LoRA training images

**Security**: Row-Level Security (RLS) policies ensure user data isolation

#### Save Manager (`services/saveManager.ts`)
Optimistic updates with debounced Supabase sync (5-second window)

### State Management

**App.tsx** (central project state):
```typescript
{
  scriptContent: string | null,
  scriptAnalysis: ScriptAnalysis | null,
  timelineClips: TimelineClip[],
  roadmapBlocks: RoadmapBlock[],
  ui: { leftWidth, rightWidth, timelineHeight, zoom, playhead }
}
```

**userDataService.ts**: Supabase persistence for user preferences (syncs across devices)

**Media Flow**: Blob URL → Base64 (for localStorage) → Supabase Storage URL (permanent)

## Key Data Models

**ScriptAnalysis** - Central domain object from screenplay parsing:
```typescript
{ title, logline, summary, scenes: AnalyzedScene[],
  characters: AnalyzedCharacter[], locations: AnalyzedLocation[],
  moodboard?, moodboardTemplates? }
```

**Frame** - Single shot with technical specs and generation state:
```typescript
{ id, shot_number, description,
  status: FrameStatus, // Draft → GeneratingStill → AnimatedVideoReady
  camera_package: { lens_mm, aperture, iso, height, angle, movement },
  media: { start_frame_url?, animated_video_url?, video_upscaled_url? },
  generations?: Generation[], videoGenerations?: Generation[],
  selectedCharacterIds?: string[], appliedIdentities?: {...}[] }
```

**CharacterIdentity** - LoRA-based character consistency (Epic 2):
```typescript
{ status: 'none' | 'preparing' | 'ready' | 'error',
  referenceImages: string[], // Training images
  technologyData: { type: 'lora', falCharacterId: string },
  tests?: CharacterIdentityTest[] }
```

**TimelineClip** - Video clip in post-production timeline:
```typescript
{ id, timelineId, sceneNumber, shot_number, description,
  url, audioUrl?, sourceDuration, trimStart, trimEnd }
```

## Environment Variables

**Required**:
```bash
VITE_GEMINI_API_KEY      # Google Gemini API (script analysis, image gen)
GEMINI_API_KEY           # Alternative key for server-side
FAL_API_KEY              # Fal.ai API (LoRA training, Flux models)
VITE_SUPABASE_URL        # Supabase project URL
VITE_SUPABASE_ANON_KEY   # Supabase anonymous key
```

**Optional**:
```bash
BRAVE_SEARCH_API_KEY     # Moodboard image search
LUMA_API_KEY             # Luma video generation
```

**Configuration Notes**:
- Development: Create `.env.local` (gitignored)
- Production: Set in Vercel Dashboard → Environment Variables
- Vite exposes variables at build time via `vite.config.ts`
- Dev server provides `/api/brave-proxy` for CORS handling
- Path alias: `@/` maps to project root

## Testing

**Framework**: Vitest + @testing-library/react + jsdom

**Coverage** (93% pass rate):
- `services/characterIdentityService.test.ts` - LoRA training workflow
- `services/saveManager.test.ts` - Debounced saves
- Component tests in `/components/*.test.tsx`

**Critical Test Scenarios**:
1. Script analysis → JSON parsing (scenes, characters, locations)
2. LoRA training → visual similarity validation (90-98% target)
3. Image generation → Supabase upload + metadata
4. Save/load → state persistence + RLS security
5. Voice commands → DirectorWidget integration

## Common Patterns

### Adding a New AI Model
1. Add to `aiService.ts` model routing logic
2. Update cost estimates in `analyticsService.ts`
3. Add usage logging via `logAIUsage()`
4. Update UI selector in `VideoGenerationPanel.tsx`

### Adding a New Tab
1. Create component in `/tabs/MyTab.tsx`
2. Add config to `constants.ts` TABS array
3. Update `App.tsx` renderContent() switch
4. Add icon to `/components/icons/Icons.tsx`

### Integrating a New Service
1. Create `/services/myService.ts`
2. Add error handling + `logAIUsage()` calls
3. Integrate Supabase Storage for media uploads
4. Update analytics cost tracking

### Modifying Database Schema
1. Update types in `types.ts`
2. Create migration in `/supabase/migrations/`
3. Update `App.tsx` state serialization
4. Test backward compatibility with existing projects

## Known Issues & Workarounds

### Image Size Limits
Gemini API: 20MB limit for inline images. `validateImageSize()` in aiService rejects oversized files before upload.

### Safety Filters
Gemini may block legitimate prompts. Auto-retry with Pollinations/Flux API when safety error detected.

### Blob URL Persistence
Blob URLs expire across sessions. Convert to base64 before localStorage save, then to Supabase Storage URL.

### Character Identity Callback Wiring
**CRITICAL**: `onPrepareIdentity` callback must propagate from `CastLocationsTab` → `CastLocationGenerator` to sync identity state during generation. Missing callback causes "No ID" status despite trained LoRA.

### CORS Handling (Fixed 2025-11-19)
LoRA training uses dual-path: direct fetch + `/api/image-proxy` fallback for CORS bypass. See `LORA_CORS_FIX_2025-11-19.md`.

## Build Optimization

**Bundle Size**: 164KB gzipped (down from 512KB)

**Code Splitting** (13 chunks):
- `react-vendor` - React, React DOM, React Router
- `ui-vendor` - Framer Motion, Radix UI
- `three-vendor` - Three.js, React Three Fiber, Gaussian Splatting
- `supabase-vendor` - Supabase client
- `ffmpeg-vendor` - FFmpeg.wasm
- `ai-services` - aiService, directorKnowledge
- `data-services` - supabase, characterIdentity
- `generation-services` - wanService, fluxService, lumaService, hunyuanWorld

**Optimization Techniques**:
- Lazy loading for heavy components (3D viewers, video panels)
- WASM support for FFmpeg and 3D processing
- esbuild minification (prevents temporal dead zone errors)
- Debounced saves (5s window) to prevent redundant Supabase writes
- Image caching via Supabase Storage URLs

**Performance Limitations**:
- Gaussian Splatting requires WebGL 2.0 + GPU
- FFmpeg.wasm is CPU-intensive in browser
- Scripts >100K characters may hit Gemini token limits
- LoRA training: 5-10 minutes on Fal.ai

## Documentation

- **LoRA Implementation**: `/docs/epics/LORA_IMPLEMENTATION_SUMMARY.md`
- **LoRA Testing**: `/docs/epics/LORA_INTEGRATION_TEST_REPORT.md`
- **Epic Status**: `/docs/EPIC_STATUS_UPDATE.md`
- **Supabase Setup**: `/docs/setup/SUPABASE_SETUP.md`
- **Security Fixes**: `/supabase/SECURITY_FIXES.md`
- **Quick Start**: `/docs/setup/QUICKSTART.md`

## Code Conventions

- TypeScript strict mode, minimize `any` types
- Functional React components with hooks
- Async/await over promises
- Error handling: services throw, components catch
- Console logs prefixed with service name: `[AI Service]`, `[Database]`
- JSDoc for public APIs only

---

**Last Updated**: 2025-11-20
**Version**: V2.0 Production
**Status**: Live at https://alkemy1-7ait0xi2i-qualiasolutionscy.vercel.app
