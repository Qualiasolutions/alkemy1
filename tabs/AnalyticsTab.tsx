import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/theme/ThemeContext';
import {
    ScriptAnalysis,
    CreativeQualityReport,
    TechnicalPerformanceMetrics
} from '@/types';
import {
    analyzeCreativeQuality,
    getPerformanceMetrics,
    getOptimizationSuggestions,
    getQualityLevel,
    getQualityColorIndicator,
    getSeverityBadge,
    trackGenerationMetrics
} from '@/services/analyticsService';
import {
    generateAnalyticsPDF,
    generateComparisonPDF
} from '@/services/pdfExportService';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import Button from '@/components/Button';
import ComparisonView from '@/components/analytics/ComparisonView';

interface AnalyticsTabProps {
    scriptAnalysis: ScriptAnalysis | null;
    projectId: string;
}

export default function AnalyticsTab({ scriptAnalysis, projectId }: AnalyticsTabProps) {
    const { colors, isDark } = useTheme();

    const [qualityReport, setQualityReport] = useState<CreativeQualityReport | null>(null);
    const [performanceMetrics, setPerformanceMetrics] = useState<TechnicalPerformanceMetrics | null>(null);
    const [previousQualityReport, setPreviousQualityReport] = useState<CreativeQualityReport | null>(null);
    const [previousMetrics, setPreviousMetrics] = useState<TechnicalPerformanceMetrics | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [analysisMessage, setAnalysisMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'quality' | 'performance' | 'comparison'>('quality');
    const [showComparisonMode, setShowComparisonMode] = useState(false);

    // Load performance metrics on mount
    useEffect(() => {
        loadPerformanceMetrics();

        // Listen for real-time metric updates
        const handleMetricsUpdate = (event: any) => {
            setPerformanceMetrics(event.detail);
        };

        window.addEventListener('alkemy:metrics-updated', handleMetricsUpdate);
        return () => window.removeEventListener('alkemy:metrics-updated', handleMetricsUpdate);
    }, [projectId]);

    const loadPerformanceMetrics = async () => {
        try {
            const metrics = await getPerformanceMetrics(projectId);
            setPerformanceMetrics(metrics);
        } catch (error) {
            console.error('Error loading performance metrics:', error);
        }
    };

    const handleAnalyzeQuality = async () => {
        if (!scriptAnalysis) return;

        // Save current data as previous before new analysis
        if (qualityReport) {
            setPreviousQualityReport(qualityReport);
        }
        if (performanceMetrics) {
            setPreviousMetrics(performanceMetrics);
        }

        setIsAnalyzing(true);
        setAnalysisProgress(0);
        setAnalysisMessage('Initializing analysis...');

        try {
            const report = await analyzeCreativeQuality(
                scriptAnalysis,
                (progress, message) => {
                    setAnalysisProgress(progress);
                    setAnalysisMessage(message || '');
                }
            );

            setQualityReport(report);
            setActiveTab('quality');
        } catch (error) {
            console.error('Error analyzing quality:', error);
            alert('Quality analysis failed. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleToggleComparison = () => {
        setShowComparisonMode(!showComparisonMode);
        if (!showComparisonMode && !previousMetrics && !previousQualityReport) {
            // Save current as baseline for comparison
            setPreviousQualityReport(qualityReport);
            setPreviousMetrics(performanceMetrics);
        }
    };

    const handleExportReport = async (format: 'pdf' | 'csv' | 'comparison') => {
        if (!qualityReport && !performanceMetrics) {
            alert('No data to export');
            return;
        }

        if (format === 'csv' && performanceMetrics) {
            // Enhanced CSV export with more data
            const csvData = [
                'Alkemy AI Studio - Analytics Report',
                `Generated: ${new Date().toLocaleDateString()}`,
                '',
                'Performance Metrics',
                'Metric,Value',
                `Project ID,${performanceMetrics.projectId}`,
                `Total Cost,$${performanceMetrics.apiCosts.totalProjectCost.toFixed(2)}`,
                `Image Generation Cost,$${performanceMetrics.apiCosts.imageGenerationCost.toFixed(2)}`,
                `Video Animation Cost,$${performanceMetrics.apiCosts.videoGenerationCost.toFixed(2)}`,
                `Audio Generation Cost,$${performanceMetrics.apiCosts.audioGenerationCost.toFixed(2)}`,
                `Success Rate,${performanceMetrics.efficiencyMetrics.successRate.toFixed(1)}%`,
                `Failed Generations,${performanceMetrics.efficiencyMetrics.failedGenerations}`,
                `Last Updated,${performanceMetrics.lastUpdated}`
            ];

            // Add render times
            if (performanceMetrics.renderTimes.imageGeneration.length > 0) {
                csvData.push('');
                csvData.push('Render Times');
                csvData.push('Model,Average Time (s),Generation Count');
                performanceMetrics.renderTimes.imageGeneration.forEach(model => {
                    csvData.push(`${model.model},${model.avgTime.toFixed(1)},${model.count}`);
                });
                if (performanceMetrics.renderTimes.videoAnimation.count > 0) {
                    csvData.push(`Video Animation,${performanceMetrics.renderTimes.videoAnimation.avgTime.toFixed(1)},${performanceMetrics.renderTimes.videoAnimation.count}`);
                }
            }

            if (qualityReport) {
                csvData.push('');
                csvData.push('Quality Metrics');
                csvData.push('Metric,Score');
                csvData.push(`Overall Quality,${qualityReport.overallScore}`);
                csvData.push(`Color Consistency,${qualityReport.colorConsistency}`);
                csvData.push(`Lighting Coherence,${qualityReport.lightingCoherence}`);
                csvData.push(`Look Bible Adherence,${qualityReport.lookBibleAdherence}`);

                // Add scene breakdown
                if (qualityReport.sceneReports.length > 0) {
                    csvData.push('');
                    csvData.push('Scene Breakdown');
                    csvData.push('Scene,Overall,Color,Lighting,Look Bible');
                    qualityReport.sceneReports.forEach(scene => {
                        csvData.push(`${scene.sceneName},${scene.overallScore},${scene.colorConsistency},${scene.lightingCoherence},${scene.lookBibleAdherence}`);
                    });
                }

                // Add improvement suggestions
                if (qualityReport.improvementSuggestions.length > 0) {
                    csvData.push('');
                    csvData.push('Improvement Suggestions');
                    csvData.push('Issue,Impact,Suggestion,Severity');
                    qualityReport.improvementSuggestions.forEach(suggestion => {
                        csvData.push(`"${suggestion.issue}","${suggestion.impact}","${suggestion.suggestion}",${suggestion.severity}`);
                    });
                }
            }

            const blob = new Blob([csvData.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `alkemy-analytics-${projectId}-${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } else if (format === 'pdf') {
            try {
                setAnalysisMessage('Generating PDF report...');
                const pdfBlob = await generateAnalyticsPDF(
                    projectId,
                    scriptAnalysis,
                    qualityReport,
                    performanceMetrics,
                    {
                        includeCharts: true,
                        includeComparison: true,
                        includeRecommendations: true,
                        format: 'detailed'
                    }
                );

                // Download the PDF
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `alkemy-analytics-${projectId}-${Date.now()}.pdf`;
                a.click();
                URL.revokeObjectURL(url);

                setAnalysisMessage('');
            } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Failed to generate PDF report. Please try again.');
                setAnalysisMessage('');
            }
        } else if (format === 'comparison' && previousMetrics) {
            try {
                setAnalysisMessage('Generating comparison PDF...');
                const pdfBlob = await generateComparisonPDF(
                    projectId,
                    {
                        qualityReport,
                        performanceMetrics
                    },
                    {
                        qualityReport: previousQualityReport,
                        performanceMetrics: previousMetrics,
                        date: new Date(previousMetrics.lastUpdated)
                    }
                );

                // Download the PDF
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `alkemy-comparison-${projectId}-${Date.now()}.pdf`;
                a.click();
                URL.revokeObjectURL(url);

                setAnalysisMessage('');
            } catch (error) {
                console.error('Error generating comparison PDF:', error);
                alert('Failed to generate comparison report. Please try again.');
                setAnalysisMessage('');
            }
        }
    };

    if (!scriptAnalysis) {
        return (
            <div style={{ padding: '48px', textAlign: 'center' }}>
                <h2 style={{ color: colors.text_primary, fontSize: '24px', marginBottom: '16px' }}>
                    No Project Loaded
                </h2>
                <p style={{ color: colors.text_secondary }}>
                    Analyze a script first to generate analytics.
                </p>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ color: colors.text_primary, fontSize: '32px', marginBottom: '8px' }}>
                    Project Analytics
                </h1>
                <p style={{ color: colors.text_secondary, fontSize: '16px' }}>
                    AI-powered creative feedback and performance insights
                </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <Button
                    onClick={handleAnalyzeQuality}
                    disabled={isAnalyzing}
                    style={{
                        background: isAnalyzing ? colors.bg_tertiary : colors.accent_primary,
                        color: 'white',
                        padding: '12px 24px',
                        fontSize: '16px'
                    }}
                >
                    {isAnalyzing ? `Analyzing... ${Math.round(analysisProgress)}%` : 'Analyze Quality'}
                </Button>

                <Button
                    onClick={handleToggleComparison}
                    disabled={!qualityReport && !performanceMetrics}
                    style={{
                        background: showComparisonMode ? colors.accent_primary : colors.bg_tertiary,
                        color: showComparisonMode ? 'white' : colors.text_primary,
                        padding: '12px 24px',
                        fontSize: '16px',
                        border: showComparisonMode ? 'none' : `1px solid ${colors.border}`
                    }}
                >
                    {showComparisonMode ? '✓ Comparison Mode' : 'Enable Comparison'}
                </Button>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        onClick={() => handleExportReport('csv')}
                        disabled={!qualityReport && !performanceMetrics}
                        style={{
                            background: colors.bg_tertiary,
                            color: colors.text_primary,
                            padding: '12px 20px',
                            fontSize: '14px'
                        }}
                    >
                        📊 Export CSV
                    </Button>

                    <Button
                        onClick={() => handleExportReport('pdf')}
                        disabled={!qualityReport && !performanceMetrics}
                        style={{
                            background: colors.bg_tertiary,
                            color: colors.text_primary,
                            padding: '12px 20px',
                            fontSize: '14px'
                        }}
                    >
                        📄 Export PDF
                    </Button>

                    {showComparisonMode && previousMetrics && (
                        <Button
                            onClick={() => handleExportReport('comparison')}
                            style={{
                                background: '#10b981',
                                color: 'white',
                                padding: '12px 20px',
                                fontSize: '14px'
                            }}
                        >
                            📈 Export Comparison
                        </Button>
                    )}
                </div>
            </div>

            {/* Progress Message */}
            {isAnalyzing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        background: colors.bg_secondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '24px'
                    }}
                >
                    <p style={{ color: colors.text_secondary }}>{analysisMessage}</p>
                    <div
                        style={{
                            width: '100%',
                            height: '4px',
                            background: colors.bg_tertiary,
                            borderRadius: '2px',
                            marginTop: '12px',
                            overflow: 'hidden'
                        }}
                    >
                        <motion.div
                            style={{
                                height: '100%',
                                background: colors.accent_primary,
                                borderRadius: '2px'
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${analysisProgress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </motion.div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
                <button
                    onClick={() => setActiveTab('quality')}
                    style={{
                        padding: '12px 24px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'quality' ? `2px solid ${colors.accent_primary}` : '2px solid transparent',
                        color: activeTab === 'quality' ? colors.accent_primary : colors.text_secondary,
                        fontSize: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Creative Quality
                </button>
                <button
                    onClick={() => setActiveTab('performance')}
                    style={{
                        padding: '12px 24px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'performance' ? `2px solid ${colors.accent_primary}` : '2px solid transparent',
                        color: activeTab === 'performance' ? colors.accent_primary : colors.text_secondary,
                        fontSize: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Technical Performance
                </button>
                {showComparisonMode && (previousQualityReport || previousMetrics) && (
                    <button
                        onClick={() => setActiveTab('comparison')}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'comparison' ? `2px solid ${colors.accent_primary}` : '2px solid transparent',
                            color: activeTab === 'comparison' ? colors.accent_primary : colors.text_secondary,
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        📊 Comparison View
                    </button>
                )}
            </div>

            {/* Quality Tab Content */}
            {activeTab === 'quality' && (
                <QualityReportView report={qualityReport} colors={colors} showComparison={showComparisonMode} previousReport={previousQualityReport} />
            )}

            {/* Performance Tab Content */}
            {activeTab === 'performance' && (
                <PerformanceMetricsView metrics={performanceMetrics} colors={colors} showComparison={showComparisonMode} previousMetrics={previousMetrics} />
            )}

            {/* Comparison Tab Content */}
            {activeTab === 'comparison' && showComparisonMode && (
                <ComparisonView
                    currentQuality={qualityReport}
                    previousQuality={previousQualityReport}
                    currentMetrics={performanceMetrics}
                    previousMetrics={previousMetrics}
                    colors={colors}
                />
            )}
        </div>
    );
}

// Quality Report View Component
function QualityReportView({ report, colors, showComparison, previousReport }: {
    report: CreativeQualityReport | null;
    colors: any;
    showComparison?: boolean;
    previousReport?: CreativeQualityReport | null;
}) {
    if (!report) {
        return (
            <div style={{ textAlign: 'center', padding: '48px' }}>
                <p style={{ color: colors.text_secondary, fontSize: '18px' }}>
                    No quality analysis available yet. Click "Analyze Quality" to begin.
                </p>
            </div>
        );
    }

    const radarData = [
        { metric: 'Color', score: report.colorConsistency, fullMark: 100 },
        { metric: 'Lighting', score: report.lightingCoherence, fullMark: 100 },
        { metric: 'Look Bible', score: report.lookBibleAdherence, fullMark: 100 }
    ];

    const qualityLevel = getQualityLevel(report.overallScore);
    const qualityIndicator = getQualityColorIndicator(qualityLevel);

    return (
        <div>
            {/* Overall Score Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: colors.bg_secondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '32px',
                    marginBottom: '32px',
                    textAlign: 'center'
                }}
            >
                <h2 style={{ color: colors.text_primary, fontSize: '24px', marginBottom: '8px' }}>
                    Overall Quality Score
                </h2>
                <div style={{ fontSize: '72px', fontWeight: 'bold', color: colors.accent_primary, marginBottom: '8px' }}>
                    {report.overallScore}
                    <span style={{ fontSize: '32px', color: colors.text_secondary }}>/100</span>
                </div>
                <p style={{ color: colors.text_secondary, fontSize: '18px' }}>
                    {qualityIndicator} {qualityLevel.charAt(0).toUpperCase() + qualityLevel.slice(1).replace('-', ' ')}
                </p>
            </motion.div>

            {/* Radar Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                    background: colors.bg_secondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '32px'
                }}
            >
                <h3 style={{ color: colors.text_primary, fontSize: '20px', marginBottom: '16px' }}>
                    Quality Dimensions
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                        <PolarGrid stroke={colors.border} />
                        <PolarAngleAxis dataKey="metric" stroke={colors.text_secondary} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={colors.text_secondary} />
                        <Radar
                            name="Quality Score"
                            dataKey="score"
                            stroke={colors.accent_primary}
                            fill={colors.accent_primary}
                            fillOpacity={0.3}
                        />
                        <Tooltip
                            contentStyle={{
                                background: colors.bg_primary,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '8px'
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Scene Breakdown */}
            {report.sceneReports.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        background: colors.bg_secondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '32px'
                    }}
                >
                    <h3 style={{ color: colors.text_primary, fontSize: '20px', marginBottom: '16px' }}>
                        Scene Quality Breakdown
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {report.sceneReports.map((scene, idx) => (
                            <div
                                key={scene.sceneId}
                                style={{
                                    background: colors.bg_tertiary,
                                    borderRadius: '8px',
                                    padding: '16px',
                                    border: `1px solid ${colors.border}`
                                }}
                            >
                                <h4 style={{ color: colors.text_primary, fontSize: '16px', marginBottom: '12px' }}>
                                    {scene.sceneName}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: colors.text_secondary }}>Overall:</span>
                                        <span style={{ color: colors.text_primary, fontWeight: 'bold' }}>
                                            {scene.overallScore}/100
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: colors.text_secondary }}>Color:</span>
                                        <span style={{ color: colors.text_primary }}>{scene.colorConsistency}/100</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: colors.text_secondary }}>Lighting:</span>
                                        <span style={{ color: colors.text_primary }}>{scene.lightingCoherence}/100</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: colors.text_secondary }}>Look Bible:</span>
                                        <span style={{ color: colors.text_primary }}>{scene.lookBibleAdherence}/100</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Improvement Suggestions */}
            {report.improvementSuggestions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        background: colors.bg_secondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '12px',
                        padding: '24px'
                    }}
                >
                    <h3 style={{ color: colors.text_primary, fontSize: '20px', marginBottom: '16px' }}>
                        Improvement Suggestions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {report.improvementSuggestions.map((suggestion, idx) => (
                            <div
                                key={suggestion.id}
                                style={{
                                    background: colors.bg_tertiary,
                                    borderRadius: '8px',
                                    padding: '16px',
                                    borderLeft: `4px solid ${colors.accent_primary}`
                                }}
                            >
                                <h4 style={{ color: colors.text_primary, fontSize: '16px', marginBottom: '8px' }}>
                                    {suggestion.issue}
                                </h4>
                                <p style={{ color: colors.text_secondary, fontSize: '14px', marginBottom: '8px' }}>
                                    <strong>Impact:</strong> {suggestion.impact}
                                </p>
                                <p style={{ color: colors.text_primary, fontSize: '14px' }}>
                                    <strong>Suggestion:</strong> {suggestion.suggestion}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// Performance Metrics View Component
function PerformanceMetricsView({ metrics, colors, showComparison, previousMetrics }: {
    metrics: TechnicalPerformanceMetrics | null;
    colors: any;
    showComparison?: boolean;
    previousMetrics?: TechnicalPerformanceMetrics | null;
}) {
    if (!metrics) {
        return (
            <div style={{ textAlign: 'center', padding: '48px' }}>
                <p style={{ color: colors.text_secondary, fontSize: '18px' }}>
                    No performance data available yet. Generate some content to see metrics.
                </p>
            </div>
        );
    }

    const totalGenerations = metrics.renderTimes.imageGeneration.reduce((sum, m) => sum + m.count, 0) +
        metrics.renderTimes.videoAnimation.count;

    const costData = [
        { name: 'Images', cost: metrics.apiCosts.imageGenerationCost },
        { name: 'Videos', cost: metrics.apiCosts.videoGenerationCost },
        { name: 'Audio', cost: metrics.apiCosts.audioGenerationCost }
    ].filter(d => d.cost > 0);

    const optimizationSuggestions = getOptimizationSuggestions(metrics);

    return (
        <div>
            {/* Cost Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: colors.bg_secondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '32px',
                    marginBottom: '32px',
                    textAlign: 'center'
                }}
            >
                <h2 style={{ color: colors.text_primary, fontSize: '24px', marginBottom: '8px' }}>
                    Total Project Cost
                </h2>
                <div style={{ fontSize: '72px', fontWeight: 'bold', color: colors.accent_primary, marginBottom: '8px' }}>
                    ${metrics.apiCosts.totalProjectCost.toFixed(2)}
                </div>
                <p style={{ color: colors.text_secondary, fontSize: '18px' }}>
                    {totalGenerations} total generations • {metrics.efficiencyMetrics.successRate.toFixed(1)}% success rate
                </p>
            </motion.div>

            {/* Cost Breakdown Chart */}
            {costData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        background: colors.bg_secondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '32px'
                    }}
                >
                    <h3 style={{ color: colors.text_primary, fontSize: '20px', marginBottom: '16px' }}>
                        Cost Breakdown
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={costData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                            <XAxis dataKey="name" stroke={colors.text_secondary} />
                            <YAxis stroke={colors.text_secondary} />
                            <Tooltip
                                contentStyle={{
                                    background: colors.bg_primary,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '8px'
                                }}
                                formatter={(value: number) => `$${value.toFixed(2)}`}
                            />
                            <Bar dataKey="cost" fill={colors.accent_primary} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* Render Times */}
            {metrics.renderTimes.imageGeneration.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        background: colors.bg_secondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '32px'
                    }}
                >
                    <h3 style={{ color: colors.text_primary, fontSize: '20px', marginBottom: '16px' }}>
                        Average Render Times
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                        {metrics.renderTimes.imageGeneration.map((model, idx) => (
                            <div
                                key={model.model}
                                style={{
                                    background: colors.bg_tertiary,
                                    borderRadius: '8px',
                                    padding: '16px',
                                    border: `1px solid ${colors.border}`
                                }}
                            >
                                <h4 style={{ color: colors.text_primary, fontSize: '16px', marginBottom: '8px' }}>
                                    {model.model.toUpperCase()}
                                </h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ color: colors.text_secondary }}>Avg Time:</span>
                                    <span style={{ color: colors.text_primary, fontWeight: 'bold' }}>
                                        {model.avgTime.toFixed(1)}s
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: colors.text_secondary }}>Count:</span>
                                    <span style={{ color: colors.text_primary }}>{model.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Optimization Suggestions */}
            {optimizationSuggestions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        background: colors.bg_secondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '12px',
                        padding: '24px'
                    }}
                >
                    <h3 style={{ color: colors.text_primary, fontSize: '20px', marginBottom: '16px' }}>
                        Optimization Suggestions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {optimizationSuggestions.map((suggestion, idx) => (
                            <div
                                key={suggestion.id}
                                style={{
                                    background: colors.bg_tertiary,
                                    borderRadius: '8px',
                                    padding: '16px',
                                    borderLeft: `4px solid ${suggestion.category === 'cost' ? '#f59e0b' : suggestion.category === 'error' ? '#ef4444' : '#3b82f6'}`
                                }}
                            >
                                <h4 style={{ color: colors.text_primary, fontSize: '16px', marginBottom: '8px' }}>
                                    {suggestion.issue}
                                </h4>
                                <p style={{ color: colors.text_secondary, fontSize: '14px', marginBottom: '8px' }}>
                                    <strong>Impact:</strong> {suggestion.impact}
                                </p>
                                <p style={{ color: colors.text_primary, fontSize: '14px' }}>
                                    <strong>Suggestion:</strong> {suggestion.suggestion}
                                </p>
                                {suggestion.potentialSavings && (
                                    <p style={{ color: '#10b981', fontSize: '14px', marginTop: '8px' }}>
                                        💰 Potential savings: ${suggestion.potentialSavings.toFixed(2)}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
