/**
 * Image Search Service
 * Handles searching and fetching images from the web using Brave Search API
 */

import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from './apiKeys';

// Brave API configuration - always use proxy in browser environment
const importMetaEnv = typeof import.meta !== 'undefined' ? (import.meta as any)?.env ?? {} : {};
const BRAVE_PROXY_URL =
    (importMetaEnv.VITE_BRAVE_PROXY_URL as string | undefined) ||
    '/api/brave-proxy';
// Always use proxy in browser environment for security (API key should never be exposed client-side)
const shouldUseBraveProxy = true;

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
export async function searchImages(
    prompt: string,
    moodboardContext?: string,
    onProgress?: (progress: SearchProgress) => void
): Promise<SearchedImage[]> {
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

Generate 3-5 HIGHLY SPECIFIC search queries that would find exactly what the user wants.
Be very precise and literal - if they say "haunted houses", focus on haunted houses, not general architecture.
Add relevant descriptive terms like "dark", "spooky", "abandoned" for mood-specific searches.
Consider cinematographic aspects like composition, lighting, color palette, and atmosphere.

IMPORTANT: Make queries specific to the exact subject matter requested.
Examples:
- For "haunted houses": ["abandoned victorian mansion dark", "spooky haunted house night", "derelict gothic manor"]
- For "cyberpunk city": ["neon cyberpunk cityscape night", "futuristic tokyo street lights", "blade runner style urban"]
- For "forest sunset": ["golden hour forest cinematography", "sunset through trees atmospheric", "woodland dusk photography"]

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

        // Step 2: Search using multiple image sources for better quality and diversity
        onProgress?.({
            stage: 'searching',
            message: 'Searching across multiple image sources...',
            progress: 50
        });

        const images: SearchedImage[] = [];

        // Try FrameSet first (film frames and screenshots)
        try {
            const frameSetImages = await searchFrameSet(searchQueries[0], 25);
            images.push(...frameSetImages);
        } catch (error) {
            console.warn('FrameSet search failed:', error);
        }

        // Then try Pexels (high-quality curated photos)
        try {
            const pexelsImages = await searchPexels(searchQueries[0], 25);
            images.push(...pexelsImages);
        } catch (error) {
            console.warn('Pexels search failed:', error);
        }

        // Then try Unsplash (professional photography)
        try {
            const unsplashImages = await searchUnsplash(searchQueries[0], 25);
            images.push(...unsplashImages);
        } catch (error) {
            console.warn('Unsplash search failed:', error);
        }

        // Finally use Brave for additional diverse results
        for (let i = 0; i < Math.min(searchQueries.length, 3); i++) { // Limit to 3 queries
            const query = searchQueries[i];

            // Add delay between requests to avoid rate limiting (except for first request)
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between requests
            }

            try {
                const response = await fetchBraveResponse(query, 20, 'strict');

                if (!response || !response.ok) {
                    console.warn(`Brave Search API error for query "${query}": ${response?.status ?? 'network'} ${response?.statusText ?? 'failed request'}`);
                    continue;
                }

                const rawBody = await response.text();
                let data: any;
                try {
                    data = JSON.parse(rawBody);
                } catch (parseError) {
                    console.error(`Brave proxy response was not valid JSON for "${query}":`, parseError, rawBody.slice(0, 200));
                    continue;
                }

                if (data.results && Array.isArray(data.results)) {
                    for (const result of data.results) {
                        if (result.properties?.url) {
                            images.push({
                                url: result.properties.url,
                                title: result.title || query,
                                description: result.description || `Image related to: ${query}`,
                                source: result.page_fetched || 'Brave Search',
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
            .slice(0, 100); // Limit to 100 results

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

type BraveSafeSearchLevel = 'strict' | 'off';

function buildProxyRequestUrl(params: URLSearchParams): string {
    const baseUrl = BRAVE_PROXY_URL || '/api/brave-proxy';
    const delimiter = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${delimiter}${params.toString()}`;
}

async function fetchBraveResponse(
    query: string,
    count: number,
    safesearch: BraveSafeSearchLevel
): Promise<Response | undefined> {
    const params = new URLSearchParams({ query, count: String(count), safesearch });

    try {
        const proxyUrl = buildProxyRequestUrl(params);
        const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            console.error(`Brave proxy request failed with status ${response.status} for query: "${query}"`);
            const errorBody = await response.text();
            console.error('Error response:', errorBody);
        }

        return response;
    } catch (error) {
        console.error('Brave proxy request failed:', error);
        return undefined;
    }
}

/**
 * Enhanced image search with specific cinematography focus
 */
export async function searchCinematographyReferences(
    category: 'cinematography' | 'color' | 'style' | 'other',
    specifications: {
        mood?: string;
        lighting?: string;
        composition?: string;
        colorPalette?: string;
        reference?: string; // e.g., "Blade Runner 2049", "Wes Anderson style"
    },
    onProgress?: (progress: SearchProgress) => void
): Promise<SearchedImage[]> {
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
export async function searchSimilarImages(
    referenceImageUrl: string,
    additionalContext?: string,
    onProgress?: (progress: SearchProgress) => void
): Promise<SearchedImage[]> {
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
export async function downloadImagesAsDataUrls(
    images: SearchedImage[],
    onProgress?: (current: number, total: number) => void
): Promise<{ image: SearchedImage; dataUrl: string }[]> {
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

/**
 * Search Pexels API for high-quality curated photos
 */
async function searchPexels(query: string, count: number): Promise<SearchedImage[]> {
    const PEXELS_API_KEY = (import.meta as any)?.env?.VITE_PEXELS_API_KEY;
    if (!PEXELS_API_KEY) {
        console.warn('Pexels API key not configured');
        return [];
    }

    try {
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
            {
                headers: {
                    'Authorization': PEXELS_API_KEY
                }
            }
        );

        if (!response.ok) {
            console.warn('Pexels API error:', response.status);
            return [];
        }

        const data = await response.json();

        return (data.photos || []).map((photo: any) => ({
            url: photo.src.large2x || photo.src.large,
            title: photo.alt || query,
            description: `Photo by ${photo.photographer}`,
            source: `Pexels - ${photo.photographer}`,
            width: photo.width,
            height: photo.height,
            license: 'Pexels License'
        }));
    } catch (error) {
        console.error('Pexels search error:', error);
        return [];
    }
}

/**
 * Search FrameSet.app for film frames and screenshots
 * FrameSet specializes in indexing film frames from movies and TV shows
 */
async function searchFrameSet(query: string, count: number): Promise<SearchedImage[]> {
    try {
        // FrameSet search URL structure - search for film frames and movie screenshots
        const searchUrl = `https://frameset.app/search?q=${encodeURIComponent(query)}&type=image`;

        // Use a CORS proxy or our existing Brave proxy for the request
        const proxyUrl = `/api/frameset-proxy?url=${encodeURIComponent(searchUrl)}`;

        const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (compatible; Alkemy-AI-Studio/1.0)'
            }
        });

        if (!response.ok) {
            console.warn('FrameSet proxy error:', response.status);
            return [];
        }

        const html = await response.text();

        // Parse HTML to extract image information
        // Since we don't have access to a DOM parser in Node.js environment, we'll use regex patterns
        const images: SearchedImage[] = [];

        // Look for image tags and accompanying information
        const imgMatches = html.match(/<img[^>]+src="([^"]+)"[^>]*>/g);
        const titleMatches = html.match(/<[^>]*>([^<]*(?:film|movie|scene|frame|shot|cinema)[^<]*)<[^>]*>/gi);

        if (imgMatches) {
            const extractedUrls: string[] = [];
            imgMatches.forEach((imgTag, index) => {
                const srcMatch = imgTag.match(/src="([^"]+)"/);
                if (srcMatch && srcMatch[1]) {
                    const url = srcMatch[1];
                    // Convert relative URLs to absolute
                    const absoluteUrl = url.startsWith('http') ? url : `https://frameset.app${url}`;

                    // Extract title from surrounding context or use query as fallback
                    const title = titleMatches && titleMatches[index]
                        ? titleMatches[index].replace(/<[^>]*>/g, '').trim()
                        : `Film frame: ${query}`;

                    // Only include direct image URLs (not thumbnails or icons)
                    if (url.match(/\.(jpg|jpeg|png|webp)$/i) && !extractedUrls.includes(absoluteUrl)) {
                        extractedUrls.push(absoluteUrl);
                        images.push({
                            url: absoluteUrl,
                            title: title,
                            description: `Film frame or movie screenshot from FrameSet.app`,
                            source: 'FrameSet.app - Film Frame Search',
                            width: 1920, // Default dimensions
                            height: 1080,
                            license: 'Film Frame - Educational Use'
                        });

                        // Limit the results
                        if (images.length >= count) return;
                    }
                }
            });
        }

        // If no results from parsing, try to generate sample results for demonstration
        if (images.length === 0) {
            console.warn('No images found in FrameSet results, generating placeholder results');
            // In a real implementation, you might want to use a proper HTML parser like cheerio
            // For now, we'll return empty results to avoid showing incorrect data
        }

        return images.slice(0, count);
    } catch (error) {
        console.error('FrameSet search error:', error);
        return [];
    }
}

/**
 * Search Unsplash API for professional photography
 */
async function searchUnsplash(query: string, count: number): Promise<SearchedImage[]> {
    const UNSPLASH_ACCESS_KEY = (import.meta as any)?.env?.VITE_UNSPLASH_ACCESS_KEY;
    if (!UNSPLASH_ACCESS_KEY) {
        console.warn('Unsplash API key not configured');
        return [];
    }

    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            }
        );

        if (!response.ok) {
            console.warn('Unsplash API error:', response.status);
            return [];
        }

        const data = await response.json();

        return (data.results || []).map((photo: any) => ({
            url: photo.urls.regular,
            title: photo.description || photo.alt_description || query,
            description: `Photo by ${photo.user.name}`,
            source: `Unsplash - ${photo.user.name}`,
            width: photo.width,
            height: photo.height,
            license: 'Unsplash License'
        }));
    } catch (error) {
        console.error('Unsplash search error:', error);
        return [];
    }
}
