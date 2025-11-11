#!/usr/bin/env node

/**
 * Execute Storage RLS Policies for Character Identity System
 *
 * This script creates RLS policies on storage.objects to ensure users
 * can only access their own character reference images and models.
 */

const https = require('https');
const fs = require('fs');

// Read environment variables
const SUPABASE_URL = 'https://uiusqxdyzdkpyngppnwx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpdXNxeGR5emRrcHluZ3Bwbnd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM5MjM1NSwiZXhwIjoyMDc3OTY4MzU1fQ.3p7EPOvNi05ogkNPX3CkRiEusLQoxqFcr78Wh28AUUw';

// Read SQL file
const sql = `
-- Create character-references bucket policy
CREATE POLICY IF NOT EXISTS character_references_policy
ON storage.objects
FOR ALL
USING (
  bucket_id = 'character-references' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create character-models bucket policy
CREATE POLICY IF NOT EXISTS character_models_policy
ON storage.objects
FOR ALL
USING (
  bucket_id = 'character-models' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify policies created
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%character%';
`;

console.log('🔒 Creating Storage RLS Policies...\n');

// Execute SQL via PostgREST
const data = JSON.stringify({ query: sql });

const options = {
  hostname: 'uiusqxdyzdkpyngppnwx.supabase.co',
  path: '/rest/v1/rpc/exec',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Length': data.length,
    'Prefer': 'return=representation'
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}\n`);

    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Storage RLS Policies created successfully!\n');
      console.log('Response:', responseData);
      console.log('\n📋 Next Steps:');
      console.log('1. Verify policies in Supabase Dashboard');
      console.log('2. Test character identity upload workflow');
      console.log('3. Verify user data isolation');
    } else {
      console.log('⚠️  Response:', responseData);
      console.log('\n❌ Failed to create policies via REST API');
      console.log('\n📋 Manual Alternative:');
      console.log('1. Go to: https://supabase.com/dashboard/project/uiusqxdyzdkpyngppnwx/sql');
      console.log('2. Copy SQL from: supabase/create-storage-policies.sql');
      console.log('3. Paste and run in SQL Editor');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n📋 Manual Alternative:');
  console.log('1. Go to: https://supabase.com/dashboard/project/uiusqxdyzdkpyngppnwx/sql');
  console.log('2. Copy SQL from: supabase/create-storage-policies.sql');
  console.log('3. Paste and run in SQL Editor');
});

req.write(data);
req.end();
