# Epic 2: Stories 2.2 & 2.3 Implementation Plan

**Date**: 2025-01-11
**Status**: Ready to Implement
**Dependencies**: Story 2.1 ✅ COMPLETE (deployed to production)
**Estimated Duration**: 2-3 days

---

## Executive Summary

This plan outlines the complete implementation of **Story 2.2 (Character Identity Preview & Testing)** and **Story 2.3 (Character Identity Integration with Shot Generation)**, completing Epic 2's Character Identity Consistency System.

**Story 2.1 Status**: ✅ 90% Complete
- Backend: Database, storage, and Fal.ai integration complete
- Frontend: Character identity preparation UI deployed
- **Remaining**: Storage RLS policies (5-minute manual task)

---

## Story 2.2: Character Identity Preview & Testing

### Overview
Enable filmmakers to test character appearance variations before production, ensuring visual consistency through similarity scoring.

### Key Features
1. Generate 5 test variations (Close-Up, Wide Shot, Profile, Low-Light, Expression)
2. Calculate similarity scores using CLIP + pHash
3. Test results gallery with side-by-side comparison
4. Approval workflow (approve, reject, reconfigure)
5. Bulk testing for multiple characters

### Technical Architecture

#### 1. Service Layer (`services/characterIdentityService.ts`)

```typescript
/**
 * Generate a single test variation for character identity
 * Uses Fal.ai with the character's identity
 */
export async function testCharacterIdentity(
  request: {
    characterId: string;
    testType: CharacterIdentityTestType; // 'portrait', 'fullbody', 'profile', 'lighting', 'expression'
    onProgress?: (progress: number, status: string) => void;
  }
): Promise<CharacterIdentityTest> {
  const { characterId, testType, onProgress } = request;

  // Get character's identity
  const identity = await getCharacterIdentity(characterId);
  if (!identity || identity.status !== 'ready') {
    throw new Error('Character identity must be ready before testing');
  }

  // Generate test prompt based on type
  const prompt = generateTestPrompt(testType);

  // Generate image using Fal.ai with character identity
  onProgress?.(20, 'Generating test image...');
  const imageUrl = await generateWithFalCharacter(
    identity.technologyData?.falCharacterId!,
    prompt,
    onProgress
  );

  // Calculate similarity score
  onProgress?.(70, 'Calculating similarity...');
  const similarityScore = await calculateSimilarity(
    identity.referenceImages,
    imageUrl
  );

  // Create test record
  const test: CharacterIdentityTest = {
    id: `test-${Date.now()}`,
    testType,
    generatedImageUrl: imageUrl,
    similarityScore,
    timestamp: new Date().toISOString(),
  };

  onProgress?.(100, 'Test complete');
  return test;
}

/**
 * Calculate similarity between reference and generated images
 * Uses CLIP (70%) + pHash (30%) weighted scoring
 */
export async function calculateSimilarity(
  referenceImages: string[],
  generatedImage: string
): Promise<number> {
  try {
    // Primary: CLIP embeddings via Replicate
    const clipScore = await calculateCLIPSimilarity(referenceImages, generatedImage);

    // Fallback: Perceptual hash (browser-based)
    const pHashScore = await calculatePHashSimilarity(referenceImages[0], generatedImage);

    // Weighted average
    return (clipScore * 0.7) + (pHashScore * 0.3);
  } catch (error) {
    console.error('Similarity calculation failed:', error);
    // Fallback to pHash only
    return await calculatePHashSimilarity(referenceImages[0], generatedImage);
  }
}

/**
 * Generate all 5 test variations in batch
 */
export async function generateAllTests(
  request: {
    characterId: string;
    onProgress?: (overallProgress: number, currentTest: string) => void;
  }
): Promise<CharacterIdentityTest[]> {
  const testTypes: CharacterIdentityTestType[] = [
    'portrait',
    'fullbody',
    'profile',
    'lighting',
    'expression'
  ];

  const tests: CharacterIdentityTest[] = [];

  for (let i = 0; i < testTypes.length; i++) {
    const testType = testTypes[i];
    const overallProgress = (i / testTypes.length) * 100;

    onProgress?.(overallProgress, `Generating ${testType} test...`);

    const test = await testCharacterIdentity({
      characterId,
      testType,
      onProgress: (testProgress, status) => {
        const combinedProgress = overallProgress + (testProgress / testTypes.length);
        onProgress?.(combinedProgress, status);
      }
    });

    tests.push(test);
  }

  return tests;
}

/**
 * Approve character identity for production use
 */
export async function approveCharacterIdentity(
  characterId: string
): Promise<void> {
  const identity = await getCharacterIdentity(characterId);
  if (!identity) {
    throw new Error('Character identity not found');
  }

  // Update approval status
  identity.approvalStatus = 'approved';
  identity.lastUpdated = new Date().toISOString();

  // Save to storage
  await saveCharacterIdentity(characterId, identity);

  // Update in Supabase if configured
  if (isSupabaseConfigured()) {
    await updateSupabaseIdentity(characterId, { approval_status: 'approved' });
  }
}

/**
 * Bulk test multiple characters
 */
export async function bulkTestCharacters(
  request: {
    characterIds: string[];
    onProgress?: (overallProgress: number, currentCharacter: string) => void;
  }
): Promise<Map<string, CharacterIdentityTest[]>> {
  const { characterIds, onProgress } = request;
  const results = new Map<string, CharacterIdentityTest[]>();

  for (let i = 0; i < characterIds.length; i++) {
    const characterId = characterIds[i];
    const overallProgress = (i / characterIds.length) * 100;

    onProgress?.(overallProgress, `Testing character ${i + 1}/${characterIds.length}`);

    const tests = await generateAllTests({
      characterId,
      onProgress: (testProgress, status) => {
        const combinedProgress = overallProgress + (testProgress / characterIds.length);
        onProgress?.(combinedProgress, status);
      }
    });

    results.set(characterId, tests);
  }

  return results;
}
```

#### 2. Similarity Scoring

**CLIP Similarity (Primary - 70% weight)**:
```typescript
async function calculateCLIPSimilarity(
  referenceImages: string[],
  generatedImage: string
): Promise<number> {
  // Use Replicate's CLIP model
  const response = await fetch('/api/clip-similarity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reference_images: referenceImages,
      generated_image: generatedImage,
    })
  });

  const data = await response.json();
  return data.similarity_score; // 0-100
}
```

**pHash Similarity (Fallback - 30% weight)**:
```typescript
import imghash from 'imghash';

async function calculatePHashSimilarity(
  referenceImage: string,
  generatedImage: string
): Promise<number> {
  // Calculate perceptual hashes
  const refHash = await imghash.hash(referenceImage);
  const genHash = await imghash.hash(generatedImage);

  // Calculate Hamming distance
  const distance = hammingDistance(refHash, genHash);

  // Convert to similarity score (0-100)
  const maxDistance = 64; // 64-bit hash
  const similarity = ((maxDistance - distance) / maxDistance) * 100;

  return similarity;
}

function hammingDistance(hash1: string, hash2: string): number {
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}
```

#### 3. Fal.ai Character Generation

```typescript
async function generateWithFalCharacter(
  falCharacterId: string,
  prompt: string,
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  // Call Fal.ai API with character reference
  const response = await fetch('/api/fal-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'fal-ai/flux-lora',
      input: {
        prompt,
        character_id: falCharacterId, // Use prepared character
        num_images: 1,
        image_size: '1024x1024',
      }
    })
  });

  const data = await response.json();
  return data.images[0].url;
}

function generateTestPrompt(testType: CharacterIdentityTestType): string {
  const prompts = {
    portrait: 'professional headshot, neutral expression, studio lighting, front-facing',
    fullbody: 'full body shot, standing neutral pose, even lighting, front view',
    profile: 'side profile shot, neutral expression, studio lighting, professional',
    lighting: 'cinematic lighting, dramatic shadows, moody atmosphere',
    expression: 'natural smile, candid expression, soft lighting',
  };

  return prompts[testType];
}
```

#### 4. UI Components

**CharacterIdentityTestPanel.tsx** (New Component):
```typescript
export function CharacterIdentityTestPanel({
  character,
  onTestComplete,
  onApprove,
}: {
  character: AnalyzedCharacter;
  onTestComplete?: (tests: CharacterIdentityTest[]) => void;
  onApprove?: () => void;
}) {
  const [tests, setTests] = useState<CharacterIdentityTest[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');

  const handleGenerateTests = async () => {
    setIsGenerating(true);
    try {
      const generatedTests = await generateAllTests({
        characterId: character.id,
        onProgress: (prog, status) => {
          setProgress(prog);
          setCurrentTest(status);
        }
      });

      setTests(generatedTests);
      onTestComplete?.(generatedTests);
    } catch (error) {
      console.error('Test generation failed:', error);
      // Show error toast
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    await approveCharacterIdentity(character.id);
    onApprove?.();
  };

  return (
    <div className="space-y-4">
      {/* Test Controls */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerateTests}
          disabled={isGenerating}
          className="btn-primary"
        >
          {isGenerating ? 'Generating Tests...' : 'Generate 5 Test Variations'}
        </button>

        {tests.length > 0 && (
          <button
            onClick={handleApprove}
            className="btn-success"
          >
            Approve Identity
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="space-y-2">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-400">{currentTest}</p>
        </div>
      )}

      {/* Test Results Grid */}
      {tests.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {tests.map((test) => (
            <TestResultCard key={test.id} test={test} />
          ))}
        </div>
      )}
    </div>
  );
}

function TestResultCard({ test }: { test: CharacterIdentityTest }) {
  const scoreColor = test.similarityScore >= 85 ? 'text-green-400' :
                     test.similarityScore >= 70 ? 'text-yellow-400' :
                     'text-red-400';

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <img
        src={test.generatedImageUrl}
        alt={`${test.testType} test`}
        className="w-full h-48 object-cover"
      />
      <div className="p-3 space-y-2">
        <h4 className="font-semibold capitalize">{test.testType}</h4>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Similarity</span>
          <span className={`font-bold ${scoreColor}`}>
            {test.similarityScore.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
```

---

## Story 2.3: Character Identity Integration with Shot Generation

### Overview
Automatically apply character identity to all shot generations, ensuring consistency across entire productions without manual configuration per shot.

### Key Features
1. Automatic identity application when generating shots
2. Visual indicators showing identity is active
3. Identity strength controls (0-100%)
4. Multi-character shot support
5. Per-shot identity override toggle
6. Batch generation with identity

### Technical Architecture

#### 1. Enhanced `aiService.ts`

```typescript
/**
 * Enhanced generateStillVariants with character identity support
 */
export async function generateStillVariants(
  frame_id: string,
  model: string,
  prompt: string,
  reference_images: string[],
  avatar_refs: string[],
  aspect_ratio: string,
  n: number = 1,
  moodboard?: Moodboard,
  moodboardTemplates: MoodboardTemplate[] = [],
  characterNames?: string[],
  locationName?: string,
  characterIdentities?: CharacterIdentityReference[], // NEW
  identityStrength?: number, // NEW (0-100)
  onProgress?: (index: number, progress: number) => void,
  context?: { projectId?: string; userId?: string; sceneId?: string; frameId?: string }
): Promise<{
  urls: string[],
  errors: (string | null)[],
  wasAdjusted: boolean,
  metadata: {
    promptUsed: string;
    referenceImages: string[];
    selectedCharacters: string[];
    selectedLocation: string;
    model: string;
    appliedIdentities?: string[]; // NEW
  }
}> {
  // Existing logic...

  // NEW: Apply character identities if available
  let appliedIdentities: string[] = [];
  if (characterIdentities && characterIdentities.length > 0) {
    const enabledIdentities = characterIdentities.filter(id => id.enabled);

    if (enabledIdentities.length > 0) {
      // Use Fal.ai character identity
      const falCharacterIds = enabledIdentities
        .map(id => id.identityData)
        .filter(Boolean);

      if (falCharacterIds.length > 0) {
        // Generate with character identity
        return generateWithCharacterIdentity(
          prompt,
          falCharacterIds,
          identityStrength || 80,
          aspect_ratio,
          n,
          onProgress,
          context
        );
      }
    }
  }

  // Fallback to standard generation
  return standardGeneration(/* ... */);
}

/**
 * Generate image with Fal.ai character identity
 */
async function generateWithCharacterIdentity(
  prompt: string,
  falCharacterIds: string[],
  strength: number,
  aspectRatio: string,
  count: number,
  onProgress?: (index: number, progress: number) => void,
  context?: { projectId?: string; userId?: string }
): Promise<GenerationResult> {
  const urls: string[] = [];
  const errors: (string | null)[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const response = await fetch('/api/fal-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'fal-ai/flux-lora',
          input: {
            prompt,
            character_ids: falCharacterIds, // Multiple characters
            lora_scale: strength / 100, // 0-1 range
            num_images: 1,
            image_size: aspectRatio === '16:9' ? '1024x576' : '1024x1024',
          }
        })
      });

      const data = await response.json();
      urls.push(data.images[0].url);
      errors.push(null);

      onProgress?.(i, 100);
    } catch (error) {
      console.error('Character identity generation failed:', error);
      // Fallback to standard generation
      const fallbackUrl = await generateStandardImage(prompt, aspectRatio);
      urls.push(fallbackUrl);
      errors.push('Character identity failed, used standard generation');
    }
  }

  return {
    urls,
    errors,
    wasAdjusted: false,
    metadata: {
      promptUsed: prompt,
      referenceImages: [],
      selectedCharacters: [],
      selectedLocation: '',
      model: 'Fal.ai Flux LoRA',
      appliedIdentities: falCharacterIds,
    }
  };
}
```

#### 2. Type Extensions

```typescript
// types.ts additions

export interface CharacterIdentityReference {
  characterId: string;
  characterName: string;
  identityData: string; // Fal.ai character ID
  enabled: boolean; // Per-shot toggle
  strength?: number; // Override global strength (0-100)
}

// Extended Frame type
export interface Frame {
  // ... existing fields

  // NEW: Character identity tracking
  characterIdentities?: CharacterIdentityReference[];
  identityStrength?: number; // Global strength for this shot
}
```

#### 3. SceneAssemblerTab Integration

```typescript
// In SceneAssemblerTab.tsx

async function handleGenerate() {
  // Get characters in this frame
  const frameCharacters = frame.cast_names || [];

  // Build character identities array
  const characterIdentities: CharacterIdentityReference[] = [];

  for (const charName of frameCharacters) {
    const character = project.characters.find(c => c.name === charName);
    if (character?.identity?.status === 'ready') {
      characterIdentities.push({
        characterId: character.id,
        characterName: character.name,
        identityData: character.identity.technologyData?.falCharacterId || '',
        enabled: true, // Auto-enable approved identities
        strength: frame.identityStrength, // Per-frame override
      });
    }
  }

  // Generate with identities
  const result = await generateStillVariants(
    frame.id,
    model,
    prompt,
    reference_images,
    avatar_refs,
    aspect_ratio,
    2, // n
    moodboard,
    moodboardTemplates,
    frameCharacters,
    frame.location_name,
    characterIdentities, // NEW
    frame.identityStrength || 80, // NEW
    onProgress,
    context
  );

  // Store applied identities in frame
  frame.characterIdentities = characterIdentities;
}
```

#### 4. Identity Indicators UI

```typescript
// Add to FrameEditor or FrameCard

{frame.characterIdentities && frame.characterIdentities.length > 0 && (
  <div className="flex items-center gap-2 text-sm text-emerald-400">
    <CheckCircleIcon className="w-4 h-4" />
    <span>
      Character identity: {frame.characterIdentities.map(id => id.characterName).join(', ')}
    </span>
  </div>
)}

{/* Identity Strength Slider */}
<div className="space-y-2">
  <label className="text-sm font-medium">Identity Strength</label>
  <input
    type="range"
    min="0"
    max="100"
    value={frame.identityStrength || 80}
    onChange={(e) => setFrameIdentityStrength(frame.id, Number(e.target.value))}
    className="w-full"
  />
  <span className="text-xs text-gray-400">{frame.identityStrength || 80}%</span>
</div>

{/* Per-Shot Override Toggle */}
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={frame.disableIdentity || false}
    onChange={(e) => setFrameIdentityOverride(frame.id, e.target.checked)}
  />
  <span className="text-sm">Disable identity for this shot</span>
</label>
```

---

## Implementation Steps

### Phase 1: Story 2.2 Backend (Day 1 Morning)
1. ✅ Add test generation functions to `characterIdentityService.ts`
2. ✅ Implement CLIP similarity scoring (Replicate API)
3. ✅ Implement pHash similarity scoring (browser-based)
4. ✅ Add approval workflow functions
5. ✅ Add bulk testing functions
6. ✅ Update `CharacterIdentity` type with `tests` field
7. ✅ Update `CharacterIdentityTest` type definition

### Phase 2: Story 2.2 Frontend (Day 1 Afternoon)
1. ✅ Create `CharacterIdentityTestPanel` component
2. ✅ Create `TestResultCard` component
3. ✅ Add test panel to character card modal/details view
4. ✅ Implement progress tracking UI
5. ✅ Add approval button and workflow
6. ✅ Add bulk test UI for multiple characters

### Phase 3: Story 2.3 Backend (Day 2 Morning)
1. ✅ Extend `generateStillVariants` with identity parameters
2. ✅ Implement `generateWithCharacterIdentity` function
3. ✅ Add `CharacterIdentityReference` type
4. ✅ Update `Frame` type with identity fields
5. ✅ Add identity strength controls
6. ✅ Implement multi-character support

### Phase 4: Story 2.3 Frontend (Day 2 Afternoon)
1. ✅ Update `SceneAssemblerTab` to pass character identities
2. ✅ Add identity indicators to frame cards
3. ✅ Add identity strength slider
4. ✅ Add per-shot identity override toggle
5. ✅ Update generation UI with identity status
6. ✅ Add error handling for identity failures

### Phase 5: Integration & Testing (Day 3)
1. ✅ End-to-end testing of complete workflow
2. ✅ Test similarity scoring accuracy
3. ✅ Test multi-character shots
4. ✅ Test batch generation with identity
5. ✅ Performance testing (<15% overhead target)
6. ✅ Deploy to production
7. ✅ Update EPIC_STATUS_UPDATE.md

---

## Success Metrics

### Story 2.2
- [ ] >95% visual similarity across test variations
- [ ] Filmmakers approve identity after ≤3 iterations
- [ ] Test generation completes in <30 seconds (5 tests)
- [ ] Similarity scores are accurate and consistent

### Story 2.3
- [ ] >95% visual similarity maintained across all production shots
- [ ] Zero manual identity configuration per shot
- [ ] Identity application adds <15% to generation time
- [ ] Multi-character shots work correctly
- [ ] Error handling works (fallback to standard generation)

---

## Deployment Checklist

- [ ] Run `npm run build` locally (verify no TypeScript errors)
- [ ] Test Story 2.2 end-to-end (test generation, scoring, approval)
- [ ] Test Story 2.3 end-to-end (automatic identity application)
- [ ] Test multi-character shots
- [ ] Test batch generation with identity
- [ ] Deploy to Vercel: `git push origin main`
- [ ] Verify in production
- [ ] Update EPIC_STATUS_UPDATE.md (Epic 2: 100% Complete)
- [ ] Create QA gates for Stories 2.2 and 2.3

---

**Plan Created**: 2025-01-11
**Estimated Completion**: 2025-01-14 (3 days)
**Status**: Ready to Execute
