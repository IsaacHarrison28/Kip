import type { ExtractedMetadata, Extractor } from "./types.js";
import { assertSafeUrl } from "../ssrf.js";

function isFacebookOrInstagram(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.includes("facebook.com") ||
      host.includes("fb.watch") ||
      host.includes("instagram.com")
    );
  } catch {
    return false;
  }
}

function isInstagram(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("instagram.com");
  } catch {
    return false;
  }
}

async function fetchOEmbedFromGraph(url: string) {
  const fbEndpoint = `https://graph.facebook.com/v25.0/oembed_post?url=${encodeURIComponent(url)}`;
  const igEndpoint = `https://graph.facebook.com/v25.0/instagram_oembed?url=${encodeURIComponent(url)}`;
  const endpoint = isInstagram(url) ? igEndpoint : fbEndpoint;

  try {
    const res = await fetch(endpoint, {
      headers: { "User-Agent": "KipBot/1.0" },
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
      provider_name?: string;
    };
  } catch {
    return null;
  }
}

async function scrapeOpenGraph(url: string): Promise<{
  title: string | null;
  description: string | null;
  image: string | null;
}> {
  try {
    await assertSafeUrl(url);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1", // This specific UA gets FB to serve OG tags
        Accept: "text/html",
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
          `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
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

    const title =
      getMeta("og:title") ??
      getMeta("twitter:title") ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ??
      null;

    const description =
      getMeta("og:description") ?? getMeta("twitter:description") ?? null;

    const image = getMeta("og:image") ?? getMeta("twitter:image") ?? null;

    return {
      title: title ? decodeHtmlEntities(title) : null,
      description: description ? decodeHtmlEntities(description) : null,
      image,
    };
  } catch {
    return { title: null, description: null, image: null };
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

export const facebookExtractor: Extractor = {
  name: "facebook",
  canHandle: isFacebookOrInstagram,

  async extract(url: string): Promise<ExtractedMetadata> {
    const platform = isInstagram(url) ? "instagram" : "facebook";

    // 1. Try oEmbed
    const oembed = await fetchOEmbedFromGraph(url);

    if (oembed?.title || oembed?.thumbnail_url) {
      return {
        title: oembed.title ?? null,
        description: oembed.author_name ? `By ${oembed.author_name}` : null,
        favicon_url:
          platform === "instagram"
            ? "https://www.instagram.com/favicon.ico"
            : "https://www.facebook.com/favicon.ico",
        thumbnail_url: oembed.thumbnail_url ?? null,
        content_text: oembed.title ?? null,
        source_platform: platform,
        author: oembed.author_name ?? null,
      };
    }

    // 2. Try OG Scraping (This is what grabbed the text in your screenshot)
    const og = await scrapeOpenGraph(url);

    if (og.title || og.image) {
      return {
        title: og.title,
        description: og.description,
        favicon_url:
          platform === "instagram"
            ? "https://www.instagram.com/favicon.ico"
            : "https://www.facebook.com/favicon.ico",
        thumbnail_url: og.image,
        content_text: og.description ?? og.title,
        source_platform: platform,
        author: null,
      };
    }

    // 3. If both fail, throw so the generic extractor tries
    throw new Error("Could not extract Facebook metadata");
  },
};
