import "dotenv/config";
import { Worker } from "bullmq";
import { redis, SCRAPE_QUEUE, type ScrapeJobData } from "./lib/queue.js";
import { supabase } from "./lib/supabase.js";
import { extractMetadata } from "./lib/extractors/index.js";

const worker = new Worker<ScrapeJobData>(
  SCRAPE_QUEUE,
  async (job) => {
    const { bookmarkId, url } = job.data;
    console.log(`[worker] processing ${url}`);

    try {
      const metadata = await extractMetadata(url);

      const { error } = await supabase
        .from("bookmarks")
        .update({
          title: metadata.title,
          description: metadata.description,
          favicon_url: metadata.favicon_url,
          thumbnail_url: metadata.thumbnail_url,
          content_text: metadata.content_text,
          source_platform: metadata.source_platform,
          status: "ready",
        })
        .eq("id", bookmarkId);

      if (error) throw error;

      console.log(`[worker] ✓ enriched ${url}`);
    } catch (e) {
      console.error(`[worker] ✗ failed ${url}:`, e);

      // Mark as failed — do not rethrow (retries are handled by BullMQ if we rethrow)
      // We'll mark failed but let BullMQ retry
      await supabase
        .from("bookmarks")
        .update({ status: "failed" })
        .eq("id", bookmarkId);

      throw e; // trigger BullMQ retry
    }
  },
  {
    connection: redis,
    concurrency: 5,
  },
);

worker.on("completed", (job) => {
  console.log(`[worker] completed job ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err.message);
});

console.log("[worker] listening for jobs...");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[worker] shutting down...");
  await worker.close();
  await redis.quit();
  process.exit(0);
});
