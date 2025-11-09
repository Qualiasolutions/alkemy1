# Epic R3a: Voice I/O Proof-of-Concept Requirements

**Epic**: Epic R3a - Voice I/O Research
**Document Type**: PoC Requirements
**Last Updated**: 2025-11-09

---

## Prototype Goals

Build working prototypes of the top 3 voice recognition + top 2 voice synthesis solutions to validate real-world performance with the Director Agent workflow.

---

## Prototype Requirements

### Voice Recognition Prototypes

**Prototype 1: Web Speech API**
- Browser-based voice recognition (Chrome/Edge native)
- DirectorWidget integration (transcription → text input)
- Test with 20 filmmaker commands from test dataset
- Measure latency and accuracy

**Prototype 2: Deepgram**
- API-based voice recognition via `/api/voice-proxy`
- Real-time streaming recognition
- Custom vocabulary for film terminology
- Test with 20 filmmaker commands

**Prototype 3: OpenAI Whisper**
- API-based transcription via OpenAI API
- Batch processing (record → upload → transcribe)
- Test with 20 filmmaker commands

### Voice Synthesis Prototypes

**Prototype 1: ElevenLabs**
- Text-to-speech via `/api/voice-proxy`
- Multiple voice options
- Emotional prosody testing
- Playback in DirectorWidget

**Prototype 2: Web Speech TTS**
- Browser-native text-to-speech
- Voice selection (if available)
- Quality comparison with ElevenLabs

---

## Test Dataset

### Filmmaker Commands (20 examples)
1. "Generate a close-up of Sarah with an 85mm lens"
2. "Create three wide shots of the warehouse location"
3. "What's the hyperfocal distance for f/2.8 at five meters?"
4. "Show me all images of John's character"
5. "Apply golden hour lighting to scene twelve"
6. "Calculate depth of field for f/1.4 at two meters with a 50mm lens"
7. "Suggest camera movement for a tense chase scene"
8. "Generate music for scene five, tense thriller genre"
9. "Add footstep sound effects to shot seven"
10. "Check continuity in the warehouse scene"
11. "Analyze color consistency across all shots"
12. "Export the project as a 1080p MP4"
13. "Create a three-point lighting setup for the interior"
14. "Generate dialogue for scene three"
15. "Show me the analytics dashboard"
16. "Publish this film to the gallery"
17. "Recommend a lens for an intimate conversation scene"
18. "What's the best time of day for outdoor shooting?"
19. "Mix the audio tracks with auto-ducking"
20. "Generate three variations of this shot"

---

## Success Criteria

### Voice Recognition
- Latency: <2s from utterance end to transcription available
- Accuracy: >90% actionable match rate (command can be executed correctly)
- Film terminology: >85% accuracy on technical terms (lenses, cameras, lighting)

### Voice Synthesis
- Latency: <1.5s from text to audio playback start
- Quality: >8/10 rating (naturalness, prosody, clarity)
- Intelligibility: >95% of words clearly understood

### Round-Trip Test
- Complete cycle (voice command → AI processing → voice response): <5s total

---

## Deliverables

1. Working prototypes (3 voice recognition, 2 voice synthesis)
2. Performance data spreadsheet (latency, accuracy, quality scores)
3. Audio samples (recordings of test commands + responses)
4. Integration complexity report (LOC, dependencies, setup steps)
5. Cost analysis (development effort + operational costs per 1000 queries)
6. Final recommendation document

---

**END OF DOCUMENT**
