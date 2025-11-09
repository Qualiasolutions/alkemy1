# Story 3.4: Lighting Preset System

**Epic**: Epic 3 - Explorable 3D Location Environments
**PRD Reference**: Section 6, Epic 3, Story 3.4
**Status**: Not Started
**Priority**: Medium (V2.1 Immersive Feature)
**Estimated Effort**: 6 story points
**Dependencies**: Epic R2, Story 3.1, Story 3.2
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** preview and apply different lighting conditions to 3D locations in real-time,
**So that** I can visualize how scenes will look at different times of day or with different lighting setups.

---

## Business Value

**Problem Statement**:
Filmmakers need to understand how lighting affects mood and atmosphere before generating expensive shots. Static 3D environments with fixed lighting limit creative exploration and pre-visualization accuracy.

**Value Proposition**:
Real-time lighting presets enable filmmakers to:
- Preview Golden Hour, Overcast, Neon, Studio lighting instantly
- Understand how time of day affects scene mood
- Make informed lighting decisions before shot generation
- Export lighting data with camera positions for accurate shot generation

**Success Metric**: >60% of camera markers include specific lighting preset data.

---

## Acceptance Criteria

### AC1: Lighting Preset Selector UI
**Given** I am viewing a 3D location,
**When** I access the lighting controls,
**Then** I should see preset options:
- Golden Hour (warm, low sun angle)
- Overcast (soft, diffuse lighting)
- Neon Night (colorful, high contrast)
- Studio (three-point lighting)
- Moonlight (cool, low intensity)
- Harsh Midday (strong shadows)
- Custom (manual controls)

**UI Features**:
- Visual thumbnails for each preset
- Apply button or click to activate
- Lighting transitions smoothly (2-second fade)
- Current preset highlighted

**Verification**:
- Test all 7 presets
- Verify smooth transitions between presets
- Verify visual appearance matches preset description

---

### AC2: Real-Time Lighting Application
**Given** I select a lighting preset,
**When** the preset applies,
**Then** the following should update in <2 seconds:
- Sun/moon position and angle
- Ambient light color and intensity
- Shadow direction and softness
- Atmospheric effects (fog, haze)
- Material reflections and highlights

**Performance Target**:
- Maintain 60fps during lighting transitions
- No stuttering or frame drops

**Verification**:
- Apply each preset and measure frame rate
- Verify transitions complete in <2 seconds
- Test on target hardware (desktop, laptop)

---

### AC3: Lighting Preset Metadata Export
**Given** I have applied a lighting preset,
**When** I mark a camera position (Story 3.3),
**Then** the marker should save:
- Preset name (e.g., "Golden Hour")
- Sun angle (elevation, azimuth)
- Ambient color (RGB)
- Shadow intensity (0-100%)

**Shot Generation Integration**:
- Exported lighting data included in shot generation prompt
- Generated shots match 3D lighting conditions
- Director Agent translates lighting to cinematography terms ("Golden hour backlighting")

**Verification**:
- Mark camera with lighting preset
- Generate shot using marker data
- Verify shot matches 3D lighting (visual comparison)

---

### AC4: Custom Lighting Controls
**Given** I select "Custom" preset,
**When** I access advanced controls,
**Then** I should see:
- **Sun Position**: Azimuth (0-360°) and Elevation (-90° to +90°) sliders
- **Sun Intensity**: 0-200% slider
- **Sun Color**: Color picker (warm to cool)
- **Ambient Light**: Intensity (0-100%) and color
- **Shadow Settings**: Hardness (0-100%), intensity (0-100%)
- **Atmospheric Effects**: Fog density (0-100%), haze color

**Save Custom Preset**:
- "Save as New Preset" button
- Name custom preset (e.g., "My Sunset")
- Saved presets appear in preset selector

**Verification**:
- Create custom lighting setup
- Save as new preset
- Reload preset and verify settings restore correctly

---

### AC5: Time of Day Animation
**Given** I want to preview how lighting changes over time,
**When** I activate "Time of Day" animation,
**Then** the following should occur:
- Sun position animates from sunrise to sunset (60-second loop)
- Lighting and colors transition smoothly
- Playback controls: Play/Pause, Speed (0.5x-2x)
- Scrubber allows manual time selection
- "Capture Frame" button marks current lighting state

**Verification**:
- Start time of day animation
- Verify smooth lighting transitions
- Test playback controls (pause, speed adjustment)
- Test scrubber and frame capture

---

### AC6: Lighting Preset Recommendations
**Given** I have described my scene (e.g., "tense thriller"),
**When** I ask Director Agent for lighting suggestions,
**Then** Director should recommend:
- Appropriate presets for scene mood (e.g., "Harsh Midday" for thriller)
- Cinematographic reasoning (e.g., "Strong shadows create suspense")
- Option to apply recommended preset with one click

**Example Commands**:
- "What lighting should I use for a romantic scene?" → "Golden Hour for warm, soft lighting"
- "Suggest lighting for horror" → "Moonlight with high contrast shadows"

**Verification**:
- Test recommendations for 5 different scene types
- Verify Director provides cinematographic reasoning
- Test one-click application

---

### AC7: Lighting Persistence Per Location
**Given** I have applied lighting to a 3D location,
**When** I save the project or switch locations,
**Then** lighting should persist:
- Each location saves its current lighting preset
- Switching locations restores saved lighting
- Project save/load preserves lighting per location

**Verification**:
- Apply lighting to Location A
- Switch to Location B, apply different lighting
- Return to Location A, verify original lighting restored

---

### AC8: Error Handling - Performance Degradation
**Given** lighting effects cause performance issues,
**When** frame rate drops below 30fps,
**Then** system should:
- Reduce shadow quality automatically
- Simplify atmospheric effects
- Display toast: "Lighting quality reduced for performance"
- Option to manually disable advanced lighting

**Verification**:
- Simulate low-end hardware
- Verify adaptive quality reduction
- Test manual disable option

---

## Integration Verification

### IV1: Camera Marker Integration
**Requirement**: Lighting data saves with camera markers (Story 3.3).

**Verification Steps**:
1. Mark camera with specific lighting preset
2. Save and reload project
3. Jump to marker, verify lighting restores (if "Restore Lighting" enabled)

**Expected Result**: Seamless integration with camera marking system.

---

### IV2: Shot Generation Integration
**Requirement**: Lighting data exports to shot generation prompts.

**Verification Steps**:
1. Apply lighting preset to 3D location
2. Generate shot from marked position
3. Verify generated shot matches 3D lighting conditions

**Expected Result**: Shots accurately reflect 3D lighting pre-visualization.

---

## Migration/Compatibility

### MC1: Existing Locations Default Lighting
**Requirement**: Locations created before lighting presets use default "Studio" lighting.

**Verification Steps**:
1. Load legacy 3D location
2. Verify default Studio lighting applies
3. Change to different preset, verify it persists

**Expected Result**: Graceful upgrade for existing locations.

---

## Technical Implementation Notes

### Lighting System

**Extend `services/3dLocationService.ts`**:
```typescript
export interface LightingPreset {
  name: string;
  sunElevation: number; // -90 to 90 degrees
  sunAzimuth: number; // 0 to 360 degrees
  sunIntensity: number; // 0-200%
  sunColor: string; // Hex color
  ambientIntensity: number; // 0-100%
  ambientColor: string;
  shadowHardness: number; // 0-100%
  fogDensity: number; // 0-100%
}

const PRESET_LIBRARY: Record<string, LightingPreset> = {
  'golden-hour': {
    name: 'Golden Hour',
    sunElevation: 10,
    sunAzimuth: 270,
    sunIntensity: 80,
    sunColor: '#FFD700',
    ambientIntensity: 40,
    ambientColor: '#FFE4B5',
    shadowHardness: 30,
    fogDensity: 10,
  },
  // ... other presets
};
```

**Three.js Integration**:
```typescript
function applyLightingPreset(
  scene: THREE.Scene,
  preset: LightingPreset,
  duration: number = 2000
) {
  // Animate sun position
  // Update directional light intensity and color
  // Update ambient light
  // Update shadow settings
  // Update fog/atmospheric effects
}
```

---

## Definition of Done

- [ ] Lighting preset selector UI implemented with 7 presets
- [ ] Real-time lighting application functional (<2s transitions, 60fps)
- [ ] Lighting metadata export integrated with camera markers
- [ ] Custom lighting controls implemented
- [ ] Save custom presets functional
- [ ] Time of day animation implemented
- [ ] Director Agent lighting recommendations functional
- [ ] Lighting persistence per location working
- [ ] Performance degradation handling implemented
- [ ] Integration verification complete
- [ ] Migration/compatibility verified
- [ ] Code reviewed and approved
- [ ] User acceptance testing (>60% preset usage with markers)
- [ ] CLAUDE.md updated

---

## Dependencies

### Prerequisites
- **Epic R2** completed
- **Story 3.1** (3D Location Generation) completed
- **Story 3.2** (3D Navigation) completed

### Related Stories
- **Story 3.3** (Camera Marking): Lighting saves with camera positions
- **Story 2.3** (Shot Generation): Lighting data used in shot prompts

---

## Testing Strategy

### Unit Tests
- Lighting preset data validation
- Preset interpolation calculations

### Integration Tests
- Preset application → camera marker → shot generation workflow
- Director Agent lighting recommendations

### Performance Tests
- Frame rate during lighting transitions
- Adaptive quality reduction

### Manual Testing
- Visual quality of each preset
- User acceptance testing (lighting intuitiveness)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 3, Story 3.4
- **Story 3.3**: Camera marking integration

---

**END OF STORY**
