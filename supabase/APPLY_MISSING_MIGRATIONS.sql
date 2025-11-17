-- ============================================================================
-- Apply Missing Database Migrations
-- ============================================================================
--
-- This script applies migrations that are missing from the production database.
-- Specifically, it adds the columns that SaveManager expects but are not
-- currently in the database schema.
--
-- Instructions:
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Navigate to SQL Editor
-- 4. Copy and paste this ENTIRE file
-- 5. Click "Run"
--
-- ============================================================================

-- ============================================================================
-- Migration 005: User Preferences and Save Tracking
-- ============================================================================

-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  -- UI State (replaces localStorage UI_STATE_STORAGE_KEY)
  ui_state JSONB DEFAULT '{"activeTab": "script", "isSidebarExpanded": true}'::JSONB,

  -- Voice Settings (replaces localStorage voice keys)
  voice_settings JSONB DEFAULT '{
    "mode": "push-to-talk",
    "privacyWarningShown": false,
    "outputEnabled": false,
    "outputVoiceId": null,
    "speechRate": 1.0
  }'::JSONB,

  -- Style Learning Settings
  style_learning_enabled BOOLEAN DEFAULT false,
  style_opt_in_shown BOOLEAN DEFAULT false,

  -- API Keys (encrypted at application level)
  api_keys JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add version control and save tracking columns to projects table
-- These columns are referenced by SaveManager service
DO $$
BEGIN
    -- Add auto_save_enabled column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'auto_save_enabled'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN auto_save_enabled BOOLEAN DEFAULT false;
    END IF;

    -- Add last_manual_save column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'last_manual_save'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN last_manual_save TIMESTAMPTZ;
    END IF;

    -- Add has_unsaved_changes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'has_unsaved_changes'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN has_unsaved_changes BOOLEAN DEFAULT false;
    END IF;

    -- Add version column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'version'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    -- Add version_history column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'version_history'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN version_history JSONB DEFAULT '[]'::JSONB;
    END IF;
END $$;

-- Create analytics_metrics table for performance tracking
CREATE TABLE IF NOT EXISTS public.analytics_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metrics_data JSONB NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('performance', 'quality', 'usage')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create session_drafts table for temporary unsaved work
CREATE TABLE IF NOT EXISTS public.session_drafts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_user_id ON public.analytics_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_project_id ON public.analytics_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_session_drafts_user_id ON public.session_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_session_drafts_last_activity ON public.session_drafts(last_activity DESC);

-- Enable RLS on new tables
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for analytics_metrics
DROP POLICY IF EXISTS "Users can view own metrics" ON public.analytics_metrics;
CREATE POLICY "Users can view own metrics"
  ON public.analytics_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own metrics" ON public.analytics_metrics;
CREATE POLICY "Users can create own metrics"
  ON public.analytics_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for session_drafts
DROP POLICY IF EXISTS "Users can manage own drafts" ON public.session_drafts;
CREATE POLICY "Users can manage own drafts"
  ON public.session_drafts
  FOR ALL
  USING (auth.uid() = user_id);

-- Function to update user preferences atomically
CREATE OR REPLACE FUNCTION public.update_user_preference(
  p_user_id UUID,
  p_key TEXT,
  p_value JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_current_prefs JSONB;
  v_updated_prefs JSONB;
BEGIN
  -- Get current preferences
  SELECT
    CASE
      WHEN p_key LIKE 'ui_state.%' THEN ui_state
      WHEN p_key LIKE 'voice_settings.%' THEN voice_settings
      WHEN p_key LIKE 'api_keys.%' THEN api_keys
      ELSE '{}'::JSONB
    END INTO v_current_prefs
  FROM public.user_preferences
  WHERE user_id = p_user_id;

  -- If no preferences exist, create them
  IF v_current_prefs IS NULL THEN
    INSERT INTO public.user_preferences (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    v_current_prefs := '{}'::JSONB;
  END IF;

  -- Update the specific nested key
  v_updated_prefs := jsonb_set(
    v_current_prefs,
    string_to_array(split_part(p_key, '.', 2), '.'),
    p_value,
    true
  );

  -- Save back to database
  UPDATE public.user_preferences
  SET
    ui_state = CASE WHEN p_key LIKE 'ui_state.%' THEN v_updated_prefs ELSE ui_state END,
    voice_settings = CASE WHEN p_key LIKE 'voice_settings.%' THEN v_updated_prefs ELSE voice_settings END,
    api_keys = CASE WHEN p_key LIKE 'api_keys.%' THEN v_updated_prefs ELSE api_keys END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_updated_prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old session drafts (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_drafts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.session_drafts
  WHERE last_activity < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the updated_at timestamp
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Verification Queries
-- ============================================================================
--
-- Run these to verify the migration was successful:

-- Check that new columns exist on projects table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
  AND column_name IN ('auto_save_enabled', 'last_manual_save', 'has_unsaved_changes', 'version', 'version_history')
ORDER BY column_name;

-- Expected: 5 rows showing all the new columns

-- Check that new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_preferences', 'analytics_metrics', 'session_drafts')
ORDER BY table_name;

-- Expected: 3 rows

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
--
-- After running this script:
-- 1. The SaveManager warnings should disappear
-- 2. User preferences will be persisted in the database
-- 3. Analytics metrics tracking will be enabled
-- 4. Session drafts for autosave will work
--
-- ============================================================================
