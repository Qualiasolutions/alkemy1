import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../theme/ThemeContext';
import { XIcon, UsersIcon, MapPinIcon, ClapperboardIcon } from './icons/Icons';
import { AnalyzedCharacter, AnalyzedLocation, AnalyzedScene } from '../types';

interface DetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'cast' | 'locations' | 'scenes';
    data: AnalyzedCharacter[] | AnalyzedLocation[] | AnalyzedScene[];
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, type, data }) => {
    const { isDark } = useTheme();

    const getTitle = () => {
        switch (type) {
            case 'cast':
                return 'Cast Members';
            case 'locations':
                return 'Locations';
            case 'scenes':
                return 'Scenes';
            default:
                return 'Details';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'cast':
                return <UsersIcon className="w-6 h-6 text-[#dfec2d]" />;
            case 'locations':
                return <MapPinIcon className="w-6 h-6 text-[#dfec2d]" />;
            case 'scenes':
                return <ClapperboardIcon className="w-6 h-6 text-[#dfec2d]" />;
            default:
                return null;
        }
    };

    const renderContent = () => {
        if (type === 'cast') {
            const characters = data as AnalyzedCharacter[];
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {characters.map((character, index) => (
                        <motion.div
                            key={character.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`rounded-xl overflow-hidden ${
                                isDark
                                    ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800/50'
                                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                            } hover:border-[#dfec2d]/50 transition-all`}
                        >
                            <div className="p-4">
                                {character.imageUrl && (
                                    <div className="mb-3 rounded-lg overflow-hidden h-40 bg-gray-800">
                                        <img
                                            src={character.imageUrl}
                                            alt={character.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <h4 className={`text-lg font-bold mb-2 ${
                                    isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                    {character.name}
                                </h4>
                                <p className={`text-sm ${
                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    {character.description}
                                </p>
                                {character.identity?.status === 'ready' && (
                                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-[#dfec2d]/20 text-[#dfec2d] border border-[#dfec2d]/30">
                                        Identity Trained
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            );
        }

        if (type === 'locations') {
            const locations = data as AnalyzedLocation[];
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {locations.map((location, index) => (
                        <motion.div
                            key={location.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`rounded-xl overflow-hidden ${
                                isDark
                                    ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800/50'
                                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                            } hover:border-[#dfec2d]/50 transition-all`}
                        >
                            <div className="p-4">
                                {location.imageUrl && (
                                    <div className="mb-3 rounded-lg overflow-hidden h-40 bg-gray-800">
                                        <img
                                            src={location.imageUrl}
                                            alt={location.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <h4 className={`text-lg font-bold mb-2 ${
                                    isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                    {location.name}
                                </h4>
                                <p className={`text-sm ${
                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    {location.description}
                                </p>
                                {location.worldId && (
                                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                        3D World Ready
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            );
        }

        if (type === 'scenes') {
            const scenes = data as AnalyzedScene[];
            return (
                <div className="space-y-3">
                    {scenes.map((scene, index) => (
                        <motion.div
                            key={scene.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`rounded-xl p-4 ${
                                isDark
                                    ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800/50'
                                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                            } hover:border-[#dfec2d]/50 transition-all`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                                    isDark ? 'bg-[#dfec2d]/20 text-[#dfec2d]' : 'bg-[#dfec2d]/30 text-[#b3e617]'
                                }`}>
                                    {scene.sceneNumber}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-base font-bold mb-1 ${
                                        isDark ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        {scene.setting}
                                    </h4>
                                    <p className={`text-sm mb-2 ${
                                        isDark ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        {scene.summary}
                                    </p>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {scene.time_of_day && (
                                            <span className={`px-2 py-1 rounded-full ${
                                                isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/20 text-blue-600'
                                            }`}>
                                                {scene.time_of_day}
                                            </span>
                                        )}
                                        {scene.mood && (
                                            <span className={`px-2 py-1 rounded-full ${
                                                isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-500/20 text-purple-600'
                                            }`}>
                                                {scene.mood}
                                            </span>
                                        )}
                                        {scene.frames && scene.frames.length > 0 && (
                                            <span className={`px-2 py-1 rounded-full ${
                                                isDark ? 'bg-[#dfec2d]/20 text-[#dfec2d]' : 'bg-[#dfec2d]/30 text-[#b3e617]'
                                            }`}>
                                                {scene.frames.length} shots
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            );
        }

        return null;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className={`relative w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden ${
                                isDark
                                    ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0B0B0B] border border-gray-800/50'
                                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                            } shadow-2xl`}
                        >
                            {/* Header */}
                            <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
                                isDark ? 'border-gray-800/50 bg-[#1A1A1A]/95' : 'border-gray-200 bg-white/95'
                            } backdrop-blur-sm`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getIcon()}
                                        <h3 className={`text-2xl font-bold ${
                                            isDark ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {getTitle()}
                                        </h3>
                                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                            isDark
                                                ? 'bg-[#dfec2d]/20 text-[#dfec2d] border border-[#dfec2d]/30'
                                                : 'bg-[#dfec2d]/20 text-[#b3e617] border border-[#dfec2d]/30'
                                        }`}>
                                            {data.length} {data.length === 1 ? 'item' : 'items'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className={`p-2 rounded-lg transition-all ${
                                            isDark
                                                ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                                                : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                                        }`}
                                        aria-label="Close modal"
                                    >
                                        <XIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                                {renderContent()}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DetailModal;
