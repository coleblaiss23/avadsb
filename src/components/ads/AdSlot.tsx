"use client";

import { useEffect } from "react";
import { useConsent } from "@/components/consent/ConsentProvider";
import { cn } from "@/lib/utils";

type AdPlacement =
  | "header-leaderboard"
  | "sidebar-rectangle"
  | "bottom-infeed"
  | "weather-widget";

type AdSlotProps = {
  placement: AdPlacement;
  className?: string;
};

const PLACEMENT_COPY: Record<AdPlacement, { label: string; size: string }> = {
  "header-leaderboard": {
    label: "Ad · Header",
    size: "728 × 90",
  },
  "sidebar-rectangle": {
    label: "Ad · Sidebar",
    size: "300 × 250",
  },
  "bottom-infeed": {
    label: "Ad · In-feed",
    size: "Fluid",
  },
  "weather-widget": {
    label: "Ad · Weather",
    size: "Fluid banner",
  },
};

const SLOT_ENV: Record<AdPlacement, string> = {
  "header-leaderboard": "NEXT_PUBLIC_ADSENSE_SLOT_HEADER_LEADERBOARD",
  "sidebar-rectangle": "NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_RECTANGLE",
  "bottom-infeed": "NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM_INFEED",
  "weather-widget": "NEXT_PUBLIC_ADSENSE_SLOT_WEATHER_WIDGET",
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Ad unit. The placeholder stays until a publisher id, a slot id, and
 * consent (or a confirmed non-EU/UK region) are all present.
 */
export function AdSlot({ placement, className }: AdSlotProps) {
  const meta = PLACEMENT_COPY[placement];
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slotId = process.env[SLOT_ENV[placement]];
  const { adsAllowed } = useConsent();
  const live = Boolean(client && slotId && adsAllowed);

  useEffect(() => {
    if (!live) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense rejects a second push on the same slot during fast refresh.
    }
  }, [live, placement, slotId]);

  if (live) {
    return (
      <aside
        className={cn("w-full overflow-hidden", className)}
        aria-label="Advertisement"
        data-ad-placement={placement}
      >
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 border border-dashed border-[var(--ink-border)] bg-[var(--ink-elevated)] px-3 py-2 text-center",
        placement === "header-leaderboard" && "min-h-[48px] w-full",
        placement === "sidebar-rectangle" && "min-h-[100px] w-full max-w-[300px]",
        placement === "bottom-infeed" && "min-h-[56px] w-full",
        placement === "weather-widget" && "min-h-[72px] w-full",
        className
      )}
      aria-label={`Advertisement placeholder: ${meta.label}`}
      data-ad-placement={placement}
    >
      <span className="text-[10px] font-medium text-slate-500">
        {meta.label}
      </span>
      <span className="text-[11px] text-slate-400">{meta.size}</span>
    </aside>
  );
}
