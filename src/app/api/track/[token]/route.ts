import { NextResponse } from "next/server";
import { getFlightTrackLive } from "@/lib/flight-track";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ token: string }> };

/** GET /api/track/[token] — public read-only position for an opt-in share. */
export async function GET(request: Request, ctx: Ctx) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = rateLimit(`track-read:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        ok: false,
        expired: true,
        error: "Rate limit exceeded",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  const { token } = await ctx.params;
  const payload = await getFlightTrackLive(token);

  if (!payload.ok) {
    return NextResponse.json(payload, { status: 410 });
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=4, stale-while-revalidate=8",
    },
  });
}
