import "dotenv/config";
import express from "express";
import cors from "cors";
import { bookmarksRouter } from "./routes/bookmarks.js";
import { foldersRouter } from "./routes/folders.js";
import { tagsRouter } from "./routes/tags.js";
import { bookmarkTagsRouter } from "./routes/bookmark-tags.js";
import { searchRouter } from "./routes/search.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "kip-api" });
});

app.use("/api/bookmarks", bookmarksRouter);
app.use("/api/folders", foldersRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/bookmarks/:bookmarkId/tags", bookmarkTagsRouter);
app.use("/api/search", searchRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`[kip-api] listening on http://localhost:${PORT}`);
});
