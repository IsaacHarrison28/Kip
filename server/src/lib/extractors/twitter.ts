import type { ExtractedMetadata, Extractor } from "./types.js";

/**
 * Extract tweet ID from various Twitter/X URL formats:
 * - https://twitter.com/user/status/1234567890
 * - https://x.com/user/status/1234567890
 * - https://twitter.com/user/status/1234567890?s=20
 * - https://mobile.twitter.com/user/status/1234567890
 */
function extractTweetId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();

    if (
      !host.includes("twitter.com") &&
      !host.includes("x.com") &&
      !host.includes("t.co")
    ) {
      return null;
    }

    // Path format: /username/status/ID or /i/web/status/ID
    const match = u.pathname.match(/\/status\/(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export const twitterExtractor: Extractor = {
  name: "twitter",

  canHandle: (url) => {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return (
        host.includes("twitter.com") ||
        host === "x.com" ||
        host.endsWith(".x.com")
      );
    } catch {
      return false;
    }
  },

  async extract(url: string): Promise<ExtractedMetadata> {
    const tweetId = extractTweetId(url);

    if (!tweetId) {
      throw new Error("Could not extract tweet ID from URL");
    }

    // FxTwitter is a free public API — no key needed
    const apiUrl = `https://api.fxtwitter.com/i/status/${tweetId}`;

    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": "KipBot/1.0 (+https://getkip.app)",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`FxTwitter failed: ${res.status}`);
    }

    const json = (await res.json()) as {
      code: number;
      message?: string;
      tweet?: {
        url: string;
        text: string;
        author: {
          name: string;
          screen_name: string;
          avatar_url: string;
        };
        media?: {
          photos?: Array<{ url: string; altText?: string }>;
          videos?: Array<{ thumbnail_url: string; url: string }>;
        };
        created_at: string;
      };
    };

    if (json.code !== 200 || !json.tweet) {
      throw new Error(json.message ?? "Tweet not found");
    }

    const { tweet } = json;

    // Pick a thumbnail from media
    let thumbnail: string | null = null;
    if (tweet.media?.photos?.[0]?.url) {
      thumbnail = tweet.media.photos[0].url;
    } else if (tweet.media?.videos?.[0]?.thumbnail_url) {
      thumbnail = tweet.media.videos[0].thumbnail_url;
    } else {
      // Use author avatar as fallback
      thumbnail = tweet.author.avatar_url;
    }

    // Title: first ~100 chars of tweet text
    const title =
      tweet.text.length > 100 ? tweet.text.slice(0, 97) + "…" : tweet.text;

    return {
      title,
      description: `@${tweet.author.screen_name} · ${tweet.author.name}`,
      favicon_url: "https://abs.twimg.com/favicons/twitter.3.ico",
      thumbnail_url: thumbnail,
      content_text: tweet.text,
      source_platform: "twitter",
      author: tweet.author.name,
    };
  },
};
