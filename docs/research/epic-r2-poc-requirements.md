# Epic R2: 3D World Generation PoC Requirements

**Epic Reference**: Epic R2: 3D World Generation Research
**Story**: R2.2 - 3D World Proof-of-Concept Prototypes
**Duration**: Week 2 (5 days)
**Status**: Ready for execution

---

## Proof-of-Concept Objectives

Build interactive 3D environment demos for top 3 technologies to validate:
1. **Visual quality** and photorealism (>8/10 filmmaker rating)
2. **Performance** on target hardware (60fps desktop, 45fps laptop, 30fps mid-range)
3. **Interactivity** (WASD navigation + camera marking + lighting presets)
4. **Export compatibility** (camera data → shot generation workflow)

---

## PoC Scope

### In Scope
- 3D environment generation/loading for 3 test locations
- WASD + mouse navigation controls
- Camera position marking UI (A/B/C markers)
- Lighting preset switcher (5 presets × 3 environments = 15 demos)
- Performance benchmarking (FPS, load time, memory)
- Filmmaker user testing (5+ participants)

### Out of Scope
- Full UI integration with `ThreeDWorldsTab` (isolated demos only)
- Character integration (deferred to Epic R1 completion)
- Set design tools (prop placement, layout editing)
- Production deployment (local/dev only)

---

## Test Environments

### Environment 1: Industrial Warehouse

**Specifications**:
- **Dimensions**: 50m × 30m floor area, 10m ceiling height
- **Architecture**: Large open interior with exposed beams, concrete floor, metal walls
- **Props**: Wooden crates (10-15), metal pallets (5-10), industrial barrels (8-12), machinery (2-3 units)
- **Doors/Windows**: Large roll-up door (main entrance), 2-3 windows (side walls), emergency exit door
- **Materials**: Concrete (floor/walls), rusted metal (beams/machinery), glass (windows), wood (crates)

**Generation Prompt** (if AI-based):
```
Industrial warehouse interior, large open space, concrete floor with wear marks, exposed metal ceiling beams, corrugated metal walls, large roll-up door, crates and pallets scattered, dim ambient lighting, photorealistic, cinematic, 8k detail
```

---

### Environment 2: Urban Street

**Specifications**:
- **Dimensions**: 100m street length, 15m width (road + sidewalks)
- **Buildings**: 3-5 story buildings on both sides, varied architecture (brick, glass, concrete)
- **Street Elements**: Asphalt road with lane markings, concrete sidewalks, crosswalks, streetlights (10-15), traffic lights (2-3)
- **Props**: Parked vehicles (5-8), street signs, trash cans, benches (2-3), storefronts with signage
- **Materials**: Asphalt, concrete, brick, glass, metal, painted surfaces

**Generation Prompt** (if AI-based):
```
Urban city street, modern buildings on both sides, asphalt road with lane markings, concrete sidewalks, parked cars, streetlights, storefronts with glass windows, signage, photorealistic, late afternoon lighting, cinematic, 8k detail
```

---

### Environment 3: Natural Forest

**Specifications**:
- **Dimensions**: 50m diameter clearing surrounded by trees
- **Trees**: Deciduous trees (oak, maple, birch), 20-30 trees visible, varied heights (10-20m)
- **Ground Cover**: Grass in clearing, fallen leaves, moss on rocks, small bushes/undergrowth
- **Terrain**: Natural uneven ground with slight elevation changes, exposed roots, rocks (5-10)
- **Materials**: Bark texture, leaf texture (ground + canopy), moss, dirt, grass

**Generation Prompt** (if AI-based):
```
Natural forest clearing, deciduous trees surrounding open area, grass and fallen leaves on ground, dappled sunlight filtering through canopy, moss-covered rocks, natural uneven terrain, photorealistic, cinematic, 8k detail
```

---

## Navigation Controls Implementation

### WASD + Mouse Navigation

**Control Scheme**:
- **W**: Move forward
- **S**: Move backward
- **A**: Strafe left
- **D**: Strafe right
- **Shift + W/S**: Move faster (sprint)
- **Ctrl + W/S**: Move slower (walk)
- **Mouse Move**: Look around (first-person camera rotation)
- **Scroll Wheel**: Adjust movement speed

**Performance Requirements**:
- Smooth movement (no stuttering)
- Responsive camera rotation (<50ms input lag)
- Collision detection (prevent walking through walls/objects)
- Gravity/ground snapping (camera stays at consistent height)

**Implementation Example** (Three.js PointerLockControls):
```typescript
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

// Movement velocity
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const moveSpeed = 10.0; // units per second

// Keyboard state
const moveForward = keys['KeyW'];
const moveBackward = keys['KeyS'];
const moveLeft = keys['KeyA'];
const moveRight = keys['KeyD'];

// Update position each frame
direction.z = Number(moveForward) - Number(moveBackward);
direction.x = Number(moveRight) - Number(moveLeft);
direction.normalize();

velocity.x -= velocity.x * 10.0 * delta; // Friction
velocity.z -= velocity.z * 10.0 * delta;

if (moveForward || moveBackward) velocity.z -= direction.z * moveSpeed * delta;
if (moveLeft || moveRight) velocity.x -= direction.x * moveSpeed * delta;

controls.moveRight(-velocity.x * delta);
controls.moveForward(-velocity.z * delta);
```

---

## Camera Position Marking System

### UI Overlay

**Visual Markers**:
- **Sphere Marker**: 3D sphere at camera position (radius: 0.5m)
- **Camera Icon**: Billboard sprite showing camera symbol (always faces user)
- **Label**: Text label above marker (e.g., "A: Wide Shot - Entrance")
- **Color Coding**: A=Red, B=Green, C=Blue

**Placement Workflow**:
1. User presses hotkey (e.g., "1" for A, "2" for B, "3" for C) or clicks UI button
2. Marker appears at current camera position
3. Marker data saved (position, rotation, FOV)
4. Marker visible in 3D space (can navigate to see all markers)

**Edit/Delete**:
- Click marker to select
- Press "Delete" key to remove
- Press "E" to edit label (modal input)
- Drag marker to reposition (optional)

**Implementation Example**:
```typescript
interface CameraMarker {
  id: 'A' | 'B' | 'C';
  label: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  fov: number;
  focalLength: string; // Computed from FOV
}

const markers: CameraMarker[] = [];

function placeCameraMarker(id: 'A' | 'B' | 'C', label: string) {
  const marker: CameraMarker = {
    id,
    label,
    position: camera.position.clone(),
    rotation: camera.rotation.clone(),
    fov: camera.fov,
    focalLength: computeFocalLength(camera.fov)
  };

  // Remove existing marker with same ID
  markers = markers.filter(m => m.id !== id);
  markers.push(marker);

  // Create visual representation
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: getColorForId(id) })
  );
  sphere.position.copy(marker.position);
  scene.add(sphere);

  return marker;
}

function exportCameraMarkers(): string {
  return JSON.stringify({
    locationId: currentLocationId,
    cameraPositions: markers.map(m => ({
      id: m.id,
      label: m.label,
      position: { x: m.position.x, y: m.position.y, z: m.position.z },
      rotation: { x: m.rotation.x, y: m.rotation.y, z: m.rotation.z },
      fov: m.fov,
      focalLength: m.focalLength
    })),
    lightingPreset: currentLightingPreset
  }, null, 2);
}
```

---

## Lighting Preset System

### Preset Switcher UI

**UI Controls**:
- Dropdown menu or button group
- 5 preset options (Golden Hour, Overcast, Neon Night, Studio, Dramatic Low-Key)
- Active preset highlighted
- Preset switch should be instant or <2s (NFR target)

**Lighting Parameter Updates**:
For each preset, update the following lighting parameters in real-time:

**Preset 1: Golden Hour**:
```javascript
{
  sunPosition: { azimuth: 270, elevation: 12 }, // degrees
  sunColor: 0xFFA000, // Warm orange
  sunIntensity: 0.8,
  ambientColor: 0xFF8800,
  ambientIntensity: 0.3,
  shadowHardness: 0.6, // Medium-soft
  fogColor: 0xFFCC88,
  fogDensity: 0.002
}
```

**Preset 2: Overcast**:
```javascript
{
  sunPosition: { azimuth: 0, elevation: 60 }, // Overhead, diffused
  sunColor: 0xCCCCEE, // Cool gray-blue
  sunIntensity: 0.6,
  ambientColor: 0xB0B0C0,
  ambientIntensity: 0.5,
  shadowHardness: 0.1, // Very soft
  fogColor: 0xB0B0B0,
  fogDensity: 0.001
}
```

**Preset 3: Neon Night**:
```javascript
{
  sunPosition: null, // No natural light
  pointLights: [
    { position: { x: 5, y: 3, z: 0 }, color: 0x00FFFF, intensity: 2 }, // Cyan
    { position: { x: -5, y: 3, z: 0 }, color: 0xFF00FF, intensity: 2 }, // Magenta
    { position: { x: 0, y: 3, z: 5 }, color: 0xFFFF00, intensity: 1.5 } // Yellow
  ],
  ambientColor: 0x001122,
  ambientIntensity: 0.1,
  shadowHardness: 0.9, // Hard shadows
  fogColor: 0x002244,
  fogDensity: 0.005
}
```

**Preset 4: Studio**:
```javascript
{
  keyLight: { position: { x: 5, y: 4, z: 3 }, color: 0xFFFFFF, intensity: 0.8 },
  fillLight: { position: { x: -3, y: 3, z: 3 }, color: 0xFFFFFF, intensity: 0.4 },
  rimLight: { position: { x: 0, y: 4, z: -5 }, color: 0xFFFFFF, intensity: 0.6 },
  ambientColor: 0x808080,
  ambientIntensity: 0.2,
  shadowHardness: 0.7,
  fogColor: null, // No fog
  fogDensity: 0
}
```

**Preset 5: Dramatic Low-Key**:
```javascript
{
  sunPosition: { azimuth: 90, elevation: 30 }, // Hard side light
  sunColor: 0xFFCC99, // Slightly warm
  sunIntensity: 1.0,
  ambientColor: 0x000000,
  ambientIntensity: 0.05, // Very low
  shadowHardness: 1.0, // Very hard
  fogColor: 0x000000,
  fogDensity: 0.003
}
```

**Implementation Example**:
```typescript
function applyLightingPreset(presetName: string) {
  const preset = lightingPresets[presetName];

  // Update sun/directional light
  if (preset.sunPosition) {
    const sun = scene.getObjectByName('directionalLight') as THREE.DirectionalLight;
    const phi = THREE.MathUtils.degToRad(90 - preset.sunPosition.elevation);
    const theta = THREE.MathUtils.degToRad(preset.sunPosition.azimuth);
    sun.position.setFromSphericalCoords(100, phi, theta);
    sun.color.setHex(preset.sunColor);
    sun.intensity = preset.sunIntensity;
    sun.castShadow = true;
    sun.shadow.radius = preset.shadowHardness * 5;
  }

  // Update ambient light
  const ambient = scene.getObjectByName('ambientLight') as THREE.AmbientLight;
  ambient.color.setHex(preset.ambientColor);
  ambient.intensity = preset.ambientIntensity;

  // Update fog
  if (preset.fogDensity > 0) {
    scene.fog = new THREE.FogExp2(preset.fogColor, preset.fogDensity);
  } else {
    scene.fog = null;
  }

  // Add point lights (for Neon Night preset)
  if (preset.pointLights) {
    preset.pointLights.forEach((light, index) => {
      const pointLight = new THREE.PointLight(light.color, light.intensity, 50);
      pointLight.position.set(light.position.x, light.position.y, light.position.z);
      pointLight.name = `pointLight_${index}`;
      scene.add(pointLight);
    });
  } else {
    // Remove existing point lights
    scene.children.filter(obj => obj.name.startsWith('pointLight_')).forEach(obj => {
      scene.remove(obj);
    });
  }
}
```

---

## Performance Benchmarking Procedures

### FPS Measurement

**Measurement Tool**:
Use `stats.js` or browser DevTools Performance panel.

**Procedure**:
1. Load environment
2. Wait for full loading (all assets loaded)
3. Start FPS recording
4. Navigate for 60 seconds (WASD + mouse movement)
5. Record FPS data (average, min, max)
6. Repeat 3 times, calculate average

**Implementation Example**:
```typescript
import Stats from 'stats.js';

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();

  // Render scene
  renderer.render(scene, camera);

  stats.end();
  requestAnimationFrame(animate);
}
```

**Acceptance Criteria**:
- Desktop (RTX 3060): Average FPS >60, Min FPS >45
- Laptop (M1 Max): Average FPS >45, Min FPS >30
- Mid-range: Average FPS >30 OR graceful quality degradation

---

### Load Time Measurement

**Measurement**:
- Start timer when generation/loading begins
- End timer when environment is explorable (first frame rendered)
- Record total load time in seconds

**Acceptance Criteria**:
- <30 seconds: Excellent (10 points)
- 30-60 seconds: Good (7 points)
- 60-120 seconds: Acceptable (4 points)
- >120 seconds: Poor (0 points)

---

### Memory Usage Monitoring

**Measurement**:
Use browser DevTools Memory panel (Heap Snapshot).

**Procedure**:
1. Take baseline heap snapshot before loading environment
2. Load environment
3. Take second heap snapshot after full load
4. Navigate for 60 seconds
5. Take third heap snapshot
6. Calculate memory delta

**Acceptance Criteria**:
- Heap size increase <500MB for 30-min project with 3 environments
- No memory leaks (heap size stable after navigation)

---

## Filmmaker User Testing Protocol

### Participant Recruitment

**Target**: 5-10 filmmakers with varied experience levels
- 2-3 professional filmmakers (5+ years experience)
- 2-3 indie filmmakers (1-5 years experience)
- 1-2 film students or hobbyists

**Screening Questions**:
1. How many years of filmmaking experience do you have?
2. Do you use 3D software (Blender, Unreal, Unity)? (Yes/No)
3. Have you used location scouting tools before? (Yes/No)

---

### Testing Session Structure

**Duration**: 30-45 minutes per participant

**Agenda**:
1. **Introduction** (5 min): Explain purpose, demo technology
2. **Guided Navigation** (10 min): Walk through controls, demonstrate features
3. **Free Exploration** (15 min): Participant explores 3 environments independently
4. **Task Completion** (10 min): Ask participant to complete specific tasks:
   - Mark camera position A in warehouse (wide shot)
   - Switch to Golden Hour lighting in forest
   - Navigate to urban street and mark position B (medium shot)
5. **Feedback Survey** (5-10 min): Collect structured feedback

---

### Feedback Survey Questions

**Navigation Usability** (1-10 scale):
1. How intuitive were the WASD + mouse controls?
2. How smooth was the camera movement?
3. Did you experience any navigation issues? (Yes/No, describe)

**Camera Marking Workflow** (1-10 scale):
1. How easy was it to mark camera positions?
2. How clear were the visual markers (A/B/C)?
3. Did the marker placement work as expected? (Yes/No)

**Lighting Preset Quality** (1-10 scale):
1. How noticeable were the lighting changes?
2. How realistic were the lighting presets?
3. How fast did the presets switch? (Instant / <2s / 2-5s / >5s)

**Visual Quality** (1-10 scale):
1. How photorealistic was the environment?
2. How immersive was the 3D experience?
3. Would you use this for professional location scouting? (Yes / No / Maybe)

**Overall Experience**:
1. What did you like most about the system?
2. What frustrated you or didn't work well?
3. What features are missing that you would expect?

**Target Scores**:
- All questions: >8/10 average
- "Would you use for professional work?" >80% Yes

---

## Camera Export Integration Test

### Export Format Validation

**Export Camera Data**:
```json
{
  "locationId": "warehouse-01",
  "locationName": "Industrial Warehouse",
  "cameraPositions": [
    {
      "id": "A",
      "label": "Wide Shot - Entrance",
      "position": { "x": 10.5, "y": 2.0, "z": -5.3 },
      "rotation": { "x": 0, "y": 45, "z": 0 },
      "fov": 50,
      "focalLength": "35mm"
    }
  ],
  "lightingPreset": "golden-hour"
}
```

**Integration Test Procedure**:
1. Export camera data from 3D world
2. Import into shot generation workflow (mockup)
3. Generate shot using camera position/lighting parameters
4. Compare 3D preview vs. generated shot (visual similarity)

**Success Criteria**:
- JSON export valid (passes schema validation)
- Camera position translates to shot composition
- Lighting preset translates to image generation prompt
- Visual consistency between 3D preview and generated shot >70%

---

## Deliverable Checklist

### Interactive Demo Deliverables
- [ ] Demo 1: Technology A (3 environments, 5 lighting presets each)
- [ ] Demo 2: Technology B (3 environments, 5 lighting presets each)
- [ ] Demo 3: Technology C (3 environments, 5 lighting presets each)
- [ ] Camera marking functional in all demos
- [ ] Lighting preset switcher functional in all demos

### Performance Data Deliverables
- [ ] FPS benchmarks (3 environments × 3 hardware tiers × 3 technologies)
- [ ] Load time measurements (3 environments × 3 technologies)
- [ ] Memory usage tracking (baseline, loaded, after navigation)
- [ ] Performance comparison spreadsheet (CSV)

### User Testing Deliverables
- [ ] User testing session recordings (5-10 participants)
- [ ] Feedback survey responses (CSV)
- [ ] Qualitative feedback summary (pain points, feature requests)
- [ ] User testing report (PDF)

### Integration Deliverables
- [ ] Camera export JSON examples (3 environments)
- [ ] Shot generation integration mockup (proof-of-concept)
- [ ] Visual comparison gallery (3D preview vs. generated shot)

---

**END OF POC REQUIREMENTS**

*Timeline*: Week 2 (5 days)
*Expected Outcome*: Technology recommendation with performance validation and user approval
