/**
 * Demo Data for Generation Page
 *
 * Pre-loaded sample characters and world prompts for instant demo experience
 */

import { TrainedCharacterIdentity, CharacterFeatures } from '../services/characterIdentityService';

export const DEMO_CHARACTERS: TrainedCharacterIdentity[] = [
    {
        id: 'demo_char_001',
        name: 'Sophia Rodriguez',
        description: 'Lead detective character - Film noir style',
        referenceUrls: [
            // Placeholder data URLs (in production, use actual images)
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzJhMmEyYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TYW1wbGUgQ2hhcmFjdGVyIDEgLSBGcm9udCBWaWV3PC90ZXh0Pjwvc3ZnPg==',
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzNhM2EzYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TYW1wbGUgQ2hhcmFjdGVyIDEgLSBQcm9maWxlPC90ZXh0Pjwvc3ZnPg==',
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzRhNGE0YSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TYW1wbGUgQ2hhcmFjdGVyIDEgLSAzLzQgVmlldzwvdGV4dD48L3N2Zz4='
        ],
        features: {
            faceShape: 'oval',
            hairColor: 'dark brown',
            hairStyle: 'shoulder-length wavy',
            eyeColor: 'hazel',
            skinTone: 'medium olive',
            age: '32-35',
            bodyType: 'athletic',
            distinctiveFeatures: ['sharp cheekbones', 'confident expression', 'professional demeanor']
        },
        consistencyScore: 87.5,
        createdAt: '2025-11-11T10:00:00Z'
    },
    {
        id: 'demo_char_002',
        name: 'Marcus Chen',
        description: 'Tech genius character - Cyberpunk style',
        referenceUrls: [
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFhMWEyZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiMwMGZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TYW1wbGUgQ2hhcmFjdGVyIDIgLSBGcm9udCBWaWV3PC90ZXh0Pjwvc3ZnPg==',
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzJhMmEzZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiMwMGZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TYW1wbGUgQ2hhcmFjdGVyIDIgLSBQcm9maWxlPC90ZXh0Pjwvc3ZnPg==',
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzNhM2E0ZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiMwMGZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TYW1wbGUgQ2hhcmFjdGVyIDIgLSAzLzQgVmlldzwvdGV4dD48L3N2Zz4='
        ],
        features: {
            faceShape: 'square',
            hairColor: 'black with cyan highlights',
            hairStyle: 'short undercut with styled top',
            eyeColor: 'dark brown',
            skinTone: 'fair',
            age: '26-28',
            bodyType: 'slim',
            distinctiveFeatures: ['tech implants visible on temples', 'intense gaze', 'augmented reality glasses']
        },
        consistencyScore: 92.3,
        createdAt: '2025-11-11T10:05:00Z'
    },
    {
        id: 'demo_char_003',
        name: 'Elena Volkov',
        description: 'Spy/action character - Thriller style',
        referenceUrls: [
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzI4MTgyOCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZjAwOGMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TYW1wbGUgQ2hhcmFjdGVyIDMgLSBGcm9udCBWaWV3PC90ZXh0Pjwvc3ZnPg==',
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzM4MjgzOCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZjAwOGMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TYW1wbGUgQ2hhcmFjdGVyIDMgLSBQcm9maWxlPC90ZXh0Pjwvc3ZnPg==',
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzQ4Mzg0OCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZjAwOGMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TYW1wbGUgQ2hhcmFjdGVyIDMgLSAzLzQgVmlld zwvdGV4dD48L3N2Zz4='
        ],
        features: {
            faceShape: 'heart',
            hairColor: 'platinum blonde',
            hairStyle: 'long straight with blunt bangs',
            eyeColor: 'ice blue',
            skinTone: 'pale',
            age: '29-31',
            bodyType: 'athletic',
            distinctiveFeatures: ['piercing gaze', 'scar above left eyebrow', 'tactical stance']
        },
        consistencyScore: 89.7,
        createdAt: '2025-11-11T10:10:00Z'
    }
];

export const DEMO_WORLD_PROMPTS = [
    {
        id: 'world_001',
        name: 'Cyberpunk City Street',
        prompt: 'Neon-lit cyberpunk city street at night, towering holographic billboards, flying cars, rain-slicked pavement reflecting colorful lights, crowded market stalls, futuristic Asian-inspired architecture, steam vents, dense urban atmosphere',
        type: 'urban' as const,
        recommendedQuality: 'ultra' as const
    },
    {
        id: 'world_002',
        name: 'Ancient Fantasy Temple',
        prompt: 'Massive ancient fantasy temple ruins overgrown with luminescent plants, crumbling stone pillars with intricate carvings, magical floating crystals, mystical fog, beam of ethereal light from above, sacred pool with glowing water, vines and moss covering architecture',
        type: 'fantasy' as const,
        recommendedQuality: 'standard' as const
    },
    {
        id: 'world_003',
        name: 'Sci-Fi Research Station',
        prompt: 'Advanced sci-fi research station interior, sterile white corridors, holographic displays, transparent glass walkways, containment pods with experiments, advanced robotics, zero-gravity testing area, panoramic windows showing space, high-tech laboratory equipment',
        type: 'sci-fi' as const,
        recommendedQuality: 'standard' as const
    },
    {
        id: 'world_004',
        name: 'Post-Apocalyptic Desert',
        prompt: 'Vast post-apocalyptic desert wasteland, abandoned vehicles half-buried in sand, remnants of civilization, dramatic sunset, dust storm approaching, makeshift shelters, rusted metal structures, sparse vegetation, dramatic rock formations',
        type: 'post-apocalyptic' as const,
        recommendedQuality: 'draft' as const
    },
    {
        id: 'world_005',
        name: 'Victorian Manor Interior',
        prompt: 'Grand Victorian manor ballroom interior, ornate chandeliers, polished marble floors, elaborate ceiling frescoes, tall arched windows, heavy velvet curtains, antique furniture, candlelit sconces, dramatic shadows, mysterious atmosphere',
        type: 'historical' as const,
        recommendedQuality: 'ultra' as const
    }
];

export const DEMO_GENERATED_RESULTS = {
    character: [
        {
            id: 'gen_001',
            characterId: 'demo_char_001',
            url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMxMEEzN0Y7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwRThDNkQ7c3RvcC1vcGFjaXR5OjEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzFhMWExYSIvPjxjaXJjbGUgY3g9IjI1NiIgY3k9IjE4MCIgcj0iNjAiIGZpbGw9InVybCgjZykiLz48cmVjdCB4PSIxODAiIHk9IjI2MCIgd2lkdGg9IjE1MiIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjZykiLz48dGV4dCB4PSI1MCUiIHk9IjQ4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Tb3BoaWEgUm9kcmlndWV6IC0gRnJvbnQgVmlldyAtIFN0dWRpbyBMaWdodGluZzwvdGV4dD48L3N2Zz4=',
            prompt: 'neutral expression, studio lighting',
            pose: 'front',
            consistencyScore: 88.2,
            generatedAt: '2025-11-11T11:00:00Z'
        }
    ],
    world: [
        {
            id: 'world_gen_001',
            promptId: 'world_001',
            thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImN5YmVycHVuayIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZmMDA4Yztzdg9wLW9wYWNpdHk6MSIvPjxzdG9wIG9mZnNldD0iNTAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMDBmZmZmO3N0b3Atb3BhY2l0eToxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZjAwO3N0b3Atb3BhY2l0eToxIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjY0MCIgaGVpZ2h0PSIzNjAiIGZpbGw9IiMwYTBhMGEiLz48cmVjdCB4PSIwIiB5PSIyMDAiIHdpZHRoPSI2NDAiIGhlaWdodD0iMTYwIiBmaWxsPSJ1cmwoI2N5YmVycHVuaykiIG9wYWNpdHk9IjAuMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iJ0NvdXJpZXIgTmV3JyIgZm9udC1zaXplPSIzNiIgZmlsbD0iIzAwZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkN5YmVycHVuayBDaXR5IFN0cmVldDwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjYwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5VbHRyYSBRdWFsaXR5IOKAoiBJbnRlcmFjdGl2ZSAzRCBXb3JsZDwvdGV4dD48L3N2Zz4=',
            quality: 'ultra',
            generatedAt: '2025-11-11T11:15:00Z'
        }
    ]
};

// Helper function to create placeholder SVG for demo purposes
export function createPlaceholderSVG(text: string, width: number = 512, height: number = 512, bgColor: string = '#2a2a2a'): string {
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${bgColor}"/>
        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#fff" text-anchor="middle" dy=".3em">${text}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}
