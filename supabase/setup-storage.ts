/**
 * Supabase Storage Setup Script
 *
 * Epic 2: Character Identity Consistency System
 * Story 2.1: Character Identity Training/Preparation Workflow
 *
 * This script creates Storage buckets and RLS policies for character identity assets.
 *
 * Usage:
 *   ts-node supabase/setup-storage.ts
 *
 * Prerequisites:
 *   - VITE_SUPABASE_URL environment variable set
 *   - VITE_SUPABASE_ANON_KEY environment variable set
 *   - Supabase project must have authentication enabled
 *
 * Buckets Created:
 *   1. character-references: Reference images uploaded by users (3-5 per character)
 *   2. character-models: Trained models or preprocessed data (LoRA/embeddings)
 *
 * RLS Policies:
 *   - Users can only access their own files (scoped by user_id in path)
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ============================================================================
// Storage Bucket Definitions
// ============================================================================

interface BucketConfig {
  id: string
  name: string
  public: boolean
  fileSizeLimit?: number // in bytes
  allowedMimeTypes?: string[]
}

const BUCKETS: BucketConfig[] = [
  {
    id: 'character-references',
    name: 'character-references',
    public: false,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB per file
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  {
    id: 'character-models',
    name: 'character-models',
    public: false,
    fileSizeLimit: 500 * 1024 * 1024, // 500MB per model
    allowedMimeTypes: ['application/octet-stream', 'application/json'],
  },
]

// ============================================================================
// Storage Bucket Creation
// ============================================================================

async function createBucket(config: BucketConfig): Promise<boolean> {
  console.log(`\n📦 Creating bucket: ${config.name}`)

  try {
    // Check if bucket already exists
    const { data: existingBuckets } = await supabase.storage.listBuckets()
    const bucketExists = existingBuckets?.some((b) => b.id === config.id)

    if (bucketExists) {
      console.log(`   ✅ Bucket "${config.name}" already exists`)
      return true
    }

    // Create bucket
    const { data, error } = await supabase.storage.createBucket(config.id, {
      public: config.public,
      fileSizeLimit: config.fileSizeLimit,
      allowedMimeTypes: config.allowedMimeTypes,
    })

    if (error) {
      console.error(`   ❌ Error creating bucket "${config.name}":`, error.message)
      return false
    }

    console.log(`   ✅ Bucket "${config.name}" created successfully`)
    return true
  } catch (error) {
    console.error(`   ❌ Unexpected error creating bucket "${config.name}":`, error)
    return false
  }
}

// ============================================================================
// RLS Policy Setup
// ============================================================================

/**
 * Note: Storage RLS policies must be created via SQL or Supabase Dashboard
 *
 * The following SQL should be run in Supabase SQL Editor:
 *
 * -- Policy: character-references bucket
 * CREATE POLICY character_references_policy ON storage.objects
 *   FOR ALL
 *   USING (
 *     bucket_id = 'character-references' AND
 *     auth.uid()::text = (storage.foldername(name))[1]
 *   );
 *
 * -- Policy: character-models bucket
 * CREATE POLICY character_models_policy ON storage.objects
 *   FOR ALL
 *   USING (
 *     bucket_id = 'character-models' AND
 *     auth.uid()::text = (storage.foldername(name))[1]
 *   );
 */

async function verifyRLSPolicies(): Promise<void> {
  console.log('\n🔒 RLS Policy Setup')
  console.log('   ⚠️  Storage RLS policies must be created via Supabase SQL Editor')
  console.log('   📄 See supabase/migrations/002_character_identity.sql (lines 219-247)')
  console.log("   📝 Run the commented SQL in your Supabase project's SQL Editor")
  console.log('\n   SQL to run:')
  console.log(`
    -- Policy: character-references bucket
    CREATE POLICY character_references_policy ON storage.objects
      FOR ALL
      USING (
        bucket_id = 'character-references' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );

    -- Policy: character-models bucket
    CREATE POLICY character_models_policy ON storage.objects
      FOR ALL
      USING (
        bucket_id = 'character-models' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `)
}

// ============================================================================
// Main Setup Function
// ============================================================================

async function setupStorage(): Promise<void> {
  console.log('🚀 Starting Supabase Storage setup for Character Identity System\n')
  console.log(`   Supabase URL: ${SUPABASE_URL}`)
  console.log(`   Total buckets to create: ${BUCKETS.length}`)

  let successCount = 0

  // Create all buckets
  for (const bucket of BUCKETS) {
    const success = await createBucket(bucket)
    if (success) successCount++
  }

  // Show RLS policy instructions
  await verifyRLSPolicies()

  // Summary
  console.log(`\n${'='.repeat(70)}`)
  console.log('📊 Setup Summary')
  console.log('='.repeat(70))
  console.log(`   Buckets created: ${successCount}/${BUCKETS.length}`)
  console.log(`   Status: ${successCount === BUCKETS.length ? '✅ SUCCESS' : '⚠️  PARTIAL SUCCESS'}`)
  console.log(`${'='.repeat(70)}\n`)

  if (successCount < BUCKETS.length) {
    console.error('❌ Some buckets failed to create. Check errors above.')
    process.exit(1)
  }

  console.log('✅ Storage setup complete!')
  console.log('⚠️  Remember to run the RLS policy SQL in Supabase SQL Editor\n')
}

// ============================================================================
// Run Setup
// ============================================================================

setupStorage().catch((error) => {
  console.error('❌ Fatal error during setup:', error)
  process.exit(1)
})
