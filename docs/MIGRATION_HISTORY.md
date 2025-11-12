# Alkemy AI Studio - Database Migration History

**Last Updated**: 2025-11-12 17:30
**Total Migrations**: 6
**Database**: Supabase PostgreSQL

---

## Migration Overview

| # | File | Date | Description | Status |
|---|------|------|-------------|--------|
| 1 | 001_initial_schema.sql | 2025-11-10 | Initial database schema | ✅ Applied |
| 2 | 002_character_identity.sql | 2025-11-11 | Character identity tables | ✅ Applied |
| 3 | 003_storage_buckets.sql | 2025-11-11 | Storage bucket creation | ✅ Applied |
| 4 | 004_storage_rls_policies.sql | 2025-11-12 | RLS policies for buckets | ✅ Applied |
| 5 | 005_style_learning.sql | 2025-11-12 | Style learning tables | ✅ Applied |
| 6 | 006_quality_fixes.sql | 2025-11-12 | Security & performance fixes | ✅ Applied |

---

## Detailed Migration Log

### Migration 001: Initial Schema
**Date**: 2025-11-10
**Purpose**: Set up foundational database structure

**Tables Created**:
- `projects` - Main project storage
- `usage_logs` - API usage tracking
- `scenes` - Scene management
- `shots` - Shot details

**Functions Created**:
- `update_updated_at_column()` - Timestamp trigger function

**RLS Policies**: Basic user-scoped policies for all tables

---

### Migration 002: Character Identity
**Date**: 2025-11-11
**Purpose**: Support Epic 2 - Character Identity System

**Tables Created**:
- `character_identities` - Store character training data
  - Columns: id, user_id, project_id, name, status, training_images, lora_url, etc.
- `character_identity_tests` - Store test generation results
  - Columns: id, identity_id, test_type, prompt, image_url, similarity_score, etc.

**Functions Created**:
- `get_character_identity_status()` - Get current identity status
- `get_latest_identity_tests()` - Retrieve test results

**RLS Policies**: User-scoped INSERT, SELECT, UPDATE, DELETE

---

### Migration 003: Storage Buckets
**Date**: 2025-11-11
**Purpose**: Create storage infrastructure for character assets

**Buckets Created**:
1. `character-references` (Private, 10MB limit)
   - Purpose: Store character reference images
   - Path: `{user_id}/{character_id}/reference_images/`

2. `character-models` (Private, 52MB limit)
   - Purpose: Store trained LoRA models
   - Path: `{user_id}/{character_id}/models/`

3. `project-media` (Public)
   - Purpose: General project assets

4. `user-avatars` (Public)
   - Purpose: User profile images

---

### Migration 004: Storage RLS Policies
**Date**: 2025-11-12
**Purpose**: Secure storage buckets with proper access control

**Policies Applied**:

**character-references bucket** (3 policies):
- INSERT: `(bucket_id = 'character-references' AND auth.uid() = (storage.foldername(name))[1]::uuid)`
- SELECT: `(bucket_id = 'character-references' AND auth.uid() = (storage.foldername(name))[1]::uuid)`
- DELETE: `(bucket_id = 'character-references' AND auth.uid() = (storage.foldername(name))[1]::uuid)`

**character-models bucket** (3 policies):
- INSERT: Same pattern as character-references
- SELECT: Same pattern as character-references
- DELETE: Same pattern as character-references

**Total**: 6 RLS policies for secure user-scoped access

---

### Migration 005: Style Learning
**Date**: 2025-11-12
**Purpose**: Support Epic 1, Story 1.3 - Director Style Learning

**Tables Created**:
- `user_style_profiles` - Store learned director preferences
  - Columns: id, user_id, patterns (JSONB), preferences (JSONB), created_at, updated_at

**Functions Created**:
- `get_user_style_profile()` - Retrieve user's style profile
- `update_style_profile_timestamp()` - Trigger for timestamp updates

**Triggers Created**:
- `update_user_style_profiles_timestamp` - Auto-update modified timestamp

**RLS Policies**: User-scoped access for style profiles

---

### Migration 006: Quality Fixes
**Date**: 2025-11-12 17:30
**Purpose**: Address security vulnerabilities and performance issues

**Security Fixes (5 functions)**:
```sql
ALTER FUNCTION public.get_user_style_profile()
  SECURITY DEFINER
  SET search_path = public, pg_temp;

ALTER FUNCTION public.get_latest_identity_tests()
  SECURITY DEFINER
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_style_profile_timestamp()
  SECURITY DEFINER
  SET search_path = public, pg_temp;

ALTER FUNCTION public.get_character_identity_status(uuid)
  SECURITY DEFINER
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_updated_at_column()
  SECURITY DEFINER
  SET search_path = public, pg_temp;
```

**Performance Optimizations (6 RLS policies)**:
Changed from `auth.uid()` to `(SELECT auth.uid())` to prevent re-evaluation:
- character_identities (2 policies)
- character_identity_tests (2 policies)
- user_style_profiles (1 policy)
- usage_logs (1 policy)

**Index Creation**:
```sql
CREATE INDEX IF NOT EXISTS idx_usage_logs_project_id_fkey
  ON public.usage_logs(project_id);
```

**Impact**:
- Security warnings reduced: 6 → 1 (83% improvement)
- Performance warnings reduced: 16 → 9 (44% improvement)

---

## Migration Best Practices

### Learned Patterns:

1. **Security Functions**:
   - Always include `SECURITY DEFINER` for sensitive functions
   - Set explicit `search_path` to prevent injection
   - Pattern: `SET search_path = public, pg_temp`

2. **RLS Performance**:
   - Use `(SELECT auth.uid())` instead of `auth.uid()`
   - Prevents function re-evaluation per row
   - Critical for tables with many rows

3. **Storage Security**:
   - Path-based isolation: `{user_id}/{resource_id}/`
   - Use `storage.foldername(name)[1]::uuid` for user extraction
   - Separate policies for INSERT, SELECT, DELETE

4. **Migration Safety**:
   - Use `ALTER FUNCTION` instead of DROP/CREATE when possible
   - Check for trigger dependencies before dropping
   - Query actual function signatures before modifying

5. **Index Strategy**:
   - Add indexes for foreign key columns
   - Monitor unused indexes (acceptable in early stages)
   - Balance between query performance and write overhead

---

## Pending Migrations

### Planned for Sprint 3:
- Migration 007: Analytics dashboard tables
- Migration 008: 3D world metadata storage

### Future Considerations:
- Partitioning for usage_logs table (when >1M rows)
- Materialized views for analytics
- Full-text search indexes for script content

---

## Rollback Procedures

Each migration includes rollback statements (commented):

```sql
-- Rollback Migration 006
-- ALTER FUNCTION public.get_user_style_profile() RESET search_path;
-- ALTER FUNCTION public.get_user_style_profile() SECURITY INVOKER;
-- DROP INDEX IF EXISTS idx_usage_logs_project_id_fkey;
-- [Restore original RLS policies]
```

**Note**: Migrations 001-005 are foundational and should not be rolled back without full database reset.

---

## Database Health Metrics

### Current State (2025-11-12):
- **Tables**: 7
- **Functions**: 7
- **Triggers**: 2
- **RLS Policies**: 24
- **Indexes**: 15 (6 unused - acceptable)
- **Storage Buckets**: 4
- **Storage Policies**: 6

### Performance Indicators:
- Query performance: ✅ Optimized
- RLS overhead: ✅ Minimized with SELECT wrapper
- Index usage: ⚠️ 9 unused (monitor as data grows)
- Security score: ✅ 5/6 vulnerabilities fixed

---

## Migration Tools & Commands

### Apply Migration:
```bash
# Via Supabase CLI
supabase db push

# Via Dashboard
Supabase Dashboard → SQL Editor → Run migration

# Via API/MCP
Use Supabase MCP tool with SQL execution
```

### Verify Migration:
```sql
-- Check applied migrations
SELECT * FROM supabase_migrations.schema_migrations;

-- Run security advisors
SELECT * FROM supabase_public.lint_security_definer_functions();

-- Check performance
SELECT * FROM supabase_public.lint_auth_rls_initplan();
```

### Create New Migration:
```bash
# Generate timestamp
date +%Y%m%d%H%M%S

# Create file
touch supabase/migrations/007_description.sql

# Add to version control
git add supabase/migrations/
git commit -m "feat: add migration 007 for [feature]"
```

---

**Documentation Status**: ✅ COMPLETE
**Last Migration**: 006_quality_fixes.sql
**Next Review**: Before Migration 007