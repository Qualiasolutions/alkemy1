# Epic R1 Week 2 PoC - Quick Start Guide

**Target Audience**: Development team implementing Week 2 PoC prototypes
**Duration**: 5 days
**Status**: Ready to begin

---

## 📦 What You Need

### API Keys (Day 1)

1. **Fal.ai API Key**
   - Sign up: https://fal.ai/dashboard
   - Navigate to Settings → API Keys
   - Create new key: "Alkemy Character Identity PoC"
   - Copy key (starts with `fal_...`)

2. **Astria API Key**
   - Sign up: https://www.astria.ai/users/sign_in
   - Navigate to API tab
   - Copy key

### Environment Setup (Day 1)

**Local Development** (`.env.local`):
```bash
FAL_INSTANT_CHARACTER_API_KEY=fal_your_key_here
ASTRIA_API_KEY=your_astria_key_here
```

**Vercel Production**:
```bash
vercel env add FAL_INSTANT_CHARACTER_API_KEY production
# Paste key when prompted

vercel env add ASTRIA_API_KEY production
# Paste key when prompted
```

### Dependencies (Day 1)

```bash
npm install @fal-ai/serverless-client
```

---

## 📁 Files to Create

### Service Modules (Day 1)

1. `/services/falInstantCharacterService.ts` (~200 LOC)
   - Copy implementation from `/docs/research/epic-r1-poc-implementation-spec.md` Section "Service Module 1"

2. `/services/falLoraService.ts` (~350 LOC)
   - Copy implementation from spec Section "Service Module 2"

3. `/services/astriaService.ts` (~300 LOC)
   - Copy implementation from spec Section "Service Module 3"

### Serverless Proxies (Day 1)

1. `/api/fal-instant-character-proxy.ts`
2. `/api/fal-lora-training-proxy.ts`
3. `/api/fal-lora-inference-proxy.ts`
4. `/api/astria-proxy.ts`

All implementations available in PoC specification document.

### TypeScript Types (Day 1)

Add to `/types.ts`:
```typescript
export interface CharacterIdentityResult {
  characterId: string;
  provider: 'fal-instant' | 'fal-lora' | 'astria';
  modelUrl?: string;
  modelStorageUrl?: string;
  referenceUrls: string[];
  status: 'training' | 'ready' | 'failed';
  metadata: {
    trainingTime?: number;
    modelSize?: number;
    cost?: number;
    clipSimilarity?: number;
    createdAt: string;
  };
}

export interface CharacterGenerationParams {
  characterId: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  guidanceScale?: number;
  numInferenceSteps?: number;
  seed?: number;
}

export interface CharacterGenerationResult {
  imageUrl: string;
  aspectRatio: string;
  clipSimilarity?: number;
  metadata: {
    promptUsed: string;
    provider: string;
    inferenceTime: number;
    cost: number;
    generatedAt: string;
  };
}

// Extend existing AnalyzedCharacter
export interface AnalyzedCharacter {
  // ... existing fields
  characterIdentity?: CharacterIdentityResult;
}
```

---

## 🎯 Testing Workflow

### Day 1-2: Setup
- [x] Obtain API keys
- [x] Configure environment variables
- [x] Implement service modules
- [x] Implement serverless proxies
- [ ] Generate test character dataset
- [ ] Set up CLIP measurement (Python)

### Day 3: Fal.ai Instant Character
```bash
# Generate reference images
node scripts/generate-test-character-dataset.js

# Test Instant Character
npm run test:instant-character

# Measure CLIP similarity
python research-results/measure_clip_similarity.py \
  research-results/reference-images/sarah/sarah_portrait_01.jpg \
  research-results/generated-images/fal-instant/scenario1_001.jpg
```

### Day 4: Fal.ai Flux LoRA + Astria
```bash
# Test Flux LoRA (8 min training + 15 generations)
npm run test:flux-lora

# Test Astria (15 min training + 20 generations)
npm run test:astria

# Measure all CLIP scores
python research-results/batch_measure_clip.py
```

### Day 5: Analysis
```bash
# Generate comparison gallery
npm run generate:comparison-gallery

# Generate performance report
npm run generate:performance-report

# View results
open research-results/comparison-gallery.html
```

---

## 📊 Test Scenarios

### Character: Sarah (Female, 25-30, brown hair, blue eyes)

**Reference Images** (5 required):
1. Portrait (well-lit, frontal view)
2. Full-body (outdoor, natural light)
3. Profile (side view, dramatic lighting)
4. Dramatic (low-key, high contrast)
5. Action (dynamic pose, motion)

**Generation Prompts**:

1. **Scenario 1**: "Close-up portrait of Sarah, soft studio lighting, neutral expression, looking at camera, professional photography, cinematic film still, shallow depth of field"
   - Expected CLIP: >0.90

2. **Scenario 2**: "Wide shot of Sarah standing in urban environment, natural daylight, golden hour, full-body view, cinematic film still, photorealistic, 35mm lens"
   - Expected CLIP: >0.85

3. **Scenario 3**: "Profile view of Sarah, side angle, dramatic lighting, serious expression, cinematic film noir style, black and white, high contrast"
   - Expected CLIP: >0.85

4. **Scenario 4**: "Sarah in dark warehouse, low-key lighting, shadowy atmosphere, tense mood, cinematic thriller, dramatic chiaroscuro, Rembrandt lighting"
   - Expected CLIP: >0.80

5. **Scenario 5**: "Sarah running through corridor, motion blur, dynamic pose, action scene, cinematic film still, blurred background, wide-angle lens, 24mm"
   - Expected CLIP: >0.80

---

## 📈 Success Criteria

### Must-Have
- [ ] All 3 service modules implemented
- [ ] All 45+ test images generated (15 per technology)
- [ ] CLIP similarity measured for all images
- [ ] Latency and cost data recorded
- [ ] Comparison gallery created

### Quality Thresholds
- [ ] At least 1 technology achieves >95% CLIP
- [ ] At least 1 technology has <30s inference latency
- [ ] At least 1 technology costs <$0.15/generation

---

## 🐛 Troubleshooting

### Issue: API Key Not Working
```bash
# Verify key format
echo $FAL_INSTANT_CHARACTER_API_KEY
# Should start with "fal_"

# Test key directly
curl -H "Authorization: Key $FAL_INSTANT_CHARACTER_API_KEY" \
  https://fal.run/fal-ai/instant-character
```

### Issue: Vercel Proxy Timeout
```typescript
// Increase timeout in vercel.json
{
  "functions": {
    "api/fal-lora-training-proxy.ts": {
      "maxDuration": 300
    }
  }
}
```

### Issue: CLIP Measurement Fails
```bash
# Install dependencies
pip install transformers pillow torch

# Test with sample images
python research-results/measure_clip_similarity.py \
  path/to/ref.jpg path/to/gen.jpg
```

---

## 📚 Reference Documents

- **Full Research Report**: `/docs/research/EPIC-R1-FINAL-REPORT.md`
- **Technology Landscape**: `/docs/research/epic-r1-technology-landscape-report.md`
- **PoC Implementation Spec**: `/docs/research/epic-r1-poc-implementation-spec.md`
- **Comparison Matrix**: `/docs/research/epic-r1-comparison-template.csv`

---

## 🤝 Support

**Questions?** Refer to the comprehensive implementation spec:
- Full service module code: Section "Service Module 1, 2, 3"
- Serverless proxy templates: Section "Serverless Proxy Implementation"
- Test scenario details: Section "Test Scenario Specifications"
- CLIP measurement: Section "CLIP Similarity Measurement"

---

**Ready to Start**: All specifications are complete. Begin with Day 1 setup tasks.

**Timeline**: 5 days (estimated completion: 2025-11-17)
