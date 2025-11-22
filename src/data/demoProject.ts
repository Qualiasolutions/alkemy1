import { FrameStatus, type ScriptAnalysis } from '../types'

/**
 * Demo Project: "The Inheritance"
 * A 3-scene dramatic short film showcasing all Alkemy AI features
 */

export const DEMO_SCRIPT = `THE INHERITANCE
A Short Film

INT. LAW OFFICE - DAY

MAYA TORRES (30s, determined) sits across from RICHARD STERLING (60s, stern), a high-powered estate attorney. The office is modern, minimalist, cold.

RICHARD
Your father's will is quite clear, Ms. Torres. The estate goes to charity. Everything.

MAYA
That's impossible. He promised me the house. Our family home.

RICHARD
I'm afraid sentimentality doesn't override legal documents.

Maya stands, her hands trembling.

MAYA
Then I'll contest it. There has to be something.

INT. TORRES FAMILY HOME - LIBRARY - NIGHT

Maya searches through dusty boxes in a grand but neglected library. Moonlight streams through tall windows. She finds an old letter, her expression shifting from frustration to shock.

MAYA
(whispered)
My God... I'm not his daughter?

EXT. STERLING'S ESTATE - GARDEN - DAY

Maya confronts Richard in his lavish garden. He's trimming roses, unbothered.

MAYA
You knew. You've always known.

RICHARD
Your mother made her choice. Your father made his.

MAYA
And what's your choice, Richard? Because I have copies of everything now.

Richard's hands still. The pruning shears glint in the sun.

RICHARD
(coldly)
Be very careful, Ms. Torres.

FADE OUT.`

export const DEMO_PROJECT_DATA = (): ScriptAnalysis => ({
  title: 'The Inheritance',
  logline:
    "A woman discovers a family secret that threatens to unravel her entire identity while fighting for her father's estate.",
  summary:
    "Maya Torres battles her father's attorney over a contested will, only to discover a devastating family secret that changes everything. A tense drama about family, identity, and the price of truth.",

  scenes: [
    {
      id: 'demo-scene-1',
      sceneNumber: 1,
      setting: 'INT. LAW OFFICE - DAY',
      summary:
        'Maya learns that her father has left his entire estate to charity, leaving her with nothing.',
      time_of_day: 'Day',
      mood: 'Tense, confrontational',
      lighting: 'Harsh fluorescent office lighting, creating sharp shadows',
      frames: [
        {
          id: 'demo-frame-1-1',
          shot_number: 1,
          description:
            'Wide shot of modern law office. Maya sits across from Richard at a glass desk. Cold, minimalist interior with floor-to-ceiling windows showing city skyline.',
          type: 'Establishing Shot',
          camera_package: {
            lens_mm: 24,
            aperture: 'f/2.8',
            iso: 400,
            height: 'Eye Level',
            angle: 'Straight On',
            movement: 'Static',
          },
          status: FrameStatus.UpscaledVideoReady,
          media: {
            start_frame_url:
              'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop',
            upscaled_start_frame_url:
              'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop',
            animated_video_url:
              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            video_upscaled_url:
              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          },
        },
        {
          id: 'demo-frame-1-2',
          shot_number: 2,
          description:
            "Close-up of Maya's face. She's trying to maintain composure but her eyes show desperation and disbelief.",
          type: 'Close-Up',
          camera_package: {
            lens_mm: 85,
            aperture: 'f/1.8',
            iso: 320,
            height: 'Eye Level',
            angle: 'Slight Low',
            movement: 'Slow Push In',
          },
          status: FrameStatus.UpscaledImageReady,
          media: {
            start_frame_url:
              'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=1080&h=1920&fit=crop',
            upscaled_start_frame_url:
              'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=1080&h=1920&fit=crop',
          },
        },
        {
          id: 'demo-frame-1-3',
          shot_number: 3,
          description:
            'Medium shot of Richard Sterling behind his desk, cold and professional. Document folder in foreground, slightly out of focus.',
          type: 'Medium Shot',
          camera_package: {
            lens_mm: 50,
            aperture: 'f/2.0',
            iso: 400,
            height: 'Eye Level',
            angle: 'Straight On',
            movement: 'Static',
          },
          status: FrameStatus.GeneratedStill,
          media: {
            start_frame_url:
              'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1920&h=1080&fit=crop',
          },
        },
      ],
    },
    {
      id: 'demo-scene-2',
      sceneNumber: 2,
      setting: 'INT. TORRES FAMILY HOME - LIBRARY - NIGHT',
      summary:
        "Maya discovers a shocking letter revealing she may not be her father's biological daughter.",
      time_of_day: 'Night',
      mood: 'Mysterious, revelatory',
      lighting: 'Moonlight through windows, warm practical desk lamp',
      frames: [
        {
          id: 'demo-frame-2-1',
          shot_number: 1,
          description:
            'Wide shot of grand library at night. Moonlight streams through tall windows. Dusty bookshelves and scattered boxes. Maya in middle of frame searching through papers.',
          type: 'Wide Shot',
          camera_package: {
            lens_mm: 28,
            aperture: 'f/2.8',
            iso: 1600,
            height: 'Slightly High',
            angle: 'Slight High',
            movement: 'Slow Dolly Forward',
          },
          status: FrameStatus.UpscaledImageReady,
          media: {
            start_frame_url:
              'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&h=1080&fit=crop',
            upscaled_start_frame_url:
              'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&h=1080&fit=crop',
          },
        },
        {
          id: 'demo-frame-2-2',
          shot_number: 2,
          description:
            "Extreme close-up of Maya's hands holding an old yellowed letter. Wedding ring visible. Handwriting partially visible but not readable.",
          type: 'Extreme Close-Up',
          camera_package: {
            lens_mm: 100,
            aperture: 'f/2.8',
            iso: 800,
            height: 'Eye Level',
            angle: 'Top Down',
            movement: 'Static',
          },
          status: FrameStatus.GeneratedStill,
          media: {
            start_frame_url:
              'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=1080&h=1920&fit=crop',
          },
        },
        {
          id: 'demo-frame-2-3',
          shot_number: 3,
          description:
            "Tight close-up on Maya's face in profile, lit by warm desk lamp. Shock and devastation in her expression. Single tear catching light.",
          type: 'Close-Up',
          camera_package: {
            lens_mm: 85,
            aperture: 'f/1.4',
            iso: 640,
            height: 'Eye Level',
            angle: 'Profile',
            movement: 'Static',
          },
          status: FrameStatus.Draft,
          media: {},
        },
      ],
    },
    {
      id: 'demo-scene-3',
      sceneNumber: 3,
      setting: "EXT. STERLING'S ESTATE - GARDEN - DAY",
      summary:
        'Final confrontation between Maya and Richard in his lavish garden. Maya reveals she has evidence, Richard threatens her.',
      time_of_day: 'Day',
      mood: 'Threatening, climactic',
      lighting: 'Bright natural sunlight, creating stark shadows',
      frames: [
        {
          id: 'demo-frame-3-1',
          shot_number: 1,
          description:
            'Wide establishing shot of luxurious garden estate. Manicured hedges, rose bushes, marble fountains. Richard in distance tending roses.',
          type: 'Establishing Shot',
          camera_package: {
            lens_mm: 35,
            aperture: 'f/4.0',
            iso: 200,
            height: 'Eye Level',
            angle: 'Straight On',
            movement: 'Static',
          },
          status: FrameStatus.GeneratedStill,
          media: {
            start_frame_url:
              'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1920&h=1080&fit=crop',
          },
        },
        {
          id: 'demo-frame-3-2',
          shot_number: 2,
          description:
            'Over-the-shoulder shot from behind Maya as she approaches Richard. His back to camera, pruning shears in hand.',
          type: 'Over-Shoulder',
          camera_package: {
            lens_mm: 50,
            aperture: 'f/2.8',
            iso: 200,
            height: 'Eye Level',
            angle: 'Straight On',
            movement: 'Slow Dolly Forward',
          },
          status: FrameStatus.Draft,
          media: {},
        },
        {
          id: 'demo-frame-3-3',
          shot_number: 3,
          description:
            "Extreme close-up of Richard's hands gripping pruning shears. Knuckles white. Rose petals falling. Sunlight glinting off metal blades.",
          type: 'Extreme Close-Up',
          camera_package: {
            lens_mm: 100,
            aperture: 'f/2.0',
            iso: 200,
            height: 'Eye Level',
            angle: 'Straight On',
            movement: 'Static',
          },
          status: FrameStatus.Draft,
          media: {},
        },
      ],
    },
  ],

  characters: [
    {
      id: 'demo-char-1',
      name: 'Maya Torres',
      description:
        'Female, 30s, determined and intelligent. Dark hair pulled back, professional attire (blazer), warm brown eyes that show both strength and vulnerability. Mediterranean features.',
      imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=512&h=512&fit=crop',
      upscaledImageUrl:
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=1024&h=1024&fit=crop',
    },
    {
      id: 'demo-char-2',
      name: 'Richard Sterling',
      description:
        'Male, 60s, stern estate attorney. Silver-grey hair, expensive suit, cold blue eyes. Distinguished but intimidating presence. Sharp features, no warmth in expression.',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=512&fit=crop',
      upscaledImageUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1024&h=1024&fit=crop',
    },
  ],

  locations: [
    {
      id: 'demo-loc-1',
      name: 'Law Office',
      description:
        'Modern minimalist law office. Floor-to-ceiling windows with city skyline view. Glass desk, leather chairs, cold fluorescent lighting. Sterile and corporate.',
      imageUrl:
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1024&h=768&fit=crop',
      upscaledImageUrl:
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop',
    },
    {
      id: 'demo-loc-2',
      name: 'Torres Family Library',
      description:
        'Grand old library with floor-to-ceiling bookshelves. Dark wood paneling, leather-bound books, antique furniture. Slightly neglected, dusty. Large windows with moonlight.',
      imageUrl:
        'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1024&h=768&fit=crop',
      upscaledImageUrl:
        'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&h=1080&fit=crop',
    },
  ],

  props: [
    'Estate documents',
    'Legal folder',
    'Old yellowed letter',
    'Pruning shears',
    'Rose petals',
    'Dusty cardboard boxes',
    'Antique desk lamp',
  ],

  styling: [
    'Maya: Professional blazer, minimal jewelry, wedding ring',
    'Richard: Expensive tailored suit, gold cufflinks, luxury watch',
    'Maya: Casual jeans and sweater in library scene',
  ],

  setDressing: [
    'Modern glass desk with minimal paperwork',
    'Leather executive chairs',
    'Dusty old books and papers',
    'Marble fountain',
    'Rose bushes',
    'Manicured hedges',
  ],

  makeupAndHair: [
    'Maya: Natural makeup, dark hair in professional bun',
    'Richard: Clean-shaven, silver-grey hair professionally styled',
  ],

  sound: [
    'Office ambience - distant phones, AC hum',
    'Paper rustling',
    'Footsteps on marble',
    'Garden birds chirping',
    'Pruning shears cutting sound',
  ],

  moodboard: {
    cinematography: {
      notes:
        'High contrast lighting, sharp shadows, cold color temperature for law office. Warm amber tones for library. Harsh daylight for garden confrontation.',
      items: [
        {
          id: 'demo-mood-cine-1',
          url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&h=600&fit=crop',
          type: 'image',
        },
        {
          id: 'demo-mood-cine-2',
          url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=600&fit=crop',
          type: 'image',
        },
      ],
      aiDescription:
        'High-contrast cinematography with stark shadows and cold, minimalist compositions in the law office. Warm, nostalgic lighting in the library scene with moonlight creating dramatic silhouettes. Bright, harsh daylight in the garden for the final confrontation.',
    },
    color: {
      notes:
        'Cool blues and greys for law office. Warm ambers and browns for library. Bright greens and whites for garden, with red accents from roses.',
      items: [
        {
          id: 'demo-mood-color-1',
          url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=600&fit=crop',
          type: 'image',
        },
      ],
      aiDescription:
        'Color palette transitions from cold steel blues and greys in the sterile law office, to warm amber and sepia tones in the nostalgic library, culminating in vibrant garden greens with ominous red rose accents.',
    },
    style: {
      notes:
        'Inspired by psychological thrillers - Think "Gone Girl" meets "Knives Out". Modern minimalism contrasted with old-money luxury.',
      items: [
        {
          id: 'demo-mood-style-1',
          url: 'https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c3?w=800&h=600&fit=crop',
          type: 'image',
        },
      ],
      aiDescription:
        'Psychological thriller aesthetic blending modern minimalism with old-money elegance. Sharp, geometric compositions juxtaposed with ornate traditional details. Clinical precision meets emotional chaos.',
    },
    other: {
      notes:
        'Focus on details - hands, objects, symbolic imagery. Use shallow depth of field to isolate subjects.',
      items: [],
    },
  },

  moodboardTemplates: [
    {
      id: 'demo-board-master',
      title: 'Master Moodboard',
      description: 'Primary visual template mixing corporate tension with intimate interiors.',
      items: [
        {
          id: 'demo-board-img-1',
          url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&h=600&fit=crop',
          type: 'image',
        },
        {
          id: 'demo-board-img-2',
          url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=600&fit=crop',
          type: 'image',
        },
        {
          id: 'demo-board-img-3',
          url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=600&fit=crop',
          type: 'image',
        },
        {
          id: 'demo-board-img-4',
          url: 'https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c3?w=800&h=600&fit=crop',
          type: 'image',
        },
      ],
      aiSummary:
        'A psychological thriller palette: cold corporate lighting, nostalgic library warmth, and vibrant exterior confrontation accents.',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
})
