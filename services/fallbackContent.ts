import { Frame, FrameStatus, Moodboard, MoodboardItem, MoodboardSection, MoodboardTemplate, ScriptAnalysis, AnalyzedScene, AnalyzedCharacter, AnalyzedLocation } from '../types';
import { DEMO_PROJECT_DATA } from '../data/demoProject';

const landscapeImages = [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1920&q=80'
];

const portraitImages = [
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1542202229-7d93c33f5d07?auto=format&fit=crop&w=1080&q=80'
];

const squareImages = [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1553096442-8fc05bff22b9?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1080&q=80'
];

const fallbackVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
];

const hashString = (value: string): number => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};

const pickFrom = (collection: string[], seed: string): string => {
    if (collection.length === 0) {
        throw new Error('Fallback image collection is empty');
    }
    const index = hashString(seed) % collection.length;
    return collection[index];
};

export const getFallbackImageUrl = (aspectRatio: string, seed: string): string => {
    const ratio = aspectRatio.trim();
    if (ratio === '9:16' || ratio === '3:4') {
        return pickFrom(portraitImages, `${seed}-${ratio}`);
    }
    if (ratio === '1:1') {
        return pickFrom(squareImages, `${seed}-${ratio}`);
    }
    return pickFrom(landscapeImages, `${seed}-${ratio}`);
};

export const getFallbackVideoBlob = async (seed: string): Promise<Blob> => {
    const url = pickFrom(fallbackVideos, seed);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch fallback video: ${response.status} ${response.statusText}`);
    }
    return response.blob();
};

export const getFallbackVideoBlobs = async (count: number, seed: string): Promise<Blob[]> => {
    const blobs: Blob[] = [];
    for (let i = 0; i < count; i++) {
        const blob = await getFallbackVideoBlob(`${seed}-${i}`);
        blobs.push(blob);
    }
    return blobs;
};

const sanitizeText = (text: string): string => text.replace(/\s+/g, ' ').trim();

const createMoodboardSection = (seed: string, notes: string, aspectRatio: string): MoodboardSection => {
    const items: MoodboardItem[] = Array.from({ length: 3 }).map((_, index) => ({
        id: `${seed}-${index}`,
        url: getFallbackImageUrl(aspectRatio, `${seed}-${index}`),
        type: 'image'
    }));
    return {
        notes,
        items,
        aiDescription: `${notes || 'A cohesive visual palette generated using fallback assets.'}`
    };
};

const defaultMoodboard = (title: string): Moodboard => ({
    cinematography: createMoodboardSection(`${title}-cine`, 'Fallback cinematography palette blending moody interiors and dramatic lighting.', '16:9'),
    color: createMoodboardSection(`${title}-color`, 'Rich contrast between warm highlights and cooler shadows.', '1:1'),
    style: createMoodboardSection(`${title}-style`, 'Tailored, modern styling with hints of noir-inspired silhouettes.', '3:4'),
    other: createMoodboardSection(`${title}-other`, 'Supporting textures and atmospheric references for tone.', '16:9')
});
const defaultMoodboardTemplates = (title: string, moodboard: Moodboard): MoodboardTemplate[] => {
    const aggregated = [
        ...moodboard.cinematography.items,
        ...moodboard.color.items,
        ...moodboard.style.items,
        ...moodboard.other.items
    ].slice(0, 12);

    return [{
        id: `fallback-board-${hashString(title)}` ,
        title: `${title} Moodboard`,
        description: 'Automatic fallback template generated from screenplay cues.',
        items: aggregated,
        aiSummary: 'A quick offline palette blending cinematography, color, styling, and texture references.',
        createdAt: new Date().toISOString()
    }];
};


const extractSceneHeadings = (lines: string[]): { index: number; heading: string }[] => {
    const headingRegex = /^(INT\.?|EXT\.?|I\/E\.?|INT\/EXT\.?)[^a-zA-Z0-9]?/i;
    const headings: { index: number; heading: string }[] = [];
    lines.forEach((line, index) => {
        if (headingRegex.test(line.trim())) {
            headings.push({ index, heading: sanitizeText(line) });
        }
    });
    return headings;
};

const parseSceneSummary = (lines: string[], start: number, end: number): string => {
    const slice = lines.slice(start + 1, end);
    const meaningfulLines = slice
        .map(line => line.trim())
        .filter(line => line.length > 0 && !/^[A-Z0-9' ]{2,}$/.test(line));
    const summary = meaningfulLines.slice(0, 3).join(' ');
    return summary || 'Fallback summary generated automatically due to limited script context.';
};

const deriveTimeOfDay = (heading: string): string => {
    const upper = heading.toUpperCase();
    if (upper.includes('NIGHT')) return 'Night';
    if (upper.includes('EVENING')) return 'Evening';
    if (upper.includes('MORNING')) return 'Morning';
    if (upper.includes('DAWN')) return 'Dawn';
    if (upper.includes('DUSK')) return 'Dusk';
    return 'Day';
};

const deriveLocationName = (heading: string): string => {
    const parts = heading.replace(/^(INT\.?|EXT\.?|I\/E\.?|INT\/EXT\.?)/i, '').split('-');
    return sanitizeText(parts[0] || heading).replace(/^[^a-zA-Z0-9]+/, '');
};

const buildFallbackFrames = (sceneId: string, summary: string, aspectSeed: string): Frame[] => {
    const keyMoments = summary.split(/\.|!/).map(t => t.trim()).filter(Boolean);
    const descriptions = keyMoments.length > 0 ? keyMoments : [summary];
    return descriptions.slice(0, 3).map((description, index) => ({
        id: `${sceneId}-frame-${index + 1}`,
        shot_number: index + 1,
        description,
        status: FrameStatus.GeneratedStill,
        media: {
            start_frame_url: getFallbackImageUrl('16:9', `${aspectSeed}-${index}`)
        },
        scene_id: sceneId
    }));
};

const extractCharacters = (lines: string[]): AnalyzedCharacter[] => {
    const pattern = /^[A-Z][A-Z0-9 '\-]{1,30}$/;
    const ignored = new Set(['INT', 'EXT', 'I/E', 'INT/EXT']);
    const candidates = new Set<string>();

    lines.forEach(line => {
        const trimmed = line.trim();
        if (pattern.test(trimmed) && !ignored.has(trimmed) && trimmed.length <= 24) {
            candidates.add(trimmed);
        }
    });

    return Array.from(candidates).slice(0, 8).map((name, index) => ({
        identity: undefined,
        id: `char-${index}-${name}`,
        name,
        description: `${name} is a key character identified from the script. Please refine their description once AI services are available.`,
        imageUrl: getFallbackImageUrl('3:4', name)
    }));
};

const extractLocations = (scenes: AnalyzedScene[]): AnalyzedLocation[] => {
    const uniqueNames = new Map<string, string>();
    scenes.forEach(scene => {
        const name = deriveLocationName(scene.setting);
        if (name) {
            uniqueNames.set(name, scene.setting);
        }
    });

    return Array.from(uniqueNames.entries()).slice(0, 6).map(([name, heading], index) => ({
        id: `location-${index}-${name}`,
        name,
        description: `Derived from scene heading "${heading}". Tailor this description when live AI analysis becomes available.`,
        imageUrl: getFallbackImageUrl('16:9', name)
    }));
};

export const fallbackMoodboardDescription = (section: MoodboardSection): string => {
    const notePortion = section.notes ? `Notes highlight: ${section.notes}.` : 'No user notes were provided for this section.';
    const itemCount = section.items.length;
    const imagery = itemCount > 0 ? `Using ${itemCount} visual references, lean into cohesive tones and textures to maintain continuity.` : 'Add images to enrich this section when possible.';
    return `${notePortion} ${imagery}`;
};

export const fallbackDirectorResponse = (analysis: ScriptAnalysis, query: string): string => {
    const sceneCount = analysis.scenes.length;
    const characterNames = analysis.characters.map(c => c.name).slice(0, 5).join(', ') || 'your principal cast';
    return `Fallback response (offline mode): With ${sceneCount} drafted scenes and key characters such as ${characterNames}, consider how the emotional beats support the query "${query}". Focus on clear blocking and lighting to reinforce the intended tone until AI services resume.`;
};

export const fallbackScriptAnalysis = (scriptContent: string): ScriptAnalysis => {
    const trimmed = scriptContent?.trim();
    if (!trimmed) {
        return DEMO_PROJECT_DATA();
    }

    const lines = trimmed.split(/\r?\n/);
    const titleLine = lines.find(line => line.trim().length > 0) ?? 'Untitled Project';
    const title = sanitizeText(titleLine);
    const summaryParagraphs = trimmed.split(/\n\s*\n/).map(p => sanitizeText(p)).filter(Boolean);
    const summary = summaryParagraphs.slice(0, 2).join(' ') || 'Fallback summary generated automatically. Refine once AI services are restored.';

    const sceneHeadings = extractSceneHeadings(lines);
    const scenes: AnalyzedScene[] = [];

    sceneHeadings.forEach((headingInfo, index) => {
        const nextHeading = sceneHeadings[index + 1];
        const endIndex = nextHeading ? nextHeading.index : lines.length;
        const summaryText = parseSceneSummary(lines, headingInfo.index, endIndex);
        const id = `scene-${index + 1}`;
        scenes.push({
            id,
            sceneNumber: index + 1,
            setting: headingInfo.heading,
            summary: summaryText,
            time_of_day: deriveTimeOfDay(headingInfo.heading),
            mood: 'Generated using offline fallback heuristics.',
            lighting: 'Adaptive to the scene tone; refine later with precise direction.',
            frames: buildFallbackFrames(id, summaryText, headingInfo.heading)
        });
    });

    const characters = extractCharacters(lines);
    const locations = extractLocations(scenes);

    const moodboard = defaultMoodboard(title);
    const moodboardTemplates = defaultMoodboardTemplates(title, moodboard);

    return {
        title,
        logline: `Fallback logline for "${title}". Update this once AI analysis succeeds.`,
        summary,
        scenes,
        characters,
        locations,
        props: [],
        styling: [],
        setDressing: [],
        makeupAndHair: [],
        sound: [],
        moodboard,
        moodboardTemplates,
    };
};
