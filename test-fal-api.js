/**
 * Quick test to verify FAL API configuration
 */

// Test FAL API key configuration
console.log('=== FAL API Configuration Test ===');

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env.production' });

// Check if FAL API keys are available
const userFalKey = process.env.VITE_FAL_API_KEY || process.env.FAL_API_KEY;
const adminFalKey = process.env.VITE_FAL_ADMIN_KEY || process.env.FAL_ADMIN_KEY;

console.log('User FAL Key:', userFalKey ? `✅ Present (first 10 chars: ${userFalKey.substring(0, 10)}...)` : '❌ Missing');
console.log('Admin FAL Key:', adminFalKey ? `✅ Present (first 10 chars: ${adminFalKey.substring(0, 10)}...)` : '❌ Missing');

// Test FAL API connectivity
async function testFalAPI() {
  if (!userFalKey) {
    console.error('❌ FAL API key not found in environment');
    return;
  }

  try {
    console.log('🔍 Testing FAL API connectivity...');

    // Test basic FAL API endpoint - use a simple model to test connectivity
    const response = await fetch('https://fal.run/fal-ai/flux-lora', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${userFalKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Test character identity',
        num_images: 1,
        image_size: { width: 512, height: 512 }
      })
    });

    if (response.ok) {
      console.log('✅ FAL API connectivity confirmed');

      // Check rate limits if available
      const rateLimitHeaders = {
        'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
        'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
        'x-ratelimit-reset': response.headers.get('x-ratelimit-reset')
      };

      console.log('📊 Rate Limit Info:', rateLimitHeaders);
    } else {
      console.error('❌ FAL API connection failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ FAL API test failed:', error.message);
  }
}

// Test character identity service integration
async function testCharacterIdentityService() {
  try {
    console.log('🎭 Testing Character Identity Service integration...');

    // Test that the character identity service exists and has key functions
    const fs = await import('fs');
    const path = await import('path');

    const servicePath = path.join(process.cwd(), 'services', 'characterIdentityService.ts');
    if (fs.existsSync(servicePath)) {
      console.log('✅ Character Identity Service file exists');

      // Read the service file to check for key functions
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      const hasPrepareIdentity = serviceContent.includes('prepareCharacterIdentity');
      const hasGetStatus = serviceContent.includes('getCharacterIdentityStatus');
      const hasTestFunction = serviceContent.includes('testCharacterIdentity');

      console.log('📊 prepareCharacterIdentity function available:', hasPrepareIdentity);
      console.log('📊 getCharacterIdentityStatus function available:', hasGetStatus);
      console.log('📊 testCharacterIdentity function available:', hasTestFunction);

      if (hasPrepareIdentity && hasGetStatus && hasTestFunction) {
        console.log('✅ Character Identity Service appears to have all required functions');
      } else {
        console.log('⚠️ Character Identity Service may be missing some functions');
      }
    } else {
      console.log('❌ Character Identity Service file not found');
    }

  } catch (error) {
    console.error('❌ Character Identity Service test failed:', error.message);
  }
}

// Run tests
console.log('⏱ Starting tests...');
testFalAPI().then(() => {
  testCharacterIdentityService().then(() => {
    console.log('🎉 All FAL API tests completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});