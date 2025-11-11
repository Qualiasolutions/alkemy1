#!/bin/bash
#
# Supabase Migration Runner
# Executes 002_character_identity.sql migration via Supabase Management API
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Starting Character Identity System migration..."
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check required variables
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${RED}❌ Error: VITE_SUPABASE_URL not set${NC}"
    exit 1
fi

if [ -z "$VITE_SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: VITE_SUPABASE_SERVICE_ROLE_KEY not set${NC}"
    exit 1
fi

# Extract project ref from URL (format: https://{ref}.supabase.co)
PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed -n 's/.*\/\/\([^.]*\).supabase.co.*/\1/p')

echo "   Supabase URL: $VITE_SUPABASE_URL"
echo "   Project Ref: $PROJECT_REF"
echo ""

# Read migration SQL
MIGRATION_FILE="supabase/migrations/002_character_identity.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo "📄 Reading migration file: $MIGRATION_FILE"
echo ""

# Execute SQL via Supabase Management API
# Note: The Management API's SQL endpoint requires the SUPABASE_ACCESS_TOKEN

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Warning: SUPABASE_ACCESS_TOKEN not set${NC}"
    echo "   Using direct database connection method instead..."
    echo ""

    # Alternative: Use PostgREST directly with service_role key
    # This requires executing each statement separately

    echo "📋 Executing SQL statements..."

    # Split into individual statements and execute
    # Note: This is a simplified approach - may need adjustment for complex SQL

    while IFS= read -r line || [ -n "$line" ]; do
        # Skip comments and empty lines
        if [[ "$line" =~ ^[[:space:]]*-- ]] || [[ "$line" =~ ^[[:space:]]*$ ]] || [[ "$line" =~ ^[[:space:]]*/\* ]]; then
            continue
        fi

        echo "$line"
    done < "$MIGRATION_FILE"

    echo ""
    echo -e "${YELLOW}⚠️  Manual execution required${NC}"
    echo "   Please copy the SQL above and run it in Supabase SQL Editor:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql"
    echo ""
    exit 0
fi

echo "✅ Using Management API with access token"
echo ""

# Execute migration via Management API
RESPONSE=$(curl -s -X POST \
    "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg sql "$(cat $MIGRATION_FILE)" '{query: $sql}')")

# Check response
if echo "$RESPONSE" | grep -q "error"; then
    echo -e "${RED}❌ Migration failed:${NC}"
    echo "$RESPONSE" | jq '.'
    exit 1
else
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Create storage buckets (run: npx ts-node supabase/setup-storage.ts)"
    echo "2. Create storage RLS policies (see: supabase/STORAGE_SETUP.md)"
    echo "3. Configure FAL_API_KEY in Vercel"
fi