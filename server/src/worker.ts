import "dotenv/config";
import { Worker } from "bullmq";
import { redis, SCRAPE_QUEUE, type ScrapeJobData } from "./lib/queue.js";
import { supabase } from "./lib/supabase.js";
import { extractMetadata } from "./lib/extractors/index.js";

export function startWorker() {
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
        await supabase
          .from("bookmarks")
          .update({ status: "failed" })
          .eq("id", bookmarkId);
        throw e;
      }
    },
    {
      connection: redis,
      concurrency: 2,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[worker] completed job ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[worker] job ${job?.id} failed:`, err.message);
  });

  console.log("[worker] listening for jobs inside Web Service...");
  return worker;
}
