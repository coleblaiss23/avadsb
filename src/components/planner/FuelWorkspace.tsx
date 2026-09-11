"use client";

import { AppNav } from "@/components/layout/AppNav";
import { RouteMapLoader } from "@/components/map/RouteMapLoader";
import { ResultsList } from "@/components/planner/ResultsList";
import { RoutePlannerForm } from "@/components/planner/RoutePlannerForm";
import { FlightTicker } from "@/components/ui/FlightTicker";
import { useFlightDeckHotkeys } from "@/hooks/use-flight-deck-hotkeys";
import { usePlannerStore } from "@/store/planner-store";
import { useEffect } from "react";

/**
 * Full fuel-corridor workspace: planner form + results + live map.
 */
export function FuelWorkspace({ routeBanner }: { routeBanner?: string }) {
  useFlightDeckHotkeys();
  const setActivePanel = usePlannerStore((s) => s.setActivePanel);

  useEffect(() => {
    setActivePanel("fuel");
  }, [setActivePanel]);

  return (
    <div className="night-ui flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--ink)] text-[var(--ink-text)]">
      <AppNav
        rightSlot={
          <p className="hidden text-xs text-slate-500 lg:block">
            Corridor search — 100LL / Jet-A
          </p>
        }
      />
      {routeBanner ? (
        <div className="border-b border-[var(--ink-border)] bg-[var(--ink-elevated)] px-4 py-2 text-center text-sm text-slate-300">
          Popular route:{" "}
          <strong className="font-mono tabular-nums text-slate-100">
            {routeBanner}
          </strong>
        </div>
      ) : null}
      <FlightTicker />

      <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 lg:grid-cols-[minmax(300px,38%)_minmax(0,62%)]">
        <aside className="flex max-h-[48vh] flex-col gap-4 overflow-y-auto border-b border-[var(--ink-border)] bg-[var(--ink)] p-4 lg:max-h-none lg:border-b-0 lg:border-r lg:border-[var(--ink-border)]">
          <div>
            {routeBanner ? (
              <h2 className="font-display text-2xl font-semibold text-slate-100">
                Corridor Fuel Matrix
              </h2>
            ) : (
              <h1 className="font-display text-2xl font-semibold text-slate-100">
                Corridor Fuel Matrix
              </h1>
            )}
            <p className="mt-1 text-sm text-slate-400">
              Find the cheapest 100LL or Jet-A along your route without leaving
              the corridor.
            </p>
          </div>
          <div className="instrument-panel p-3 text-slate-100 [&_label]:text-slate-400 [&_input]:border-[var(--ink-border)] [&_input]:bg-[var(--ink)] [&_input]:text-slate-100">
            <RoutePlannerForm />
            <ResultsList />
          </div>
        </aside>
        <section className="relative z-0 min-h-[48vh] flex-1 bg-[var(--ink)] lg:min-h-0">
          <RouteMapLoader />
        </section>
      </div>

    </div>
  );
}
