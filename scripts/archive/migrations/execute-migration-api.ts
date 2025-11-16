/**
 * Execute Migration 003 via Supabase REST API
 * Uses the Supabase REST API to execute SQL statements
 */

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

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];
if (!projectRef) {
    console.error('❌ Error: Could not extract project ref from Supabase URL');
    process.exit(1);
}

console.log('🚀 Executing Migration 003: Style Learning\n');
console.log(`   Project Ref: ${projectRef}`);
console.log(`   Supabase URL: ${SUPABASE_URL}\n`);

// Read migration SQL file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '003_style_learning.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('📋 Attempting to execute migration via REST API...\n');

async function executeMigration() {
    try {
        // Try using the database REST API endpoint
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ query: migrationSQL })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
            console.error(`   Response: ${error}\n`);
            throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Migration executed successfully!');
        console.log('   Result:', JSON.stringify(result, null, 2));
        return true;
    } catch (err: any) {
        console.error(`❌ Failed to execute via REST API: ${err.message}\n`);
        return false;
    }
}

executeMigration().then(success => {
    if (success) {
        console.log('\n=' .repeat(70));
        console.log('✅ Migration Complete');
        console.log('=' .repeat(70));
        console.log('Next: Run verification with: npx tsx check-migration-status.ts');
        console.log('=' .repeat(70) + '\n');
        process.exit(0);
    } else {
        console.log('\n⚠️  REST API method failed.');
        console.log('📝 Please use the Supabase SQL Editor instead:\n');
        console.log('   1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql');
        console.log('   2. Create new query');
        console.log('   3. Paste contents of: supabase/migrations/003_style_learning.sql');
        console.log('   4. Execute\n');
        process.exit(1);
    }
});
