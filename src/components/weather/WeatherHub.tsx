"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AirportAutocomplete } from "@/components/planner/AirportAutocomplete";
import { MetarBadge } from "@/components/weather/MetarBadge";
import { MetarTokenStrip } from "@/components/weather/MetarTokenStrip";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { normalizeIcao } from "@/lib/utils";
import type { ParsedMetar } from "@/types";
import { useDetectHomeAirport } from "@/hooks/use-home-airport";
import { usePlannerStore } from "@/store/planner-store";

async function loadMetar(icao: string): Promise<ParsedMetar | null> {
  const res = await fetch(`/api/metar?icao=${encodeURIComponent(icao)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.metar ?? null;
}

export function WeatherHub() {
  useDetectHomeAirport();
  const home = usePlannerStore((s) => s.homeAirport);
  const [icao, setIcao] = useState(home.icao || "KPHX");
  const [touched, setTouched] = useState(false);
  const active = normalizeIcao(icao);

  useEffect(() => {
    if (!touched && home.icao) setIcao(home.icao);
  }, [home.icao, touched]);

  const metarQuery = useQuery({
    queryKey: ["metar", active],
    queryFn: () => loadMetar(active),
    enabled: active.length >= 3,
    staleTime: 5 * 60_000,
  });

  return (
    <div className="space-y-6">
      <div className="instrument-panel p-5 sm:p-6">
        <div className="max-w-sm [&_label]:text-slate-400 [&_input]:border-[var(--ink-border)] [&_input]:bg-[var(--ink-elevated)] [&_input]:text-slate-100">
          <AirportAutocomplete
            id="weather-hub-icao"
            label="Airport"
            value={icao}
            onChange={(next) => {
              setTouched(true);
              setIcao(next);
            }}
            placeholder="Search ICAO / FAA"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/weather/${active}`}>Full briefing</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-[var(--ink-border)] bg-transparent text-slate-200 hover:bg-[var(--ink-elevated)]"
          >
            <Link href={`/crosswind?icao=${active}`}>Crosswind</Link>
          </Button>
        </div>
      </div>

      <div className="instrument-panel overflow-hidden p-1">
        <MetarBadge airportIcao={active} variant="card" showLink={false} />
      </div>

      {metarQuery.data?.raw ? (
        <div className="instrument-panel space-y-3 p-5">
          <p className="text-sm font-medium text-slate-400">Token decode</p>
          <div className="instrument-inset rounded-sm bg-[var(--ink)] p-3">
            <MetarTokenStrip raw={metarQuery.data.raw} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
