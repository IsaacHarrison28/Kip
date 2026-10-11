import type { ExtractedMetadata, Extractor } from "./types.js";
import { assertSafeUrl } from "../ssrf.js";

export const githubExtractor: Extractor = {
  name: "github",
  canHandle: (url) => {
    try {
      const u = new URL(url);
      return u.hostname === "github.com";
    } catch {
      return false;
    }
  },

  async extract(url: string): Promise<ExtractedMetadata> {
    await assertSafeUrl(url);

    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);

    if (parts.length < 2) {
      throw new Error("Not a repository URL");
    }

    const [owner, repo] = parts;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    const res = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "KipBot/1.0",
      },
    });

    if (!res.ok) throw new Error(`GitHub API failed: ${res.status}`);

    const data = (await res.json()) as {
      full_name: string;
      description: string | null;
      owner: { avatar_url: string };
      stargazers_count: number;
      language: string | null;
      homepage: string | null;
    };

    return {
      title: data.full_name,
      description:
        data.description ??
        `${data.language ?? "Repository"} · ${data.stargazers_count} stars`,
      favicon_url: "https://github.com/favicon.ico",
      thumbnail_url: `https://opengraph.githubassets.com/1/${data.full_name}`,
      content_text: data.description,
      source_platform: "github",
      author: owner,
    };
  },
};
