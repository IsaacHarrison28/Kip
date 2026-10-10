import { Settings, Plus } from "lucide-react";
import { KipLogo } from "./kip-logo";

export function Header({ onSaveClick }: { onSaveClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-navy/10 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        <KipLogo />

        <div className="flex items-center gap-2">
          <button onClick={onSaveClick} className="kip-btn-primary">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Save link</span>
          </button>
          <button className="kip-btn-ghost !px-2.5" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
