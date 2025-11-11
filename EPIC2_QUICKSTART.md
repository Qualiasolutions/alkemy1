# Epic 2 Backend Setup - Quick Start Guide

**Status**: ✅ Code deployed to production
**Remaining**: 4 manual steps (15-20 minutes total)

---

## What's Already Done ✅

1. ✅ **Code changes committed and pushed**
   - `services/supabase.ts` - Added `getCurrentUserId()` helper
   - All Epic 2 frontend code already deployed

2. ✅ **Production deployment complete**
   - URL: https://alkemy1-8seqp011y-qualiasolutionscy.vercel.app
   - Build successful, no errors
   - Frontend waiting for backend setup

---

## What You Need to Do (4 Steps)

### Step 1: Run Database Migration (5 minutes)

1. Go to [Supabase SQL Editor](https://app.supabase.com)
2. Select project: `uiusqxdyzdkpyngppnwx`
3. Click **SQL Editor** → **New Query**
4. Copy entire contents of: `supabase/EXECUTE_THIS_SQL.sql`
5. Paste into SQL Editor
6. Click **Run** ▶️

**What this creates**:
- `character_identities` table (with RLS)
- `character_identity_tests` table (with RLS)
- Helper functions
- Storage RLS policies

**Verify it worked**:
The SQL file includes verification queries at the bottom. You should see:
- 2 tables with row_security = true
- 2 helper functions
- 2 RLS policies on tables

---

### Step 2: Create Storage Buckets (5 minutes)

1. In Supabase Dashboard, go to **Storage**
2. Click **Create new bucket**

**Bucket 1: character-references**
```
Name:              character-references
Public:            ❌ NO (private)
File size limit:   10485760  (10MB)
Allowed MIME:      image/jpeg,image/png,image/webp
```

3. Click **Create new bucket** again

**Bucket 2: character-models**
```
Name:              character-models
Public:            ❌ NO (private)
File size limit:   524288000  (500MB)
Allowed MIME:      application/octet-stream,application/json
```

**Note**: The RLS policies for storage were already created in Step 1. You just need to create the buckets.

**Verify it worked**:
Run this in SQL Editor:
```sql
SELECT id, name, public FROM storage.buckets
WHERE name IN ('character-references', 'character-models');
```
Should return 2 rows with public = false.

---

### Step 3: Add Fal.ai API Key to Vercel (2 minutes)

1. Get your Fal.ai API key:
   - Go to https://fal.ai/dashboard
   - Sign up/in
   - Copy your API key (starts with `fal-`)

2. Add to Vercel:
   - Go to https://vercel.com/qualiasolutionscy/alkemy1/settings/environment-variables
   - Click **Add New**
   - **Key**: `FAL_API_KEY`
   - **Value**: `fal-xxxxxxxxxxxxxxxx` (your key)
   - **Environments**: Select **all three** (Production, Preview, Development)
   - Click **Save**

**Verify it worked**:
```bash
vercel env ls
```
Should show `FAL_API_KEY` with all three environments.

---

### Step 4: Test Character Identity Workflow (5-10 minutes)

1. **Go to production**: https://alkemy1-8seqp011y-qualiasolutionscy.vercel.app

2. **Sign in** with your account

3. **Navigate to Cast & Locations** tab

4. **Create a character**:
   - Click **Add Character**
   - Name: "Test Character"
   - Click **Add Character**

5. **Prepare character identity**:
   - Hover over the character card
   - Click the **purple Upload icon** (top-left)
   - This opens Character Identity Modal

6. **Upload reference images**:
   - Click **Select Images** or drag & drop
   - Upload 3-5 images (same person/character)
   - Requirements:
     - JPEG, PNG, or WebP
     - At least 512x512 pixels
     - Less than 10MB each
   - Click **Prepare Identity**

7. **Watch progress**:
   - "Validating reference images..." (5%)
   - "Uploading image X of Y..." (15-45%)
   - "Creating character with Fal.ai..." (50-90%)
   - "Character identity ready!" (100%)

8. **Verify success**:
   - Character card shows **green "Identity" badge**
   - Status indicator: ✅ with "Identity" text

9. **Verify in database**:
```sql
SELECT
  character_id,
  status,
  array_length(reference_image_urls, 1) as num_images,
  created_at
FROM character_identities
ORDER BY created_at DESC
LIMIT 1;
```
Should show 1 row with status='ready' and 3-5 images.

10. **Verify in storage**:
    - Go to **Storage** → **character-references**
    - Navigate to `{your_user_id}/{character_id}/`
    - Should see 3-5 uploaded images

---

## Troubleshooting

### "Supabase is not configured"
- Check environment variables are set
- Restart browser/clear cache

### "User must be authenticated to upload"
- Sign out and sign back in
- Check if session is valid

### "Bucket not found: character-references"
- Go back to Step 2 and create the bucket
- Make sure name is exactly `character-references`

### "Character Identity requires a Fal.ai API key"
- Go back to Step 3 and add FAL_API_KEY
- Make sure it's added to Production environment
- Redeploy if needed: `vercel --prod`

### Progress bar stuck / No error shown
- Open browser console (F12)
- Look for errors in Console tab
- Check Network tab for failed requests
- See full guide: `docs/EPIC2_SUPABASE_SETUP_GUIDE.md`

---

## Success Checklist

- [ ] Database migration ran successfully (Step 1)
- [ ] Verification queries returned expected results
- [ ] Storage buckets created (character-references, character-models)
- [ ] FAL_API_KEY added to Vercel
- [ ] Can create character in Cast & Locations
- [ ] "Prepare Identity" button opens modal
- [ ] Can upload 3-5 reference images
- [ ] Progress bar reaches 100%
- [ ] Green "Identity" badge appears on character
- [ ] Character identity saved in database
- [ ] Images saved in Supabase Storage

---

## Files Reference

- **Full setup guide**: `docs/EPIC2_SUPABASE_SETUP_GUIDE.md` (800+ lines)
- **SQL to execute**: `supabase/EXECUTE_THIS_SQL.sql` (copy-paste ready)
- **Automated script**: `supabase/setup-complete.sh` (bash script)
- **Migration file**: `supabase/migrations/002_character_identity.sql` (reference)

---

## What Happens Next?

Once Epic 2 Story 2.1 is working, you can move on to:

**Story 2.2**: Character Identity Preview & Testing
- Generate 5 test images (different angles, lighting)
- Similarity scoring (CLIP + pHash)
- Test results gallery

**Story 2.3**: Character Identity Integration
- Use character identity in image generation
- Pass `falCharacterId` to generation API
- Reference strength control (0-100%)

---

**Epic 2 Backend Setup - Quick Start**
**Total time**: 15-20 minutes
**Last updated**: 2025-01-11
