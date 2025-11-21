
import { getFallbackVideoBlobs } from './fallbackContent';

const HF_API_URL = "https://api-inference.huggingface.co/models";

// Free tier models on Hugging Face
export const HF_MODELS = {
    imageToVideo: "stabilityai/stable-video-diffusion-img2vid-xt",
    textToVideo: "damo-vilab/text-to-video-ms-1.7b",
    imageGeneration: "stabilityai/stable-diffusion-xl-base-1.0",
};

/**
 * Generate video from image using Hugging Face Inference API (Free Tier)
 * Note: Rate limits apply.
 */
export async function generateVideoWithHF(
    prompt: string, // SVD doesn't really use prompt, but we keep it for signature
    imageUrl: string,
    onProgress?: (progress: number) => void
): Promise<string> {
    console.log("[HuggingFace] Generating video from image...", { imageUrl });
    onProgress?.(10);

    try {
        // Fetch image and convert to blob
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();

        onProgress?.(30);

        // SVD expects the image file directly
        const response = await fetch(`${HF_API_URL}/${HF_MODELS.imageToVideo}`, {
            method: "POST",
            headers: {
                // "Authorization": `Bearer ${HF_TOKEN}`, // Optional for public models, but better with token. 
                // We will try without token first (anonymous access), or use a user-provided one.
                // For now, we'll assume anonymous or rely on the user providing a key if needed.
                // Actually, anonymous access is very limited. We might need a proxy or a key.
                // Let's try anonymous first.
            },
            body: imageBlob,
        });

        if (!response.ok) {
            throw new Error(`HF API Error: ${response.status} ${response.statusText}`);
        }

        onProgress?.(70);

        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);

        onProgress?.(100);
        return videoUrl;

    } catch (error) {
        console.error("[HuggingFace] Video generation failed:", error);
        onProgress?.(100);
        throw error;
    }
}

/**
 * Generate video from text using Hugging Face Inference API
 */
export async function generateTextToVideoWithHF(
    prompt: string,
    onProgress?: (progress: number) => void
): Promise<string> {
    console.log("[HuggingFace] Generating video from text...", { prompt });
    onProgress?.(10);

    try {
        const response = await fetch(`${HF_API_URL}/${HF_MODELS.textToVideo}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: prompt }),
        });

        if (!response.ok) {
            throw new Error(`HF API Error: ${response.status} ${response.statusText}`);
        }

        onProgress?.(70);

        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);

        onProgress?.(100);
        return videoUrl;

    } catch (error) {
        console.error("[HuggingFace] Text-to-video generation failed:", error);
        onProgress?.(100);
        throw error;
    }
}
