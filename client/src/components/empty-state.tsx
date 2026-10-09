import { Bookmark, Plus } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-kip-lg border border-dashed border-navy/15 bg-brand-50/40 px-8 py-20 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-kip-card">
        <Bookmark className="h-6 w-6 text-electric" />
      </div>
      <h2 className="text-lg font-semibold text-navy">Nothing here yet.</h2>
      <p className="mt-1.5 max-w-sm text-sm text-navy/60">
        Save your first link - Kip will fill in the details.
      </p>
      <button className="kip-btn-primary mt-6">
        <Plus className="h-4 w-4" />
        Save link
      </button>
    </div>
  );
}
