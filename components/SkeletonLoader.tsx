import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeContext';

/**
 * Base Skeleton Component
 * Animated placeholder for loading states
 */
interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    className?: string;
    rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '1rem',
    className = '',
    rounded = 'md'
}) => {
    const { isDark } = useTheme();

    const roundedClass = {
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full'
    }[rounded];

    return (
        <motion.div
            className={`${isDark ? 'bg-gray-800' : 'bg-gray-200'} ${roundedClass} ${className} overflow-hidden relative`}
            style={{ width, height }}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
            <div
                className="absolute inset-0 -translate-x-full animate-shimmer"
                style={{
                    background: isDark
                        ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
                        : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                    animation: 'shimmer 2s infinite'
                }}
            />
            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </motion.div>
    );
};

/**
 * Skeleton for Character/Location Cards
 */
export const SkeletonCard: React.FC = () => {
    const { isDark } = useTheme();

    return (
        <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-xl p-4`}>
            <Skeleton height="200px" width="100%" rounded="lg" className="mb-4" />
            <Skeleton height="1.5rem" width="70%" className="mb-2" />
            <Skeleton height="1rem" width="100%" className="mb-2" />
            <Skeleton height="1rem" width="90%" className="mb-2" />
            <Skeleton height="1rem" width="80%" />
        </div>
    );
};

/**
 * Skeleton for Shot/Frame Generation Grid
 */
export const SkeletonFrame: React.FC = () => {
    const { isDark } = useTheme();

    return (
        <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-xl p-4`}>
            <div className="flex items-center gap-3 mb-3">
                <Skeleton height="2rem" width="2rem" rounded="full" />
                <Skeleton height="1.25rem" width="120px" />
            </div>
            <Skeleton height="250px" width="100%" rounded="lg" className="mb-3" />
            <Skeleton height="1rem" width="100%" className="mb-2" />
            <Skeleton height="1rem" width="85%" />
        </div>
    );
};

/**
 * Skeleton for Text Content
 */
export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    height="1rem"
                    width={i === lines - 1 ? '75%' : '100%'}
                />
            ))}
        </div>
    );
};

/**
 * Skeleton for Timeline Clips
 */
export const SkeletonTimelineClip: React.FC = () => {
    const { isDark } = useTheme();

    return (
        <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-lg p-3 flex items-center gap-3`}>
            <Skeleton height="60px" width="80px" rounded="md" />
            <div className="flex-1">
                <Skeleton height="1rem" width="60%" className="mb-2" />
                <Skeleton height="0.75rem" width="40%" />
            </div>
            <Skeleton height="2rem" width="2rem" rounded="full" />
        </div>
    );
};

/**
 * Skeleton for Scene Analysis
 */
export const SkeletonAnalysis: React.FC = () => {
    const { isDark } = useTheme();

    return (
        <div className="mt-8 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-lg p-4 flex items-center gap-4`}
                    >
                        <Skeleton height="40px" width="40px" rounded="md" />
                        <div className="flex-1">
                            <Skeleton height="1.5rem" width="50%" className="mb-2" />
                            <Skeleton height="0.875rem" width="60%" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary Section */}
            <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
                <Skeleton height="1.25rem" width="150px" className="mb-4" />
                <SkeletonText lines={4} />
            </div>

            {/* Production Elements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5].map(i => (
                    <div
                        key={i}
                        className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-lg p-6`}
                    >
                        <Skeleton height="1.125rem" width="120px" className="mb-4" />
                        <div className="space-y-2">
                            {[1, 2, 3].map(j => (
                                <Skeleton key={j} height="0.875rem" width={`${90 - j * 10}%`} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Skeleton for Grid Layout (Characters/Locations)
 */
export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
};

/**
 * Skeleton for Compositing Grid (Shots)
 */
export const SkeletonCompositingGrid: React.FC<{ count?: number }> = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonFrame key={i} />
            ))}
        </div>
    );
};
