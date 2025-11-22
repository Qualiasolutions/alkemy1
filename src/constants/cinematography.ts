/**
 * Cinematography Constants
 * Pre-defined camera packages and shot presets for quick reference
 */

import type { CameraPackage } from '../types'

// Standard camera packages for common shot types
export const CAMERA_PACKAGES: Record<string, CameraPackage> = {
  // Wide Shots
  wideEstablishing: {
    lens_mm: 24,
    aperture: 'f/5.6',
    iso: 400,
    height: 'Eye Level',
    angle: 'Straight On',
    movement: 'Static or Slow Push',
  },
  wideAction: {
    lens_mm: 28,
    aperture: 'f/4',
    iso: 800,
    height: 'Low Angle',
    angle: 'Dutch 15°',
    movement: 'Handheld',
  },
  wideLandscape: {
    lens_mm: 18,
    aperture: 'f/8',
    iso: 200,
    height: 'Elevated',
    angle: 'Slight Tilt Down',
    movement: 'Slow Pan',
  },

  // Medium Shots
  mediumDialogue: {
    lens_mm: 50,
    aperture: 'f/2.8',
    iso: 400,
    height: 'Eye Level',
    angle: 'Straight On',
    movement: 'Subtle Push In',
  },
  mediumWalkTalk: {
    lens_mm: 35,
    aperture: 'f/4',
    iso: 800,
    height: 'Shoulder Level',
    angle: 'Profile',
    movement: 'Tracking Alongside',
  },
  mediumGroup: {
    lens_mm: 40,
    aperture: 'f/5.6',
    iso: 640,
    height: 'Eye Level',
    angle: 'Three-Quarter',
    movement: 'Static',
  },

  // Close-ups
  closeUpIntimate: {
    lens_mm: 85,
    aperture: 'f/1.8',
    iso: 200,
    height: 'Eye Level',
    angle: 'Straight On',
    movement: 'Locked Off',
  },
  closeUpDramatic: {
    lens_mm: 100,
    aperture: 'f/2',
    iso: 400,
    height: 'Slightly Low',
    angle: 'Three-Quarter',
    movement: 'Slow Push In',
  },
  closeUpInsert: {
    lens_mm: 100,
    aperture: 'f/4',
    iso: 400,
    height: 'Top Down',
    angle: '90° Down',
    movement: 'Static or Macro Slide',
  },

  // Extreme Close-ups
  extremeCloseUpEyes: {
    lens_mm: 135,
    aperture: 'f/2.8',
    iso: 200,
    height: 'Eye Level',
    angle: 'Direct',
    movement: 'Locked Off',
  },
  extremeCloseUpMacro: {
    lens_mm: 100, // Macro lens
    aperture: 'f/8',
    iso: 400,
    height: 'Variable',
    angle: 'Perpendicular',
    movement: 'Focus Pull',
  },

  // Special Shots
  overTheShoulder: {
    lens_mm: 75,
    aperture: 'f/2.8',
    iso: 400,
    height: 'Shoulder Level',
    angle: 'Over Shoulder',
    movement: 'Static',
  },
  pointOfView: {
    lens_mm: 50,
    aperture: 'f/4',
    iso: 800,
    height: 'Eye Level',
    angle: 'Subjective',
    movement: 'Handheld',
  },
  aerial: {
    lens_mm: 24,
    aperture: 'f/8',
    iso: 200,
    height: 'Drone/Helicopter',
    angle: "Bird's Eye",
    movement: 'Sweeping',
  },
  lowAngleHero: {
    lens_mm: 28,
    aperture: 'f/4',
    iso: 400,
    height: 'Ground Level',
    angle: 'Looking Up',
    movement: 'Static or Tilt Up',
  },
  highAngleVulnerable: {
    lens_mm: 35,
    aperture: 'f/4',
    iso: 400,
    height: 'Elevated',
    angle: 'Looking Down',
    movement: 'Static or Slow Push',
  },

  // Genre Specific
  noirShadow: {
    lens_mm: 50,
    aperture: 'f/2',
    iso: 800,
    height: 'Low Angle',
    angle: 'Dutch 20°',
    movement: 'Static',
  },
  westernStandoff: {
    lens_mm: 135,
    aperture: 'f/5.6',
    iso: 400,
    height: 'Hip Level',
    angle: 'Straight On',
    movement: 'Static',
  },
  horrorCreeping: {
    lens_mm: 28,
    aperture: 'f/1.8',
    iso: 1600,
    height: 'Variable',
    angle: 'Off-Kilter',
    movement: 'Slow Dolly',
  },
  sciFiCorridor: {
    lens_mm: 18,
    aperture: 'f/2.8',
    iso: 800,
    height: 'Eye Level',
    angle: 'One-Point Perspective',
    movement: 'Steadicam Forward',
  },
  romanceGoldenHour: {
    lens_mm: 85,
    aperture: 'f/1.4',
    iso: 200,
    height: 'Eye Level',
    angle: 'Three-Quarter',
    movement: 'Slow Circular Dolly',
  },
}

// Shot type descriptions for UI
export const SHOT_TYPES = {
  'Extreme Wide Shot': {
    abbreviation: 'EWS',
    description: 'Shows the subject from a distance, emphasizing the environment',
    typicalLens: '14-24mm',
    usage: 'Establishing location, showing isolation, epic scale',
  },
  'Wide Shot': {
    abbreviation: 'WS',
    description: 'Shows the full subject and their surroundings',
    typicalLens: '24-35mm',
    usage: 'Establishing shots, showing full body action',
  },
  'Medium Wide Shot': {
    abbreviation: 'MWS',
    description: 'Shows the subject from knees up',
    typicalLens: '35-50mm',
    usage: 'Character introduction, group scenes',
  },
  'Medium Shot': {
    abbreviation: 'MS',
    description: 'Shows the subject from waist up',
    typicalLens: '50-75mm',
    usage: 'Standard dialogue, general coverage',
  },
  'Medium Close-Up': {
    abbreviation: 'MCU',
    description: 'Shows the subject from chest up',
    typicalLens: '75-85mm',
    usage: 'Intimate dialogue, emotional moments',
  },
  'Close-Up': {
    abbreviation: 'CU',
    description: "Shows the subject's face filling the frame",
    typicalLens: '85-135mm',
    usage: 'Emotional impact, important details',
  },
  'Extreme Close-Up': {
    abbreviation: 'ECU',
    description: 'Shows a specific detail like eyes or hands',
    typicalLens: '100-200mm or macro',
    usage: 'Intense emotion, crucial details',
  },
}

// Lighting color temperatures
export const COLOR_TEMPERATURES = {
  candle: { kelvin: 1800, description: 'Candle flame', mood: 'Intimate, warm' },
  tungsten: { kelvin: 3200, description: 'Traditional film lights', mood: 'Warm, interior' },
  goldenHour: { kelvin: 3500, description: 'Sunset/sunrise', mood: 'Romantic, nostalgic' },
  fluorescent: { kelvin: 4500, description: 'Office lighting', mood: 'Neutral, clinical' },
  daylight: { kelvin: 5600, description: 'Noon sunlight', mood: 'Natural, balanced' },
  overcast: { kelvin: 6500, description: 'Cloudy day', mood: 'Soft, diffused' },
  shade: { kelvin: 7500, description: 'Open shade', mood: 'Cool, calm' },
  blueHour: { kelvin: 10000, description: 'Twilight', mood: 'Mysterious, ethereal' },
}

// Movement speeds
export const MOVEMENT_SPEEDS = {
  static: { speed: '0', description: 'Locked off shot', effect: 'Stable, observational' },
  creep: { speed: '0.5-1 cm/s', description: 'Barely perceptible', effect: 'Subconscious tension' },
  slow: { speed: '2-5 cm/s', description: 'Gentle movement', effect: 'Contemplative, smooth' },
  walking: { speed: '10-15 cm/s', description: 'Match walking pace', effect: 'Natural, following' },
  fast: { speed: '20-30 cm/s', description: 'Quick movement', effect: 'Energetic, urgent' },
  running: { speed: '40+ cm/s', description: 'Match running pace', effect: 'Chase, panic, action' },
  whip: { speed: 'Instant', description: 'Snap movement', effect: 'Transition, shock, energy' },
}

// Framing guidelines
export const FRAMING_GUIDES = {
  headroom: {
    standard: '10-15% of frame height above head',
    tight: '5% for intensity',
    loose: '20% for vulnerability',
  },
  lookingRoom: {
    standard: 'More space in direction of gaze',
    profile: '2/3 space in front, 1/3 behind',
    direct: 'Centered for confrontation',
  },
  walkingRoom: {
    standard: 'More space in direction of movement',
    leading: 'Subject in back 1/3 moving forward',
    following: 'Subject in front 1/3 moving away',
  },
}

// Quick lighting ratios
export const LIGHTING_RATIOS = {
  '1:1': { description: 'Flat lighting', mood: 'Commercial, beauty', shadow: 'Minimal' },
  '2:1': { description: 'Standard ratio', mood: 'Natural, pleasant', shadow: 'Soft' },
  '3:1': { description: 'Moderate contrast', mood: 'Classic cinema', shadow: 'Defined' },
  '4:1': { description: 'Dramatic lighting', mood: 'Serious, artistic', shadow: 'Strong' },
  '8:1': { description: 'Film noir', mood: 'Mysterious, dramatic', shadow: 'Deep' },
  '16:1': { description: 'Extreme contrast', mood: 'Thriller, horror', shadow: 'Crushed' },
}

// Focus pull timing
export const FOCUS_PULL_TIMING = {
  snap: { duration: '0.1-0.3s', usage: 'Shock, surprise, immediate attention' },
  quick: { duration: '0.5-1s', usage: 'Standard redirect of attention' },
  medium: { duration: '1-2s', usage: 'Smooth transition between subjects' },
  slow: { duration: '2-4s', usage: 'Contemplative, emotional revelation' },
  drift: { duration: '4s+', usage: 'Dreamlike, losing consciousness' },
}

// Export a helper function to get recommended camera package
export function getRecommendedCameraPackage(
  shotType: string,
  mood?: string,
  genre?: string
): CameraPackage {
  // Logic to recommend camera package based on parameters
  let recommendedPackage = CAMERA_PACKAGES.mediumDialogue // Default

  const shotTypeLower = shotType.toLowerCase()
  const moodLower = mood?.toLowerCase() || ''
  const genreLower = genre?.toLowerCase() || ''

  // Shot type matching
  if (shotTypeLower.includes('wide') || shotTypeLower.includes('establishing')) {
    if (moodLower.includes('action')) {
      recommendedPackage = CAMERA_PACKAGES.wideAction
    } else if (shotTypeLower.includes('landscape')) {
      recommendedPackage = CAMERA_PACKAGES.wideLandscape
    } else {
      recommendedPackage = CAMERA_PACKAGES.wideEstablishing
    }
  } else if (shotTypeLower.includes('medium')) {
    if (shotTypeLower.includes('group')) {
      recommendedPackage = CAMERA_PACKAGES.mediumGroup
    } else if (moodLower.includes('walk') || moodLower.includes('moving')) {
      recommendedPackage = CAMERA_PACKAGES.mediumWalkTalk
    } else {
      recommendedPackage = CAMERA_PACKAGES.mediumDialogue
    }
  } else if (shotTypeLower.includes('close')) {
    if (shotTypeLower.includes('extreme')) {
      if (shotTypeLower.includes('eye')) {
        recommendedPackage = CAMERA_PACKAGES.extremeCloseUpEyes
      } else {
        recommendedPackage = CAMERA_PACKAGES.extremeCloseUpMacro
      }
    } else {
      if (moodLower.includes('dramatic')) {
        recommendedPackage = CAMERA_PACKAGES.closeUpDramatic
      } else if (shotTypeLower.includes('insert')) {
        recommendedPackage = CAMERA_PACKAGES.closeUpInsert
      } else {
        recommendedPackage = CAMERA_PACKAGES.closeUpIntimate
      }
    }
  } else if (shotTypeLower.includes('over') && shotTypeLower.includes('shoulder')) {
    recommendedPackage = CAMERA_PACKAGES.overTheShoulder
  } else if (shotTypeLower.includes('pov') || shotTypeLower.includes('point of view')) {
    recommendedPackage = CAMERA_PACKAGES.pointOfView
  } else if (shotTypeLower.includes('aerial') || shotTypeLower.includes('drone')) {
    recommendedPackage = CAMERA_PACKAGES.aerial
  }

  // Genre-specific overrides
  if (genreLower.includes('noir')) {
    recommendedPackage = CAMERA_PACKAGES.noirShadow
  } else if (genreLower.includes('western')) {
    recommendedPackage = CAMERA_PACKAGES.westernStandoff
  } else if (genreLower.includes('horror')) {
    recommendedPackage = CAMERA_PACKAGES.horrorCreeping
  } else if (genreLower.includes('sci-fi') || genreLower.includes('scifi')) {
    recommendedPackage = CAMERA_PACKAGES.sciFiCorridor
  } else if (genreLower.includes('romance') && moodLower.includes('golden')) {
    recommendedPackage = CAMERA_PACKAGES.romanceGoldenHour
  }

  // Mood-based adjustments
  if (moodLower.includes('hero') || moodLower.includes('power')) {
    recommendedPackage = CAMERA_PACKAGES.lowAngleHero
  } else if (moodLower.includes('vulnerable') || moodLower.includes('weak')) {
    recommendedPackage = CAMERA_PACKAGES.highAngleVulnerable
  }

  return recommendedPackage
}
