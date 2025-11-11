# Epic 2 Supabase Backend Setup Guide

**Epic**: 2 - Character Identity Consistency System
**Story**: 2.1 - Character Identity Training/Preparation Workflow
**Date**: 2025-01-11
**Status**: Ready for Execution

## Overview

This guide provides step-by-step instructions to set up the complete Supabase backend for Epic 2 Character Identity System. The frontend code is already production-ready and deployed. This setup will enable the character identity upload workflow to function 100%.

## Prerequisites

✅ **Already Complete**:
- Frontend deployed to Vercel production
- `services/characterIdentityService.ts` implemented with Fal.ai integration
- `components/CharacterIdentityModal.tsx` UI ready
- `tabs/CastLocationsTab.tsx` integrated with identity status tracking
- `supabase/migrations/002_character_identity.sql` migration file ready
- `services/supabase.ts` updated with `getCurrentUserId()` helper function

⏳ **Needs Setup**:
- Supabase database tables (character_identities, character_identity_tests)
- Supabase Storage buckets (character-references, character-models)
- RLS policies for data security
- FAL_API_KEY environment variable in Vercel

## Setup Instructions

### Phase 1: Database Migration (5-10 minutes)

#### Step 1.1: Access Supabase SQL Editor

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project: `uiusqxdyzdkpyngppnwx`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

#### Step 1.2: Run Database Migration

Copy and paste the entire contents of `supabase/migrations/002_character_identity.sql` into the SQL Editor.

**What this creates**:
- `character_identities` table with RLS policies
- `character_identity_tests` table with RLS policies
- Helper function: `get_character_identity_status(user_id, project_id, character_id)`
- Helper function: `get_latest_identity_tests(character_identity_id, limit)`
- Automatic timestamp update trigger
- Indexes for fast lookups

Click **Run** to execute the migration.

#### Step 1.3: Verify Tables Created

Run this verification query in SQL Editor:

```sql
-- Verify tables exist
SELECT table_name, row_security
FROM information_schema.tables t
LEFT JOIN pg_tables pt ON t.table_name = pt.tablename
WHERE t.table_schema = 'public'
  AND t.table_name IN ('character_identities', 'character_identity_tests');

-- Should return 2 rows with row_security = 'enabled'

-- Verify helper functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_character_identity_status', 'get_latest_identity_tests');

-- Should return 2 rows
```

**Expected Output**:
```
table_name                    | row_security
------------------------------|-------------
character_identities          | enabled
character_identity_tests      | enabled

routine_name                     | routine_type
---------------------------------|-------------
get_character_identity_status    | FUNCTION
get_latest_identity_tests        | FUNCTION
```

✅ **Phase 1 Complete**: Database tables and functions created with RLS enabled

---

### Phase 2: Storage Buckets Setup (10-15 minutes)

#### Step 2.1: Create character-references Bucket

1. Navigate to **Storage** in the left sidebar
2. Click **Create new bucket**
3. Configure:
   - **Name**: `character-references`
   - **Public**: ❌ **NO** (keep private)
   - **File size limit**: `10485760` (10MB in bytes)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`
4. Click **Create bucket**

#### Step 2.2: Create character-models Bucket

1. Click **Create new bucket** again
2. Configure:
   - **Name**: `character-models`
   - **Public**: ❌ **NO** (keep private)
   - **File size limit**: `524288000` (500MB in bytes)
   - **Allowed MIME types**: `application/octet-stream,application/json`
3. Click **Create bucket**

#### Step 2.3: Apply RLS Policies to Storage Buckets

Go back to **SQL Editor** and run this SQL to secure the storage buckets:

```sql
-- ============================================================================
-- Storage RLS Policy: character-references
-- ============================================================================

CREATE POLICY character_references_policy ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'character-references' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

COMMENT ON POLICY character_references_policy ON storage.objects IS
  'Users can only access their own character reference images - path must start with user_id';

-- ============================================================================
-- Storage RLS Policy: character-models
-- ============================================================================

CREATE POLICY character_models_policy ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'character-models' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

COMMENT ON POLICY character_models_policy ON storage.objects IS
  'Users can only access their own character models - path must start with user_id';
```

**What these policies do**:
- Enforce that files are uploaded to paths starting with `{user_id}/...`
- Users can only read/write/delete files in their own folder
- Prevents users from accessing other users' character data

#### Step 2.4: Verify Storage Setup

Run this verification query:

```sql
-- Verify buckets created
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name IN ('character-references', 'character-models');

-- Should return 2 rows

-- Verify RLS policies on storage.objects
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname IN ('character_references_policy', 'character_models_policy');

-- Should return 2 rows
```

**Expected Output**:
```
id                     | name                   | public | file_size_limit | allowed_mime_types
-----------------------|------------------------|--------|-----------------|--------------------
character-references   | character-references   | false  | 10485760        | image/jpeg,image/png,image/webp
character-models       | character-models       | false  | 524288000       | application/octet-stream,application/json

policyname                      | cmd
--------------------------------|-----
character_references_policy     | ALL
character_models_policy         | ALL
```

✅ **Phase 2 Complete**: Storage buckets created with RLS policies active

---

### Phase 3: Environment Variables (2 minutes)

#### Step 3.1: Get Fal.ai API Key

1. Go to [fal.ai/dashboard](https://fal.ai/dashboard)
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new API key or copy existing one
5. Copy the key (starts with `fal-`)

#### Step 3.2: Add FAL_API_KEY to Vercel

**Option A: Via Vercel Dashboard** (Recommended)

1. Go to [vercel.com/qualiasolutionscy/alkemy1](https://vercel.com/qualiasolutionscy/alkemy1)
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Configure:
   - **Key**: `FAL_API_KEY`
   - **Value**: `fal-xxxxxxxxxxxxxxxxxxxxxxxx` (your Fal.ai API key)
   - **Environment**: Select **Production**, **Preview**, **Development**
5. Click **Save**

**Option B: Via Vercel CLI**

```bash
# Add FAL_API_KEY to all environments
echo "fal-xxxxxxxxxxxxxxxxxxxxxxxx" | vercel env add FAL_API_KEY production
echo "fal-xxxxxxxxxxxxxxxxxxxxxxxx" | vercel env add FAL_API_KEY preview
echo "fal-xxxxxxxxxxxxxxxxxxxxxxxx" | vercel env add FAL_API_KEY development
```

#### Step 3.3: Verify Environment Variable

After adding, verify it's set:

```bash
vercel env ls
```

You should see:
```
FAL_API_KEY                Encrypted           Production, Preview, Development
VITE_SUPABASE_URL          Encrypted           Production, Preview, Development
VITE_SUPABASE_ANON_KEY     Encrypted           Production, Preview, Development
```

✅ **Phase 3 Complete**: FAL_API_KEY configured in Vercel

---

### Phase 4: Deploy Updated Code (5 minutes)

#### Step 4.1: Commit Changes

The code changes have already been made:
- ✅ `services/supabase.ts` - Added `getCurrentUserId()` helper function
- ✅ All other Epic 2 files already committed

Run these commands to commit and push:

```bash
# Check git status
git status

# Stage changes
git add services/supabase.ts

# Commit with descriptive message
git commit -m "feat(epic-2): add getCurrentUserId helper for character identity storage

- Add getCurrentUserId() export to services/supabase.ts
- Used by characterIdentityService.ts for user-scoped storage uploads
- Enables character reference images to be uploaded to {user_id}/ path
- Required for Supabase Storage RLS policies to work correctly

Epic 2 - Character Identity Consistency System
Story 2.1 - Character Identity Training/Preparation Workflow"

# Push to remote
git push origin main
```

#### Step 4.2: Deploy to Production

The deployment will trigger automatically on push, or you can deploy manually:

```bash
# Manual deployment (if needed)
vercel --prod
```

#### Step 4.3: Verify Deployment

Check deployment status:

```bash
# Get deployment URL and logs
vercel ls

# Inspect latest deployment
vercel inspect https://alkemy1-1vck7oben-qualiasolutionscy.vercel.app --logs
```

✅ **Phase 4 Complete**: Code deployed to production with all Epic 2 features

---

### Phase 5: End-to-End Testing (10-15 minutes)

#### Step 5.1: Test Database Connection

Run this query in Supabase SQL Editor to test the helper function:

```sql
-- Test get_character_identity_status function
SELECT get_character_identity_status(
  auth.uid(),
  'test_project_001',
  'test_character_001'
);

-- Should return 'none' (no identity configured yet)
```

#### Step 5.2: Test Character Identity Upload Workflow

1. Go to production URL: [https://alkemy1-1vck7oben-qualiasolutionscy.vercel.app](https://alkemy1-1vck7oben-qualiasolutionscy.vercel.app)
2. Sign in with your account
3. Navigate to **Cast & Locations** tab
4. Create a new character:
   - Click **Add Character**
   - Name: "Test Character"
   - Description: "Testing Epic 2 character identity"
   - Click **Add Character**

5. Prepare character identity:
   - Hover over the character card
   - Click the **Upload icon** (purple button) in top-left
   - This opens the **Character Identity Modal**

6. Upload reference images:
   - Click **Select Images** or drag & drop
   - Upload 3-5 images of the same person/character
   - Images must be:
     - JPEG, PNG, or WebP format
     - At least 512x512 pixels
     - Less than 10MB each
   - Click **Prepare Identity**

7. Monitor progress:
   - Progress bar should show: "Validating reference images..." (5%)
   - Then: "Uploading image 1 of 3..." (15-45%)
   - Then: "Creating character with Fal.ai..." (50-90%)
   - Finally: "Character identity ready!" (100%)

8. Verify status indicator:
   - Character card should show **green "Identity" badge** (top-right)
   - Status: "ready" with CheckCircleIcon

#### Step 5.3: Verify Data in Supabase

Check that data was saved correctly:

```sql
-- Check character_identities table
SELECT
  id,
  user_id,
  project_id,
  character_id,
  status,
  array_length(reference_image_urls, 1) as num_references,
  created_at,
  training_cost,
  technology_data->>'falCharacterId' as fal_character_id
FROM character_identities
ORDER BY created_at DESC
LIMIT 1;

-- Should show 1 row with status='ready' and 3-5 reference URLs
```

Check uploaded files in Storage:

1. Go to **Storage** → **character-references** bucket
2. Navigate to `{your_user_id}/{character_id}/` folder
3. You should see 3-5 image files with timestamps

#### Step 5.4: Test Error Handling

Try uploading invalid data to test error states:

1. Create another character
2. Try uploading only 1-2 images (should fail with "At least 3 reference images required")
3. Try uploading a 20MB image (should fail with "exceeds 10MB size limit")
4. Try uploading a non-image file (should fail with "format not supported")

#### Step 5.5: Test RLS Policies

Verify users cannot access other users' data:

```sql
-- Try to access another user's character identity (should return 0 rows)
SELECT * FROM character_identities
WHERE user_id != auth.uid();

-- Should return 0 rows due to RLS policy
```

#### Step 5.6: Test Character Identity Deletion

1. Hover over a character with identity
2. Click **Delete** button (trash icon)
3. Confirm deletion
4. Verify in Storage that files were deleted:
   - Go to **Storage** → **character-references**
   - Navigate to `{user_id}/{character_id}/` folder
   - Folder should be empty or deleted

✅ **Phase 5 Complete**: End-to-end workflow tested and verified

---

## Success Criteria Checklist

Use this checklist to verify everything is working:

- [ ] **Database Tables**
  - [ ] `character_identities` table exists with RLS enabled
  - [ ] `character_identity_tests` table exists with RLS enabled
  - [ ] Helper function `get_character_identity_status` works
  - [ ] Helper function `get_latest_identity_tests` works
  - [ ] Automatic timestamp trigger updates `last_updated` field

- [ ] **Storage Buckets**
  - [ ] `character-references` bucket created (private, 10MB limit, images only)
  - [ ] `character-models` bucket created (private, 500MB limit, binary/json)
  - [ ] RLS policies applied to both buckets
  - [ ] RLS policies enforce user_id scoping (users can't access others' files)

- [ ] **Environment Variables**
  - [ ] `FAL_API_KEY` set in Vercel (production, preview, development)
  - [ ] `VITE_SUPABASE_URL` set (already exists)
  - [ ] `VITE_SUPABASE_ANON_KEY` set (already exists)

- [ ] **Code Deployment**
  - [ ] `services/supabase.ts` has `getCurrentUserId()` function
  - [ ] Latest code deployed to production
  - [ ] No TypeScript/build errors

- [ ] **End-to-End Testing**
  - [ ] Can create character in Cast & Locations tab
  - [ ] "Prepare Identity" button opens modal
  - [ ] Can upload 3-5 reference images
  - [ ] Progress tracking shows correct percentages
  - [ ] Status updates to "ready" after successful upload
  - [ ] Character identity badge shows green "Identity" indicator
  - [ ] Reference images saved to Supabase Storage under correct path
  - [ ] Database entry created in `character_identities` table
  - [ ] Error handling works for invalid inputs
  - [ ] RLS policies prevent cross-user data access
  - [ ] Character deletion removes storage files

---

## Architecture Overview

### Data Flow

```
Frontend (CastLocationsTab.tsx)
    ↓
CharacterIdentityModal.tsx
    ↓
services/characterIdentityService.ts
    ├→ validateReferenceImages() - Client-side validation
    ├→ uploadReferenceImages()
    │   ├→ getCurrentUserId() - Get authenticated user ID
    │   └→ supabase.storage.upload() - Upload to character-references bucket
    │       Path: {user_id}/{character_id}/{timestamp}_{filename}
    └→ createFalCharacter()
        ├→ /api/fal-proxy (Vercel serverless function)
        │   └→ https://fal.run/fal-ai/flux-pro/character/train
        └→ Returns falCharacterId

Database (character_identities table)
    ↓
RLS Policy: auth.uid() = user_id
    ↓
User can only access their own character identities

Storage (character-references bucket)
    ↓
RLS Policy: auth.uid()::text = (storage.foldername(name))[1]
    ↓
User can only access files in {user_id}/ folder
```

### File Paths

**Reference Images**:
```
character-references/
└── {user_id}/                    # UUID of authenticated user
    └── {character_id}/           # Character ID from frontend
        ├── 1736628000000_image1.jpg
        ├── 1736628001000_image2.png
        └── 1736628002000_image3.webp
```

**Database Record**:
```sql
INSERT INTO character_identities (
  user_id,              -- Auth user UUID
  project_id,           -- Frontend project ID
  character_id,         -- Frontend character ID
  status,               -- 'ready'
  reference_image_urls, -- Array of 3-5 storage URLs
  training_cost,        -- $0.10 (Fal.ai cost)
  technology_data       -- JSONB with falCharacterId
) VALUES (...);
```

---

## Troubleshooting

### Issue: "Supabase is not configured" Error

**Cause**: Missing environment variables

**Solution**:
```bash
# Check if variables are set
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# If missing, add to .env.local and restart dev server
VITE_SUPABASE_URL=https://uiusqxdyzdkpyngppnwx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Issue: "User must be authenticated to upload character references"

**Cause**: Not signed in or session expired

**Solution**:
1. Sign out and sign back in
2. Check if `supabase.auth.getUser()` returns valid user
3. Verify auth state in browser console: `localStorage.getItem('supabase.auth.token')`

### Issue: "new row violates row-level security policy"

**Cause**: File uploaded to path that doesn't match `{user_id}/...` structure

**Solution**:
1. Verify `getCurrentUserId()` returns correct UUID
2. Check `characterIdentityService.ts:357` - path should start with `${userId}/`
3. Verify RLS policy exists: `SELECT * FROM pg_policies WHERE tablename = 'objects'`

### Issue: "Bucket not found: character-references"

**Cause**: Storage bucket not created

**Solution**:
1. Go to **Storage** in Supabase Dashboard
2. Verify `character-references` bucket exists
3. If missing, create bucket (see Phase 2.1)

### Issue: "Character Identity requires a Fal.ai API key"

**Cause**: `FAL_API_KEY` not set in Vercel

**Solution**:
1. Go to Vercel Project Settings → Environment Variables
2. Add `FAL_API_KEY` with your Fal.ai API key
3. Redeploy: `vercel --prod`
4. Verify: `vercel env ls` should show `FAL_API_KEY`

### Issue: "Fal.ai API did not return a character ID"

**Cause**: Invalid API response or API key issue

**Solution**:
1. Check Fal.ai API key is valid: https://fal.ai/dashboard
2. Verify API endpoint is correct in `characterIdentityService.ts:445`:
   - Should be: `/fal-ai/flux-pro/character/train`
3. Check Vercel function logs: `vercel logs --follow`
4. Test API directly with curl:
```bash
curl -X POST https://fal.run/fal-ai/flux-pro/character/train \
  -H "Authorization: Key YOUR_FAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"images_data_url": ["data:image/jpeg;base64,/9j/..."]}'
```

### Issue: Progress tracking stuck at specific percentage

**Cause**: Error in upload or API call not handled correctly

**Solution**:
1. Open browser console (F12) and check for errors
2. Look for red errors in Network tab
3. Check Vercel function logs: `vercel logs`
4. Add debug logging:
```typescript
// In characterIdentityService.ts
console.log('Step 1: Validation passed');
console.log('Step 2: Uploading to storage...');
console.log('Step 3: Calling Fal.ai API...');
```

---

## Next Steps

After completing this setup:

1. **Story 2.2**: Character Identity Preview & Testing
   - Implement character identity test generation (5 test types)
   - Add similarity scoring (CLIP + pHash)
   - Create test results gallery UI

2. **Story 2.3**: Character Identity Integration
   - Integrate character identity with image generation
   - Pass `falCharacterId` to Fal.ai generation API
   - Add reference strength slider (0-100%)

3. **Performance Optimization**:
   - Add image compression before upload (reduce file sizes)
   - Implement client-side image validation (check resolution)
   - Cache character identities in localStorage

4. **User Experience**:
   - Add character identity preview (show reference images)
   - Add "Edit Identity" workflow (replace reference images)
   - Add character identity export/import

---

## Support & Documentation

- **Epic 2 Story 2.1**: `docs/stories/epic-2-story-2.1-character-identity-training.md`
- **Database Migration**: `supabase/migrations/002_character_identity.sql`
- **Storage Setup**: `supabase/STORAGE_SETUP.md`
- **Service Layer**: `services/characterIdentityService.ts`
- **Supabase Docs**: https://supabase.com/docs
- **Fal.ai Docs**: https://fal.ai/models/fal-ai/flux-pro/character
- **Vercel Docs**: https://vercel.com/docs

---

**Setup Guide Complete**
**Epic**: 2 - Character Identity Consistency System
**Story**: 2.1 - Character Identity Training/Preparation Workflow
**Last Updated**: 2025-01-11
