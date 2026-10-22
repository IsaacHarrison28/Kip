import { Router } from "express";
import { assertSafeUrl } from "../lib/ssrf.js";

export const proxyRouter = Router();

proxyRouter.get("/", async (req, res) => {
  const { url } = req.query as { url?: string };

  if (!url || typeof url !== "string") {
    return res.status(400).send("URL is required");
  }

  try {
    await assertSafeUrl(url);
    const parsedUrl = new URL(url);

    const imageRes = await fetch(url, {
      headers: {
        // Fake a full Chrome browser on Windows
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept:
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",

        // These headers prove to the server that this is a direct image request
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",

        // Some sites require a Referer to the parent domain, others require the exact page
        Referer: parsedUrl.origin,
      },
    });

    if (!imageRes.ok) {
      console.error(`[proxy] Upstream error ${imageRes.status} for ${url}`);
      return res.status(imageRes.status).send("Failed to fetch image");
    }

    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24h

    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return res.send(buffer);
  } catch (error) {
    console.error("[proxy] Failed to fetch image:", error);
    return res.status(500).send("Proxy error");
  }
});
