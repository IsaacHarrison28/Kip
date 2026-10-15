import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToast, type ToastVariant } from "@/lib/toast-context";
import { cn } from "@/lib/utils";

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; accent: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle2,
    accent: "before:bg-success",
    iconColor: "text-success",
  },
  error: {
    icon: AlertCircle,
    accent: "before:bg-danger",
    iconColor: "text-danger",
  },
  info: {
    icon: Info,
    accent: "before:bg-electric",
    iconColor: "text-electric",
  },
};

export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const { icon: Icon, accent, iconColor } = VARIANT_STYLES[toast.variant];
        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-kip border border-navy/10 bg-white p-3.5 shadow-kip-hover",
              "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:content-['']",
              accent,
              "animate-in slide-in-from-bottom-2 fade-in duration-200"
            )}
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconColor)} />
            <p className="flex-1 text-sm font-medium text-navy">
              {toast.message}
            </p>
            <button
              onClick={() => dismiss(toast.id)}
              className="rounded p-0.5 text-navy/40 transition-colors hover:text-navy"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
