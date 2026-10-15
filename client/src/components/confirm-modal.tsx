import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-navy/30 px-4 backdrop-blur-sm"
      onClick={() => !loading && onCancel()}
    >
      <div
        className="w-full max-w-md rounded-kip-lg bg-white p-6 shadow-kip-hover"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isDanger ? "bg-danger/10" : "bg-brand-50"
            }`}
          >
            <AlertTriangle
              className={`h-5 w-5 ${
                isDanger ? "text-danger" : "text-electric"
              }`}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold text-navy">{title}</h2>
              <button
                onClick={onCancel}
                disabled={loading}
                className="-mr-1 -mt-1 rounded-kip-sm p-1 text-navy/40 transition-colors hover:bg-brand-50 hover:text-navy disabled:opacity-40"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {description && (
              <p className="mt-1.5 text-sm text-navy/70">{description}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="kip-btn-ghost"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={
              isDanger
                ? "kip-btn bg-danger text-white hover:bg-danger/90"
                : "kip-btn-primary"
            }
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
