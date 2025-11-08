import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

interface ImageCarouselProps {
  images: Array<{
    url: string;
    title?: string;
    prompt?: string;
  }>;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
  enableKeyboard?: boolean;
  aspectRatio?: string;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  currentIndex: controlledIndex,
  onIndexChange,
  className = '',
  showArrows = true,
  showDots = true,
  enableKeyboard = true,
  aspectRatio = '16/9',
}) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const currentIndex = controlledIndex ?? internalIndex;
  const isControlled = controlledIndex !== undefined;

  const handleIndexChange = useCallback((newIndex: number) => {
    const safeIndex = Math.max(0, Math.min(newIndex, images.length - 1));
    if (!isControlled) {
      setInternalIndex(safeIndex);
    }
    onIndexChange?.(safeIndex);
  }, [images.length, isControlled, onIndexChange]);

  const goToPrevious = useCallback(() => {
    handleIndexChange(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  }, [currentIndex, images.length, handleIndexChange]);

  const goToNext = useCallback(() => {
    handleIndexChange(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, images.length, handleIndexChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboard || images.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys when not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard, goToPrevious, goToNext, images.length]);

  if (!images || images.length === 0) {
    return (
      <div className={`relative bg-black/20 rounded-lg ${className}`} style={{ aspectRatio }}>
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          No images available
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    // Single image - no carousel needed
    return (
      <div className={`relative bg-black/20 rounded-lg overflow-hidden ${className}`} style={{ aspectRatio }}>
        <img
          src={images[0].url}
          alt={images[0].title || 'Image'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const currentImage = images[currentIndex] || images[0];

  return (
    <div className={`relative bg-black/20 rounded-lg overflow-hidden group ${className}`} style={{ aspectRatio }}>
      {/* Main Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={currentImage.url}
          alt={currentImage.title || `Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />
      </AnimatePresence>

      {/* Arrow Navigation */}
      {showArrows && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
            aria-label="Next image"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => handleIndexChange(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Image Title */}
      {currentImage.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white text-sm font-medium">{currentImage.title}</p>
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;