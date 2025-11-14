import React, { useState, useCallback } from 'react';
import { ChevronLeftIcon, CheckIcon } from './icons/Icons';
import Button from './Button';
import { Frame } from '../types';

interface RefineStudioProps {
  frame?: Frame | null;
  scene?: any;
  onClose?: () => void;
  onSetAsMain?: () => void;
}

const RefineStudio: React.FC<RefineStudioProps> = ({
  frame,
  scene,
  onClose,
  onSetAsMain
}) => {
  const [prompt, setPrompt] = useState('');
  const [imageVersions, setImageVersions] = useState<{id: number, prompt: string, image: string, isLoading?: boolean}[]>([
    { id: 0, prompt: 'Initial', image: frame?.media?.start_frame_url || '/placeholder.svg?height=900&width=1000' }
  ]);
  const [currentImageId, setCurrentImageId] = useState(0);

  const handleRefine = useCallback(async () => {
    if (prompt.trim() && frame?.media?.start_frame_url) {
      // Create a loading state first
      const loadingVersion = {
        id: imageVersions.length,
        prompt: prompt,
        image: '/placeholder.svg?height=900&width=1000',
        isLoading: true
      };
      setImageVersions(prev => [...prev, loadingVersion]);

      try {
        // Import AI service dynamically to avoid circular imports
        const { refineVariant } = await import('../services/aiService');

        // Call the AI service for actual image refinement using the existing refineVariant function
        const refinedImageUrl = await refineVariant(
          prompt, // Refinement prompt
          frame.media.start_frame_url, // Base image to refine
          '16:9', // Aspect ratio
          {
            projectId: scene?.id ? `scene-${scene.id}` : undefined,
            sceneId: scene?.id,
            frameId: frame?.id
          }
        );

        if (refinedImageUrl) {
          const refinedVersion = {
            id: imageVersions.length,
            prompt: prompt,
            image: refinedImageUrl
          };

          setImageVersions(prev =>
            prev.map(v => v.id === loadingVersion.id ? refinedVersion : v)
          );
          setCurrentImageId(loadingVersion.id);
        } else {
          throw new Error('No refined image returned from AI service');
        }
      } catch (error) {
        console.error('Refinement failed:', error);
        // Remove loading version on error
        setImageVersions(prev => prev.filter(v => v.id !== loadingVersion.id));

        // Show error message
        alert('Refinement failed: ' + (error instanceof Error ? error.message : 'Unknown error') + '. Please try again with a different prompt.');
      }

      setPrompt('');
    }
  }, [prompt, imageVersions.length, frame, scene]);

  const currentImage = imageVersions.find(v => v.id === currentImageId);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
      <div className="w-full h-full max-w-7xl max-h-screen bg-[var(--color-background-primary)] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--color-surface-card)] border-b border-[var(--color-border-color)]">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <ChevronLeftIcon size={24} />
            </button>
            <div>
              <h1 className="text-[var(--color-text-primary)] font-semibold">Refine Studio</h1>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {frame?.description || 'Frame refinement'} •
                {scene?.setting || 'Scene'} •
                {imageVersions.length} versions
              </p>
            </div>
          </div>
          <Button
            onClick={onSetAsMain}
            variant="primary"
            className="rounded-full px-6"
          >
            <CheckIcon size={16} className="mr-2" />
            Set as Main & Close
          </Button>
        </div>

        {/* Main Container */}
        <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
          <div className="m-4 border-2 border-emerald-400 rounded-2xl bg-[var(--color-surface-card)] overflow-hidden flex flex-col flex-1">

            {/* Top Section: Left Prompt + Right Image */}
            <div className="flex flex-1 overflow-hidden min-h-0">
              {/* Left Side - Prompt Refinement Window */}
              <div className="w-72 bg-[var(--color-background-secondary)] border-r border-[var(--color-border-color)] flex flex-col p-6 overflow-y-auto">
                <h2 className="text-[var(--color-text-primary)] font-semibold mb-4">Refine Prompt</h2>

                {/* Prompt Input */}
                <div className="mb-6 flex-shrink-0">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter refinement prompt..."
                    className="w-full h-24 bg-[var(--color-surface-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-[var(--color-border-color)]"
                  />
                  <Button
                    onClick={handleRefine}
                    variant="primary"
                    className="w-full mt-3"
                    disabled={!prompt.trim()}
                  >
                    Apply Refinement
                  </Button>
                </div>

                {/* Applied Refinements List */}
                {imageVersions.length > 1 && (
                  <div>
                    <h3 className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wide mb-3">Applied Refinements</h3>
                    <div className="space-y-2">
                      {imageVersions.slice(1).map((version) => (
                        <button
                          key={version.id}
                          onClick={() => setCurrentImageId(version.id)}
                          className={`w-full text-left p-2 rounded-lg text-xs transition ${
                            currentImageId === version.id
                              ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/40'
                              : 'bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover-background)] border border-[var(--color-border-color)]'
                          }`}
                        >
                          {version.isLoading ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mr-2" />
                              Processing...
                            </div>
                          ) : (
                            <>
                              {version.prompt.substring(0, 40)}
                              {version.prompt.length > 40 ? '...' : ''}
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - Current Image Display */}
              <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[var(--color-background-secondary)] to-[var(--color-surface-card)] p-4 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  {currentImage && (
                    <div className="relative w-full h-full bg-[var(--color-surface-card)] rounded-lg overflow-hidden flex items-center justify-center">
                      {currentImage.isLoading ? (
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
                          <p className="text-[var(--color-text-secondary)]">Refining image...</p>
                        </div>
                      ) : (
                        <img
                          src={currentImage.image}
                          alt="Current version"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Section - Version History Blocks */}
            {imageVersions.length > 1 && (
              <div className="border-t border-[var(--color-border-color)] bg-[var(--color-surface-card)] p-4 flex gap-3 overflow-x-auto">
                <h3 className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wide whitespace-nowrap self-center mr-2">Versions:</h3>
                {imageVersions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => setCurrentImageId(version.id)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                      currentImageId === version.id
                        ? 'border-emerald-400'
                        : 'border-[var(--color-border-color)] hover:border-[var(--color-hover-background)]'
                    }`}
                  >
                    {version.isLoading ? (
                      <div className="w-full h-full bg-[var(--color-surface-card)] flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <img
                        src={version.image}
                        alt={`Version ${version.id}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefineStudio;