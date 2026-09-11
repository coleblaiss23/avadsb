import { NextResponse } from "next/server";
import { fetchNotams, getMockNotams, type NotamQuery } from "@/lib/notams";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import { normalizeIcao } from "@/lib/utils";

export const runtime = "nodejs";

function parseCoord(raw: string | null, min: number, max: number): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

/** GET /api/notams?icao=KPHX or ?lat=&lng=&radiusNm= */
export async function GET(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = rateLimit(`notams:${ip}`, 60, 60_000);
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
  const lat = parseCoord(searchParams.get("lat"), -90, 90);
  const lng = parseCoord(searchParams.get("lng") ?? searchParams.get("lon"), -180, 180);
  const radiusNm = parseCoord(searchParams.get("radiusNm"), 1, 250);

  let query: NotamQuery | null = null;
  if (icao.length >= 3) {
    query = { icao };
  } else if (lat != null && lng != null && radiusNm != null) {
    query = { lat, lng, radiusNm };
  }
  if (!query) {
    return NextResponse.json(
      { error: "icao or lat, lng, and radiusNm required" },
      { status: 400 }
    );
  }

  try {
    const payload = await fetchNotams(query);
    return NextResponse.json(payload);
  } catch {
    const payload = await getMockNotams(query);
    return NextResponse.json(payload);
  }
}
