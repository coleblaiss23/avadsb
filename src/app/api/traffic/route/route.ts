import { NextResponse } from "next/server";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type RouteAirport = {
  icao: string;
  iata: string | null;
  name: string;
  lat: number;
  lon: number;
};

export type FlightRoute = {
  callsign: string;
  origin: RouteAirport;
  destination: RouteAirport;
};

type UpstreamAirport = {
  icao?: string;
  iata?: string;
  name?: string;
  location?: string;
  lat?: number;
  lon?: number;
};

type UpstreamRoute = {
  callsign?: string;
  airport_codes?: string;
  _airports?: UpstreamAirport[];
};

const cache = new Map<string, { at: number; route: FlightRoute | null }>();
const CACHE_MS = 10 * 60_000;

function toAirport(row: UpstreamAirport | undefined): RouteAirport | null {
  if (!row) return null;
  const icao = row.icao?.trim().toUpperCase();
  if (!icao || row.lat == null || row.lon == null) return null;
  if (!Number.isFinite(row.lat) || !Number.isFinite(row.lon)) return null;
  return {
    icao,
    iata: row.iata?.trim().toUpperCase() || null,
    name: row.name?.trim() || row.location?.trim() || icao,
    lat: row.lat,
    lon: row.lon,
  };
}

function parseRoute(payload: unknown, callsign: string): FlightRoute | null {
  if (!Array.isArray(payload) || payload.length === 0) return null;
  const row = payload[0] as UpstreamRoute;
  const airports = row._airports ?? [];
  const origin = toAirport(airports[0]);
  const destination = toAirport(airports[1]);
  if (!origin || !destination) return null;
  if (origin.icao === destination.icao) return null;
  return {
    callsign: row.callsign?.trim().toUpperCase() || callsign,
    origin,
    destination,
  };
}

/** GET /api/traffic/route?callsign=UAL123&lat=&lon= */
export async function GET(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = rateLimit(`traffic-route:${ip}`, 40, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", route: null },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const callsign = (searchParams.get("callsign") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (callsign.length < 3 || callsign.length > 8 || !/^[A-Z0-9]+$/.test(callsign)) {
    return NextResponse.json(
      { error: "Callsign required", route: null },
      { status: 400 }
    );
  }

  const lat = Number(searchParams.get("lat") ?? "0");
  const lon = Number(searchParams.get("lon") ?? "0");
  const cached = cache.get(callsign);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return NextResponse.json({ route: cached.route, source: "cache" });
  }

  try {
    const res = await fetch("https://api.adsb.lol/api/0/routeset", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "AvADSB/0.1 (flight route lookup)",
      },
      body: JSON.stringify({
        planes: [
          {
            callsign,
            lat: Number.isFinite(lat) ? lat : 0,
            lng: Number.isFinite(lon) ? lon : 0,
          },
        ],
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({
        error: "Route lookup unavailable",
        route: null,
        source: "demo",
      });
    }

    const route = parseRoute(await res.json(), callsign);
    cache.set(callsign, { at: Date.now(), route });
    return NextResponse.json(
      { route, source: "adsb.lol" },
      { headers: { "Cache-Control": "public, s-maxage=300" } }
    );
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Route lookup failed",
      route: null,
      source: "demo",
    });
  }
}
