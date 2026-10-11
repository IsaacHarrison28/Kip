import type { ExtractedMetadata, Extractor } from "./types.js";
import { genericExtractor } from "./generic.js";
import { youtubeExtractor } from "./youtube.js";
import { redditExtractor } from "./reddit.js";
import { githubExtractor } from "./github.js";

const extractors: Extractor[] = [
  youtubeExtractor,
  redditExtractor,
  githubExtractor,
  genericExtractor, // always last — the catch-all
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
