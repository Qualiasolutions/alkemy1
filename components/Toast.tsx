import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../theme/ThemeContext';
import { CheckIcon, XIcon, AlertTriangleIcon, InfoIcon } from './icons/Icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastProps {
    toast: ToastMessage | null;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    const { isDark } = useTheme();

    if (!toast) return null;

    const icons = {
        success: <CheckIcon className="w-5 h-5" />,
        error: <XIcon className="w-5 h-5" />,
        warning: <AlertTriangleIcon className="w-5 h-5" />,
        info: <InfoIcon className="w-5 h-5" />
    };

    const styles = {
        success: isDark
            ? 'bg-gradient-to-r from-green-900/90 to-green-800/90 border-green-700 text-green-100'
            : 'bg-gradient-to-r from-green-100 to-green-200 border-green-300 text-green-900',
        error: isDark
            ? 'bg-gradient-to-r from-red-900/90 to-red-800/90 border-red-700 text-red-100'
            : 'bg-gradient-to-r from-red-100 to-red-200 border-red-300 text-red-900',
        warning: isDark
            ? 'bg-gradient-to-r from-yellow-900/90 to-yellow-800/90 border-yellow-700 text-yellow-100'
            : 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300 text-yellow-900',
        info: isDark
            ? 'bg-gradient-to-r from-blue-900/90 to-blue-800/90 border-blue-700 text-blue-100'
            : 'bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300 text-blue-900'
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9, x: 50 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, y: 20, scale: 0.95, x: 50 }}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                className={`fixed bottom-8 right-8 z-[200] max-w-md ${styles[toast.type]} border rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl flex items-center gap-4`}
            >
                <div className="flex-shrink-0">
                    {icons[toast.type]}
                </div>
                <p className="flex-1 font-semibold text-sm">
                    {toast.message}
                </p>
                <button
                    onClick={onClose}
                    className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                        isDark
                            ? 'hover:bg-white/10'
                            : 'hover:bg-black/10'
                    }`}
                >
                    <XIcon className="w-4 h-4" />
                </button>

                {/* Progress bar */}
                <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                    className={`absolute bottom-0 left-0 h-1 rounded-b-2xl ${
                        toast.type === 'success'
                            ? 'bg-green-500'
                            : toast.type === 'error'
                            ? 'bg-red-500'
                            : toast.type === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                    }`}
                />
            </motion.div>
        </AnimatePresence>
    );
};

export default Toast;
