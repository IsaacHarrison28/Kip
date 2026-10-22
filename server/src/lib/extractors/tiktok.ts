import type { ExtractedMetadata, Extractor } from "./types.js";
import { assertSafeUrl } from "../ssrf.js";

async function tryTikTokOEmbed(url: string): Promise<{
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
} | null> {
  // TikTok's public oEmbed endpoint (unofficial but stable)
  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

    if (!res.ok) return null;

    return (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
  } catch {
    return null;
  }
}

async function scrapeOG(url: string): Promise<{
  title: string | null;
  description: string | null;
  image: string | null;
  video?: string;
}> {
  try {
    await assertSafeUrl(url);

    const res = await fetch(url, {
      headers: {
        // Full browser UA — TikTok serves OG tags to real browsers
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();

    const getMeta = (property: string): string | null => {
      const patterns = [
        new RegExp(
          `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
          "i",
        ),
        new RegExp(
          `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
          "i",
        ),
      ];
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) return match[1];
      }
      return null;
    };

    return {
      title: getMeta("og:title"),
      description: getMeta("og:description"),
      image: getMeta("og:image"),
    };
  } catch {
    return { title: null, description: null, image: null };
  }
}

export const tiktokExtractor: Extractor = {
  name: "tiktok",

  canHandle: (url) => {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host.includes("tiktok.com");
    } catch {
      return false;
    }
  },

  async extract(url: string): Promise<ExtractedMetadata> {
    // Try oEmbed first
    const oembed = await tryTikTokOEmbed(url);

    if (oembed?.title) {
      return {
        title: oembed.title,
        description: oembed.author_name ? `By @${oembed.author_name}` : null,
        favicon_url: "https://www.tiktok.com/favicon.ico",
        thumbnail_url: oembed.thumbnail_url ?? null,
        content_text: oembed.title,
        source_platform: "tiktok",
        author: oembed.author_name ?? null,
      };
    }

    // Fallback: OG scrape
    const og = await scrapeOG(url);

    if (og.title || og.image) {
      return {
        title: og.title,
        description: og.description,
        favicon_url: "https://www.tiktok.com/favicon.ico",
        thumbnail_url: og.image,
        content_text: og.description ?? og.title,
        source_platform: "tiktok",
        author: null,
      };
    }

    throw new Error("Could not extract TikTok metadata");
  },
};
