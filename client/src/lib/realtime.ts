import { createClient } from "@supabase/supabase-js";
import type { Bookmark } from "./api";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "[realtime] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — realtime disabled"
  );
}

export const supabaseRealtime =
  url && anonKey ? createClient(url, anonKey) : null;

export function subscribeToBookmarks(
  onChange: (bookmark: Bookmark) => void
): () => void {
  if (!supabaseRealtime) return () => {};

  const channel = supabaseRealtime
    .channel("bookmarks-changes")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "bookmarks",
      },
      (payload) => {
        onChange(payload.new as Bookmark);
      }
    )
    .subscribe();

  return () => {
    supabaseRealtime.removeChannel(channel);
  };
}
