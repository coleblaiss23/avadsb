import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Airport } from "@/types";

type RawAirport = Airport;

let cache: Airport[] | null = null;
let indexByCode: Map<string, Airport> | null = null;

function dataPath(): string {
  return path.join(process.cwd(), "public/data/us-airports.json");
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

export const POPULAR_ROUTES = [
  {
    origin: "KAPA",
    destination: "KSDL",
    slug: "kapa-to-ksdl",
    label: "Denver (KAPA) → Scottsdale (KSDL)",
  },
  {
    origin: "KVNY",
    destination: "KLAS",
    slug: "kvny-to-klas",
    label: "Van Nuys (KVNY) → Las Vegas (KLAS)",
  },
  {
    origin: "KAPA",
    destination: "KASE",
    slug: "kapa-to-kase",
    label: "Denver (KAPA) → Aspen (KASE)",
  },
  {
    origin: "KSJC",
    destination: "KRNO",
    slug: "ksjc-to-krno",
    label: "San Jose (KSJC) → Reno (KRNO)",
  },
  {
    origin: "KDVT",
    destination: "KFLG",
    slug: "kdvt-to-kflg",
    label: "Deer Valley (KDVT) → Flagstaff (KFLG)",
  },
] as const;
