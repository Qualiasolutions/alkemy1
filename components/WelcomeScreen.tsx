import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeContext';
import Button from './Button';
import {
    PlusIcon,
    UploadIcon,
    ScriptIcon,
    ClapperboardIcon,
    FilmIcon,
    SparklesIcon
} from './icons/Icons';

interface WelcomeScreenProps {
    onStartNewProject: () => void;
    onLoadProject: () => void;
    onTryDemo: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
    onStartNewProject,
    onLoadProject,
    onTryDemo
}) => {
    const { colors, isDark } = useTheme();

    const features = [
        {
            icon: <ScriptIcon className="w-8 h-8" />,
            title: 'Script Analysis',
            description: 'Upload your screenplay and let AI break it down into scenes, characters, locations, and production elements with stunning accuracy',
            badge: 'Powered by Gemini 2.5 Pro'
        },
        {
            icon: <ClapperboardIcon className="w-8 h-8" />,
            title: 'Shot Composition',
            description: 'Transform script descriptions into photorealistic cinematic frames with professional cinematography and lighting',
            badge: 'Imagen & Flash Image'
        },
        {
            icon: <FilmIcon className="w-8 h-8" />,
            title: 'Video Animation',
            description: 'Bring your stills to life with state-of-the-art video generation, creating smooth 5-second clips ready for your timeline',
            badge: 'Veo 3.1'
        },
        {
            icon: <SparklesIcon className="w-8 h-8" />,
            title: 'AI Director',
            description: 'Get expert creative guidance on framing, mood, pacing, and storytelling decisions throughout your entire production',
            badge: 'Real-time Assistance'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5, ease: 'easeOut' }
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-8 ${
            isDark ? 'bg-gradient-to-br from-[#0B0B0B] via-[#121212] to-[#0B0B0B]' : 'bg-gradient-to-br from-white via-gray-50 to-white'
        }`}>
            {/* Background glow effects */}
            <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${
                isDark ? 'bg-teal-500/10' : 'bg-teal-600/15'
            } rounded-full blur-3xl pointer-events-none`} />
            <div className={`absolute bottom-1/4 right-1/3 w-80 h-80 ${
                isDark ? 'bg-teal-400/8' : 'bg-teal-500/12'
            } rounded-full blur-3xl pointer-events-none`} />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 max-w-6xl w-full"
            >
                {/* Hero section */}
                <motion.div variants={itemVariants} className="text-center mb-16">
                    <h1 className={`text-6xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                        Welcome to{' '}
                        <span className={`bg-gradient-to-r ${
                            isDark
                                ? 'from-teal-400 to-teal-500'
                                : 'from-teal-600 to-teal-700'
                        } bg-clip-text text-transparent`}>
                            Alkemy AI Studio
                        </span>
                    </h1>
                    <p className={`text-2xl mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Transform your screenplay into a complete visual production
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            onClick={onStartNewProject}
                            variant="primary"
                            className="!px-8 !py-4 !text-lg !font-bold w-full sm:w-auto"
                        >
                            <PlusIcon className="w-6 h-6" />
                            Start New Project
                        </Button>
                        <Button
                            onClick={onTryDemo}
                            variant="glass"
                            className="!px-8 !py-4 !text-lg w-full sm:w-auto"
                        >
                            <SparklesIcon className="w-6 h-6" />
                            Try Demo Project
                        </Button>
                        <Button
                            onClick={onLoadProject}
                            variant="secondary"
                            className="!px-8 !py-4 !text-lg w-full sm:w-auto"
                        >
                            <UploadIcon className="w-6 h-6" />
                            Load Project
                        </Button>
                    </div>
                </motion.div>

                {/* Feature grid */}
                <motion.div variants={itemVariants} className="mb-12">
                    <h2 className={`text-center text-xl font-semibold mb-8 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                        Everything you need to create cinematic content
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className={`p-6 rounded-2xl border ${
                                    isDark
                                        ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700/50 hover:border-teal-500/50'
                                        : 'bg-white border-gray-200 hover:border-teal-500/50'
                                } backdrop-blur-sm transition-all duration-300 cursor-default flex flex-col`}
                            >
                                <div className={`inline-flex p-3 rounded-xl mb-4 w-fit ${
                                    isDark ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-100 text-teal-600'
                                }`}>
                                    {feature.icon}
                                </div>
                                <h3 className={`font-semibold text-lg mb-2 ${
                                    isDark ? 'text-white' : 'text-black'
                                }`}>
                                    {feature.title}
                                </h3>
                                <p className={`text-sm mb-4 flex-1 ${
                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    {feature.description}
                                </p>
                                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium w-fit ${
                                    isDark ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-100 text-teal-700'
                                }`}>
                                    {feature.badge}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default WelcomeScreen;
