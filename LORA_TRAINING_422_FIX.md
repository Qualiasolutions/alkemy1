# LoRA Training 422 Error Fix

**Date**: 2025-11-18
**Issue**: POST https://alkemy1.vercel.app/api/fal-proxy 422 (Unprocessable Content)
**Status**: ✅ FIXED AND DEPLOYED

## Problem Summary

The FAL.ai LoRA training endpoint was returning a 422 error when users attempted to train character identities. The root cause was a type mismatch in the API request payload.

### Root Cause

The FAL.ai API endpoint `/fal-ai/flux-lora-fast-training` requires:
- **Parameter**: `images_data_url`
- **Expected Type**: `string` (single URL to a ZIP file containing training images)
- **Actual Type Sent**: `string[]` (array of individual image URLs)

This caused the FAL API to reject the request with:
```json
{
  "errors": [
    {
      "loc": ["body", "images_data_url"],
      "msg": "str type expected",
      "type": "type_error.str"
    }
  ]
}
```

### Code Location

**File**: `services/characterIdentityService.ts`
**Function**: `createFalCharacter()` (line 430-488)
**Issue Line**: Line 447 (old code)

**Before (Incorrect)**:
```typescript
body: JSON.stringify({
    endpoint: '/fal-ai/flux-lora-fast-training',
    method: 'POST',
    body: {
        images_data_url: referenceUrls,  // ❌ Array of strings
        steps: 1000,
        is_input_format_already_preprocessed: false,
    }
})
```

**After (Fixed)**:
```typescript
// Step 1: Create ZIP file from reference images
const zipBlob = await createTrainingZip(referenceUrls, onProgress);

// Step 2: Upload ZIP to Supabase Storage
const zipUrl = await uploadZipToStorage(zipBlob, onProgress);

// Step 3: Call FAL API with ZIP URL
body: JSON.stringify({
    endpoint: '/fal-ai/flux-lora-fast-training',
    method: 'POST',
    body: {
        images_data_url: zipUrl,  // ✅ Single ZIP URL
        steps: 1000,
        is_input_format_already_preprocessed: false,
    }
})
```

## Implementation Details

### 1. Added JSZip Dependency
```bash
npm install jszip
```
- Bundle size: 97.04 KB gzipped
- Used for in-browser ZIP creation

### 2. Created ZIP Creation Function

**Function**: `createTrainingZip(imageUrls: string[], onProgress)`
**Location**: `characterIdentityService.ts` lines 422-481

**Features**:
- Downloads all reference images from Supabase URLs
- Packages them into a single ZIP file with sequential naming (`image_001.jpg`, `image_002.jpg`, etc.)
- DEFLATE compression (level 6)
- Progress callbacks during packaging
- Error handling for failed downloads

### 3. Created ZIP Upload Function

**Function**: `uploadZipToStorage(zipBlob: Blob, onProgress)`
**Location**: `characterIdentityService.ts` lines 483-531

**Features**:
- Uploads ZIP to Supabase Storage `character-references` bucket
- Path: `{userId}/lora-training/training_{timestamp}.zip`
- Returns public URL for FAL API to download
- Authentication check (user must be logged in)
- Progress callbacks during upload

### 4. Updated Supabase Storage Configuration

**Bucket**: `character-references`

**Updated Settings**:
```sql
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/zip'],
  file_size_limit = 52428800  -- 50MB
WHERE name = 'character-references';
```

**Changes**:
- ✅ Added `application/zip` to allowed MIME types
- ✅ Increased file size limit from 10MB to 50MB (accommodates ZIP with 6-12 images)

### 5. Updated Progress Flow

**New Progress Stages**:
1. 30-35%: "Downloading training images..."
2. 35-45%: "Packaging image X/Y..."
3. 45-48%: "Creating training archive..."
4. 48-52%: "Training archive ready"
5. 52-58%: "Uploading training data..."
6. 58-60%: "Getting training data URL..."
7. 60-90%: "Starting LoRA training..."
8. 90-100%: "Finalizing advanced character identity..."

## Testing

### Unit Tests
```bash
npm test -- characterIdentityService.test.ts --run
```
**Result**: ✅ All 18 tests passing

### Build Test
```bash
npm run build
```
**Result**: ✅ Build successful in 16.56s
- JSZip properly bundled (97.04 KB gzipped)
- No TypeScript errors
- Total bundle: 1.72 MB (137.51 KB gzipped)

### Deployment Test
```bash
vercel --prod --yes
```
**Result**: ✅ Deployed successfully
- URL: https://alkemy1-d4u5xxlyh-qualiasolutionscy.vercel.app
- Build time: 43s
- All environment variables verified

## Verification Checklist

- [x] JSZip dependency installed
- [x] `createTrainingZip()` implemented with error handling
- [x] `uploadZipToStorage()` implemented with authentication
- [x] `createFalCharacter()` updated to use ZIP workflow
- [x] Supabase bucket configured for ZIP uploads (50MB limit)
- [x] All unit tests passing (18/18)
- [x] Production build successful
- [x] Deployed to production
- [x] Environment variables verified (FAL_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

## Expected Behavior After Fix

### User Workflow
1. User uploads 6-12 reference images for character identity training
2. Images are validated (format, size, resolution)
3. **NEW**: Images are downloaded and packaged into ZIP file (progress: 30-48%)
4. **NEW**: ZIP is uploaded to Supabase Storage (progress: 48-58%)
5. **NEW**: ZIP public URL is sent to FAL API (progress: 60%)
6. FAL API accepts request and starts LoRA training (5-10 minutes)
7. LoRA weights URL is returned and stored in character identity

### API Call Flow
```
Client → characterIdentityService.prepareCharacterIdentity()
  → uploadReferenceImages() [Supabase Storage]
  → createFalCharacter()
    → createTrainingZip() [JSZip]
    → uploadZipToStorage() [Supabase Storage]
    → fetch('/api/fal-proxy') with ZIP URL ✅
      → FAL API: /fal-ai/flux-lora-fast-training ✅
        → Returns LoRA weights URL
```

## Rollback Plan (if needed)

If issues occur, rollback to previous deployment:
```bash
vercel rollback https://alkemy1-gb0wz474e-qualiasolutionscy.vercel.app
```

## Related Files Modified

1. `services/characterIdentityService.ts` - Main implementation
2. `package.json` - Added jszip dependency
3. `package-lock.json` - Dependency lockfile updated
4. Supabase `storage.buckets` table - Configuration updated

## Performance Impact

- **Additional Network Overhead**: ~2-5 seconds for ZIP creation and upload
- **Storage Usage**: ~5-20 MB per training session (ZIP files)
- **Bundle Size Increase**: +97 KB gzipped (JSZip library)
- **Build Time**: No significant change (~16-20 seconds)

## Future Improvements

1. **ZIP Cleanup**: Implement automatic deletion of training ZIPs after 24 hours to save storage
2. **Compression Optimization**: Test different compression levels for optimal upload speed
3. **Parallel Processing**: Consider Web Workers for ZIP creation to avoid blocking UI
4. **Progress Granularity**: Add more detailed progress for individual image downloads
5. **Caching**: Cache ZIP files locally to avoid re-upload for retry scenarios

## References

- FAL.ai API Documentation: https://fal.ai/models/fal-ai/flux-lora-fast-training
- JSZip Documentation: https://stuk.github.io/jszip/
- Supabase Storage Documentation: https://supabase.com/docs/guides/storage

---

**Fix Verified By**: Claude (James - Developer Agent)
**Deployment Status**: ✅ Live in Production
**Production URL**: https://alkemy1-d4u5xxlyh-qualiasolutionscy.vercel.app
