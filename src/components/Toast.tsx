import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    // Always using dark theme
    if (!toast) return null;

    const icons = {
        success: <CheckIcon className="w-5 h-5" />,
        error: <XIcon className="w-5 h-5" />,
        warning: <AlertTriangleIcon className="w-5 h-5" />,
        info: <InfoIcon className="w-5 h-5" />
    };

    const styles = {
        success: 'bg-gradient-to-r from-green-950/98 via-green-900/98 to-yellow-900/98 border-green-500/60 text-green-100 shadow-[0_8px_32px_rgba(223,236,45,0.3)]',
        error: 'bg-gradient-to-r from-red-950/98 via-red-900/98 to-rose-900/98 border-red-500/60 text-red-100 shadow-[0_8px_32px_rgba(239,68,68,0.3)]',
        warning: 'bg-gradient-to-r from-yellow-950/98 via-yellow-900/98 to-amber-900/98 border-yellow-500/60 text-yellow-100 shadow-[0_8px_32px_rgba(223,236,45,0.3)]',
        info: 'bg-gradient-to-r from-zinc-950/98 via-zinc-900/98 to-slate-900/98 border-zinc-500/60 text-zinc-100 shadow-[0_8px_32px_rgba(250,204,21,0.3)]'
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
                    className="flex-shrink-0 p-1 rounded-lg transition-colors hover:bg-white/10"
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
                            ? 'bg-gradient-to-r from-green-500 to-yellow-500'
                            : toast.type === 'error'
                            ? 'bg-gradient-to-r from-red-500 to-rose-500'
                            : toast.type === 'warning'
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                            : 'bg-gradient-to-r from-zinc-400 to-slate-400'
                    }`}
                />
            </motion.div>
        </AnimatePresence>
    );
};

export default Toast;
