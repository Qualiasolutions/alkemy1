# Supabase Security & Performance Fixes

This document explains how to apply the security and performance fixes for the Alkemy AI Studio Supabase database.

## Migration File

**File**: `supabase/migrations/002_security_performance_fixes.sql`

## Issues Fixed

### 1. Function Search Path Mutable (SECURITY) ✅
**Problem**: Functions without a fixed `search_path` are vulnerable to search path hijacking attacks.

**Solution**: Added `SET search_path = public, pg_temp` to all functions:
- `update_updated_at_column()`
- `handle_new_user()`
- `get_user_project_count()`
- `get_user_total_usage()`

### 2. Auth RLS Initialization Plan (PERFORMANCE) ✅
**Problem**: RLS policies calling `auth.uid()` directly cause the function to be re-evaluated for each row, resulting in poor query performance at scale.

**Solution**: Replaced `auth.uid()` with `(SELECT auth.uid())` in all RLS policies. This forces PostgreSQL to evaluate the function once and cache the result.

**Tables affected**:
- `user_profiles` (3 policies)
- `projects` (4 policies)
- `media_assets` (3 policies)
- `usage_logs` (2 policies)

### 3. Leaked Password Protection (AUTH CONFIG) ⚠️
**Problem**: Password leak protection via HaveIBeenPwned is currently disabled.

**Solution**: This must be manually enabled in the Supabase Dashboard (cannot be done via SQL).

## How to Apply Fixes

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `002_security_performance_fixes.sql`
5. Click **Run** to execute the migration

### Option 2: Via Supabase CLI

```bash
# Make sure you're in the project root
cd /path/to/alkemy

# Initialize Supabase (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_REF

# Push the new migration
supabase db push

# Or apply manually
supabase db remote commit
```

### Option 3: Direct SQL

If you prefer to run the SQL directly:

```bash
# Login to Supabase
supabase login

# Run the migration
psql YOUR_DATABASE_URL < supabase/migrations/002_security_performance_fixes.sql
```

## Enable Password Leak Protection

**IMPORTANT**: This must be done manually via the Supabase Dashboard.

### Steps:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings**
3. Scroll to **Password Policies** section
4. Enable **Password Leak Protection**
5. Click **Save**

This feature checks user passwords against the HaveIBeenPwned database to prevent the use of compromised passwords.

## Verification

After applying the migration, verify the fixes:

### Check Functions
```sql
-- Verify search_path is set for all functions
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';
```

Look for `SET search_path = public, pg_temp` in each function definition.

### Check RLS Policies
```sql
-- View all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  pg_get_expr(qual, (schemaname||'.'||tablename)::regclass) as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Look for `(SELECT auth.uid())` instead of just `auth.uid()`.

### Run Linter Again

After applying fixes, run the Supabase linter again to verify:

```bash
supabase db lint
```

## Performance Impact

**Before**: Each auth.uid() call was evaluated per row (N evaluations for N rows)
**After**: auth.uid() is evaluated once and cached (1 evaluation for N rows)

**Example**: For a query returning 1000 projects:
- Before: 1000 auth.uid() calls
- After: 1 auth.uid() call

This can result in **10-100x performance improvement** for large queries.

## Security Impact

**Before**: Functions were vulnerable to search path attacks
**After**: Functions use a fixed, secure search path

This prevents malicious users from creating objects in their own schema that could hijack function behavior.

## Additional Resources

- [Supabase RLS Performance Docs](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [PostgreSQL Function Security](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- [Database Linter](https://supabase.com/docs/guides/database/database-linter)

## Support

If you encounter any issues applying these fixes, please check:
1. You have the correct database permissions
2. No active connections are blocking the schema changes
3. The Supabase CLI is up to date (`supabase update`)

For migration errors, you may need to manually drop and recreate policies in the correct order.
