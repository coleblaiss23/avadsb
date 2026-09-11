import { NextResponse } from "next/server";
import { buildFlightPath, type TraceLatLng } from "@/lib/aircraft-trace";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const TRACE_HOSTS = [
  "https://adsb.lol",
  "https://globe.adsb.lol",
] as const;

const cache = new Map<
  string,
  { at: number; path: TraceLatLng[]; source: string }
>();
const CACHE_MS = 45_000;

function normalizeHex(raw: string | null): string | null {
  if (!raw) return null;
  const hex = raw.trim().toLowerCase().replace(/^~/, "");
  if (!/^[0-9a-f]{6}$/.test(hex)) return null;
  return hex;
}

function traceUrl(host: string, hex: string, kind: "full" | "recent"): string {
  const prefix = hex.slice(-2);
  return `${host}/data/traces/${prefix}/trace_${kind}_${hex}.json`;
}

async function fetchTraceJson(
  url: string
): Promise<{ ok: true; json: unknown } | { ok: false }> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json, application/gzip, */*",
        "Accept-Encoding": "gzip",
        "User-Agent": "AvADSB/0.1 (selected aircraft flight path)",
      },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false };
    const json = (await res.json()) as unknown;
    return { ok: true, json };
  } catch {
    return { ok: false };
  }
}

/**
 * GET /api/traffic/trace?hex=ABC123
 * Returns the current-flight lat/lon path for a Mode-S hex (adsb.lol globe traces).
 */
export async function GET(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = rateLimit(`traffic-trace:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", path: [] as TraceLatLng[] },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const hex = normalizeHex(searchParams.get("hex"));
  if (!hex) {
    return NextResponse.json(
      { error: "hex query param required (6-char Mode-S)", path: [] },
      { status: 400 }
    );
  }

  const cached = cache.get(hex);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return NextResponse.json({
      hex,
      path: cached.path,
      count: cached.path.length,
      source: cached.source,
    });
  }

  for (const host of TRACE_HOSTS) {
    for (const kind of ["full", "recent"] as const) {
      const result = await fetchTraceJson(traceUrl(host, hex, kind));
      if (!result.ok) continue;
      const path = buildFlightPath(result.json);
      if (path.length < 2) continue;

      const source = `${host.replace(/^https:\/\//, "")}:${kind}`;
      cache.set(hex, { at: Date.now(), path, source });
      return NextResponse.json(
        { hex, path, count: path.length, source },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          },
        }
      );
    }
  }

  return NextResponse.json({
    hex,
    path: [] as TraceLatLng[],
    count: 0,
    error: "Trace unavailable",
    source: "none",
  });
}
