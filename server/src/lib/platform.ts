export type Platform = "youtube" | "twitter" | "reddit" | "github" | "generic";

export function detectPlatform(url: string): Platform {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
    if (host.includes("twitter.com") || host === "x.com") return "twitter";
    if (host.includes("reddit.com")) return "reddit";
    if (host === "github.com") return "github";
    return "generic";
  } catch {
    return "generic";
  }
}
