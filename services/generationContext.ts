/**
 * Generation Context Service
 *
 * Provides unified context for AI generation across all tabs.
 * Ensures consistent character identity, location 3D worlds, and moodboard styling
 * are applied throughout the production pipeline.
 *
 * Epic Integration:
 * - Epic 2: Character Identity (LoRA consistency)
 * - Epic 3: 3D Worlds (Location integration)
 * - Epic 6: Moodboard (Styling consistency)
 */

import type {
    AnalyzedCharacter,
    AnalyzedLocation,
    AnalyzedScene,
    Frame,
    Moodboard,
    MoodboardTemplate,
    CharacterIdentity
} from '@/types';
import { getCharacterIdentityStatus } from './characterIdentityService';

/**
 * Character with ready-to-use identity data
 */
export interface CharacterWithIdentity {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
    identity?: CharacterIdentity;

    // Computed fields for easy access
    hasIdentity: boolean;
    loraUrl?: string;
    loraScale?: number;
}

/**
 * Location with optional 3D world binding
 */
export interface LocationWith3DWorld {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;

    // 3D World integration (Epic 3)
    worldId?: string;
    cameraPresets?: Array<{
        position: [number, number, number];
        rotation: [number, number, number];
        fov: number;
    }>;
}

/**
 * Complete generation context for a scene/frame
 */
export interface GenerationContext {
    // Core assets
    characters: CharacterWithIdentity[];
    locations: LocationWith3DWorld[];
    moodboard?: Moodboard;
    moodboardTemplates: MoodboardTemplate[];

    // Optional scene context
    activeScene?: AnalyzedScene;
    activeFrame?: Frame;

    // Computed helpers
    readyCharacterIdentities: Array<{ loraUrl: string; scale: number }>;
    hasAnyIdentities: boolean;
}

/**
 * Build generation context from project state
 */
export function buildGenerationContext(params: {
    characters: AnalyzedCharacter[];
    locations: AnalyzedLocation[];
    moodboard?: Moodboard;
    moodboardTemplates?: MoodboardTemplate[];
    activeScene?: AnalyzedScene;
    activeFrame?: Frame;
}): GenerationContext {
    const {
        characters,
        locations,
        moodboard,
        moodboardTemplates = [],
        activeScene,
        activeFrame
    } = params;

    // Transform characters with computed identity fields
    const enrichedCharacters: CharacterWithIdentity[] = characters.map(char => {
        const identityStatus = getCharacterIdentityStatus(char.identity);
        const hasIdentity = identityStatus === 'ready';

        return {
            id: char.id,
            name: char.name,
            description: char.description,
            imageUrl: char.imageUrl,
            identity: char.identity,
            hasIdentity,
            loraUrl: hasIdentity ? char.identity?.technologyData?.falCharacterId : undefined,
            loraScale: hasIdentity
                ? (char.identity?.technologyData?.referenceStrength || 80) / 100
                : undefined
        };
    });

    // Transform locations (3D world binding will be added later)
    const enrichedLocations: LocationWith3DWorld[] = locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        description: loc.description,
        imageUrl: loc.imageUrl,
        // TODO Epic 3: Add 3D world bindings
        worldId: undefined,
        cameraPresets: undefined
    }));

    // Extract ready character identities for easy use
    const readyCharacterIdentities = enrichedCharacters
        .filter(char => char.hasIdentity && char.loraUrl)
        .map(char => ({
            loraUrl: char.loraUrl!,
            scale: char.loraScale || 0.8
        }));

    return {
        characters: enrichedCharacters,
        locations: enrichedLocations,
        moodboard,
        moodboardTemplates,
        activeScene,
        activeFrame,
        readyCharacterIdentities,
        hasAnyIdentities: readyCharacterIdentities.length > 0
    };
}

/**
 * Get character identities for a specific frame
 *
 * Filters the generation context to only include characters mentioned in the frame.
 * Used when generating stills/videos for a specific shot.
 */
export function getFrameCharacterIdentities(
    context: GenerationContext,
    frame: Frame
): Array<{ loraUrl: string; scale: number }> {
    // Extract character names from frame description
    // TODO: Later enhance with explicit character tagging in Frame type
    const frameDescription = frame.description.toLowerCase();

    return context.characters
        .filter(char => {
            if (!char.hasIdentity || !char.loraUrl) return false;

            // Check if character name appears in frame description
            const nameMatch = frameDescription.includes(char.name.toLowerCase());
            return nameMatch;
        })
        .map(char => ({
            loraUrl: char.loraUrl!,
            scale: char.loraScale || 0.8
        }));
}

/**
 * Get character identities for specific character IDs
 *
 * Used when explicitly selecting characters for a frame/shot.
 */
export function getSelectedCharacterIdentities(
    context: GenerationContext,
    characterIds: string[]
): Array<{ loraUrl: string; scale: number }> {
    return context.characters
        .filter(char => characterIds.includes(char.id) && char.hasIdentity && char.loraUrl)
        .map(char => ({
            loraUrl: char.loraUrl!,
            scale: char.loraScale || 0.8
        }));
}

/**
 * Get location context for a specific location ID
 */
export function getLocationContext(
    context: GenerationContext,
    locationId: string
): LocationWith3DWorld | null {
    return context.locations.find(loc => loc.id === locationId) || null;
}

/**
 * Check if context has any ready assets
 */
export function hasReadyAssets(context: GenerationContext): boolean {
    const hasCharacters = context.characters.some(char => char.imageUrl !== null);
    const hasLocations = context.locations.some(loc => loc.imageUrl !== null);
    const hasIdentities = context.hasAnyIdentities;

    return hasCharacters || hasLocations || hasIdentities;
}

/**
 * Get generation stats for UI display
 */
export function getGenerationStats(context: GenerationContext): {
    totalCharacters: number;
    charactersWithIdentity: number;
    totalLocations: number;
    locationsWithWorlds: number;
    hasMoodboard: boolean;
} {
    return {
        totalCharacters: context.characters.length,
        charactersWithIdentity: context.characters.filter(c => c.hasIdentity).length,
        totalLocations: context.locations.length,
        locationsWithWorlds: context.locations.filter(l => l.worldId).length,
        hasMoodboard: !!context.moodboard
    };
}
