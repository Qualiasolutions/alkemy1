# Story 2.2: Character Identity Preview and Testing

**Epic**: Epic 2 - Character Identity Consistency System  
**PRD Reference**: Section 6, Epic 2, Story 2.2  
**Status**: Not Started  
**Priority**: High (V2.0 Core Feature)  
**Estimated Effort**: 6 story points  
**Dependencies**: Story 2.1 (Character Identity Training) - must complete before testing  
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,  
**I want to** test character appearance variations before committing to production,  
**So that** I can ensure quality meets expectations.

---

## Business Value

Character identity testing enables quality validation, early problem detection, iterative refinement, and confidence building before full production commitment.

**Success Metric**: >95% visual similarity across test variations; filmmakers approve identity after ≤3 iterations.

---

## Key Acceptance Criteria

1. **Test Panel UI**: Test variation selector (Close-Up, Wide Shot, Profile, Low-Light, Expression)
2. **Test Generation**: Individual + batch testing with progress tracking
3. **Comparison View**: Side-by-side with CLIP/pHash similarity scores (target >85%)
4. **Test History**: Chronological tracking with iteration comparison
5. **Approval Workflow**: Approve, reject/reconfigure, adjust settings
6. **Bulk Testing**: Test all characters at once

---

## Technical Implementation

**Service Functions** (`services/characterIdentityService.ts`):
- `testCharacterIdentity()` - Generate test variation
- `calculateSimilarity()` - CLIP + pHash similarity scoring
- `generateAllTests()` - Batch generate 5 variations
- `approveCharacterIdentity()` - Mark production-ready
- `bulkTestCharacters()` - Test multiple characters

**Similarity Calculation**:
- Primary: CLIP embeddings (Gemini Vision API or Replicate)
- Fallback: Perceptual hash (browser-based, `imghash` library)
- Combined score: `(CLIP * 0.7) + (pHash * 0.3)`

**Data Storage**:
- Supabase: `character_identity_tests` table
- localStorage: `character.identity.tests` array

---

## Definition of Done

- Test panel with 5 variation types
- Similarity scoring (CLIP + pHash)
- Approval workflow functional
- Test history tracking
- Bulk testing for multiple characters
- Integration with Story 2.1 and 2.3
- UAT with 5+ filmmakers (>95% similarity, ≤3 iterations)

---

**Full AC details, types, and implementation notes available in comprehensive story document.**

