"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppNav } from "@/components/layout/AppNav";
import { RouteMapLoader } from "@/components/map/RouteMapLoader";
import { DashboardSidebar } from "@/components/planner/DashboardSidebar";
import { FlightTicker } from "@/components/ui/FlightTicker";
import { useFlightDeckHotkeys } from "@/hooks/use-flight-deck-hotkeys";
import { cn } from "@/lib/utils";

export function PlannerShell({ routeBanner }: { routeBanner?: string }) {
  useFlightDeckHotkeys();
  const [deckOpen, setDeckOpen] = useState(true);

  // On phone-sized screens, default to the map instead of the context panel.
  // Runs once after mount so server-rendered HTML stays consistent, then
  // adjusts for the visitor's actual viewport.
  useEffect(() => {
    const isPhoneWidth = window.matchMedia("(max-width: 1023px)").matches;
    if (isPhoneWidth) {
      setDeckOpen(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(
      () => window.dispatchEvent(new Event("resize")),
      40
    );
    return () => window.clearTimeout(t);
  }, [deckOpen]);

  return (
    <div className="night-ui flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--ink)] text-[var(--ink-text)]">
      <AppNav
        variant="radar"
        rightSlot={
          <p className="hidden text-xs text-slate-500 lg:block">
            Press{" "}
            <kbd className="rounded border border-[var(--ink-border)] bg-[var(--ink-elevated)] px-1.5 font-mono text-slate-300">
              /
            </kbd>{" "}
            to focus origin
          </p>
        }
      />
      {routeBanner ? (
        <div className="border-b border-[var(--ink-border)] bg-[var(--ink-elevated)] px-4 py-2 text-center text-sm text-slate-300">
          Popular route:{" "}
          <strong className="font-mono tabular-nums text-slate-100">
            {routeBanner}
          </strong>
          {" — "}
          
            href="/fuel"
            className="font-medium text-[var(--scope-cyan)] hover:underline"
          >
            Open fuel matrix
          </a>
        </div>
      ) : null}

      <FlightTicker />

      <div
        className={cn(
          "mx-auto flex min-h-0 w-full flex-1",
          deckOpen &&
            "max-w-[1600px] lg:grid lg:grid-cols-[minmax(280px,35%)_minmax(0,1fr)]"
        )}
      >
        {deckOpen ? <DashboardSidebar /> : null}
        <section className="relative z-0 min-h-0 min-w-0 flex-1 bg-[#0e1116]">
          <button
            type="button"
            onClick={() => setDeckOpen((open) => !open)}
            className="absolute left-0 top-1/2 z-[1200] flex h-10 w-5 -translate-y-1/2 items-center justify-center border border-l-0 border-[var(--ink-border)] bg-[var(--ink)] text-slate-300 hover:text-[var(--scope-cyan)]"
            aria-expanded={deckOpen}
            aria-label={deckOpen ? "Hide deck and expand map" : "Show deck"}
          >
            {deckOpen ? (
              <ChevronLeft className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden />
            )}
          </button>
          <RouteMapLoader />
        </section>
      </div>
    </div>
  );
}