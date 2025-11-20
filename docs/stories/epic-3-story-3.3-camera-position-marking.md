---
last_sync: '2025-11-20T11:26:46.911Z'
auto_sync: true
---
# Story 3.3: Camera Position Marking System

**Epic**: Epic 3 - Explorable 3D Location Environments
**PRD Reference**: Section 6, Epic 3, Story 3.3
**Status**: Not Started
**Priority**: Medium (V2.1 Immersive Feature)
**Estimated Effort**: 8 story points
**Dependencies**: Epic R2 (3D World Research), Story 3.1 (3D Location Generation), Story 3.2 (3D Navigation)
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** mark and save camera positions (A/B/C angles) within 3D locations,
**So that** I can use precise camera data for shot generation.

---

## Business Value

**Problem Statement**:
Filmmakers exploring 3D environments need a way to capture specific camera positions and angles they discover during navigation. Without position markers, they lose valuable pre-visualization work and cannot translate 3D exploration into precise shot generation.

**Value Proposition**:
Camera position marking enables filmmakers to:
- Capture exact camera positions (position, rotation, FOV) during 3D exploration
- Save A/B/C angles for coverage shooting (standard film production practice)
- Export camera data for shot generation with perfect framing
- Build a library of pre-visualized shots before generating actual footage

**Success Metric**: >70% of filmmakers mark at least 3 camera positions per 3D location.

---

## Acceptance Criteria

### AC1: Camera Position Marker Placement
**Given** I am navigating a 3D location,
**When** I find a desired camera position,
**Then** I should be able to mark it by:
- Pressing **"C"** key or clicking "Mark Camera Position" button
- Marker appears at current camera position as a visual icon (camera gizmo)
- Marker labeled with letter (A, B, C, D, etc.) in sequence
- Marker stores: position (x,y,z), rotation (yaw, pitch), FOV, timestamp

**Marker Visual Design**:
- Camera icon (wireframe frustum showing FOV cone)
- Label badge (A/B/C) visible from distance
- Color-coded: A=red, B=green, C=blue, D+=yellow
- Hover tooltip shows metadata (name, FOV, timestamp)

**Verification**:
- Mark 5 positions in a location
- Verify each marker appears with correct icon and label
- Verify markers persist when navigating away and returning

---

### AC2: Camera Position Management Panel
**Given** I have marked camera positions,
**When** I view the camera markers panel (sidebar),
**Then** I should see a list with:
- All marked positions in order (A, B, C, etc.)
- Each entry displays:
  - Label and custom name (editable)
  - Thumbnail preview (rendered view from that position)
  - FOV value (e.g., "50mm equivalent")
  - Timestamp
- Actions per marker:
  - **Jump To**: Teleport camera to this position
  - **Rename**: Edit marker name inline
  - **Update**: Overwrite with current camera position
  - **Delete**: Remove marker (confirmation required)
- Bulk actions:
  - **Clear All**: Delete all markers (confirmation)
  - **Export**: Save camera data as JSON

**Verification**:
- Create 3 markers
- Test all actions (jump to, rename, update, delete)
- Verify bulk actions work correctly

---

### AC3: Camera Position Preview and Thumbnails
**Given** I have marked a camera position,
**When** I hover over or select the marker,
**Then** I should see:
- **In 3D view**: Marker highlights (glowing outline)
- **In panel**: Thumbnail auto-generates showing view from that position
- **Preview mode**: Click "Preview" button to see full-screen view without moving camera
- **Comparison mode**: Split-screen comparing current view vs. marked view

**Thumbnail Generation**:
- Auto-rendered when marker is created
- Updates if marker is repositioned
- Resolution: 320x180 (16:9 aspect ratio)
- Stored as base64 or blob URL

**Verification**:
- Mark position and verify thumbnail generates
- Test preview mode shows correct view
- Test comparison mode split-screen

---

### AC4: Camera Data Export for Shot Generation
**Given** I have marked camera positions,
**When** I want to generate shots using these exact positions,
**Then** I should be able to:
- Click "Generate Shot from Position A" button
- System automatically fills shot generation prompt with:
  - Camera position (position, rotation, FOV converted to lens)
  - Lighting conditions (from current 3D environment lighting)
  - Framing description (wide shot, close-up, based on FOV)
- Generated shot matches marked camera position perspective
- Similarity score >90% (shot matches 3D pre-visualization)

**Camera Data Export Format**:
```json
{
  "markerId": "A",
  "name": "Over-the-shoulder wide",
  "position": {"x": 5.2, "y": 1.7, "z": -3.1},
  "rotation": {"yaw": 45, "pitch": -10, "roll": 0},
  "fov": 50,
  "lensEquivalent": "35mm",
  "shotType": "wide-shot",
  "timestamp": 1699564800000
}
```

**Verification**:
- Mark camera position in 3D location
- Generate shot using "Generate from Position" button
- Compare generated shot to 3D thumbnail (visual similarity)

---

### AC5: A/B/C Angle Coverage Workflow
**Given** I am planning a scene with standard film coverage,
**When** I mark camera positions,
**Then** I should see coverage suggestions:
- **A Angle**: Master shot / establishing shot
- **B Angle**: Reverse angle / opposing view
- **C Angle**: Coverage / insert shot
- Visual indicators show which angles are marked (A✓ B✓ C✗)
- Director Agent suggests missing coverage: "You've marked A and B angles. Consider adding a C angle for coverage."

**Coverage Templates** (optional quick-start):
- "Dialogue Scene" template: Mark A (wide master), B (over-shoulder speaker 1), C (over-shoulder speaker 2)
- "Action Scene" template: Mark A (wide), B (medium), C (close-up), D (POV)

**Verification**:
- Mark only A and B angles
- Verify Director Agent suggests C angle
- Test coverage template (if implemented)

---

### AC6: Camera Marker Persistence and Project Integration
**Given** I have marked camera positions in a 3D location,
**When** I save the project,
**Then** markers should persist:
- Stored in location data (part of Location3D type)
- Survive project save/load (.alkemy.json format)
- Survive browser refresh (localStorage or Supabase)
- Markers tied to specific location (not global)

**Cross-Scene Reuse**:
- If same location used in multiple scenes, markers available in all instances
- Option to copy markers to new location instance (create variations)

**Verification**:
- Mark positions, save project, refresh browser, verify markers persist
- Use same location in different scene, verify markers are available

---

### AC7: Lighting Integration with Markers
**Given** I have marked a camera position with specific lighting (Story 3.4),
**When** I jump to that marker,
**Then** lighting should optionally restore:
- "Restore Lighting" checkbox in marker settings
- If enabled: Jumping to marker also applies saved lighting preset
- If disabled: Lighting remains at current setting

**Verification**:
- Mark position with "Golden Hour" lighting
- Change lighting to "Neon Night"
- Jump to marker with "Restore Lighting" enabled
- Verify lighting switches back to "Golden Hour"

---

### AC8: Error Handling - Maximum Markers Limit
**Given** I have marked many camera positions (e.g., 20+),
**When** I attempt to mark position #26,
**Then** I should see:
- Warning: "Maximum 25 camera markers per location reached"
- Options:
  - Delete existing marker before adding new one
  - Upgrade to unlimited markers (if using Supabase, or premium tier)
- Oldest markers can be archived (hidden but not deleted)

**Verification**:
- Mark 26 positions
- Verify limit warning appears
- Test archiving oldest markers

---

### AC9: Director Agent Camera Marking Commands
**Given** I am using voice commands,
**When** I say camera marking commands,
**Then** Director should execute:
- "Mark this position as A" → Creates marker labeled A at current position
- "Jump to position B" → Teleports to marker B
- "Show me all camera positions" → Opens camera markers panel
- "Generate shot from position C" → Initiates shot generation with position C data
- "Delete position D" → Removes marker D (with voice confirmation)

**Verification**:
- Test all voice commands
- Verify Director understands variations ("Mark camera here", "Go to angle B")

---

## Integration Verification

### IV1: Shot Generation Integration
**Requirement**: Camera position data exports in format compatible with existing `generateStillVariants()` workflow.

**Verification Steps**:
1. Mark camera position in 3D location
2. Export camera data
3. Use data in shot generation
4. Verify generated shot matches 3D perspective (>90% similarity)

**Expected Result**: Seamless integration with shot generation pipeline.

---

### IV2: Location Data Model Extension
**Requirement**: Camera markers store in Location3D type without breaking existing location functionality.

**Verification Steps**:
1. Load location created before camera marker feature
2. Verify no errors
3. Add markers to legacy location
4. Verify markers persist correctly

**Expected Result**: Backward compatible with existing locations.

---

### IV3: Director Agent Command Integration
**Requirement**: Director Agent understands camera marker commands via voice and text.

**Verification Steps**:
1. Test all camera marking commands (voice and text)
2. Verify Director responds correctly
3. Verify error handling for invalid commands ("Jump to position Z" when Z doesn't exist)

**Expected Result**: Director Agent provides natural language interface for camera marking.

---

## Migration/Compatibility

### MC1: Existing Locations Without Markers
**Requirement**: Locations created before camera marker feature work normally (no markers initially).

**Verification Steps**:
1. Load location created before Story 3.3
2. Verify no errors
3. Verify empty state displays: "No camera positions marked yet"
4. Add markers, verify they persist

**Expected Result**: Graceful upgrade path for existing locations.

---

## Technical Implementation Notes

### Data Model Extension

**Extend `Location3D` type in `types.ts`**:
```typescript
export interface Location3D {
  // ... existing fields ...
  cameraMarkers?: CameraMarker[];
}

export interface CameraMarker {
  id: string; // UUID
  label: string; // 'A', 'B', 'C', etc.
  name?: string; // Custom name (e.g., "Over-shoulder wide")
  position: [number, number, number]; // x, y, z
  rotation: { yaw: number; pitch: number; roll: number };
  fov: number; // Field of view in degrees
  lensEquivalent?: string; // "35mm", "50mm", "85mm"
  thumbnail?: string; // Base64 or blob URL
  lightingPreset?: string; // From Story 3.4
  restoreLighting?: boolean;
  timestamp: number;
}
```

### Service Layer

**Extend `services/3dLocationService.ts`**:
```typescript
export async function addCameraMarker(
  locationId: string,
  marker: CameraMarker
): Promise<void>;

export async function deleteCameraMarker(
  locationId: string,
  markerId: string
): Promise<void>;

export async function updateCameraMarker(
  locationId: string,
  markerId: string,
  updates: Partial<CameraMarker>
): Promise<void>;

export async function jumpToCameraMarker(
  camera: THREE.Camera,
  marker: CameraMarker,
  smooth?: boolean // Animate transition
): Promise<void>;

export async function exportCameraData(
  marker: CameraMarker
): Promise<CameraExportData>;
```

### Component Integration

**Component**: `components/3DLocationViewer.tsx`

**New State**:
```typescript
const [cameraMarkers, setCameraMarkers] = useState<CameraMarker[]>([]);
const [selectedMarker, setSelectedMarker] = useState<CameraMarker | null>(null);
const [showMarkersPanel, setShowMarkersPanel] = useState<boolean>(true);
```

**New Components**:
- `CameraMarkerIcon.tsx`: 3D gizmo rendered at marker position
- `CameraMarkersPanel.tsx`: Sidebar list of markers
- `CameraMarkerPreview.tsx`: Thumbnail and metadata display

### Camera Marker Visualization

**Three.js Implementation**:
```typescript
function createCameraMarkerGizmo(marker: CameraMarker): THREE.Group {
  const group = new THREE.Group();
  
  // Camera frustum visualization
  const frustum = new THREE.CameraHelper(/* camera with marker FOV */);
  group.add(frustum);
  
  // Label sprite
  const label = createTextSprite(marker.label);
  label.position.set(0, 2, 0);
  group.add(label);
  
  return group;
}
```

---

## Definition of Done

- [ ] Camera position marker placement functional (C key, button)
- [ ] Marker visual design implemented (camera gizmo, labels, colors)
- [ ] Camera markers management panel implemented (list, actions)
- [ ] Thumbnail generation functional
- [ ] Preview and comparison modes working
- [ ] Camera data export for shot generation integrated
- [ ] A/B/C angle coverage workflow and suggestions implemented
- [ ] Marker persistence functional (localStorage, Supabase)
- [ ] Lighting integration with markers (Story 3.4 dependency)
- [ ] Maximum markers limit handling
- [ ] Director Agent camera marking commands functional
- [ ] Integration verification complete (shot generation, location data, Director Agent)
- [ ] Migration/compatibility verified (existing locations)
- [ ] Code reviewed and approved
- [ ] User acceptance testing (>70% marker usage target)
- [ ] CLAUDE.md updated with camera marking documentation

---

## Dependencies

### Prerequisites
- **Epic R2** (3D World Research) completed
- **Story 3.1** (3D Location Generation) completed
- **Story 3.2** (3D Navigation) completed

### Related Stories
- **Story 3.4** (Lighting Presets): Markers can save lighting state
- **Story 2.3** (Character Identity Integration): Camera data used for shot generation with characters

### External Dependencies
- Three.js for camera gizmo rendering
- Thumbnail generation (canvas rendering)

---

## Testing Strategy

### Unit Tests
- Camera marker CRUD operations
- Camera data export format validation
- Thumbnail generation logic

### Integration Tests
- Marker placement → persistence → load workflow
- Camera data export → shot generation integration
- Director Agent marker commands

### End-to-End Tests (Playwright)
- Complete workflow (navigate → mark → jump to → generate shot)
- A/B/C coverage workflow
- Marker management (rename, delete, export)

### Manual Testing
- Visual similarity between 3D marker view and generated shot
- User acceptance testing (5+ filmmakers, coverage workflow)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 3, Story 3.3
- **Story 3.1**: `docs/stories/epic-3-story-3.1-3d-location-generation.md`
- **Story 3.2**: `docs/stories/epic-3-story-3.2-3d-navigation-controls.md`

---

**END OF STORY**
