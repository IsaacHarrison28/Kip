import type { ExtractedMetadata, Extractor } from "./types.js";
import { genericExtractor } from "./generic.js";
import { youtubeExtractor } from "./youtube.js";
import { redditExtractor } from "./reddit.js";
import { githubExtractor } from "./github.js";
import { twitterExtractor } from "./twitter.js";
import { facebookExtractor } from "./facebook.js";
import { tiktokExtractor } from "./tiktok.js";
import { linkedinExtractor } from "./linkedin.js";

// Order matters! More specific extractors first, generic last.
const extractors: Extractor[] = [
  youtubeExtractor,
  githubExtractor,
  redditExtractor,
  twitterExtractor,
  facebookExtractor,
  tiktokExtractor,
  linkedinExtractor,
  genericExtractor,
];

export async function extractMetadata(url: string): Promise<ExtractedMetadata> {
  const extractor = extractors.find((e) => e.canHandle(url));

  if (!extractor) {
    throw new Error("No extractor matched");
  }

  try {
    return await extractor.extract(url);
  } catch (e) {
    // Fall back to generic if a platform-specific one fails
    if (extractor.name !== "generic") {
      console.warn(
        `[extractors] ${extractor.name} failed for ${url}, falling back to generic:`,
        e,
      );
      return genericExtractor.extract(url);
    }
    throw e;
  }
}

export type { ExtractedMetadata };
