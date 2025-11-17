/**
 * Motion Trajectory Editor Component
 * Allows users to draw motion paths on images for TTM video generation
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Move,
  Camera,
  Circle,
  TrendingUp,
  Maximize2,
  Minimize2,
  Trash2,
  Settings,
  Info,
  AlertTriangle
} from 'lucide-react';
import { Point2D, CameraMovementType, MotionType } from '../services/ttmService';

interface MotionTrajectoryEditorProps {
  imageUrl: string;
  onTrajectoryComplete?: (trajectory: Point2D[]) => void;
  onCameraMovementComplete?: (movement: CameraMovementConfig) => void;
  motionType?: MotionType;
  className?: string;
}

interface CameraMovementConfig {
  type: CameraMovementType;
  params: {
    dx?: number;
    dy?: number;
    amount?: number;
    angle?: number;
  };
}

type DrawMode = 'freehand' | 'linear' | 'circular' | 'bezier';
type EditorMode = 'object' | 'camera';

// Helper function to validate image URL
const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// Helper function to safely load images
const loadSafely = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    // Add crossOrigin for potential CORS issues
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
};

export default function MotionTrajectoryEditor({
  imageUrl,
  onTrajectoryComplete,
  onCameraMovementComplete,
  motionType = MotionType.OBJECT,
  className = ''
}: MotionTrajectoryEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [trajectory, setTrajectory] = useState<Point2D[]>([]);
  const [previewTrajectory, setPreviewTrajectory] = useState<Point2D[]>([]);
  const [drawMode, setDrawMode] = useState<DrawMode>('freehand');
  const [editorMode, setEditorMode] = useState<EditorMode>(motionType as EditorMode);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Validate image URL
  if (!isValidImageUrl(imageUrl)) {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-2" />
            <p className="text-red-400">Invalid image URL provided</p>
          </div>
        </div>
      </div>
    );
  }

  // Camera movement state
  const [cameraMovement, setCameraMovement] = useState<CameraMovementConfig>({
    type: CameraMovementType.PAN,
    params: { dx: 0, dy: 0 }
  });

  // Load image and set up canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let isMounted = true;
    setIsImageLoading(true);
    setImageError(null);

    const loadAndDrawImage = async () => {
      try {
        const img = await loadSafely(imageUrl);

        if (!isMounted) return;

        // Set canvas size to match image aspect ratio
        const containerWidth = container.clientWidth;
        const aspectRatio = img.width / img.height;
        const canvasHeight = containerWidth / aspectRatio;

        canvas.width = containerWidth;
        canvas.height = canvasHeight;

        // Draw initial image
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get 2D rendering context');
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawOverlay(ctx);
        setIsImageLoading(false);
      } catch (error) {
        if (!isMounted) return;
        console.error('[MotionTrajectoryEditor] Failed to load image:', error);
        setImageError(error instanceof Error ? error.message : 'Unknown error');
        setIsImageLoading(false);
      }
    };

    loadAndDrawImage();

    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  // Redraw canvas with trajectory
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw image
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      drawOverlay(ctx);
      drawTrajectory(ctx, trajectory);
      if (previewTrajectory.length > 0) {
        drawTrajectory(ctx, previewTrajectory, true);
      }
    };
    img.src = imageUrl;
  }, [imageUrl, trajectory, previewTrajectory, showGrid]);

  const drawOverlay = (ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x < canvas.width; x += canvas.width / 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += canvas.height / 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw mode-specific overlays
    if (editorMode === 'camera') {
      drawCameraOverlay(ctx);
    }
  };

  const drawCameraOverlay = (ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw camera movement visualization
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    switch (cameraMovement.type) {
      case CameraMovementType.PAN:
        // Draw pan direction arrow
        const dx = (cameraMovement.params.dx || 0) * canvas.width * 0.3;
        const dy = (cameraMovement.params.dy || 0) * canvas.height * 0.3;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + dx, centerY + dy);
        ctx.stroke();

        // Arrowhead
        if (dx !== 0 || dy !== 0) {
          const angle = Math.atan2(dy, dx);
          ctx.beginPath();
          ctx.moveTo(centerX + dx, centerY + dy);
          ctx.lineTo(
            centerX + dx - 10 * Math.cos(angle - Math.PI / 6),
            centerY + dy - 10 * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(centerX + dx, centerY + dy);
          ctx.lineTo(
            centerX + dx - 10 * Math.cos(angle + Math.PI / 6),
            centerY + dy - 10 * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
        break;

      case CameraMovementType.ZOOM:
        // Draw zoom rectangles
        const zoomAmount = 1 + (cameraMovement.params.amount || 0);
        const width = canvas.width * 0.8;
        const height = canvas.height * 0.8;

        // Original frame
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.strokeRect(centerX - width / 2, centerY - height / 2, width, height);

        // Zoomed frame
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
        ctx.strokeRect(
          centerX - (width * zoomAmount) / 2,
          centerY - (height * zoomAmount) / 2,
          width * zoomAmount,
          height * zoomAmount
        );
        break;

      case CameraMovementType.ORBIT:
        // Draw orbit arc
        const angle = (cameraMovement.params.angle || 0) * Math.PI / 180;
        const radius = Math.min(canvas.width, canvas.height) * 0.3;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + angle);
        ctx.stroke();

        // Draw camera icon at end
        const endX = centerX + radius * Math.cos(-Math.PI / 2 + angle);
        const endY = centerY + radius * Math.sin(-Math.PI / 2 + angle);
        ctx.fillStyle = 'rgba(0, 200, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(endX, endY, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  };

  const drawTrajectory = useCallback((
    ctx: CanvasRenderingContext2D,
    points: Point2D[],
    isPreview = false
  ) => {
    if (!points || points.length < 2) return;

    const canvas = ctx.canvas;

    // Limit points for performance (max 1000 points)
    const maxPoints = 1000;
    const pointsToDraw = points.length > maxPoints
      ? points.filter((_, i) => i % Math.ceil(points.length / maxPoints) === 0)
      : points;

    ctx.save();
    ctx.strokeStyle = isPreview
      ? 'rgba(255, 255, 255, 0.3)'
      : 'rgba(255, 100, 100, 0.8)';
    ctx.lineWidth = isPreview ? 1 : 2;
    ctx.setLineDash(isPreview ? [5, 5] : []);

    // Draw path
    ctx.beginPath();
    ctx.moveTo(pointsToDraw[0].x * canvas.width, pointsToDraw[0].y * canvas.height);

    for (let i = 1; i < pointsToDraw.length; i++) {
      ctx.lineTo(pointsToDraw[i].x * canvas.width, pointsToDraw[i].y * canvas.height);
    }
    ctx.stroke();

    // Draw points (limit labels for performance)
    ctx.fillStyle = isPreview
      ? 'rgba(255, 255, 255, 0.5)'
      : 'rgba(255, 100, 100, 1)';

    // Sample points for drawing (max 50 points for performance)
    const pointsForDrawing = pointsToDraw.length > 50
      ? pointsToDraw.filter((_, i) => i % Math.ceil(pointsToDraw.length / 50) === 0)
      : pointsToDraw;

    pointsForDrawing.forEach((point, index) => {
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, index === 0 ? 8 : 4, 0, Math.PI * 2);
      ctx.fill();

      // Only label start and end points
      const originalIndex = pointsToDraw.indexOf(point);
      if (originalIndex === 0) {
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.fillText('START', x + 10, y - 10);
        ctx.fillStyle = isPreview
          ? 'rgba(255, 255, 255, 0.5)'
          : 'rgba(255, 100, 100, 1)';
      } else if (originalIndex === pointsToDraw.length - 1) {
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.fillText('END', x + 10, y - 10);
        ctx.fillStyle = isPreview
          ? 'rgba(255, 255, 255, 0.5)'
          : 'rgba(255, 100, 100, 1)';
      }
    });

    // Draw playback indicator if playing
    if (isPlaying && playbackProgress > 0 && playbackProgress < points.length) {
      const currentPoint = points[Math.floor(playbackProgress)];
      const x = currentPoint.x * canvas.width;
      const y = currentPoint.y * canvas.height;

      ctx.fillStyle = 'rgba(0, 255, 100, 1)';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [isPlaying, playbackProgress]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point2D => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let x = (e.clientX - rect.left) / canvas.width;
    let y = (e.clientY - rect.top) / canvas.height;

    // Clamp to valid range [0, 1]
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editorMode === 'camera') return;

    const pos = getMousePos(e);

    if (drawMode === 'freehand') {
      setIsDrawing(true);
      setTrajectory([pos]);
    } else if (drawMode === 'linear') {
      if (trajectory.length === 0) {
        setTrajectory([pos]);
      } else {
        setTrajectory([trajectory[0], pos]);
        setIsDrawing(false);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);

    if (editorMode === 'camera') return;

    if (isDrawing && drawMode === 'freehand') {
      setTrajectory(prev => [...prev, pos]);
    } else if (drawMode === 'linear' && trajectory.length === 1) {
      setPreviewTrajectory([trajectory[0], pos]);
    } else if (drawMode === 'circular' && trajectory.length === 1) {
      // Preview circular path
      const center = trajectory[0];
      const radius = Math.sqrt(
        Math.pow(pos.x - center.x, 2) + Math.pow(pos.y - center.y, 2)
      );
      const circularPath = generateCircularPath(center, radius);
      setPreviewTrajectory(circularPath);
    }
  };

  const handleMouseUp = () => {
    if (drawMode === 'freehand') {
      setIsDrawing(false);
      if (onTrajectoryComplete && trajectory.length > 1) {
        onTrajectoryComplete(trajectory);
      }
    }
    setPreviewTrajectory([]);
  };

  const generateCircularPath = (center: Point2D, radius: number, numPoints = 50): Point2D[] => {
    const points: Point2D[] = [];
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      });
    }
    return points;
  };

  const clearTrajectory = () => {
    setTrajectory([]);
    setPreviewTrajectory([]);
    setIsDrawing(false);
    setPlaybackProgress(0);
    setIsPlaying(false);
  };

  const playbackAnimation = useCallback(() => {
    if (!isPlaying || trajectory.length === 0) {
      setIsPlaying(false);
      return;
    }

    setPlaybackProgress(prev => {
      const next = prev + 0.5;
      if (next >= trajectory.length) {
        setIsPlaying(false);
        return 0;
      }
      return next;
    });
  }, [isPlaying, trajectory.length]);

  // Reset playback when trajectory changes
  useEffect(() => {
    setIsPlaying(false);
    setPlaybackProgress(0);
  }, [trajectory]);

  useEffect(() => {
    if (isPlaying && trajectory.length > 0) {
      const interval = setInterval(playbackAnimation, 50);
      return () => clearInterval(interval);
    }
  }, [isPlaying, playbackAnimation, trajectory.length]);

  const handleCameraControl = (type: CameraMovementType, value: number) => {
    const newMovement = { ...cameraMovement, type };

    switch (type) {
      case CameraMovementType.PAN:
        // Value represents direction: 0=left, 1=right, 2=up, 3=down
        newMovement.params = {
          dx: value === 0 ? -0.3 : value === 1 ? 0.3 : 0,
          dy: value === 2 ? -0.3 : value === 3 ? 0.3 : 0
        };
        break;
      case CameraMovementType.ZOOM:
        newMovement.params = { amount: value };
        break;
      case CameraMovementType.ORBIT:
        newMovement.params = { angle: value };
        break;
    }

    setCameraMovement(newMovement);
    if (onCameraMovementComplete) {
      onCameraMovementComplete(newMovement);
    }
  };

  // Add keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearTrajectory();
      } else if (e.key === ' ' && trajectory.length > 0) {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trajectory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
    };
  }, []);

  if (imageError) {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 mb-2">Failed to load image</p>
            <p className="text-gray-400 text-sm">{imageError}</p>
            <button
              onClick={() => {
                setImageError(null);
                window.location.reload();
              }}
              className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Loading State */}
      {isImageLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-white text-sm">Loading image...</p>
          </div>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Mode Selector */}
            <div className="flex bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={() => setEditorMode('object')}
                className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-colors ${
                  editorMode === 'object'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Move className="w-4 h-4" />
                <span className="text-sm">Object Motion</span>
              </button>
              <button
                onClick={() => setEditorMode('camera')}
                className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-colors ${
                  editorMode === 'camera'
                    ? 'bg-[var(--color-accent-secondary)] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm">Camera Motion</span>
              </button>
            </div>

            {/* Draw Mode Selector (Object Motion Only) */}
            {editorMode === 'object' && (
              <div className="flex bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => setDrawMode('freehand')}
                  className={`p-2 rounded ${
                    drawMode === 'freehand' ? 'bg-purple-600' : 'hover:bg-gray-700'
                  }`}
                  title="Freehand"
                >
                  <TrendingUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDrawMode('linear')}
                  className={`p-2 rounded ${
                    drawMode === 'linear' ? 'bg-purple-600' : 'hover:bg-gray-700'
                  }`}
                  title="Linear"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDrawMode('circular')}
                  className={`p-2 rounded ${
                    drawMode === 'circular' ? 'bg-purple-600' : 'hover:bg-gray-700'
                  }`}
                  title="Circular"
                >
                  <Circle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
              title="Toggle Grid"
              aria-label={showGrid ? 'Hide grid' : 'Show grid'}
              aria-pressed={showGrid}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
              title="Info"
              aria-label={showInfo ? 'Hide information' : 'Show information'}
              aria-pressed={showInfo}
            >
              <Info className="w-4 h-4" />
            </button>
            {editorMode === 'object' && (
              <>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isPlaying ? 'Pause' : 'Play'}
                  aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
                  disabled={trajectory.length === 0}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={clearTrajectory}
                  className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Clear trajectory"
                  aria-label="Clear trajectory"
                  disabled={trajectory.length === 0}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="relative w-full">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsDrawing(false);
            setPreviewTrajectory([]);
          }}
        />
      </div>

      {/* Camera Controls (Camera Mode Only) */}
      {editorMode === 'camera' && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-center space-x-4">
            {/* Pan Controls */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-2">Pan</span>
              <div className="grid grid-cols-3 gap-1">
                <div />
                <button
                  onClick={() => handleCameraControl(CameraMovementType.PAN, 2)}
                  className="p-2 bg-gray-700 hover:bg-[var(--color-accent-secondary)] rounded"
                >
                  ↑
                </button>
                <div />
                <button
                  onClick={() => handleCameraControl(CameraMovementType.PAN, 0)}
                  className="p-2 bg-gray-700 hover:bg-[var(--color-accent-secondary)] rounded"
                >
                  ←
                </button>
                <div className="p-2" />
                <button
                  onClick={() => handleCameraControl(CameraMovementType.PAN, 1)}
                  className="p-2 bg-gray-700 hover:bg-[var(--color-accent-secondary)] rounded"
                >
                  →
                </button>
                <div />
                <button
                  onClick={() => handleCameraControl(CameraMovementType.PAN, 3)}
                  className="p-2 bg-gray-700 hover:bg-[var(--color-accent-secondary)] rounded"
                >
                  ↓
                </button>
                <div />
              </div>
            </div>

            {/* Zoom Control */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-2">Zoom</span>
              <input
                type="range"
                min="-0.5"
                max="1"
                step="0.1"
                value={cameraMovement.params.amount || 0}
                onChange={(e) => handleCameraControl(CameraMovementType.ZOOM, parseFloat(e.target.value))}
                className="w-32"
              />
              <span className="text-xs text-gray-500 mt-1">
                {((cameraMovement.params.amount || 0) * 100).toFixed(0)}%
              </span>
            </div>

            {/* Orbit Control */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-2">Orbit</span>
              <input
                type="range"
                min="-180"
                max="180"
                step="10"
                value={cameraMovement.params.angle || 0}
                onChange={(e) => handleCameraControl(CameraMovementType.ORBIT, parseFloat(e.target.value))}
                className="w-32"
              />
              <span className="text-xs text-gray-500 mt-1">
                {cameraMovement.params.angle || 0}°
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-16 right-4 w-64 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-sm"
          >
            <h3 className="font-semibold mb-2">Motion Controls</h3>
            {editorMode === 'object' ? (
              <ul className="space-y-1 text-gray-400">
                <li>• Click and drag to draw motion path</li>
                <li>• Use toolbar to select draw mode</li>
                <li>• Press Play to preview animation</li>
                <li>• Clear to start over</li>
              </ul>
            ) : (
              <ul className="space-y-1 text-gray-400">
                <li>• Use Pan controls for camera movement</li>
                <li>• Adjust Zoom slider for dolly effect</li>
                <li>• Use Orbit for rotating camera</li>
                <li>• Preview shows motion visualization</li>
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}