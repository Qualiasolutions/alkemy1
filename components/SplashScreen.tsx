import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../theme/ThemeContext';
import { AlkemyLoadingIcon } from './icons/Icons';

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const { isDark } = useTheme();
    const [progress, setProgress] = useState(0);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Simulate loading progress
        const duration = 2000; // 2 seconds
        const interval = 20;
        const steps = duration / interval;
        const increment = 100 / steps;

        const timer = setInterval(() => {
            setProgress(prev => {
                const next = Math.min(prev + increment, 100);
                if (next >= 100) {
                    clearInterval(timer);
                    // Start exit animation after a brief pause
                    setTimeout(() => {
                        setIsExiting(true);
                        setTimeout(onComplete, 500); // Match exit animation duration
                    }, 200);
                }
                return next;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${
                        isDark ? 'bg-gradient-to-br from-[#0B0B0B] via-[#0F0F0F] to-[#0B0B0B]' : 'bg-gradient-to-br from-white via-gray-50 to-white'
                    }`}
                >
                    {/* Animated background particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    opacity: 0,
                                    x: Math.random() * window.innerWidth,
                                    y: Math.random() * window.innerHeight
                                }}
                                animate={{
                                    opacity: [0, 0.3, 0],
                                    scale: [0.5, 1, 0.5],
                                    x: Math.random() * window.innerWidth,
                                    y: Math.random() * window.innerHeight,
                                }}
                                transition={{
                                    duration: 3 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                }}
                                className={`absolute w-1 h-1 rounded-full ${
                                    isDark ? 'bg-teal-500' : 'bg-teal-600'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Logo and branding */}
                    <div className="relative z-10 flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                            className="mb-8"
                        >
                            <AlkemyLoadingIcon className={`w-24 h-24 ${isDark ? 'text-teal-500' : 'text-teal-600'}`} />
                        </motion.div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}
                        >
                            Alkemy AI Studio
                        </motion.h1>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-12`}
                        >
                            AI-Powered Film Production
                        </motion.p>

                        {/* Loading bar */}
                        <div className="w-72">
                            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                <motion.div
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.1, ease: 'linear' }}
                                    className={`h-full rounded-full ${
                                        isDark
                                            ? 'bg-gradient-to-r from-teal-500 to-teal-400'
                                            : 'bg-gradient-to-r from-teal-600 to-teal-500'
                                    }`}
                                />
                            </div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className={`text-center mt-3 text-sm font-mono ${isDark ? 'text-gray-500' : 'text-gray-600'}`}
                            >
                                {Math.round(progress)}%
                            </motion.p>
                        </div>
                    </div>

                    {/* Glow effect */}
                    <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 ${
                        isDark ? 'bg-teal-500/10' : 'bg-teal-600/15'
                    } rounded-full blur-3xl pointer-events-none`} />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
