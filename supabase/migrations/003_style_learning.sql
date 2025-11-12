-- Migration 003: Style Learning (Epic 1, Story 1.3)
-- Creates user_style_profiles table for tracking filmmaker creative patterns

-- Create user_style_profiles table
CREATE TABLE IF NOT EXISTS user_style_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patterns JSONB NOT NULL DEFAULT '{"shotTypes":{}, "lensChoices":{}, "lighting":{}, "colorGrade":{}, "cameraMovement":{}}'::jsonb,
  total_projects INTEGER DEFAULT 0,
  total_shots INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_style_profiles_user_id ON user_style_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE user_style_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own style profile

-- Policy: Users can view their own style profile
CREATE POLICY "Users can view their own style profile"
  ON user_style_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own style profile
CREATE POLICY "Users can insert their own style profile"
  ON user_style_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own style profile
CREATE POLICY "Users can update their own style profile"
  ON user_style_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own style profile
CREATE POLICY "Users can delete their own style profile"
  ON user_style_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Helper function: Get style profile for current user
CREATE OR REPLACE FUNCTION get_user_style_profile()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  patterns JSONB,
  total_projects INTEGER,
  total_shots INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    usp.id,
    usp.user_id,
    usp.patterns,
    usp.total_projects,
    usp.total_shots,
    usp.created_at,
    usp.updated_at
  FROM user_style_profiles usp
  WHERE usp.user_id = auth.uid();
END;
$$;

-- Trigger: Update updated_at timestamp on row update
CREATE OR REPLACE FUNCTION update_style_profile_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_style_profiles_timestamp
  BEFORE UPDATE ON user_style_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_style_profile_timestamp();
