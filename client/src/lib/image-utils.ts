const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

/**
 * Returns a proxied URL for platforms that block hotlinking.
 * Returns the original URL for everything else.
 */
export function getImageUrl(
  originalUrl: string | null,
  platform: string | null
): string | null {
  if (!originalUrl) return null;

  const blockedPlatforms = ["facebook", "instagram", "linkedin"];

  if (platform && blockedPlatforms.includes(platform)) {
    // Pass the original URL as a query parameter to our proxy
    return `${API_URL}/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
  }

  // For YouTube, Twitter, generic sites, etc., load the image directly
  return originalUrl;
}
