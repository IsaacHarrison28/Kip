import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { hashUrl, isValidUrl, normalizeUrl } from "../lib/url.js";

export const bookmarksRouter = Router();

/**
 * GET /api/bookmarks
 * List all bookmarks, newest first.
 */
bookmarksRouter.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch bookmarks" });
  }

  return res.json({ bookmarks: data });
});

/**
 * POST /api/bookmarks
 * Save a URL. Returns the created bookmark with status: 'pending'.
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

  // Dedupe check
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("url_hash", urlHash)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: "Already saved" });
  }

  // Insert with a temporary title = hostname
  const tempTitle = new URL(normalized).hostname.replace(/^www\./, "");

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
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

  // Slice 2: enqueue a scraping job here

  return res.status(201).json({ bookmark: data });
});

/**
 * DELETE /api/bookmarks/:id
 */
bookmarksRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("bookmarks").delete().eq("id", id);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete bookmark" });
  }

  return res.status(204).send();
});
