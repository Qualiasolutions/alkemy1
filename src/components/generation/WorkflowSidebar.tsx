import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/theme/ThemeContext';

export interface WorkflowStep {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'active' | 'completed' | 'error';
    icon?: React.ReactNode;
}

interface WorkflowSidebarProps {
    steps: WorkflowStep[];
    currentStepId: string;
    onStepClick?: (stepId: string) => void;
    className?: string;
}

const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({
    steps,
    currentStepId,
    onStepClick,
    className = ''
}) => {
    const { colors } = useTheme();

    const getStepStyles = (step: WorkflowStep) => {
        const isActive = step.id === currentStepId;
        const isCompleted = step.status === 'completed';
        const isError = step.status === 'error';

        if (isError) {
            return {
                bg: 'rgba(240, 68, 56, 0.1)',
                border: '#F04438',
                text: '#F04438',
                icon: '#F04438'
            };
        }

        if (isActive) {
            return {
                bg: 'rgba(16, 163, 127, 0.15)',
                border: colors.accent_primary,
                text: colors.text_primary,
                icon: colors.accent_primary
            };
        }

        if (isCompleted) {
            return {
                bg: 'rgba(16, 163, 127, 0.05)',
                border: colors.border_color,
                text: colors.text_secondary,
                icon: colors.accent_secondary
            };
        }

        return {
            bg: colors.surface_card,
            border: colors.border_color,
            text: colors.text_secondary,
            icon: colors.text_tertiary
        };
    };

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.text_tertiary }}>
                Workflow Steps
            </h3>

            <div className="flex flex-col gap-2">
                {steps.map((step, index) => {
                    const styles = getStepStyles(step);
                    const isClickable = onStepClick && (step.status === 'completed' || step.status === 'active');

                    return (
                        <div key={step.id} className="flex items-start gap-3">
                            {/* Step Number/Icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{
                                    background: styles.bg,
                                    borderWidth: '2px',
                                    borderStyle: 'solid',
                                    borderColor: styles.border,
                                    color: styles.icon
                                }}
                            >
                                {step.status === 'completed' ? (
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path
                                            d="M13.3332 4L5.99984 11.3333L2.6665 8"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                ) : step.status === 'error' ? (
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path
                                            d="M8 8V4M8 12H8.01"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                ) : (
                                    index + 1
                                )}
                            </motion.div>

                            {/* Step Content */}
                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 + 0.05 }}
                                onClick={() => isClickable && onStepClick?.(step.id)}
                                disabled={!isClickable}
                                className={`flex-1 text-left p-3 rounded-lg transition-all duration-200 ${
                                    isClickable ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'
                                }`}
                                style={{
                                    background: styles.bg,
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: styles.border
                                }}
                                whileHover={isClickable ? { y: -2 } : {}}
                                whileTap={isClickable ? { scale: 0.98 } : {}}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-sm" style={{ color: styles.text }}>
                                        {step.title}
                                    </h4>
                                    {step.status === 'active' && (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                            className="w-4 h-4 border-2 border-t-transparent rounded-full"
                                            style={{ borderColor: styles.icon }}
                                        />
                                    )}
                                </div>
                                <p className="text-xs" style={{ color: colors.text_tertiary }}>
                                    {step.description}
                                </p>
                            </motion.button>
                        </div>
                    );
                })}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium" style={{ color: colors.text_secondary }}>
                        Overall Progress
                    </span>
                    <span className="text-xs font-bold" style={{ color: colors.accent_primary }}>
                        {Math.round((steps.filter(s => s.status === 'completed').length / steps.length) * 100)}%
                    </span>
                </div>
                <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: colors.border_color }}
                >
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{
                            width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`
                        }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: colors.accent_primary }}
                    />
                </div>
            </div>
        </div>
    );
};

export default WorkflowSidebar;
