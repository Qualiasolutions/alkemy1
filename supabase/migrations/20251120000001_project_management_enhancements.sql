-- =====================================================
-- Migration: Project Management Enhancements
-- Date: 2025-11-20
-- Description: Adds soft delete, templates, activity logging, and enhanced metadata
-- =====================================================

-- =====================================================
-- PART 1: SOFT DELETE IMPLEMENTATION
-- =====================================================

-- Add soft delete columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS permanently_delete_at timestamptz DEFAULT NULL;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_permanently_delete_at ON projects(permanently_delete_at);

-- =====================================================
-- PART 2: ENHANCED PROJECT METADATA
-- =====================================================

-- Add metadata columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS description text DEFAULT '',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS parent_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS template_category text DEFAULT NULL;

-- Create indexes for metadata queries
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_projects_is_template ON projects(is_template);
CREATE INDEX IF NOT EXISTS idx_projects_parent_project ON projects(parent_project_id);

-- =====================================================
-- PART 3: PROJECT TEMPLATES TABLE
-- =====================================================

-- Create project templates table
CREATE TABLE IF NOT EXISTS project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  script_content text,
  script_analysis jsonb,
  moodboard jsonb,
  timeline_clips jsonb DEFAULT '[]'::jsonb,
  roadmap_blocks jsonb DEFAULT '[]'::jsonb,
  media_assets jsonb DEFAULT '[]'::jsonb,
  tags text[] DEFAULT '{}',
  is_system boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  usage_count int DEFAULT 0,
  rating float DEFAULT 0.0,
  CONSTRAINT template_category_check CHECK (category IN ('documentary', 'narrative', 'commercial', 'music-video', 'animation', 'custom'))
);

-- Create indexes for templates
CREATE INDEX IF NOT EXISTS idx_templates_category ON project_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_system ON project_templates(is_system);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON project_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_usage_count ON project_templates(usage_count DESC);

-- =====================================================
-- PART 4: PROJECT ACTIVITY LOG
-- =====================================================

-- Create activity log table
CREATE TABLE IF NOT EXISTS project_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT activity_action_check CHECK (action IN (
    'created', 'updated', 'deleted', 'restored',
    'exported', 'imported', 'shared', 'duplicated',
    'template_created', 'template_applied',
    'script_analyzed', 'generation_completed',
    'auto_saved', 'manual_saved', 'version_created'
  ))
);

-- Create indexes for activity log
CREATE INDEX IF NOT EXISTS idx_activity_project ON project_activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON project_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON project_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_created ON project_activity_log(created_at DESC);

-- =====================================================
-- PART 5: SQL FUNCTIONS
-- =====================================================

-- Function to soft delete a project
CREATE OR REPLACE FUNCTION soft_delete_project(project_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET
    deleted_at = now(),
    permanently_delete_at = now() + interval '30 days',
    updated_at = now()
  WHERE id = project_id AND deleted_at IS NULL;

  -- Log the action
  INSERT INTO project_activity_log (project_id, user_id, action, details)
  VALUES (project_id, auth.uid(), 'deleted', jsonb_build_object('soft_delete', true));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a soft-deleted project
CREATE OR REPLACE FUNCTION restore_project(project_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET
    deleted_at = NULL,
    permanently_delete_at = NULL,
    updated_at = now()
  WHERE id = project_id AND deleted_at IS NOT NULL;

  -- Log the action
  INSERT INTO project_activity_log (project_id, user_id, action, details)
  VALUES (project_id, auth.uid(), 'restored', jsonb_build_object('restored_at', now()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create project from template
CREATE OR REPLACE FUNCTION create_project_from_template(
  template_id uuid,
  new_name text,
  new_description text DEFAULT ''
)
RETURNS uuid AS $$
DECLARE
  new_project_id uuid;
  template_data record;
BEGIN
  -- Get template data
  SELECT * INTO template_data FROM project_templates WHERE id = template_id;

  IF template_data IS NULL THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  -- Create new project
  INSERT INTO projects (
    name,
    description,
    script_content,
    script_analysis,
    moodboard,
    timeline_clips,
    roadmap_blocks,
    media_assets,
    tags,
    user_id,
    parent_project_id
  ) VALUES (
    new_name,
    COALESCE(new_description, template_data.description),
    template_data.script_content,
    template_data.script_analysis,
    template_data.moodboard,
    template_data.timeline_clips,
    template_data.roadmap_blocks,
    template_data.media_assets,
    template_data.tags,
    auth.uid(),
    NULL
  ) RETURNING id INTO new_project_id;

  -- Update template usage count
  UPDATE project_templates
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE id = template_id;

  -- Log the action
  INSERT INTO project_activity_log (project_id, user_id, action, details)
  VALUES (
    new_project_id,
    auth.uid(),
    'template_applied',
    jsonb_build_object('template_id', template_id, 'template_name', template_data.name)
  );

  RETURN new_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to permanently delete projects past retention period
CREATE OR REPLACE FUNCTION permanently_delete_expired_projects()
RETURNS void AS $$
BEGIN
  DELETE FROM projects
  WHERE deleted_at IS NOT NULL
    AND permanently_delete_at IS NOT NULL
    AND permanently_delete_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 6: ROW LEVEL SECURITY POLICIES
-- =====================================================

-- RLS for project_templates
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;

-- Users can view all system templates and their own templates
CREATE POLICY "Users can view templates" ON project_templates
  FOR SELECT USING (
    is_system = true OR created_by = auth.uid()
  );

-- Users can create their own templates
CREATE POLICY "Users can create templates" ON project_templates
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND is_system = false
  );

-- Users can update their own templates
CREATE POLICY "Users can update own templates" ON project_templates
  FOR UPDATE USING (
    created_by = auth.uid() AND is_system = false
  );

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON project_templates
  FOR DELETE USING (
    created_by = auth.uid() AND is_system = false
  );

-- RLS for project_activity_log
ALTER TABLE project_activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view activity for their own projects
CREATE POLICY "Users can view own project activity" ON project_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_activity_log.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- System can insert activity logs
CREATE POLICY "System can insert activity" ON project_activity_log
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- =====================================================
-- PART 7: TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to project_templates
DROP TRIGGER IF EXISTS update_project_templates_updated_at ON project_templates;
CREATE TRIGGER update_project_templates_updated_at
  BEFORE UPDATE ON project_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- PART 8: SEED SYSTEM TEMPLATES
-- =====================================================

-- Insert system templates
INSERT INTO project_templates (name, description, category, is_system, tags, script_content, script_analysis)
VALUES
  (
    'Documentary Template',
    'Standard documentary structure with interview segments and B-roll',
    'documentary',
    true,
    ARRAY['documentary', 'interview', 'educational'],
    'FADE IN:

TITLE: [YOUR DOCUMENTARY TITLE]

INT. INTERVIEW SETUP - DAY

[Description of interview subject and setting]

INTERVIEW SUBJECT
(speaking to camera)
[Opening statement that hooks the viewer]

EXT. B-ROLL LOCATION - DAY

[Descriptive B-roll shots that support the narrative]

[Continue with documentary structure...]

FADE OUT.',
    '{"title": "Documentary Template", "scenes": [], "characters": [], "locations": []}'::jsonb
  ),
  (
    'Short Film Template',
    'Three-act structure for narrative short films (5-15 minutes)',
    'narrative',
    true,
    ARRAY['narrative', 'short-film', 'fiction'],
    'FADE IN:

TITLE: [YOUR FILM TITLE]

ACT ONE - SETUP

EXT. [OPENING LOCATION] - [TIME OF DAY]

[Establish your protagonist and their world]

[Inciting incident occurs]

ACT TWO - CONFRONTATION

[Rising action and complications]

[Protagonist faces obstacles]

ACT THREE - RESOLUTION

[Climax and resolution]

FADE OUT.',
    '{"title": "Short Film Template", "scenes": [], "characters": [], "locations": []}'::jsonb
  ),
  (
    'Commercial Template',
    '30-second commercial format with product showcase',
    'commercial',
    true,
    ARRAY['commercial', 'advertising', 'marketing'],
    'FADE IN:

PRODUCT: [PRODUCT NAME]
DURATION: 30 SECONDS

SCENE 1 - HOOK (0-5 seconds)

[Attention-grabbing opening]

SCENE 2 - PROBLEM (5-10 seconds)

[Present the problem your product solves]

SCENE 3 - SOLUTION (10-20 seconds)

[Show how your product solves the problem]

SCENE 4 - CTA (20-30 seconds)

[Call to action with product shot and branding]

FADE OUT.',
    '{"title": "Commercial Template", "scenes": [], "characters": [], "locations": []}'::jsonb
  ),
  (
    'Music Video Template',
    'Performance and narrative hybrid structure',
    'music-video',
    true,
    ARRAY['music-video', 'performance', 'artistic'],
    'FADE IN:

SONG: [SONG TITLE]
ARTIST: [ARTIST NAME]
DURATION: [SONG LENGTH]

VERSE 1

INT./EXT. [PERFORMANCE LOCATION] - [TIME]

[Artist performance setup]

[Narrative elements that complement lyrics]

CHORUS

[High-energy performance shots]

[Visual hook that represents the song''s theme]

[Continue structure through song...]

FADE OUT.',
    '{"title": "Music Video Template", "scenes": [], "characters": [], "locations": []}'::jsonb
  ),
  (
    'Animation Template',
    'Character-driven animation with clear story beats',
    'animation',
    true,
    ARRAY['animation', 'animated', 'cartoon'],
    'FADE IN:

TITLE: [YOUR ANIMATION TITLE]

INT. [ANIMATED WORLD] - DAY

[Establish animated universe rules and style]

CHARACTER 1 enters frame.

CHARACTER 1
(animated expression)
[Opening dialogue]

[Visual gag or character moment]

[Continue with animation-specific directions...]

FADE OUT.',
    '{"title": "Animation Template", "scenes": [], "characters": [], "locations": []}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- PART 9: SCHEDULED CLEANUP
-- =====================================================

-- Create a scheduled job for cleanup (requires pg_cron extension)
-- Note: This is commented out as pg_cron may not be available
-- Uncomment if pg_cron is installed

/*
SELECT cron.schedule(
  'cleanup-soft-deleted-projects',
  '0 2 * * *', -- Run at 2 AM daily
  $$SELECT permanently_delete_expired_projects();$$
);
*/

-- =====================================================
-- PART 10: GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON project_templates TO authenticated;
GRANT SELECT, INSERT ON project_activity_log TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_project TO authenticated;
GRANT EXECUTE ON FUNCTION restore_project TO authenticated;
GRANT EXECUTE ON FUNCTION create_project_from_template TO authenticated;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Add migration completion log
DO $$
BEGIN
  RAISE NOTICE 'Project Management Enhancements migration completed successfully';
  RAISE NOTICE 'Added: Soft delete, Templates, Activity logging, Enhanced metadata';
  RAISE NOTICE 'Created: 2 new tables, 5 SQL functions, 10+ indexes';
  RAISE NOTICE 'Seeded: 5 system templates';
END $$;