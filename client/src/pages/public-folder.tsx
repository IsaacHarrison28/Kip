import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Eye, Bookmark as BookmarkIcon } from "lucide-react";
import { api, type PublicFolder, type PublicBookmark } from "@/lib/api";
import { KipLogo } from "@/components/kip-logo";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function PublicCard({ bookmark }: { bookmark: PublicBookmark }) {
  function openLink() {
    window.open(bookmark.url, "_blank", "noopener,noreferrer");
  }

  return (
    <article
      onClick={openLink}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLink();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Open ${bookmark.title ?? bookmark.url}`}
      className="kip-card kip-card-hover group cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2"
    >
      <div className="relative aspect-video w-full bg-gradient-to-br from-brand-50 to-brand-100">
        {bookmark.thumbnail_url ? (
          <img
            src={bookmark.thumbnail_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {bookmark.favicon_url ? (
              <img
                src={bookmark.favicon_url}
                alt=""
                className="h-8 w-8 rounded"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <BookmarkIcon className="h-8 w-8 text-electric/40" />
            )}
          </div>
        )}
      </div>

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

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-navy">
          {bookmark.title || "Untitled"}
        </h3>

        {bookmark.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-navy/60">
            {bookmark.description}
          </p>
        )}

        {bookmark.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {bookmark.tags.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-electric-700"
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function PublicFolderPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<{
    folder: PublicFolder;
    bookmarks: PublicBookmark[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const result = await api.getPublicFolder(slug);
        setData(result);
        // Fire-and-forget view increment
        api.incrementPublicView(slug).catch(() => {});
        // Update page title
        document.title = `${result.folder.name} · Kip`;
      } catch (e) {
        console.error(e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-2 w-2 animate-pulse rounded-full bg-electric" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50/40 px-4 text-center">
        <KipLogo showSignature={false} />
        <h1 className="mt-8 text-2xl font-bold text-navy">Page not found</h1>
        <p className="mt-2 max-w-sm text-sm text-navy/60">
          This collection doesn't exist or is no longer public.
        </p>
        <a href="/" className="kip-btn-primary mt-6">
          Go to Kip
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-navy/10 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <a href="/" className="transition-opacity hover:opacity-70">
            <KipLogo />
          </a>
          <a
            href="/"
            className="text-xs font-medium text-navy/50 hover:text-navy"
          >
            Save anything. Find everything.
          </a>
        </div>
      </header>

      {/* Collection */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-navy">
            {data.folder.name}
          </h1>
          {data.folder.description && (
            <p className="mt-2 max-w-2xl text-sm text-navy/60">
              {data.folder.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-3 text-xs text-navy/50">
            <span>
              {data.bookmarks.length} bookmark
              {data.bookmarks.length === 1 ? "" : "s"}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {data.folder.view_count} view
              {data.folder.view_count === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {data.bookmarks.length === 0 ? (
          <div className="rounded-kip-lg border border-dashed border-navy/15 bg-brand-50/40 px-8 py-16 text-center">
            <BookmarkIcon className="mx-auto h-8 w-8 text-electric/40" />
            <p className="mt-3 text-sm text-navy/60">
              This collection is empty.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.bookmarks.map((b) => (
              <PublicCard key={b.id} bookmark={b} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-navy/10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-navy/50 sm:flex-row">
          <p>© {new Date().getFullYear()} SateOnline</p>
          <a href="/" className="font-medium hover:text-navy">
            Made with Kip
          </a>
        </div>
      </footer>
    </div>
  );
}
