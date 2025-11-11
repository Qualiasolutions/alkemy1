# Epic R1: Character Identity PoC - Implementation Specification

**Document Version**: 1.0
**Date**: 2025-11-10
**Phase**: Week 2 Preparation
**Status**: Ready for Implementation

---

## Overview

This document provides detailed implementation specifications for the three PoC prototypes selected from the Week 1 technology landscape analysis:

1. **Fal.ai Instant Character** (Score: 91/100)
2. **Fal.ai Flux LoRA Fast Training** (Score: 83/100)
3. **Astria Fine-Tuning API** (Score: 79/100)

Each prototype will be implemented as a standalone service module following Alkemy's existing architecture patterns.

---

## Common TypeScript Interfaces

Add to `/home/qualiasolutions/Desktop/Projects/platforms/alkemy/types.ts`:

```typescript
// Character Identity Types (Epic R1)

export interface CharacterIdentityConfig {
  apiKey: string;
  provider: 'fal-instant' | 'fal-lora' | 'astria';
  modelId?: string; // For LoRA models
  customParams?: Record<string, any>;
}

export interface CharacterIdentityResult {
  characterId: string;
  provider: 'fal-instant' | 'fal-lora' | 'astria';
  modelUrl?: string; // For LoRA models (downloadable .safetensors)
  modelStorageUrl?: string; // Supabase Storage URL for LoRA weights
  referenceUrls: string[]; // Reference images used for training/conditioning
  status: 'training' | 'ready' | 'failed';
  metadata: {
    trainingTime?: number; // milliseconds
    modelSize?: number; // bytes
    cost?: number; // dollars
    clipSimilarity?: number; // CLIP score if measured
    createdAt: string; // ISO timestamp
  };
}

export interface CharacterGenerationParams {
  characterId: string;
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  guidanceScale?: number;
  numInferenceSteps?: number;
  seed?: number;
}

export interface CharacterGenerationResult {
  imageUrl: string;
  aspectRatio: string;
  clipSimilarity?: number; // If measured against reference
  metadata: {
    promptUsed: string;
    provider: string;
    inferenceTime: number; // milliseconds
    cost: number; // dollars
    generatedAt: string; // ISO timestamp
  };
}

// Extend existing AnalyzedCharacter type
export interface AnalyzedCharacter {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  generations?: Generation[];
  refinedGenerationUrls?: string[];
  upscaledImageUrl?: string | null;

  // NEW: Character identity data (backward compatible - optional)
  characterIdentity?: CharacterIdentityResult;
}
```

---

## Service Module 1: Fal.ai Instant Character

**File**: `/services/falInstantCharacterService.ts`

### Installation

```bash
npm install @fal-ai/serverless-client
```

### Environment Variables

Add to `.env.local`:
```
FAL_INSTANT_CHARACTER_API_KEY=your_fal_api_key_here
```

Add to Vercel environment variables (production).

### Service Implementation

```typescript
import { CharacterIdentityResult, CharacterGenerationParams, CharacterGenerationResult } from '@/types';

const FAL_INSTANT_CHARACTER_API_KEY = process.env.FAL_INSTANT_CHARACTER_API_KEY || '';

export const isFalInstantCharacterAvailable = (): boolean => {
  return !!FAL_INSTANT_CHARACTER_API_KEY;
};

/**
 * Create character identity using Instant Character (no training required)
 * Reference images are stored but not used for training - just for metadata
 */
export async function createInstantCharacterIdentity(
  characterName: string,
  referenceImages: string[], // 1-3 reference images
  onProgress?: (progress: number) => void
): Promise<CharacterIdentityResult> {
  if (!isFalInstantCharacterAvailable()) {
    throw new Error('Fal.ai Instant Character API key is not configured.');
  }

  const characterId = `instant-char-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  onProgress?.(50);

  // Instant Character doesn't require training, so we just store the reference images
  const result: CharacterIdentityResult = {
    characterId,
    provider: 'fal-instant',
    referenceUrls: referenceImages.slice(0, 3), // Max 3 references
    status: 'ready',
    metadata: {
      trainingTime: 0, // Instant
      cost: 0, // No training cost
      createdAt: new Date().toISOString(),
    },
  };

  onProgress?.(100);
  return result;
}

/**
 * Generate image with character identity using Instant Character
 * Reference images must be provided with every generation
 */
export async function generateWithInstantCharacter(
  params: CharacterGenerationParams,
  characterIdentity: CharacterIdentityResult,
  onProgress?: (progress: number) => void,
  context?: { projectId?: string; userId?: string }
): Promise<CharacterGenerationResult> {
  if (!isFalInstantCharacterAvailable()) {
    throw new Error('Fal.ai Instant Character API key is not configured.');
  }

  const startTime = Date.now();
  onProgress?.(10);

  try {
    // Make request to Vercel serverless proxy (to avoid exposing API key client-side)
    const response = await fetch('/api/fal-instant-character-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: params.prompt,
        reference_images: characterIdentity.referenceUrls,
        image_size: params.aspectRatio || '1:1',
        num_images: 1,
        guidance_scale: params.guidanceScale || 7.5,
        num_inference_steps: params.numInferenceSteps || 30,
        seed: params.seed,
        negative_prompt: params.negativePrompt,
      }),
    });

    onProgress?.(90);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fal.ai Instant Character API failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const imageUrl = data.images?.[0]?.url;

    if (!imageUrl) {
      throw new Error('Fal.ai Instant Character API returned no image URL.');
    }

    const inferenceTime = Date.now() - startTime;
    const cost = 0.10; // Estimated cost per generation

    onProgress?.(100);

    return {
      imageUrl,
      aspectRatio: params.aspectRatio || '1:1',
      metadata: {
        promptUsed: params.prompt,
        provider: 'fal-instant',
        inferenceTime,
        cost,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    onProgress?.(100);
    throw new Error(
      `Instant Character generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if character identity is ready (always true for Instant Character - no training)
 */
export async function isInstantCharacterReady(characterId: string): Promise<boolean> {
  return true; // Instant Character is always ready (no training)
}
```

### Serverless Proxy Implementation

**File**: `/api/fal-instant-character-proxy.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

const FAL_INSTANT_CHARACTER_API_KEY = process.env.FAL_INSTANT_CHARACTER_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for preflight
  if (req.method === 'OPTIONS') {
    res.status(200).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type')
      .end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  if (!FAL_INSTANT_CHARACTER_API_KEY) {
    return res.status(500).json({ error: 'Fal.ai Instant Character API key not configured on server.' });
  }

  try {
    const { prompt, reference_images, image_size, num_images, guidance_scale, num_inference_steps, seed, negative_prompt } = req.body;

    // Call Fal.ai Instant Character API
    const response = await fetch('https://fal.run/fal-ai/instant-character', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_INSTANT_CHARACTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        reference_images,
        image_size,
        num_images,
        guidance_scale,
        num_inference_steps,
        seed,
        negative_prompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Fal Instant Character Proxy] API error:', response.status, errorText);
      return res.status(response.status).json({ error: `Fal.ai API error: ${errorText}` });
    }

    const data = await response.json();
    res.status(200).setHeader('Access-Control-Allow-Origin', '*').json(data);
  } catch (error) {
    console.error('[Fal Instant Character Proxy] Request failed:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
```

### Estimated Integration Complexity

- **Lines of Code**: ~200 LOC (service + proxy)
- **Dependencies**: `@fal-ai/serverless-client` (~100KB)
- **Setup Steps**: 3 (API key, environment variables, proxy deployment)
- **Browser Compatible**: ✅ Yes (serverless proxy)

---

## Service Module 2: Fal.ai Flux LoRA Fast Training

**File**: `/services/falLoraService.ts`

### Installation

```bash
npm install @fal-ai/serverless-client
```

### Environment Variables

Same as above (shared Fal.ai API key).

### Service Implementation

```typescript
import { CharacterIdentityResult, CharacterGenerationParams, CharacterGenerationResult } from '@/types';
import { getMediaService } from './mediaService';

const FAL_LORA_API_KEY = process.env.FAL_INSTANT_CHARACTER_API_KEY || ''; // Same key as Instant Character

export const isFalLoraAvailable = (): boolean => {
  return !!FAL_LORA_API_KEY;
};

/**
 * Create character identity using Flux LoRA training
 * Requires 5-20 reference images and 5-10 minutes training time
 */
export async function createFluxLoraCharacterIdentity(
  characterName: string,
  referenceImages: string[], // 5-20 reference images
  onProgress?: (progress: number) => void,
  context?: { projectId?: string; userId?: string }
): Promise<CharacterIdentityResult> {
  if (!isFalLoraAvailable()) {
    throw new Error('Fal.ai LoRA API key is not configured.');
  }

  if (referenceImages.length < 5) {
    throw new Error('Flux LoRA training requires at least 5 reference images.');
  }

  const characterId = `lora-char-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const triggerWord = characterName.toUpperCase().replace(/\s+/g, '_');
  const startTime = Date.now();

  onProgress?.(5);

  try {
    // Step 1: Upload reference images to temporary storage or zip them
    onProgress?.(10);

    // For PoC, we'll use the direct image URLs (production would zip and upload to Supabase)
    const trainingPayload = {
      images_data_url: referenceImages, // Array of URLs or ZIP URL
      steps: 1000, // Training steps (recommended: 1000)
      trigger_word: triggerWord,
    };

    // Step 2: Start LoRA training via serverless proxy
    onProgress?.(20);

    const trainingResponse = await fetch('/api/fal-lora-training-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trainingPayload),
    });

    if (!trainingResponse.ok) {
      const errorText = await trainingResponse.text();
      throw new Error(`Fal.ai LoRA training API failed: ${trainingResponse.statusText} - ${errorText}`);
    }

    const trainingData = await trainingResponse.json();
    const trainingJobId = trainingData.request_id;

    onProgress?.(30);

    // Step 3: Poll for training completion (5-10 minutes)
    let trainingComplete = false;
    let loraModelUrl: string | null = null;
    let pollAttempts = 0;
    const maxPollAttempts = 60; // 10 minutes max (10s intervals)

    while (!trainingComplete && pollAttempts < maxPollAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      pollAttempts++;

      const statusResponse = await fetch(`/api/fal-lora-status-proxy?request_id=${trainingJobId}`);
      const statusData = await statusResponse.json();

      if (statusData.status === 'completed') {
        trainingComplete = true;
        loraModelUrl = statusData.diffusers_lora_file?.url || statusData.lora_file?.url;
      } else if (statusData.status === 'failed') {
        throw new Error(`LoRA training failed: ${statusData.error || 'Unknown error'}`);
      }

      const progress = Math.min(90, 30 + (pollAttempts / maxPollAttempts) * 60);
      onProgress?.(progress);
    }

    if (!loraModelUrl) {
      throw new Error('LoRA training timed out or returned no model URL.');
    }

    onProgress?.(95);

    // Step 4: Upload LoRA model to Supabase Storage (if available)
    let modelStorageUrl = loraModelUrl;
    if (context?.projectId && context?.userId) {
      const mediaService = getMediaService();
      if (mediaService) {
        try {
          // Download LoRA model
          const modelResponse = await fetch(loraModelUrl);
          const modelBlob = await modelResponse.blob();

          // Upload to Supabase
          const fileName = `lora_${characterName.replace(/\s+/g, '_')}_${Date.now()}.safetensors`;
          const { asset, error } = await mediaService.uploadBlob(
            context.projectId,
            context.userId,
            modelBlob,
            fileName,
            'application/octet-stream',
            {
              characterId,
              characterName,
              triggerWord,
              provider: 'fal-lora',
              type: 'lora_model',
            }
          );

          if (asset && !error) {
            modelStorageUrl = asset.url;
          }
        } catch (uploadError) {
          console.warn('Failed to upload LoRA model to Supabase, using direct URL:', uploadError);
        }
      }
    }

    const trainingTime = Date.now() - startTime;
    const cost = 2.00; // $2 per training

    onProgress?.(100);

    return {
      characterId,
      provider: 'fal-lora',
      modelUrl: loraModelUrl,
      modelStorageUrl,
      referenceUrls: referenceImages,
      status: 'ready',
      metadata: {
        trainingTime,
        modelSize: undefined, // Not provided by API
        cost,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    onProgress?.(100);
    throw new Error(`Flux LoRA training failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate image with trained LoRA model
 */
export async function generateWithFluxLora(
  params: CharacterGenerationParams,
  characterIdentity: CharacterIdentityResult,
  onProgress?: (progress: number) => void
): Promise<CharacterGenerationResult> {
  if (!isFalLoraAvailable()) {
    throw new Error('Fal.ai LoRA API key is not configured.');
  }

  if (!characterIdentity.modelUrl && !characterIdentity.modelStorageUrl) {
    throw new Error('LoRA model URL is missing. Training may have failed.');
  }

  const startTime = Date.now();
  onProgress?.(10);

  try {
    const loraUrl = characterIdentity.modelStorageUrl || characterIdentity.modelUrl;

    const response = await fetch('/api/fal-lora-inference-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lora_url: loraUrl,
        prompt: params.prompt,
        image_size: params.aspectRatio || '1:1',
        num_images: 1,
        guidance_scale: params.guidanceScale || 7.5,
        num_inference_steps: params.numInferenceSteps || 30,
        seed: params.seed,
        negative_prompt: params.negativePrompt,
      }),
    });

    onProgress?.(90);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fal.ai LoRA inference failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const imageUrl = data.images?.[0]?.url;

    if (!imageUrl) {
      throw new Error('Fal.ai LoRA inference returned no image URL.');
    }

    const inferenceTime = Date.now() - startTime;
    const cost = 0.06; // Estimated cost per generation

    onProgress?.(100);

    return {
      imageUrl,
      aspectRatio: params.aspectRatio || '1:1',
      metadata: {
        promptUsed: params.prompt,
        provider: 'fal-lora',
        inferenceTime,
        cost,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    onProgress?.(100);
    throw new Error(`Flux LoRA generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if LoRA training is complete
 */
export async function isFluxLoraReady(characterId: string, requestId?: string): Promise<boolean> {
  if (!requestId) return false;

  try {
    const statusResponse = await fetch(`/api/fal-lora-status-proxy?request_id=${requestId}`);
    const statusData = await statusResponse.json();
    return statusData.status === 'completed';
  } catch {
    return false;
  }
}
```

### Estimated Integration Complexity

- **Lines of Code**: ~350 LOC (service + 3 proxy endpoints)
- **Dependencies**: `@fal-ai/serverless-client` (~100KB)
- **Setup Steps**: 4 (API key, environment variables, 3 proxy endpoints, Supabase integration)
- **Browser Compatible**: ✅ Yes (serverless proxy with polling)

---

## Service Module 3: Astria Fine-Tuning

**File**: `/services/astriaService.ts`

### Installation

No additional dependencies required (REST API only).

### Environment Variables

Add to `.env.local`:
```
ASTRIA_API_KEY=your_astria_api_key_here
```

### Service Implementation

```typescript
import { CharacterIdentityResult, CharacterGenerationParams, CharacterGenerationResult } from '@/types';

const ASTRIA_API_KEY = process.env.ASTRIA_API_KEY || '';

export const isAstriaAvailable = (): boolean => {
  return !!ASTRIA_API_KEY;
};

/**
 * Create character identity using Astria fine-tuning
 * Requires 8-15 reference images and 10-20 minutes training time
 */
export async function createAstriaCharacterIdentity(
  characterName: string,
  referenceImages: string[], // 8-15 reference images
  onProgress?: (progress: number) => void
): Promise<CharacterIdentityResult> {
  if (!isAstriaAvailable()) {
    throw new Error('Astria API key is not configured.');
  }

  if (referenceImages.length < 8) {
    throw new Error('Astria fine-tuning requires at least 8 reference images.');
  }

  const characterId = `astria-char-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();

  onProgress?.(5);

  try {
    // Step 1: Create tune (training job)
    const createTuneResponse = await fetch('/api/astria-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_tune',
        payload: {
          tune: {
            title: `Character: ${characterName}`,
            name: characterName.toLowerCase().replace(/\s+/g, '_'),
            base_tune_id: null, // Start from base Flux model
            branch: 'fast', // Fast training mode
            images: referenceImages.map(url => ({ url })),
          },
        },
      }),
    });

    onProgress?.(20);

    if (!createTuneResponse.ok) {
      const errorText = await createTuneResponse.text();
      throw new Error(`Astria tune creation failed: ${createTuneResponse.statusText} - ${errorText}`);
    }

    const tuneData = await createTuneResponse.json();
    const tuneId = tuneData.id;

    onProgress?.(30);

    // Step 2: Poll for training completion (10-20 minutes)
    let trainingComplete = false;
    let pollAttempts = 0;
    const maxPollAttempts = 120; // 20 minutes max (10s intervals)

    while (!trainingComplete && pollAttempts < maxPollAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      pollAttempts++;

      const statusResponse = await fetch(`/api/astria-proxy?action=get_tune&tune_id=${tuneId}`);
      const statusData = await statusResponse.json();

      if (statusData.trained_at) {
        trainingComplete = true;
      } else if (statusData.failed_at) {
        throw new Error(`Astria training failed: ${statusData.error || 'Unknown error'}`);
      }

      const progress = Math.min(95, 30 + (pollAttempts / maxPollAttempts) * 65);
      onProgress?.(progress);
    }

    if (!trainingComplete) {
      throw new Error('Astria training timed out.');
    }

    const trainingTime = Date.now() - startTime;
    const cost = 1.50; // $1.50 per training

    onProgress?.(100);

    return {
      characterId: tuneId.toString(),
      provider: 'astria',
      modelUrl: undefined, // Astria hosts the model
      referenceUrls: referenceImages,
      status: 'ready',
      metadata: {
        trainingTime,
        modelSize: undefined,
        cost,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    onProgress?.(100);
    throw new Error(`Astria fine-tuning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate image with Astria trained model
 * Returns 4 images per call (batch inference)
 */
export async function generateWithAstria(
  params: CharacterGenerationParams,
  characterIdentity: CharacterIdentityResult,
  onProgress?: (progress: number) => void
): Promise<CharacterGenerationResult> {
  if (!isAstriaAvailable()) {
    throw new Error('Astria API key is not configured.');
  }

  const startTime = Date.now();
  onProgress?.(10);

  try {
    const tuneId = characterIdentity.characterId;

    const response = await fetch('/api/astria-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_prompt',
        tune_id: tuneId,
        payload: {
          prompt: {
            text: params.prompt,
            negative_prompt: params.negativePrompt,
            num_images: 4, // Astria generates 4 images per batch
            seed: params.seed,
          },
        },
      }),
    });

    onProgress?.(50);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Astria prompt generation failed: ${response.statusText} - ${errorText}`);
    }

    const promptData = await response.json();
    const promptId = promptData.id;

    // Poll for generation completion (typically 12-18 seconds)
    let generationComplete = false;
    let imageUrls: string[] = [];
    let pollAttempts = 0;
    const maxPollAttempts = 30; // 30 seconds max (1s intervals)

    while (!generationComplete && pollAttempts < maxPollAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every 1 second
      pollAttempts++;

      const statusResponse = await fetch(`/api/astria-proxy?action=get_prompt&tune_id=${tuneId}&prompt_id=${promptId}`);
      const statusData = await statusResponse.json();

      if (statusData.images && statusData.images.length > 0) {
        generationComplete = true;
        imageUrls = statusData.images.map((img: any) => img.url);
      } else if (statusData.failed_at) {
        throw new Error(`Astria generation failed: ${statusData.error || 'Unknown error'}`);
      }

      const progress = Math.min(95, 50 + (pollAttempts / maxPollAttempts) * 45);
      onProgress?.(progress);
    }

    if (imageUrls.length === 0) {
      throw new Error('Astria generation timed out or returned no images.');
    }

    const inferenceTime = Date.now() - startTime;
    const cost = 0.025; // $0.10 for 4 images = $0.025 per image

    onProgress?.(100);

    return {
      imageUrl: imageUrls[0], // Return first image (PoC can be extended to return all 4)
      aspectRatio: params.aspectRatio || '1:1',
      metadata: {
        promptUsed: params.prompt,
        provider: 'astria',
        inferenceTime,
        cost,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    onProgress?.(100);
    throw new Error(`Astria generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if Astria model is ready
 */
export async function isAstriaReady(tuneId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/astria-proxy?action=get_tune&tune_id=${tuneId}`);
    const data = await response.json();
    return !!data.trained_at;
  } catch {
    return false;
  }
}
```

### Estimated Integration Complexity

- **Lines of Code**: ~300 LOC (service + 1 multi-action proxy)
- **Dependencies**: None (REST API only)
- **Setup Steps**: 3 (API key, environment variables, proxy deployment)
- **Browser Compatible**: ✅ Yes (serverless proxy with polling)

---

## Test Character Dataset Specification

### Character: "Sarah"

**Description**: Female protagonist, 25-30 years old, brown hair, blue eyes, Caucasian ethnicity.

**Reference Images Required**:

1. **Portrait (Well-Lit)** - `sarah_portrait_01.jpg`
   - Frontal view, neutral expression
   - Soft studio lighting
   - 1024×1024px, neutral background

2. **Full-Body (Outdoor)** - `sarah_fullbody_02.jpg`
   - Standing pose, full body visible
   - Natural daylight, golden hour
   - 1024×1024px, urban environment

3. **Profile (Side Angle)** - `sarah_profile_03.jpg`
   - 90° profile (side view)
   - Dramatic side lighting
   - 1024×1024px, dark background

4. **Dramatic Lighting** - `sarah_dramatic_04.jpg`
   - 3/4 view, serious expression
   - Low-key lighting, high contrast
   - 1024×1024px, moody atmosphere

5. **Action Pose** - `sarah_action_05.jpg`
   - Dynamic angle, active pose
   - Natural or artificial lighting
   - 1024×1024px, blurred background

**Image Source**: Generate using existing Alkemy `generateStillVariants()` with consistent character description, or source from stock photography with same model.

**Storage**: Save to `/research-results/reference-images/sarah/`

---

## Test Scenario Prompts

### Scenario 1: Close-Up Portrait (Well-Lit)
**Prompt**: "Close-up portrait of Sarah, soft studio lighting, neutral expression, looking at camera, professional photography, cinematic film still, shallow depth of field"

**Expected CLIP**: >0.90
**Technical Notes**: Face clearly visible, high detail, recognizable as reference character

---

### Scenario 2: Wide Shot Full-Body (Outdoor)
**Prompt**: "Wide shot of Sarah standing in urban environment, natural daylight, golden hour, full-body view, cinematic film still, photorealistic, 35mm lens"

**Expected CLIP**: >0.85
**Technical Notes**: Full body visible, outdoor lighting, character recognizable despite distance

---

### Scenario 3: Profile View (Side Angle)
**Prompt**: "Profile view of Sarah, side angle, dramatic lighting, serious expression, cinematic film noir style, black and white, high contrast"

**Expected CLIP**: >0.85
**Technical Notes**: Clear profile (90° side view), facial features recognizable from side

---

### Scenario 4: Low-Light Scene (Dramatic Lighting)
**Prompt**: "Sarah in dark warehouse, low-key lighting, shadowy atmosphere, tense mood, cinematic thriller, dramatic chiaroscuro, Rembrandt lighting"

**Expected CLIP**: >0.80
**Technical Notes**: Character recognizable in low light, dramatic shadows (not obscuring identity)

---

### Scenario 5: Action Pose (Dynamic Movement)
**Prompt**: "Sarah running through corridor, motion blur, dynamic pose, action scene, cinematic film still, blurred background, wide-angle lens, 24mm"

**Expected CLIP**: >0.80
**Technical Notes**: Dynamic pose (running, jumping, or active), character recognizable in motion

---

## CLIP Similarity Measurement

### Implementation

Create Python script: `/research-results/measure_clip_similarity.py`

```python
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import sys

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def calculate_clip_similarity(ref_path, gen_path):
    """Calculate CLIP similarity between reference and generated images."""
    ref_image = Image.open(ref_path)
    gen_image = Image.open(gen_path)

    inputs = processor(images=[ref_image, gen_image], return_tensors="pt")
    outputs = model.get_image_features(**inputs)

    similarity = torch.nn.functional.cosine_similarity(
        outputs[0].unsqueeze(0),
        outputs[1].unsqueeze(0)
    )

    return similarity.item()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python measure_clip_similarity.py <reference_image> <generated_image>")
        sys.exit(1)

    ref_path = sys.argv[1]
    gen_path = sys.argv[2]

    similarity = calculate_clip_similarity(ref_path, gen_path)
    print(f"CLIP Similarity: {similarity:.4f}")
```

### Usage

```bash
python research-results/measure_clip_similarity.py \
  research-results/reference-images/sarah/sarah_portrait_01.jpg \
  research-results/generated-images/fal-instant/scenario1_001.jpg
```

---

## Week 2 PoC Testing Workflow

### Day 1: Setup
1. Obtain API keys for Fal.ai and Astria
2. Configure environment variables in `.env.local` and Vercel
3. Implement 3 service modules
4. Implement 4 serverless proxy endpoints
5. Generate test character dataset (5 reference images)
6. Set up CLIP measurement Python environment

### Day 2: Fal.ai Instant Character Testing
1. Create character identity (instant, 0 seconds)
2. Generate 5 test scenarios (3 variations each = 15 images)
3. Measure CLIP similarity for all 15 images
4. Record latency and cost data
5. Save images to `/research-results/generated-images/fal-instant/`

### Day 3: Fal.ai Flux LoRA Testing
1. Create character identity (8 minutes training)
2. Generate 5 test scenarios (3 variations each = 15 images)
3. Measure CLIP similarity for all 15 images
4. Record latency and cost data
5. Test model reusability across different prompts
6. Save images to `/research-results/generated-images/fal-lora/`

### Day 4: Astria Testing
1. Create character identity (15 minutes training)
2. Generate 5 test scenarios (4 images per batch = 20 images total)
3. Measure CLIP similarity for all images
4. Record latency and cost data
5. Test batch inference performance
6. Save images to `/research-results/generated-images/astria/`

### Day 5: Analysis and Reporting
1. Compile all CLIP similarity scores into CSV
2. Calculate averages and standard deviations
3. Create comparison gallery HTML page
4. Write PoC test report
5. Select recommended technology based on data

---

## Success Criteria

- [ ] All 3 service modules implemented and tested
- [ ] All 5 test scenarios generated for each technology (45+ total images)
- [ ] CLIP similarity measured for all images
- [ ] At least 1 technology achieves >95% CLIP similarity
- [ ] At least 1 technology has <30s inference latency
- [ ] At least 1 technology costs <$0.15/generation
- [ ] Comparison gallery created and functional
- [ ] PoC test report written and reviewed

---

**END OF POC IMPLEMENTATION SPECIFICATION**

*Next Steps: Begin Week 2 PoC development*
*Expected Completion: 2025-11-17*
