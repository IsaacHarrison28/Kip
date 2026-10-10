const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type BookmarkStatus = "pending" | "ready" | "failed";

export interface Bookmark {
  id: string;
  url: string;
  url_hash: string;
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  thumbnail_url: string | null;
  content_text: string | null;
  source_platform: string | null;
  status: BookmarkStatus;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  error: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as ApiError;
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listBookmarks: () =>
    request<{ bookmarks: Bookmark[] }>("/api/bookmarks").then(
      (r) => r.bookmarks
    ),

  createBookmark: (url: string) =>
    request<{ bookmark: Bookmark }>("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify({ url }),
    }).then((r) => r.bookmark),

  deleteBookmark: (id: string) =>
    request<void>(`/api/bookmarks/${id}`, { method: "DELETE" }),
};
