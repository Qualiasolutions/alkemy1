/**
 * Script Analysis Panel Component
 * Handles script analysis functionality extracted from App.tsx
 */

import type React from 'react'
import { useCallback } from 'react'
import { analyzeScript } from '../services/aiService'
import { logAIUsage } from '../services/usageService'
import type { ScriptAnalysis } from '../types'

interface ScriptAnalysisPanelProps {
  scriptContent: string | null
  scriptAnalysis: ScriptAnalysis | null
  isAnalyzing: boolean
  analysisError: string | null
  analysisMessage: string
  onAnalysisStart: () => void
  onAnalysisComplete: (analysis: ScriptAnalysis) => void
  onAnalysisError: (error: string) => void
  onAnalysisMessage: (message: string) => void
}

const ScriptAnalysisPanel: React.FC<ScriptAnalysisPanelProps> = ({
  scriptContent,
  scriptAnalysis,
  isAnalyzing,
  analysisError,
  analysisMessage,
  onAnalysisStart,
  onAnalysisComplete,
  onAnalysisError,
  onAnalysisMessage,
}) => {
  const analyzeScriptContent = useCallback(async () => {
    if (!scriptContent || scriptContent.trim().length < 100) {
      onAnalysisError('Script content is too short for analysis (minimum 100 characters)')
      return
    }

    onAnalysisStart()
    onAnalysisError(null)

    try {
      onAnalysisMessage('Analyzing script structure and characters...')

      const analysis = await analyzeScript(scriptContent, {
        onProgress: (message: string) => {
          onAnalysisMessage(message)
        },
      })

      if (!analysis || !analysis.scenes || analysis.scenes.length === 0) {
        throw new Error(
          'Script analysis failed to extract scenes. Please check your script format.'
        )
      }

      // Log AI usage
      await logAIUsage('script_analysis', {
        scriptLength: scriptContent.length,
        sceneCount: analysis.scenes.length,
        characterCount: analysis.characters.length,
      })

      onAnalysisComplete(analysis)
    } catch (error: any) {
      console.error('[ScriptAnalysisPanel] Script analysis failed:', error)
      const errorMessage = error.message || 'Script analysis failed. Please try again.'
      onAnalysisError(errorMessage)
    }
  }, [scriptContent, onAnalysisStart, onAnalysisComplete, onAnalysisError, onAnalysisMessage])

  const clearAnalysis = useCallback(() => {
    onAnalysisComplete(null as any)
    onAnalysisError(null)
    onAnalysisMessage('')
  }, [onAnalysisComplete, onAnalysisError, onAnalysisMessage])

  return (
    <div className="script-analysis-panel">
      <div className="analysis-header">
        <h3>Script Analysis</h3>
        {scriptContent && !isAnalyzing && (
          <div className="analysis-actions">
            {!scriptAnalysis ? (
              <button
                onClick={analyzeScriptContent}
                className="analyze-button"
                disabled={isAnalyzing}
              >
                Analyze Script
              </button>
            ) : (
              <button onClick={clearAnalysis} className="clear-button">
                Clear Analysis
              </button>
            )}
          </div>
        )}
      </div>

      {isAnalyzing && (
        <div className="analysis-progress">
          <div className="loading-spinner" />
          <p>{analysisMessage || 'Analyzing script...'}</p>
        </div>
      )}

      {analysisError && (
        <div className="analysis-error">
          <p className="error-message">{analysisError}</p>
          <button onClick={analyzeScriptContent} className="retry-button">
            Retry Analysis
          </button>
        </div>
      )}

      {scriptAnalysis && !isAnalyzing && (
        <div className="analysis-results">
          <div className="analysis-summary">
            <h4>{scriptAnalysis.title}</h4>
            {scriptAnalysis.logline && <p className="logline">{scriptAnalysis.logline}</p>}
            {scriptAnalysis.summary && <p className="summary">{scriptAnalysis.summary}</p>}
          </div>

          <div className="analysis-stats">
            <div className="stat">
              <span className="label">Scenes:</span>
              <span className="value">{scriptAnalysis.scenes.length}</span>
            </div>
            <div className="stat">
              <span className="label">Characters:</span>
              <span className="value">{scriptAnalysis.characters.length}</span>
            </div>
            <div className="stat">
              <span className="label">Locations:</span>
              <span className="value">{scriptAnalysis.locations.length}</span>
            </div>
          </div>

          {scriptAnalysis.scenes.length > 0 && (
            <div className="scenes-preview">
              <h5>Scene Breakdown</h5>
              {scriptAnalysis.scenes.slice(0, 5).map((scene, index) => (
                <div key={index} className="scene-item">
                  <span className="scene-number">Scene {scene.scene_number}</span>
                  <span className="scene-location">{scene.location}</span>
                  <span className="scene-time">{scene.time_of_day}</span>
                </div>
              ))}
              {scriptAnalysis.scenes.length > 5 && (
                <p className="more-scenes">
                  ... and {scriptAnalysis.scenes.length - 5} more scenes
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
                .script-analysis-panel {
                    padding: 20px;
                    background: var(--background-secondary);
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .analysis-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .analysis-header h3 {
                    margin: 0;
                    color: var(--text-primary);
                }

                .analysis-actions {
                    display: flex;
                    gap: 10px;
                }

                .analyze-button,
                .clear-button,
                .retry-button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .analyze-button {
                    background: var(--primary-color);
                    color: white;
                }

                .analyze-button:hover:not(:disabled) {
                    background: var(--primary-color-hover);
                }

                .analyze-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .clear-button,
                .retry-button {
                    background: var(--error-color);
                    color: white;
                }

                .clear-button:hover,
                .retry-button:hover {
                    background: var(--error-color-hover);
                }

                .analysis-progress {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 20px;
                    text-align: center;
                }

                .loading-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid var(--border-color);
                    border-top: 2px solid var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .analysis-error {
                    padding: 15px;
                    background: var(--error-background);
                    border: 1px solid var(--error-color);
                    border-radius: 4px;
                    color: var(--error-color);
                }

                .error-message {
                    margin-bottom: 10px;
                }

                .analysis-results {
                    margin-top: 20px;
                }

                .analysis-summary h4 {
                    margin: 0 0 10px 0;
                    color: var(--text-primary);
                }

                .logline {
                    font-style: italic;
                    color: var(--text-secondary);
                    margin-bottom: 10px;
                }

                .summary {
                    color: var(--text-secondary);
                    margin-bottom: 20px;
                }

                .analysis-stats {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .label {
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .value {
                    font-size: 18px;
                    font-weight: bold;
                    color: var(--text-primary);
                }

                .scenes-preview h5 {
                    margin: 0 0 10px 0;
                    color: var(--text-primary);
                }

                .scene-item {
                    display: flex;
                    gap: 10px;
                    padding: 8px 0;
                    border-bottom: 1px solid var(--border-color);
                }

                .scene-item:last-child {
                    border-bottom: none;
                }

                .scene-number {
                    font-weight: bold;
                    color: var(--primary-color);
                    min-width: 80px;
                }

                .scene-location {
                    color: var(--text-primary);
                    flex: 1;
                }

                .scene-time {
                    color: var(--text-secondary);
                    font-size: 12px;
                }

                .more-scenes {
                    margin-top: 10px;
                    color: var(--text-secondary);
                    font-style: italic;
                }
            `}</style>
    </div>
  )
}

export default ScriptAnalysisPanel
