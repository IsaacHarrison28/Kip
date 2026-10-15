import { supabase } from "./supabase";
import type { Bookmark } from "./api";

export function subscribeToBookmarks(
  userId: string,
  onChange: (bookmark: Bookmark) => void
): () => void {
  const channel = supabase
    .channel("bookmarks-changes")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "bookmarks",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onChange(payload.new as Bookmark);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
