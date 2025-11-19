# BMAD Agent Specification - Alkemy AI Studio

**Version**: 2.0.0
**Last Updated**: 2025-01-19
**Project**: Alkemy AI Studio V2.0 Production
**Production URL**: https://alkemy1-q9ayq39cj-qualiasolutionscy.vercel.app

## Executive Summary

This document defines the BMAD (Build, Measure, Analyze, Deploy) agent framework for Alkemy AI Studio, a fully-optimized AI-powered film generation platform. The BMAD system provides automated project tracking, real-time status synchronization, and quality metrics monitoring across the entire development lifecycle.

## System Architecture

### Core Components

1. **Supabase Database** - Single source of truth for all project tracking
2. **Markdown Documentation** - Human-readable project documentation with frontmatter
3. **Sync Engine** - Bi-directional synchronization between files and database
4. **Frontend Dashboard** - Real-time status visualization (BMAD Status tab)
5. **Automation Layer** - Git hooks, CI/CD integration, and automated triggers
6. **Analytics Engine** - Performance metrics, quality tracking, cost analysis

### Technology Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Supabase (PostgreSQL, RLS policies, Storage, Auth)
- **AI Services**: Google Gemini, Fal.ai (Flux, LoRA, HunyuanWorld), Veo 3.1
- **Build**: Vite 6.4.1 with code splitting (164KB gzipped)
- **Deployment**: Vercel with environment variable management
- **Testing**: Vitest with 93% pass rate (77/83 tests)

## Database Schema

### Tables Overview

#### 1. `epics`
Primary project phases with high-level goals.

```sql
CREATE TABLE epics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epic_id TEXT UNIQUE NOT NULL,           -- EPIC-1, EPIC-2, etc.
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,                    -- not_started | in_progress | complete | blocked | deferred
  progress INTEGER DEFAULT 0,              -- 0-100 percentage
  target_date DATE,
  dependencies TEXT[],                     -- Array of dependent epic IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `stories`
Individual user stories within epics.

```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT UNIQUE NOT NULL,          -- STORY-1.1, STORY-2.3, etc.
  epic_id UUID REFERENCES epics(id),
  title TEXT NOT NULL,
  user_story TEXT,                         -- As a [X], I want [Y], so that [Z]
  status TEXT NOT NULL,                    -- draft | ready | in_progress | review | complete | blocked
  progress INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium',          -- low | medium | high | critical
  points INTEGER,                          -- Story points for velocity
  assignee TEXT,
  dependencies TEXT[],
  file_path TEXT,                          -- docs/stories/epic-X-story-X.Y.md
  auto_sync BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `acceptance_criteria`
Testable conditions for story completion.

```sql
CREATE TABLE acceptance_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  criteria_id TEXT NOT NULL,              -- AC1, AC2, etc.
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',          -- pending | in_progress | passed | failed | blocked
  test_file TEXT,                         -- Path to test file
  test_name TEXT,                         -- Name of test case
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, criteria_id)
);
```

#### 4. `integration_verification`
Cross-component integration checks.

```sql
CREATE TABLE integration_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  verification_id TEXT NOT NULL,          -- IV1, IV2, etc.
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  verification_type TEXT,                 -- file_exists | api_endpoint | database_migration
  expected_value TEXT,
  actual_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, verification_id)
);
```

#### 5. `sprints`
Sprint planning and tracking.

```sql
CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_number INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goal TEXT,
  status TEXT DEFAULT 'planned',          -- planned | active | complete | cancelled
  total_points INTEGER DEFAULT 0,
  completed_points INTEGER DEFAULT 0,
  velocity NUMERIC(5,2),                  -- Points per day
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. `sprint_stories`
Many-to-many relationship between sprints and stories.

```sql
CREATE TABLE sprint_stories (
  sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (sprint_id, story_id)
);
```

#### 7. `status_triggers`
Automated status update rules.

```sql
CREATE TABLE status_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL,             -- file_created | test_passed | commit_pattern
  entity_type TEXT NOT NULL,              -- epic | story | acceptance_criterion
  pattern TEXT NOT NULL,                  -- Regex or glob pattern
  target_status TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Epic & Story Structure

### Epic Lifecycle

```
not_started → in_progress → complete
                ↓
             blocked → in_progress
                ↓
             deferred
```

### Story Lifecycle

```
draft → ready → in_progress → review → complete
                    ↓
                 blocked → in_progress
                    ↓
                 deferred
```

### Current Epics

| Epic ID | Title | Status | Progress | Target Date |
|---------|-------|--------|----------|-------------|
| EPIC-1 | Director Voice Enhancement | ✅ Complete | 100% | Done (Nov 2024) |
| EPIC-2 | Character Identity Consistency | ✅ Complete | 100% | Done (Nov 2024) |
| EPIC-6 | Analytics & Quality Metrics | 🟡 In Progress | 50% | Feb 10, 2025 |
| EPIC-3 | 3D Worlds & Gaussian Splatting | ⏳ Not Started | 0% | Mar 24, 2025 |
| EPIC-4 | Voice Acting & Dialogue | ⏳ Not Started | 0% | Apr 17, 2025 |
| EPIC-5 | Audio Production | ⏳ Not Started | 0% | Q2 2025 |
| EPIC-7a | Timeline Editing Interface | ⏳ Not Started | 0% | Q2 2025 |
| EPIC-8 | Export & Delivery | ⏳ Not Started | 0% | Q2 2025 |

## Completed Features (EPIC-1 & EPIC-2)

### EPIC-1: Director Voice Enhancement ✅

**Delivered Features**:
- ✅ Voice input integration with speech recognition
- ✅ Voice response system with text-to-speech
- ✅ Director style learning with pattern tracking
- ✅ Continuity checking across scenes
- ✅ AI cinematography suggestions

**Technical Implementation**:
- DirectorWidget component with voice I/O
- askTheDirector() AI service function
- Style pattern tracking in Supabase
- Voice command processing pipeline

### EPIC-2: Character Identity Consistency ✅

**Delivered Features**:
- ✅ LoRA training interface with Fal.ai integration
- ✅ Identity testing framework with CLIP similarity
- ✅ Generation integration with automatic character injection
- ✅ 90-98% visual consistency achieved

**Technical Implementation**:
- CharacterIdentityService with Fal.ai API
- CharacterIdentityModal UI component
- CLIP + pHash testing (93% accuracy)
- LoRA weight storage in character metadata
- Visual status indicators: "Identity", "Training", "Error", "No ID"

**Key Achievement**: Character consistency from 50-60% to 90-98% through LoRA fine-tuning.

## Current Work (EPIC-6)

### EPIC-6: Analytics & Quality Metrics (50% Complete)

**Completed Stories**:
- ✅ STORY-6.1: Creative Quality Analysis

**In Progress**:
- 🔄 STORY-6.2: Technical Performance Analytics (50%)
  - ✅ AC1: Track API call counts
  - ✅ AC2: Calculate cost per API usage
  - ✅ AC3: Measure generation time
  - 🔄 AC4: Store metrics in Supabase
  - ⏳ AC5: Real-time metrics updates
  - ⏳ AC6: Historical retention

**Pending**:
- ⏳ STORY-6.3: Analytics Dashboard UI
- ⏳ STORY-6.4: Export Analytics Reports

## File Structure & Conventions

### Directory Layout

```
alkemy/
├── docs/
│   ├── stories/                      # Story documentation
│   │   ├── epic-1-story-1.1.md
│   │   ├── epic-2-story-2.1.md
│   │   └── epic-6-story-6.2.md
│   ├── sprints/                      # Sprint planning
│   │   ├── SPRINT_CURRENT.md
│   │   └── sprint-4-retrospective.md
│   ├── BMAD_AGENT_GUIDE.md          # Agent workflow guide
│   ├── BMAD_STATUS.md               # Auto-generated status
│   └── PROJECT_ROADMAP_CURRENT.md   # 90-day roadmap
├── tests/
│   ├── epic-1-story-1.1.test.ts
│   └── epic-6-story-6.2.test.ts
├── src/
│   ├── services/
│   │   ├── aiService.ts             # AI model integrations
│   │   ├── characterIdentityService.ts
│   │   ├── supabase.ts
│   │   └── usageService.ts          # Analytics tracking
│   ├── tabs/
│   │   ├── BMADStatusTab.tsx        # Live dashboard
│   │   ├── AnalyticsTab.tsx
│   │   └── ...
│   └── components/
│       ├── DirectorWidget.tsx
│       ├── CharacterIdentityModal.tsx
│       └── ...
└── supabase/
    └── migrations/
        └── 20250119_bmad_tracking.sql
```

### Naming Conventions

**Epics**: `EPIC-{number}` (e.g., EPIC-3)
**Stories**: `STORY-{epic}.{story}` (e.g., STORY-3.1)
**Files**: `epic-{n}-story-{n}.{n}.md`
**Tests**: `epic-{n}-story-{n}.{n}.test.ts`
**Commits**: `type(STORY-X.Y): description`

## Automation & Sync System

### Markdown Frontmatter Format

```yaml
---
epic: EPIC-3
story: STORY-3.1
status: in_progress
progress: 40
assignee: dev-team
dependencies: []
auto_sync: true
---
```

### Sync Triggers

1. **Manual Sync**: `npm run bmad:sync`
2. **Git Commit Hook**: Pre-commit automatic sync
3. **CI/CD Pipeline**: On PR creation/merge
4. **File Watch**: Development mode auto-sync (optional)

### Status Update Triggers

| Trigger Type | Pattern | Action |
|-------------|---------|--------|
| Test Pass | `AC1: description` in test | Set AC status = 'passed' |
| Commit Message | `[STORY-X.Y]` or `feat(STORY-X.Y):` | Set story status = 'in_progress' |
| File Created | Matches expected integration file | Set IV status = 'passed' |
| Markdown Update | Frontmatter change | Sync to database immediately |

## Quality Metrics

### Current Status (as of 2025-01-19)

**Test Coverage**: 93% pass rate (77/83 tests passing)
**Bundle Size**: 164KB gzipped (optimized from 426KB)
**Build Time**: ~12 seconds
**TypeScript Errors**: 0
**Security**: AES-256-GCM encryption for API keys

### Performance Targets

- Dashboard Load: <2s
- Sync Operation: <5s
- Status Update: <1s
- AI Generation: Variable (API-dependent)
  - Script Analysis: 5-15s
  - Image Generation: 10-30s
  - Video Animation: 60-120s
  - LoRA Training: 300-600s

### Code Quality Standards

- TypeScript strict mode enabled
- No `any` types except where absolutely necessary
- Functional components with hooks (no class components)
- All service functions throw typed errors
- JSDoc for public APIs

## Commands Reference

### Essential BMAD Commands

```bash
# Status & Reporting
npm run bmad:status       # Show current project status
npm run bmad:validate     # Check for documentation drift
npm run bmad:report       # Generate status reports
npm run bmad:sync         # Sync markdown ↔ database

# Database Operations
npx supabase db push      # Apply migrations (one-time setup)
npm run bmad:init         # Initialize database data

# Development
npm run dev               # Start dev server (port 3000)
npm test                  # Run tests with Vitest
npm run test:coverage     # Generate coverage reports
npm run build             # Production build
vercel --prod             # Deploy to production

# Deployment
vercel --prod             # Deploy to Vercel production
vercel logs <url>         # View deployment logs
vercel env pull           # Pull environment variables
```

### Git Commit Patterns

```bash
# Automatic story tracking
git commit -m "[STORY-X.Y] wip: initial implementation"
git commit -m "feat(STORY-X.Y): add new feature"
git commit -m "fix(STORY-X.Y): resolve bug"
git commit -m "test(STORY-X.Y): add AC tests"
git commit -m "docs(STORY-X.Y): update integration notes"

# Epic completion
git commit -m "epic(EPIC-X): complete implementation"
```

## Agent Workflows

### PM Agent Workflow

```bash
# Daily standup
1. npm run bmad:status
2. Review blocked items
3. Update sprint progress
4. Plan next stories

# Sprint planning
1. npm run bmad:status sprint
2. Review velocity trends
3. Assign story points
4. Update sprint goals
```

### Dev Agent Workflow

```bash
# Starting new story
1. npm run bmad:status story-X.Y
2. Update frontmatter: status: in_progress
3. npm run bmad:sync
4. git checkout -b feature/story-X.Y
5. Implement feature
6. Mark ACs complete as you go
7. npm run bmad:sync

# Completing story
1. All tests pass
2. Update frontmatter: status: complete, progress: 100
3. npm run bmad:sync
4. git commit -m "feat(STORY-X.Y): complete implementation"
5. Create PR
```

### QA Agent Workflow

```bash
# Testing story
1. npm run bmad:status story-X.Y
2. Run tests: npm test epic-X-story-X.Y.test.ts
3. Verify ACs manually
4. Update AC status in markdown
5. npm run bmad:sync

# Integration testing
1. Verify IVs in story file
2. Check cross-component functionality
3. Update IV status
4. Report blockers if found
```

### Architect Agent Workflow

```bash
# Epic planning
1. Review epic requirements
2. Break down into stories
3. Define acceptance criteria
4. Identify integration points
5. Document technical decisions
6. npm run bmad:sync

# Technical review
1. Review story implementation
2. Check architecture compliance
3. Identify tech debt
4. Update documentation
```

## Recent Platform Updates (Last 7 Days)

### Color Theme Update (2025-01-19)
- ✅ Replaced all green accent colors with yellow (#dfec2d)
- ✅ Updated theme colors in ThemeContext.tsx
- ✅ Replaced Tailwind green classes throughout codebase
- ✅ Updated CSS variables and modern-effects.css
- ✅ Deployed to production: https://alkemy1-q9ayq39cj-qualiasolutionscy.vercel.app

### API Fixes & Updates
- ✅ Fixed LoRA training errors with Fal.ai API
- ✅ Updated video generation to Fal.ai v2.1 endpoints
- ✅ Corrected FAL.AI API endpoints (404 resolution)
- ✅ Fixed Moodboard tab black screen crash
- ✅ Resolved TDZ (Temporal Dead Zone) errors in service exports

### 3D Worlds Tab Redesign
- ✅ Complete UI redesign with modern components
- ✅ HunyuanWorld integration with timeout handling
- ✅ Seadream v4 model integration

## Known Issues & Limitations

### Current Blockers
- ⚠️ Story files need frontmatter updates (32/33 remaining)
- ⚠️ Database not yet fully populated (pending initial sync)
- ⚠️ Some story numbers don't match expected format

### Technical Limitations
- **Image Size**: Gemini API has 20MB limit for inline images
- **Safety Filters**: Gemini blocks some prompts (auto-retry with Flux)
- **3D Rendering**: Requires WebGL 2.0 and decent GPU
- **Video Processing**: FFmpeg.wasm is CPU-intensive in browser
- **Large Scripts**: >100K characters may hit Gemini token limits

### Workarounds
- Automatic Flux API fallback for safety filter blocks
- Image size validation before upload (`validateImageSize()`)
- Blob URL to base64 conversion for persistence
- Optimized RLS policies for O(1) auth checks

## Security Considerations

### API Key Management
- ✅ AES-256-GCM encryption for stored API keys
- ✅ Environment variables for sensitive credentials
- ✅ Vercel environment variable management
- ✅ Client-side encryption with Web Crypto API

### Supabase RLS Policies
- ✅ Row-Level Security on all tables
- ✅ User data isolation via auth.uid() checks
- ✅ Optimized policies to O(1) lookups
- ✅ Service role key for admin operations only

### Production Best Practices
- ✅ HTTPS-only in production
- ✅ CORS configured for API endpoints
- ✅ Rate limiting on AI service calls
- ✅ Input validation on all user data
- ✅ Sanitized error messages (no sensitive info exposure)

## Future Enhancements

### Planned Features (Roadmap)

**Q1 2025 (Current)**:
- Complete EPIC-6 (Analytics)
- Begin EPIC-3 (3D Worlds)
- Prototype Gaussian Splatting viewer

**Q2 2025**:
- Complete EPIC-3, EPIC-4, EPIC-5
- Voice acting integration
- Audio production pipeline
- Timeline editing interface

**Q3 2025**:
- Export & delivery (EPIC-8)
- Real-time collaboration
- Cloud rendering pipeline

### BMAD System Enhancements

- [ ] Real-time Supabase subscriptions for live updates
- [ ] Slack/Discord integration for notifications
- [ ] Automated PR comments with BMAD status
- [ ] Velocity trend analysis and forecasting
- [ ] Tech debt tracking and visualization
- [ ] Custom report templates
- [ ] Multi-project support
- [ ] Team performance analytics

## Documentation Maintenance

### Auto-Generated Files
- `docs/BMAD_STATUS.md` - Updated on every sync
- Sprint reports - Generated weekly
- Epic completion reports - On epic completion
- Test coverage reports - On test runs

### Manual Maintenance Required
- Story markdown files - Developers update frontmatter and ACs
- Epic planning documents - PM/Architect updates
- Sprint retrospectives - Team collaboration
- Technical design docs - Architecture updates

### Update Frequency
- **Real-time**: Database updates via Supabase
- **On Commit**: Automatic sync via Git hooks
- **Daily**: Dashboard refresh and status checks
- **Weekly**: Sprint progress reports
- **Monthly**: Velocity and metrics analysis

## Support & Resources

### Documentation
- [BMAD Agent Guide](./docs/BMAD_AGENT_GUIDE.md) - Detailed workflow guide
- [Current Sprint](./docs/sprints/SPRINT_CURRENT.md) - Active sprint details
- [90-Day Roadmap](./docs/PROJECT_ROADMAP_CURRENT.md) - Strategic planning
- [Epic Status Update](./docs/EPIC_STATUS_UPDATE.md) - Latest epic progress

### Getting Help
1. Check BMAD Agent Guide for workflows
2. Run `npm run bmad:validate` for drift detection
3. Review story files for frontmatter examples
4. Check Supabase dashboard for data issues
5. Contact dev team for BMAD system bugs

---

**Document Version**: 2.0.0
**Last Updated**: 2025-01-19
**Next Review**: 2025-02-01
**Maintained By**: BMAD Team / Qualia Solutions

*This is the official BMAD specification. All agents should reference this document for system architecture, workflows, and conventions.*
