#!/usr/bin/env node

/**
 * Test script for Black Forest Labs API integration
 */

import { generateWithFlux11Pro, generateWithFluxKontext, isBFLApiAvailable } from './src/services/bflService.js';

async function testBFLIntegration() {
    console.log('Testing BFL API Integration...\n');

    // Check if API is available
    if (!isBFLApiAvailable()) {
        console.error('❌ BFL API key is not configured!');
        console.log('Please set BFL_API_KEY environment variable');
        process.exit(1);
    }

    console.log('✅ BFL API key is configured\n');

    // Test 1: FLUX 1.1 Pro
    console.log('Testing FLUX 1.1 Pro...');
    try {
        const result = await generateWithFlux11Pro({
            prompt: 'A professional portrait of a software engineer working on a laptop',
            width: 1024,
            height: 1024,
            prompt_upsampling: true
        }, (progress) => {
            process.stdout.write(`\rProgress: ${progress}%`);
        });

        console.log('\n✅ FLUX 1.1 Pro generation successful!');
        console.log(`   ID: ${result.id}`);
        console.log(`   Image URL length: ${result.imageUrl.length} characters`);
    } catch (error) {
        console.error('\n❌ FLUX 1.1 Pro generation failed:', error.message);
    }

    // Test 2: FLUX Kontext
    console.log('\nTesting FLUX Kontext...');
    try {
        const result = await generateWithFluxKontext({
            prompt: 'A cinematic landscape shot of mountains at sunset',
            aspect_ratio: '16:9',
            prompt_upsampling: true
        }, (progress) => {
            process.stdout.write(`\rProgress: ${progress}%`);
        });

        console.log('\n✅ FLUX Kontext generation successful!');
        console.log(`   ID: ${result.id}`);
        console.log(`   Image URL length: ${result.imageUrl.length} characters`);
    } catch (error) {
        console.error('\n❌ FLUX Kontext generation failed:', error.message);
    }

    console.log('\n✨ BFL API integration test complete!');
}

// Run the test
testBFLIntegration().catch(console.error);