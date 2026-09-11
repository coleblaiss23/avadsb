import { NextResponse } from "next/server";
import { parseAirplanesLiveResponse } from "@/lib/traffic";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const HOSTS = [
  { host: "https://api.adsb.lol", label: "adsb.lol" },
  { host: "https://api.airplanes.live", label: "airplanes.live" },
] as const;

function cleanQuery(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function looksLikeHex(q: string): boolean {
  return /^[0-9A-F]{6}$/.test(q);
}

function looksLikeRegistration(q: string): boolean {
  // N-number, Canadian C-Fxxx, or hyphenated regs
  return /^(N[0-9]{1,5}[A-Z]{0,2}|C-[A-Z]{4}|[A-Z]-[A-Z0-9]+|[A-Z]{1,2}-[A-Z0-9]+)$/i.test(
    q
  );
}

async function fetchPath(
  host: string,
  path: string
): Promise<{ ok: true; json: unknown } | { ok: false; status: number }> {
  const url = `${host}${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "AvADSB/0.1 (ADS-B aircraft lookup)",
      },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, status: res.status };
    const json = (await res.json()) as unknown;
    return { ok: true, json };
  } catch {
    return { ok: false, status: 502 };
  }
}

/**
 * GET /api/traffic/lookup?q=UAL123 | N123AB | ABC123
 * Tries callsign, then registration, then Mode-S hex.
 */
export async function GET(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = rateLimit(`traffic-lookup:${ip}`, 20, 60_000);
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
  const q = cleanQuery(searchParams.get("q") ?? "");
  if (q.length < 2 || q.length > 12) {
    return NextResponse.json(
      { error: "Enter a callsign, tail number, or Mode-S hex" },
      { status: 400 }
    );
  }

  const paths: string[] = [];
  if (looksLikeHex(q)) {
    paths.push(`/v2/hex/${q.toLowerCase()}`);
  }
  if (looksLikeRegistration(q) || q.startsWith("N")) {
    paths.push(`/v2/reg/${encodeURIComponent(q)}`);
  }
  paths.push(`/v2/callsign/${encodeURIComponent(q)}`);
  // Deduplicate while preserving order
  const uniquePaths = [...new Set(paths)];

  try {
  for (const { host, label } of HOSTS) {
    for (const path of uniquePaths) {
      const result = await fetchPath(host, path);
      if (!result.ok) continue;
      const aircraft = parseAirplanesLiveResponse(result.json);
      if (aircraft.length > 0) {
        return NextResponse.json(
          {
            aircraft,
            count: aircraft.length,
            query: q,
            source: label,
            fetchedAt: new Date().toISOString(),
          },
          {
            headers: {
              "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
            },
          }
        );
      }
    }
  }

  return NextResponse.json({
    error: `No live aircraft found for “${q}”`,
    aircraft: [],
    count: 0,
    query: q,
    source: "demo",
  });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Lookup failed",
      aircraft: [],
      count: 0,
      query: q,
      source: "demo",
    });
  }
}
