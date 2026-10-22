export type Platform =
  | "youtube"
  | "twitter"
  | "reddit"
  | "github"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "linkedin"
  | "generic";

export function detectPlatform(url: string): Platform {
  try {
    const host = new URL(url).hostname.toLowerCase();

    if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
    if (host.includes("twitter.com") || host.includes("x.com"))
      return "twitter";
    if (host.includes("reddit.com")) return "reddit";
    if (host === "github.com") return "github";
    if (host.includes("facebook.com") || host.includes("fb.watch"))
      return "facebook";
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("linkedin.com") || host === "lnkd.in") return "linkedin";

    return "generic";
  } catch {
    return "generic";
  }
}
