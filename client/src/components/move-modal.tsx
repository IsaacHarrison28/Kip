import { X, Inbox } from "lucide-react";
import { useFolders } from "@/lib/folders-context";
import { getFolderIcon } from "@/lib/folder-icons";
import type { Bookmark } from "@/lib/api";

export function MoveModal({
  bookmark,
  onClose,
  onMove,
}: {
  bookmark: Bookmark | null;
  onClose: () => void;
  onMove: (folderId: string | null) => void;
}) {
  const { folders } = useFolders();

  if (!bookmark) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/30 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-kip-lg bg-white p-4 shadow-kip-hover sm:rounded-kip-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">Move to...</h2>
          <button
            onClick={onClose}
            className="rounded-kip-sm p-1.5 text-navy/50 hover:bg-brand-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-1 overflow-y-auto">
          {/* Inbox Option */}
          <button
            onClick={() => onMove(null)}
            className="flex w-full items-center gap-3 rounded-kip-sm px-3 py-3 text-sm font-medium text-navy/70 hover:bg-brand-50 hover:text-navy"
          >
            <Inbox className="h-4 w-4 shrink-0" />
            Inbox
          </button>

          {/* Custom Folders */}
          {folders
            .filter((f) => f.name !== "Inbox")
            .map((folder) => {
              const Icon = getFolderIcon(folder.icon);
              return (
                <button
                  key={folder.id}
                  onClick={() => onMove(folder.id)}
                  className="flex w-full items-center gap-3 rounded-kip-sm px-3 py-3 text-sm font-medium text-navy/70 hover:bg-brand-50 hover:text-navy"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
