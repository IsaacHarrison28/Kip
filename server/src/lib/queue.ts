import { Queue } from "bullmq";
import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("Missing REDIS_URL in environment");
}

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  tls: {},
});

export const SCRAPE_QUEUE = "scrape-bookmark";

export interface ScrapeJobData {
  bookmarkId: string;
  url: string;
}

export const scrapeQueue = new Queue<ScrapeJobData>(SCRAPE_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 500 },
  },
});
