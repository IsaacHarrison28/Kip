import { Bookmark as BookmarkIcon, Trash2 } from "lucide-react";
import type { Bookmark } from "@/lib/api";
import { cn } from "@/lib/utils";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function BookmarkCard({
  bookmark,
  onDelete,
}: {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
}) {
  const isPending = bookmark.status === "pending";
  const isFailed = bookmark.status === "failed";

  return (
    <article className="kip-card kip-card-hover group relative overflow-hidden">
      {/* Thumbnail area */}
      <div className="relative aspect-video w-full bg-brand-50">
        {bookmark.thumbnail_url ? (
          <img
            src={bookmark.thumbnail_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookmarkIcon className="h-8 w-8 text-electric/40" />
          </div>
        )}

        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-navy/70">
              <span className="h-2 w-2 animate-pulse rounded-full bg-electric" />
              Fetching details…
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-navy/50">
          {bookmark.favicon_url && (
            <img
              src={bookmark.favicon_url}
              alt=""
              className="h-4 w-4 rounded-sm"
            />
          )}
          <span className="truncate">{hostname(bookmark.url)}</span>
        </div>

        <h3
          className={cn(
            "line-clamp-2 text-sm font-semibold leading-snug text-navy",
            !bookmark.title && "text-navy/40"
          )}
        >
          {bookmark.title || "Untitled"}
        </h3>

        {bookmark.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-navy/60">
            {bookmark.description}
          </p>
        )}

        {isFailed && (
          <p className="mt-2 text-xs font-medium text-danger">
            Couldn't fetch details.
          </p>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(bookmark.id)}
        className="absolute right-2 top-2 rounded-kip-sm bg-white/90 p-1.5 text-navy/50 opacity-0 shadow-kip-card backdrop-blur-sm transition-opacity hover:text-danger group-hover:opacity-100"
        aria-label="Delete bookmark"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}
