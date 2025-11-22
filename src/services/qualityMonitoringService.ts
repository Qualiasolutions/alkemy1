import type { CreativeQualityReport, ScriptAnalysis, TechnicalPerformanceMetrics } from '@/types'
import { analyzeCreativeQuality, getPerformanceMetrics, getQualityLevel } from './analyticsService'

// Types for quality monitoring
export interface QualityAlert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  category: 'quality' | 'performance' | 'cost' | 'continuity'
  title: string
  message: string
  suggestion?: string
  actionRequired?: boolean
  timestamp: Date
  relatedSceneId?: string
  relatedFrameId?: string
}

export interface QualitySuggestion {
  id: string
  category: 'lighting' | 'color' | 'composition' | 'consistency' | 'technical'
  suggestion: string
  impact: 'high' | 'medium' | 'low'
  autoApplicable?: boolean
  parameters?: Record<string, any>
}

export interface MonitoringState {
  isMonitoring: boolean
  lastCheck: Date | null
  alertQueue: QualityAlert[]
  suggestions: QualitySuggestion[]
  qualityThreshold: number
  costThreshold: number
}

// Default thresholds
const DEFAULT_QUALITY_THRESHOLD = 70 // Alert if quality drops below 70%
const DEFAULT_COST_THRESHOLD = 50 // Alert if project exceeds $50
const CHECK_INTERVAL = 30000 // Check every 30 seconds

// Monitoring state
const monitoringState: MonitoringState = {
  isMonitoring: false,
  lastCheck: null,
  alertQueue: [],
  suggestions: [],
  qualityThreshold: DEFAULT_QUALITY_THRESHOLD,
  costThreshold: DEFAULT_COST_THRESHOLD,
}

// Active monitoring interval
let monitoringInterval: NodeJS.Timeout | null = null

/**
 * Start quality monitoring for a project
 */
export function startQualityMonitoring(
  projectId: string,
  scriptAnalysis: ScriptAnalysis,
  onAlert?: (alert: QualityAlert) => void,
  onSuggestion?: (suggestion: QualitySuggestion) => void
): void {
  console.log('[Quality Monitor] Starting monitoring for project:', projectId)

  // Clear any existing monitoring
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
  }

  monitoringState.isMonitoring = true
  monitoringState.lastCheck = new Date()

  // Start periodic checks
  monitoringInterval = setInterval(async () => {
    try {
      await performQualityCheck(projectId, scriptAnalysis, onAlert, onSuggestion)
    } catch (error) {
      console.error('[Quality Monitor] Error during check:', error)
    }
  }, CHECK_INTERVAL)

  // Perform initial check
  performQualityCheck(projectId, scriptAnalysis, onAlert, onSuggestion)
}

/**
 * Stop quality monitoring
 */
export function stopQualityMonitoring(): void {
  console.log('[Quality Monitor] Stopping monitoring')

  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
  }

  monitoringState.isMonitoring = false
}

/**
 * Perform a quality check
 */
async function performQualityCheck(
  projectId: string,
  scriptAnalysis: ScriptAnalysis,
  onAlert?: (alert: QualityAlert) => void,
  onSuggestion?: (suggestion: QualitySuggestion) => void
): Promise<void> {
  console.log('[Quality Monitor] Performing quality check')

  try {
    // Get current metrics
    const performanceMetrics = await getPerformanceMetrics(projectId)

    // Analyze current quality
    const qualityReport = await analyzeCreativeQuality(scriptAnalysis)

    // Check for quality issues
    checkQualityThresholds(qualityReport, performanceMetrics, onAlert)

    // Generate proactive suggestions
    generateProactiveSuggestions(scriptAnalysis, qualityReport, performanceMetrics, onSuggestion)

    // Check for cost overruns
    checkCostThresholds(performanceMetrics, onAlert)

    // Check for continuity issues
    checkContinuityIssues(scriptAnalysis, onAlert)

    monitoringState.lastCheck = new Date()
  } catch (error) {
    console.error('[Quality Monitor] Check failed:', error)
  }
}

/**
 * Check quality thresholds and generate alerts
 */
function checkQualityThresholds(
  qualityReport: CreativeQualityReport,
  _performanceMetrics: TechnicalPerformanceMetrics | null,
  onAlert?: (alert: QualityAlert) => void
): void {
  // Check overall quality score
  if (qualityReport.overallScore < monitoringState.qualityThreshold) {
    const alert: QualityAlert = {
      id: `quality-${Date.now()}`,
      severity: qualityReport.overallScore < 50 ? 'critical' : 'warning',
      category: 'quality',
      title: 'Quality Score Below Threshold',
      message: `Overall quality score is ${qualityReport.overallScore}/100, below the threshold of ${monitoringState.qualityThreshold}.`,
      suggestion: 'Review color consistency and lighting coherence across scenes.',
      actionRequired: qualityReport.overallScore < 50,
      timestamp: new Date(),
    }

    addAlert(alert, onAlert)
  }

  // Check for specific dimension issues
  if (qualityReport.colorConsistency < 60) {
    const alert: QualityAlert = {
      id: `color-${Date.now()}`,
      severity: 'warning',
      category: 'quality',
      title: 'Color Consistency Issues',
      message: `Color consistency is low at ${qualityReport.colorConsistency}/100. Your scenes have varying color palettes.`,
      suggestion:
        'Use a consistent color grading LUT or establish a stronger color palette in your prompts.',
      timestamp: new Date(),
    }

    addAlert(alert, onAlert)
  }

  if (qualityReport.lightingCoherence < 60) {
    const alert: QualityAlert = {
      id: `lighting-${Date.now()}`,
      severity: 'warning',
      category: 'quality',
      title: 'Lighting Inconsistency Detected',
      message: `Lighting coherence is ${qualityReport.lightingCoherence}/100. Scenes have mismatched lighting conditions.`,
      suggestion:
        'Standardize lighting descriptions (e.g., "golden hour", "soft daylight") across related scenes.',
      timestamp: new Date(),
    }

    addAlert(alert, onAlert)
  }

  // Check for scene-specific issues
  qualityReport.sceneReports.forEach((scene) => {
    if (scene.overallScore < 50) {
      const alert: QualityAlert = {
        id: `scene-${scene.sceneId}-${Date.now()}`,
        severity: 'critical',
        category: 'quality',
        title: `Low Quality in "${scene.sceneName}"`,
        message: `Scene quality is critically low at ${scene.overallScore}/100.`,
        suggestion:
          'Consider regenerating this scene with refined prompts or better reference images.',
        actionRequired: true,
        timestamp: new Date(),
        relatedSceneId: scene.sceneId,
      }

      addAlert(alert, onAlert)
    }
  })
}

/**
 * Check cost thresholds
 */
function checkCostThresholds(
  performanceMetrics: TechnicalPerformanceMetrics | null,
  onAlert?: (alert: QualityAlert) => void
): void {
  if (!performanceMetrics) return

  // Check total cost
  if (performanceMetrics.apiCosts.totalProjectCost > monitoringState.costThreshold) {
    const alert: QualityAlert = {
      id: `cost-${Date.now()}`,
      severity:
        performanceMetrics.apiCosts.totalProjectCost > monitoringState.costThreshold * 2
          ? 'critical'
          : 'warning',
      category: 'cost',
      title: 'Project Cost Exceeding Budget',
      message: `Total cost is $${performanceMetrics.apiCosts.totalProjectCost.toFixed(2)}, exceeding the threshold of $${monitoringState.costThreshold}.`,
      suggestion:
        'Consider using more cost-effective models for drafts or reducing the number of variations.',
      actionRequired:
        performanceMetrics.apiCosts.totalProjectCost > monitoringState.costThreshold * 2,
      timestamp: new Date(),
    }

    addAlert(alert, onAlert)
  }

  // Check efficiency
  if (performanceMetrics.efficiencyMetrics.successRate < 70) {
    const alert: QualityAlert = {
      id: `efficiency-${Date.now()}`,
      severity: 'warning',
      category: 'performance',
      title: 'Low Generation Success Rate',
      message: `Success rate is only ${performanceMetrics.efficiencyMetrics.successRate.toFixed(1)}%, indicating frequent failures.`,
      suggestion:
        'Review failed generations to identify common issues. Consider simplifying prompts or checking API quotas.',
      timestamp: new Date(),
    }

    addAlert(alert, onAlert)
  }
}

/**
 * Check for continuity issues
 */
function checkContinuityIssues(
  scriptAnalysis: ScriptAnalysis,
  onAlert?: (alert: QualityAlert) => void
): void {
  // Check for character consistency issues
  const charactersWithoutIdentity = scriptAnalysis.characters.filter(
    (char) => !char.identity || char.identity.status !== 'ready'
  )

  if (charactersWithoutIdentity.length > 0 && scriptAnalysis.scenes.length > 3) {
    const alert: QualityAlert = {
      id: `continuity-char-${Date.now()}`,
      severity: 'info',
      category: 'continuity',
      title: 'Characters Without Visual Identity',
      message: `${charactersWithoutIdentity.length} character(s) don't have trained identities, which may cause visual inconsistency.`,
      suggestion: `Train LoRA models for: ${charactersWithoutIdentity.map((c) => c.name).join(', ')}`,
      timestamp: new Date(),
    }

    addAlert(alert, onAlert)
  }

  // Check for scene transition issues
  scriptAnalysis.scenes.forEach((scene, index) => {
    if (index > 0) {
      const previousScene = scriptAnalysis.scenes[index - 1]

      // Check for time of day consistency
      if (scene.timeOfDay && previousScene.timeOfDay) {
        const timeTransition = getTimeTransition(previousScene.timeOfDay, scene.timeOfDay)
        if (timeTransition === 'invalid') {
          const alert: QualityAlert = {
            id: `continuity-time-${scene.id}-${Date.now()}`,
            severity: 'warning',
            category: 'continuity',
            title: 'Time Continuity Issue',
            message: `Scene "${scene.title}" jumps from ${previousScene.timeOfDay} to ${scene.timeOfDay} without transition.`,
            suggestion: 'Add a transition scene or adjust the timeline for logical progression.',
            timestamp: new Date(),
            relatedSceneId: scene.id,
          }

          addAlert(alert, onAlert)
        }
      }
    }
  })
}

/**
 * Generate proactive suggestions based on current state
 */
function generateProactiveSuggestions(
  scriptAnalysis: ScriptAnalysis,
  qualityReport: CreativeQualityReport,
  performanceMetrics: TechnicalPerformanceMetrics | null,
  onSuggestion?: (suggestion: QualitySuggestion) => void
): void {
  const suggestions: QualitySuggestion[] = []

  // Lighting suggestions
  if (qualityReport.lightingCoherence < 80) {
    suggestions.push({
      id: `lighting-${Date.now()}`,
      category: 'lighting',
      suggestion:
        'Try using consistent lighting keywords like "soft diffused light" or "dramatic chiaroscuro" across scenes.',
      impact: 'high',
      autoApplicable: true,
      parameters: {
        lightingPreset: 'soft-diffused',
        intensity: 0.8,
      },
    })
  }

  // Color palette suggestions
  if (qualityReport.colorConsistency < 80) {
    suggestions.push({
      id: `color-${Date.now()}`,
      category: 'color',
      suggestion:
        'Establish a color palette. Consider: warm earth tones, cool blues, or desaturated noir palette.',
      impact: 'high',
      autoApplicable: true,
      parameters: {
        colorGrading: 'warm-earth',
        saturation: 0.7,
      },
    })
  }

  // Composition suggestions
  const needsCompositionHelp = qualityReport.sceneReports.some((scene) => scene.overallScore < 60)

  if (needsCompositionHelp) {
    suggestions.push({
      id: `composition-${Date.now()}`,
      category: 'composition',
      suggestion: 'Apply rule of thirds and leading lines to improve visual composition.',
      impact: 'medium',
      autoApplicable: false,
    })
  }

  // Technical optimization suggestions
  if (performanceMetrics && performanceMetrics.apiCosts.totalProjectCost > 20) {
    suggestions.push({
      id: `technical-${Date.now()}`,
      category: 'technical',
      suggestion: 'Use Gemini Flash for draft iterations, then switch to Flux for final renders.',
      impact: 'high',
      autoApplicable: true,
      parameters: {
        draftModel: 'gemini-flash',
        finalModel: 'flux-pro',
      },
    })
  }

  // Consistency suggestions based on character identity
  const charactersNeedingIdentity = scriptAnalysis.characters.filter(
    (char) =>
      (!char.identity || char.identity.status !== 'ready') && char.scenes && char.scenes.length > 2
  )

  if (charactersNeedingIdentity.length > 0) {
    suggestions.push({
      id: `consistency-${Date.now()}`,
      category: 'consistency',
      suggestion: `Train character identities for ${charactersNeedingIdentity.map((c) => c.name).join(', ')} to maintain visual consistency.`,
      impact: 'high',
      autoApplicable: false,
    })
  }

  // Send suggestions
  suggestions.forEach((suggestion) => {
    if (!monitoringState.suggestions.find((s) => s.category === suggestion.category)) {
      monitoringState.suggestions.push(suggestion)
      onSuggestion?.(suggestion)
    }
  })
}

/**
 * Add alert to queue and trigger callback
 */
function addAlert(alert: QualityAlert, onAlert?: (alert: QualityAlert) => void): void {
  // Check if similar alert already exists
  const existingAlert = monitoringState.alertQueue.find(
    (a) => a.category === alert.category && a.title === alert.title
  )

  if (!existingAlert || Date.now() - existingAlert.timestamp.getTime() > 300000) {
    // Re-alert after 5 minutes
    monitoringState.alertQueue.push(alert)

    // Keep only last 20 alerts
    if (monitoringState.alertQueue.length > 20) {
      monitoringState.alertQueue.shift()
    }

    onAlert?.(alert)
  }
}

/**
 * Get time transition validity
 */
function getTimeTransition(from: string, to: string): 'valid' | 'invalid' {
  const timeOrder = ['dawn', 'morning', 'day', 'afternoon', 'evening', 'dusk', 'night']
  const fromIndex = timeOrder.findIndex((t) => from.toLowerCase().includes(t))
  const toIndex = timeOrder.findIndex((t) => to.toLowerCase().includes(t))

  if (fromIndex === -1 || toIndex === -1) return 'valid' // Can't determine

  // Allow forward progression or small jumps
  const diff = Math.abs(toIndex - fromIndex)
  return diff <= 2 ? 'valid' : 'invalid'
}

/**
 * Get current monitoring state
 */
export function getMonitoringState(): MonitoringState {
  return { ...monitoringState }
}

/**
 * Clear all alerts
 */
export function clearAlerts(): void {
  monitoringState.alertQueue = []
}

/**
 * Clear all suggestions
 */
export function clearSuggestions(): void {
  monitoringState.suggestions = []
}

/**
 * Update monitoring thresholds
 */
export function updateThresholds(qualityThreshold?: number, costThreshold?: number): void {
  if (qualityThreshold !== undefined) {
    monitoringState.qualityThreshold = qualityThreshold
  }
  if (costThreshold !== undefined) {
    monitoringState.costThreshold = costThreshold
  }
}

/**
 * Get active alerts
 */
export function getActiveAlerts(): QualityAlert[] {
  // Return recent alerts (last 1 hour)
  const oneHourAgo = Date.now() - 3600000
  return monitoringState.alertQueue.filter((alert) => alert.timestamp.getTime() > oneHourAgo)
}

/**
 * Get active suggestions
 */
export function getActiveSuggestions(): QualitySuggestion[] {
  return [...monitoringState.suggestions]
}

/**
 * Dismiss an alert
 */
export function dismissAlert(alertId: string): void {
  monitoringState.alertQueue = monitoringState.alertQueue.filter((alert) => alert.id !== alertId)
}

/**
 * Apply a suggestion automatically
 */
export async function applySuggestion(
  suggestionId: string,
  _scriptAnalysis: ScriptAnalysis
): Promise<boolean> {
  const suggestion = monitoringState.suggestions.find((s) => s.id === suggestionId)

  if (!suggestion || !suggestion.autoApplicable) {
    return false
  }

  try {
    // Apply suggestion parameters to future generations
    if (suggestion.parameters) {
      // Store parameters for use in generation prompts
      localStorage.setItem('quality-suggestion-params', JSON.stringify(suggestion.parameters))
    }

    // Remove applied suggestion
    monitoringState.suggestions = monitoringState.suggestions.filter((s) => s.id !== suggestionId)

    return true
  } catch (error) {
    console.error('[Quality Monitor] Failed to apply suggestion:', error)
    return false
  }
}

/**
 * Generate quality report for Director
 */
export function generateDirectorQualityReport(
  qualityReport: CreativeQualityReport | null,
  performanceMetrics: TechnicalPerformanceMetrics | null
): string {
  if (!qualityReport && !performanceMetrics) {
    return 'No quality data available yet. Generate some content first.'
  }

  let report = '📊 **Quality Report**\n\n'

  if (qualityReport) {
    const level = getQualityLevel(qualityReport.overallScore)
    report += `**Overall Quality**: ${qualityReport.overallScore}/100 (${level})\n`
    report += `**Color Consistency**: ${qualityReport.colorConsistency}/100\n`
    report += `**Lighting Coherence**: ${qualityReport.lightingCoherence}/100\n`
    report += `**Look Bible Adherence**: ${qualityReport.lookBibleAdherence}/100\n\n`

    if (qualityReport.improvementSuggestions.length > 0) {
      report += '**Top Issues**:\n'
      qualityReport.improvementSuggestions.slice(0, 3).forEach((suggestion) => {
        report += `• ${suggestion.issue}\n`
      })
      report += '\n'
    }
  }

  if (performanceMetrics) {
    report += `**Cost**: $${performanceMetrics.apiCosts.totalProjectCost.toFixed(2)}\n`
    report += `**Success Rate**: ${performanceMetrics.efficiencyMetrics.successRate.toFixed(1)}%\n`
    report += `**Generations**: ${
      performanceMetrics.renderTimes.imageGeneration.reduce((sum, m) => sum + m.count, 0) +
      performanceMetrics.renderTimes.videoAnimation.count
    }\n\n`
  }

  const suggestions = getActiveSuggestions()
  if (suggestions.length > 0) {
    report += '**Recommendations**:\n'
    suggestions.slice(0, 3).forEach((s) => {
      report += `• ${s.suggestion}\n`
    })
  }

  return report
}
