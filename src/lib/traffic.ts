/**
 * Live ADS-B traffic helpers (airplanes.live / adsb.lol JSON aircraft lists).
 */

import {
  classifySilhouette,
  SILHOUETTE_STYLE,
  type AircraftSilhouette,
} from "@/lib/aircraft-silhouettes";

export type { AircraftSilhouette };
/** @deprecated Prefer AircraftSilhouette */
export type TrafficCategory = AircraftSilhouette;

export interface LiveAircraft {
  hex: string;
  /** Callsign or registration */
  flight: string;
  flight_number: string;
  lat: number;
  lon: number;
  alt_baro: number | null;
  gs: number | null;
  track: number | null;
  /** Vertical rate ft/min (positive = climbing) */
  baro_rate: number | null;
  /** ICAO type designator (C172, B738, …) */
  type: string | null;
  /** Birds-eye silhouette category */
  category: AircraftSilhouette;
  /** Raw ADS-B emitter category (A1, A3, …) when present */
  emitterCategory: string | null;
  registration: string | null;
  /** Mode-A squawk (e.g. 1200, 7700) */
  squawk: string | null;
}

/** Upstream aircraft row (subset of airplanes.live / adsb.lol payloads). */
export interface AirplanesLiveAc {
  hex?: string;
  flight?: string;
  r?: string;
  t?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number | string;
  alt_geom?: number;
  gs?: number;
  track?: number;
  true_heading?: number;
  mag_heading?: number;
  baro_rate?: number;
  geom_rate?: number;
  category?: string;
  dbFlags?: number;
  squawk?: string;
}

export const TRAFFIC_CATEGORY_STYLE = SILHOUETTE_STYLE;

function cleanCallsign(raw: string | undefined | null): string {
  return (raw ?? "").trim().toUpperCase();
}

function parseAltitude(alt: number | string | undefined): number | null {
  if (alt == null) return null;
  if (typeof alt === "string") {
    if (alt.toLowerCase() === "ground") return 0;
    const n = Number(alt);
    return Number.isFinite(n) ? n : null;
  }
  return Number.isFinite(alt) ? alt : null;
}

export function classifyTraffic(ac: AirplanesLiveAc): AircraftSilhouette {
  return classifySilhouette(ac.t, ac.category, ac.dbFlags, ac.gs);
}

export function normalizeAircraft(ac: AirplanesLiveAc): LiveAircraft | null {
  if (ac.lat == null || ac.lon == null || !ac.hex) return null;
  if (!Number.isFinite(ac.lat) || !Number.isFinite(ac.lon)) return null;

  const flight =
    cleanCallsign(ac.flight) || cleanCallsign(ac.r) || ac.hex.toUpperCase();
  const registration = cleanCallsign(ac.r) || null;
  const track = ac.track ?? ac.true_heading ?? ac.mag_heading ?? null;
  const baroRate =
    ac.baro_rate != null && Number.isFinite(ac.baro_rate)
      ? ac.baro_rate
      : ac.geom_rate != null && Number.isFinite(ac.geom_rate)
        ? ac.geom_rate
        : null;

  return {
    hex: ac.hex.toLowerCase(),
    flight,
    flight_number: flight,
    lat: ac.lat,
    lon: ac.lon,
    alt_baro: parseAltitude(ac.alt_baro),
    gs: ac.gs != null && Number.isFinite(ac.gs) ? ac.gs : null,
    track: track != null && Number.isFinite(track) ? track : null,
    baro_rate: baroRate,
    type: ac.t?.trim() ? ac.t.trim().toUpperCase() : null,
    category: classifyTraffic(ac),
    emitterCategory: ac.category?.trim() || null,
    registration,
    squawk: ac.squawk?.trim() ? ac.squawk.trim() : null,
  };
}

export function parseAirplanesLiveResponse(payload: unknown): LiveAircraft[] {
  if (!payload || typeof payload !== "object") return [];
  const ac = (payload as { ac?: unknown }).ac;
  if (!Array.isArray(ac)) return [];

  const out: LiveAircraft[] = [];
  for (const row of ac) {
    if (!row || typeof row !== "object") continue;
    const normalized = normalizeAircraft(row as AirplanesLiveAc);
    if (normalized) out.push(normalized);
  }
  return out;
}
