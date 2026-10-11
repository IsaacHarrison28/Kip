import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { hashUrl, isValidUrl, normalizeUrl } from "../lib/url.js";
import { scrapeQueue } from "../lib/queue.js";

export const bookmarksRouter = Router();

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

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("url_hash", urlHash)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: "Already saved" });
  }

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

  // Enqueue the scrape job
  try {
    await scrapeQueue.add("scrape", {
      bookmarkId: data.id,
      url: data.url,
    });
  } catch (e) {
    console.error("Failed to enqueue scrape job:", e);
    // Don't fail the request — the bookmark is saved, just unenriched
  }

  return res.status(201).json({ bookmark: data });
});

bookmarksRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("bookmarks").delete().eq("id", id);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete bookmark" });
  }

  return res.status(204).send();
});
