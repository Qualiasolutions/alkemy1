# Story 6.5: Frontend Performance Optimization

**Epic**: Epic 6 - Project Quality Analytics & Feedback
**PRD Reference**: Section 6, Epic 6, Story 6.5 (Technical Debt)
**Status**: ⏳ **PLANNED** - Ready for Sprint 3
**Priority**: Medium (Technical Debt / Performance Enhancement)
**Estimated Effort**: 8 story points (3-5 hours)
**Dependencies**: None (can run in parallel with other stories)
**Last Updated**: 2025-11-12
**QA Gate**: TBD
**Production URL**: https://alkemy1-nzitt6da5-qualiasolutionscy.vercel.app

---

## User Story

**As a** user of Alkemy AI Studio,
**I want** the application to load faster and use less bandwidth,
**So that** I can start creating films quickly without waiting for large bundle downloads.

---

## Business Value

**Problem Statement**:
The current production build has performance issues that impact user experience:
- **Large Bundle Size**: Main chunk is 1.7MB (452KB gzipped), causing slow initial page loads
- **Mixed Imports**: 4 files have both static and dynamic imports, preventing effective code splitting
- **No Lazy Loading**: Heavy dependencies (Three.js, analytics) load immediately even if not used
- **Slow Time-to-Interactive**: Users wait 5-10 seconds on slow connections before app becomes usable

These issues create friction for new users, especially those with slower internet connections or mobile devices.

**Value Proposition**:
Frontend performance optimization will:
- **Reduce Initial Load**: Target <1MB main chunk (350KB gzipped)
- **Faster Time-to-Interactive**: Target <3 seconds on 3G connections
- **Better Code Splitting**: Separate vendor chunks for Three.js (715KB), UI libraries (119KB), React (44KB)
- **Lazy Load Heavy Features**: Load analytics, 3D viewer, WAN Transfer only when tabs are opened
- **Improved User Retention**: Faster load = higher engagement (Google: 53% users abandon if load >3s)

**Success Metric**: Reduce Time-to-Interactive by 40% (from ~5s to ~3s on 3G).

---

## Acceptance Criteria

### AC1: Resolve Dynamic Import Conflicts
**Given** the application has mixed static/dynamic imports,
**When** I build the production bundle,
**Then** all import conflicts should be resolved:

**Files to Fix** (4 total):
1. **`services/supabase.ts`**:
   - Currently: Static imports by 9 files, dynamic by characterIdentityService
   - Fix: Make all imports static OR all dynamic (choose static for consistency)
   - Impact: Supabase client shared across all services

2. **`services/directorKnowledge.ts`**:
   - Currently: Static by aiService, dynamic by DirectorWidget/MiniDirectorWidget
   - Fix: Make all imports static (knowledge base used frequently)
   - Impact: Director widget loads faster

3. **`services/aiService.ts`**:
   - Currently: Static by 6 files, dynamic by DirectorWidget
   - Fix: Make all imports static (core service, always needed)
   - Impact: Central AI service available immediately

4. **`services/wanService.ts`**:
   - Currently: Static by WanTransferTab, dynamic by aiService
   - Fix: Make dynamic import in aiService OR static in both (choose dynamic, WAN rarely used)
   - Impact: WAN service only loads when user opens WAN Transfer tab

**Verification**:
- Run `npm run build`
- Verify 0 dynamic import conflict warnings
- Check bundle analyzer to confirm proper code splitting

---

### AC2: Implement Manual Chunk Splitting
**Given** the application uses large vendor libraries,
**When** I configure Vite build options,
**Then** vendor libraries should be split into separate chunks:

**Target Chunk Structure**:
```
dist/
  ├── index.html (1.5KB)
  ├── assets/
  │   ├── index-[hash].css (134KB → keep as-is)
  │   ├── react-vendor-[hash].js (45KB) ← React + React-DOM
  │   ├── ui-vendor-[hash].js (120KB) ← UI libraries (Radix, Framer Motion)
  │   ├── three-vendor-[hash].js (716KB) ← THREE.JS + dependencies
  │   ├── index-[hash].js (<1MB target) ← Application code
  │   └── [lazy-chunks]-[hash].js ← Lazy-loaded features
```

**Vite Configuration** (`vite.config.ts`):
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            'framer-motion',
            'lucide-react'
          ],
          'three-vendor': [
            'three',
            '@react-three/fiber',
            '@react-three/drei',
            '@react-three/rapier'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 800 // Increase from 500KB to 800KB for three-vendor
  }
});
```

**Verification**:
- Run `npm run build`
- Verify 4-5 separate vendor chunks created
- Verify main `index-[hash].js` is <1MB (uncompressed)
- Check gzip sizes: react-vendor ~16KB, ui-vendor ~40KB, three-vendor ~187KB

---

### AC3: Lazy Load Heavy Features
**Given** the application has heavy features not used immediately,
**When** I implement lazy loading,
**Then** these features should load on-demand:

**Features to Lazy Load**:
1. **Analytics Tab** (~100KB):
   ```typescript
   const AnalyticsTab = React.lazy(() => import('./tabs/AnalyticsTab'));
   ```

2. **3D Viewer** (already dynamic, verify working):
   ```typescript
   const WorldViewer = React.lazy(() => import('./components/WorldViewer'));
   ```

3. **WAN Transfer Tab** (~50KB):
   ```typescript
   const WanTransferTab = React.lazy(() => import('./tabs/WanTransferTab'));
   ```

4. **Character Identity Testing** (~80KB):
   ```typescript
   const CharacterIdentityTestPanel = React.lazy(() => import('./components/CharacterIdentityTestPanel'));
   ```

**Loading Boundaries**:
```typescript
<React.Suspense fallback={<LoadingSpinner />}>
  <AnalyticsTab />
</React.Suspense>
```

**Verification**:
- Open app, verify Network tab shows only core chunks loaded
- Navigate to Analytics tab, verify analytics chunk loads on-demand
- Navigate to WAN Transfer, verify WAN chunk loads on-demand
- Measure Time-to-Interactive: <3s on Fast 3G (Chrome DevTools throttling)

---

### AC4: Optimize Import Paths
**Given** some services import entire libraries,
**When** I refactor to tree-shakeable imports,
**Then** bundle size should reduce:

**Optimizations**:
1. **Lodash imports**: Replace `import _ from 'lodash'` with `import debounce from 'lodash/debounce'`
2. **Lucide icons**: Verify tree-shaking works (Vite should handle automatically)
3. **Radix UI**: Already using individual imports (good!)

**Verification**:
- Search codebase for `import _ from 'lodash'`
- Replace with specific function imports
- Build and verify bundle size reduction (~20KB savings expected)

---

### AC5: Reduce Bundle Size to Target
**Given** current bundle is 1.7MB uncompressed,
**When** all optimizations are applied,
**Then** bundle size should meet targets:

**Target Sizes**:
- **Main chunk**: <1MB uncompressed (<350KB gzipped)
- **React vendor**: ~45KB uncompressed (~16KB gzipped)
- **UI vendor**: ~120KB uncompressed (~40KB gzipped)
- **Three.js vendor**: ~715KB uncompressed (~187KB gzipped) - acceptable
- **Total initial load**: <900KB uncompressed (<400KB gzipped)

**Current vs. Target**:
| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Main chunk | 1.7MB | 1MB | -41% |
| Initial load (gzipped) | 452KB | 400KB | -12% |
| Time-to-Interactive (3G) | ~5s | ~3s | -40% |

**Verification**:
- Run `npm run build`
- Check `dist/` folder sizes
- Use bundle analyzer: `npm run build -- --mode analyze`
- Lighthouse performance audit: Target score >90

---

## Integration Verification

### IV1: No Regression in Functionality
**Requirement**: Code splitting does not break any existing features.

**Verification Steps**:
1. Test all tabs load correctly (Moodboard, Cast & Locations, Scene Assembler, Analytics, WAN Transfer)
2. Test Director widget works (voice commands, TTS, style learning, continuity checking)
3. Test character identity workflow (upload, train, test, generate)
4. Test 3D world viewer loads when used
5. Test analytics dashboard displays correctly

**Expected Result**: All features work identically to before optimization.

---

### IV2: Performance Metrics Improve
**Requirement**: Performance metrics show measurable improvement.

**Verification Steps**:
1. Run Lighthouse audit BEFORE optimization (baseline)
2. Apply all optimizations
3. Run Lighthouse audit AFTER optimization
4. Compare metrics:
   - **First Contentful Paint (FCP)**: Target <1.5s (was ~2.5s)
   - **Time-to-Interactive (TTI)**: Target <3s (was ~5s)
   - **Total Blocking Time (TBT)**: Target <200ms
   - **Cumulative Layout Shift (CLS)**: Target <0.1
   - **Performance Score**: Target >90 (was ~75)

**Expected Result**: All core web vitals improved by at least 20%.

---

### IV3: Bundle Analyzer Shows Improvements
**Requirement**: Bundle composition is optimized (no duplicate dependencies, proper chunk sizing).

**Verification Steps**:
1. Install bundle analyzer: `npm install -D rollup-plugin-visualizer`
2. Add to `vite.config.ts`:
   ```typescript
   import { visualizer } from 'rollup-plugin-visualizer';

   plugins: [
     visualizer({
       open: true,
       filename: 'dist/stats.html',
       gzipSize: true
     })
   ]
   ```
3. Run build, view `dist/stats.html`
4. Verify:
   - No duplicate dependencies (e.g., two copies of React)
   - Chunk sizes appropriate (no 2MB chunks)
   - Three.js isolated in separate vendor chunk
   - Analytics code in separate lazy chunk

**Expected Result**: Clean bundle structure with appropriate chunk sizing.

---

## Migration/Compatibility

### MC1: Production Deployment Seamless
**Requirement**: Optimizations deploy without breaking production.

**Verification Steps**:
1. Deploy optimized build to staging URL
2. Test full workflow on staging
3. Monitor for JavaScript errors in console
4. Check Vercel deployment logs for errors
5. If all passes, deploy to production

**Expected Result**: Zero-downtime deployment, no user-facing errors.

---

### MC2: Cache Invalidation Works
**Requirement**: Users get new optimized bundles (not cached old versions).

**Verification Steps**:
1. Deploy optimized build
2. Clear browser cache, reload
3. Check Network tab: verify new chunk filenames (new hashes)
4. Verify old chunks no longer requested

**Expected Result**: Users automatically receive optimized bundles via hash-based cache busting.

---

## Technical Implementation Notes

### File Changes Required

**1. `vite.config.ts`** - Add manual chunk splitting:
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            'framer-motion',
            'lucide-react'
          ],
          'three-vendor': [
            'three',
            '@react-three/fiber',
            '@react-three/drei',
            '@react-three/rapier'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 800
  }
});
```

**2. `App.tsx`** - Add lazy loading for heavy tabs:
```typescript
import React, { lazy, Suspense } from 'react';

// Lazy load heavy components
const AnalyticsTab = lazy(() => import('./tabs/AnalyticsTab'));
const WanTransferTab = lazy(() => import('./tabs/WanTransferTab'));

// In render
<Suspense fallback={<LoadingSpinner />}>
  <AnalyticsTab />
</Suspense>
```

**3. `services/characterIdentityService.ts`** - Fix dynamic supabase import:
```typescript
// Remove dynamic import
// const { supabase } = await import('./supabase');

// Use static import
import { supabase } from './supabase';
```

**4. `components/DirectorWidget.tsx`** - Fix dynamic imports:
```typescript
// Keep static imports for frequently used services
import { aiService } from '../services/aiService';
import { directorKnowledge } from '../services/directorKnowledge';
```

**5. `services/aiService.ts`** - Keep WAN dynamic (rarely used):
```typescript
// Keep dynamic import for WAN (rarely used)
if (transferType === 'wan') {
  const { wanService } = await import('./wanService');
  return wanService.generateWanTransferEffect(...);
}
```

### Performance Monitoring

**Add Performance Tracking**:
```typescript
// Track bundle loading performance
if ('performance' in window) {
  window.addEventListener('load', () => {
    const perfData = window.performance.getEntriesByType('navigation')[0];
    console.log('Time to Interactive:', perfData.domInteractive);
    console.log('Total Load Time:', perfData.loadEventEnd);
  });
}
```

### Build Script Updates

**Add bundle analysis script** (`package.json`):
```json
{
  "scripts": {
    "build": "vite build",
    "build:analyze": "vite build --mode analyze",
    "preview": "vite preview"
  }
}
```

---

## Definition of Done

- [ ] All 4 dynamic import conflicts resolved
- [ ] Manual chunk splitting configured in `vite.config.ts`
- [ ] Lazy loading implemented for Analytics, WAN Transfer tabs
- [ ] Import paths optimized (tree-shakeable Lodash imports)
- [ ] Bundle size reduced to <1MB main chunk (<350KB gzipped)
- [ ] Time-to-Interactive <3s on Fast 3G
- [ ] Lighthouse performance score >90
- [ ] No regressions in functionality (all features work)
- [ ] Bundle analyzer shows clean chunk structure
- [ ] Production deployment successful
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

## Dependencies

### Prerequisite
- None (technical debt story, independent)

### Related Stories
- **Story 6.1** (Creative Quality Analysis): Benefits from faster analytics tab loading
- **Story 6.2** (Technical Performance Metrics): Same analytics tab optimization

### Tools Required
- Bundle analyzer: `rollup-plugin-visualizer`
- Lighthouse CLI (optional): `npm install -g lighthouse`

---

## Testing Strategy

### Unit Tests
- Not applicable (build optimization, no logic changes)

### Integration Tests
- Verify all tabs load correctly after code splitting
- Test lazy-loaded components render properly

### Performance Tests
- Lighthouse audits (before/after comparison)
- WebPageTest analysis (3G Fast profile)
- Bundle size tracking (CI integration)

### Manual Testing
- Test full application workflow on slow connection (Chrome DevTools: Fast 3G throttling)
- Verify no JavaScript errors in console
- Test on real mobile device (iOS Safari, Android Chrome)

---

## References

- **Vite Docs**: https://vitejs.dev/guide/build.html#chunking-strategy
- **React.lazy**: https://react.dev/reference/react/lazy
- **Web Vitals**: https://web.dev/vitals/
- **Bundle Analyzer**: https://www.npmjs.com/package/rollup-plugin-visualizer

---

**END OF STORY**

*Next Steps: Implement code splitting and lazy loading, measure performance improvements, deploy optimized bundle.*
