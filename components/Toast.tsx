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
            ? 'bg-gradient-to-r from-emerald-950/98 via-emerald-900/98 to-green-900/98 border-emerald-600/60 text-emerald-100 shadow-[0_8px_32px_rgba(16,185,129,0.3)]'
            : 'bg-gradient-to-r from-emerald-50 via-emerald-100 to-green-100 border-emerald-400/70 text-emerald-900 shadow-[0_8px_32px_rgba(5,150,105,0.25)]',
        error: isDark
            ? 'bg-gradient-to-r from-red-950/98 via-red-900/98 to-rose-900/98 border-red-600/60 text-red-100 shadow-[0_8px_32px_rgba(239,68,68,0.3)]'
            : 'bg-gradient-to-r from-red-50 via-red-100 to-rose-100 border-red-400/70 text-red-900 shadow-[0_8px_32px_rgba(220,38,38,0.25)]',
        warning: isDark
            ? 'bg-gradient-to-r from-amber-950/98 via-amber-900/98 to-yellow-900/98 border-amber-600/60 text-amber-100 shadow-[0_8px_32px_rgba(245,158,11,0.3)]'
            : 'bg-gradient-to-r from-amber-50 via-amber-100 to-yellow-100 border-amber-400/70 text-amber-900 shadow-[0_8px_32px_rgba(245,158,11,0.25)]',
        info: isDark
            ? 'bg-gradient-to-r from-blue-950/98 via-blue-900/98 to-sky-900/98 border-blue-600/60 text-blue-100 shadow-[0_8px_32px_rgba(59,130,246,0.3)]'
            : 'bg-gradient-to-r from-blue-50 via-blue-100 to-sky-100 border-blue-400/70 text-blue-900 shadow-[0_8px_32px_rgba(37,99,235,0.25)]'
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
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                            : toast.type === 'error'
                            ? 'bg-gradient-to-r from-red-500 to-rose-500'
                            : toast.type === 'warning'
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                            : 'bg-gradient-to-r from-blue-500 to-sky-500'
                    }`}
                />
            </motion.div>
        </AnimatePresence>
    );
};

export default Toast;
