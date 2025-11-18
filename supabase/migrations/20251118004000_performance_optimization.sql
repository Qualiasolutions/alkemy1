-- Phase 3: Comprehensive Performance Optimization
-- Advanced indexing strategy, query optimization, and performance monitoring
-- This migration implements enterprise-grade performance improvements

BEGIN;

-- Create performance monitoring schema
CREATE SCHEMA IF NOT EXISTS performance;

-- Query performance tracking table
CREATE TABLE IF NOT EXISTS performance.query_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    query_hash TEXT NOT NULL,
    query_text TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    rows_returned INTEGER,
    rows_examined INTEGER,
    user_id UUID REFERENCES auth.users(id),
    table_name TEXT,
    operation_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slow query tracking table
CREATE TABLE IF NOT EXISTS performance.slow_queries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    query_text TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    threshold_ms INTEGER DEFAULT 1000,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    execution_plan JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table size monitoring
CREATE TABLE IF NOT EXISTS performance.table_statistics (
    table_name TEXT NOT NULL,
    schema_name TEXT NOT NULL DEFAULT 'public',
    row_count BIGINT,
    total_size_bytes BIGINT,
    index_size_bytes BIGINT,
    table_size_bytes BIGINT,
    last_analyzed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index usage statistics
CREATE TABLE IF NOT EXISTS performance.index_usage (
    index_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    usage_count BIGINT DEFAULT 0,
    last_used TIMESTAMPTZ,
    size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (index_name, table_name)
);

-- =================================================================
-- COMPREHENSIVE INDEXING STRATEGY
-- =================================================================

-- Drop existing indexes to recreate with optimized strategy
DROP INDEX IF EXISTS idx_projects_user_id;
DROP INDEX IF EXISTS idx_projects_updated_at;
DROP INDEX IF EXISTS idx_media_assets_project_id;
DROP INDEX IF EXISTS idx_media_assets_user_id;
DROP INDEX IF EXISTS idx_usage_logs_user_id;
DROP INDEX IF EXISTS idx_usage_logs_created_at;

-- Primary table indexes with optimized strategy

-- Projects table indexes
CREATE INDEX CONCURRENTLY idx_projects_user_id_updated_at
ON public.projects(user_id, updated_at DESC);

CREATE INDEX CONCURRENTLY idx_projects_last_accessed
ON public.projects(last_accessed_at DESC NULLS LAST)
WHERE last_accessed_at IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_projects_is_public
ON public.projects(is_public)
WHERE is_public = true;

-- GIN index for JSONB script_analysis (for AI script analysis queries)
CREATE INDEX CONCURRENTLY idx_projects_script_analysis_gin
ON public.projects USING GIN(script_analysis);

-- GIN index for JSONB timeline_clips (for timeline queries)
CREATE INDEX CONCURRENTLY idx_projects_timeline_clips_gin
ON public.projects USING GIN(timeline_clips);

-- Partial index for recently updated projects (performance for dashboard)
CREATE INDEX CONCURRENTLY idx_projects_recently_updated
ON public.projects(user_id, updated_at DESC)
WHERE updated_at > NOW() - INTERVAL '30 days';

-- Media assets indexes
CREATE INDEX CONCURRENTLY idx_media_assets_project_id_type
ON public.media_assets(project_id, type);

CREATE INDEX CONCURRENTLY idx_media_assets_user_id_created
ON public.media_assets(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_media_assets_type_created
ON public.media_assets(type, created_at DESC)
WHERE created_at > NOW() - INTERVAL '7 days';

-- Usage logs indexes (optimized for analytics)
CREATE INDEX CONCURRENTLY idx_usage_logs_user_id_date
ON public.usage_logs(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_usage_logs_action_date
ON public.usage_logs(action, created_at DESC);

CREATE INDEX CONCURRENTLY idx_usage_logs_cost_date
ON public.usage_logs(cost_usd DESC, created_at DESC)
WHERE cost_usd IS NOT NULL;

-- Composite index for usage analytics
CREATE INDEX CONCURRENTLY idx_usage_logs_user_project_action
ON public.usage_logs(user_id, project_id, action, created_at DESC);

-- User profiles indexes
CREATE INDEX CONCURRENTLY idx_user_profiles_subscription
ON public.user_profiles(subscription_tier, created_at DESC);

-- Security table indexes (if not already created)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created
ON security.audit_logs(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_created
ON security.audit_logs(action, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_user_severity
ON security.security_events(user_id, severity, created_at DESC);

-- =================================================================
-- ADVANCED PERFORMANCE FUNCTIONS
-- =================================================================

-- Query performance monitoring function
CREATE OR REPLACE FUNCTION performance.log_query_performance(
    query_text_param TEXT,
    execution_time_param INTEGER,
    rows_returned_param INTEGER DEFAULT NULL,
    user_id_param UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    query_hash_val TEXT;
    table_name_val TEXT;
    operation_type_val TEXT;
BEGIN
    -- Generate query hash
    query_hash_val := md5(regexp_replace(query_text_param, '\s+', ' ', 'g'));

    -- Extract table name and operation type (simplified)
    table_name_val := split_part(lower(query_text_param), ' ', 3);
    operation_type_val := split_part(lower(query_text_param), ' ', 1);

    -- Log to query_metrics
    INSERT INTO performance.query_metrics
    (query_hash, query_text, execution_time_ms, rows_returned, user_id, table_name, operation_type)
    VALUES (query_hash_val, query_text_param, execution_time_param, rows_returned_param, user_id_param, table_name_val, operation_type_val);

    -- Log slow queries
    IF execution_time_param > 1000 THEN -- More than 1 second
        INSERT INTO performance.slow_queries
        (query_text, execution_time_ms, user_id, execution_plan)
        VALUES (query_text_param, execution_time_param, user_id_param, NULL);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized project retrieval function
CREATE OR REPLACE FUNCTION performance.get_user_projects_optimized(
    user_uuid UUID,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0,
    include_archived BOOLEAN DEFAULT false
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    updated_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    is_public BOOLEAN,
    script_analysis JSONB,
    timeline_clips_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.updated_at,
        p.last_accessed_at,
        p.is_public,
        p.script_analysis,
        CASE
            WHEN p.timeline_clips IS NOT NULL THEN jsonb_array_length(p.timeline_clips)
            ELSE 0
        END
    FROM public.projects p
    WHERE p.user_id = user_uuid
    ORDER BY p.last_accessed_at DESC NULLS LAST, p.updated_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Project search function with optimized text search
CREATE OR REPLACE FUNCTION performance.search_projects(
    search_query TEXT,
    user_uuid UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        ts_rank_cd(
            to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.script_content, '')),
            plainto_tsquery('english', search_query)
        ) as rank
    FROM public.projects p
    WHERE (
        user_uuid IS NULL OR p.user_id = user_uuid
    )
    AND (
        to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.script_content, ''))
        @@ plainto_tsquery('english', search_query)
    )
    ORDER BY rank DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Media assets aggregation function
CREATE OR REPLACE FUNCTION performance.get_project_media_summary(
    project_uuid UUID
)
RETURNS TABLE (
    total_assets BIGINT,
    total_size_bytes BIGINT,
    assets_by_type JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_assets,
        COALESCE(SUM(file_size), 0) as total_size_bytes,
        jsonb_object_agg(type, type_count) as assets_by_type
    FROM (
        SELECT
            type,
            COUNT(*) as type_count
        FROM public.media_assets
        WHERE project_id = project_uuid
        GROUP BY type
    ) asset_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage analytics function with optimization
CREATE OR REPLACE FUNCTION performance.get_user_usage_analytics(
    user_uuid UUID,
    date_range_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    date_trunc TIMESTAMPTZ,
    total_tokens BIGINT,
    total_cost DECIMAL,
    operation_count BIGINT,
    top_actions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE_TRUNC('day', created_at) as date_trunc,
        COALESCE(SUM(tokens_used), 0) as total_tokens,
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COUNT(*) as operation_count,
        jsonb_agg(
            jsonb_build_object(
                'action', action,
                'count', COUNT(*)
            )
        ) as top_actions
    FROM public.usage_logs
    WHERE user_id = user_uuid
      AND created_at >= NOW() - (date_range_days || ' days')::INTERVAL
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY date_trunc DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- PERFORMANCE MONITORING VIEWS
-- =================================================================

-- Database performance dashboard view
CREATE OR REPLACE VIEW performance.performance_dashboard AS
SELECT
    'slow_queries' as metric,
    COUNT(*) as count,
    AVG(execution_time_ms) as avg_time_ms,
    MAX(execution_time_ms) as max_time_ms
FROM performance.slow_queries
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
    'total_queries' as metric,
    COUNT(*) as count,
    AVG(execution_time_ms) as avg_time_ms,
    MAX(execution_time_ms) as max_time_ms
FROM performance.query_metrics
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
    'tables_analyzed' as metric,
    COUNT(DISTINCT table_name) as count,
    NULL::INTEGER as avg_time_ms,
    NULL::INTEGER as max_time_ms
FROM performance.table_statistics
WHERE last_analyzed > NOW() - INTERVAL '24 hours';

-- Table size monitoring view
CREATE OR REPLACE VIEW performance.table_sizes AS
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public';

-- Index usage monitoring view
CREATE OR REPLACE VIEW performance.index_usage_stats AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- =================================================================
-- AUTOMATED MAINTENANCE FUNCTIONS
-- =================================================================

-- Automated VACUUM and ANALYZE function
CREATE OR REPLACE FUNCTION performance.auto_maintenance()
RETURNS TABLE(
    table_name TEXT,
    operation TEXT,
    status TEXT,
    execution_time_ms INTEGER
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    table_rec RECORD;
BEGIN
    -- Get all user tables
    FOR table_rec IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
    LOOP
        start_time := clock_timestamp();

        -- Perform ANALYZE
        EXECUTE 'ANALYZE public.' || quote_ident(table_rec.tablename);

        RETURN NEXT
        SELECT
            table_rec.tablename,
            'ANALYZE',
            'completed',
            EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER;

        -- Perform VACUUM if needed (based on dead tuples)
        IF (SELECT n_dead_tup FROM pg_stat_user_tables WHERE tablename = table_rec.tablename) > 1000 THEN
            start_time := clock_timestamp();

            EXECUTE 'VACUUM ANALYZE public.' || quote_ident(table_rec.tablename);

            RETURN NEXT
            SELECT
                table_rec.tablename,
                'VACUUM_ANALYZE',
                'completed',
                EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update table statistics function
CREATE OR REPLACE FUNCTION performance.update_table_statistics()
RETURNS VOID AS $$
DECLARE
    table_rec RECORD;
    row_count_val BIGINT;
    total_size_val BIGINT;
    index_size_val BIGINT;
    table_size_val BIGINT;
BEGIN
    -- Clear old statistics
    DELETE FROM performance.table_statistics;

    -- Gather current statistics
    FOR table_rec IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        -- Get row count
        EXECUTE format('SELECT COUNT(*) FROM public.%I', table_rec.tablename) INTO row_count_val;

        -- Get size information
        SELECT
            pg_total_relation_size('public.' || table_rec.tablename),
            pg_indexes_size('public.' || table_rec.tablename),
            pg_relation_size('public.' || table_rec.tablename)
        INTO total_size_val, index_size_val, table_size_val
        FROM (SELECT 1) dummy;

        -- Insert statistics
        INSERT INTO performance.table_statistics
        (table_name, row_count, total_size_bytes, index_size_bytes, table_size_bytes, last_analyzed)
        VALUES (
            table_rec.tablename,
            row_count_val,
            total_size_val,
            index_size_val,
            table_size_val,
            NOW()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- CONNECTION POOLING AND QUERY TIMEOUT CONFIGURATION
-- =================================================================

-- Note: These settings need to be configured in Supabase dashboard or via connection parameters
-- Documenting them here for reference:

/*
RECOMMENDED SUPABASE SETTINGS:

1. Connection Pooling:
- pool_mode = transaction
- default_pool_size = 25
- max_pool_size = 100

2. Query Timeouts:
- statement_timeout = 30000ms (30 seconds)
- idle_in_transaction_session_timeout = 60000ms (60 seconds)

3. Memory Settings:
- work_mem = 4MB
- maintenance_work_mem = 64MB
- effective_cache_size = 256MB

4. Planner Settings:
- random_page_cost = 1.1 (for SSD)
- effective_io_concurrency = 200 (for SSD)

Configure these in Supabase dashboard under Database > Settings
*/

-- =================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- =================================================================

-- User activity summary materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS performance.user_activity_summary AS
SELECT
    user_id,
    COUNT(*) as total_operations,
    SUM(tokens_used) as total_tokens,
    SUM(cost_usd) as total_cost,
    MAX(created_at) as last_activity,
    DATE_TRUNC('day', created_at) as activity_date
FROM public.usage_logs
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY user_id, DATE_TRUNC('day', created_at);

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_summary_unique
ON performance.user_activity_summary(user_id, activity_date);

-- Project statistics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS performance.project_statistics AS
SELECT
    p.user_id,
    COUNT(*) as total_projects,
    COUNT(*) FILTER (WHERE p.is_public = true) as public_projects,
    COUNT(*) FILTER (WHERE p.script_content IS NOT NULL) as projects_with_scripts,
    COUNT(*) FILTER (WHERE p.timeline_clips IS NOT NULL) as projects_with_timeline,
    COUNT(*) FILTER (WHERE ma.id IS NOT NULL) as projects_with_media,
    MAX(p.updated_at) as last_project_update
FROM public.projects p
LEFT JOIN public.media_assets ma ON p.id = ma.project_id
GROUP BY p.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_statistics_unique
ON performance.project_statistics(user_id);

-- Refresh function for materialized views
CREATE OR REPLACE FUNCTION performance.refresh_materialized_views()
RETURNS TABLE(view_name TEXT, status TEXT, refresh_time_ms INTEGER) AS $$
DECLARE
    start_time TIMESTAMPTZ;
BEGIN
    -- Refresh user activity summary
    start_time := clock_timestamp();
    REFRESH MATERIALIZED VIEW CONCURRENTLY performance.user_activity_summary;
    RETURN NEXT SELECT 'user_activity_summary', 'refreshed', EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER;

    -- Refresh project statistics
    start_time := clock_timestamp();
    REFRESH MATERIALIZED VIEW CONCURRENTLY performance.project_statistics;
    RETURN NEXT SELECT 'project_statistics', 'refreshed', EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for performance monitoring
GRANT USAGE ON SCHEMA performance TO authenticated;
GRANT SELECT ON performance.query_metrics TO authenticated;
GRANT SELECT ON performance.slow_queries TO authenticated;
GRANT SELECT ON performance.table_statistics TO authenticated;
GRANT SELECT ON performance.performance_dashboard TO authenticated;
GRANT SELECT ON performance.table_sizes TO authenticated;
GRANT SELECT ON performance.index_usage_stats TO authenticated;
GRANT SELECT ON performance.user_activity_summary TO authenticated;
GRANT SELECT ON performance.project_statistics TO authenticated;

GRANT ALL ON SCHEMA performance TO service_role;

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION performance.get_user_projects_optimized(UUID, INTEGER, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION performance.search_projects(TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION performance.get_project_media_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION performance.get_user_usage_analytics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION performance.auto_maintenance() TO service_role;
GRANT EXECUTE ON FUNCTION performance.update_table_statistics() TO service_role;
GRANT EXECUTE ON FUNCTION performance.refresh_materialized_views() TO service_role;

-- Create performance indexes for monitoring tables
CREATE INDEX IF NOT EXISTS idx_query_metrics_user_created ON performance.query_metrics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_metrics_execution_time ON performance.query_metrics(execution_time_ms DESC);
CREATE INDEX IF NOT EXISTS idx_slow_queries_created_at ON performance.slow_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slow_queries_execution_time ON performance.slow_queries(execution_time_ms DESC);

-- Initialize performance monitoring
INSERT INTO performance.query_metrics
(query_hash, query_text, execution_time_ms, operation_type)
VALUES (
    'performance_initialization',
    'Performance optimization framework deployed',
    0,
    'SYSTEM_INITIALIZATION'
);

COMMIT;

/*
PERFORMANCE OPTIMIZATION DEPLOYMENT COMPLETE

Indexes Created:
✅ Optimized composite indexes for all tables
✅ GIN indexes for JSONB fields (script_analysis, timeline_clips)
✅ Partial indexes for common query patterns
✅ Specialized indexes for analytics queries

Performance Functions:
✅ Query performance monitoring
✅ Optimized project retrieval
✅ Advanced search capabilities
✅ Media aggregation functions
✅ Usage analytics optimization

Materialized Views:
✅ User activity summary
✅ Project statistics dashboard

Maintenance:
✅ Automated VACUUM/ANALYZE functions
✅ Statistics collection
✅ Performance monitoring dashboard

Next Steps:
1. Configure connection pooling in Supabase dashboard
2. Set up automated maintenance schedules
3. Monitor slow queries and optimize further
4. Configure alerting for performance degradation
*/