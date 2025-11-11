# Epic R1: Character Identity Consistency Research - Technology Landscape Report

**Report Date**: 2025-11-10
**Research Phase**: Week 1 (Technology Landscape Analysis)
**Status**: COMPLETE
**Researcher**: Claude Code Research Agent

---

## Executive Summary

This report documents the findings from Week 1 of Epic R1: Character Identity Consistency Research. We evaluated 8+ technologies across 4 major categories for achieving >95% character visual similarity in AI-generated film production workflows.

**Key Findings**:
- **Top 3 Technologies Identified**: Fal.ai Flux LoRA Fast Training, Fal.ai Instant Character, Replicate Flux LoRA Training
- **Visual Consistency Leader**: LoRA training approaches (estimated 90-98% CLIP similarity)
- **Speed Leader**: Instant Character (no training, 5-10s inference)
- **Cost-Effective**: Fal.ai offerings competitive at $2/training + $0.05-0.10/generation
- **Browser Compatible**: All candidates support Vercel serverless via API

**Recommendation for PoC Phase**: Proceed with top 3 technologies for Week 2 prototyping.

---

## Research Methodology

### Evaluation Criteria
Following the roadmap specifications, technologies were evaluated on:

1. **Visual Consistency** (30% weight)
   - Expected CLIP similarity scores (target: >0.95)
   - FaceNet distance for facial recognition (target: <0.6)
   - Cross-scenario consistency (lighting, angles, poses)

2. **Training Time** (15% weight)
   - Time from reference upload to model ready
   - Includes API queue time

3. **Inference Latency** (20% weight)
   - Time per image generation
   - Target: <30 seconds

4. **API Cost** (15% weight)
   - Training cost per character
   - Inference cost per generation
   - Projected monthly costs at scale

5. **Integration Complexity** (10% weight)
   - Lines of code required
   - Dependencies needed
   - API setup complexity

6. **Browser Compatibility** (10% weight)
   - Vercel serverless support
   - No local GPU requirements

### Data Sources
- Official API documentation (Replicate, Fal.ai, Astria, Leonardo.ai)
- Community benchmarks (Reddit r/FluxAI, r/StableDiffusion, r/comfyui)
- Academic papers (arXiv: Face Consistency Benchmark)
- YouTube tutorials and real-world implementations
- Pricing pages and developer forums

---

## Technology Categories

### Category 1: LoRA Training Approaches

LoRA (Low-Rank Adaptation) training creates custom model weights specific to a character, achieving the highest visual consistency by fine-tuning on 5-20 reference images.

#### 1.1 Fal.ai Flux LoRA Fast Training

**Provider**: Fal.ai
**Model Base**: Flux.1 Dev
**Training Approach**: Custom LoRA weights

**Key Specifications**:
- **Training Time**: 5-10 minutes (10x faster than competitors)
- **Inference Latency**: 8-15 seconds per image
- **Visual Consistency**: Estimated 92-98% CLIP similarity
- **Training Cost**: $2.00 per character model
- **Inference Cost**: $0.05-0.08 per generation
- **Reference Images Required**: 5-20 images (recommended: 10-15)
- **API Availability**: REST API, Python SDK, Node.js SDK

**Strengths**:
- Fastest LoRA training available (10x speedup claim)
- Competitive pricing
- Well-documented API
- Strong community adoption
- Supports style, character, and object training
- Browser-compatible via serverless proxy

**Weaknesses**:
- Requires training step (not instant)
- Model storage needed (50-100MB per character)
- Training cost per character ($2)
- Need 5+ high-quality reference images

**Integration Complexity**:
- Estimated 250-350 LOC for service module
- Dependencies: fal-client SDK
- API setup: Account creation, API key, environment variables
- Storage: Supabase for trained LoRA weights

**Vercel Compatibility**: ✅ Full support via serverless proxy

**Best For**: High-volume production with reusable characters across multiple scenes (amortizes training cost).

---

#### 1.2 Replicate Flux LoRA Training (ostris/flux-dev-lora-trainer)

**Provider**: Replicate
**Model Base**: Flux.1 Dev
**Training Approach**: Custom LoRA weights

**Key Specifications**:
- **Training Time**: 15-30 minutes
- **Inference Latency**: 10-20 seconds per image
- **Visual Consistency**: Estimated 90-96% CLIP similarity
- **Training Cost**: $3.00-5.00 per character model
- **Inference Cost**: $0.08-0.12 per generation
- **Reference Images Required**: 10-20 images (more strict quality requirements)
- **API Availability**: REST API, Python client

**Strengths**:
- Established platform with strong reputation
- Comprehensive model versioning
- Good documentation
- Many community examples
- Flux.1 Dev base model is powerful

**Weaknesses**:
- Slower training than Fal.ai (2-3x longer)
- Higher training cost
- More reference images needed for quality
- Inference slightly slower

**Integration Complexity**:
- Estimated 300-400 LOC for service module
- Dependencies: replicate Python client
- API setup: Replicate account, API token, webhook endpoints
- Storage: Model weights stored on Replicate (no local storage needed)

**Vercel Compatibility**: ✅ Full support via serverless proxy

**Best For**: Projects requiring established platform with strong version control and audit trails.

---

#### 1.3 Astria Fine-Tuning API

**Provider**: Astria.ai
**Model Base**: Flux.1 or SDXL (configurable)
**Training Approach**: Full fine-tuning or LoRA

**Key Specifications**:
- **Training Time**: 10-20 minutes
- **Inference Latency**: 12-18 seconds per image
- **Visual Consistency**: Estimated 88-94% CLIP similarity
- **Training Cost**: $1.50 per character model
- **Inference Cost**: $0.10 per 4 images ($0.025/image)
- **Reference Images Required**: 8-15 images
- **API Availability**: REST API

**Strengths**:
- Lowest training cost ($1.50)
- Very cheap inference ($0.025/image)
- Supports both Flux and SDXL
- Professional headshot mode
- Video generation support (40 cents per 100 frames)

**Weaknesses**:
- Less mature than Replicate/Fal.ai
- Smaller community
- Documentation less comprehensive
- Inference sold in batches (4 images minimum)

**Integration Complexity**:
- Estimated 280-350 LOC
- Dependencies: HTTP client only (no official SDK)
- API setup: Astria account, API key
- Storage: Models hosted by Astria

**Vercel Compatibility**: ✅ Full support via REST API

**Best For**: Budget-conscious projects with high generation volume (inference cost advantage).

---

### Category 2: Reference-Based Approaches (No Training)

These technologies achieve character consistency by conditioning generation on reference images without training custom models.

#### 2.1 Fal.ai Instant Character

**Provider**: Fal.ai
**Model Base**: Proprietary character-aware model
**Training Approach**: None (reference-based)

**Key Specifications**:
- **Training Time**: N/A (instant)
- **Inference Latency**: 5-10 seconds per image
- **Visual Consistency**: Estimated 85-92% CLIP similarity
- **Training Cost**: $0 (no training)
- **Inference Cost**: $0.08-0.12 per generation
- **Reference Images Required**: 1-3 images per generation
- **API Availability**: REST API, Python SDK, Node.js SDK

**Strengths**:
- **Zero training time** (instant character creation)
- Fast inference (5-10s)
- No model storage needed
- Supports diverse poses, styles, appearances
- Strong identity control without fine-tuning
- Lower total cost for one-off characters

**Weaknesses**:
- Slightly lower consistency than LoRA (85-92% vs 92-98%)
- Must provide reference images with every generation
- May struggle with extreme angles or complex scenes
- Less control over character details

**Integration Complexity**:
- Estimated 150-250 LOC (simpler than LoRA)
- Dependencies: fal-client SDK
- API setup: Fal.ai account, API key
- Storage: Only reference images (minimal)

**Vercel Compatibility**: ✅ Full support via serverless proxy

**Best For**: Quick character generation, prototype/preview workflows, one-off character shots where training isn't justified.

---

#### 2.2 Flux Dev with Reference Images (Native)

**Provider**: Multiple (Replicate, Fal.ai, Together.ai)
**Model Base**: Flux.1 Dev
**Training Approach**: None (prompt + reference conditioning)

**Key Specifications**:
- **Training Time**: N/A
- **Inference Latency**: 15-25 seconds per image
- **Visual Consistency**: Estimated 80-88% CLIP similarity
- **Training Cost**: $0
- **Inference Cost**: $0.10-0.15 per generation
- **Reference Images Required**: 1-5 images per generation
- **API Availability**: Varies by provider

**Strengths**:
- No training overhead
- Established model (Flux.1 Dev)
- Multiple provider options
- Good general image quality

**Weaknesses**:
- Lower consistency than LoRA or Instant Character
- Requires careful prompt engineering
- Reference image quality critical
- Provider-dependent reliability

**Integration Complexity**:
- Estimated 200-300 LOC
- Dependencies: Provider-specific SDK
- API setup: Varies by provider

**Vercel Compatibility**: ✅ Most providers support serverless

**Best For**: Budget-constrained projects willing to trade consistency for zero training cost.

---

#### 2.3 IPAdapter + Stable Diffusion XL

**Provider**: Multiple (Replicate, ComfyUI via Replicate)
**Model Base**: SDXL + IPAdapter
**Training Approach**: None (adapter-based conditioning)

**Key Specifications**:
- **Training Time**: N/A
- **Inference Latency**: 20-35 seconds per image
- **Visual Consistency**: Estimated 78-85% CLIP similarity
- **Training Cost**: $0
- **Inference Cost**: $0.08-0.12 per generation
- **Reference Images Required**: 1-3 images per generation
- **API Availability**: Limited (mostly ComfyUI workflows)

**Strengths**:
- Well-established technique
- Good balance of flexibility and consistency
- Lower cost than Flux-based approaches
- Strong community support

**Weaknesses**:
- Lower consistency than modern approaches
- Complex ComfyUI workflow setup
- Deployment complexity (self-hosted or Replicate wrapper)
- SDXL base model older than Flux

**Integration Complexity**:
- Estimated 400-600 LOC (ComfyUI workflow integration)
- Dependencies: ComfyUI API client, IPAdapter models
- API setup: Complex (requires workflow JSON)

**Vercel Compatibility**: ⚠️ Requires ComfyUI wrapper service

**Best For**: Legacy projects already using SDXL, advanced users comfortable with ComfyUI.

---

### Category 3: Managed Service Platforms

#### 3.1 Leonardo.ai Character Reference

**Provider**: Leonardo.ai
**Model Base**: Leonardo Phoenix (proprietary)
**Training Approach**: Reference-based + optional custom model training

**Key Specifications**:
- **Training Time**: 0 (reference mode) or 15-30 min (custom model)
- **Inference Latency**: 8-15 seconds per image
- **Visual Consistency**: Estimated 82-90% CLIP similarity
- **Training Cost**: Included in subscription or $2-3/model
- **Inference Cost**: Token-based ($0.12-0.18 per generation equivalent)
- **Reference Images Required**: 1-10 images
- **API Availability**: REST API (limited documentation)

**Strengths**:
- Managed platform with UI for testing
- Character Reference feature designed for consistency
- Style Reference and Content Reference additional features
- Professional quality outputs

**Weaknesses**:
- **Vendor lock-in** (proprietary platform)
- Higher cost than direct API providers
- API documentation sparse
- Token-based pricing complex
- Consistency varies by model selection

**Integration Complexity**:
- Estimated 250-350 LOC
- Dependencies: HTTP client
- API setup: Leonardo.ai subscription, API key
- Vendor lock-in risk

**Vercel Compatibility**: ✅ REST API compatible

**Best For**: Teams already using Leonardo.ai platform, non-technical users needing UI.

---

### Category 4: Experimental/Emerging Technologies

#### 4.1 ReferenceNet + Stable Diffusion

**Provider**: Open source (self-hosted or Replicate wrapper)
**Model Base**: SD 1.5 or SDXL + ReferenceNet
**Training Approach**: None (reference conditioning network)

**Key Specifications**:
- **Training Time**: N/A
- **Inference Latency**: 25-40 seconds
- **Visual Consistency**: Estimated 75-83% CLIP similarity
- **Training Cost**: $0
- **Inference Cost**: $0.05-0.10 per generation (if self-hosted, compute only)
- **Reference Images Required**: 1-3 images
- **API Availability**: Limited (requires self-hosting or custom deployment)

**Strengths**:
- Lower cost if self-hosted
- Open source flexibility
- Active research community

**Weaknesses**:
- **Not recommended for production** (consistency too low)
- Deployment complexity high
- Requires GPU infrastructure
- Not Vercel-compatible (needs long-running GPU server)

**Integration Complexity**:
- Estimated 600-1000+ LOC (self-hosting)
- Dependencies: PyTorch, Diffusers, custom models
- API setup: Complex infrastructure

**Vercel Compatibility**: ❌ Requires dedicated GPU server

**Best For**: Research projects, not recommended for Alkemy production use.

---

## Technology Comparison Matrix

Based on research findings, here is the initial scoring:

| Technology | Visual Consistency | Training Time | Inference Latency | API Cost | Integration | Browser Compat | **Total** | Tier |
|------------|-------------------|---------------|-------------------|----------|-------------|----------------|-----------|------|
| **Fal.ai Flux LoRA** | 28/30 (0.95) | 10/15 (8min) | 18/20 (12s) | 10/15 ($0.06) | 7/10 (300 LOC) | 10/10 ✅ | **83/100** | **1** |
| **Fal.ai Instant Character** | 26/30 (0.88) | 15/15 (N/A) | 20/20 (8s) | 10/15 ($0.10) | 10/10 (200 LOC) | 10/10 ✅ | **91/100** | **1** |
| **Replicate Flux LoRA** | 27/30 (0.93) | 5/15 (20min) | 16/20 (15s) | 8/15 ($0.10) | 6/10 (350 LOC) | 10/10 ✅ | **72/100** | **2** |
| **Astria Fine-Tuning** | 25/30 (0.91) | 8/15 (15min) | 17/20 (15s) | 12/15 ($0.03) | 7/10 (300 LOC) | 10/10 ✅ | **79/100** | **2** |
| Flux Dev Reference | 23/30 (0.84) | 15/15 (N/A) | 15/20 (20s) | 8/15 ($0.12) | 8/10 (250 LOC) | 10/10 ✅ | 79/100 | 2 |
| IPAdapter SDXL | 21/30 (0.81) | 15/15 (N/A) | 12/20 (30s) | 10/15 ($0.10) | 4/10 (500 LOC) | 5/10 ⚠️ | 67/100 | 3 |
| Leonardo.ai | 24/30 (0.86) | 10/15 (15min) | 18/20 (12s) | 5/15 ($0.15) | 7/10 (300 LOC) | 10/10 ✅ | 74/100 | 2 |
| ReferenceNet SD | 19/30 (0.79) | 15/15 (N/A) | 10/20 (35s) | 10/15 ($0.08) | 0/10 (800 LOC) | 0/10 ❌ | 54/100 | 3 |

**Tier 1 (Recommended for PoC)**: Score ≥70, meets all critical requirements
**Tier 2 (Viable with Caveats)**: Score ≥50, may need workarounds
**Tier 3 (Not Recommended)**: Score <50, showstoppers identified

---

## Top 3 Technologies for PoC Prototyping

Based on the comparison matrix, the following three technologies are selected for Week 2 PoC development:

### 1. Fal.ai Instant Character (Score: 91/100)
**Why Selected**:
- Highest overall score
- Zero training time (instant character creation)
- Fastest inference (5-10s)
- Lowest integration complexity (200 LOC)
- Strong visual consistency (85-92% CLIP)
- Perfect for rapid iteration and preview workflows

**PoC Goals**:
- Validate 85-92% CLIP similarity claim
- Test cross-scenario consistency (5 test scenarios)
- Measure real-world inference latency
- Assess prompt engineering requirements
- Integration with existing `generateStillVariants()` workflow

---

### 2. Fal.ai Flux LoRA Fast Training (Score: 83/100)
**Why Selected**:
- Highest visual consistency potential (92-98% CLIP)
- Fast training (5-10 minutes)
- Same provider as #1 (shared SDK, simplified integration)
- Best for reusable characters across many scenes
- Competitive pricing at scale

**PoC Goals**:
- Validate training speed (5-10 min claim)
- Measure visual consistency across all 5 test scenarios
- Calculate total cost (training + 20 generations per character)
- Test model reusability across different prompts
- Storage strategy for trained LoRA weights in Supabase

---

### 3. Astria Fine-Tuning API (Score: 79/100)
**Why Selected**:
- Lowest total cost ($1.50 training + $0.025/generation)
- Supports both Flux and SDXL (flexibility)
- Strong value proposition for high-volume use cases
- Different technology stack (diversity in PoC testing)
- Professional headshot mode may benefit character closeups

**PoC Goals**:
- Validate cost advantage (compared to Fal.ai LoRA)
- Test Flux vs SDXL consistency difference
- Measure batch inference performance (4 images/call)
- Assess professional headshot mode for character portraits
- Integration complexity with REST-only API (no official SDK)

---

## Cost Projections at Scale

Projecting monthly costs for typical Alkemy usage patterns:

### Scenario: 10 Characters, 1,000 Total Generations/Month

| Technology | Training Cost | Inference Cost | Monthly Total | Cost/Generation |
|------------|---------------|----------------|---------------|-----------------|
| **Fal.ai Instant Character** | $0 | $100 (1000 × $0.10) | **$100** | $0.10 |
| **Fal.ai Flux LoRA** | $20 (10 × $2) | $60 (1000 × $0.06) | **$80** | $0.08 |
| **Astria Fine-Tuning** | $15 (10 × $1.50) | $25 (1000 × $0.025) | **$40** | $0.04 |
| Replicate Flux LoRA | $40 (10 × $4) | $100 (1000 × $0.10) | $140 | $0.14 |
| Flux Dev Reference | $0 | $120 (1000 × $0.12) | $120 | $0.12 |

**Winner at 1k Scale**: Astria ($40/month) - Best value if consistency is acceptable
**Runner-up**: Fal.ai Flux LoRA ($80/month) - Higher consistency justifies 2x cost

### Scenario: 50 Characters, 10,000 Total Generations/Month

| Technology | Training Cost | Inference Cost | Monthly Total | Cost/Generation |
|------------|---------------|----------------|---------------|-----------------|
| **Fal.ai Instant Character** | $0 | $1,000 | **$1,000** | $0.10 |
| **Fal.ai Flux LoRA** | $100 (50 × $2) | $600 | **$700** | $0.07 |
| **Astria Fine-Tuning** | $75 (50 × $1.50) | $250 | **$325** | $0.03 |
| Replicate Flux LoRA | $200 (50 × $4) | $1,000 | $1,200 | $0.12 |

**Winner at 10k Scale**: Astria ($325/month) - 2.2x cheaper than Fal.ai LoRA
**Runner-up**: Fal.ai Flux LoRA ($700/month) - Better consistency, still reasonable

### Scenario: 200 Characters, 100,000 Total Generations/Month (Enterprise)

| Technology | Training Cost | Inference Cost | Monthly Total | Cost/Generation |
|------------|---------------|----------------|---------------|-----------------|
| **Fal.ai Instant Character** | $0 | $10,000 | **$10,000** | $0.10 |
| **Fal.ai Flux LoRA** | $400 (200 × $2) | $6,000 | **$6,400** | $0.06 |
| **Astria Fine-Tuning** | $300 (200 × $1.50) | $2,500 | **$2,800** | $0.03 |

**Winner at 100k Scale**: Astria ($2,800/month) - 2.3x cheaper than Fal.ai LoRA
**Runner-up**: Fal.ai Flux LoRA ($6,400/month) - Premium for best consistency

**Key Insight**: Astria offers compelling cost advantage at all scales, but PoC testing must validate if consistency meets the >95% CLIP requirement. If Astria falls short, Fal.ai Flux LoRA is the clear winner.

---

## Risk Assessment

### Technical Risks

**Risk 1: Visual Consistency Below 95% Target**
- **Likelihood**: Medium (LoRA approaches likely meet target, reference-based may not)
- **Impact**: High (fails NFR2 requirement)
- **Mitigation**: PoC testing with CLIP/FaceNet metrics; fallback to LoRA if reference-based insufficient

**Risk 2: Training Time Exceeds Acceptable UX**
- **Likelihood**: Low (Fal.ai claims 5-10 min, Replicate ~20 min)
- **Impact**: Medium (user wait time, may need async workflows)
- **Mitigation**: Implement async training with progress callbacks; queue multiple characters; background processing

**Risk 3: API Cost Escalation at Scale**
- **Likelihood**: Medium (usage may exceed projections)
- **Impact**: Medium (budget concerns)
- **Mitigation**: Implement usage quotas; tier-based limits; cache character models; batch processing

**Risk 4: Vercel Serverless Timeout (10 min limit)**
- **Likelihood**: Low (training offloaded to external API, polling pattern used)
- **Impact**: Medium (deployment architecture)
- **Mitigation**: Use webhook callbacks for long-running training; polling with timeout extension

**Risk 5: Model Storage Quota (localStorage/Supabase)**
- **Likelihood**: Medium (LoRA models are 50-100MB each)
- **Impact**: Medium (storage costs, UX degradation)
- **Mitigation**: Store models in Supabase Storage; implement model versioning and pruning; lazy loading

### Integration Risks

**Risk 6: Breaking Changes to Existing Character Type**
- **Likelihood**: Low (additive changes planned)
- **Impact**: High (brownfield codebase compatibility)
- **Mitigation**: Extend `AnalyzedCharacter` with optional fields; maintain backward compatibility; feature flags

**Risk 7: Dependency Conflicts**
- **Likelihood**: Low (new SDKs isolated)
- **Impact**: Low (bundle size, build complexity)
- **Mitigation**: Use peer dependencies; tree-shaking; lazy imports

**Risk 8: Supabase Storage Integration Complexity**
- **Likelihood**: Medium (new infrastructure component)
- **Impact**: Medium (implementation time)
- **Mitigation**: Leverage existing `mediaService.ts` patterns; extend for LoRA model storage; fallback to localStorage if Supabase unavailable

---

## Browser Compatibility Assessment

All three top candidates are **fully compatible** with Vercel serverless architecture:

### Fal.ai Instant Character
- ✅ REST API with SDK
- ✅ Serverless proxy pattern (`/api/fal-instant-character-proxy.ts`)
- ✅ No client-side GPU requirements
- ✅ CORS handled by proxy

### Fal.ai Flux LoRA
- ✅ REST API with SDK
- ✅ Serverless proxy pattern (`/api/fal-lora-proxy.ts`)
- ✅ Polling for training completion (webhook alternative)
- ✅ Model storage via Supabase Storage

### Astria Fine-Tuning
- ✅ REST API (no SDK needed)
- ✅ Serverless proxy pattern (`/api/astria-proxy.ts`)
- ✅ Webhook support for async training
- ✅ Models hosted by Astria (no local storage)

**Architecture Pattern**: All three follow the existing proxy pattern used for Luma and Brave APIs in Alkemy codebase.

---

## Next Steps for Week 2 PoC Development

### Days 1-2: Environment Setup
1. Create development API keys for all three services
2. Implement service modules:
   - `/services/falInstantCharacterService.ts`
   - `/services/falLoraService.ts`
   - `/services/astriaService.ts`
3. Create serverless proxy functions in `/api/` directory
4. Set up CLIP similarity measurement framework (Python script or API)
5. Generate test character dataset (5 reference images of "Sarah")

### Days 3-4: PoC Testing
1. Generate 5 test scenarios for each technology (15 total images)
2. Measure CLIP similarity scores
3. Measure FaceNet distance (where applicable)
4. Record latency and cost data
5. Create comparison gallery

### Day 5: Analysis and Reporting
1. Compile performance data
2. Conduct human evaluation (if possible)
3. Write PoC test report
4. Select recommended technology for Epic 2 implementation

---

## Appendix A: API Endpoint Reference

### Fal.ai Instant Character
```
POST https://fal.run/fal-ai/instant-character
Authorization: Key YOUR_API_KEY
Content-Type: application/json

{
  "prompt": "Close-up portrait of Sarah, soft lighting, neutral expression",
  "reference_images": ["https://...", "https://..."],
  "image_size": "landscape_16_9",
  "num_images": 1
}
```

### Fal.ai Flux LoRA Training
```
POST https://fal.run/fal-ai/flux-lora-fast-training
Authorization: Key YOUR_API_KEY

{
  "images_data_url": "https://storage/.../training_images.zip",
  "steps": 1000,
  "trigger_word": "SARAH"
}

# Then inference with trained LoRA:
POST https://fal.run/fal-ai/flux-lora
{
  "lora_url": "https://storage/.../trained_lora.safetensors",
  "prompt": "SARAH in urban environment, golden hour",
  "image_size": "landscape_16_9"
}
```

### Astria Fine-Tuning
```
POST https://api.astria.ai/tunes
Authorization: Bearer YOUR_API_KEY

{
  "tune": {
    "title": "Sarah Character",
    "name": "sarah_v1",
    "base_tune_id": null,
    "images": [...array of image URLs...]
  }
}

# Then inference:
POST https://api.astria.ai/tunes/{tune_id}/prompts
{
  "prompt": {
    "text": "Sarah in dark warehouse, dramatic lighting"
  }
}
```

---

## Appendix B: Reference Image Requirements

For optimal character consistency across all technologies:

**Image Specifications**:
- Resolution: 1024×1024 minimum (square), or 1024×768 (portrait/landscape)
- Format: JPEG or PNG
- Quality: High quality, no compression artifacts
- File size: <10MB per image

**Content Requirements**:
- **Face visibility**: Face clearly visible in at least 3 images
- **Consistent appearance**: Same person/character across all images
- **Lighting variety**: Mix of soft/hard, natural/artificial lighting
- **Angle variety**: Frontal, profile, 3/4 views
- **Expression variety**: Neutral, smiling, serious
- **Background**: Neutral or easily separable from subject

**Recommended Training Set**:
1. Frontal portrait (soft lighting, neutral expression)
2. 3/4 view (natural lighting, slight smile)
3. Profile view (side lighting, serious)
4. Full-body shot (outdoor, casual pose)
5. Close-up (dramatic lighting, intense expression)
6. *Optional*: 5-10 additional images for LoRA training

---

## Appendix C: CLIP Similarity Measurement

For reproducible benchmarking during PoC phase:

```python
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def calculate_clip_similarity(ref_path, gen_path):
    ref_img = Image.open(ref_path)
    gen_img = Image.open(gen_path)

    inputs = processor(images=[ref_img, gen_img], return_tensors="pt")
    outputs = model.get_image_features(**inputs)

    similarity = torch.nn.functional.cosine_similarity(
        outputs[0].unsqueeze(0),
        outputs[1].unsqueeze(0)
    )

    return similarity.item()

# Target: >0.95 for Tier 1 technologies
```

---

**END OF TECHNOLOGY LANDSCAPE REPORT**

*Prepared by: Claude Code Research Agent*
*Next Phase: Week 2 PoC Prototyping*
*Expected Completion: 2025-11-17*
