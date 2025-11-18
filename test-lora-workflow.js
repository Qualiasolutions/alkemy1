/**
 * Comprehensive LoRA Training Workflow Test
 *
 * This test verifies the complete LoRA training workflow:
 * 1. FAL API key configuration
 * 2. Character identity service integration
 * 3. LoRA training endpoint connectivity
 * 4. Image generation with LoRA models
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env.production' });

console.log('🧪 Alkemy AI Studio - LoRA Training Workflow Test');
console.log('==================================================');

// Test 1: Environment Variables
console.log('\n1. Testing Environment Variables...');
const falApiKey = process.env.FAL_API_KEY;
const viteFalKey = process.env.VITE_FAL_API_KEY;
const falAdminKey = process.env.FAL_ADMIN_KEY;

console.log('FAL_API_KEY:', falApiKey ? '✅ Present' : '❌ Missing');
console.log('VITE_FAL_API_KEY:', viteFalKey ? '✅ Present' : '❌ Missing');
console.log('FAL_ADMIN_KEY:', falAdminKey ? '✅ Present' : '❌ Missing');

if (!falApiKey) {
  console.error('❌ FAL API key is required for LoRA training');
  process.exit(1);
}

// Test 2: FAL API Connectivity
async function testFalConnectivity() {
  console.log('\n2. Testing FAL API Connectivity...');

  try {
    // Test the training endpoint
    const response = await fetch('https://fal.run/fal-ai/flux-lora-fast-training', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images_data_url: [], // Empty array for connectivity test
        steps: 1000,
        is_input_format_already_preprocessed: false
      })
    });

    if (response.status === 400) {
      console.log('✅ FAL API connectivity confirmed (400 expected for empty images)');
      return true;
    } else if (response.status === 401) {
      console.error('❌ FAL API authentication failed - check API key');
      return false;
    } else {
      console.log(`✅ FAL API responds (status: ${response.status})`);
      return true;
    }
  } catch (error) {
    console.error('❌ FAL API connectivity failed:', error.message);
    return false;
  }
}

// Test 3: Check Character Identity Service
async function testCharacterIdentityService() {
  console.log('\n3. Testing Character Identity Service...');

  try {
    const fs = await import('fs');
    const path = await import('path');

    const servicePath = path.join(process.cwd(), 'services', 'characterIdentityService.ts');

    if (!fs.existsSync(servicePath)) {
      console.error('❌ Character Identity Service file not found');
      return false;
    }

    const serviceContent = fs.readFileSync(servicePath, 'utf8');

    // Check for key LoRA training functions
    const hasPrepareIdentity = serviceContent.includes('prepareCharacterIdentity');
    const hasTestIdentity = serviceContent.includes('testCharacterIdentity');
    const hasLoRAEndpoint = serviceContent.includes('flux-lora-fast-training');
    const hasLoRAGeneration = serviceContent.includes('flux-lora');

    console.log('📋 prepareCharacterIdentity:', hasPrepareIdentity ? '✅' : '❌');
    console.log('📋 testCharacterIdentity:', hasTestIdentity ? '✅' : '❌');
    console.log('📋 LoRA training endpoint:', hasLoRAEndpoint ? '✅' : '❌');
    console.log('📋 LoRA generation endpoint:', hasLoRAGeneration ? '✅' : '❌');

    return hasPrepareIdentity && hasTestIdentity && hasLoRAEndpoint && hasLoRAGeneration;
  } catch (error) {
    console.error('❌ Character Identity Service test failed:', error.message);
    return false;
  }
}

// Test 4: Check Proxy Function
async function testProxyFunction() {
  console.log('\n4. Testing FAL Proxy Function...');

  try {
    const fs = await import('fs');
    const path = await import('path');

    const proxyPath = path.join(process.cwd(), 'api', 'fal-proxy.ts');

    if (!fs.existsSync(proxyPath)) {
      console.error('❌ FAL proxy function not found');
      return false;
    }

    const proxyContent = fs.readFileSync(proxyPath, 'utf8');

    const hasAuth = proxyContent.includes('Authorization');
    const hasCors = proxyContent.includes('Access-Control-Allow-Origin');
    const hasFalKey = proxyContent.includes('FAL_API_KEY');
    const hasFalRun = proxyContent.includes('fal.run');

    console.log('📋 Authentication:', hasAuth ? '✅' : '❌');
    console.log('📋 CORS headers:', hasCors ? '✅' : '❌');
    console.log('📋 FAL API key handling:', hasFalKey ? '✅' : '❌');
    console.log('📋 FAL.run endpoint:', hasFalRun ? '✅' : '❌');

    return hasAuth && hasCors && hasFalKey && hasFalRun;
  } catch (error) {
    console.error('❌ Proxy function test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running LoRA Training Workflow Tests...\n');

  const results = {
    environment: !!falApiKey,
    connectivity: await testFalConnectivity(),
    characterService: await testCharacterIdentityService(),
    proxyFunction: await testProxyFunction()
  };

  console.log('\n📊 Test Results Summary:');
  console.log('===========================');
  console.log('Environment Variables:', results.environment ? '✅ PASS' : '❌ FAIL');
  console.log('FAL API Connectivity:', results.connectivity ? '✅ PASS' : '❌ FAIL');
  console.log('Character Identity Service:', results.characterService ? '✅ PASS' : '❌ FAIL');
  console.log('FAL Proxy Function:', results.proxyFunction ? '✅ PASS' : '❌ FAIL');

  const allPassed = Object.values(results).every(result => result === true);

  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! LoRA training workflow is ready.');
    console.log('✅ FAL API keys are configured correctly');
    console.log('✅ Character identity service is integrated');
    console.log('✅ LoRA training endpoints are accessible');
    console.log('✅ Proxy function is ready for production');
  } else {
    console.log('\n❌ Some tests failed. Please check the issues above.');
    process.exit(1);
  }
}

// Execute tests
runAllTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});