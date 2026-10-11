import type { ExtractedMetadata, Extractor } from "./types.js";
import { assertSafeUrl } from "../ssrf.js";

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0];
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

export const youtubeExtractor: Extractor = {
  name: "youtube",
  canHandle: (url) => {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host.includes("youtube.com") || host === "youtu.be";
    } catch {
      return false;
    }
  },

  async extract(url: string): Promise<ExtractedMetadata> {
    await assertSafeUrl(url);

    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      url,
    )}&format=json`;

    const res = await fetch(oembedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; KipBot/1.0)" },
    });

    if (!res.ok) {
      throw new Error(`YouTube oEmbed failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      title: string;
      author_name: string;
      thumbnail_url: string;
    };

    const videoId = extractVideoId(url);

    return {
      title: data.title ?? null,
      description: `Video by ${data.author_name}`,
      favicon_url: "https://www.youtube.com/favicon.ico",
      thumbnail_url:
        data.thumbnail_url ??
        (videoId
          ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          : null),
      content_text: data.title ?? null,
      source_platform: "youtube",
      author: data.author_name,
    };
  },
};
