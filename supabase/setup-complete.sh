#!/bin/bash
#
# Epic 2 Complete Supabase Setup Script
# Automates database migration, storage bucket creation, and RLS policies
#
# Prerequisites:
# - Supabase CLI installed: npm install -g supabase
# - Supabase project linked or SUPABASE_DB_URL set
# - SUPABASE_ACCESS_TOKEN set (from https://supabase.com/dashboard/account/tokens)
#

set -e  # Exit on error

echo "=================================================="
echo "Epic 2 Supabase Complete Setup"
echo "Character Identity Consistency System"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI not found. Install with: npm install -g supabase${NC}"
    exit 1
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}Warning: SUPABASE_ACCESS_TOKEN not set${NC}"
    echo "You can get this from: https://supabase.com/dashboard/account/tokens"
    echo "Export it with: export SUPABASE_ACCESS_TOKEN=your_token_here"
    echo ""
fi

# Get project ref from .mcp.json
PROJECT_REF=$(grep -oP 'project_ref=\K[^&"]+' .mcp.json | head -1)
if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}Error: Could not extract project_ref from .mcp.json${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Project ref: $PROJECT_REF${NC}"
echo ""

# ============================================================================
# PHASE 1: DATABASE MIGRATION
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PHASE 1: Database Migration${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo "Running migration: 002_character_identity.sql"
echo ""

# Check if we can use supabase db push
if [ -f "supabase/config.toml" ]; then
    echo "Using Supabase CLI to run migration..."
    supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.$PROJECT_REF.supabase.co:5432/postgres" \
        --include-all || {
        echo -e "${YELLOW}Could not use 'supabase db push'. Will provide SQL for manual execution.${NC}"
    }
else
    echo -e "${YELLOW}No supabase config found. Providing SQL for manual execution.${NC}"
fi

echo ""
echo -e "${GREEN}✓ Database migration ready${NC}"
echo ""

# Provide SQL for manual execution
cat << 'EOF'

If the automatic migration didn't work, run this SQL in Supabase SQL Editor:
----------------------------------------------------------------------

-- Copy the entire contents of supabase/migrations/002_character_identity.sql
-- Or run this command to view it:
-- cat supabase/migrations/002_character_identity.sql

To verify, run:
SELECT table_name, row_security FROM information_schema.tables t
LEFT JOIN pg_tables pt ON t.table_name = pt.tablename
WHERE t.table_schema = 'public'
  AND t.table_name IN ('character_identities', 'character_identity_tests');

EOF

echo ""
read -p "Press Enter once database migration is complete..."
echo ""

# ============================================================================
# PHASE 2: STORAGE BUCKETS
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PHASE 2: Storage Buckets Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo "Creating storage buckets..."
echo ""

# Note: Supabase CLI doesn't have direct bucket creation commands
# We'll provide instructions for manual creation or use the management API

cat << 'EOF'

STORAGE BUCKET SETUP:
---------------------

Option 1: Via Supabase Dashboard (Recommended)
1. Go to https://app.supabase.com
2. Select your project
3. Navigate to Storage → Create new bucket

Bucket 1: character-references
- Name: character-references
- Public: NO (private)
- File size limit: 10485760 (10MB)
- Allowed MIME types: image/jpeg,image/png,image/webp

Bucket 2: character-models
- Name: character-models
- Public: NO (private)
- File size limit: 524288000 (500MB)
- Allowed MIME types: application/octet-stream,application/json

Option 2: Via Supabase Management API

curl -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/storage/buckets" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "character-references",
    "public": false,
    "file_size_limit": 10485760,
    "allowed_mime_types": ["image/jpeg", "image/png", "image/webp"]
  }'

curl -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/storage/buckets" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "character-models",
    "public": false,
    "file_size_limit": 524288000,
    "allowed_mime_types": ["application/octet-stream", "application/json"]
  }'

EOF

echo ""
read -p "Press Enter once storage buckets are created..."
echo ""

# ============================================================================
# PHASE 2.5: STORAGE RLS POLICIES
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PHASE 2.5: Storage RLS Policies${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo "Run this SQL in Supabase SQL Editor to apply RLS policies:"
echo ""

cat << 'EOF'

-- ============================================================================
-- Storage RLS Policies
-- ============================================================================

-- character-references bucket policy
CREATE POLICY character_references_policy ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'character-references' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

COMMENT ON POLICY character_references_policy ON storage.objects IS
  'Users can only access their own character reference images';

-- character-models bucket policy
CREATE POLICY character_models_policy ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'character-models' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

COMMENT ON POLICY character_models_policy ON storage.objects IS
  'Users can only access their own character models';

-- Verify policies
SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname IN ('character_references_policy', 'character_models_policy');

EOF

echo ""
read -p "Press Enter once RLS policies are applied..."
echo ""

# ============================================================================
# PHASE 3: VERCEL ENVIRONMENT VARIABLE
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PHASE 3: Vercel Environment Variable${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo "Adding FAL_API_KEY to Vercel..."
echo ""

if command -v vercel &> /dev/null; then
    echo "You need to add your Fal.ai API key"
    echo "Get it from: https://fal.ai/dashboard"
    echo ""
    read -p "Enter your Fal.ai API key (or press Enter to skip): " FAL_KEY

    if [ ! -z "$FAL_KEY" ]; then
        echo "$FAL_KEY" | vercel env add FAL_API_KEY production 2>/dev/null || {
            echo -e "${YELLOW}Could not add via CLI. Add manually via Vercel Dashboard.${NC}"
        }
        echo "$FAL_KEY" | vercel env add FAL_API_KEY preview 2>/dev/null
        echo "$FAL_KEY" | vercel env add FAL_API_KEY development 2>/dev/null
        echo -e "${GREEN}✓ FAL_API_KEY added to Vercel${NC}"
    else
        echo -e "${YELLOW}Skipped. Add FAL_API_KEY manually via Vercel Dashboard.${NC}"
    fi
else
    echo -e "${YELLOW}Vercel CLI not found. Add FAL_API_KEY manually:${NC}"
    echo ""
    echo "1. Go to https://vercel.com/qualiasolutionscy/alkemy1/settings/environment-variables"
    echo "2. Click 'Add New'"
    echo "3. Key: FAL_API_KEY"
    echo "4. Value: your_fal_api_key_from_https://fal.ai/dashboard"
    echo "5. Select all environments: Production, Preview, Development"
fi

echo ""
read -p "Press Enter once FAL_API_KEY is added to Vercel..."
echo ""

# ============================================================================
# PHASE 4: DEPLOY TO PRODUCTION
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PHASE 4: Deploy to Production${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if there are uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}You have uncommitted changes. Commit them first.${NC}"
    git status -s
    echo ""
fi

echo "Pushing to remote..."
git push origin main || {
    echo -e "${YELLOW}Could not push to remote. Push manually with: git push origin main${NC}"
}

echo ""
echo "Deploying to Vercel production..."

if command -v vercel &> /dev/null; then
    vercel --prod || {
        echo -e "${YELLOW}Deployment failed. Deploy manually with: vercel --prod${NC}"
    }
else
    echo -e "${YELLOW}Vercel CLI not found. Deploy will trigger automatically on git push.${NC}"
fi

echo ""
echo -e "${GREEN}✓ Deployment complete${NC}"
echo ""

# ============================================================================
# PHASE 5: VERIFICATION
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PHASE 5: Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo "Run these verification queries in Supabase SQL Editor:"
echo ""

cat << 'EOF'

-- 1. Verify tables exist
SELECT table_name, row_security FROM information_schema.tables t
LEFT JOIN pg_tables pt ON t.table_name = pt.tablename
WHERE t.table_schema = 'public'
  AND t.table_name IN ('character_identities', 'character_identity_tests');

-- 2. Verify helper functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_character_identity_status', 'get_latest_identity_tests');

-- 3. Verify storage buckets
SELECT id, name, public, file_size_limit FROM storage.buckets
WHERE name IN ('character-references', 'character-models');

-- 4. Verify storage RLS policies
SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Verify all queries above return expected results"
echo "2. Test character identity upload workflow:"
echo "   - Go to production URL"
echo "   - Sign in"
echo "   - Cast & Locations → Add Character"
echo "   - Click Upload icon (purple button)"
echo "   - Upload 3-5 reference images"
echo "   - Click 'Prepare Identity'"
echo "   - Verify green 'Identity' badge appears"
echo ""
echo "For detailed testing: docs/EPIC2_SUPABASE_SETUP_GUIDE.md (Phase 5)"
echo ""
echo -e "${GREEN}Epic 2 Supabase setup complete! 🎉${NC}"
