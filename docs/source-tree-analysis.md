# alkemy - Source Tree Analysis

**Date:** 2025-11-22

## Overview

The source code is primarily located in the `src` directory, following a standard React application structure.

## Complete Directory Structure

```
src/
├── api/
├── components/
│   ├── 3d/
│   └── ... (UI components)
├── hooks/
├── pages/
├── services/
├── tabs/
├── theme/
├── types/
└── utils/
```

## Critical Directories

### `src/components`

Reusable UI components.
**Contains:** Buttons, Modals, Layouts, and domain-specific widgets.

### `src/pages`

Route-level components.
**Contains:** Main application pages.

### `src/hooks`

Custom React hooks.
**Contains:** Logic reuse (e.g., `useSupabase`, `useTheme`).

### `src/services`

API interaction layer.
**Contains:** Functions to communicate with Supabase and external APIs.

### `src/tabs`

Tab-specific content components.
**Contains:** Logic for different application tabs (e.g., `ScriptTab`, `MoodboardTab`).

## Entry Points

- **Main Entry:** `src/main.tsx`
- **App Root:** `src/App.tsx`

## File Organization Patterns

- Components are generally PascalCase (`MyComponent.tsx`).
- Hooks are camelCase and prefixed with `use` (`useMyHook.ts`).
- Utilities are camelCase (`myUtility.ts`).

## Configuration Files

- `vite.config.ts`: Vite configuration
- `tailwind.config.ts`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration
- `vercel.json`: Vercel deployment configuration

---

_Generated using BMAD Method `document-project` workflow_
