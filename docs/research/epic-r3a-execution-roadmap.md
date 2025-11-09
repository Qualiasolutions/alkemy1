# Epic R3a: Voice I/O Research - Execution Roadmap

**Epic Reference**: Epic R3a: Voice I/O Research (Director Agent)
**Research Duration**: 2-3 weeks
**Target Completion**: Week 12-14 (end of research phase)
**Status**: Ready for execution

---

## Week-by-Week Breakdown

### Week 1: Technology Evaluation (Story R3a.1)

**Days 1-2: Voice Recognition Technology Research**

Evaluate 5 voice recognition services:

1. **Web Speech API** (Browser Native)
   - Test in Chrome, Firefox, Safari, Edge
   - Measure latency (utterance → transcription)
   - Test with film terminology ("f/2.8", "85mm", "over-the-shoulder")
   - Document browser compatibility

2. **Deepgram**
   - Sign up for API access
   - Test real-time streaming vs. batch processing
   - Measure latency (target: <300ms)
   - Test custom vocabulary for film terms

3. **AssemblyAI**
   - Test transcription accuracy with film jargon
   - Measure latency (~1-2s expected)
   - Evaluate punctuation and formatting

4. **OpenAI Whisper** (API)
   - Test accuracy (excellent expected)
   - Measure latency (~2-5s expected)
   - Test with accents and varied speech patterns

5. **Google Cloud Speech-to-Text**
   - Test real-time streaming
   - Measure latency and accuracy
   - Evaluate custom model training options

**Days 3-4: Voice Synthesis Technology Research**

Evaluate 5 voice synthesis services:

1. **Web Speech API TTS** (Browser Native)
   - Test quality across browsers (variable expected)
   - Measure latency (instant playback expected)
   - Test voice selection options

2. **ElevenLabs**
   - Test naturalness and prosody
   - Measure latency (text → audio playback)
   - Test voice selection and emotion control
   - Evaluate turbo model for low latency

3. **PlayHT**
   - Test quality with 600+ voice library
   - Measure latency
   - Test SSML support for emphasis/pauses

4. **Resemble AI**
   - Test real-time streaming capability
   - Measure quality and latency
   - Evaluate voice cloning features

5. **Google Cloud TTS**
   - Test WaveNet/Neural2 quality
   - Measure latency
   - Evaluate voice selection (380+ voices)

**Day 5: Round-Trip Latency Testing**

Test all combinations (5 recognition × 5 synthesis = 25 combinations):
- Measure total latency: voice input → AI processing → voice output
- Target: <5 seconds total
- Record top 5 combinations (lowest latency + highest quality)

**Deliverables**:
- Voice recognition comparison spreadsheet
- Voice synthesis comparison spreadsheet
- Round-trip latency matrix (25 combinations)
- Audio quality samples (5 synthesis services)

---

### Week 2: Film Terminology Accuracy Testing (Story R3a.2)

**Days 1-3: Test Dataset Creation and Evaluation**

Create 100-command test dataset:

**Category 1: Shot Generation Commands** (30 commands)
```
- "Generate a close-up of Sarah with 85mm lens"
- "Create a wide shot of the warehouse with golden hour lighting"
- "Make 3 variations of John in profile view with f/1.4"
- "Show me a bird's eye view of the street scene"
- "Generate an over-the-shoulder shot of the conversation"
... (25 more)
```

**Category 2: Technical Queries** (30 commands)
```
- "What's the hyperfocal distance for f/2.8 at 5 meters?"
- "Calculate depth of field for 50mm at f/1.8 focusing at 3 meters"
- "Recommend lens for an over-the-shoulder shot"
- "Explain the 180-degree rule"
- "What's the best aperture for bokeh?"
... (25 more)
```

**Category 3: Director Requests** (20 commands)
```
- "Suggest camera movement for a tense chase scene"
- "Setup lighting for a film noir mood"
- "Color grade this shot for a cyberpunk aesthetic"
- "Recommend shot list for romantic dinner scene"
... (16 more)
```

**Category 4: Character/Location Queries** (20 commands)
```
- "Show me all images of the warehouse location"
- "Generate a character sheet for Sarah"
- "Find reference images for industrial cinematography"
- "Create a moodboard for cyberpunk aesthetic"
... (16 more)
```

Test each command with top 3 voice recognition services:
- Record transcription
- Score as: Exact Match / Actionable Match / Failed Match
- Target: >90% actionable match rate

**Days 4-5: Accuracy Analysis and Workarounds**

- Identify problematic terms (e.g., "f/1.4" vs. "f one point four")
- Document custom vocabulary requirements
- Test workarounds (phonetic spelling, alternative phrasing)
- Create recommended command templates for users

**Deliverables**:
- 100-command test dataset (CSV)
- Accuracy report for top 3 services
- Problematic terms list with workarounds
- Recommended voice command templates

---

### Week 3: Final Recommendation (Story R3a.3)

**Days 1-2: Data Analysis and Scoring**

Complete scorecards:

**Voice Recognition Scorecard** (weighted criteria):
- Latency (30%): <2s = 30pts, 2-5s = 20pts, >5s = 10pts
- Film Accuracy (30%): >95% = 30pts, 90-95% = 25pts, 85-90% = 20pts
- Browser Compatibility (15%): All 4 = 15pts, 3 = 10pts, 2 = 5pts
- API Cost (10%): <$0.005/min = 10pts, <$0.01/min = 7pts
- Setup Complexity (10%): <2 steps = 10pts, 2-5 steps = 7pts
- Custom Vocabulary (5%): Available = 5pts, Not available = 0pts

**Voice Synthesis Scorecard** (weighted criteria):
- Quality (35%): >9/10 = 35pts, 8-9/10 = 28pts, 7-8/10 = 21pts
- Latency (30%): <1s = 30pts, 1-2s = 20pts, 2-5s = 10pts
- Voice Selection (15%): >100 = 15pts, 50-100 = 10pts, <50 = 5pts
- API Cost (10%): <$0.01/min = 10pts, <$0.02/min = 7pts
- Customization (10%): Pitch/Speed/Emotion = 10pts, Partial = 5pts

**Days 3-4: Final Recommendation Document**

Write recommendation document (5-7 pages):

1. **Executive Summary** (1 page)
   - Chosen voice recognition (with latency/accuracy)
   - Chosen voice synthesis (with quality samples)
   - Implementation plan

2. **Technology Comparison** (2-3 pages)
   - Voice recognition scorecard (all 5 candidates)
   - Voice synthesis scorecard (all 5 candidates)
   - Round-trip latency for top combinations
   - Film terminology accuracy report

3. **Implementation Plan** (2 pages)
   - Estimated effort (story points: <30 target)
   - API key requirements (`VOICE_INPUT_API_KEY`, `VOICE_OUTPUT_API_KEY`)
   - Service module architecture (`voiceService.ts`)
   - DirectorWidget integration approach
   - Browser compatibility notes

4. **UX Recommendations** (1 page)
   - Push-to-talk vs. always-listening (recommended: push-to-talk)
   - Visual feedback (microphone pulsing, waveform, processing spinner)
   - Error handling (permission denied, network error, timeout)
   - Microphone permission flow

5. **Cost Analysis** (1 page)
   - Development cost (5-7 weeks engineering)
   - Operational cost (1k, 10k, 100k interactions/month)
   - Break-even analysis

6. **Fallback Strategy** (1 page)
   - Primary fails → Web Speech API (free, browser-native)
   - Text-only mode always functional
   - Graceful degradation strategy

**Day 5: Stakeholder Review and Sign-Off**

- Present findings with live demo (voice input → voice output)
- Demonstrate film terminology accuracy
- Address questions
- Obtain sign-off

**Deliverables**:
- Final recommendation document (PDF)
- Live demo (voice I/O working end-to-end)
- Stakeholder presentation (slides)
- Approved technology selection

---

## Technology Candidates Summary

### Voice Recognition (Top 3 Expected)

1. **Deepgram** (Likely Winner)
   - Latency: <300ms (excellent)
   - Accuracy: High with custom vocabulary
   - Cost: $0.0043/min (affordable)
   - Pros: Fast, accurate, customizable
   - Cons: Requires API key, internet-dependent

2. **Web Speech API** (Fallback)
   - Latency: <1s (good)
   - Accuracy: Variable (browser-dependent)
   - Cost: $0 (free)
   - Pros: Zero cost, no API key, native
   - Cons: Limited customization, privacy concerns

3. **OpenAI Whisper** (High Accuracy Alternative)
   - Latency: 2-5s (acceptable)
   - Accuracy: Excellent (99 languages, robust)
   - Cost: $0.006/min (moderate)
   - Pros: Best accuracy, multilingual
   - Cons: Higher latency, requires file upload

### Voice Synthesis (Top 3 Expected)

1. **ElevenLabs** (Likely Winner)
   - Quality: 9.5/10 (extremely natural)
   - Latency: <1s with turbo model
   - Cost: $0.03/min speech (moderate)
   - Pros: Best quality, emotion control
   - Cons: Moderate cost

2. **PlayHT** (Cost-Effective Alternative)
   - Quality: 8.5/10 (high quality)
   - Latency: <1s (fast)
   - Cost: $0.01/min speech (affordable)
   - Pros: 600+ voices, lower cost
   - Cons: Slightly lower quality than ElevenLabs

3. **Web Speech TTS** (Fallback)
   - Quality: 6/10 (robotic)
   - Latency: Instant (excellent)
   - Cost: $0 (free)
   - Pros: Zero cost, instant playback
   - Cons: Poor quality, limited voices

---

## Evaluation Procedures

### Latency Measurement

**Voice Input Latency**:
```
Start timer: User finishes speaking
End timer: Transcription text available
Record: Total milliseconds
```

**Voice Output Latency**:
```
Start timer: Response text generated
End timer: Audio playback begins
Record: Total milliseconds
```

**Round-Trip Latency**:
```
Total = Voice Input + AI Processing + Voice Output
Target: <5000ms (5 seconds)
```

### Film Terminology Accuracy

**Exact Match**:
- Transcription 100% identical to expected text
- Score: 1.0

**Actionable Match**:
- Transcription accurate enough for command execution
- Example: "f/2.8" → "f 2.8" (missing slash, but actionable)
- Score: 0.5

**Failed Match**:
- Transcription unusable or incorrect
- Example: "f/2.8" → "F two point eight" (not parseable)
- Score: 0.0

**Calculation**:
```
Accuracy = (Exact Matches + Actionable Matches × 0.5) / Total Commands × 100%
Target: >90% for top service
```

### Quality Evaluation (Voice Synthesis)

**Blind Test Protocol**:
- 5-10 evaluators listen to same text spoken by all 5 services
- Randomized order (double-blind)
- Rate naturalness, prosody, clarity (1-10 scale)
- Question: "Would you want to listen to this voice for extended periods?"

**Target**: Average rating >8/10 for chosen service

---

## Success Criteria Checklist

Before proceeding to Epic 1 implementation:

- [ ] Voice recognition latency <2s validated
- [ ] Film terminology accuracy >90% achieved
- [ ] Voice synthesis quality >8/10 rated
- [ ] Round-trip latency <5s validated
- [ ] Browser compatibility confirmed (Chrome, Firefox, Safari, Edge)
- [ ] API costs sustainable (<$0.02/interaction at 10k/month)
- [ ] 100-command test dataset created and evaluated
- [ ] Problematic terms documented with workarounds
- [ ] Final recommendation document approved
- [ ] Stakeholder sign-off obtained
- [ ] Fallback strategy defined (Web Speech API)

---

**END OF EXECUTION ROADMAP**

*Next Actions*:
1. Assign research lead
2. Set up API keys for all 10 services
3. Create test dataset
4. Begin Week 1 activities
