import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

export const tagsRouter = Router();

tagsRouter.use(requireAuth);

const MAX_NAME_LENGTH = 30;
const MAX_TAGS_PER_BOOKMARK = 10;

/**
 * Normalize tag name:
 * - trim
 * - lowercase
 * - collapse internal whitespace to hyphens
 * - strip anything but letters, numbers, hyphens
 */
function normalizeTagName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_NAME_LENGTH);
}

/**
 * GET /api/tags
 * List the user's tags with usage counts.
 */
tagsRouter.get("/", async (req, res) => {
  const { data: tags, error } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", req.userId)
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch tags" });
  }

  // Count usage
  const { data: joins, error: joinsError } = await supabase
    .from("bookmark_tags")
    .select("tag_id, bookmarks!inner(user_id)")
    .eq("bookmarks.user_id", req.userId);

  if (joinsError) {
    console.error(joinsError);
    return res.status(500).json({ error: "Failed to fetch tag counts" });
  }

  const counts = new Map<string, number>();
  for (const row of joins ?? []) {
    counts.set(row.tag_id, (counts.get(row.tag_id) ?? 0) + 1);
  }

  const withCounts = tags.map((t) => ({
    ...t,
    count: counts.get(t.id) ?? 0,
  }));

  return res.json({ tags: withCounts });
});

/**
 * POST /api/tags
 * Create a new tag (idempotent — returns existing if it exists).
 */
tagsRouter.post("/", async (req, res) => {
  const { name } = req.body as { name?: string };

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Name is required" });
  }

  const normalized = normalizeTagName(name);

  if (!normalized) {
    return res.status(400).json({ error: "Invalid tag name" });
  }

  // Try insert
  const { data: inserted, error } = await supabase
    .from("tags")
    .insert({ user_id: req.userId, name: normalized })
    .select()
    .single();

  if (error) {
    // If unique conflict, fetch the existing tag
    if (error.code === "23505") {
      const { data: existing } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", req.userId)
        .eq("name", normalized)
        .maybeSingle();

      if (existing) {
        return res.status(200).json({ tag: { ...existing, count: 0 } });
      }
    }
    console.error(error);
    return res.status(500).json({ error: "Failed to create tag" });
  }

  return res.status(201).json({ tag: { ...inserted, count: 0 } });
});

/**
 * PATCH /api/tags/:id
 * Rename a tag globally.
 */
tagsRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body as { name?: string };

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Name is required" });
  }

  const normalized = normalizeTagName(name);

  if (!normalized) {
    return res.status(400).json({ error: "Invalid tag name" });
  }

  const { data, error } = await supabase
    .from("tags")
    .update({ name: normalized })
    .eq("id", id)
    .eq("user_id", req.userId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Tag name already exists" });
    }
    console.error(error);
    return res.status(500).json({ error: "Failed to update tag" });
  }

  if (!data) {
    return res.status(404).json({ error: "Tag not found" });
  }

  return res.json({ tag: data });
});

/**
 * DELETE /api/tags/:id
 * Delete a tag from all bookmarks.
 */
tagsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", id)
    .eq("user_id", req.userId);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete tag" });
  }

  return res.status(204).send();
});
