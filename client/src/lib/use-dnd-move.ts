import { useCallback } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { api, type Bookmark } from "./api";
import { useFolders } from "./folders-context";
import { useToast } from "./toast-context";

/**
 * Shared handler for drag-drop moves.
 * `bookmarks` should be the currently visible list.
 * `removeFromView` removes a bookmark from the current page's list.
 */
export function useDndMove(
  bookmarks: Bookmark[],
  removeFromView: (id: string) => void,
  restoreToView: (bookmark: Bookmark, index: number) => void
) {
  const { folders, incrementCount } = useFolders();
  const { push } = useToast();

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const bookmarkId = String(active.id);
      const targetId = String(over.id); // "inbox" or folder uuid

      const bookmark = bookmarks.find((b) => b.id === bookmarkId);
      if (!bookmark) return;

      // Same folder — no-op
      if (targetId === "inbox" && bookmark.folder_id === null) return;
      if (targetId !== "inbox" && bookmark.folder_id === targetId) return;

      const originalIndex = bookmarks.findIndex((b) => b.id === bookmarkId);
      const previousFolderId = bookmark.folder_id;
      const targetFolderId = targetId === "inbox" ? null : targetId;

      const targetName =
        targetFolderId === null
          ? "Inbox"
          : (folders.find((f) => f.id === targetFolderId)?.name ?? "folder");

      // Optimistic
      removeFromView(bookmarkId);
      incrementCount(previousFolderId, -1);
      incrementCount(targetFolderId, +1);

      try {
        await api.moveBookmark(bookmarkId, targetFolderId);
        push(`Moved to ${targetName}.`, "success", 2500);
      } catch (e) {
        // Rollback
        restoreToView(bookmark, originalIndex);
        incrementCount(previousFolderId, +1);
        incrementCount(targetFolderId, -1);
        push(e instanceof Error ? e.message : "Failed to move", "error");
      }
    },
    [bookmarks, folders, incrementCount, push, removeFromView, restoreToView]
  );

  return { onDragEnd };
}
