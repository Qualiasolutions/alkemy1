/**
 * API Cost Estimates and Constants
 * Moved here to avoid circular dependencies between services
 */

// API Cost Estimates (approximations - update based on actual pricing)
export const API_COST_ESTIMATES = {
  image: {
    flux: 0.02, // Flux Pro/Dev (Fal.ai)
    pollinations: 0, // Pollinations.AI - 100% FREE! 🎉
    nanoBanana: 0.015, // Gemini Nano Banana
  },
  video: {
    veo: 0.3, // Veo 3.1 (Gemini)
    wan: 0.2, // Wan 2.2 (AI/ML API estimate)
  },
  audio: {
    music: 0.25,
    dialogue: 0.05,
    effects: 0.1,
  },
  GEMINI_FLASH_VIDEO_ANALYSIS: 0.001, // Gemini Flash for video analysis
}

// Quality Level Thresholds
export const QUALITY_THRESHOLDS = {
  excellent: 90,
  good: 75,
  fair: 60,
}
