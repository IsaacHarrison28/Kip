import { Router, type Request } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

export const bookmarkTagsRouter = Router({ mergeParams: true });

bookmarkTagsRouter.use(requireAuth);

/**
 * Params for routes mounted at /api/bookmarks/:bookmarkId/tags
 */
interface BookmarkParams {
  bookmarkId: string;
}

interface BookmarkTagParams extends BookmarkParams {
  tagId: string;
}

/**
 * GET /api/bookmarks/:bookmarkId/tags
 */
/**
 * GET /api/bookmarks/:bookmarkId/tags
 */
bookmarkTagsRouter.get("/", async (req: Request<BookmarkParams>, res) => {
  const { bookmarkId } = req.params;

  const { data: bookmark } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("id", bookmarkId)
    .eq("user_id", req.userId)
    .maybeSingle();

  if (!bookmark) {
    return res.status(404).json({ error: "Bookmark not found" });
  }

  const { data, error } = await supabase
    .from("bookmark_tags")
    .select("tags(id, name, created_at)")
    .eq("bookmark_id", bookmarkId);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch tags" });
  }

  type TagRow = {
    tags: { id: string; name: string; created_at: string } | null;
  };

  const rows = (data ?? []) as unknown as TagRow[];

  const tags = rows
    .map((row) => row.tags)
    .filter((t): t is NonNullable<TagRow["tags"]> => t !== null);

  return res.json({ tags });
});

/**
 * POST /api/bookmarks/:bookmarkId/tags
 * Attach a tag by name. Creates the tag if it doesn't exist.
 * Body: { name: string }
 */
bookmarkTagsRouter.post("/", async (req: Request<BookmarkParams>, res) => {
  const { bookmarkId } = req.params;
  const { name } = req.body as { name?: string };

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Name is required" });
  }

  const { data: bookmark } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("id", bookmarkId)
    .eq("user_id", req.userId)
    .maybeSingle();

  if (!bookmark) {
    return res.status(404).json({ error: "Bookmark not found" });
  }

  const { count } = await supabase
    .from("bookmark_tags")
    .select("*", { count: "exact", head: true })
    .eq("bookmark_id", bookmarkId);

  if ((count ?? 0) >= 10) {
    return res.status(400).json({ error: "Max 10 tags per bookmark" });
  }

  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);

  if (!normalized) {
    return res.status(400).json({ error: "Invalid tag name" });
  }

  let tagId: string;

  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("user_id", req.userId)
    .eq("name", normalized)
    .maybeSingle();

  if (existing) {
    tagId = existing.id;
  } else {
    const { data: inserted, error } = await supabase
      .from("tags")
      .insert({ user_id: req.userId, name: normalized })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create tag" });
    }
    tagId = inserted.id;
  }

  const { error: linkError } = await supabase
    .from("bookmark_tags")
    .insert({ bookmark_id: bookmarkId, tag_id: tagId });

  if (linkError && linkError.code !== "23505") {
    console.error(linkError);
    return res.status(500).json({ error: "Failed to attach tag" });
  }

  return res.status(201).json({ tag: { id: tagId, name: normalized } });
});

/**
 * DELETE /api/bookmarks/:bookmarkId/tags/:tagId
 */
bookmarkTagsRouter.delete(
  "/:tagId",
  async (req: Request<BookmarkTagParams>, res) => {
    const { bookmarkId, tagId } = req.params;

    const { data: bookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("id", bookmarkId)
      .eq("user_id", req.userId)
      .maybeSingle();

    if (!bookmark) {
      return res.status(404).json({ error: "Bookmark not found" });
    }

    const { error } = await supabase
      .from("bookmark_tags")
      .delete()
      .eq("bookmark_id", bookmarkId)
      .eq("tag_id", tagId);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to remove tag" });
    }

    return res.status(204).send();
  },
);
