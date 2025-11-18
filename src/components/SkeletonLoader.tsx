/**
 * Skeleton Loader Component
 * Provides accessible loading placeholders for better perceived performance
 */

import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    className?: string;
    variant?: 'text' | 'rectangular' | 'circular';
    lines?: number;
    animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '1em',
    className = '',
    variant = 'text',
    lines = 1,
    animate = true
}) => {
    const getSkeletonStyle = (): React.CSSProperties => ({
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    });

    const getSkeletonClass = (): string => {
        const baseClass = 'skeleton';
        const variantClass = `skeleton--${variant}`;
        const animationClass = animate ? 'skeleton--animate' : '';
        return [baseClass, variantClass, animationClass, className].filter(Boolean).join(' ');
    };

    if (variant === 'text' && lines > 1) {
        return (
            <div className="skeleton-text-container" role="status" aria-label="Loading content">
                {Array.from({ length: lines }, (_, index) => (
                    <div
                        key={index}
                        className={getSkeletonClass()}
                        style={{
                            ...getSkeletonStyle(),
                            marginBottom: index < lines - 1 ? '0.5em' : '0',
                            width: index === lines - 1 ? '60%' : width // Last line shorter for realistic effect
                        }}
                    />
                ))}
                <span className="sr-only">Loading text content</span>
            </div>
        );
    }

    return (
        <div
            className={getSkeletonClass()}
            style={getSkeletonStyle()}
            role="status"
            aria-label="Loading content"
        >
            <span className="sr-only">Loading {variant}</span>
        </div>
    );
};

interface SkeletonLoaderProps {
    children?: React.ReactNode;
    loading?: boolean;
    skeleton?: React.ReactNode;
    className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    children,
    loading = false,
    skeleton,
    className = ''
}) => {
    if (loading) {
        return (
            <div className={`skeleton-loader ${className}`}>
                {skeleton || <Skeleton />}
            </div>
        );
    }

    return <>{children}</>;
};

/* Specialized skeleton components */
export const ScriptSkeleton: React.FC = () => (
    <div className="script-skeleton" role="status" aria-label="Loading script">
        <div className="script-header">
            <Skeleton width="60%" height="32px" />
            <Skeleton width="40%" height="20px" />
        </div>
        <div className="script-content">
            {Array.from({ length: 8 }, (_, i) => (
                <Skeleton
                    key={i}
                    height="20px"
                    width={i === 3 || i === 7 ? '80%' : '100%'}
                />
            ))}
        </div>
        <span className="sr-only">Loading script content</span>
    </div>
);

export const SceneSkeleton: React.FC = () => (
    <div className="scene-skeleton" role="status" aria-label="Loading scene">
        <div className="scene-header">
            <Skeleton width="30%" height="24px" variant="rectangular" />
            <Skeleton width="20%" height="20px" />
        </div>
        <div className="scene-grid">
            {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="scene-item">
                    <Skeleton height="120px" variant="rectangular" />
                    <Skeleton width="80%" height="16px" />
                </div>
            ))}
        </div>
        <span className="sr-only">Loading scenes</span>
    </div>
);

export const CharacterSkeleton: React.FC = () => (
    <div className="character-skeleton" role="status" aria-label="Loading characters">
        <div className="character-grid">
            {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="character-card">
                    <Skeleton width="80px" height="80px" variant="circular" />
                    <Skeleton width="70%" height="16px" />
                    <Skeleton width="50%" height="14px" />
                </div>
            ))}
        </div>
        <span className="sr-only">Loading character information</span>
    </div>
);

export const TimelineSkeleton: React.FC = () => (
    <div className="timeline-skeleton" role="status" aria-label="Loading timeline">
        <div className="timeline-header">
            <Skeleton width="25%" height="20px" />
            <Skeleton width="15%" height="20px" />
        </div>
        <div className="timeline-tracks">
            {Array.from({ length: 3 }, (_, trackIndex) => (
                <div key={trackIndex} className="timeline-track">
                    <Skeleton width="100px" height="40px" variant="rectangular" />
                    <div className="timeline-clips">
                        {Array.from({ length: 4 }, (_, clipIndex) => (
                            <Skeleton
                                key={clipIndex}
                                width={`${80 + Math.random() * 40}px`}
                                height="36px"
                                variant="rectangular"
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
        <span className="sr-only">Loading timeline</span>
    </div>
);

export default Skeleton;

/* Global styles for skeleton loaders */
export const skeletonStyles = `
.skeleton {
    background: linear-gradient(
        90deg,
        var(--skeleton-base, #f0f0f0) 25%,
        var(--skeleton-highlight, #e0e0e0) 50%,
        var(--skeleton-base, #f0f0f0) 75%
    );
    background-size: 200% 100%;
    border-radius: 4px;
    display: inline-block;
}

.skeleton--animate {
    animation: skeleton-loading 1.5s infinite ease-in-out;
}

@keyframes skeleton-loading {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

.skeleton--circular {
    border-radius: 50%;
}

.skeleton--rectangular {
    border-radius: 8px;
}

.skeleton-text-container {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
}

.script-skeleton,
.scene-skeleton,
.character-skeleton,
.timeline-skeleton {
    padding: 20px;
    background: var(--background-primary);
}

.script-header,
.scene-header,
.timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 10px;
}

.scene-grid,
.character-grid {
    display: grid;
    gap: 20px;
}

.scene-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.character-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
}

.character-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.scene-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.timeline-tracks {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.timeline-track {
    display: flex;
    align-items: center;
    gap: 10px;
}

.timeline-clips {
    display: flex;
    gap: 8px;
    flex: 1;
    overflow-x: auto;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .skeleton {
        --skeleton-base: #374151;
        --skeleton-highlight: #4b5563;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .skeleton--animate {
        animation: none;
    }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .skeleton {
        --skeleton-base: #000000;
        --skeleton-highlight: #808080;
    }
}
`;