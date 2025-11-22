import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CreativeQualityReport, TechnicalPerformanceMetrics } from '@/types'

interface ComparisonViewProps {
  currentQuality: CreativeQualityReport | null
  previousQuality: CreativeQualityReport | null
  currentMetrics: TechnicalPerformanceMetrics | null
  previousMetrics: TechnicalPerformanceMetrics | null
  colors: any
}

export default function ComparisonView({
  currentQuality,
  previousQuality,
  currentMetrics,
  previousMetrics,
  colors,
}: ComparisonViewProps) {
  if (!currentQuality && !currentMetrics) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ color: colors.text_secondary, fontSize: '18px' }}>
          No current data available for comparison. Run an analysis first.
        </p>
      </div>
    )
  }

  if (!previousQuality && !previousMetrics) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ color: colors.text_secondary, fontSize: '18px' }}>
          No previous data available for comparison. The next analysis will establish a baseline.
        </p>
      </div>
    )
  }

  // Calculate changes
  const qualityChange =
    currentQuality && previousQuality
      ? currentQuality.overallScore - previousQuality.overallScore
      : null

  const costChange =
    currentMetrics && previousMetrics
      ? currentMetrics.apiCosts.totalProjectCost - previousMetrics.apiCosts.totalProjectCost
      : null

  const successRateChange =
    currentMetrics && previousMetrics
      ? currentMetrics.efficiencyMetrics.successRate - previousMetrics.efficiencyMetrics.successRate
      : null

  // Prepare comparison data for charts
  const comparisonData = []
  if (currentQuality && previousQuality) {
    comparisonData.push({
      metric: 'Overall Quality',
      previous: previousQuality.overallScore,
      current: currentQuality.overallScore,
      change: qualityChange,
    })
    comparisonData.push({
      metric: 'Color Consistency',
      previous: previousQuality.colorConsistency,
      current: currentQuality.colorConsistency,
      change: currentQuality.colorConsistency - previousQuality.colorConsistency,
    })
    comparisonData.push({
      metric: 'Lighting',
      previous: previousQuality.lightingCoherence,
      current: currentQuality.lightingCoherence,
      change: currentQuality.lightingCoherence - previousQuality.lightingCoherence,
    })
    comparisonData.push({
      metric: 'Look Bible',
      previous: previousQuality.lookBibleAdherence,
      current: currentQuality.lookBibleAdherence,
      change: currentQuality.lookBibleAdherence - previousQuality.lookBibleAdherence,
    })
  }

  return (
    <div>
      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Quality Change Card */}
        {qualityChange !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: colors.bg_secondary,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h3 style={{ color: colors.text_primary, fontSize: '18px', marginBottom: '16px' }}>
              Quality Score Change
            </h3>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
              <span style={{ color: colors.text_secondary }}>
                {previousQuality?.overallScore || 0}
              </span>
              <span style={{ color: colors.text_secondary, margin: '0 12px' }}>→</span>
              <span
                style={{
                  color:
                    qualityChange > 0
                      ? '#10b981'
                      : qualityChange < 0
                        ? '#ef4444'
                        : colors.text_primary,
                }}
              >
                {currentQuality?.overallScore || 0}
              </span>
            </div>
            <p
              style={{
                fontSize: '18px',
                color:
                  qualityChange > 0
                    ? '#10b981'
                    : qualityChange < 0
                      ? '#ef4444'
                      : colors.text_secondary,
              }}
            >
              {qualityChange > 0 ? '↑' : qualityChange < 0 ? '↓' : '='}{' '}
              {Math.abs(qualityChange).toFixed(1)} points
            </p>
          </motion.div>
        )}

        {/* Cost Change Card */}
        {costChange !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: colors.bg_secondary,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h3 style={{ color: colors.text_primary, fontSize: '18px', marginBottom: '16px' }}>
              Total Cost Change
            </h3>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
              <span style={{ color: colors.text_secondary }}>
                ${previousMetrics?.apiCosts.totalProjectCost.toFixed(2) || 0}
              </span>
              <span style={{ color: colors.text_secondary, margin: '0 12px' }}>→</span>
              <span
                style={{
                  color:
                    costChange > 0 ? '#ef4444' : costChange < 0 ? '#10b981' : colors.text_primary,
                }}
              >
                ${currentMetrics?.apiCosts.totalProjectCost.toFixed(2) || 0}
              </span>
            </div>
            <p
              style={{
                fontSize: '18px',
                color:
                  costChange > 0 ? '#ef4444' : costChange < 0 ? '#10b981' : colors.text_secondary,
              }}
            >
              {costChange > 0 ? '↑' : costChange < 0 ? '↓' : '='} ${Math.abs(costChange).toFixed(2)}
            </p>
          </motion.div>
        )}

        {/* Success Rate Change Card */}
        {successRateChange !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: colors.bg_secondary,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h3 style={{ color: colors.text_primary, fontSize: '18px', marginBottom: '16px' }}>
              Success Rate Change
            </h3>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
              <span style={{ color: colors.text_secondary }}>
                {previousMetrics?.efficiencyMetrics.successRate.toFixed(1) || 0}%
              </span>
              <span style={{ color: colors.text_secondary, margin: '0 12px' }}>→</span>
              <span
                style={{
                  color:
                    successRateChange > 0
                      ? '#10b981'
                      : successRateChange < 0
                        ? '#ef4444'
                        : colors.text_primary,
                }}
              >
                {currentMetrics?.efficiencyMetrics.successRate.toFixed(1) || 0}%
              </span>
            </div>
            <p
              style={{
                fontSize: '18px',
                color:
                  successRateChange > 0
                    ? '#10b981'
                    : successRateChange < 0
                      ? '#ef4444'
                      : colors.text_secondary,
              }}
            >
              {successRateChange > 0 ? '↑' : successRateChange < 0 ? '↓' : '='}{' '}
              {Math.abs(successRateChange).toFixed(1)}%
            </p>
          </motion.div>
        )}
      </div>

      {/* Comparison Chart */}
      {comparisonData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: colors.bg_secondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
          }}
        >
          <h3 style={{ color: colors.text_primary, fontSize: '20px', marginBottom: '16px' }}>
            Quality Metrics Comparison
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="metric" stroke={colors.text_secondary} />
              <YAxis stroke={colors.text_secondary} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: colors.bg_primary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="previous" fill="#94a3b8" name="Previous" />
              <Bar dataKey="current" fill={colors.accent_primary} name="Current" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Improvement Analysis */}
      {currentQuality && previousQuality && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: colors.bg_secondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <h3 style={{ color: colors.text_primary, fontSize: '20px', marginBottom: '16px' }}>
            Improvement Analysis
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {qualityChange && qualityChange > 0 && (
              <div
                style={{
                  background: '#10b98120',
                  borderLeft: '4px solid #10b981',
                  borderRadius: '4px',
                  padding: '16px',
                }}
              >
                <p style={{ color: colors.text_primary, fontSize: '16px', marginBottom: '8px' }}>
                  ✅ Quality Improved
                </p>
                <p style={{ color: colors.text_secondary, fontSize: '14px' }}>
                  Your overall quality score increased by {qualityChange.toFixed(1)} points. This
                  indicates better visual consistency and adherence to creative vision.
                </p>
              </div>
            )}

            {costChange && Math.abs(costChange) > 0.01 && (
              <div
                style={{
                  background: costChange < 0 ? '#10b98120' : '#ef444420',
                  borderLeft: `4px solid ${costChange < 0 ? '#10b981' : '#ef4444'}`,
                  borderRadius: '4px',
                  padding: '16px',
                }}
              >
                <p style={{ color: colors.text_primary, fontSize: '16px', marginBottom: '8px' }}>
                  {costChange < 0 ? '✅' : '⚠️'} Cost {costChange < 0 ? 'Reduced' : 'Increased'}
                </p>
                <p style={{ color: colors.text_secondary, fontSize: '14px' }}>
                  Project costs {costChange < 0 ? 'decreased' : 'increased'} by $
                  {Math.abs(costChange).toFixed(2)}.
                  {costChange > 0 && ' Consider optimizing model selection and prompt efficiency.'}
                </p>
              </div>
            )}

            {successRateChange && Math.abs(successRateChange) > 0.1 && (
              <div
                style={{
                  background: successRateChange > 0 ? '#10b98120' : '#ef444420',
                  borderLeft: `4px solid ${successRateChange > 0 ? '#10b981' : '#ef4444'}`,
                  borderRadius: '4px',
                  padding: '16px',
                }}
              >
                <p style={{ color: colors.text_primary, fontSize: '16px', marginBottom: '8px' }}>
                  {successRateChange > 0 ? '✅' : '⚠️'} Success Rate{' '}
                  {successRateChange > 0 ? 'Improved' : 'Declined'}
                </p>
                <p style={{ color: colors.text_secondary, fontSize: '14px' }}>
                  Generation success rate {successRateChange > 0 ? 'improved' : 'declined'} by{' '}
                  {Math.abs(successRateChange).toFixed(1)}%.
                  {successRateChange < 0 && ' Review failed generations to identify common issues.'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
