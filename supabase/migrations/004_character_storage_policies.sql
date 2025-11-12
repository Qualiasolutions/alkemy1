-- ============================================================================
-- Character Storage RLS Policies
-- Applied: 2025-11-12
-- ============================================================================
--
-- This migration applies RLS policies for character-references and
-- character-models storage buckets.
--
-- Status: Mostly applied via Supabase MCP (2025-11-12 12:30 PM)
--
-- ✅ COMPLETED POLICIES:
-- - character-references bucket:
--   ✅ Users can upload own character references (INSERT)
--   ✅ Users can read own character references (SELECT)
--   ✅ Users can delete own character references (DELETE)
--
-- - character-models bucket:
--   ✅ Users can upload own character models (INSERT)
--
-- ⏳ PENDING POLICIES (MCP connection timeout):
-- - character-models bucket:
--   ⏳ Users can read own character models (SELECT)
--   ⏳ Users can delete own character models (DELETE)
--
-- Note: Remaining policies can be applied via Supabase Dashboard SQL Editor
--       or by re-running this migration file.
--
-- ============================================================================

-- ============================================================================
-- CHARACTER-MODELS BUCKET POLICIES
-- ============================================================================

-- Policy 1: Users can upload their own character models (INSERT)
-- Status: ✅ APPLIED via Supabase MCP (2025-11-12)
CREATE POLICY IF NOT EXISTS "Users can upload own character models"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'character-models'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can read their own character models (SELECT)
-- Status: ⏳ PENDING (MCP timeout - apply manually via Supabase Dashboard)
CREATE POLICY IF NOT EXISTS "Users can read own character models"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'character-models'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can delete their own character models (DELETE)
-- Status: ⏳ PENDING (MCP timeout - apply manually via Supabase Dashboard)
CREATE POLICY IF NOT EXISTS "Users can delete own character models"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'character-models'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all character storage policies
/*
SELECT
    policyname,
    cmd,
    CASE
        WHEN qual LIKE '%character-references%' THEN 'character-references'
        WHEN qual LIKE '%character-models%' THEN 'character-models'
        ELSE 'other'
    END as bucket
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND (policyname LIKE '%character%')
ORDER BY bucket, policyname;
*/

-- ============================================================================
-- POLICIES ALREADY APPLIED VIA SUPABASE MCP (2025-11-12)
-- ============================================================================
-- ✅ Users can upload own character references (INSERT)
-- ✅ Users can read own character references (SELECT)
-- ✅ Users can delete own character references (DELETE)
-- ⏳ Users can update own character references (UPDATE) - failed, retry if needed

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
