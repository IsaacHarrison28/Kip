import { useEffect, useState, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Footer } from "@/components/footer";
import { BookmarkCard } from "@/components/bookmark-card";
import { AddBookmarkModal } from "@/components/add-bookmark-modal";
import { EmptyState } from "@/components/empty-state";
import { MoveModal } from "@/components/move-modal";
import { api, type Bookmark } from "@/lib/api";
import { useTags } from "@/lib/tags-context";
import { useDndMove } from "@/lib/use-dnd-move";
import { useFolders } from "@/lib/folders-context";

export function TagPage({
  onSearchClick,
  onMenuClick,
  isSidebarOpen,
  onSidebarClose,
}: {
  onSearchClick: () => void;
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  onSidebarClose: () => void;
}) {
  const { id } = useParams<{ id: string }>();
  const { tags } = useTags();
  const { incrementCount } = useFolders();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [movingBookmark, setMovingBookmark] = useState<Bookmark | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const tag = tags.find((t) => t.id === id);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.listBookmarks({ tagId: id });
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
    const hasPending = bookmarks.some((b) => b.status === "pending");
    if (!hasPending) return;

    const interval = setInterval(async () => {
      try {
        const data = await api.listBookmarks({ tagId: id });
        setBookmarks(data);
      } catch (e) {
        console.error(e);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [bookmarks, id]);

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

  function handleTagsChange(
    bookmarkId: string,
    newTags: Array<{ id: string; name: string }>
  ) {
    setBookmarks((prev) =>
      prev.map((b) => (b.id === bookmarkId ? { ...b, tags: newTags } : b))
    );

    if (!newTags.some((t) => t.id === id)) {
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    }
  }

  function handleNoteChange(bookmarkId: string, note: string) {
    setBookmarks((prev) =>
      prev.map((b) =>
        b.id === bookmarkId ? { ...b, user_note: note || null } : b
      )
    );
  }

  async function handleModalMove(folderId: string | null) {
    if (!movingBookmark) return;
    const bookmarkId = movingBookmark.id;
    const prevFolderId = movingBookmark.folder_id;

    setMovingBookmark(null);
    if (folderId === prevFolderId) return;

    const prevBookmarks = bookmarks;

    // Optimistic count update
    incrementCount(prevFolderId, -1);
    incrementCount(folderId, +1);

    setBookmarks((prev) =>
      prev.map((b) => (b.id === bookmarkId ? { ...b, folder_id: folderId } : b))
    );

    try {
      await api.moveBookmark(bookmarkId, folderId);
    } catch (e) {
      setBookmarks(prevBookmarks);
      incrementCount(prevFolderId, +1);
      incrementCount(folderId, -1);
      console.error(e);
    }
  }

  const removeFromView = useCallback((bookmarkId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  }, []);

  const restoreToView = useCallback((bookmark: Bookmark, index: number) => {
    setBookmarks((prev) => {
      const next = [...prev];
      next.splice(index, 0, bookmark);
      return next;
    });
  }, []);

  const { onDragEnd } = useDndMove(bookmarks, removeFromView, restoreToView);

  if (!tag && !loading) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        onSaveClick={() => setModalOpen(true)}
        onSearchClick={onSearchClick}
        onMenuClick={onMenuClick}
      />

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} onClose={onSidebarClose} />

          <main className="flex-1">
            <div className="mx-auto max-w-5xl px-6 py-8">
              <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-navy/5 pb-5 sm:flex-row sm:items-end">
                <div>
                  <p className="kip-label mb-1">Tag</p>
                  <h1 className="text-2xl font-bold tracking-tight text-navy">
                    #{tag?.name ?? "tag"}
                  </h1>
                  <p className="mt-1 text-sm text-navy/60">
                    {bookmarks.length} bookmark
                    {bookmarks.length === 1 ? "" : "s"} across all folders
                  </p>
                </div>

                {/* NEW COUNT DESIGN */}
                <div className="flex items-center gap-2 rounded-full bg-brand-50/50 px-3 py-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-electric" />
                  <span className="text-xs font-medium text-navy/70">
                    <strong className="font-bold text-electric">
                      {bookmarks.length}
                    </strong>{" "}
                    tagged
                  </span>
                </div>
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
                      onNoteChange={handleNoteChange}
                      onMoveClick={setMovingBookmark}
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
      <MoveModal
        bookmark={movingBookmark}
        onClose={() => setMovingBookmark(null)}
        onMove={handleModalMove}
      />
    </div>
  );
}
