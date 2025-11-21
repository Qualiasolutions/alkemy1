# GEMINI.md - Alkemy AI Studio V2.0 Context

## 🚀 Project Overview
**Alkemy AI Studio V2.0** is a production-grade AI-powered film generation platform. It transforms text scripts into complete visual productions using a suite of generative AI models.
- **Production URL**: https://alkemy1-7ait0xi2i-qualiasolutionscy.vercel.app
- **Status**: V2.0 Production (Live)

## 🛠 Technology Stack
- **Frontend**: React 19.2, TypeScript 5.8, Vite 6, TailwindCSS 4.
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time).
- **AI Services**:
    - **Script Analysis**: Google Gemini 2.5 Pro.
    - **Image Gen**: Fal.ai (Flux), Pollinations (fallback).
    - **Video Gen**: Veo 3.1, HuggingFace, Luma.
    - **Character Consistency**: Fal.ai LoRA training.
- **State Management**: Centralized `App.tsx` state + Supabase for persistence + Optimistic updates.
- **Testing**: Vitest, React Testing Library.

## 📋 BMAD Project Tracking (CRITICAL)
This project uses **BMAD (Bi-directional Markdown Alignment Database)** for project management. You **MUST** adhere to this workflow.

### Core Rules
1.  **Check Status First**: Before starting work, read `docs/BMAD_STATUS.md` and the relevant story file in `docs/stories/`.
2.  **Update Documentation**: Work is tracked in markdown frontmatter.
    - Start task: Update `status: in_progress` in the story file.
    - Complete task: Update `status: complete`, `progress: 100`, and check off ACs (Acceptance Criteria).
3.  **Sync Frequently**: Run `npm run bmad:sync` after *any* change to a story file to sync it with the Supabase database.

### Key Commands
- `npm run bmad:status`: View current project status.
- `npm run bmad:sync`: Sync Markdown files ↔ Supabase.
- `npm run bmad:validate`: Check for drift between docs and DB.
- `npm run bmad:fix`: Fix story status inconsistencies.

## 💻 Development Workflow

### Standard Commands
- **Start Dev Server**: `npm run dev` (http://localhost:5173)
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Test**: `npm test` (Vitest)
- **Lint**: `npm run lint` (Biome)
- **Type Check**: `npm run type-check`

### Directory Structure
- `/src/services/`: Core logic (AI integrations, DB calls). **Keep isolated from UI.**
- `/src/tabs/`: Main application views (ScriptTab, MoodboardTab, etc.).
- `/src/components/`: Reusable UI components (Radix UI based).
- `/docs/stories/`: Source of truth for tasks/stories (BMAD).
- `/supabase/migrations/`: Database schema changes.

## 🏗 Architecture Highlights
- **Tab-Based UI**: The app is divided into production phases (Script -> Moodboard -> Cast -> Scenes -> Post).
- **Service Layer**: All external API interactions happen in `src/services/` (e.g., `aiService.ts`, `supabase.ts`).
- **Character Identity**: Uses LoRA training via Fal.ai. Identity state flows from `CastLocationsTab` -> `CastLocationGenerator`.
- **Optimistic Saves**: `saveManager.ts` handles debounced saves to Supabase (5s window).

## 📝 Coding Conventions
- **Style**: Functional React, Hooks, Strict TypeScript.
- **Async**: Use `async/await` over `.then()`.
- **Error Handling**: Services throw errors; Components catch and display via UI (Sonner toasts).
- **Comments**: Use JSDoc for exported service functions.

## 🔑 Environment Variables
Required in `.env.local`:
- `VITE_GEMINI_API_KEY`
- `GEMINI_API_KEY`
- `FAL_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
