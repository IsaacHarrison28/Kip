import { createHash } from "node:crypto";

/**
 * Normalize a URL:
 * - Trim whitespace
 * - Add https:// if no protocol
 * - Strip common tracking params
 * - Lowercase host
 * - Remove trailing slash
 */
export function normalizeUrl(input: string): string {
  let raw = input.trim();
  if (!/^https?:\/\//i.test(raw)) {
    raw = "https://" + raw;
  }

  const url = new URL(raw);
  url.hostname = url.hostname.toLowerCase();

  // Strip tracking params
  const junk = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "ref",
    "ref_src",
    "fbclid",
    "gclid",
    "mc_cid",
    "mc_eid",
  ];
  junk.forEach((p) => url.searchParams.delete(p));

  // Remove trailing slash from path (but keep "/")
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}

export function hashUrl(normalized: string): string {
  return createHash("sha256").update(normalized).digest("hex");
}

export function isValidUrl(input: string): boolean {
  try {
    const raw = /^https?:\/\//i.test(input) ? input : "https://" + input;
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
