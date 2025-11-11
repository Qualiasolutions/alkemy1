-- ============================================================================
-- Epic 2 Supabase Setup - Execute in SQL Editor
-- ============================================================================
--
-- Instructions:
-- 1. Go to https://app.supabase.com
-- 2. Select project: uiusqxdyzdkpyngppnwx
-- 3. Navigate to SQL Editor
-- 4. Copy and paste this ENTIRE file
-- 5. Click "Run"
--
-- This creates:
-- - character_identities table
-- - character_identity_tests table
-- - RLS policies
-- - Helper functions
-- - Storage bucket RLS policies
--
-- ============================================================================

-- ============================================================================
-- 1. CHARACTER IDENTITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS character_identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('none', 'preparing', 'ready', 'error')),
  reference_image_urls TEXT[] NOT NULL DEFAULT '{}',
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  training_cost NUMERIC(10, 2),
  error_message TEXT,
  technology_data JSONB,
  UNIQUE(user_id, project_id, character_id)
);

COMMENT ON TABLE character_identities IS 'Stores character identity metadata for Epic 2 (Character Identity Consistency System)';

CREATE INDEX IF NOT EXISTS idx_character_identities_user_project
  ON character_identities(user_id, project_id);

CREATE INDEX IF NOT EXISTS idx_character_identities_status
  ON character_identities(status);

-- ============================================================================
-- 2. CHARACTER IDENTITY TESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS character_identity_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_identity_id UUID NOT NULL REFERENCES character_identities(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL CHECK (test_type IN ('portrait', 'fullbody', 'profile', 'lighting', 'expression')),
  generated_image_url TEXT NOT NULL,
  similarity_score NUMERIC(5, 2) CHECK (similarity_score >= 0 AND similarity_score <= 100),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

COMMENT ON TABLE character_identity_tests IS 'Stores character identity test results for quality verification (Story 2.2)';

CREATE INDEX IF NOT EXISTS idx_character_tests_identity
  ON character_identity_tests(character_identity_id);

CREATE INDEX IF NOT EXISTS idx_character_tests_timestamp
  ON character_identity_tests(timestamp DESC);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE character_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS character_identities_user_policy ON character_identities
  FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE character_identity_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS character_tests_user_policy ON character_identity_tests
  FOR ALL
  USING (
    auth.uid() = (
      SELECT user_id
      FROM character_identities
      WHERE id = character_identity_id
    )
  );

-- ============================================================================
-- 4. AUTOMATIC TIMESTAMP UPDATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_character_identity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_character_identity_last_updated ON character_identities;

CREATE TRIGGER update_character_identity_last_updated
  BEFORE UPDATE ON character_identities
  FOR EACH ROW
  EXECUTE FUNCTION update_character_identity_timestamp();

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_character_identity_status(
  p_user_id UUID,
  p_project_id TEXT,
  p_character_id TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT status INTO v_status
  FROM character_identities
  WHERE user_id = p_user_id
    AND project_id = p_project_id
    AND character_id = p_character_id;

  RETURN COALESCE(v_status, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_latest_identity_tests(
  p_character_identity_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  test_type TEXT,
  generated_image_url TEXT,
  similarity_score NUMERIC,
  timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.test_type,
    t.generated_image_url,
    t.similarity_score,
    t.timestamp
  FROM character_identity_tests t
  WHERE t.character_identity_id = p_character_identity_id
  ORDER BY t.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. STORAGE BUCKET RLS POLICIES
-- ============================================================================
--
-- NOTE: Storage buckets must be created first via Dashboard
-- Go to: Storage → Create new bucket
--
-- Bucket 1: character-references (private, 10MB limit, images only)
-- Bucket 2: character-models (private, 500MB limit, binary/json)
--
-- Then run these policies:

CREATE POLICY IF NOT EXISTS character_references_policy ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'character-references' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

COMMENT ON POLICY character_references_policy ON storage.objects IS
  'Users can only access their own character reference images';

CREATE POLICY IF NOT EXISTS character_models_policy ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'character-models' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

COMMENT ON POLICY character_models_policy ON storage.objects IS
  'Users can only access their own character models';

-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================
--
-- Run these after the above SQL completes to verify setup:

-- Verify tables exist with RLS enabled
SELECT
  table_name,
  row_security
FROM information_schema.tables t
LEFT JOIN pg_tables pt ON t.table_name = pt.tablename
WHERE t.table_schema = 'public'
  AND t.table_name IN ('character_identities', 'character_identity_tests');

-- Expected: 2 rows with row_security = true

-- Verify helper functions exist
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_character_identity_status', 'get_latest_identity_tests');

-- Expected: 2 rows

-- Verify RLS policies on database tables
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('character_identities', 'character_identity_tests');

-- Expected: 2 rows (character_identities_user_policy, character_tests_user_policy)

-- Verify storage buckets exist (after creating them in Dashboard)
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name IN ('character-references', 'character-models');

-- Expected: 2 rows

-- Verify storage RLS policies (after running storage policy SQL above)
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname IN ('character_references_policy', 'character_models_policy');

-- Expected: 2 rows

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
--
-- If all verification queries return expected results, setup is complete.
--
-- Next steps:
-- 1. Add FAL_API_KEY to Vercel environment variables
-- 2. Test character identity upload workflow in production
--
-- See: docs/EPIC2_SUPABASE_SETUP_GUIDE.md for detailed testing instructions
--
-- ============================================================================
