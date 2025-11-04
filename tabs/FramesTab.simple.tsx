import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import { THEME_COLORS } from '../constants';
import Button from '../components/Button';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, ScissorsIcon, Trash2Icon, SaveIcon, PlusIcon, UndoIcon, RedoIcon, GridIcon } from '../components/icons/Icons';
import { commandHistory, createStateCommand } from '../services/commandHistory';
import EmptyState from '../components/EmptyState';

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
  const trimStartStateRef = useRef<TimelineClip[] | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [copiedClip, setCopiedClip] = useState<TimelineClip | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number>();

  const PIXELS_PER_SECOND = 100 * zoom;
  const TRACK_HEIGHT = 60;
  const SNAP_THRESHOLD = 0.1; // seconds

  // Calculate total duration
  const totalDuration = clips.reduce((sum, clip) => sum + (clip.trimEnd - clip.trimStart), 0);

  // Store thumbnails for clips
  const [clipThumbnails, setClipThumbnails] = useState<{ [clipId: string]: string }>({});

  // Extract thumbnail from video clip
  const extractThumbnail = useCallback(async (clip: TimelineClip): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = clip.url;
      video.currentTime = clip.trimStart + 0.1; // Extract frame 0.1s after trim start

      video.addEventListener('loadeddata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(thumbnailUrl);
        } else {
          resolve('');
        }
      });

      video.addEventListener('error', () => resolve(''));
    });
  }, []);

  // Generate thumbnails for all clips
  useEffect(() => {
    const generateThumbnails = async () => {
      for (const clip of clips) {
        if (!clipThumbnails[clip.timelineId]) {
          const thumbnail = await extractThumbnail(clip);
          if (thumbnail) {
            setClipThumbnails(prev => ({ ...prev, [clip.timelineId]: thumbnail }));
          }
        }
      }
    };
    if (clips.length > 0) {
      generateThumbnails();
    }
  }, [clips, clipThumbnails, extractThumbnail]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all blob URLs on unmount to prevent memory leaks
      clips.forEach(clip => {
        if (clip.url.startsWith('blob:')) {
          URL.revokeObjectURL(clip.url);
        }
      });
    };
  }, []); // Empty deps - only run on unmount

  // Subscribe to command history changes
  useEffect(() => {
    const updateHistoryState = () => {
      setCanUndo(commandHistory.canUndo());
      setCanRedo(commandHistory.canRedo());
    };
    updateHistoryState();
    return commandHistory.subscribe(updateHistoryState);
  }, []);

  // Copy selected clip
  const handleCopyClip = useCallback(() => {
    if (!selectedClipId) return;
    const clipToCopy = clips.find(c => c.timelineId === selectedClipId);
    if (clipToCopy) {
      setCopiedClip(clipToCopy);
    }
  }, [selectedClipId, clips]);

  // Paste copied clip
  const handlePasteClip = useCallback(() => {
    if (!copiedClip) return;

    // Create a new clip with unique ID
    const newClip: TimelineClip = {
      ...copiedClip,
      timelineId: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const command = createStateCommand(
      `Paste clip: ${copiedClip.description}`,
      () => clips,
      (newClips) => onUpdateClips(newClips),
      [...clips, newClip]
    );

    commandHistory.executeCommand(command);
    setSelectedClipId(newClip.timelineId);
  }, [copiedClip, clips, onUpdateClips]);

  // Duplicate selected clip
  const handleDuplicateClip = useCallback(() => {
    if (!selectedClipId) return;
    const clipToDuplicate = clips.find(c => c.timelineId === selectedClipId);
    if (!clipToDuplicate) return;

    const newClip: TimelineClip = {
      ...clipToDuplicate,
      timelineId: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const command = createStateCommand(
      `Duplicate clip: ${clipToDuplicate.description}`,
      () => clips,
      (newClips) => onUpdateClips(newClips),
      [...clips, newClip]
    );

    commandHistory.executeCommand(command);
    setSelectedClipId(newClip.timelineId);
  }, [selectedClipId, clips, onUpdateClips]);

  // Keyboard shortcuts (Unreal Engine style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Space = Play/Pause
      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }

      // Ctrl+Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        commandHistory.undo();
      }

      // Ctrl+Shift+Z or Ctrl+Y = Redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) || ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        commandHistory.redo();
      }

      // Ctrl+S = Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }

      // Ctrl+C = Copy selected clip
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedClipId) {
        e.preventDefault();
        handleCopyClip();
      }

      // Ctrl+V = Paste copied clip
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedClip) {
        e.preventDefault();
        handlePasteClip();
      }

      // Ctrl+D = Duplicate selected clip
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedClipId) {
        e.preventDefault();
        handleDuplicateClip();
      }

      // Delete/Backspace = Delete selected clip
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        e.preventDefault();
        handleDeleteClip(selectedClipId);
      }

      // Home = Jump to start
      if (e.key === 'Home') {
        e.preventDefault();
        setCurrentTime(0);
      }

      // End = Jump to end
      if (e.key === 'End') {
        e.preventDefault();
        setCurrentTime(totalDuration);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, totalDuration, onSave, copiedClip, handleCopyClip, handlePasteClip, handleDuplicateClip]);

  // Snap-to-grid utility function
  const snapToGrid = useCallback((time: number): number => {
    if (!snapEnabled) return time;
    const gridSize = 0.1; // 100ms grid
    return Math.round(time / gridSize) * gridSize;
  }, [snapEnabled]);

  // Helper function to find which clip should be playing at a given time
  const getClipAtTime = useCallback((time: number): { clip: TimelineClip; localTime: number; clipIndex: number } | null => {
    let accumulatedTime = 0;
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const clipDuration = clip.trimEnd - clip.trimStart;
      if (time >= accumulatedTime && time < accumulatedTime + clipDuration) {
        const localTime = time - accumulatedTime;
        return { clip, localTime, clipIndex: i };
      }
      accumulatedTime += clipDuration;
    }
    return null;
  }, [clips]);

  // Sync video playback with playhead
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || clips.length === 0) return;

    const clipInfo = getClipAtTime(currentTime);

    if (clipInfo) {
      const { clip, localTime } = clipInfo;
      const videoTime = clip.trimStart + localTime;

      // Load the correct clip if it's not already loaded
      if (videoElement.src !== clip.url) {
        videoElement.src = clip.url;
        videoElement.load();
      }

      // Sync video time with timeline position (allow 0.2s tolerance)
      if (Math.abs(videoElement.currentTime - videoTime) > 0.2) {
        videoElement.currentTime = videoTime;
      }

      // Play or pause based on isPlaying state
      if (isPlaying && videoElement.paused) {
        videoElement.play().catch(err => console.warn('Play failed:', err));
      } else if (!isPlaying && !videoElement.paused) {
        videoElement.pause();
      }
    } else {
      // No clip at current time, pause video
      if (!videoElement.paused) {
        videoElement.pause();
      }
    }
  }, [currentTime, clips, isPlaying, getClipAtTime]);

  // Sync playback - update currentTime from video element when playing
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !isPlaying) return;

    const handleTimeUpdate = () => {
      const clipInfo = getClipAtTime(currentTime);
      if (!clipInfo) return;

      const { clip, clipIndex } = clipInfo;
      const localTime = videoElement.currentTime - clip.trimStart;

      // Calculate global timeline position
      let accumulatedTime = 0;
      for (let i = 0; i < clipIndex; i++) {
        accumulatedTime += clips[i].trimEnd - clips[i].trimStart;
      }
      const newTime = accumulatedTime + localTime;

      // Check if we've reached the end of the current clip
      if (videoElement.currentTime >= clip.trimEnd) {
        // Move to next clip
        const nextClipIndex = clipIndex + 1;
        if (nextClipIndex < clips.length) {
          const nextClip = clips[nextClipIndex];
          let nextAccumulatedTime = 0;
          for (let i = 0; i < nextClipIndex; i++) {
            nextAccumulatedTime += clips[i].trimEnd - clips[i].trimStart;
          }
          setCurrentTime(nextAccumulatedTime);
        } else {
          // End of timeline
          setIsPlaying(false);
          setCurrentTime(0);
        }
      } else {
        setCurrentTime(newTime);
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => videoElement.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isPlaying, currentTime, clips, getClipAtTime]);

  // Handle video loading states
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadStart = () => setVideoLoading(true);
    const handleCanPlay = () => setVideoLoading(false);
    const handleError = () => {
      setVideoLoading(false);
      setVideoError('Failed to load video. The video file may be corrupted or the URL is invalid.');
    };

    videoElement.addEventListener('loadstart', handleLoadStart);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('error', handleError);

    return () => {
      videoElement.removeEventListener('loadstart', handleLoadStart);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('error', handleError);
    };
  }, []);

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / PIXELS_PER_SECOND);
    setCurrentTime(Math.max(0, Math.min(newTime, totalDuration)));
  };

  const handleTrimStart = (clipId: string, handle: 'start' | 'end') => {
    // Capture the current state before trimming starts
    trimStartStateRef.current = [...clips];
    setIsDraggingTrim({ clipId, handle });
  };

  const handleTrimDrag = useCallback((e: MouseEvent) => {
    if (!isDraggingTrim || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const dragX = e.clientX - rect.left;
    const dragTime = snapToGrid(dragX / PIXELS_PER_SECOND);

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
  }, [isDraggingTrim, onUpdateClips, PIXELS_PER_SECOND, snapToGrid]);

  const handleTrimEnd = useCallback(() => {
    // Create undo command with the state captured before trimming
    if (trimStartStateRef.current) {
      const oldState = trimStartStateRef.current;
      const newState = [...clips];

      const command = createStateCommand(
        'Trim clip',
        () => oldState,
        (state) => onUpdateClips(state),
        newState
      );

      commandHistory.executeCommand(command);
      trimStartStateRef.current = null;
    }

    setIsDraggingTrim(null);
  }, [clips, onUpdateClips]);

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

  const handleDeleteClip = useCallback((clipId: string) => {
    // Find the clip to get its URL for cleanup
    const clipToDelete = clips.find(c => c.timelineId === clipId);

    if (!clipToDelete) return;

    // Create undo command
    const command = createStateCommand(
      `Delete clip: ${clipToDelete.description}`,
      () => clips,
      (newClips) => onUpdateClips(newClips),
      clips.filter(c => c.timelineId !== clipId)
    );

    commandHistory.executeCommand(command);

    // Revoke blob URL if it's a blob (uploaded file)
    if (clipToDelete.url.startsWith('blob:')) {
      URL.revokeObjectURL(clipToDelete.url);
    }

    if (selectedClipId === clipId) setSelectedClipId(null);
  }, [clips, onUpdateClips, selectedClipId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onAddNewVideoClip(e.target.files[0]);
    }
    if (e.target) e.target.value = '';
  };

  // Wrap onUpdateClips with command history for reordering
  const handleReorderClips = useCallback((newClips: TimelineClip[]) => {
    const oldClips = [...clips];

    // Create undo command
    const command = createStateCommand(
      'Reorder clips',
      () => oldClips,
      (state) => onUpdateClips(state),
      newClips
    );

    commandHistory.executeCommand(command);
  }, [clips, onUpdateClips]);

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
  const currentPlayingClip = getClipAtTime(currentTime);

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white">
      {/* Top Bar */}
      <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Timeline Editor</h1>
          <div className="flex items-center gap-2 border-l border-zinc-700 pl-4">
            <Button
              onClick={() => commandHistory.undo()}
              disabled={!canUndo}
              variant="secondary"
              className="!p-2"
              title="Undo (Ctrl+Z)"
            >
              <UndoIcon className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => commandHistory.redo()}
              disabled={!canRedo}
              variant="secondary"
              className="!p-2"
              title="Redo (Ctrl+Shift+Z)"
            >
              <RedoIcon className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setSnapEnabled(!snapEnabled)}
              variant={snapEnabled ? "primary" : "secondary"}
              className="!p-2"
              title="Snap to Grid (S)"
            >
              <GridIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
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
          <h2 className="text-lg font-semibold mb-3">Sequence Preview</h2>
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative">
            {clips.length > 0 ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                />
                {videoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-t-transparent border-teal-500 rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-zinc-400">Loading video...</p>
                    </div>
                  </div>
                )}
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-center px-4">
                      <p className="text-xs text-red-400 mb-1">Error</p>
                      <p className="text-xs text-zinc-400">{videoError}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <p className="text-sm">No clips in timeline</p>
              </div>
            )}
          </div>

          {/* Show currently playing clip info or selected clip info */}
          {(currentPlayingClip?.clip || selectedClip) && (
            <div className="space-y-3">
              <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-3`}>
                <h3 className="font-semibold text-sm mb-2">
                  {currentPlayingClip ? 'Now Playing' : 'Selected Clip'}
                </h3>
                {currentPlayingClip ? (
                  <>
                    <p className="text-xs text-zinc-400 mb-1">
                      Scene {currentPlayingClip.clip.sceneNumber} - Shot {currentPlayingClip.clip.shot_number}
                    </p>
                    <p className="text-xs text-zinc-500">{currentPlayingClip.clip.description}</p>
                  </>
                ) : selectedClip ? (
                  <>
                    <p className="text-xs text-zinc-400 mb-1">
                      Scene {selectedClip.sceneNumber} - Shot {selectedClip.shot_number}
                    </p>
                    <p className="text-xs text-zinc-500">{selectedClip.description}</p>
                  </>
                ) : null}
              </div>

              {selectedClip && (
                <>
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
                </>
              )}
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
              <EmptyState
                type="timeline"
                title="Timeline is Empty"
                description="Transfer your upscaled video shots from the Compositing tab to assemble your final production. You can trim, reorder, and export your complete video sequence."
                actionLabel="Upload Video Clip"
                onAction={() => fileInputRef.current?.click()}
              />
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

                {/* Visual Grid Lines (Unreal Engine style) */}
                {snapEnabled && (
                  <div className="absolute top-6 bottom-0 left-0 right-0 pointer-events-none">
                    {Array.from({ length: Math.ceil(totalDuration * 10) + 1 }).map((_, i) => {
                      const time = i * 0.1; // 100ms intervals
                      const isSecondMark = i % 10 === 0;
                      return (
                        <div
                          key={i}
                          className={`absolute top-0 bottom-0 ${
                            isSecondMark ? 'w-px bg-zinc-700/50' : 'w-px bg-zinc-800/30'
                          }`}
                          style={{ left: time * PIXELS_PER_SECOND }}
                        />
                      );
                    })}
                  </div>
                )}

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
                    onReorder={handleReorderClips}
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
                          {/* Thumbnail Background */}
                          {clipThumbnails[clip.timelineId] && (
                            <div
                              className="absolute inset-0 bg-cover bg-center opacity-40"
                              style={{ backgroundImage: `url(${clipThumbnails[clip.timelineId]})` }}
                            />
                          )}

                          {/* Clip Content */}
                          <div className="absolute inset-0 flex items-center px-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                            <div className="flex-1 truncate">
                              <p className="text-xs font-semibold truncate drop-shadow-md">{clip.description}</p>
                              <p className="text-[10px] text-zinc-300 drop-shadow-md">
                                {(clip.trimEnd - clip.trimStart).toFixed(1)}s
                              </p>
                            </div>
                            <ScissorsIcon className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
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
