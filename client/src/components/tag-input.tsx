import { useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { useTags } from "@/lib/tags-context";
import { useToast } from "@/lib/toast-context";
import { api } from "@/lib/api";

interface TagInputProps {
  bookmarkId: string;
  currentTags: Array<{ id: string; name: string }>;
  onTagAdded: (tag: { id: string; name: string }) => void;
  onTagRemoved: (tagId: string) => void;
}

export function TagInput({
  bookmarkId,
  currentTags,
  onTagAdded,
  onTagRemoved,
}: TagInputProps) {
  const { tags, createTag, incrementCount } = useTags();
  const { push } = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Suggestions — user's tags not already on this bookmark
  const currentIds = new Set(currentTags.map((t) => t.id));
  const suggestions = value.trim()
    ? tags
        .filter((t) => !currentIds.has(t.id))
        .filter((t) => t.name.includes(value.trim().toLowerCase()))
        .slice(0, 5)
    : [];

  async function addTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Optimistic
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, name: trimmed.toLowerCase() };
    onTagAdded(optimistic);
    setValue("");

    try {
      const tag = await api.attachTag(bookmarkId, trimmed);
      // Replace optimistic with real
      onTagRemoved(tempId);
      onTagAdded(tag);
      // Ensure tag exists in the global list
      if (!tags.find((t) => t.id === tag.id)) {
        await createTag(trimmed);
      }
      incrementCount(tag.id, +1);
    } catch (e) {
      onTagRemoved(tempId);
      push(e instanceof Error ? e.message : "Failed to add tag", "error");
    }
  }

  async function removeTag(tagId: string) {
    const prev = [...currentTags];
    onTagRemoved(tagId);
    try {
      await api.detachTag(bookmarkId, tagId);
      incrementCount(tagId, -1);
    } catch (e) {
      // Rollback
      const removed = prev.find((t) => t.id === tagId);
      if (removed) onTagAdded(removed);
      push(e instanceof Error ? e.message : "Failed to remove tag", "error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {currentTags.map((tag) => (
        <span
          key={tag.id}
          className="group/tag inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-electric-700"
        >
          {tag.name}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag.id);
            }}
            className="rounded-full p-0.5 text-electric-700/50 hover:bg-electric/10 hover:text-danger"
            aria-label={`Remove tag ${tag.name}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      {editing ? (
        <div className="relative">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(value);
              }
              if (e.key === "Escape") {
                setValue("");
                setEditing(false);
              }
              if (e.key === "Backspace" && value === "" && currentTags.length) {
                removeTag(currentTags[currentTags.length - 1].id);
              }
            }}
            onBlur={() => {
              if (value.trim()) addTag(value);
              setEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder="tag-name"
            className="w-24 rounded-full border border-electric/30 bg-white px-2.5 py-1 text-[11px] font-medium text-navy focus:border-electric focus:outline-none"
          />

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 top-full z-30 mt-1 w-40 rounded-kip border border-navy/10 bg-white p-1 shadow-kip-hover">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(s.name);
                  }}
                  className="block w-full rounded-kip-sm px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-navy/70 hover:bg-brand-50 hover:text-electric-700"
                >
                  {s.name}
                  <span className="ml-1 text-navy/40">·{s.count ?? 0}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-navy/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-navy/40 transition-colors hover:border-electric hover:text-electric"
          aria-label="Add tag"
        >
          <Plus className="h-2.5 w-2.5" />
          Tag
        </button>
      )}
    </div>
  );
}
