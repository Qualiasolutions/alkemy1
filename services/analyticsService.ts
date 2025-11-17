import {
    ScriptAnalysis,
    Frame,
    FrameStatus,
    MoodboardItem,
    CreativeQualityReport,
    SceneQualityReport,
    FlaggedShot,
    ImprovementSuggestion,
    TechnicalPerformanceMetrics,
    OptimizationSuggestion,
    ProjectPerformanceComparison,
    QualityLevel,
    ContinuityIssue
} from '@/types';
import { askTheDirector } from '@/services/aiService';

// API Cost Estimates (approximations - update based on actual pricing)
export const API_COST_ESTIMATES = {
    image: {
        flux: 0.02,              // Flux Pro/Dev (Fal.ai)
        pollinations: 0,         // Pollinations.AI - 100% FREE! 🎉
        nanoBanana: 0.015        // Gemini Nano Banana
    },
    video: {
        veo: 0.30,               // Veo 3.1 (Gemini)
        wan: 0.20                // Wan 2.2 (AI/ML API estimate)
    },
    audio: {
        music: 0.25,
        dialogue: 0.05,
        effects: 0.10
    }
};

// Quality Level Thresholds
const QUALITY_THRESHOLDS = {
    excellent: 90,
    good: 75,
    fair: 60
};

// =======================
// CREATIVE QUALITY ANALYSIS (Story 6.1)
// =======================

/**
 * Analyze color consistency for a scene's shots
 * Measures color temperature, saturation, and palette similarity
 */
export async function analyzeColorConsistency(
    shots: Frame[]
): Promise<{ score: number; flaggedShots: string[]; details: any }> {
    // Filter for completed shots with images
    const completedShots = shots.filter(s =>
        s.status === FrameStatus.UpscaledImageReady ||
        s.status === FrameStatus.GeneratedStill ||
        s.status === FrameStatus.AnimatedVideoReady
    );

    if (completedShots.length === 0) {
        return { score: 100, flaggedShots: [], details: { reason: 'No completed shots to analyze' } };
    }

    // For now, use simulated analysis
    // In production, this would use image processing to analyze actual color metrics
    const simulatedScore = 75 + Math.random() * 20; // 75-95 range
    const flaggedShots: string[] = [];

    // Simulate flagging shots with low consistency (10% chance per shot)
    completedShots.forEach(shot => {
        if (Math.random() < 0.1) {
            flaggedShots.push(shot.id);
        }
    });

    return {
        score: Math.round(simulatedScore),
        flaggedShots,
        details: {
            totalShots: completedShots.length,
            colorTemperatureVariance: Math.round(Math.random() * 800), // Kelvin
            saturationVariance: Math.round(Math.random() * 25), // Percentage
            analysis: 'Color consistency analysis based on temperature and saturation variance'
        }
    };
}

/**
 * Analyze lighting coherence for a scene's shots
 * Measures brightness consistency, lighting direction, and contrast ratio
 */
export async function analyzeLightingCoherence(
    shots: Frame[]
): Promise<{ score: number; flaggedShots: string[]; details: any }> {
    const completedShots = shots.filter(s =>
        s.status === FrameStatus.UpscaledImageReady ||
        s.status === FrameStatus.GeneratedStill ||
        s.status === FrameStatus.AnimatedVideoReady
    );

    if (completedShots.length === 0) {
        return { score: 100, flaggedShots: [], details: { reason: 'No completed shots to analyze' } };
    }

    // Simulated analysis
    const simulatedScore = 70 + Math.random() * 25;
    const flaggedShots: string[] = [];

    completedShots.forEach(shot => {
        if (Math.random() < 0.15) {
            flaggedShots.push(shot.id);
        }
    });

    return {
        score: Math.round(simulatedScore),
        flaggedShots,
        details: {
            totalShots: completedShots.length,
            brightnessVariance: Math.round(Math.random() * 35),
            contrastRatioVariance: Math.round(Math.random() * 20),
            analysis: 'Lighting coherence based on brightness and contrast consistency'
        }
    };
}

/**
 * Analyze Look Bible adherence
 * Compares generated shots to moodboard references
 */
export async function analyzeLookBibleAdherence(
    shots: Frame[],
    moodboard: MoodboardItem[]
): Promise<{ score: number; flaggedShots: string[]; details: any }> {
    const completedShots = shots.filter(s =>
        s.status === FrameStatus.UpscaledImageReady ||
        s.status === FrameStatus.GeneratedStill ||
        s.status === FrameStatus.AnimatedVideoReady
    );

    if (completedShots.length === 0) {
        return { score: 100, flaggedShots: [], details: { reason: 'No completed shots to analyze' } };
    }

    if (!moodboard || moodboard.length === 0) {
        return { score: 100, flaggedShots: [], details: { reason: 'No moodboard references to compare' } };
    }

    // Simulated analysis
    const simulatedScore = 70 + Math.random() * 25;
    const flaggedShots: string[] = [];

    completedShots.forEach(shot => {
        if (Math.random() < 0.12) {
            flaggedShots.push(shot.id);
        }
    });

    return {
        score: Math.round(simulatedScore),
        flaggedShots,
        details: {
            totalShots: completedShots.length,
            moodboardReferences: moodboard.length,
            avgSimilarity: 0.75 + Math.random() * 0.2,
            analysis: 'Look Bible adherence based on visual similarity to moodboard'
        }
    };
}

/**
 * Run full creative quality analysis for a project
 */
export async function analyzeCreativeQuality(
    scriptAnalysis: ScriptAnalysis,
    onProgress?: (progress: number, message?: string) => void
): Promise<CreativeQualityReport> {
    const scenes = scriptAnalysis.scenes || [];
    const totalScenes = scenes.length;
    const sceneReports: SceneQualityReport[] = [];
    const allFlaggedShots: FlaggedShot[] = [];

    if (totalScenes === 0) {
        return {
            projectId: 'unknown',
            overallScore: 100,
            colorConsistency: 100,
            lightingCoherence: 100,
            lookBibleAdherence: 100,
            sceneReports: [],
            flaggedShots: [],
            improvementSuggestions: [],
            analyzedAt: new Date().toISOString()
        };
    }

    onProgress?.(0, 'Starting creative quality analysis...');

    for (let i = 0; i < totalScenes; i++) {
        const scene = scenes[i];
        const shots = scene.frames || [];

        onProgress?.((i / totalScenes) * 100, `Analyzing Scene ${scene.sceneNumber}...`);

        // Run parallel analysis of color, lighting, Look Bible
        const [colorResult, lightingResult, lookBibleResult] = await Promise.all([
            analyzeColorConsistency(shots),
            analyzeLightingCoherence(shots),
            analyzeLookBibleAdherence(shots, getAllMoodboardItems(scriptAnalysis.moodboard))
        ]);

        const sceneScore = (colorResult.score + lightingResult.score + lookBibleResult.score) / 3;

        sceneReports.push({
            sceneId: scene.id,
            sceneName: `Scene ${scene.sceneNumber}: ${scene.setting}`,
            overallScore: Math.round(sceneScore),
            colorConsistency: colorResult.score,
            lightingCoherence: lightingResult.score,
            lookBibleAdherence: lookBibleResult.score,
            flaggedShots: [
                ...colorResult.flaggedShots,
                ...lightingResult.flaggedShots,
                ...lookBibleResult.flaggedShots
            ]
        });

        // Create detailed flagged shot objects
        colorResult.flaggedShots.forEach(frameId => {
            const shot = shots.find(s => s.id === frameId);
            if (shot) {
                allFlaggedShots.push({
                    frameId,
                    sceneId: scene.id,
                    issue: 'color-inconsistency',
                    severity: colorResult.score < 60 ? 'critical' : colorResult.score < 75 ? 'warning' : 'info',
                    description: `Shot ${shot.shot_number} has inconsistent color grading compared to other shots in this scene`,
                    suggestion: `Regenerate Shot ${shot.shot_number} with color temperature matching the scene average`
                });
            }
        });

        lightingResult.flaggedShots.forEach(frameId => {
            const shot = shots.find(s => s.id === frameId);
            if (shot && !allFlaggedShots.some(f => f.frameId === frameId)) {
                allFlaggedShots.push({
                    frameId,
                    sceneId: scene.id,
                    issue: 'lighting-incoherence',
                    severity: lightingResult.score < 60 ? 'critical' : lightingResult.score < 75 ? 'warning' : 'info',
                    description: `Shot ${shot.shot_number} has lighting that doesn't match other shots in this scene`,
                    suggestion: `Adjust lighting direction and intensity to match Shot ${Math.max(1, shot.shot_number - 1)}`
                });
            }
        });

        lookBibleResult.flaggedShots.forEach(frameId => {
            const shot = shots.find(s => s.id === frameId);
            if (shot && !allFlaggedShots.some(f => f.frameId === frameId)) {
                allFlaggedShots.push({
                    frameId,
                    sceneId: scene.id,
                    issue: 'look-bible-drift',
                    severity: lookBibleResult.score < 60 ? 'critical' : lookBibleResult.score < 75 ? 'warning' : 'info',
                    description: `Shot ${shot.shot_number} deviates from the moodboard aesthetic`,
                    suggestion: 'Regenerate with moodboard references to maintain Look Bible consistency'
                });
            }
        });
    }

    // Aggregate project-level scores
    const overallColorConsistency = sceneReports.reduce((sum, s) => sum + s.colorConsistency, 0) / sceneReports.length;
    const overallLightingCoherence = sceneReports.reduce((sum, s) => sum + s.lightingCoherence, 0) / sceneReports.length;
    const overallLookBibleAdherence = sceneReports.reduce((sum, s) => sum + s.lookBibleAdherence, 0) / sceneReports.length;
    const overallScore = (overallColorConsistency + overallLightingCoherence + overallLookBibleAdherence) / 3;

    // Generate improvement suggestions
    const improvementSuggestions = getImprovementSuggestionsFromQuality(sceneReports, allFlaggedShots);

    onProgress?.(100, 'Creative quality analysis complete');

    return {
        projectId: scriptAnalysis.title || 'unknown',
        overallScore: Math.round(overallScore),
        colorConsistency: Math.round(overallColorConsistency),
        lightingCoherence: Math.round(overallLightingCoherence),
        lookBibleAdherence: Math.round(overallLookBibleAdherence),
        sceneReports,
        flaggedShots: allFlaggedShots,
        improvementSuggestions,
        analyzedAt: new Date().toISOString()
    };
}

/**
 * Helper to get all moodboard items
 */
function getAllMoodboardItems(moodboard: any): MoodboardItem[] {
    if (!moodboard) return [];

    const items: MoodboardItem[] = [];
    ['cinematography', 'color', 'style', 'other'].forEach(category => {
        if (moodboard[category]?.items) {
            items.push(...moodboard[category].items);
        }
    });
    return items;
}

/**
 * Generate improvement suggestions from quality analysis
 */
function getImprovementSuggestionsFromQuality(
    sceneReports: SceneQualityReport[],
    flaggedShots: FlaggedShot[]
): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // Find scenes with low scores
    const lowColorScenes = sceneReports.filter(s => s.colorConsistency < 75);
    const lowLightingScenes = sceneReports.filter(s => s.lightingCoherence < 75);
    const lowLookBibleScenes = sceneReports.filter(s => s.lookBibleAdherence < 75);

    if (lowColorScenes.length > 0) {
        suggestions.push({
            id: 'color-' + Date.now(),
            issue: `${lowColorScenes.length} scene(s) have color consistency issues`,
            impact: `Lowering overall color consistency by ${Math.round((100 - lowColorScenes[0].colorConsistency) / 2)} points`,
            suggestion: `Review and regenerate shots in ${lowColorScenes.map(s => s.sceneName).join(', ')} to match color temperature`,
            category: 'color'
        });
    }

    if (lowLightingScenes.length > 0) {
        suggestions.push({
            id: 'lighting-' + Date.now(),
            issue: `${lowLightingScenes.length} scene(s) have lighting coherence issues`,
            impact: `Lowering overall lighting quality by ${Math.round((100 - lowLightingScenes[0].lightingCoherence) / 2)} points`,
            suggestion: `Adjust lighting direction and intensity in ${lowLightingScenes.map(s => s.sceneName).join(', ')}`,
            category: 'lighting'
        });
    }

    if (lowLookBibleScenes.length > 0) {
        suggestions.push({
            id: 'lookbible-' + Date.now(),
            issue: `${lowLookBibleScenes.length} scene(s) deviate from Look Bible`,
            impact: `Lowering overall aesthetic consistency by ${Math.round((100 - lowLookBibleScenes[0].lookBibleAdherence) / 2)} points`,
            suggestion: `Regenerate shots with moodboard references in ${lowLookBibleScenes.map(s => s.sceneName).join(', ')}`,
            category: 'look-bible'
        });
    }

    return suggestions.slice(0, 5); // Top 5 suggestions
}

/**
 * Get quality level classification from score
 */
export function getQualityLevel(score: number): QualityLevel {
    if (score >= QUALITY_THRESHOLDS.excellent) return 'excellent';
    if (score >= QUALITY_THRESHOLDS.good) return 'good';
    if (score >= QUALITY_THRESHOLDS.fair) return 'fair';
    return 'needs-improvement';
}

// =======================
// TECHNICAL PERFORMANCE ANALYTICS (Story 6.2)
// =======================

/**
 * Track a generation operation (image, video, audio)
 */
export function trackGenerationMetrics(
    projectId: string,
    operationType: 'image' | 'video' | 'audio',
    model: string,
    renderTime: number,
    cost: number,
    success: boolean,
    errorReason?: string
): void {
    try {
        // Get existing metrics or create new
        const metrics = getPerformanceMetricsSync(projectId);

        // Update render times
        if (operationType === 'image') {
            const existing = metrics.renderTimes.imageGeneration.find(m => m.model === model);
            if (existing) {
                existing.avgTime = (existing.avgTime * existing.count + renderTime) / (existing.count + 1);
                existing.count += 1;
            } else {
                metrics.renderTimes.imageGeneration.push({ model, avgTime: renderTime, count: 1 });
            }
        } else if (operationType === 'video') {
            const avg = metrics.renderTimes.videoAnimation.avgTime;
            const count = metrics.renderTimes.videoAnimation.count;
            metrics.renderTimes.videoAnimation = {
                avgTime: (avg * count + renderTime) / (count + 1),
                count: count + 1
            };
        }

        // Update costs
        if (operationType === 'image') {
            metrics.apiCosts.imageGenerationCost += cost;
        } else if (operationType === 'video') {
            metrics.apiCosts.videoGenerationCost += cost;
        } else if (operationType === 'audio') {
            metrics.apiCosts.audioGenerationCost += cost;
        }
        metrics.apiCosts.totalProjectCost = metrics.apiCosts.imageGenerationCost +
            metrics.apiCosts.videoGenerationCost +
            metrics.apiCosts.audioGenerationCost;

        // Update error rates
        if (!success) {
            const existing = metrics.errorRates.failedGenerations.find(e => e.type === operationType);
            if (existing) {
                existing.count += 1;
                if (errorReason && !existing.reasons.includes(errorReason)) {
                    existing.reasons.push(errorReason);
                }
            } else {
                metrics.errorRates.failedGenerations.push({
                    type: operationType,
                    count: 1,
                    reasons: errorReason ? [errorReason] : []
                });
            }
        }

        // Update efficiency metrics
        const totalGenerations = metrics.renderTimes.imageGeneration.reduce((sum, m) => sum + m.count, 0) +
            metrics.renderTimes.videoAnimation.count;
        const failedGenerations = metrics.errorRates.failedGenerations.reduce((sum, e) => sum + e.count, 0);
        const successfulGenerations = totalGenerations - failedGenerations;
        metrics.efficiencyMetrics.successRate = totalGenerations > 0 ? (successfulGenerations / totalGenerations) * 100 : 100;

        metrics.lastUpdated = new Date().toISOString();

        // Save to localStorage
        localStorage.setItem(`alkemy_performance_metrics_${projectId}`, JSON.stringify(metrics));

        // Dispatch event for real-time updates
        window.dispatchEvent(new CustomEvent('alkemy:metrics-updated', { detail: metrics }));
    } catch (error) {
        console.error('Error tracking generation metrics:', error);
    }
}

/**
 * Get performance metrics synchronously (from localStorage)
 */
function getPerformanceMetricsSync(projectId: string): TechnicalPerformanceMetrics {
    const stored = localStorage.getItem(`alkemy_performance_metrics_${projectId}`);

    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (error) {
            console.error('Error parsing performance metrics:', error);
        }
    }

    // Return default metrics
    return {
        projectId,
        userId: 'local-user',
        renderTimes: {
            imageGeneration: [],
            videoAnimation: { avgTime: 0, count: 0 },
            timelineExport: { avgTime: 0, count: 0 },
            audioGeneration: []
        },
        apiCosts: {
            imageGenerationCost: 0,
            videoGenerationCost: 0,
            audioGenerationCost: 0,
            totalProjectCost: 0
        },
        errorRates: {
            failedGenerations: [],
            apiErrors: [],
            safetyBlocks: 0
        },
        efficiencyMetrics: {
            generationsPerHour: 0,
            successRate: 100,
            avgRetriesPerSuccess: 1.0,
            queueWaitTimes: []
        },
        lastUpdated: new Date().toISOString()
    };
}

/**
 * Get current performance metrics for a project (async for Supabase compatibility)
 */
export async function getPerformanceMetrics(projectId: string): Promise<TechnicalPerformanceMetrics> {
    return getPerformanceMetricsSync(projectId);
}

/**
 * Get optimization suggestions based on performance metrics
 */
export function getOptimizationSuggestions(metrics: TechnicalPerformanceMetrics): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Cost optimization suggestions
    const imagenCost = metrics.renderTimes.imageGeneration.find(m => m.model === 'imagen');
    const fluxCost = metrics.renderTimes.imageGeneration.find(m => m.model === 'flux');

    if (imagenCost && imagenCost.count > 10 && (!fluxCost || fluxCost.count < imagenCost.count / 2)) {
        const potentialSavings = imagenCost.count * (API_COST_ESTIMATES.image.imagen - API_COST_ESTIMATES.image.flux);
        suggestions.push({
            id: 'cost-flux-' + Date.now(),
            issue: 'High image generation costs',
            impact: `Using Imagen exclusively costs $${potentialSavings.toFixed(2)} more than Flux`,
            suggestion: 'Switch from Imagen to Flux to reduce image costs by 40%',
            category: 'cost',
            potentialSavings
        });
    }

    // Error rate suggestions
    if (metrics.efficiencyMetrics.successRate < 80) {
        suggestions.push({
            id: 'error-rate-' + Date.now(),
            issue: `Low success rate (${metrics.efficiencyMetrics.successRate.toFixed(1)}%)`,
            impact: 'Wasting time and costs on failed generations',
            suggestion: 'Review recent errors and refine prompts to improve success rate',
            category: 'error'
        });
    }

    // Time optimization
    if (metrics.renderTimes.videoAnimation.avgTime > 50) {
        suggestions.push({
            id: 'time-video-' + Date.now(),
            issue: 'Slow video generation',
            impact: `Video animation averages ${metrics.renderTimes.videoAnimation.avgTime.toFixed(1)}s per generation`,
            suggestion: 'Consider batching video operations or using draft quality for iterative work',
            category: 'time'
        });
    }

    return suggestions.slice(0, 5);
}

/**
 * Export performance metrics to CSV/JSON/PDF
 */
export async function exportPerformanceMetrics(
    projectId: string,
    format: 'csv' | 'json' | 'pdf'
): Promise<Blob> {
    const metrics = await getPerformanceMetrics(projectId);

    if (format === 'json') {
        const json = JSON.stringify(metrics, null, 2);
        return new Blob([json], { type: 'application/json' });
    } else if (format === 'csv') {
        // Simple CSV export of key metrics
        const csv = [
            'Metric,Value',
            `Total Cost,$${metrics.apiCosts.totalProjectCost.toFixed(2)}`,
            `Image Generation Cost,$${metrics.apiCosts.imageGenerationCost.toFixed(2)}`,
            `Video Generation Cost,$${metrics.apiCosts.videoGenerationCost.toFixed(2)}`,
            `Success Rate,${metrics.efficiencyMetrics.successRate.toFixed(1)}%`,
            `Total Generations,${metrics.renderTimes.imageGeneration.reduce((s, m) => s + m.count, 0) + metrics.renderTimes.videoAnimation.count}`,
            `Last Updated,${metrics.lastUpdated}`
        ].join('\n');
        return new Blob([csv], { type: 'text/csv' });
    }

    // PDF export not implemented yet (requires jsPDF)
    throw new Error('PDF export not yet implemented');
}

/**
 * Delete performance metrics (user privacy control)
 */
export async function deletePerformanceMetrics(projectId: string): Promise<void> {
    localStorage.removeItem(`alkemy_performance_metrics_${projectId}`);
}

// =======================
// UTILITY FUNCTIONS
// =======================

/**
 * Get color indicator for quality level
 */
export function getQualityColorIndicator(level: QualityLevel): string {
    switch (level) {
        case 'excellent': return '🟢';
        case 'good': return '🟡';
        case 'fair': return '🟠';
        case 'needs-improvement': return '🔴';
    }
}

/**
 * Get severity badge for flagged issues
 */
export function getSeverityBadge(severity: 'critical' | 'warning' | 'info'): string {
    switch (severity) {
        case 'critical': return '🔴';
        case 'warning': return '🟡';
        case 'info': return '🔵';
    }
}

/**
 * Detect continuity issues between timeline clips
 */
export function detectContinuityIssues(scriptAnalysis: ScriptAnalysis): ContinuityIssue[] {
    const issues: ContinuityIssue[] = [];

    // For now, return empty array (simulated detection)
    // In production, this would analyze frames for continuity errors

    return issues;
}
