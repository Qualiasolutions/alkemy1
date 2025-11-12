# Sprint 3 Implementation Roadmap

**Date Created**: 2025-11-10
**Status**: Ready to Execute (Epic 2 completed during research phase - 2025-11-12)
**Effort**: 17 story points (Week 5-6)
**Production URL**: https://alkemy1-5mhhufxiz-qualiasolutionscy.vercel.app

---

## Background Agents Completed

✅ **Production Health Check**: All V2.0 Alpha features operational (Analytics Tab, Voice Input, Performance Metrics)
✅ **Epic R1 PoC Research**: Complete implementation guide ready for character identity validation
✅ **Technical Decisions Analysis**: All V2.0 Alpha decisions validated, Sprint 3 priorities confirmed
✅ **Epic 2 Character Identity** (2025-11-12): Backend + frontend complete, deployed to production
  - Fal.ai LoRA Fast Training integration (5-10 min training, 90-98% visual similarity)
  - CastLocationsTab + SceneAssemblerTab integration
  - Production URL: https://alkemy1-9jwuckf8h-qualiasolutionscy.vercel.app

---

## Sprint 3.1 - Critical Tech Debt (Week 5)

### Story 6.1.1: Real Computer Vision Integration (5 points)

**Current State**:
- `/services/analyticsService.ts` uses simulated scores (lines 50-169)
- Functions: `analyzeColorConsistency()`, `analyzeLightingCoherence()`, `analyzeLookBibleAdherence()`
- All return randomized scores (75-95 range)

**Target State**:
- Integrate Gemini Vision API for real image analysis
- Extract dominant colors using RGB analysis
- Calculate brightness variance using luminance
- Measure contrast ratio using histogram analysis

**Implementation Tasks**:

1. **Add Gemini Vision Helper Function** (analyticsService.ts)
```typescript
/**
 * Analyze image using Gemini Vision API
 * Returns color palette, brightness, contrast data
 */
async function analyzeImageWithGeminiVision(imageUrl: string): Promise<{
    dominantColors: string[]; // Hex color codes
    brightness: number; // 0-100
    contrast: number; // 0-100
    colorTemperature: number; // Kelvin
}> {
    // Use askTheDirector() with vision model
    // Prompt: "Analyze this image's colors, brightness, and contrast. Return JSON."
}
```

2. **Update analyzeColorConsistency()** (analyticsService.ts:50-86)
```typescript
// Replace lines 64-85 with real CV:
const imageAnalyses = await Promise.all(
    completedShots.map(shot => analyzeImageWithGeminiVision(shot.media.url))
);

// Calculate color temperature variance
const temperatures = imageAnalyses.map(a => a.colorTemperature);
const tempVariance = calculateVariance(temperatures);

// Score based on variance (lower variance = higher score)
const score = tempVariance < 200 ? 100 : Math.max(0, 100 - (tempVariance / 10));
```

3. **Update analyzeLightingCoherence()** (analyticsService.ts:92-125)
```typescript
// Replace lines 105-124 with real CV:
const imageAnalyses = await Promise.all(
    completedShots.map(shot => analyzeImageWithGeminiVision(shot.media.url))
);

// Calculate brightness variance
const brightnessValues = imageAnalyses.map(a => a.brightness);
const brightnessVariance = calculateVariance(brightnessValues);

// Score based on variance
const score = brightnessVariance < 10 ? 100 : Math.max(0, 100 - (brightnessVariance * 2));
```

4. **Update analyzeLookBibleAdherence()** (analyticsService.ts:131-169)
```typescript
// Replace lines 149-168 with real CV:
// Compare moodboard reference colors to shot colors
const shotAnalyses = await Promise.all(
    completedShots.map(shot => analyzeImageWithGeminiVision(shot.media.url))
);

const moodboardAnalyses = await Promise.all(
    moodboard.slice(0, 5).map(item => analyzeImageWithGeminiVision(item.url))
);

// Calculate color palette similarity (cosine similarity of RGB vectors)
const similarities = shotAnalyses.map(shotColors => {
    return Math.max(...moodboardAnalyses.map(moodboardColors =>
        calculateColorSimilarity(shotColors.dominantColors, moodboardColors.dominantColors)
    ));
});

const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
const score = avgSimilarity * 100;
```

5. **Add Helper Functions** (analyticsService.ts:590+)
```typescript
function calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function calculateColorSimilarity(colors1: string[], colors2: string[]): number {
    // Convert hex to RGB, calculate cosine similarity
    // Return 0-1 similarity score
}
```

**Files Modified**:
- `/services/analyticsService.ts` (+200 LOC, replace ~90 LOC simulated)
- `/types.ts` (add `GeminiVisionAnalysis` interface)

**Testing**:
- Generate 5 test images with distinct color/lighting
- Run quality analysis
- Verify real scores match visual inspection
- Verify flagged shots are accurate

---

### Story 1.1.1: Image Caching System (3 points)

**Current State**:
- `/services/imageSearchService.ts` directly fetches Unsplash URLs
- 404 errors occur when images are deleted
- Graceful fallback to Pexels/Brave exists (lines 106-111)

**Target State**:
- Download images on first load
- Upload to Supabase Storage (`moodboard-cache` bucket)
- Serve from cache on subsequent loads (90-day expiration)

**Implementation Tasks**:

1. **Create Image Cache Service** (new file)
```typescript
// /services/imageCacheService.ts

/**
 * Check if image is cached in Supabase Storage
 */
export async function getCachedImageUrl(originalUrl: string): Promise<string | null> {
    // Hash URL to create cache key
    const cacheKey = hashUrl(originalUrl);

    // Check Supabase Storage: moodboard-cache bucket
    const { data, error } = await supabase.storage
        .from('moodboard-cache')
        .getPublicUrl(cacheKey);

    if (data && !error) {
        // Check if expired (>90 days)
        // Return cached URL or null
    }

    return null;
}

/**
 * Cache image to Supabase Storage
 */
export async function cacheImage(originalUrl: string): Promise<string> {
    // Download image as blob
    const response = await fetch(originalUrl);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const cacheKey = hashUrl(originalUrl);
    const { data, error } = await supabase.storage
        .from('moodboard-cache')
        .upload(cacheKey, blob, {
            contentType: blob.type,
            cacheControl: '7776000' // 90 days
        });

    if (error) throw error;

    // Return public URL
    return supabase.storage.from('moodboard-cache').getPublicUrl(cacheKey).data.publicUrl;
}

function hashUrl(url: string): string {
    // Simple hash function for cache key
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64) + '.jpg';
}
```

2. **Update Image Search Service** (imageSearchService.ts)
```typescript
// Add cache-first logic:
export async function searchImages(prompt: string, limit: number) {
    // ... existing query generation ...

    // Fetch images from Unsplash, Pexels, Brave
    const allImages = [...unsplashImages, ...pexelsImages, ...braveImages];

    // Cache-first: check cache, then fetch, then cache
    const cachedImages = await Promise.all(
        allImages.map(async (img) => {
            try {
                // Check cache
                const cachedUrl = await getCachedImageUrl(img.url);
                if (cachedUrl) {
                    return { ...img, url: cachedUrl, cached: true };
                }

                // Cache miss: download and cache
                const newCachedUrl = await cacheImage(img.url);
                return { ...img, url: newCachedUrl, cached: false };
            } catch (error) {
                console.warn('Failed to cache image:', error);
                return img; // Return original URL as fallback
            }
        })
    );

    return cachedImages;
}
```

**Files Created**:
- `/services/imageCacheService.ts` (~200 LOC)

**Files Modified**:
- `/services/imageSearchService.ts` (+80 LOC)

**Supabase Setup**:
```sql
-- Create moodboard-cache bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('moodboard-cache', 'moodboard-cache', true);

-- Set 90-day retention policy
```

**Testing**:
- Trigger Unsplash 404 error
- Verify automatic caching to Supabase
- Verify cached URL returned on subsequent loads
- Verify 90-day expiration cleanup

---

### QA Task: Voice Accuracy Manual Testing (2 hours)

**Dataset**: `/docs/research/epic-r3a-test-dataset-100-commands.csv` (if exists, or create from Epic R3a research)

**Process**:
1. Open DirectorWidget in production
2. Click microphone button
3. Grant microphone permission
4. Speak 100 test commands (film terminology heavy)
5. Record results:
   - Exact match: Transcription 100% correct
   - Actionable match: Transcription has minor errors but command parseable
   - Failed match: Transcription unusable

**Success Criteria**: >75% actionable match rate (Epic R3a validated 78%)

**Deliverable**: `/docs/qa/voice-accuracy-validation-report.md` with:
- Test date, browser, OS
- Exact/actionable/failed match percentages
- Examples of failed commands
- Recommendation (keep Web Speech API or upgrade to Deepgram)

---

## Sprint 3.2 - Complete Epic 6 (Week 5-6)

### Story 6.3: PDF Export + Comparison Mode (6 points)

**Implementation Tasks**:

1. **Install Dependencies**
```bash
npm install jspdf jspdf-autotable
npm install @types/jspdf --save-dev
```

2. **Create PDF Export Utility** (new file)
```typescript
// /utils/pdfExport.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function exportQualityReportToPDF(report: CreativeQualityReport): Promise<Blob> {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('Alkemy AI Studio - Creative Quality Report', 20, 20);

    // Overall scores
    doc.setFontSize(12);
    doc.text(`Overall Quality: ${report.overallScore}/100`, 20, 40);
    doc.text(`Color Consistency: ${report.colorConsistency}/100`, 20, 50);
    doc.text(`Lighting Coherence: ${report.lightingCoherence}/100`, 20, 60);
    doc.text(`Look Bible Adherence: ${report.lookBibleAdherence}/100`, 20, 70);

    // Scene-by-scene table
    autoTable(doc, {
        startY: 80,
        head: [['Scene', 'Overall', 'Color', 'Lighting', 'Look Bible']],
        body: report.sceneReports.map(scene => [
            scene.sceneName,
            scene.overallScore,
            scene.colorConsistency,
            scene.lightingCoherence,
            scene.lookBibleAdherence
        ])
    });

    // Flagged shots
    if (report.flaggedShots.length > 0) {
        doc.addPage();
        doc.text('Flagged Shots', 20, 20);
        autoTable(doc, {
            startY: 30,
            head: [['Frame ID', 'Issue', 'Severity', 'Description']],
            body: report.flaggedShots.map(shot => [
                shot.frameId.substring(0, 8),
                shot.issue,
                shot.severity,
                shot.description
            ])
        });
    }

    // Footer
    doc.setFontSize(8);
    doc.text(`Generated by Alkemy AI Studio on ${new Date().toLocaleString()}`, 20, 280);

    return doc.output('blob');
}
```

3. **Add Comparison Mode UI** (AnalyticsTab.tsx)
```typescript
// Add state for comparison mode:
const [comparisonMode, setComparisonMode] = useState(false);
const [comparisonProject, setComparisonProject] = useState<string | null>(null);

// Add UI section:
{comparisonMode && (
    <div className="grid grid-cols-2 gap-4">
        <div>
            <h3>Current Project</h3>
            {/* Render current project quality report */}
        </div>
        <div>
            <h3>Comparison Project</h3>
            {/* Render selected project quality report */}
        </div>
    </div>
)}
```

**Files Created**:
- `/utils/pdfExport.ts` (~150 LOC)

**Files Modified**:
- `/tabs/AnalyticsTab.tsx` (+120 LOC for comparison mode)
- `/services/analyticsService.ts` (update exportPerformanceMetrics to use pdfExport.ts)

**Testing**:
- Generate quality report
- Export to PDF
- Verify PDF formatting, tables, charts
- Test comparison mode with 2 projects side-by-side

---

### Story 6.4: Director Agent Integration (3 points)

**Implementation Tasks**:

1. **Add Analytics Monitoring** (DirectorWidget.tsx)
```typescript
// Poll analytics every 5 minutes
useEffect(() => {
    const interval = setInterval(async () => {
        if (scriptAnalysis) {
            const qualityReport = await analyzeCreativeQuality(scriptAnalysis);

            // Check for low scores
            const lowScenes = qualityReport.sceneReports.filter(s => s.overallScore < 75);

            if (lowScenes.length > 0) {
                // Display proactive alert
                addMessage({
                    sender: 'ai',
                    text: `⚠️ Quality Alert: ${lowScenes.length} scene(s) have quality issues. ${lowScenes[0].sceneName} scored ${lowScenes[0].overallScore}/100.`,
                    actions: [
                        { label: 'View Analytics', onClick: () => navigateToAnalytics() },
                        { label: 'Get Suggestions', onClick: () => askForSuggestions(lowScenes) }
                    ]
                });
            }
        }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
}, [scriptAnalysis]);
```

2. **Extend askTheDirector() with Analytics Context** (aiService.ts)
```typescript
// Add analytics parameter:
export async function askTheDirector(
    userMessage: string,
    projectContext: any,
    analyticsContext?: CreativeQualityReport
): Promise<string> {
    // Include analytics data in system prompt if available
    const systemPrompt = analyticsContext
        ? `You are analyzing a project with overall quality score ${analyticsContext.overallScore}/100. ${analyticsContext.flaggedShots.length} shots have issues.`
        : 'You are the AI Director for Alkemy AI Studio.';

    // ... rest of function
}
```

**Files Modified**:
- `/components/DirectorWidget.tsx` (+80 LOC)
- `/services/aiService.ts` (+50 LOC)

**Testing**:
- Generate project with quality issues
- Wait 5 minutes (or manually trigger)
- Verify Director alert appears
- Click "View Analytics" → navigates to Analytics Tab
- Click "Get Suggestions" → AI provides actionable tips

---

## Sprint 3.3 - Production Deployment

### Build & Test

```bash
# Full production build
npm run build

# Expected output: Zero errors, warnings acceptable
# Bundle sizes: main chunk <500KB gzip

# Preview production build
npm run preview
# Test all features: Analytics (real CV), Image caching, PDF export, Director alerts
```

### Deploy to Vercel

```bash
# Deploy to production
vercel --prod --yes

# Verify deployment
vercel inspect <deployment-url>

# Check logs for errors
vercel logs <deployment-url> --follow
```

### Post-Deployment Verification Checklist

- [ ] **Homepage loads correctly** (welcome screen or demo project)
- [ ] **Analytics Tab**: Real computer vision scores (not simulated)
- [ ] **Image Search**: No Unsplash 404 errors (cached successfully)
- [ ] **PDF Export**: Click "Export PDF" → downloads formatted report
- [ ] **Director Alerts**: Proactive quality alerts appear after 5 mins
- [ ] **Voice Input**: Microphone button functional (manual test if needed)
- [ ] **Performance Metrics**: CSV export working
- [ ] **No Console Errors**: Check browser console for errors

### Health Check Script

```bash
# Use Playwright MCP to verify production
# Screenshot all features
# Check for console errors
# Verify all functionality
```

---

## Effort Summary

| Story | Points | Duration | Files Modified/Created |
|-------|--------|----------|------------------------|
| 6.1.1 (Real CV) | 5 | 2-3 days | analyticsService.ts (+200 LOC, -90 LOC) |
| 1.1.1 (Image Cache) | 3 | 1-2 days | imageCacheService.ts (+200 LOC), imageSearchService.ts (+80 LOC) |
| QA (Voice Test) | 0 | 2 hours | voice-accuracy-validation-report.md |
| 6.3 (PDF Export) | 6 | 2-3 days | pdfExport.ts (+150 LOC), AnalyticsTab.tsx (+120 LOC) |
| 6.4 (Director Alerts) | 3 | 1-2 days | DirectorWidget.tsx (+80 LOC), aiService.ts (+50 LOC) |
| Deployment | N/A | 1 day | Build, test, deploy, verify |
| **Total** | **17** | **8-10 days** | **~880 LOC added, ~90 LOC modified** |

---

## Risk Assessment

### Technical Risks (LOW)

1. **Gemini Vision API Rate Limits**: Mitigated by progress callbacks and user feedback
2. **Supabase Storage Quota**: 90-day expiration prevents unbounded growth
3. **PDF Chart Rendering**: jsPDF supports canvas export (Recharts → Canvas → PNG → PDF)
4. **Director Alert Frequency**: 5-minute interval prevents spam, user can disable

### Schedule Risks (MEDIUM)

1. **Real CV Integration Complexity**: May take 3-4 days instead of 2-3 days (buffer available)
2. **Image Caching Edge Cases**: Unsplash URL hashing may have collisions (unlikely but possible)
3. **PDF Formatting**: jsPDF may require additional styling for charts (autoTable handles tables well)

### Mitigation Strategies

- **Incremental Deployment**: Deploy Story 6.1.1 first, validate, then deploy 1.1.1, 6.3, 6.4 sequentially
- **Feature Flags**: Add `ENABLE_REAL_CV` flag to toggle between simulated and real CV
- **Rollback Plan**: Vercel rollback takes <2 minutes if critical issue found

---

## Success Criteria

✅ **Sprint 3 Completion Criteria**:
1. Real computer vision replaces all simulated scores (Gemini Vision API)
2. Image caching eliminates Unsplash 404 errors (Supabase Storage)
3. PDF export functional with formatted reports (jsPDF + autoTable)
4. Director proactive alerts working (5-minute quality monitoring)
5. Production deployment successful (zero errors, all features verified)
6. Voice accuracy manually validated >75% (QA report documented)

✅ **User Impact**:
- **Before Sprint 3**: Simulated scores, 404 errors, no PDF export, no proactive alerts
- **After Sprint 3**: Real insights, reliable images, exportable reports, AI quality coaching

✅ **Technical Debt Addressed**:
- Simulated quality scores → Real computer vision (MNT-001 RESOLVED)
- Unsplash 404 errors → Robust caching (REL-001 RESOLVED)
- Voice accuracy unknown → Validated >75% (TEST-001 RESOLVED)

---

## Next Steps After Sprint 3

### Sprint 4 Options:

**Option A (COMPLETED)**: ✅ Epic 2 Character Identity - DONE (2025-11-12)
- Backend API fix complete (correct Fal.ai endpoints)
- Frontend integration complete (CastLocationsTab + SceneAssemblerTab)
- Production deployment verified (HTTP 200)
- Next: End-to-end testing of character identity workflow

**Option B**: Start Epic 3 (3D World Generation) - 35-45 story points
- Story 3.1: 3D scene generation from prompts
- Story 3.2: Camera path animation
- Story 3.3: Lighting and rendering
- Story 3.4: Export to video format

**Option C**: Start Epic 5 (Audio Production) - 30-40 story points
- Story 5.1: Voice selection and assignment
- Story 5.2: Dialogue generation with TTS
- Story 5.3: Audio mixing (dialogue + music + SFX)
- Story 5.4: Export with broadcast-quality audio

**Recommendation**: Option B (Epic 3) - Character identity is complete, 3D worlds provide highest user value next.

---

## Documentation Updates After Sprint 3

1. **Update IMPLEMENTATION_STATUS.md**:
   - Mark Stories 6.1.1, 1.1.1, 6.3, 6.4 as DONE
   - Update sprint completion dates

2. **Update SPRINT_PLAN_V2.0.md**:
   - Mark Sprint 3 complete
   - Add Sprint 4 plan based on Epic R1 PoC results

3. **Create Sprint 3 Session Summary**:
   - Document all changes made
   - Record deployment metrics
   - Note any deviations from plan

4. **Update QA Gates**:
   - Create `/docs/qa/gates/6.1.1-real-computer-vision.yml`
   - Create `/docs/qa/gates/1.1.1-image-caching.yml`
   - Create `/docs/qa/gates/6.3-pdf-export.yml`
   - Create `/docs/qa/gates/6.4-director-integration.yml`

---

## Appendix: Background Agent Reports

### Production Health Check Report
- **Status**: ✅ ALL SYSTEMS OPERATIONAL (100/100)
- **Features Verified**: Analytics Tab, Voice Input, Performance Metrics
- **Console Errors**: 0
- **Network Performance**: 100% success rate
- **Screenshots**: 7 saved to `.playwright-mcp/`

### Epic R1 PoC Research Report
- **Technologies Selected**: Fal.ai Instant (91/100), Fal.ai LoRA (83/100), Astria (79/100)
- **Success Criteria**: >95% CLIP similarity, <$0.15/generation, <30s latency
- **Timeline**: 5 days (setup + testing + reporting)
- **Fallback Plan**: Pivot to Epic 5 if all technologies <90% CLIP

### Technical Decisions Analysis Report
- **Decision Quality**: 85/100
- **Technical Debt**: 11-13 story points (manageable)
- **Risk Level**: LOW (all issues have clear fixes)
- **Confidence**: High - all decisions validated

---

**Document End**

**Next Action**: Review this roadmap, approve Sprint 3 execution, begin implementation with Story 6.1.1 (Real Computer Vision Integration).
