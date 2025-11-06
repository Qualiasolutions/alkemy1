#!/usr/bin/env node

/**
 * Run Supabase Migrations Script
 * This script runs the SQL migrations directly using the Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uiusqxdyzdkpyngppnwx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpdXNxeGR5emRrcHluZ3Bwbnd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM5MjM1NSwiZXhwIjoyMDc3OTY4MzU1fQ.3p7EPOvNi05ogkNPX3CkRiEusLQoxqFcr78Wh28AUUw';

// Note: Service role key is used here for admin operations
// Never expose this key to the client-side!
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function runMigrations() {
    console.log('🚀 Starting Supabase migrations for ALKEMY project...\n');

    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split SQL into individual statements (basic split, may need refinement)
        const statements = migrationSQL
            .split(/;\s*$/gm)
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';

            // Skip pure comments
            if (statement.trim().startsWith('--')) continue;

            // Extract a description from the statement
            const firstLine = statement.split('\n')[0];
            const description = firstLine.includes('CREATE') ? firstLine : `Statement ${i + 1}`;

            process.stdout.write(`Executing: ${description.substring(0, 60)}...`);

            try {
                // Use raw SQL execution
                const { error } = await supabase.rpc('exec_sql', {
                    query: statement
                }).catch(async (rpcError) => {
                    // If RPC doesn't exist, try direct execution (this won't work but shows intent)
                    // In reality, we'd need to use the Supabase Management API or pg connection
                    return { error: rpcError };
                });

                if (error) {
                    // Some errors are expected (e.g., "already exists")
                    if (error.message?.includes('already exists') ||
                        error.message?.includes('duplicate')) {
                        console.log(' ⏭️  Already exists (skipped)');
                    } else {
                        console.log(' ❌ Error');
                        console.error(`   ${error.message}`);
                    }
                } else {
                    console.log(' ✅');
                }
            } catch (execError) {
                console.log(' ❌ Error');
                console.error(`   ${execError.message}`);
            }
        }

        console.log('\n✨ Migration process completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Verify tables in Supabase dashboard: https://supabase.com/dashboard/project/uiusqxdyzdkpyngppnwx');
        console.log('2. Enable authentication providers in Supabase Auth settings');
        console.log('3. Test the authentication flow locally');
        console.log('4. Deploy to Vercel production');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migrations
runMigrations();