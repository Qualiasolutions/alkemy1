-- ============================================================================
-- Storage RLS Policies - Run as database owner
-- ============================================================================
--
-- IMPORTANT: These policies must be applied by a user with owner permissions
-- Go to: Supabase Dashboard → SQL Editor → Run as service role
--
-- ============================================================================

-- Policy for character-references bucket
CREATE POLICY character_references_policy ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'character-references' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for character-models bucket
CREATE POLICY character_models_policy ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'character-models' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Verify policies were created
SELECT policyname, cmd, tablename
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname IN ('character_references_policy', 'character_models_policy');
