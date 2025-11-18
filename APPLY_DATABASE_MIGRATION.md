# Database Migration Guide

## Migration Required: Save Tracking Columns

### What's Missing?
The production database is missing columns that the SaveManager service expects:
- `auto_save_enabled` (boolean)
- `last_manual_save` (timestamp)
- `has_unsaved_changes` (boolean)
- `version` (integer)
- `version_history` (jsonb)

### Impact
**Current Status**: Application works fine, but you'll see this warning in the console:
```
[SaveManager] Project metadata update skipped - columns not in database. 
Run supabase/APPLY_MISSING_MIGRATIONS.sql to add them.
```

**After Migration**: Full save tracking metadata will be persisted, including:
- Auto-save enabled/disabled state
- Last manual save timestamp
- Unsaved changes indicator
- Version history for project rollback

---

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to https://app.supabase.com
2. Select your project: **uiusqxdyzdkpyngppnwx**
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the ENTIRE content of `/supabase/APPLY_MISSING_MIGRATIONS.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)

### Option 2: Supabase CLI

```bash
# Make sure you're in the project directory
cd /home/qualiasolutions/Desktop/Projects/platforms/alkemy

# Link to remote project (if not already linked)
npx supabase link --project-ref uiusqxdyzdkpyngppnwx

# Apply migration
npx supabase db execute --file supabase/APPLY_MISSING_MIGRATIONS.sql
```

---

## Verification

After applying the migration, verify it worked:

### Check in Supabase Dashboard
1. Go to **Table Editor** → **projects**
2. You should see new columns:
   - `auto_save_enabled`
   - `last_manual_save`
   - `has_unsaved_changes`
   - `version`
   - `version_history`

### Check in Application
1. Open the application
2. Open browser console (F12)
3. Make a change to a project
4. You should NOT see the warning anymore
5. Check the console for: `[SaveManager] Project saved successfully`

---

## Migration Contents

The migration adds:

1. **user_preferences table** (if not exists)
   - Stores UI state, voice settings, style learning preferences
   - Replaces localStorage for user preferences

2. **Projects table columns**
   - `auto_save_enabled`: Track if auto-save is on/off
   - `last_manual_save`: Timestamp of last manual save
   - `has_unsaved_changes`: Boolean flag for unsaved changes
   - `version`: Integer version number (auto-increment on save)
   - `version_history`: JSONB array of past versions for rollback

3. **RLS Policies**
   - Row-Level Security policies for user_preferences table
   - Ensures users can only access their own preferences

---

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Remove columns from projects table
ALTER TABLE public.projects DROP COLUMN IF EXISTS auto_save_enabled;
ALTER TABLE public.projects DROP COLUMN IF EXISTS last_manual_save;
ALTER TABLE public.projects DROP COLUMN IF EXISTS has_unsaved_changes;
ALTER TABLE public.projects DROP COLUMN IF EXISTS version;
ALTER TABLE public.projects DROP COLUMN IF EXISTS version_history;

-- Drop user_preferences table
DROP TABLE IF EXISTS public.user_preferences;
```

**Note**: This will NOT break the application - the SaveManager gracefully handles missing columns.

---

## Timeline

- **Priority**: LOW (non-breaking warning only)
- **Recommended**: Apply during next maintenance window
- **Required**: No - application functions normally without it

---

## Support

If you encounter issues:

1. Check Supabase logs in Dashboard → Logs
2. Verify the SQL syntax in the migration file
3. Ensure you have admin access to the database
4. Contact support with error messages if needed

---

**Last Updated**: 2025-11-18
**Migration File**: `/supabase/APPLY_MISSING_MIGRATIONS.sql`
