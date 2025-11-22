# Architecture

## Executive Summary

Alkemy is a "Studio in a Box" AI video production platform designed for professional producers. It orchestrates a linear production workflow—from script to final render—integrating multiple AI models (LLMs for script/prompts, Image Gen for assets, Video Gen for animation) into a cohesive SaaS application. The architecture prioritizes **workflow state management**, **character consistency**, and **asynchronous AI job orchestration** to handle the latency of generative tasks.

We utilize a **Client-Server (BaaS)** architecture with **Supabase** as the backend-as-a-service, leveraging its Auth, Database, and Edge Functions. The frontend is a **React** Single Page Application (SPA) built with **Vite**, designed for high interactivity and 3D visualization.

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| **Structure** | Feature-based Monorepo-style | 1.0 | All | Groups code by workflow phase (Script, Assets, Stage) for maintainability. |
| **State** | Zustand + React Query | 1.0 | All | Zustand for complex client UI state; React Query for server data syncing. |
| **AI Async** | DB-Queue + Edge Functions | 1.0 | Asset Gen | Reliable handling of long-running AI generation jobs without timeouts. |
| **3D Engine** | React Three Fiber (R3F) | 1.0 | Stage | Standard, declarative way to integrate Three.js into React. |
| **Styling** | Tailwind + Shadcn/UI | 1.0 | UI/UX | Rapid development with consistent, customizable "Cyberpunk" theming. |
| **Database** | Supabase (PostgreSQL) | 1.0 | Data | Relational integrity for complex project/asset relationships. |

## Project Structure

```
/src
  /app              # Application routing and layout
  /components       # Shared UI components (atoms/molecules)
    /ui             # Shadcn/UI primitives
    /shared         # App-specific shared components
  /features         # Feature-based modules (The "Studio" Phases)
    /script         # Scriptwriting & breakdown logic
    /assets         # Asset generation & management
    /stage          # 3D visualization & blocking
    /composite      # Composition & layering
    /animate        # Video generation & motion
    /timeline       # NLE-style timeline editing
  /lib              # Core utilities and configurations
    /api            # Supabase client & API wrappers
    /store          # Global state stores (Zustand)
    /utils          # Helper functions
  /types            # TypeScript definitions
  /hooks            # Shared custom hooks
```

## Epic to Architecture Mapping

| Epic | Architecture Component | Key Pattern |
| ---- | ---------------------- | ----------- |
| **E1: Project Initialization** | `features/project`, `lib/api` | CRUD + RLS Policies |
| **E2: Script & Breakdown** | `features/script`, `Edge Functions` | LLM Streaming Response |
| **E3: Asset Generation** | `features/assets`, `DB Queue` | Async Job Polling |
| **E4: 3D Staging** | `features/stage`, `R3F` | Declarative 3D Scene |
| **E5: Animation** | `features/animate`, `Edge Functions` | Video Gen API Integration |

## Technology Stack Details

### Core Technologies

- **Frontend Framework:** React 18+ (Vite)
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS, Class Variance Authority (CVA)
- **State Management:** Zustand (Client), TanStack Query (Server)
- **3D Library:** React Three Fiber (Three.js), Drei
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI Integration:** Supabase Edge Functions (Deno) calling external APIs (OpenAI, Replicate, Fal.ai)

### Integration Points

- **Authentication:** Supabase Auth (Email/Password, OAuth)
- **Database:** Supabase PostgreSQL (Direct client access via RLS)
- **File Storage:** Supabase Storage (Buckets for `assets`, `renders`)
- **AI Models:**
    - **LLM:** OpenAI / Anthropic (via Edge Functions)
    - **Image:** Fal.ai / Replicate (Flux/InstantID)
    - **Video:** Runway / Luma / Kling (via API)

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### 1. The "Async Job" Pattern (for AI Generation)
AI generation takes time. We do NOT keep HTTP connections open.
1.  **Client** calls Edge Function `start-generation`.
2.  **Edge Function** inserts row into `generations` table with status `pending` and calls AI provider webhook.
3.  **Client** subscribes to `generations` table changes (Realtime) OR polls.
4.  **AI Provider** calls webhook -> updates `generations` row to `completed` + URL.
5.  **Client** sees update and displays result.

### 2. The "Feature Slice" Pattern
Code related to a specific workflow phase stays together.
- `src/features/script/components/ScriptEditor.tsx`
- `src/features/script/hooks/useScriptGen.ts`
- `src/features/script/store/scriptStore.ts`

### 3. The "Optimistic UI" Pattern
For standard CRUD (renaming, moving items), update UI immediately, then sync.
- Use `useMutation` with `onMutate` to update cache.

## Consistency Rules

### Naming Conventions

- **Files:** `camelCase.ts`, `PascalCase.tsx` (Components)
- **Directories:** `kebab-case`
- **Variables:** `camelCase`
- **Types/Interfaces:** `PascalCase` (Prefix `I` is forbidden)
- **Constants:** `UPPER_SNAKE_CASE`

### Code Organization

- **Barrel Files:** Use `index.ts` only for public API of a feature/module.
- **Imports:** Absolute imports `@/components/...` preferred over relative `../../`.

### Error Handling

- **API:** All API calls must be wrapped in `try/catch` or handled by React Query `onError`.
- **UI:** Use `ErrorBoundary` components for feature-level isolation.
- **User Feedback:** Use `toast` notifications for errors (Shadcn Toast).

### Logging Strategy

- **Development:** `console.log` allowed but should be stripped in prod.
- **Production:** Structured logging to Supabase or external monitoring (e.g., Sentry) for critical failures.

## Data Architecture

### Core Models (Supabase)

- `projects`: (id, user_id, name, settings, created_at)
- `scripts`: (id, project_id, content, scenes_json)
- `assets`: (id, project_id, type, url, prompt, metadata, status)
- `generations`: (id, asset_id, provider_id, status, result_url)
- `scenes`: (id, project_id, order, layout_data_json)

## API Contracts

- **Standard:** Supabase JS Client (`supabase.from('table').select()`)
- **Edge Functions:** RESTful style
    - `POST /functions/v1/generate-script`
    - `POST /functions/v1/generate-asset`

## Security Architecture

- **Row Level Security (RLS):** ENABLED on ALL tables.
    - Policy: `Users can only view/edit their own project data.`
- **Environment Variables:**
    - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Public)
    - `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `REPLICATE_API_TOKEN` (Private/Backend only)

## Performance Considerations

- **Asset Optimization:** Use optimized image formats (WebP) and CDN (Supabase Storage).
- **Lazy Loading:** Lazy load heavy 3D components (`React.lazy`) and feature routes.
- **Query Caching:** Aggressive caching of project data with React Query.

## Deployment Architecture

- **Frontend:** Vercel (Git integration, auto-deploy).
- **Backend:** Supabase (Managed Platform).
- **CI/CD:** GitHub Actions (Lint, Type Check, Build).

## Development Environment

### Prerequisites

- Node.js 20+
- pnpm (preferred) or npm
- Supabase CLI (for local dev/migrations)

### Setup Commands

```bash
# Install dependencies
pnpm install

# Start local dev server
pnpm dev

# Start local Supabase (optional, if using local db)
supabase start
```

## Architecture Decision Records (ADRs)

- **ADR-001: Use Supabase.** Chosen for speed of delivery, built-in Auth/DB/Storage/Realtime, and "Boring Tech" stability.
- **ADR-002: Feature-based Structure.** Chosen to manage complexity of distinct production phases.
- **ADR-003: Async AI Pattern.** Chosen to prevent timeout issues with long-running generation tasks.

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-11-22_
_For: Qualia_
