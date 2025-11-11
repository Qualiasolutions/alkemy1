# Research Spike: 3D World Generation (Epic R2)

**Epic Reference**: Epic R2: 3D World Generation Research
**PRD Section**: 6. Epic Details → Research Epics → Epic R2
**Status**: Pending
**Research Lead**: TBD
**Estimated Duration**: 2-3 weeks
**Last Updated**: 2025-11-09

---

## Research Goal

Evaluate and recommend the optimal technical approach for creating explorable 3D location environments with camera position marking and lighting preview in Alkemy AI Studio.

**Success Criteria**:
- Technology recommendation with 60fps performance benchmark on target hardware
- Implementation cost <50 story points
- Visual quality >8/10 rating from filmmakers
- Camera position export compatible with existing shot generation workflow

---

## Background Context

### Current State

Alkemy currently has **three 3D world generation services**:

1. **World Labs Service** (`services/worldLabsService.ts`)
   - **Recommended/Primary**: Enterprise-grade, inspired by World Labs AI (Fei-Fei Li)
   - Gaussian Splatting rendering
   - Real-time browser rendering (WebGL2/WebGPU)
   - AI-powered structure using Gemini 2.0
   - Physics, dynamic lighting, interactivity
   - Generation time: 5-15 seconds
   - Zero external API costs (uses existing Gemini API)

2. **Procedural World Service** (`services/proceduralWorldService.ts`)
   - **Legacy/Simpler Alternative**: Fast, basic 3D generation
   - WASD + mouse navigation
   - Basic terrain and object placement
   - Good for rapid prototyping
   - Generation time: 5-10 seconds

3. **Luma 3D World Service** (`services/3dWorldService.ts`)
   - **Legacy/Not Recommended**: Expensive, slow
   - Luma AI Dream Machine API integration
   - Serverless proxy (`/api/luma-proxy`)
   - GLB/GLTF models for Three.js
   - Generation time: up to 2 minutes
   - High API costs

**Current UI**: `tabs/ThreeDWorldsTab.tsx` with enterprise-focused interface for text/image input and quality selection.

**Problem**:
- Existing services lack **camera position marking** UI
- No **lighting preset system** (Golden Hour, Overcast, Neon, Studio)
- Limited **reusability** as location assets across projects
- No export to shot generation workflow (camera data → `Frame` type)

### V2 Requirement

**FR-3D1-7**:
- Explorable 3D location environments in navigable space
- Camera positions (A/B/C angles) markable and savable
- Lighting conditions previewable and adjustable
- Location environments reusable as assets
- Set design elements adjustable
- Standard navigation controls (WASD + mouse)
- Camera position data exports to shot generation workflow

**Non-Functional Requirement (NFR3)**: 3D environment navigation shall maintain 60fps on target hardware (desktop with modern GPU).

**Compatibility Requirement (CR3)**: 3D location environments shall export compatible formats for existing compositing workflow.

### Integration Constraints

- Must render via Three.js or compatible WebGL/WebGPU renderer
- Camera position data must export as JSON compatible with existing `Frame` type
- Lighting presets must map to existing shot generation parameters
- Must preserve existing 3D world tab functionality (legacy procedural worlds still work)
- Performance acceptable with all other features active (voice, audio, analytics)

---

## Research Questions

### RQ1: Technology Landscape
**What 3D world generation and rendering technologies are available, and what are their trade-offs?**

**Candidates to Evaluate**:
1. **Existing World Labs Service** (RECOMMENDED - already implemented)
   - Gaussian Splatting rendering
   - Browser-based with WebGL2/WebGPU
   - AI-powered structure (Gemini 2.0)
   - Physics, lighting, interactivity
   - Zero external API costs

2. **Enhanced Procedural Service** (existing + camera marking + lighting)
   - Fast generation (5-10s)
   - WASD + mouse navigation (already working)
   - Extend with camera position markers
   - Add lighting preset system

3. **Unreal Engine Pixel Streaming**
   - Photorealistic rendering
   - Unreal Engine 5 Nanite/Lumen
   - Streamed to browser via WebRTC
   - Requires dedicated server infrastructure

4. **Unreal Engine WebAssembly Builds**
   - Compile Unreal to WebAssembly
   - Runs entirely in browser
   - Large download size (~500MB+)
   - Experimental technology (2025)

5. **Gaussian Splatting Services**
   - Luma AI (existing integration)
   - NeRF Studio / Nerfstudio
   - 3D Gaussian Splatting (3DGS)
   - Photorealistic from sparse images

6. **Matterport-style 3D Capture**
   - 360° panorama stitching
   - Hotspot navigation (not true 3D)
   - Photo-realistic quality
   - Requires real-world capture or AI generation

**Evaluation Criteria**:
| Criterion | Weight | Target | Measurement |
|-----------|--------|--------|-------------|
| Visual Quality | 25% | >8/10 filmmaker rating | User testing + blind comparisons |
| Performance (FPS) | 25% | 60fps on desktop GPU | FPS measurement in demos |
| Interactivity | 15% | Camera controls + marking | Feature completeness |
| Export Compatibility | 15% | GLTF/JSON camera data | Integration testing |
| Generation Speed | 10% | <60s prompt → 3D | Timed tests |
| Infrastructure Complexity | 10% | Vercel serverless compatible | Deployment validation |

**Deliverable**: Technology comparison matrix with pros/cons for each candidate.

---

### RQ2: Visual Quality and Filmmaker Experience
**Which technologies deliver photorealistic quality and intuitive navigation?**

**Test Environments** (Story R2.2):
1. **Industrial Warehouse** (interior)
   - Large open space with props
   - Metal, concrete, glass materials
   - Doors, windows, architectural details

2. **Urban Street** (exterior)
   - Buildings, storefronts, vehicles
   - Pedestrian traffic, signage
   - Day/night lighting variations

3. **Natural Forest** (outdoor)
   - Trees, foliage, terrain
   - Dappled sunlight, shadows
   - Organic shapes and textures

**Lighting Presets to Test**:
- **Golden Hour**: Warm, low-angle sunlight
- **Overcast**: Soft, diffused lighting
- **Neon Night**: Colored artificial lighting
- **Studio**: Controlled 3-point lighting
- **Dramatic Low-Key**: High contrast, shadows

**Navigation Controls**:
- WASD + mouse (FPS-style)
- Click-to-move (point-and-click)
- Touchscreen gestures (mobile, if applicable)

**Deliverable**: Interactive demo links for all 3 environments × 5 lighting presets = 15 total demos.

---

### RQ3: Performance Benchmarks
**Can the top 3 technologies achieve 60fps on target hardware?**

**Target Hardware**:
1. **Desktop with RTX 3060** (or equivalent): >60fps target
2. **High-end Laptop (M1 Max)**: >45fps target
3. **Mid-range Laptop**: >30fps target OR graceful quality degradation

**Performance Metrics**:
- **FPS**: Frames per second during navigation
- **Load Time**: Time from prompt to explorable environment
- **Memory Usage**: RAM/VRAM consumption
- **CPU/GPU Load**: Utilization percentages

**Test Scenarios**:
- Empty scene (baseline)
- Medium complexity (warehouse with 20 objects)
- High complexity (urban street with 100+ objects)
- Extreme complexity (forest with dense foliage)

**Deliverable**: Performance spreadsheet with FPS measurements across all hardware tiers and complexity levels.

---

### RQ4: Camera Position Marking and Export
**Can camera position data be captured and exported to shot generation workflow?**

**Camera Position Marking UI**:
- Click to place marker (A, B, C positions)
- Camera POV saved (position, rotation, FOV)
- Visual marker in 3D space (sphere, camera icon)
- Edit/delete markers
- Naming/labeling (e.g., "Wide Shot - Entrance")

**Export Format**:
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

**Integration with Shot Generation**:
1. Export camera position from 3D world
2. Import into `SceneAssemblerTab` for shot generation
3. Use position/rotation/FOV to generate matching image/video
4. Validate visual consistency (3D preview vs. generated shot)

**Deliverable**: Proof-of-concept demonstrating camera export → shot generation workflow.

---

### RQ5: Lighting Preset System
**Can lighting conditions be previewed and adjusted in real-time?**

**Lighting Preset Requirements**:
- **Preset Library**: 5+ presets (Golden Hour, Overcast, Neon, Studio, etc.)
- **Real-time Application**: <2s to switch presets
- **Visual Fidelity**: Noticeable and accurate lighting changes
- **Export to Shot Generation**: Lighting data compatible with image generation prompts

**Lighting Parameters** (for each preset):
- **Sun/Moon Position**: Azimuth, elevation
- **Color Temperature**: Kelvin value (warm/cool)
- **Intensity**: Brightness multiplier
- **Ambient Light**: Global illumination color/intensity
- **Shadow Hardness**: Sharp vs. soft shadows
- **Fog/Atmosphere**: Haze, volumetric lighting

**Deliverable**: Interactive demo with 5+ lighting presets applied to 3 test environments.

---

### RQ6: Character Identity Integration (Cross-Epic)
**Can 3D environments integrate with character identity system for in-world character previews?**

**Note**: This is a **stretch goal** pending Epic R1 completion.

**Integration Scenario**:
1. Generate 3D location environment
2. Place character (with identity) in 3D space
3. Preview character appearance in different lighting/angles
4. Generate final shots from marked camera positions

**Deliverable** (if Epic R1 complete): Proof-of-concept video showing character in 3D environment with consistent appearance across angles/lighting.

---

## Proof-of-Concept Plan (Story R2.2)

### PoC Objectives
1. Build interactive demos of top 3 technologies
2. Test 3 environments (Warehouse, Street, Forest) with 5 lighting presets each
3. Implement camera position marking UI
4. Measure performance on all target hardware tiers
5. Gather filmmaker feedback (usability, quality)

### PoC Scope
**In Scope**:
- 3D environment generation and navigation
- Camera position marking and export (JSON format)
- Lighting preset switching (real-time)
- Performance benchmarking (FPS, load time)
- User testing (5+ filmmakers per technology)

**Out of Scope**:
- Full UI integration with existing `ThreeDWorldsTab` (focus on isolated demos)
- Character integration (deferred to Epic R1 completion)
- Set design tools (prop placement, layout editing)
- Production-scale deployment (local/dev environment only)

### PoC Environment
- **Development**: Local dev environment with `.env.local` API keys
- **Testing Framework**: Custom performance monitoring with FPS counters
- **User Testing**: Remote user testing sessions with screen recording

### PoC Deliverables
1. **Interactive Demos**: 3 isolated demos (one per technology) with all test environments
2. **Performance Spreadsheet**: FPS, load time, memory usage across hardware tiers
3. **User Feedback Report**: Usability ratings, qualitative feedback, feature requests
4. **Camera Export PoC**: Working demo of camera position export → shot generation integration

---

## Decision Framework

### Technology Selection Scorecard

| Technology | Visual Quality (25%) | Performance (25%) | Interactivity (15%) | Export Compat (15%) | Gen Speed (10%) | Infra Complexity (10%) | **Total Score** |
|------------|----------------------|-------------------|---------------------|---------------------|-----------------|------------------------|-----------------|
| World Labs Service | ___ / 25 | ___ / 25 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| Enhanced Procedural | ___ / 25 | ___ / 25 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| Unreal Pixel Streaming | ___ / 25 | ___ / 25 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| Unreal WebAssembly | ___ / 25 | ___ / 25 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| Gaussian Splatting | ___ / 25 | ___ / 25 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| Matterport-style | ___ / 25 | ___ / 25 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |

**Scoring Rubric**:
- **Visual Quality**: (User rating / 10) * 25
- **Performance**: 25 if >60fps, 20 if >45fps, 15 if >30fps, 10 if >15fps, 0 if <15fps
- **Interactivity**: 15 if full camera + marking + lighting, 10 if missing 1 feature, 5 if missing 2+, 0 if static
- **Export Compat**: 15 if GLTF/JSON export works, 10 if partial, 0 if incompatible
- **Gen Speed**: 10 if <30s, 7 if <60s, 4 if <120s, 0 if >120s
- **Infra Complexity**: 10 if Vercel serverless, 5 if requires server, 0 if complex infrastructure

### Recommendation Tiers

**Tier 1: Recommended**
- Total score ≥70
- Meets all critical requirements (60fps, camera export, lighting presets)
- Vercel serverless compatible (or simple infrastructure)

**Tier 2: Viable with Caveats**
- Total score ≥50
- Meets most requirements with acceptable trade-offs
- May require additional infrastructure or development

**Tier 3: Not Recommended**
- Total score <50
- Fails critical requirements (FPS <30, incompatible export, complex infrastructure)
- Showstoppers identified

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **No technology achieves 60fps on mid-range hardware** | Medium | Medium | Implement quality presets (Draft/Standard/Ultra), adaptive detail |
| **Photorealistic quality requires expensive infrastructure** | High | High | Prioritize browser-based solutions (World Labs, Enhanced Procedural) over Unreal Pixel Streaming |
| **Lighting presets don't integrate with shot generation** | Medium | Medium | Define lighting parameter mapping early, validate with image generation tests |
| **Camera export format incompatible with existing workflow** | Low | Medium | Early integration testing with `generateStillVariants()`, adjust format as needed |
| **3D worlds too complex for localStorage persistence** | High | Low | Store 3D models in Supabase, fallback to temporary generation |
| **Character integration breaks 3D rendering** | Medium | Low | Decouple character preview as optional enhancement (not critical for V2.1) |

### Integration Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Breaking changes to existing 3D worlds tab** | Medium | High | Extensive backward compatibility testing, feature flag rollout |
| **Performance degradation with all features active** | High | Medium | Benchmark with voice + audio + analytics running simultaneously |
| **Complex UI for camera marking** | Medium | Medium | User testing early, iterate on UX, provide tutorial/tooltips |
| **Lighting presets confuse users** | Low | Low | Clear preset names, visual previews, Director Agent guidance |

---

## Cost Projections

### Development Cost
- **Research & PoC**: 2-3 weeks (1 engineer)
- **Implementation (Epic 3)**: 4-6 weeks (1-2 engineers)
- **Testing & QA**: 1 week (1 engineer + QA)
- **Total Development**: 7-10 weeks engineering time

### Operational Cost (Monthly Estimates)

**Scenario: 1,000 3D World Generations/Month**

| Technology | API Cost | Infrastructure Cost | Total/Month |
|------------|----------|---------------------|-------------|
| World Labs Service | $0 (uses Gemini API) | $0 (browser-based) | **$0** |
| Enhanced Procedural | $0 (local generation) | $0 (browser-based) | **$0** |
| Unreal Pixel Streaming | $0 (no API) | $500 (dedicated servers) | **$500** |
| Unreal WebAssembly | $0 (no API) | $50 (CDN hosting) | **$50** |
| Gaussian Splatting (Luma) | $500 (@ $0.50/gen) | $0 (API-based) | **$500** |
| Matterport-style | $300 (@ $0.30/gen) | $0 (API-based) | **$300** |

**Scenario: 10,000 3D World Generations/Month**

| Technology | API Cost | Infrastructure Cost | Total/Month |
|------------|----------|---------------------|-------------|
| World Labs Service | $0 (uses Gemini API) | $0 (browser-based) | **$0** |
| Enhanced Procedural | $0 (local generation) | $0 (browser-based) | **$0** |
| Unreal Pixel Streaming | $0 (no API) | $2,000 (server scaling) | **$2,000** |
| Unreal WebAssembly | $0 (no API) | $100 (CDN bandwidth) | **$100** |
| Gaussian Splatting (Luma) | $5,000 (@ $0.50/gen) | $0 (API-based) | **$5,000** |
| Matterport-style | $3,000 (@ $0.30/gen) | $0 (API-based) | **$3,000** |

**Note**: World Labs Service is clearly the most cost-effective option at $0/month operational cost.

---

## Final Recommendation Document (Story R2.3)

### Required Contents

1. **Executive Summary** (1 page)
   - Chosen technology and justification
   - Performance benchmarks (FPS on target hardware)
   - Visual quality samples (screenshots/videos)
   - Implementation timeline and resource requirements

2. **Technology Comparison** (2-3 pages)
   - Detailed scorecard with all evaluated technologies
   - Visual quality comparison gallery (3 environments × 5 lighting presets)
   - Performance benchmarks (FPS, load time, memory)
   - User feedback summary (usability ratings, quotes)

3. **Implementation Roadmap** (2 pages)
   - **Phase 1**: Core navigation and rendering
   - **Phase 2**: Camera position marking
   - **Phase 3**: Lighting presets
   - **Phase 4**: Advanced features (props, physics, set design)
   - Estimated effort per phase (story points/time)

4. **Integration Plan** (1-2 pages)
   - Camera export format specification (JSON schema)
   - Lighting preset → shot generation parameter mapping
   - Character identity integration (if R1 complete)
   - Backward compatibility strategy (existing projects)

5. **Fallback Strategy** (1 page)
   - Primary approach fails → what's the backup plan?
   - Simplified fallback: Static 360° panorama with hotspot markers
   - Criteria for triggering fallback (e.g., FPS <30, generation time >2min)

6. **Cost Analysis** (1 page)
   - Development cost (team hours, calendar time)
   - Operational cost projections (1k, 10k, 100k generations/month)
   - Infrastructure requirements (servers, CDN, API keys)

7. **Stakeholder Sign-Off**
   - Product Manager approval
   - Engineering Lead approval
   - Design/UX approval

---

## Success Criteria Validation

### Before Proceeding to Epic 3 Implementation

- [ ] Final recommendation document completed and reviewed
- [ ] Technology choice achieves 60fps on desktop GPU (NFR3)
- [ ] Visual quality rated >8/10 by filmmakers
- [ ] Camera position export validated with shot generation workflow
- [ ] Lighting presets work in real-time (<2s switch)
- [ ] Infrastructure requirements acceptable (Vercel serverless OR simple server setup)
- [ ] User testing shows >8/10 navigation usability rating
- [ ] Stakeholder sign-off obtained (product, engineering, design)
- [ ] Backward compatibility plan documented (existing 3D worlds still work)
- [ ] Fallback strategy defined and validated

---

## Appendix: Reference Resources

### Existing Alkemy Services
- `services/worldLabsService.ts` - World Labs-inspired service (recommended)
- `services/proceduralWorldService.ts` - Procedural generation (fast, simple)
- `services/3dWorldService.ts` - Luma AI integration (expensive, slow)
- `components/3DWorldViewer.tsx` - 3D rendering component
- `tabs/ThreeDWorldsTab.tsx` - Current UI

### Academic Papers
- 3D Gaussian Splatting for Real-Time Radiance Field Rendering (Kerbl et al., 2023)
- NeRF: Neural Radiance Fields (Mildenhall et al., 2020)
- Instant Neural Graphics Primitives (Müller et al., 2022)

### Commercial Services
- Luma AI: https://lumalabs.ai/ (Gaussian Splatting, 3D capture)
- Matterport: https://matterport.com/ (3D capture and tours)
- Unreal Engine Pixel Streaming: https://docs.unrealengine.com/5.0/en-US/pixel-streaming-in-unreal-engine/

### Open Source Projects
- Three.js: https://threejs.org/ (WebGL renderer)
- Gaussian Splatting Viewer: https://github.com/antimatter15/splat
- Nerfstudio: https://github.com/nerfstudio-project/nerfstudio

### Browser APIs
- WebGL 2.0: https://www.khronos.org/webgl/
- WebGPU: https://www.w3.org/TR/webgpu/ (emerging standard)

---

**END OF SPIKE PLAN**

*Next Steps: Assign research lead, allocate 2-3 weeks for execution, schedule review meeting for final recommendation.*
