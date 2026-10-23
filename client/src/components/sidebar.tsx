import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Plus, Trash2, Pencil, Tag as TagIcon, X } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { useFolders } from "@/lib/folders-context";
import { useTags } from "@/lib/tags-context";
import { useToast } from "@/lib/toast-context";
import { getFolderIcon } from "@/lib/folder-icons";
import { ConfirmModal } from "@/components/confirm-modal";
import { cn } from "@/lib/utils";
import type { Folder, Tag } from "@/lib/api";

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { folders, inboxCount, createFolder, updateFolder, deleteFolder } =
    useFolders();
  const { tags, updateTag, deleteTag } = useTags();
  const { push } = useToast();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Folder | null>(null);
  const [pendingTagDelete, setPendingTagDelete] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) {
      setCreating(false);
      setNewName("");
      return;
    }
    try {
      await createFolder(name);
      push(`Folder "${name}" created.`, "success");
      setNewName("");
      setCreating(false);
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to create folder", "error");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteFolder(pendingDelete.id);
      push(
        `Folder "${pendingDelete.name}" deleted. Bookmarks moved to Inbox.`,
        "info"
      );
      setPendingDelete(null);
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to delete folder", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function confirmTagDelete() {
    if (!pendingTagDelete) return;
    setDeleting(true);
    try {
      await deleteTag(pendingTagDelete.id);
      push(
        `Tag "${pendingTagDelete.name}" removed from all bookmarks.`,
        "info"
      );
      setPendingTagDelete(null);
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to delete tag", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleRename(id: string, name: string) {
    try {
      await updateFolder(id, { name });
      push(`Folder renamed to "${name}".`, "success");
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to rename folder", "error");
    }
  }

  async function handleTagRename(id: string, name: string) {
    try {
      await updateTag(id, name);
      push(`Tag renamed to "${name}".`, "success");
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to rename tag", "error");
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Desktop: static, Mobile: fixed drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-navy/10 bg-white px-4 py-6 transition-transform duration-300 ease-in-out md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Close Button */}
        <div className="mb-4 flex items-center justify-between md:hidden">
          <span className="font-bold text-navy">Menu</span>
          <button
            onClick={onClose}
            className="rounded-kip-sm p-1.5 text-navy/50 hover:bg-brand-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Folders */}
        <div className="space-y-1">
          <div className="mb-3 flex items-center justify-between px-3">
            <p className="kip-label">Folders</p>
            <button
              onClick={() => setCreating(true)}
              className="rounded-kip-sm p-1 text-navy/40 hover:bg-brand-50 hover:text-electric"
              aria-label="New folder"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <FolderRow
            to="/"
            name="Inbox"
            icon="inbox"
            count={inboxCount}
            droppableId="inbox"
            deletable={false}
            onClick={onClose}
          />

          {folders
            .filter((f) => f.name !== "Inbox")
            .map((folder) => (
              <FolderRow
                key={folder.id}
                to={`/folder/${folder.id}`}
                name={folder.name}
                icon={folder.icon}
                count={folder.count ?? 0}
                droppableId={folder.id}
                deletable
                onRename={(name) => handleRename(folder.id, name)}
                onDelete={() => setPendingDelete(folder)}
                onClick={onClose}
              />
            ))}

          {creating && (
            <div className="flex items-center gap-1.5 px-3 py-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") {
                    setCreating(false);
                    setNewName("");
                  }
                }}
                onBlur={handleCreate}
                placeholder="Folder name"
                className="min-w-0 flex-1 rounded-kip-sm border border-navy/10 bg-white px-2 py-1 text-sm focus:border-electric focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="mt-8 space-y-1">
          <p className="kip-label mb-3 px-3">Tags</p>

          {tags.length === 0 ? (
            <p className="px-3 py-2 text-xs text-navy/40">
              No tags yet. Add tags to organize across folders.
            </p>
          ) : (
            tags.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                onRename={(name) => handleTagRename(tag.id, name)}
                onDelete={() => setPendingTagDelete(tag)}
                onClick={onClose}
              />
            ))
          )}
        </div>
      </aside>

      {/* Modals */}
      <ConfirmModal
        open={pendingDelete !== null}
        title={
          pendingDelete ? `Delete "${pendingDelete.name}"?` : "Delete folder?"
        }
        description={
          pendingDelete?.count
            ? `${pendingDelete.count} bookmark${pendingDelete.count === 1 ? "" : "s"} will move to Inbox. This cannot be undone.`
            : "This folder is empty. This cannot be undone."
        }
        confirmLabel="Delete folder"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />

      <ConfirmModal
        open={pendingTagDelete !== null}
        title={
          pendingTagDelete
            ? `Delete tag "${pendingTagDelete.name}"?`
            : "Delete tag?"
        }
        description={
          pendingTagDelete?.count
            ? `This tag will be removed from ${pendingTagDelete.count} bookmark${pendingTagDelete.count === 1 ? "" : "s"}. The bookmarks themselves are not deleted.`
            : "This tag will be removed from all bookmarks. The bookmarks themselves are not deleted."
        }
        confirmLabel="Delete tag"
        variant="danger"
        loading={deleting}
        onConfirm={confirmTagDelete}
        onCancel={() => !deleting && setPendingTagDelete(null)}
      />
    </>
  );
}

function FolderRow({
  to,
  name,
  icon,
  count,
  droppableId,
  deletable,
  onRename,
  onDelete,
  onClick,
}: {
  to: string;
  name: string;
  icon: string;
  count: number;
  droppableId: string;
  deletable: boolean;
  onRename?: (name: string) => void;
  onDelete?: () => void;
  onClick?: () => void;
}) {
  const Icon = getFolderIcon(icon);
  const { isOver, setNodeRef } = useDroppable({ id: droppableId });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commitRename() {
    const next = draft.trim();
    if (next && next !== name) onRename?.(next);
    else setDraft(name);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-kip-sm bg-brand-50 px-3 py-2">
        <Icon className="h-4 w-4 shrink-0 text-electric" />
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setDraft(name);
              setEditing(false);
            }
          }}
          onBlur={commitRename}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-navy focus:outline-none"
        />
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      ref={setNodeRef}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group flex w-full items-center justify-between rounded-kip-sm px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-brand-50 text-electric-700"
            : "text-navy/70 hover:bg-brand-50 hover:text-navy",
          isOver && "ring-2 ring-electric ring-offset-1"
        )
      }
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{name}</span>
      </span>

      <span className="flex items-center gap-1">
        <span className="text-xs text-navy/40 group-hover:hidden">{count}</span>
        {deletable && (
          <span className="hidden items-center gap-0.5 group-hover:flex">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditing(true);
              }}
              className="rounded p-1 text-navy/40 hover:text-electric"
              aria-label="Rename folder"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.();
              }}
              className="rounded p-1 text-navy/40 hover:text-danger"
              aria-label="Delete folder"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </span>
        )}
      </span>
    </NavLink>
  );
}

function TagRow({
  tag,
  onRename,
  onDelete,
  onClick,
}: {
  tag: Tag;
  onRename: (name: string) => void;
  onDelete: () => void;
  onClick?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tag.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commitRename() {
    const next = draft.trim();
    if (next && next !== tag.name) onRename(next);
    else setDraft(tag.name);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-kip-sm bg-brand-50 px-3 py-2">
        <TagIcon className="h-3.5 w-3.5 shrink-0 text-electric" />
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setDraft(tag.name);
              setEditing(false);
            }
          }}
          onBlur={commitRename}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-navy focus:outline-none"
        />
      </div>
    );
  }

  return (
    <NavLink
      to={`/tag/${tag.id}`}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group flex w-full items-center justify-between rounded-kip-sm px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-brand-50 text-electric-700"
            : "text-navy/70 hover:bg-brand-50 hover:text-navy"
        )
      }
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <TagIcon className="h-3.5 w-3.5 shrink-0 text-navy/40" />
        <span className="truncate">{tag.name}</span>
      </span>

      <span className="flex items-center gap-1">
        <span className="text-xs text-navy/40 group-hover:hidden">
          {tag.count ?? 0}
        </span>
        <span className="hidden items-center gap-0.5 group-hover:flex">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditing(true);
            }}
            className="rounded p-1 text-navy/40 hover:text-electric"
            aria-label="Rename tag"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-1 text-navy/40 hover:text-danger"
            aria-label="Delete tag"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </span>
      </span>
    </NavLink>
  );
}
