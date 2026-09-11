"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  bearingDiffDeg,
  haversineNm,
  initialBearingDeg,
} from "@/lib/geo";
import type { LiveAircraft } from "@/lib/traffic";
import { usePlannerStore } from "@/store/planner-store";

type TrafficResponse = {
  aircraft: LiveAircraft[];
  error?: string;
};

type TickerEvent = {
  id: string;
  kind: "inbound" | "outbound";
  text: string;
  priority: number;
};

const TICKER_MAX = 8;
const PX_PER_SEC = 48;

async function fetchNearby(
  lat: number,
  lon: number,
  radiusNm: number
): Promise<LiveAircraft[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    radius: String(radiusNm),
  });
  const res = await fetch(`/api/traffic/live?${params}`);
  const data = (await res.json()) as TrafficResponse;
  return data.aircraft ?? [];
}

function buildEvents(
  aircraft: LiveAircraft[],
  icao: string,
  aptLat: number,
  aptLon: number
): TickerEvent[] {
  const events: TickerEvent[] = [];
  const apt = { lat: aptLat, lng: aptLon };

  for (const ac of aircraft) {
    const dist = haversineNm({ lat: ac.lat, lng: ac.lon }, apt);
    if (dist > 15.5) continue;

    const gs = ac.gs ?? 0;
    const etaMin = gs >= 40 ? (dist / gs) * 60 : Infinity;
    const bearingToApt = initialBearingDeg(
      { lat: ac.lat, lng: ac.lon },
      apt
    );
    const toApt =
      ac.track != null ? bearingDiffDeg(ac.track, bearingToApt) : 180;
    const closing = toApt < 55;
    const climbing = (ac.baro_rate ?? 0) > 200;
    const descending = (ac.baro_rate ?? 0) < -200;
    const callsign = ac.flight || ac.hex.toUpperCase();

    if (
      closing &&
      etaMin < 10 &&
      (descending || ac.alt_baro == null || ac.alt_baro < 12000)
    ) {
      events.push({
        id: `in-${ac.hex}`,
        kind: "inbound",
        priority: etaMin,
        text: `${callsign} landing ${icao} in ${Math.max(1, Math.round(etaMin))} min (${Math.round(gs)} kt)`,
      });
      continue;
    }

    if (climbing && !closing && dist < 15) {
      const alt =
        ac.alt_baro != null
          ? `${Math.round(ac.alt_baro).toLocaleString()} ft`
          : "—";
      events.push({
        id: `out-${ac.hex}`,
        kind: "outbound",
        priority: dist,
        text: `${callsign} departed ${icao} climbing ${alt}`,
      });
    }
  }

  events.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "inbound" ? -1 : 1;
    return a.priority - b.priority;
  });
  return events.slice(0, TICKER_MAX);
}

/**
 * Live flight tape. Scroll speed is pixels/sec so longer tapes don't race.
 */
export function FlightTicker() {
  const home = usePlannerStore((s) => s.homeAirport);
  const mapView = usePlannerStore((s) => s.mapView);
  const scan =
    home.source === "manual"
      ? { lat: home.latitude, lng: home.longitude, label: home.icao }
      : { lat: mapView.lat, lng: mapView.lng, label: "LIVE" };
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLSpanElement>(null);
  const [duration, setDuration] = useState<{ tape: string; seconds: number } | null>(
    null
  );

  const { data: aircraft = [] } = useQuery({
    queryKey: ["ticker-traffic", scan.label, scan.lat, scan.lng],
    queryFn: () => fetchNearby(scan.lat, scan.lng, 15),
    enabled: true,
    refetchInterval: 12_000,
    staleTime: 8_000,
  });

  const events = useMemo(() => {
    const place = home.source === "manual" ? home.icao : "the area";
    return buildEvents(aircraft, place, scan.lat, scan.lng);
  }, [aircraft, home.source, home.icao, scan.lat, scan.lng]);

  const tape =
    events.length > 0
      ? events.map((e) => e.text).join("   —   ")
      : home.source === "manual"
        ? `${home.name} — scanning 15 NM for arrivals and departures`
        : "Scanning 15 NM for arrivals and departures";

  useLayoutEffect(() => {
    const track = trackRef.current;
    const copy = copyRef.current;
    if (!track || !copy) return;

    const apply = () => {
      const width = copy.getBoundingClientRect().width;
      if (width < 8) return;
      setDuration({ tape, seconds: Math.max(8, width / PX_PER_SEC) });
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [tape]);

  const estimated = Math.max(8, (tape.length * 7.4) / PX_PER_SEC);
  const seconds =
    duration?.tape === tape ? duration.seconds : estimated;

  return (
    <div
      className="afm-ticker flex items-center border-b border-[var(--ink-border)] bg-[var(--ink-elevated)] text-xs text-[var(--ink-muted)]"
      role="status"
      aria-live="polite"
      aria-label="Live flight ticker"
    >
      <span className="shrink-0 px-3 font-mono text-xs tabular-nums text-[var(--scope-cyan)]">
        {scan.label}
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div
          ref={trackRef}
          className="afm-ticker-track"
          style={{ ["--ticker-duration" as string]: `${seconds}s` }}
        >
          <span ref={copyRef} className="afm-ticker-copy pr-16" data-ticker-copy>
            {tape}
          </span>
          <span className="afm-ticker-copy pr-16" aria-hidden>
            {tape}
          </span>
        </div>
      </div>
    </div>
  );
}
