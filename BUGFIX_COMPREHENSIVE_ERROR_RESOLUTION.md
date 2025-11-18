# Comprehensive Error Resolution - Alkemy AI Studio

## Date: 2025-11-18
## Status: ANALYSIS COMPLETE - FIXES READY

---

## Error Summary

### 1. Database Migration Error
**Error**: "[SaveManager] Project metadata update skipped - columns not in database"
**Location**: `services/saveManager.ts:290`
**Root Cause**: Production database missing columns from migration 005 (user_preferences and save tracking)
**Impact**: Save tracking metadata not being persisted (non-critical, but causes warnings)

### 2. Gemini API 400 Errors
**Error**: "Failed to load resource: the server responded with a status of 400 ()" for generateMoodboardDescription
**Location**: `services/aiService.ts:1679`
**Root Cause**: API call using deprecated method `ai.models.generateContent()` instead of getting model first
**Impact**: Moodboard description generation fails

### 3. Reference Images Limit Error
**Error**: "[generateVisual] Too many reference images (6). Maximum is 5."
**Location**: `services/aiService.ts:1192-1198`
**Root Cause**: Conflict between two MAX_REFERENCE_IMAGES constants (5 vs 8)
**Impact**: Character generation with 6+ moodboard images fails

### 4. Veo API Rate Limiting
**Error**: "Failed to load resource: the server responded with a status of 429 ()"
**Location**: Video generation endpoints
**Root Cause**: No exponential backoff or retry logic for rate-limited requests
**Impact**: Video generation fails during high usage periods

### 5. TypeError in Video Animation
**Error**: "TypeError: Et(...).map is not a function" in animateFrame fallback
**Location**: `services/aiService.ts:866` (minified stack trace)
**Root Cause**: `getFallbackVideoBlobs()` might return non-array or undefined
**Impact**: Fallback video generation crashes

### 6. TypeError in Video Analysis
**Error**: "TypeError: Ie(...).getGenerativeModel is not a function"
**Location**: `services/aiService.ts:2129`
**Root Cause**: `requireGeminiClient()` returns `GoogleGenAI` but code calls `.getGenerativeModel()` directly
**Impact**: Video analysis feature broken

### 7. Missing API Keys
**Error**: "Pexels API key not configured" and "Unsplash API key not configured"
**Location**: `services/imageSearchService.ts:366`
**Root Cause**: Optional API keys not set in environment
**Impact**: Image search features degraded (expected - graceful degradation)

---

## Detailed Root Cause Analysis

### Issue 1: Database Migration
**Current State**: 
- Migration file exists: `/supabase/APPLY_MISSING_MIGRATIONS.sql`
- Columns needed: `auto_save_enabled`, `last_manual_save`, `has_unsaved_changes`, `version`, `version_history`
- SaveManager expects these columns but handles missing gracefully

**Fix**: Apply migration to production database via Supabase SQL Editor

### Issue 2: Gemini API 400 Error
**Current Code** (line 1679):
```typescript
const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
});
```

**Problem**: Incorrect API usage - should get model first, then call generateContent

**Correct Pattern** (from other functions):
```typescript
const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
const response = await model.generateContent(contents);
```

### Issue 3: Reference Images Limit Conflict
**Conflict**:
- Line 561: `const MAX_REFERENCE_IMAGES = 8;` (generateStillVariants function)
- Line 1192: `const MAX_REFERENCE_IMAGES = 5;` (generateVisual function)

**Problem**: When `generateStillVariants` passes 6-8 images to `generateVisual`, validation throws error

**Solution**: Increase limit to 8 for Gemini multimodal OR slice images before passing

### Issue 4: Veo Rate Limiting
**Current Code**: No retry logic for 429 errors

**Needed**: Exponential backoff retry strategy:
```typescript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000);
        continue;
      }
      throw error;
    }
  }
}
```

### Issue 5: AnimateFrame Fallback TypeError
**Current Code** (line 865-866):
```typescript
const fallbackBlobs = getFallbackVideoBlobs(n, `fallback-animate-${prompt}-${reference_image_url ?? 'none'}`);
return fallbackBlobs.map(blob => URL.createObjectURL(blob));
```

**Problem**: If `getFallbackVideoBlobs` returns undefined/null, `.map()` throws TypeError

**Solution**: Add null check:
```typescript
const fallbackBlobs = getFallbackVideoBlobs(n, `fallback-animate-${prompt}-${reference_image_url ?? 'none'}`);
if (!fallbackBlobs || !Array.isArray(fallbackBlobs)) {
  return [];
}
return fallbackBlobs.map(blob => URL.createObjectURL(blob));
```

### Issue 6: Video Analysis TypeError
**Current Code** (line 2126-2130):
```typescript
const genai = requireGeminiClient();

// Use Flash model for fast video analysis
const model = genai.getGenerativeModel({
    model: 'gemini-2.5-flash-002',
});
```

**Problem**: `GoogleGenAI` class uses different method name

**Investigation Needed**: Check `@google/genai` package documentation for correct method

**Possible Fix**:
```typescript
const genai = requireGeminiClient();
const model = genai.models.get('gemini-2.5-flash-002');
// OR
const model = await genai.getGenerativeModel({ model: 'gemini-2.5-flash-002' });
```

### Issue 7: Missing API Keys (Non-Critical)
**Status**: Expected behavior - graceful degradation implemented
**Action**: Document that VITE_PEXELS_API_KEY and VITE_UNSPLASH_API_KEY are optional

---

## Fix Priority

1. **CRITICAL**: Issue 2 (Gemini API 400) - Breaks moodboard generation
2. **CRITICAL**: Issue 6 (Video analysis TypeError) - Breaks video analysis
3. **HIGH**: Issue 3 (Reference images limit) - Breaks character generation
4. **HIGH**: Issue 5 (Fallback TypeError) - Crashes fallback system
5. **MEDIUM**: Issue 4 (Rate limiting) - Improves reliability
6. **LOW**: Issue 1 (Database migration) - Warning only, not breaking
7. **INFO**: Issue 7 (API keys) - Expected, graceful degradation working

---

## Next Steps

1. Fix Gemini API calls in `generateMoodboardDescription`
2. Fix video analysis `getGenerativeModel` call
3. Fix reference images limit validation
4. Add null checks to fallback functions
5. Implement retry logic for rate limiting
6. Apply database migration
7. Test all fixes

