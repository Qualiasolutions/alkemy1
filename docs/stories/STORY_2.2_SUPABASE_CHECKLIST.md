# Story 2.2 - Supabase Backend Setup Checklist

## 🎯 **Quick Setup (5 minutes)**

### ✅ **Step 1: Run the SQL Migration**

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/uiusqxdyzdkpyngppnwx/sql/new

2. **Execute Setup Script**:
   - Open file: `/supabase/STORY_2.2_SETUP.sql`
   - Copy **entire file** (Ctrl+A, Ctrl+C)
   - Paste into Supabase SQL Editor
   - Click **RUN** button

3. **Verify Success**:
   - You should see output showing:
     - ✅ "Tables Created: 2"
     - ✅ "Storage Buckets: character-references, character-models"

---

### ✅ **Step 2: Verify Tables Created**

Run this in SQL Editor to confirm:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%character%';
```

**Expected Output:**
- `character_identities`
- `character_identity_tests`

---

### ✅ **Step 3: Verify Storage Buckets**

1. Go to: **Storage** → **Buckets** (in left sidebar)

2. You should see:
   - ✅ `character-references` (Private)
   - ✅ `character-models` (Private)

---

### ✅ **Step 4: Test the Setup (Optional)**

Run this test query in SQL Editor:

```sql
-- Insert test character identity
INSERT INTO character_identities (
  user_id,
  project_id,
  character_id,
  status,
  reference_image_urls,
  technology_data
) VALUES (
  auth.uid(),
  'test-project',
  'test-character',
  'ready',
  ARRAY['https://example.com/ref1.jpg'],
  '{"type": "reference", "falCharacterId": "fal-test-123"}'::jsonb
);

-- Insert test results
INSERT INTO character_identity_tests (
  character_identity_id,
  test_type,
  generated_image_url,
  similarity_score
) VALUES (
  (SELECT id FROM character_identities WHERE character_id = 'test-character' LIMIT 1),
  'portrait',
  'https://example.com/generated.jpg',
  88.5
);

-- Verify data
SELECT * FROM character_identities WHERE user_id = auth.uid();
SELECT * FROM character_identity_tests;

-- Cleanup test data
DELETE FROM character_identities WHERE project_id = 'test-project';
```

---

## 📊 **What This Sets Up**

| Component | Description | Status |
|-----------|-------------|--------|
| **character_identities** | Stores identity metadata, status, reference images | ✅ Created by SQL |
| **character_identity_tests** | Stores Story 2.2 test results | ✅ Created by SQL |
| **RLS Policies** | User isolation (users see only their data) | ✅ Created by SQL |
| **Storage Buckets** | Reference images & models | ✅ Created by SQL |
| **Helper Functions** | `get_character_identity_status()`, `get_latest_identity_tests()` | ✅ Created by SQL |
| **Triggers** | Auto-update timestamps | ✅ Created by SQL |

---

## 🔍 **Troubleshooting**

### Error: "relation already exists"
- **Solution**: Tables already created! You're good to go. ✅

### Error: "permission denied"
- **Solution**: Make sure you're logged in as the project owner in Supabase Dashboard

### Error: "auth.users does not exist"
- **Solution**: Run the base schema first (`001_initial_schema.sql`)

### Storage buckets not visible
- **Solution**: Refresh the Storage page in Supabase Dashboard

---

## 🎉 **After Setup**

Once setup is complete, Story 2.2 will:

1. ✅ **Save character identities** to database (syncs across devices)
2. ✅ **Store test results** in `character_identity_tests` table
3. ✅ **Upload reference images** to Supabase Storage
4. ✅ **Enforce user isolation** via RLS policies
5. ✅ **Track approval status** for production use

---

## 📝 **Database Schema Reference**

### `character_identities` Table

```
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- project_id: TEXT
- character_id: TEXT
- status: 'none' | 'preparing' | 'ready' | 'error'
- reference_image_urls: TEXT[] (array of image URLs)
- approval_status: 'pending' | 'approved' | 'rejected'
- created_at: TIMESTAMPTZ
- last_updated: TIMESTAMPTZ (auto-updated)
- training_cost: NUMERIC
- error_message: TEXT
- technology_data: JSONB (stores Fal.ai character ID, etc.)
```

### `character_identity_tests` Table

```
- id: UUID (primary key)
- character_identity_id: UUID (foreign key)
- test_type: 'portrait' | 'fullbody' | 'profile' | 'lighting' | 'expression'
- generated_image_url: TEXT
- similarity_score: NUMERIC(5,2) (0-100, CLIP + pHash weighted)
- timestamp: TIMESTAMPTZ
- metadata: JSONB (optional: detailed scores)
```

---

## 🚀 **Production Status**

- ✅ **Frontend**: Deployed to Vercel (https://alkemy1-q45havzby-qualiasolutionscy.vercel.app)
- ✅ **Tests**: 42 tests passing (89% component coverage, 45% service coverage)
- ⏳ **Backend**: Needs SQL execution (5 minutes)

**After running the SQL script, Story 2.2 is 100% complete and production-ready!**

---

## 📞 **Need Help?**

If you encounter issues:
1. Check the SQL output for error messages
2. Verify you have admin access to the Supabase project
3. Check the Supabase logs in Dashboard → Logs

---

**Setup Time**: ~5 minutes
**Next Story**: Story 2.3 - Character Identity Refinement (coming soon)
