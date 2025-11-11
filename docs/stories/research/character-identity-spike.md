# Research Spike: Character Identity Consistency (Epic R1)

**Epic Reference**: Epic R1: Character Identity Consistency Research
**PRD Section**: 6. Epic Details → Research Epics → Epic R1
**Status**: Pending
**Research Lead**: TBD
**Estimated Duration**: 2-3 weeks
**Last Updated**: 2025-11-09

---

## Research Goal

Evaluate and recommend the optimal technical approach for maintaining character visual identity across all generated shots in Alkemy AI Studio.

**Success Criteria**:
- Technology recommendation approved by stakeholders
- Complexity score <7/10
- Implementation cost estimate <40 story points
- Visual consistency >95% (measured via CLIP/FaceNet embeddings)

---

## Background Context

### Current State

Alkemy currently generates character images using:
- **Flux** (primary, via `services/fluxService.ts`)
- **Google Imagen** (secondary, via `services/aiService.ts`)
- **Nano Banana** (tertiary option)

**Problem**: Each generation creates a new character appearance with no consistency mechanism. Characters look different across shots, breaking continuity and requiring manual filtering or external post-processing.

### V2 Requirement

**FR-CI1**: Characters shall maintain identical visual appearance across all generated shots, regardless of angle, lighting, or scene.

**Non-Functional Requirement (NFR2)**: Character identity consistency shall achieve >95% visual similarity score across variations (measured via CLIP/FaceNet embeddings).

**Compatibility Requirement (CR2)**: Character identity system shall integrate with existing `CastLocationsTab` without refactoring UI patterns.

### Integration Constraints

- Must work with existing `generateStillVariants()` function signature
- Must preserve existing blob URL → base64 persistence pattern
- Cannot break projects created before character identity feature
- Should support both Supabase (cloud) and localStorage (anonymous) modes
- Performance impact <15% (NFR4)

---

## Research Questions

### RQ1: Technology Landscape
**What character identity consistency technologies are available, and what are their trade-offs?**

**Candidates to Evaluate**:
1. **LoRA (Low-Rank Adaptation) Training**
   - Train character-specific LoRA models on reference images
   - Inference via compatible image generation APIs (Replicate, RunPod, local)
2. **Flux Dev Consistent Character**
   - Native consistent character features in Flux Dev model
   - Reference image conditioning
3. **IPAdapter / ReferenceNet**
   - Cross-attention reference conditioning
   - Compatible with Stable Diffusion pipelines
4. **ComfyUI Workflows**
   - Node-based character consistency workflows
   - Requires ComfyUI backend deployment
5. **Consistent Character API Services**
   - Third-party services offering character consistency as API
   - Examples: Scenario, Leonardo.ai, Astria

**Evaluation Criteria**:
| Criterion | Weight | Target | Measurement |
|-----------|--------|--------|-------------|
| Visual Consistency | 30% | >95% CLIP similarity | CLIP embeddings distance |
| Training Time | 15% | <10 minutes | Measured end-to-end |
| Inference Latency | 20% | <30s per image | Measured API response time |
| API Cost | 15% | <$0.10 per generation | Cost per 1000 generations |
| Integration Complexity | 10% | <500 LOC | Lines of code to integrate |
| Browser Compatibility | 10% | Works in Vercel serverless | Infrastructure compatibility |

**Deliverable**: Technology comparison spreadsheet with pros/cons for each candidate.

---

### RQ2: Visual Consistency Performance
**Can the top 3 technologies achieve >95% visual similarity across diverse scenarios?**

**Test Scenarios** (Story R1.2):
1. Close-up portrait (well-lit)
2. Wide shot full-body (outdoor lighting)
3. Profile view (side angle)
4. Low-light scene (dramatic lighting)
5. Action pose (dynamic movement)

**Similarity Metrics**:
- **CLIP Score**: Cosine similarity between CLIP embeddings (target: >0.85)
- **FaceNet Distance**: L2 distance between face embeddings (target: <0.6)
- **Human Evaluation**: Blind tests with 10+ evaluators (target: >90% "same character" recognition)

**Deliverable**: Side-by-side comparison gallery with similarity scores for each technology.

---

### RQ3: End-to-End Latency
**What is the total time from reference upload to first consistent shot?**

**Latency Breakdown**:
1. **Training/Preparation Time** (if applicable):
   - Upload reference images
   - Preprocess images
   - Train model/create embeddings
   - Validate results
2. **Inference Time**:
   - Submit generation request
   - Apply character identity
   - Receive generated image
   - Post-process/upscale

**Target**: Total latency <5 minutes for training-based approaches, <30s for reference-based approaches.

**Deliverable**: Latency breakdown spreadsheet for each technology.

---

### RQ4: Motion Transfer Integration
**Can the chosen solution integrate with Wan 2.2 motion transfer for real-actor reference videos?**

**FR-CI5 (Optional)**: The system shall support transferring motion from real-actor reference videos to generated characters.

**Integration Test**:
1. Generate consistent character images
2. Apply Wan 2.2 motion transfer using character as target
3. Validate that character identity is preserved after motion transfer
4. Measure quality degradation (if any)

**Deliverable**: Proof-of-concept video demonstrating character identity + motion transfer.

---

### RQ5: Storage and Bandwidth Requirements
**What are the storage/bandwidth implications for character models?**

**Storage Scenarios**:
1. **LoRA Models**: ~10-100MB per character (if using LoRA)
2. **Reference Images**: ~1-5MB per character (JPEG/PNG)
3. **Embeddings**: ~1-10KB per character (if using embedding-based approach)

**Bandwidth Implications**:
- Upload bandwidth for reference images (one-time)
- Download bandwidth for trained models (if client-side inference)
- API payload size for generation requests

**localStorage Quota**: 5-10MB total (current constraint)
**Supabase Storage**: Unlimited (with costs)

**Deliverable**: Storage/bandwidth cost analysis for 10, 100, 1000 characters.

---

## Proof-of-Concept Plan (Story R1.2)

### PoC Objectives
1. Implement working prototypes of the top 3 technologies
2. Test with same reference character across all 5 test scenarios
3. Measure visual consistency scores (CLIP, FaceNet, human evaluation)
4. Measure end-to-end latency and API costs
5. Document integration complexity (code, dependencies, setup)

### PoC Scope
**In Scope**:
- Character generation from 3-5 reference images
- Integration with existing `generateStillVariants()` pattern
- Visual similarity measurement (automated + human)
- Performance benchmarking (latency, cost)

**Out of Scope**:
- Full UI integration (focus on API/service layer)
- Multi-character shots (test single character first)
- Production-scale deployment (local/dev environment only)
- Motion transfer integration (deferred to RQ4)

### PoC Environment
- **Development**: Local dev environment with `.env.local` API keys
- **Testing Framework**: Custom test harness for similarity measurement
- **Evaluation Dataset**: Single test character with 5 reference images across diverse scenarios

### PoC Deliverables
1. **Working Prototypes**: 3 isolated service modules (e.g., `loraService.ts`, `fluxConsistentService.ts`, `ipAdapterService.ts`)
2. **Comparison Gallery**: HTML page with side-by-side results from all 3 technologies
3. **Performance Spreadsheet**: Latency, cost, similarity scores for all test scenarios
4. **Integration Complexity Report**: LOC count, dependencies, API setup steps for each technology

---

## Decision Framework

### Technology Selection Scorecard

| Technology | Visual Consistency (30%) | Training Time (15%) | Inference Latency (20%) | API Cost (15%) | Integration Complexity (10%) | Browser Compat (10%) | **Total Score** |
|------------|--------------------------|---------------------|-------------------------|----------------|------------------------------|----------------------|-----------------|
| LoRA Training | ___ / 30 | ___ / 15 | ___ / 20 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| Flux Dev Consistent | ___ / 30 | ___ / 15 | ___ / 20 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| IPAdapter/ReferenceNet | ___ / 30 | ___ / 15 | ___ / 20 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| ComfyUI Workflow | ___ / 30 | ___ / 15 | ___ / 20 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| Consistent Char API | ___ / 30 | ___ / 15 | ___ / 20 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |

**Scoring Rubric**:
- **Visual Consistency**: (CLIP score * 30) rounded
- **Training Time**: 15 if <5min, 10 if <10min, 5 if <30min, 0 if >30min
- **Inference Latency**: 20 if <15s, 15 if <30s, 10 if <60s, 5 if <120s, 0 if >120s
- **API Cost**: 15 if <$0.05/gen, 10 if <$0.10/gen, 5 if <$0.20/gen, 0 if >$0.20/gen
- **Integration Complexity**: 10 if <200 LOC, 7 if <500 LOC, 4 if <1000 LOC, 0 if >1000 LOC
- **Browser Compat**: 10 if Vercel serverless, 5 if requires external server, 0 if client-only

### Recommendation Tiers

**Tier 1: Recommended**
- Total score ≥70
- Meets all critical requirements (visual consistency >95%, latency acceptable, browser compatible)
- No showstoppers or dealbreakers

**Tier 2: Viable with Caveats**
- Total score ≥50
- Meets most requirements with acceptable trade-offs
- May require workarounds or additional development

**Tier 3: Not Recommended**
- Total score <50
- Fails critical requirements (visual consistency <90%, incompatible with Vercel, excessive cost)
- Showstoppers identified

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **No technology meets >95% consistency target** | Medium | High | Fallback to "good enough" threshold (90%), invest in post-processing |
| **Training-based solutions too slow** | Medium | Medium | Prioritize reference-based approaches (Flux Dev, IPAdapter) |
| **API costs unsustainable at scale** | High | High | Implement usage quotas, tier-based limits, cost monitoring |
| **Chosen solution incompatible with Vercel serverless** | Low | High | Early validation of deployment architecture, fallback to managed API services |
| **Motion transfer integration breaks character identity** | Medium | Low | Decouple motion transfer as optional enhancement (not critical for V2.0) |
| **Multi-character shots fail** | High | Medium | Phase 1: single character, Phase 2: multi-character (defer to V2.1) |

### Integration Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Breaking changes to existing character generation** | Medium | High | Extensive backward compatibility testing, feature flag rollout |
| **State management complexity** | Medium | Medium | Normalize character identity data, separate from core project state |
| **localStorage quota exceeded** | High | Medium | Store character models in Supabase, fallback to temporary blob URLs |
| **Performance degradation >15%** | Medium | Medium | Benchmark early, optimize critical path, implement caching |

---

## Cost Projections

### Development Cost
- **Research & PoC**: 1-2 weeks (1 engineer)
- **Implementation (Epic 2)**: 3-5 weeks (1-2 engineers)
- **Testing & QA**: 1 week (1 engineer + QA)
- **Total Development**: 5-8 weeks engineering time

### Operational Cost (Monthly Estimates)

**Scenario: 1,000 Character Generations/Month**

| Technology | API Cost | Storage Cost | Total/Month |
|------------|----------|--------------|-------------|
| LoRA Training | $50 (training) + $100 (inference) | $5 (model storage) | **$155** |
| Flux Dev Consistent | $150 (inference @ $0.15/gen) | $1 (reference images) | **$151** |
| IPAdapter/ReferenceNet | $80 (inference @ $0.08/gen) | $1 (reference images) | **$81** |
| ComfyUI Workflow | $0 (self-hosted) | $20 (server costs) | **$20** |
| Consistent Char API | $100-200 (varies by service) | $0 (service-hosted) | **$100-200** |

**Scenario: 10,000 Character Generations/Month**

| Technology | API Cost | Storage Cost | Total/Month |
|------------|----------|--------------|-------------|
| LoRA Training | $200 (training) + $1000 (inference) | $50 (model storage) | **$1,250** |
| Flux Dev Consistent | $1,500 (inference) | $10 (reference images) | **$1,510** |
| IPAdapter/ReferenceNet | $800 (inference) | $10 (reference images) | **$810** |
| ComfyUI Workflow | $0 (self-hosted) | $100 (server costs) | **$100** |
| Consistent Char API | $1,000-2,000 (varies by service) | $0 (service-hosted) | **$1,000-2,000** |

**Note**: Costs are estimates and subject to change based on actual API pricing and usage patterns.

---

## Final Recommendation Document (Story R1.3)

### Required Contents

1. **Executive Summary** (1 page)
   - Chosen technology and one-paragraph justification
   - Key performance metrics (consistency, latency, cost)
   - Implementation timeline and resource requirements

2. **Technology Comparison** (2-3 pages)
   - Detailed scorecard with all evaluated technologies
   - Visual comparison gallery (reference vs. generated)
   - Performance benchmarks (latency, cost, similarity)

3. **Risk Assessment** (1 page)
   - Technical risks and mitigation strategies
   - Integration risks and backward compatibility plan
   - Showstoppers and fallback options

4. **Implementation Plan** (2-3 pages)
   - Estimated effort (story points/time)
   - Required new dependencies and infrastructure
   - API key requirements and setup instructions
   - Service module architecture (`characterIdentityService.ts`)
   - Data model changes (`Character` type extensions in `types.ts`)

5. **Cost Analysis** (1 page)
   - Development cost (team hours, calendar time)
   - Operational cost projections (1k, 10k, 100k generations/month)
   - Break-even analysis and sustainability assessment

6. **Fallback Strategy** (1 page)
   - Primary approach fails → what's the backup plan?
   - Criteria for triggering fallback (e.g., consistency <90%, cost >$0.20/gen)
   - Simplified fallback option (e.g., reference image prompting without training)

7. **Stakeholder Sign-Off**
   - Product Manager approval
   - Engineering Lead approval
   - Design/UX approval (if applicable)

---

## Success Criteria Validation

### Before Proceeding to Epic 2 Implementation

- [ ] Final recommendation document completed and reviewed
- [ ] Technology choice meets >95% visual consistency target (CLIP/FaceNet validated)
- [ ] End-to-end latency acceptable (<5min training OR <30s reference-based)
- [ ] API cost sustainable (<$0.15/generation at 10k/month scale)
- [ ] Integration complexity manageable (<500 LOC, no new infrastructure requirements)
- [ ] Browser compatibility confirmed (works in Vercel serverless environment)
- [ ] Stakeholder sign-off obtained (product, engineering, design)
- [ ] Backward compatibility plan documented (existing projects still work)
- [ ] Fallback strategy defined and validated (if primary fails, we have backup)

---

## Appendix: Reference Resources

### Academic Papers
- LoRA: Low-Rank Adaptation of Large Language Models (Hu et al., 2021)
- IP-Adapter: Text Compatible Image Prompt Adapter (Ye et al., 2023)
- Gaussian Splatting for Character Consistency (emerging 2025 research)

### Commercial Services
- Replicate: https://replicate.com/ (LoRA training, custom models)
- Scenario: https://www.scenario.com/ (consistent character API)
- Leonardo.ai: https://leonardo.ai/ (consistent character features)
- Astria: https://www.astria.ai/ (fine-tuning API)

### Open Source Projects
- ComfyUI: https://github.com/comfyanonymous/ComfyUI
- IP-Adapter: https://github.com/tencent-ailab/IP-Adapter
- Flux Dev: https://github.com/black-forest-labs/flux

### Evaluation Tools
- CLIP (OpenAI): https://github.com/openai/CLIP
- FaceNet (Google): https://github.com/davidsandberg/facenet
- SSIM/LPIPS metrics for visual similarity

---

**END OF SPIKE PLAN**

*Next Steps: Assign research lead, allocate 2-3 weeks for execution, schedule review meeting for final recommendation.*
