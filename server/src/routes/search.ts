import { Router, type Request } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

export const searchRouter = Router();

searchRouter.use(requireAuth);

interface SearchQuery {
  q?: string;
  folder?: string;
  tag?: string;
  platform?: string;
}

/**
 * GET /api/search?q=<query>&folder=<id|none>&tag=<id>&platform=<name>&limit=<n>
 * Returns ranked bookmarks with matched snippet and tags.
 */
searchRouter.get("/", async (req: Request<{}, {}, {}, SearchQuery>, res) => {
  const { q, folder, tag, platform } = req.query;
  const limit = 50;

  const query = (q ?? "").trim();

  if (query.length === 0) {
    return res.json({ results: [], query });
  }

  // Base query: user's bookmarks with tags
  let dbQuery = supabase
    .from("bookmarks")
    .select("*, bookmark_tags(tags(id, name))")
    .eq("user_id", req.userId)
    .limit(limit);

  // Filters
  if (folder === "none") {
    dbQuery = dbQuery.is("folder_id", null);
  } else if (typeof folder === "string" && folder.length > 0) {
    dbQuery = dbQuery.eq("folder_id", folder);
  }

  if (typeof platform === "string" && platform.length > 0) {
    dbQuery = dbQuery.eq("source_platform", platform);
  }

  // Full-text search via RPC would be ideal, but Supabase JS doesn't
  // expose @@ cleanly. Use .textSearch() which maps to the tsvector column.
  dbQuery = dbQuery.textSearch("search_vector", query, {
    type: "websearch",
    config: "english",
  });

  const { data, error } = await dbQuery;

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Search failed" });
  }

  // Flatten tags
  type Row = {
    bookmark_tags?: Array<{ tags: { id: string; name: string } | null }>;
    [key: string]: unknown;
  };

  const rows = (data ?? []) as unknown as Row[];

  let results = rows.map((r) => {
    const { bookmark_tags, ...rest } = r;
    const tags = (bookmark_tags ?? [])
      .map((bt) => bt.tags)
      .filter((t): t is { id: string; name: string } => !!t);
    return { ...rest, tags };
  });

  // Filter by tag (post-query since it's a join)
  if (typeof tag === "string" && tag.length > 0) {
    results = results.filter((r) =>
      (r.tags as Array<{ id: string; name: string }>).some((t) => t.id === tag),
    );
  }

  // If nothing found, try fuzzy match on title (typo tolerance)
  if (results.length === 0) {
    const fuzzy = await supabase
      .from("bookmarks")
      .select("*, bookmark_tags(tags(id, name))")
      .eq("user_id", req.userId)
      .ilike("title", `%${query}%`)
      .limit(limit);

    if (!fuzzy.error && fuzzy.data) {
      const fuzzyRows = fuzzy.data as unknown as Row[];
      results = fuzzyRows.map((r) => {
        const { bookmark_tags, ...rest } = r;
        const tags = (bookmark_tags ?? [])
          .map((bt) => bt.tags)
          .filter((t): t is { id: string; name: string } => !!t);
        return { ...rest, tags };
      });
    }
  }

  return res.json({ results, query });
});
