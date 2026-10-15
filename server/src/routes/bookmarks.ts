import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { hashUrl, isValidUrl, normalizeUrl } from "../lib/url.js";
import { scrapeQueue } from "../lib/queue.js";
import { requireAuth } from "../middleware/auth.js";

export const bookmarksRouter = Router();

bookmarksRouter.use(requireAuth);

/**
 * GET /api/bookmarks
 */
bookmarksRouter.get("/", async (req, res) => {
  const { folder } = req.query as { folder?: string };

  let query = supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false });

  if (folder === "none") {
    query = query.is("folder_id", null);
  } else if (typeof folder === "string" && folder.length > 0) {
    query = query.eq("folder_id", folder);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch bookmarks" });
  }

  return res.json({ bookmarks: data });
});

/**
 * POST /api/bookmarks
 */
bookmarksRouter.post("/", async (req, res) => {
  const { url, folder_id } = req.body as {
    url?: string;
    folder_id?: string | null;
  };

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const normalized = normalizeUrl(url);
  const urlHash = hashUrl(normalized);

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", req.userId)
    .eq("url_hash", urlHash)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: "Already saved" });
  }

  // Validate folder_id if provided
  let finalFolderId: string | null = null;
  if (typeof folder_id === "string" && folder_id.length > 0) {
    const { data: folder } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folder_id)
      .eq("user_id", req.userId)
      .maybeSingle();

    if (!folder) {
      return res.status(400).json({ error: "Folder not found" });
    }

    finalFolderId = folder_id;
  }

  const tempTitle = new URL(normalized).hostname.replace(/^www\./, "");

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: req.userId,
      url: normalized,
      url_hash: urlHash,
      title: tempTitle,
      status: "pending",
      folder_id: finalFolderId,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to save bookmark" });
  }

  try {
    await scrapeQueue.add("scrape", {
      bookmarkId: data.id,
      url: data.url,
    });
  } catch (e) {
    console.error("Failed to enqueue scrape job:", e);
  }

  return res.status(201).json({ bookmark: data });
});

/**
 * PATCH /api/bookmarks/:id
 * Move to folder, or update folder_id.
 */
bookmarksRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { folder_id } = req.body as { folder_id?: string | null };

  if (folder_id === undefined) {
    return res.status(400).json({ error: "No fields to update" });
  }

  // If moving to a folder, verify it belongs to the user
  if (typeof folder_id === "string") {
    const { data: folder } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folder_id)
      .eq("user_id", req.userId)
      .maybeSingle();

    if (!folder) {
      return res.status(400).json({ error: "Folder not found" });
    }
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .update({ folder_id })
    .eq("id", id)
    .eq("user_id", req.userId)
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update bookmark" });
  }

  if (!data) {
    return res.status(404).json({ error: "Bookmark not found" });
  }

  return res.json({ bookmark: data });
});

/**
 * DELETE /api/bookmarks/:id
 */
bookmarksRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", id)
    .eq("user_id", req.userId);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete bookmark" });
  }

  return res.status(204).send();
});
