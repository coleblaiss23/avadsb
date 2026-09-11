"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  BookOpen,
  CloudSun,
  Fuel,
  Radio,
  Timer,
  Wind,
} from "lucide-react";
import { AirportNotamFlag } from "@/components/notams/AirportNotamFlag";
import { AirportAutocomplete } from "@/components/planner/AirportAutocomplete";
import { TOOL_NAV } from "@/lib/tools-nav";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/planner-store";
import { useGoToAirport } from "@/hooks/use-home-airport";

const ICONS: Record<string, ReactNode> = {
  fuel: <Fuel className="h-4 w-4" />,
  atis: <CloudSun className="h-4 w-4" />,
  crosswind: <Wind className="h-4 w-4" />,
  quiz: <BookOpen className="h-4 w-4" />,
  squawk: <Radio className="h-4 w-4" />,
  hobbs: <Timer className="h-4 w-4" />,
};

export function DashboardSidebar() {
  const home = usePlannerStore((s) => s.homeAirport);
  const pinned = home.source === "manual";
  const originIcao = usePlannerStore((s) => s.originIcao);
  const destinationIcao = usePlannerStore((s) => s.destinationIcao);
  const setOrigin = usePlannerStore((s) => s.setOrigin);
  const setDestination = usePlannerStore((s) => s.setDestination);
  const goToAirport = useGoToAirport();

  return (
    <aside className="flex max-h-[48vh] flex-col gap-5 overflow-y-auto border-b border-[var(--ink-border)] bg-[var(--ink)] p-4 text-slate-100 lg:max-h-none lg:border-b-0 lg:border-r lg:border-[var(--ink-border)]">
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-400">Context</p>
        {pinned ? (
          <p className="text-base font-semibold text-[var(--ink-text)]">
            <span className="font-mono tabular-nums">{home.icao}</span>{" "}
            <span className="font-normal text-[var(--ink-muted)]">{home.name}</span>
          </p>
        ) : (
          <p className="text-base font-semibold text-[var(--ink-text)]">Map</p>
        )}
        <p className="text-[11px] text-[var(--ink-muted)]">
          {pinned
            ? "Pinned from search — clear the field to unpin"
            : "Opens on the Phoenix area. Pan, zoom, or search — the view is restored next visit."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 [&_label]:text-slate-400 [&_input]:border-[var(--ink-border)] [&_input]:bg-[var(--ink-elevated)] [&_input]:text-slate-100">
        <AirportAutocomplete
          id="dash-origin"
          label="Airport / route origin"
          value={originIcao}
          onChange={(icao) => {
            setOrigin(icao);
            if (icao.length >= 3) void goToAirport(icao);
          }}
          placeholder="Search ICAO / FAA"
        />
        <AirportAutocomplete
          id="dash-dest"
          label="Destination"
          value={destinationIcao}
          onChange={setDestination}
          placeholder="Search ICAO / FAA"
        />
      </div>

      {(originIcao.length >= 3 || destinationIcao.length >= 3) && (
        <div className="flex flex-col items-start gap-1.5">
          {originIcao.length >= 3 && (
            <AirportNotamFlag icao={originIcao} role="Origin" />
          )}
          {destinationIcao.length >= 3 &&
            destinationIcao.toUpperCase() !== originIcao.toUpperCase() && (
              <AirportNotamFlag icao={destinationIcao} role="Dest" />
            )}
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-slate-400">Tools</p>
        <div className="flex flex-col gap-1.5">
          {TOOL_NAV.map((card) => (
            <Link
              key={card.id}
              href={
                card.id === "fuel" && originIcao && destinationIcao
                  ? `/fuel`
                  : card.href
              }
              className={cn("flight-strip group text-left text-slate-200")}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--ink-border)] bg-[var(--ink)] text-slate-400 group-hover:border-[var(--scope-cyan-dim)] group-hover:text-[var(--scope-cyan)]">
                {ICONS[card.id]}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-snug text-slate-100">
                  {card.title}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                  {card.subtitle}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Live ADS-B radar is the home deck. Open a tool above for fuel, weather,
        crosswind, quiz, squawk, or Hobbs.
      </p>
    </aside>
  );
}
