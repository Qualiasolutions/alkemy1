
import { ScriptAnalysis, AnalyzedScene, Frame, AnalyzedCharacter, AnalyzedLocation, FrameStatus, Generation, Moodboard, MoodboardSection, MoodboardTemplate } from '../types';
import { Type, GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { fallbackScriptAnalysis, fallbackMoodboardDescription, fallbackDirectorResponse, getFallbackImageUrl, getFallbackVideoBlobs } from './fallbackContent';
import { getGeminiApiKey, clearGeminiApiKey, getApiKeyValidationError, isValidGeminiApiKeyFormat } from './apiKeys';
import { getMediaService } from './mediaService';
import { logAIUsage, USAGE_ACTIONS } from './usageService';
// Flux API removed - using free Pollinations models instead
import { trackGenerationMetrics } from './analyticsService';
import { API_COST_ESTIMATES } from './apiConstants';
import { networkDetection } from './networkDetection';
import { generateImageWithPollinations, isPollinationsAvailable, type PollinationsImageModel } from './pollinationsService';
import { generateImageWithFlux, isFluxApiAvailable, type FluxModelVariant } from './fluxService';
// BFL service removed due to CORS issues - using FAL models only
import { ENHANCED_DIRECTOR_KNOWLEDGE } from './directorKnowledge';
import { generateTextToVideoWithHF, generateVideoWithHF } from './huggingFaceService';
// This file simulates interactions with external services like Gemini, Drive, and a backend API.

/**
 * Generate video from text prompt using HuggingFace Inference API (Free Tier)
 * @param prompt - Text description of the video to generate
 * @param onProgress - Optional progress callback
 * @param context - Optional context for usage logging
 * @returns URL to the generated video
 */
export async function generateVideoFromText(
    prompt: string,
    onProgress?: (progress: number) => void,
    context?: { projectId?: string; userId?: string; sceneId?: string; frameId?: string }
): Promise<string> {
    const startTime = Date.now();
    console.log('[AI Service] Generating video from text with HuggingFace', { prompt: prompt.substring(0, 50) });

    try {
        // Validate network connectivity
        networkDetection.throwIfOffline('video generation');

        // Validate inputs
        if (!prompt || !prompt.trim()) {
            throw new Error("Please enter a prompt to generate a video.");
        }

        // Call HuggingFace text-to-video service
        const videoUrl = await generateTextToVideoWithHF(prompt, onProgress);

        // Log usage for analytics
        if (context?.userId && context?.projectId) {
            await logAIUsage(
                context.userId,
                USAGE_ACTIONS.VIDEO_GENERATION,
                undefined, // Token count not available for HF
                context.projectId,
                {
                    model: 'HuggingFace text-to-video',
                    prompt: prompt.substring(0, 200),
                    duration: Date.now() - startTime,
                    sceneId: context.sceneId,
                    frameId: context.frameId,
                    provider: 'HuggingFace'
                }
            );
        }

        return videoUrl;

    } catch (error) {
        console.error('[AI Service] Text-to-video generation failed:', error);
        onProgress?.(100);

        // Track failed generation
        if (context?.projectId) {
            trackGenerationMetrics(
                context.projectId,
                'video',
                'HuggingFace text-to-video',
                (Date.now() - startTime) / 1000,
                0, // No cost for free service
                false, // failure
                error instanceof Error ? error.message : 'Unknown error'
            );
        }

        throw error;
    }
}
