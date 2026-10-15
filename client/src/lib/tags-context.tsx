import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, type Tag } from "./api";
import { useAuth } from "./auth-context";

interface TagsContextValue {
  tags: Tag[];
  loading: boolean;
  refresh: () => Promise<void>;
  createTag: (name: string) => Promise<Tag>;
  updateTag: (id: string, name: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  incrementCount: (tagId: string, delta: number) => void;
  ensureTag: (name: string) => Tag | undefined;
}

const TagsContext = createContext<TagsContextValue | null>(null);

export function TagsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const tags = await api.listTags();
      setTags(tags);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
    else {
      setTags([]);
      setLoading(false);
    }
  }, [user, refresh]);

  async function createTag(name: string) {
    const tag = await api.createTag(name);
    setTags((prev) => {
      const exists = prev.find((t) => t.id === tag.id);
      if (exists) return prev;
      return [...prev, { ...tag, count: 0 }].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });
    return tag;
  }

  async function updateTag(id: string, name: string) {
    const tag = await api.updateTag(id, name);
    setTags((prev) =>
      prev
        .map((t) => (t.id === id ? { ...t, ...tag } : t))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    return tag;
  }

  async function deleteTag(id: string) {
    await api.deleteTag(id);
    setTags((prev) => prev.filter((t) => t.id !== id));
  }

  function incrementCount(tagId: string, delta: number) {
    setTags((prev) =>
      prev.map((t) =>
        t.id === tagId
          ? { ...t, count: Math.max(0, (t.count ?? 0) + delta) }
          : t
      )
    );
  }

  function ensureTag(name: string) {
    return tags.find((t) => t.name === name);
  }

  return (
    <TagsContext.Provider
      value={{
        tags,
        loading,
        refresh,
        createTag,
        updateTag,
        deleteTag,
        incrementCount,
        ensureTag,
      }}
    >
      {children}
    </TagsContext.Provider>
  );
}

export function useTags() {
  const ctx = useContext(TagsContext);
  if (!ctx) throw new Error("useTags must be used inside TagsProvider");
  return ctx;
}
