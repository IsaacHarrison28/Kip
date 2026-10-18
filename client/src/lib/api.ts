import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type BookmarkStatus = "pending" | "ready" | "failed";

export interface Bookmark {
  id: string;
  user_id: string;
  folder_id: string | null;
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
  tags: Array<{ id: string; name: string }>;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
  created_at: string;
  updated_at: string;
  count?: number;
}

export interface ApiError {
  error: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  count?: number;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeader();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
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
  // Bookmarks
  listBookmarks: (opts?: { folderId?: string | "none"; tagId?: string }) => {
    const params = new URLSearchParams();
    if (opts?.folderId === "none") params.set("folder", "none");
    else if (opts?.folderId) params.set("folder", opts.folderId);
    if (opts?.tagId) params.set("tag", opts.tagId);
    const qs = params.toString();
    return request<{ bookmarks: Bookmark[] }>(
      `/api/bookmarks${qs ? `?${qs}` : ""}`
    ).then((r) => r.bookmarks);
  },

  createBookmark: (url: string, folderId?: string | null) =>
    request<{ bookmark: Bookmark }>("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify({ url, folder_id: folderId ?? null }),
    }).then((r) => r.bookmark),

  moveBookmark: (id: string, folderId: string | null) =>
    request<{ bookmark: Bookmark }>(`/api/bookmarks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ folder_id: folderId }),
    }).then((r) => r.bookmark),

  deleteBookmark: (id: string) =>
    request<void>(`/api/bookmarks/${id}`, { method: "DELETE" }),

  // Folders
  listFolders: () =>
    request<{ folders: Folder[]; inboxCount: number }>("/api/folders"),

  createFolder: (name: string, icon?: string, color?: string) =>
    request<{ folder: Folder }>("/api/folders", {
      method: "POST",
      body: JSON.stringify({ name, icon, color }),
    }).then((r) => r.folder),

  updateFolder: (
    id: string,
    updates: Partial<Pick<Folder, "name" | "icon" | "color" | "position">>
  ) =>
    request<{ folder: Folder }>(`/api/folders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }).then((r) => r.folder),

  deleteFolder: (id: string) =>
    request<void>(`/api/folders/${id}`, { method: "DELETE" }),

  // Tags
  listTags: () => request<{ tags: Tag[] }>("/api/tags").then((r) => r.tags),

  createTag: (name: string) =>
    request<{ tag: Tag }>("/api/tags", {
      method: "POST",
      body: JSON.stringify({ name }),
    }).then((r) => r.tag),

  updateTag: (id: string, name: string) =>
    request<{ tag: Tag }>(`/api/tags/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }).then((r) => r.tag),

  deleteTag: (id: string) =>
    request<void>(`/api/tags/${id}`, { method: "DELETE" }),

  attachTag: (bookmarkId: string, name: string) =>
    request<{ tag: { id: string; name: string } }>(
      `/api/bookmarks/${bookmarkId}/tags`,
      {
        method: "POST",
        body: JSON.stringify({ name }),
      }
    ).then((r) => r.tag),

  detachTag: (bookmarkId: string, tagId: string) =>
    request<void>(`/api/bookmarks/${bookmarkId}/tags/${tagId}`, {
      method: "DELETE",
    }),

  search: (params: {
    q: string;
    folder?: string;
    tag?: string;
    platform?: string;
  }) => {
    const search = new URLSearchParams();
    search.set("q", params.q);
    if (params.folder) search.set("folder", params.folder);
    if (params.tag) search.set("tag", params.tag);
    if (params.platform) search.set("platform", params.platform);

    return request<{ results: Bookmark[]; query: string }>(
      `/api/search?${search.toString()}`
    ).then((r) => r.results);
  },
};
