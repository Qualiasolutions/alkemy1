-- BMAD Tracking System Migration
-- Purpose: Create comprehensive tracking tables for epics, stories, acceptance criteria,
-- and automated status management for the Alkemy AI Studio project

-- Epic Tracking Table
CREATE TABLE IF NOT EXISTS epics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    epic_number TEXT UNIQUE NOT NULL,  -- e.g., "EPIC-1", "EPIC-2"
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete', 'blocked', 'deferred')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    priority INTEGER,
    dependencies JSONB DEFAULT '[]'::jsonb,  -- Array of epic_numbers this depends on
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Story Tracking Table
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    epic_id UUID REFERENCES epics(id) ON DELETE CASCADE,
    story_number TEXT UNIQUE NOT NULL,  -- e.g., "STORY-1.1", "STORY-2.1"
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'in_progress', 'review', 'complete', 'blocked', 'deferred')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    assignee TEXT,
    file_path TEXT,  -- Path to story markdown file
    dependencies JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(epic_id, story_number)
);

-- Acceptance Criteria Tracking
CREATE TABLE IF NOT EXISTS acceptance_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    criterion_number TEXT NOT NULL,  -- e.g., "AC1", "AC2"
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'blocked')),
    validation_method TEXT,  -- How to verify (manual, automated test, etc.)
    test_file_path TEXT,  -- Path to test file if automated
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    UNIQUE(story_id, criterion_number)
);

-- Integration Verification Tracking (IV checkpoints)
CREATE TABLE IF NOT EXISTS integration_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    verification_number TEXT NOT NULL,  -- e.g., "IV1", "IV2"
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'n/a')),
    verification_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, verification_number)
);

-- Migration/Compatibility Tracking (MC checkpoints)
CREATE TABLE IF NOT EXISTS migration_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    checkpoint_number TEXT NOT NULL,  -- e.g., "MC1", "MC2"
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'n/a')),
    migration_script_path TEXT,
    verified_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, checkpoint_number)
);

-- Status Change History (audit trail)
CREATE TABLE IF NOT EXISTS status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('epic', 'story', 'acceptance_criterion', 'integration_verification', 'migration_checkpoint')),
    entity_id UUID NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT,  -- User ID or 'system'
    change_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automated Status Triggers (for code-to-doc sync)
CREATE TABLE IF NOT EXISTS status_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('file_created', 'test_passed', 'migration_applied', 'commit_keyword')),
    entity_type TEXT NOT NULL,
    entity_id UUID,
    pattern TEXT NOT NULL,  -- Regex or file path pattern to match
    target_status TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint Tracking Table
CREATE TABLE IF NOT EXISTS sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_number INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    goals TEXT,
    retrospective TEXT,
    velocity INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint Story Assignment
CREATE TABLE IF NOT EXISTS sprint_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    points INTEGER,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sprint_id, story_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_epic_id ON stories(epic_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_acceptance_criteria_story_id ON acceptance_criteria(story_id);
CREATE INDEX IF NOT EXISTS idx_status_history_entity ON status_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON status_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sprint_stories_sprint_id ON sprint_stories(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_stories_story_id ON sprint_stories(story_id);

-- Enable Row Level Security
ALTER TABLE epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceptance_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to read all BMAD data
CREATE POLICY "Allow authenticated read access to epics" ON epics
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to stories" ON stories
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to acceptance_criteria" ON acceptance_criteria
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to integration_verifications" ON integration_verifications
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to migration_checkpoints" ON migration_checkpoints
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to status_history" ON status_history
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to status_triggers" ON status_triggers
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to sprints" ON sprints
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to sprint_stories" ON sprint_stories
    FOR SELECT TO authenticated USING (true);

-- RLS Policies: Allow authenticated users to write BMAD data (adjust based on your needs)
CREATE POLICY "Allow authenticated write access to epics" ON epics
    FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access to stories" ON stories
    FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access to acceptance_criteria" ON acceptance_criteria
    FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access to integration_verifications" ON integration_verifications
    FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access to migration_checkpoints" ON migration_checkpoints
    FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access to status_history" ON status_history
    FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access to status_triggers" ON status_triggers
    FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access to sprints" ON sprints
    FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access to sprint_stories" ON sprint_stories
    FOR ALL TO authenticated USING (true);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_epics_updated_at BEFORE UPDATE ON epics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_acceptance_criteria_updated_at BEFORE UPDATE ON acceptance_criteria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON sprints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically log status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
DECLARE
    entity_type_val TEXT;
BEGIN
    -- Determine entity type based on table name
    CASE TG_TABLE_NAME
        WHEN 'epics' THEN entity_type_val := 'epic';
        WHEN 'stories' THEN entity_type_val := 'story';
        WHEN 'acceptance_criteria' THEN entity_type_val := 'acceptance_criterion';
        WHEN 'integration_verifications' THEN entity_type_val := 'integration_verification';
        WHEN 'migration_checkpoints' THEN entity_type_val := 'migration_checkpoint';
    END CASE;

    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO status_history (
            entity_type,
            entity_id,
            old_status,
            new_status,
            changed_by,
            metadata
        ) VALUES (
            entity_type_val,
            NEW.id,
            OLD.status,
            NEW.status,
            current_setting('app.current_user', true),
            jsonb_build_object(
                'table_name', TG_TABLE_NAME,
                'timestamp', NOW()
            )
        );
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic status history logging
CREATE TRIGGER log_epic_status_change AFTER UPDATE ON epics
    FOR EACH ROW EXECUTE FUNCTION log_status_change();
CREATE TRIGGER log_story_status_change AFTER UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION log_status_change();
CREATE TRIGGER log_acceptance_criteria_status_change AFTER UPDATE ON acceptance_criteria
    FOR EACH ROW EXECUTE FUNCTION log_status_change();
CREATE TRIGGER log_integration_verification_status_change AFTER UPDATE ON integration_verifications
    FOR EACH ROW EXECUTE FUNCTION log_status_change();
CREATE TRIGGER log_migration_checkpoint_status_change AFTER UPDATE ON migration_checkpoints
    FOR EACH ROW EXECUTE FUNCTION log_status_change();

-- Function to calculate epic progress based on story completion
CREATE OR REPLACE FUNCTION calculate_epic_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_stories INTEGER;
    completed_stories INTEGER;
    new_progress INTEGER;
BEGIN
    -- Count total and completed stories for the epic
    SELECT COUNT(*) INTO total_stories
    FROM stories
    WHERE epic_id = COALESCE(NEW.epic_id, OLD.epic_id);

    SELECT COUNT(*) INTO completed_stories
    FROM stories
    WHERE epic_id = COALESCE(NEW.epic_id, OLD.epic_id)
    AND status = 'complete';

    -- Calculate progress percentage
    IF total_stories > 0 THEN
        new_progress := (completed_stories * 100) / total_stories;
    ELSE
        new_progress := 0;
    END IF;

    -- Update epic progress
    UPDATE epics
    SET progress_percentage = new_progress,
        status = CASE
            WHEN new_progress = 100 THEN 'complete'
            WHEN new_progress > 0 THEN 'in_progress'
            ELSE 'not_started'
        END,
        completed_at = CASE
            WHEN new_progress = 100 THEN NOW()
            ELSE NULL
        END
    WHERE id = COALESCE(NEW.epic_id, OLD.epic_id);

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update epic progress when story status changes
CREATE TRIGGER update_epic_progress_on_story_change
    AFTER INSERT OR UPDATE OR DELETE ON stories
    FOR EACH ROW EXECUTE FUNCTION calculate_epic_progress();

-- Function to calculate story progress based on acceptance criteria
CREATE OR REPLACE FUNCTION calculate_story_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_criteria INTEGER;
    passed_criteria INTEGER;
    new_progress INTEGER;
BEGIN
    -- Count total and passed acceptance criteria for the story
    SELECT COUNT(*) INTO total_criteria
    FROM acceptance_criteria
    WHERE story_id = COALESCE(NEW.story_id, OLD.story_id);

    SELECT COUNT(*) INTO passed_criteria
    FROM acceptance_criteria
    WHERE story_id = COALESCE(NEW.story_id, OLD.story_id)
    AND status = 'passed';

    -- Calculate progress percentage
    IF total_criteria > 0 THEN
        new_progress := (passed_criteria * 100) / total_criteria;
    ELSE
        new_progress := 0;
    END IF;

    -- Update story progress
    UPDATE stories
    SET progress_percentage = new_progress,
        completed_at = CASE
            WHEN new_progress = 100 THEN NOW()
            ELSE NULL
        END
    WHERE id = COALESCE(NEW.story_id, OLD.story_id);

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update story progress when acceptance criteria change
CREATE TRIGGER update_story_progress_on_criteria_change
    AFTER INSERT OR UPDATE OR DELETE ON acceptance_criteria
    FOR EACH ROW EXECUTE FUNCTION calculate_story_progress();

-- Views for easier querying
CREATE OR REPLACE VIEW epic_summary AS
SELECT
    e.epic_number,
    e.title,
    e.status,
    e.progress_percentage,
    COUNT(DISTINCT s.id) as total_stories,
    COUNT(DISTINCT CASE WHEN s.status = 'complete' THEN s.id END) as completed_stories,
    COUNT(DISTINCT ac.id) as total_acceptance_criteria,
    COUNT(DISTINCT CASE WHEN ac.status = 'passed' THEN ac.id END) as passed_acceptance_criteria
FROM epics e
LEFT JOIN stories s ON e.id = s.epic_id
LEFT JOIN acceptance_criteria ac ON s.id = ac.story_id
GROUP BY e.id, e.epic_number, e.title, e.status, e.progress_percentage
ORDER BY e.epic_number;

CREATE OR REPLACE VIEW story_summary AS
SELECT
    s.story_number,
    s.title,
    s.status,
    s.progress_percentage,
    e.epic_number,
    e.title as epic_title,
    COUNT(DISTINCT ac.id) as total_acceptance_criteria,
    COUNT(DISTINCT CASE WHEN ac.status = 'passed' THEN ac.id END) as passed_acceptance_criteria,
    COUNT(DISTINCT iv.id) as total_integrations,
    COUNT(DISTINCT CASE WHEN iv.status = 'passed' THEN iv.id END) as passed_integrations
FROM stories s
JOIN epics e ON s.epic_id = e.id
LEFT JOIN acceptance_criteria ac ON s.id = ac.story_id
LEFT JOIN integration_verifications iv ON s.id = iv.story_id
GROUP BY s.id, s.story_number, s.title, s.status, s.progress_percentage, e.epic_number, e.title
ORDER BY s.story_number;

-- Dashboard query view for quick status overview
CREATE OR REPLACE VIEW bmad_dashboard AS
SELECT
    (SELECT COUNT(*) FROM epics WHERE status = 'complete') as completed_epics,
    (SELECT COUNT(*) FROM epics WHERE status = 'in_progress') as in_progress_epics,
    (SELECT COUNT(*) FROM epics WHERE status = 'not_started') as not_started_epics,
    (SELECT COUNT(*) FROM stories WHERE status = 'complete') as completed_stories,
    (SELECT COUNT(*) FROM stories WHERE status = 'in_progress') as in_progress_stories,
    (SELECT COUNT(*) FROM stories WHERE status = 'blocked') as blocked_stories,
    (SELECT COUNT(*) FROM acceptance_criteria WHERE status = 'passed') as passed_criteria,
    (SELECT COUNT(*) FROM acceptance_criteria WHERE status = 'failed') as failed_criteria,
    (SELECT COUNT(*) FROM acceptance_criteria WHERE status = 'pending') as pending_criteria,
    (SELECT COUNT(DISTINCT story_id) FROM sprint_stories
     JOIN sprints ON sprints.id = sprint_stories.sprint_id
     WHERE sprints.status = 'active') as stories_in_current_sprint;

-- Comments for documentation
COMMENT ON TABLE epics IS 'BMAD Epic tracking - high-level feature sets or project phases';
COMMENT ON TABLE stories IS 'BMAD Story tracking - individual user stories within epics';
COMMENT ON TABLE acceptance_criteria IS 'Acceptance criteria for stories - defines "done"';
COMMENT ON TABLE integration_verifications IS 'Integration verification checkpoints for stories';
COMMENT ON TABLE migration_checkpoints IS 'Database migration and compatibility checkpoints';
COMMENT ON TABLE status_history IS 'Audit trail of all status changes across BMAD entities';
COMMENT ON TABLE status_triggers IS 'Automated status update triggers based on file/test events';
COMMENT ON TABLE sprints IS 'Sprint planning and tracking';
COMMENT ON TABLE sprint_stories IS 'Story assignments to sprints';