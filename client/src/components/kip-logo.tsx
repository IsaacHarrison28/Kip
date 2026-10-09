import { cn } from "@/lib/utils";

export function KipMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
    >
      <path
        d="M6 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v24l-10-6-10 6V4z"
        fill="currentColor"
      />
      <rect x="12" y="9" width="2" height="10" rx="1" fill="white" />
      <path
        d="M14 14l4-4"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 14l4 4"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function KipLogo({
  className,
  showSignature = true,
}: {
  className?: string;
  showSignature?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <KipMark className="h-7 w-7 text-navy" />
      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight text-navy">Kip</span>
        {showSignature && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-navy/50">
            by SateOnline
          </span>
        )}
      </div>
    </div>
  );
}
