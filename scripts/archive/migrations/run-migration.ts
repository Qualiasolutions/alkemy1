/**
 * Execute Supabase Migration 003 - Style Learning
 * Runs the migration SQL directly via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)="?([^"]+)"?$/);
        if (match) {
            process.env[match[1]] = match[2].replace(/^"|"$/g, '');
        }
    });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runMigration() {
    console.log('🚀 Running Migration 003: Style Learning\n');
    console.log(`   Supabase URL: ${SUPABASE_URL}`);
    console.log(`   Project Ref: uiusqxdyzdkpyngppnwx\n`);

    // Read migration SQL file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '003_style_learning.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Executing migration SQL...\n');

    try {
        // Execute migration using raw SQL query
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

        if (error) {
            console.error(`❌ Migration failed: ${error.message}`);
            console.error(`   Code: ${error.code}`);
            console.error(`   Details: ${JSON.stringify(error, null, 2)}\n`);
            process.exit(1);
        }

        console.log('✅ Migration executed successfully!\n');
        console.log('=' .repeat(70));
        console.log('Migration Summary');
        console.log('='.repeat(70));
        console.log('✅ Created: user_style_profiles table');
        console.log('✅ Created: Index on user_id');
        console.log('✅ Enabled: Row Level Security (RLS)');
        console.log('✅ Created: 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)');
        console.log('✅ Created: get_user_style_profile() helper function');
        console.log('✅ Created: update_style_profile_timestamp() trigger');
        console.log('=' .repeat(70) + '\n');
        console.log('✅ Story 1.3 Backend: READY\n');

        // Verify table exists
        console.log('🔍 Verifying table creation...\n');
        const { data: verifyData, error: verifyError } = await supabase
            .from('user_style_profiles')
            .select('count')
            .limit(0);

        if (verifyError) {
            console.error(`⚠️  Verification failed: ${verifyError.message}`);
            process.exit(1);
        }

        console.log('✅ Table verification successful!\n');
        process.exit(0);
    } catch (err: any) {
        console.error(`❌ Fatal error: ${err.message}`);
        process.exit(1);
    }
}

runMigration().catch((error) => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
});
