import { NextResponse } from "next/server";
import { parseOverpassAirfield, type AirfieldPavement } from "@/lib/airfield";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const OVERPASS_HOSTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const CACHE_MS = 15 * 60 * 1000;
const MAX_LAT_SPAN = 0.28;
const MAX_LON_SPAN = 0.45;

const cache = new Map<string, { at: number; features: AirfieldPavement[] }>();

function parseBound(raw: string | null, min: number, max: number): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

function cacheKey(south: number, west: number, north: number, east: number): string {
  return [south, west, north, east].map((n) => n.toFixed(3)).join(":");
}

function queryFor(south: number, west: number, north: number, east: number): string {
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:20];
(
  way["aeroway"="runway"](${bbox});
  way["aeroway"="taxiway"](${bbox});
  way["aeroway"="taxilane"](${bbox});
);
out geom;`;
}

async function fetchOverpass(query: string): Promise<unknown> {
  let lastStatus = 502;
  for (const host of OVERPASS_HOSTS) {
    try {
      const res = await fetch(host, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "AvADSB/0.1 (airfield diagram; local flight-deck map)",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(18_000),
      });
      if (!res.ok) {
        lastStatus = res.status;
        continue;
      }
      return await res.json();
    } catch {
      lastStatus = 502;
    }
  }
  throw new Error(String(lastStatus));
}

/** GET /api/airfield?south=&west=&north=&east= — runway/taxiway geometry for a small viewport. */
export async function GET(request: Request) {
  const limited = rateLimit(
    `airfield:${clientIpFromHeaders(request.headers)}`,
    40,
    60_000
  );
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many airfield requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const south = parseBound(searchParams.get("south"), -90, 90);
  const north = parseBound(searchParams.get("north"), -90, 90);
  const west = parseBound(searchParams.get("west"), -180, 180);
  const east = parseBound(searchParams.get("east"), -180, 180);
  if (south == null || north == null || west == null || east == null || south >= north || west >= east) {
    return NextResponse.json({ error: "south, west, north, east required" }, { status: 400 });
  }
  if (north - south > MAX_LAT_SPAN || east - west > MAX_LON_SPAN) {
    return NextResponse.json(
      { error: "Zoom in closer before loading the airfield diagram" },
      { status: 400 }
    );
  }

  const key = cacheKey(south, west, north, east);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return NextResponse.json({ features: hit.features, cached: true });
  }

  try {
    const json = await fetchOverpass(queryFor(south, west, north, east));
    const features = parseOverpassAirfield(json);
    cache.set(key, { at: Date.now(), features });
    if (cache.size > 80) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
    return NextResponse.json({ features, cached: false });
  } catch {
    if (hit) return NextResponse.json({ features: hit.features, cached: true });
    return NextResponse.json({ error: "Airfield diagram unavailable" }, { status: 502 });
  }
}
