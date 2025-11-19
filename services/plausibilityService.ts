import { ScriptAnalysis, AnalyzedLocation, AnalyzedScene } from '../types';

export type ConstraintType = 'hard' | 'soft' | 'continuity' | 'consistency';
export type Severity = 'critical' | 'warning' | 'info';

export interface PlausibilityIssue {
    id: string;
    type: ConstraintType;
    severity: Severity;
    message: string;
    details?: string;
    suggestion?: string;
    location?: { x: number; y: number; z: number };
}

export interface PlausibilityReport {
    score: number; // 0-100
    issues: PlausibilityIssue[];
    status: 'plausible' | 'questionable' | 'implausible';
}

export class PlausibilityService {
    private static instance: PlausibilityService;

    private constructor() { }

    public static getInstance(): PlausibilityService {
        if (!PlausibilityService.instance) {
            PlausibilityService.instance = new PlausibilityService();
        }
        return PlausibilityService.instance;
    }

    /**
     * Analyze a world generation request against the script analysis
     */
    public analyzeRequest(
        prompt: string,
        scriptAnalysis: ScriptAnalysis | null,
        currentSceneId?: string
    ): PlausibilityReport {
        const issues: PlausibilityIssue[] = [];
        let score = 100;

        if (!scriptAnalysis) {
            return { score: 100, issues: [], status: 'plausible' };
        }

        // 1. Check Hard Constraints (World Rules)
        // Simulated: Check for keywords that might violate "world physics" or "tech level"
        // Example: If script is "Medieval", checking for "Car" or "Spaceship"
        const hardConstraints = this.checkHardConstraints(prompt, scriptAnalysis);
        issues.push(...hardConstraints);
        score -= hardConstraints.length * 20;

        // 2. Check Soft Constraints (Mood/Theme)
        // Example: If scene mood is "Dark", checking for "Bright", "Sunny"
        const softConstraints = this.checkSoftConstraints(prompt, scriptAnalysis, currentSceneId);
        issues.push(...softConstraints);
        score -= softConstraints.length * 10;

        // 3. Check Continuity (Timeline)
        if (currentSceneId) {
            const continuityIssues = this.checkContinuity(prompt, scriptAnalysis, currentSceneId);
            issues.push(...continuityIssues);
            score -= continuityIssues.length * 5;
        }

        return {
            score: Math.max(0, score),
            issues,
            status: score > 80 ? 'plausible' : score > 50 ? 'questionable' : 'implausible'
        };
    }

    private checkHardConstraints(prompt: string, scriptAnalysis: ScriptAnalysis): PlausibilityIssue[] {
        const issues: PlausibilityIssue[] = [];
        const lowerPrompt = prompt.toLowerCase();

        // Example logic: Extract genre/setting from script summary
        const isMedieval = scriptAnalysis.summary.toLowerCase().includes('medieval') ||
            scriptAnalysis.logline.toLowerCase().includes('medieval') ||
            scriptAnalysis.summary.toLowerCase().includes('fantasy');

        const isSciFi = scriptAnalysis.summary.toLowerCase().includes('sci-fi') ||
            scriptAnalysis.logline.toLowerCase().includes('future') ||
            scriptAnalysis.summary.toLowerCase().includes('space');

        if (isMedieval) {
            const anachronisms = ['car', 'phone', 'computer', 'gun', 'plastic', 'neon'];
            anachronisms.forEach(word => {
                if (lowerPrompt.includes(word)) {
                    issues.push({
                        id: `hard_${Date.now()}_${word}`,
                        type: 'hard',
                        severity: 'critical',
                        message: `Anachronism detected: "${word}" in a Medieval setting.`,
                        suggestion: `Remove "${word}" or replace with a period-appropriate alternative.`
                    });
                }
            });
        }

        if (isSciFi) {
            // Example constraint for Sci-Fi
        }

        return issues;
    }

    private checkSoftConstraints(prompt: string, scriptAnalysis: ScriptAnalysis, currentSceneId?: string): PlausibilityIssue[] {
        const issues: PlausibilityIssue[] = [];
        const lowerPrompt = prompt.toLowerCase();

        let targetMood = 'neutral';
        if (currentSceneId) {
            const scene = scriptAnalysis.scenes.find(s => s.id === currentSceneId);
            if (scene?.mood) targetMood = scene.mood.toLowerCase();
        }

        // Mood consistency
        if (targetMood.includes('dark') || targetMood.includes('noir') || targetMood.includes('horror')) {
            const brightWords = ['sunny', 'bright', 'cheerful', 'vibrant', 'colorful'];
            brightWords.forEach(word => {
                if (lowerPrompt.includes(word)) {
                    issues.push({
                        id: `soft_${Date.now()}_${word}`,
                        type: 'soft',
                        severity: 'warning',
                        message: `Tone mismatch: "${word}" conflicts with scene mood "${targetMood}".`,
                        suggestion: `Consider using darker or more muted descriptors.`
                    });
                }
            });
        }

        return issues;
    }

    private checkContinuity(prompt: string, scriptAnalysis: ScriptAnalysis, currentSceneId: string): PlausibilityIssue[] {
        const issues: PlausibilityIssue[] = [];
        // Logic to check if the location has been established before and if it matches
        // This is a placeholder for more complex logic
        return issues;
    }
}

export const plausibilityService = PlausibilityService.getInstance();
