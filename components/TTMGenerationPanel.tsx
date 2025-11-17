/**
 * TTM Generation Panel Component
 * UI for configuring and launching TTM video generation
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Settings,
  Sparkles,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
  Download,
  Share2
} from 'lucide-react';

import MotionTrajectoryEditor from './MotionTrajectoryEditor';
import {
  MotionType,
  CameraMovementType,
  generateTTMVideo,
  createLinearTrajectory,
  createCircularTrajectory,
  createDollyZoom,
  createOrbitMovement,
  checkTTMStatus,
  TTMResponse,
  Point2D,
  CameraMovement
} from '../services/ttmService';

interface TTMGenerationPanelProps {
  imageUrl: string;
  onVideoGenerated?: (videoUrl: string, thumbnailUrl: string) => void;
  frameId?: string;
  projectId?: string;
  className?: string;
}

interface GenerationPreset {
  name: string;
  motionType: MotionType;
  description: string;
  icon: React.ReactNode;
  getPrompt: (frameDescription?: string) => string;
  getMotion: () => {
    trajectory?: Point2D[];
    cameraMovement?: CameraMovement;
  };
}

export default function TTMGenerationPanel({
  imageUrl,
  onVideoGenerated,
  frameId,
  projectId,
  className = ''
}: TTMGenerationPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationResult, setGenerationResult] = useState<TTMResponse | null>(null);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  const [error, setError] = useState<string | null>(null);
  const [isTTMAvailable, setIsTTMAvailable] = useState(false);
  const [showTrajectory, setShowTrajectory] = useState(false);

  // Generation parameters
  const [motionType, setMotionType] = useState<MotionType>(MotionType.OBJECT);
  const [prompt, setPrompt] = useState('');
  const [trajectory, setTrajectory] = useState<Point2D[]>([]);
  const [cameraMovement, setCameraMovement] = useState<CameraMovement | undefined>();

  // Advanced parameters
  const [tweakIndex, setTweakIndex] = useState(3);
  const [tstrongIndex, setTstrongIndex] = useState(7);
  const [numFrames, setNumFrames] = useState(81);
  const [guidanceScale, setGuidanceScale] = useState(3.5);
  const [seed, setSeed] = useState<number | undefined>();

  // Check TTM availability on mount
  useEffect(() => {
    checkTTMStatus().then(setIsTTMAvailable);
  }, []);

  // Motion presets
  const motionPresets: GenerationPreset[] = [
    {
      name: 'linear',
      motionType: MotionType.OBJECT,
      description: 'Linear object movement',
      icon: <ChevronRight className="w-4 h-4" />,
      getPrompt: (desc) => `${desc} moving in a straight line`,
      getMotion: () => ({
        trajectory: createLinearTrajectory(
          { x: 0.2, y: 0.5 },
          { x: 0.8, y: 0.5 },
          numFrames
        )
      })
    },
    {
      name: 'circular',
      motionType: MotionType.OBJECT,
      description: 'Circular object motion',
      icon: <Sparkles className="w-4 h-4" />,
      getPrompt: (desc) => `${desc} moving in a circular path`,
      getMotion: () => ({
        trajectory: createCircularTrajectory(
          { x: 0.5, y: 0.5 },
          0.3,
          numFrames
        )
      })
    },
    {
      name: 'pan',
      motionType: MotionType.CAMERA,
      description: 'Camera pan across scene',
      icon: <ChevronRight className="w-4 h-4" />,
      getPrompt: (desc) => `Camera panning across ${desc}`,
      getMotion: () => ({
        cameraMovement: {
          type: CameraMovementType.PAN,
          params: { dx: 0.3, dy: 0 }
        }
      })
    },
    {
      name: 'dolly-zoom',
      motionType: MotionType.CAMERA,
      description: 'Dolly zoom effect',
      icon: <Zap className="w-4 h-4" />,
      getPrompt: (desc) => `${desc} with dramatic zoom`,
      getMotion: () => createDollyZoom(1.5, 0.3)
    },
    {
      name: 'orbit',
      motionType: MotionType.CAMERA,
      description: 'Camera orbit around subject',
      icon: <Sparkles className="w-4 h-4" />,
      getPrompt: (desc) => `Camera orbiting around ${desc}`,
      getMotion: () => createOrbitMovement(45, 0)
    }
  ];

  const handlePresetSelect = (presetName: string) => {
    const preset = motionPresets.find(p => p.name === presetName);
    if (!preset) return;

    setSelectedPreset(presetName);
    setMotionType(preset.motionType);
    const motion = preset.getMotion();

    if (motion.trajectory) {
      setTrajectory(motion.trajectory);
      setCameraMovement(undefined);
    } else if (motion.cameraMovement) {
      setCameraMovement(motion.cameraMovement);
      setTrajectory([]);
    }

    // Generate default prompt if empty
    if (!prompt) {
      setPrompt(preset.getPrompt('the scene'));
    }
  };

  const handleGenerate = async () => {
    if (!isTTMAvailable) {
      setError('TTM service is not available. Please check your connection.');
      return;
    }

    if (motionType === MotionType.OBJECT && trajectory.length === 0) {
      setError('Please draw a motion trajectory or select a preset.');
      return;
    }

    if (motionType === MotionType.CAMERA && !cameraMovement && !trajectory) {
      setError('Please specify camera movement parameters.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setGenerationResult(null);

    try {
      const response = await generateTTMVideo(
        imageUrl,
        {
          motionType,
          prompt,
          trajectory: motionType === MotionType.OBJECT ? trajectory : undefined,
          cameraMovement: motionType === MotionType.CAMERA ? cameraMovement : undefined,
          tweakIndex: isAdvancedMode ? tweakIndex : undefined,
          tstrongIndex: isAdvancedMode ? tstrongIndex : undefined,
          numFrames,
          guidanceScale,
          seed,
          projectId
        },
        setGenerationProgress
      );

      setGenerationResult(response);

      if (response.status === 'completed' && response.videoUrl) {
        onVideoGenerated?.(response.videoUrl, response.thumbnailUrl || imageUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">TTM Motion Control</h3>
            <p className="text-sm text-gray-400">Generate precise motion from still images</p>
          </div>
        </div>

        {/* Service Status */}
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
          isTTMAvailable ? 'bg-green-600/20' : 'bg-red-600/20'
        }`}>
          {isTTMAvailable ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">TTM Active</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">TTM Offline</span>
            </>
          )}
        </div>
      </div>

      {!isTTMAvailable && (
        <div className="mb-4 p-3 bg-lime-600/20 border border-lime-600/30 rounded-lg">
          <p className="text-sm text-lime-400">
            TTM service is not available. Please ensure the TTM API server is running at the configured URL.
          </p>
        </div>
      )}

      {/* Preset Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">Quick Presets</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {motionPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset.name)}
              className={`p-3 rounded-lg border transition-all ${
                selectedPreset === preset.name
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                  : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                {preset.icon}
                <span className="text-xs">{preset.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trajectory Editor */}
      <AnimatePresence>
        {showTrajectory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <MotionTrajectoryEditor
              imageUrl={imageUrl}
              motionType={motionType}
              onTrajectoryComplete={setTrajectory}
              onCameraMovementComplete={setCameraMovement}
              className="mb-4"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="space-y-4">
        {/* Motion Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Motion Type</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setMotionType(MotionType.OBJECT)}
              className={`px-4 py-2 rounded-lg flex-1 ${
                motionType === MotionType.OBJECT
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              Object Motion
            </button>
            <button
              onClick={() => setMotionType(MotionType.CAMERA)}
              className={`px-4 py-2 rounded-lg flex-1 ${
                motionType === MotionType.CAMERA
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              Camera Motion
            </button>
          </div>
        </div>

        {/* Show Trajectory Editor Button */}
        {!showTrajectory && (
          <button
            onClick={() => setShowTrajectory(true)}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center justify-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Open Motion Editor</span>
          </button>
        )}

        {/* Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Motion Description</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the desired motion..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none"
            rows={3}
          />
        </div>

        {/* Advanced Settings */}
        <div>
          <button
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${
                isAdvancedMode ? 'rotate-90' : ''
              }`}
            />
            <span className="text-sm">Advanced Settings</span>
          </button>

          <AnimatePresence>
            {isAdvancedMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Tweak Index</label>
                    <input
                      type="number"
                      value={tweakIndex}
                      onChange={(e) => setTweakIndex(parseInt(e.target.value) || 0)}
                      min="0"
                      max="50"
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">TStrong Index</label>
                    <input
                      type="number"
                      value={tstrongIndex}
                      onChange={(e) => setTstrongIndex(parseInt(e.target.value) || 0)}
                      min="0"
                      max="50"
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Frames</label>
                    <input
                      type="number"
                      value={numFrames}
                      onChange={(e) => setNumFrames(parseInt(e.target.value) || 81)}
                      min="16"
                      max="161"
                      step="16"
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Guidance</label>
                    <input
                      type="number"
                      value={guidanceScale}
                      onChange={(e) => setGuidanceScale(parseFloat(e.target.value) || 3.5)}
                      min="1"
                      max="10"
                      step="0.5"
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Seed (optional)</label>
                  <input
                    type="number"
                    value={seed || ''}
                    onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Random"
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-red-600/20 border border-red-600/30 rounded-lg"
          >
            <p className="text-sm text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generation Progress */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Generating...</span>
              <span className="text-sm text-gray-400">{Math.round(generationProgress * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress * 100}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {generationResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 p-4 bg-gray-700/50 rounded-lg"
          >
            <h4 className="text-sm font-medium text-gray-300 mb-2">Generation Complete</h4>
            <div className="space-y-1 text-xs text-gray-400">
              <p>Frames: {generationResult.frames}</p>
              <p>Duration: {generationResult.durationSeconds?.toFixed(2)}s</p>
              <p>Generation time: {generationResult.generationTime?.toFixed(2)}s</p>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex space-x-2">
              {generationResult.videoUrl && (
                <a
                  href={generationResult.videoUrl}
                  download={`ttm-${frameId}.mp4`}
                  className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </a>
              )}
              {generationResult.thumbnailUrl && (
                <button
                  onClick={() => navigator.clipboard.writeText(generationResult.thumbnailUrl!)}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Copy URL</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !isTTMAvailable}
        className={`mt-6 w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
          isGenerating || !isTTMAvailable
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
        }`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            <span>Generate Motion Video</span>
          </>
        )}
      </button>
    </div>
  );
}