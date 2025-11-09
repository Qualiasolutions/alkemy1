# Story 7a.2: Creator Profiles and Portfolios

**Epic**: Epic 7a - Community Hub (Growth)
**PRD Reference**: Section 6, Epic 7a, Story 7a.2
**Status**: Not Started
**Priority**: Medium (V2.2 Growth Feature)
**Estimated Effort**: 5 story points
**Dependencies**: Story 7a.1 (Film Gallery)
**Last Updated**: 2025-11-09

---

## User Story

As a **filmmaker**,
I want to **build a professional creator profile and portfolio**,
So that **I can showcase my work and build my filmmaking reputation**.

---

## Business Value

Creator profiles enable filmmakers to establish their brand, attract followers, and demonstrate their Alkemy expertise to potential collaborators or clients.

**Success Metric**: >50% of users who publish films create complete profiles; >30% add social links.

---

## Key Acceptance Criteria

### AC1: Profile Creation and Editing
- Profile fields: Username, bio (200 chars), avatar, social links (Twitter, Instagram, YouTube, website)
- Profile URL: `/profile/username`
- Edit profile page with real-time preview
- Avatar upload with crop/resize tools

### AC2: Published Films Portfolio
- Profile displays all published films grid
- Film count and total views statistics
- Sort by newest/most viewed/most liked

### AC3: Follow System
- Follow/unfollow creators
- Follower count displayed on profile
- "Following" feed shows new films from followed creators

### AC4: Profile Analytics (Creator-Only View)
- Total views across all films
- Total likes and comments
- Follower growth over time

---

## Integration Verification

- **IV1**: Profiles integrate with existing Supabase auth (user ID mapping)
- **IV2**: Published films query optimized (indexed by user_id)

---

## Definition of Done

- Profile creation and editing functional
- Portfolio display working
- Follow system implemented
- Analytics dashboard for creators
- User acceptance testing (>50% profile completion)

**END OF STORY**
