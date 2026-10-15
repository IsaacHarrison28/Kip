import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { EmptyState } from "@/components/empty-state";
import { Footer } from "@/components/footer";
import { BookmarkCard } from "@/components/bookmark-card";
import { AddBookmarkModal } from "@/components/add-bookmark-modal";
import { api, type Bookmark } from "@/lib/api";
import { subscribeToBookmarks } from "@/lib/realtime";
import { useAuth } from "@/lib/auth-context";
import { useDndMove } from "@/lib/use-dnd-move";

export function InboxPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const load = useCallback(async () => {
    try {
      const data = await api.listBookmarks({ folderId: "none" });
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

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToBookmarks(user.id, (updated) => {
      setBookmarks((prev) => {
        const existing = prev.find((b) => b.id === updated.id);

        if (!existing) {
          if (updated.folder_id === null) {
            return [updated, ...prev];
          }
          return prev;
        }

        const folderChanged = existing.folder_id !== updated.folder_id;

        if (!folderChanged) {
          return prev.map((b) => (b.id === updated.id ? updated : b));
        }

        if (updated.folder_id === null) {
          return prev.map((b) => (b.id === updated.id ? updated : b));
        } else {
          return prev.filter((b) => b.id !== updated.id);
        }
      });
    });
    return unsubscribe;
  }, [user]);

  async function handleDelete(id: string) {
    const prev = bookmarks;
    setBookmarks((b) => b.filter((x) => x.id !== id));
    try {
      await api.deleteBookmark(id);
    } catch (e) {
      console.error(e);
      setBookmarks(prev);
    }
  }

  const removeFromView = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const restoreToView = useCallback((bookmark: Bookmark, index: number) => {
    setBookmarks((prev) => {
      const next = [...prev];
      next.splice(index, 0, bookmark);
      return next;
    });
  }, []);

  function handleTagsChange(
    bookmarkId: string,
    newTags: Array<{ id: string; name: string }>
  ) {
    setBookmarks((prev) =>
      prev.map((b) => (b.id === bookmarkId ? { ...b, tags: newTags } : b))
    );
  }

  const { onDragEnd } = useDndMove(bookmarks, removeFromView, restoreToView);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onSaveClick={() => setModalOpen(true)} />

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
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
                    Unsorted saves land here. Drag them into a folder to
                    organize.
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
                      onTagsChange={handleTagsChange}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </DndContext>

      <Footer />

      <AddBookmarkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
