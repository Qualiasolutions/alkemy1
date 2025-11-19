import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../theme/ThemeContext';
import { PlausibilityReport, PlausibilityIssue } from '../../services/plausibilityService';

interface PlausibilityMeterProps {
    report: PlausibilityReport | null;
    isLoading?: boolean;
}

const PlausibilityMeter: React.FC<PlausibilityMeterProps> = ({ report, isLoading }) => {
    const { colors } = useTheme();

    if (!report && !isLoading) return null;

    const score = report?.score || 0;
    const statusColor = score > 80 ? '#10a37f' : score > 50 ? '#f59e0b' : '#ef4444';

    return (
        <div className="rounded-xl p-4 border backdrop-blur-md"
            style={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderColor: colors.border_primary
            }}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.text_secondary }}>
                    Plausibility Meter
                </h3>
                {isLoading && (
                    <span className="text-xs animate-pulse" style={{ color: colors.accent_primary }}>
                        Analyzing...
                    </span>
                )}
            </div>

            {/* Score Indicator */}
            <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke={colors.bg_tertiary}
                            strokeWidth="4"
                            fill="none"
                        />
                        <motion.circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke={statusColor}
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={175}
                            strokeDashoffset={175 - (175 * score) / 100}
                            initial={{ strokeDashoffset: 175 }}
                            animate={{ strokeDashoffset: 175 - (175 * score) / 100 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </svg>
                    <span className="absolute text-lg font-bold" style={{ color: statusColor }}>
                        {Math.round(score)}%
                    </span>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium mb-1" style={{ color: colors.text_primary }}>
                        {score > 80 ? 'Plausible' : score > 50 ? 'Questionable' : 'Implausible'}
                    </p>
                    <p className="text-xs" style={{ color: colors.text_tertiary }}>
                        {score > 80
                            ? 'Aligned with world logic.'
                            : 'Conflicts detected with established lore.'}
                    </p>
                </div>
            </div>

            {/* Issues List */}
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                    {report?.issues.map((issue) => (
                        <motion.div
                            key={issue.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-2 rounded border-l-2 text-xs"
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderLeftColor: issue.severity === 'critical' ? '#ef4444' :
                                    issue.severity === 'warning' ? '#f59e0b' : '#3b82f6'
                            }}
                        >
                            <div className="flex items-start gap-2">
                                <span className="mt-0.5">
                                    {issue.severity === 'critical' ? '🚩' :
                                        issue.severity === 'warning' ? '⚠️' : 'ℹ️'}
                                </span>
                                <div>
                                    <p className="font-medium" style={{ color: colors.text_primary }}>
                                        {issue.message}
                                    </p>
                                    {issue.suggestion && (
                                        <p className="mt-1 opacity-75" style={{ color: colors.text_secondary }}>
                                            Tip: {issue.suggestion}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PlausibilityMeter;
