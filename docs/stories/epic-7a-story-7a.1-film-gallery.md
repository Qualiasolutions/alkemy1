---
epic: EPIC-7a
story: STORY-7a.1
title: Film Gallery and Browse
status: draft
progress: 0
assignee: null
dependencies: []
auto_sync: true
last_sync: '2025-11-21T10:29:30.760Z'
---

# Story 7a.1: Film Gallery and Browse

**Epic**: Epic 7a - Community Hub (Growth)
**PRD Reference**: Section 6, Epic 7a, Story 7a.1
**Status**: Not Started
**Priority**: Medium (V2.2 Growth Feature)
**Estimated Effort**: 7 story points
**Dependencies**: Authentication system (existing), Supabase integration
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** browse and discover films created by other Alkemy users,
**So that** I can find inspiration, learn techniques, and connect with the community.

---

## Business Value

**Problem Statement**:
Filmmakers work in isolation without visibility into what others are creating. Lack of community engagement limits learning, collaboration, and user retention.

**Value Proposition**:
Community film gallery enables filmmakers to:
- Discover high-quality work for inspiration
- Learn cinematography techniques by studying others
- Build audience and recognition for their own work
- Connect with like-minded creators

**Success Metric**: >40% of active users browse gallery monthly; >20% publish at least one film; average 5+ minutes spent browsing per session.

---

## Key Acceptance Criteria

### AC1: Public Film Gallery Interface
**Given** I access the Community tab,
**When** I view the film gallery,
**Then** I should see:
- Grid view of published films (video thumbnails)
- Each card displays:
  - Film title
  - Creator name and avatar
  - Duration (e.g., "2:34")
  - View count
  - Like count ❤️
  - Creation date
- Hover to auto-play preview (3-second loop)
- Click to view full film details

**Gallery Layout**:
```
┌─────────────┬─────────────┬─────────────┐
│ [Thumbnail] │ [Thumbnail] │ [Thumbnail] │
│  Title      │  Title      │  Title      │
│  @creator   │  @creator   │  @creator   │
│  👁 1.2K ❤️ 42│  👁 856 ❤️ 18│  👁 2.3K ❤️ 91│
└─────────────┴─────────────┴─────────────┘
```

**Verification**:
- Browse gallery with 20+ published films
- Test hover preview functionality
- Click film and verify details page opens

---

### AC2: Film Details Page
**Given** I click on a film in the gallery,
**When** the details page loads,
**Then** I should see:
- **Video Player**: Full film playback with controls
- **Film Metadata**:
  - Title and description
  - Creator profile (name, avatar, bio link)
  - Duration, resolution, creation date
  - Genre tags (e.g., "Sci-Fi", "Thriller", "Romance")
- **Engagement Metrics**:
  - Views: 1,234
  - Likes: 42 (with ❤️ button to like/unlike)
  - Comments: 8 (see AC5)
- **Technical Details** (expandable):
  - AI models used (Imagen, Veo, MusicGen)
  - Shot count
  - Generation time
- "Share" button (copy link, social media)

**Verification**:
- View film details page
- Test video playback
- Like/unlike film and verify count updates

---

### AC3: Gallery Filtering and Sorting
**Given** the gallery has hundreds of films,
**When** I want to find specific content,
**Then** I should be able to:
- **Sort By**:
  - Newest (default)
  - Most Viewed (all-time)
  - Trending (last 7 days)
  - Most Liked
- **Filter By**:
  - Genre (Sci-Fi, Drama, Action, Comedy, Horror, etc.)
  - Duration (< 1min, 1-3min, 3-5min, 5min+)
  - Creation Date (Today, This Week, This Month, All Time)
- **Search**: Text search by title, creator, or description
- Filters persist during session (URL params)

**Filter UI**:
```
Sort: [Newest ▼]  Filters: [Genre: All ▼] [Duration: All ▼] [🔍 Search...]
```

**Verification**:
- Filter by "Sci-Fi" genre and verify results
- Sort by "Most Viewed" and verify order
- Search for film title and verify results

---

### AC4: Publish Film to Gallery
**Given** I have completed a project,
**When** I want to share it with the community,
**Then** I should be able to:
- Click "Publish to Gallery" from project
- Fill in publication form:
  - Title (required)
  - Description (optional, 500 chars max)
  - Genre tags (select 1-3)
  - Visibility (Public, Unlisted, Private)
  - Thumbnail selection (auto-generated or custom upload)
- Preview before publishing
- "Publish" button with confirmation

**Visibility Options**:
- **Public**: Appears in gallery, searchable
- **Unlisted**: Accessible via direct link only
- **Private**: Creator-only (not shared)

**Data Model**:
```typescript
interface PublishedFilm {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  description?: string;
  genres: string[];
  visibility: 'public' | 'unlisted' | 'private';
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  likes: number;
  publishedAt: string;
  metadata: {
    shotCount: number;
    aiModelsUsed: string[];
    generationTime: number;
  };
}
```

**Verification**:
- Publish film with all metadata
- Verify film appears in gallery (if public)
- Test unlisted visibility (not in gallery, but accessible via link)

---

### AC5: Comments and Feedback
**Given** I am viewing a film,
**When** I want to leave feedback,
**Then** I should be able to:
- Write comment (500 chars max)
- Post comment (appears immediately)
- Edit/delete my own comments
- View all comments chronologically
- Like comments (upvote useful feedback)
- Report inappropriate comments (moderation)

**Comment Thread**:
```
@creator_name · 2 days ago
"Amazing cinematography! How did you achieve that lighting effect?"
  👍 5  💬 Reply

  @film_owner · 2 days ago (Creator)
  "Thanks! I used the Golden Hour preset from the 3D Worlds feature."
  👍 2
```

**Verification**:
- Post 3 comments on different films
- Edit and delete own comment
- Reply to comment and verify thread structure

---

### AC6: Creator Profiles (Basic)
**Given** I click on a creator's name,
**When** their profile page loads,
**Then** I should see:
- Creator info:
  - Username
  - Avatar
  - Bio (optional, 200 chars)
  - Join date
- Published films grid (all public films by this creator)
- Social links (optional: Twitter, Instagram, YouTube)
- "Follow" button (for future notifications feature)

**Profile Data Model**:
```typescript
interface CreatorProfile {
  userId: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  joinedAt: string;
  filmCount: number;
  totalViews: number;
}
```

**Verification**:
- View creator profile
- Verify all published films appear
- Test social link redirects

---

### AC7: My Published Films Management
**Given** I have published films,
**When** I access "My Published Films",
**Then** I should see:
- List of all my published films
- For each film:
  - Edit metadata (title, description, tags)
  - Change visibility (public/unlisted/private)
  - View analytics (views over time, likes, comments)
  - Unpublish (remove from gallery)
  - Delete permanently
- Draft films (projects not yet published)

**Analytics Display**:
- Views graph (last 7 days, 30 days)
- Total likes and comments
- Engagement rate (likes per view)

**Verification**:
- Publish 3 films
- Edit metadata on one film
- Change visibility to unlisted
- View analytics and verify data accuracy

---

### AC8: Content Moderation (Basic)
**Given** inappropriate content may be published,
**When** users or admins report content,
**Then** the system should:
- "Report" button on films and comments
- Report reasons:
  - Inappropriate content
  - Copyright violation
  - Spam
  - Other (text input)
- Admin review queue (if admin role exists)
- Auto-hide content with 5+ reports (pending review)
- Email notification to content owner

**Moderation Workflow**:
1. User reports film/comment
2. Report logged in database
3. If ≥5 reports, auto-hide content
4. Admin reviews and approves/rejects
5. Owner notified of decision

**Verification**:
- Report film with inappropriate content
- Verify report submitted
- Test auto-hide after 5 reports (simulate)

---

## Integration Verification

### IV1: Authentication Integration
**Requirement**: Only authenticated users can publish, like, and comment.

**Verification Steps**:
1. Log out
2. Attempt to like film
3. Verify "Sign in to like" prompt

**Expected Result**: Auth-gated actions.

---

### IV2: Supabase Storage Integration
**Requirement**: Published films and thumbnails store in Supabase.

**Verification Steps**:
1. Publish film
2. Verify video uploaded to `published-films` bucket
3. Verify thumbnail uploaded to `thumbnails` bucket

**Expected Result**: Cloud storage with CDN delivery.

---

### IV3: Project Integration
**Requirement**: Publishing uses existing project export workflow.

**Verification Steps**:
1. Complete project with timeline
2. Publish to gallery
3. Verify published video matches timeline export

**Expected Result**: Seamless publish from project.

---

## Migration/Compatibility

### MC1: Private Projects Remain Private
**Requirement**: Existing projects are not automatically published.

**Verification Steps**:
1. Load existing project
2. Verify "Publish to Gallery" button appears
3. Verify project is NOT in gallery until manually published

**Expected Result**: Opt-in publishing only.

---

### MC2: Anonymous Browsing
**Requirement**: Unauthenticated users can browse gallery (read-only).

**Verification Steps**:
1. Log out
2. Browse gallery
3. Verify films visible but cannot like/comment

**Expected Result**: Public gallery with auth-gated engagement.

---

## Technical Implementation Notes

### Service Layer

**Create `services/communityService.ts`**:
```typescript
export async function publishFilm(
  projectId: string,
  metadata: Partial<PublishedFilm>
): Promise<PublishedFilm>;

export async function getPublishedFilms(
  filters?: { genre?: string; sortBy?: string; searchQuery?: string }
): Promise<PublishedFilm[]>;

export async function getFilmDetails(filmId: string): Promise<PublishedFilm>;

export async function likeFilm(filmId: string): Promise<void>;
export async function unlikeFilm(filmId: string): Promise<void>;

export async function addComment(
  filmId: string,
  text: string
): Promise<Comment>;

export async function getCreatorProfile(
  userId: string
): Promise<CreatorProfile>;

export async function updateFilmMetadata(
  filmId: string,
  updates: Partial<PublishedFilm>
): Promise<PublishedFilm>;

export async function unpublishFilm(filmId: string): Promise<void>;

// Analytics
export async function trackView(filmId: string): Promise<void>;
export async function getFilmAnalytics(
  filmId: string
): Promise<{ views: number[]; likes: number; comments: number }>;
```

### Data Storage

**Supabase Tables**:
```sql
CREATE TABLE published_films (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  genres TEXT[],
  visibility TEXT NOT NULL DEFAULT 'public',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  duration_seconds INT NOT NULL,
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  published_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE TABLE film_likes (
  film_id UUID REFERENCES published_films(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (film_id, user_id)
);

CREATE TABLE film_comments (
  id UUID PRIMARY KEY,
  film_id UUID REFERENCES published_films(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  parent_comment_id UUID REFERENCES film_comments(id), -- For replies
  text TEXT NOT NULL,
  likes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE creator_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  social_links JSONB,
  joined_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content_reports (
  id UUID PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'film' or 'comment'
  content_id UUID NOT NULL,
  reported_by UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_published_films_visibility ON published_films(visibility);
CREATE INDEX idx_published_films_genres ON published_films USING GIN(genres);
CREATE INDEX idx_film_comments_film_id ON film_comments(film_id);
```

### Supabase Storage Buckets

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('published-films', 'published-films', true),
  ('thumbnails', 'thumbnails', true);

-- RLS policies
CREATE POLICY "Anyone can view published films"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'published-films');

CREATE POLICY "Authenticated users can upload films"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'published-films' AND auth.uid() = owner);
```

---

## Definition of Done

- [ ] Public film gallery interface with grid view
- [ ] Film details page with playback and metadata
- [ ] Gallery filtering and sorting functional
- [ ] Publish film workflow complete
- [ ] Comments and feedback system working
- [ ] Creator profiles (basic) implemented
- [ ] My published films management page
- [ ] Content moderation (basic reporting) functional
- [ ] Integration verification complete
- [ ] Migration/compatibility verified
- [ ] Code reviewed and approved
- [ ] User acceptance testing (>40% browse rate, >20% publish rate)
- [ ] CLAUDE.md updated

---

## Dependencies

### Prerequisites
- **Authentication system** (existing AuthContext)
- **Supabase integration** (configured)

### Related Stories
- **Story 5.4** (Audio Export): Published films use export workflow
- **Story 7a.2** (Creator Profiles): Extended profile features

---

## Testing Strategy

### Unit Tests
- Film metadata validation
- Comment text sanitization
- Report reason validation

### Integration Tests
- Publish workflow (project → gallery)
- Like/unlike functionality
- Comment thread structure

### Manual Testing
- Gallery browsing UX
- Video playback quality
- User acceptance testing (community engagement)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 7a, Story 7a.1
- **Supabase Storage**: https://supabase.com/docs/guides/storage
- **Content Moderation Best Practices**: https://www.nngroup.com/articles/community-moderation/

---

**END OF STORY**
