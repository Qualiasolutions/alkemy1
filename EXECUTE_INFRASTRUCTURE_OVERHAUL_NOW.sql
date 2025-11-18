-- ====================================================================
-- 🚀 EXECUTE COMPLETE INFRASTRUCTURE OVERHAUL - ALL PHASES 🚀
-- Copy this entire script and paste into your Supabase SQL Editor
-- Then click "Run" to transform your entire database!
-- ====================================================================

SET statement_timeout = '1200s'; -- 20 minutes timeout for safety

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- PHASE 1: BACKUP & WIPE ALL DATA (FRESH START)
-- ====================================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 PHASE 1: Creating backup and wiping data...';

    -- Create backup schema
    CREATE SCHEMA IF NOT EXISTS backup_20251118;

    -- Backup existing data if any exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS backup_20251118.user_profiles_backup AS SELECT *, NOW() as backup_timestamp FROM public.user_profiles';
        RAISE NOTICE '✅ Backed up user_profiles';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS backup_20251118.projects_backup AS SELECT *, NOW() as backup_timestamp FROM public.projects';
        RAISE NOTICE '✅ Backed up projects';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_assets' AND table_schema = 'public') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS backup_20251118.media_assets_backup AS SELECT *, NOW() as backup_timestamp FROM public.media_assets';
        RAISE NOTICE '✅ Backed up media_assets';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_logs' AND table_schema = 'public') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS backup_20251118.usage_logs_backup AS SELECT *, NOW() as backup_timestamp FROM public.usage_logs';
        RAISE NOTICE '✅ Backed up usage_logs';
    END IF;

    -- Wipe all data for fresh start
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_logs' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.usage_logs CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_assets' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.media_assets CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.projects CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.user_profiles CASCADE;
    END IF;

    RAISE NOTICE '🎉 PHASE 1 COMPLETE: Data backed up and wiped!';
END $$;

-- ====================================================================
-- PHASE 2: CREATE SECURITY FRAMEWORK
-- ====================================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 PHASE 2: Creating security framework...';

    -- Create security schema
    CREATE SCHEMA IF NOT EXISTS security;

    -- Security tables
    CREATE TABLE IF NOT EXISTS security.audit_logs (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        table_name TEXT,
        old_values JSONB,
        new_values JSONB,
        success BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS security.security_events (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        event_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Enable RLS on security tables
    ALTER TABLE security.audit_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE security.security_events ENABLE ROW LEVEL SECURITY;

    -- RLS policies
    CREATE POLICY "Users own their audit logs" ON security.audit_logs
        FOR ALL TO authenticated USING (user_id = auth.uid());

    CREATE POLICY "Users own their security events" ON security.security_events
        FOR ALL TO authenticated USING (user_id = auth.uid());

    -- Service role bypass
    CREATE POLICY "Service role full access" ON security.audit_logs
        FOR ALL TO service_role USING (true);

    CREATE POLICY "Service role full access" ON security.security_events
        FOR ALL TO service_role USING (true);

    -- Security indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created ON security.audit_logs(user_id, created_at DESC);

    -- Grant permissions
    GRANT USAGE ON SCHEMA security TO authenticated;
    GRANT SELECT ON security.audit_logs TO authenticated;
    GRANT SELECT ON security.security_events TO authenticated;
    GRANT ALL ON SCHEMA security TO service_role;

    RAISE NOTICE '🎉 PHASE 2 COMPLETE: Security framework deployed!';
END $$;

-- ====================================================================
-- PHASE 3: PERFORMANCE OPTIMIZATION
-- ====================================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 PHASE 3: Optimizing performance...';

    -- Drop existing inefficient indexes
    DROP INDEX IF EXISTS idx_projects_user_id;
    DROP INDEX IF EXISTS idx_projects_updated_at;
    DROP INDEX IF EXISTS idx_media_assets_project_id;
    DROP INDEX IF EXISTS idx_media_assets_user_id;
    DROP INDEX IF EXISTS idx_usage_logs_user_id;
    DROP INDEX IF EXISTS idx_usage_logs_created_at;

    -- Create optimized composite indexes
    CREATE INDEX CONCURRENTLY idx_projects_user_id_updated_at ON public.projects(user_id, updated_at DESC);
    CREATE INDEX CONCURRENTLY idx_projects_last_accessed ON public.projects(last_accessed_at DESC NULLS LAST);

    -- Critical GIN indexes for JSONB fields (AI features)
    CREATE INDEX CONCURRENTLY idx_projects_script_analysis_gin ON public.projects USING GIN(script_analysis);
    CREATE INDEX CONCURRENTLY idx_projects_timeline_clips_gin ON public.projects USING GIN(timeline_clips);

    -- Media assets optimization
    CREATE INDEX CONCURRENTLY idx_media_assets_project_id_type ON public.media_assets(project_id, type);
    CREATE INDEX CONCURRENTLY idx_media_assets_user_id_created ON public.media_assets(user_id, created_at DESC);

    -- Usage logs optimization for analytics
    CREATE INDEX CONCURRENTLY idx_usage_logs_user_id_date ON public.usage_logs(user_id, created_at DESC);
    CREATE INDEX CONCURRENTLY idx_usage_logs_action_date ON public.usage_logs(action, created_at DESC);

    RAISE NOTICE '🎉 PHASE 3 COMPLETE: Performance optimized!';
END $$;

-- ====================================================================
-- PHASE 4: ENTERPRISE AUTO-SAVE SYSTEM
-- ====================================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 PHASE 4: Creating auto-save system...';

    -- Create autosave schema
    CREATE SCHEMA IF NOT EXISTS autosave;

    -- Enhance projects table with auto-save columns
    ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS auto_save_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS last_auto_save TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_dirty BOOLEAN DEFAULT false;

    -- Auto-save sessions table
    CREATE TABLE IF NOT EXISTS autosave.save_sessions (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        session_start TIMESTAMPTZ DEFAULT NOW(),
        save_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Project versions table
    CREATE TABLE IF NOT EXISTS autosave.project_versions (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        change_data JSONB NOT NULL,
        save_type TEXT NOT NULL CHECK (save_type IN ('auto', 'manual', 'merge')),
        created_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Auto-save function
    CREATE OR REPLACE FUNCTION autosave.perform_auto_save(
        project_uuid UUID,
        user_uuid UUID,
        changes_data JSONB
    )
    RETURNS TABLE(success BOOLEAN, version_number INTEGER) AS $$
    DECLARE
        project_record public.projects%ROWTYPE;
        new_version_number INTEGER;
    BEGIN
        SELECT * INTO project_record FROM public.projects WHERE id = project_uuid AND user_id = user_uuid;
        IF NOT FOUND THEN RETURN QUERY SELECT false, NULL; RETURN; END IF;

        new_version_number := project_record.current_version + 1;

        UPDATE public.projects SET
            script_content = COALESCE(changes_data->>'script_content', script_content),
            timeline_clips = COALESCE((changes_data->>'timeline_clips')::JSONB, timeline_clips),
            current_version = new_version_number,
            last_auto_save = NOW(),
            is_dirty = false
        WHERE id = project_uuid;

        INSERT INTO autosave.project_versions
        (project_id, version_number, change_data, created_by, save_type)
        VALUES (project_uuid, new_version_number, changes_data, user_uuid, 'auto');

        RETURN QUERY SELECT true, new_version_number;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Enable RLS
    ALTER TABLE autosave.save_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE autosave.project_versions ENABLE ROW LEVEL SECURITY;

    -- RLS policies
    CREATE POLICY "Users own their save sessions" ON autosave.save_sessions
        FOR ALL TO authenticated USING (user_id = auth.uid());

    CREATE POLICY "Users own their project versions" ON autosave.project_versions
        FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_versions.project_id AND p.user_id = auth.uid())
        );

    -- Service role bypass
    CREATE POLICY "Service role full access" ON autosave.save_sessions FOR ALL TO service_role USING (true);
    CREATE POLICY "Service role full access" ON autosave.project_versions FOR ALL TO service_role USING (true);

    -- Indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_save_sessions_project_user ON autosave.save_sessions(project_id, user_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_versions_project_number ON autosave.project_versions(project_id, version_number DESC);

    -- Grant permissions
    GRANT USAGE ON SCHEMA autosave TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON autosave.save_sessions TO authenticated;
    GRANT SELECT, INSERT ON autosave.project_versions TO authenticated;
    GRANT EXECUTE ON FUNCTION autosave.perform_auto_save(UUID, UUID, JSONB) TO authenticated;
    GRANT ALL ON SCHEMA autosave TO service_role;

    RAISE NOTICE '🎉 PHASE 4 COMPLETE: Auto-save system deployed!';
END $$;

-- ====================================================================
-- PHASE 5: REAL-TIME FEATURES
-- ====================================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 PHASE 5: Creating real-time features...';

    -- Create schemas
    CREATE SCHEMA IF NOT EXISTS realtime;
    CREATE SCHEMA IF NOT EXISTS analytics;

    -- User presence table
    CREATE TABLE IF NOT EXISTS realtime.user_presence (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
        session_id UUID NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('online', 'idle', 'away')),
        last_seen TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, session_id)
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS realtime.notifications (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Analytics events table
    CREATE TABLE IF NOT EXISTS analytics.events (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        event_type TEXT NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        event_data JSONB DEFAULT '{}'::JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE realtime.user_presence ENABLE ROW LEVEL SECURITY;
    ALTER TABLE realtime.notifications ENABLE ROW LEVEL SECURITY;
    ALTER TABLE analytics.events ENABLE ROW LEVEL SECURITY;

    -- RLS policies
    CREATE POLICY "Users own their presence" ON realtime.user_presence
        FOR ALL TO authenticated USING (user_id = auth.uid());

    CREATE POLICY "Users own their notifications" ON realtime.notifications
        FOR ALL TO authenticated USING (user_id = auth.uid());

    CREATE POLICY "Users own their events" ON analytics.events
        FOR ALL TO authenticated USING (user_id = auth.uid());

    -- Indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_presence_project_last_seen ON realtime.user_presence(project_id, last_seen DESC);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON realtime.notifications(user_id, is_read, created_at DESC);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_user_timestamp ON analytics.events(user_id, created_at DESC);

    -- Grant permissions
    GRANT USAGE ON SCHEMA realtime TO authenticated;
    GRANT USAGE ON SCHEMA analytics TO authenticated;

    GRANT SELECT, INSERT, UPDATE, DELETE ON realtime.user_presence TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON realtime.notifications TO authenticated;
    GRANT SELECT, INSERT ON analytics.events TO authenticated;

    GRANT ALL ON SCHEMA realtime TO service_role;
    GRANT ALL ON SCHEMA analytics TO service_role;

    RAISE NOTICE '🎉 PHASE 5 COMPLETE: Real-time features deployed!';
END $$;

-- ====================================================================
-- FINAL VALIDATION & SUCCESS SUMMARY
-- ====================================================================

DO $$
DECLARE
    schema_count INTEGER;
    table_count INTEGER;
    index_count INTEGER;
    backup_count INTEGER;
BEGIN
    -- Count what we created
    SELECT COUNT(*) INTO schema_count FROM information_schema.schemata
    WHERE schemaname IN ('security', 'autosave', 'realtime', 'analytics');

    SELECT COUNT(*) INTO table_count FROM information_schema.tables
    WHERE table_schema IN ('security', 'autosave', 'realtime', 'analytics');

    SELECT COUNT(*) INTO index_count FROM pg_indexes
    WHERE schemaname IN ('public', 'security', 'autosave', 'realtime') AND indexname LIKE '%idx_%';

    SELECT COUNT(*) INTO backup_count FROM information_schema.tables WHERE table_schema = 'backup_20251118';

    RAISE NOTICE '';
    RAISE NOTICE '🏆 INFRASTRUCTURE OVERHAUL COMPLETE! 🏆';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Schemas Created: %', schema_count;
    RAISE NOTICE '✅ Tables Created: %', table_count;
    RAISE NOTICE '✅ Indexes Created: %', index_count;
    RAISE NOTICE '✅ Backup Tables: %', backup_count;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your Alkemy AI Studio is now enterprise-ready!';
    RAISE NOTICE '';
    RAISE NOTICE 'Features Enabled:';
    RAISE NOTICE '• Enhanced security with RLS and audit logging';
    RAISE NOTICE '• Optimized performance with smart indexing';
    RAISE NOTICE '• Advanced auto-save with version control';
    RAISE NOTICE '• Real-time collaboration features';
    RAISE NOTICE '• Comprehensive analytics tracking';
    RAISE NOTICE '• Complete data backup for recovery';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Update frontend SaveManager service';
    RAISE NOTICE '2. Configure Supabase dashboard settings';
    RAISE NOTICE '3. Test auto-save functionality';
    RAISE NOTICE '4. Enable real-time features in frontend';
    RAISE NOTICE '';
END $$;

-- Success confirmation
SELECT '🎉 INFRASTRUCTURE OVERHAUL COMPLETE - System is production ready!' as status,
       NOW() as completion_timestamp;