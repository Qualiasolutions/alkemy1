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

export interface DirectorProfile {
    name: string;
    era: string;
    signature: string[];
    visualStyle: {
        composition: string;
        lighting: string;
        colorPalette: string;
        cameraMovement: string;
        editing: string;
    };
    technicalChoices: {
        preferredLenses: string[];
        aspectRatio: string;
        filmStock?: string;
    };
    notableWorks: string[];
    collaborators?: string[]; // Cinematographers they work with
    whenToEmulate: string;
}

export interface CinematographerProfile {
    name: string;
    era: string;
    signature: string[];
    technicalExpertise: {
        lighting: string;
        colorScience: string;
        cameraWork: string;
        specialization: string[];
    };
    notableCollaborations: { director: string; films: string[] }[];
    oscarWins?: number;
    visualSignature: string;
}

export interface CommercialDirectorProfile {
    name: string;
    specialty: string[]; // e.g., ["Fashion", "Automotive", "Tech"]
    signature: string[];
    brands: string[];
    visualStyle: string;
    technicalApproach: string;
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
// FAMOUS DIRECTORS DATABASE
// ============================================

export const DIRECTORS_DATABASE: Record<string, DirectorProfile> = {
    coppolaFrancis: {
        name: "Francis Ford Coppola",
        era: "New Hollywood (1960s-1980s)",
        signature: [
            "Operatic visual storytelling",
            "Warm tungsten lighting with practicals",
            "Slow methodical camera movements",
            "Tableaux compositions with deep staging",
            "Use of shadows and silhouettes for drama"
        ],
        visualStyle: {
            composition: "Theatrical staging with deep focus, subjects framed in doorways/windows, Renaissance painting influence",
            lighting: "Warm tungsten practicals (3200K), high contrast ratios (4:1 to 8:1), chiaroscuro, motivated lighting from windows and lamps",
            colorPalette: "Earth tones, browns, golds, deep shadows - Italian Renaissance and Baroque painting aesthetic",
            cameraMovement: "Slow dolly-in on emotional beats, restrained Steadicam, deliberate pacing, static wide shots for tableaux",
            editing: "Long takes with methodical pacing, parallel editing for crosscutting, operatic rhythm"
        },
        technicalChoices: {
            preferredLenses: ["40mm", "50mm", "85mm"],
            aspectRatio: "1.85:1 (Godfather), 2.39:1 (Apocalypse Now)",
            filmStock: "35mm spherical, pushed for grain in Godfather"
        },
        notableWorks: [
            "The Godfather (1972)",
            "The Godfather Part II (1974)",
            "Apocalypse Now (1979)",
            "The Conversation (1974)"
        ],
        collaborators: ["Gordon Willis (The Godfather)", "Vittorio Storaro (Apocalypse Now)", "Walter Murch (editor/sound)"],
        whenToEmulate: "Epic family dramas, crime sagas, operatic emotional moments, classical Hollywood aesthetic with modern sensibility"
    },
    kubrick: {
        name: "Stanley Kubrick",
        era: "New Hollywood (1960s-1990s)",
        signature: [
            "One-point perspective symmetry",
            "Extremely wide-angle lenses for distortion",
            "Slow zoom-outs for psychological distance",
            "Practical lighting with high ISO",
            "Meticulous framing and geometric composition"
        ],
        visualStyle: {
            composition: "Perfect symmetry, one-point perspective, geometric precision, centered subjects, architectural framing",
            lighting: "Practical sources only, natural light, high ISO pushed film, minimal fill, stark contrast",
            colorPalette: "Desaturated with selective color pops, cool tones, clinical sterility, bold primary colors for emphasis",
            cameraMovement: "Slow tracking shots, steady dolly, Steadicam invention (The Shining), slow zoom-outs",
            editing: "Deliberate pacing, long takes, match cuts, visual symmetry between shots"
        },
        technicalChoices: {
            preferredLenses: ["18mm", "24mm", "50mm (f/0.7 NASA lens for candlelight)"],
            aspectRatio: "1.37:1 (early), 1.66:1 (2001), 1.85:1 (The Shining)",
            filmStock: "Pushed 35mm for natural light, pioneered high-speed film for candlelight in Barry Lyndon"
        },
        notableWorks: [
            "2001: A Space Odyssey (1968)",
            "A Clockwork Orange (1971)",
            "The Shining (1980)",
            "Barry Lyndon (1975)"
        ],
        collaborators: ["John Alcott (Barry Lyndon)", "Geoffrey Unsworth (2001)"],
        whenToEmulate: "Psychological thrillers, science fiction, symmetrical compositions, cold sterile environments, slow-burn tension"
    },
    nolan: {
        name: "Christopher Nolan",
        era: "Modern Blockbusters (2000s-present)",
        signature: [
            "IMAX large-format cinematography",
            "Practical effects over CGI",
            "Non-linear storytelling",
            "Dutch angles for disorientation",
            "Extreme wide shots for scale"
        ],
        visualStyle: {
            composition: "Wide establishing shots, human figures dwarfed by environment, geometric architecture, layered depth",
            lighting: "Natural light when possible, high-key for realism, minimal color grading, preserved highlights and shadows",
            colorPalette: "Desaturated realism, blue-gray tones, minimal color correction, naturalistic palette",
            cameraMovement: "Steadicam for action, locked-off for dialogue, IMAX crane shots for spectacle, minimal handheld",
            editing: "Intercutting timelines, rhythmic cross-cutting, building tension through parallel action"
        },
        technicalChoices: {
            preferredLenses: ["50mm", "65mm IMAX", "Wide anamorphic for scope"],
            aspectRatio: "1.43:1 (IMAX sequences), 2.39:1 (anamorphic), variable within film",
            filmStock: "70mm IMAX, 65mm for maximum resolution, 35mm anamorphic"
        },
        notableWorks: [
            "The Dark Knight (2008)",
            "Inception (2010)",
            "Interstellar (2014)",
            "Dunkirk (2017)",
            "Oppenheimer (2023)"
        ],
        collaborators: ["Hoyte van Hoytema (recent films)", "Wally Pfister (early films)"],
        whenToEmulate: "Epic scale, heist films, science fiction, IMAX spectacle, realistic blockbusters, non-linear narratives"
    },
    andersonWes: {
        name: "Wes Anderson",
        era: "Contemporary Auteur (1990s-present)",
        signature: [
            "Perfect symmetry and centered framing",
            "Whip pans and snap zooms",
            "Flat space and planimetric composition",
            "Pastel color palettes",
            "Dollhouse aesthetic"
        ],
        visualStyle: {
            composition: "Perfect bilateral symmetry, centered subjects, planimetric (parallel to camera plane), frame-within-frame, tableau staging",
            lighting: "Soft even lighting, high-key, minimal shadows, flat lighting for storybook feel",
            colorPalette: "Curated pastel colors, warm analogous schemes, retro color timing, production design-driven palette",
            cameraMovement: "Symmetrical pans, slow lateral tracking, snap zooms, whip pans for transitions, static tableaux",
            editing: "Centered wipes, chapter structure, storybook pacing, symmetrical transitions"
        },
        technicalChoices: {
            preferredLenses: ["27mm", "40mm", "50mm"],
            aspectRatio: "1.85:1 (early), 2.39:1 (recent), 1.37:1 (Grand Budapest Hotel sequences)",
            filmStock: "35mm spherical, anamorphic for recent films"
        },
        notableWorks: [
            "The Royal Tenenbaums (2001)",
            "The Grand Budapest Hotel (2014)",
            "Moonrise Kingdom (2012)",
            "Fantastic Mr. Fox (2009)"
        ],
        collaborators: ["Robert Yeoman (all films)"],
        whenToEmulate: "Quirky comedies, storybook narratives, symmetrical aesthetics, pastel color schemes, whimsical tone"
    },
    fincher: {
        name: "David Fincher",
        era: "Modern Masters (1990s-present)",
        signature: [
            "Dark, desaturated color grading",
            "Meticulously planned camera moves",
            "Yellow-green color cast",
            "Low-angle compositions",
            "Digital intermediate pioneering"
        ],
        visualStyle: {
            composition: "Low angles for psychological unease, geometric precision, architectural framing, negative space",
            lighting: "Low-key with selective highlighting, practical sources, cool color temperatures, high contrast ratios",
            colorPalette: "Desaturated with yellow-green cast, teal shadows, sickly fluorescent quality, controlled color palette",
            cameraMovement: "Smooth programmed moves, dolly and crane choreography, CG camera moves, locked tripod for tension",
            editing: "Rhythmic precision, metric editing, invisible cuts, controlled pacing building to crescendos"
        },
        technicalChoices: {
            preferredLenses: ["21mm", "27mm", "35mm", "50mm"],
            aspectRatio: "2.39:1 anamorphic",
            filmStock: "Digital (RED) since Zodiac (2007), pioneered digital intermediate"
        },
        notableWorks: [
            "Seven (1995)",
            "Fight Club (1999)",
            "The Social Network (2010)",
            "Gone Girl (2014)",
            "Zodiac (2007)"
        ],
        collaborators: ["Jeff Cronenweth", "Darius Khondji (Seven)"],
        whenToEmulate: "Psychological thrillers, crime dramas, tech-driven narratives, dark atmospheres, controlled tension"
    },
    villeneuve: {
        name: "Denis Villeneuve",
        era: "Contemporary Visionary (2010s-present)",
        signature: [
            "Extreme wide shots for scale and isolation",
            "Minimal dialogue, visual storytelling",
            "Desaturated with warm/cool contrast",
            "Slow methodical pacing",
            "Overhead God's-eye views"
        ],
        visualStyle: {
            composition: "Extreme wides with isolated figures, overhead shots, centered subjects, architectural geometry, negative space",
            lighting: "Naturalistic with dramatic contrast, warm practicals vs cool ambient, soft diffused daylight, motivated sources",
            colorPalette: "Desaturated earth tones, warm amber vs cool blue, ochre deserts, industrial grays",
            cameraMovement: "Slow deliberate movements, floating crane shots, locked-off wides, Steadicam for intimacy",
            editing: "Contemplative pacing, long takes, rhythm through visual motifs, silence as punctuation"
        },
        technicalChoices: {
            preferredLenses: ["21mm", "27mm", "40mm", "65mm for close-ups"],
            aspectRatio: "2.39:1 anamorphic, 1.90:1 IMAX (Dune)",
            filmStock: "Digital (ARRI Alexa), IMAX for recent films"
        },
        notableWorks: [
            "Arrival (2016)",
            "Blade Runner 2049 (2017)",
            "Dune (2021)",
            "Sicario (2015)",
            "Prisoners (2013)"
        ],
        collaborators: ["Roger Deakins (Prisoners, Sicario, 2049)", "Greig Fraser (Dune)"],
        whenToEmulate: "Science fiction epics, slow-burn thrillers, existential narratives, vast landscapes, contemplative tone"
    },
    spielberg: {
        name: "Steven Spielberg",
        era: "New Hollywood to Contemporary (1970s-present)",
        signature: [
            "Lens flares and backlit subjects",
            "Wide-eyed wonder facial close-ups",
            "Spielberg face (reaction shot)",
            "Fluid Steadicam through spaces",
            "Warm nostalgic lighting"
        ],
        visualStyle: {
            composition: "Dynamic staging with depth, foreground/background action, subjects looking off-screen at wonder",
            lighting: "Soft warm lighting, golden hour magic, lens flares, backlit silhouettes, Rembrandt lighting for faces",
            colorPalette: "Warm nostalgic tones, golden hour amber, saturated primaries, Kodachrome aesthetic",
            cameraMovement: "Fluid Steadicam, dramatic push-ins, crane moves for reveals, tracking shots following action",
            editing: "Seamless continuity, building emotional crescendos, intercutting for tension, clear spatial geography"
        },
        technicalChoices: {
            preferredLenses: ["21mm", "27mm", "40mm", "85mm for faces"],
            aspectRatio: "1.85:1 (early), 2.39:1 (recent)",
            filmStock: "35mm spherical, transitioned to digital with The Adventures of Tintin"
        },
        notableWorks: [
            "Jaws (1975)",
            "E.T. (1982)",
            "Schindler's List (1993)",
            "Saving Private Ryan (1998)",
            "Raiders of the Lost Ark (1981)"
        ],
        collaborators: ["Janusz Kamiński (since 1993)", "Allen Daviau (E.T., Empire of the Sun)"],
        whenToEmulate: "Adventure films, emotional family dramas, wonder and awe, nostalgic Americana, dynamic action"
    },
    tarantino: {
        name: "Quentin Tarantino",
        era: "Postmodern Cinema (1990s-present)",
        signature: [
            "Trunk shot (low angle looking up)",
            "Crash zooms and snap zooms",
            "Long takes with ensemble blocking",
            "Saturated primary colors",
            "70s exploitation aesthetic"
        ],
        visualStyle: {
            composition: "Low angles (trunk shots), symmetrical two-shots for dialogue, dynamic ensemble staging, graphic insert shots",
            lighting: "High-key with saturated colors, practical sources, 70s exploitation film look, warm tungsten interiors",
            colorPalette: "Saturated bold primaries, retro color timing, warm reds and oranges, comic book vibrancy",
            cameraMovement: "Crash zooms for emphasis, slow Steadicam through spaces, locked tripod for dialogue, snap whip pans",
            editing: "Non-linear chapter structure, rhythmic violence, music-driven montages, extended dialogue scenes"
        },
        technicalChoices: {
            preferredLenses: ["25mm", "40mm", "50mm"],
            aspectRatio: "2.39:1 anamorphic",
            filmStock: "35mm anamorphic, 70mm Ultra Panavision (Hateful Eight)"
        },
        notableWorks: [
            "Pulp Fiction (1994)",
            "Kill Bill Vol. 1 & 2 (2003-2004)",
            "Inglourious Basterds (2009)",
            "Django Unchained (2012)",
            "The Hateful Eight (2015)"
        ],
        collaborators: ["Robert Richardson (since Kill Bill)"],
        whenToEmulate: "Genre pastiches, dialogue-driven scenes, exploitation aesthetics, non-linear narratives, stylized violence"
    },
    scorsese: {
        name: "Martin Scorsese",
        era: "New Hollywood to Contemporary (1970s-present)",
        signature: [
            "Tracking shots through crowded spaces",
            "Freeze frames for emphasis",
            "Slow-motion for violence",
            "Handheld immediacy",
            "Musical montages"
        ],
        visualStyle: {
            composition: "Dynamic reframing, subjects in motion, crowded frames with layered depth, Dutch angles for unease",
            lighting: "Naturalistic with dramatic flair, neon practicals, nightclub lighting, warm interiors vs cool exteriors",
            colorPalette: "Saturated reds (violence, passion), warm tungsten interiors, neon colors, rich blacks",
            cameraMovement: "Virtuosic tracking shots, handheld for energy, slow-motion for balletic violence, Steadicam through spaces",
            editing: "Rhythmic cutting to music, freeze frames, rapid montages, kinetic energy, layered sound design"
        },
        technicalChoices: {
            preferredLenses: ["25mm", "32mm", "40mm", "50mm"],
            aspectRatio: "1.85:1 (classic), 2.39:1 (recent)",
            filmStock: "35mm spherical, digital (The Irishman)"
        },
        notableWorks: [
            "Taxi Driver (1976)",
            "Raging Bull (1980)",
            "Goodfellas (1990)",
            "The Departed (2006)",
            "The Wolf of Wall Street (2013)"
        ],
        collaborators: ["Michael Chapman (Taxi Driver)", "Michael Ballhaus (Goodfellas)", "Robert Richardson (recent)"],
        whenToEmulate: "Crime dramas, character studies, urban grit, musical energy, moral complexity, Italian-American stories"
    },
    ptanderson: {
        name: "Paul Thomas Anderson",
        era: "Contemporary Auteur (1990s-present)",
        signature: [
            "Long single-take sequences",
            "70mm large-format cinematography",
            "Slow push-ins on faces",
            "Ensemble staging with deep focus",
            "Naturalistic lighting"
        ],
        visualStyle: {
            composition: "Deep focus ensemble staging, symmetrical framing, subjects centered or at thirds, architectural precision",
            lighting: "Soft naturalistic lighting, window light, minimal fill, golden hour exteriors, practical interiors",
            colorPalette: "Warm earth tones, period-accurate colors, saturated but natural, amber sunlight",
            cameraMovement: "Fluid long takes, slow push-ins for emotional intensity, Steadicam through spaces, crane for God's-eye view",
            editing: "Long takes with dynamic staging, invisible cuts, building emotional intensity, musical rhythm"
        },
        technicalChoices: {
            preferredLenses: ["32mm", "40mm", "50mm", "65mm"],
            aspectRatio: "2.39:1 anamorphic, 2.20:1 (70mm)",
            filmStock: "35mm anamorphic, 65mm (The Master, Phantom Thread)"
        },
        notableWorks: [
            "There Will Be Blood (2007)",
            "The Master (2012)",
            "Phantom Thread (2017)",
            "Boogie Nights (1997)",
            "Magnolia (1999)"
        ],
        collaborators: ["Robert Elswit (early films)", "Mihai Mălaimare Jr. (recent)"],
        whenToEmulate: "Character studies, period dramas, ensemble pieces, emotional intensity, methodical pacing, Altman-esque"
    }
};

// ============================================
// CINEMATOGRAPHERS DATABASE
// ============================================

export const CINEMATOGRAPHERS_DATABASE: Record<string, CinematographerProfile> = {
    deakinsRoger: {
        name: "Roger Deakins",
        era: "Contemporary Master (1980s-present)",
        signature: [
            "Naturalistic lighting with dramatic flair",
            "Silhouettes and backlight",
            "Controlled color palettes",
            "Practical motivated sources",
            "Invisible technique serving story"
        ],
        technicalExpertise: {
            lighting: "Master of naturalistic lighting, uses practicals and motivated sources, subtle fill, controlled shadows, soft diffused daylight",
            colorScience: "Restrained color palettes, desaturated with selective pops, maintains skin tones, avoids trendy grades",
            cameraWork: "Smooth fluid movement, Steadicam master, prefers simplicity over flash, locked-off for tension",
            specialization: ["Silhouettes", "Backlight", "Smoke and atmosphere", "Natural light extension", "Long takes"]
        },
        notableCollaborations: [
            { director: "Denis Villeneuve", films: ["Blade Runner 2049", "Prisoners", "Sicario"] },
            { director: "Coen Brothers", films: ["Fargo", "No Country for Old Men", "The Big Lebowski"] },
            { director: "Sam Mendes", films: ["1917", "Skyfall", "Revolutionary Road"] }
        ],
        oscarWins: 2,
        visualSignature: "Naturalistic beauty - makes complex lighting appear effortless and invisible, favors silhouettes and controlled backlight, never calls attention to technique"
    },
    lubezekiEmmanuel: {
        name: "Emmanuel Lubezki",
        era: "Contemporary Virtuoso (1990s-present)",
        signature: [
            "Extreme long takes with complex choreography",
            "Natural light cinematography",
            "Wide-angle immersive perspectives",
            "Floating camera movements",
            "Golden hour magic"
        ],
        technicalExpertise: {
            lighting: "Almost entirely natural light, golden hour specialist, minimal artificial sources, high ISO for candlelight, soft wrap-around ambience",
            colorScience: "Warm naturalistic tones, golden hour obsession, preserves highlights, film-like digital color, organic color timing",
            cameraWork: "Virtuosic long takes, floating Steadicam, wide-angle immersion, intimate handheld, pioneering wireless video village",
            specialization: ["Long takes", "Natural light", "Wide-angle poetry", "Steadicam choreography", "Golden hour"]
        },
        notableCollaborations: [
            { director: "Alejandro González Iñárritu", films: ["The Revenant", "Birdman", "Babel"] },
            { director: "Alfonso Cuarón", films: ["Gravity", "Children of Men", "Y Tu Mamá También"] },
            { director: "Terrence Malick", films: ["The Tree of Life", "The New World", "To the Wonder"] }
        ],
        oscarWins: 3,
        visualSignature: "Ethereal natural light poetry - creates immersive experiences through virtuosic long takes, golden hour obsession, and floating camera movement that feels like consciousness itself"
    },
    stororoVittorio: {
        name: "Vittorio Storaro",
        era: "Classical Master (1960s-present)",
        signature: [
            "Color as narrative symbolism",
            "Operatic dramatic lighting",
            "Geometric composition",
            "Theatrical use of color",
            "High-contrast chiaroscuro"
        ],
        technicalExpertise: {
            lighting: "Operatic dramatic lighting, high contrast ratios, hard directional sources, theatrical spotlights, colored gels for symbolism",
            colorScience: "Color theory master, uses color symbolically, saturated primaries, theatrical color temperature shifts, pioneered digital color timing",
            cameraWork: "Formal composed frames, slow deliberate moves, geometric precision, classical framing, theatrical staging",
            specialization: ["Color symbolism", "Chiaroscuro", "Theatrical lighting", "Operatic drama", "Color theory"]
        },
        notableCollaborations: [
            { director: "Francis Ford Coppola", films: ["Apocalypse Now", "One from the Heart"] },
            { director: "Bernardo Bertolucci", films: ["The Last Emperor", "The Conformist", "Last Tango in Paris"] },
            { director: "Warren Beatty", films: ["Reds", "Dick Tracy"] }
        ],
        oscarWins: 3,
        visualSignature: "Operatic color symphony - treats color as a narrative language with symbolic meaning, creates theatrical drama through high-contrast lighting and bold color choices"
    },
    kamińskiJanusz: {
        name: "Janusz Kamiński",
        era: "Contemporary Hollywood (1990s-present)",
        signature: [
            "Lens flares and diffusion",
            "Backlit silhouettes",
            "Bleach bypass and desaturation",
            "Shafts of light through smoke",
            "High contrast with blown highlights"
        ],
        technicalExpertise: {
            lighting: "Strong backlight, lens flares, shafts of light, smoke and atmosphere, high contrast with blown highlights, soft faces with hard backgrounds",
            colorScience: "Bleach bypass pioneer, desaturated palette, preserves skin tones while crushing other colors, diffusion filters, milky blacks",
            cameraWork: "Fluid Steadicam, dramatic push-ins, handheld for chaos, crane for scale, dynamic reframing",
            specialization: ["Lens flares", "Bleach bypass", "Atmospheric lighting", "Backlight", "Diffusion techniques"]
        },
        notableCollaborations: [
            { director: "Steven Spielberg", films: ["Schindler's List", "Saving Private Ryan", "Minority Report", "War Horse", "The Fabelmans"] }
        ],
        oscarWins: 2,
        visualSignature: "Ethereal realism - combines lens flares, diffusion, and bleach bypass to create a dreamlike quality while maintaining grounded realism, master of atmospheric lighting"
    },
    fraserGreig: {
        name: "Greig Fraser",
        era: "Modern Blockbuster (2010s-present)",
        signature: [
            "IMAX large format cinematography",
            "Natural light with LED enhancement",
            "Immersive handheld realism",
            "Practical in-camera effects",
            "Film grain aesthetic on digital"
        ],
        technicalExpertise: {
            lighting: "LED technology pioneer, natural light augmented with LEDs, large soft sources, minimal crew on location, fast reactive lighting",
            colorScience: "Film grain on digital, organic color timing, naturalistic skin tones, preserves texture, avoids clinical digital look",
            cameraWork: "IMAX specialist, immersive handheld, Steadicam fluidity, practical effects in-camera, minimal VFX reliance",
            specialization: ["IMAX", "LED lighting", "Natural light", "Handheld immersion", "Practical effects"]
        },
        notableCollaborations: [
            { director: "Denis Villeneuve", films: ["Dune", "Dune: Part Two"] },
            { director: "Matt Reeves", films: ["The Batman", "Let Me In"] },
            { director: "Garth Davis", films: ["Lion", "Mary Magdalene"] }
        ],
        oscarWins: 1,
        visualSignature: "Immersive IMAX realism - combines large format cinematography with naturalistic lighting and practical in-camera effects, creates tactile lived-in worlds"
    },
    richardsonRobert: {
        name: "Robert Richardson",
        era: "Versatile Craftsman (1980s-present)",
        signature: [
            "Chameleon style adapting to directors",
            "High contrast black and white",
            "Saturated color when needed",
            "Kinetic handheld energy",
            "Classical composition flexibility"
        ],
        technicalExpertise: {
            lighting: "Adapts to each project, from high-key comedy to low-key noir, master of both controlled studio and natural location lighting",
            colorScience: "Versatile colorist, handles desaturated realism (Scorsese) and saturated primaries (Tarantino), black-and-white master",
            cameraWork: "Fluid adaptability, kinetic handheld (Stone), controlled elegance (Tarantino), classical framing (Anderson)",
            specialization: ["Versatility", "Black and white", "Kinetic camera", "Controlled color", "Director collaboration"]
        },
        notableCollaborations: [
            { director: "Quentin Tarantino", films: ["Kill Bill", "Inglourious Basterds", "Django Unchained", "The Hateful Eight"] },
            { director: "Martin Scorsese", films: ["The Aviator", "Shutter Island", "Hugo", "Killers of the Flower Moon"] },
            { director: "Oliver Stone", films: ["JFK", "Natural Born Killers", "Platoon"] }
        ],
        oscarWins: 3,
        visualSignature: "Chameleon master - ultimate collaborator who adapts style to serve each director's vision, equally comfortable with kinetic chaos and classical elegance"
    }
};

// ============================================
// COMMERCIAL DIRECTORS DATABASE
// ============================================

export const COMMERCIAL_DIRECTORS_DATABASE: Record<string, CommercialDirectorProfile> = {
    jonzeSpike: {
        name: "Spike Jonze",
        specialty: ["Fashion", "Technology", "Lifestyle", "Music Videos"],
        signature: [
            "Playful unexpected concepts",
            "Emotional storytelling in 30 seconds",
            "Naturalistic handheld camera work",
            "Surreal visual metaphors",
            "Human authenticity in absurd situations"
        ],
        brands: ["Gap", "Adidas", "IKEA", "Apple", "Levi's"],
        visualStyle: "Naturalistic documentary-style camera work meets surreal conceptual ideas. Handheld energy with emotional depth. Warm color palettes with practical lighting.",
        technicalApproach: "Prefers naturalistic lighting and handheld camera for authenticity. Embraces imperfection and spontaneity. Wide lenses (25-35mm) for environmental context."
    },
    gondreyMichel: {
        name: "Michel Gondry",
        specialty: ["Technology", "Fashion", "Music", "Automotive"],
        signature: [
            "Practical in-camera effects",
            "Handmade DIY aesthetic",
            "Whimsical visual metaphors",
            "Creative transitions and match cuts",
            "Playful animation mixed with live action"
        ],
        brands: ["Levi's", "Apple", "Nike", "Coca-Cola", "Nokia"],
        visualStyle: "DIY handmade aesthetic with practical effects. Bright saturated colors. Inventive camera tricks and transitions. Whimsical and childlike wonder.",
        technicalApproach: "In-camera effects over post-production. Creative rigging and practical magic. Standard lenses (40-50mm) for natural perspective. High-key colorful lighting."
    },
    glazerJonathan: {
        name: "Jonathan Glazer",
        specialty: ["Automotive", "Luxury", "Fashion", "Alcohol"],
        signature: [
            "Cinematic slow-motion beauty",
            "High-contrast dramatic lighting",
            "Minimalist compositions",
            "Atmospheric smoke and fog",
            "Precision choreography"
        ],
        brands: ["Guinness", "Stella Artois", "Nike", "Audi", "Levi's"],
        visualStyle: "Cinematic drama with theatrical lighting. High contrast with deep blacks. Slow-motion beauty shots. Minimalist compositions with negative space. Moody atmospheric fog.",
        technicalApproach: "High-speed cameras for slow-motion (120-240fps). Low-key dramatic lighting (8:1 ratios). Portrait lenses (85-135mm) for subject isolation. Precision-timed choreography."
    },
    fincherdavidCommercial: {
        name: "David Fincher (Commercial Work)",
        specialty: ["Technology", "Automotive", "Fashion", "Corporate"],
        signature: [
            "Meticulously planned camera choreography",
            "Dark desaturated aesthetic",
            "Low-angle power shots",
            "Seamless VFX integration",
            "Hyper-precise timing"
        ],
        brands: ["Nike", "Coca-Cola", "Heineken", "Levi's", "BMW"],
        visualStyle: "Dark, desaturated, and meticulously controlled. Low angles for power. Yellow-green color cast. Programmed camera moves. Clinical precision.",
        technicalApproach: "Programmed motion control for repeatable moves. Digital cinema for post flexibility. Wide-angle lenses (21-35mm) for dynamic perspectives. Low-key lighting with selective highlights."
    },
    romijakChris: {
        name: "Chris Romjak",
        specialty: ["Automotive", "Technology", "Fashion"],
        signature: [
            "Dynamic car cinematography",
            "Extreme low-angle shots",
            "High-speed photography",
            "Urban gritty aesthetic",
            "Dramatic reveal moments"
        ],
        brands: ["BMW", "Audi", "Mercedes-Benz", "Lexus", "Cadillac"],
        visualStyle: "Automotive specialist with dramatic urban cinematography. Low angles and reflections. Sleek metallic surfaces. Moody atmospheric lighting. Dynamic movement.",
        technicalApproach: "Russian arm and pursuit vehicles for car shots. High-speed cameras (phantom) for details. Wide anamorphic lenses (24-40mm). Urban location lighting with practicals."
    },
    meierteMarkus: {
        name: "Markus Meiertë",
        specialty: ["Fashion", "Beauty", "Luxury"],
        signature: [
            "High fashion editorial aesthetic",
            "Extreme beauty lighting",
            "Slow sensual camera movement",
            "Saturated color palettes",
            "Tactile close-up details"
        ],
        brands: ["Dior", "Chanel", "Prada", "Louis Vuitton", "Calvin Klein"],
        visualStyle: "High-fashion editorial look with extreme beauty lighting. Saturated colors or stark black and white. Slow sensual camera movements. Macro close-ups on textures.",
        technicalApproach: "Beauty lighting with ring lights and soft sources. Macro lenses (100-180mm) for tactile details. Slow dolly moves. High-end digital cinema cameras for maximum resolution."
    },
    stolenMark: {
        name: "Mark Stolen",
        specialty: ["Sports", "Automotive", "Adventure"],
        signature: [
            "Extreme sports cinematography",
            "Dynamic aerial shots",
            "Slow-motion action",
            "Energetic handheld work",
            "Natural outdoor lighting"
        ],
        brands: ["Nike", "Red Bull", "GoPro", "Adidas", "Under Armour"],
        visualStyle: "High-energy sports and adventure aesthetic. Dynamic handheld and aerial shots. Slow-motion action highlights. Natural outdoor lighting. Gritty texture and grain.",
        technicalApproach: "High-speed cameras for action (240-480fps). Drones and gimbal rigs for movement. Wide-angle lenses (14-24mm) for immersion. Natural light augmented with reflectors."
    },
    murphyAndreas: {
        name: "Andreas Nilsson",
        specialty: ["Quirky Comedy", "Fashion", "Technology"],
        signature: [
            "Quirky comedic timing",
            "Colorful production design",
            "Symmetrical compositions",
            "Dry Scandinavian humor",
            "Unexpected visual gags"
        ],
        brands: ["IKEA", "Skittles", "Coca-Cola", "Samsung", "Honda"],
        visualStyle: "Quirky comedy with colorful production design. Symmetrical compositions inspired by Wes Anderson. Bright saturated colors. Deadpan visual humor.",
        technicalApproach: "Locked-off symmetrical framing. Standard lenses (40-50mm) for natural perspective. High-key even lighting for comedy. Precise production design and color coordination."
    }
};

// ============================================
// HELPER FUNCTIONS FOR DIRECTOR/CINEMATOGRAPHER LOOKUP
// ============================================

export function getDirectorByName(name: string): DirectorProfile | null {
    const normalized = name.toLowerCase().replace(/[^a-z]/g, '');
    const entry = Object.entries(DIRECTORS_DATABASE).find(([key, profile]) =>
        profile.name.toLowerCase().replace(/[^a-z]/g, '').includes(normalized) ||
        normalized.includes(profile.name.toLowerCase().replace(/[^a-z]/g, ''))
    );
    return entry ? entry[1] : null;
}

export function getCinematographerByName(name: string): CinematographerProfile | null {
    const normalized = name.toLowerCase().replace(/[^a-z]/g, '');
    const entry = Object.entries(CINEMATOGRAPHERS_DATABASE).find(([key, profile]) =>
        profile.name.toLowerCase().replace(/[^a-z]/g, '').includes(normalized) ||
        normalized.includes(profile.name.toLowerCase().replace(/[^a-z]/g, ''))
    );
    return entry ? entry[1] : null;
}

export function getCommercialDirectorByName(name: string): CommercialDirectorProfile | null {
    const normalized = name.toLowerCase().replace(/[^a-z]/g, '');
    const entry = Object.entries(COMMERCIAL_DIRECTORS_DATABASE).find(([key, profile]) =>
        profile.name.toLowerCase().replace(/[^a-z]/g, '').includes(normalized) ||
        normalized.includes(profile.name.toLowerCase().replace(/[^a-z]/g, ''))
    );
    return entry ? entry[1] : null;
}

export function getStyleRecommendation(directorName: string): string | null {
    const director = getDirectorByName(directorName);
    if (!director) return null;

    const lenses = director.technicalChoices.preferredLenses.join(', ');
    const aspectRatio = director.technicalChoices.aspectRatio;

    return `**${director.name} Style:**\n\n` +
           `**Lenses:** ${lenses}\n` +
           `**Aspect Ratio:** ${aspectRatio}\n` +
           `**Composition:** ${director.visualStyle.composition}\n` +
           `**Lighting:** ${director.visualStyle.lighting}\n` +
           `**Color:** ${director.visualStyle.colorPalette}\n` +
           `**Movement:** ${director.visualStyle.cameraMovement}\n` +
           `**Editing:** ${director.visualStyle.editing}\n\n` +
           `**Key Signatures:** ${director.signature.join(', ')}\n\n` +
           `**Best For:** ${director.whenToEmulate}`;
}

export function searchDirectorsByStyle(keywords: string[]): DirectorProfile[] {
    const results: DirectorProfile[] = [];
    const normalizedKeywords = keywords.map(k => k.toLowerCase());

    for (const profile of Object.values(DIRECTORS_DATABASE)) {
        const searchText = [
            profile.name,
            profile.visualStyle.composition,
            profile.visualStyle.lighting,
            profile.visualStyle.colorPalette,
            profile.visualStyle.cameraMovement,
            profile.whenToEmulate,
            ...profile.signature
        ].join(' ').toLowerCase();

        const matches = normalizedKeywords.filter(keyword => searchText.includes(keyword));
        if (matches.length > 0) {
            results.push(profile);
        }
    }

    return results;
}

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

export const DIRECTOR_SYSTEM_INSTRUCTIONS = `You are a Director of Photography - a friendly, collaborative creative partner with deep expertise in cinematography and visual storytelling. Think of yourself as a seasoned DP who loves to share knowledge and help bring creative visions to life.

**YOUR PERSONALITY:**
- Warm, encouraging, and genuinely excited about cinematography
- Speak naturally and conversationally, like you're on set or in a creative meeting
- Balance technical precision with accessible explanations
- Share your expertise through storytelling and real-world examples
- Always focus on WHY behind the technical choices, not just the HOW

**YOUR EXPERTISE:**
You have deep knowledge of:
- Lenses and focal lengths (8mm to 800mm) and their emotional impact
- Lighting setups and color science (3200K to 7000K, key/fill ratios, motivated lighting)
- Camera movement and composition (dolly, crane, Steadicam, handheld)
- Famous directors and cinematographers (Deakins, Lubezki, Fraser, Storaro, and many more)
- Production workflow from pre-production to final delivery
- How to achieve specific looks on different budgets

**CONVERSATION STYLE:**
- Keep responses concise and conversational (2-4 sentences typically)
- Ask clarifying questions when helpful
- Share relevant film/cinematographer references naturally
- Be specific with technical parameters when giving advice (e.g., "Try an 85mm at f/2.8 with 3200K warm practicals")
- Adapt your language to the user's level - technical when needed, accessible when helpful

**WHEN USERS ASK ABOUT:**
- Lenses: Explain the emotional impact, not just the specs
- Lighting: Describe the mood and feeling it creates
- Directors: Share what makes their style unique and when to use it
- Technical problems: Offer practical solutions with alternatives
- Creative choices: Help them understand the storytelling impact

**ICONIC DIRECTORS & CINEMATOGRAPHERS YOU KNOW:**
You have comprehensive knowledge of iconic directors, cinematographers, and commercial directors:

**Famous Film Directors** (10+ masters):
- Francis Ford Coppola: Operatic storytelling, warm tungsten practicals, tableaux compositions
- Stanley Kubrick: One-point perspective symmetry, practical lighting, geometric precision
- Christopher Nolan: IMAX large-format, practical effects, non-linear narratives
- Wes Anderson: Perfect symmetry, pastel palettes, whip pans, storybook aesthetic
- David Fincher: Dark desaturated grades, yellow-green cast, meticulous camera choreography
- Denis Villeneuve: Extreme wides for isolation, desaturated earth tones, contemplative pacing
- Steven Spielberg: Lens flares, "Spielberg face," warm nostalgic lighting
- Quentin Tarantino: Trunk shots, crash zooms, saturated primaries, 70s exploitation look
- Martin Scorsese: Tracking shots through crowds, freeze frames, musical montages
- Paul Thomas Anderson: Long single-takes, 70mm cinematography, naturalistic lighting

**Legendary Cinematographers** (6+ DOPs):
- Roger Deakins: Naturalistic lighting, silhouettes, controlled palettes, invisible technique
- Emmanuel Lubezki: Extreme long takes, natural light, golden hour obsession
- Vittorio Storaro: Color as narrative symbolism, operatic lighting, theatrical drama
- Janusz Kamiński: Lens flares, bleach bypass, atmospheric lighting, diffusion
- Greig Fraser: IMAX specialist, LED lighting pioneer, film grain on digital
- Robert Richardson: Chameleon versatility, adapts to each director's vision

**Commercial Directors** (8+ specialists):
- Spike Jonze: Playful concepts, emotional storytelling, handheld authenticity
- Michel Gondry: DIY practical effects, whimsical metaphors, handmade aesthetic
- Jonathan Glazer: Cinematic slow-motion, high-contrast drama, minimalist compositions
- David Fincher (commercials): Programmed motion control, dark aesthetic
- Fashion/Automotive/Sports specialists with distinct visual signatures

**WHEN USERS WANT TO EMULATE A DIRECTOR:**
When someone says "Make this shot like Coppola" or "How would Deakins light this?", you:
1. Explain their signature style in conversational language
2. Give specific technical parameters (lenses, ratios, color temps)
3. Share the emotional/narrative reasoning behind those choices
4. Reference specific films that showcase that approach
5. Suggest budget-friendly alternatives if helpful

**HOW YOU HELP:**
- Listen to what they're trying to achieve emotionally/narratively
- Ask questions to understand their constraints and goals
- Offer specific solutions with technical details (e.g., "For that intimate feel, I'd go with an 85mm at f/2.8, using warm 3200K practicals as your key light")
- Reference great examples from cinema when relevant
- Always explain WHY a choice will help the story

**REMEMBER:**
- Cinematography serves the story first, technical perfection second
- Every creative choice should have an emotional/narrative purpose
- Share your knowledge generously but keep it conversational
- Be the collaborative DP every director wants on their team
- When users ask about image generation or technical commands, help them naturally
- Stay focused on cinematography - if they ask about unrelated topics, gently redirect to your expertise

You're here to help bring their creative vision to life through the art and craft of cinematography.`;

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
    directorsDatabase: DIRECTORS_DATABASE,
    cinematographersDatabase: CINEMATOGRAPHERS_DATABASE,
    commercialDirectorsDatabase: COMMERCIAL_DIRECTORS_DATABASE,
    directorLookup: {
        getDirectorByName,
        getCinematographerByName,
        getCommercialDirectorByName,
        getStyleRecommendation,
        searchDirectorsByStyle
    },
    technicalCalculators: {
        calculateDepthOfField,
        calculateFieldOfView
    },
    getRecommendedSetup
};
