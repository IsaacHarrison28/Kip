import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { uniqueSlug } from "../lib/slug.js";

export const foldersRouter = Router();

foldersRouter.use(requireAuth);

const MAX_NAME_LENGTH = 50;
const VALID_ICONS = [
  "inbox",
  "clock",
  "folder",
  "star",
  "heart",
  "bookmark",
  "briefcase",
  "graduation-cap",
  "lightbulb",
  "palette",
];

/**
 * GET /api/folders
 * List the user's folders with bookmark counts.
 */
foldersRouter.get("/", async (req, res) => {
  // Fetch folders
  const { data: folders, error: foldersError } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", req.userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (foldersError) {
    console.error(foldersError);
    return res.status(500).json({ error: "Failed to fetch folders" });
  }

  // Fetch counts (one query, aggregate in JS to keep it simple)
  const { data: bookmarks, error: countsError } = await supabase
    .from("bookmarks")
    .select("folder_id")
    .eq("user_id", req.userId);

  if (countsError) {
    console.error(countsError);
    return res.status(500).json({ error: "Failed to fetch counts" });
  }

  const counts = new Map<string, number>();
  let inboxCount = 0;
  for (const b of bookmarks ?? []) {
    if (b.folder_id == null) {
      inboxCount += 1;
    } else {
      counts.set(b.folder_id, (counts.get(b.folder_id) ?? 0) + 1);
    }
  }

  const withCounts = folders.map((f) => ({
    ...f,
    count: counts.get(f.id) ?? 0,
  }));

  return res.json({ folders: withCounts, inboxCount });
});

/**
 * POST /api/folders
 * Create a new folder.
 */
foldersRouter.post("/", async (req, res) => {
  const { name, icon, color } = req.body as {
    name?: string;
    icon?: string;
    color?: string;
  };

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Name is required" });
  }

  const trimmed = name.trim();

  if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ error: "Invalid folder name" });
  }

  const finalIcon = VALID_ICONS.includes(icon ?? "") ? icon! : "folder";
  const finalColor = typeof color === "string" ? color : "#0b6bf2";

  // Place at the end
  const { data: last } = await supabase
    .from("folders")
    .select("position")
    .eq("user_id", req.userId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (last?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("folders")
    .insert({
      user_id: req.userId,
      name: trimmed,
      icon: finalIcon,
      color: finalColor,
      position: nextPosition,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Folder name already exists" });
    }
    console.error(error);
    return res.status(500).json({ error: "Failed to create folder" });
  }

  return res.status(201).json({ folder: { ...data, count: 0 } });
});

/**
 * PATCH /api/folders/:id
 * Rename or recolor a folder.
 */
foldersRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, icon, color, position } = req.body as {
    name?: string;
    icon?: string;
    color?: string;
    position?: number;
  };

  const updates: Record<string, unknown> = {};

  if (typeof name === "string") {
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) {
      return res.status(400).json({ error: "Invalid folder name" });
    }
    updates.name = trimmed;
  }

  if (typeof icon === "string" && VALID_ICONS.includes(icon)) {
    updates.icon = icon;
  }

  if (typeof color === "string") {
    updates.color = color;
  }

  if (typeof position === "number") {
    updates.position = position;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  const { data, error } = await supabase
    .from("folders")
    .update(updates)
    .eq("id", id)
    .eq("user_id", req.userId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Folder name already exists" });
    }
    console.error(error);
    return res.status(500).json({ error: "Failed to update folder" });
  }

  if (!data) {
    return res.status(404).json({ error: "Folder not found" });
  }

  return res.json({ folder: data });
});

/**
 * DELETE /api/folders/:id
 * Delete a folder. Bookmarks inside move to Inbox (folder_id = null).
 */
foldersRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  // Verify the folder belongs to this user
  const { data: folder } = await supabase
    .from("folders")
    .select("id")
    .eq("id", id)
    .eq("user_id", req.userId)
    .maybeSingle();

  if (!folder) {
    return res.status(404).json({ error: "Folder not found" });
  }

  // Move bookmarks to Inbox (null folder_id)
  const { error: moveError } = await supabase
    .from("bookmarks")
    .update({ folder_id: null })
    .eq("folder_id", id)
    .eq("user_id", req.userId);

  if (moveError) {
    console.error(moveError);
    return res.status(500).json({ error: "Failed to move bookmarks" });
  }

  // Delete the folder
  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", id)
    .eq("user_id", req.userId);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete folder" });
  }

  return res.status(204).send();
});

/**
 * POST /api/folders/:id/publish
 * Body: { slug?: string, description?: string }
 * Publishes a folder. Generates a unique slug if not provided.
 */
foldersRouter.post("/:id/publish", async (req, res) => {
  const { id } = req.params;
  const { slug: customSlug, description } = req.body as {
    slug?: string;
    description?: string;
  };

  // Fetch folder, verify ownership
  const { data: folder } = await supabase
    .from("folders")
    .select("id, name, slug, is_public")
    .eq("id", id)
    .eq("user_id", req.userId)
    .maybeSingle();

  if (!folder) {
    return res.status(404).json({ error: "Folder not found" });
  }

  // If already published, just update
  if (folder.is_public && folder.slug) {
    const { data, error } = await supabase
      .from("folders")
      .update({
        description: description ?? null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update" });
    }
    return res.json({ folder: data });
  }

  // Generate slug if not provided
  const desiredSlug = customSlug
    ? customSlug
    : await uniqueSlug(folder.name, async (s) => {
        const { data } = await supabase
          .from("folders")
          .select("id")
          .eq("slug", s)
          .maybeSingle();
        return !!data;
      });

  // If custom slug provided, validate uniqueness
  if (customSlug) {
    const { data: existing } = await supabase
      .from("folders")
      .select("id")
      .eq("slug", customSlug)
      .maybeSingle();

    if (existing && existing.id !== id) {
      return res.status(409).json({ error: "Slug already in use" });
    }
  }

  const { data, error } = await supabase
    .from("folders")
    .update({
      is_public: true,
      slug: desiredSlug,
      description: description ?? null,
    })
    .eq("id", id)
    .eq("user_id", req.userId)
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to publish" });
  }

  return res.json({ folder: data });
});

/**
 * DELETE /api/folders/:id/publish
 * Unpublishes a folder.
 */
foldersRouter.delete("/:id/publish", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("folders")
    .update({ is_public: false })
    .eq("id", id)
    .eq("user_id", req.userId);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to unpublish" });
  }

  return res.status(204).send();
});
