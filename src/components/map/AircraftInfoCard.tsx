"use client";

import Link from "next/link";
import { CloudSun } from "lucide-react";
import { altitudeRainbowColor } from "@/lib/adsb-colors";
import {
  SILHOUETTE_STYLE,
  isAircraftOnGround,
} from "@/lib/aircraft-silhouettes";
import { EmergencySquawkBanner } from "@/components/ui/EmergencySquawkBanner";
import { decodeSquawk, isEmergencySquawk } from "@/lib/squawk";
import type { LiveAircraft } from "@/lib/traffic";
import { usePlannerStore } from "@/store/planner-store";
import { cn } from "@/lib/utils";

function fmtAlt(ft: number | null): string {
  if (ft == null) return "—";
  if (ft === 0) return "GND";
  return `${Math.round(ft).toLocaleString()} ft`;
}

function fmtRate(fpm: number | null): string {
  if (fpm == null) return "—";
  const rounded = Math.round(fpm);
  if (rounded === 0) return "LEVEL";
  return `${rounded > 0 ? "+" : ""}${rounded} fpm`;
}

type FlightRouteEnds = {
  origin: { icao: string; name: string };
  destination: { icao: string; name: string };
};

type AircraftInfoCardProps = {
  ac: LiveAircraft;
  onClose?: () => void;
  compact?: boolean;
  /** Follow-toggle for ADSBX-style tracking. */
  following?: boolean;
  onToggleFollow?: () => void;
  route?: FlightRouteEnds | null;
};

/** Shared ADS-B detail block (popup + tracked aircraft panel). */
export function AircraftInfoCard({
  ac,
  onClose,
  compact = false,
  following,
  onToggleFollow,
  route,
}: AircraftInfoCardProps) {
  const cat = SILHOUETTE_STYLE[ac.category];
  const markerColor = altitudeRainbowColor(ac.alt_baro);
  const onGround = isAircraftOnGround(ac.alt_baro);
  const title = ac.flight;
  const reg =
    ac.registration && ac.registration !== ac.flight ? ac.registration : null;
  const homeIcao = usePlannerStore((s) => s.homeAirport.icao);
  const destinationIcao = usePlannerStore((s) => s.destinationIcao);
  const atisIcao =
    destinationIcao && destinationIcao.length >= 3
      ? destinationIcao
      : homeIcao;
  const squawkMeaning = ac.squawk ? decodeSquawk(ac.squawk) : null;
  const emergency = isEmergencySquawk(ac.squawk);

  return (
    <div
      className={cn(
        "text-slate-200",
        compact ? "space-y-1.5 text-sm" : "space-y-2 text-sm"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-base font-bold text-slate-50">{title}</p>
          {reg && (
            <p className="font-mono text-xs text-slate-400">Tail {reg}</p>
          )}
          <p className="text-[11px] font-medium" style={{ color: markerColor }}>
            {onGround ? "On ground" : cat.label}
            {ac.type ? ` — ${ac.type}` : ""}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-800 hover:text-slate-200"
          >
            Close
          </button>
        )}
      </div>

      {emergency && ac.squawk ? (
        <EmergencySquawkBanner
          compact
          code={ac.squawk}
          title={squawkMeaning?.title ?? "Emergency discrete"}
        />
      ) : null}

      <dl className="grid grid-cols-[7.5rem_1fr] gap-x-2 gap-y-1 text-xs">
        <dt className="text-[var(--ink-muted)]">Altitude (ft)</dt>
        <dd className="font-mono tabular-nums text-[var(--ink-text)]">
          {fmtAlt(ac.alt_baro)}
        </dd>
        <dt className="text-[var(--ink-muted)]">Groundspeed (kt)</dt>
        <dd className="font-mono tabular-nums text-[var(--ink-text)]">
          {ac.gs != null ? `${Math.round(ac.gs)} kt` : "—"}
        </dd>
        <dt className="text-[var(--ink-muted)]">Track (°)</dt>
        <dd className="font-mono tabular-nums text-[var(--ink-text)]">
          {ac.track != null
            ? `${String(Math.round(ac.track)).padStart(3, "0")}°`
            : "—"}
        </dd>
        <dt className="text-[var(--ink-muted)]">Vertical speed (fpm)</dt>
        <dd className="font-mono tabular-nums text-[var(--ink-text)]">
          {fmtRate(ac.baro_rate)}
        </dd>
        <dt className="text-[var(--ink-muted)]">Squawk</dt>
        <dd className="font-mono tabular-nums text-[var(--ink-text)]">
          {emergency ? (
            <span className="font-bold text-[#ffb4a8]">
              {ac.squawk} emergency
            </span>
          ) : (
            <>
              {ac.squawk ?? "—"}
              {squawkMeaning ? (
                <span className="ml-1.5 text-[10px] font-sans font-medium text-[var(--ink-muted)]">
                  {squawkMeaning.title}
                </span>
              ) : null}
            </>
          )}
        </dd>
        <dt className="text-slate-500">Origin</dt>
        <dd className="font-mono tabular-nums text-slate-100">
          {route?.origin.icao ?? "—"}
          {route?.origin.name ? (
            <span className="ml-1.5 font-sans text-[10px] font-medium text-slate-400">
              {route.origin.name}
            </span>
          ) : null}
        </dd>
        <dt className="text-slate-500">Destination</dt>
        <dd className="font-mono tabular-nums text-slate-100">
          {route?.destination.icao ?? "—"}
          {route?.destination.name ? (
            <span className="ml-1.5 font-sans text-[10px] font-medium text-slate-400">
              {route.destination.name}
            </span>
          ) : null}
        </dd>
        <dt className="text-slate-500">Type</dt>
        <dd className="font-mono tabular-nums text-slate-100">
          {ac.type ?? "—"}
        </dd>
        <dt className="text-slate-500">Mode-S</dt>
        <dd className="font-mono tabular-nums text-slate-100">
          {ac.hex.toUpperCase()}
        </dd>
        <dt className="text-slate-500">Position</dt>
        <dd className="font-mono tabular-nums text-slate-100">
          {ac.lat.toFixed(4)}, {ac.lon.toFixed(4)}
        </dd>
      </dl>

      <div className="flex flex-col gap-1.5 pt-1">
        {onToggleFollow ? (
          <button
            type="button"
            onClick={onToggleFollow}
            className={cn(
              "inline-flex items-center justify-center rounded-sm px-2.5 py-1.5 text-[11px] font-semibold",
              following
                ? "bg-[var(--scope-cyan)] text-[#0e1116] hover:bg-[var(--scope-cyan-dim)] hover:text-slate-100"
                : "border border-[var(--ink-border)] bg-[var(--ink)] text-slate-200 hover:border-[var(--bezel)]"
            )}
          >
            {following ? "Following — tap to stop" : "Follow aircraft"}
          </button>
        ) : null}
        <Link
          href={`/weather/${atisIcao}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-[var(--ink-border)] bg-[var(--ink)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--scope-cyan)] hover:border-[var(--bezel)]"
        >
          <CloudSun className="h-3.5 w-3.5" aria-hidden />
          View {atisIcao} ATIS / METAR
        </Link>
      </div>
    </div>
  );
}
