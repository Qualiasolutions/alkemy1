# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alkemy AI Studio is a React-based AI-powered film production application that assists filmmakers in transforming scripts into complete visual productions. The app uses Google's Gemini API (including Imagen, Veo, and Gemini Nano Banana image models) to analyze scripts, generate visual assets, and create shot-by-shot compositions.

**AI Studio App**: https://ai.studio/apps/drive/1Tm5FTdplRGA4KFy33VGHCQM5jpAwYqR5

## Development Commands

All commands should be run from the project root directory:

```bash
# Install dependencies
npm install

# Start development server (runs on port 3000, accessible at localhost:3000 or network IP)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Vite Development Server**: Configured in `vite.config.ts` to run on port 3000 with host `0.0.0.0` (network accessible). Environment variables are exposed to the client via `define` config.

**Tailwind CSS Setup**: The project uses Tailwind CSS v3.4.17 with PostCSS and Autoprefixer. Configuration is in `tailwind.config.ts` with custom CSS variables defined in `index.css`.

## Deployment

The project is linked to Vercel:
- **Project Name**: `alkemy1`
- **Default URL**: `https://alkemy1.vercel.app`
- **Vercel Config**: Project details stored in `.vercel/project.json` (do not commit)
- **Environment Variables**: Set `GEMINI_API_KEY`, `FLUX_API_KEY`, `LUMA_API_KEY`, `WAN_API_KEY`, `REPLICATE_API_TOKEN`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` in Vercel dashboard under project settings
- **Serverless Functions**: API routes in `api/` directory are deployed as Vercel serverless functions (`luma-proxy.ts` and `replicate-proxy.ts`)

The app auto-deploys on push to `main` branch. Vercel builds use `npm run build` and serve from `dist/`.

**Serverless API Proxy Pattern**: The `api/luma-proxy.ts` function demonstrates the pattern for creating CORS-safe API proxies. If adding more external APIs that have CORS restrictions, follow this pattern:
1. Create a new `.ts` file in `api/` directory
2. Export a default handler function with `VercelRequest` and `VercelResponse` types
3. Add CORS headers for preflight OPTIONS requests
4. Proxy the request to the external API using server-side fetch
5. Pass API keys from environment variables (never expose them client-side)

## Environment Configuration

Create `.env.local` in the project root directory:

```
GEMINI_API_KEY=your_gemini_api_key_here
FLUX_API_KEY=your_flux_api_key_here  # Optional: for Flux model support
WAN_API_KEY=your_wan_api_key_here  # Optional: for Wan 2.2 motion transfer
LUMA_API_KEY=your_luma_api_key_here  # Optional: for Luma AI 3D generation
REPLICATE_API_TOKEN=your_replicate_api_token_here  # Optional: for Emu3-Gen world generation
VITE_SUPABASE_URL=your_supabase_url  # Optional: for authentication
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key  # Optional: for authentication
```

**API Key Management:**
- If `GEMINI_API_KEY` is set via environment variable (e.g., in Vercel), the app skips the API key prompt
- If no environment key is found, the app prompts users to select their API key through the AI Studio interface (`window.aistudio.openSelectKey()`)
- The `vite.config.ts` exposes environment variables to the client via `process.env.GEMINI_API_KEY`, `process.env.FLUX_API_KEY`, and `process.env.WAN_API_KEY`
- Invalid API key errors trigger a global `invalid-api-key` event, prompting the user to reselect a key

For deployment, configure the `GEMINI_API_KEY` in Vercel project environment variables.

**AI Studio Global Interface:**
The app expects a `window.aistudio` object when running in Google AI Studio environment (types.ts:3-11):
- `hasSelectedApiKey(): Promise<boolean>` - Checks if user has selected an API key
- `openSelectKey(): Promise<void>` - Opens AI Studio's key selection dialog

This interface is optional and the app gracefully degrades when unavailable (e.g., local dev with `.env.local` keys).

## Architecture Overview

### State Management Pattern

The app uses a **centralized project state architecture** in `App.tsx` that manages all production data:

- **Project State**: Stores `scriptContent`, `scriptAnalysis`, `timelineClips`, and UI state in a unified object
- **Local Storage Persistence**: Project data is saved to `localStorage` under `alkemy_ai_studio_project_data_v2`
- **Serialization Strategy**: Large generated image variants are stripped before storage to avoid quota limits (see `getSerializableState()` in App.tsx)
- **Blob URL Handling**: Timeline clips with blob URLs are converted to base64 for persistence (`blobUrlToBase64()`), then restored as blob URLs on load (`base64ToBlobUrl()`)
- **State Hydration**: On app load, project state is restored from localStorage, allowing users to resume work
- **Auto-Save**: Project auto-saves to localStorage every 2 minutes

Key state setters passed down through props:
- `setScriptContent`: Updates raw script text
- `setScriptAnalysis`: Updates the analyzed script structure (supports functional updates via React.SetStateAction)
- `setTimelineClips`: Updates video clips in the timeline (supports functional updates)
- `setProjectState`: Internal state updater that triggers localStorage serialization

**Important**: `setScriptAnalysis` handles both direct values and functional updaters. Always use functional updates when modifying nested data to avoid race conditions.

### Authentication System (Optional)

The app includes optional Supabase authentication via `contexts/AuthContext.tsx`:

- **AuthProvider**: Wraps the app to provide authentication state and methods
- **Auth Service Layer**: `services/supabase.ts` abstracts Supabase client with helper methods
- **User Components**: `LoginForm`, `RegisterForm`, `AuthModal`, and `UserMenu` in `components/auth/`
- **Permission System**: `usePermission` hook for tier-based feature access
- **Database Schema**: Ready-to-run migrations in `supabase/migrations/001_initial_schema.sql`
- **Graceful Degradation**: App works without Supabase configuration (anonymous mode)

When Supabase is configured, users can:
- Save projects to cloud instead of localStorage
- Access projects from any device
- Track usage and quotas
- Upload media to cloud storage

See `SUPABASE_SETUP.md` for detailed setup instructions.

### Theme System

The app includes a comprehensive theming system via `theme/ThemeContext.tsx`:

- **ThemeProvider**: React context provider wrapping the entire app in `index.tsx`
- **Theme Modes**: `dark` (default) and `light` modes with complete color palettes
- **Persistence**: Theme preference saved to `localStorage` under `alkemy-ai-studio-theme`
- **useTheme Hook**: Access current theme with `const { mode, colors, toggleTheme, isDark } = useTheme()`
- **Color Tokens**: Defined in `THEMES` object with semantic names (e.g., `bg_primary`, `text_secondary`, `accent_primary`)

When building new components, use the `useTheme()` hook instead of hardcoded color values from `constants.ts`.

### Tab-Based Workflow

The application is organized as a multi-tab workflow representing the film production pipeline:

**Development Phase:**
- **Script Tab**: Upload/paste screenplay, triggers AI analysis via `analyzeScript()`
- **Moodboard Tab**: Visual reference management (cinematography, color, style)
- **Cast & Locations Tab**: Generate character and location images using `generateStillVariants()`
- **Compositing Tab** (`SceneAssemblerTab`): Shot-by-shot composition with `generateStillVariants()` and `animateFrame()`
- **Presentation Tab**: Project overview and pitch materials

**Production Phase:**
- **Timeline Tab** (`FramesTab`): Video editing interface for assembled shots
- **Wan Transfer Tab**: Motion transfer capabilities (experimental)
- **Post-Production Tab**: Color grading, effects (placeholder)
- **Exports Tab**: Export final videos

**Media Phase:**
- **Social Spots Tab**: Generate social media variants
- **Scheduler Tab**: Content calendar
- **Analytics Tab**: Performance metrics

Tabs are defined in `constants.ts` as `TABS_CONFIG` and rendered conditionally in the `renderContent()` function within `AppContent` component.

### AI Service Layer

`services/aiService.ts` centralizes all AI API interactions:

**Core Functions:**
- `analyzeScript()`: Structured JSON extraction from screenplay using Gemini 2.5 Pro with schema-guided generation
- `generateFramesForScene()`: Creates 3-5 shot descriptions per scene with technical camera data
- `generateStillVariants()`: Batch image generation with reference images and moodboard integration
- `animateFrame()`: Converts still images to video using Veo 3.1
- `refineVariant()`: Iterative refinement of generated images
- `upscaleImage()` / `upscaleVideo()`: Quality enhancement (currently simulated)
- `askTheDirector()`: Context-aware AI assistant for creative decisions

**Safety & Prompt Engineering:**
- `buildSafePrompt()` wraps all prompts with "Cinematic film still for a fictional movie (SFW)" to reduce safety blocks
- Reference images limited to 5 per generation call
- Error handling via `handleApiError()` with user-friendly messages

**Progress Tracking:**
All generation functions accept `onProgress` callbacks for real-time UI updates.

### TypeScript Contracts

`types.ts` defines the data model:

- `ScriptAnalysis`: Top-level project structure (title, scenes, characters, locations)
- `AnalyzedScene`: Scene metadata with `frames[]` array
- `Frame`: Shot-level data with `status` (FrameStatus enum), `media` URLs, and technical specs
- `Generation`: Tracks individual AI generation attempts with loading/error states
- `TimelineClip`: Video clip representation for editing
- `User`: User profile with subscription tiers
- `AuthState`: Authentication state management

**Frame Status Lifecycle:**
```
Draft → GeneratingStill → GeneratedStill → UpscalingImage → UpscaledImageReady →
QueuedVideo → RenderingVideo → AnimatedVideoReady → UpscalingVideo → UpscaledVideoReady → (transferred to timeline)
```

Note: `VideoReady` status is retained for compatibility but the new flow uses `AnimatedVideoReady`.

### Component Organization

- `components/`: Reusable UI elements (`Button.tsx`, `Sidebar.tsx`, `DirectorWidget.tsx`, `SplashScreen.tsx`, `WelcomeScreen.tsx`, `Toast.tsx`, `3DWorldViewer.tsx`)
- `components/icons/Icons.tsx`: Inline SVG icon components
- `components/auth/`: Authentication components (`LoginForm.tsx`, `RegisterForm.tsx`, `AuthModal.tsx`, `UserMenu.tsx`)
- `tabs/`: Feature-specific views, each handling its own UI logic but relying on App.tsx for state
- `theme/`: Theme system (`ThemeContext.tsx` with ThemeProvider and useTheme hook)
- `contexts/`: React contexts (`AuthContext.tsx` for authentication state)
- `hooks/`: Custom React hooks (`useKeyboardShortcuts.ts` for power-user shortcuts)
- `data/`: Demo project data (`demoProject.ts` with sample screenplay and analysis)

### DirectorWidget - AI Assistant

The `DirectorWidget` component (`components/DirectorWidget.tsx`) is a persistent chat interface that provides an AI-powered cinematography assistant:

**Features:**
- **Chat Interface**: Fixed bottom-right widget that expands to a full chat window
- **Command Parsing**: Recognizes natural language commands for image generation and technical queries
- **Image Generation**: "Generate [N] [flux/imagen] images of [character/location] [aspect]" - generates images directly into character/location state
- **Image Upscaling**: "Upscale the [character/location] image" - enhances existing images
- **Technical Queries**: Cinematography questions leverage `askTheDirector()` from `services/aiService.ts` with enhanced director knowledge from `services/directorKnowledge.ts`
- **DOF Calculations**: "Calculate DOF for f/[aperture] at [distance]m with [focal_length]mm" - performs real depth-of-field calculations
- **Lens Recommendations**: "Recommend lens for [shot type]" - suggests focal lengths
- **Lighting Setup**: "Setup lighting for [mood]" - provides 3-point lighting configurations
- **Camera Movement**: "Suggest camera movement for [emotion]" - recommends dolly, crane, tracking shots
- **Color Grading**: "Color grade for [genre/mood]" - suggests LUTs and color temperature adjustments

**Command Execution Pattern:**
1. User submits natural language query
2. `parseCommand()` extracts structured command data
3. `executeCommand()` routes to appropriate service function
4. Results update `scriptAnalysis` state via `setScriptAnalysis` functional updates
5. Chat displays confirmation message and generated images inline

**Integration Points:**
- Accesses `scriptAnalysis` for character/location lookup
- Updates character/location `generations` arrays via functional state updates
- Uses `askTheDirector()` from `aiService.ts` for natural language responses
- Imports `calculateDepthOfField()` from `directorKnowledge.ts` for technical calculations

The widget is always rendered at the bottom-right of the screen and is only interactive after a script has been analyzed.

### App Structure

The `App.tsx` file exports a default component wrapped in `ThemeProvider`. The main app logic is in the `AppContent` component which:
- Manages API key validation flow
- Handles project state and localStorage persistence
- Renders the active tab content
- Provides callbacks to child components for state updates

### Import Alias

`tsconfig.json` defines `@/*` as a root alias pointing to the project root. Use this for all imports:

```typescript
import { analyzeScript } from '@/services/aiService';
import { TABS_CONFIG } from '@/constants';
import { useTheme } from '@/theme/ThemeContext';
```

### Entry Point

- `index.tsx`: Root React application mount point
- `index.html`: HTML template with root element
- `index.css`: Global styles with Tailwind directives and CSS custom properties for theming

## Key Implementation Patterns

### Functional State Updates

When updating nested state, always use functional updates to avoid race conditions:

```typescript
setScriptAnalysis((prev) => ({
  ...prev,
  scenes: prev.scenes.map(scene =>
    scene.id === targetSceneId
      ? { ...scene, frames: updatedFrames }
      : scene
  )
}));
```

### Generation Workflow

1. User initiates generation from a tab (e.g., Compositing Tab)
2. Tab component calls AI service function with `onProgress` callback
3. Service function updates `Generation` objects with `isLoading: true`
4. On completion, update frame status and store URL in `frame.media`
5. Persist state to localStorage via `handleSaveProject()`

### Timeline Transfer

Upscaled videos are transferred from Compositing to Timeline via:
1. `handleTransferToTimeline()` in App.tsx creates a `TimelineClip` from a frame
2. Sets `frame.transferredToTimeline = true` to prevent duplicates
3. `handleTransferAllToTimeline()` in App.tsx batch-transfers all ready frames
4. `FramesTab` renders clips with trim/playback controls

### Project Management

Projects can be saved/loaded as `.alkemy.json` files:

- **handleNewProject()**: Clears current project and resets to default state
- **handleSaveProject()**: Manually saves current state to localStorage
- **handleDownloadProject()**: Exports project as `.alkemy.json` file with sanitized filename
- **handleLoadProject()**: Loads project from `.alkemy.json` file, with confirmation dialog

File format includes full project state (script, analysis, timeline clips, moodboard). Blob URLs are converted to base64 for portability. When loading projects, command history is cleared to prevent stale undo/redo actions.

### Keyboard Shortcuts

The app supports power-user keyboard shortcuts (implemented in `hooks/useKeyboardShortcuts.ts`):
- **Cmd/Ctrl + N**: New Project
- **Cmd/Ctrl + S**: Save Project
- **Cmd/Ctrl + O**: Load Project
- **Cmd/Ctrl + 1-9**: Switch to tab by index

## Coding Conventions

- **Indentation**: 4 spaces
- **Component Naming**: PascalCase (e.g., `ScriptTab.tsx`, `DirectorWidget.tsx`)
- **Hooks**: Prefix with `use` (e.g., `useCallback`, `useState`)
- **Exports**: Named exports preferred unless a single default clarifies usage
- **Functional Components**: Use React functional components with hooks exclusively
- **Animations**: Framer Motion is available for animations (see `framer-motion` package)
- **Styling**: Use the theme system via `useTheme()` hook for dynamic colors; avoid hardcoded color values

## Commit Guidelines

Follow Conventional Commits format seen in git history:
- `feat:` New features
- `fix:` Bug fixes
- `chore:` Maintenance tasks

Keep commits focused with descriptive messages. Include screenshots for UI changes.

## Advanced Services

### Video Rendering Service

`services/videoRenderingService.ts` handles client-side video rendering using FFmpeg.wasm:

- **loadFFmpeg()**: Initializes FFmpeg.wasm in the browser (loads from CDN)
- **renderTimelineToVideo()**: Concatenates timeline clips into a single video with specified resolution, codec, and quality
- **Supported Formats**: MP4 (h264/h265), WebM (vp9), MOV
- **Resolution Options**: 720p, 1080p, 4K
- **Progress Tracking**: Real-time progress callbacks during rendering

FFmpeg is loaded lazily when first needed and runs entirely in-browser via WebAssembly.

### 3D World Service

`services/3dWorldService.ts` integrates Luma AI Dream Machine API for text-to-3D landscape generation:

- **generate3DWorld()**: Generates 3D environments from text prompts
- **API Integration**: Polls Luma API for completion (max 2 minutes) using the `ray-3` model
- **Serverless Proxy**: Uses Vercel serverless function at `/api/luma-proxy` to avoid CORS issues (see `api/luma-proxy.ts`)
- **Model Formats**: Returns GLB/GLTF models for Three.js rendering
- **Environment Variable**: Requires `LUMA_API_KEY` to be configured in Vercel environment
- **Helper Functions**: `download3DModel()`, `isValid3DModelUrl()` for model management

Used in the **3DWorldViewer** component (`components/3DWorldViewer.tsx`) which renders 3D landscapes using Three.js.

**Important**: The Luma API proxy (`api/luma-proxy.ts`) is a Vercel serverless function that:
- Handles CORS headers for cross-origin requests
- Securely passes the `LUMA_API_KEY` from server environment
- Supports GET/POST requests to Luma API endpoints
- Returns responses with proper status codes and error handling

### Emu World Service

`services/emuWorldService.ts` integrates Replicate API for Emu3-Gen world generation:

- **generateEmuWorld()**: Generates 3D environments using baaivision/emu3-gen model
- **API Integration**: Uses Replicate prediction API with polling for completion
- **Serverless Proxy**: Uses Vercel serverless function at `/api/replicate-proxy` to avoid CORS issues (see `api/replicate-proxy.ts`)
- **Environment Variable**: Requires `REPLICATE_API_TOKEN` to be configured in Vercel environment
- **Actions Supported**: `create_prediction`, `get_prediction`, `cancel_prediction`

**Replicate API Proxy** (`api/replicate-proxy.ts`) is a Vercel serverless function that:
- Handles CORS headers for cross-origin requests
- Securely passes the `REPLICATE_API_TOKEN` from server environment
- Supports action-based routing for prediction lifecycle management
- Returns responses with proper status codes and error handling

### Wan Motion Transfer Service

`services/wanService.ts` integrates Wan 2.2 API for AI-powered motion transfer capabilities:

- **transferMotionWan()**: Transfers motion from a reference video to a target character image
- **API Integration**: Uses Alibaba's Wan 2.2 VACE Fun Pose model via AI/ML API
- **Progress Tracking**: Real-time progress callbacks during generation (max 5 minutes timeout)
- **Video Processing**: Handles video file to base64 conversion and blob URL preparation
- **Environment Variable**: Requires `WAN_API_KEY` to be configured
- **Helper Functions**: `isWanApiAvailable()` checks if API key is configured

Used in the **Wan Transfer Tab** for applying motion from reference videos to generated characters. Supports 720p resolution output at 16 fps with up to 81 frames.

### Command History Service

`services/commandHistory.ts` implements Unreal Engine-style undo/redo functionality:

- **Command Pattern**: Each action is encapsulated as a `Command` with `execute()` and `undo()` methods
- **History Management**: Maintains a stack of up to 50 commands
- **createStateCommand()**: Helper to create state-based commands
- **Branching History**: New commands after undo clear forward history
- **Global Singleton**: Exported as `commandHistory` for app-wide access

Cleared when loading a new project (see `handleLoadProject()` in App.tsx).

### API Keys Service

`services/apiKeys.ts` manages API key storage and retrieval with sophisticated fallback logic:

- **Priority Order**: Environment variables → localStorage → empty string
- **Caching**: In-memory cache prevents unnecessary localStorage reads
- **Eager Initialization**: Keys are loaded immediately on module import to prevent API key re-prompting
- **Multi-key Support**: Checks multiple localStorage keys for backward compatibility (`alkemy_gemini_api_key`, `geminiApiKey`)
- **Change Events**: Custom event system (`alkemy:gemini-key-changed`) for reactive key updates
- **Key Functions**:
  - `getGeminiApiKey()`: Retrieves the active API key (cached)
  - `setGeminiApiKey(value)`: Updates the API key in cache and localStorage
  - `clearGeminiApiKey()`: Resets to environment key or empty
  - `onGeminiApiKeyChange(callback)`: Subscribes to key change events
  - `hasGeminiApiKey()`: Checks if any key is available
  - `hasEnvGeminiApiKey()`: Checks if environment key is configured

The service is used by `App.tsx` for API key validation flow and by `aiService.ts` for authenticated API calls.

## Dependencies

Key packages used in this project:
- **@google/genai**: Google Generative AI SDK for Gemini, Imagen, and Veo models
- **@ffmpeg/ffmpeg** & **@ffmpeg/util**: Client-side video processing via WebAssembly
- **@supabase/supabase-js**: Supabase client for authentication and database
- **@supabase/auth-ui-react**: Pre-built authentication UI components
- **three**: 3D rendering library for landscape visualization
- **react** & **react-dom**: React 19.2.0 (latest)
- **framer-motion**: Animation library for smooth UI transitions
- **vite**: Build tool and dev server
- **typescript**: Type safety (v5.8.2)

## Notes for Future Development

- **Testing**: No automated test suite currently wired. When adding tests, colocate them per feature (e.g., `tabs/FramesTab.test.tsx`)
- **API Keys**: Never commit secrets. Use `.env.local` for local development. The app supports `GEMINI_API_KEY`, `FLUX_API_KEY`, `LUMA_API_KEY`, `WAN_API_KEY`, `REPLICATE_API_TOKEN`, and Supabase keys
- **Storage Optimization**: The serialization logic in `getSerializableState()` strips large generated variants to avoid localStorage quota issues. If adding new generation arrays, update this function. Timeline clips with blob URLs are converted to base64 for persistence and back to blob URLs on load.
- **Video Duration**: `getVideoDuration()` helper in App.tsx extracts metadata for timeline clips. It defaults to 5 seconds on error.
- **Animation Performance**: Framer Motion is used throughout for UI animations. Use `AnimatePresence` for exit animations and `motion.*` components for animated elements.
- **FFmpeg Performance**: FFmpeg.wasm loads from unpkg.com CDN (~30MB). First render may take time. The wasm module persists across renders once loaded.
- **3D Model Memory**: Three.js models from Luma can be large. Dispose of geometries and materials when unmounting to prevent memory leaks.
- **Authentication Migration**: When Supabase is configured, consider migrating localStorage projects to cloud storage for better persistence and collaboration features.

## UI/UX Patterns

### Loading States
- **SplashScreen**: Initial app load animation with logo and progress
- **WelcomeScreen**: First-time user experience with project creation options
- **SkeletonLoader**: Content placeholders during async operations

### User Feedback
- **Toast**: Non-blocking notifications for success/error/warning/info messages (3-second auto-dismiss)
- **Progress Callbacks**: All AI generation functions provide real-time progress updates

### Responsive Design
- **Sidebar Collapse**: Toggle between expanded (256px) and collapsed (80px) states
- **Fixed Navbar**: Persistent header with theme toggle and sync indicator
- **Gradient Halos**: Decorative background elements for visual depth

## Recent Enhancements

### DirectorWidget Premium UI (Latest)
The DirectorWidget has been enhanced with a premium glassmorphic UI featuring:
- **Modern Chat Interface**: Gradient backgrounds, glassmorphism effects, and smooth animations
- **Enhanced Command System**: Extended natural language parsing for technical cinematography queries
- **Inline Image Display**: Generated images appear directly in chat with grid layout
- **Prompt Viewing**: Stored prompts can be reviewed and copied via modal
- **Technical Calculations**: Real-time DOF calculations with hyperfocal distance formulas
- **Command Hints**: Contextual examples displayed in the input footer

The "Send" button has been fixed to use proper Framer Motion integration and improved disabled state styling.