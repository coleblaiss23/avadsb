import { NextResponse } from "next/server";
import { resolveAirport } from "@/lib/airports-db";
import { fetchMetar, getMockMetar } from "@/lib/metar";
import {
  clientIpFromHeaders,
  rateLimit,
} from "@/lib/rate-limit";
import { normalizeIcao } from "@/lib/utils";

export const runtime = "nodejs";

/** GET /api/metar?icao=KAPA */
export async function GET(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = rateLimit(`metar:${ip}`, 60, 60_000);
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
  const icao = normalizeIcao(searchParams.get("icao") ?? "");
  if (icao.length < 3) {
    return NextResponse.json(
      { error: "icao query param required (3–4 chars)" },
      { status: 400 }
    );
  }

  let elev = 0;
  try {
    const airport = await resolveAirport(icao);
    elev = airport?.elevation ?? 0;

    const live = await fetchMetar(icao, { elevationFt: elev });
    if (live) {
      return NextResponse.json({
        metar: live,
        source: "aviationweather.gov",
      });
    }
  } catch {
    // fall through to the tagged demo METAR
  }

  return NextResponse.json({
    metar: getMockMetar(icao, elev),
    source: "demo",
  });
}
