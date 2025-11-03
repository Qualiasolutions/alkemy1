import React, { useState, useRef, useEffect } from 'react';
import { THEME_COLORS } from '../constants';
import Button from '../components/Button';
import { SettingsIcon, SaveIcon, SparklesIcon } from '../components/icons/Icons';

interface ColorGradeSettings {
  exposure: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  preset: 'none' | 'cinematic' | 'noir' | 'vintage' | 'bleach' | 'warm';
}

const PRESET_CONFIGS: { [key: string]: Partial<ColorGradeSettings> } = {
  cinematic: { exposure: 0.1, contrast: 0.15, saturation: -0.1, temperature: 0.05, shadows: -0.1, highlights: 0.05 },
  noir: { exposure: -0.2, contrast: 0.4, saturation: -0.8, temperature: -0.1, shadows: -0.3, highlights: 0.2 },
  vintage: { exposure: 0.05, contrast: -0.1, saturation: -0.2, temperature: 0.15, tint: 0.1, shadows: 0.1 },
  bleach: { exposure: 0.3, contrast: -0.2, saturation: 0.3, highlights: 0.3, shadows: 0.2 },
  warm: { exposure: 0, contrast: 0.05, saturation: 0.1, temperature: 0.25, tint: 0.05 },
};

const PostProductionTab: React.FC = () => {
  const [sourceVideo, setSourceVideo] = useState<File | null>(null);
  const [sourceVideoUrl, setSourceVideoUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<ColorGradeSettings>({
    exposure: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    tint: 0,
    highlights: 0,
    shadows: 0,
    preset: 'none',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number>();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      if (sourceVideoUrl) URL.revokeObjectURL(sourceVideoUrl);
      setSourceVideo(file);
      const url = URL.createObjectURL(file);
      setSourceVideoUrl(url);
    }
    if (e.target) e.target.value = '';
  };

  const applyColorGrade = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const { exposure, contrast, saturation, temperature, tint, highlights, shadows } = settings;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Exposure
      r = r + (exposure * 255);
      g = g + (exposure * 255);
      b = b + (exposure * 255);

      // Contrast
      const contrastFactor = (1 + contrast);
      r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
      g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
      b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;

      // Saturation
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      r = gray + (r - gray) * (1 + saturation);
      g = gray + (g - gray) * (1 + saturation);
      b = gray + (b - gray) * (1 + saturation);

      // Temperature (shift toward orange/blue)
      r += temperature * 50;
      b -= temperature * 50;

      // Tint (shift toward magenta/green)
      r += tint * 30;
      g -= tint * 30;

      // Highlights (boost bright pixels)
      const luminance = (r + g + b) / 3;
      if (luminance > 180) {
        const boost = highlights * 50;
        r += boost;
        g += boost;
        b += boost;
      }

      // Shadows (adjust dark pixels)
      if (luminance < 75) {
        const adjustment = shadows * 50;
        r += adjustment;
        g += adjustment;
        b += adjustment;
      }

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imageData, 0, 0);
  };

  useEffect(() => {
    if (sourceVideoUrl && videoRef.current && canvasRef.current) {
      const renderLoop = () => {
        if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
          applyColorGrade();
          animationFrameRef.current = requestAnimationFrame(renderLoop);
        }
      };

      videoRef.current.addEventListener('play', renderLoop);
      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    }
  }, [sourceVideoUrl, settings]);

  const handleSliderChange = (key: keyof ColorGradeSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value, preset: 'none' }));
  };

  const applyPreset = (preset: ColorGradeSettings['preset']) => {
    if (preset === 'none') {
      setSettings({
        exposure: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        tint: 0,
        highlights: 0,
        shadows: 0,
        preset: 'none',
      });
    } else {
      setSettings(prev => ({ ...prev, ...PRESET_CONFIGS[preset], preset }));
    }
  };

  const handleReset = () => applyPreset('none');

  const handleExport = async () => {
    if (!canvasRef.current || !videoRef.current) return;
    setIsProcessing(true);

    try {
      // Simulated export (in production, you'd use MediaRecorder or FFmpeg.wasm)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'graded-frame.png';
      link.href = dataUrl;
      link.click();

      alert('Frame exported! (Full video export requires FFmpeg.wasm integration)');
    } catch (error) {
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white p-6">
      <header className="mb-6">
        <h2 className={`text-2xl font-bold mb-1 text-[${THEME_COLORS.text_primary}]`}>Post-Production</h2>
        <p className={`text-md text-[${THEME_COLORS.text_secondary}]`}>Real-time color grading and visual effects for your footage.</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Left: Source Video Upload */}
        <div className={`bg-[${THEME_COLORS.surface_card}] border border-[${THEME_COLORS.border_color}] rounded-xl p-6 flex flex-col`}>
          <h3 className="text-lg font-semibold mb-4">Source Video</h3>

          {!sourceVideoUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 border-2 border-dashed border-[${THEME_COLORS.border_color}] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[${THEME_COLORS.accent_primary}] transition-colors`}
            >
              <SparklesIcon className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400 font-semibold mb-1">Upload Video</p>
              <p className="text-xs text-gray-600">Click to browse</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <video
                ref={videoRef}
                src={sourceVideoUrl}
                controls
                className="w-full rounded-lg mb-4"
                onPlay={applyColorGrade}
                crossOrigin="anonymous"
              />
              <Button
                onClick={() => {
                  if (sourceVideoUrl) URL.revokeObjectURL(sourceVideoUrl);
                  setSourceVideo(null);
                  setSourceVideoUrl(null);
                }}
                variant="secondary"
                className="!w-full"
              >
                Remove Video
              </Button>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="video/*" className="hidden" />
        </div>

        {/* Center: Preview with Color Grade */}
        <div className={`bg-[${THEME_COLORS.surface_card}] border border-[${THEME_COLORS.border_color}] rounded-xl p-6 flex flex-col`}>
          <h3 className="text-lg font-semibold mb-4">Graded Preview</h3>
          <div className="flex-1 bg-black rounded-lg overflow-hidden flex items-center justify-center">
            {sourceVideoUrl ? (
              <canvas ref={canvasRef} className="max-w-full max-h-full" />
            ) : (
              <p className="text-gray-600 text-sm">Upload a video to see the graded result</p>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={handleReset} variant="secondary" className="flex-1" disabled={!sourceVideoUrl}>
              <SettingsIcon className="w-4 h-4" />
              Reset
            </Button>
            <Button onClick={handleExport} variant="primary" className="flex-1" disabled={!sourceVideoUrl} isLoading={isProcessing}>
              <SaveIcon className="w-4 h-4" />
              Export Frame
            </Button>
          </div>
        </div>

        {/* Right: Color Grading Controls */}
        <div className={`bg-[${THEME_COLORS.surface_card}] border border-[${THEME_COLORS.border_color}] rounded-xl p-6 overflow-y-auto`}>
          <h3 className="text-lg font-semibold mb-4">Color Grading</h3>

          {/* Presets */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {(['none', 'cinematic', 'noir', 'vintage', 'bleach', 'warm'] as const).map(preset => (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    settings.preset === preset
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {preset.charAt(0).toUpperCase() + preset.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            {[
              { key: 'exposure', label: 'Exposure', min: -1, max: 1, step: 0.01 },
              { key: 'contrast', label: 'Contrast', min: -1, max: 1, step: 0.01 },
              { key: 'saturation', label: 'Saturation', min: -1, max: 1, step: 0.01 },
              { key: 'temperature', label: 'Temperature', min: -1, max: 1, step: 0.01 },
              { key: 'tint', label: 'Tint', min: -1, max: 1, step: 0.01 },
              { key: 'highlights', label: 'Highlights', min: -1, max: 1, step: 0.01 },
              { key: 'shadows', label: 'Shadows', min: -1, max: 1, step: 0.01 },
            ].map(({ key, label, min, max, step }) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium">{label}</label>
                  <span className="text-xs font-mono text-zinc-500">
                    {settings[key as keyof ColorGradeSettings].toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={settings[key as keyof ColorGradeSettings] as number}
                  onChange={e => handleSliderChange(key as keyof ColorGradeSettings, parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer slider-thumb"
                  disabled={!sourceVideoUrl}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #14b8a6;
          border-radius: 50%;
          cursor: pointer;
        }
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #14b8a6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default PostProductionTab;
