-- Security and Performance Fixes for Supabase Linter Warnings
-- This migration addresses:
-- 1. Function search_path mutable warnings (SECURITY)
-- 2. Auth RLS initialization plan warnings (PERFORMANCE)

-- ============================================================================
-- FIX 1: Add SECURITY DEFINER and SET search_path to all functions
-- ============================================================================

-- Update update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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

-- Update handle_new_user function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name'
  );
  RETURN NEW;
END;
$$;

-- Update get_user_project_count function with proper search_path
CREATE OR REPLACE FUNCTION public.get_user_project_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.projects
    WHERE user_id = user_uuid
  );
END;
$$;

-- Update get_user_total_usage function with proper search_path
CREATE OR REPLACE FUNCTION public.get_user_total_usage(user_uuid UUID)
RETURNS TABLE(total_tokens BIGINT, total_cost DECIMAL)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(tokens_used), 0) as total_tokens,
    COALESCE(SUM(cost_usd), 0) as total_cost
  FROM public.usage_logs
  WHERE user_id = user_uuid;
END;
$$;

-- ============================================================================
-- FIX 2: Optimize RLS policies to prevent auth.uid() re-evaluation
-- Replace auth.uid() with (SELECT auth.uid()) for better performance
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view own media" ON public.media_assets;
DROP POLICY IF EXISTS "Users can create own media" ON public.media_assets;
DROP POLICY IF EXISTS "Users can delete own media" ON public.media_assets;
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_logs;
DROP POLICY IF EXISTS "Users can create own usage logs" ON public.usage_logs;

-- Recreate user_profiles policies with optimized auth.uid()
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- Recreate projects policies with optimized auth.uid()
CREATE POLICY "Users can view own projects"
  ON public.projects
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR is_public = true
    OR (SELECT auth.uid()) = ANY(shared_with)
  );

CREATE POLICY "Users can create own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Recreate media_assets policies with optimized auth.uid()
CREATE POLICY "Users can view own media"
  ON public.media_assets
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own media"
  ON public.media_assets
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own media"
  ON public.media_assets
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Recreate usage_logs policies with optimized auth.uid()
CREATE POLICY "Users can view own usage"
  ON public.usage_logs
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own usage logs"
  ON public.usage_logs
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- COMMENT: Leaked Password Protection
-- ============================================================================
-- Note: The "Leaked Password Protection Disabled" warning must be fixed
-- via the Supabase Dashboard under:
-- Authentication → Settings → Password Policies → Enable Password Leak Protection
--
-- This cannot be fixed via SQL migration as it's an Auth configuration setting.
-- ============================================================================
