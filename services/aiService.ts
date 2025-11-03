
import { ScriptAnalysis, AnalyzedScene, Frame, AnalyzedCharacter, AnalyzedLocation, FrameStatus, Generation, Moodboard, MoodboardSection } from '../types';
import { Type, GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold } from '@google/genai';
// This file simulates interactions with external services like Gemini, Drive, and a backend API.

const MOCK_API_DELAY = 1500;

const GEMINI_API_KEY = (process.env.API_KEY ?? process.env.GEMINI_API_KEY ?? '').trim();
const FLUX_API_KEY = (process.env.FLUX_API_KEY ?? '').trim();

const handleApiError = (error: unknown, model: string): Error => {
    console.error(`Error with ${model} API:`, error);
    let message = `An unknown error occurred with ${model}.`;
    if (error instanceof Error) {
        if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429')) {
             message = 'API quota exceeded. Please check your plan and billing details.';
        } else if (error.message.toLowerCase().includes('safety')) {
            message = 'Generation failed due to content safety filters. Please adjust your prompt.';
        } else if (error.message.includes('Requested entity was not found.')) {
            // This is a specific error for an invalid/not found API key.
            // Dispatch a global event to notify the UI to re-prompt for a key.
            window.dispatchEvent(new Event('invalid-api-key'));
            message = 'Your API Key was not found or is invalid. Please select a valid key.';
        } else {
            // Clean up generic messages
            message = error.message.replace(/\[\w+ \w+\]\s*/, ''); // Remove prefixes like [GoogleGenerativeAI Error]
        }
    }
    return new Error(message);
};


// --- Helper Functions ---
const image_url_to_base64 = async (url: string): Promise<{ mimeType: string; data: string }> => {
    // Handle data URLs directly
    if (url.startsWith('data:')) {
        const parts = url.split(',');
        if (parts.length !== 2) {
            console.error("Malformed data URL passed to base64 converter:", url.substring(0, 100));
            throw new Error("Malformed data URL: must contain a single comma.");
        }
        const [meta, data] = parts;
        const mimeMatch = meta.match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        if (!mimeMatch) console.warn("Could not determine MIME type from data URL, defaulting to octet-stream.", meta);
        return { mimeType, data };
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status} when fetching image.`);
        }
        const blob = await response.blob();
        const mimeType = blob.type;

        // CRITICAL FIX: Ensure the fetched content is actually an image.
        // Some URLs might resolve with a 200 OK but return HTML or other content types.
        if (!mimeType || !mimeType.startsWith('image/')) {
            throw new Error(`The content from the URL is not a valid image. MIME type found: '${mimeType || 'unknown'}'. Please use a direct link to an image file.`);
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result !== 'string') {
                    return reject(new Error('Failed to read file as a data URL.'));
                }
                const base64data = reader.result.split(',')[1];
                if (!base64data) {
                    return reject(new Error('Could not extract base64 data from the data URL.'));
                }
                resolve({ mimeType, data: base64data });
            };
            reader.onerror = (error) => reject(new Error(`FileReader error: ${error}`));
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error(`Failed to fetch and encode image from URL: ${url}. Reason: ${errorMessage}`, e);
        // Re-throw a more user-friendly error.
        throw new Error(`Could not process a reference image from URL: ${url}. ${errorMessage}. Please ensure the URL is valid, publicly accessible, and links directly to an image.`);
    }
};

export const buildSafePrompt = (
    prompt: string,
    hasVisualReferences: boolean, // Keep for signature compatibility, though unused in this version
    type: 'still' | 'video' = 'still'
): { finalPrompt: string; wasAdjusted: boolean } => {
    // A direct, natural language prefix to provide context without complex syntax that
    // might confuse the model and lead to IMAGE_OTHER errors.
    const prefix = "Cinematic film still for a fictional movie (SFW): ";
    const videoPrefix = "Cinematic video shot for a fictional movie (SFW): ";

    const finalPrompt = (type === 'video' ? videoPrefix : prefix) + prompt;
    
    return { finalPrompt, wasAdjusted: true };
};

export const generateStillVariants = async (
    frame_id: string,
    model: string,
    prompt: string,
    reference_images: string[],
    avatar_refs: string[], // This argument is kept for signature compatibility but is unused.
    aspect_ratio: string,
    n: number = 1,
    moodboard?: Moodboard,
    characterNames?: string[],
    locationName?: string,
    onProgress?: (index: number, progress: number) => void
): Promise<{ urls: string[], errors: (string | null)[], wasAdjusted: boolean }> => {
    console.log("[API Action] generateStillVariants", { frame_id, model, prompt, reference_images, n, aspect_ratio, moodboard, characterNames, locationName });
    
    const prioritizedImages = reference_images;
    
    let moodboardImages: string[] = [];
    if (moodboard) {
        const styleImg = moodboard.style?.items[0]?.url;
        const colorImg = moodboard.color?.items[0]?.url;
        const cineImg = moodboard.cinematography?.items[0]?.url;
        const otherImg = moodboard.other?.items[0]?.url;
        moodboardImages = [styleImg, colorImg, cineImg, otherImg].filter((url): url is string => !!url);
    }

    const MAX_REFERENCE_IMAGES = 5;
    const combinedImages = [...new Set([...prioritizedImages, ...moodboardImages])];
    const allReferenceImages = combinedImages.slice(0, MAX_REFERENCE_IMAGES);
    
    const hasVisualReferences = allReferenceImages.length > 0;
    
    let contextualPrompt = prompt;
    if (characterNames && characterNames.length > 0) {
        contextualPrompt += ` featuring ${characterNames.join(' and ')}`;
    }
    if (locationName) {
        contextualPrompt += ` in the ${locationName}`;
    }

    const { finalPrompt, wasAdjusted } = buildSafePrompt(contextualPrompt, hasVisualReferences);


    const urls: string[] = [];
    const errors: (string | null)[] = [];
    
    const generationPromises = Array.from({ length: n }).map((_, index) => 
        generateVisual(finalPrompt, model, allReferenceImages, aspect_ratio, (progress) => {
            onProgress?.(index, progress);
        })
    );

    const results = await Promise.allSettled(generationPromises);
    
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            urls.push(result.value);
            errors.push(null);
        } else {
            urls.push(''); 
            errors.push(result.reason instanceof Error ? result.reason.message : 'Unknown error during generation');
        }
    });

    return { urls, errors, wasAdjusted };
};


export const animateFrame = async (
    prompt: string, 
    reference_image_url: string, 
    last_frame_image_url?: string | null,
    n: number = 1,
    aspectRatio: string = '16:9',
    onProgress?: (progress: number) => void
): Promise<Blob[]> => {
    if (!GEMINI_API_KEY) {
        throw new Error("API Key is not configured.");
    }
    console.log("[API Action] Animating frame with Veo", { prompt, hasLastFrame: !!last_frame_image_url, n });

    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        
        const { mimeType, data } = await image_url_to_base64(reference_image_url);

        const imagePayload = {
            image: { imageBytes: data, mimeType: mimeType },
        };
        
        const motionPrompt = `Animate the provided image. Preserve the character's appearance, clothing, and background perfectly. The desired motion is: ${prompt}`;
        const hasVisualReferences = true; // Veo animate always has at least one reference image.
        const { finalPrompt } = buildSafePrompt(motionPrompt, hasVisualReferences, 'video');
        
        const supportedAspectRatios = ['16:9', '9:16'];
        const finalAspectRatio = supportedAspectRatios.includes(aspectRatio) ? aspectRatio : '16:9';
        if (!supportedAspectRatios.includes(aspectRatio)) {
            console.warn(`Veo only supports 16:9 and 9:16 aspect ratios. Defaulting to 16:9.`);
        }

        const config: any = {
            numberOfVideos: n,
            resolution: '720p',
            aspectRatio: finalAspectRatio,
        };

        if (last_frame_image_url) {
            const { mimeType: lastMimeType, data: lastData } = await image_url_to_base64(last_frame_image_url);
            config.lastFrame = {
                imageBytes: lastData,
                mimeType: lastMimeType,
            };
        }
        
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: finalPrompt,
            ...imagePayload,
            config: config,
        });
        
        let progress = 0;
        onProgress?.(progress);

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
            progress = Math.min(99, progress + 5);
            onProgress?.(progress);
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        onProgress?.(100);

        const downloadLinks = operation.response?.generatedVideos?.map(v => v.video?.uri).filter((uri): uri is string => !!uri) || [];

        if (downloadLinks.length === 0) {
             if (operation.error) {
                throw new Error(`Video generation failed: ${operation.error.message || 'Unknown Veo API error'}`);
            }
            throw new Error("Video generation failed. The API completed without returning a video. This could be due to content safety filters.");
        }

        const videoBlobs = await Promise.all(downloadLinks.map(async (downloadLink) => {
            const response = await fetch(`${downloadLink}&key=${GEMINI_API_KEY}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to download video: ${response.statusText} - ${errorText}`);
            }
            return response.blob();
        }));

        return videoBlobs;

    } catch (error) {
        onProgress?.(100);
        throw handleApiError(error, 'Veo (Animate)');
    }
};

export const refineVariant = async (prompt: string, base_image_url: string, aspect_ratio: string): Promise<string> => {
    console.log("[API Action] refineVariant", { prompt, base_image_url, aspect_ratio });
    const refinementModel = 'Gemini Flash Image';
    
    // By definition, refinement always has a visual reference (the base image).
    const hasVisualReferences = true;
    
    // Apply the same safety and context wrapper as other generation calls to prevent safety blocks.
    const { finalPrompt } = buildSafePrompt(prompt, hasVisualReferences);

    return await generateVisual(finalPrompt, refinementModel, [base_image_url], aspect_ratio);
};


export const upscaleImage = (
    image_url: string,
    onProgress: (progress: number) => void
): Promise<{ image_url: string }> => {
    console.log("[API Action] upscaleImage (simulated)", { image_url });

    return new Promise((resolve) => {
        let progress = 0;
        onProgress(progress);

        const interval = setInterval(() => {
            progress += 10;
            if (progress <= 100) {
                onProgress(progress);
            } else {
                clearInterval(interval);
                resolve({ image_url });
            }
        }, 300); // Simulate a 3-second upscale process
    });
};

export const upscaleVideo = (
    video_url: string,
    onProgress: (progress: number) => void
): Promise<{ video_url: string }> => {
    console.log("[API Action] upscaleVideo (simulated)", { video_url });

    return new Promise((resolve) => {
        let progress = 0;
        onProgress(progress);

        const interval = setInterval(() => {
            progress += 5; // Slower than image upscale
            if (progress <= 100) {
                onProgress(progress);
            } else {
                clearInterval(interval);
                resolve({ video_url });
            }
        }, 500); // Simulate a 10-second upscale process
    });
};

export const transferMotion = (
    referenceVideo: File,
    targetAvatarImageUrl: string,
    onProgress: (progress: number) => void
): Promise<string> => {
    console.log("[API Action] transferMotion (simulated)", { 
        videoName: referenceVideo.name,
        avatarUrl: targetAvatarImageUrl 
    });

    return new Promise((resolve) => {
        let progress = 0;
        onProgress(progress);

        const interval = setInterval(() => {
            progress += 5; 
            if (progress <= 100) {
                onProgress(progress);
            } else {
                clearInterval(interval);
                const videoUrl = URL.createObjectURL(referenceVideo);
                resolve(videoUrl);
            }
        }, 800); // Simulate a 16-second process
    });
};

export const generateVisual = async (
    prompt: string, 
    model: string, 
    reference_images: string[], 
    aspect_ratio: string,
    onProgress?: (progress: number) => void
): Promise<string> => {
    if (!GEMINI_API_KEY) throw new Error("API Key is not configured.");
    
    const effectiveModel = ((model === 'Imagen' || model === 'Flux') && reference_images.length > 0) ? 'Gemini Flash Image' : model;

    try {
        if (!prompt || !prompt.trim()) {
            throw new Error("Please enter a prompt to generate an image.");
        }
        
        const { GoogleGenAI, Modality } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        onProgress?.(10);
        await new Promise(res => setTimeout(res, 200));
        onProgress?.(30);

        if (effectiveModel === 'Imagen' || effectiveModel === 'Flux') {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt, // Use the fully constructed prompt directly
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspect_ratio as any,
                },
            });

            onProgress?.(100);
            if (!response.generatedImages || response.generatedImages.length === 0) {
                throw new Error(`${effectiveModel} API returned no image data.`);
            }
            return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
        
        } else if (effectiveModel === 'Gemini Flash Image') {
            const safetySettings = [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ];
            
            const imageParts = await Promise.all(
                reference_images.map(async (url) => {
                    const { mimeType, data } = await image_url_to_base64(url);
                    return { inlineData: { mimeType, data } };
                })
            );
            
            const textPart = { text: prompt };
            // According to SDK best practices for multimodal prompts, placing the text instruction
            // before the image data can sometimes lead to more consistent results.
            const parts = [textPart, ...imageParts];

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: parts },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
                safetySettings: safetySettings,
            });
            
            onProgress?.(100);

            const candidate = response.candidates?.[0];

            // Check for safety blocking first. The API may return a candidate with finishReason 'SAFETY'
            // or a promptFeedback object.
            if (response.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY') {
                const reason = response.promptFeedback?.blockReason || candidate?.finishReason;
                const ratings = candidate?.safetyRatings?.map(r => `${r.category.replace('HARM_CATEGORY_', '')}: ${r.probability}`).join(', ');
                let errorMessage = `Generation blocked for safety. Reason: ${reason}.`;
                if (ratings) {
                    errorMessage += ` Details: [${ratings}].`;
                }
                errorMessage += ' Please rephrase your prompt to be less ambiguous or explicit.';
                throw new Error(errorMessage);
            }
            
            for (const part of candidate?.content?.parts || []) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    return `data:image/png;base64,${base64ImageBytes}`;
                }
            }
            
            // If no image is found, check for other non-STOP finish reasons.
            if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
                throw new Error(`Generation failed for an unexpected reason: ${candidate.finishReason}. This could be related to prompt length or other model limitations.`);
            }
            
            // Generic fallback if no data is returned without a clear reason.
            throw new Error("Gemini Flash Image API returned no image data. This may be due to content safety filters or an issue with the prompt.");

        } else {
            throw new Error(`The selected model "${effectiveModel}" is not currently supported.`);
        }
    } catch (error) {
        onProgress?.(100);
        throw handleApiError(error, effectiveModel);
    }
};

export const generateMoodboardDescription = async (section: MoodboardSection): Promise<string> => {
    if (!GEMINI_API_KEY) throw new Error("API Key is not configured.");
    console.log("[API Action] generateMoodboardDescription", { notes: section.notes, itemCount: section.items.length });
    
    try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        
        const textPart = { text: `Analyze the following moodboard section and generate a concise, evocative description of its overall aesthetic, tone, and visual direction.
        
        Notes from the user: "${section.notes || 'No notes provided.'}"
        
        Based on these inputs (notes and attached images), describe the intended feeling and style. For example: "A gritty, rain-slicked neo-noir aesthetic with high-contrast lighting and a desaturated color palette, evoking a sense of urban decay and mystery."`};
        
        const imageParts = await Promise.all(
            section.items
                .filter(item => item.type === 'image')
                .slice(0, 5) // Limit to 5 images to avoid large payload
                .map(async (item) => {
                    const { mimeType, data } = await image_url_to_base64(item.url);
                    return { inlineData: { mimeType, data } };
                })
        );
        
        const contents = { parts: [textPart, ...imageParts] };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
        });

        return response.text;
    } catch (error) {
        throw handleApiError(error, 'Gemini');
    }
};

export const askTheDirector = async (analysis: ScriptAnalysis, query: string): Promise<string> => {
    if (!GEMINI_API_KEY) throw new Error("API Key is not configured.");
    console.log("[API Action] askTheDirector", { query });

    try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        
        const systemInstruction = `You are "The Director," an expert AI assistant for filmmakers and the creative brain for a film project. You have been provided with a complete analysis of the current script, including characters, scenes, locations, and moodboards. Your role is to be a creative partner. You DO NOT rewrite or change the script analysis. Instead, you answer questions, provide creative suggestions, and generate detailed, context-aware prompts for visual AI models.

You must:
- Answer questions about any aspect of the project (e.g., "What is the mood of scene 5?", "Describe the character Elena.").
- Provide creative suggestions based on the project's established tone (e.g., "Suggest a camera angle for the first shot of Scene 2 to create suspense.").
- Generate detailed, ready-to-use prompts for AI image generators when asked (e.g., "Give me a prompt for a wide shot of the cafe location."). The prompts should incorporate details from the moodboard and script.
- Be concise, professional, and knowledgeable in your responses.`;
        
        let context = `
PROJECT CONTEXT:
Title: ${analysis.title}
Logline: ${analysis.logline}
Summary: ${analysis.summary}
Characters: ${analysis.characters.map(c => `${c.name}: ${c.description}`).join('\n')}
Locations: ${analysis.locations.map(l => `${l.name}: ${l.description}`).join('\n')}
Scenes Summary:
${analysis.scenes.map(s => `Scene ${s.sceneNumber} (${s.setting}): ${s.summary}`).join('\n')}

MOODBOARD NOTES:
Cinematography: ${analysis.moodboard?.cinematography.aiDescription || analysis.moodboard?.cinematography.notes || 'Not defined.'}
Color: ${analysis.moodboard?.color.aiDescription || analysis.moodboard?.color.notes || 'Not defined.'}
Style: ${analysis.moodboard?.style.aiDescription || analysis.moodboard?.style.notes || 'Not defined.'}
---

Based on all the above context, respond to the following user query.

USER QUERY: "${query}"
`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: context,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text;
    } catch (error) {
        throw handleApiError(error, 'Gemini (Director)');
    }
};


// --- Existing AI Services adapted for new spec ---

export const analyzeScript = async (scriptContent: string, onProgress?: (message: string) => void): Promise<ScriptAnalysis> => {
     if (!GEMINI_API_KEY) throw new Error("API Key is not configured.");
    console.log("Analyzing script with Gemini API...");
     try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const analysisSchema = {
             type: Type.OBJECT,
             properties: {
                 title: { type: Type.STRING },
                 logline: { type: Type.STRING },
                 summary: { type: Type.STRING },
                 scenes: {
                     type: Type.ARRAY,
                     items: {
                         type: Type.OBJECT,
                         properties: {
                             id: { type: Type.STRING },
                             setting: { type: Type.STRING },
                             summary: { type: Type.STRING },
                             time_of_day: { type: Type.STRING },
                             mood: { type: Type.STRING },
                             lighting: { type: Type.STRING },
                         },
                         required: ["id", "setting", "summary", "time_of_day", "mood", "lighting"],
                     },
                 },
                 characters: {
                     type: Type.ARRAY,
                     items: {
                         type: Type.OBJECT,
                         properties: {
                             id: { type: Type.STRING },
                             name: { type: Type.STRING },
                             description: { type: Type.STRING },
                         },
                         required: ["id", "name", "description"],
                     },
                 },
                 locations: {
                     type: Type.ARRAY,
                     items: {
                         type: Type.OBJECT,
                         properties: {
                             id: { type: Type.STRING },
                             name: { type: Type.STRING },
                             description: { type: Type.STRING },
                         },
                         required: ["id", "name", "description"],
                     },
                 },
                 props: { type: Type.ARRAY, items: { type: Type.STRING } },
                 styling: { type: Type.ARRAY, items: { type: Type.STRING } },
                 setDressing: { type: Type.ARRAY, items: { type: Type.STRING } },
                 makeupAndHair: { type: Type.ARRAY, items: { type: Type.STRING } },
                 sound: { type: Type.ARRAY, items: { type: Type.STRING } },
             },
             required: ["title", "logline", "summary", "scenes", "characters", "locations", "props", "styling", "setDressing", "makeupAndHair", "sound"],
         };
         const prompt = `You are a professional screenplay analyst.Analyze the following screenplay and provide the output in the requested JSON format. Generate a unique, short, URL-friendly string ID (e.g., "scene-1", "character-elena") for each scene, character, and location. Here is the script:\n\n${scriptContent}`;
         
        onProgress?.('Analyzing script structure...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        // Add scene numbers for easier reference, as AI might not generate them sequentially.
        const scenesWithNumbers = result.scenes.map((scene: AnalyzedScene, index: number) => ({
            ...scene,
            sceneNumber: index + 1,
        }));
        
        onProgress?.('Script analyzed. Generating initial shot lists in parallel...');
        
        // OPTIMIZATION: Generate frames for each scene in parallel to reduce total analysis time.
        const frameGenerationPromises = scenesWithNumbers.map(scene => {
            onProgress?.(`Generating shots for Scene ${scene.sceneNumber}: ${scene.setting}...`);
            return generateFramesForScene(scene)
                .then(frames => ({
                    ...scene, // Carry over original scene data
                    frames: frames.map(frame => ({
                        ...frame,
                        id: `${scene.id}-frame-${frame.shot_number}-${Date.now()}`,
                        status: FrameStatus.Draft,
                    }))
                }))
                .catch(frameError => {
                    console.warn(`Could not generate frames for Scene ${scene.sceneNumber}:`, frameError);
                    return {
                        ...scene,
                        frames: [] // Ensure frames array exists even on error
                    };
                });
        });

        const scenesWithFrames = await Promise.all(frameGenerationPromises);
        onProgress?.('Shot generation complete.');

        return { ...result, scenes: scenesWithFrames };
    } catch (error) {
        throw handleApiError(error, 'Gemini (Analysis)');
    }
};

export const generateFramesForScene = async (scene: AnalyzedScene, directorialNotes?: string): Promise<Partial<Frame>[]> => {
    if (!GEMINI_API_KEY) throw new Error("API Key is not configured.");
    console.log(`[API Action] Generating frames for Scene ${scene.sceneNumber} with notes: ${directorialNotes || 'None'}`);

    try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        
        const frameSchema = {
            type: Type.OBJECT,
            properties: {
                shot_number: { type: Type.INTEGER },
                description: { type: Type.STRING },
                type: { type: Type.STRING },
                duration: { type: Type.INTEGER },
                camera_package: {
                    type: Type.OBJECT,
                    properties: {
                        lens_mm: { type: Type.INTEGER },
                        aperture: { type: Type.STRING },
                        iso: { type: Type.INTEGER },
                        height: { type: Type.STRING },
                        angle: { type: Type.STRING },
                        movement: { type: Type.STRING },
                    },
                    required: ["lens_mm", "aperture", "iso", "height", "angle", "movement"],
                },
                lighting_tweak: { type: Type.STRING },
                framing: { type: Type.STRING },
                composition_rules: { type: Type.STRING },
                negative: { type: Type.STRING },
                audio_note: { type: Type.STRING },
                cast_names: { type: Type.ARRAY, items: { type: Type.STRING } },
                location_name: { type: Type.STRING },
            },
            required: ["shot_number", "description", "type", "camera_package"],
        };
        
        let prompt = `You are an expert Director of Photography for a major film studio. Your task is to create a detailed shot list for the following scene. Generate between 3 and 5 distinct shots that visually tell the story described in the summary. Each shot must have a detailed description and specific technical camera settings.

        **Scene Information:**
        - **Scene ${scene.sceneNumber}: ${scene.setting}**
        - Time of Day: ${scene.time_of_day}
        - Mood: ${scene.mood}
        - Lighting: ${scene.lighting}
        - Summary: ${scene.summary}`;
        
        if (directorialNotes) {
            prompt += `\n\n**IMPORTANT DIRECTOR'S NOTES (Prioritize these):**\n- ${directorialNotes}`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        frames: {
                            type: Type.ARRAY,
                            items: frameSchema,
                        }
                    },
                    required: ["frames"],
                },
            }
        });

        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.frames || [];

    } catch (error) {
        throw handleApiError(error, 'Gemini (Frames)');
    }
};
