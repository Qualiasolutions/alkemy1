# BMAD Agent Guide - Alkemy AI Studio

## Overview

This guide helps any BMAD agent (PM, Dev, QA, Architect, etc.) maintain and track project status through automated documentation synchronization. The system ensures documentation never drifts from implementation reality.

## Quick Start Commands

```bash
# Essential BMAD commands
npm run bmad:sync       # Sync markdown files ↔ database
npm run bmad:status     # Show current project status
npm run bmad:validate   # Check for documentation drift
npm run bmad:report     # Generate status reports

# Development workflow
npm test                # Run tests (auto-updates AC status)
git commit -m "[STORY-1.1] feat: implement feature"  # Auto-tracks story
```

## System Architecture

The BMAD tracking system consists of:

1. **Supabase Database**: Single source of truth for all status tracking
2. **Markdown Files**: Human-readable documentation with frontmatter metadata
3. **Sync Scripts**: Bi-directional synchronization between files and database
4. **Frontend Dashboard**: Real-time status visualization (BMAD Status tab)
5. **Git Hooks**: Automatic sync on commits
6. **CI/CD Integration**: Automated validation and reporting

## Working with Stories

### 1. Creating a New Story

When starting a new story, create the markdown file with proper frontmatter:

```markdown
---
epic: EPIC-3
story: STORY-3.1
status: draft
progress: 0
assignee: null
dependencies: []
auto_sync: true
---

# Story 3.1: Gaussian Splatting Viewer

## User Story
As a **director**,
I want to **view 3D gaussian splatting scenes**,
so that **I can explore dynamic 3D environments**.

## Acceptance Criteria
- [ ] **AC1**: WebGL viewer initialized successfully
- [ ] **AC2**: Gaussian splatting files load correctly
- [ ] **AC3**: Camera controls work smoothly
- [ ] **AC4**: Performance stays above 30 FPS

## Integration Verification
- [ ] **IV1**: Integrates with existing 3D tab
- [ ] **IV2**: Supabase storage for .ply files works

## Migration/Compatibility
- [ ] **MC1**: No database changes required
```

After creating the file:
```bash
npm run bmad:sync  # Register story in database
```

### 2. Updating Story Progress

#### Marking Acceptance Criteria Complete

Edit the story file:
```markdown
## Acceptance Criteria
- [x] **AC1**: WebGL viewer initialized successfully  ✅
- [x] **AC2**: Gaussian splatting files load correctly ✅
- [ ] **AC3**: Camera controls work smoothly
- [ ] **AC4**: Performance stays above 30 FPS
```

Then sync:
```bash
npm run bmad:sync
```

#### Updating Story Status

Update the frontmatter:
```yaml
---
status: in_progress  # draft | ready | in_progress | review | complete | blocked
progress: 50         # Percentage complete (auto-calculated from AC)
---
```

### 3. Completing a Story

When all acceptance criteria pass:
```yaml
---
status: complete
progress: 100
---
```

```bash
npm run bmad:sync
git commit -m "feat(STORY-3.1): complete gaussian splatting viewer"
```

## Automated Status Triggers

The system automatically updates status based on:

### Test Results → Acceptance Criteria
```javascript
// Test file: epic-3-story-3.1.test.ts
describe('Story 3.1: Gaussian Splatting', () => {
  it('AC1: WebGL viewer initializes', () => {
    // Test passes → AC1 status = 'passed'
  });
});
```

Run tests with status update:
```bash
npm run test:update-status
```

### Commit Messages → Story Status
```bash
# These patterns auto-update story status:
git commit -m "[STORY-3.1] wip: initial implementation"     # → in_progress
git commit -m "fix(STORY-3.1): resolve rendering issue"    # → in_progress
git commit -m "feat(STORY-3.1): complete"                  # → complete
```

### File Creation → Integration Verification
When you create expected files, IVs auto-verify:
- Create `components/GaussianViewer.tsx` → IV1 passes
- Create `supabase/storage/ply/` → IV2 passes

## Epic Management

### Viewing Epic Status
```bash
npm run bmad:status epic-3    # Show specific epic
npm run bmad:status           # Show all epics
```

### Epic Progress Auto-Calculation
Epic progress automatically updates based on story completion:
- 0/5 stories complete = 0%
- 3/5 stories complete = 60%
- 5/5 stories complete = 100% → Epic status = 'complete'

## Sprint Management

### Current Sprint Operations
```bash
# View current sprint status
npm run bmad:status sprint

# Add story to sprint (edit sprint_stories table)
# Sprint velocity auto-calculates from completed points
```

## Quality Gates

### Pre-Commit Validation
```bash
# Automatic on commit:
1. Validate frontmatter format
2. Check for AC/IV/MC consistency
3. Sync to database
4. Update master status document
```

### Pull Request Checks
```yaml
# .github/workflows/bmad-sync.yml runs:
1. Validate no drift between docs and database
2. Check all tests pass for claimed AC
3. Generate status report comment
4. Block merge if validation fails
```

## Dashboard Access

### Frontend Dashboard
1. Navigate to **Production → BMAD Status** tab
2. View real-time epic/story/AC progress
3. Click stories for detailed status
4. Updates live via Supabase subscriptions

### Command Line Status
```bash
# Quick status check
npm run bmad:status

# Detailed report
npm run bmad:report

# View master document
cat docs/BMAD_STATUS.md
```

## Common Workflows

### Daily Standup Check
```bash
# Morning status check
npm run bmad:status
npm run bmad:validate

# See what changed yesterday
git log --since="1 day ago" --grep="STORY-" --oneline
```

### Starting Work on a Story
```bash
# 1. Check story status
npm run bmad:status story-3.2

# 2. Update status to in_progress
# Edit: docs/stories/epic-3-story-3.2.md
# Set: status: in_progress

# 3. Sync to database
npm run bmad:sync

# 4. Create feature branch
git checkout -b feature/story-3.2-camera-animation
```

### Completing Acceptance Criteria
```bash
# 1. Write test for AC
# 2. Run test to verify
npm test epic-3-story-3.2.test.ts

# 3. Update story file (mark AC complete)
# 4. Sync changes
npm run bmad:sync

# 5. Commit with reference
git commit -m "test(STORY-3.2): AC1 - camera path animation works"
```

### Blocked Story Handling
```yaml
# Update frontmatter
---
status: blocked
---
```

Add explanation in story:
```markdown
## Blockers
- **BLOCKER**: Waiting for 3D asset pipeline (STORY-3.4)
- **Impact**: Cannot test with real assets
- **Workaround**: Using placeholder .ply files
```

### Epic Completion Ceremony
```bash
# 1. Verify all stories complete
npm run bmad:status epic-3

# 2. Run integration tests
npm test epic-3

# 3. Generate epic report
npm run bmad:report epic-3 > docs/epics/epic-3-completion.md

# 4. Create completion commit
git commit -m "epic(EPIC-3): complete 3D worlds implementation"
```

## Troubleshooting

### Drift Detection
```bash
# Check for drift
npm run bmad:validate

# Common fixes:
- Run 'npm run bmad:sync' to sync files to database
- Check frontmatter format in story files
- Ensure auto_sync: true in frontmatter
```

### Missing Stories in Database
```bash
# Force sync all stories
npm run bmad:sync

# Check specific story
grep -r "STORY-3.1" docs/stories/
```

### Status Not Updating
1. Check frontmatter has required fields
2. Verify auto_sync is not false
3. Run manual sync: `npm run bmad:sync`
4. Check Supabase connection

### Test Results Not Syncing
```bash
# Ensure test naming convention
# File: epic-{n}-story-{n}.{n}.test.ts
# Test: it('AC{n}: description', ...)

npm run test:update-status
```

## Best Practices

### 1. Consistent Naming
- Epics: `EPIC-{number}` (e.g., EPIC-3)
- Stories: `STORY-{epic}.{story}` (e.g., STORY-3.1)
- Files: `epic-{n}-story-{n}.{n}.md`
- Tests: `epic-{n}-story-{n}.{n}.test.ts`

### 2. Frontmatter Discipline
Always include:
```yaml
epic: EPIC-{n}
story: STORY-{n}.{n}
status: {current_status}
progress: {0-100}
auto_sync: true
```

### 3. Commit Message Format
```bash
type(STORY-X.Y): description

# Examples:
feat(STORY-3.1): add WebGL viewer component
fix(STORY-3.1): resolve memory leak in renderer
test(STORY-3.1): add AC2 gaussian loading tests
docs(STORY-3.1): update integration notes
```

### 4. Regular Sync Points
- After updating any story file
- Before starting work (pull latest)
- After completing AC or IV
- Before creating PR
- After merge to main

### 5. Dashboard Monitoring
- Check dashboard daily for blocked items
- Review sprint progress weekly
- Validate epic progress before planning

## Advanced Features

### Custom Status Triggers
Add to `status_triggers` table:
```sql
INSERT INTO status_triggers (trigger_type, entity_type, pattern, target_status)
VALUES ('file_created', 'acceptance_criterion', 'components/.*\\.test\\.tsx', 'in_progress');
```

### Bulk Status Updates
```typescript
// scripts/bulk-update.ts
import { supabase } from './supabase-client';

await supabase
  .from('stories')
  .update({ status: 'ready' })
  .eq('epic_id', epicId)
  .is('status', 'draft');
```

### Report Customization
Edit `scripts/generate-bmad-reports.ts` to add custom sections:
- Velocity trends
- Blocker analysis
- Tech debt tracking
- Team performance

## Integration with BMAD Agents

### PM Agent
```bash
*bmad-status         # View current status
*bmad-plan-sprint    # Plan next sprint
*bmad-report         # Generate reports
```

### Dev Agent
```bash
*bmad-next-story     # Get next ready story
*bmad-update-ac      # Update acceptance criteria
*bmad-complete       # Mark story complete
```

### QA Agent
```bash
*bmad-test-status    # View test coverage
*bmad-verify-ac      # Verify acceptance criteria
*bmad-integration    # Check integration points
```

### Architect Agent
```bash
*bmad-epic-design    # Design epic architecture
*bmad-review-story   # Review story implementation
*bmad-tech-debt      # Track technical debt
```

## Continuous Improvement

### Weekly Retrospective
1. Review drift report: `npm run bmad:validate`
2. Check incomplete stories aging
3. Update estimates based on velocity
4. Identify process improvements

### Monthly Metrics Review
- Epic completion rate
- Story cycle time
- AC pass rate
- Blocker frequency
- Team velocity trends

### Quarterly Planning
- Review epic dependencies
- Adjust roadmap based on velocity
- Update story templates
- Refine estimation process

---

## Quick Reference Card

```bash
# Daily Commands
npm run bmad:sync       # Sync files ↔ database
npm run bmad:status     # Show status
npm run bmad:validate   # Check drift

# Story Workflow
1. Create story file with frontmatter
2. npm run bmad:sync
3. Update status as you work
4. Mark AC complete when done
5. npm run bmad:sync
6. Commit with [STORY-X.Y] reference

# Status Values
Epic:  not_started | in_progress | complete | blocked | deferred
Story: draft | ready | in_progress | review | complete | blocked | deferred
AC:    pending | in_progress | passed | failed | blocked

# File Patterns
docs/stories/epic-{n}-story-{n}.{n}.md
tests/epic-{n}-story-{n}.{n}.test.ts
src/features/epic-{n}/story-{n}.{n}/

# Commit Patterns
[STORY-X.Y] message    → in_progress
feat(STORY-X.Y): complete → complete
fix(STORY-X.Y): ...    → in_progress
```

---

**Last Updated**: 2025-01-17
**Version**: 1.0.0
**Maintained By**: BMAD Team