import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, type Folder } from "./api";
import { useAuth } from "./auth-context";

interface FoldersContextValue {
  folders: Folder[];
  inboxCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  createFolder: (name: string, icon?: string) => Promise<Folder>;
  updateFolder: (
    id: string,
    updates: Partial<Pick<Folder, "name" | "icon" | "color" | "position">>
  ) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<void>;
  incrementCount: (folderId: string | null, delta: number) => void;
}

const FoldersContext = createContext<FoldersContextValue | null>(null);

export function FoldersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const { folders, inboxCount } = await api.listFolders();
      setFolders(folders);
      setInboxCount(inboxCount);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setFolders([]);
      setInboxCount(0);
      setLoading(false);
    }
  }, [user, refresh]);

  async function createFolder(name: string, icon?: string) {
    const folder = await api.createFolder(name, icon);
    setFolders((prev) => [...prev, { ...folder, count: 0 }]);
    return folder;
  }

  async function updateFolder(
    id: string,
    updates: Partial<Pick<Folder, "name" | "icon" | "color" | "position">>
  ) {
    const folder = await api.updateFolder(id, updates);
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...folder } : f))
    );
    return folder;
  }

  async function deleteFolder(id: string) {
    await api.deleteFolder(id);
    // Bookmarks from this folder now belong to Inbox — move the count over
    const deleted = folders.find((f) => f.id === id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (deleted?.count) {
      setInboxCount((c) => c + (deleted.count ?? 0));
    }
  }

  function incrementCount(folderId: string | null, delta: number) {
    if (folderId === null) {
      setInboxCount((c) => Math.max(0, c + delta));
    } else {
      setFolders((prev) =>
        prev.map((f) =>
          f.id === folderId
            ? { ...f, count: Math.max(0, (f.count ?? 0) + delta) }
            : f
        )
      );
    }
  }

  return (
    <FoldersContext.Provider
      value={{
        folders,
        inboxCount,
        loading,
        refresh,
        createFolder,
        updateFolder,
        deleteFolder,
        incrementCount,
      }}
    >
      {children}
    </FoldersContext.Provider>
  );
}

export function useFolders() {
  const ctx = useContext(FoldersContext);
  if (!ctx) throw new Error("useFolders must be used inside FoldersProvider");
  return ctx;
}
