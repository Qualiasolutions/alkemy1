/**
 * Quick test script to verify Vertex AI integration
 */

// Import the Vertex AI service functions
const { testVertexAIConnectivity, isVertexAIAvailable, getVertexAIApiKey } = require('./services/vertexAIService.ts');

async function testVertexAI() {
  console.log('🧪 Testing Vertex AI Integration...');

  // Check if API key is available
  console.log('\n📋 API Key Check:');
  const apiKey = getVertexAIApiKey();
  console.log('API Key available:', !!apiKey);
  console.log('API Key format correct:', apiKey && apiKey.startsWith('AIza'));

  // Check if Vertex AI is available
  console.log('\n🔌 Availability Check:');
  const isAvailable = isVertexAIAvailable();
  console.log('Vertex AI available:', isAvailable);

  if (isAvailable) {
    // Test connectivity
    console.log('\n🌐 Connectivity Test:');
    try {
      const isConnected = await testVertexAIConnectivity();
      console.log('Connection successful:', isConnected);
    } catch (error) {
      console.error('Connection failed:', error.message);
    }
  }

  console.log('\n✅ Vertex AI test complete!');
}

// Run the test
testVertexAI().catch(console.error);