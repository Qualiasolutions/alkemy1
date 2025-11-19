import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import { SaveIcon, FilmIcon, AlertCircleIcon, CheckIcon, DownloadIcon } from '../components/icons/Icons';
import { TimelineClip } from '../types';
import { renderTimelineToVideo, loadFFmpeg, isFFmpegReady } from '../services/videoRenderingService';

interface ExportSettings {
  resolution: '720p' | '1080p' | '4K';
  format: 'mp4' | 'mov' | 'webm';
  codec: 'h264' | 'h265' | 'vp9';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
}

interface ExportJob {
  id: string;
  name: string;
  settings: ExportSettings;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime?: number;
  endTime?: number;
  outputUrl?: string;
}

const RESOLUTION_MAP = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4K': { width: 3840, height: 2160 },
};

interface ExportsTabProps {
  timelineClips: TimelineClip[];
}

const ExportsTab: React.FC<ExportsTabProps> = ({ timelineClips }) => {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isFFmpegInitialized, setIsFFmpegInitialized] = useState(false);
  const [initializingFFmpeg, setInitializingFFmpeg] = useState(false);
  const [settings, setSettings] = useState<ExportSettings>({
    resolution: '1080p',
    format: 'mp4',
    codec: 'h264',
    quality: 'high',
    aspectRatio: '16:9',
  });

  useEffect(() => {
    // Pre-load FFmpeg when tab opens
    if (!isFFmpegReady() && !initializingFFmpeg) {
      setInitializingFFmpeg(true);
      loadFFmpeg((msg) => console.log('[FFmpeg Init]', msg))
        .then(() => {
          setIsFFmpegInitialized(true);
          setInitializingFFmpeg(false);
        })
        .catch((error) => {
          console.error('Failed to initialize FFmpeg:', error);
          setInitializingFFmpeg(false);
        });
    } else if (isFFmpegReady()) {
      setIsFFmpegInitialized(true);
    }
  }, []);

  const handleStartExport = async () => {
    if (timelineClips.length === 0) {
      alert('No clips in timeline. Please add clips to the timeline before exporting.');
      return;
    }

    const newJob: ExportJob = {
      id: `export-${Date.now()}`,
      name: `Export_${new Date().toLocaleDateString().replace(/\//g, '-')}_${new Date().toLocaleTimeString().replace(/:/g, '-')}`,
      settings: { ...settings },
      status: 'queued',
      progress: 0,
      startTime: Date.now(),
    };

    setExportJobs(prev => [newJob, ...prev]);

    // Start processing immediately
    setExportJobs(prev => prev.map(job =>
      job.id === newJob.id ? { ...job, status: 'processing' as const } : job
    ));

    try {
      // Render using FFmpeg.wasm
      const videoBlob = await renderTimelineToVideo(
        timelineClips,
        settings,
        (progress, message) => {
          setExportJobs(prev => prev.map(job =>
            job.id === newJob.id ? { ...job, progress: Math.round(progress) } : job
          ));
        }
      );

      // Create object URL for download
      const outputUrl = URL.createObjectURL(videoBlob);

      setExportJobs(prev => prev.map(job =>
        job.id === newJob.id
          ? {
              ...job,
              status: 'completed' as const,
              progress: 100,
              endTime: Date.now(),
              outputUrl,
            }
          : job
      ));
    } catch (error) {
      console.error('Export failed:', error);
      setExportJobs(prev => prev.map(job =>
        job.id === newJob.id
          ? {
              ...job,
              status: 'failed' as const,
              progress: 0,
            }
          : job
      ));
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownload = (job: ExportJob) => {
    if (job.outputUrl) {
      const link = document.createElement('a');
      link.href = job.outputUrl;
      link.download = `${job.name}.${job.settings.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDeleteJob = (jobId: string) => {
    setExportJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const getEstimatedSize = () => {
    const resolutions = { '720p': 500, '1080p': 1500, '4K': 8000 };
    const qualities = { low: 0.5, medium: 1, high: 1.5, ultra: 2.5 };
    const baseSize = resolutions[settings.resolution] * qualities[settings.quality];
    return `~${(baseSize / 1000).toFixed(1)} GB (for 10min video)`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white p-6">
      <header className="mb-6">
        <h2 className={`text-2xl font-bold mb-1 text-[var(--color-text-primary)]`}>Exports</h2>
        <p className={`text-md text-[var(--color-text-secondary)]`}>Render your timeline to final video files in multiple formats and resolutions.</p>
      </header>

      {!isFFmpegInitialized && (
        <div className="bg-[var(--color-accent-primary)]/10 border text-sm rounded-lg p-3 flex items-start gap-3 mb-6" style={{ borderColor: 'var(--color-accent-primary)', color: 'var(--color-accent-primary)' }}>
          <AlertCircleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">
              {initializingFFmpeg ? 'Initializing FFmpeg...' : 'FFmpeg Loading'}
            </span>
            {' '}FFmpeg.wasm is loading in the background. Export functionality will be available shortly.
          </div>
        </div>
      )}

      {isFFmpegInitialized && timelineClips.length === 0 && (
        <div className={`bg-lime-900/20 border border-lime-700 text-lime-300 text-sm rounded-lg p-3 flex items-start gap-3 mb-6`}>
          <AlertCircleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">No Timeline Clips:</span> Please add video clips to the Timeline tab before exporting. Go to Compositing → Transfer shots to Timeline.
          </div>
        </div>
      )}

      {isFFmpegInitialized && timelineClips.length > 0 && (
        <div className={`bg-[#dfec2d]/10/20 border border-[#dfec2d] text-[#dfec2d] text-sm rounded-lg p-3 flex items-start gap-3 mb-6`}>
          <CheckIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Ready to Export:</span> {timelineClips.length} clip{timelineClips.length !== 1 ? 's' : ''} loaded from timeline. FFmpeg.wasm is initialized and ready for rendering.
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Left: Export Settings */}
        <div className={`bg-[var(--color-surface-card)] border border-[var(--color-border-color)] rounded-xl p-6 space-y-5`}>
          <h3 className="text-lg font-semibold">Export Settings</h3>

          <div>
            <label className="block text-sm font-medium mb-2">Resolution</label>
            <select
              value={settings.resolution}
              onChange={e => setSettings(prev => ({ ...prev, resolution: e.target.value as ExportSettings['resolution'] }))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="720p">720p (1280x720)</option>
              <option value="1080p">1080p (1920x1080)</option>
              <option value="4K">4K (3840x2160)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
            <select
              value={settings.aspectRatio}
              onChange={e => setSettings(prev => ({ ...prev, aspectRatio: e.target.value as ExportSettings['aspectRatio'] }))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Vertical/Stories)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="4:3">4:3 (Classic)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Format</label>
            <select
              value={settings.format}
              onChange={e => setSettings(prev => ({ ...prev, format: e.target.value as ExportSettings['format'] }))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="mp4">MP4 (H.264)</option>
              <option value="mov">MOV (ProRes)</option>
              <option value="webm">WebM (VP9)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Codec</label>
            <select
              value={settings.codec}
              onChange={e => setSettings(prev => ({ ...prev, codec: e.target.value as ExportSettings['codec'] }))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="h264">H.264 (Most Compatible)</option>
              <option value="h265">H.265/HEVC (Smaller Files)</option>
              <option value="vp9">VP9 (Web Optimized)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quality</label>
            <select
              value={settings.quality}
              onChange={e => setSettings(prev => ({ ...prev, quality: e.target.value as ExportSettings['quality'] }))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="low">Low (Fast, Small File)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Recommended)</option>
              <option value="ultra">Ultra (Maximum Quality)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-zinc-700">
            <p className="text-xs text-zinc-500 mb-1">Estimated File Size:</p>
            <p className="text-sm font-semibold text-teal-400">{getEstimatedSize()}</p>
          </div>

          <Button
            onClick={handleStartExport}
            variant="primary"
            className="!w-full !py-3"
            disabled={!isFFmpegInitialized || timelineClips.length === 0}
          >
            <FilmIcon className="w-5 h-5" />
            <span>{initializingFFmpeg ? 'Loading FFmpeg...' : 'Start Export'}</span>
          </Button>
        </div>

        {/* Right: Export Queue */}
        <div className={`lg:col-span-2 bg-[var(--color-surface-card)] border border-[var(--color-border-color)] rounded-xl p-6 flex flex-col`}>
          <h3 className="text-lg font-semibold mb-4">Export Queue ({exportJobs.length})</h3>

          <div className="flex-1 overflow-y-auto space-y-3">
            {exportJobs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600">
                <div className="text-center">
                  <FilmIcon className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                  <p className="mb-2">No export jobs yet</p>
                  <p className="text-sm">Configure settings and start your first export</p>
                </div>
              </div>
            ) : (
              exportJobs.map(job => (
                <div
                  key={job.id}
                  className={`bg-zinc-900/50 border rounded-lg p-4 ${
                    job.status === 'processing'
                      ? 'border-teal-500/50'
                      : job.status === 'completed'
                      ? 'border-[#dfec2d]/50'
                      : job.status === 'failed'
                      ? 'border-red-500/50'
                      : 'border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-sm">{job.name}</h4>
                      <p className="text-xs text-zinc-500">
                        {job.settings.resolution} • {job.settings.format.toUpperCase()} • {job.settings.codec.toUpperCase()} • {job.settings.quality}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.status === 'completed' && (
                        <>
                          <Button onClick={() => handleDownload(job)} variant="primary" className="!text-xs !py-1 !px-3 flex items-center gap-1">
                            <DownloadIcon className="w-3 h-3" />
                            <span>Download</span>
                          </Button>
                          <Button onClick={() => handleDeleteJob(job.id)} variant="secondary" className="!text-xs !py-1 !px-3 !text-red-400">
                            Delete
                          </Button>
                        </>
                      )}
                      {job.status === 'queued' && (
                        <Button onClick={() => handleDeleteJob(job.id)} variant="secondary" className="!text-xs !py-1 !px-3">
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {(job.status === 'queued' || job.status === 'processing') && (
                    <div>
                      <div className="w-full bg-zinc-800 rounded-full h-2 mb-1">
                        <div
                          className="bg-[var(--color-accent-primary)] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>{job.status === 'queued' ? 'Queued...' : 'Rendering...'}</span>
                        <span className="font-mono">{job.progress}%</span>
                      </div>
                    </div>
                  )}

                  {job.status === 'completed' && (
                    <div className="flex items-center gap-2 text-xs text-[#dfec2d]">
                      <CheckIcon className="w-4 h-4" />
                      <span>Render complete • {((job.endTime! - job.startTime!) / 1000).toFixed(1)}s</span>
                    </div>
                  )}

                  {job.status === 'failed' && (
                    <div className="text-xs text-red-400">Export failed. Try again with different settings.</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportsTab;
