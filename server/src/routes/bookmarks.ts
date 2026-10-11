import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { hashUrl, isValidUrl, normalizeUrl } from "../lib/url.js";
import { scrapeQueue } from "../lib/queue.js";
import { requireAuth } from "../middleware/auth.js";

export const bookmarksRouter = Router();

// All bookmark routes require authentication
bookmarksRouter.use(requireAuth);

/**
 * GET /api/bookmarks
 * List the authenticated user's bookmarks.
 */
bookmarksRouter.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false });

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
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const normalized = normalizeUrl(url);
  const urlHash = hashUrl(normalized);

  // Dedupe within this user
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", req.userId)
    .eq("url_hash", urlHash)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: "Already saved" });
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
