-- Moodboard Optimization Migration
-- Optimizes moodboard storage and adds necessary indexes for better performance

-- Add moodboard specific indexes
CREATE INDEX IF NOT EXISTS idx_projects_moodboard_data_gin
ON projects USING GIN (moodboard_data)
WHERE moodboard_data IS NOT NULL;

-- Add moodboard storage bucket policies if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'projects',
  'projects',
  true,
  10485760, -- 10MB per file
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];

-- Row Level Security for moodboard images in storage
-- Allow users to read their own project images
CREATE POLICY "Users can view own project moodboard images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'projects' AND
  auth.uid()::text = (split_part(name, '/', 1))
);

-- Allow users to upload moodboard images to their own projects
CREATE POLICY "Users can upload own project moodboard images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'projects' AND
  auth.uid()::text = (split_part(name, '/', 1))
);

-- Allow users to update own project moodboard images
CREATE POLICY "Users can update own project moodboard images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'projects' AND
  auth.uid()::text = (split_part(name, '/', 1))
);

-- Allow users to delete own project moodboard images
CREATE POLICY "Users can delete own project moodboard images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'projects' AND
  auth.uid()::text = (split_part(name, '/', 1))
);

-- Add moodboard validation function
CREATE OR REPLACE FUNCTION validate_moodboard_template(data jsonb)
RETURNS boolean AS $$
BEGIN
  -- Check required fields
  IF NOT (data ? 'id' AND data ? 'title' AND data ? 'items') THEN
    RETURN false;
  END IF;

  -- Check items is an array and not empty
  IF NOT jsonb_typeof(data->'items') = 'array' THEN
    RETURN false;
  END IF;

  -- Check item count limit (20 items max)
  IF jsonb_array_length(data->'items') > 20 THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Add moodboard update trigger with validation
CREATE OR REPLACE FUNCTION validate_and_update_moodboard()
RETURNS trigger AS $$
BEGIN
  -- Validate each moodboard template
  IF NEW.moodboard_data IS NOT NULL THEN
    FOR template IN SELECT jsonb_array_elements(NEW.moodboard_data) AS moodboard LOOP
      IF NOT validate_moodboard_template(template.moodboard) THEN
        RAISE EXCEPTION 'Invalid moodboard template structure';
      END IF;
    END LOOP;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_moodboard_update ON projects;

-- Create the trigger
CREATE TRIGGER validate_moodboard_update
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION validate_and_update_moodboard();

-- Add moodboard analytics table
CREATE TABLE IF NOT EXISTS moodboard_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  moodboard_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('upload', 'delete', 'generate_ai', 'web_search')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for moodboard analytics
CREATE INDEX IF NOT EXISTS idx_moodboard_usage_logs_user_id ON moodboard_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_moodboard_usage_logs_project_id ON moodboard_usage_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_moodboard_usage_logs_created_at ON moodboard_usage_logs(created_at);

-- RLS for moodboard usage logs
ALTER TABLE moodboard_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy for moodboard usage logs
CREATE POLICY "Users can view own moodboard usage logs" ON moodboard_usage_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own moodboard usage logs" ON moodboard_usage_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add function to log moodboard usage
CREATE OR REPLACE FUNCTION log_moodboard_usage(
  p_user_id UUID,
  p_project_id UUID,
  p_moodboard_id TEXT,
  p_action TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO moodboard_usage_logs (user_id, project_id, moodboard_id, action, metadata)
  VALUES (p_user_id, p_project_id, p_moodboard_id, p_action, p_metadata);
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON moodboard_usage_logs TO authenticated;
GRANT SELECT ON moodboard_usage_logs TO service_role;

COMMENT ON TABLE moodboard_usage_logs IS 'Tracks moodboard usage patterns and actions for analytics';
COMMENT ON COLUMN moodboard_usage_logs.action IS 'Type of action: upload, delete, generate_ai, web_search';
COMMENT ON COLUMN moodboard_usage_logs.metadata IS 'Additional context about the action (file size, AI generation time, search query, etc.)';