
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
    start_frame_url?: string | null; // The main/hero still image
    end_frame_url?: string | null; // The second hero still image for Veo
    secondary_image_url?: string | null; // 2nd assigned image
    tertiary_image_url?: string | null; // 3rd assigned image
    quaternary_image_url?: string | null; // 4th assigned image
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
  // NEW: Character Identity Integration (Epic 2 - Workflow Integration)
  selectedCharacterIds?: string[]; // IDs of characters in this shot
  appliedIdentities?: { characterId: string; loraUrl: string; loraWeight?: number }[]; // Which identity LoRAs were applied
  // Video Gallery State (for AnimateStudio)
  selectedVideoIndex?: number; // Track which video is selected in the gallery
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
  // AI-generated video analysis/description
  analysisPrompt?: string;
  // Image type tracking for better provenance
  type?: 'uploaded' | 'generated' | 'refined' | 'reference' | 'lora-training';
}

export interface AnalyzedCharacter {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  generations?: Generation[];
  refinedGenerationUrls?: string[];
  upscaledImageUrl?: string | null;
  // NEW: Character Identity (Epic 2)
  identity?: CharacterIdentity;
}

export interface AnalyzedLocation {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  generations?: Generation[];
  refinedGenerationUrls?: string[];
  upscaledImageUrl?: string | null;
  // NEW: 3D World Integration (Epic 3 - Infrastructure Ready)
  worldId?: string; // ID of linked 3D world from hunyuanWorldService
  worldMetadata?: {
    worldUrl?: string;
    cameraPresets?: Array<{ name: string; position: any; rotation: any }>;
    lightingProfile?: string;
    generatedAt?: string;
  };
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
  coverImageId?: string; // User-selected cover image for moodboard card display
  lastAutoGeneratedAt?: string; // Timestamp of last AI generation
  autoGenerationTriggered?: boolean; // Flag to track if auto-generation at 10 images has occurred
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
  // NEW: Generation Context Cache (Workflow Integration)
  generationContext?: {
    lastUpdated: string;
    cachedCharacters?: any[]; // Cached character data with identities
    cachedLocations?: any[]; // Cached location data with 3D worlds
  };
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

// Continuity Checking Types (Epic 1, Story 1.4)

export type ContinuityIssueType = 'lighting-jump' | 'costume-change' | 'spatial-mismatch';
export type ContinuityIssueSeverity = 'critical' | 'warning' | 'info';

export interface ContinuityIssue {
  id: string; // Unique ID for dismissal tracking
  type: ContinuityIssueType;
  severity: ContinuityIssueSeverity;
  clip1: TimelineClip; // First affected clip
  clip2: TimelineClip; // Second affected clip
  sceneId: string | null; // Scene where issue occurs (null if no scene data)
  description: string; // Human-readable description
  suggestedFix: string; // Actionable recommendation
  autoFixCommand?: string; // Optional command to auto-fix (e.g., "regenerate-shot")
  dismissed: boolean; // User dismissed this warning
  dismissalReason?: string; // "Intentional", "Not an issue", "Will fix manually"
}

// Character Identity Types (Epic 2)

export type CharacterIdentityStatus = 'none' | 'preparing' | 'ready' | 'error';

export type CharacterIdentityTechnology = 'lora' | 'reference' | 'hybrid';

export interface CharacterIdentityTest {
  id: string;
  testType: 'portrait' | 'fullbody' | 'profile' | 'lighting' | 'expression';
  generatedImageUrl: string;
  similarityScore: number; // 0-100 (CLIP + pHash combined score)
  timestamp: string;
}

export type CharacterIdentityTestType = 'portrait' | 'fullbody' | 'profile' | 'lighting' | 'expression';

export interface CharacterIdentity {
  // Status tracking
  status: CharacterIdentityStatus;

  // Reference images (URLs or base64 data URLs)
  referenceImages: string[];

  // Voice identity (Epic 4 - Voice Acting Integration)
  voiceIdentity?: {
    voiceId: string;
    provider: 'openvoice' | 'elevenlabs' | 'coqui_tts' | 'huggingface';
    referenceAudio?: string; // Supabase URL to voice sample
    cloneMetadata?: {
      quality: number; // 0-100
      confidence: number; // 0-100
      processingTime: number; // ms
    };
    emotions: {
      [emotion: string]: string; // emotion -> voiceId mapping
    };
    lastUsed?: string; // ISO timestamp
  };

  // Testing and approval (Story 2.2)
  tests?: CharacterIdentityTest[];
  approvalStatus?: 'pending' | 'approved' | 'rejected';

  // Timestamps
  createdAt: string;
  lastUpdated: string;

  // Cost tracking
  trainingCost?: number;

  // Error handling
  errorMessage?: string;

  // Technology-specific data (determined by Epic R1 research)
  // This flexible structure allows for LoRA, reference-based, or hybrid approaches
  technologyData?: {
    type: CharacterIdentityTechnology;

    // LoRA-specific fields (if Epic R1 chooses LoRA)
    loraModelId?: string;
    loraCheckpoint?: string;
    loraWeights?: string; // URL to weights file

    // Reference-based fields (if Epic R1 chooses Flux Dev/IPAdapter/etc)
    referenceStrength?: number; // 0-100
    preprocessedData?: string; // Base64 or URL to preprocessed reference
    embeddingId?: string; // ID of character embedding

    // Fal.ai-specific fields (Epic R1 selected Fal.ai - 9.6/10 score)
    falCharacterId?: string; // Fal.ai character identity ID

    // Hybrid approach fields
    primaryMethod?: 'lora' | 'reference';
    fallbackMethod?: 'lora' | 'reference';

    // Additional metadata
    [key: string]: any; // Allow future extensions without type changes
  };
}

// Audio Production Types (Epic R3b)

export interface AudioStem {
  id: string;
  type: 'dialogue' | 'music' | 'effects' | 'ambient';
  url: string;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  startTime: number; // timeline offset in seconds
  duration: number;
  metadata?: {
    provider?: 'udio' | 'suno' | 'stable-audio' | 'musicgen' | 'aiva' | 'elevenlabs' | 'audiocraft' | 'freesound';
    prompt?: string;
    emotion?: string;
    genre?: string;
    generationTime?: number;
  };
}

export interface MusicGenerationParams {
  prompt: string;
  emotion?: 'happy' | 'sad' | 'tense' | 'mysterious' | 'triumphant' | 'melancholic' | 'energetic' | 'peaceful';
  genre?: 'orchestral' | 'electronic' | 'ambient' | 'rock' | 'jazz' | 'cinematic' | 'folk' | 'classical';
  duration?: number; // in seconds (max 180 for most providers)
  tempo?: 'slow' | 'medium' | 'fast';
  intensity?: 'low' | 'medium' | 'high';
  withStems?: boolean;
}

export interface SFXGenerationParams {
  prompt: string;
  duration?: number; // in seconds (typically 1-30s)
  category?: 'foley' | 'ambient' | 'environmental' | 'impact' | 'transition' | 'nature' | 'urban';
  intensity?: 'subtle' | 'moderate' | 'intense';
}

export interface AudioMixerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  stems: AudioStem[];
  masterVolume: number;
}

export type MusicProvider = 'udio' | 'suno' | 'stable-audio' | 'musicgen' | 'aiva';
export type SFXProvider = 'elevenlabs' | 'audiocraft' | 'freesound';

// Style Learning Types (Epic 1, Story 1.3)

export type PatternType = 'shotTypes' | 'lensChoice' | 'lighting' | 'colorGrade' | 'cameraMovement';

export interface StylePatterns {
  shotTypes: { [shotType: string]: number };
  lensChoices: { [shotType: string]: { [lens: string]: number } };
  lighting: { [lightingType: string]: number };
  colorGrade: { [gradeType: string]: number };
  cameraMovement: { [movementType: string]: number };
}

export interface StyleProfile {
  userId: string;
  patterns: StylePatterns;
  totalProjects: number;
  totalShots: number;
  lastUpdated: string;
  createdAt: string;
}
