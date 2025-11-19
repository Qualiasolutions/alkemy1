// Smart Model Router Service
// Intelligently selects the best AI model based on budget, quality requirements, and availability

export type BudgetStrategy = 'free-only' | 'free-first' | 'quality-first' | 'unlimited';

export interface ModelRoutingStrategy {
    budget: BudgetStrategy;
    qualityThreshold: number; // 0-100
    maxCostPerImage?: number;
    maxCostPerVideo?: number;
    preferredProviders?: string[];
    allowFallback: boolean;
}

export interface ModelCandidate {
    provider: string;
    model: string;
    displayName: string;
    cost: number;
    quality: number;
    speed: number; // seconds
    supportsLoRA: boolean;
    requiresApiKey: boolean;
    freeCredits?: string;
    monthlyFreeLimit?: string;
}

// Available image generation models with their characteristics
const IMAGE_MODELS: ModelCandidate[] = [
    // 100% FREE Models
    {
        provider: 'pollinations',
        model: 'FLUX Schnell',
        displayName: 'FLUX Schnell (FREE)',
        cost: 0,
        quality: 70,
        speed: 12,
        supportsLoRA: false,
        requiresApiKey: false
    },
    {
        provider: 'pollinations',
        model: 'FLUX Realism',
        displayName: 'FLUX Realism (FREE)',
        cost: 0,
        quality: 75,
        speed: 15,
        supportsLoRA: false,
        requiresApiKey: false
    },
    {
        provider: 'pollinations',
        model: 'FLUX Anime',
        displayName: 'FLUX Anime (FREE)',
        cost: 0,
        quality: 72,
        speed: 12,
        supportsLoRA: false,
        requiresApiKey: false
    },
    {
        provider: 'pollinations',
        model: 'Stable Diffusion',
        displayName: 'Stable Diffusion (FREE)',
        cost: 0,
        quality: 68,
        speed: 10,
        supportsLoRA: false,
        requiresApiKey: false
    },

    // HuggingFace FREE Tier Models
    {
        provider: 'huggingface',
        model: 'FLUX.1-dev (HuggingFace)',
        displayName: 'FLUX.1-dev (FREE tier)',
        cost: 0.0012, // After free tier
        quality: 88,
        speed: 20,
        supportsLoRA: false,
        requiresApiKey: true,
        monthlyFreeLimit: 'Monthly credits'
    },
    {
        provider: 'huggingface',
        model: 'FLUX Schnell (HuggingFace)',
        displayName: 'FLUX Schnell (FREE tier)',
        cost: 0.0008,
        quality: 75,
        speed: 8,
        supportsLoRA: false,
        requiresApiKey: true,
        monthlyFreeLimit: 'Monthly credits'
    },
    {
        provider: 'huggingface',
        model: 'SDXL (HuggingFace)',
        displayName: 'SDXL (FREE tier)',
        cost: 0.001,
        quality: 85,
        speed: 15,
        supportsLoRA: false,
        requiresApiKey: true,
        monthlyFreeLimit: 'Monthly credits'
    },
    {
        provider: 'huggingface',
        model: 'SDXL Turbo (HuggingFace)',
        displayName: 'SDXL Turbo (FREE tier)',
        cost: 0.0005,
        quality: 78,
        speed: 4,
        supportsLoRA: false,
        requiresApiKey: true,
        monthlyFreeLimit: 'Monthly credits'
    },
    {
        provider: 'huggingface',
        model: 'Stable Diffusion 3 (HuggingFace)',
        displayName: 'SD3 (FREE tier)',
        cost: 0.0015,
        quality: 90,
        speed: 25,
        supportsLoRA: false,
        requiresApiKey: true,
        monthlyFreeLimit: 'Monthly credits'
    },

    // Replicate Models ($5-10 free credits)
    {
        provider: 'replicate',
        model: 'FLUX Schnell (Replicate)',
        displayName: 'FLUX Schnell ($5-10 free)',
        cost: 0.002,
        quality: 75,
        speed: 8,
        supportsLoRA: false,
        requiresApiKey: true,
        freeCredits: '$5-10'
    },
    {
        provider: 'replicate',
        model: 'SDXL Lightning (Replicate)',
        displayName: 'SDXL Lightning ($5-10 free)',
        cost: 0.0015,
        quality: 80,
        speed: 4,
        supportsLoRA: false,
        requiresApiKey: true,
        freeCredits: '$5-10'
    },
    {
        provider: 'replicate',
        model: 'Stable Diffusion 3 (Replicate)',
        displayName: 'SD3 ($5-10 free)',
        cost: 0.004,
        quality: 90,
        speed: 10,
        supportsLoRA: false,
        requiresApiKey: true,
        freeCredits: '$5-10'
    },
    {
        provider: 'replicate',
        model: 'SDXL Turbo (Replicate)',
        displayName: 'SDXL Turbo ($5-10 free)',
        cost: 0.0015,
        quality: 78,
        speed: 2,
        supportsLoRA: false,
        requiresApiKey: true,
        freeCredits: '$5-10'
    },

    // Premium FAL.AI Models
    {
        provider: 'fal',
        model: 'FLUX.1.1 Pro (FAL)',
        displayName: 'FLUX.1.1 Pro (Premium)',
        cost: 0.055,
        quality: 95,
        speed: 6,
        supportsLoRA: true,
        requiresApiKey: true
    },
    {
        provider: 'fal',
        model: 'FLUX Ultra (FAL)',
        displayName: 'FLUX Ultra (Premium)',
        cost: 0.08,
        quality: 98,
        speed: 8,
        supportsLoRA: true,
        requiresApiKey: true
    },
    {
        provider: 'fal',
        model: 'FLUX.1 Kontext (FAL)',
        displayName: 'FLUX Kontext (Premium)',
        cost: 0.04,
        quality: 92,
        speed: 7,
        supportsLoRA: true,
        requiresApiKey: true
    },
    {
        provider: 'fal',
        model: 'Seadream v4 (FAL)',
        displayName: 'Seadream v4 (Premium)',
        cost: 0.045,
        quality: 90,
        speed: 6,
        supportsLoRA: true,
        requiresApiKey: true
    }
];

// Available video generation models
const VIDEO_MODELS: ModelCandidate[] = [
    // HuggingFace FREE Tier Video (experimental)
    {
        provider: 'huggingface',
        model: 'CogVideoX',
        displayName: 'CogVideoX (FREE tier)',
        cost: 0.006, // After free tier
        quality: 50,
        speed: 180,
        supportsLoRA: false,
        requiresApiKey: true,
        monthlyFreeLimit: 'Monthly credits'
    },
    {
        provider: 'huggingface',
        model: 'AnimateDiff',
        displayName: 'AnimateDiff (FREE tier)',
        cost: 0.004,
        quality: 60,
        speed: 120,
        supportsLoRA: false,
        requiresApiKey: true,
        monthlyFreeLimit: 'Monthly credits'
    },

    // Premium Video Models
    {
        provider: 'fal',
        model: 'Kling 2.1 Pro',
        displayName: 'Kling 2.1 Pro',
        cost: 0.50,
        quality: 90,
        speed: 45,
        supportsLoRA: false,
        requiresApiKey: true
    },
    {
        provider: 'fal',
        model: 'WAN 2.1',
        displayName: 'WAN 2.1',
        cost: 0.40,
        quality: 85,
        speed: 35,
        supportsLoRA: false,
        requiresApiKey: true
    },
    {
        provider: 'google',
        model: 'Veo 3.1',
        displayName: 'Google Veo 3.1',
        cost: 0.60,
        quality: 92,
        speed: 60,
        supportsLoRA: false,
        requiresApiKey: true
    }
];

/**
 * Select the best image model based on requirements and strategy
 */
export function selectBestImageModel(
    requirements: {
        needsLoRA: boolean;
        needsHighQuality: boolean;
        aspectRatio: string;
        hasReferenceImages?: boolean;
    },
    strategy: ModelRoutingStrategy
): ModelCandidate | null {
    let candidates = [...IMAGE_MODELS];

    // Filter by LoRA requirement
    if (requirements.needsLoRA) {
        candidates = candidates.filter(m => m.supportsLoRA);
    }

    // Filter by quality threshold
    candidates = candidates.filter(m => m.quality >= strategy.qualityThreshold);

    // Filter by max cost
    if (strategy.maxCostPerImage !== undefined) {
        candidates = candidates.filter(m => m.cost <= strategy.maxCostPerImage);
    }

    // Filter by preferred providers
    if (strategy.preferredProviders && strategy.preferredProviders.length > 0) {
        const preferredCandidates = candidates.filter(m =>
            strategy.preferredProviders!.includes(m.provider)
        );
        if (preferredCandidates.length > 0) {
            candidates = preferredCandidates;
        }
    }

    // Apply budget strategy
    switch (strategy.budget) {
        case 'free-only':
            // Only completely free models (cost = 0 or has free credits)
            candidates = candidates.filter(m =>
                m.cost === 0 || m.freeCredits || m.monthlyFreeLimit
            );
            break;

        case 'free-first':
            // Sort by cost (free first)
            candidates.sort((a, b) => {
                // Prioritize truly free models
                if (a.cost === 0 && b.cost !== 0) return -1;
                if (b.cost === 0 && a.cost !== 0) return 1;
                // Then models with free credits
                if (a.freeCredits && !b.freeCredits) return -1;
                if (b.freeCredits && !a.freeCredits) return 1;
                // Then by cost
                return a.cost - b.cost;
            });
            break;

        case 'quality-first':
            // Sort by quality (highest first)
            candidates.sort((a, b) => b.quality - a.quality);
            break;

        case 'unlimited':
            // Balance quality and speed
            candidates.sort((a, b) => {
                const scoreA = a.quality / a.speed;
                const scoreB = b.quality / b.speed;
                return scoreB - scoreA;
            });
            break;
    }

    // Return the best candidate or null if none available
    return candidates.length > 0 ? candidates[0] : null;
}

/**
 * Select the best video model based on requirements and strategy
 */
export function selectBestVideoModel(
    requirements: {
        needsHighQuality: boolean;
        duration: number; // seconds
        hasReferenceImage?: boolean;
    },
    strategy: ModelRoutingStrategy
): ModelCandidate | null {
    let candidates = [...VIDEO_MODELS];

    // Filter by quality threshold
    candidates = candidates.filter(m => m.quality >= strategy.qualityThreshold);

    // Filter by max cost
    if (strategy.maxCostPerVideo !== undefined) {
        candidates = candidates.filter(m => m.cost <= strategy.maxCostPerVideo);
    }

    // Apply budget strategy
    switch (strategy.budget) {
        case 'free-only':
            candidates = candidates.filter(m =>
                m.cost === 0 || m.monthlyFreeLimit
            );
            break;

        case 'free-first':
            candidates.sort((a, b) => a.cost - b.cost);
            break;

        case 'quality-first':
            candidates.sort((a, b) => b.quality - a.quality);
            break;

        case 'unlimited':
            // Balance quality and speed
            candidates.sort((a, b) => {
                const scoreA = a.quality / a.speed;
                const scoreB = b.quality / b.speed;
                return scoreB - scoreA;
            });
            break;
    }

    return candidates.length > 0 ? candidates[0] : null;
}

/**
 * Get recommended fallback models for a given model
 */
export function getFallbackModels(model: string, maxFallbacks: number = 3): string[] {
    const currentModel = IMAGE_MODELS.find(m => m.model === model);
    if (!currentModel) return [];

    // Find similar models with lower cost
    const fallbacks = IMAGE_MODELS
        .filter(m =>
            m.model !== model &&
            m.cost < currentModel.cost &&
            Math.abs(m.quality - currentModel.quality) <= 20
        )
        .sort((a, b) => b.quality - a.quality)
        .slice(0, maxFallbacks)
        .map(m => m.model);

    return fallbacks;
}

/**
 * Estimate total generation cost for a project
 */
export function estimateProjectCost(
    imageCount: number,
    videoCount: number,
    strategy: ModelRoutingStrategy
): {
    minCost: number;
    maxCost: number;
    recommendedBudget: number;
} {
    const imageModel = selectBestImageModel(
        { needsLoRA: false, needsHighQuality: false, aspectRatio: '16:9' },
        strategy
    );

    const videoModel = selectBestVideoModel(
        { needsHighQuality: false, duration: 5 },
        strategy
    );

    const minImageCost = strategy.budget === 'free-only' ? 0 : (imageModel?.cost || 0) * imageCount;
    const minVideoCost = strategy.budget === 'free-only' ? 0 : (videoModel?.cost || 0) * videoCount;

    const maxImageCost = 0.08 * imageCount; // FLUX Ultra max
    const maxVideoCost = 0.60 * videoCount; // Veo 3.1 max

    return {
        minCost: minImageCost + minVideoCost,
        maxCost: maxImageCost + maxVideoCost,
        recommendedBudget: (minImageCost + minVideoCost) * 1.5 // 50% buffer
    };
}

/**
 * Get all available models grouped by provider
 */
export function getModelsByProvider(): Record<string, ModelCandidate[]> {
    const grouped: Record<string, ModelCandidate[]> = {};

    [...IMAGE_MODELS, ...VIDEO_MODELS].forEach(model => {
        if (!grouped[model.provider]) {
            grouped[model.provider] = [];
        }
        grouped[model.provider].push(model);
    });

    return grouped;
}

/**
 * Get user-friendly model recommendations based on use case
 */
export function getRecommendedModels(useCase: 'draft' | 'production' | 'character' | 'video'): {
    primary: ModelCandidate;
    fallback: ModelCandidate;
    budget: ModelCandidate;
} | null {
    switch (useCase) {
        case 'draft':
            return {
                primary: IMAGE_MODELS.find(m => m.model === 'FLUX.1-dev (HuggingFace)')!,
                fallback: IMAGE_MODELS.find(m => m.model === 'FLUX Schnell (Replicate)')!,
                budget: IMAGE_MODELS.find(m => m.model === 'FLUX Schnell')!
            };

        case 'production':
            return {
                primary: IMAGE_MODELS.find(m => m.model === 'FLUX.1.1 Pro (FAL)')!,
                fallback: IMAGE_MODELS.find(m => m.model === 'FLUX.1-dev (HuggingFace)')!,
                budget: IMAGE_MODELS.find(m => m.model === 'FLUX Realism')!
            };

        case 'character':
            // Only FAL models support LoRA
            return {
                primary: IMAGE_MODELS.find(m => m.model === 'FLUX.1.1 Pro (FAL)')!,
                fallback: IMAGE_MODELS.find(m => m.model === 'FLUX Ultra (FAL)')!,
                budget: IMAGE_MODELS.find(m => m.model === 'FLUX.1.1 Pro (FAL)')! // No free LoRA option
            };

        case 'video':
            return {
                primary: VIDEO_MODELS.find(m => m.model === 'Kling 2.1 Pro')!,
                fallback: VIDEO_MODELS.find(m => m.model === 'WAN 2.1')!,
                budget: VIDEO_MODELS.find(m => m.model === 'AnimateDiff')!
            };

        default:
            return null;
    }
}

/**
 * Default routing strategy
 */
export const DEFAULT_STRATEGY: ModelRoutingStrategy = {
    budget: 'free-first',
    qualityThreshold: 70,
    maxCostPerImage: 0.10,
    maxCostPerVideo: 1.00,
    allowFallback: true
};