# Epic R1: Character Identity PoC Requirements

**Epic Reference**: Epic R1: Character Identity Consistency Research
**Story**: R1.2 - Character Identity Proof-of-Concept Prototypes
**Duration**: Week 2 (5 days)
**Status**: Ready for execution

---

## Proof-of-Concept Objectives

Build working prototypes of the top 3 character identity technologies to validate:
1. **Visual consistency** across diverse scenarios (>95% CLIP similarity)
2. **End-to-end latency** (training + inference time)
3. **Integration complexity** (LOC, dependencies, API setup)
4. **Real-world performance** (cost, quality, reliability)

---

## PoC Scope

### In Scope
- Character generation from 3-5 reference images
- Integration with existing `generateStillVariants()` pattern
- Visual similarity measurement (CLIP, FaceNet, human evaluation)
- Performance benchmarking (latency, cost)
- Side-by-side comparison gallery

### Out of Scope
- Full UI integration (focus on service layer only)
- Multi-character shots (single character per generation)
- Production deployment (local/dev environment only)
- Motion transfer integration (deferred to RQ4)

---

## Test Character Dataset

### Reference Character: "Sarah"

**Character Description**:
- Female protagonist, 25-30 years old
- Caucasian ethnicity, brown hair, blue eyes
- Consistent appearance across all reference images
- Neutral expression in most images (except dramatic scenarios)

**5 Reference Images Required**:

1. **Portrait (Well-Lit)**
   - Resolution: 1024x1024
   - Angle: Frontal view, facing camera
   - Lighting: Soft studio lighting, even illumination
   - Expression: Neutral, slight smile
   - Background: Solid neutral color or softly blurred

2. **Full-Body (Outdoor)**
   - Resolution: 1024x1024 (full body visible)
   - Angle: Wide shot, full body standing
   - Lighting: Natural daylight, golden hour
   - Expression: Relaxed, casual
   - Background: Urban or natural outdoor environment

3. **Profile View (Side Angle)**
   - Resolution: 1024x1024
   - Angle: 90° profile (side view)
   - Lighting: Dramatic side lighting
   - Expression: Serious, thoughtful
   - Background: Dark or neutral

4. **Dramatic Lighting (Low-Key)**
   - Resolution: 1024x1024
   - Angle: 3/4 view or frontal
   - Lighting: Low-key, high contrast, dramatic shadows
   - Expression: Intense, serious
   - Background: Dark, moody

5. **Action Pose (Dynamic)**
   - Resolution: 1024x1024
   - Angle: Dynamic angle (not centered)
   - Lighting: Natural or artificial (varied)
   - Expression: Active, energetic
   - Background: Blurred (motion implied)

**Image Source Options**:
- Option A: AI-generated character set (consistent across all 5 images)
- Option B: Stock photography (same model across 5 images)
- Option C: Synthetic dataset from character generation tool

---

## Test Scenario Specifications

For each of the top 3 technologies, generate the following 5 test scenarios:

### Scenario 1: Close-Up Portrait (Well-Lit)

**Prompt Template**:
```
Close-up portrait of [CHARACTER_NAME], soft studio lighting, neutral expression, looking at camera, professional photography, cinematic film still, shallow depth of field
```

**Expected Output**:
- Face clearly visible and detailed
- High CLIP similarity to reference (target: >0.90)
- FaceNet distance low (target: <0.6)
- Professional quality, sharp focus

**Success Criteria**:
- CLIP score >0.90
- Human evaluation >95% "same character"
- Inference latency <30 seconds

---

### Scenario 2: Wide Shot Full-Body (Outdoor)

**Prompt Template**:
```
Wide shot of [CHARACTER_NAME] standing in urban environment, natural daylight, golden hour, full-body view, cinematic film still, photorealistic, 35mm lens
```

**Expected Output**:
- Full body visible (head to toe)
- Character recognizable despite distance
- Outdoor lighting consistent with prompt
- Background contextual (urban environment)

**Success Criteria**:
- CLIP score >0.85
- Human evaluation >90% "same character"
- Facial features still recognizable

---

### Scenario 3: Profile View (Side Angle)

**Prompt Template**:
```
Profile view of [CHARACTER_NAME], side angle, dramatic lighting, serious expression, cinematic film noir style, black and white, high contrast
```

**Expected Output**:
- Clear profile (90° side view)
- Facial features recognizable from side
- Dramatic lighting applied correctly
- Film noir aesthetic

**Success Criteria**:
- CLIP score >0.85
- FaceNet profile detection successful
- Human evaluation >90% "same character"

---

### Scenario 4: Low-Light Scene (Dramatic Lighting)

**Prompt Template**:
```
[CHARACTER_NAME] in dark warehouse, low-key lighting, shadowy atmosphere, tense mood, cinematic thriller, dramatic chiaroscuro, Rembrandt lighting
```

**Expected Output**:
- Character recognizable in low light
- Dramatic shadows (not obscuring identity)
- Warehouse environment visible
- Tense, moody atmosphere

**Success Criteria**:
- CLIP score >0.80
- Human evaluation >85% "same character"
- Character identity preserved despite shadows

---

### Scenario 5: Action Pose (Dynamic Movement)

**Prompt Template**:
```
[CHARACTER_NAME] running through corridor, motion blur, dynamic pose, action scene, cinematic film still, blurred background, wide-angle lens, 24mm
```

**Expected Output**:
- Dynamic pose (running, jumping, or active)
- Motion implied (blur, angle, composition)
- Character recognizable in motion
- Blurred background for speed effect

**Success Criteria**:
- CLIP score >0.80
- Human evaluation >85% "same character"
- Action pose clearly conveyed

---

## Similarity Measurement Procedures

### CLIP Similarity Measurement

**Implementation**:
```python
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch

def calculate_clip_similarity(reference_path, generated_path):
    """Calculate CLIP similarity between reference and generated images."""
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

    # Load images
    ref_image = Image.open(reference_path)
    gen_image = Image.open(generated_path)

    # Process images
    inputs = processor(images=[ref_image, gen_image], return_tensors="pt")
    outputs = model.get_image_features(**inputs)

    # Calculate cosine similarity
    similarity = torch.nn.functional.cosine_similarity(
        outputs[0].unsqueeze(0),
        outputs[1].unsqueeze(0)
    )

    return similarity.item()
```

**Procedure**:
1. Run for each generated image vs. corresponding reference
2. Record similarity score (0.0 - 1.0)
3. Calculate average CLIP score across all 5 scenarios
4. Flag images with score <0.80 for manual review

---

### FaceNet Distance Measurement

**Implementation**:
```python
from facenet_pytorch import MTCNN, InceptionResnetV1
import torch

def calculate_facenet_distance(reference_path, generated_path):
    """Calculate FaceNet L2 distance between faces."""
    mtcnn = MTCNN(image_size=160, margin=0)
    resnet = InceptionResnetV1(pretrained='vggface2').eval()

    # Load and detect faces
    ref_image = Image.open(reference_path)
    gen_image = Image.open(generated_path)

    ref_face = mtcnn(ref_image)
    gen_face = mtcnn(gen_image)

    if ref_face is None or gen_face is None:
        return None  # Face not detected

    # Get embeddings
    ref_embedding = resnet(ref_face.unsqueeze(0))
    gen_embedding = resnet(gen_face.unsqueeze(0))

    # Calculate L2 distance
    distance = (ref_embedding - gen_embedding).norm().item()

    return distance
```

**Procedure**:
1. Run for each generated image with visible face
2. Record distance value
3. Flag images with distance >0.6 for manual review
4. Note: Skip for full-body or extreme angles where face detection fails

---

### Human Evaluation Protocol

**Evaluator Setup**:
- Recruit 10-15 evaluators (mix of filmmakers, designers, general users)
- No AI expertise required
- Blind evaluation (evaluators don't know which technology generated which image)

**Evaluation Interface** (HTML/JavaScript):
```html
<!DOCTYPE html>
<html>
<head>
    <title>Character Consistency Evaluation</title>
    <style>
        .reference { border: 3px solid blue; }
        .test-image { border: 1px solid gray; margin: 10px; }
    </style>
</head>
<body>
    <h1>Is this the same character?</h1>
    <div>
        <h2>Reference Character</h2>
        <img src="reference.jpg" class="reference" width="400">
    </div>
    <div>
        <h2>Test Image</h2>
        <img src="test_001.jpg" class="test-image" width="400">
    </div>
    <form>
        <label>
            <input type="radio" name="match" value="yes"> Yes, same character
        </label><br>
        <label>
            <input type="radio" name="match" value="no"> No, different character
        </label><br>
        <label>
            <input type="radio" name="match" value="unsure"> Unsure
        </label><br>
        <button type="submit">Next Image</button>
    </form>
</body>
</html>
```

**Procedure**:
1. Show reference image at top (always visible)
2. Show each test image sequentially (randomized order)
3. Record evaluator response (Yes/No/Unsure)
4. Track response time (to detect hesitation)
5. Repeat for all 5 test scenarios × 3 technologies = 15 evaluations per person

**Scoring**:
- "Yes" = 1 point
- "Unsure" = 0.5 points
- "No" = 0 points

**Target**: Average score >0.90 (90% "Yes" responses)

---

## Performance Benchmarking

### Latency Measurements

**Training Time** (if applicable):
- Start timer when reference images are uploaded
- End timer when character model is ready for inference
- Record total training time in minutes
- Include API queue time if applicable

**Inference Time**:
- Start timer when generation request is submitted
- End timer when image URL is returned
- Record total inference time in seconds
- Measure for each of the 5 test scenarios
- Calculate average and max latency

**Total End-to-End Time**:
- Training time (if applicable) + Inference time
- Record as "time from reference upload to first consistent shot"

---

### Cost Tracking

**Training Cost** (if applicable):
- Cost per character training
- One-time cost (amortized over multiple generations)

**Inference Cost**:
- Cost per image generation
- Measure for each test scenario
- Calculate average cost per generation

**Total Cost Per Character**:
- Training cost (if any) + (Inference cost × expected generations per character)
- Project costs at 10, 100, 1000 character scales

**Monthly Cost Projections**:
- 1,000 character generations/month
- 10,000 character generations/month
- 100,000 character generations/month

---

### Integration Complexity Assessment

**Lines of Code (LOC)**:
- Count lines in service module (e.g., `loraService.ts`)
- Exclude comments and blank lines
- Include helper functions and type definitions

**Dependencies**:
- List new npm packages added
- Measure bundle size impact (KB added to production build)
- Document any system-level dependencies

**API Setup Steps**:
1. Account creation
2. API key generation
3. Environment variable configuration
4. Initial testing/validation
5. Error handling setup

Record total steps and estimated time to complete setup.

---

## Prototype Service Module Specifications

### Service Module Template

Each prototype should implement the following interface:

**File**: `services/characterIdentityService.ts` (or technology-specific name)

```typescript
import { Character, Generation } from '@/types';

export interface CharacterIdentityConfig {
  apiKey: string;
  modelId?: string;
  customParams?: Record<string, any>;
}

export interface CharacterIdentityResult {
  characterId: string;
  modelUrl?: string; // For LoRA models
  referenceUrls: string[]; // Reference images
  status: 'training' | 'ready' | 'failed';
  metadata: {
    trainingTime?: number; // milliseconds
    modelSize?: number; // bytes
    cost?: number; // dollars
  };
}

export interface CharacterGenerationParams {
  characterId: string;
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
}

/**
 * Initialize character identity from reference images
 * @param referenceImages - Array of reference image URLs or base64 strings
 * @param config - Technology-specific configuration
 * @returns Character identity result with model/reference data
 */
export async function createCharacterIdentity(
  referenceImages: string[],
  config: CharacterIdentityConfig,
  onProgress?: (progress: number) => void
): Promise<CharacterIdentityResult> {
  // Implementation here
}

/**
 * Generate image with character identity applied
 * @param params - Generation parameters including character ID and prompt
 * @returns Generated image URL
 */
export async function generateWithCharacterIdentity(
  params: CharacterGenerationParams,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Implementation here
}

/**
 * Check if character identity is ready for use
 * @param characterId - Character identity ID
 * @returns True if ready, false if still training
 */
export async function isCharacterIdentityReady(
  characterId: string
): Promise<boolean> {
  // Implementation here
}
```

---

### Integration with Existing Workflow

The prototype should integrate with the existing `generateStillVariants()` pattern:

**Example Integration**:
```typescript
// In SceneAssemblerTab or CastLocationsTab
import { generateWithCharacterIdentity } from '@/services/characterIdentityService';

async function generateShotWithCharacter(characterId: string, prompt: string) {
  try {
    const imageUrl = await generateWithCharacterIdentity({
      characterId,
      prompt,
      width: 1024,
      height: 1024,
      guidanceScale: 7.5
    }, (progress) => {
      console.log(`Generation progress: ${progress}%`);
    });

    // Use imageUrl in existing workflow
    return imageUrl;
  } catch (error) {
    console.error('Character generation failed:', error);
    throw error;
  }
}
```

---

## Comparison Gallery Deliverable

### HTML Gallery Template

Create an interactive comparison gallery to visualize results:

**File**: `research-results/character-identity-comparison.html`

**Features**:
- Side-by-side comparison of all 3 technologies
- Reference image always visible at top
- 5 test scenarios as columns
- 3 technologies as rows
- CLIP scores overlaid on each image
- Click to enlarge images
- Toggle between technologies
- Export comparison as PDF

**Layout**:
```
+------------------+------------------+------------------+
| Reference Image  | (same across all scenarios)        |
+------------------+------------------+------------------+
|                  | Scenario 1       | Scenario 2       | ...
+------------------+------------------+------------------+
| Technology 1     | [Image]          | [Image]          | ...
|                  | CLIP: 0.92       | CLIP: 0.88       |
+------------------+------------------+------------------+
| Technology 2     | [Image]          | [Image]          | ...
|                  | CLIP: 0.85       | CLIP: 0.83       |
+------------------+------------------+------------------+
| Technology 3     | [Image]          | [Image]          | ...
|                  | CLIP: 0.90       | CLIP: 0.87       |
+------------------+------------------+------------------+
```

---

## Performance Dashboard Deliverable

### Interactive Metrics Dashboard

Create a dashboard to visualize performance data:

**File**: `research-results/performance-dashboard.html`

**Metrics to Display**:
1. **Latency Chart**: Bar chart comparing training + inference time
2. **Cost Chart**: Bar chart comparing cost per generation
3. **Consistency Chart**: Line chart showing CLIP scores across scenarios
4. **Success Rate**: Pie chart showing human evaluation results

**Interactive Features**:
- Filter by technology
- Hover for detailed metrics
- Export data as CSV
- Toggle between metric types

---

## Test Report Deliverable

### Detailed Analysis Document

**File**: `research-results/poc-test-report.md`

**Sections**:
1. **Executive Summary**
   - Top 3 technologies tested
   - Winner recommendation
   - Key findings

2. **Visual Consistency Results**
   - CLIP scores table (all scenarios)
   - FaceNet distances (where applicable)
   - Human evaluation results

3. **Performance Results**
   - Latency breakdown
   - Cost analysis
   - Integration complexity

4. **Qualitative Analysis**
   - Strengths and weaknesses of each technology
   - Edge cases and failure modes
   - User feedback

5. **Recommendations**
   - Recommended technology (Tier 1)
   - Fallback options (Tier 2)
   - Technologies to avoid (Tier 3)

---

## Success Criteria for PoC

### Must-Have Criteria

- [ ] 3 working prototype service modules implemented
- [ ] All 5 test scenarios generated for each technology (15 total images)
- [ ] CLIP similarity measured for all 15 images
- [ ] FaceNet distance measured (where faces visible)
- [ ] Human evaluation conducted (10+ evaluators)
- [ ] Latency benchmarks recorded (training + inference)
- [ ] Cost projections calculated (1k, 10k, 100k scales)
- [ ] Integration complexity assessed (LOC, dependencies)
- [ ] Comparison gallery created and functional
- [ ] Performance dashboard created
- [ ] Test report written and reviewed

### Quality Thresholds

- [ ] At least 1 technology achieves >95% CLIP similarity (NFR2 target)
- [ ] At least 1 technology has <30s inference latency
- [ ] At least 1 technology costs <$0.15/generation
- [ ] Human evaluation >90% "same character" for top technology
- [ ] Integration complexity <500 LOC (CR2 compatibility)

---

## Deliverable Checklist

### Code Deliverables
- [ ] `services/loraService.ts` (or equivalent for Technology 1)
- [ ] `services/fluxConsistentService.ts` (or equivalent for Technology 2)
- [ ] `services/ipAdapterService.ts` (or equivalent for Technology 3)
- [ ] `research-results/clip-similarity.py` (measurement script)
- [ ] `research-results/facenet-distance.py` (measurement script)

### Data Deliverables
- [ ] `research-results/reference-images/` (5 reference images)
- [ ] `research-results/generated-images/tech1/` (5 test scenarios)
- [ ] `research-results/generated-images/tech2/` (5 test scenarios)
- [ ] `research-results/generated-images/tech3/` (5 test scenarios)
- [ ] `research-results/performance-data.csv` (all metrics)
- [ ] `research-results/human-evaluation-results.csv`

### Report Deliverables
- [ ] `research-results/character-identity-comparison.html` (gallery)
- [ ] `research-results/performance-dashboard.html` (metrics)
- [ ] `research-results/poc-test-report.md` (detailed analysis)

---

**END OF POC REQUIREMENTS**

*Timeline*: Week 2 (5 days)
*Expected Outcome*: Clear technology recommendation with quantitative evidence
