# Research Spike: Audio Production (Epic R3b)

**Epic Reference**: Epic R3b: Audio Production Research (Music, Sound, Mixing)
**PRD Section**: 6. Epic Details → Research Epics → Epic R3b
**Status**: Pending
**Research Lead**: TBD
**Estimated Duration**: 2-3 weeks
**Last Updated**: 2025-11-09

---

## Research Goal

Evaluate and recommend technical approaches for AI music composition, sound effects generation, and real-time audio mixing in the timeline for Alkemy AI Studio.

**Success Criteria**:
- Audio production solution with <30s music generation
- Professional mix quality (>8/10 filmmaker rating)
- Implementation cost <40 story points
- Real-time audio mixing supports projects up to 30 minutes

---

## Background Context

### Current State

Alkemy currently has **video-only timeline** capabilities:
- **Timeline editing** (`tabs/FramesTab.tsx`)
- **FFmpeg.wasm rendering** (`services/videoRenderingService.ts`)
- **Video clip management** (`TimelineClip` type)
- **Wan motion transfer** (`services/wanService.ts`)

**Problem**: No audio production capabilities. Filmmakers must:
- Use external tools (Ableton, Logic Pro, Audacity) for music composition
- Manually source foley/SFX from libraries
- Mix audio separately and combine with video
- Export/import between multiple platforms

**Missing Features**:
- Music composition (emotion-based, genre-flexible)
- Sound effects generation (foley, ambient, environmental)
- Multi-stem audio mixing (dialogue, music, effects)
- Timeline audio integration (waveform visualization, level controls)

### V2 Requirement

**FR-VO1-6** (Voice & Dialogue Production):
- Character voice consistency, multilingual synthesis, lip-sync
- Voice casting via Director Agent
- Dialogue audio integration with timeline clips

**FR-AU1-6** (Sound, Music & Effects):
- Automatic music scoring matched to scene emotion and genre
- Ambient sound, foley, environmental audio generation
- Professional audio balancing and mixing
- Multiple mix versions exportable (master, dialogue-only, music-only, alt language)
- Multi-stem timeline editing (dialogue, music, effects as separate tracks)
- Real-time audio playback during timeline editing

**FR-TL4** (Timeline & Assembly Enhancement):
- Audio mixing with waveform visualization and level controls

**Non-Functional Requirements**:
- **NFR6**: Music composition shall generate emotionally appropriate scores in <30 seconds
- **NFR7**: Timeline audio mixing shall support real-time playback without buffering for projects up to 30 minutes

**Compatibility Requirements**:
- **CR5**: Voice & dialogue shall integrate with existing timeline clips without changing `TimelineClip` data model
- **CR6**: Audio mixing shall preserve existing video rendering pipeline (FFmpeg.wasm)

### Integration Constraints

- Must integrate with existing timeline architecture (`FramesTab`, `TimelineClip` type)
- Must preserve existing FFmpeg.wasm for final render (WebAudio for preview, FFmpeg for export)
- Audio files must store in Supabase Storage or blob URLs (follow existing pattern)
- Music generation must not block UI (async with progress callbacks)
- Backward compatibility: projects without audio still render correctly

---

## Research Questions

### RQ1: AI Music Composition Services
**Which AI music services support emotion-based generation and stem export?**

**Candidates to Evaluate**:

1. **Suno**
   - Pros: High quality, emotion control, genre variety
   - Cons: Limited API access, subscription model
   - Features: Lyric generation, vocal synthesis, stem export (limited)

2. **Udio**
   - Pros: High quality, professional-grade output, emotion/mood control
   - Cons: API availability unclear, potentially expensive
   - Features: Genre flexibility, customizable structures

3. **Stable Audio**
   - Pros: Open model, self-hostable, fast generation
   - Cons: Quality variable, limited emotion control
   - Features: Stem generation, commercial licensing clear

4. **Soundful**
   - Pros: API available, royalty-free, emotion tagging
   - Cons: Quality moderate, limited customization
   - Features: Loop-based, genre presets, unlimited downloads

5. **AIVA** (Artificial Intelligence Virtual Artist)
   - Pros: Professional orchestral quality, emotion control
   - Cons: Expensive ($50+/month), complex API
   - Features: MIDI export, stem separation, composer styles

6. **Mubert**
   - Pros: Real-time generation, API available, affordable
   - Cons: Repetitive patterns, limited emotional depth
   - Features: Duration control, mood tags, royalty-free

**Evaluation Criteria**:
| Criterion | Weight | Target | Measurement |
|-----------|--------|--------|-------------|
| Emotion Accuracy | 30% | >8/10 rating | Human evaluation (5+ emotions tested) |
| Genre Flexibility | 20% | 5+ genres | Orchestral, Electronic, Ambient, Rock, Jazz |
| Stem Export | 15% | Separate instrument tracks | Drums, bass, melody, etc. exportable |
| Generation Speed | 15% | <30s for 1-min track | Timed tests |
| API Cost | 10% | <$0.20/generation | Cost per 1000 generations |
| Licensing | 10% | Royalty-free commercial use | Terms review |

**Deliverable**: Music composition comparison spreadsheet with quality samples, stem export validation, cost analysis.

---

### RQ2: Foley and Sound Effects Solutions
**Are foley/SFX generation services mature enough for production use?**

**Candidates to Evaluate**:

1. **AI-Generated SFX**:
   - **AudioStack**: AI-generated sound effects
   - **ElevenLabs Sound Effects**: Text-to-SFX (if available)
   - **Stable Audio**: SFX mode (fast, open model)

2. **Curated SFX Libraries**:
   - **Freesound.org**: Free, user-uploaded, CC-licensed
   - **Epidemic Sound**: Subscription ($15/month), professional quality
   - **Artlist**: Subscription ($30/month), unlimited downloads
   - **AudioJungle**: Pay-per-asset, extensive variety

3. **Hybrid Approach**:
   - AI generation for ambient/environmental sounds
   - Curated libraries for specific foley (footsteps, doors, etc.)

**Evaluation Criteria**:
| Criterion | Weight | Target | Measurement |
|-----------|--------|--------|-------------|
| Quality | 35% | >7/10 rating | Human evaluation |
| Variety | 25% | 10+ categories | Footsteps, doors, ambient, explosions, nature, etc. |
| Speed | 15% | <10s per SFX | Generation or search time |
| Cost | 15% | <$0.05/SFX | API cost or subscription amortization |
| Licensing | 10% | Royalty-free commercial use | Terms review |

**Deliverable**: Foley/SFX comparison spreadsheet with quality samples, variety assessment, cost analysis.

---

### RQ3: WebAudio API for Real-Time Mixing
**Can WebAudio API handle real-time multi-stem mixing in-browser?**

**Technical Requirements**:
- **Load 3+ audio tracks** (dialogue, music, effects)
- **Independent volume controls** (0-100% sliders)
- **Real-time playback** with mixing (all tracks audible simultaneously)
- **Waveform visualization** for each track
- **Timeline synchronization** (audio synced with video playback)
- **Seek/scrub support** (jump to arbitrary timestamp)

**Performance Targets** (NFR7):
- **Playback latency**: <100ms
- **Project duration**: Up to 30 minutes
- **Memory usage**: <500MB for 30-min project with 3 audio tracks
- **CPU load**: <50% on mid-range laptop during playback

**Test Scenarios**:
1. **Simple Project**: 5-minute video with 3 audio tracks (dialogue, music, ambient)
2. **Complex Project**: 30-minute video with 5 audio tracks (dialogue, music, foley, ambient, SFX)
3. **Real-Time Editing**: Adjust levels, scrub timeline, trim clips while playing

**Browser Compatibility**:
- Chrome 90+ (primary)
- Firefox 88+
- Safari 14+
- Edge 90+

**Deliverable**: WebAudio API prototype demonstrating real-time mixing, performance benchmarks, browser compatibility report.

---

### RQ4: Voice Synthesis for Dialogue Production
**Which voice synthesis services support character consistency, emotion, and multilingual output?**

**Note**: This overlaps with Epic R3a (Voice I/O Research). Coordinate findings.

**Candidates** (from R3a):
- **ElevenLabs**: Extremely natural, voice cloning, emotion control, multilingual
- **PlayHT**: Extensive voice library (600+ voices), low latency, SSML support
- **Resemble AI**: Voice cloning, emotion control, real-time streaming
- **Google Cloud TTS**: WaveNet/Neural2, 380+ voices, SSML support

**Additional Evaluation for Dialogue** (beyond R3a):
- **Character voice consistency**: Same voice across multiple dialogue clips
- **Emotion control**: Happy, sad, angry, neutral, surprised performance
- **Multilingual support**: Translation + voice synthesis in 5+ languages
- **Lip-sync capability**: Viseme data or phoneme timestamps for animation
- **Batch generation**: Generate 10+ dialogue clips efficiently

**Deliverable**: Voice synthesis recommendation (coordinated with R3a findings) with dialogue-specific feature validation.

---

### RQ5: Audio Storage and Bandwidth
**What are storage/bandwidth implications for audio assets?**

**Audio File Sizes** (estimates):
- **Music (1-minute track, MP3 128kbps)**: ~1MB
- **Music (1-minute track, WAV 44.1kHz stereo)**: ~10MB
- **Dialogue (30-second clip, MP3 128kbps)**: ~500KB
- **Foley/SFX (5-second clip, WAV)**: ~500KB
- **Multi-stem music (4 stems × 1-minute, WAV)**: ~40MB

**Project Size Estimates**:
- **5-minute film** (1 music track, 10 dialogue clips, 20 SFX): ~30MB audio
- **30-minute film** (5 music tracks, 100 dialogue clips, 100 SFX): ~200MB audio

**Storage Scenarios**:
1. **localStorage**: 5-10MB quota → **NOT viable for audio-heavy projects**
2. **Supabase Storage**: 1GB free tier, $0.021/GB/month → **viable for cloud persistence**
3. **Blob URLs (temporary)**: No persistence, browser memory only → **viable for anonymous mode with cleanup**

**Bandwidth Implications**:
- **Upload**: User uploads reference videos/audio (one-time, variable size)
- **Download**: Generated music/dialogue/SFX (per-generation, ~1-10MB each)
- **Streaming**: Real-time playback during editing (buffered, ~128kbps)

**Deliverable**: Storage/bandwidth cost analysis for 10, 100, 1000 projects with audio.

---

### RQ6: Audio Export and FFmpeg Integration
**How does audio mixing integrate with existing FFmpeg.wasm video rendering?**

**Current FFmpeg Workflow** (`videoRenderingService.ts`):
1. Load video clips as input files
2. Apply concatenation filter
3. Encode to MP4/WebM/MOV with h264/h265/vp9 codec
4. Export final video file

**Audio Integration Requirements**:
1. **Load audio tracks** (dialogue, music, effects) as input files
2. **Mix audio** using FFmpeg filters (`amix`, `amerge`, `volume`)
3. **Sync audio with video** (align timestamps)
4. **Export final video+audio** file

**FFmpeg Audio Mixing Commands** (example):
```bash
ffmpeg -i video.mp4 -i dialogue.mp3 -i music.mp3 -i effects.mp3 \
  -filter_complex "[1:a]volume=1.0[a1];[2:a]volume=0.6[a2];[3:a]volume=0.8[a3];[a1][a2][a3]amix=inputs=3:duration=longest[aout]" \
  -map 0:v -map "[aout]" -c:v copy -c:a aac output.mp4
```

**Test Scenarios**:
1. **Video + 1 audio track** (music only)
2. **Video + 3 audio tracks** (dialogue, music, effects with independent levels)
3. **Multiple video clips** with audio (concatenate video + audio simultaneously)

**Performance Considerations**:
- FFmpeg.wasm audio encoding speed (real-time vs. faster-than-real-time)
- Memory usage with multiple audio tracks
- Browser limitations (WebAssembly memory limits)

**Deliverable**: FFmpeg audio mixing prototype, performance benchmarks, integration guide.

---

## Proof-of-Concept Plan (Story R3b.1 & R3b.2)

### PoC Objectives
1. **Evaluate 5+ AI music composition services** with emotion/genre testing
2. **Evaluate 3+ foley/SFX solutions** (AI-generated vs. curated libraries)
3. **Build WebAudio API multi-stem mixing prototype** with 3+ tracks
4. **Test FFmpeg.wasm audio rendering** with mixed audio tracks
5. **Measure performance** (generation speed, mixing latency, export speed)

### PoC Scope
**In Scope**:
- Music composition: emotion-based generation, genre flexibility, stem export
- Foley/SFX: quality evaluation, variety assessment, cost analysis
- WebAudio API: real-time mixing, waveform visualization, timeline sync
- FFmpeg.wasm: audio track mixing, final video+audio export
- Performance benchmarking (latency, memory, CPU)

**Out of Scope**:
- Full UI integration with production timeline (isolated prototype)
- Voice synthesis (covered in R3a, coordinate findings)
- Multilingual dialogue (defer to Epic 4 implementation)
- Production deployment (local/dev environment only)

### PoC Environment
- **Development**: Local dev environment with test API keys
- **Testing Framework**: Custom test harness for performance measurement
- **Evaluation**: 5+ filmmakers test music/SFX quality, provide feedback

### PoC Deliverables
1. **Music Composition Samples**: 5 emotions × 5 genres = 25 samples from top 3 services
2. **Foley/SFX Library**: 50+ sound effects across 10 categories
3. **WebAudio API Prototype**: Working multi-stem mixer with waveform visualization
4. **FFmpeg Audio Mixing Demo**: Video+audio export with 3 mixed tracks
5. **Performance Spreadsheet**: Generation speed, mixing latency, export speed, memory usage
6. **Quality Evaluation Report**: Filmmaker ratings, qualitative feedback

---

## Decision Framework

### Music Composition Scorecard

| Service | Emotion Accuracy (30%) | Genre Flexibility (20%) | Stem Export (15%) | Gen Speed (15%) | API Cost (10%) | Licensing (10%) | **Total** |
|---------|------------------------|-------------------------|-------------------|-----------------|----------------|-----------------|-----------|
| Suno | ___ / 30 | ___ / 20 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| Udio | ___ / 30 | ___ / 20 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| Stable Audio | ___ / 30 | ___ / 20 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| Soundful | ___ / 30 | ___ / 20 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| AIVA | ___ / 30 | ___ / 20 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| Mubert | ___ / 30 | ___ / 20 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |

### Foley/SFX Scorecard

| Solution | Quality (35%) | Variety (25%) | Speed (15%) | Cost (15%) | Licensing (10%) | **Total** |
|----------|---------------|---------------|-------------|------------|-----------------|-----------|
| AudioStack (AI) | ___ / 35 | ___ / 25 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 100 |
| ElevenLabs SFX (AI) | ___ / 35 | ___ / 25 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 100 |
| Stable Audio SFX (AI) | ___ / 35 | ___ / 25 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 100 |
| Freesound.org | ___ / 35 | ___ / 25 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 100 |
| Epidemic Sound | ___ / 35 | ___ / 25 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 100 |
| Artlist | ___ / 35 | ___ / 25 | ___ / 15 | ___ / 15 | ___ / 10 | ___ / 100 |

### Recommendation Tiers

**Tier 1: Recommended**
- Music score ≥70, Foley/SFX score ≥70
- Meets performance targets (<30s music generation, real-time mixing for 30min projects)
- Licensing clear (royalty-free commercial use)

**Tier 2: Viable with Caveats**
- Combined score ≥50
- Meets most requirements with acceptable trade-offs
- May require hybrid approach (AI + curated libraries)

**Tier 3: Not Recommended**
- Combined score <50
- Fails critical requirements (generation >60s, poor quality, licensing unclear)
- Showstoppers identified

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Music generation >30s** | Medium | Medium | Prioritize fast services (Stable Audio, Mubert), implement progress indicators |
| **AI music quality insufficient** | Medium | High | Use professional services (AIVA, Udio), allow manual upload fallback |
| **Stem export unavailable** | High | Medium | Hybrid approach (AI for full mix, manual stems if needed), defer stems to V2.2 |
| **WebAudio API performance issues** | Medium | High | Implement quality presets (reduce sample rate/bitrate), lazy load audio tracks |
| **FFmpeg.wasm audio encoding slow** | High | Medium | Benchmark early, consider server-side rendering for >10min projects |
| **Audio storage exceeds localStorage quota** | High | High | Require Supabase for audio-heavy projects, fallback to temporary blob URLs |

### Integration Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Breaking existing timeline** | Low | High | Extensive testing, audio as additive enhancement (video-only still works) |
| **Timeline UI cluttered with audio controls** | Medium | Medium | Collapsible audio mixer panel, progressive disclosure |
| **Audio/video sync drift** | High | High | Validate sync with test videos, use FFmpeg precise timestamp alignment |
| **Browser audio playback blocked** | Medium | Low | Prompt user to enable audio, graceful fallback to silent preview |

---

## Cost Projections

### Development Cost
- **Research & PoC**: 2-3 weeks (1 engineer)
- **Implementation (Epic 5)**: 5-7 weeks (1-2 engineers)
- **Voice/Dialogue (Epic 4)**: 3-4 weeks (1 engineer) - *separate epic*
- **Testing & QA**: 2 weeks (1 engineer + QA)
- **Total Development**: 12-16 weeks engineering time (Epics 4 + 5 combined)

### Operational Cost (Monthly Estimates)

**Scenario: 1,000 Films Produced/Month** (average 5min/film, 1 music track + 10 dialogue clips + 20 SFX)

| Service Combination | Music Cost | Dialogue Cost | SFX Cost | Storage Cost | Total/Month |
|---------------------|------------|---------------|----------|--------------|-------------|
| Stable Audio + ElevenLabs + Freesound | $200 | $300 | $0 | $20 | **$520** |
| AIVA + PlayHT + Epidemic Sound | $500 | $100 | $150 | $20 | **$770** |
| Mubert + Google TTS + AudioStack | $100 | $50 | $200 | $20 | **$370** |
| Udio + ElevenLabs + Artlist | $400 | $300 | $300 | $20 | **$1,020** |

**Scenario: 10,000 Films Produced/Month**

| Service Combination | Music Cost | Dialogue Cost | SFX Cost | Storage Cost | Total/Month |
|---------------------|------------|---------------|----------|--------------|-------------|
| Stable Audio + ElevenLabs + Freesound | $2,000 | $3,000 | $0 | $200 | **$5,200** |
| AIVA + PlayHT + Epidemic Sound | $5,000 | $1,000 | $1,500 | $200 | **$7,700** |
| Mubert + Google TTS + AudioStack | $1,000 | $500 | $2,000 | $200 | **$3,700** |
| Udio + ElevenLabs + Artlist | $4,000 | $3,000 | $3,000 | $200 | **$10,200** |

**Note**: Costs are estimates and subject to change. Hybrid approach (AI + curated libraries) may optimize cost/quality trade-off.

---

## Final Recommendation Document (Story R3b.3)

### Required Contents

1. **Executive Summary** (1 page)
   - Chosen music composition service with quality samples
   - Chosen foley/SFX solution (AI vs. library vs. hybrid)
   - WebAudio API mixing architecture design
   - Implementation plan and resource requirements

2. **Technology Comparison** (3-4 pages)
   - Music composition scorecard with all candidates
   - Foley/SFX scorecard with all candidates
   - Quality samples (audio files for 5 emotions × 5 genres)
   - Stem export validation (if available)

3. **Audio Mixing Architecture** (2 pages)
   - WebAudio API for real-time preview (browser-based)
   - FFmpeg.wasm for final render with mixed audio (export)
   - State management for audio stems (dialogue, music, effects)
   - Timeline integration approach (waveform visualization, level controls)

4. **Storage Strategy** (1 page)
   - Supabase Storage for generated audio (when configured)
   - Blob URL fallback for localStorage-only mode (temporary, with cleanup)
   - Storage quota management (prevent localStorage overflow)
   - Cost projections (1k, 10k, 100k projects with audio)

5. **Implementation Plan** (2-3 pages)
   - Estimated effort (story points/time)
   - API key requirements (new environment variables: `MUSIC_API_KEY`, etc.)
   - New dependencies (audio processing libraries, if needed)
   - Service module architecture:
     - `musicService.ts` (music composition)
     - `voiceService.ts` (dialogue synthesis) - *coordinated with R3a*
     - `audioMixingService.ts` (WebAudio API + FFmpeg integration)
   - Data model extensions:
     - `TimelineClip` type (add audio track references)
     - `AudioStem` type (dialogue, music, effects metadata)

6. **Cost Analysis** (1 page)
   - Development cost (team hours, calendar time)
   - Operational cost projections (1k, 10k, 100k films/month)
   - Break-even analysis and tier-based access recommendations

7. **Integration Verification** (1 page)
   - Audio services integrate via serverless proxy pattern (`/api/music-proxy`)
   - Timeline audio mixing preserves existing video rendering workflow
   - Backward compatibility (projects without audio still render correctly)
   - No breaking changes to `TimelineClip` type (audio is additive)

8. **Stakeholder Sign-Off**
   - Product Manager approval
   - Engineering Lead approval
   - Audio/Music expert approval (if available)

---

## Success Criteria Validation

### Before Proceeding to Epic 4 & 5 Implementation

- [ ] Final recommendation document completed and reviewed
- [ ] Music composition service generates <30s for 1-min track (NFR6)
- [ ] Music quality rated >8/10 by filmmakers (emotion accuracy)
- [ ] Foley/SFX solution provides 10+ categories with >7/10 quality
- [ ] WebAudio API prototype supports real-time playback for 30-min projects (NFR7)
- [ ] FFmpeg.wasm audio mixing validated (3+ tracks mixed successfully)
- [ ] Storage strategy defined (Supabase + blob URL fallback)
- [ ] API costs sustainable (<$1/film at 10k/month scale)
- [ ] Stakeholder sign-off obtained (product, engineering, audio expert)
- [ ] Backward compatibility plan documented (video-only projects still work)

---

## Appendix: Reference Resources

### Existing Alkemy Services
- `services/videoRenderingService.ts` - FFmpeg.wasm video rendering
- `tabs/FramesTab.tsx` - Timeline editing UI
- `types.ts` - `TimelineClip` type definition

### AI Music Composition Services
- Suno: https://www.suno.ai/
- Udio: https://www.udio.com/
- Stable Audio: https://stability.ai/stable-audio
- Soundful: https://soundful.com/
- AIVA: https://www.aiva.ai/
- Mubert: https://mubert.com/

### Foley/SFX Services
- AudioStack: https://www.audiostack.ai/
- ElevenLabs: https://elevenlabs.io/ (check SFX features)
- Stable Audio: https://stability.ai/stable-audio
- Freesound: https://freesound.org/
- Epidemic Sound: https://www.epidemicsound.com/
- Artlist: https://artlist.io/

### Voice Synthesis Services (from R3a)
- ElevenLabs: https://elevenlabs.io/
- PlayHT: https://play.ht/
- Resemble AI: https://www.resemble.ai/
- Google Cloud TTS: https://cloud.google.com/text-to-speech

### Browser APIs
- WebAudio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- MediaStream API: https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API
- AudioContext: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext

### FFmpeg Resources
- FFmpeg.wasm: https://github.com/ffmpegwasm/ffmpeg.wasm
- FFmpeg Audio Filters: https://ffmpeg.org/ffmpeg-filters.html#Audio-Filters
- FFmpeg Mixing Guide: https://trac.ffmpeg.org/wiki/AudioChannelManipulation

### Music Theory Resources
- Film Music Composition Techniques: https://www.masterclass.com/articles/film-scoring-guide
- Emotion in Music: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2755150/
- Sound Design for Film: https://www.soundsnap.com/blog/sound-design-for-film

---

**END OF SPIKE PLAN**

*Next Steps: Assign research lead, allocate 2-3 weeks for execution, coordinate with Epic R3a (Voice I/O) for voice synthesis findings, schedule review meeting for final recommendation.*
