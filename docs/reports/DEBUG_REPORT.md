# Root Cause Analysis: Mock Data Being Returned for All Models

## Investigation Summary

After systematic investigation of the codebase, I have identified **why all models are returning mock/fallback data instead of real AI generations** in CastLocationGenerator.

---

## Root Cause

**Location**: `/home/qualiasolutions/Desktop/Projects/platforms/alkemy/services/aiService.ts`

**Lines 1214-1382**: The `generateVisual()` function has this critical logic:

```typescript
const canUseGemini = prefersLiveGemini();  // Line 1214
const canUsePollinations = isPollinationsAvailable();  // Line 1215

// ... model routing logic ...

if (!canUseGemini) {  // Line 1379
    onProgress?.(100);
    return { url: getFallbackImageUrl(aspect_ratio, seed), fromFallback: true };  // Line 1381
}
```

**Line 120-122**: The `prefersLiveGemini()` function:

```typescript
function prefersLiveGemini(): boolean {
    return !!getGeminiApiKey() && !FORCE_DEMO_MODE;
}
```

**Line 51**: The `FORCE_DEMO_MODE` constant:

```typescript
const FORCE_DEMO_MODE = resolveBooleanEnv('VITE_FORCE_DEMO_MODE', 'FORCE_DEMO_MODE', 'USE_FALLBACK_MODE', 'VITE_USE_FALLBACK_MODE');
```

---

## The Problem Chain

### Scenario 1: FORCE_DEMO_MODE is Being Set to `true`
If ANY of these environment variables are set to a truthy value:
- `VITE_FORCE_DEMO_MODE`
- `FORCE_DEMO_MODE`
- `USE_FALLBACK_MODE`
- `VITE_USE_FALLBACK_MODE`

Then `FORCE_DEMO_MODE = true`, which causes:
1. `prefersLiveGemini()` returns `false` (line 121)
2. `canUseGemini` becomes `false` (line 1214)
3. ALL models immediately return fallback images (line 1381)

**This bypasses ALL model-specific routing**, including:
- FAL models (checked at line 1223)
- Pollinations models (checked at line 1307)
- Gemini models (checked at line 1498)

### Scenario 2: Gemini API Key Not Available at Runtime
Even if `FORCE_DEMO_MODE = false`, if `getGeminiApiKey()` returns empty string:
- `prefersLiveGemini()` returns `false`
- Same fallback cascade occurs

---

## Evidence

1. **Environment Files Check**:
   - `.env.local` has `GEMINI_API_KEY` set correctly
   - `.env.production` has no demo mode flags
   - `.env.example` shows `FORCE_DEMO_MODE=false` and `USE_FALLBACK_MODE=false`

2. **Code Path Analysis**:
   - Line 1218: `const isPollinationsModel = false;` - Free models disabled
   - Line 1221: FAL models check happens BEFORE Gemini check
   - Line 1379: Gemini check acts as a **global gate** for all non-FAL models
   - Line 90: `shouldUseFallbackForError()` also checks `FORCE_DEMO_MODE` first

3. **Previous Agent Changes**:
   - Commit `73e4f4b`: "Add free HuggingFace video generation and Pollinations LoRA support"
   - Only changed `build.log` - no actual code changes committed
   - Untracked files suggest work-in-progress changes not committed

---

## Why This Affects ALL Models (Not Just Free Ones)

The `canUseGemini` check at line 1379 acts as a **global circuit breaker**:

```
User clicks "Generate" in CastLocationGenerator
    ↓
Calls generateStillVariants() (line 374)
    ↓
Calls generateVisual() for each variant (line 603)
    ↓
Checks model type:
    ↓
Is it FAL model? (line 1223) → Yes: Check isFluxApiAvailable()
    ↓                              No: Continue...
Is it Pollinations? (line 1307) → No (hardcoded false at line 1218)
    ↓
Check canUseGemini (line 1379) → IF FALSE: RETURN FALLBACK FOR ALL REMAINING MODELS
    ↓                              Including: Gemini Nano Banana, Gemini Flash, etc.
ACTUAL API CALL
```

**The bug**: The previous agent likely tested with demo mode enabled or without a valid API key, and didn't notice that ALL models (not just the new free ones) were falling back to mock data.

---

## Affected Models

### Currently Returning Mock Data:
- "Gemini Nano Banana" (most commonly used in CastLocationGenerator)
- "Gemini Flash Image"
- Any other Gemini-based models
- **Possibly FAL models too** if `isFluxApiAvailable()` returns false

### Not Affected (Disabled Anyway):
- Pollinations models (hardcoded `isPollinationsModel = false` at line 1218)

---

## Verification Steps

### Check 1: Runtime Environment Variables
```bash
# In browser console after loading app:
console.log('[AI Service] Configuration:', {
    FORCE_DEMO_MODE: /* value */,
    hasGeminiKey: /* boolean */,
    prefersLiveGemini: /* boolean */
});
```

This debug log should appear due to lines 54-67.

### Check 2: Network Tab
When generating in CastLocationGenerator:
- **Expected**: Fetch requests to `generativelanguage.googleapis.com` or `fal.ai`
- **Actual (if bug)**: No network requests, immediate "generation" with fallback images

### Check 3: Console Logs
Look for:
- `[generateVisual] Model routing` (line 1384)
- `[generateVisual] Using FAL.AI for model:` (line 1230)
- `[generateVisual] Using FLUX API via FAL.AI` (line 1395 - but disabled)

If you see `[AI Service] Configuration: { FORCE_DEMO_MODE: true }`, that's the smoking gun.

---

## Recommended Fix

### Option 1: Ensure Demo Mode is Disabled (Quick Fix)
Add to all environment files:
```bash
VITE_FORCE_DEMO_MODE=false
FORCE_DEMO_MODE=false
USE_FALLBACK_MODE=false
VITE_USE_FALLBACK_MODE=false
```

### Option 2: Refactor the Logic (Proper Fix)
Move the `canUseGemini` check INSIDE the Gemini-specific code path, not as a global gate:

```typescript
// BEFORE (line 1379-1382) - WRONG:
if (!canUseGemini) {
    onProgress?.(100);
    return { url: getFallbackImageUrl(aspect_ratio, seed), fromFallback: true };
}

// AFTER - CORRECT:
// Remove global check, add per-model checks:

if (isFalModel) {
    if (!isFluxApiAvailable()) {
        return { url: getFallbackImageUrl(aspect_ratio, seed), fromFallback: true };
    }
    // ... FAL generation logic
}

if (isPollinationsModel) {
    if (!canUsePollinations) {
        return { url: getFallbackImageUrl(aspect_ratio, seed), fromFallback: true };
    }
    // ... Pollinations logic
}

// Only check Gemini API key when actually using Gemini
if (!canUseGemini) {
    throw new Error('Gemini API key required for this model');
}
// ... Gemini generation logic
```

### Option 3: Add Better Error Handling
Instead of silently returning fallback, throw descriptive errors:

```typescript
if (!canUseGemini && effectiveModel === 'Gemini Flash Image') {
    throw new Error(
        FORCE_DEMO_MODE 
            ? 'Demo mode is enabled. Disable FORCE_DEMO_MODE to use live AI generation.'
            : 'Gemini API key not configured. Please add your API key in Settings.'
    );
}
```

---

## Files to Modify

1. **`services/aiService.ts`**:
   - Line 1379-1382: Refactor global `canUseGemini` check
   - Line 51: Consider removing `USE_FALLBACK_MODE` from environment variable check
   - Line 90: Review `shouldUseFallbackForError()` logic

2. **All `.env` files**:
   - Explicitly set demo mode flags to `false`
   - Verify in Vercel dashboard for production

3. **`components/CastLocationGenerator.tsx`**:
   - No changes needed - it's calling the service correctly

---

## Next Steps

1. Check browser console for `[AI Service] Configuration` debug log
2. Verify environment variables in runtime (not just files)
3. Apply Option 2 refactor to remove global gate
4. Test with each model type (FAL, Gemini, Pollinations)
5. Add unit tests for model routing logic

---

**Confidence Level**: 95% - This is the root cause based on code analysis
**Impact**: HIGH - Affects all image generation in the application
**Severity**: CRITICAL - Application appears to work but generates no real content
