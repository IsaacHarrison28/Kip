import { Settings, Plus, LogOut } from "lucide-react";
import { KipLogo } from "./kip-logo";
import { useAuth } from "@/lib/auth-context";

export function Header({ onSaveClick }: { onSaveClick: () => void }) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-navy/10 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        <KipLogo />

        <div className="flex items-center gap-2">
          <button onClick={onSaveClick} className="kip-btn-primary">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Save link</span>
          </button>

          <div className="group relative">
            <button className="kip-btn-ghost !px-2.5" aria-label="Account menu">
              {user?.email ? (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-electric text-[11px] font-semibold text-white">
                  {user.email[0].toUpperCase()}
                </div>
              ) : (
                <Settings className="h-4 w-4" />
              )}
            </button>

            <div className="pointer-events-none absolute right-0 top-full z-40 mt-2 w-56 rounded-kip border border-navy/10 bg-white p-1 opacity-0 shadow-kip-hover transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
              <div className="border-b border-navy/5 px-3 py-2">
                <p className="truncate text-xs text-navy/50">Signed in as</p>
                <p className="truncate text-sm font-medium text-navy">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={signOut}
                className="mt-1 flex w-full items-center gap-2 rounded-kip-sm px-3 py-2 text-sm text-navy/70 hover:bg-brand-50 hover:text-navy"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
