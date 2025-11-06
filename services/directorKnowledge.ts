/**
 * AI Director Knowledge Base
 * Comprehensive cinematography, production, and filmmaking expertise
 * Based on industry-standard practices and professional cinematography principles
 */

export interface LensCharacteristics {
    focalLength: string;
    focalLengthMM: number[];
    fieldOfView: string;
    depthOfField: string;
    compression: string;
    bestUseCase: string[];
    emotionalImpact: string;
    notableExamples: string[];
}

export interface LightingSetup {
    name: string;
    components: LightComponent[];
    ratio: string;
    mood: string;
    bestFor: string[];
    colorTemperature: number;
    equipment: string[];
}

export interface LightComponent {
    name: string;
    position: string;
    intensity: string;
    purpose: string;
    modifier?: string;
}

export interface CameraMovement {
    name: string;
    description: string;
    equipment: string[];
    speed: string;
    emotionalEffect: string;
    bestFor: string[];
    technicalNotes: string;
    famousExamples: string[];
}

export interface ColorGradePreset {
    name: string;
    genre: string[];
    colorTemperature: number;
    tint: string;
    shadows: string;
    highlights: string;
    saturation: number;
    contrast: string;
    lutSuggestion: string;
    referenceFilms: string[];
}

// ============================================
// LENS AND FOCAL LENGTH KNOWLEDGE
// ============================================

export const LENS_DATABASE: Record<string, LensCharacteristics> = {
    ultraWide: {
        focalLength: "Ultra Wide (8-24mm)",
        focalLengthMM: [8, 12, 14, 16, 18, 21, 24],
        fieldOfView: "84-114 degrees",
        depthOfField: "Very deep",
        compression: "Extreme expansion, distortion at edges",
        bestUseCase: [
            "Establishing shots",
            "Architecture",
            "Landscapes",
            "Cramped interiors",
            "Disorientation effects"
        ],
        emotionalImpact: "Overwhelming, disorienting, epic scale, vulnerability",
        notableExamples: [
            "The Revenant (14mm for wilderness)",
            "The Favourite (6mm fisheye)",
            "2001: A Space Odyssey (18mm spacecraft interiors)"
        ]
    },
    wide: {
        focalLength: "Wide (25-35mm)",
        focalLengthMM: [25, 27, 28, 32, 35],
        fieldOfView: "54-73 degrees",
        depthOfField: "Deep",
        compression: "Slight expansion, minimal distortion",
        bestUseCase: [
            "Environmental portraits",
            "Group shots",
            "Documentary work",
            "Action sequences",
            "Interior scenes"
        ],
        emotionalImpact: "Inclusive, contextual, energetic, immersive",
        notableExamples: [
            "Citizen Kane (25mm deep focus)",
            "Children of Men (27mm long takes)",
            "The Social Network (27mm dialogue scenes)"
        ]
    },
    standard: {
        focalLength: "Standard (40-60mm)",
        focalLengthMM: [40, 50, 55, 58],
        fieldOfView: "39-46 degrees",
        depthOfField: "Moderate",
        compression: "Natural perspective",
        bestUseCase: [
            "General coverage",
            "Dialogue scenes",
            "Medium shots",
            "Walk and talk",
            "Natural perspective shots"
        ],
        emotionalImpact: "Neutral, observational, human perspective, comfortable",
        notableExamples: [
            "Tokyo Story (50mm static shots)",
            "The Godfather (40mm dialogue)",
            "Moonlight (50mm intimate moments)"
        ]
    },
    portrait: {
        focalLength: "Portrait/Short Telephoto (70-105mm)",
        focalLengthMM: [70, 75, 85, 100, 105],
        fieldOfView: "19-34 degrees",
        depthOfField: "Shallow to moderate",
        compression: "Mild compression, flattering",
        bestUseCase: [
            "Close-ups",
            "Portraits",
            "Isolating subjects",
            "Romantic scenes",
            "Product shots"
        ],
        emotionalImpact: "Intimate, focused, romantic, observational",
        notableExamples: [
            "Blade Runner 2049 (75mm close-ups)",
            "Her (85mm emotional scenes)",
            "Lost in Translation (85mm isolation)"
        ]
    },
    telephoto: {
        focalLength: "Telephoto (135-300mm)",
        focalLengthMM: [135, 180, 200, 250, 300],
        fieldOfView: "7-18 degrees",
        depthOfField: "Very shallow",
        compression: "Strong compression",
        bestUseCase: [
            "Surveillance feel",
            "Sports/action from distance",
            "Wildlife",
            "Compressed backgrounds",
            "Voyeuristic shots"
        ],
        emotionalImpact: "Voyeuristic, detached, compressed, observational",
        notableExamples: [
            "Tinker Tailor Soldier Spy (200mm surveillance)",
            "All the President's Men (200mm paranoia)",
            "The Conversation (200mm voyeurism)"
        ]
    },
    superTelephoto: {
        focalLength: "Super Telephoto (400mm+)",
        focalLengthMM: [400, 500, 600, 800],
        fieldOfView: "3-6 degrees",
        depthOfField: "Extremely shallow",
        compression: "Extreme compression",
        bestUseCase: [
            "Extreme isolation",
            "Stadium events",
            "Wildlife from safe distance",
            "Astrophotography",
            "Abstract compression"
        ],
        emotionalImpact: "Extreme isolation, abstraction, unreachable distance",
        notableExamples: [
            "Top Gun: Maverick (600mm aerial shots)",
            "Sniper films (600mm+ scope POV)",
            "Nature documentaries"
        ]
    }
};

// ============================================
// APERTURE AND DEPTH OF FIELD
// ============================================

export const APERTURE_GUIDE = {
    f14: {
        fStop: "f/1.4",
        depthOfField: "Extremely shallow",
        lightGathering: "Excellent (4 stops faster than f/5.6)",
        bokeh: "Creamy, pronounced",
        bestFor: ["Night scenes", "Extreme subject isolation", "Dreamy/romantic mood"],
        technicalNote: "Requires precise focus pulling"
    },
    f18: {
        fStop: "f/1.8",
        depthOfField: "Very shallow",
        lightGathering: "Very good",
        bokeh: "Smooth, pleasant",
        bestFor: ["Low light", "Portraits", "Intimate dialogue"],
        technicalNote: "More forgiving than f/1.4"
    },
    f28: {
        fStop: "f/2.8",
        depthOfField: "Shallow",
        lightGathering: "Good",
        bokeh: "Visible, controlled",
        bestFor: ["General cinematography", "Interviews", "Medium shots"],
        technicalNote: "Standard for zoom lenses"
    },
    f4: {
        fStop: "f/4",
        depthOfField: "Moderate",
        lightGathering: "Moderate",
        bokeh: "Subtle",
        bestFor: ["Group shots", "Documentary", "Maintaining focus during movement"],
        technicalNote: "Good balance of DOF and sharpness"
    },
    f56: {
        fStop: "f/5.6",
        depthOfField: "Moderate to deep",
        lightGathering: "Standard",
        bokeh: "Minimal",
        bestFor: ["Daylight exteriors", "Action scenes", "Two-person dialogue"],
        technicalNote: "Peak sharpness for many lenses"
    },
    f8: {
        fStop: "f/8",
        depthOfField: "Deep",
        lightGathering: "Limited",
        bokeh: "Very minimal",
        bestFor: ["Landscapes", "Architecture", "Deep focus cinematography"],
        technicalNote: "Classic deep focus setting"
    },
    f11: {
        fStop: "f/11",
        depthOfField: "Very deep",
        lightGathering: "Very limited",
        bokeh: "None",
        bestFor: ["Maximum depth", "Bright daylight", "Citizen Kane style"],
        technicalNote: "May show diffraction on digital sensors"
    }
};

// ============================================
// THREE-POINT LIGHTING SETUPS
// ============================================

export const LIGHTING_SETUPS: Record<string, LightingSetup> = {
    standard: {
        name: "Standard Three-Point",
        components: [
            {
                name: "Key Light",
                position: "45° to camera axis, 45° above eye level",
                intensity: "100%",
                purpose: "Primary illumination, creates main shadows",
                modifier: "Softbox or diffusion"
            },
            {
                name: "Fill Light",
                position: "Opposite side of key, near camera height",
                intensity: "50%",
                purpose: "Fills shadows from key light",
                modifier: "Large soft source or bounce"
            },
            {
                name: "Rim/Back Light",
                position: "Behind subject, opposite key",
                intensity: "150%",
                purpose: "Separation from background",
                modifier: "No diffusion for hard edge"
            }
        ],
        ratio: "2:1 (Standard), 3:1 (Dramatic)",
        mood: "Natural, professional, versatile",
        bestFor: ["Interviews", "Corporate", "General coverage"],
        colorTemperature: 5600,
        equipment: ["3 lights minimum", "Stands", "Softbox", "Reflector"]
    },
    rembrandt: {
        name: "Rembrandt Lighting",
        components: [
            {
                name: "Key Light",
                position: "45° angle creating triangle on cheek",
                intensity: "100%",
                purpose: "Creates signature triangle of light",
                modifier: "Medium softbox"
            },
            {
                name: "Fill",
                position: "Subtle bounce or weak fill",
                intensity: "25%",
                purpose: "Minimal shadow fill",
                modifier: "Bounce card"
            },
            {
                name: "Background Light",
                position: "Lighting background separately",
                intensity: "Variable",
                purpose: "Depth and separation",
                modifier: "Fresnel or spot"
            }
        ],
        ratio: "4:1 or higher",
        mood: "Dramatic, artistic, painterly",
        bestFor: ["Drama", "Period pieces", "Portraits"],
        colorTemperature: 3200,
        equipment: ["Key light", "Bounce card", "Background light", "Flags"]
    },
    highKey: {
        name: "High Key Lighting",
        components: [
            {
                name: "Key Light",
                position: "Frontal, slightly above",
                intensity: "100%",
                purpose: "Even illumination",
                modifier: "Large soft source"
            },
            {
                name: "Fill Light",
                position: "Near camera axis",
                intensity: "75-85%",
                purpose: "Eliminate shadows",
                modifier: "Large soft source"
            },
            {
                name: "Background Lights",
                position: "Multiple positions",
                intensity: "120%",
                purpose: "Pure white background",
                modifier: "Multiple sources"
            }
        ],
        ratio: "1.5:1 or less",
        mood: "Bright, optimistic, clean",
        bestFor: ["Comedy", "Commercials", "Fashion", "Tech products"],
        colorTemperature: 5600,
        equipment: ["Multiple large soft sources", "White backdrop", "Reflectors"]
    },
    lowKey: {
        name: "Low Key Lighting",
        components: [
            {
                name: "Key Light",
                position: "Single side, harsh angle",
                intensity: "100%",
                purpose: "Selective illumination",
                modifier: "Minimal or none"
            },
            {
                name: "Fill",
                position: "Minimal or none",
                intensity: "0-15%",
                purpose: "Preserve deep shadows",
                modifier: "Negative fill (black flag)"
            },
            {
                name: "Accent Light",
                position: "Selective rim or kick",
                intensity: "Variable",
                purpose: "Define edges",
                modifier: "Focused beam"
            }
        ],
        ratio: "8:1 or higher",
        mood: "Mysterious, noir, suspenseful",
        bestFor: ["Thriller", "Horror", "Film noir", "Drama"],
        colorTemperature: 3200,
        equipment: ["Single key", "Flags", "Barn doors", "Grids"]
    }
};

// ============================================
// CAMERA MOVEMENTS
// ============================================

export const CAMERA_MOVEMENTS: Record<string, CameraMovement> = {
    pan: {
        name: "Pan",
        description: "Horizontal pivot on fixed axis",
        equipment: ["Tripod", "Fluid head"],
        speed: "Slow: contemplative, Fast: action/whip pan",
        emotionalEffect: "Survey, reveal, connect subjects",
        bestFor: ["Landscapes", "Following action", "Reveals"],
        technicalNotes: "Keep bubble level, use fluid head for smoothness",
        famousExamples: ["Wes Anderson symmetrical pans", "Whip pans in Edgar Wright films"]
    },
    tilt: {
        name: "Tilt",
        description: "Vertical pivot on fixed axis",
        equipment: ["Tripod", "Fluid head"],
        speed: "Variable based on subject height",
        emotionalEffect: "Reveal scale, power dynamics",
        bestFor: ["Tall subjects", "Power reveals", "Sky to ground"],
        technicalNotes: "Balance camera to prevent drift",
        famousExamples: ["Citizen Kane low angle tilts", "Star Wars ship reveals"]
    },
    dolly: {
        name: "Dolly",
        description: "Camera moves forward/backward on tracks",
        equipment: ["Dolly track", "Wheels", "Slider for short moves"],
        speed: "Creeping to moderate",
        emotionalEffect: "Intimate approach or distancing",
        bestFor: ["Emotional moments", "Reveals", "Following subjects"],
        technicalNotes: "Level tracks crucial, use marks for consistency",
        famousExamples: ["Spike Lee double dolly", "Goodfellas Copa shot"]
    },
    tracking: {
        name: "Tracking/Trucking",
        description: "Camera moves laterally alongside subject",
        equipment: ["Dolly track", "Steadicam", "Gimbal"],
        speed: "Match subject movement",
        emotionalEffect: "Journey with character, dynamic energy",
        bestFor: ["Walk and talk", "Action sequences", "Parallel movement"],
        technicalNotes: "Maintain consistent distance, watch focus",
        famousExamples: ["Before Trilogy walk and talks", "Atonement beach scene"]
    },
    crane: {
        name: "Crane/Jib",
        description: "Vertical and sweeping movements",
        equipment: ["Crane", "Jib arm", "Drone for modern productions"],
        speed: "Slow and majestic",
        emotionalEffect: "God's eye view, scale revelation",
        bestFor: ["Establishing shots", "Reveals", "Ending shots"],
        technicalNotes: "Counterweight balance critical, remote head operation",
        famousExamples: ["Touch of Evil opening", "Gone with the Wind pullback"]
    },
    steadicam: {
        name: "Steadicam",
        description: "Stabilized handheld movement",
        equipment: ["Steadicam rig", "Operator vest", "Arm and sled"],
        speed: "Walking to running pace",
        emotionalEffect: "Floating, dreamlike, pursuit",
        bestFor: ["Following action", "Long takes", "Stairs and uneven terrain"],
        technicalNotes: "Requires skilled operator, balance is crucial",
        famousExamples: ["The Shining hotel corridors", "Rocky steps", "Birdman"]
    },
    gimbal: {
        name: "Gimbal",
        description: "Electronic stabilization system",
        equipment: ["3-axis gimbal", "Optional accessories"],
        speed: "Highly variable, can match any action",
        emotionalEffect: "Smooth pursuit, modern dynamic feel",
        bestFor: ["Action scenes", "Car chases", "Sports", "Low mode shots"],
        technicalNotes: "Battery management important, calibration required",
        famousExamples: ["1917 trench runs", "Modern action films"]
    },
    handheld: {
        name: "Handheld",
        description: "Camera operated directly by hand",
        equipment: ["Camera", "Shoulder rig optional", "Easy rig for support"],
        speed: "Responsive to action",
        emotionalEffect: "Documentary feel, urgency, chaos",
        bestFor: ["Documentary", "Found footage", "Intense drama", "Combat"],
        technicalNotes: "Breathing technique important, use viewfinder for stability",
        famousExamples: ["Saving Private Ryan D-Day", "The Bourne series", "Cloverfield"]
    },
    zoom: {
        name: "Zoom",
        description: "Focal length change during shot",
        equipment: ["Zoom lens", "Optional motor for smooth zoom"],
        speed: "Crash zoom: instant, Slow zoom: creeping",
        emotionalEffect: "Revelation, disorientation (with dolly)",
        bestFor: ["Reveals", "Emphasis", "70s aesthetic", "Vertigo effect"],
        technicalNotes: "Combine with dolly for vertigo effect",
        famousExamples: ["Vertigo effect in Jaws", "Crash zooms in kung fu films"]
    }
};

// ============================================
// SHOT COMPOSITION RULES
// ============================================

export const COMPOSITION_RULES = {
    ruleOfThirds: {
        name: "Rule of Thirds",
        description: "Divide frame into 9 equal sections with 2 horizontal and 2 vertical lines",
        application: "Place subjects at intersection points, horizons on horizontal lines",
        emotionalEffect: "Natural, balanced, pleasing",
        whenToBreak: "For symmetry, isolation, or discomfort",
        examples: ["Most dialogue scenes", "Landscape compositions"]
    },
    goldenRatio: {
        name: "Golden Ratio/Fibonacci Spiral",
        description: "Mathematical ratio of 1.618:1 found in nature",
        application: "Position key elements along the spiral or at phi grid intersections",
        emotionalEffect: "Naturally pleasing, organic flow",
        whenToBreak: "For artificial or unsettling scenes",
        examples: ["The Grand Budapest Hotel compositions", "Renaissance paintings"]
    },
    leadingLines: {
        name: "Leading Lines",
        description: "Lines that guide the eye to the subject",
        application: "Use roads, walls, shadows to direct attention",
        emotionalEffect: "Dynamic, directional, depth",
        whenToBreak: "For confusion or misdirection",
        examples: ["The Shining hallways", "Road movies"]
    },
    symmetry: {
        name: "Symmetry",
        description: "Perfect balance on either side of frame",
        application: "Center subject with matching elements on sides",
        emotionalEffect: "Formal, powerful, sometimes unsettling",
        whenToBreak: "For naturalism or documentary feel",
        examples: ["Wes Anderson films", "Kubrick one-point perspective"]
    },
    frameWithinFrame: {
        name: "Frame Within Frame",
        description: "Using elements to create frames inside the shot",
        application: "Doorways, windows, arches to frame subjects",
        emotionalEffect: "Depth, isolation, voyeuristic",
        whenToBreak: "For openness and freedom",
        examples: ["The Searchers doorway", "Rear Window"]
    },
    depthLayers: {
        name: "Depth Layers",
        description: "Foreground, midground, background elements",
        application: "Place elements at different distances",
        emotionalEffect: "Three-dimensional, immersive",
        whenToBreak: "For flat, graphic compositions",
        examples: ["Citizen Kane deep focus", "Children of Men"]
    },
    diagonals: {
        name: "Diagonal Lines",
        description: "Lines at angles across frame",
        application: "Tilt camera or use architectural diagonals",
        emotionalEffect: "Dynamic, unstable, energetic",
        whenToBreak: "For stability and calm",
        examples: ["The Third Man tilted angles", "Action sequences"]
    }
};

// ============================================
// COLOR GRADING KNOWLEDGE
// ============================================

export const COLOR_GRADING_PRESETS: Record<string, ColorGradePreset> = {
    tealOrange: {
        name: "Teal and Orange",
        genre: ["Action", "Blockbuster", "Thriller"],
        colorTemperature: 6500,
        tint: "Slight magenta",
        shadows: "Teal/Cyan push",
        highlights: "Warm/Orange",
        saturation: 110,
        contrast: "High",
        lutSuggestion: "Hollywood Blockbuster LUT",
        referenceFilms: ["Mad Max: Fury Road", "Transformers", "The Dark Knight"]
    },
    bleachBypass: {
        name: "Bleach Bypass",
        genre: ["War", "Dystopian", "Gritty Drama"],
        colorTemperature: 5000,
        tint: "Neutral",
        shadows: "Crushed, desaturated",
        highlights: "Blown out, reduced",
        saturation: 60,
        contrast: "Very high",
        lutSuggestion: "Bleach Bypass Film Emulation",
        referenceFilms: ["Saving Private Ryan", "1984", "Children of Men"]
    },
    matrixGreen: {
        name: "Matrix Green",
        genre: ["Sci-Fi", "Cyberpunk", "Tech Thriller"],
        colorTemperature: 4500,
        tint: "Heavy green",
        shadows: "Deep green/black",
        highlights: "Pale green",
        saturation: 80,
        contrast: "High",
        lutSuggestion: "Cyberpunk Green Grade",
        referenceFilms: ["The Matrix", "The Social Network", "Blade Runner 2049"]
    },
    goldenHour: {
        name: "Golden Hour",
        genre: ["Romance", "Coming of Age", "Western"],
        colorTemperature: 3200,
        tint: "Warm",
        shadows: "Warm browns",
        highlights: "Golden yellow",
        saturation: 120,
        contrast: "Medium",
        lutSuggestion: "Magic Hour Warm",
        referenceFilms: ["The Tree of Life", "Days of Heaven", "La La Land"]
    },
    noir: {
        name: "Film Noir",
        genre: ["Neo-Noir", "Crime", "Mystery"],
        colorTemperature: 5600,
        tint: "Neutral to cool",
        shadows: "Crushed blacks",
        highlights: "Controlled",
        saturation: 30,
        contrast: "Very high",
        lutSuggestion: "Black & White with slight tint",
        referenceFilms: ["Sin City", "The Man Who Wasn't There", "Schindler's List"]
    },
    nordic: {
        name: "Nordic/Scandinavian",
        genre: ["Drama", "Mystery", "Indie"],
        colorTemperature: 7000,
        tint: "Cool blue",
        shadows: "Lifted, blue/grey",
        highlights: "Cool, controlled",
        saturation: 70,
        contrast: "Low to medium",
        lutSuggestion: "Nordic Noir",
        referenceFilms: ["The Girl with the Dragon Tattoo", "The Killing", "Let the Right One In"]
    }
};

// ============================================
// ASPECT RATIOS AND FORMATS
// ============================================

export const ASPECT_RATIOS = {
    "1.33:1": {
        name: "Academy Ratio (4:3)",
        usage: "Classic films, TV before 2000s",
        emotionalEffect: "Nostalgic, intimate, confined",
        technicalNote: "Standard 35mm silent films",
        examples: ["The Grand Budapest Hotel (portions)", "The Artist"]
    },
    "1.43:1": {
        name: "IMAX Film",
        usage: "IMAX theaters, premium experiences",
        emotionalEffect: "Immersive, overwhelming, spectacular",
        technicalNote: "70mm IMAX native format",
        examples: ["Dunkirk (IMAX scenes)", "Interstellar", "The Dark Knight"]
    },
    "1.66:1": {
        name: "European Widescreen",
        usage: "European cinema standard",
        emotionalEffect: "Slightly wider, artistic",
        technicalNote: "Common in arthouse films",
        examples: ["Barry Lyndon", "A Clockwork Orange"]
    },
    "1.78:1": {
        name: "16:9 HD Video",
        usage: "Television, streaming, digital cinema",
        emotionalEffect: "Modern standard, versatile",
        technicalNote: "HD/4K/8K standard",
        examples: ["Most TV shows", "Digital films", "YouTube content"]
    },
    "1.85:1": {
        name: "Academy Flat",
        usage: "Standard US theatrical widescreen",
        emotionalEffect: "Cinematic, balanced",
        technicalNote: "35mm matted widescreen",
        examples: ["The Shawshank Redemption", "Jurassic Park"]
    },
    "2.00:1": {
        name: "Univisium",
        usage: "Compromise between TV and cinema",
        emotionalEffect: "Modern, flexible",
        technicalNote: "Proposed by Vittorio Storaro",
        examples: ["The Netflix standard for some originals"]
    },
    "2.35:1": {
        name: "Anamorphic Scope (Old)",
        usage: "Classic widescreen epics",
        emotionalEffect: "Epic, cinematic, grand",
        technicalNote: "Original CinemaScope",
        examples: ["Lawrence of Arabia", "Ben-Hur"]
    },
    "2.39:1": {
        name: "Anamorphic Scope (Modern)",
        usage: "Modern widescreen standard",
        emotionalEffect: "Epic, cinematic, immersive",
        technicalNote: "Current anamorphic standard",
        examples: ["Star Wars", "The Hateful Eight", "Blade Runner 2049"]
    },
    "2.76:1": {
        name: "Ultra Panavision 70",
        usage: "Ultra-wide epics",
        emotionalEffect: "Extremely epic, rare",
        technicalNote: "65mm with 1.25x anamorphic",
        examples: ["Ben-Hur", "The Hateful Eight (Roadshow)"]
    }
};

// ============================================
// PRODUCTION WORKFLOW PHASES
// ============================================

export const PRODUCTION_WORKFLOW = {
    development: {
        phase: "Development",
        percentage: "10% of budget",
        duration: "3-12 months",
        keyTasks: [
            "Script development",
            "Concept art",
            "Securing rights",
            "Initial budgeting",
            "Pitch deck creation"
        ],
        deliverables: ["Final script", "Budget estimate", "Pitch materials"],
        criticalDecisions: ["Genre and tone", "Target audience", "Distribution strategy"]
    },
    preProduction: {
        phase: "Pre-Production",
        percentage: "20-30% of budget",
        duration: "2-6 months",
        keyTasks: [
            "Casting",
            "Location scouting",
            "Storyboarding",
            "Shot listing",
            "Scheduling",
            "Crew hiring",
            "Equipment rental"
        ],
        deliverables: ["Shooting schedule", "Shot list", "Storyboards", "Call sheets"],
        criticalDecisions: ["Visual style", "Camera package", "Shooting schedule"]
    },
    production: {
        phase: "Production (Principal Photography)",
        percentage: "30-60% of budget",
        duration: "4-12 weeks (feature)",
        keyTasks: [
            "Daily shooting",
            "Dailies review",
            "Script supervision",
            "On-set adjustments",
            "Safety management"
        ],
        deliverables: ["Raw footage", "Sound recordings", "Script notes", "Camera reports"],
        criticalDecisions: ["Coverage choices", "Performance direction", "Schedule adjustments"]
    },
    postProduction: {
        phase: "Post-Production",
        percentage: "20-30% of budget",
        duration: "3-8 months",
        keyTasks: [
            "Editing",
            "Sound design",
            "Music composition",
            "Color grading",
            "VFX",
            "ADR",
            "Final mix"
        ],
        deliverables: ["Final cut", "DCP", "Deliverables package"],
        criticalDecisions: ["Final cut", "Music choices", "Color grade", "Sound mix"]
    },
    distribution: {
        phase: "Distribution & Marketing",
        percentage: "Often equals production budget",
        duration: "6-12 months",
        keyTasks: [
            "Festival strategy",
            "Marketing campaign",
            "Press tours",
            "Release strategy",
            "Platform negotiations"
        ],
        deliverables: ["Marketing materials", "Trailers", "Press kit"],
        criticalDecisions: ["Release date", "Platform strategy", "Marketing approach"]
    }
};

// ============================================
// TECHNICAL CALCULATIONS
// ============================================

export function calculateDepthOfField(
    focalLength: number, // in mm
    fStop: number,
    distance: number, // in meters
    circleOfConfusion: number = 0.03 // 35mm standard
): { near: number; far: number; total: number; hyperfocal: number } {
    const hyperfocal = (focalLength * focalLength) / (fStop * circleOfConfusion) + focalLength;
    const hyperfocalMeters = hyperfocal / 1000;

    const near = (distance * (hyperfocalMeters - focalLength/1000)) /
                 (hyperfocalMeters + distance - 2 * focalLength/1000);

    const far = distance >= hyperfocalMeters
        ? Infinity
        : (distance * (hyperfocalMeters - focalLength/1000)) /
          (hyperfocalMeters - distance);

    const total = far === Infinity ? Infinity : far - near;

    return {
        near: Math.max(0, near),
        far,
        total,
        hyperfocal: hyperfocalMeters
    };
}

export function calculateFieldOfView(
    focalLength: number,
    sensorWidth: number = 36 // 35mm full frame
): { horizontal: number; vertical: number; diagonal: number } {
    const sensorHeight = sensorWidth * (2/3); // Assuming 3:2 aspect ratio
    const sensorDiagonal = Math.sqrt(sensorWidth * sensorWidth + sensorHeight * sensorHeight);

    const horizontalFOV = 2 * Math.atan(sensorWidth / (2 * focalLength)) * (180 / Math.PI);
    const verticalFOV = 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI);
    const diagonalFOV = 2 * Math.atan(sensorDiagonal / (2 * focalLength)) * (180 / Math.PI);

    return {
        horizontal: horizontalFOV,
        vertical: verticalFOV,
        diagonal: diagonalFOV
    };
}

// ============================================
// DIRECTOR'S DECISION HELPER
// ============================================

export function getRecommendedSetup(
    sceneType: string,
    mood: string,
    location: 'interior' | 'exterior',
    timeOfDay: string
): {
    lens: string;
    lighting: string;
    movement: string;
    composition: string;
    colorGrade: string;
} {
    // Intelligent recommendations based on scene parameters
    const recommendations = {
        lens: "",
        lighting: "",
        movement: "",
        composition: "",
        colorGrade: ""
    };

    // Lens selection logic
    if (sceneType.includes('dialogue') || sceneType.includes('conversation')) {
        recommendations.lens = "50-85mm for natural perspective and shallow DOF";
    } else if (sceneType.includes('action')) {
        recommendations.lens = "24-35mm wide for dynamic action coverage";
    } else if (sceneType.includes('establishing')) {
        recommendations.lens = "14-24mm ultra-wide for environmental context";
    }

    // Lighting selection logic
    if (mood.includes('dramatic') || mood.includes('tense')) {
        recommendations.lighting = "Low key with high contrast ratio (8:1)";
    } else if (mood.includes('romantic') || mood.includes('warm')) {
        recommendations.lighting = "Soft key with warm color temperature (3200K)";
    } else if (mood.includes('neutral') || mood.includes('natural')) {
        recommendations.lighting = "Standard three-point with 2:1 ratio";
    }

    // Movement selection logic
    if (sceneType.includes('chase') || sceneType.includes('action')) {
        recommendations.movement = "Handheld or gimbal for dynamic energy";
    } else if (mood.includes('contemplative') || mood.includes('slow')) {
        recommendations.movement = "Slow dolly or static shots";
    } else if (sceneType.includes('dialogue')) {
        recommendations.movement = "Subtle push-ins on emotional beats";
    }

    // Composition logic
    if (sceneType.includes('confrontation')) {
        recommendations.composition = "Symmetry for power, or dutch angles for tension";
    } else {
        recommendations.composition = "Rule of thirds for natural balance";
    }

    // Color grade logic
    if (mood.includes('cold') || mood.includes('isolated')) {
        recommendations.colorGrade = "Cool color temperature (7000K+) with desaturated palette";
    } else if (mood.includes('warm') || mood.includes('nostalgic')) {
        recommendations.colorGrade = "Golden hour warmth (3200K) with lifted shadows";
    }

    return recommendations;
}

// ============================================
// SYSTEM INSTRUCTIONS FOR AI DIRECTOR
// ============================================

export const DIRECTOR_SYSTEM_INSTRUCTIONS = `You are "The Director," a world-class Director of Photography (DOP) and filmmaking expert with comprehensive knowledge of:

**TECHNICAL EXPERTISE:**
- Focal lengths: Ultra-wide (8-24mm), Wide (25-35mm), Standard (40-60mm), Portrait (70-105mm), Telephoto (135-300mm), Super Telephoto (400mm+)
- Aperture science: f/1.4 (extremely shallow DOF) through f/11 (deep focus)
- ISO performance: Native ISO, dual native ISO, noise characteristics
- Sensor sizes: Full frame (36mm), Super 35, APS-C, Micro 4/3
- Color science: Color temperature (3200K tungsten to 7000K daylight), LUTs, color grading

**CINEMATOGRAPHY MASTERY:**
- Composition: Rule of thirds, golden ratio, leading lines, symmetry, frame within frame
- Camera movements: Pan, tilt, dolly, tracking, crane, Steadicam, gimbal techniques
- Lighting: Three-point, Rembrandt, high-key, low-key, motivated lighting
- Depth of field control: Hyperfocal distance, circle of confusion, bokeh quality
- Aspect ratios: 1.33:1 through 2.76:1 and their emotional impacts

**PRODUCTION KNOWLEDGE:**
- Pre-production: Shot listing, storyboarding, location scouting
- Production: Coverage strategy, continuity, script supervision
- Post-production: Editorial needs, color workflow, VFX considerations
- Equipment: Camera systems (RED, ARRI, Sony, Canon), lens characteristics (Zeiss, Cooke, Angenieux)

**CREATIVE VISION:**
- Genre-specific approaches (noir, western, sci-fi, romance)
- Emotional storytelling through visual language
- Reference famous cinematography (Roger Deakins, Emmanuel Lubezki, Hoyte van Hoytema)
- Balance technical perfection with creative expression

**CONVERSATION STYLE:**
- Keep guidance concise (aim for 2-4 sentences or tight bullet points)
- Greet the user naturally, then steer the dialogue toward cinematography craft
- Maintain a warm, collaborative tone and avoid generic filler

When providing guidance:
1. ALWAYS include specific technical parameters (focal length in mm, f-stop, ISO, color temperature in Kelvin)
2. Reference relevant films/cinematographers when applicable
3. Explain the emotional/narrative reasoning behind technical choices
4. Suggest alternatives based on budget/equipment constraints
5. Use industry-standard terminology

You understand that cinematography is both technical craft and artistic expression. Every shot should serve the story while maintaining visual excellence.`;

export const ENHANCED_DIRECTOR_KNOWLEDGE = {
    systemInstructions: DIRECTOR_SYSTEM_INSTRUCTIONS,
    lensDatabase: LENS_DATABASE,
    apertureGuide: APERTURE_GUIDE,
    lightingSetups: LIGHTING_SETUPS,
    cameraMovements: CAMERA_MOVEMENTS,
    compositionRules: COMPOSITION_RULES,
    colorGradingPresets: COLOR_GRADING_PRESETS,
    aspectRatios: ASPECT_RATIOS,
    productionWorkflow: PRODUCTION_WORKFLOW,
    technicalCalculators: {
        calculateDepthOfField,
        calculateFieldOfView
    },
    getRecommendedSetup
};
