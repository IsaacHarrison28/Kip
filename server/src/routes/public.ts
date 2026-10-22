import { Router } from "express";
import { supabase } from "../lib/supabase.js";

export const publicRouter = Router();

/**
 * GET /api/public/:slug
 * Public, unauthenticated access to a shared folder.
 */
publicRouter.get("/:slug", async (req, res) => {
  const { slug } = req.params;

  const { data: folder, error } = await supabase
    .from("folders")
    .select("id, name, description, slug, view_count, created_at")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch folder" });
  }

  if (!folder) {
    return res.status(404).json({ error: "Not found" });
  }

  // Fetch bookmarks in this folder
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from("bookmarks")
    .select(
      "id, url, title, description, favicon_url, thumbnail_url, source_platform, created_at, bookmark_tags(tags(id, name))",
    )
    .eq("folder_id", folder.id)
    .order("created_at", { ascending: false });

  if (bookmarksError) {
    console.error(bookmarksError);
    return res.status(500).json({ error: "Failed to fetch bookmarks" });
  }

  // Flatten tags
  type Row = {
    bookmark_tags?: Array<{ tags: { id: string; name: string } | null }>;
    [key: string]: unknown;
  };

  const items = ((bookmarks ?? []) as unknown as Row[]).map((b) => {
    const { bookmark_tags, ...rest } = b;
    const tags = (bookmark_tags ?? [])
      .map((bt) => bt.tags)
      .filter((t): t is { id: string; name: string } => !!t);
    return { ...rest, tags };
  });

  return res.json({ folder, bookmarks: items });
});

/**
 * POST /api/public/:slug/view
 * Increments the view counter. Fire-and-forget.
 */
publicRouter.post("/:slug/view", async (req, res) => {
  const { slug } = req.params;

  // Read current count, increment
  const { data: current } = await supabase
    .from("folders")
    .select("view_count")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (!current) {
    return res.status(404).json({ error: "Not found" });
  }

  await supabase
    .from("folders")
    .update({ view_count: (current.view_count ?? 0) + 1 })
    .eq("slug", slug)
    .eq("is_public", true);

  return res.status(204).send();
});
