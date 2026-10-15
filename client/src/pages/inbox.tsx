import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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
import { useFolders } from "@/lib/folders-context";

export function InboxPage() {
  const { user } = useAuth();
  const { incrementCount } = useFolders();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const load = useCallback(async () => {
    try {
      const data = await api.listBookmarks("none"); // only Inbox
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
      // Only handle bookmarks that belong in the Inbox
      if (updated.folder_id === null) {
        setBookmarks((prev) => {
          const exists = prev.find((b) => b.id === updated.id);
          if (exists) {
            return prev.map((b) => (b.id === updated.id ? updated : b));
          }
          return [updated, ...prev];
        });
      } else {
        setBookmarks((prev) => prev.filter((b) => b.id !== updated.id));
      }
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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const bookmarkId = String(active.id);
    const targetFolderId = String(over.id); // "inbox" or a folder uuid

    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark) return;

    // If dropped on Inbox, do nothing (already there)
    if (targetFolderId === "inbox") return;

    // Optimistic move
    const prev = bookmarks;
    setBookmarks((b) => b.filter((x) => x.id !== bookmarkId));
    incrementCount(null, -1);
    incrementCount(targetFolderId, +1);

    try {
      await api.moveBookmark(bookmarkId, targetFolderId);
    } catch (e) {
      console.error(e);
      // rollback
      setBookmarks(prev);
      incrementCount(null, +1);
      incrementCount(targetFolderId, -1);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header onSaveClick={() => setModalOpen(true)} />

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
