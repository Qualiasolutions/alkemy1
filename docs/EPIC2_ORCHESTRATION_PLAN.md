# Epic 2: Character Identity System - BMad Agent Orchestration Plan

**Version**: 1.0
**Date**: 2025-11-11
**Status**: Ready for Execution
**Orchestrator**: BMad Master Orchestrator

---

## Orchestration Overview

This document coordinates all BMad agents, tools, and MCPs to implement Epic 2 (Character Identity Consistency System) from start to production deployment.

**Timeline**: 6 weeks
**Agents Involved**: BMad Orchestrator, James (Dev), Quinn (QA)
**Tools/MCPs**: Playwright MCP, Vercel CLI, Git, Supabase CLI
**Deliverables**: Production-ready character identity system

---

## Agent Coordination Matrix

| Phase | Agent | Command | Input | Output | Duration |
|-------|-------|---------|-------|--------|----------|
| Phase 1 | User | Manual PoC | Test images | PoC results report | 5 days |
| Phase 2a | James (Dev) | `*develop-story` | Story 2.1 | Functional code + tests | 2 weeks |
| Phase 2b | James (Dev) | `*develop-story` | Stories 2.2-2.3 | Functional code + tests | 2 weeks |
| Phase 3a | Quinn (QA) | `*review 2.1` | Story 2.1 code | QA gate file | 1-2 days |
| Phase 3b | Quinn (QA) | `*review 2.2` | Story 2.2 code | QA gate file | 1-2 days |
| Phase 3c | Quinn (QA) | `*review 2.3` | Story 2.3 code | QA gate file | 1-2 days |
| Phase 4 | BMad Orchestrator | Deployment | Approved code | Production deployment | 1 day |

---

## Phase 1: PoC Validation (Week 0)

### Objective
Validate Fal.ai Instant Character API meets >95% visual consistency target before committing development resources.

### Checklist Reference
See: `docs/POC_VALIDATION_EPIC2_CHARACTER_IDENTITY.md`

### Tasks
1. **Setup** (Day 1)
   - Create Fal.ai account
   - Obtain API key
   - Set up test environment (Node.js + Fal.ai SDK)

2. **Test Dataset** (Day 1)
   - Select 3 diverse characters
   - Prepare 5 reference images per character (15 total)
   - Define 5 test scenarios per character

3. **Generation Testing** (Days 2-3)
   - Generate 15 test images (3 characters × 5 scenarios)
   - Measure inference time (target: <10 seconds)
   - Track API costs (target: ~$0.10/generation)

4. **Quality Validation** (Day 4)
   - Run CLIP similarity scores (target: >85%)
   - Human evaluation with 5+ reviewers (target: >90% recognition)
   - Create visual comparison gallery

5. **Documentation** (Day 5)
   - Write PoC results report
   - Include performance benchmarks, quality metrics, cost projections
   - Get stakeholder sign-off

### Exit Criteria
- [ ] All 15 test images generated successfully
- [ ] Visual consistency >95% (CLIP + human eval combined)
- [ ] Inference time <10 seconds average
- [ ] API cost ~$0.10/generation
- [ ] Stakeholder approval obtained

**Decision Point**: If approved → Proceed to Phase 2. If rejected → Explore alternatives.

---

## Phase 2: Development with James (Dev Agent) - Weeks 1-4

### Agent Activation
```
Transform BMad Orchestrator → James (Dev Agent)
Command: *agent dev
```

### Sprint 1: Story 2.1 Implementation (Weeks 1-2)

**Story File**: `docs/stories/epic-2-story-2.1-character-identity-training.md`

**James Command**: `*develop-story`

**Expected Tasks** (James will execute sequentially):

1. **Task 2.1.1: Serverless API Proxy** (2 days, 5 points)
   - Create `api/fal-proxy.ts` Vercel serverless function
   - Implement CORS headers
   - Add Fal.ai API authentication
   - Support actions: `prepare_identity`, `generate_with_identity`
   - Add rate limiting

2. **Task 2.1.2: Character Identity Service Layer** (3 days, 8 points)
   - Create `services/characterIdentityService.ts`
   - Implement `prepareCharacterIdentity()`
   - Implement `getCharacterIdentityStatus()`
   - Implement `deleteCharacterIdentity()`
   - Implement export/import functions
   - Add Supabase Storage integration
   - Add localStorage fallback

3. **Task 2.1.3: Extend Character Type** (1 day, 2 points)
   - Update `types.ts` with `CharacterIdentity` interface
   - Add `identity?: CharacterIdentity` to `Character` interface
   - Ensure backward compatibility

4. **Task 2.1.4: Character Identity UI** (4 days, 10 points)
   - Add identity status badge to character cards
   - Create `CharacterIdentityModal` component
   - Implement drag-drop reference image upload
   - Add image quality validation
   - Implement progress indicators
   - Add error handling UI

5. **Task 2.1.5: Supabase Migration** (1 day, 3 points)
   - Create `supabase/migrations/003_character_identity.sql`
   - Add `character_references` table
   - Create Storage buckets with RLS policies
   - Test migration locally
   - Deploy to production Supabase

**James Workflow**:
1. Read Story 2.1 file completely
2. For each task:
   - Implement task and subtasks
   - Write tests
   - Execute validations
   - Update task checkbox [x] only if ALL tests pass
   - Update File List in story
3. When all tasks complete:
   - Run full regression tests
   - Execute story-dod-checklist
   - Set story status: "Ready for Review"
   - HALT and notify BMad Orchestrator

**Deliverables**:
- Functional character identity preparation workflow
- All acceptance criteria met (AC1-AC8)
- All integration verification passed (IV1-IV3)
- All migration/compatibility verified (MC1-MC3)
- Code reviewed by James
- Status: "Ready for Review"

---

### Sprint 2: Stories 2.2 & 2.3 Implementation (Weeks 3-4)

#### Story 2.2: Character Identity Preview and Testing

**Story File**: `docs/stories/epic-2-story-2.2-character-identity-preview.md`

**James Command**: `*develop-story`

**Expected Tasks**:

1. **Task 2.2.1: Identity Test Generation Service** (2 days, 5 points)
   - Add `testCharacterIdentity()` to service
   - Support test types: portrait, fullbody, profile, lighting, expression
   - Call Fal.ai API with identity ID + test prompt
   - Calculate similarity scores

2. **Task 2.2.2: Identity Test Preview UI** (2 days, 5 points)
   - Add "Test Identity" button to character card
   - Create `CharacterIdentityTestModal` component
   - Add test type selector
   - Display side-by-side comparison
   - Add approve/reject workflow

**Deliverables**:
- Functional identity test generation
- Test preview UI complete
- All acceptance criteria met
- Status: "Ready for Review"

---

#### Story 2.3: Shot Generation Integration

**Story File**: `docs/stories/epic-2-story-2.3-character-identity-integration.md`

**James Command**: `*develop-story`

**Expected Tasks**:

1. **Task 2.3.1: Integrate Identity with Shot Generation** (3 days, 8 points)
   - Extend `generateStillVariants()` in `aiService.ts`
   - Pass `falIdentityId` to Fal.ai API when character has identity
   - Maintain backward compatibility
   - Add identity strength controls
   - Support multi-character shots

2. **Task 2.3.2: SceneAssemblerTab Identity Integration UI** (2 days, 5 points)
   - Add identity status indicators
   - Display "✓ Character identity: John" when active
   - Add identity toggle button
   - Show warnings for characters without identity

3. **Task 2.3.3: Performance Optimization** (2 days, 5 points)
   - Batch identity requests
   - Cache Fal.ai identity IDs
   - Optimize reference image storage
   - Measure performance impact (<15% target)

**Deliverables**:
- Shot generation integrated with identity
- SceneAssemblerTab UI updated
- Performance optimized (<15% overhead)
- All acceptance criteria met
- Status: "Ready for Review"

---

## Phase 3: QA Validation with Quinn (QA Agent) - Week 5

### Agent Activation
```
Transform BMad Orchestrator → Quinn (QA Agent)
Command: *agent qa
```

### QA Review Process

#### Story 2.1 QA Review

**Quinn Command**: `*review 2.1`

**Expected Analysis**:
1. **Requirements Traceability**
   - Map all acceptance criteria (AC1-AC8) to test cases
   - Use Given-When-Then format
   - Identify coverage gaps

2. **Risk Assessment**
   - Probability × Impact matrix
   - Critical risks: API failures, storage quota issues
   - Medium risks: Performance degradation, low-quality images
   - Low risks: Browser compatibility

3. **Integration Verification**
   - IV1: File upload patterns consistent
   - IV2: Character type extended without breaking changes
   - IV3: Progress callbacks follow existing patterns

4. **Migration/Compatibility Testing**
   - MC1: Existing characters can add identity retroactively
   - MC2: Projects without identity still load correctly
   - MC3: Identity is optional per-character

5. **Browser Compatibility**
   - Test on Chrome, Firefox, Safari, Edge
   - Identify browser-specific issues

6. **Performance Validation**
   - Upload time <5 seconds
   - Identity preparation <30 seconds
   - Memory usage <50MB overhead

**Quinn Deliverable**:
- QA gate file: `docs/qa/gates/2.1-character-identity-preparation.yml`
- Gate decision: PASS | CONCERNS | FAIL
- Issue severity ratings
- Test coverage report
- Story file updated (QA Results section only)

**Gate Criteria for PASS**:
- All acceptance criteria met (8/8)
- No CRITICAL or HIGH severity blocking issues
- Performance targets met
- Integration verification passed (3/3)
- Migration/compatibility verified (3/3)

---

#### Story 2.2 QA Review

**Quinn Command**: `*review 2.2`

**Expected Analysis**:
1. Test generation quality validation
2. UI/UX review of test modal
3. Side-by-side comparison accuracy
4. Approve/reject workflow testing

**Quinn Deliverable**:
- QA gate file: `docs/qa/gates/2.2-character-identity-testing.yml`
- Gate decision: PASS | CONCERNS | FAIL

---

#### Story 2.3 QA Review

**Quinn Command**: `*review 2.3`

**Expected Analysis**:
1. Shot generation integration testing
2. Multi-character shot validation
3. Performance impact measurement (<15% target)
4. Backward compatibility verification

**Quinn Deliverable**:
- QA gate file: `docs/qa/gates/2.3-character-identity-integration.yml`
- Gate decision: PASS | CONCERNS | FAIL

---

### QA Gate Aggregation

**BMad Orchestrator Reviews**:
- [ ] Story 2.1 gate: PASS or CONCERNS (approved)
- [ ] Story 2.2 gate: PASS or CONCERNS (approved)
- [ ] Story 2.3 gate: PASS or CONCERNS (approved)

**Overall Epic 2 QA Status**:
- If all PASS → Proceed to Phase 4 (Deployment)
- If CONCERNS → Review with stakeholders, decide to proceed or fix issues
- If any FAIL → James must fix issues, Quinn re-reviews

---

## Phase 4: Production Deployment - Week 6

### Pre-Deployment Checklist

**BMad Orchestrator verifies**:
- [ ] All 3 stories marked "Ready for Review"
- [ ] All QA gates PASS or CONCERNS (with stakeholder approval)
- [ ] No CRITICAL or HIGH severity blocking issues
- [ ] All code merged to `feature/epic-2-character-identity` branch
- [ ] All tests passing (unit, integration, E2E)
- [ ] Documentation updated:
  - [ ] CLAUDE.md (Character Identity Service section)
  - [ ] .env.example (FAL_API_KEY)
  - [ ] USER_GUIDE_CHARACTER_IDENTITY.md created
  - [ ] IMPLEMENTATION_STATUS.md updated
  - [ ] SPRINT_PLAN_V2.0.md updated

---

### Environment Configuration

**Vercel Environment Variables** (configure before deployment):
```bash
# Add FAL_API_KEY to Vercel
vercel env add FAL_API_KEY production

# Verify all environment variables
vercel env ls
```

**Expected Variables**:
- FAL_API_KEY (new)
- GEMINI_API_KEY (existing)
- VITE_SUPABASE_URL (existing)
- VITE_SUPABASE_ANON_KEY (existing)
- All other existing keys

---

### Supabase Migration Deployment

**Deploy database migration**:
```bash
# Connect to production Supabase
supabase link --project-ref <your-project-ref>

# Push migration
supabase db push

# Verify tables created
supabase db remote list
```

**Expected Tables**:
- `character_references` (new)
- All existing tables

**Expected Storage Buckets**:
- `character-references` (new)
- All existing buckets

---

### Build Verification

**Run production build**:
```bash
# Clean build
rm -rf dist node_modules/.vite
npm install
npm run build
```

**Verify**:
- [ ] Build completes successfully (zero errors)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Bundle size check:
  - Main bundle: ~426KB gzip (existing baseline)
  - Additional bundle impact: <100KB gzip (target)
  - Total: <526KB gzip (acceptable)

---

### Deployment Execution

**Option 1: Git Push (Auto-Deploy)**
```bash
# Merge feature branch to main
git checkout main
git merge feature/epic-2-character-identity

# Push to trigger Vercel auto-deploy
git push origin main

# Monitor deployment
vercel logs --follow
```

**Option 2: Vercel CLI (Manual Deploy)**
```bash
# Deploy to production
vercel --prod

# Wait for deployment to complete
# Vercel will provide production URL
```

---

### Post-Deployment Verification

**BMad Orchestrator performs** (or delegates to user):

1. **Smoke Tests** (5 minutes)
   - [ ] Navigate to production URL
   - [ ] Load demo project
   - [ ] Navigate to Cast & Locations Tab
   - [ ] Verify "Prepare Identity" button visible
   - [ ] Click button, verify modal opens
   - [ ] Upload 3 test reference images
   - [ ] Verify upload succeeds (progress indicators)
   - [ ] Wait for identity preparation (~30 seconds)
   - [ ] Verify status changes to "Identity Ready"

2. **Integration Tests** (10 minutes)
   - [ ] Click "Test Identity" button
   - [ ] Generate test variation (portrait)
   - [ ] Verify generated image displays
   - [ ] Navigate to Compositing Tab (SceneAssemblerTab)
   - [ ] Generate shot with character that has identity
   - [ ] Verify identity indicator shows "✓ Character identity: [Name]"
   - [ ] Verify generated shot matches character identity

3. **Storage Tests** (5 minutes)
   - [ ] Verify reference images uploaded to Supabase Storage (check dashboard)
   - [ ] Verify `character_references` table has entry (check Supabase)
   - [ ] Test localStorage fallback (disable Supabase, verify identity still works)

4. **Browser Compatibility** (10 minutes)
   - [ ] Test on Chrome (latest)
   - [ ] Test on Firefox (latest)
   - [ ] Test on Safari (latest)
   - [ ] Test on Edge (latest)

5. **Error Handling** (5 minutes)
   - [ ] Upload invalid image (unsupported format)
   - [ ] Verify error message displays
   - [ ] Simulate API failure (invalid FAL_API_KEY)
   - [ ] Verify graceful error handling

---

### Monitoring (First 24 Hours)

**BMad Orchestrator monitors**:
- [ ] Vercel error rate (target: <1%)
- [ ] Fal.ai API success rate (target: >95%)
- [ ] Supabase Storage upload success rate (target: >99%)
- [ ] User adoption (% of characters with identity prepared)
- [ ] Performance metrics (identity preparation time, shot generation overhead)

**Alert Thresholds**:
- Error rate >5% → Investigate immediately
- API success rate <90% → Check Fal.ai service status
- Performance degradation >20% → Review optimization

---

### Rollback Plan

**If Critical Issues Detected**:

**Option 1: Vercel Rollback (Instant)**
```bash
# Revert to previous deployment
vercel rollback

# Monitor for recovery
vercel logs --follow
```

**Option 2: Git Revert (Controlled)**
```bash
# Revert commits
git revert HEAD~N  # N = number of commits since Epic 2 merge

# Push to trigger redeploy
git push origin main
```

**Option 3: Feature Flag Disable (Partial)**
```bash
# Add environment variable to disable feature
vercel env add ENABLE_CHARACTER_IDENTITY false production

# Redeploy
vercel --prod
```

**Rollback Decision Matrix**:
- CRITICAL bugs (app crashes, data loss) → Immediate rollback (Option 1)
- HIGH severity bugs (feature broken) → Git revert (Option 2)
- MEDIUM severity bugs (degraded experience) → Feature flag disable (Option 3)
- LOW severity bugs → Fix forward, no rollback needed

---

## Phase 5: Post-Deployment (Week 6+)

### Documentation Finalization

**BMad Orchestrator creates**:
- [ ] `docs/EPIC2_DEPLOYMENT_REPORT.md`
  - Feature summary
  - QA gate results (link to gate files)
  - Performance benchmarks (actual vs. target)
  - Known issues (if any)
  - Cost analysis (actual vs. projected)
  - User adoption metrics (after 1 week)

### Stakeholder Communication

**BMad Orchestrator announces**:
- Epic 2 completion to team
- Share deployment report
- Schedule demo session (optional)

### User Adoption Tracking (Week 7)

**BMad Orchestrator monitors**:
- % of projects using character identity (target: >50% within 1 month)
- % of characters with identity prepared (target: >80% in enabled projects)
- Visual consistency rating from user feedback (target: >9/10)
- API cost per project (target: within 20% of $0.10/generation projection)

---

## Success Criteria (Final Validation)

**Epic 2 is considered successful when**:
- [x] All 3 stories (2.1, 2.2, 2.3) completed and deployed
- [x] All QA gates PASS or CONCERNS (approved)
- [x] Visual consistency >95% (validated in PoC + production)
- [x] Identity preparation <30 seconds average
- [x] Shot generation overhead <15%
- [x] Zero CRITICAL bugs in production (first week)
- [x] User satisfaction >8/10 (post-deployment survey)
- [x] API cost ~$0.10/generation (within 20% variance)

---

## Agent Hand-Off Protocol

### BMad Orchestrator → James (Dev)
```
Command: *agent dev
Context: Story file path, acceptance criteria, technical design
James reads: Story file + devLoadAlwaysFiles from core-config.yaml
James executes: *develop-story command
James halts: When story status = "Ready for Review"
BMad resumes: Review James's work, proceed to QA
```

### BMad Orchestrator → Quinn (QA)
```
Command: *agent qa
Context: Story file path, code changes, test results
Quinn reads: Story file + QA gate template
Quinn executes: *review {story} command
Quinn halts: When QA gate file created
BMad resumes: Review Quinn's gate decision, proceed or iterate
```

### BMad Orchestrator → User
```
Context: Deployment verification, monitoring, stakeholder communication
User actions: Manual smoke tests, stakeholder approval, production monitoring
BMad resumes: After user confirms deployment successful
```

---

## Risk Mitigation Strategy

| Risk | Mitigation | Owner | Status |
|------|-----------|-------|--------|
| PoC fails to meet targets | Explore alternatives (IPAdapter, ComfyUI) | User | Phase 1 |
| Fal.ai API reliability issues | Retry logic + fallback to standard generation | James | Phase 2 |
| Performance degradation >15% | Batch requests, caching, optimization | James | Phase 2 |
| QA gate FAIL | James fixes issues, Quinn re-reviews | James + Quinn | Phase 3 |
| Production deployment fails | Rollback plan ready, Vercel CLI tested | BMad | Phase 4 |
| User adoption <50% | Director Agent suggestions, onboarding tooltips | Future |

---

## Next Steps After Epic 2

### Immediate (Week 7)
1. Monitor production metrics
2. Gather user feedback
3. Address any post-deployment issues

### Sprint 3 (Weeks 7-8)
4. Complete Epic 6 Stories 6.3-6.4 (Analytics Dashboard)

### Sprint 4-5 (Weeks 9-12)
5. Begin Epic 5 (Music, Sound & Audio) - Epic R3b complete
6. Complete Epic 1 Story 1.2 (Voice Output/TTS)

### V2.0 Release
7. Integration testing (Epic 8.1)
8. V2.0 production launch

---

## Appendix: Command Reference

### BMad Orchestrator Commands
```bash
# Agent transformation
*agent dev        # Transform to James (Dev Agent)
*agent qa         # Transform to Quinn (QA Agent)
*exit             # Return to BMad Orchestrator

# Status checking
*status           # Show current context and progress
*plan-status      # Show workflow plan progress
```

### James (Dev Agent) Commands
```bash
*develop-story    # Execute story implementation workflow
*run-tests        # Run linting and tests
*review-qa        # Apply QA feedback and fixes
*exit             # Return to BMad Orchestrator
```

### Quinn (QA Agent) Commands
```bash
*review {story}   # Comprehensive story review + gate creation
*gate {story}     # Create QA gate decision file
*test-design {story}  # Create test scenarios
*exit             # Return to BMad Orchestrator
```

### Vercel CLI Commands
```bash
vercel --prod            # Deploy to production
vercel env add           # Add environment variable
vercel env ls            # List environment variables
vercel logs --follow     # Monitor deployment logs
vercel rollback          # Rollback to previous deployment
```

### Supabase CLI Commands
```bash
supabase link            # Connect to production project
supabase db push         # Deploy migration
supabase db remote list  # List remote tables
```

---

**END OF ORCHESTRATION PLAN**

*This plan is ready for execution. Begin with Phase 1 (PoC Validation) and follow the orchestration sequence.*
