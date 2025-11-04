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
            ? 'bg-gradient-to-r from-green-900/95 to-green-800/95 border-green-600/50 text-green-100 shadow-[0_0_30px_rgba(34,197,94,0.25)]'
            : 'bg-gradient-to-r from-green-100 to-green-200 border-green-400/60 text-green-900 shadow-[0_0_30px_rgba(34,197,94,0.15)]',
        error: isDark
            ? 'bg-gradient-to-r from-red-900/95 to-red-800/95 border-red-600/50 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.25)]'
            : 'bg-gradient-to-r from-red-100 to-red-200 border-red-400/60 text-red-900 shadow-[0_0_30px_rgba(239,68,68,0.15)]',
        warning: isDark
            ? 'bg-gradient-to-r from-yellow-900/95 to-yellow-800/95 border-yellow-600/50 text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.25)]'
            : 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-400/60 text-yellow-900 shadow-[0_0_30px_rgba(250,204,21,0.15)]',
        info: isDark
            ? 'bg-gradient-to-r from-blue-900/95 to-blue-800/95 border-blue-600/50 text-blue-100 shadow-[0_0_30px_rgba(59,130,246,0.25)]'
            : 'bg-gradient-to-r from-blue-100 to-blue-200 border-blue-400/60 text-blue-900 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100, scale: 0.85, x: 100 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, y: 20, scale: 0.95, x: 50 }}
                transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 25,
                    mass: 0.8
                }}
                className={`fixed bottom-8 right-8 z-[200] max-w-md ${styles[toast.type]} border-2 rounded-2xl px-6 py-4 backdrop-blur-xl flex items-center gap-4`}
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
