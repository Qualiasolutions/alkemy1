/**
 * Utility for fetching images with CORS handling
 * Attempts direct fetch first, then uses proxy services or image proxy APIs
 */

/**
 * Test if an image URL is accessible without CORS issues
 */
async function testCORS(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'cors' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch image with CORS handling
 * @param imageUrl - The URL of the image to fetch
 * @returns Data URL of the image or null if failed
 */
export async function fetchImageWithCORS(imageUrl: string): Promise<string | null> {
  // First, try direct fetch
  try {
    const response = await fetch(imageUrl);
    if (response.ok) {
      const blob = await response.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.log(`Direct fetch failed for ${imageUrl}, trying alternative methods...`);
  }

  // Try using a public CORS proxy (for production)
  const corsProxies = [
    `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`,
  ];

  for (const proxyUrl of corsProxies) {
    try {
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const blob = await response.blob();

        // Validate that we got an image
        if (blob.type.startsWith('image/')) {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      }
    } catch (error) {
      console.log(`Proxy failed: ${proxyUrl}`);
    }
  }

  // If all methods fail, try creating an Image element as last resort
  // This works for some CORS-restricted images that allow embedding
  try {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve(dataUrl);
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };

      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = imageUrl;

      // Timeout after 10 seconds
      setTimeout(() => reject(new Error('Image load timeout')), 10000);
    });
  } catch (error) {
    console.error(`All methods failed for ${imageUrl}`);
  }

  return null;
}

/**
 * Check if a URL is likely to have CORS issues based on domain
 */
export function isLikelyCORSRestricted(url: string): boolean {
  const corsRestrictedDomains = [
    'pinterest.com',
    'pinimg.com',
    'instagram.com',
    'cdninstagram.com',
    'facebook.com',
    'fbcdn.net',
  ];

  try {
    const urlObj = new URL(url);
    return corsRestrictedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Filter out images that are likely to have CORS issues
 */
export function filterCORSFriendlyImages(imageUrls: string[]): string[] {
  return imageUrls.filter(url => !isLikelyCORSRestricted(url));
}