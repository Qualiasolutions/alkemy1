# Story 1.1: Voice Input Integration

**Epic**: Epic 1 - Director Agent Voice Enhancement
**PRD Reference**: Section 6, Epic 1, Story 1.1
**Status**: Not Started
**Priority**: High (V2.0 Core Feature)
**Estimated Effort**: 8 story points
**Dependencies**: Epic R3a (Voice I/O Research) must be completed first
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** speak commands to the Director Agent,
**So that** I can work hands-free while composing shots.

---

## Business Value

**Problem Statement**:
Filmmakers working with equipment, reviewing shots on large displays, or composing scenes away from their keyboard cannot easily interact with the Director Agent via text chat. This breaks workflow continuity and forces them to return to their workstation to ask questions or request generations.

**Value Proposition**:
Voice input enables hands-free workflow, allowing filmmakers to:
- Request shot generations while adjusting lighting
- Ask technical questions while reviewing footage on a monitor
- Control the platform while physically moving around a set or workspace
- Improve accessibility for users with mobility limitations

**Success Metric**: >70% of filmmakers use voice input at least once per session after feature launch.

---

## Acceptance Criteria

### AC1: Microphone Button UI
**Given** the DirectorWidget is rendered,
**When** I view the chat input area,
**Then** I should see a microphone button with the following states:
- **Idle**: Gray microphone icon (default)
- **Listening**: Pulsing red microphone icon with animated waveform
- **Processing**: Spinning loader icon
- **Error**: Error icon with tooltip explaining the issue

**Verification**:
- Visual inspection in all 4 states
- Screenshot testing with Playwright (if test suite is implemented)

---

### AC2: Voice Input Workflow (Push-to-Talk Mode)
**Given** microphone permissions are granted,
**When** I click the microphone button (or press keyboard shortcut),
**Then** the following should occur:
1. Voice recognition starts immediately
2. Visual feedback changes to "Listening" state (pulsing red icon + waveform)
3. I speak my command (e.g., "Generate a close-up of Sarah with 85mm lens")
4. Visual feedback changes to "Processing" state (spinner)
5. Transcription appears in the chat input field (editable text)
6. I can either:
   - Submit the command (press Enter or click "Send" button)
   - Edit the transcription before submitting
   - Clear the input and try again

**Verification**:
- Manual testing with 10 test commands from voice-io-spike.md test dataset
- Verify transcription accuracy >90% for film terminology
- Verify latency <2s from utterance end to transcription display

---

### AC3: Film Terminology Recognition Accuracy
**Given** the voice recognition service from Epic R3a research is integrated,
**When** I speak commands containing film-specific jargon,
**Then** the transcription should accurately recognize:
- Aperture values (e.g., "f/1.4", "f/2.8", "f/16")
- Focal lengths (e.g., "24mm", "50mm", "85mm")
- Camera angles (e.g., "over-the-shoulder", "bird's-eye view", "Dutch angle")
- Character names from the current script
- Technical terms (e.g., "bokeh", "hyperfocal", "key light", "practical")

**Target**: >90% actionable match rate (transcription accurate enough for command execution)

**Verification**:
- Test with 100-command dataset from Epic R3a research (see `docs/research/voice-io-spike.md`)
- Measure exact match, actionable match, and failed match rates
- Document problematic terms and workarounds

---

### AC4: Voice Mode Settings
**Given** I access the DirectorWidget settings menu,
**When** I configure voice input preferences,
**Then** I should see the following options:
- **Push-to-Talk** (default): Click button to start/stop listening
- **Always-Listening** (experimental): Continuous listening with wake word (if supported by chosen service)
- **Text-Only**: Disable voice input entirely (microphone button hidden)

**Additional Requirements**:
- Always-Listening mode displays privacy warning on first enable
- Voice mode preference persists across sessions (saved to localStorage: `alkemy_voice_mode_preference`)
- Settings accessible via gear icon in DirectorWidget header

**Verification**:
- Test each mode switch and verify localStorage persistence
- Verify privacy warning displays only once for Always-Listening mode

---

### AC5: Cross-Tab Voice Input
**Given** voice input is enabled,
**When** I navigate to different tabs (Script, Moodboard, Compositing, Timeline, etc.),
**Then** voice input should work consistently across all tabs where DirectorWidget is active.

**Verification**:
- Test voice commands in 5+ different tabs
- Verify DirectorWidget context awareness (e.g., "Generate this shot" references current tab context)

---

### AC6: Error Handling - Microphone Permission Denied
**Given** I have not granted microphone permissions,
**When** I click the microphone button,
**Then** the following should occur:
1. Browser prompts for microphone permission
2. If denied:
   - Error icon appears with tooltip: "Microphone access denied. Please enable in browser settings."
   - Link to browser-specific instructions (Chrome, Firefox, Safari, Edge)
   - Fallback to text chat remains functional
3. If granted:
   - Proceed with normal voice input workflow (AC2)

**Verification**:
- Test in all 4 target browsers (Chrome, Firefox, Safari, Edge)
- Verify clear error messaging and graceful degradation

---

### AC7: Error Handling - Network Error
**Given** voice recognition service is unavailable (network error, API failure),
**When** I attempt to use voice input,
**Then** the following should occur:
1. Error icon appears with tooltip: "Voice service unavailable. Please try again or use text chat."
2. Toast notification suggests checking internet connection
3. Text chat remains fully functional (no degradation)
4. Retry button available (attempt voice input again)

**Verification**:
- Simulate network failure (disconnect Wi-Fi, block API endpoint)
- Verify error message clarity and retry functionality

---

### AC8: Error Handling - Recognition Timeout
**Given** I activate voice input but don't speak for 10 seconds,
**When** the recognition timeout is reached,
**Then** the following should occur:
1. Listening state automatically stops
2. Message appears: "I didn't catch that, please try again."
3. Microphone returns to idle state
4. I can click again to retry

**Verification**:
- Activate voice input, wait 10 seconds without speaking
- Verify timeout behavior and clear messaging

---

### AC9: Error Handling - Misrecognized Command
**Given** the voice recognition transcription is inaccurate,
**When** the transcription appears in the chat input field,
**Then** I should be able to:
1. Edit the transcription before submitting
2. Clear the input and retry voice command
3. Switch to text chat and type manually

**Verification**:
- Intentionally speak unclear commands
- Verify all 3 corrective actions work as expected

---

## Integration Verification

### IV1: Text Chat Functionality Preserved
**Requirement**: Existing text chat functionality remains unchanged (voice is additive, not replacement).

**Verification Steps**:
1. Test all existing text commands with voice input disabled
2. Verify command parsing logic (`parseCommand()`) works identically for text and voice input
3. Ensure no regression in text chat performance or functionality

**Expected Result**: All existing text commands work exactly as before voice feature was added.

---

### IV2: Command Execution Logic Compatibility
**Requirement**: Voice commands trigger same `parseCommand()` and `executeCommand()` logic as text commands.

**Verification Steps**:
1. Execute identical command via text and voice (e.g., "Generate 3 images of John")
2. Compare execution flow (same functions called, same state changes)
3. Verify results are identical (same images generated, same project state)

**Expected Result**: No difference in command execution between text and voice input.

---

### IV3: Performance - Zero Overhead When Disabled
**Requirement**: No performance degradation when voice is disabled (zero overhead for non-voice users).

**Verification Steps**:
1. Benchmark DirectorWidget render time with voice disabled
2. Benchmark with voice enabled but not in use
3. Compare memory usage and CPU load

**Expected Result**: <5ms difference in render time, <1MB difference in memory usage.

---

### IV4: State Persistence Across Tab Switches
**Requirement**: Voice input state persists across tab switches (user preference saved to localStorage).

**Verification Steps**:
1. Enable voice input in Script tab
2. Navigate to Moodboard tab
3. Verify voice input still enabled
4. Refresh browser
5. Verify voice input preference persisted

**Expected Result**: Voice mode preference persists across navigation and browser refresh.

---

## Migration/Compatibility

### MC1: Existing Projects Work Without Voice
**Requirement**: Existing projects work without voice (no data migration required).

**Verification Steps**:
1. Load project created before voice feature (from `.alkemy.json` file)
2. Verify all features work (script analysis, image generation, timeline, export)
3. Verify DirectorWidget text chat functions normally

**Expected Result**: No breaking changes, no errors, full backward compatibility.

---

### MC2: Users Without Microphone Can Use All Features
**Requirement**: Users without microphone access can still use all features (text chat always available).

**Verification Steps**:
1. Test on device without microphone
2. Verify microphone button is hidden or disabled with clear tooltip
3. Verify text chat is fully functional
4. Verify no errors or degraded performance

**Expected Result**: Graceful degradation, clear messaging, full text chat functionality.

---

## Technical Implementation Notes

### Service Layer Architecture

**New Service Module**: `services/voiceService.ts`

**Key Functions**:
```typescript
// Initialize voice recognition service (from Epic R3a research)
export async function initVoiceRecognition(): Promise<VoiceRecognition>;

// Start listening for voice input
export async function startListening(
  onTranscript: (text: string) => void,
  onError: (error: Error) => void
): Promise<void>;

// Stop listening
export function stopListening(): void;

// Check if voice recognition is available
export function isVoiceAvailable(): boolean;

// Get current voice mode preference
export function getVoiceMode(): 'push-to-talk' | 'always-listening' | 'text-only';

// Set voice mode preference
export function setVoiceMode(mode: 'push-to-talk' | 'always-listening' | 'text-only'): void;
```

### DirectorWidget Integration

**Component File**: `components/DirectorWidget.tsx` (extend existing component)

**New State**:
```typescript
const [voiceMode, setVoiceMode] = useState<'idle' | 'listening' | 'processing' | 'error'>('idle');
const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
const [voicePreference, setVoicePreference] = useState<'push-to-talk' | 'always-listening' | 'text-only'>('push-to-talk');
```

**New UI Elements**:
- Microphone button in chat input area (next to text input field)
- Voice mode settings in widget header (gear icon menu)
- Visual feedback during listening (pulsing animation, waveform)
- Error tooltips for permission denied, network errors, timeouts

### Environment Variables

**New API Key** (from Epic R3a research recommendation):
- `VOICE_RECOGNITION_API_KEY` (if not using Web Speech API)

**Configuration** (in `.env.local` and Vercel):
```
VOICE_RECOGNITION_API_KEY=your_key_here  # Only if paid service chosen in R3a
```

### localStorage Keys

**Voice Preferences**:
- `alkemy_voice_mode_preference`: `'push-to-talk' | 'always-listening' | 'text-only'`
- `alkemy_voice_privacy_warning_shown`: `boolean` (for Always-Listening first-time warning)

### Browser API Integration

If **Web Speech API** is chosen (free, browser-native):
```typescript
// Web Speech API integration
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.continuous = false; // Push-to-talk mode
recognition.interimResults = false;

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  onTranscript(transcript);
};

recognition.onerror = (event) => {
  onError(new Error(event.error));
};
```

If **Paid Service** is chosen (Deepgram, AssemblyAI, etc.):
- Use Vercel serverless proxy (`/api/voice-proxy.ts`) to avoid exposing API key
- Follow existing proxy pattern from `api/luma-proxy.ts`, `api/brave-proxy.ts`

### Keyboard Shortcuts

**New Shortcuts** (via `hooks/useKeyboardShortcuts.ts`):
- **Cmd/Ctrl + Shift + V**: Toggle voice input (start/stop listening)
- **Escape**: Stop listening (if currently active)

---

## Definition of Done

- [ ] Microphone button UI implemented with all 4 states (idle, listening, processing, error)
- [ ] Push-to-talk workflow functional (click → speak → transcribe → edit → submit)
- [ ] Voice mode settings implemented (push-to-talk, always-listening, text-only)
- [ ] Film terminology recognition tested with >90% actionable accuracy (100-command dataset)
- [ ] Voice input works across all tabs where DirectorWidget is active
- [ ] Error handling implemented for all failure modes (permission denied, network error, timeout, misrecognition)
- [ ] Integration verification complete (text chat preserved, command execution compatible, zero overhead when disabled, state persistence)
- [ ] Migration/compatibility verified (existing projects work, users without microphones can use all features)
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Voice preference persists across sessions (localStorage)
- [ ] Code reviewed and approved by engineering lead
- [ ] User acceptance testing with 5+ filmmakers (>8/10 usability rating target)
- [ ] CLAUDE.md updated with voice service documentation

---

## Dependencies

### Prerequisite
- **Epic R3a** (Voice I/O Research) must be completed with final technology recommendation

### Related Stories
- **Story 1.2** (Voice Output): Voice input + voice output = complete hands-free workflow
- **Story 1.3** (Style Learning): Voice commands tracked for style learning
- **Story 1.4** (Continuity Checking): Voice commands can trigger continuity analysis

### External Dependencies
- Voice recognition service API (from Epic R3a recommendation)
- Browser microphone permissions (user-granted)
- Stable internet connection (if using cloud-based voice service)

---

## Testing Strategy

### Unit Tests
- `voiceService.ts` functions (init, start/stop listening, availability checks)
- Voice mode preference persistence (localStorage read/write)
- Error handling logic (permission denied, network error, timeout)

### Integration Tests
- Voice input → `parseCommand()` → command execution flow
- Text chat + voice input side-by-side (no conflicts)
- Cross-tab voice input state management

### End-to-End Tests (Playwright)
- Complete voice command workflow (click mic → speak → transcribe → submit → execution)
- Error scenarios (permission denied, network failure, timeout)
- Browser compatibility (Chrome, Firefox, Safari, Edge)

### Manual Testing
- 100-command film terminology accuracy test (from Epic R3a)
- User acceptance testing (5+ filmmakers, usability rating)
- Accessibility testing (screen readers, keyboard-only navigation)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 1, Story 1.1
- **Research Spike**: `docs/research/voice-io-spike.md` - Epic R3a findings
- **Architecture**: `docs/brownfield-architecture.md` - DirectorWidget integration points
- **Existing Component**: `components/DirectorWidget.tsx` - Current text-based implementation
- **Command Parsing**: DirectorWidget.tsx:parseCommand() - Existing command parsing logic

---

**END OF STORY**

*Next Steps: Wait for Epic R3a research completion, then assign to development team for implementation.*
