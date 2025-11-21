---
last_sync: '2025-11-21T10:29:34.347Z'
auto_sync: true
---
# Story 3.5: Location Assets and Reusability

**Epic**: Epic 3 - Explorable 3D Location Environments
**PRD Reference**: Section 6, Epic 3, Story 3.5
**Status**: Not Started
**Priority**: Medium (V2.1 Immersive Feature)
**Estimated Effort**: 5 story points
**Dependencies**: Epic R2, Stories 3.1-3.4
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** save 3D locations as reusable assets and share them across projects,
**So that** I can build a library of production-ready environments and avoid regenerating common locations.

---

## Business Value

**Problem Statement**:
Filmmakers frequently reuse common locations (offices, warehouses, streets) across multiple projects. Regenerating these locations wastes time, API credits, and requires re-marking camera positions and lighting setups.

**Value Proposition**:
Location asset library enables filmmakers to:
- Build reusable library of high-quality 3D locations
- Share locations across multiple projects without duplication
- Import community-shared locations (if marketplace integration)
- Export location packages for backup or collaboration

**Success Metric**: >40% of projects reuse at least one location asset from library.

---

## Acceptance Criteria

### AC1: Location Asset Library UI
**Given** I have created multiple 3D locations,
**When** I view the "Location Library" tab,
**Then** I should see:
- Grid of all saved locations (user's personal library)
- Each location displays:
  - Thumbnail preview
  - Name and description
  - Created date
  - File size
  - Usage count (# of projects using this location)
  - Tags (e.g., "interior", "warehouse", "cyberpunk")
- Filter/search controls:
  - Search by name or tags
  - Filter by usage (most used, unused)
  - Sort by date or name

**Verification**:
- Create 5+ locations
- Test search and filter controls
- Verify usage count updates correctly

---

### AC2: Import Location into Project
**Given** I am working on a project,
**When** I want to import a location from my library,
**Then** I should be able to:
- Click "Import from Library" button
- Browse library modal appears
- Select location and click "Import"
- Location appears in project with all data:
  - 3D model
  - Camera markers
  - Lighting presets
  - Metadata
- Imported location is reference (not duplicated, storage-efficient)

**Copy-on-Modify Behavior**:
- Editing imported location creates project-specific copy
- Original library asset remains unchanged
- User prompted: "Create project-specific copy before editing?"

**Verification**:
- Import location from library
- Verify all data (markers, lighting) transfers
- Edit location, verify original unchanged

---

### AC3: Export Location Package
**Given** I have created a high-quality 3D location,
**When** I want to export it for backup or sharing,
**Then** I should be able to:
- Click "Export Location" button
- Export format: `.alkloc` (Alkemy Location Package)
- Package includes:
  - 3D model data (GLTF, Splat, etc.)
  - Camera markers
  - Lighting presets
  - Metadata (name, description, tags)
  - Thumbnail
- Download location package as single file
- Optional: Upload to community gallery (if Epic 7a)

**File Format**:
```json
{
  "format": "alkemy-location-v1",
  "location": {/* Location3D object */},
  "exportDate": 1699564800000,
  "creator": "user@example.com" // Optional
}
```

**Verification**:
- Export location package
- Verify file downloads correctly
- Import exported package in different project

---

### AC4: Import Location Package
**Given** I have received a `.alkloc` file,
**When** I import it into Alkemy,
**Then** the following should occur:
- Drag-drop or file picker to upload
- Location package parsed and validated
- Preview modal shows location details before import
- Click "Add to Library" to import
- Location appears in personal library
- All data restored correctly (markers, lighting, etc.)

**Validation Checks**:
- File format version compatibility
- Required fields present (3D model, metadata)
- File size limits (max 50MB)

**Verification**:
- Export location, import in different browser/account
- Verify all data transfers correctly
- Test invalid file format handling

---

### AC5: Location Tags and Organization
**Given** I have many locations in my library,
**When** I want to organize them,
**Then** I should be able to:
- Add tags to locations (e.g., "interior", "exterior", "urban", "natural")
- Tag suggestions appear (common tags from community)
- Multi-select tags (location can have 3-5 tags)
- Filter library by tags (click tag to filter)
- Create custom tag categories (e.g., "Time Period: Modern, Historical, Futuristic")

**Verification**:
- Add tags to 5 locations
- Filter by tag and verify correct locations display
- Test custom tag categories

---

### AC6: Location Usage Analytics
**Given** I have imported locations into projects,
**When** I view location details in library,
**Then** I should see usage analytics:
- Number of projects using this location
- Total camera markers across all usages
- Total shots generated from this location
- Last used date
- "View Projects" button (lists all projects using this location)

**Insights**:
- "Most Used Locations" widget (top 5)
- "Unused Locations" prompt (suggest archiving or deleting)

**Verification**:
- Import location into 3 projects
- Verify usage count updates
- Test "View Projects" functionality

---

### AC7: Location Versioning and Updates
**Given** I have imported a location into multiple projects,
**When** I update the library location (e.g., add new camera markers),
**Then** I should have options:
- **Update All Projects**: Propagate changes to all projects using this location
- **Update Selectively**: Choose which projects to update
- **Leave Independent**: Projects remain with original version
- Version history: Track changes (created, markers added, lighting updated)

**Confirmation Modal**:
- "This location is used in 3 projects. Update all projects with new markers?"
- Preview changes before applying

**Verification**:
- Update library location
- Test "Update All Projects" option
- Verify changes propagate correctly

---

### AC8: Community Location Sharing (Optional - Epic 7a Integration)
**Given** Epic 7a Community Hub is implemented,
**When** I want to share a location with the community,
**Then** I should be able to:
- Click "Share to Community" button
- Set sharing permissions (Public, Unlisted, Private)
- Add description and tags
- Upload to community gallery
- Other users can browse and import shared locations

**Attribution**:
- Original creator credit preserved
- Usage statistics (downloads, ratings)

**Verification**:
- Share location to community
- Import shared location as different user
- Verify attribution displays correctly

---

## Integration Verification

### IV1: Project State Integration
**Requirement**: Location assets integrate with existing project persistence (localStorage, Supabase).

**Verification Steps**:
1. Import location asset into project
2. Save project
3. Load project
4. Verify location data persists correctly

**Expected Result**: Seamless integration with project save/load.

---

### IV2: Supabase Storage Integration
**Requirement**: Location assets store in Supabase Storage when configured (cloud persistence).

**Verification Steps**:
1. Create location (authenticated user)
2. Verify location stores in Supabase `location_assets` table
3. Verify 3D model files store in `location-models` bucket
4. Test cross-device access (same library on different devices)

**Expected Result**: Cloud-first storage with localStorage fallback.

---

## Migration/Compatibility

### MC1: Existing Projects with Locations
**Requirement**: Projects with inline locations (pre-asset library) can convert locations to assets.

**Verification Steps**:
1. Load project with inline 3D location
2. Click "Save to Library" button
3. Location converts to asset, added to library
4. Project now references asset (not inline)

**Expected Result**: Seamless upgrade path for existing projects.

---

## Technical Implementation Notes

### Storage Architecture

**Supabase Tables**:
```sql
CREATE TABLE location_library (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[], -- Array of tags
  model_url TEXT, -- URL to 3D model in storage
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  usage_count INT DEFAULT 0,
  version INT DEFAULT 1,
  metadata JSONB
);

CREATE TABLE project_locations (
  project_id UUID,
  location_id UUID REFERENCES location_library(id),
  is_copy BOOLEAN DEFAULT FALSE, -- True if project-specific copy
  PRIMARY KEY (project_id, location_id)
);
```

**localStorage Schema**:
```typescript
{
  "alkemy_location_library": {
    "locations": Location3D[],
    "usage": Record<string, string[]> // locationId → projectIds
  }
}
```

### File Format

**`.alkloc` Package Format**:
```typescript
interface AlkemyLocationPackage {
  format: 'alkemy-location-v1';
  location: Location3D;
  exportDate: number;
  creator?: string;
  version: number;
}
```

---

## Definition of Done

- [ ] Location asset library UI implemented
- [ ] Import location into project functional (reference-based)
- [ ] Export location package (.alkloc) working
- [ ] Import location package with validation working
- [ ] Location tagging and organization functional
- [ ] Usage analytics implemented
- [ ] Location versioning and update propagation working
- [ ] Community sharing integration (if Epic 7a complete)
- [ ] Integration verification complete (project state, Supabase)
- [ ] Migration/compatibility verified
- [ ] Code reviewed and approved
- [ ] User acceptance testing (>40% reuse rate target)
- [ ] CLAUDE.md updated

---

## Dependencies

### Prerequisites
- **Epic R2** completed
- **Stories 3.1-3.4** completed

### Related Stories
- **Epic 7a** (Community Hub): Community location sharing
- **Story 6.2** (Analytics): Location usage tracking

---

## Testing Strategy

### Unit Tests
- Location package export/import parsing
- Tag filtering and search logic
- Usage count tracking

### Integration Tests
- Import location → modify → verify copy-on-modify
- Version update propagation across projects
- Supabase storage integration

### Manual Testing
- Cross-project location reuse workflow
- Export/import round-trip
- User acceptance testing (library organization usability)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 3, Story 3.5
- **Stories 3.1-3.4**: Previous Epic 3 stories

---

**END OF STORY**
