/**
 * Apply Migration 003 - Style Learning
 * Executes SQL statements using Supabase Management API
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

console.log('🚀 Applying Migration 003: Style Learning\n');
console.log(`   Supabase URL: ${SUPABASE_URL}`);
console.log(`   Project Ref: uiusqxdyzdkpyngppnwx\n`);

// Read migration SQL file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '003_style_learning.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('📋 Migration SQL to execute:\n');
console.log('=' .repeat(70));
console.log(migrationSQL);
console.log('=' .repeat(70));
console.log('\n⚠️  This script cannot execute SQL directly via the Supabase JS client.');
console.log('📝 Please execute the migration manually using ONE of these methods:\n');

console.log('METHOD 1: Supabase SQL Editor (Recommended)');
console.log('=' .repeat(70));
console.log('1. Open: https://supabase.com/dashboard/project/uiusqxdyzdkpyngppnwx/sql');
console.log('2. Click "New Query"');
console.log('3. Copy the SQL above');
console.log('4. Paste and click "Run"');
console.log('5. Verify success\n');

console.log('METHOD 2: Supabase CLI');
console.log('=' .repeat(70));
console.log('1. Install Supabase CLI: npm install -g supabase');
console.log('2. Link project: supabase link --project-ref uiusqxdyzdkpyngppnwx');
console.log('3. Run: supabase db push\n');

console.log('METHOD 3: Direct PostgreSQL Connection');
console.log('=' .repeat(70));
console.log('1. Get connection string from Supabase dashboard');
console.log('2. Use psql or any PostgreSQL client');
console.log('3. Execute the migration SQL\n');

console.log('=' .repeat(70));
console.log('After running the migration, verify with:');
console.log('  npx tsx check-migration-status.ts');
console.log('=' .repeat(70) + '\n');
