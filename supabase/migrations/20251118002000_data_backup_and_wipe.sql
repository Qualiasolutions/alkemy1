-- Phase 1: Comprehensive Data Backup & Complete System Wipe
-- This migration creates emergency backups and wipes all user data for fresh start
-- Run this in Supabase SQL Editor with backup permissions

BEGIN;

-- Create backup schema for emergency recovery
CREATE SCHEMA IF NOT EXISTS backup_20251118;

-- Create comprehensive backup tables with timestamps
CREATE TABLE IF NOT EXISTS backup_20251118.user_profiles_backup AS
SELECT
    id,
    email,
    name,
    avatar_url,
    subscription_tier,
    created_at,
    updated_at,
    NOW() as backup_timestamp
FROM public.user_profiles;

CREATE TABLE IF NOT EXISTS backup_20251118.projects_backup AS
SELECT
    id,
    user_id,
    title,
    script_content,
    script_analysis,
    timeline_clips,
    moodboard_data,
    project_settings,
    is_public,
    shared_with,
    created_at,
    updated_at,
    last_accessed_at,
    NOW() as backup_timestamp
FROM public.projects;

CREATE TABLE IF NOT EXISTS backup_20251118.media_assets_backup AS
SELECT
    id,
    project_id,
    user_id,
    type,
    url,
    file_name,
    file_size,
    mime_type,
    metadata,
    created_at,
    NOW() as backup_timestamp
FROM public.media_assets;

CREATE TABLE IF NOT EXISTS backup_20251118.usage_logs_backup AS
SELECT
    id,
    user_id,
    project_id,
    action,
    tokens_used,
    cost_usd,
    metadata,
    created_at,
    NOW() as backup_timestamp
FROM public.usage_logs;

-- Create backup of all other existing tables (check for additional tables)
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT IN ('user_profiles', 'projects', 'media_assets', 'usage_logs')
        AND tablename NOT LIKE 'pg_%'
    LOOP
        EXECUTE format('CREATE TABLE IF NOT EXISTS backup_20251118.%I AS SELECT *, NOW() as backup_timestamp FROM public.%I',
                      table_name || '_backup', table_name);
    END LOOP;
END $$;

-- Create a backup summary table
CREATE TABLE IF NOT EXISTS backup_20251118.backup_summary AS
SELECT
    'user_profiles' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record,
    NOW() as backup_timestamp
FROM public.user_profiles

UNION ALL

SELECT
    'projects' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record,
    NOW() as backup_timestamp
FROM public.projects

UNION ALL

SELECT
    'media_assets' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record,
    NOW() as backup_timestamp
FROM public.media_assets

UNION ALL

SELECT
    'usage_logs' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record,
    NOW() as backup_timestamp
FROM public.usage_logs;

-- Create indexes on backup tables for potential recovery
CREATE INDEX IF NOT EXISTS idx_backup_user_profiles_id ON backup_20251118.user_profiles_backup(id);
CREATE INDEX IF NOT EXISTS idx_backup_projects_id ON backup_20251118.projects_backup(id);
CREATE INDEX IF NOT EXISTS idx_backup_projects_user_id ON backup_20251118.projects_backup(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_media_assets_id ON backup_20251118.media_assets_backup(id);
CREATE INDEX IF NOT EXISTS idx_backup_media_assets_project_id ON backup_20251118.media_assets_backup(project_id);
CREATE INDEX IF NOT EXISTS idx_backup_usage_logs_id ON backup_20251118.usage_logs_backup(id);
CREATE INDEX IF NOT EXISTS idx_backup_usage_logs_user_id ON backup_20251118.usage_logs_backup(user_id);

-- Log the backup operation
CREATE TABLE IF NOT EXISTS backup_20251118.backup_operations_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    operation_type TEXT NOT NULL,
    status TEXT NOT NULL,
    rows_affected INTEGER,
    operation_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO backup_20251118.backup_operations_log (operation_type, status, operation_details)
VALUES (
    'comprehensive_backup_and_wipe_preparation',
    'completed',
    json_build_object(
        'backup_schema', 'backup_20251118',
        'timestamp', NOW(),
        'purpose', 'Emergency backup before complete data wipe'
    )
);

COMMIT;

-- =================================================================
-- PHASE 1B: COMPLETE DATA WIPE
-- WARNING: This will delete ALL user data permanently
-- Only run after backup verification is complete
-- =================================================================

BEGIN;

-- Disable triggers temporarily for faster truncation
ALTER TABLE public.user_profiles DISABLE TRIGGER ALL;
ALTER TABLE public.projects DISABLE TRIGGER ALL;
ALTER TABLE public.media_assets DISABLE TRIGGER ALL;
ALTER TABLE public.usage_logs DISABLE TRIGGER ALL;

-- Complete data wipe with CASCADE to handle foreign keys
TRUNCATE TABLE public.usage_logs CASCADE;
TRUNCATE TABLE public.media_assets CASCADE;
TRUNCATE TABLE public.projects CASCADE;
TRUNCATE TABLE public.user_profiles CASCADE;

-- Reset sequences
ALTER SEQUENCE IF EXISTS public.user_profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.projects_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.media_assets_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.usage_logs_id_seq RESTART WITH 1;

-- Re-enable triggers
ALTER TABLE public.user_profiles ENABLE TRIGGER ALL;
ALTER TABLE public.projects ENABLE TRIGGER ALL;
ALTER TABLE public.media_assets ENABLE TRIGGER ALL;
ALTER TABLE public.usage_logs ENABLE TRIGGER ALL;

-- Clear storage buckets (commented out - run manually in Supabase dashboard)
-- DELETE FROM storage.objects WHERE bucket_id IN ('project-media', 'user-avatars', 'character-models');

-- Log the wipe operation
INSERT INTO backup_20251118.backup_operations_log (operation_type, status, operation_details)
VALUES (
    'complete_data_wipe',
    'completed',
    json_build_object(
        'wiped_tables', ARRAY['user_profiles', 'projects', 'media_assets', 'usage_logs'],
        'timestamp', NOW(),
        'note', 'All user data permanently deleted, schema preserved'
    )
);

-- Create verification query results
CREATE TABLE IF NOT EXISTS backup_20251118.post_wipe_verification AS
SELECT
    'user_profiles' as table_name,
    (SELECT COUNT(*) FROM public.user_profiles) as remaining_rows
UNION ALL
SELECT
    'projects' as table_name,
    (SELECT COUNT(*) FROM public.projects) as remaining_rows
UNION ALL
SELECT
    'media_assets' as table_name,
    (SELECT COUNT(*) FROM public.media_assets) as remaining_rows
UNION ALL
SELECT
    'usage_logs' as table_name,
    (SELECT COUNT(*) FROM public.usage_logs) as remaining_rows;

COMMIT;

-- =================================================================
-- RECOVERY INSTRUCTIONS (SAVE THIS INFORMATION)
-- =================================================================

/*
EMERGENCY RECOVERY PROCEDURES:

1. To restore from backup (if needed):
   -- Disable RLS temporarily
   ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.media_assets DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.usage_logs DISABLE ROW LEVEL SECURITY;

   -- Restore data
   INSERT INTO public.user_profiles SELECT * FROM backup_20251118.user_profiles_backup;
   INSERT INTO public.projects SELECT * FROM backup_20251118.projects_backup;
   INSERT INTO public.media_assets SELECT * FROM backup_20251118.media_assets_backup;
   INSERT INTO public.usage_logs SELECT * FROM backup_20251118.usage_logs_backup;

   -- Re-enable RLS
   ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

2. To verify backup integrity:
   SELECT * FROM backup_20251118.backup_summary;
   SELECT * FROM backup_20251118.post_wipe_verification;

3. Storage cleanup:
   - Manually delete all files from storage buckets in Supabase dashboard
   - Buckets to clean: project-media, user-avatars, character-models

4. Backup schema location:
   - All backups stored in backup_20251118 schema
   - Timestamp: 2024-11-18
   - Can be exported if needed for external backup

SYSTEM STATUS: READY FOR FRESH START
All user data wiped, schema preserved, backup created securely
*/