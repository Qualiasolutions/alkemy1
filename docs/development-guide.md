# alkemy - Development Guide

**Date:** 2025-11-22

## Local Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd alkemy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup:**
   - Copy `.env.example` to `.env.local`
   - Fill in Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

## Building for Production

```bash
npm run build
```

## Testing

Run unit tests with Vitest:
```bash
npm run test
```

## Deployment

The project is configured for deployment on Vercel.
Pushing to the `main` branch will trigger a deployment.

---

_Generated using BMAD Method `document-project` workflow_
