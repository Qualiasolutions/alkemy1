
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
  // Metadata for generation details
  promptUsed?: string;
  referenceImages?: string[];
  selectedCharacters?: string[];
  selectedLocation?: string;
  model?: string;
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

export interface MoodboardTemplate {
  id: string;
  title: string;
  description?: string;
  items: MoodboardItem[];
  aiSummary?: string;
  createdAt: string;
  updatedAt?: string;
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
  moodboardTemplates?: MoodboardTemplate[];
}

// Authentication Types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface RoadmapBlock {
  id: string;
  type: 'task' | 'milestone' | 'note' | 'decision';
  title: string;
  description: string;
  position: { x: number; y: number };
  color: string;
  connections: string[]; // IDs of connected blocks
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  script_content?: string | null;
  script_analysis?: ScriptAnalysis | null;
  timeline_clips?: TimelineClip[] | null;
  moodboard_data?: Moodboard | null;
  roadmap_blocks?: RoadmapBlock[] | null;
  project_settings?: any | null;
  is_public: boolean;
  shared_with?: string[] | null;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
}

// Analytics Types (Epic 6)

export interface FlaggedShot {
  frameId: string;
  sceneId: string;
  issue: 'color-inconsistency' | 'lighting-incoherence' | 'look-bible-drift';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  suggestion: string;
  autoFixCommand?: string;
}

export interface ImprovementSuggestion {
  id: string;
  issue: string;
  impact: string;
  suggestion: string;
  category: 'color' | 'lighting' | 'look-bible' | 'cost' | 'time' | 'error' | 'workflow';
  autoFixCommand?: string;
}

export interface SceneQualityReport {
  sceneId: string;
  sceneName: string;
  overallScore: number;
  colorConsistency: number;
  lightingCoherence: number;
  lookBibleAdherence: number;
  flaggedShots: string[];
}

export interface CreativeQualityReport {
  projectId: string;
  overallScore: number;
  colorConsistency: number;
  lightingCoherence: number;
  lookBibleAdherence: number;
  sceneReports: SceneQualityReport[];
  flaggedShots: FlaggedShot[];
  improvementSuggestions: ImprovementSuggestion[];
  analyzedAt: string;
}

export interface TechnicalPerformanceMetrics {
  projectId: string;
  userId: string;
  renderTimes: {
    imageGeneration: { model: string; avgTime: number; count: number }[];
    videoAnimation: { avgTime: number; count: number };
    timelineExport: { avgTime: number; count: number };
    audioGeneration: { type: 'music' | 'dialogue' | 'effects'; avgTime: number; count: number }[];
  };
  apiCosts: {
    imageGenerationCost: number;
    videoGenerationCost: number;
    audioGenerationCost: number;
    totalProjectCost: number;
  };
  errorRates: {
    failedGenerations: { type: 'image' | 'video' | 'audio'; count: number; reasons: string[] }[];
    apiErrors: { type: string; count: number }[];
    safetyBlocks: number;
  };
  efficiencyMetrics: {
    generationsPerHour: number;
    successRate: number;
    avgRetriesPerSuccess: number;
    queueWaitTimes: number[];
  };
  lastUpdated: string;
}

export interface OptimizationSuggestion extends ImprovementSuggestion {
  potentialSavings?: number;
  estimatedTimeReduction?: number;
}

export interface ProjectPerformanceComparison {
  projectId: string;
  projectName: string;
  totalCost: number;
  totalTime: number;
  errorRate: number;
  successRate: number;
  completedAt: string;
}

export type QualityLevel = 'excellent' | 'good' | 'fair' | 'needs-improvement';

export interface ContinuityIssue {
  type: 'lighting-jump' | 'costume-change' | 'spatial-mismatch' | 'prop-continuity' | 'other';
  location: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  affectedFrames: string[];
}
