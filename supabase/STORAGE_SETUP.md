# Supabase Storage Setup Guide

**Epic 2: Character Identity Consistency System**
**Story 2.1: Character Identity Training/Preparation Workflow**

This guide explains how to set up Supabase Storage buckets and RLS policies for character identity assets.

## Prerequisites

1. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
2. **Environment Variables**: Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
3. **Database Migration**: Run `supabase/migrations/002_character_identity.sql` first

## Storage Buckets

The Character Identity System requires two storage buckets:

### 1. character-references

**Purpose**: Store reference images uploaded by users (3-5 per character)

**Configuration**:
- **Public**: No (private, requires authentication)
- **File Size Limit**: 10MB per file
- **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`
- **Path Structure**: `{user_id}/{character_id}/{timestamp}_{filename}`

**Use Case**: When users upload 3-5 reference images to train a character identity, these images are stored here.

### 2. character-models

**Purpose**: Store trained LoRA models or preprocessed reference data (embeddings)

**Configuration**:
- **Public**: No (private, requires authentication)
- **File Size Limit**: 500MB per model
- **Allowed MIME Types**: `application/octet-stream`, `application/json`
- **Path Structure**: `{user_id}/{character_id}/model.{ext}`

**Use Case**: If using LoRA-based character identity (Epic R1 outcome), trained model weights are stored here.

## Setup Methods

### Method 1: Automated Script (Recommended)

Run the setup script to create buckets programmatically:

```bash
# Install dependencies (if not already installed)
npm install

# Set environment variables
export VITE_SUPABASE_URL="your_supabase_url"
export VITE_SUPABASE_ANON_KEY="your_anon_key"

# Run setup script
npx ts-node supabase/setup-storage.ts
```

**Important**: The script creates buckets but **cannot create RLS policies**. You must run the SQL manually (see step 2 below).

### Method 2: Supabase Dashboard (Manual)

1. Go to [app.supabase.com](https://app.supabase.com)
2. Navigate to **Storage** → **Create new bucket**
3. Create `character-references` bucket:
   - Name: `character-references`
   - Public: **No** (private)
   - File size limit: `10485760` (10MB)
   - Allowed MIME types: `image/jpeg,image/png,image/webp`
4. Create `character-models` bucket:
   - Name: `character-models`
   - Public: **No** (private)
   - File size limit: `524288000` (500MB)
   - Allowed MIME types: `application/octet-stream,application/json`

### Method 3: Supabase CLI

```bash
# Create buckets via CLI
supabase storage create character-references --size-limit 10MB --allowed-mime-types image/jpeg,image/png,image/webp
supabase storage create character-models --size-limit 500MB --allowed-mime-types application/octet-stream,application/json
```

## Row Level Security (RLS) Policies

**CRITICAL**: After creating buckets, you **MUST** create RLS policies to secure user data.

### SQL to Run

Go to **SQL Editor** in Supabase Dashboard and run:

```sql
-- ============================================================================
-- RLS Policy: character-references bucket
-- ============================================================================

CREATE POLICY character_references_policy ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'character-references' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

COMMENT ON POLICY character_references_policy ON storage.objects IS
  'Users can only access their own character reference images';

-- ============================================================================
-- RLS Policy: character-models bucket
-- ============================================================================

CREATE POLICY character_models_policy ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'character-models' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

COMMENT ON POLICY character_models_policy ON storage.objects IS
  'Users can only access their own character models';
```

### What These Policies Do

- **Scope**: Users can only access files in their own folders (first folder in path = user_id)
- **Path Enforcement**: Files must be uploaded to `{user_id}/{...}` structure
- **Authentication**: Requires valid JWT token (no anonymous access)

### Testing RLS Policies

After creating policies, test them:

```sql
-- Test: Check if RLS is enabled on storage.objects
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';
-- Should show: rowsecurity = true

-- Test: List policies on storage.objects
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';
-- Should show: character_references_policy and character_models_policy
```

## Path Structure Examples

### Reference Images

```
character-references/
├── {user_id_1}/
│   ├── {character_id_1}/
│   │   ├── 1234567890_reference_1.jpg
│   │   ├── 1234567891_reference_2.jpg
│   │   └── 1234567892_reference_3.png
│   └── {character_id_2}/
│       ├── 1234567893_reference_1.jpg
│       └── 1234567894_reference_2.webp
└── {user_id_2}/
    └── {character_id_3}/
        ├── 1234567895_reference_1.jpg
        └── 1234567896_reference_2.jpg
```

### Character Models

```
character-models/
├── {user_id_1}/
│   ├── {character_id_1}/
│   │   ├── lora_weights.safetensors
│   │   └── metadata.json
│   └── {character_id_2}/
│       └── embedding.bin
└── {user_id_2}/
    └── {character_id_3}/
        └── lora_weights.safetensors
```

## Verification Checklist

After setup, verify:

- [ ] Buckets created (`character-references`, `character-models`)
- [ ] Buckets are **private** (public = false)
- [ ] File size limits configured (10MB for references, 500MB for models)
- [ ] MIME types restricted (images for references, binary/json for models)
- [ ] RLS policies created and enabled
- [ ] Policies enforce user_id scoping
- [ ] Upload test: Can upload to `{user_id}/{character_id}/test.jpg`
- [ ] Access test: Cannot access other users' files
- [ ] Database migration `002_character_identity.sql` run successfully

## Service Layer Integration

The storage setup integrates with:

- **`services/characterIdentityService.ts`**: Uploads reference images to `character-references` bucket
- **`uploadToSupabaseStorage()`**: Handles file upload with user_id/character_id path
- **`deleteCharacterIdentity()`**: Deletes all files in character folder

See `services/characterIdentityService.ts:335-380` for implementation details.

## Troubleshooting

### Error: "new row violates row-level security policy"

**Cause**: File uploaded to path that doesn't match `{user_id}/{...}` structure

**Solution**: Ensure first folder in path matches authenticated user's ID

### Error: "Bucket not found"

**Cause**: Bucket doesn't exist or name is incorrect

**Solution**: Run setup script again or create bucket manually

### Error: "File size exceeds limit"

**Cause**: File larger than bucket's size limit

**Solution**:
- Reference images: Reduce image size to <10MB
- Models: Reduce model size to <500MB or increase bucket limit

### Error: "MIME type not allowed"

**Cause**: File type not in bucket's allowed MIME types list

**Solution**: Convert file to allowed format (JPEG/PNG/WebP for references)

## Cost Considerations

**Supabase Storage Pricing** (as of 2025):
- Free tier: 1GB storage, 2GB bandwidth/month
- Pro tier: 100GB storage, 200GB bandwidth/month ($25/month)

**Estimated Usage** (per character):
- Reference images: 3-5 images × 2MB = 6-10MB per character
- Models (LoRA): ~100-200MB per character (if using LoRA approach)
- Total: ~110-210MB per character

**Recommendation**: Use Pro tier for production with >5 characters

## Security Best Practices

1. **Never expose service_role key** - Only use anon_key client-side
2. **Always enforce RLS** - Never make buckets public for character data
3. **Validate file types** - Check MIME types before upload
4. **Limit file sizes** - Prevent storage abuse via client-side validation
5. **Clean up on delete** - Remove all files when character is deleted
6. **Monitor storage usage** - Track per-user quotas to prevent abuse

## References

- **Epic 2 Story 2.1**: `docs/stories/epic-2-story-2.1-character-identity-training.md`
- **Database Migration**: `supabase/migrations/002_character_identity.sql`
- **Service Layer**: `services/characterIdentityService.ts`
- **Supabase Storage Docs**: https://supabase.com/docs/guides/storage
- **RLS Docs**: https://supabase.com/docs/guides/auth/row-level-security

---

**Last Updated**: 2025-01-11
**Epic**: 2 (Character Identity Consistency System)
**Story**: 2.1 (Character Identity Training/Preparation Workflow)
