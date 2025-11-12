-- ===========================================================================
-- Migration 006: Quality Fixes - Security & Performance
-- Created: 2025-11-12
-- Purpose: Fix Supabase linter warnings from quality audit
-- ===========================================================================
--
-- This migration addresses issues identified in quality audit (2025-11-12):
--
-- SECURITY FIXES (6 warnings):
-- - Function search_path mutable (5 functions)
-- - Leaked password protection (Auth config, manual fix required)
--
-- PERFORMANCE FIXES (16 warnings):
-- - Auth RLS initplan (6 policies - re-evaluate auth.uid() per row)
-- - Unindexed foreign key (1 - usage_logs.project_id)
-- - Unused indexes (9 - keep for now, monitor post-launch)
--
-- ===========================================================================

-- ===========================================================================
-- SECTION 1: SECURITY - Fix Function search_path Mutable
-- ===========================================================================
-- Problem: Functions without explicit search_path can be exploited via
--          search_path manipulation attacks
-- Solution: Add SECURITY DEFINER + SET search_path = public, pg_temp
-- ===========================================================================

-- Function 1: get_user_style_profile
CREATE OR REPLACE FUNCTION public.get_user_style_profile(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  patterns JSONB,
  learning_enabled BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    usp.id,
    usp.user_id,
    usp.patterns,
    usp.learning_enabled,
    usp.created_at,
    usp.updated_at
  FROM public.user_style_profiles usp
  WHERE usp.user_id = user_uuid;
END;
$$;

-- Function 2: update_style_profile_timestamp
CREATE OR REPLACE FUNCTION public.update_style_profile_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function 3: update_character_identity_timestamp
CREATE OR REPLACE FUNCTION public.update_character_identity_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function 4: get_character_identity_status
CREATE OR REPLACE FUNCTION public.get_character_identity_status(
  character_identity_uuid UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  identity_status TEXT;
BEGIN
  SELECT
    CASE
      WHEN technology_data->>'falCharacterId' IS NOT NULL THEN 'ready'
      WHEN training_status = 'training' THEN 'training'
      WHEN training_status = 'failed' THEN 'failed'
      ELSE 'not_started'
    END INTO identity_status
  FROM public.character_identities
  WHERE id = character_identity_uuid;

  RETURN COALESCE(identity_status, 'not_started');
END;
$$;

-- Function 5: get_latest_identity_tests
CREATE OR REPLACE FUNCTION public.get_latest_identity_tests(
  character_identity_uuid UUID,
  test_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  character_identity_id UUID,
  test_type TEXT,
  test_prompt TEXT,
  generated_image_url TEXT,
  similarity_score DECIMAL,
  test_metadata JSONB,
  tested_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cit.id,
    cit.character_identity_id,
    cit.test_type,
    cit.test_prompt,
    cit.generated_image_url,
    cit.similarity_score,
    cit.test_metadata,
    cit.tested_at
  FROM public.character_identity_tests cit
  WHERE cit.character_identity_id = character_identity_uuid
  ORDER BY cit.tested_at DESC
  LIMIT test_limit;
END;
$$;

-- ===========================================================================
-- SECTION 2: PERFORMANCE - Optimize RLS Policies (Auth RLS Initplan)
-- ===========================================================================
-- Problem: RLS policies re-evaluate auth.uid() for EVERY row
-- Solution: Wrap auth.uid() with (SELECT auth.uid()) to evaluate once
-- ===========================================================================

-- Drop existing policies for recreation
DROP POLICY IF EXISTS "character_identities_user_policy" ON public.character_identities;
DROP POLICY IF EXISTS "character_tests_user_policy" ON public.character_identity_tests;
DROP POLICY IF EXISTS "Users can view their own style profile" ON public.user_style_profiles;
DROP POLICY IF EXISTS "Users can insert their own style profile" ON public.user_style_profiles;
DROP POLICY IF EXISTS "Users can update their own style profile" ON public.user_style_profiles;
DROP POLICY IF EXISTS "Users can delete their own style profile" ON public.user_style_profiles;

-- Recreate character_identities policy with optimized auth.uid()
CREATE POLICY "character_identities_user_policy"
  ON public.character_identities
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Recreate character_identity_tests policy with optimized auth.uid()
CREATE POLICY "character_tests_user_policy"
  ON public.character_identity_tests
  FOR ALL
  USING (
    (SELECT auth.uid()) = (
      SELECT user_id
      FROM public.character_identities
      WHERE id = character_identity_tests.character_identity_id
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = (
      SELECT user_id
      FROM public.character_identities
      WHERE id = character_identity_tests.character_identity_id
    )
  );

-- Recreate user_style_profiles policies with optimized auth.uid()
CREATE POLICY "Users can view their own style profile"
  ON public.user_style_profiles
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own style profile"
  ON public.user_style_profiles
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own style profile"
  ON public.user_style_profiles
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own style profile"
  ON public.user_style_profiles
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ===========================================================================
-- SECTION 3: PERFORMANCE - Add Missing Foreign Key Index
-- ===========================================================================
-- Problem: usage_logs.project_id foreign key has no covering index
-- Solution: Create index on project_id column
-- ===========================================================================

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_usage_logs_project_id_fkey
  ON public.usage_logs(project_id);

-- ===========================================================================
-- SECTION 4: COMMENTS - Unused Indexes & Auth Config
-- ===========================================================================

-- UNUSED INDEXES (9 total):
-- Status: INFO level - Keeping for now as feature is newly deployed
-- Decision: Monitor post-launch, remove if still unused after 30 days
--
-- List of unused indexes (2025-11-12):
-- - idx_projects_user_id (projects)
-- - idx_media_assets_project_id (media_assets)
-- - idx_media_assets_user_id (media_assets)
-- - idx_usage_logs_user_id (usage_logs)
-- - idx_usage_logs_created_at (usage_logs)
-- - idx_character_identities_user_project (character_identities)
-- - idx_character_identities_status (character_identities)
-- - idx_character_tests_identity (character_identity_tests)
-- - idx_character_tests_timestamp (character_identity_tests)
--
-- Note: These indexes were created proactively for expected queries.
--       Will monitor usage via pg_stat_user_indexes after production load.

-- LEAKED PASSWORD PROTECTION:
-- Status: Auth configuration (cannot be fixed via SQL)
-- Action Required: Enable in Supabase Dashboard
--
-- Steps to fix:
-- 1. Navigate to Supabase Dashboard → Authentication → Settings
-- 2. Scroll to "Password Policies"
-- 3. Enable "Leaked Password Protection"
-- 4. Save changes
--
-- This enables checking against HaveIBeenPwned.org database for compromised passwords

-- ===========================================================================
-- VERIFICATION QUERIES
-- ===========================================================================

-- Verify function search_path is set correctly
/*
SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  p.proconfig AS search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_user_style_profile',
    'update_style_profile_timestamp',
    'update_character_identity_timestamp',
    'get_character_identity_status',
    'get_latest_identity_tests'
  )
ORDER BY p.proname;
*/

-- Verify RLS policies use optimized auth.uid()
/*
SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN qual::text LIKE '%(SELECT auth.uid())%' THEN '✅ Optimized'
    WHEN qual::text LIKE '%auth.uid()%' THEN '⚠️ Not optimized'
    ELSE 'N/A'
  END AS optimization_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('character_identities', 'character_identity_tests', 'user_style_profiles')
ORDER BY tablename, policyname;
*/

-- Verify foreign key index exists
/*
SELECT
  i.relname AS index_name,
  a.attname AS column_name,
  t.relname AS table_name
FROM pg_index ix
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relname = 'usage_logs'
  AND a.attname = 'project_id';
*/

-- ===========================================================================
-- MIGRATION COMPLETE
-- ===========================================================================
-- Applied: 2025-11-12
-- Security Fixes: 5 functions (search_path set)
-- Performance Fixes: 6 RLS policies (auth.uid optimized) + 1 index added
-- Manual Action Required: Enable leaked password protection in Dashboard
-- ===========================================================================
