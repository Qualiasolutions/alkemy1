-- ============================================================================
-- Character Identity System - Database Schema
-- Epic 2: Character Identity Consistency System
-- ============================================================================
--
-- This migration creates tables and storage buckets for character identity
-- management, supporting Stories 2.1, 2.2, and 2.3.
--
-- Features:
-- - Character identity metadata storage
-- - Character identity test results tracking
-- - Supabase Storage buckets for reference images and models
-- - Row Level Security (RLS) for user-scoped access
-- - Cross-device sync support via cloud storage
--
-- @see docs/stories/epic-2-story-2.1-character-identity-training.md (AC5, AC8)
-- @see docs/stories/epic-2-story-2.2-character-identity-preview.md (Testing data)
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

  -- Status tracking (Story 2.1 AC3)
  status TEXT NOT NULL CHECK (status IN ('none', 'preparing', 'ready', 'error')),

  -- Reference images (Story 2.1 AC1)
  -- Stores URLs to Supabase Storage or base64 data URLs
  reference_image_urls TEXT[] NOT NULL DEFAULT '{}',

  -- Testing and approval (Story 2.2 AC5)
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')),

  -- Timestamps (Story 2.1 AC5)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Cost tracking (Story 2.1 AC5)
  training_cost NUMERIC(10, 2),

  -- Error handling (Story 2.1 AC4)
  error_message TEXT,

  -- Technology-specific data (Story 2.1 AC5)
  -- Flexible JSON field supporting LoRA, reference-based, or hybrid approaches
  -- determined by Epic R1 research outcome
  technology_data JSONB,

  -- Constraints
  UNIQUE(user_id, project_id, character_id)
);

-- Add comment
COMMENT ON TABLE character_identities IS 'Stores character identity metadata for Epic 2 (Character Identity Consistency System)';

-- Index for fast lookups
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

  -- Foreign key
  character_identity_id UUID NOT NULL REFERENCES character_identities(id) ON DELETE CASCADE,

  -- Test metadata (Story 2.2 AC2)
  test_type TEXT NOT NULL CHECK (test_type IN ('portrait', 'fullbody', 'profile', 'lighting', 'expression')),

  -- Generated image URL (Story 2.2 AC2)
  generated_image_url TEXT NOT NULL,

  -- Similarity score (Story 2.2 AC3)
  -- CLIP + pHash combined score (0-100)
  similarity_score NUMERIC(5, 2) CHECK (similarity_score >= 0 AND similarity_score <= 100),

  -- Timestamp
  test_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional metadata
  metadata JSONB -- Can store CLIP score, pHash score, evaluation details
);

-- Add comment
COMMENT ON TABLE character_identity_tests IS 'Stores character identity test results for quality verification (Story 2.2)';

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_character_tests_identity
  ON character_identity_tests(character_identity_id);

CREATE INDEX IF NOT EXISTS idx_character_tests_timestamp
  ON character_identity_tests(test_timestamp DESC);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on character_identities table
ALTER TABLE character_identities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own character identities
CREATE POLICY character_identities_user_policy ON character_identities
  FOR ALL
  USING (auth.uid() = user_id);

-- Enable RLS on character_identity_tests table
ALTER TABLE character_identity_tests ENABLE ROW LEVEL SECURITY;

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
  test_timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.test_type,
    t.generated_image_url,
    t.similarity_score,
    t.test_timestamp
  FROM character_identity_tests t
  WHERE t.character_identity_id = p_character_identity_id
  ORDER BY t.test_timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. SUPABASE STORAGE BUCKETS
-- ============================================================================

-- NOTE: Storage buckets must be created via Supabase Dashboard or API
-- The following SQL is for documentation purposes only

-- Bucket: character-references
-- Purpose: Store reference images uploaded by users (Story 2.1 AC5)
-- Path structure: {user_id}/{project_id}/{character_id}/reference_{index}.{ext}
-- RLS Policy: Users can only access their own references

-- SQL equivalent (if running via Supabase SQL Editor):
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-references', 'character-references', false);

CREATE POLICY character_references_policy ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'character-references' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
*/

-- Bucket: character-models
-- Purpose: Store trained LoRA models or preprocessed reference data (Story 2.1 AC5)
-- Path structure: {user_id}/{project_id}/{character_id}/model.{ext}
-- RLS Policy: Users can only access their own models

-- SQL equivalent (if running via Supabase SQL Editor):
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-models', 'character-models', false);

CREATE POLICY character_models_policy ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'character-models' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
*/

-- ============================================================================
-- 7. SAMPLE QUERIES (for testing)
-- ============================================================================

-- Get character identity for a user's project character
/*
SELECT * FROM character_identities
WHERE user_id = auth.uid()
  AND project_id = 'my_project_id'
  AND character_id = 'my_character_id';
*/

-- Get all test results for a character identity
/*
SELECT * FROM get_latest_identity_tests('character_identity_uuid', 10);
*/

-- Get character identity status
/*
SELECT get_character_identity_status(
  auth.uid(),
  'my_project_id',
  'my_character_id'
);
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

COMMENT ON SCHEMA public IS 'Character Identity System migration complete. Run this migration after initial schema setup.';
