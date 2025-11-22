/**
 * Supabase Migration Runner
 *
 * Executes the 002_character_identity.sql migration using Supabase JS client
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

// Create Supabase client with service_role key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigration() {
  console.log('🚀 Starting Character Identity System migration...\n')
  console.log(`   Supabase URL: ${SUPABASE_URL}`)
  console.log(`   Project Ref: uiusqxdyzdkpyngppnwx\n`)

  // Read migration SQL file
  const migrationPath = path.join(__dirname, '002_character_identity.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

  // Split SQL into individual statements (skip comments and empty lines)
  const statements = migrationSQL
    .split(';')
    .map((stmt) => stmt.trim())
    .filter(
      (stmt) =>
        stmt.length > 0 &&
        !stmt.startsWith('--') &&
        !stmt.startsWith('/*') &&
        !stmt.includes('COMMENT ON SCHEMA') // Skip schema comment at end
    )

  console.log(`📄 Found ${statements.length} SQL statements to execute\n`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = `${statements[i]};` // Re-add semicolon

    // Extract statement type for logging
    const statementType = statement.match(/^(CREATE|ALTER|INSERT|DROP|COMMENT ON)/i)?.[1] || 'SQL'
    const statementPreview = statement.substring(0, 80).replace(/\s+/g, ' ')

    console.log(`[${i + 1}/${statements.length}] ${statementType}: ${statementPreview}...`)

    try {
      // Execute SQL statement using rpc call (Supabase PostgreSQL function)
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement })

      if (error) {
        // Check if error is about already existing objects (which is OK with IF NOT EXISTS)
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Already exists (skipping)\n`)
          successCount++
        } else {
          console.error(`   ❌ Error: ${error.message}\n`)
          errorCount++
        }
      } else {
        console.log(`   ✅ Success\n`)
        successCount++
      }
    } catch (err: any) {
      console.error(`   ❌ Exception: ${err.message}\n`)
      errorCount++
    }

    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log('='.repeat(70))
  console.log('📊 Migration Summary')
  console.log('='.repeat(70))
  console.log(`   Total statements: ${statements.length}`)
  console.log(`   Successful: ${successCount}`)
  console.log(`   Errors: ${errorCount}`)
  console.log(`   Success rate: ${((successCount / statements.length) * 100).toFixed(1)}%`)
  console.log(`${'='.repeat(70)}\n`)

  if (errorCount === 0) {
    console.log('✅ Migration completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Create storage buckets (run: npx ts-node supabase/setup-storage.ts)')
    console.log('2. Create storage RLS policies (run SQL in Supabase Dashboard)')
    console.log('3. Configure FAL_API_KEY in Vercel')
    process.exit(0)
  } else {
    console.log('⚠️  Migration completed with errors. Please review logs above.')
    process.exit(1)
  }
}

// Handle errors
process.on('unhandledRejection', (error: any) => {
  console.error('❌ Unhandled error:', error.message)
  process.exit(1)
})

// Run migration
runMigration().catch((error) => {
  console.error('❌ Fatal error:', error.message)
  process.exit(1)
})
