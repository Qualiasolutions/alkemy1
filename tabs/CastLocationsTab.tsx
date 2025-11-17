
import React, { useState, useEffect, useRef } from 'react';
import { AnalyzedCharacter, AnalyzedLocation, Moodboard, MoodboardTemplate, CharacterIdentity } from '../types';
import Button from '../components/Button';
import { UsersIcon, MapPinIcon, PlusIcon, ImagePlusIcon, Trash2Icon, ExpandIcon, CheckCircleIcon, AlertCircleIcon, UploadIcon } from '../components/icons/Icons';
import { useTheme } from '../theme/ThemeContext';
import { motion } from 'framer-motion';
import CharacterIdentityModal from '../components/CharacterIdentityModal';
import { getCharacterIdentityStatus } from '../services/characterIdentityService';
import CastLocationGenerator from '../components/CastLocationGenerator';

// --- STANDALONE MODAL COMPONENT ---
interface AddItemModalProps {
    type: 'character' | 'location';
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent, name: string, description: string) => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ type, isOpen, onClose, onSubmit }) => {
    const { isDark } = useTheme();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName('');
            setDescription('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 20 }}
                className={`w-full max-w-md rounded-2xl border overflow-hidden ${
                    isDark
                        ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border-gray-800'
                        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                }`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-6 py-5 border-b ${
                    isDark ? 'border-gray-800' : 'border-gray-200'
                }`}>
                    <h3 className={`text-xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        Add New {type === 'character' ? 'Character' : 'Location'}
                    </h3>
                    <p className={`text-sm mt-1 ${
                        isDark ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                        Enter details to create a new {type === 'character' ? 'character' : 'location'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={(e) => onSubmit(e, name, description)} className="p-6">
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="itemName" className={`block text-sm font-semibold mb-2 ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Name *
                            </label>
                            <input
                                id="itemName"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder={`e.g., ${type === 'character' ? 'John Smith' : 'City Streets'}`}
                                className={`w-full px-4 py-3 rounded-xl border transition-all ${
                                    isDark
                                        ? 'bg-[#0B0B0B] border-gray-800 text-white placeholder-gray-600 focus:border-teal-500 focus:bg-[#141414]'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:bg-gray-50'
                                } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label htmlFor="itemDescription" className={`block text-sm font-semibold mb-2 ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Description
                            </label>
                            <textarea
                                id="itemDescription"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder={`Describe the ${type}...`}
                                rows={4}
                                className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${
                                    isDark
                                        ? 'bg-[#0B0B0B] border-gray-800 text-white placeholder-gray-600 focus:border-teal-500 focus:bg-[#141414]'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:bg-gray-50'
                                } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="!px-6 !py-2.5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="!px-6 !py-2.5"
                        >
                            Add {type === 'character' ? 'Character' : 'Location'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

type GenerationItem = {
    type: 'character' | 'location';
    data: AnalyzedCharacter | AnalyzedLocation;
}

const Card: React.FC<{
    item: AnalyzedCharacter | AnalyzedLocation;
    icon: React.ReactNode;
    onClick: () => void;
    onAttach: () => void;
    onDelete: () => void;
    onPrepareIdentity?: () => void;
}> = ({ item, icon, onClick, onAttach, onDelete, onPrepareIdentity }) => {
    const { isDark } = useTheme();
    const hasImage = !!item.imageUrl;
    const variantCount = item.generations?.length || 0;

    // Check if this is a character with identity status
    const character = 'identity' in item ? (item as AnalyzedCharacter) : null;
    const identityStatus = character ? getCharacterIdentityStatus(character.identity) : 'none';

    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`group relative rounded-2xl overflow-hidden ${
                isDark
                    ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800/50'
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            } hover:border-teal-500/50 transition-all hover:shadow-2xl ${
                isDark ? 'hover:shadow-teal-500/20' : 'hover:shadow-teal-500/30'
            }`}
        >
            {/* Status Badges */}
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
                {/* Image Status Badge */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                        hasImage
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-500/20 text-gray-500 border border-gray-500/30'
                    }`}
                >
                    {hasImage ? 'Ready' : 'Draft'}
                </motion.div>

                {/* Identity Status Badge (only for characters) */}
                {character && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        role="status"
                        aria-label={`Character identity status: ${identityStatus === 'ready' ? 'Ready' : identityStatus === 'preparing' ? 'Training in progress' : identityStatus === 'error' ? 'Error occurred' : 'Not prepared'}`}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1 ${
                            identityStatus === 'ready'
                                ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30'
                                : identityStatus === 'preparing'
                                ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30'
                                : identityStatus === 'error'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-gray-500/20 text-gray-500 border border-gray-500/30'
                        }`}
                    >
                        {identityStatus === 'ready' && <CheckCircleIcon className="w-3 h-3" />}
                        {identityStatus === 'error' && <AlertCircleIcon className="w-3 h-3" />}
                        {identityStatus === 'preparing' && (
                            <svg className="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {identityStatus === 'ready' ? 'Identity' : identityStatus === 'preparing' ? 'Training' : identityStatus === 'error' ? 'Error' : 'No ID'}
                    </motion.div>
                )}
            </div>

            {/* Image Section */}
            <div onClick={onClick} className="cursor-pointer relative">
                <div className="aspect-[4/3] relative overflow-hidden bg-black/5">
                    {hasImage ? (
                        <>
                            <motion.img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.6 }}
                            />
                            {/* Gradient Overlays */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className={`absolute inset-0 bg-gradient-to-br ${
                                isDark ? 'from-teal-500/10 to-purple-500/10' : 'from-teal-400/20 to-purple-400/20'
                            } opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                        </>
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                            isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-200'
                        }`}>
                            <div className={`${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
                                {icon}
                            </div>
                        </div>
                    )}

                    {/* Hover Overlay with Actions */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <motion.div
                                initial={{ scale: 0 }}
                                whileHover={{ scale: 1.2 }}
                                className="text-white"
                            >
                                <ExpandIcon className="w-10 h-10" />
                            </motion.div>
                            <p className="text-white font-bold text-sm">Open Studio</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-3 left-3 flex gap-2 opacity-100 transition-opacity z-20">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            aria-label={`Delete ${item.name}`}
                            className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
                                isDark
                                    ? 'bg-black/70 text-gray-300 hover:bg-red-500/90 hover:text-white'
                                    : 'bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white'
                            }`}
                        >
                            <Trash2Icon className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); onAttach(); }}
                            aria-label={`Attach image for ${item.name}`}
                            className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
                                isDark
                                    ? 'bg-black/70 text-gray-300 hover:bg-teal-500/90 hover:text-white'
                                    : 'bg-white/90 text-gray-600 hover:bg-teal-500 hover:text-white'
                            }`}
                        >
                            <ImagePlusIcon className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                    <h5 className={`text-lg font-bold mb-2 line-clamp-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        {item.name}
                    </h5>
                    <p className={`text-sm leading-relaxed line-clamp-2 mb-4 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        {item.description}
                    </p>

                    {/* Footer with Stats */}
                    <div className={`pt-3 border-t ${
                        isDark ? 'border-gray-800' : 'border-gray-200'
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <motion.div
                                    animate={hasImage ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className={`w-2 h-2 rounded-full ${hasImage ? 'bg-green-500' : 'bg-gray-500'}`}
                                />
                                <span className={`text-xs font-medium ${
                                    hasImage
                                        ? 'text-green-400'
                                        : isDark ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                    {hasImage ? 'Image Set' : 'No Image'}
                                </span>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                                variantCount > 0
                                    ? isDark
                                        ? 'bg-teal-500/10 border border-teal-500/20'
                                        : 'bg-teal-50 border border-teal-200'
                                    : isDark
                                        ? 'bg-gray-800/50 border border-gray-700'
                                        : 'bg-gray-100 border border-gray-200'
                            }`}>
                                <span className={`text-[10px] font-bold ${
                                    variantCount > 0
                                        ? 'text-teal-400'
                                        : isDark ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                    {variantCount}
                                </span>
                                <span className={`text-[10px] font-medium ${
                                    variantCount > 0
                                        ? isDark ? 'text-teal-300' : 'text-teal-600'
                                        : isDark ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                    {variantCount === 1 ? 'variant' : 'variants'}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </motion.div>
    );
};

interface CastLocationsTabProps {
    characters: AnalyzedCharacter[];
    setCharacters: React.Dispatch<React.SetStateAction<AnalyzedCharacter[]>>;
    locations: AnalyzedLocation[];
    setLocations: React.Dispatch<React.SetStateAction<AnalyzedLocation[]>>;
    moodboard?: Moodboard;
    moodboardTemplates?: MoodboardTemplate[];
}

const CastLocationsTab: React.FC<CastLocationsTabProps> = ({ characters, setCharacters, locations, setLocations, moodboard, moodboardTemplates = [] }) => {
    const [selectedItem, setSelectedItem] = useState<GenerationItem | null>(null);
    const [itemToUpdate, setItemToUpdate] = useState<{ id: string; type: 'character' | 'location' } | null>(null);
    const attachImageInputRef = useRef<HTMLInputElement>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState<'character' | 'location' | null>(null);
    const [identityModalCharacter, setIdentityModalCharacter] = useState<AnalyzedCharacter | null>(null);
    const [identityModalLoraImages, setIdentityModalLoraImages] = useState<string[]>([]);
    
    const handleItemUpdateBatch = (updater: (prev: AnalyzedCharacter | AnalyzedLocation) => AnalyzedCharacter | AnalyzedLocation) => {
         if (selectedItem?.type === 'character') {
            setCharacters(prevChars => prevChars.map(c => c.id === selectedItem.data.id ? updater(c) as AnalyzedCharacter : c));
        } else if (selectedItem?.type === 'location') {
            setLocations(prevLocs => prevLocs.map(l => l.id === selectedItem.data.id ? updater(l) as AnalyzedLocation : l));
        }
    };
    
    useEffect(() => {
        if (!selectedItem) return;

        const collection = selectedItem.type === 'character' ? characters : locations;
        const currentItemData = collection.find(item => item.id === selectedItem.data.id);
        if (!currentItemData) return;

        setSelectedItem(prev => {
            if (!prev) return null;
            if (prev.data === currentItemData) {
                return prev; // Avoid creating a new object when nothing changed
            }
            return { ...prev, data: currentItemData };
        });
    }, [characters, locations, selectedItem]);
    
    const handleAttachClick = (item: AnalyzedCharacter | AnalyzedLocation, type: 'character' | 'location') => {
        setItemToUpdate({ id: item.id, type });
        attachImageInputRef.current?.click();
    };

    const handleFileAttached = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0] && itemToUpdate) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                if (itemToUpdate.type === 'character') {
                    setCharacters(chars => chars.map(c => c.id === itemToUpdate.id ? { ...c, imageUrl } : c));
                } else {
                    setLocations(locs => locs.map(l => l.id === itemToUpdate.id ? { ...l, imageUrl } : l));
                }
                setItemToUpdate(null);
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const handleAddNewItem = (e: React.FormEvent, name: string, description: string) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (isAddModalOpen === 'character') {
            const newCharacter: AnalyzedCharacter = {
                id: `c${characters.length + 1}-${Date.now()}`,
                name: name.trim(),
                description: description.trim() || 'No description provided.',
                imageUrl: null,
                generations: [],
                refinedGenerationUrls: [],
                identity: undefined,
            };
            setCharacters(prev => [...prev, newCharacter]);
        } else if (isAddModalOpen === 'location') {
             const newLocation: AnalyzedLocation = {
                id: `l${locations.length + 1}-${Date.now()}`,
                name: name.trim(),
                description: description.trim() || 'No description provided.',
                imageUrl: null,
                generations: [],
                refinedGenerationUrls: [],
            };
            setLocations(prev => [...prev, newLocation]);
        }
        setIsAddModalOpen(null);
    };

    const handleDeleteItem = (id: string, type: 'character' | 'location') => {
        if (type === 'character') {
            setCharacters(prev => prev.filter(c => c.id !== id));
        } else {
            setLocations(prev => prev.filter(l => l.id !== id));
        }
    };

    const handleIdentitySuccess = (characterId: string, identity: CharacterIdentity) => {
        setCharacters(prev => prev.map(c => c.id === characterId ? { ...c, identity } : c));
        setIdentityModalCharacter(null);
        setIdentityModalLoraImages([]);
    };

    // Render modal BEFORE early return to ensure it shows when needed
    const identityModal = identityModalCharacter && (
        <CharacterIdentityModal
            isOpen={true}
            characterId={identityModalCharacter.id}
            characterName={identityModalCharacter.name}
            initialImages={identityModalLoraImages}
            onClose={() => {
                setIdentityModalCharacter(null);
                setIdentityModalLoraImages([]);
            }}
            onSuccess={(identity) => handleIdentitySuccess(identityModalCharacter.id, identity)}
        />
    );

    if (selectedItem) {
        return <>
            {identityModal}
            <CastLocationGenerator
                item={selectedItem}
                onBack={() => setSelectedItem(null)}
                onUpdateItem={handleItemUpdateBatch}
                onPrepareIdentity={selectedItem.type === 'character' ? (loraImages?: string[]) => {
                    setIdentityModalCharacter(selectedItem.data as AnalyzedCharacter);
                    setIdentityModalLoraImages(loraImages || []);
                } : undefined}
                moodboard={moodboard}
                moodboardTemplates={moodboardTemplates}
                characters={characters}
                locations={locations}
                currentProject={null}
                user={null}
            />
        </>;
    }

    const { isDark } = useTheme();

    return (
        <div className="min-h-full">
            <div className="space-y-12 pb-20">
                <AddItemModal
                    isOpen={!!isAddModalOpen}
                    type={isAddModalOpen!}
                    onClose={() => setIsAddModalOpen(null)}
                    onSubmit={handleAddNewItem}
                />
                {identityModal}
                <input type="file" ref={attachImageInputRef} onChange={handleFileAttached} className="hidden" accept="image/*" />

                {/* Hero Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                >
                <div className="relative z-10">
                    <h2 className={`text-3xl font-bold mb-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        Cast & Locations
                    </h2>
                    <p className={`text-base max-w-2xl ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        Develop the visual identity for your characters and settings. Click any card to enter the Generation Studio and create stunning visuals.
                    </p>
                </div>
                {/* Decorative Gradient */}
                <div className={`absolute -top-8 -right-8 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
                    isDark ? 'bg-gradient-to-br from-teal-500 to-purple-500' : 'bg-gradient-to-br from-teal-400 to-purple-400'
                }`} />
            </motion.header>

            {/* Cast Section */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                            isDark
                                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                                : 'bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-200'
                        }`}>
                            <UsersIcon className={`w-6 h-6 ${
                                isDark ? 'text-purple-400' : 'text-purple-600'
                            }`} />
                        </div>
                        <div>
                            <h3 className={`text-2xl font-bold ${
                                isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                                Cast
                            </h3>
                            <p className={`text-sm ${
                                isDark ? 'text-gray-500' : 'text-gray-600'
                            }`}>
                                {characters.length} {characters.length === 1 ? 'character' : 'characters'}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsAddModalOpen('character')}
                        variant="secondary"
                        className="!py-2.5 !px-5 !rounded-xl !font-semibold"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Character</span>
                    </Button>
                </div>
                {characters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {characters.map((char, index) => (
                            <motion.div
                                key={char.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card
                                    item={char}
                                    icon={<UsersIcon className="w-12 h-12" />}
                                    onClick={() => setSelectedItem({ type: 'character', data: char })}
                                    onAttach={() => handleAttachClick(char, 'character')}
                                    onDelete={() => handleDeleteItem(char.id, 'character')}
                                    onPrepareIdentity={() => setIdentityModalCharacter(char)}
                                />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`flex flex-col items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed ${
                            isDark ? 'border-gray-800 bg-gray-900/20' : 'border-gray-300 bg-gray-50'
                        }`}
                    >
                        <UsersIcon className={`w-16 h-16 mb-4 ${
                            isDark ? 'text-gray-700' : 'text-gray-400'
                        }`} />
                        <p className={`text-lg font-semibold mb-2 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            No characters yet
                        </p>
                        <p className={`text-sm mb-6 ${
                            isDark ? 'text-gray-600' : 'text-gray-500'
                        }`}>
                            Add your first character to get started
                        </p>
                        <Button
                            onClick={() => setIsAddModalOpen('character')}
                            variant="primary"
                            className="!py-2.5 !px-6"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Add Character</span>
                        </Button>
                    </motion.div>
                )}
            </motion.section>

            {/* Locations Section */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                            isDark
                                ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30'
                                : 'bg-gradient-to-br from-teal-100 to-cyan-100 border border-teal-200'
                        }`}>
                            <MapPinIcon className={`w-6 h-6 ${
                                isDark ? 'text-teal-400' : 'text-teal-600'
                            }`} />
                        </div>
                        <div>
                            <h3 className={`text-2xl font-bold ${
                                isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                                Locations
                            </h3>
                            <p className={`text-sm ${
                                isDark ? 'text-gray-500' : 'text-gray-600'
                            }`}>
                                {locations.length} {locations.length === 1 ? 'location' : 'locations'}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsAddModalOpen('location')}
                        variant="secondary"
                        className="!py-2.5 !px-5 !rounded-xl !font-semibold"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Location</span>
                    </Button>
                </div>
                {locations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {locations.map((loc, index) => (
                            <motion.div
                                key={loc.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card
                                    item={loc}
                                    icon={<MapPinIcon className="w-12 h-12" />}
                                    onClick={() => setSelectedItem({ type: 'location', data: loc })}
                                    onAttach={() => handleAttachClick(loc, 'location')}
                                    onDelete={() => handleDeleteItem(loc.id, 'location')}
                                />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`flex flex-col items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed ${
                            isDark ? 'border-gray-800 bg-gray-900/20' : 'border-gray-300 bg-gray-50'
                        }`}
                    >
                        <MapPinIcon className={`w-16 h-16 mb-4 ${
                            isDark ? 'text-gray-700' : 'text-gray-400'
                        }`} />
                        <p className={`text-lg font-semibold mb-2 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            No locations yet
                        </p>
                        <p className={`text-sm mb-6 ${
                            isDark ? 'text-gray-600' : 'text-gray-500'
                        }`}>
                            Add your first location to get started
                        </p>
                        <Button
                            onClick={() => setIsAddModalOpen('location')}
                            variant="primary"
                            className="!py-2.5 !px-6"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Add Location</span>
                        </Button>
                    </motion.div>
                )}
            </motion.section>
            </div>
        </div>
    );
};

export default CastLocationsTab;
