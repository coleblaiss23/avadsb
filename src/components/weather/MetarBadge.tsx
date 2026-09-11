"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ChevronDown, CloudSun } from "lucide-react";
import { MetarTokenStrip } from "@/components/weather/MetarTokenStrip";
import { FLIGHT_CATEGORY_STYLE } from "@/lib/metar";
import { cn, normalizeIcao } from "@/lib/utils";
import type { ParsedMetar } from "@/types";

type MetarBadgeProps = {
  airportIcao: string;
  /** Compact pill only vs full metrics card */
  variant?: "badge" | "card";
  className?: string;
  showLink?: boolean;
};

async function fetchMetarClient(icao: string): Promise<{
  metar: ParsedMetar;
  source: string;
}> {
  const res = await fetch(`/api/metar?icao=${encodeURIComponent(icao)}`);
  if (!res.ok) throw new Error("METAR unavailable");
  return res.json();
}

function WindArrow({ deg }: { deg: number }) {
  return (
    <ArrowUp
      className="h-3.5 w-3.5 shrink-0 text-slate-600"
      style={{ transform: `rotate(${deg}deg)` }}
      aria-hidden
    />
  );
}

function formatWind(metar: ParsedMetar): string {
  if (metar.windDirDeg == null) {
    return metar.wind || "Calm";
  }
  const dir = String(metar.windDirDeg).padStart(3, "0");
  const gust =
    metar.windGustKt != null ? `G${metar.windGustKt}` : "";
  return `${dir}° / ${metar.windSpeedKt}${gust ? ` ${gust}` : ""} kt`;
}

function formatTempDew(metar: ParsedMetar): string {
  if (metar.tempC == null || metar.dewpointC == null) return "—";
  return `${metar.tempC.toFixed(0)}°C / ${metar.dewpointC.toFixed(0)}°C`;
}

export function MetarBadge({
  airportIcao,
  variant = "badge",
  className,
  showLink = true,
}: MetarBadgeProps) {
  const icao = normalizeIcao(airportIcao);
  const [rawOpen, setRawOpen] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["metar", icao],
    queryFn: () => fetchMetarClient(icao),
    enabled: icao.length >= 3,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  const metar = data?.metar;
  const style = metar ? FLIGHT_CATEGORY_STYLE[metar.category] : null;

  if (isLoading) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm border border-[var(--ink-border)] bg-[var(--ink-elevated)] px-2 py-1 text-xs text-[var(--ink-muted)]",
          className
        )}
      >
        <CloudSun className="h-3.5 w-3.5" />
        {icao}…
      </span>
    );
  }

  if (isError || !metar || !style) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-dashed border-panel-border px-2 py-1 text-xs text-slate-400",
          className
        )}
      >
        {icao} N/A
      </span>
    );
  }

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs font-semibold tracking-wide",
        style.bg,
        style.text,
        style.border,
        className
      )}
      style={{ boxShadow: `inset 3px 0 0 ${style.hex}` }}
      title={metar.raw}
    >
      {metar.category}
    </span>
  );

  if (variant === "badge") {
    return showLink ? (
      <Link href={`/weather/${icao}`} className="inline-flex hover:opacity-90">
        {badge}
      </Link>
    ) : (
      badge
    );
  }

  return (
    <div
      className={cn(
        "rounded-sm border border-[var(--ink-border)] bg-[var(--ink-elevated)] p-3",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {showLink ? (
            <Link
              href={`/weather/${icao}`}
              className="font-mono text-sm font-semibold text-[var(--ink-text)] hover:text-[var(--scope-cyan)]"
            >
              {icao}
            </Link>
          ) : (
            <span className="font-mono text-sm font-semibold text-[var(--ink-text)]">
              {icao}
            </span>
          )}
          {badge}
          {data?.source === "demo" && (
            <span className="text-[10px] uppercase tracking-wide text-slate-400">
              Demo
            </span>
          )}
        </div>
        <p className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
          {new Date(metar.observedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-3">
          <dt className="text-xs text-[var(--ink-muted)]">Wind (kt)</dt>
          <dd className="flex items-center gap-1.5 font-mono text-sm font-medium tabular-nums text-[var(--ink-text)]">
            {metar.windDirDeg != null ? (
              <WindArrow deg={metar.windDirDeg} />
            ) : null}
            {formatWind(metar)}
          </dd>
        </div>
        <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-3">
          <dt className="text-xs text-[var(--ink-muted)]">Temp / dewpoint (°C)</dt>
          <dd className="font-mono text-sm font-medium tabular-nums text-[var(--ink-text)]">
            {formatTempDew(metar)}
          </dd>
        </div>
        <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-3">
          <dt className="text-xs text-[var(--ink-muted)]">Altimeter (inHg)</dt>
          <dd className="font-mono text-sm font-medium tabular-nums text-[var(--ink-text)]">
            {metar.altimeterInHg != null
              ? `${metar.altimeterInHg.toFixed(2)} inHg`
              : "—"}
          </dd>
        </div>
        <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-3">
          <dt className="text-xs text-[var(--ink-muted)]">Density altitude (ft)</dt>
          <dd className="font-mono text-sm font-medium tabular-nums text-[var(--ink-text)]">
            {metar.densityAltitudeFt != null
              ? `${metar.densityAltitudeFt.toLocaleString()} ft`
              : "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-3 border-t border-panel-border pt-2">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-left text-[11px] font-medium text-[var(--ink-muted)] transition hover:text-[var(--ink-text)]"
          aria-expanded={rawOpen}
          onClick={() => setRawOpen((o) => !o)}
        >
          Raw METAR
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform",
              rawOpen && "rotate-180"
            )}
          />
        </button>
        {rawOpen ? (
          <div className="mt-2 max-h-48 overflow-auto rounded-sm bg-[var(--ink)] px-2.5 py-2">
            <MetarTokenStrip raw={metar.raw} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
