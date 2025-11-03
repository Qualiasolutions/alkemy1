import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import { THEME_COLORS } from '../constants';
import Button from '../components/Button';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, ScissorsIcon, Trash2Icon, SaveIcon, PlusIcon } from '../components/icons/Icons';

interface TimelineClip {
  id: string;
  timelineId: string;
  sceneNumber: number | null;
  shot_number: number | null;
  description: string;
  url: string;
  audioUrl?: string;
  sourceDuration: number;
  trimStart: number;
  trimEnd: number;
}

interface FramesTabProps {
  clips: TimelineClip[];
  onUpdateClips: (updater: React.SetStateAction<TimelineClip[]>) => void;
  onAddNewVideoClip: (file: File) => void;
  projectState: any;
  onUpdateProjectState: (newState: any) => void;
  onSave: () => void;
}

const FramesTab: React.FC<FramesTabProps> = ({
  clips,
  onUpdateClips,
  onAddNewVideoClip,
  projectState,
  onUpdateProjectState,
  onSave
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(projectState?.ui?.zoom || 1);
  const [isDraggingTrim, setIsDraggingTrim] = useState<{ clipId: string; handle: 'start' | 'end' } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number>();

  const PIXELS_PER_SECOND = 100 * zoom;
  const TRACK_HEIGHT = 60;

  // Calculate total duration
  const totalDuration = clips.reduce((sum, clip) => sum + (clip.trimEnd - clip.trimStart), 0);

  // Sync playback
  useEffect(() => {
    if (isPlaying) {
      const updatePlayhead = () => {
        setCurrentTime(prev => {
          const newTime = prev + (1 / 60); // 60fps
          if (newTime >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return newTime;
        });
        animationFrameRef.current = requestAnimationFrame(updatePlayhead);
      };
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, totalDuration]);

  // Update preview video
  useEffect(() => {
    if (videoRef.current && selectedClipId) {
      const clip = clips.find(c => c.timelineId === selectedClipId);
      if (clip) {
        videoRef.current.src = clip.url;
        videoRef.current.currentTime = clip.trimStart;
      }
    }
  }, [selectedClipId, clips]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / PIXELS_PER_SECOND);
    setCurrentTime(Math.max(0, Math.min(newTime, totalDuration)));
  };

  const handleTrimStart = (clipId: string, handle: 'start' | 'end') => {
    setIsDraggingTrim({ clipId, handle });
  };

  const handleTrimDrag = useCallback((e: MouseEvent) => {
    if (!isDraggingTrim || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const dragX = e.clientX - rect.left;
    const dragTime = dragX / PIXELS_PER_SECOND;

    onUpdateClips(prevClips => prevClips.map(clip => {
      if (clip.timelineId === isDraggingTrim.clipId) {
        if (isDraggingTrim.handle === 'start') {
          const newTrimStart = Math.max(0, Math.min(dragTime, clip.trimEnd - 0.1));
          return { ...clip, trimStart: newTrimStart };
        } else {
          const newTrimEnd = Math.min(clip.sourceDuration, Math.max(dragTime, clip.trimStart + 0.1));
          return { ...clip, trimEnd: newTrimEnd };
        }
      }
      return clip;
    }));
  }, [isDraggingTrim, onUpdateClips, PIXELS_PER_SECOND]);

  const handleTrimEnd = useCallback(() => {
    setIsDraggingTrim(null);
  }, []);

  useEffect(() => {
    if (isDraggingTrim) {
      window.addEventListener('mousemove', handleTrimDrag);
      window.addEventListener('mouseup', handleTrimEnd);
      return () => {
        window.removeEventListener('mousemove', handleTrimDrag);
        window.removeEventListener('mouseup', handleTrimEnd);
      };
    }
  }, [isDraggingTrim, handleTrimDrag, handleTrimEnd]);

  const handleDeleteClip = (clipId: string) => {
    onUpdateClips(prev => prev.filter(c => c.timelineId !== clipId));
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onAddNewVideoClip(e.target.files[0]);
    }
    if (e.target) e.target.value = '';
  };

  // Calculate clip position in timeline
  let cumulativeTime = 0;
  const clipPositions = clips.map(clip => {
    const startX = cumulativeTime * PIXELS_PER_SECOND;
    const duration = clip.trimEnd - clip.trimStart;
    const width = duration * PIXELS_PER_SECOND;
    cumulativeTime += duration;
    return { startX, width, duration };
  });

  const selectedClip = clips.find(c => c.timelineId === selectedClipId);

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white">
      {/* Top Bar */}
      <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-zinc-800">
        <h1 className="text-2xl font-bold">Timeline Editor</h1>
        <div className="flex items-center gap-3">
          <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="!py-2 !px-4">
            <PlusIcon className="w-4 h-4" />
            <span>Add Clip</span>
          </Button>
          <Button onClick={onSave} variant="primary" className="!py-2 !px-4">
            <SaveIcon className="w-4 h-4" />
            <span>Save Project</span>
          </Button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="video/*" className="hidden" />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Preview */}
        <div className="w-1/3 border-r border-zinc-800 p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-3">Preview</h2>
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
            {selectedClip ? (
              <video ref={videoRef} controls className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <p className="text-sm">Select a clip to preview</p>
              </div>
            )}
          </div>

          {selectedClip && (
            <div className="space-y-3">
              <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-3`}>
                <h3 className="font-semibold text-sm mb-2">Clip Info</h3>
                <p className="text-xs text-zinc-400 mb-1">Scene {selectedClip.sceneNumber} - Shot {selectedClip.shot_number}</p>
                <p className="text-xs text-zinc-500">{selectedClip.description}</p>
              </div>

              <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-3`}>
                <h3 className="font-semibold text-sm mb-2">Trim Controls</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">In Point:</span>
                    <span className="font-mono">{selectedClip.trimStart.toFixed(2)}s</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Out Point:</span>
                    <span className="font-mono">{selectedClip.trimEnd.toFixed(2)}s</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Duration:</span>
                    <span className="font-mono">{(selectedClip.trimEnd - selectedClip.trimStart).toFixed(2)}s</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleDeleteClip(selectedClip.timelineId)}
                variant="secondary"
                className="!w-full !py-2 !text-red-400 !border-red-800 hover:!bg-red-900/20"
              >
                <Trash2Icon className="w-4 h-4" />
                <span>Delete Clip</span>
              </Button>
            </div>
          )}
        </div>

        {/* Right: Timeline */}
        <div className="flex-1 flex flex-col">
          {/* Transport Controls */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Button onClick={() => setCurrentTime(0)} variant="secondary" className="!p-2">
                <SkipBackIcon className="w-4 h-4" />
              </Button>
              <Button onClick={handlePlayPause} variant="primary" className="!p-3">
                {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
              </Button>
              <Button onClick={() => setCurrentTime(totalDuration)} variant="secondary" className="!p-2">
                <SkipForwardIcon className="w-4 h-4" />
              </Button>
              <span className="ml-4 font-mono text-sm text-zinc-400">
                {currentTime.toFixed(2)}s / {totalDuration.toFixed(2)}s
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Zoom:</span>
              <Button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} variant="secondary" className="!p-1 !text-xs">-</Button>
              <span className="font-mono text-xs w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
              <Button onClick={() => setZoom(Math.min(3, zoom + 0.25))} variant="secondary" className="!p-1 !text-xs">+</Button>
            </div>
          </div>

          {/* Timeline Tracks */}
          <div className="flex-1 overflow-auto bg-zinc-900/50 p-4">
            {clips.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600">
                <div className="text-center">
                  <p className="mb-2">No clips in timeline yet</p>
                  <p className="text-sm">Transfer upscaled videos from the Compositing tab</p>
                </div>
              </div>
            ) : (
              <div className="relative" style={{ height: TRACK_HEIGHT + 60 }}>
                {/* Time Ruler */}
                <div className="absolute top-0 left-0 right-0 h-6 border-b border-zinc-700 flex items-end">
                  {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                    <div key={i} style={{ position: 'absolute', left: i * PIXELS_PER_SECOND }} className="text-[10px] text-zinc-500 font-mono">
                      {i}s
                    </div>
                  ))}
                </div>

                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                  style={{ left: currentTime * PIXELS_PER_SECOND }}
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full -translate-x-1/2" />
                </div>

                {/* Clips Track */}
                <div
                  ref={timelineRef}
                  className="absolute top-8 left-0 right-0 cursor-pointer"
                  style={{ height: TRACK_HEIGHT }}
                  onClick={handleTimelineClick}
                >
                  <Reorder.Group
                    axis="x"
                    values={clips}
                    onReorder={onUpdateClips}
                    className="relative h-full"
                  >
                    {clips.map((clip, index) => (
                      <Reorder.Item
                        key={clip.timelineId}
                        value={clip}
                        className="absolute top-0"
                        style={{
                          left: clipPositions[index].startX,
                          width: clipPositions[index].width,
                          height: TRACK_HEIGHT,
                        }}
                      >
                        <motion.div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClipId(clip.timelineId);
                          }}
                          className={`relative h-full rounded border-2 overflow-hidden cursor-pointer group ${
                            selectedClipId === clip.timelineId
                              ? 'border-amber-400 bg-amber-900/30'
                              : 'border-zinc-700 bg-zinc-800'
                          }`}
                          whileHover={{ scale: 1.02 }}
                        >
                          {/* Clip Content */}
                          <div className="absolute inset-0 flex items-center px-2">
                            <div className="flex-1 truncate">
                              <p className="text-xs font-semibold truncate">{clip.description}</p>
                              <p className="text-[10px] text-zinc-500">
                                {(clip.trimEnd - clip.trimStart).toFixed(1)}s
                              </p>
                            </div>
                            <ScissorsIcon className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          {/* Trim Handles */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-2 bg-green-500/50 cursor-ew-resize hover:bg-green-500 transition-colors"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleTrimStart(clip.timelineId, 'start');
                            }}
                          />
                          <div
                            className="absolute right-0 top-0 bottom-0 w-2 bg-blue-500/50 cursor-ew-resize hover:bg-blue-500 transition-colors"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleTrimStart(clip.timelineId, 'end');
                            }}
                          />
                        </motion.div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FramesTab;
