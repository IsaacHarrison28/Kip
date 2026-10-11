import metascraper from "metascraper";
import metascraperTitle from "metascraper-title";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperFavicon from "metascraper-logo-favicon";
import metascraperUrl from "metascraper-url";
import metascraperAuthor from "metascraper-author";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import type { ExtractedMetadata, Extractor } from "./types.js";
import { assertSafeUrl } from "../ssrf.js";

const FETCH_TIMEOUT_MS = 8000;
const MAX_CONTENT_BYTES = 5 * 1024 * 1024; // 5MB

const scraper = metascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
  metascraperFavicon(),
  metascraperUrl(),
  metascraperAuthor(),
]);

async function safeFetch(
  url: string,
): Promise<{ html: string; finalUrl: string }> {
  await assertSafeUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KipBot/1.0; +https://getkip.app/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    // Read the body with a size cap
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_CONTENT_BYTES) {
        reader.cancel();
        throw new Error("Response too large");
      }
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const html = buffer.toString("utf-8");
    return { html, finalUrl: res.url || url };
  } finally {
    clearTimeout(timeout);
  }
}

export const genericExtractor: Extractor = {
  name: "generic",
  canHandle: () => true,

  async extract(url: string): Promise<ExtractedMetadata> {
    const { html, finalUrl } = await safeFetch(url);

    const meta = await scraper({ html, url: finalUrl });

    // Extract readable article text
    let contentText: string | null = null;
    try {
      const dom = new JSDOM(html, { url: finalUrl });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      if (article?.textContent) {
        contentText = article.textContent.trim().slice(0, 50000);
      }
    } catch {
      // Readability failed — non-fatal
    }

    // Fallback: strip all tags and take first 5000 chars
    if (!contentText) {
      try {
        const dom = new JSDOM(html);
        const text = dom.window.document.body?.textContent ?? "";
        contentText = text.replace(/\s+/g, " ").trim().slice(0, 5000);
      } catch {
        // ignore
      }
    }

    // Best-effort favicon fallback
    let favicon = meta.logo ?? meta.favicon ?? null;
    if (!favicon) {
      try {
        favicon = new URL("/favicon.ico", finalUrl).toString();
      } catch {
        favicon = null;
      }
    }

    return {
      title: meta.title ?? null,
      description: meta.description ?? null,
      favicon_url: favicon,
      thumbnail_url: meta.image ?? null,
      content_text: contentText,
      source_platform: "generic",
      author: meta.author ?? null,
    };
  },
};
