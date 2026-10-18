import { useEffect, useRef, useState } from "react";
import { Search, X, Bookmark as BookmarkIcon, Loader2 } from "lucide-react";
import { api, type Bookmark } from "@/lib/api";
import { cn } from "@/lib/utils";
import { YoutubeIcon } from "./icons/youtube-icon";
import { GitHubIcon } from "./icons/github-icon";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function platformIcon(platform: string | null) {
  switch (platform) {
    case "youtube":
      return <YoutubeIcon className="h-3.5 w-3.5" />;
    case "github":
      return <GitHubIcon className="h-3.5 w-3.5" />;
    default:
      return <BookmarkIcon className="h-3.5 w-3.5" />;
  }
}

export function SearchPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.search({ q });
        setResults(data);
        setActiveIndex(0);
      } catch (e) {
        console.error(e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[activeIndex]) {
        e.preventDefault();
        window.open(results[activeIndex].url, "_blank", "noopener,noreferrer");
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, activeIndex, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-navy/30 px-4 pt-24 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-kip-lg bg-white shadow-kip-hover"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-navy/10 px-5 py-4">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-electric" />
          ) : (
            <Search className="h-4 w-4 text-navy/40" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, content, tags, URLs…"
            className="flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-navy/40"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded-kip-sm p-1 text-navy/40 hover:bg-brand-50 hover:text-navy"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden rounded border border-navy/10 bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-navy/50 sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-navy/50">
              Type to search across titles, content, tags, and URLs.
            </div>
          ) : loading && results.length === 0 ? (
            <div className="flex items-center justify-center px-5 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-electric" />
            </div>
          ) : results.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-navy">
                No results for "{query}"
              </p>
              <p className="mt-1 text-xs text-navy/50">
                Try a different keyword or check your spelling.
              </p>
            </div>
          ) : (
            <ul className="py-1">
              {results.map((b, i) => (
                <li key={b.id}>
                  <button
                    onClick={() => {
                      window.open(b.url, "_blank", "noopener,noreferrer");
                      onClose();
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      "flex w-full items-start gap-3 px-5 py-3 text-left transition-colors",
                      i === activeIndex ? "bg-brand-50" : "hover:bg-brand-50/60"
                    )}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-kip-sm bg-white shadow-kip-card">
                      {b.favicon_url ? (
                        <img
                          src={b.favicon_url}
                          alt=""
                          className="h-5 w-5 rounded"
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                          }}
                        />
                      ) : (
                        platformIcon(b.source_platform)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy">
                        {b.title || "Untitled"}
                      </p>
                      {b.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-navy/60">
                          {b.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-navy/40">
                        <span className="truncate">{hostname(b.url)}</span>
                        {b.tags.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="truncate">
                              {b.tags.map((t) => `#${t.name}`).join(" ")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-navy/10 bg-brand-50/40 px-5 py-2 text-[11px] text-navy/50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-navy/10 bg-white px-1.5 py-0.5">
                ↑
              </kbd>
              <kbd className="rounded border border-navy/10 bg-white px-1.5 py-0.5">
                ↓
              </kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-navy/10 bg-white px-1.5 py-0.5">
                ↵
              </kbd>
              to open
            </span>
          </div>
          <span>
            {results.length} result{results.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
