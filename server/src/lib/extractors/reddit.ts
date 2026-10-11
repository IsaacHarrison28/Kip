import type { ExtractedMetadata, Extractor } from "./types.js";
import { assertSafeUrl } from "../ssrf.js";

export const redditExtractor: Extractor = {
  name: "reddit",
  canHandle: (url) => {
    try {
      return new URL(url).hostname.toLowerCase().includes("reddit.com");
    } catch {
      return false;
    }
  },

  async extract(url: string): Promise<ExtractedMetadata> {
    await assertSafeUrl(url);

    const jsonUrl = url.replace(/\/?$/, ".json");

    const res = await fetch(jsonUrl, {
      headers: { "User-Agent": "KipBot/1.0 (by /u/kipbot)" },
    });

    if (!res.ok) {
      throw new Error(`Reddit fetch failed: ${res.status}`);
    }

    const json = (await res.json()) as Array<{
      data?: {
        children?: Array<{
          data: {
            title?: string;
            selftext?: string;
            subreddit?: string;
            author?: string;
            thumbnail?: string;
            url?: string;
            preview?: {
              images?: Array<{ source?: { url?: string } }>;
            };
          };
        }>;
      };
    }>;

    const post = json?.[0]?.data?.children?.[0]?.data;
    if (!post) throw new Error("No Reddit post found");

    const previewImage =
      post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, "&") ?? null;

    return {
      title: post.title ?? null,
      description: post.selftext?.slice(0, 500) ?? null,
      favicon_url: "https://www.reddit.com/favicon.ico",
      thumbnail_url: previewImage,
      content_text: (post.selftext ?? "").slice(0, 20000) || null,
      source_platform: "reddit",
      author: post.author,
    };
  },
};
