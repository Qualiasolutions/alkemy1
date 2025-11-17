import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeContext';
import Button from './Button';
import {
    ScriptIcon,
    ClapperboardIcon,
    FilmIcon,
    SparklesIcon,
    UploadIcon,
    PlusIcon
} from './icons/Icons';

/**
 * Enhanced Empty State Component
 * Beautiful empty states with illustrations and CTAs
 */

interface EmptyStateProps {
    type: 'script' | 'moodboard' | 'characters' | 'shots' | 'timeline' | 'generic';
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    type,
    title,
    description,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction
}) => {
    const { isDark } = useTheme();

    const getEmptyStateContent = () => {
        switch (type) {
            case 'script':
                return {
                    icon: <ScriptIcon className="w-20 h-20" />,
                    title: title || 'No Script Yet',
                    description: description || 'Upload or paste your screenplay to begin. Alkemy will analyze it and break it down into production-ready scenes with character, location, and shot information.',
                    actionLabel: actionLabel || 'Upload Script',
                    illustrationColor: isDark ? 'from-teal-500/20 to-teal-600/10' : 'from-teal-500/30 to-teal-600/20'
                };
            case 'moodboard':
                return {
                    icon: <SparklesIcon className="w-20 h-20" />,
                    title: title || 'Build Your Visual Style',
                    description: description || 'Add reference images, color palettes, and cinematography notes to guide your AI-generated content. A strong moodboard ensures consistent visual quality across all shots.',
                    actionLabel: actionLabel || 'Add Reference Image',
                    illustrationColor: isDark ? 'from-purple-500/20 to-pink-600/10' : 'from-purple-500/30 to-pink-600/20'
                };
            case 'characters':
                return {
                    icon: <ClapperboardIcon className="w-20 h-20" />,
                    title: title || 'No Characters Generated',
                    description: description || 'Generate character portraits based on your script analysis. These will be used as reference for shot generation to maintain visual consistency.',
                    actionLabel: actionLabel || 'Generate Characters',
                    illustrationColor: isDark ? 'from-blue-500/20 to-cyan-600/10' : 'from-blue-500/30 to-cyan-600/20'
                };
            case 'shots':
                return {
                    icon: <FilmIcon className="w-20 h-20" />,
                    title: title || 'No Shots Generated',
                    description: description || 'Generate cinematic stills and videos for each scene. Alkemy will create professional shots with proper framing, lighting, and composition based on your script.',
                    actionLabel: actionLabel || 'Generate Shots',
                    illustrationColor: isDark ? 'from-amber-500/20 to-orange-600/10' : 'from-amber-500/30 to-orange-600/20'
                };
            case 'timeline':
                return {
                    icon: <FilmIcon className="w-20 h-20" />,
                    title: title || 'Timeline is Empty',
                    description: description || 'Transfer your upscaled video shots to the timeline to assemble your final production. You can trim, reorder, and export your complete video sequence.',
                    actionLabel: actionLabel || 'Go to Compositing',
                    illustrationColor: isDark ? 'from-green-500/20 to-#b3e617/10' : 'from-green-500/30 to-#b3e617/20'
                };
            default:
                return {
                    icon: <SparklesIcon className="w-20 h-20" />,
                    title: title || 'Nothing Here Yet',
                    description: description || 'Get started by creating content or uploading assets.',
                    actionLabel: actionLabel || 'Get Started',
                    illustrationColor: isDark ? 'from-gray-500/20 to-gray-600/10' : 'from-gray-500/30 to-gray-600/20'
                };
        }
    };

    const content = getEmptyStateContent();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center min-h-[500px] p-8"
        >
            <div className="max-w-2xl w-full text-center">
                {/* Animated illustration circle */}
                <div className="relative mb-8 inline-block">
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                        className={`absolute inset-0 bg-gradient-to-br ${content.illustrationColor} rounded-full blur-2xl`}
                        style={{ width: '200px', height: '200px', left: '-50%', top: '-50%', transform: 'translate(50%, 50%)' }}
                    />
                    <div className={`relative w-32 h-32 rounded-full border-2 ${
                        isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-white/50 border-gray-300'
                    } backdrop-blur-sm flex items-center justify-center ${
                        isDark ? 'text-teal-400' : 'text-teal-600'
                    }`}>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                        >
                            {content.icon}
                        </motion.div>
                    </div>
                </div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                        {content.title}
                    </h2>
                    <p className={`text-lg mb-8 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {content.description}
                    </p>

                    {/* Action buttons */}
                    {(onAction || onSecondaryAction) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                            className="flex items-center justify-center gap-4"
                        >
                            {onAction && (
                                <Button
                                    onClick={onAction}
                                    variant="primary"
                                    className="!px-6 !py-3"
                                >
                                    {content.actionLabel}
                                </Button>
                            )}
                            {onSecondaryAction && secondaryActionLabel && (
                                <Button
                                    onClick={onSecondaryAction}
                                    variant="secondary"
                                    className="!px-6 !py-3"
                                >
                                    {secondaryActionLabel}
                                </Button>
                            )}
                        </motion.div>
                    )}
                </motion.div>

                {/* Decorative elements */}
                <div className="mt-12 flex items-center justify-center gap-2 opacity-50">
                    <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                    <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-400'}`} />
                    <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                </div>
            </div>
        </motion.div>
    );
};

export default EmptyState;
