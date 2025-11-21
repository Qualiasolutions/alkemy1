---
last_sync: '2025-11-21T10:28:19.978Z'
auto_sync: true
---
# Story 3.1: 3D Location Generation and Loading

**Epic**: Epic 3 - Explorable 3D Location Environments
**PRD Reference**: Section 6, Epic 3, Story 3.1
**Status**: Not Started
**Priority**: Medium (V2.1 Immersive Feature)
**Estimated Effort**: 13 story points
**Dependencies**: Epic R2 (3D World Research) must be completed first
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** generate or load 3D location environments from text or image prompts,
**So that** I can explore and plan shots in immersive 3D space.

---

## Business Value

**Problem Statement**:
Filmmakers currently visualize locations through 2D moodboard images, which don't convey spatial relationships, camera angles, or lighting variation. This limits pre-visualization and makes shot planning less accurate, leading to mismatched expectations between concept and final shots.

**Value Proposition**:
3D location environments enable filmmakers to:
- Explore locations in immersive 3D space before generating shots
- Understand spatial relationships and geography of scenes
- Mark precise camera positions with accurate framing preview
- Test lighting conditions in real-time (Golden Hour, Neon, etc.)
- Reuse location assets across multiple projects

**Success Metric**: >60% of filmmakers generate at least one 3D location per project within first month.

---

## Acceptance Criteria

### AC1: 3D Location Generation UI
**Given** I am in the 3D Worlds Tab,
**When** I want to create a new 3D location,
**Then** I should see a generation interface with:
- **Text Prompt Input**: Large text area for location description
  - Placeholder: "Describe the location (e.g., 'Industrial warehouse with high ceilings, metal beams, concrete floors, dramatic lighting')"
  - Character counter (max 500 characters)
- **Reference Image Upload** (optional): Drag-drop area for 1-3 reference images
  - Supported formats: JPEG, PNG, WebP
  - Max file size: 10MB per image
- **Quality Preset Selector**:
  - Draft (fast generation, lower detail, ~5 seconds)
  - Standard (balanced, ~10 seconds)
  - Ultra (maximum detail, ~15 seconds)
- **Generate 3D Location** button
- **Recent Locations** list (5 most recent, quick reload)

**Verification**:
- Visual inspection of UI layout and theme consistency
- Test drag-drop and file picker for reference images
- Verify quality preset descriptions are clear

---

### AC2: Text-to-3D Generation Workflow
**Given** I have entered a location description (e.g., "Neon-lit cyberpunk alleyway with wet pavement"),
**When** I click "Generate 3D Location",
**Then** the following should occur:
1. Loading state appears with progress indicator
2. Generation uses technology chosen in Epic R2 (World Labs-inspired, Gaussian Splatting, Unreal Engine, etc.)
3. Progress updates in real-time:
   - "Analyzing prompt..."
   - "Generating world structure..."
   - "Building geometry and textures..."
   - "Finalizing environment..."
4. Generation completes in target time based on quality preset:
   - Draft: <5 seconds
   - Standard: <10 seconds
   - Ultra: <15 seconds
5. 3D viewer loads with generated environment
6. Success toast: "3D location generated successfully!"

**Verification**:
- Test with 10 diverse location prompts (indoor, outdoor, urban, natural)
- Measure generation times for each quality preset
- Verify progress indicators update correctly
- Verify 3D viewer loads without errors

---

### AC3: Image-to-3D Generation Workflow
**Given** I have uploaded a reference image of a location (e.g., photo of a warehouse),
**When** I click "Generate 3D Location",
**Then** the following should occur:
1. Image is analyzed for spatial structure, lighting, materials
2. Generation uses reference image as primary guide (text prompt is secondary)
3. Progress updates show image analysis steps
4. Generated 3D environment matches reference image spatial layout
5. Camera starting position matches reference image viewpoint
6. Success message includes similarity note: "3D location generated from reference image"

**Verification**:
- Test with 5 diverse reference images (interiors, exteriors, various styles)
- Verify generated 3D matches reference image layout
- Compare starting camera position to reference viewpoint

---

### AC4: 3D Location Storage and Metadata
**Given** a 3D location has been generated,
**When** the generation completes,
**Then** the location should be stored with:
- **Location ID**: Unique identifier (UUID)
- **Name**: Auto-generated from prompt (e.g., "Industrial Warehouse") or user-editable
- **Description**: Full prompt text
- **Created Date**: Timestamp
- **Quality Preset**: Draft/Standard/Ultra
- **3D Model Data**: GLTF, USD, Splat, or technology-specific format (from Epic R2)
- **Thumbnail**: Preview image (rendered from default camera angle)
- **File Size**: Total MB (for storage management)
- **Reference Images**: Original reference images (if used)

**Storage Strategy**:
- **Supabase**: `location_assets` table + Storage bucket (when configured)
- **localStorage**: Fallback for non-authenticated users (with size limits)
- **Compression**: Use compressed formats to minimize storage (GLTF with Draco, etc.)

**Verification**:
- Generate location and verify all metadata is captured
- Test storage in Supabase and localStorage
- Verify thumbnail generates correctly

---

### AC5: 3D Location Loading from Library
**Given** I have previously generated 3D locations,
**When** I view the 3D Worlds Tab,
**Then** I should see a "Location Library" panel with:
- Grid of location thumbnails (3-4 per row)
- Each thumbnail displays:
  - Preview image
  - Location name
  - Created date
  - File size badge
  - Quality badge (Draft/Standard/Ultra)
- Hover actions:
  - **Load**: Open location in 3D viewer
  - **Rename**: Edit location name inline
  - **Delete**: Remove location (confirmation required)
  - **Duplicate**: Create copy for variation
- Search/filter controls:
  - Search by name or description
  - Filter by quality preset
  - Sort by date (newest/oldest) or name (A-Z)

**Verification**:
- Generate 5+ locations
- Test load, rename, delete, duplicate actions
- Verify search and filter controls work correctly

---

### AC6: Performance and Optimization
**Given** 3D location generation can be resource-intensive,
**When** locations are generated or loaded,
**Then** the following performance targets should be met:
- **Generation Time**:
  - Draft: <5 seconds (NFR target)
  - Standard: <10 seconds
  - Ultra: <15 seconds
- **Load Time**: Existing location loads in <3 seconds
- **Memory Usage**: Maximum 500MB RAM per loaded location
- **Browser Performance**: Does not freeze or block UI during generation

**Additional Requirements**:
- Generation runs asynchronously (does not block UI)
- Progress indicator updates every 500ms
- Cancel generation button available (abort mid-process)

**Verification**:
- Benchmark generation times for each quality preset
- Measure memory usage with Chrome DevTools
- Test UI responsiveness during generation

---

### AC7: Error Handling - Generation Fails
**Given** 3D location generation encounters an error (API failure, invalid prompt, timeout),
**When** the error occurs,
**Then** the following should happen:
1. Error message displays with specific reason:
   - "Prompt too vague - please add more detail"
   - "Generation timed out - try Draft quality preset"
   - "API error - please try again later"
2. Retry button available (attempt generation again)
3. Fallback option: "Use procedural generation" (simpler, always works)
4. Generation does not save incomplete/corrupted 3D data
5. Toast notification with error summary

**Verification**:
- Simulate API failure
- Test with intentionally vague prompts
- Test timeout scenario (slow connection)

---

### AC8: Error Handling - Loading Fails
**Given** a saved 3D location fails to load (corrupted data, missing files),
**When** I attempt to load the location,
**Then** the following should occur:
1. Error message: "Failed to load location - data may be corrupted"
2. Options presented:
   - Regenerate location from original prompt
   - Delete corrupted location
   - Report issue (copy error details to clipboard)
3. Location is marked as "corrupted" in library (🔴 indicator)
4. Other locations remain unaffected (failure is isolated)

**Verification**:
- Simulate corrupted 3D data
- Verify error handling and user options
- Verify regeneration option works

---

### AC9: Cross-Project Location Reuse
**Given** I have saved 3D locations from previous projects,
**When** I start a new project,
**Then** I should be able to:
1. Access my entire location library (not project-specific)
2. Import locations from library into current project
3. Locations imported as references (not duplicated, storage-efficient)
4. Imported locations editable without affecting original (copy-on-modify)

**Verification**:
- Create location in Project A
- Start Project B
- Import location from library
- Verify changes in Project B don't affect Project A's version

---

## Integration Verification

### IV1: 3D Viewer Component Integration
**Requirement**: 3D location renders using existing `3DWorldViewer` component pattern or technology-specific viewer from Epic R2.

**Verification Steps**:
1. Review 3D viewer component architecture
2. Verify location data loads into viewer correctly
3. Test navigation controls (WASD, mouse) work with generated locations
4. Verify no breaking changes to existing 3D world functionality

**Expected Result**: 3D locations render seamlessly in integrated viewer component.

---

### IV2: Project State Integration
**Requirement**: Location data integrates with existing project state structure (no schema changes to `ScriptAnalysis` type).

**Verification Steps**:
1. Add location to project
2. Save project to localStorage or Supabase
3. Load project
4. Verify location data persists correctly
5. Test with existing project save/load mechanisms

**Expected Result**: Location storage is backward compatible with existing project format.

---

### IV3: Existing Procedural World Compatibility
**Requirement**: Existing procedural world service (worldLabsService.ts) continues to work (legacy support).

**Verification Steps**:
1. Test existing procedural world generation
2. Verify no breaking changes to `generateWorld()` function
3. Test switching between new 3D locations and legacy procedural worlds
4. Verify both can coexist in same project

**Expected Result**: Legacy procedural worlds still function, new 3D locations are additive feature.

---

### IV4: Director Agent Location Commands
**Requirement**: Director Agent can generate and load 3D locations via voice/text commands.

**Verification Steps**:
1. Command: "Generate a 3D warehouse location"
2. Verify Director initiates generation with appropriate prompt
3. Command: "Load the warehouse location"
4. Verify Director loads correct location from library
5. Verify error messages if location not found or generation fails

**Expected Result**: Director Agent seamlessly integrates 3D location workflow.

---

## Migration/Compatibility

### MC1: Existing Projects Without 3D Locations
**Requirement**: Existing projects work without 3D locations (feature is optional).

**Verification Steps**:
1. Load project created before 3D location feature
2. Verify no errors or warnings
3. Verify shot generation works normally (no 3D locations required)
4. Verify 3D Worlds Tab displays empty state with "Generate Your First Location" prompt

**Expected Result**: Graceful degradation, clear onboarding for new feature.

---

### MC2: Legacy Procedural Worlds Upgrade Path
**Requirement**: Projects with legacy procedural worlds can coexist with new 3D locations.

**Verification Steps**:
1. Load project with existing procedural world
2. Generate new 3D location
3. Verify both worlds are accessible
4. Verify no data loss or conflicts

**Expected Result**: Seamless coexistence of legacy and new 3D systems.

---

## Technical Implementation Notes

### Service Layer Architecture

**New Service Module**: `services/3dLocationService.ts` (or extend `services/worldLabsService.ts` based on Epic R2 choice)

**Key Functions**:
```typescript
// Generate 3D location from text prompt
export async function generate3DLocation(
  prompt: string,
  qualityPreset: '3d-draft' | '3d-standard' | '3d-ultra',
  referenceImages?: string[],
  onProgress?: (progress: number, status: string) => void
): Promise<Location3D>;

// Load 3D location from storage
export async function load3DLocation(locationId: string): Promise<Location3D>;

// Save 3D location to storage
export async function save3DLocation(location: Location3D): Promise<void>;

// Delete 3D location
export async function delete3DLocation(locationId: string): Promise<void>;

// Get all saved locations
export async function getLocationLibrary(): Promise<Location3D[]>;

// Generate thumbnail from 3D location
export async function generateLocationThumbnail(location: Location3D): Promise<string>;
```

**New Types** (in `types.ts`):
```typescript
export interface Location3D {
  id: string; // UUID
  name: string;
  description: string; // Original prompt
  createdAt: number; // Timestamp
  qualityPreset: '3d-draft' | '3d-standard' | '3d-ultra';
  modelData: LocationModelData; // Format depends on Epic R2 technology
  thumbnail: string; // Base64 or URL
  fileSize: number; // Bytes
  referenceImages?: string[];
  metadata?: {
    generationTime: number; // Milliseconds
    technologyUsed: string; // "World Labs" | "Gaussian Splatting" | etc.
  };
}

// Model data format (adjust based on Epic R2 outcome)
export interface LocationModelData {
  format: 'gltf' | 'usd' | 'splat' | 'custom';
  data: string | ArrayBuffer; // Serialized model data
  cameraDefaults?: {
    position: [number, number, number];
    rotation: [number, number, number];
    fov: number;
  };
}
```

### Component Integration

**Component File**: `tabs/3DWorldsTab.tsx` (extend existing)

**New State**:
```typescript
const [locations, setLocations] = useState<Location3D[]>([]);
const [currentLocation, setCurrentLocation] = useState<Location3D | null>(null);
const [generationProgress, setGenerationProgress] = useState<number>(0);
const [generationStatus, setGenerationStatus] = useState<string>('');
const [showLibrary, setShowLibrary] = useState<boolean>(true);
```

**New Components** (create in `components/`):
- `3DLocationGenerator.tsx`: Generation UI with text/image input
- `3DLocationLibrary.tsx`: Grid of saved locations with actions
- `3DLocationViewer.tsx`: Three.js-based 3D viewer component (or Epic R2 technology viewer)
- `QualityPresetSelector.tsx`: Radio buttons for Draft/Standard/Ultra

### Storage Strategy

**Supabase Tables** (when configured):
```sql
CREATE TABLE location_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  quality_preset TEXT CHECK (quality_preset IN ('3d-draft', '3d-standard', '3d-ultra')),
  model_format TEXT,
  file_size BIGINT,
  thumbnail_url TEXT,
  metadata JSONB
);
```

**Supabase Storage Bucket**: `location-models`
- Store large 3D model files (GLTF, Splat, etc.)
- Reference files by URL in `location_assets` table
- Automatic cleanup of orphaned files

**localStorage Fallback**:
- Key: `alkemy_3d_locations`
- Limit: 5 locations max (storage quota constraints)
- Compressed model data (gzip if possible)

### Epic R2 Technology Integration

**If World Labs-Inspired Procedural is chosen**:
- Extend existing `worldLabsService.ts`
- Use Gemini for intelligent layout and object placement
- Generate in-browser with Three.js

**If Gaussian Splatting is chosen**:
- Integrate Gaussian Splatting renderer (luma.ai or custom)
- Store as `.splat` files
- Render with WebGL2/WebGPU

**If Unreal Engine is chosen**:
- Integrate Pixel Streaming or WebAssembly build
- Higher server costs, premium quality
- May require dedicated infrastructure

### Environment Variables

**New API Keys** (if Epic R2 recommends paid service):
```
LOCATION_3D_API_KEY=your_key_here  # Only if paid 3D service chosen in R2
```

---

## Definition of Done

- [ ] 3D location generation UI implemented with text and image input
- [ ] Quality preset selector functional (Draft/Standard/Ultra)
- [ ] Text-to-3D generation workflow working with progress tracking
- [ ] Image-to-3D generation workflow functional
- [ ] 3D location storage implemented (Supabase + localStorage fallback)
- [ ] Location metadata captured and persisted
- [ ] Location library UI implemented with grid, search, filters
- [ ] Load, rename, delete, duplicate actions functional
- [ ] Performance targets met (generation times per quality preset)
- [ ] Error handling for all failure modes (generation fails, loading fails)
- [ ] Cross-project location reuse working
- [ ] Integration verification complete (3D viewer, project state, procedural worlds, Director Agent)
- [ ] Migration/compatibility verified (existing projects, legacy worlds)
- [ ] 3D model storage optimized (compression, file size limits)
- [ ] Thumbnail generation functional
- [ ] Code reviewed and approved by engineering lead
- [ ] User acceptance testing with 5+ filmmakers (>60% adoption target)
- [ ] CLAUDE.md updated with 3D location service documentation

---

## Dependencies

### Prerequisites
- **Epic R2** (3D World Research) completed with final technology recommendation

### Related Stories
- **Story 3.2** (Navigation): Generated locations need navigation controls
- **Story 3.3** (Camera Marking): Locations are platforms for marking camera positions
- **Story 3.4** (Lighting Presets): Locations support real-time lighting changes
- **Story 3.5** (Location Assets): Generated locations become reusable assets

### External Dependencies
- 3D generation service/technology from Epic R2 (World Labs, Gaussian Splatting, Unreal, etc.)
- Three.js or Epic R2-specific renderer
- Supabase Storage (optional, for cloud persistence)

---

## Testing Strategy

### Unit Tests
- `generate3DLocation()` function with various prompts
- Location metadata parsing and validation
- Storage/retrieval logic (Supabase and localStorage)

### Integration Tests
- Text-to-3D generation → storage → library display
- Image-to-3D generation with reference images
- Cross-project location import
- Director Agent location commands

### End-to-End Tests (Playwright)
- Complete generation workflow (text → generate → load in viewer)
- Location library management (load, rename, delete, duplicate)
- Error scenarios (generation fails, loading fails)

### Performance Tests
- Generation time benchmarks for each quality preset
- Memory usage monitoring during generation and loading
- Browser performance (frame rate during generation)

### Manual Testing
- Visual quality assessment of generated 3D locations
- Spatial accuracy validation (image-to-3D matches reference)
- User acceptance testing (5+ filmmakers, diverse location types)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 3, Story 3.1
- **Research Outcomes**: `docs/research/3d-world-spike.md` - Epic R2 findings
- **Architecture**: `docs/brownfield-architecture.md` - 3D world architecture
- **Existing Service**: `services/worldLabsService.ts` - Current procedural world implementation
- **Existing Component**: `components/3DWorldViewer.tsx` - Current 3D viewer
- **Existing Tab**: `tabs/3DWorldsTab.tsx` - Current 3D worlds UI

---

**END OF STORY**

*Next Steps: Wait for Epic R2 research completion, then implement 3D location generation based on technology recommendation.*
