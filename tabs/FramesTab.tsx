
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { TimelineClip } from '../types';

// Simple button component for timeline to avoid circular dependency
const TimelineButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...props }) => (
  <button className={`px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors ${className}`} {...props}>
    {children}
  </button>
);

// --- Helper Components from Spec ---
const PanelHeader: React.FC<{ title: string, actions?: React.ReactNode }> = ({ title, actions }) => (
  <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/60 sticky top-0 z-10">
    <div className="text-xs uppercase tracking-wider text-zinc-400">{title}</div>
    <div className="flex items-center gap-2">{actions}</div>
  </div>
);

const timecode = (t: number, fps = 24): string => {
    const totalFrames = Math.floor(t * fps);
    const s = Math.floor(totalFrames / fps);
    const f = totalFrames % fps;
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    const ff = String(f).padStart(2, '0');
    return `${mm}:${ss}:${ff}`;
};

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/60 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="text-xs uppercase tracking-wider text-zinc-400">{title}</div>
        <span className="text-zinc-500">{open ? '−' : '+'}</span>
      </div>
      {open && <div className="p-3 space-y-3 bg-zinc-950">{children}</div>}
    </div>
  );
};

const Field: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div>
      <div className="text-[11px] text-zinc-400 mb-1">{label}</div>
      {children}
    </div>
);


// --- Main Editor Component based on spec ---
const FramesTab: React.FC<{
    clips: TimelineClip[];
    onUpdateClips: (updater: React.SetStateAction<TimelineClip[]>) => void;
    onAddNewVideoClip: (file: File) => void;
    projectState: any;
    onUpdateProjectState: (newState: any) => void;
    onSave: () => void;
}> = ({ clips, onUpdateClips, onAddNewVideoClip, projectState, onUpdateProjectState, onSave }) => {
    
    // UI State from global state
    const { leftWidth = 280, rightWidth = 300, timelineHeight = 220, zoom = 1, playhead = 0 } = projectState.ui || {};
    // FIX: Wrapped setUiState in useCallback to ensure it has a stable identity for useEffect dependencies.
    const setUiState = useCallback((updater: (prev: any) => any) => {
        onUpdateProjectState((prev: any) => ({ ...prev, ui: updater(prev.ui || {}) }));
    }, [onUpdateProjectState]);

    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

    // Resizer refs
    const leftDragRef = useRef(false);
    const rightDragRef = useRef(false);
    const bottomDragYRef = useRef(false);

    const { totalDuration, clipTimeMap } = useMemo(() => {
        let accumulatedTime = 0;
        const map = new Map<string, { start: number; end: number }>();
        clips.forEach(clip => {
            const duration = clip.trimEnd - clip.trimStart;
            map.set(clip.timelineId, { start: accumulatedTime, end: accumulatedTime + duration });
            accumulatedTime += duration;
        });
        return { totalDuration: Math.max(50, accumulatedTime), clipTimeMap: map }; // Ensure minimum duration for ruler
    }, [clips]);
    
    const setPlayhead = (time: number) => {
        const newTime = Math.max(0, Math.min(time, totalDuration));
        setUiState(prev => ({ ...prev, playhead: newTime }));
    };
    
    // --- Playback Logic ---
    // FIX: Used functional update with `setUiState` to correctly update playhead without stale state.
    useEffect(() => {
        if (!isPlaying) return;
        const id = setInterval(() => {
            setUiState(prevUi => {
                const currentPlayhead = prevUi.playhead || 0;
                const newPlayhead = currentPlayhead + 0.04 >= totalDuration ? 0 : currentPlayhead + 0.04;
                return { ...prevUi, playhead: newPlayhead };
            });
        }, 40);
        return () => clearInterval(id);
    }, [isPlaying, totalDuration, setUiState]);

    // Sync video element with playhead
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const findClipAtTime = (time: number): TimelineClip | null => {
            for (const clip of clips) {
                const times = clipTimeMap.get(clip.timelineId);
                if (times && time >= times.start && time < times.end) {
                    return clip;
                }
            }
            return null;
        };
        
        const activeClip = findClipAtTime(playhead);
        
        if (activeClip) {
            const clipStartTime = clipTimeMap.get(activeClip.timelineId)!.start;
            const timeWithinClip = playhead - clipStartTime;
            const targetVideoTime = activeClip.trimStart + timeWithinClip;
            
            if (video.src !== activeClip.url) {
                video.src = activeClip.url;
            }
            if (Math.abs(video.currentTime - targetVideoTime) > 0.1) {
                video.currentTime = targetVideoTime;
            }
            if (isPlaying && video.paused) {
                video.play().catch(e => console.warn("Autoplay was prevented"));
            } else if (!isPlaying && !video.paused) {
                video.pause();
            }
        } else {
             if (!video.paused) video.pause();
             video.src = ''; // Clear src if no clip at playhead
        }

    }, [playhead, isPlaying, clips, clipTimeMap]);
    

    // --- Resizer Logic ---
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (leftDragRef.current) {
                const newLeft = Math.min(Math.max(180, e.clientX), window.innerWidth - rightWidth - 300);
                setUiState(p => ({...p, leftWidth: newLeft}));
            }
            if (rightDragRef.current) {
                const newRight = Math.min(Math.max(180, window.innerWidth - e.clientX), window.innerWidth - leftWidth - 300);
                setUiState(p => ({...p, rightWidth: newRight}));
            }
            if (bottomDragYRef.current) {
                const topArea = window.innerHeight - e.clientY;
                const clamped = Math.min(Math.max(140, topArea), 400);
                setUiState(p => ({...p, timelineHeight: clamped}));
            }
        };
        const onMouseUp = () => {
            leftDragRef.current = false;
            rightDragRef.current = false;
            bottomDragYRef.current = false;
            document.body.style.cursor = "";
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [leftWidth, rightWidth, setUiState]);
    
    // --- Editing Functions ---
    const handleAddVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            onAddNewVideoClip(e.target.files[0]);
        }
    };
    
     const handleSplitClip = () => {
        const findClipAtTime = (time: number): TimelineClip | null => {
            for (const clip of clips) {
                const times = clipTimeMap.get(clip.timelineId);
                if (times && time >= times.start && time < times.end) {
                    return clip;
                }
            }
            return null;
        };
        const activeClip = findClipAtTime(playhead);
        if (!activeClip) return;

        const clipTimes = clipTimeMap.get(activeClip.timelineId)!;
        const timeWithinClip = playhead - clipTimes.start;
        const splitTimeInSource = activeClip.trimStart + timeWithinClip;
        
        // Prevent splitting too close to edges
        if (timeWithinClip <= 0.1 || timeWithinClip >= (activeClip.trimEnd - activeClip.trimStart) - 0.1) return;

        const clip1: TimelineClip = { ...activeClip, trimEnd: splitTimeInSource };
        const clip2: TimelineClip = { ...activeClip, timelineId: `clip-${activeClip.id}-${Date.now()}`, trimStart: splitTimeInSource };

        const clipIndex = clips.findIndex(c => c.timelineId === activeClip.timelineId);
        onUpdateClips(prev => {
            const newClips = [...prev];
            newClips.splice(clipIndex, 1, clip1, clip2);
            return newClips;
        });
    };

    const selectedClipData = useMemo(() => clips.find(c => c.timelineId === selectedClipId), [clips, selectedClipId]);

    return (
    <div className="w-full h-full bg-zinc-950 text-zinc-100 select-none overflow-hidden flex flex-col">
      {/* Top Bar with Save TimelineButton */}
      <div className="flex items-center justify-between px-3 sm:px-4 h-10 border-b border-zinc-800 bg-zinc-900/70 backdrop-blur-sm">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold">Cowboy – Edited</span>
          <span className="text-zinc-500">●</span>
          <button className="text-zinc-400 hover:text-zinc-200">File</button>
          <button className="text-zinc-400 hover:text-zinc-200">Edit</button>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700">{timecode(playhead)} / {timecode(totalDuration)}</div>
          <TimelineButton onClick={onSave} className="bg-lime-700 hover:bg-#b3e617 shadow-lg !py-1 !px-2">💾 Save Project</TimelineButton>
        </div>
      </div>

      {/* Body: Left | Center | Right */}
      <div className="relative w-full flex-1 flex min-h-0">
        {/* Left Panel: Project */}
        <div style={{ width: leftWidth }} className="h-full border-r border-zinc-800 bg-zinc-900/40 flex flex-col">
          <PanelHeader
            title="Project Bin"
            actions={
              <div className="flex gap-2">
                <TimelineButton onClick={() => videoInputRef.current?.click()} className="!py-1 !px-2">⬆ Import</TimelineButton>
                <TimelineButton className="!py-1 !px-2">🔗 From URL</TimelineButton>
              </div>
            }
          />
          <input type="file" ref={videoInputRef} onChange={handleAddVideoFile} accept="video/*" className="hidden" />

          <div className="p-2">
            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-1 text-sm">
              <span className="text-zinc-400">🔍</span>
              <input placeholder="Search clips" className="w-full bg-transparent outline-none"/>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
             {clips.map((clip) => (
              <div key={clip.timelineId} className="rounded-md overflow-hidden border border-zinc-800 bg-zinc-900/60 p-2 text-xs">
                <div className="truncate font-semibold" title={clip.description}>{clip.description}</div>
                <div className="text-zinc-500 tabular-nums">{(clip.sourceDuration).toFixed(1)}s</div>
              </div>
            ))}
          </div>
        </div>

        {/* Left resizer */}
        <div
          onMouseDown={() => { leftDragRef.current = true; document.body.style.cursor = "col-resize"; }}
          className="w-1.5 hover:w-2 transition-all cursor-col-resize bg-zinc-900/40 border-r border-zinc-800"
        />

        {/* Center: Viewer + Timeline container */}
        <div className="flex-1 h-full flex flex-col">
          {/* Viewer */}
          <div className="relative flex-1 min-h-[200px] flex flex-col">
            <PanelHeader title="Program: Cowboy" actions={<TimelineButton className="px-2 py-1">⚙</TimelineButton>} />
            <div className="flex-1 grid place-items-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
              <div className="relative w-[72%] max-w-[920px] aspect-video bg-black border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                <video ref={videoRef} className="w-full h-full object-contain" />
                <div className="absolute bottom-2 left-2 text-xs bg-zinc-900/80 border border-zinc-800 rounded px-2 py-0.5 tabular-nums">{timecode(playhead)}</div>
              </div>
            </div>
            {/* Transport Controls */}
            <div className="flex items-center justify-center gap-2 py-3 border-t border-zinc-800 bg-zinc-900/60">
              <TimelineButton onClick={() => setPlayhead(0)}>■ Stop</TimelineButton>
              <TimelineButton onClick={() => setPlayhead(playhead - 1)}>⏮ -1s</TimelineButton>
              <TimelineButton onClick={() => setIsPlaying(p => !p)} className="bg-lime-700 hover:bg-#b3e617">{isPlaying ? '⏸' : '▶'}</TimelineButton>
              <TimelineButton onClick={() => setPlayhead(playhead + 1)}>+1s ⏭</TimelineButton>
              <div className="flex items-center gap-2 ml-4 text-sm"><span className="text-zinc-400">🔊</span><input type="range" min="0" max="100" defaultValue="80" className="w-32"/></div>
              <div className="flex items-center gap-2 ml-6 text-sm">
                <div className="text-zinc-400">Zoom</div>
                <input type="range" min="0.5" max="4" step="0.1" value={zoom} onChange={(e)=>setUiState(p => ({...p, zoom: parseFloat(e.target.value)}))} className="w-40"/>
              </div>
            </div>
          </div>
          {/* Horizontal resizer */}
          <div
            onMouseDown={() => { bottomDragYRef.current = true; document.body.style.cursor = "row-resize"; }}
            className="h-1.5 hover:h-2 cursor-row-resize bg-zinc-900/40 border-t border-zinc-800"
          />
          {/* Timeline */}
          <div style={{ height: timelineHeight }} className="w-full bg-zinc-900/60 border-t border-zinc-800 flex flex-col">
            <PanelHeader title="Timeline: V1 / A1" actions={<TimelineButton className="!py-1 !px-2" onClick={handleSplitClip}>✂ Split</TimelineButton>} />
            <div className="flex-1 overflow-auto" ref={timelineContainerRef}>
                <div className="relative h-full" style={{ width: totalDuration * 80 * zoom }}>
                    {/* Ruler */}
                    <div className="sticky top-0 h-8 border-b border-zinc-800 bg-zinc-900/80 text-[10px] tabular-nums z-30">
                        {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                          <div key={i} className="absolute top-0 h-full border-l border-zinc-800" style={{ left: `${i * 80 * zoom}px` }}>
                            <div className="absolute top-1 left-1 text-zinc-500">{i}s</div>
                          </div>
                        ))}
                    </div>
                    {/* Tracks */}
                    <div className="relative h-[calc(100%-2rem)]">
                        {/* Playhead line */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-#dfec2d shadow-[0_0_8px_rgba(163,230,53,0.7)] z-20" style={{ left: `${playhead * 80 * zoom}px` }} />
                        {/* Video Track */}
                         <div className="h-1/2 border-b border-zinc-800 relative p-1">
                            {clips.map((clip) => {
                                const clipMeta = clipTimeMap.get(clip.timelineId);
                                if (!clipMeta) return null;
                                const width = (clipMeta.end - clipMeta.start) * 80 * zoom;
                                return (
                                <div key={clip.timelineId} onClick={() => setSelectedClipId(clip.timelineId)} className={`absolute top-1 bottom-1 rounded-md border text-xs p-1 truncate ${selectedClipId === clip.timelineId ? 'border-amber-400' : 'border-amber-700'} bg-amber-900/50`} style={{ left: `${clipMeta.start * 80 * zoom}px`, width: `${width}px`}}>
                                    {clip.description}
                                </div>
                                );
                            })}
                        </div>
                        {/* Audio Track */}
                         <div className="h-1/2 relative p-1" />
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Right resizer */}
        <div
          onMouseDown={() => { rightDragRef.current = true; document.body.style.cursor = "col-resize"; }}
          className="w-1.5 hover:w-2 transition-all cursor-col-resize bg-zinc-900/40 border-l border-zinc-800"
        />

        {/* Right Inspector */}
        <div style={{ width: rightWidth }} className="h-full border-l border-zinc-800 bg-zinc-900/40 flex flex-col">
          <PanelHeader title="Inspector" actions={<TimelineButton className="!py-1 !px-2">⚙</TimelineButton>} />
          <div className="p-4 space-y-4 overflow-auto text-sm">
            {selectedClipData ? (
                <>
                <Section title="Clip">
                  <Field label="Name"><input className="w-full bg-zinc-800 rounded-lg px-2 py-1 border border-zinc-700" value={selectedClipData.description} readOnly/></Field>
                  <Field label="In / Out"><div className="flex gap-2"><input className="w-full bg-zinc-800 rounded-lg px-2 py-1 border border-zinc-700" value={timecode(selectedClipData.trimStart)} readOnly/><input className="w-full bg-zinc-800 rounded-lg px-2 py-1 border border-zinc-700" value={timecode(selectedClipData.trimEnd)} readOnly/></div></Field>
                  <Field label="Opacity"><input type="range" min="0" max="100" defaultValue="100" className="w-full"/></Field>
                </Section>
                <Section title="Audio"><Field label="Volume"><input type="range" min="0" max="100" defaultValue="80" className="w-full"/></Field></Section>
                <Section title="Transform">
                  <Field label="Scale"><input type="range" min="50" max="150" defaultValue="100" className="w-full"/></Field>
                  <Field label="Position"><div className="flex gap-2"><input type="number" defaultValue={0} className="w-full bg-zinc-800 rounded-lg px-2 py-1 border border-zinc-700"/><input type="number" defaultValue={0} className="w-full bg-zinc-800 rounded-lg px-2 py-1 border border-zinc-700"/></div></Field>
                </Section>
                </>
            ) : <div className="text-center text-zinc-500 p-8">Select a clip to inspect</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FramesTab;
