import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon, XIcon } from './icons/Icons';
import { useTheme } from '../theme/ThemeContext';

interface FullScreenWorkspaceProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    showBackButton?: boolean;
    showCloseButton?: boolean;
    className?: string;
}

/**
 * FullScreenWorkspace - Unified full-screen workspace component
 *
 * Provides a consistent full-screen experience across all tabs:
 * - Fixed inset-0 positioning with z-50 to overlay entire app
 * - ESC key handling for quick exit
 * - Smooth enter/exit animations
 * - Consistent header with back/close buttons
 * - Dark background for focus
 *
 * Usage:
 * <FullScreenWorkspace isOpen={isWorkspaceOpen} onClose={() => setIsWorkspaceOpen(false)}>
 *   <YourWorkspaceContent />
 * </FullScreenWorkspace>
 */
const FullScreenWorkspace: React.FC<FullScreenWorkspaceProps> = ({
    isOpen,
    onClose,
    children,
    title,
    showBackButton = true,
    showCloseButton = false,
    className = ''
}) => {
    const { isDark } = useTheme();

    // ESC key handler
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`fixed inset-0 bg-[#0B0B0B] z-50 flex flex-col ${className}`}
            >
                {/* Header with Back/Close Button */}
                {(showBackButton || showCloseButton || title) && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className={`sticky top-0 z-60 flex items-center gap-4 px-6 py-4 border-b ${
                            isDark ? 'border-gray-800/50 bg-[#0B0B0B]/95' : 'border-gray-200 bg-white/95'
                        } backdrop-blur-sm`}
                    >
                        {/* Back/Close Button */}
                        {(showBackButton || showCloseButton) && (
                            <button
                                onClick={onClose}
                                className={`p-2 rounded-lg transition-all ${
                                    isDark
                                        ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                                        : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                                }`}
                                aria-label={showBackButton ? 'Go back' : 'Close'}
                            >
                                {showBackButton ? (
                                    <ArrowLeftIcon className="w-5 h-5" />
                                ) : (
                                    <XIcon className="w-5 h-5" />
                                )}
                            </button>
                        )}

                        {/* Title */}
                        {title && (
                            <h2 className={`text-xl font-bold ${
                                isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                                {title}
                            </h2>
                        )}

                        {/* ESC hint */}
                        <div className="ml-auto">
                            <kbd className={`px-2 py-1 text-xs rounded ${
                                isDark
                                    ? 'bg-gray-800 text-gray-400 border border-gray-700'
                                    : 'bg-gray-200 text-gray-600 border border-gray-300'
                            }`}>
                                ESC
                            </kbd>
                        </div>
                    </motion.div>
                )}

                {/* Workspace Content */}
                <motion.div
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="flex-1 overflow-auto"
                >
                    {children}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FullScreenWorkspace;
