import { useState, useRef, useEffect } from "react";
import { Plus, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast-context";

export function InlineNote({
  bookmarkId,
  initialNote,
  onNoteUpdated,
}: {
  bookmarkId: string;
  initialNote: string | null;
  onNoteUpdated: (note: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialNote || "");
  const [loading, setLoading] = useState(false);
  const { push } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
          textareaRef.current.scrollHeight + "px";
      }
    }
  }, [editing]);

  async function handleSave() {
    const trimmed = value.trim();
    if (trimmed === (initialNote || "")) {
      setEditing(false);
      return;
    }

    setLoading(true);
    try {
      await api.updateBookmark(bookmarkId, { user_note: trimmed });
      onNoteUpdated(trimmed);
      setEditing(false);
      push("Note saved.", "success", 2000);
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to save note", "error");
    } finally {
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <div
        className="mt-2 rounded-kip-sm border border-electric/30 bg-white p-2 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSave();
            }
            if (e.key === "Escape") {
              setValue(initialNote || "");
              setEditing(false);
            }
          }}
          placeholder="Add a personal note..."
          className="w-full resize-none bg-transparent text-xs text-navy focus:outline-none"
          rows={2}
          disabled={loading}
        />
        <div className="mt-1.5 flex justify-end gap-1">
          <button
            onClick={() => {
              setValue(initialNote || "");
              setEditing(false);
            }}
            className="rounded p-1 text-navy/40 hover:bg-brand-50 hover:text-navy"
            disabled={loading}
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleSave}
            className="rounded bg-electric p-1 text-white hover:bg-electric-700 disabled:opacity-50"
            disabled={loading}
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (initialNote) {
    return (
      <div
        className="mt-2 cursor-pointer rounded-kip-sm border border-electric/10 bg-brand-50/50 p-2 text-xs italic text-navy/80 transition-colors hover:bg-brand-50"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        title="Click to edit note"
      >
        "{initialNote}"
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="mt-2 flex items-center gap-1 text-[11px] font-medium text-navy/40 hover:text-electric"
    >
      <Plus className="h-3 w-3" />
      Add a note
    </button>
  );
}
