import { useEffect, useState } from "react";
import { X, Globe, Copy, Check, ExternalLink } from "lucide-react";
import { api, type Folder } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { useFolders } from "@/lib/folders-context";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function PublishModal({
  open,
  folder,
  onClose,
}: {
  open: boolean;
  folder: Folder | null;
  onClose: () => void;
}) {
  const { push } = useToast();
  const { refresh } = useFolders();
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (open && folder) {
      setSlug(folder.slug ?? slugify(folder.name));
      setDescription(folder.description ?? "");
      setPublished(!!folder.is_public);
      setCopied(false);
    }
  }, [open, folder]);

  if (!open || !folder) return null;

  const publicUrl = `${window.location.origin}/c/${slug}`;

  async function handlePublish() {
    if (!folder) return;
    setLoading(true);
    try {
      const updated = await api.publishFolder(folder.id, {
        slug,
        description: description.trim() || undefined,
      });
      setPublished(true);
      await refresh();
      push(`"${updated.name}" is now public.`, "success");
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to publish", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnpublish() {
    if (!folder) return;
    setLoading(true);
    try {
      await api.unpublishFolder(folder.id);
      setPublished(false);
      await refresh();
      push(`"${folder.name}" is no longer public.`, "info");
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to unpublish", "error");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      push("Link copied to clipboard.", "success", 2500);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      push("Failed to copy link", "error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-navy/30 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-kip-lg bg-white p-6 shadow-kip-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50">
              <Globe className="h-4 w-4 text-electric" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy">
                {published ? "Public collection" : "Make it public"}
              </h2>
              <p className="text-xs text-navy/50">{folder.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-kip-sm p-1.5 text-navy/40 hover:bg-brand-50 hover:text-navy"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!published ? (
          <>
            <p className="mb-4 text-sm text-navy/70">
              Anyone with the link will be able to view this collection. They
              won't be able to edit it.
            </p>

            <label className="kip-label mb-1.5 block">Public URL</label>
            <div className="mb-3 flex items-center rounded-kip-sm border border-navy/10 bg-white px-3 py-2 text-sm">
              <span className="text-navy/40">/c/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                className="flex-1 bg-transparent text-navy outline-none"
              />
            </div>

            <label className="kip-label mb-1.5 block">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="A short intro for visitors…"
              className="kip-input mb-4 resize-none"
            />

            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="kip-btn-ghost">
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={loading || !slug.trim()}
                className="kip-btn-primary"
              >
                {loading ? "Publishing…" : "Publish"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-navy/70">
              This collection is live. Anyone with the link can view it.
            </p>

            <label className="kip-label mb-1.5 block">Public URL</label>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex flex-1 items-center overflow-hidden rounded-kip-sm border border-navy/10 bg-white px-3 py-2 text-sm">
                <span className="truncate text-navy">{publicUrl}</span>
              </div>
              <button
                onClick={copyLink}
                className="kip-btn-secondary shrink-0 !px-2.5"
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="kip-btn-secondary shrink-0 !px-2.5"
                aria-label="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <label className="kip-label mb-1.5 block">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="A short intro for visitors…"
              className="kip-input mb-4 resize-none"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={handleUnpublish}
                disabled={loading}
                className="text-xs font-medium text-danger hover:underline"
              >
                Unpublish
              </button>
              <div className="flex gap-2">
                <button onClick={onClose} className="kip-btn-ghost">
                  Close
                </button>
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="kip-btn-primary"
                >
                  {loading ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
