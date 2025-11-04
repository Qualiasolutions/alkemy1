
// FIX: Moved AIStudio interface and global window augmentation from App.tsx to centralize the definition and resolve a TypeScript error.
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio?: AIStudio;
  }
}

export enum FrameStatus {
  Draft = 'draft',
  GeneratingStill = 'generating_still',
  GeneratedStill = 'generated_still',
  UpscalingImage = 'upscaling_image',
  UpscaledImageReady = 'upscaled_image_ready',
  QueuedVideo = 'queued_video',
  RenderingVideo = 'rendering_video',
  UpscalingVideo = 'upscaling_video',
  UpscaledVideoReady = 'upscaled_video_ready',
  VideoReady = 'video_ready', // Note: Retained for compatibility if used elsewhere, but new flow uses AnimatedVideoReady
  AnimatedVideoReady = 'animated_video_ready',
  Error = 'error'
}

export interface CameraPackage {
  lens_mm: number;
  aperture: string;
  iso: number;
  height: string;
  angle: string;
  movement: string;
}

export interface Frame {
  id: string;
  shot_number: number;
  description: string;
  type?: string;
  duration?: number;
  camera_package?: CameraPackage;
  lighting_tweak?: string;
  framing?: string;
  composition_rules?: string;
  negative?: string;
  audio_note?: string;
  cast_names?: string[];
  location_name?: string;
  status: FrameStatus;
  media?: {
    start_frame_url?: string | null; // The first hero still image
    end_frame_url?: string | null; // The second hero still image for Veo
    variants?: (string | {url: string, type: 'video' | 'image'})[]; // Can store URLs or objects for mixed types
    refinedVariantUrls?: string[]; // URLs of variants that have been refined
    upscaled_start_frame_url?: string | null;
    animated_video_url?: string | null;
    video_upscaled_url?: string | null;
    motion_transfer_url?: string | null;
  };
  seed?: number;
  version?: number;
  scene_id?: string;
  prompts?: { still: string; video: string };
  progress?: number;
  tags?: string[];
  generations?: Generation[];
  refinedGenerationUrls?: string[];
  // Add a new property to store generated video variants for a shot.
  videoGenerations?: Generation[];
  transferredToTimeline?: boolean;
}

export interface TimelineClip {
  id: string; // original frame id or unique id for external media
  timelineId: string; // unique instance id for timeline
  sceneNumber: number | null;
  shot_number: number | null;
  description: string;
  url: string;
  audioUrl?: string;
  sourceDuration: number;
  trimStart: number;
  trimEnd: number;
}


export interface Generation {
  id: string;
  url: string | null;
  aspectRatio: string;
  isLoading: boolean;
  error?: string;
  progress?: number;
}

export interface AnalyzedCharacter {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  generations?: Generation[];
  refinedGenerationUrls?: string[];
  upscaledImageUrl?: string | null;
}

export interface AnalyzedLocation {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  generations?: Generation[];
  refinedGenerationUrls?: string[];
  upscaledImageUrl?: string | null;
}

export interface AnalyzedScene {
  id:string;
  sceneNumber: number;
  setting: string;
  summary: string;
  time_of_day?: string;
  mood?: string;
  lighting?: string;
  frames?: Frame[];
  wardrobeByCharacter?: { [characterName: string]: Generation[] };
  setDressingItems?: Generation[];
}

export interface MoodboardItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  metadata?: {
    source?: string;
    title?: string;
    description?: string;
  };
}

export interface MoodboardSection {
  notes: string;
  items: MoodboardItem[];
  aiDescription?: string;
}

export interface Moodboard {
  cinematography: MoodboardSection;
  color: MoodboardSection;
  style: MoodboardSection;
  other: MoodboardSection;
}

export interface ScriptAnalysis {
  title: string;
  logline: string;
  summary: string;
  scenes: AnalyzedScene[];
  characters: AnalyzedCharacter[];
  locations: AnalyzedLocation[];
  props: string[];
  styling: string[];
  setDressing: string[];
  makeupAndHair: string[];
  sound: string[];
  moodboard?: Moodboard;
}
