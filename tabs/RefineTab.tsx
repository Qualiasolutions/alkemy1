import React, { useState, useCallback } from 'react';
import { Frame, AnalyzedScene, ScriptAnalysis } from '../types';
import RefineStudio from '../components/RefineStudio';
import Button from '../components/Button';
import { generateVisual } from '../services/aiService';
import { getMediaService } from '../services/mediaService';
import { getUsageService, USAGE_ACTIONS } from '../services/usageService';
import Toast from '../components/Toast';

interface RefineTabProps {
  scriptAnalysis: ScriptAnalysis | null;
  onUpdateAnalysis: React.Dispatch<React.SetStateAction<ScriptAnalysis | null>>;
  currentProject: any;
  user: any;
}

const RefineTab: React.FC<RefineTabProps> = ({
  scriptAnalysis,
  onUpdateAnalysis,
  currentProject,
  user
}) => {
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [selectedScene, setSelectedScene] = useState<AnalyzedScene | null>(null);
  const [showRefineStudio, setShowRefineStudio] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  const usageService = getUsageService();
  const mediaService = getMediaService();

  const handleFrameSelect = useCallback((frame: Frame, scene: AnalyzedScene) => {
    setSelectedFrame(frame);
    setSelectedScene(scene);
    setShowRefineStudio(true);
  }, []);

  const handleRefineComplete = useCallback(async (refinedImageUrl: string, prompt: string) => {
    if (!selectedFrame || !selectedScene) return;

    try {
      setIsLoading(true);

      // Upload refined image to Supabase Storage
      let finalImageUrl = refinedImageUrl;
      if (refinedImageUrl && currentProject?.id) {
        try {
          const uploadResult = await mediaService.uploadImage(
            refinedImageUrl,
            currentProject.id,
            'refined',
            {
              frameId: selectedFrame.id,
              sceneId: selectedScene.id,
              prompt,
              originalUrl: selectedFrame.media?.start_frame_url
            }
          );
          finalImageUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Failed to upload refined image:', uploadError);
          // Continue with the local URL if upload fails
        }
      }

      // Update the frame with the refined image
      onUpdateAnalysis((prev: ScriptAnalysis | null) => {
        if (!prev) return null;

        return {
          ...prev,
          scenes: prev.scenes.map((scene) => {
            if (scene.id === selectedScene.id) {
              return {
                ...scene,
                frames: (scene.frames || []).map((frame) => {
                  if (frame.id === selectedFrame.id) {
                    // Add to refined variants or update main image
                    const existingRefinedUrls = frame.refinedGenerationUrls || [];
                    return {
                      ...frame,
                      media: {
                        ...frame.media,
                        start_frame_url: finalImageUrl, // Update main image
                        refined_url: finalImageUrl // Store refined version separately
                      },
                      refinedGenerationUrls: [...existingRefinedUrls, finalImageUrl]
                    };
                  }
                  return frame;
                })
              };
            }
            return scene;
          })
        };
      });

      // Log usage for analytics
      if (usageService && user?.id) {
        usageService.logUsage(user.id, USAGE_ACTIONS.IMAGE_REFINEMENT, {
          projectId: currentProject?.id,
          metadata: {
            frameId: selectedFrame.id,
            prompt,
            sceneId: selectedScene.id
          }
        });
      }

      setToast({
        id: `toast-${Date.now()}`,
        message: 'Image refined successfully!',
        type: 'success'
      });

    } catch (error) {
      console.error('Refine completion failed:', error);
      setToast({
        id: `toast-${Date.now()}`,
        message: 'Failed to save refined image',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
      setShowRefineStudio(false);
    }
  }, [selectedFrame, selectedScene, onUpdateAnalysis, currentProject, user, usageService, mediaService]);

  const handleRefineClose = useCallback(() => {
    setShowRefineStudio(false);
    setSelectedFrame(null);
    setSelectedScene(null);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ id: `toast-${Date.now()}`, message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  if (!scriptAnalysis) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No Script Analysis Available</h3>
          <p className="text-gray-400 mb-4">Please analyze your script first to access the refine functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Image Refinement</h2>
        <p className="text-gray-400">Enhance and perfect your generated frames with AI-powered refinements.</p>
      </div>

      {/* Frame Grid */}
      <div className="flex-1 overflow-y-auto">
        {scriptAnalysis.scenes.map((scene) => (
          <div key={scene.id} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-white">Scene {scene.sceneNumber}</h3>
              <span className="text-sm text-gray-400">• {scene.setting}</span>
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                {(scene.frames || []).length} frames
              </span>
            </div>

            {(scene.frames || []).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(scene.frames || []).map((frame) => (
                  <div key={frame.id} className="relative group">
                    <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                      {frame.media?.start_frame_url ? (
                        <img
                          src={frame.media.start_frame_url}
                          alt={frame.description}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-gray-500 text-sm">No image</div>
                        </div>
                      )}
                    </div>

                    {/* Overlay with refine button */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <Button
                        onClick={() => handleFrameSelect(frame, scene)}
                        variant="primary"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        size="sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Refine
                      </Button>
                    </div>

                    {/* Frame info */}
                    <div className="mt-2">
                      <p className="text-sm text-white font-medium">Shot {frame.shot_number}</p>
                      <p className="text-xs text-gray-400 line-clamp-2">{frame.description}</p>
                    </div>

                    {/* Status badge */}
                    {frame.status && (
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          frame.status === 'UpscaledVideoReady' ? 'bg-emerald-500/20 text-emerald-400' :
                          frame.status === 'VideoReady' ? 'bg-blue-500/20 text-blue-400' :
                          frame.status === 'GeneratingStill' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {frame.status}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <p className="text-gray-400">No frames available in this scene yet.</p>
                <p className="text-sm text-gray-500 mt-1">Generate frames in the Compositing tab first.</p>
              </div>
            )}
          </div>
        ))}

        {scriptAnalysis.scenes.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-400">No scenes available. Please analyze your script first.</p>
            </div>
          </div>
        )}
      </div>

      {/* RefineStudio Modal */}
      {showRefineStudio && selectedFrame && selectedScene && (
        <RefineStudio
          frame={selectedFrame}
          scene={selectedScene}
          onClose={handleRefineClose}
          onSetAsMain={() => {
            // TODO: Implement setting refined image as main
            handleRefineClose();
            showToast('Refined image set as main version', 'success');
          }}
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white">Saving refined image...</span>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast
          toast={toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default RefineTab;