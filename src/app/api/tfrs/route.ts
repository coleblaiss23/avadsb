import { NextResponse } from "next/server";
import { fetchTfrs, getMockTfrs } from "@/lib/tfrs";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function parseCoord(raw: string | null, min: number, max: number): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

/** GET /api/tfrs or ?lat=&lng=&radiusNm= */
export async function GET(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = rateLimit(`tfrs:${ip}`, 60, 60_000);
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
  const lat = parseCoord(searchParams.get("lat"), -90, 90);
  const lng = parseCoord(searchParams.get("lng") ?? searchParams.get("lon"), -180, 180);
  const radiusNm = parseCoord(searchParams.get("radiusNm"), 1, 500);
  const hasAny = lat != null || lng != null || radiusNm != null;
  const hasAll = lat != null && lng != null && radiusNm != null;
  if (hasAny && !hasAll) {
    return NextResponse.json(
      { error: "lat, lng, and radiusNm are required together" },
      { status: 400 }
    );
  }

  try {
    const payload = await fetchTfrs(
      hasAll ? { lat: lat!, lng: lng!, radiusNm: radiusNm! } : undefined
    );
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(getMockTfrs());
  }
}
