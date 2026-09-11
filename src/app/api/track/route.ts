import { NextResponse } from "next/server";
import { createFlightTrackShare } from "@/lib/flight-track";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/track
 * Body: { tailNumber: string, label?: string }
 * Creates an opt-in, expiring (24h) read-only share link.
 */
export async function POST(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = rateLimit(`track-create:${ip}`, 8, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Rate limit exceeded. Retry in ${rl.retryAfterSec}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const body = json as { tailNumber?: unknown; label?: unknown };
  if (typeof body.tailNumber !== "string") {
    return NextResponse.json(
      { ok: false, error: "tailNumber is required." },
      { status: 400 }
    );
  }

  const result = await createFlightTrackShare({
    tailNumber: body.tailNumber,
    label: typeof body.label === "string" ? body.label : null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({
    ok: true,
    id: result.share.id,
    tailNumber: result.share.tailNumber,
    label: result.share.label,
    createdAt: result.share.createdAt,
    expiresAt: result.share.expiresAt,
    path: result.urlPath,
  });
}
