# Research Spike: Voice I/O for Director Agent (Epic R3a)

**Epic Reference**: Epic R3a: Voice I/O Research (Director Agent)
**PRD Section**: 6. Epic Details → Research Epics → Epic R3a
**Status**: Pending
**Research Lead**: TBD
**Estimated Duration**: 2-3 weeks
**Last Updated**: 2025-11-09

---

## Research Goal

Evaluate and recommend technical approaches for voice input/output in the Director Agent widget to enable hands-free workflow in Alkemy AI Studio.

**Success Criteria**:
- Voice I/O solution with <2s latency
- >90% film terminology accuracy
- Implementation cost <30 story points
- Round-trip voice latency (command → processing → spoken response) <5s

---

## Background Context

### Current State

**DirectorWidget** (`components/DirectorWidget.tsx`) is an AI-powered cinematography assistant with:
- **Text-based chat interface** (bottom-right widget)
- **Command parsing** (`parseCommand()`)
- **Image generation commands** (via `generateStillVariants()`)
- **Technical calculations** (DOF, lens recommendations, lighting)
- **Creative assistance** (via `askTheDirector()` from `aiService.ts`)
- **Context awareness** (reads project state: script, characters, locations, scenes, moodboard, timeline)

**Problem**: Director requires typing, preventing hands-free workflow. Filmmakers working with equipment, reviewing shots, or composing scenes cannot easily interact via text.

### V2 Requirement

**FR-DA5-8** (Voice Interaction):
- Director shall accept voice input as alternative to text chat
- Director shall provide spoken responses for hands-free workflow
- Voice mode toggleable (text-only, voice-only, hybrid)
- Voice commands support full film terminology

**Non-Functional Requirement (NFR1)**: Director Agent voice command latency shall not exceed 2 seconds from utterance to action execution.

**Compatibility Requirement (CR1)**: New voice-driven capabilities shall not break existing keyboard/mouse workflows (both modes supported).

### Integration Constraints

- Must integrate with existing DirectorWidget without breaking text chat
- Voice recognition must work with existing `parseCommand()` logic
- Voice synthesis must work with existing `askTheDirector()` response flow
- Voice controls toggleable without breaking text chat (graceful degradation)
- No performance degradation when voice is disabled (zero overhead)

---

## Research Questions

### RQ1: Voice Recognition Technology Landscape
**Which voice recognition technologies meet latency and accuracy requirements?**

**Candidates to Evaluate**:

1. **Web Speech API** (Browser Native)
   - Pros: Zero cost, native browser support, no API key
   - Cons: Limited customization, browser-dependent quality, privacy concerns
   - Browser support: Chrome (excellent), Firefox (limited), Safari (good), Edge (excellent)

2. **Deepgram**
   - Pros: Low latency (<300ms), customizable vocabulary, high accuracy
   - Cons: API cost ($0.0043/min), requires API key, internet dependency
   - Features: Real-time streaming, custom models, punctuation

3. **AssemblyAI**
   - Pros: High accuracy, speaker diarization, custom vocabulary
   - Cons: API cost ($0.00025/sec = $0.015/min), higher latency (~1-2s)
   - Features: Automatic punctuation, profanity filtering, topic detection

4. **OpenAI Whisper** (via API)
   - Pros: Excellent accuracy, multilingual, robust to accents
   - Cons: Higher latency (~2-5s), API cost ($0.006/min), requires file upload
   - Features: 99 languages, automatic translation, timestamps

5. **Google Cloud Speech-to-Text**
   - Pros: High accuracy, real-time streaming, custom models
   - Cons: API cost ($0.006/15sec = $0.024/min), complex setup
   - Features: 125+ languages, speaker diarization, profanity filtering

**Evaluation Criteria**:
| Criterion | Weight | Target | Measurement |
|-----------|--------|--------|-------------|
| Latency | 30% | <2s | Utterance end → transcription |
| Film Terminology Accuracy | 30% | >90% | Test dataset evaluation |
| Browser Compatibility | 15% | Chrome, Firefox, Safari, Edge | Manual testing |
| API Cost | 10% | <$0.01/min | Cost per 1000 queries |
| Setup Complexity | 10% | <2 API keys | Integration steps |
| Customization | 5% | Custom vocabulary support | Feature availability |

**Deliverable**: Voice recognition comparison spreadsheet with latency, accuracy, cost for each technology.

---

### RQ2: Voice Synthesis Technology Landscape
**Which voice synthesis technologies deliver natural-sounding, low-latency output?**

**Candidates to Evaluate**:

1. **Web Speech API TTS** (Browser Native)
   - Pros: Zero cost, native browser support, instant playback
   - Cons: Robotic quality, limited voice selection, browser-dependent
   - Browser support: Chrome (good), Firefox (basic), Safari (excellent), Edge (good)

2. **ElevenLabs**
   - Pros: Extremely natural quality, voice cloning, emotion control
   - Cons: API cost ($0.18/1k chars ≈ $0.03/min speech), requires API key
   - Features: 29+ languages, voice design, turbo model for low latency

3. **PlayHT**
   - Pros: High quality, extensive voice library (600+ voices), low latency
   - Cons: API cost ($0.06/1k chars ≈ $0.01/min speech)
   - Features: Voice cloning, multilingual, SSML support

4. **Resemble AI**
   - Pros: High quality, voice cloning, emotion control, real-time streaming
   - Cons: API cost (varies, ~$0.05/min), complex setup
   - Features: Real-time synthesis, voice marketplace, prosody control

5. **Google Cloud Text-to-Speech**
   - Pros: High quality (WaveNet/Neural2), extensive language support
   - Cons: API cost ($16/1M chars ≈ $0.08/min speech), setup complexity
   - Features: 380+ voices, SSML, audio profiles

**Evaluation Criteria**:
| Criterion | Weight | Target | Measurement |
|-----------|--------|--------|-------------|
| Quality (Naturalness) | 35% | >8/10 rating | Blind human evaluation |
| Latency | 30% | <1s | Text → audio playback start |
| Voice Selection | 15% | 10+ voices | Available voice count |
| API Cost | 10% | <$0.02/min | Cost per 1000 responses |
| Customization | 10% | Pitch, speed, emotion control | Feature availability |

**Deliverable**: Voice synthesis comparison spreadsheet with quality samples, latency, cost for each technology.

---

### RQ3: Film Terminology Accuracy Testing
**Can voice recognition accurately transcribe film-specific jargon?**

**Test Dataset** (Story R3a.2):
Create 100 filmmaker commands across 4 categories:

1. **Shot Generation Commands** (30 commands)
   - "Generate a close-up of Sarah with 85mm lens"
   - "Create a wide shot of the warehouse with golden hour lighting"
   - "Make 3 variations of John in profile view with f/1.4"

2. **Technical Queries** (30 commands)
   - "What's the hyperfocal distance for f/2.8 at 5 meters?"
   - "Calculate depth of field for 50mm at f/1.8 focusing at 3 meters"
   - "Recommend lens for an over-the-shoulder shot"

3. **Director Requests** (20 commands)
   - "Suggest camera movement for a tense chase scene"
   - "Setup lighting for a film noir mood"
   - "Color grade this shot for a cyberpunk aesthetic"

4. **Character/Location Queries** (20 commands)
   - "Show me all images of the warehouse location"
   - "Generate a character sheet for Sarah"
   - "Find reference images for industrial cinematography"

**Problematic Terms** (anticipated):
- **Aperture values**: "f/1.4", "f/2.8", "f/16" (vs. "F 1.4", "f one point four")
- **Focal lengths**: "24mm", "50mm", "85mm" (vs. "twenty-four millimeters")
- **Camera angles**: "over-the-shoulder", "bird's-eye view", "Dutch angle"
- **Character names**: Custom names from user scripts (e.g., "Zephyr", "Kaelen")
- **Technical jargon**: "bokeh", "hyperfocal", "key light", "practical"

**Accuracy Metrics**:
- **Exact Match**: Transcription 100% correct (target: >50%)
- **Actionable Match**: Transcription accurate enough for command execution (target: >90%)
- **Failed Match**: Transcription unusable (target: <10%)

**Deliverable**: Accuracy report for top 3 voice recognition solutions with breakdown by command category.

---

### RQ4: Round-Trip Latency Testing
**Can the complete voice workflow meet <5s total latency?**

**Latency Breakdown**:
1. **Voice Input Latency** (<2s target)
   - User speaks command → Voice recognition starts
   - Voice recognition → Transcription available
2. **AI Processing Latency** (~1-2s)
   - Transcription → `parseCommand()` execution
   - `executeCommand()` → AI processing (e.g., `askTheDirector()`)
   - AI response → Response text available
3. **Voice Output Latency** (<1s target)
   - Response text → Voice synthesis starts
   - Voice synthesis → Audio playback begins

**Test Scenarios**:
1. **Simple Query**: "What's the hyperfocal distance for f/2.8 at 5 meters?"
   - Expected: Math calculation, fast response
2. **Image Generation**: "Generate 3 images of John in the warehouse"
   - Expected: Async operation, Director confirms command but doesn't wait for completion
3. **Creative Advice**: "Suggest camera movement for a tense chase scene"
   - Expected: AI reasoning, longer response

**Target**: Total latency <5s for all scenarios (voice input + AI processing + voice output).

**Deliverable**: Latency breakdown spreadsheet for top 3 voice I/O combinations (recognition + synthesis).

---

### RQ5: Browser Compatibility and UX
**Which technologies work reliably across all target browsers?**

**Target Browsers**:
- Chrome 90+ (primary)
- Firefox 88+
- Safari 14+
- Edge 90+

**UX Considerations**:
1. **Microphone Permissions**
   - How does each browser handle mic permission prompts?
   - Can permission state be cached?
   - What happens when permission is denied?

2. **Push-to-Talk vs. Always-Listening**
   - Push-to-talk: User clicks button, speaks, releases (safer, more control)
   - Always-listening: Wake word or continuous listening (hands-free, privacy concerns)

3. **Visual Feedback**
   - Listening state: Pulsing microphone icon, waveform animation
   - Processing state: Spinner, "thinking" indicator
   - Speaking state: Director avatar animation, audio waveform

4. **Error Handling**
   - Microphone not available → clear error message
   - Network error → fallback to text input
   - Recognition timeout → "I didn't catch that, please try again"
   - Misrecognized command → Director asks for clarification

**Deliverable**: Browser compatibility matrix and UX recommendation document.

---

## Proof-of-Concept Plan (Story R3a.1)

### PoC Objectives
1. Test top 3 voice recognition solutions with film terminology dataset
2. Test top 3 voice synthesis solutions with quality evaluation
3. Measure round-trip latency for all combinations (9 total)
4. Validate browser compatibility
5. Prototype DirectorWidget integration (voice input + text chat side-by-side)

### PoC Scope
**In Scope**:
- Voice input transcription → `parseCommand()` logic
- Voice output synthesis → `askTheDirector()` response flow
- Latency measurement (automated + manual)
- Film terminology accuracy testing (100-command dataset)
- Browser compatibility testing (Chrome, Firefox, Safari, Edge)

**Out of Scope**:
- Full UI integration with production DirectorWidget (isolated prototype)
- Custom vocabulary training (unless required for accuracy)
- Multilingual support (English only for PoC)
- Production deployment (local/dev environment only)

### PoC Environment
- **Development**: Local dev environment with test API keys
- **Testing Framework**: Custom test harness for accuracy measurement
- **Evaluation**: 5+ filmmakers test voice commands, provide feedback

### PoC Deliverables
1. **Working Prototypes**: 3 voice input prototypes + 3 voice output prototypes (9 combinations)
2. **Accuracy Report**: Film terminology accuracy for all 100 test commands
3. **Latency Spreadsheet**: Round-trip latency for all 9 voice I/O combinations
4. **Quality Samples**: Audio files demonstrating voice synthesis quality for each service
5. **Browser Compatibility Matrix**: Success/fail for each browser × technology combination
6. **Integration Demo**: Isolated DirectorWidget prototype with voice I/O working end-to-end

---

## Decision Framework

### Voice Recognition Scorecard

| Technology | Latency (30%) | Film Accuracy (30%) | Browser Compat (15%) | API Cost (10%) | Setup (10%) | Custom Vocab (5%) | **Total** |
|------------|---------------|---------------------|----------------------|----------------|-------------|-------------------|-----------|
| Web Speech API | ___ / 30 | ___ / 30 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 5 | ___ / 100 |
| Deepgram | ___ / 30 | ___ / 30 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 5 | ___ / 100 |
| AssemblyAI | ___ / 30 | ___ / 30 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 5 | ___ / 100 |
| OpenAI Whisper | ___ / 30 | ___ / 30 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 5 | ___ / 100 |
| Google Cloud STT | ___ / 30 | ___ / 30 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 5 | ___ / 100 |

### Voice Synthesis Scorecard

| Technology | Quality (35%) | Latency (30%) | Voice Selection (15%) | API Cost (10%) | Customization (10%) | **Total** |
|------------|---------------|---------------|-----------------------|----------------|---------------------|-----------|
| Web Speech TTS | ___ / 35 | ___ / 30 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| ElevenLabs | ___ / 35 | ___ / 30 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| PlayHT | ___ / 35 | ___ / 30 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| Resemble AI | ___ / 35 | ___ / 30 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |
| Google Cloud TTS | ___ / 35 | ___ / 30 | ___ / 15 | ___ / 10 | ___ / 10 | ___ / 100 |

### Recommendation Tiers

**Tier 1: Recommended**
- Voice recognition score ≥70, voice synthesis score ≥70
- Meets latency targets (<2s input, <1s output, <5s round-trip)
- Film terminology accuracy >90%
- Browser compatibility: all 4 browsers supported

**Tier 2: Viable with Caveats**
- Combined score ≥50
- Meets most requirements with acceptable trade-offs
- May require workarounds (e.g., custom vocabulary, browser-specific fallbacks)

**Tier 3: Not Recommended**
- Combined score <50
- Fails critical requirements (latency >5s, accuracy <80%, limited browser support)
- Showstoppers identified

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Voice I/O latency >5s** | Medium | High | Prioritize low-latency services (Deepgram, ElevenLabs), implement streaming |
| **Film terminology accuracy <90%** | Medium | High | Custom vocabulary training, Director clarification prompts |
| **Browser compatibility issues** | High | Medium | Graceful degradation to Web Speech API, fallback to text chat |
| **API costs unsustainable** | Medium | Medium | Usage quotas, tier-based limits, Web Speech API fallback for free tier |
| **Voice recognition fails in noisy environments** | High | Medium | Push-to-talk mode (default), noise cancellation (if supported) |
| **Voice synthesis sounds robotic** | Medium | Low | Use premium services (ElevenLabs, PlayHT), allow voice selection |

### Integration Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Breaking text chat functionality** | Low | High | Extensive testing, voice as optional enhancement (not replacement) |
| **Voice state conflicts with text input** | Medium | Medium | Clear UI state management, disable voice when typing |
| **Microphone permission blocked** | High | Low | Clear permission prompt, fallback to text chat |
| **Voice commands misinterpreted** | High | Medium | Director asks for clarification, show transcription before execution |

---

## Cost Projections

### Development Cost
- **Research & PoC**: 2-3 weeks (1 engineer)
- **Implementation (Epic 1, Stories 1.1-1.2)**: 2-3 weeks (1 engineer)
- **Testing & QA**: 1 week (1 engineer + QA)
- **Total Development**: 5-7 weeks engineering time

### Operational Cost (Monthly Estimates)

**Scenario: 1,000 Voice Interactions/Month** (average 30s/interaction = 500 min/month)

| Voice Recognition | Voice Synthesis | Recognition Cost | Synthesis Cost | Total/Month |
|-------------------|-----------------|------------------|----------------|-------------|
| Web Speech API | Web Speech TTS | $0 | $0 | **$0** |
| Web Speech API | ElevenLabs | $0 | $15 | **$15** |
| Deepgram | ElevenLabs | $2.15 | $15 | **$17.15** |
| Deepgram | PlayHT | $2.15 | $5 | **$7.15** |
| AssemblyAI | PlayHT | $7.50 | $5 | **$12.50** |
| OpenAI Whisper | ElevenLabs | $3 | $15 | **$18** |

**Scenario: 10,000 Voice Interactions/Month** (5,000 min/month)

| Voice Recognition | Voice Synthesis | Recognition Cost | Synthesis Cost | Total/Month |
|-------------------|-----------------|------------------|----------------|-------------|
| Web Speech API | Web Speech TTS | $0 | $0 | **$0** |
| Web Speech API | ElevenLabs | $0 | $150 | **$150** |
| Deepgram | ElevenLabs | $21.50 | $150 | **$171.50** |
| Deepgram | PlayHT | $21.50 | $50 | **$71.50** |
| AssemblyAI | PlayHT | $75 | $50 | **$125** |
| OpenAI Whisper | ElevenLabs | $30 | $150 | **$180** |

**Note**: Web Speech API (free) is viable for cost-sensitive scenarios, but quality may be lower.

---

## Final Recommendation Document (Story R3a.3)

### Required Contents

1. **Executive Summary** (1 page)
   - Chosen voice recognition solution with latency/accuracy benchmarks
   - Chosen voice synthesis solution with quality samples
   - Implementation plan and resource requirements

2. **Technology Comparison** (2-3 pages)
   - Voice recognition scorecard with all candidates
   - Voice synthesis scorecard with all candidates
   - Round-trip latency breakdown for top combinations
   - Film terminology accuracy report (100-command dataset)

3. **Implementation Plan** (2 pages)
   - Estimated effort (story points/time)
   - API key requirements (new environment variables)
   - Browser compatibility notes (fallback strategies)
   - Service module architecture (`voiceService.ts`)
   - DirectorWidget integration approach (no separate component)

4. **UX Recommendations** (1 page)
   - Push-to-talk vs. always-listening (recommended mode)
   - Visual feedback during listening/processing/speaking
   - Error handling for misrecognized commands
   - Microphone permission flow

5. **Cost Analysis** (1 page)
   - Development cost (team hours)
   - Operational cost projections (1k, 10k, 100k interactions/month)
   - Break-even analysis and tier-based access recommendations

6. **Fallback Strategy** (1 page)
   - Primary approach fails → Web Speech API (free, browser-native)
   - Criteria for fallback (API unavailable, cost exceeded, browser incompatible)
   - Graceful degradation (text-only mode always functional)

7. **Stakeholder Sign-Off**
   - Product Manager approval
   - Engineering Lead approval
   - UX/Accessibility approval

---

## Success Criteria Validation

### Before Proceeding to Epic 1 Implementation

- [ ] Final recommendation document completed and reviewed
- [ ] Voice recognition latency <2s validated with test dataset
- [ ] Film terminology accuracy >90% achieved
- [ ] Voice synthesis quality >8/10 rated by evaluators
- [ ] Round-trip latency <5s validated across all test scenarios
- [ ] Browser compatibility confirmed (Chrome, Firefox, Safari, Edge)
- [ ] API costs sustainable (<$0.02/interaction at 10k/month scale)
- [ ] DirectorWidget integration approach validated (no breaking changes to text chat)
- [ ] Stakeholder sign-off obtained (product, engineering, UX)
- [ ] Fallback strategy defined and validated (Web Speech API always works)

---

## Appendix: Reference Resources

### Existing Alkemy Components
- `components/DirectorWidget.tsx` - Current text-based Director Agent
- `services/aiService.ts` - `askTheDirector()` function for AI responses
- `services/directorKnowledge.ts` - Cinematography knowledge base

### Voice Recognition APIs
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- Deepgram: https://deepgram.com/
- AssemblyAI: https://www.assemblyai.com/
- OpenAI Whisper: https://platform.openai.com/docs/guides/speech-to-text
- Google Cloud STT: https://cloud.google.com/speech-to-text

### Voice Synthesis APIs
- Web Speech TTS: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
- ElevenLabs: https://elevenlabs.io/
- PlayHT: https://play.ht/
- Resemble AI: https://www.resemble.ai/
- Google Cloud TTS: https://cloud.google.com/text-to-speech

### Browser Compatibility
- Can I Use - Web Speech API: https://caniuse.com/speech-recognition
- MDN Browser Compatibility Data: https://github.com/mdn/browser-compat-data

### Film Terminology Resources
- American Cinematographer Manual (reference for jargon)
- Film Glossary: https://www.studiobinder.com/blog/ultimate-guide-to-camera-shots/
- Cinematography.com Forums (common terminology usage)

---

**END OF SPIKE PLAN**

*Next Steps: Assign research lead, allocate 2-3 weeks for execution, schedule review meeting for final recommendation.*
