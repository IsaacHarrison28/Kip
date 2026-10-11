import { URL } from "node:url";
import { lookup } from "node:dns/promises";

/**
 * Block requests to private/internal networks.
 * Prevents SSRF attacks where a user could make our server fetch internal resources.
 */
export function isBlockedHost(hostname: string): boolean {
  const blocked = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "metadata.google.internal",
    "169.254.169.254", // AWS/GCP metadata
  ];

  const lower = hostname.toLowerCase();
  if (blocked.includes(lower)) return true;
  if (lower.endsWith(".local")) return true;
  if (lower.endsWith(".internal")) return true;

  return false;
}

export function isPrivateIp(ip: string): boolean {
  // IPv4 private ranges
  const parts = ip.split(".").map(Number);
  if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 0) return true;
  }

  // IPv6 loopback
  if (ip === "::1" || ip === "fe80::") return true;

  return false;
}

export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  if (isBlockedHost(url.hostname)) {
    throw new Error("Blocked host");
  }

  // Resolve DNS and check the IP
  try {
    const { address } = await lookup(url.hostname);
    if (isPrivateIp(address)) {
      throw new Error("Blocked private IP");
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Blocked")) throw e;
    // DNS lookup failure — let the fetch handle it
  }

  return url;
}
