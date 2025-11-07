/**
 * Image Search Service
 * Handles searching and fetching images from the web using Brave Search API
 */

import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from './apiKeys';

const BRAVE_API_KEY = (process.env.BRAVE_SEARCH_API_KEY ?? '').trim();

export interface SearchedImage {
    url: string;
    title: string;
    description?: string;
    source?: string;
    width?: number;
    height?: number;
    license?: string;
}

interface SearchProgress {
    stage: 'analyzing' | 'searching' | 'fetching' | 'complete';
    message: string;
    progress: number;
}

/**
 * Searches for images based on a prompt using AI-enhanced search
 * This uses a combination of structured prompting to generate search terms
 * and simulates web scraping (in production, would integrate with actual image APIs)
 */
export const searchImages = async (
    prompt: string,
    moodboardContext?: string,
    onProgress?: (progress: SearchProgress) => void
): Promise<SearchedImage[]> => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error('Gemini API key not found');
    }

    const genAI = new GoogleGenAI({ apiKey });

    try {
        // Step 1: Analyze the prompt and generate search terms
        onProgress?.({
            stage: 'analyzing',
            message: 'Analyzing your request...',
            progress: 20
        });

        const analysisPrompt = `You are a professional image researcher for film production.

User Request: "${prompt}"
${moodboardContext ? `Current Moodboard Context: ${moodboardContext}` : ''}

Generate 5-8 specific search queries that would find high-quality reference images for this request.
Consider cinematographic aspects like composition, lighting, color palette, and mood.

Return ONLY a JSON array of search queries, nothing else:
["query1", "query2", "query3", ...]`;

        const analysisResult = await genAI.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: analysisPrompt
        });
        const searchQueries = JSON.parse(
            analysisResult.text
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim()
        );

        // Step 2: Search using Brave Search API
        onProgress?.({
            stage: 'searching',
            message: 'Searching for relevant images...',
            progress: 50
        });

        if (!BRAVE_API_KEY) {
            throw new Error('Brave Search API key is not configured');
        }

        const images: SearchedImage[] = [];

        // Search with Brave API for each query
        for (const query of searchQueries.slice(0, 3)) { // Limit to 3 queries to avoid rate limits
            try {
                const response = await fetch(`https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=4&safesearch=moderate`, {
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Encoding': 'gzip',
                        'X-Subscription-Token': BRAVE_API_KEY
                    }
                });

                if (!response.ok) {
                    console.warn(`Brave Search API error for query "${query}": ${response.status} ${response.statusText}`);
                    continue;
                }

                const data = await response.json();

                if (data.results && Array.isArray(data.results)) {
                    for (const result of data.results) {
                        if (result.properties?.url) {
                            images.push({
                                url: result.properties.url,
                                title: result.title || query,
                                description: result.description || `Image related to: ${query}`,
                                source: result.page_fetched || 'Web',
                                width: result.properties.width || 1600,
                                height: result.properties.height || 900,
                                license: 'Web Content'
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`Error searching with Brave for "${query}":`, error);
            }
        }

        // Step 3: Validate and filter images
        onProgress?.({
            stage: 'fetching',
            message: 'Processing search results...',
            progress: 80
        });

        // Filter out invalid URLs and limit results
        const validImages = images
            .filter(img => img.url && img.url.startsWith('http'))
            .slice(0, 12); // Limit to 12 results

        onProgress?.({
            stage: 'complete',
            message: `Found ${validImages.length} relevant images`,
            progress: 100
        });

        return validImages;

    } catch (error) {
        console.error('Image search error:', error);
        throw new Error(`Failed to search images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Enhanced image search with specific cinematography focus
 */
export const searchCinematographyReferences = async (
    category: 'cinematography' | 'color' | 'style' | 'other',
    specifications: {
        mood?: string;
        lighting?: string;
        composition?: string;
        colorPalette?: string;
        reference?: string; // e.g., "Blade Runner 2049", "Wes Anderson style"
    },
    onProgress?: (progress: SearchProgress) => void
): Promise<SearchedImage[]> => {
    const prompt = buildCinematographyPrompt(category, specifications);
    const context = `Searching for ${category} references with specific focus on professional film production quality`;

    return searchImages(prompt, context, onProgress);
};

/**
 * Build specialized prompts for cinematography searches
 */
function buildCinematographyPrompt(
    category: string,
    specs: any
): string {
    const parts = [`Professional ${category} reference`];

    if (specs.mood) parts.push(`${specs.mood} mood`);
    if (specs.lighting) parts.push(`${specs.lighting} lighting`);
    if (specs.composition) parts.push(`${specs.composition} composition`);
    if (specs.colorPalette) parts.push(`${specs.colorPalette} color palette`);
    if (specs.reference) parts.push(`in the style of ${specs.reference}`);

    return parts.join(', ');
}

/**
 * Search for images similar to a reference image
 */
export const searchSimilarImages = async (
    referenceImageUrl: string,
    additionalContext?: string,
    onProgress?: (progress: SearchProgress) => void
): Promise<SearchedImage[]> => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error('Gemini API key not found');
    }

    const genAI = new GoogleGenAI({ apiKey });

    try {
        onProgress?.({
            stage: 'analyzing',
            message: 'Analyzing reference image...',
            progress: 20
        });

        // Convert image URL to base64 if needed
        const imageData = await fetch(referenceImageUrl)
            .then(r => r.blob())
            .then(blob => new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            }));

        const analysisPrompt = `Analyze this image and describe its key visual characteristics:
- Composition and framing
- Lighting style and direction
- Color palette and grading
- Mood and atmosphere
- Camera angle and perspective
- Any distinctive stylistic elements

${additionalContext ? `Additional context: ${additionalContext}` : ''}

Provide 5 search queries to find similar images.`;

        const result = await genAI.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [
                { text: analysisPrompt },
                { inlineData: { mimeType: 'image/jpeg', data: imageData.split(',')[1] } }
            ]
        });

        const response = result.text;

        // Extract search queries from the response
        const queries = response
            .split('\n')
            .filter(line => line.trim().startsWith('-') || line.match(/^\d+\./))
            .map(line => line.replace(/^[-\d.]\s*/, '').trim())
            .slice(0, 5);

        // Search using the extracted queries
        const searchPrompt = queries.join(', ');
        return searchImages(searchPrompt, 'Finding visually similar references', onProgress);

    } catch (error) {
        console.error('Similar image search error:', error);
        throw new Error(`Failed to search similar images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Batch download images for offline use
 */
export const downloadImagesAsDataUrls = async (
    images: SearchedImage[],
    onProgress?: (current: number, total: number) => void
): Promise<{ image: SearchedImage; dataUrl: string }[]> => {
    const results: { image: SearchedImage; dataUrl: string }[] = [];

    for (let i = 0; i < images.length; i++) {
        onProgress?.(i + 1, images.length);

        try {
            const response = await fetch(images[i].url);
            const blob = await response.blob();
            const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            results.push({ image: images[i], dataUrl });
        } catch (error) {
            console.error(`Failed to download image ${images[i].url}:`, error);
            // Continue with other images even if one fails
        }
    }

    return results;
};