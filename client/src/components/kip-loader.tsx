import { KipMark } from "./kip-logo";
import { cn } from "@/lib/utils";

export function KipLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className
      )}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Outer pulsing ring */}
        <div className="absolute inset-0 animate-ping rounded-full bg-electric/20 duration-1000" />

        {/* Inner solid circle with the Kip mark */}
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-kip-card">
          <KipMark className="h-6 w-6 animate-pulse text-electric" />
        </div>
      </div>

      {/* Optional: Add tiny text below */}
      <span className="animate-pulse text-[10px] font-medium uppercase tracking-widest text-navy/40">
        Loading
      </span>
    </div>
  );
}
