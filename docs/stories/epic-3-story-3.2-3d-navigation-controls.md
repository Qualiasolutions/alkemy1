---
last_sync: '2025-11-21T10:29:35.184Z'
auto_sync: true
---
# Story 3.2: 3D Navigation and Camera Controls

**Epic**: Epic 3 - Explorable 3D Location Environments
**PRD Reference**: Section 6, Epic 3, Story 3.2
**Status**: Not Started
**Priority**: Medium (V2.1 Immersive Feature)
**Estimated Effort**: 8 story points
**Dependencies**: Epic R2 (3D World Research), Story 3.1 (3D Location Generation)
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** navigate 3D locations with smooth camera controls,
**So that** I can explore environments and find optimal camera positions.

---

## Business Value

**Problem Statement**:
Generated 3D locations are useless without intuitive navigation. Filmmakers need industry-standard controls (WASD + mouse) to explore environments naturally, just like they would with Unreal Engine or game engines they're familiar with.

**Value Proposition**:
Smooth 3D navigation enables filmmakers to:
- Explore locations naturally with familiar game-style controls
- Find optimal camera angles through real-time movement
- Understand spatial relationships by walking through environments
- Preview shot framing before committing to camera position markers

**Success Metric**: >80% of filmmakers successfully navigate 3D locations without assistance or tutorial.

---

## Acceptance Criteria

### AC1: WASD Keyboard Navigation
**Given** a 3D location is loaded in the viewer,
**When** I use keyboard controls,
**Then** the camera should move as follows:
- **W**: Move forward (in the direction camera is facing)
- **S**: Move backward
- **A**: Strafe left
- **D**: Strafe right
- **Space**: Move up (vertical ascent)
- **Shift**: Move down (vertical descent)
- **Ctrl + W/S/A/D**: Sprint mode (2x movement speed)

**Movement Characteristics**:
- Smooth acceleration/deceleration (not instant)
- Consistent speed: 2 units/second (walking), 4 units/second (sprint)
- Collision detection: Cannot walk through walls/objects
- Ground snapping: Camera stays at head height when moving on surfaces

**Verification**:
- Test all 6 movement keys (W/S/A/D/Space/Shift)
- Verify sprint mode works (Ctrl modifier)
- Test collision detection with generated environment geometry
- Measure movement speed accuracy

---

### AC2: Mouse Look Controls
**Given** a 3D location is loaded,
**When** I move the mouse,
**Then** the camera should rotate as follows:
- **Mouse Move Left/Right**: Rotate camera horizontally (yaw)
- **Mouse Move Up/Down**: Rotate camera vertically (pitch)
- **No Roll**: Camera remains level (no tilting side-to-side)
- **Mouse Sensitivity**: Adjustable in settings (default: 0.002 radians/pixel)
- **Pitch Clamping**: Prevent camera from flipping (limit: -85° to +85°)

**Interaction Modes**:
- **Click and Drag** (default): Hold left mouse button to look around
- **Pointer Lock** (optional): Full mouse control, press Escape to exit

**Verification**:
- Test horizontal and vertical camera rotation
- Verify pitch clamping prevents camera flip
- Test both interaction modes (click-drag and pointer lock)
- Adjust mouse sensitivity and verify responsiveness

---

### AC3: Navigation Control Panel UI
**Given** a 3D location is loaded,
**When** I view the 3D viewer interface,
**Then** I should see a control panel with:
- **Movement Speed Slider**: 0.5x to 3.0x (default: 1.0x)
- **Mouse Sensitivity Slider**: 0.001 to 0.005 (default: 0.002)
- **Control Mode Toggle**:
  - Click and Drag (default)
  - Pointer Lock (press Escape to exit)
- **Collision Toggle**: Enable/Disable collision detection
- **Ground Snapping Toggle**: Auto-adjust camera height to ground level
- **Reset Camera Button**: Return to default starting position
- **Keyboard Shortcuts Reference**: Overlay with all controls (press "H" to show/hide)

**Panel Position**:
- Bottom-right corner (non-intrusive)
- Collapsible (hide when not needed)
- Semi-transparent background (doesn't obscure view)

**Verification**:
- Visual inspection of control panel layout
- Test all sliders and toggles
- Verify keyboard shortcuts overlay displays correctly

---

### AC4: Smooth Camera Movement and Inertia
**Given** I am navigating a 3D location,
**When** I press and release movement keys,
**Then** camera movement should feel smooth and natural:
- **Acceleration**: 0.2 seconds to reach full speed
- **Deceleration**: 0.3 seconds to stop after releasing key
- **Inertia**: Slight momentum after stopping (subtle, not nauseating)
- **Frame Rate Independence**: Consistent speed regardless of FPS (use delta time)

**Additional Requirements**:
- No stuttering or jittering during movement
- Smooth transitions between direction changes (W → A)
- Predictable behavior (users can stop exactly where intended)

**Verification**:
- Test movement feels smooth and responsive
- Verify consistent speed at 30fps, 60fps, 120fps (frame rate independence)
- Test rapid direction changes (W → S, A → D)

---

### AC5: Collision Detection and Boundary Constraints
**Given** collision detection is enabled,
**When** I navigate the 3D environment,
**Then** the following should occur:
- **Wall Collision**: Cannot move through walls or solid objects
- **Sliding**: If moving at angle into wall, slide along surface (don't stop completely)
- **Ground Detection**: Camera stays at appropriate height above ground
- **Ceiling Detection**: Cannot move through ceilings
- **Boundary Limits**: Environment has invisible boundaries (prevent falling into void)

**Collision Tolerance**:
- Camera near-clip distance: 0.1 units (prevents clipping into objects)
- Collision radius: 0.5 units (capsule collider around camera)
- Step height: 0.3 units (can walk up small steps)

**Verification**:
- Test wall collision in various environment types
- Verify sliding behavior along angled surfaces
- Test boundary limits (ensure cannot leave environment)
- Disable collision and verify free movement (fly through walls)

---

### AC6: Performance Targets (60fps Navigation)
**Given** a 3D location is loaded,
**When** I navigate through the environment,
**Then** performance should meet targets:
- **Frame Rate**: Maintain 60fps on target hardware (desktop with modern GPU)
- **Laptop Performance**: >45fps on high-end laptop (M1 Max or equivalent)
- **Mid-Range Laptop**: >30fps or adaptive quality degradation
- **Memory Usage**: <500MB RAM during navigation
- **No Stuttering**: Consistent frame timing (no frame drops >16.7ms)

**Adaptive Quality** (if performance drops):
- Reduce render distance (fog/culling)
- Lower texture resolution
- Disable dynamic shadows
- Visual notification: "Performance mode active"

**Verification**:
- Benchmark frame rates on target hardware
- Test with complex environments (high polygon count)
- Monitor memory usage with Chrome DevTools
- Test adaptive quality degradation on lower-end hardware

---

### AC7: Camera Height and Scale Calibration
**Given** 3D environments can vary in scale,
**When** a location loads,
**Then** camera height should auto-calibrate:
- **Default Height**: 1.7 units (average eye level)
- **Auto-Detect Ground**: Find floor level and position camera above it
- **Manual Adjustment**: Height slider in control panel (0.5 - 3.0 units)
- **Scale Reference**: Visual grid overlay (toggle with "G" key) showing 1-meter increments

**Additional Requirements**:
- Height persists per location (saved in location data)
- Director Agent can set height via command: "Set camera height to 2 meters"

**Verification**:
- Test with environments of varying scale
- Verify auto-ground detection works correctly
- Test manual height adjustment
- Verify grid overlay displays accurately

---

### AC8: Minimap and Orientation Compass
**Given** I am navigating a complex 3D environment,
**When** I want to understand my position and orientation,
**Then** I should see:
- **Minimap** (top-right corner):
  - 2D overhead view of environment
  - Player position indicator (red dot)
  - Camera facing direction (arrow/cone)
  - Environment boundaries and walls (simple line drawing)
  - Toggleable with "M" key
- **Compass** (top-center):
  - Shows cardinal directions (N, S, E, W)
  - Rotates based on camera yaw
  - Minimal, non-intrusive design

**Verification**:
- Verify minimap accurately represents environment layout
- Test minimap rotation follows camera orientation
- Verify compass shows correct cardinal directions

---

### AC9: Error Handling - Performance Degradation
**Given** frame rate drops below acceptable threshold (<30fps for >2 seconds),
**When** the performance issue is detected,
**Then** the following should occur:
1. Toast notification: "Performance mode activated to maintain smooth navigation"
2. Adaptive quality reduces automatically (lower detail, reduced render distance)
3. Performance metrics displayed in debug panel (FPS, render time)
4. Option to manually reduce quality further (settings panel)
5. Option to reset to original camera position (if stuck/lost)

**Verification**:
- Simulate low-end hardware (throttle CPU/GPU)
- Verify adaptive quality activates automatically
- Test manual quality reduction controls

---

## Integration Verification

### IV1: Three.js Camera Controller Integration
**Requirement**: Navigation uses Three.js OrbitControls or custom controller compatible with existing 3D viewer.

**Verification Steps**:
1. Review camera controller implementation
2. Verify compatibility with existing `3DWorldViewer` component
3. Test that other 3D features (lighting, camera marking) work with navigation
4. Verify no breaking changes to existing 3D world rendering

**Expected Result**: Navigation integrates seamlessly with Three.js rendering pipeline.

---

### IV2: Director Agent Navigation Commands
**Requirement**: Director Agent can control camera position via text/voice commands.

**Verification Steps**:
1. Command: "Move camera forward 5 units"
2. Command: "Look up 30 degrees"
3. Command: "Reset camera to start position"
4. Verify all commands execute correctly
5. Verify camera movement is smooth (not instant teleport)

**Expected Result**: Director Agent provides alternative navigation method for accessibility.

---

### IV3: Navigation State Persistence
**Requirement**: Camera position and orientation persist when switching tabs or saving project.

**Verification Steps**:
1. Navigate to specific position in 3D location
2. Switch to different tab (e.g., Script tab)
3. Return to 3D Worlds tab
4. Verify camera position is preserved
5. Save and reload project, verify position persists

**Expected Result**: Navigation state persists correctly across sessions.

---

## Migration/Compatibility

### MC1: Existing 3D Worlds Support Navigation
**Requirement**: Legacy procedural worlds (worldLabsService.ts) support new navigation controls.

**Verification Steps**:
1. Load legacy procedural world
2. Test all navigation controls (WASD, mouse, collision)
3. Verify no errors or degraded experience
4. Verify navigation feels identical to new 3D locations

**Expected Result**: Navigation is universal feature across all 3D world types.

---

## Technical Implementation Notes

### Service Layer

**Extend**: `services/3dLocationService.ts`

**New Functions**:
```typescript
export interface NavigationController {
  moveForward(speed: number, deltaTime: number): void;
  moveRight(speed: number, deltaTime: number): void;
  moveUp(speed: number, deltaTime: number): void;
  rotate(yaw: number, pitch: number): void;
  resetPosition(): void;
  setHeight(height: number): void;
  enableCollision(enabled: boolean): void;
}

export function createNavigationController(
  camera: THREE.Camera,
  scene: THREE.Scene,
  options: NavigationOptions
): NavigationController;
```

### Component Integration

**Component**: `components/3DLocationViewer.tsx`

**New State**:
```typescript
const [navigationMode, setNavigationMode] = useState<'click-drag' | 'pointer-lock'>('click-drag');
const [movementSpeed, setMovementSpeed] = useState<number>(1.0);
const [mouseSensitivity, setMouseSensitivity] = useState<number>(0.002);
const [collisionEnabled, setCollisionEnabled] = useState<boolean>(true);
const [showMinimap, setShowMinimap] = useState<boolean>(true);
const [cameraHeight, setCameraHeight] = useState<number>(1.7);
```

**Keyboard Event Handling**:
```typescript
useEffect(() => {
  const keys: Record<string, boolean> = {};

  const handleKeyDown = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = true;
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = false;
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}, []);
```

### Collision Detection

**Using Three.js Raycasting**:
```typescript
function checkCollision(camera: THREE.Camera, scene: THREE.Scene, direction: THREE.Vector3): boolean {
  const raycaster = new THREE.Raycaster(camera.position, direction, 0, 0.5);
  const intersects = raycaster.intersectObjects(scene.children, true);
  return intersects.length > 0;
}
```

### Performance Monitoring

```typescript
const stats = new Stats(); // FPS monitor
const performanceThreshold = 30; // FPS
let lowPerformanceFrames = 0;

function monitorPerformance(fps: number) {
  if (fps < performanceThreshold) {
    lowPerformanceFrames++;
    if (lowPerformanceFrames > 120) { // 2 seconds at 60fps
      activatePerformanceMode();
    }
  } else {
    lowPerformanceFrames = 0;
  }
}
```

---

## Definition of Done

- [ ] WASD keyboard navigation implemented with all 6 directions
- [ ] Mouse look controls functional (yaw/pitch, no roll)
- [ ] Navigation control panel UI implemented with all settings
- [ ] Smooth camera movement with acceleration/deceleration
- [ ] Collision detection and sliding implemented
- [ ] Performance targets met (60fps on target hardware)
- [ ] Camera height calibration and auto-ground detection working
- [ ] Minimap and compass implemented
- [ ] Error handling for performance degradation
- [ ] Integration verification complete (Three.js, Director Agent, state persistence)
- [ ] Migration/compatibility verified (legacy 3D worlds support navigation)
- [ ] Keyboard shortcuts overlay implemented
- [ ] Sprint mode and movement speed controls functional
- [ ] Pointer lock mode working (escape to exit)
- [ ] Code reviewed and approved by engineering lead
- [ ] User acceptance testing with 5+ filmmakers (>80% successful navigation target)
- [ ] CLAUDE.md updated with 3D navigation documentation

---

## Dependencies

### Prerequisites
- **Epic R2** (3D World Research) completed
- **Story 3.1** (3D Location Generation) completed

### Related Stories
- **Story 3.3** (Camera Marking): Navigation enables finding camera positions
- **Story 3.4** (Lighting Presets): Navigation used while previewing lighting
- **Story 3.5** (Location Assets): Navigation is core feature of reusable locations

### External Dependencies
- Three.js library
- Stats.js (FPS monitoring)

---

## Testing Strategy

### Unit Tests
- Navigation controller movement calculations
- Collision detection raycasting
- Camera height calibration logic

### Integration Tests
- WASD + mouse navigation in various environments
- Collision detection with different geometry types
- Performance monitoring and adaptive quality

### End-to-End Tests (Playwright)
- Complete navigation workflow (load → navigate → explore)
- Keyboard shortcuts and control panel interactions
- Performance mode activation

### Performance Tests
- Frame rate benchmarks (complex environments)
- Memory usage monitoring during navigation
- Adaptive quality degradation testing

### Manual Testing
- Navigation feel and responsiveness (user experience)
- Collision accuracy (wall sliding, ground snapping)
- User acceptance testing (5+ filmmakers, navigation intuitiveness)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 3, Story 3.2
- **Research Outcomes**: `docs/research/3d-world-spike.md` - Epic R2 navigation recommendations
- **Existing Component**: `components/3DWorldViewer.tsx`
- **Story 3.1**: `docs/stories/epic-3-story-3.1-3d-location-generation.md`

---

**END OF STORY**

*Next Steps: Implement navigation controls after Story 3.1 completion, using Epic R2 technology recommendations.*
