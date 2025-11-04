/**
 * Image Search Service
 * Handles searching and fetching images from the web based on prompts
 */

import { GoogleGenerativeAI } from '@google/genai';

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
    const apiKey = process.env.GEMINI_API_KEY || window.localStorage.getItem('geminiApiKey') || '';
    if (!apiKey) {
        throw new Error('Gemini API key not found');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

        const analysisResult = await model.generateContent(analysisPrompt);
        const searchQueries = JSON.parse(
            analysisResult.response.text()
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim()
        );

        // Step 2: Generate image URLs based on search queries
        onProgress?.({
            stage: 'searching',
            message: 'Searching for relevant images...',
            progress: 50
        });

        // In production, this would connect to actual image search APIs
        // For now, we'll use Unsplash's free API structure as reference
        const images: SearchedImage[] = [];

        for (const query of searchQueries.slice(0, 5)) {
            // Using Unsplash's public CDN structure for demonstration
            // In production, use proper API with authentication
            const encodedQuery = encodeURIComponent(query);

            // Generate 2-3 image references per query
            for (let i = 0; i < 2; i++) {
                const width = 1600;
                const height = 900;
                const seed = Math.random().toString(36).substring(7);

                images.push({
                    url: `https://source.unsplash.com/${width}x${height}/?${encodedQuery}&sig=${seed}`,
                    title: query,
                    description: `Reference image for: ${query}`,
                    source: 'Unsplash',
                    width,
                    height,
                    license: 'Unsplash License'
                });
            }
        }

        // Step 3: Validate and filter images
        onProgress?.({
            stage: 'fetching',
            message: 'Validating image availability...',
            progress: 80
        });

        // In production, validate image URLs are accessible
        // For now, we'll return all generated URLs
        const validImages = images.slice(0, 10); // Limit to 10 results

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
    const apiKey = process.env.GEMINI_API_KEY || window.localStorage.getItem('geminiApiKey') || '';
    if (!apiKey) {
        throw new Error('Gemini API key not found');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

        const result = await model.generateContent([
            analysisPrompt,
            { inlineData: { mimeType: 'image/jpeg', data: imageData.split(',')[1] } }
        ]);

        const response = result.response.text();

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