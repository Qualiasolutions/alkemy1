# Epic R3b: Audio Production Proof-of-Concept Requirements

**Epic**: Epic R3b - Audio Production Research
**Document Type**: PoC Requirements
**Last Updated**: 2025-11-09

---

## Prototype Goals

Build working prototypes of music composition, sound effects generation, and real-time audio mixing to validate feasibility for the Alkemy timeline.

---

## Music Composition Prototypes

### Test Scenarios
Generate music for 5 different scene types:
1. **Tense Thriller** - 90s orchestral, suspenseful
2. **Romantic Drama** - 60s piano, emotional
3. **Action Sequence** - 120s electronic, energetic
4. **Horror Scene** - 45s ambient, dark
5. **Comedy Moment** - 30s upbeat, playful

### Prototypes to Build
- **Suno API Integration**: Emotion + genre-based generation
- **Udio API Integration**: Professional composition with stem export
- **MusicGen Fallback**: Free option for cost-conscious users

### Success Criteria
- Generation speed: <30s per track
- Emotion accuracy: >80% match (blind evaluation by 5 people)
- Stem export: Separate drums, bass, melody tracks
- Quality rating: >8/10 overall

---

## Sound Effects Prototypes

### Test SFX Library (20 sounds)
1. Footsteps (concrete, wood, gravel)
2. Door sounds (open, close, creak)
3. Car engine (start, idle, rev)
4. Ambient city (traffic, voices, sirens)
5. Ambient nature (birds, wind, forest)
6. Impact sounds (punch, crash, glass)
7. Weather (rain, thunder, wind)
8. Mechanical (typing, clicking, beeping)

### Prototypes to Build
- **ElevenLabs SFX API**: AI-generated sound effects
- **AudioCraft (Meta)**: Free alternative
- **Freesound Library Integration**: Pre-built SFX catalog

### Success Criteria
- SFX quality: >7/10 rating
- Generation speed: <10s per effect
- Variety: >100 unique sounds across categories

---

## WebAudio API Mixing Prototype

### Prototype Features
- Load 3 audio tracks (dialogue, music, SFX)
- Independent volume sliders (0-100%)
- Real-time playback with mixing
- Waveform visualization for each track
- Timeline sync (seek/scrub support)

### Test Cases
1. 3-track mixing (dialogue + music + ambient)
2. 5-track mixing (dialogue + music + footsteps + door + city ambient)
3. 30-minute project playback (stress test)

### Success Criteria
- Playback latency: <100ms
- FPS during playback: >30fps
- Memory usage: <500MB for 30-minute project
- Browser support: Chrome, Firefox, Safari, Edge

---

## Integration Architecture

### Audio Service Proxies
- `/api/music-proxy` - Serverless function for music API
- `/api/sfx-proxy` - Serverless function for SFX API
- Follow existing proxy pattern (CORS-safe, API key security)

### Storage Strategy
- Generated audio → Supabase Storage (when configured)
- Fallback → blob URLs (localStorage-only mode)
- Cleanup strategy for temporary audio

### Timeline Integration
- Audio clips use existing `TimelineClip` data model
- WebAudio for preview, FFmpeg.wasm for final export
- Multi-stem support (dialogue, music, effects tracks)

---

## Deliverables

1. Music composition prototypes (3 services)
2. Sound effects prototypes (3 approaches)
3. WebAudio API mixer prototype
4. Performance benchmarks spreadsheet
5. Audio sample library (test outputs)
6. Integration architecture design document
7. Cost analysis (development + operational)
8. Final recommendation report

---

**END OF DOCUMENT**
