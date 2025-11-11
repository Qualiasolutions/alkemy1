# Epic 2: Character Identity PoC Validation Checklist

**Date**: 2025-11-11
**Technology**: Fal.ai Instant Character API
**Goal**: Validate >95% visual consistency before implementation
**Duration**: 5 days

---

## PoC Setup (Day 1)

### Prerequisites
- [ ] Create Fal.ai account at https://fal.ai
- [ ] Obtain API key from Fal.ai dashboard
- [ ] Store API key securely (do not commit to version control)

### Test Environment Setup
```bash
# Create test directory
mkdir -p poc-character-identity
cd poc-character-identity

# Initialize Node.js project
npm init -y

# Install dependencies
npm install @fal-ai/client dotenv

# Create .env file
echo "FAL_API_KEY=your_api_key_here" > .env
```

### Test Script Template
```javascript
// test-character-identity.js
require('dotenv').config();
const fal = require('@fal-ai/client');

fal.config({ credentials: process.env.FAL_API_KEY });

async function testCharacterIdentity() {
  // PoC test implementation
  // See test scenarios below
}

testCharacterIdentity();
```

---

## Test Dataset Creation (Day 1)

### Character Selection
Select 3 diverse test characters:

**Character 1**: Male, 30s, Caucasian
- [ ] Reference image 1: Front view, neutral expression
- [ ] Reference image 2: 3/4 view, smiling
- [ ] Reference image 3: Profile view, serious
- [ ] Reference image 4: Different lighting (dramatic)
- [ ] Reference image 5: Different angle (looking up)

**Character 2**: Female, 20s, Asian
- [ ] Reference image 1: Front view, neutral expression
- [ ] Reference image 2: 3/4 view, smiling
- [ ] Reference image 3: Profile view, serious
- [ ] Reference image 4: Different lighting (dramatic)
- [ ] Reference image 5: Different angle (looking up)

**Character 3**: Male, 40s, African
- [ ] Reference image 1: Front view, neutral expression
- [ ] Reference image 2: 3/4 view, smiling
- [ ] Reference image 3: Profile view, serious
- [ ] Reference image 4: Different lighting (dramatic)
- [ ] Reference image 5: Different angle (looking up)

### Test Scenarios (5 per character)
For each character, generate:

1. **Close-up portrait** (well-lit)
   - Prompt: "Close-up portrait, neutral expression, studio lighting, cinematic film still"

2. **Wide shot full-body** (outdoor lighting)
   - Prompt: "Full body shot, standing pose, outdoor natural lighting, cinematic film still"

3. **Profile view** (side angle)
   - Prompt: "Profile view from the side, dramatic lighting, cinematic film still"

4. **Low-light scene** (dramatic lighting)
   - Prompt: "Character in dimly lit room, moody dramatic lighting, cinematic film still"

5. **Action pose** (dynamic movement)
   - Prompt: "Character in action pose, dynamic movement, cinematic film still"

---

## Generation Testing (Days 2-3)

### Test Execution Checklist

**For Character 1**:
- [ ] Upload 5 reference images to Fal.ai
- [ ] Generate test scenario 1 (close-up portrait)
- [ ] Generate test scenario 2 (wide shot)
- [ ] Generate test scenario 3 (profile view)
- [ ] Generate test scenario 4 (low-light)
- [ ] Generate test scenario 5 (action pose)
- [ ] Record inference time for each generation
- [ ] Record API cost for each generation
- [ ] Save all generated images with naming: `char1_scenario1.png`, etc.

**For Character 2**:
- [ ] Upload 5 reference images to Fal.ai
- [ ] Generate test scenario 1 (close-up portrait)
- [ ] Generate test scenario 2 (wide shot)
- [ ] Generate test scenario 3 (profile view)
- [ ] Generate test scenario 4 (low-light)
- [ ] Generate test scenario 5 (action pose)
- [ ] Record inference time for each generation
- [ ] Record API cost for each generation
- [ ] Save all generated images with naming: `char2_scenario1.png`, etc.

**For Character 3**:
- [ ] Upload 5 reference images to Fal.ai
- [ ] Generate test scenario 1 (close-up portrait)
- [ ] Generate test scenario 2 (wide shot)
- [ ] Generate test scenario 3 (profile view)
- [ ] Generate test scenario 4 (low-light)
- [ ] Generate test scenario 5 (action pose)
- [ ] Record inference time for each generation
- [ ] Record API cost for each generation
- [ ] Save all generated images with naming: `char3_scenario1.png`, etc.

### Performance Benchmarking

**Inference Time Tracking**:
```
Character 1:
- Scenario 1: ___ seconds
- Scenario 2: ___ seconds
- Scenario 3: ___ seconds
- Scenario 4: ___ seconds
- Scenario 5: ___ seconds
Average: ___ seconds (Target: <10 seconds)

Character 2:
- Scenario 1: ___ seconds
- Scenario 2: ___ seconds
- Scenario 3: ___ seconds
- Scenario 4: ___ seconds
- Scenario 5: ___ seconds
Average: ___ seconds (Target: <10 seconds)

Character 3:
- Scenario 1: ___ seconds
- Scenario 2: ___ seconds
- Scenario 3: ___ seconds
- Scenario 4: ___ seconds
- Scenario 5: ___ seconds
Average: ___ seconds (Target: <10 seconds)
```

**API Cost Tracking**:
```
Total generations: 15 (3 characters × 5 scenarios)
Cost per generation: $_____
Total cost: $_____
Target: ~$0.10/generation ($1.50 total)
```

---

## Quality Validation (Day 4)

### CLIP Similarity Scoring

If Fal.ai API provides CLIP scores:
- [ ] Record CLIP score for each generated image
- [ ] Calculate average CLIP score per character
- [ ] Calculate overall average CLIP score
- [ ] Target: >85% (0.85) average

```
Character 1 CLIP Scores:
- Scenario 1: ___
- Scenario 2: ___
- Scenario 3: ___
- Scenario 4: ___
- Scenario 5: ___
Average: ___ (Target: >0.85)

Character 2 CLIP Scores:
- Scenario 1: ___
- Scenario 2: ___
- Scenario 3: ___
- Scenario 4: ___
- Scenario 5: ___
Average: ___ (Target: >0.85)

Character 3 CLIP Scores:
- Scenario 1: ___
- Scenario 2: ___
- Scenario 3: ___
- Scenario 4: ___
- Scenario 5: ___
Average: ___ (Target: >0.85)

Overall Average: ___ (Target: >0.85)
```

### Human Evaluation

Recruit 5+ reviewers (filmmakers, designers, or team members):

**Evaluation Protocol**:
1. Show 5 generated images for Character 1 (mixed order, no labels)
2. Ask: "Are these images of the same person?" (Yes/No)
3. Record responses
4. Repeat for Characters 2 and 3

**Results Tracking**:
```
Character 1:
- Reviewer 1: Yes/No
- Reviewer 2: Yes/No
- Reviewer 3: Yes/No
- Reviewer 4: Yes/No
- Reviewer 5: Yes/No
Recognition Rate: ___% (Target: >90%)

Character 2:
- Reviewer 1: Yes/No
- Reviewer 2: Yes/No
- Reviewer 3: Yes/No
- Reviewer 4: Yes/No
- Reviewer 5: Yes/No
Recognition Rate: ___% (Target: >90%)

Character 3:
- Reviewer 1: Yes/No
- Reviewer 2: Yes/No
- Reviewer 3: Yes/No
- Reviewer 4: Yes/No
- Reviewer 5: Yes/No
Recognition Rate: ___% (Target: >90%)

Overall Recognition Rate: ___% (Target: >90%)
```

### Visual Comparison Gallery

Create side-by-side comparison images:
- [ ] Character 1: Reference (5 images) vs. Generated (5 images)
- [ ] Character 2: Reference (5 images) vs. Generated (5 images)
- [ ] Character 3: Reference (5 images) vs. Generated (5 images)
- [ ] Export as PDF or PowerPoint for stakeholder review

---

## Documentation (Day 5)

### PoC Results Report

Create document: `docs/POC_RESULTS_EPIC2_CHARACTER_IDENTITY.md`

**Report Structure**:
1. **Executive Summary**
   - Technology evaluated: Fal.ai Instant Character
   - Test scope: 3 characters, 5 scenarios each (15 total generations)
   - Recommendation: Proceed with implementation (Yes/No)

2. **Performance Benchmarks**
   - Average inference time: ___ seconds (Target: <10s)
   - API cost per generation: $___ (Target: ~$0.10)
   - Total PoC cost: $___

3. **Quality Validation Results**
   - Average CLIP similarity: ___% (Target: >85%)
   - Human recognition rate: ___% (Target: >90%)
   - Visual consistency rating: ___/10

4. **Visual Comparison Gallery**
   - Include side-by-side images
   - Highlight best and worst examples
   - Annotate with similarity scores

5. **Risk Assessment**
   - Technical risks identified during PoC
   - Mitigation strategies
   - Confidence level for production implementation

6. **Cost Projections**
   - Development cost: ___ hours × $___/hour
   - Operational cost at 100 characters/month: $___
   - Operational cost at 1,000 characters/month: $___
   - Operational cost at 10,000 characters/month: $___

7. **Recommendation**
   - [ ] PROCEED: All targets met, ready for implementation
   - [ ] PROCEED WITH CAUTION: Some concerns, but acceptable
   - [ ] DO NOT PROCEED: Targets not met, explore alternatives

8. **Next Steps**
   - Stakeholder review meeting date: ___
   - Decision deadline: ___
   - Development start date (if approved): ___

---

## Stakeholder Sign-Off

**Reviewers**:
- [ ] Product Manager: _______ (Name) - Approved/Rejected - Date: ___
- [ ] Engineering Lead: _______ (Name) - Approved/Rejected - Date: ___
- [ ] QA Lead: _______ (Name) - Approved/Rejected - Date: ___

**Decision**:
- [ ] **APPROVED**: Proceed with Epic 2 implementation
- [ ] **REJECTED**: Explore alternative technologies

**Approval Date**: ___________

**Signature**: _______________________

---

## Exit Criteria

PoC is complete when:
- [ ] All 15 test images generated successfully
- [ ] Performance benchmarks documented
- [ ] Quality validation completed (CLIP + human eval)
- [ ] Visual comparison gallery created
- [ ] PoC results report written
- [ ] Stakeholder sign-off obtained

**If Approved**:
→ Proceed to Phase 2 (Development with James - Dev Agent)

**If Rejected**:
→ Explore alternative technologies (IPAdapter, ComfyUI workflows, etc.)

---

**END OF PoC VALIDATION CHECKLIST**
