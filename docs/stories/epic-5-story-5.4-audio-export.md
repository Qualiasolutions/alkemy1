---
last_sync: '2025-11-21T10:28:16.931Z'
auto_sync: true
---
# Story 5.4: Audio Export and Rendering

**Epic**: Epic 5 - Music, Sound & Audio Mixing
**PRD Reference**: Section 6, Epic 5, Story 5.4
**Status**: Not Started
**Priority**: High (V2.0 Core Feature)
**Estimated Effort**: 6 story points
**Dependencies**: Story 5.3 (Audio Mixing), Timeline Tab (existing)
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** export my completed audio-visual production with professional-quality audio,
**So that** I can share, distribute, or submit my film to festivals and platforms.

---

## Business Value

**Problem Statement**:
Export workflows are complex and error-prone. Filmmakers need reliable, one-click export that produces broadcast-quality files without technical expertise or trial-and-error.

**Value Proposition**:
Professional audio export enables filmmakers to:
- Export complete films with synchronized audio-visual tracks
- Meet platform-specific requirements (YouTube, Vimeo, film festivals)
- Produce broadcast-standard audio (-16 LUFS, no clipping)
- Export audio-only or video-only for specialized workflows

**Success Metric**: >90% of exports complete successfully; 100% meet broadcast loudness standards; >95% user satisfaction with export quality.

---

## Key Acceptance Criteria

### AC1: Export Preset Selector
**Given** I want to export my project,
**When** I click "Export Project",
**Then** I should see export presets:
- **YouTube** (1080p MP4, H.264, AAC audio, -14 LUFS)
- **Vimeo** (1080p MP4, H.264, AAC audio, -16 LUFS)
- **Film Festival** (1080p/4K ProRes, Linear PCM audio, -16 LUFS)
- **Instagram/TikTok** (1080p vertical, H.264, AAC audio, -14 LUFS)
- **Audio Only** (WAV/MP3/AAC, -16 LUFS)
- **Custom** (manual settings)

**Preset Details**:
```typescript
interface ExportPreset {
  name: string;
  video: {
    resolution: '720p' | '1080p' | '4K';
    codec: 'h264' | 'h265' | 'prores' | 'vp9';
    bitrate: number; // Mbps
    framerate: 24 | 30 | 60;
  };
  audio: {
    codec: 'aac' | 'mp3' | 'wav' | 'flac';
    sampleRate: 44100 | 48000;
    bitDepth: 16 | 24;
    channels: 'mono' | 'stereo';
    targetLUFS: number; // -16 or -14
  };
  container: 'mp4' | 'mov' | 'webm' | 'wav';
}
```

**Verification**:
- Select YouTube preset and verify settings populate correctly
- Test 3 different presets (YouTube, Festival, Audio Only)
- Verify preset descriptions are clear

---

### AC2: Custom Export Settings
**Given** I want full control over export,
**When** I select "Custom" preset,
**Then** I should see:
- **Video Settings**:
  - Resolution: 720p, 1080p, 4K
  - Codec: H.264, H.265, ProRes, VP9
  - Bitrate: 5-50 Mbps (slider)
  - Framerate: 24, 30, 60 fps
- **Audio Settings**:
  - Codec: AAC, MP3, WAV, FLAC
  - Sample Rate: 44.1kHz, 48kHz
  - Bit Depth: 16-bit, 24-bit
  - Channels: Mono, Stereo
  - Target LUFS: -18 to -12 (slider, default -16)
- **Advanced**:
  - Color Space: Rec.709, Rec.2020
  - HDR: On/Off
  - Subtitles: Embed SRT (if available)

**Verification**:
- Configure custom export with 4K, ProRes, 24-bit WAV
- Verify export matches settings
- Test various combinations (H.265 + AAC, VP9 + FLAC)

---

### AC3: Export Progress Tracking
**Given** export is processing,
**When** I monitor progress,
**Then** I should see:
- Progress bar: 0-100%
- Current stage:
  - "Rendering audio mix..."
  - "Encoding video..."
  - "Muxing audio and video..."
  - "Finalizing export..."
- Time estimates:
  - "2 minutes remaining"
  - "Estimated completion: 3:45 PM"
- Pause/Cancel buttons

**Progress Data Model**:
```typescript
interface ExportProgress {
  stage: 'audio' | 'video' | 'muxing' | 'finalizing';
  progress: number; // 0-100
  currentFrame?: number;
  totalFrames?: number;
  estimatedTimeRemaining?: number; // seconds
}
```

**Verification**:
- Start export and observe progress stages
- Verify time estimates are reasonably accurate
- Test pause and cancel functionality

---

### AC4: Audio Normalization and Limiting
**Given** my mixed audio is at inconsistent levels,
**When** export is processing,
**Then** the system should:
- Measure current loudness (LUFS)
- Normalize to target LUFS (-16 default)
- Apply limiter to prevent clipping (true peak < -1 dBTP)
- Display before/after loudness:
  - "Original: -19.2 LUFS → Normalized: -16.0 LUFS"
- Warning if significant adjustment needed (>6dB)

**Normalization Algorithm**:
```typescript
export async function normalizeAudioForExport(
  audioBuffer: AudioBuffer,
  targetLUFS: number,
  maxTruePeak: number = -1 // dBTP
): Promise<AudioBuffer>;
```

**Verification**:
- Export audio at -19 LUFS (below target)
- Verify normalization to -16 LUFS
- Check for clipping warnings if audio is too loud

---

### AC5: Export Queue Management
**Given** I want to export multiple projects or versions,
**When** I queue exports,
**Then** I should see:
- Export queue list with:
  - Project name
  - Preset name
  - Status (Queued, Processing, Complete, Failed)
  - Progress %
- "Add to Queue" button (instead of immediate export)
- Process exports sequentially (avoid overloading system)
- Notifications when exports complete:
  - "YouTube export complete. Download ready."

**Queue Data Model**:
```typescript
interface ExportJob {
  id: string;
  projectId: string;
  projectName: string;
  preset: ExportPreset;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  progress: number;
  outputUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}
```

**Verification**:
- Queue 3 exports with different presets
- Verify sequential processing
- Test notifications on completion

---

### AC6: Export Validation and Quality Checks
**Given** export has completed,
**When** I review the output,
**Then** the system should:
- Run quality checks:
  - Audio loudness within ±1 LUFS of target
  - No audio clipping (true peak < -1 dBTP)
  - Video/audio sync drift < 50ms
  - File size reasonable (not corrupted)
- Display validation results:
  - "✅ Loudness: -16.2 LUFS (Target: -16)"
  - "✅ No clipping detected"
  - "✅ A/V sync: 12ms drift"
- Warning if issues detected:
  - "⚠️ Loudness -18.5 LUFS (below target -16)"

**Validation Report**:
```typescript
interface ExportValidation {
  loudness: { measured: number; target: number; pass: boolean };
  clipping: { detected: boolean; locations?: number[] }; // Timestamps
  syncDrift: { maxDrift: number; pass: boolean }; // milliseconds
  fileSize: { bytes: number; reasonable: boolean };
}
```

**Verification**:
- Export project and verify validation report
- Intentionally create clipping and verify detection
- Test sync drift detection

---

### AC7: Director Agent Export Recommendations
**Given** I need help choosing export settings,
**When** I ask Director Agent for export advice,
**Then** Director should:
- Recommend preset based on distribution platform
- Explain codec and quality trade-offs
- Suggest resolution based on source quality
- Warn about platform-specific requirements

**Example Queries**:
> User: "Which settings should I use for YouTube?"
> Director: "Recommend **YouTube preset** (1080p, H.264, AAC, -14 LUFS). YouTube recompresses uploads, so H.264 balances quality and upload speed. Use -14 LUFS for YouTube's loudness normalization."

> User: "Should I export in 4K or 1080p?"
> Director: "Your source shots are 1080p. Exporting at 4K won't improve quality and will triple file size. Recommend **1080p** for optimal quality/size ratio."

**Verification**:
- Ask Director for export recommendations
- Verify recommendations match best practices
- Test "Use Recommended Settings" functionality

---

### AC8: Export History and Re-Export
**Given** I have exported a project previously,
**When** I access export history,
**Then** I should see:
- List of all previous exports:
  - Date/time
  - Preset used
  - File size
  - Download link (if still available)
- "Re-Export" button (reuses same settings)
- "Export Variations" button (create alternate versions)

**Export History Storage**:
```typescript
interface ExportHistory {
  projectId: string;
  exports: {
    exportId: string;
    preset: string;
    exportedAt: string;
    fileSize: number;
    downloadUrl?: string; // May expire after 7 days
    validation: ExportValidation;
  }[];
}
```

**Verification**:
- Export project multiple times with different presets
- View export history and verify all exports listed
- Re-export using previous settings

---

## Integration Verification

### IV1: Timeline Integration (Story 5.3)
**Requirement**: Export renders complete timeline with all mixed audio.

**Verification Steps**:
1. Create timeline with dialogue, music, and SFX
2. Apply mixing (volume, fades, auto-ducking)
3. Export to MP4
4. Verify exported audio matches timeline playback

**Expected Result**: Perfect audio reproduction in export.

---

### IV2: Video Rendering Integration
**Requirement**: Export combines timeline video clips with mixed audio.

**Verification Steps**:
1. Create timeline with video clips and audio
2. Export to MP4
3. Verify video and audio are perfectly synced

**Expected Result**: Audio-visual sync within 50ms.

---

### IV3: Supabase Storage Integration
**Requirement**: Exports optionally save to Supabase Storage (authenticated users).

**Verification Steps**:
1. Export project as authenticated user
2. Verify export saved to Supabase `exports` bucket
3. Share export link with collaborator

**Expected Result**: Cloud storage with shareable links.

---

## Migration/Compatibility

### MC1: Legacy Projects Export
**Requirement**: Projects created before export enhancements export successfully.

**Verification Steps**:
1. Load legacy project
2. Export using YouTube preset
3. Verify export completes without errors

**Expected Result**: Backward compatibility with legacy projects.

---

### MC2: Export Resume on Failure
**Requirement**: Failed exports can be retried without restarting.

**Verification Steps**:
1. Start export
2. Simulate failure (disconnect network mid-export)
3. Click "Retry Export"
4. Verify export resumes from last checkpoint

**Expected Result**: Resilient export with retry logic.

---

## Technical Implementation Notes

### Service Layer

**Extend `services/videoRenderingService.ts`**:
```typescript
export async function exportProject(
  timeline: TimelineClip[],
  preset: ExportPreset,
  onProgress: (progress: ExportProgress) => void
): Promise<Blob>;

export async function normalizeAudioForExport(
  audioBuffer: AudioBuffer,
  targetLUFS: number,
  maxTruePeak: number
): Promise<AudioBuffer>;

export async function validateExport(
  exportedBlob: Blob,
  preset: ExportPreset
): Promise<ExportValidation>;

export async function mixTimelineAudio(
  audioClips: TimelineClip[]
): Promise<AudioBuffer>;

export async function renderVideo(
  videoClips: TimelineClip[],
  audioBuffer: AudioBuffer,
  preset: ExportPreset,
  onProgress: (progress: number) => void
): Promise<Blob>;
```

### FFmpeg Export Commands

**YouTube Preset (H.264 + AAC)**:
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 \
  -vf scale=1920:1080 -r 30 \
  -movflags +faststart \
  output.mp4
```

**Film Festival Preset (ProRes + Linear PCM)**:
```bash
ffmpeg -i input.mp4 \
  -c:v prores_ks -profile:v 3 -pix_fmt yuv422p10le \
  -c:a pcm_s24le -ar 48000 \
  output.mov
```

**Audio Normalization (LUFS)**:
```bash
# Two-pass loudness normalization
ffmpeg -i input.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -
ffmpeg -i input.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-19.2:measured_TP=-0.5:measured_LRA=8.3 output.wav
```

### Export Queue Management

**Background Worker Pattern**:
```typescript
class ExportQueue {
  private queue: ExportJob[] = [];
  private processing = false;

  async addJob(job: ExportJob) {
    this.queue.push(job);
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.processing = true;
    while (this.queue.length > 0) {
      const job = this.queue[0];
      try {
        await this.processJob(job);
        job.status = 'complete';
      } catch (error) {
        job.status = 'failed';
        job.error = error.message;
      }
      this.queue.shift();
    }
    this.processing = false;
  }

  private async processJob(job: ExportJob) {
    // Export logic here
  }
}
```

---

## Definition of Done

- [ ] Export preset selector (YouTube, Vimeo, Festival, Audio Only, Custom)
- [ ] Custom export settings with full control
- [ ] Export progress tracking with time estimates
- [ ] Audio normalization to target LUFS
- [ ] Export queue management
- [ ] Export validation and quality checks
- [ ] Director Agent export recommendations
- [ ] Export history and re-export functionality
- [ ] Integration verification complete
- [ ] Migration/compatibility verified
- [ ] Code reviewed and approved
- [ ] User acceptance testing (>90% success rate, 100% broadcast compliance)
- [ ] CLAUDE.md updated

---

## Dependencies

### Prerequisites
- **Story 5.3** (Audio Mixing) completed
- **Timeline Tab** (existing FramesTab.tsx)

### Related Stories
- **Story 4.4** (Dialogue Timeline): Export includes dialogue
- **Story 5.1** (Music): Export includes music
- **Story 5.2** (SFX): Export includes sound effects

---

## Testing Strategy

### Unit Tests
- LUFS measurement accuracy
- Export preset validation
- Queue management logic

### Integration Tests
- Full timeline → export workflow
- Audio/video sync verification
- Cloud storage upload (Supabase)

### Performance Tests
- Export time for 5-minute 1080p video
- Memory usage during export
- Concurrent export handling

### Manual Testing
- Export quality assessment (visual + audio)
- Platform compatibility testing (YouTube, Vimeo upload)
- User acceptance testing (export workflow UX)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 5, Story 5.4
- **FFmpeg Documentation**: https://ffmpeg.org/documentation.html
- **ITU-R BS.1770**: Loudness measurement standard
- **YouTube Upload Specs**: https://support.google.com/youtube/answer/1722171

---

**END OF STORY**
