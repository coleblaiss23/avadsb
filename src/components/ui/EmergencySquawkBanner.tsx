import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type EmergencySquawkBannerProps = {
  code: string;
  title: string;
  summary?: string;
  compact?: boolean;
  className?: string;
};

/**
 * Emergency discretes (7500 / 7600 / 7700) outrank every other status chip.
 * Static high-contrast treatment — no flash, no strobe.
 */
export function EmergencySquawkBanner({
  code,
  title,
  summary,
  compact = false,
  className,
}: EmergencySquawkBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        "emergency-squawk flex items-start gap-2.5",
        compact ? "px-2.5 py-1.5" : "px-3 py-2.5",
        className
      )}
    >
      <AlertTriangle
        className={cn("mt-0.5 shrink-0 text-[#ff8a7a]", compact ? "h-3.5 w-3.5" : "h-5 w-5")}
        aria-hidden
      />
      <div className="min-w-0">
        <p
          className={cn(
            "font-mono font-bold tabular-nums tracking-wide text-[#ffe8d8]",
            compact ? "text-sm" : "text-xl sm:text-2xl"
          )}
        >
          EMERGENCY {code}
        </p>
        <p
          className={cn(
            "font-semibold uppercase tracking-wide text-[#ffb4a8]",
            compact ? "text-[10px]" : "text-xs"
          )}
        >
          {title}
        </p>
        {summary && !compact ? (
          <p className="mt-1 text-sm leading-relaxed text-[#ffe8d8]">{summary}</p>
        ) : null}
      </div>
    </div>
  );
}
