import { useEffect, useState, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Footer } from "@/components/footer";
import { BookmarkCard } from "@/components/bookmark-card";
import { AddBookmarkModal } from "@/components/add-bookmark-modal";
import { EmptyState } from "@/components/empty-state";
import { api, type Bookmark } from "@/lib/api";
import { subscribeToBookmarks } from "@/lib/realtime";
import { useAuth } from "@/lib/auth-context";
import { useFolders } from "@/lib/folders-context";

export function FolderPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { folders } = useFolders();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const folder = folders.find((f) => f.id === id);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.listBookmarks(id);
      setBookmarks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToBookmarks(user.id, (updated) => {
      // If the updated bookmark now belongs to this folder, add it
      if (updated.folder_id === id) {
        setBookmarks((prev) => {
          const exists = prev.find((b) => b.id === updated.id);
          if (exists) {
            return prev.map((b) => (b.id === updated.id ? updated : b));
          }
          return [updated, ...prev];
        });
      } else {
        // It moved out of this folder — remove it
        setBookmarks((prev) => prev.filter((b) => b.id !== updated.id));
      }
    });
    return unsubscribe;
  }, [user, id]);

  async function handleDelete(bookmarkId: string) {
    const prev = bookmarks;
    setBookmarks((b) => b.filter((x) => x.id !== bookmarkId));
    try {
      await api.deleteBookmark(bookmarkId);
    } catch (e) {
      console.error(e);
      setBookmarks(prev);
    }
  }

  if (!folder && !loading) {
    return <Navigate to="/" replace />;
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
                  {folder?.name ?? "Folder"}
                </h1>
                <p className="mt-1 text-sm text-navy/60">
                  {bookmarks.length} bookmark
                  {bookmarks.length === 1 ? "" : "s"}
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
