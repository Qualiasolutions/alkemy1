-- BMAD Initial Data Seed
-- Purpose: Populate BMAD tracking tables with existing epic and story data from documentation

-- Insert Epics based on existing documentation
INSERT INTO epics (epic_number, title, description, status, progress_percentage, priority) VALUES
    ('EPIC-1', 'Director Voice Enhancement', 'Voice I/O integration with AI director for cinematography decisions', 'complete', 100, 1),
    ('EPIC-2', 'Character Identity Consistency', 'LoRA-based character consistency system for visual similarity across generations', 'complete', 100, 2),
    ('EPIC-6', 'Analytics & Quality Metrics', 'Quality analysis, performance metrics, and cost tracking dashboard', 'in_progress', 50, 3),
    ('EPIC-3', '3D Worlds & Gaussian Splatting', 'Gaussian splatting integration for 3D world generation', 'not_started', 0, 4),
    ('EPIC-4', 'Voice Acting & Dialogue', 'AI voice generation and lip-sync for character dialogue', 'not_started', 0, 5),
    ('EPIC-5', 'Audio Production', 'Music generation, sound effects, and audio mixing', 'not_started', 0, 6),
    ('EPIC-7a', 'Timeline Editing Interface', 'Advanced timeline editor with multi-track support', 'not_started', 0, 7),
    ('EPIC-8', 'Export & Delivery', 'Professional export formats and delivery options', 'not_started', 0, 8)
ON CONFLICT (epic_number) DO UPDATE
SET
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    progress_percentage = EXCLUDED.progress_percentage,
    updated_at = NOW();

-- Insert Stories for Epic 1
WITH epic1 AS (SELECT id FROM epics WHERE epic_number = 'EPIC-1')
INSERT INTO stories (epic_id, story_number, title, description, status, progress_percentage, file_path) VALUES
    ((SELECT id FROM epic1), 'STORY-1.1', 'Voice Command Integration', 'Basic voice input for director commands', 'complete', 100, 'docs/stories/epic-1-story-1.1.md'),
    ((SELECT id FROM epic1), 'STORY-1.2', 'Voice Response System', 'AI voice responses for director queries', 'complete', 100, 'docs/stories/epic-1-story-1.2.md'),
    ((SELECT id FROM epic1), 'STORY-1.3', 'Director Style Learning', 'Learn and apply director cinematography preferences', 'complete', 100, 'docs/stories/epic-1-story-1.3.md'),
    ((SELECT id FROM epic1), 'STORY-1.4', 'Continuity Checking', 'Ensure visual and narrative continuity', 'complete', 100, 'docs/stories/epic-1-story-1.4.md')
ON CONFLICT (story_number) DO UPDATE
SET
    status = EXCLUDED.status,
    progress_percentage = EXCLUDED.progress_percentage,
    updated_at = NOW();

-- Insert Stories for Epic 2
WITH epic2 AS (SELECT id FROM epics WHERE epic_number = 'EPIC-2')
INSERT INTO stories (epic_id, story_number, title, description, status, progress_percentage, file_path) VALUES
    ((SELECT id FROM epic2), 'STORY-2.1', 'LoRA Training Interface', 'UI for training character LoRA models', 'complete', 100, 'docs/stories/epic-2-story-2.1.md'),
    ((SELECT id FROM epic2), 'STORY-2.2', 'Identity Testing Framework', 'Visual similarity testing for character consistency', 'complete', 100, 'docs/stories/epic-2-story-2.2.md'),
    ((SELECT id FROM epic2), 'STORY-2.3', 'Generation Integration', 'Integrate LoRA models into image generation pipeline', 'complete', 100, 'docs/stories/epic-2-story-2.3.md')
ON CONFLICT (story_number) DO UPDATE
SET
    status = EXCLUDED.status,
    progress_percentage = EXCLUDED.progress_percentage,
    updated_at = NOW();

-- Insert Stories for Epic 6 (Analytics)
WITH epic6 AS (SELECT id FROM epics WHERE epic_number = 'EPIC-6')
INSERT INTO stories (epic_id, story_number, title, description, status, progress_percentage, file_path) VALUES
    ((SELECT id FROM epic6), 'STORY-6.1', 'Quality Analysis Service', 'Automated quality scoring for generated content', 'complete', 100, 'docs/stories/epic-6-story-6.1.md'),
    ((SELECT id FROM epic6), 'STORY-6.2', 'Performance Metrics Tracking', 'Track generation times, API usage, and costs', 'in_progress', 50, 'docs/stories/epic-6-story-6.2.md'),
    ((SELECT id FROM epic6), 'STORY-6.3', 'Analytics Dashboard UI', 'Visual dashboard for metrics and analysis', 'not_started', 0, 'docs/stories/epic-6-story-6.3.md'),
    ((SELECT id FROM epic6), 'STORY-6.4', 'Export Analytics Reports', 'Generate PDF/CSV reports of analytics data', 'not_started', 0, 'docs/stories/epic-6-story-6.4.md')
ON CONFLICT (story_number) DO UPDATE
SET
    status = EXCLUDED.status,
    progress_percentage = EXCLUDED.progress_percentage,
    updated_at = NOW();

-- Insert Stories for Epic 3 (3D Worlds)
WITH epic3 AS (SELECT id FROM epics WHERE epic_number = 'EPIC-3')
INSERT INTO stories (epic_id, story_number, title, description, status, progress_percentage, file_path) VALUES
    ((SELECT id FROM epic3), 'STORY-3.1', 'Gaussian Splatting Viewer', 'WebGL viewer for gaussian splatting scenes', 'not_started', 0, 'docs/stories/epic-3-story-3.1.md'),
    ((SELECT id FROM epic3), 'STORY-3.2', '3D Scene Generation', 'Generate 3D scenes from text descriptions', 'not_started', 0, 'docs/stories/epic-3-story-3.2.md'),
    ((SELECT id FROM epic3), 'STORY-3.3', 'Camera Path Animation', 'Define and animate camera paths in 3D', 'not_started', 0, 'docs/stories/epic-3-story-3.3.md'),
    ((SELECT id FROM epic3), 'STORY-3.4', '3D Asset Library', 'Manage and organize 3D assets', 'not_started', 0, 'docs/stories/epic-3-story-3.4.md'),
    ((SELECT id FROM epic3), 'STORY-3.5', 'Export 3D Scenes', 'Export 3D scenes to standard formats', 'not_started', 0, 'docs/stories/epic-3-story-3.5.md')
ON CONFLICT (story_number) DO UPDATE
SET
    status = EXCLUDED.status,
    progress_percentage = EXCLUDED.progress_percentage,
    updated_at = NOW();

-- Insert sample acceptance criteria for Story 1.1
WITH story1_1 AS (SELECT id FROM stories WHERE story_number = 'STORY-1.1')
INSERT INTO acceptance_criteria (story_id, criterion_number, description, status) VALUES
    ((SELECT id FROM story1_1), 'AC1', 'Voice input captured via browser Web Speech API', 'passed'),
    ((SELECT id FROM story1_1), 'AC2', 'Voice commands parsed and validated', 'passed'),
    ((SELECT id FROM story1_1), 'AC3', 'Commands trigger appropriate director actions', 'passed'),
    ((SELECT id FROM story1_1), 'AC4', 'Error handling for unrecognized commands', 'passed'),
    ((SELECT id FROM story1_1), 'AC5', 'Visual feedback during voice recording', 'passed'),
    ((SELECT id FROM story1_1), 'AC6', 'Support for multiple languages', 'passed'),
    ((SELECT id FROM story1_1), 'AC7', 'Accessibility compliance for voice features', 'passed')
ON CONFLICT (story_id, criterion_number) DO UPDATE
SET
    status = EXCLUDED.status,
    updated_at = NOW();

-- Insert sample acceptance criteria for Story 2.1
WITH story2_1 AS (SELECT id FROM stories WHERE story_number = 'STORY-2.1')
INSERT INTO acceptance_criteria (story_id, criterion_number, description, status) VALUES
    ((SELECT id FROM story2_1), 'AC1', 'UI allows upload of 6-12 reference images', 'passed'),
    ((SELECT id FROM story2_1), 'AC2', 'Training triggers Fal.ai LoRA training API', 'passed'),
    ((SELECT id FROM story2_1), 'AC3', 'Progress tracking during training (5-10 minutes)', 'passed'),
    ((SELECT id FROM story2_1), 'AC4', 'LoRA URL stored in character identity metadata', 'passed'),
    ((SELECT id FROM story2_1), 'AC5', 'Visual status badges show training state', 'passed'),
    ((SELECT id FROM story2_1), 'AC6', 'Error handling and retry mechanism', 'passed'),
    ((SELECT id FROM story2_1), 'AC7', 'Training history and versioning', 'passed'),
    ((SELECT id FROM story2_1), 'AC8', 'Cost estimation before training', 'passed')
ON CONFLICT (story_id, criterion_number) DO UPDATE
SET
    status = EXCLUDED.status,
    updated_at = NOW();

-- Insert sample acceptance criteria for Story 6.2 (in progress)
WITH story6_2 AS (SELECT id FROM stories WHERE story_number = 'STORY-6.2')
INSERT INTO acceptance_criteria (story_id, criterion_number, description, status) VALUES
    ((SELECT id FROM story6_2), 'AC1', 'Track API call counts per service', 'passed'),
    ((SELECT id FROM story6_2), 'AC2', 'Calculate cost per API usage', 'passed'),
    ((SELECT id FROM story6_2), 'AC3', 'Measure generation time per operation', 'in_progress'),
    ((SELECT id FROM story6_2), 'AC4', 'Store metrics in Supabase', 'in_progress'),
    ((SELECT id FROM story6_2), 'AC5', 'Real-time metrics updates', 'pending'),
    ((SELECT id FROM story6_2), 'AC6', 'Historical metrics retention (30 days)', 'pending')
ON CONFLICT (story_id, criterion_number) DO UPDATE
SET
    status = EXCLUDED.status,
    updated_at = NOW();

-- Insert integration verifications for Story 2.3
WITH story2_3 AS (SELECT id FROM stories WHERE story_number = 'STORY-2.3')
INSERT INTO integration_verifications (story_id, verification_number, description, status) VALUES
    ((SELECT id FROM story2_3), 'IV1', 'LoRA parameters passed to generateStillVariants()', 'passed'),
    ((SELECT id FROM story2_3), 'IV2', 'Character identity preserved across generations', 'passed'),
    ((SELECT id FROM story2_3), 'IV3', 'Fallback to non-LoRA generation if unavailable', 'passed')
ON CONFLICT (story_id, verification_number) DO UPDATE
SET
    status = EXCLUDED.status,
    verification_date = NOW();

-- Insert migration checkpoints for Story 2.1
WITH story2_1 AS (SELECT id FROM stories WHERE story_number = 'STORY-2.1')
INSERT INTO migration_checkpoints (story_id, checkpoint_number, description, status, migration_script_path) VALUES
    ((SELECT id FROM story2_1), 'MC1', 'Add character_identities table', 'passed', 'supabase/migrations/004_character_identities.sql'),
    ((SELECT id FROM story2_1), 'MC2', 'Update character type to include identity field', 'passed', NULL)
ON CONFLICT (story_id, checkpoint_number) DO UPDATE
SET
    status = EXCLUDED.status,
    verified_date = NOW();

-- Create current sprint
INSERT INTO sprints (sprint_number, name, start_date, end_date, status, goals) VALUES
    (4, 'Sprint 4: BMAD Documentation Remediation', '2025-01-13', '2025-01-27', 'active',
     'Complete BMAD documentation system overhaul with automated tracking and dashboards')
ON CONFLICT (sprint_number) DO UPDATE
SET
    status = EXCLUDED.status,
    updated_at = NOW();

-- Assign stories to current sprint
WITH sprint4 AS (SELECT id FROM sprints WHERE sprint_number = 4),
     story6_2 AS (SELECT id FROM stories WHERE story_number = 'STORY-6.2'),
     story6_3 AS (SELECT id FROM stories WHERE story_number = 'STORY-6.3'),
     story6_4 AS (SELECT id FROM stories WHERE story_number = 'STORY-6.4')
INSERT INTO sprint_stories (sprint_id, story_id, points) VALUES
    ((SELECT id FROM sprint4), (SELECT id FROM story6_2), 5),
    ((SELECT id FROM sprint4), (SELECT id FROM story6_3), 8),
    ((SELECT id FROM sprint4), (SELECT id FROM story6_4), 3)
ON CONFLICT (sprint_id, story_id) DO NOTHING;

-- Create automated status triggers
INSERT INTO status_triggers (trigger_type, entity_type, pattern, target_status) VALUES
    ('test_passed', 'acceptance_criterion', 'test.*\\.passed', 'passed'),
    ('test_passed', 'acceptance_criterion', 'test.*\\.failed', 'failed'),
    ('file_created', 'integration_verification', 'components/.*\\.tsx', 'passed'),
    ('migration_applied', 'migration_checkpoint', 'supabase/migrations/.*\\.sql', 'passed'),
    ('commit_keyword', 'story', '\\[STORY-.*\\]', 'in_progress'),
    ('commit_keyword', 'story', 'fix\\(STORY-.*\\)', 'in_progress'),
    ('commit_keyword', 'story', 'feat\\(STORY-.*\\): complete', 'complete')
ON CONFLICT DO NOTHING;

-- Log initial status history entries
INSERT INTO status_history (entity_type, entity_id, old_status, new_status, changed_by, change_reason)
SELECT
    'epic' as entity_type,
    id as entity_id,
    'not_started' as old_status,
    status as new_status,
    'system' as changed_by,
    'Initial seed from documentation' as change_reason
FROM epics
WHERE status != 'not_started';

-- Add comments for future reference
COMMENT ON COLUMN epics.epic_number IS 'Human-readable epic identifier matching documentation';
COMMENT ON COLUMN stories.story_number IS 'Human-readable story identifier matching documentation files';
COMMENT ON COLUMN stories.file_path IS 'Path to markdown story file in docs/stories/ directory';
COMMENT ON COLUMN acceptance_criteria.validation_method IS 'How to verify: manual, automated test, integration test, etc.';
COMMENT ON COLUMN status_triggers.pattern IS 'Regex pattern to match against file paths or commit messages';

-- Refresh materialized views if they exist
-- These will be created by the application on first run
SELECT 'BMAD tracking system initialized with seed data' as status;