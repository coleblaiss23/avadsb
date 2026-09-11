"use client";

import Link from "next/link";
import { CrosswindAnalyzer } from "@/components/weather/CrosswindAnalyzer";
import { MetarBadge } from "@/components/weather/MetarBadge";
import { usePlannerStore } from "@/store/planner-store";

export function WeatherCrosswindPanel() {
  const originIcao = usePlannerStore((s) => s.originIcao);
  const destinationIcao = usePlannerStore((s) => s.destinationIcao);

  return (
    <section className="instrument-panel space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink-text)]">
            Live weather & crosswind
          </h2>
          <p className="text-xs text-slate-500">
            METAR flight category from AviationWeather.gov
          </p>
        </div>
        <CrosswindAnalyzer defaultIcao={originIcao || "KAPA"} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {originIcao ? (
          <MetarBadge airportIcao={originIcao} variant="card" />
        ) : null}
        {destinationIcao && destinationIcao !== originIcao ? (
          <MetarBadge airportIcao={destinationIcao} variant="card" />
        ) : null}
      </div>

      {(originIcao || destinationIcao) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {originIcao ? (
            <Link
              href={`/weather/${originIcao}`}
              className="text-xs font-medium text-accent hover:underline"
            >
              {destinationIcao && destinationIcao !== originIcao
                ? `${originIcao} weather briefing →`
                : "View Full Weather Briefing →"}
            </Link>
          ) : null}
          {destinationIcao && destinationIcao !== originIcao ? (
            <Link
              href={`/weather/${destinationIcao}`}
              className="text-xs font-medium text-accent hover:underline"
            >
              {destinationIcao} weather briefing →
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
