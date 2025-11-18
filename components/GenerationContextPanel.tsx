/**
 * Generation Context Panel Component
 *
 * Displays and manages the current generation context for scene/frame generation.
 * Shows selected characters (with identity status), location, and moodboard.
 *
 * Used in: SceneAssemblerTab, potentially other generation interfaces
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GenerationContext, CharacterWithIdentity, LocationWith3DWorld } from '@/services/generationContext';
import { CheckCircleIcon, AlertCircleIcon, UsersIcon, MapPinIcon, ImageIcon, ChevronDownIcon, XIcon } from './icons/Icons';

interface GenerationContextPanelProps {
    context: GenerationContext;
    selectedCharacterIds: string[];
    selectedLocationId?: string;
    onCharacterSelectionChange: (characterIds: string[]) => void;
    onLocationChange: (locationId: string) => void;
    compact?: boolean;
}

const GenerationContextPanel: React.FC<GenerationContextPanelProps> = ({
    context,
    selectedCharacterIds,
    selectedLocationId,
    onCharacterSelectionChange,
    onLocationChange,
    compact = false
}) => {
    const [isExpanded, setIsExpanded] = useState(!compact);

    const selectedCharacters = context.characters.filter(c => selectedCharacterIds.includes(c.id));
    const selectedLocation = context.locations.find(l => l.id === selectedLocationId);

    const identityCount = selectedCharacters.filter(c => c.hasIdentity).length;
    const hasAllIdentities = selectedCharacters.length > 0 && identityCount === selectedCharacters.length;

    if (compact && !isExpanded) {
        return (
            <motion.button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:border-[var(--color-accent-primary)]/50 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">
                        {selectedCharacters.length} character{selectedCharacters.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {selectedLocation && (
                    <>
                        <div className="w-px h-4 bg-gray-700" />
                        <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-300 truncate max-w-[150px]">
                                {selectedLocation.name}
                            </span>
                        </div>
                    </>
                )}

                {hasAllIdentities && (
                    <>
                        <div className="w-px h-4 bg-gray-700" />
                        <CheckCircleIcon className="w-4 h-4 text-#dfec2d" />
                    </>
                )}

                <ChevronDownIcon className="w-4 h-4 text-gray-500 ml-auto" />
            </motion.button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 rounded-2xl border border-gray-700/50 overflow-hidden"
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent-primary)]/20 to-[var(--color-accent-secondary)]/20 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-[var(--color-accent-primary)]" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">Generation Context</h4>
                        <p className="text-xs text-gray-500">
                            {selectedCharacters.length} characters • {identityCount} identities
                        </p>
                    </div>
                </div>

                {compact && (
                    <motion.button
                        onClick={() => setIsExpanded(false)}
                        className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <XIcon className="w-4 h-4 text-gray-500" />
                    </motion.button>
                )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
                {/* Characters Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <UsersIcon className="w-3.5 h-3.5" />
                            Characters ({selectedCharacters.length})
                        </h5>
                        {hasAllIdentities && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-#dfec2d/10 border border-#dfec2d/30">
                                <CheckCircleIcon className="w-3 h-3 text-#dfec2d" />
                                <span className="text-[10px] font-bold text-#dfec2d uppercase">All Ready</span>
                            </div>
                        )}
                    </div>

                    {selectedCharacters.length > 0 ? (
                        <div className="space-y-2">
                            {selectedCharacters.map(character => (
                                <CharacterCard
                                    key={character.id}
                                    character={character}
                                    onRemove={() => {
                                        onCharacterSelectionChange(
                                            selectedCharacterIds.filter(id => id !== character.id)
                                        );
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 border-2 border-dashed border-gray-700/50 rounded-xl">
                            <UsersIcon className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 font-medium">No characters selected</p>
                        </div>
                    )}
                </div>

                {/* Location Section */}
                <div className="space-y-3">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        Location
                    </h5>

                    {selectedLocation ? (
                        <LocationCard
                            location={selectedLocation}
                            onRemove={() => onLocationChange('')}
                        />
                    ) : (
                        <div className="text-center py-6 border-2 border-dashed border-gray-700/50 rounded-xl">
                            <MapPinIcon className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 font-medium">No location selected</p>
                        </div>
                    )}
                </div>

                {/* Moodboard Indicator */}
                {context.moodboard && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <CheckCircleIcon className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-medium text-purple-300">Moodboard styling active</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

/**
 * Character Card Component
 */
const CharacterCard: React.FC<{
    character: CharacterWithIdentity;
    onRemove: () => void;
}> = ({ character, onRemove }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="relative group flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:border-[var(--color-accent-primary)]/50 transition-all"
        >
            {/* Character Image */}
            {character.imageUrl ? (
                <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
            ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                    <UsersIcon className="w-5 h-5 text-gray-600" />
                </div>
            )}

            {/* Character Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white truncate">{character.name}</p>
                    {character.hasIdentity && (
                        <CheckCircleIcon className="w-3.5 h-3.5 text-#dfec2d flex-shrink-0" />
                    )}
                </div>
                <p className="text-xs text-gray-500">
                    {character.hasIdentity ? (
                        <span className="text-#dfec2d font-medium">Identity Ready</span>
                    ) : (
                        <span className="text-#dfec2d font-medium">No Identity</span>
                    )}
                </p>
            </div>

            {/* Remove Button */}
            <motion.button
                onClick={onRemove}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/30 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <XIcon className="w-3 h-3" />
            </motion.button>
        </motion.div>
    );
};

/**
 * Location Card Component
 */
const LocationCard: React.FC<{
    location: LocationWith3DWorld;
    onRemove: () => void;
}> = ({ location, onRemove }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="relative group flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:border-[var(--color-accent-primary)]/50 transition-all"
        >
            {/* Location Image */}
            {location.imageUrl ? (
                <img
                    src={location.imageUrl}
                    alt={location.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
            ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="w-5 h-5 text-gray-600" />
                </div>
            )}

            {/* Location Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white truncate">{location.name}</p>
                    {location.worldId && (
                        <CheckCircleIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    )}
                </div>
                <p className="text-xs text-gray-500">
                    {location.worldId ? (
                        <span className="text-cyan-400 font-medium">3D World Linked</span>
                    ) : (
                        <span className="text-gray-500 font-medium">Reference Image</span>
                    )}
                </p>
            </div>

            {/* Remove Button */}
            <motion.button
                onClick={onRemove}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/30 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <XIcon className="w-3 h-3" />
            </motion.button>
        </motion.div>
    );
};

export default GenerationContextPanel;
