# Voice Input Testing Guide

**Epic**: Epic 1 - Director Agent Voice Enhancement
**Story**: Story 1.1 - Voice Input Integration
**Testing Status**: Ready for Manual Testing
**Date**: 2025-11-10

---

## Prerequisites

### Browser Requirements
- **Chrome** (recommended): Full support
- **Edge**: Full support
- **Safari**: Good support (desktop only)
- **Firefox**: Limited support (mic button may be hidden)

### Environment Setup
1. Ensure project is running locally or on Vercel
2. Open in a supported browser (Chrome recommended)
3. Navigate to the app (e.g., `http://localhost:3000`)
4. Analyze a script or load a project (to enable DirectorWidget)

---

## Test Suite 1: Basic Voice Input

### Test 1.1: Microphone Permission Flow
**Steps**:
1. Open the app in an incognito window (fresh state)
2. Navigate to any tab where DirectorWidget is visible
3. Click the AI Director button (bottom-right) to open chat
4. Click the microphone button in the input area
5. Browser prompts for microphone permission

**Expected Result**:
- Browser shows permission prompt: "Allow [site] to access your microphone?"
- If "Allow" clicked: Microphone button turns red, "Listening..." banner appears
- If "Block" clicked: Error banner displays: "Microphone access denied. Please enable in browser settings."

**Pass Criteria**: Permission flow works correctly for both "Allow" and "Block" cases.

---

### Test 1.2: Basic Voice Command Execution
**Steps**:
1. Click microphone button (ensure permission granted)
2. Wait for "Listening..." banner to appear
3. Speak clearly: "Generate 3 images of [character name from your script]"
4. Wait for final transcript to populate input field
5. Press Enter or click Send button

**Expected Result**:
- Real-time transcript appears in "Listening..." banner
- Final transcript populates input field (editable)
- Command executes (images generate for character)
- Director responds with confirmation message

**Pass Criteria**: Voice command executes identically to typing the same command.

---

### Test 1.3: Waveform Animation
**Steps**:
1. Click microphone button
2. Observe the "Listening..." banner
3. Speak while watching the waveform animation

**Expected Result**:
- 5 animated bars (green) pulse in sync with speaking
- Animation stops when listening ends
- Canvas clears after stop

**Pass Criteria**: Smooth 60fps animation during listening.

---

## Test Suite 2: Film Terminology Recognition

### Test 2.1: Aperture Values
**Speak**: "Calculate DOF for f/2.8 at 3 meters with 85mm"

**Expected Transcript**: "calculate dof for f 2.8 at 3 meters with 85mm" (or similar)

**Pass Criteria**: Command parser recognizes and executes DOF calculation.

---

### Test 2.2: Focal Lengths
**Speak**: "Recommend lens for close-up"

**Expected Transcript**: "recommend lens for close up" (or similar)

**Pass Criteria**: Director provides lens recommendation.

---

### Test 2.3: Camera Angles
**Speak**: "Suggest camera movement for tension"

**Expected Transcript**: "suggest camera movement for tension"

**Pass Criteria**: Director provides camera movement advice.

---

### Test 2.4: Character Names
**Speak**: "Generate 5 flux images of [character name] in 16:9"

**Expected Transcript**: Should recognize character name from script

**Pass Criteria**: Command executes, images generate for correct character.

---

## Test Suite 3: Error Handling

### Test 3.1: Permission Denied Recovery
**Steps**:
1. Click microphone button
2. Click "Block" on permission prompt (or revoke permission in browser settings)
3. Observe error banner
4. Type a command manually in the input field

**Expected Result**:
- Error banner: "Microphone access denied. Please enable in browser settings."
- Microphone button remains visible (for retry)
- Text chat continues working normally

**Pass Criteria**: Text input unaffected by voice permission denial.

---

### Test 3.2: Network Error Simulation
**Steps**:
1. Disconnect from internet (turn off Wi-Fi)
2. Click microphone button
3. Attempt to speak

**Expected Result**:
- Error banner: "Network error. Please check your internet connection."
- Microphone button returns to idle state
- Text chat remains functional (if app already loaded)

**Pass Criteria**: Clear error message, graceful degradation.

---

### Test 3.3: Recognition Timeout
**Steps**:
1. Click microphone button
2. Wait 10 seconds without speaking

**Expected Result**:
- Web Speech API auto-stops after ~10 seconds
- "Listening..." banner disappears
- Microphone button returns to idle state
- No error message (this is expected behavior)

**Pass Criteria**: Listening state resets cleanly after timeout.

---

### Test 3.4: Misrecognized Command
**Steps**:
1. Click microphone button
2. Speak unclearly or use nonsensical words
3. Observe transcript in input field

**Expected Result**:
- Transcript populates input field (may be inaccurate)
- User can edit transcript before submitting
- User can clear input and retry
- User can switch to text chat

**Pass Criteria**: Editable transcript allows recovery from misrecognition.

---

## Test Suite 4: Cross-Browser Compatibility

### Test 4.1: Chrome
**Steps**: Run all tests above in Chrome

**Expected Result**: All tests pass

---

### Test 4.2: Edge
**Steps**: Run all tests above in Edge

**Expected Result**: All tests pass (identical to Chrome)

---

### Test 4.3: Safari
**Steps**: Run all tests above in Safari (desktop)

**Expected Result**: All tests pass (webkit prefix supported)

---

### Test 4.4: Firefox
**Steps**: Open app in Firefox, check microphone button visibility

**Expected Result**: Microphone button may be hidden (graceful degradation)
**Fallback**: Text chat works normally

**Pass Criteria**: No errors, text chat unaffected.

---

## Test Suite 5: Integration Tests

### Test 5.1: Voice + Text Chat Side-by-Side
**Steps**:
1. Type a command: "Generate 3 images of Sarah"
2. Submit → Verify execution
3. Click microphone button
4. Speak: "Upscale the Sarah image"
5. Submit → Verify execution

**Expected Result**:
- Both commands execute identically
- No conflicts between voice and text input
- Chat history shows both commands

**Pass Criteria**: Text and voice input work seamlessly together.

---

### Test 5.2: Voice Input Across Multiple Tabs
**Steps**:
1. Analyze a script (Script Tab)
2. Navigate to Moodboard Tab
3. Click microphone → Speak: "What is a Dutch angle?"
4. Navigate to Compositing Tab
5. Click microphone → Speak: "Generate 3 images of [location]"

**Expected Result**:
- Voice input works in all tabs where DirectorWidget is visible
- Commands execute in correct context

**Pass Criteria**: Cross-tab voice input functional.

---

### Test 5.3: Voice Preference Persistence
**Steps**:
1. Use voice input (confirm microphone permission granted)
2. Refresh browser
3. Check microphone button visibility

**Expected Result**:
- Microphone button still visible
- Permission already granted (no re-prompt on first click)
- Voice preference persists

**Pass Criteria**: localStorage persistence working.

---

## Test Suite 6: Performance Tests

### Test 6.1: Latency Measurement
**Steps**:
1. Click microphone button
2. Speak: "Generate 3 images of Sarah"
3. Stop speaking
4. Measure time until transcript appears in input field

**Expected Result**: <2 seconds from utterance end to transcript display

**Measurement Tool**: Browser DevTools Performance tab or manual stopwatch

**Pass Criteria**: Latency <2s (target: 800-1200ms per research)

---

### Test 6.2: Zero Overhead When Disabled
**Steps**:
1. Open DevTools → Performance tab
2. Record DirectorWidget render time with voice disabled (in Firefox)
3. Record DirectorWidget render time with voice enabled (in Chrome)
4. Compare memory usage

**Expected Result**:
- <5ms difference in render time
- <1MB difference in memory usage

**Pass Criteria**: No significant performance impact.

---

## Test Suite 7: Accessibility Tests

### Test 7.1: Keyboard Navigation
**Steps**:
1. Tab through DirectorWidget elements
2. Verify microphone button is reachable via keyboard
3. Press Enter to activate

**Expected Result**: Microphone button accessible via keyboard

**Pass Criteria**: Full keyboard navigation support.

---

### Test 7.2: Screen Reader Compatibility
**Steps**:
1. Enable screen reader (e.g., NVDA, JAWS)
2. Navigate to microphone button
3. Listen to screen reader announcement

**Expected Result**: "Start voice input" or "Stop listening" announced

**Pass Criteria**: Screen reader provides context for button state.

---

## Test Suite 8: Edge Cases

### Test 8.1: Multiple Rapid Clicks
**Steps**:
1. Click microphone button rapidly 5 times

**Expected Result**:
- Voice recognition starts/stops cleanly
- No errors or stuck states
- Animation stops/starts correctly

**Pass Criteria**: No crashes or state corruption.

---

### Test 8.2: Long Command (30+ seconds)
**Steps**:
1. Click microphone button
2. Speak continuously for 30+ seconds (read a paragraph)

**Expected Result**:
- Transcript updates in real-time
- Final result populates input field
- No timeout errors

**Pass Criteria**: Long utterances handled correctly.

---

### Test 8.3: Background Noise
**Steps**:
1. Click microphone button
2. Speak command with background music or noise

**Expected Result**:
- Transcript may be less accurate (expected)
- User can edit transcript before submitting
- No crashes

**Pass Criteria**: Graceful handling of noisy environment.

---

## Regression Tests

### Regression 1: Existing Text Commands
**Steps**: Run all existing DirectorWidget text commands (DOF calc, lens rec, lighting, etc.)

**Expected Result**: All commands work identically to before voice feature was added

**Pass Criteria**: No regression in text chat functionality.

---

### Regression 2: Project Load/Save
**Steps**:
1. Load existing `.alkemy.json` project
2. Use voice input to generate images
3. Save project
4. Reload project

**Expected Result**: Voice-generated content saved/loaded correctly

**Pass Criteria**: No data loss, no errors.

---

## Automated Testing (Future - Playwright)

### Playwright Test Plan (Story 1.1 - Phase 2)

**Test File**: `tests/voice-input.spec.ts`

**Tests**:
- Microphone button visibility (browser support check)
- Permission prompt flow (mock microphone access)
- Command execution (mock speech recognition API)
- Error handling (network error simulation)
- Cross-browser compatibility (Chrome, Edge, Safari)

**Note**: Playwright currently installed (`@playwright/test@^1.56.1`) but no test suite implemented yet.

---

## Known Issues / Limitations

### Issue 1: Web Speech API Requires Internet
**Description**: Voice recognition requires internet connection (uses Google Cloud Speech)
**Workaround**: Use text chat when offline
**Status**: Expected behavior (browser limitation)

---

### Issue 2: Firefox Limited Support
**Description**: Web Speech API experimental in Firefox
**Workaround**: Microphone button hidden, text chat available
**Status**: Graceful degradation implemented

---

### Issue 3: Background Noise Accuracy
**Description**: Recognition accuracy degrades in noisy environments
**Workaround**: Use push-to-talk in quiet environment, edit transcript before submit
**Status**: Expected behavior (Web Speech API limitation)

---

## Success Criteria

### Minimum Passing Threshold
- **Chrome/Edge**: All tests pass (100%)
- **Safari**: All tests pass except mobile (95%)
- **Firefox**: Graceful degradation (text chat works, mic hidden)

### Performance Targets
- **Latency**: <2s (target: 800-1200ms)
- **Accuracy**: >75% for film terminology
- **Zero Overhead**: <5ms render time difference when disabled

### User Acceptance
- **Rating**: >8/10 usability score from 5+ filmmakers
- **Adoption**: >70% of users try voice input at least once

---

## Reporting Bugs

If any test fails, please report with:
1. **Browser**: Chrome/Edge/Safari/Firefox (version)
2. **Test ID**: (e.g., Test 2.1: Aperture Values)
3. **Steps**: Exact reproduction steps
4. **Expected**: What should happen
5. **Actual**: What actually happened
6. **Screenshots**: If applicable
7. **Console Errors**: Any errors in DevTools console

---

## Next Steps After Testing

1. **Deploy to Vercel** (production deployment)
2. **User Acceptance Testing** (5+ filmmakers)
3. **Analytics Setup** (track voice usage via `usageService.ts`)
4. **Story 1.2** (Voice Mode Settings UI)
5. **Story 1.3** (Enhanced Accuracy with paid service if needed)

---

**Testing Status**: ✅ Ready for Manual Testing
**Estimated Testing Time**: 2-3 hours for full suite

---

**END OF TESTING GUIDE**
