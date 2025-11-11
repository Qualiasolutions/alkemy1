# Epic R1: Character Identity Research - Execution Roadmap

**Epic Reference**: Epic R1: Character Identity Consistency Research
**Research Duration**: 2-3 weeks
**Target Completion**: Week 12-14 (end of research phase)
**Status**: Ready for execution

---

## Week-by-Week Breakdown

### Week 1: Technology Landscape Analysis (Story R1.1)

**Days 1-2: Initial Research and Documentation Setup**
- Review PRD requirements (FR-CI1-5, NFR2, CR2)
- Set up research workspace and tracking spreadsheets
- Create test character dataset (5 reference images, diverse scenarios)
- Document evaluation criteria and scoring rubrics

**Days 3-4: Technology Candidate Research**
- **LoRA Training**:
  - Research Replicate LoRA training API
  - Investigate RunPod custom model deployment
  - Evaluate local SDXL + LoRA inference options
- **Flux Dev Consistent Character**:
  - Review Flux Dev documentation
  - Test reference image conditioning capabilities
  - Evaluate API availability and pricing
- **IPAdapter/ReferenceNet**:
  - Research Stable Diffusion + IPAdapter pipelines
  - Investigate ComfyUI integration options
  - Evaluate deployment complexity (Replicate vs. self-hosted)
- **Consistent Character API Services**:
  - Scenario.com API evaluation
  - Leonardo.ai consistent character features
  - Astria fine-tuning capabilities
  - Other emerging services (Fal.ai, Replicate models)

**Day 5: Comparison Matrix Completion**
- Populate technology comparison spreadsheet
- Identify Tier 1/2/3 candidates
- Document showstoppers and dealbreakers
- Select top 3 technologies for PoC prototyping

**Deliverables**:
- Technology comparison matrix (CSV)
- Written report with pros/cons for 5+ technologies
- Cost projections for 1k/10k/100k generations/month
- Top 3 technology selection memo

---

### Week 2: Proof-of-Concept Prototypes (Story R1.2)

**Days 1-2: PoC Environment Setup**
- Set up development environment with test API keys
- Create isolated service modules for each technology:
  - `loraService.ts` (or equivalent based on candidates)
  - `fluxConsistentService.ts` (if Flux Dev selected)
  - `ipAdapterService.ts` (if IPAdapter selected)
- Implement basic integration with `generateStillVariants()` pattern
- Set up similarity measurement framework (CLIP, FaceNet)

**Days 3-4: Character Generation Testing**
For each of the top 3 technologies, generate test variations:

1. **Close-up portrait** (well-lit)
2. **Wide shot full-body** (outdoor lighting)
3. **Profile view** (side angle)
4. **Low-light scene** (dramatic lighting)
5. **Action pose** (dynamic movement)

For each test:
- Generate 3 variations per scenario
- Measure CLIP similarity scores (target: >0.85)
- Measure FaceNet distance (target: <0.6)
- Document latency (training time + inference time)
- Record API costs

**Day 5: Human Evaluation and Performance Analysis**
- Conduct blind human evaluation (10+ evaluators)
  - Show reference image + 5 test variations
  - Ask: "Are these the same character?" (Yes/No/Unsure)
  - Target: >90% "Yes" responses
- Analyze performance data:
  - Latency breakdown (training, inference, total)
  - Visual consistency scores (CLIP, FaceNet, human)
  - Integration complexity (LOC count, dependencies)
- Create side-by-side comparison gallery

**Deliverables**:
- 3 working prototype service modules
- Comparison gallery (reference + 15 test images per technology)
- Performance spreadsheet (latency, cost, similarity scores)
- Integration complexity report (LOC, dependencies, setup steps)
- Human evaluation results summary

---

### Week 3: Final Recommendation (Story R1.3)

**Days 1-2: Data Analysis and Scoring**
- Complete scorecard for all 3 prototyped technologies
- Calculate total scores using weighted criteria:
  - Visual Consistency (30%)
  - Training Time (15%)
  - Inference Latency (20%)
  - API Cost (15%)
  - Integration Complexity (10%)
  - Browser Compatibility (10%)
- Identify recommended technology (Tier 1 score ≥70)

**Days 3-4: Final Recommendation Document**
Write comprehensive recommendation document (5-10 pages):

1. **Executive Summary** (1 page)
   - Chosen technology and justification
   - Key performance metrics
   - Implementation timeline (Epic 2)

2. **Technology Comparison** (2-3 pages)
   - Detailed scorecard
   - Visual comparison gallery
   - Performance benchmarks

3. **Risk Assessment** (1 page)
   - Technical risks (consistency, latency, cost)
   - Integration risks (backward compatibility)
   - Mitigation strategies

4. **Implementation Plan** (2-3 pages)
   - Estimated effort (story points: <40 target)
   - Service architecture (`characterIdentityService.ts`)
   - Data model changes (`Character` type extensions)
   - API key requirements
   - Required dependencies

5. **Cost Analysis** (1 page)
   - Development cost (5-8 weeks engineering)
   - Operational cost (1k, 10k, 100k generations/month)
   - Break-even analysis

6. **Fallback Strategy** (1 page)
   - Backup approach if primary fails
   - Trigger criteria (consistency <90%, cost >$0.20/gen)
   - Simplified fallback option

**Day 5: Stakeholder Review and Sign-Off**
- Present findings to product, engineering, design teams
- Address questions and concerns
- Obtain stakeholder sign-off
- Document final approval

**Deliverables**:
- Final recommendation document (PDF)
- Stakeholder presentation (slides)
- Approved technology selection
- Implementation plan for Epic 2

---

## Technology Candidates (Detailed)

### 1. LoRA Training Approaches

**Services to Evaluate**:
- **Replicate LoRA Training**: `ostris/flux-dev-lora-trainer` model
- **RunPod**: Custom SDXL + LoRA deployment
- **Astria**: Fine-tuning API with character consistency features
- **Fal.ai**: Fast LoRA training with Flux support

**Key Metrics**:
- Training time: 5-30 minutes (target: <10 min)
- Inference latency: 10-30 seconds
- Visual consistency: Very high (>95% CLIP)
- Cost: $0.50-2.00 training + $0.05-0.15/generation

**Pros**:
- Highest visual consistency potential
- Full control over character appearance
- Works with any scene/angle/lighting

**Cons**:
- Training time overhead (not instant)
- Requires 5-10 reference images
- Model storage (10-100MB per character)

---

### 2. Flux Dev Consistent Character

**Services to Evaluate**:
- **Replicate Flux Dev**: `black-forest-labs/flux-dev` with reference images
- **Fal.ai Flux**: Fast Flux inference with consistency features
- **Together.ai**: Flux API with custom parameters

**Key Metrics**:
- No training required (instant)
- Inference latency: 15-30 seconds
- Visual consistency: High (85-95% CLIP)
- Cost: $0.10-0.20/generation

**Pros**:
- No training time (instant character creation)
- Simpler workflow (upload references, generate)
- Lower storage requirements (reference images only)

**Cons**:
- Consistency may vary by scene complexity
- Limited control compared to LoRA
- Requires careful prompt engineering

---

### 3. IPAdapter / ReferenceNet

**Services to Evaluate**:
- **Replicate + IPAdapter**: SDXL with IPAdapter integration
- **ComfyUI + IPAdapter**: Self-hosted workflow (via Replicate)
- **Fooocus**: Simplified IPAdapter interface

**Key Metrics**:
- No training required (instant)
- Inference latency: 20-40 seconds
- Visual consistency: Medium-High (80-90% CLIP)
- Cost: $0.08-0.15/generation

**Pros**:
- No training overhead
- Good balance of consistency and flexibility
- Well-established technique

**Cons**:
- More complex integration (ComfyUI workflows)
- May require multiple reference images per generation
- Consistency lower than LoRA

---

### 4. Consistent Character API Services

**Services to Evaluate**:
- **Scenario.com**: Character consistency features with API
- **Leonardo.ai**: Character reference system
- **Artbreeder**: Character creation and consistency
- **DreamBooth APIs**: Fine-tuning services (various providers)

**Key Metrics**:
- Training time: 10-30 minutes (if fine-tuning)
- Inference latency: 15-45 seconds
- Visual consistency: Varies (70-95% CLIP)
- Cost: $0.10-0.50/generation

**Pros**:
- Managed service (less infrastructure complexity)
- Often include UI for testing
- May have additional features (pose control, etc.)

**Cons**:
- Vendor lock-in
- Cost can be higher
- Less control over underlying technology

---

## Evaluation Criteria and Benchmarks

### Visual Consistency Metrics

**CLIP Similarity Score** (30% weight):
- **Excellent**: >0.90 (27-30 points)
- **Good**: 0.85-0.90 (23-26 points)
- **Acceptable**: 0.80-0.85 (18-22 points)
- **Poor**: <0.80 (0-17 points)

**FaceNet Distance** (included in visual consistency):
- **Excellent**: <0.4 (same person, high confidence)
- **Good**: 0.4-0.6 (same person, medium confidence)
- **Acceptable**: 0.6-0.8 (uncertain)
- **Poor**: >0.8 (different person)

**Human Evaluation** (blind test with 10+ evaluators):
- Show reference image + generated variation
- Question: "Is this the same character?"
- Target: >90% "Yes" responses

---

### Performance Benchmarks

**Training Time** (15% weight):
- **Excellent**: <5 minutes (15 points)
- **Good**: 5-10 minutes (10 points)
- **Acceptable**: 10-30 minutes (5 points)
- **Poor**: >30 minutes (0 points)
- **N/A**: No training required (15 points)

**Inference Latency** (20% weight):
- **Excellent**: <15 seconds (20 points)
- **Good**: 15-30 seconds (15 points)
- **Acceptable**: 30-60 seconds (10 points)
- **Poor**: 60-120 seconds (5 points)
- **Unacceptable**: >120 seconds (0 points)

**API Cost** (15% weight):
- **Excellent**: <$0.05/generation (15 points)
- **Good**: $0.05-$0.10/generation (10 points)
- **Acceptable**: $0.10-$0.20/generation (5 points)
- **Poor**: >$0.20/generation (0 points)

---

### Integration Complexity Assessment

**Lines of Code** (10% weight):
- **Simple**: <200 LOC (10 points)
- **Moderate**: 200-500 LOC (7 points)
- **Complex**: 500-1000 LOC (4 points)
- **Very Complex**: >1000 LOC (0 points)

**Dependencies**:
- Count new npm packages required
- Assess bundle size impact
- Evaluate build complexity

**API Setup Steps**:
- Account creation
- API key generation
- Environment variable configuration
- Initial testing/validation

---

## Test Datasets and Procedures

### Reference Character Creation

**Character Archetype**: "Sarah" - Female protagonist, 25-30 years old

**5 Reference Images**:
1. **Portrait (well-lit)**: Frontal view, neutral expression, soft lighting
2. **Full-body (outdoor)**: Standing pose, natural daylight, casual clothing
3. **Profile view**: Side angle, 3/4 view, same lighting as portrait
4. **Dramatic lighting**: Low-key lighting, serious expression, high contrast
5. **Action pose**: Dynamic movement, varied angle, motion blur acceptable

**Image Specifications**:
- Resolution: 1024x1024 minimum
- Format: JPEG or PNG
- Quality: High (no compression artifacts)
- Consistency: Same person, similar age/appearance across all 5 images

---

### Test Scenario Specifications

For each technology, generate the following test scenarios:

**Scenario 1: Close-up Portrait (Well-Lit)**
- **Prompt**: "Close-up portrait of Sarah, soft studio lighting, neutral expression, looking at camera, cinematic, professional photography"
- **Expected**: Face clearly visible, high detail, recognizable as reference character
- **CLIP Target**: >0.90

**Scenario 2: Wide Shot Full-Body (Outdoor)**
- **Prompt**: "Wide shot of Sarah standing in urban environment, natural daylight, golden hour, full-body view, cinematic film still"
- **Expected**: Full body visible, outdoor lighting, character recognizable despite distance
- **CLIP Target**: >0.85

**Scenario 3: Profile View (Side Angle)**
- **Prompt**: "Profile view of Sarah, side angle, dramatic lighting, serious expression, cinematic film noir style"
- **Expected**: Side angle clear, facial features recognizable from profile
- **CLIP Target**: >0.85

**Scenario 4: Low-Light Scene (Dramatic Lighting)**
- **Prompt**: "Sarah in dark warehouse, low-key lighting, shadowy atmosphere, tense mood, cinematic thriller"
- **Expected**: Character recognizable despite low light, dramatic shadows
- **CLIP Target**: >0.80

**Scenario 5: Action Pose (Dynamic Movement)**
- **Prompt**: "Sarah running through corridor, motion, dynamic pose, blurred background, action scene, cinematic"
- **Expected**: Character recognizable in motion, dynamic pose clear
- **CLIP Target**: >0.80

---

## Similarity Measurement Procedures

### CLIP Similarity Calculation

**Setup**:
```python
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
```

**Procedure**:
1. Load reference image and generated image
2. Process both images through CLIP model
3. Extract image embeddings
4. Calculate cosine similarity between embeddings
5. Record similarity score (0.0 - 1.0)

**Interpretation**:
- **>0.90**: Extremely similar (same subject, minor variations)
- **0.85-0.90**: Very similar (same subject, more variation)
- **0.80-0.85**: Similar (same subject, significant variation)
- **<0.80**: Dissimilar (different subjects or major inconsistency)

---

### FaceNet Distance Calculation

**Setup**:
```python
from facenet_pytorch import MTCNN, InceptionResnetV1
import torch

mtcnn = MTCNN(image_size=160, margin=0)
resnet = InceptionResnetV1(pretrained='vggface2').eval()
```

**Procedure**:
1. Detect faces in both images using MTCNN
2. Extract face crops and align
3. Generate face embeddings using InceptionResnetV1
4. Calculate L2 distance between embeddings
5. Record distance value

**Interpretation**:
- **<0.4**: Same person (high confidence)
- **0.4-0.6**: Same person (medium confidence) - **TARGET**
- **0.6-0.8**: Uncertain (low confidence)
- **>0.8**: Different person

---

### Human Evaluation Protocol

**Evaluator Recruitment**:
- 10-15 evaluators (mix of filmmakers, designers, general users)
- No AI expertise required
- Blind to which technology generated which images

**Evaluation Interface**:
- Show reference image at top
- Show 5 test scenario images below (randomized order)
- For each image, ask: "Is this the same character as the reference?"
  - Response options: Yes / No / Unsure
- Record response time (to detect hesitation)

**Scoring**:
- **Yes**: 1 point
- **Unsure**: 0.5 points
- **No**: 0 points

**Target**: Average score >0.90 (90% "Yes" responses)

---

## Deliverable Templates

### Technology Comparison Spreadsheet Template

See `epic-r1-comparison-template.csv` for full template.

**Key Columns**:
- Technology Name
- Visual Consistency Score (CLIP avg)
- Training Time (minutes)
- Inference Latency (seconds)
- API Cost ($/generation)
- Integration Complexity (LOC)
- Browser Compatibility (Y/N)
- Total Score (weighted)
- Recommendation Tier (1/2/3)

---

### PoC Demo Specification

See `epic-r1-poc-requirements.md` for detailed requirements.

**Deliverables**:
1. **Working Prototypes**: 3 service modules
2. **Comparison Gallery**: HTML page with side-by-side results
3. **Performance Dashboard**: Interactive dashboard with metrics
4. **Test Report**: Detailed analysis of all test scenarios

---

## Success Criteria Checklist

Before proceeding to Epic 2 implementation, validate:

- [ ] Technology comparison matrix complete (5+ technologies documented)
- [ ] Top 3 technologies prototyped and tested
- [ ] Visual consistency target achieved (>95% CLIP similarity)
- [ ] Latency acceptable (<5min training OR <30s reference-based)
- [ ] API cost sustainable (<$0.15/generation at 10k/month scale)
- [ ] Integration complexity manageable (<500 LOC, Vercel compatible)
- [ ] Human evaluation passed (>90% "same character" recognition)
- [ ] Final recommendation document reviewed and approved
- [ ] Stakeholder sign-off obtained (product, engineering, design)
- [ ] Backward compatibility plan documented
- [ ] Fallback strategy defined and validated

---

## Risk Mitigation Strategies

### Technical Risk: No Technology Meets >95% Consistency

**Mitigation**:
1. **Lower threshold**: Accept 90% consistency as "good enough"
2. **Hybrid approach**: Combine multiple techniques (e.g., LoRA + IPAdapter)
3. **Post-processing**: Manual selection/filtering of best generations
4. **Future research**: Revisit when new technologies emerge

### Technical Risk: API Costs Unsustainable

**Mitigation**:
1. **Usage quotas**: Implement tier-based limits
2. **Cost monitoring**: Dashboard for tracking API spend
3. **Caching**: Reuse character models across projects
4. **Batch processing**: Optimize API calls

### Integration Risk: localStorage Quota Exceeded

**Mitigation**:
1. **Supabase storage**: Store character models in cloud
2. **Blob URL fallback**: Temporary URLs with cleanup
3. **Lazy loading**: Load character data on-demand
4. **Compression**: Optimize model/image storage

---

**END OF EXECUTION ROADMAP**

*Next Actions*:
1. Assign research lead
2. Schedule kick-off meeting
3. Set up research tracking (spreadsheets, kanban board)
4. Begin Week 1 activities
