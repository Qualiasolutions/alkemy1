-- ============================================================================
-- Storage RLS Policies for Character Identity System
-- ============================================================================
--
-- These policies ensure users can only access their own character identity files
-- in Supabase Storage buckets.
--
-- Buckets covered:
-- - character-references: Reference images (3-5 per character)
-- - character-models: Trained models or preprocessed data
--
-- Path structure: {user_id}/{character_id}/{filename}
-- RLS enforcement: auth.uid() must match first folder in path
--
-- ============================================================================

-- ============================================================================
-- 1. CHARACTER-REFERENCES BUCKET POLICY
-- ============================================================================

CREATE POLICY IF NOT EXISTS character_references_policy
ON storage.objects
FOR ALL
USING (
  bucket_id = 'character-references' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

COMMENT ON POLICY character_references_policy ON storage.objects IS
  'Users can only access their own character reference images in character-references bucket';

-- ============================================================================
-- 2. CHARACTER-MODELS BUCKET POLICY
-- ============================================================================

CREATE POLICY IF NOT EXISTS character_models_policy
ON storage.objects
FOR ALL
USING (
  bucket_id = 'character-models' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

COMMENT ON POLICY character_models_policy ON storage.objects IS
  'Users can only access their own character models in character-models bucket';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if RLS is enabled on storage.objects
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'RLS is enabled on storage.objects';
  ELSE
    RAISE WARNING 'RLS is NOT enabled on storage.objects';
  END IF;
END $$;

-- List policies on storage.objects
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE 'Storage RLS Policies:';
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE '%character%'
  LOOP
    RAISE NOTICE '  - %', policy_record.policyname;
  END LOOP;
END $$;

-- ============================================================================
-- END OF STORAGE POLICIES
-- ============================================================================