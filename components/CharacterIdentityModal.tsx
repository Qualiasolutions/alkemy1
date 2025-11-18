/**
 * Character Identity Preparation Modal
 *
 * Epic 2 - Story 2.1: Character Identity Training/Preparation Workflow
 * AC1: Character Reference Upload Interface
 * AC2: Character Identity Processing Workflow
 * AC3: Character Identity Status Indicators
 * AC4: Error Handling and Validation
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, UploadIcon, Trash2Icon, CheckCircleIcon, AlertCircleIcon } from './icons/Icons';
import Button from './Button';
import { useTheme } from '@/theme/ThemeContext';
import { prepareCharacterIdentity, type CharacterIdentityError } from '@/services/characterIdentityService';
import type { CharacterIdentity } from '@/types';

interface CharacterIdentityModalProps {
    isOpen: boolean;
    characterId: string;
    characterName: string;
    initialImages?: string[];
    onClose: () => void;
    onSuccess: (identity: CharacterIdentity) => void;
}

interface UploadedImage {
    id: string;
    file: File;
    preview: string;
    resolution?: { width: number; height: number };
    isValid: boolean;
    error?: string;
}

const CharacterIdentityModal: React.FC<CharacterIdentityModalProps> = ({
    isOpen,
    characterId,
    characterName,
    initialImages = [],
    onClose,
    onSuccess,
}) => {
    const { isDark } = useTheme();
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Convert initial images from URLs to UploadedImage objects
    useEffect(() => {
        const loadInitialImages = async () => {
            if (initialImages.length === 0) return;

            const loadedImages: UploadedImage[] = [];

            for (let i = 0; i < initialImages.length; i++) {
                const url = initialImages[i];
                try {
                    // Convert data URL to blob then to file
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const file = new File([blob], `lora-image-${i + 1}.png`, { type: blob.type || 'image/png' });

                    // Get image dimensions
                    const img = new Image();
                    img.src = url;
                    await new Promise((resolve) => { img.onload = resolve; });

                    loadedImages.push({
                        id: `initial-${i}`,
                        file,
                        preview: url,
                        resolution: { width: img.width, height: img.height },
                        isValid: img.width >= 512 && img.height >= 512,
                        error: img.width < 512 || img.height < 512 ? 'Low resolution' : undefined
                    });
                } catch (error) {
                    console.error('Failed to load initial image:', error);
                }
            }

            setImages(loadedImages);
        };

        if (isOpen && initialImages.length > 0) {
            loadInitialImages();
        }
    }, [isOpen, initialImages]);

    // Reset state when modal opens (without initial images)
    useEffect(() => {
        if (isOpen && initialImages.length === 0) {
            setImages([]);
            setIsProcessing(false);
            setProgress(0);
            setStatusMessage('');
            setError(null);
        }
    }, [isOpen, initialImages.length]);

    const validateImageFile = async (file: File): Promise<{ isValid: boolean; error?: string; resolution?: { width: number; height: number } }> => {
        // Check file type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            return { isValid: false, error: 'Only JPEG, PNG, and WebP formats are supported' };
        }

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return { isValid: false, error: `File size exceeds 10MB (${(file.size / 1024 / 1024).toFixed(2)}MB)` };
        }

        // Check image resolution
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                const resolution = { width: img.width, height: img.height };

                if (img.width < 512 || img.height < 512) {
                    resolve({
                        isValid: false,
                        error: `Low resolution (${img.width}x${img.height}px). Use images >512x512px for best results`,
                        resolution
                    });
                } else {
                    resolve({ isValid: true, resolution });
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve({ isValid: false, error: 'Failed to load image' });
            };

            img.src = url;
        });
    };

    const handleFilesAdded = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files);

        // Check if adding these files would exceed the 12-image limit
        if (images.length + fileArray.length > 12) {
            setError(`Maximum 12 images allowed. You can add ${12 - images.length} more image(s).`);
            return;
        }

        const newImages: UploadedImage[] = [];

        for (const file of fileArray) {
            const validation = await validateImageFile(file);
            const preview = URL.createObjectURL(file);

            newImages.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                preview,
                resolution: validation.resolution,
                isValid: validation.isValid,
                error: validation.error,
            });
        }

        setImages(prev => [...prev, ...newImages]);
        setError(null);
    }, [images.length]);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFilesAdded(e.target.files);
        }
        // Reset input value to allow re-uploading the same file
        if (e.target) e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files) {
            handleFilesAdded(e.dataTransfer.files);
        }
    };

    const handleRemoveImage = (id: string) => {
        setImages(prev => {
            const updated = prev.filter(img => img.id !== id);
            // Revoke object URL to prevent memory leaks
            const removed = prev.find(img => img.id === id);
            if (removed) {
                URL.revokeObjectURL(removed.preview);
            }
            return updated;
        });
        setError(null);
    };

    const handlePrepareIdentity = async () => {
        // Validation
        if (images.length < 6) {
            setError(`At least 6 reference images are required for optimal training. You have ${images.length}. Upload ${6 - images.length} more.`);
            return;
        }

        const invalidImages = images.filter(img => !img.isValid);
        if (invalidImages.length > 0) {
            setError(`${invalidImages.length} image(s) have validation errors. Please remove or replace them.`);
            return;
        }

        setIsProcessing(true);
        setError(null);
        setProgress(0);
        setStatusMessage('Starting...');

        try {
            const identity = await prepareCharacterIdentity({
                characterId,
                referenceImages: images.map(img => img.file),
                onProgress: (progress, status) => {
                    setProgress(progress);
                    setStatusMessage(status);
                },
            });

            if (identity.status === 'error') {
                throw new Error(identity.errorMessage || 'Character identity preparation failed');
            }

            // Success!
            setStatusMessage('Character identity ready!');
            setTimeout(() => {
                onSuccess(identity);
                onClose();
            }, 1000);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            setStatusMessage('');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        if (isProcessing) {
            // Prevent closing during processing
            return;
        }

        // Clean up object URLs
        images.forEach(img => URL.revokeObjectURL(img.preview));
        onClose();
    };

    if (!isOpen) return null;

    const validImageCount = images.filter(img => img.isValid).length;
    const canProceed = validImageCount >= 6 && validImageCount <= 12 && !isProcessing;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="character-identity-modal-title"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 20 }}
                className={`w-full max-w-3xl rounded-2xl border overflow-hidden ${
                    isDark
                        ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border-gray-800'
                        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                }`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-6 py-5 border-b flex justify-between items-center ${
                    isDark ? 'border-gray-800' : 'border-gray-200'
                }`}>
                    <div>
                        <h3 id="character-identity-modal-title" className={`text-xl font-bold ${
                            isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                            Prepare Character Identity
                        </h3>
                        <p className={`text-sm mt-1 ${
                            isDark ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                            {characterName} • Upload 6-12 reference images
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isProcessing}
                        aria-label="Close modal"
                        className={`p-2 rounded-lg transition-colors ${
                            isProcessing
                                ? 'opacity-50 cursor-not-allowed'
                                : isDark
                                    ? 'hover:bg-gray-800 text-gray-400'
                                    : 'hover:bg-gray-100 text-gray-600'
                        }`}
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Upload Area */}
                    <div>
                        <label className={`block text-sm font-semibold mb-3 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            Reference Images ({images.length}/12)
                        </label>

                        {/* Drag-Drop Zone */}
                        {images.length < 12 && (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                role="button"
                                tabIndex={0}
                                aria-label="Upload reference images by clicking or dragging files here"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        fileInputRef.current?.click();
                                    }
                                }}
                                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                    isDragging
                                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                                        : isDark
                                            ? 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                                            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                                }`}
                            >
                                <UploadIcon className={`w-12 h-12 mx-auto mb-3 ${
                                    isDragging ? 'text-[var(--color-accent-primary)]' : isDark ? 'text-gray-600' : 'text-gray-400'
                                }`} />
                                <p className={`font-semibold mb-1 ${
                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Drop images here or click to browse
                                </p>
                                <p className={`text-xs ${
                                    isDark ? 'text-gray-500' : 'text-gray-600'
                                }`}>
                                    JPEG, PNG, WebP • Max 10MB • Min 512x512px
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                    aria-label="Select reference images to upload"
                                />
                            </div>
                        )}

                        {/* Image Preview Grid */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-5 gap-3 mt-4">
                                {images.map((img, index) => (
                                    <motion.div
                                        key={img.id}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`relative group rounded-lg overflow-hidden aspect-square border-2 ${
                                            img.isValid
                                                ? 'border-green-500/30'
                                                : 'border-red-500/50'
                                        }`}
                                    >
                                        <img
                                            src={img.preview}
                                            alt={`Reference ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Status Indicator */}
                                        <div className={`absolute top-1 left-1 p-1 rounded-full ${
                                            img.isValid
                                                ? 'bg-green-500/90'
                                                : 'bg-red-500/90'
                                        }`}>
                                            {img.isValid ? (
                                                <CheckCircleIcon className="w-3 h-3 text-white" />
                                            ) : (
                                                <AlertCircleIcon className="w-3 h-3 text-white" />
                                            )}
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => handleRemoveImage(img.id)}
                                            disabled={isProcessing}
                                            aria-label={`Remove reference image ${index + 1}`}
                                            className="absolute top-1 right-1 p-1 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 disabled:opacity-50"
                                        >
                                            <Trash2Icon className="w-3 h-3 text-white" />
                                        </button>

                                        {/* Resolution Badge */}
                                        {img.resolution && (
                                            <div className="absolute bottom-1 left-1 right-1 text-[9px] font-mono bg-black/70 text-white px-1 py-0.5 rounded text-center">
                                                {img.resolution.width}×{img.resolution.height}
                                            </div>
                                        )}

                                        {/* Error Tooltip */}
                                        {!img.isValid && img.error && (
                                            <div className="absolute inset-0 bg-red-500/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                                <p className="text-[9px] text-white text-center leading-tight">
                                                    {img.error}
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Info Box */}
                        <div className={`mt-4 p-3 rounded-lg text-xs ${
                            isDark ? 'bg-[var(--color-accent-primary)]/10 border border-[var(--color-accent-primary)]/20' : 'bg-[var(--color-accent-primary)]/20 border border-[var(--color-accent-primary)]/30'
                        }`}>
                            <p className={`font-semibold mb-1 ${isDark ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-accent-primary)]'}`}>
                                💡 Tips for best results:
                            </p>
                            <ul className={`space-y-0.5 ml-4 list-disc ${isDark ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-accent-primary)]'}`}>
                                <li>Use different angles (front, profile, 3/4 view)</li>
                                <li>Include varied expressions and lighting</li>
                                <li>Use high-quality, well-lit photos</li>
                            </ul>
                        </div>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2"
                            >
                                <AlertCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-500 flex-1">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Processing Status */}
                    {isProcessing && (
                        <div className="space-y-3" role="status" aria-live="polite" aria-atomic="true">
                            <div className="flex justify-between items-center">
                                <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {statusMessage}
                                </span>
                                <span className={`text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            <div className={`w-full h-2 rounded-full overflow-hidden ${
                                isDark ? 'bg-gray-800' : 'bg-gray-200'
                            }`} role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Character identity preparation progress">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t flex justify-between items-center ${
                    isDark ? 'border-gray-800 bg-gray-900/30' : 'border-gray-200 bg-gray-50'
                }`}>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        {validImageCount >= 6 && validImageCount <= 12 ? (
                            <span className="text-green-500 font-semibold">✓ Ready to proceed</span>
                        ) : validImageCount > 12 ? (
                            <span className="text-red-500">Remove {validImageCount - 12} image(s)</span>
                        ) : (
                            `Need ${Math.max(0, 6 - validImageCount)} more valid image(s)`
                        )}
                    </p>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClose}
                            disabled={isProcessing}
                            className="!px-6 !py-2.5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handlePrepareIdentity}
                            disabled={!canProceed}
                            isLoading={isProcessing}
                            className="!px-6 !py-2.5"
                        >
                            {isProcessing ? 'Preparing...' : 'Prepare Identity'}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CharacterIdentityModal;
