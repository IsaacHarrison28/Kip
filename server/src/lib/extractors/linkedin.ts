import type { ExtractedMetadata, Extractor } from "./types.js";
import { assertSafeUrl } from "../ssrf.js";

async function scrapeOG(url: string): Promise<{
  title: string | null;
  description: string | null;
  image: string | null;
}> {
  try {
    await assertSafeUrl(url);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        // LinkedIn sometimes serves OG to bots that look social
        "X-Requested-With": "XMLHttpRequest",
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
      title: getMeta("og:title") ?? getMeta("twitter:title"),
      description: getMeta("og:description") ?? getMeta("twitter:description"),
      image: getMeta("og:image") ?? getMeta("twitter:image"),
    };
  } catch {
    return { title: null, description: null, image: null };
  }
}

export const linkedinExtractor: Extractor = {
  name: "linkedin",

  canHandle: (url) => {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host.includes("linkedin.com") || host === "lnkd.in";
    } catch {
      return false;
    }
  },

  async extract(url: string): Promise<ExtractedMetadata> {
    const og = await scrapeOG(url);

    if (og.title || og.image) {
      return {
        title: og.title,
        description: og.description,
        favicon_url: "https://www.linkedin.com/favicon.ico",
        thumbnail_url: og.image,
        content_text: og.description ?? og.title,
        source_platform: "linkedin",
        author: null,
      };
    }

    throw new Error("Could not extract LinkedIn metadata");
  },
};
