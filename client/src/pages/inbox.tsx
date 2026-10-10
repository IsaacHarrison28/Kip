import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { EmptyState } from "@/components/empty-state";
import { Footer } from "@/components/footer";
import { BookmarkCard } from "@/components/bookmark-card";
import { AddBookmarkModal } from "@/components/add-bookmark-modal";
import { api, type Bookmark } from "@/lib/api";

export function InboxPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.listBookmarks();
      setBookmarks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    const prev = bookmarks;
    setBookmarks((b) => b.filter((x) => x.id !== id));
    try {
      await api.deleteBookmark(id);
    } catch (e) {
      console.error(e);
      setBookmarks(prev); // rollback
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header onSaveClick={() => setModalOpen(true)} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-6 py-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-navy">
                  Inbox
                </h1>
                <p className="mt-1 text-sm text-navy/60">
                  Unsorted saves land here. Move them into folders anytime.
                </p>
              </div>
              <span className="kip-tag">{bookmarks.length} saved</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="kip-card h-64 animate-pulse bg-brand-50/50"
                  />
                ))}
              </div>
            ) : bookmarks.length === 0 ? (
              <EmptyState onSaveClick={() => setModalOpen(true)} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bookmarks.map((b) => (
                  <BookmarkCard
                    key={b.id}
                    bookmark={b}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />

      <AddBookmarkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
