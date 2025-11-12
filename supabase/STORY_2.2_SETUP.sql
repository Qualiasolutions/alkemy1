-- ============================================================================
-- STORY 2.2 SUPABASE BACKEND SETUP
-- Character Identity Testing System
-- ============================================================================
--
-- INSTRUCTIONS:
-- 1. Copy this entire file
-- 2. Go to: https://supabase.com/dashboard/project/uiusqxdyzdkpyngppnwx/sql/new
-- 3. Paste into SQL Editor
-- 4. Click "RUN" to execute
--
-- This will create all necessary tables, indexes, RLS policies, and functions
-- for Story 2.2: Character Identity Preview and Testing
-- ============================================================================

-- ============================================================================
-- 1. CHARACTER IDENTITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS character_identities (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  character_id TEXT NOT NULL,

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('none', 'preparing', 'ready', 'error')),

  -- Reference images (array of URLs)
  reference_image_urls TEXT[] NOT NULL DEFAULT '{}',

  -- Testing and approval (Story 2.2 AC5)
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Cost tracking
  training_cost NUMERIC(10, 2),

  -- Error handling
  error_message TEXT,

  -- Technology-specific data (flexible JSON for Fal.ai, LoRA, etc.)
  technology_data JSONB,

  -- Constraints
  UNIQUE(user_id, project_id, character_id)
);

-- Add comment
COMMENT ON TABLE character_identities IS 'Stores character identity metadata for Epic 2 (Character Identity Consistency System)';

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_character_identities_user_project
  ON character_identities(user_id, project_id);

CREATE INDEX IF NOT EXISTS idx_character_identities_status
  ON character_identities(status);

-- ============================================================================
-- 2. CHARACTER IDENTITY TESTS TABLE (Story 2.2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS character_identity_tests (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign key to character_identities
  character_identity_id UUID NOT NULL REFERENCES character_identities(id) ON DELETE CASCADE,

  -- Test metadata (Story 2.2 AC2)
  test_type TEXT NOT NULL CHECK (test_type IN ('portrait', 'fullbody', 'profile', 'lighting', 'expression')),

  -- Generated image URL (Story 2.2 AC2)
  generated_image_url TEXT NOT NULL,

  -- Similarity score (Story 2.2 AC3)
  -- CLIP (70%) + pHash (30%) combined score (0-100)
  similarity_score NUMERIC(5, 2) CHECK (similarity_score >= 0 AND similarity_score <= 100),

  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional metadata (optional: store CLIP score, pHash score separately)
  metadata JSONB
);

-- Add comment
COMMENT ON TABLE character_identity_tests IS 'Stores character identity test results for quality verification (Story 2.2)';

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_character_tests_identity
  ON character_identity_tests(character_identity_id);

CREATE INDEX IF NOT EXISTS idx_character_tests_timestamp
  ON character_identity_tests(timestamp DESC);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on character_identities table
ALTER TABLE character_identities ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS character_identities_user_policy ON character_identities;

-- Policy: Users can only access their own character identities
CREATE POLICY character_identities_user_policy ON character_identities
  FOR ALL
  USING (auth.uid() = user_id);

-- Enable RLS on character_identity_tests table
ALTER TABLE character_identity_tests ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS character_tests_user_policy ON character_identity_tests;

-- Policy: Users can only access tests for their own character identities
CREATE POLICY character_tests_user_policy ON character_identity_tests
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

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_character_identity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS update_character_identity_last_updated ON character_identities;

-- Trigger to auto-update last_updated on row modification
CREATE TRIGGER update_character_identity_last_updated
  BEFORE UPDATE ON character_identities
  FOR EACH ROW
  EXECUTE FUNCTION update_character_identity_timestamp();

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to get character identity status by character ID
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

-- Function to get latest test results for a character identity
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
-- 6. STORAGE BUCKETS (Run after table creation)
-- ============================================================================

-- Create character-references bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'character-references',
  'character-references',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create character-models bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'character-models',
  'character-models',
  false,
  524288000 -- 500MB limit for model files
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. STORAGE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS character_references_select_policy ON storage.objects;
DROP POLICY IF EXISTS character_references_insert_policy ON storage.objects;
DROP POLICY IF EXISTS character_references_update_policy ON storage.objects;
DROP POLICY IF EXISTS character_references_delete_policy ON storage.objects;

-- Policies for character-references bucket
CREATE POLICY character_references_select_policy ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'character-references' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY character_references_insert_policy ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'character-references' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY character_references_update_policy ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'character-references' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY character_references_delete_policy ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'character-references' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS character_models_select_policy ON storage.objects;
DROP POLICY IF EXISTS character_models_insert_policy ON storage.objects;
DROP POLICY IF EXISTS character_models_update_policy ON storage.objects;
DROP POLICY IF EXISTS character_models_delete_policy ON storage.objects;

-- Policies for character-models bucket
CREATE POLICY character_models_select_policy ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'character-models' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY character_models_insert_policy ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'character-models' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY character_models_update_policy ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'character-models' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY character_models_delete_policy ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'character-models' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT
  'Tables Created:' as status,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('character_identities', 'character_identity_tests');

-- Verify storage buckets were created
SELECT
  'Storage Buckets:' as status,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE name IN ('character-references', 'character-models');

-- ============================================================================
-- SETUP COMPLETE! ✅
-- ============================================================================
--
-- Next steps:
-- 1. Verify the output shows 2 tables created
-- 2. Verify the output shows 2 storage buckets created
-- 3. Test creating a character identity (see test query below)
--
-- ============================================================================

-- ============================================================================
-- TEST QUERY (Optional - Run after setup to verify everything works)
-- ============================================================================
/*
-- Test: Insert a character identity
INSERT INTO character_identities (
  user_id,
  project_id,
  character_id,
  status,
  reference_image_urls,
  technology_data
) VALUES (
  auth.uid(),
  'test-project',
  'test-character',
  'ready',
  ARRAY['https://example.com/ref1.jpg', 'https://example.com/ref2.jpg'],
  '{"type": "reference", "falCharacterId": "fal-test-123"}'::jsonb
);

-- Test: Insert test results
INSERT INTO character_identity_tests (
  character_identity_id,
  test_type,
  generated_image_url,
  similarity_score,
  metadata
) VALUES (
  (SELECT id FROM character_identities WHERE character_id = 'test-character' LIMIT 1),
  'portrait',
  'https://example.com/generated-portrait.jpg',
  88.5,
  '{"clipScore": 90.2, "pHashScore": 85.1}'::jsonb
);

-- Test: Query your data
SELECT
  ci.character_id,
  ci.status,
  ci.approval_status,
  array_length(ci.reference_image_urls, 1) as num_references,
  COUNT(cit.id) as num_tests,
  AVG(cit.similarity_score) as avg_similarity
FROM character_identities ci
LEFT JOIN character_identity_tests cit ON cit.character_identity_id = ci.id
WHERE ci.user_id = auth.uid()
GROUP BY ci.id, ci.character_id, ci.status, ci.approval_status, ci.reference_image_urls;

-- Cleanup test data (optional)
DELETE FROM character_identities WHERE project_id = 'test-project';
*/
