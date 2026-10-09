import { Inbox, Bookmark, Clock } from "lucide-react";

const folders = [
  { icon: Inbox, label: "Inbox", count: 0, active: true },
  { icon: Clock, label: "Read Later", count: 0 },
  { icon: Bookmark, label: "All Bookmarks", count: 0 },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-navy/10 bg-white px-4 py-6 md:flex md:flex-col">
      <div className="space-y-1">
        <p className="kip-label mb-3 px-3">Folders</p>
        {folders.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.label}
              className={`flex w-full items-center justify-between rounded-kip-sm px-3 py-2 text-sm font-medium transition-colors ${
                f.active
                  ? "bg-brand-50 text-electric-700"
                  : "text-navy/70 hover:bg-brand-50 hover:text-navy"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                {f.label}
              </span>
              <span className="text-xs text-navy/40">{f.count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 space-y-1">
        <p className="kip-label mb-3 px-3">Tags</p>
        <p className="px-3 py-2 text-xs text-navy/40">
          No tags yet. Add tags to organize across folders.
        </p>
      </div>
    </aside>
  );
}
