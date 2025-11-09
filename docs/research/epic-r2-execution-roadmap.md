# Epic R2: 3D World Generation Research - Execution Roadmap

**Epic Reference**: Epic R2: 3D World Generation Research
**Research Duration**: 2-3 weeks
**Target Completion**: Week 12-14 (end of research phase)
**Status**: Ready for execution

---

## Week-by-Week Breakdown

### Week 1: Technology Landscape Analysis (Story R2.1)

**Days 1-2: Initial Research and Environment Assessment**
- Review PRD requirements (FR-3D1-7, NFR3, CR3)
- Audit existing 3D world services:
  - `services/worldLabsService.ts` (World Labs-inspired, recommended)
  - `services/proceduralWorldService.ts` (procedural, fast)
  - `services/3dWorldService.ts` (Luma AI, legacy/expensive)
- Evaluate current capabilities vs. V2 requirements
- Identify gaps (camera marking, lighting presets, reusability)

**Days 3-4: Technology Candidate Research**
- **Existing World Labs Service Enhancement**:
  - Evaluate current Gaussian Splatting implementation
  - Assess camera position marking feasibility
  - Test lighting preset integration
  - Measure performance (FPS benchmarks)

- **Enhanced Procedural Service**:
  - Review WASD + mouse navigation (already working)
  - Prototype camera position marker overlay
  - Design lighting preset system architecture
  - Estimate enhancement effort

- **Unreal Engine Pixel Streaming**:
  - Research UE5 Pixel Streaming architecture
  - Evaluate infrastructure requirements (GPU servers, WebRTC)
  - Assess cost implications (server hosting)
  - Test latency and quality trade-offs

- **Unreal Engine WebAssembly Builds**:
  - Investigate UE5 WebAssembly export (experimental)
  - Assess bundle size (~500MB+ expected)
  - Evaluate browser performance
  - Document maturity and risk

- **Gaussian Splatting Services**:
  - Luma AI (existing integration - expensive)
  - NeRF Studio / Nerfstudio (self-hosted)
  - 3D Gaussian Splatting (3DGS) open source
  - Evaluate photorealism vs. performance

- **Matterport-Style 3D Capture**:
  - 360° panorama + hotspot navigation
  - Assess photo-realistic quality
  - Evaluate interactivity limitations (not true 3D)

**Day 5: Comparison Matrix Completion**
- Populate technology comparison spreadsheet
- Identify Tier 1/2/3 candidates
- Document infrastructure requirements
- Select top 3 technologies for PoC demos

**Deliverables**:
- Technology comparison matrix (CSV)
- Infrastructure requirements document
- Cost analysis (development + operational)
- Top 3 technology selection memo

---

### Week 2: Proof-of-Concept Demos (Story R2.2)

**Days 1-2: PoC Environment Setup**
- Set up development environment with API keys
- Create test location specifications:
  - **Industrial Warehouse** (interior)
  - **Urban Street** (exterior)
  - **Natural Forest** (outdoor)
- Implement 5 lighting presets:
  - Golden Hour
  - Overcast
  - Neon Night
  - Studio
  - Dramatic Low-Key

**Days 3-4: Interactive Demo Construction**
For each of the top 3 technologies:

1. **Generate/Load 3 Test Environments**
   - Warehouse interior with props
   - Urban street with buildings
   - Forest with natural terrain

2. **Implement Navigation**
   - WASD + mouse controls (or equivalent)
   - Smooth camera movement
   - Collision detection (if applicable)

3. **Implement Camera Position Marking**
   - Click to place marker (A, B, C positions)
   - Visual marker in 3D space (sphere, camera icon)
   - Save camera POV (position, rotation, FOV)
   - Edit/delete markers

4. **Implement Lighting Preset Switcher**
   - UI controls for preset selection
   - Real-time lighting changes
   - Measure preset switch latency (target: <2s)

**Day 5: Performance Benchmarking**
Test on target hardware:
- **Desktop with RTX 3060**: Measure FPS (target: >60fps)
- **High-end Laptop (M1 Max)**: Measure FPS (target: >45fps)
- **Mid-range Laptop**: Measure FPS (target: >30fps or quality degradation)

Record for each environment:
- FPS during navigation
- Load time (prompt → explorable environment)
- Memory usage (RAM/VRAM)
- CPU/GPU load percentages

**Deliverables**:
- 3 interactive demos (one per technology)
- Performance spreadsheet (FPS, load time, memory)
- Lighting preset demos (3 environments × 5 presets = 15 videos)
- Camera export JSON examples

---

### Week 3: User Testing and Final Recommendation (Story R2.3)

**Days 1-2: Filmmaker User Testing**
- Recruit 5+ filmmakers for user testing
- Conduct remote testing sessions (screen recording)
- Test each technology demo:
  - Navigation intuitiveness (WASD + mouse)
  - Camera position marking workflow
  - Lighting preset application
  - Overall visual quality
- Collect feedback:
  - Usability rating (1-10 scale)
  - Feature requests
  - Pain points and frustrations

**Days 3-4: Data Analysis and Recommendation**
- Complete scorecard for all 3 prototyped technologies
- Calculate total scores using weighted criteria:
  - Visual Quality (25%)
  - Performance (25%)
  - Interactivity (15%)
  - Export Compatibility (15%)
  - Generation Speed (10%)
  - Infrastructure Complexity (10%)
- Identify recommended technology (Tier 1 score ≥70)

Write comprehensive recommendation document (5-10 pages):

1. **Executive Summary** (1 page)
   - Chosen technology and justification
   - Performance benchmarks (FPS on target hardware)
   - Visual quality samples

2. **Technology Comparison** (2-3 pages)
   - Detailed scorecard
   - Visual quality comparison gallery
   - Performance benchmarks
   - User feedback summary

3. **Implementation Roadmap** (2 pages)
   - Phase 1: Core navigation and rendering
   - Phase 2: Camera position marking
   - Phase 3: Lighting presets
   - Phase 4: Advanced features (props, physics, set design)
   - Estimated effort per phase

4. **Integration Plan** (1-2 pages)
   - Camera export format (JSON schema)
   - Lighting preset → shot generation mapping
   - Character identity integration (if R1 complete)
   - Backward compatibility strategy

5. **Fallback Strategy** (1 page)
   - Simplified fallback: Static 360° panorama with hotspots
   - Criteria for triggering fallback (FPS <30, gen time >2min)

6. **Cost Analysis** (1 page)
   - Development cost (7-10 weeks engineering)
   - Operational cost (1k, 10k, 100k generations/month)
   - Infrastructure requirements

**Day 5: Stakeholder Review and Sign-Off**
- Present findings to product, engineering, design teams
- Demo top technology (live walkthrough)
- Address questions and concerns
- Obtain stakeholder sign-off

**Deliverables**:
- Final recommendation document (PDF)
- Stakeholder presentation (slides + live demo)
- Approved technology selection
- Implementation plan for Epic 3

---

## Technology Candidates (Detailed)

### 1. World Labs Service (RECOMMENDED - Already Implemented)

**Current Implementation**: `services/worldLabsService.ts`

**Existing Features**:
- Gaussian Splatting rendering (state-of-the-art)
- Real-time browser rendering (WebGL2/WebGPU)
- AI-powered structure using Gemini 2.0
- Physics, dynamic lighting, interactivity
- Generation time: 5-15 seconds
- Zero external API costs

**Enhancement Requirements**:
- Add camera position marking UI
- Implement lighting preset system
- Add location asset reusability
- Export camera data to JSON format

**Estimated Enhancement Effort**: 2-3 weeks (low complexity)

**Pros**:
- Already integrated and working
- Zero ongoing API costs
- State-of-the-art rendering quality
- Fast generation (5-15s)
- No infrastructure overhead

**Cons**:
- Limited photorealism (compared to Unreal Engine)
- May require quality improvements for production
- Camera marking UI needs custom development

---

### 2. Enhanced Procedural Service

**Current Implementation**: `services/proceduralWorldService.ts`

**Existing Features**:
- Fast generation (5-10 seconds)
- WASD + mouse navigation (working)
- Basic terrain and object placement
- Good for rapid prototyping

**Enhancement Requirements**:
- Improve visual quality (materials, lighting)
- Add camera position marker overlay
- Implement lighting preset system
- Add prop/object library

**Estimated Enhancement Effort**: 3-4 weeks (moderate complexity)

**Pros**:
- Fast generation (5-10s)
- Zero API costs
- Simple architecture
- Full control over rendering

**Cons**:
- Lower visual quality than Gaussian Splatting
- Requires significant enhancement work
- May not achieve photorealistic quality

---

### 3. Unreal Engine Pixel Streaming

**Technology**: Stream UE5 rendering to browser via WebRTC

**Features**:
- Photorealistic rendering (Nanite, Lumen)
- Full Unreal Engine capabilities
- Professional-grade quality
- Camera position marking (built-in UE tools)
- Lighting presets (UE lighting system)

**Infrastructure Requirements**:
- GPU servers (AWS, GCP, or dedicated)
- WebRTC streaming infrastructure
- Load balancing for multiple users
- Signaling server

**Estimated Cost**:
- Development: 6-8 weeks (high complexity)
- Infrastructure: $500-2000/month (1k-10k users)

**Pros**:
- Professional-grade photorealistic quality
- Full UE5 feature set (Nanite, Lumen, physics)
- Camera marking and lighting built-in

**Cons**:
- Expensive infrastructure (GPU servers)
- Complex deployment (WebRTC, load balancing)
- Latency concerns (network-dependent)
- High barrier to entry

---

### 4. Gaussian Splatting Services (Luma AI)

**Current Integration**: `services/3dWorldService.ts`

**Features**:
- Photorealistic 3D from sparse images
- GLB/GLTF export for Three.js
- API-based generation
- Professional quality output

**Cost**:
- API cost: ~$0.50/generation
- Generation time: up to 2 minutes
- Monthly cost (1k gens): $500
- Monthly cost (10k gens): $5,000

**Pros**:
- Photorealistic quality
- API-based (no infrastructure)
- GLTF export compatible with Three.js

**Cons**:
- Very expensive at scale
- Slow generation (up to 2 min)
- Requires serverless proxy (already implemented)

**Recommendation**: **Not Recommended** due to high cost. Retained for reference only.

---

### 5. Matterport-Style 3D Capture

**Technology**: 360° panorama + hotspot navigation

**Features**:
- Photo-realistic quality (real photos)
- Hotspot-based navigation
- Fast loading (image-based)
- Simple implementation

**Limitations**:
- Not true 3D (limited camera freedom)
- Hotspot navigation only (not continuous)
- Requires 360° image generation or capture

**Pros**:
- Photorealistic quality (if using photos)
- Simple implementation
- Fast loading

**Cons**:
- Limited interactivity (hotspot-only)
- Not true 3D navigation
- Camera marking complex (fixed viewpoints)

**Recommendation**: **Viable as Fallback** if true 3D fails.

---

## Evaluation Criteria and Benchmarks

### Visual Quality Scoring (25% weight)

**Filmmaker Rating** (1-10 scale, 5+ evaluators):
- **Excellent**: 9-10 (22-25 points)
- **Good**: 7-8 (17-21 points)
- **Acceptable**: 5-6 (12-16 points)
- **Poor**: <5 (0-11 points)

**Evaluation Questions**:
1. "How photorealistic is this environment?" (1-10)
2. "How immersive is the 3D experience?" (1-10)
3. "Would you use this for professional filmmaking?" (Yes/No)

---

### Performance Benchmarks (25% weight)

**FPS Measurement**:
- **Excellent**: >60fps on desktop GPU (25 points)
- **Good**: >45fps on high-end laptop (20 points)
- **Acceptable**: >30fps on mid-range laptop (15 points)
- **Poor**: >15fps (10 points)
- **Unacceptable**: <15fps (0 points)

**Test Scenarios**:
- Empty scene (baseline)
- Medium complexity (warehouse with 20 objects)
- High complexity (urban street with 100+ objects)
- Extreme complexity (forest with dense foliage)

---

### Interactivity Assessment (15% weight)

**Feature Completeness**:
- **Full**: Camera controls + marking + lighting presets (15 points)
- **Missing 1**: 2 of 3 features (10 points)
- **Missing 2**: 1 of 3 features (5 points)
- **Static**: No interactivity (0 points)

**Required Features**:
1. WASD + mouse navigation (smooth camera movement)
2. Camera position marking (A/B/C markers)
3. Lighting preset switcher (real-time application)

---

### Export Compatibility (15% weight)

**Camera Data Export**:
- **Full**: GLTF/JSON export working (15 points)
- **Partial**: Export works but needs conversion (10 points)
- **Incompatible**: Export format incompatible (0 points)

**JSON Camera Export Format**:
```json
{
  "locationId": "warehouse-01",
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

---

### Generation Speed (10% weight)

**Prompt to Explorable Environment**:
- **Excellent**: <30 seconds (10 points)
- **Good**: 30-60 seconds (7 points)
- **Acceptable**: 60-120 seconds (4 points)
- **Poor**: >120 seconds (0 points)

---

### Infrastructure Complexity (10% weight)

**Deployment Requirements**:
- **Simple**: Vercel serverless (10 points)
- **Moderate**: Requires simple server (5 points)
- **Complex**: Requires GPU servers, load balancing (0 points)

---

## Test Environment Specifications

### Environment 1: Industrial Warehouse (Interior)

**Description**:
- Large open interior space (50m × 30m × 10m high)
- Concrete floor, metal walls, exposed ceiling beams
- Props: Crates, pallets, barrels, machinery
- Doors, windows, architectural details
- Materials: Metal, concrete, glass

**Lighting Tests**:
1. **Golden Hour**: Warm sunlight through windows (side lighting)
2. **Overcast**: Soft, diffused lighting (no harsh shadows)
3. **Neon Night**: Colored artificial lighting (cyan, magenta neon)
4. **Studio**: Controlled 3-point lighting (key, fill, rim)
5. **Dramatic Low-Key**: High contrast, deep shadows

**Camera Positions to Mark**:
- A: Wide shot from entrance (establishing)
- B: Medium shot from corner (character interaction)
- C: Close-up from low angle (dramatic reveal)

---

### Environment 2: Urban Street (Exterior)

**Description**:
- City street with buildings on both sides (100m length)
- Storefronts, signage, street furniture
- Vehicles parked along curb
- Pedestrian walkways, crosswalks
- Materials: Concrete, glass, asphalt, brick

**Lighting Tests**:
1. **Golden Hour**: Low-angle sunlight (long shadows)
2. **Overcast**: Soft daylight (no shadows)
3. **Neon Night**: City lights, neon signs, streetlights
4. **Studio**: Not applicable (exterior)
5. **Dramatic Low-Key**: Nighttime with harsh streetlights

**Camera Positions to Mark**:
- A: Wide establishing shot from street level
- B: Medium shot from sidewalk (character walking)
- C: Close-up from building entrance (dialogue scene)

---

### Environment 3: Natural Forest (Outdoor)

**Description**:
- Forest clearing with surrounding trees (50m diameter)
- Deciduous trees, undergrowth, natural terrain
- Dappled sunlight through canopy
- Organic shapes and textures
- Materials: Wood, leaves, dirt, moss

**Lighting Tests**:
1. **Golden Hour**: Warm sunlight through trees (dappled light)
2. **Overcast**: Soft, even lighting (no shadows)
3. **Neon Night**: Not applicable (replaced with moonlight)
4. **Studio**: Not applicable (natural outdoor)
5. **Dramatic Low-Key**: Nighttime with moonlight filtering through trees

**Camera Positions to Mark**:
- A: Wide shot from clearing edge (establishing)
- B: Medium shot among trees (character movement)
- C: Close-up with tree trunk framing (intimate scene)

---

## Lighting Preset Specifications

### Preset 1: Golden Hour

**Time of Day**: Late afternoon (30 minutes before sunset)

**Lighting Parameters**:
- **Sun Position**: Azimuth 270°, Elevation 10-15°
- **Color Temperature**: 3500K (warm orange)
- **Intensity**: 0.8 (soft, not harsh)
- **Shadow Hardness**: Medium-soft (slight diffusion)
- **Ambient Light**: Warm orange (0.3 intensity)
- **Sky Color**: Orange-pink gradient

**Expected Visual**:
- Warm, golden tones throughout scene
- Long shadows stretching across surfaces
- Soft, flattering lighting
- Atmospheric depth

---

### Preset 2: Overcast

**Weather**: Cloudy, diffused sunlight

**Lighting Parameters**:
- **Sun Position**: Overhead (diffused, no direct sun)
- **Color Temperature**: 6500K (neutral, slightly cool)
- **Intensity**: 0.6 (even, soft)
- **Shadow Hardness**: Very soft (almost no shadows)
- **Ambient Light**: Gray-blue (0.5 intensity)
- **Sky Color**: Uniform gray

**Expected Visual**:
- Even, flat lighting
- Minimal shadows
- Desaturated colors
- Soft, clinical atmosphere

---

### Preset 3: Neon Night

**Time of Day**: Nighttime (artificial lighting only)

**Lighting Parameters**:
- **Primary Lights**: Colored neon (cyan, magenta, yellow)
- **Color Temperature**: Varies by light source
- **Intensity**: High contrast (bright neons vs. dark shadows)
- **Shadow Hardness**: Hard (sharp edges)
- **Ambient Light**: Dark blue (0.1 intensity)
- **Sky Color**: Deep blue-black

**Expected Visual**:
- High contrast (bright lights, deep shadows)
- Saturated colors (cyan, magenta dominance)
- Cyberpunk/noir aesthetic
- Atmospheric fog (optional)

---

### Preset 4: Studio

**Type**: Controlled 3-point lighting setup

**Lighting Parameters**:
- **Key Light**: 5000K, 45° angle, 0.8 intensity
- **Fill Light**: 5000K, opposite side, 0.4 intensity
- **Rim Light**: 5500K, behind subject, 0.6 intensity
- **Ambient Light**: Neutral gray (0.2 intensity)
- **Background Light**: Optional (separate control)

**Expected Visual**:
- Professional, controlled lighting
- Clear subject separation from background
- Even skin tones (if applicable)
- Minimal environmental shadows

---

### Preset 5: Dramatic Low-Key

**Type**: High contrast, film noir style

**Lighting Parameters**:
- **Primary Light**: Hard, directional (one side only)
- **Color Temperature**: 4000K (slightly warm)
- **Intensity**: High (1.0) for lit areas
- **Shadow Hardness**: Very hard (sharp edges)
- **Ambient Light**: Very low (0.05 intensity)
- **Fill Light**: None or minimal (preserve shadows)

**Expected Visual**:
- High contrast (bright highlights, deep blacks)
- Dramatic shadows (50% of frame or more)
- Film noir / thriller aesthetic
- Strong chiaroscuro effect

---

## Performance Testing Hardware

### Desktop Configuration (Target: >60fps)

**Specifications**:
- GPU: NVIDIA RTX 3060 (or equivalent AMD)
- CPU: Intel i5-11400 / AMD Ryzen 5 5600X
- RAM: 16GB DDR4
- Display: 1920×1080 @ 60Hz
- Browser: Chrome 120+

**Test Procedure**:
1. Load each environment (warehouse, street, forest)
2. Navigate for 60 seconds with WASD + mouse
3. Measure FPS (using browser DevTools or FPS counter)
4. Record average, min, max FPS
5. Monitor GPU/CPU usage

---

### High-End Laptop Configuration (Target: >45fps)

**Specifications**:
- GPU: Apple M1 Max / NVIDIA RTX 3070 Mobile
- CPU: Apple M1 Max / Intel i7-12700H
- RAM: 32GB unified / DDR5
- Display: 2560×1600 @ 120Hz / 1920×1080 @ 144Hz
- Browser: Chrome 120+ / Safari 17+

**Test Procedure**:
1. Same as desktop configuration
2. Test on battery power and AC power (compare)
3. Monitor thermal throttling

---

### Mid-Range Laptop Configuration (Target: >30fps)

**Specifications**:
- GPU: Integrated (Intel Iris Xe / AMD Radeon Graphics)
- CPU: Intel i5-1135G7 / AMD Ryzen 5 5500U
- RAM: 8GB DDR4
- Display: 1920×1080 @ 60Hz
- Browser: Chrome 120+

**Test Procedure**:
1. Same as desktop configuration
2. If FPS <30, test with quality degradation:
   - Reduce resolution (1280×720)
   - Reduce texture quality
   - Disable advanced effects (shadows, reflections)
3. Validate graceful degradation

---

## Deliverable Templates

### Technology Comparison Spreadsheet

See `epic-r2-comparison-template.csv` for full template.

**Key Columns**:
- Technology Name
- Visual Quality Score (filmmaker rating)
- Performance Score (FPS on desktop GPU)
- Interactivity Score (feature completeness)
- Export Compatibility (GLTF/JSON)
- Generation Speed (seconds)
- Infrastructure Complexity (serverless/server/GPU)
- Total Score (weighted)
- Recommendation Tier (1/2/3)

---

### Camera Export JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "3D World Camera Export",
  "type": "object",
  "properties": {
    "locationId": {
      "type": "string",
      "description": "Unique identifier for the 3D location"
    },
    "locationName": {
      "type": "string",
      "description": "Human-readable location name"
    },
    "cameraPositions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "enum": ["A", "B", "C"],
            "description": "Camera position identifier"
          },
          "label": {
            "type": "string",
            "description": "Descriptive label (e.g., 'Wide Shot - Entrance')"
          },
          "position": {
            "type": "object",
            "properties": {
              "x": { "type": "number" },
              "y": { "type": "number" },
              "z": { "type": "number" }
            },
            "required": ["x", "y", "z"]
          },
          "rotation": {
            "type": "object",
            "properties": {
              "x": { "type": "number", "description": "Pitch (degrees)" },
              "y": { "type": "number", "description": "Yaw (degrees)" },
              "z": { "type": "number", "description": "Roll (degrees)" }
            },
            "required": ["x", "y", "z"]
          },
          "fov": {
            "type": "number",
            "minimum": 10,
            "maximum": 120,
            "description": "Field of view in degrees"
          },
          "focalLength": {
            "type": "string",
            "description": "Equivalent focal length (e.g., '35mm', '50mm')"
          }
        },
        "required": ["id", "position", "rotation", "fov"]
      }
    },
    "lightingPreset": {
      "type": "string",
      "enum": ["golden-hour", "overcast", "neon-night", "studio", "dramatic-low-key"],
      "description": "Active lighting preset"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" },
        "version": { "type": "string", "default": "1.0" }
      }
    }
  },
  "required": ["locationId", "cameraPositions", "lightingPreset"]
}
```

---

## Success Criteria Checklist

Before proceeding to Epic 3 implementation:

- [ ] Technology comparison matrix complete (5+ technologies documented)
- [ ] Top 3 technologies prototyped with interactive demos
- [ ] Performance target achieved (60fps on desktop GPU for at least 1 technology)
- [ ] Visual quality rated >8/10 by filmmakers
- [ ] Camera position marking implemented and working
- [ ] Lighting presets switch in real-time (<2s)
- [ ] Camera export format validated with shot generation workflow
- [ ] User testing completed (5+ filmmakers, >8/10 usability rating)
- [ ] Final recommendation document reviewed and approved
- [ ] Stakeholder sign-off obtained (product, engineering, design)
- [ ] Backward compatibility plan documented (existing 3D worlds still work)
- [ ] Fallback strategy defined (360° panorama fallback)

---

## Risk Mitigation Strategies

### Technical Risk: No Technology Achieves 60fps

**Mitigation**:
1. **Quality presets**: Implement Draft/Standard/Ultra modes
2. **Adaptive detail**: Reduce polygon count, texture resolution dynamically
3. **Hardware targeting**: Desktop-only for high quality, mobile gets degraded version
4. **Hybrid approach**: Use simpler tech (procedural) for preview, high-quality for export

### Integration Risk: Complex UI for Camera Marking

**Mitigation**:
1. **User testing early**: Iterate on UX with filmmaker feedback
2. **Tooltips and tutorials**: Provide in-app guidance
3. **Director Agent assistance**: Voice commands for camera placement
4. **Simplified mode**: Preset camera positions (A/B/C) with one-click placement

### Cost Risk: Infrastructure Too Expensive

**Mitigation**:
1. **Browser-based solutions**: Prioritize World Labs Service (zero cost)
2. **Server fallback**: Only use GPU servers for premium tier
3. **Quality tiers**: Free users get procedural, paid users get photorealistic

---

**END OF EXECUTION ROADMAP**

*Next Actions*:
1. Assign research lead
2. Schedule kick-off meeting
3. Set up demo environments
4. Begin Week 1 activities
