import { NextResponse } from "next/server";
import { lookupAircraftPhoto } from "@/lib/aircraft-photo";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** GET /api/aircraft-photo?hex=a835af | ?reg=N628TS */
export async function GET(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = rateLimit(`aircraft-photo:${ip}`, 40, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", found: false, photo: null },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const hex = searchParams.get("hex");
  const reg = searchParams.get("reg");
  if (!hex && !reg) {
    return NextResponse.json(
      { error: "hex or reg query param required", found: false, photo: null },
      { status: 400 }
    );
  }

  try {
    const result = await lookupAircraftPhoto({ hex, reg });
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": result.found
          ? "public, s-maxage=3600, stale-while-revalidate=7200"
          : "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Photo lookup failed",
      found: false,
      photo: null,
      source: "demo",
    });
  }
}
