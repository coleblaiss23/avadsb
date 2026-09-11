import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  featuredAirportIcaos,
  POPULAR_ROUTES,
} from "@/lib/airports-db-client";
import type { Airport } from "@/types";

type RawAirport = Airport;

let cache: Airport[] | null = null;
let indexByCode: Map<string, Airport> | null = null;
let catalogMtimeMs: number | null = null;

function dataPath(): string {
  return path.join(process.cwd(), "public/data/us-airports.json");
}

/**
 * True when an airport page has enough unique catalog substance to index
 * (runway-capable field with identity + location). Heliports / bare pads stay
 * reachable but should be noindex to avoid thin programmatic sprawl.
 */
export function isAirportPageIndexable(airport: Airport): boolean {
  if (airport.type === "heliport" || airport.type === "seaplane") return false;
  const ident = (airport.runwayIdent || "").trim().toUpperCase();
  if (!ident || ident === "N/A") return false;
  if (!Number.isFinite(airport.runwayLength) || airport.runwayLength < 1000) {
    return false;
  }
  if (!airport.name?.trim() || !airport.city?.trim() || !airport.state?.trim()) {
    return false;
  }
  if (
    !Number.isFinite(airport.latitude) ||
    !Number.isFinite(airport.longitude)
  ) {
    return false;
  }
  const icao = airport.icao?.trim();
  return Boolean(icao && icao.length >= 3);
}

/** mtime of the local airport catalog — used as sitemap lastModified. */
export async function catalogLastModified(): Promise<Date> {
  if (catalogMtimeMs != null) return new Date(catalogMtimeMs);
  try {
    const info = await stat(dataPath());
    catalogMtimeMs = info.mtimeMs;
    return info.mtime;
  } catch {
    return new Date();
  }
}

/** ICAOs safe to publish in sitemaps / index. Featured codes always included. */
export async function listIndexableIcaos(): Promise<string[]> {
  const featured = new Set(featuredAirportIcaos());
  const icaos = new Set(featured);
  try {
    const airports = await loadAirports();
    for (const airport of airports) {
      const icao = airport.icao?.trim();
      if (!icao) continue;
      if (featured.has(icao) || isAirportPageIndexable(airport)) {
        icaos.add(icao);
      }
    }
  } catch {
    // Featured list still publishes.
  }
  return [...icaos];
}

/** Popular corridor landings that include this airport as origin or destination. */
export function popularRoutesForIcao(icao: string) {
  const code = icao.trim().toUpperCase();
  return POPULAR_ROUTES.filter(
    (route) => route.origin === code || route.destination === code
  );
}

export async function loadAirports(): Promise<Airport[]> {
  if (cache) return cache;
  const raw = await readFile(dataPath(), "utf8");
  const parsed = JSON.parse(raw) as RawAirport[];
  cache = parsed;
  indexByCode = new Map();
  for (const a of parsed) {
    for (const key of [a.icao, a.faa, a.ident]) {
      if (!key) continue;
      const k = key.toUpperCase();
      // Prefer longer ICAO-style when colliding (KSDL over SDL for map of SDL→same)
      const existing = indexByCode.get(k);
      if (!existing || a.icao.length >= existing.icao.length) {
        indexByCode.set(k, a);
      }
    }
  }
  return cache;
}

export async function resolveAirport(code: string): Promise<Airport | undefined> {
  await loadAirports();
  const k = code.trim().toUpperCase();
  if (!k) return undefined;
  const hit = indexByCode!.get(k);
  if (hit) return hit;
  // Try K-prefix for 3-letter FAA
  if (k.length === 3) {
    return indexByCode!.get(`K${k}`);
  }
  // Strip K for reverse
  if (k.length === 4 && k.startsWith("K")) {
    return indexByCode!.get(k.slice(1));
  }
  return undefined;
}

/** Runway-capable GA fields for fuel corridor search. */
export function isFuelStopEligible(a: Airport): boolean {
  if (a.type === "heliport" || a.type === "seaplane") return false;
  // Prefer fields that can reasonably support a fuel stop / FBO
  return a.runwayLength >= 3000;
}

export async function searchAirports(
  query: string,
  limit = 8
): Promise<Airport[]> {
  const q = query.trim().toUpperCase();
  if (q.length < 1) return [];
  const all = await loadAirports();

  const scored: { a: Airport; score: number }[] = [];
  for (const a of all) {
    const icao = a.icao.toUpperCase();
    const faa = a.faa.toUpperCase();
    const ident = a.ident.toUpperCase();
    let score = 0;
    if (icao === q || faa === q || ident === q) score = 100;
    else if (icao.startsWith(q) || faa.startsWith(q) || ident.startsWith(q))
      score = 80;
    else if (`K${q}` === icao || icao === `K${q}`) score = 90;
    else if (
      a.name.toUpperCase().includes(q) ||
      a.city.toUpperCase().includes(q)
    )
      score = 40;
    else continue;

    // Prefer runway airports in ranking
    if (isFuelStopEligible(a)) score += 5;
    scored.push({ a, score });
  }

  scored.sort((x, y) => y.score - x.score || x.a.name.localeCompare(y.a.name));
  // Deduplicate by icao
  const seen = new Set<string>();
  const out: Airport[] = [];
  for (const { a } of scored) {
    if (seen.has(a.icao)) continue;
    seen.add(a.icao);
    out.push(a);
    if (out.length >= limit) break;
  }
  return out;
}

export async function getFuelEligibleAirports(): Promise<Airport[]> {
  const all = await loadAirports();
  return all.filter(isFuelStopEligible);
}

export type AirportMapLabel = {
  icao: string;
  latitude: number;
  longitude: number;
  type: string;
  runwayLength: number;
};

/**
 * Airports inside a map viewport for ICAO label overlays.
 * Ranks larger / longer-runway fields first so the client can cap labels.
 */
export async function findAirportsInBBox(opts: {
  south: number;
  west: number;
  north: number;
  east: number;
  /** Include heliports / seaplanes (default false). */
  includePads?: boolean;
  /** Soft floor on runway length in feet (default 0). */
  minRunwayFt?: number;
  limit?: number;
}): Promise<AirportMapLabel[]> {
  const {
    south,
    west,
    north,
    east,
    includePads = false,
    minRunwayFt = 0,
    limit = 120,
  } = opts;
  if (
    !Number.isFinite(south) ||
    !Number.isFinite(west) ||
    !Number.isFinite(north) ||
    !Number.isFinite(east) ||
    south >= north
  ) {
    return [];
  }

  const all = await loadAirports();
  const crossedAntimeridian = west > east;
  const hits: { a: Airport; rank: number }[] = [];

  for (const a of all) {
    if (!includePads && (a.type === "heliport" || a.type === "seaplane")) {
      continue;
    }
    if (!Number.isFinite(a.latitude) || !Number.isFinite(a.longitude)) continue;
    if (a.latitude < south || a.latitude > north) continue;
    if (crossedAntimeridian) {
      if (a.longitude < west && a.longitude > east) continue;
    } else if (a.longitude < west || a.longitude > east) {
      continue;
    }
    if (a.runwayLength < minRunwayFt) continue;

    const size =
      a.type === "large" ? 3 : a.type === "medium" ? 2 : a.type === "small" ? 1 : 0;
    const rank = size * 10_000 + Math.min(a.runwayLength, 14_000);
    hits.push({ a, rank });
  }

  hits.sort((x, y) => y.rank - x.rank || x.a.icao.localeCompare(y.a.icao));

  const seen = new Set<string>();
  const out: AirportMapLabel[] = [];
  for (const { a } of hits) {
    if (seen.has(a.icao)) continue;
    seen.add(a.icao);
    out.push({
      icao: a.icao,
      latitude: a.latitude,
      longitude: a.longitude,
      type: a.type,
      runwayLength: a.runwayLength,
    });
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Nearest runway-capable airport to a lat/lon (excludes heliports / seaplanes).
 * Prefers large/medium civilian fields over tiny strips and military bases.
 */
export async function findNearestAirport(
  lat: number,
  lon: number,
  opts?: { maxNm?: number }
): Promise<{ airport: Airport; distanceNm: number } | null> {
  const all = await loadAirports();
  const maxNm = opts?.maxNm ?? 150;
  let best: { airport: Airport; distanceNm: number; score: number } | null =
    null;

  for (const a of all) {
    if (a.type === "heliport" || a.type === "seaplane") continue;
    if (!Number.isFinite(a.latitude) || !Number.isFinite(a.longitude)) continue;

    const dLat = ((a.latitude - lat) * Math.PI) / 180;
    const dLon = ((a.longitude - lon) * Math.PI) / 180;
    const φ1 = (lat * Math.PI) / 180;
    const φ2 = (a.latitude * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(dLon / 2) ** 2;
    const distanceNm = 2 * 3440.065 * Math.asin(Math.min(1, Math.sqrt(h)));
    if (distanceNm > maxNm) continue;

    const nameU = a.name.toUpperCase();
    const military =
      /\b(AFB|AIR FORCE|SPACE FORCE|ARMY AIR|NAVAL AIR|MCAS|NAS )\b/.test(
        nameU
      );
    const sizeBoost =
      a.type === "large" ? -4 : a.type === "medium" ? -2 : 0;
    const milPenalty = military ? 8 : 0;
    const rwyBoost = -Math.min(a.runwayLength, 12000) / 80000;

    // Lower score wins. Distance dominates; size/military are soft biases.
    const score = distanceNm + sizeBoost + milPenalty + rwyBoost;

    if (!best || score < best.score) {
      best = { airport: a, distanceNm, score };
    }
  }

  if (!best) return null;
  return { airport: best.airport, distanceNm: best.distanceNm };
}
