/**
 * Supabase Migration Runner for 003_style_learning.sql
 *
 * Executes the Style Learning migration using Supabase JS client
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
  console.log('🚀 Starting Style Learning migration (003)...\n')
  console.log(`   Supabase URL: ${SUPABASE_URL}`)
  console.log(`   Project Ref: uiusqxdyzdkpyngppnwx\n`)

  // Read migration SQL file
  const migrationPath = path.join(__dirname, 'migrations', '003_style_learning.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

  console.log(`📄 Executing migration: 003_style_learning.sql\n`)
  console.log(`   Migration creates: user_style_profiles table with RLS policies\n`)

  try {
    // For complex migrations with multiple statements, we use the SQL editor approach
    // Execute the entire migration as one transaction
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL,
    })

    if (error) {
      // Check if the table already exists
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️  Objects already exist - checking current state...\n')

        // Verify table exists
        const { data: tableCheck, error: tableError } = await supabase
          .from('user_style_profiles')
          .select('*')
          .limit(0)

        if (!tableError) {
          console.log('✅ Table user_style_profiles exists and is accessible\n')
          console.log('✅ Migration appears to be already applied\n')
          console.log('='.repeat(70))
          console.log('📊 Migration Result: Already Applied')
          console.log('='.repeat(70))
          process.exit(0)
        } else {
          console.error(`❌ Error accessing table: ${tableError.message}\n`)
          process.exit(1)
        }
      } else {
        console.error(`❌ Migration error: ${error.message}\n`)
        console.error(`   Details: ${JSON.stringify(error, null, 2)}\n`)
        process.exit(1)
      }
    } else {
      console.log('✅ Migration executed successfully!\n')
      console.log('='.repeat(70))
      console.log('📊 Migration Summary')
      console.log('='.repeat(70))
      console.log('   Created: user_style_profiles table')
      console.log('   Created: Index on user_id')
      console.log('   Enabled: Row Level Security (RLS)')
      console.log('   Created: 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)')
      console.log('   Created: get_user_style_profile() helper function')
      console.log('   Created: update_style_profile_timestamp() trigger')
      console.log(`${'='.repeat(70)}\n`)
      console.log('✅ Story 1.3 backend setup complete!\n')
      process.exit(0)
    }
  } catch (err: any) {
    console.error(`❌ Fatal error: ${err.message}\n`)
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
