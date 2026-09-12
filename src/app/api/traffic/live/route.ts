import { NextResponse } from "next/server";
import { parseAirplanesLiveResponse } from "@/lib/traffic";
import {
  clientIpFromHeaders,
  rateLimit,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

const PRIMARY_HOST = "https://api.adsb.lol";
/** ODbL-licensed, available for all uses with attribution. airplanes.live requires a commercial license for monetized sites — used here only as a fallback. */
const FALLBACK_HOST = "https://api.airplanes.live";
const MAX_RADIUS_NM = 250;
const MIN_RADIUS_NM = 5;
const POINT_CACHE_MS = 3_000;

const pointCache = new Map<
  string,
  { at: number; aircraft: ReturnType<typeof parseAirplanesLiveResponse>; source: string }
>();

function pointCacheKey(lat: number, lon: number, radius: number): string {
  return `${lat.toFixed(2)}:${lon.toFixed(2)}:${radius}`;
}

function parseCoord(raw: string | null, name: string): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (name === "lat" && (n < -90 || n > 90)) return null;
  if (name === "lon" && (n < -180 || n > 180)) return null;
  return n;
}

async function fetchUpstream(
  host: string,
  lat: number,
  lon: number,
  radius: number
): Promise<{ ok: true; json: unknown; source: string } | { ok: false; status: number; body: string }> {
  const url = `${host}/v2/point/${lat}/${lon}/${radius}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "AvADSB/0.1 (ADS-B radar layer; local demo)",
      },
      cache: "no-store",
      // Bound the wait so a slow/unresponsive host falls through to the
      // fallback quickly instead of hanging the whole request.
      signal: AbortSignal.timeout(6_000),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return {
      ok: false,
      status: 0,
      body: timedOut ? `${host} timed out after 6s` : "Network error reaching upstream",
    };
  }

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, body: text.slice(0, 400) };
  }

  try {
    const json = JSON.parse(text) as unknown;
    if (
      json &&
      typeof json === "object" &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
    ) {
      return {
        ok: false,
        status: 403,
        body: String((json as { error: string }).error),
      };
    }
    return { ok: true, json, source: host };
  } catch {
    return { ok: false, status: 502, body: "Invalid JSON from upstream" };
  }
}

/** GET /api/traffic/live?lat=&lon=&radius= (radius in NM, max 250) */
export async function GET(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = rateLimit(`traffic:${ip}`, 80, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const lat = parseCoord(searchParams.get("lat"), "lat");
  const lon = parseCoord(searchParams.get("lon"), "lon");
  const radiusRaw = Number(searchParams.get("radius") ?? "50");

  if (lat == null || lon == null) {
    return NextResponse.json(
      { error: "lat and lon query params required" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(radiusRaw) || radiusRaw <= 0) {
    return NextResponse.json(
      { error: "radius must be a positive number (nautical miles)" },
      { status: 400 }
    );
  }

  const radius = Math.min(
    MAX_RADIUS_NM,
    Math.max(MIN_RADIUS_NM, Math.round(radiusRaw))
  );

  const cacheKey = pointCacheKey(lat, lon, radius);
  const hit = pointCache.get(cacheKey);
  if (hit && Date.now() - hit.at < POINT_CACHE_MS) {
    return NextResponse.json(
      {
        aircraft: hit.aircraft,
        count: hit.aircraft.length,
        center: { lat, lon },
        radiusNm: radius,
        source: hit.source,
        fetchedAt: new Date(hit.at).toISOString(),
      },
      { headers: { "Cache-Control": "public, s-maxage=2, stale-while-revalidate=4" } }
    );
  }

  try {
    let result = await fetchUpstream(PRIMARY_HOST, lat, lon, radius);
    let source = "adsb.lol";

    if (!result.ok) {
      const fallback = await fetchUpstream(FALLBACK_HOST, lat, lon, radius);
      if (!fallback.ok) {
        return NextResponse.json(
          {
            error: "Live traffic unavailable",
            detail: result.body || fallback.body,
            aircraft: [],
          },
          { status: 502 }
        );
      }
      result = fallback;
      source = "airplanes.live";
    }

    if (!result.ok) {
      return NextResponse.json({
        error: "Live traffic unavailable",
        aircraft: [],
        source: "demo",
      });
    }

    const aircraft = parseAirplanesLiveResponse(result.json);
    pointCache.set(cacheKey, { at: Date.now(), aircraft, source });

    return NextResponse.json(
      {
        aircraft,
        count: aircraft.length,
        center: { lat, lon },
        radiusNm: radius,
        source,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3, stale-while-revalidate=6",
        },
      }
    );
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Traffic fetch failed",
      aircraft: [],
      source: "demo",
    });
  }
}
