import { NextResponse } from "next/server";
import { resolveAirport } from "@/lib/airports-db";
import { normalizeIcao } from "@/lib/utils";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ icao: string }> };

/** GET /api/airports/[icao] — full airport record including runways */
export async function GET(_request: Request, ctx: Ctx) {
  const { icao: raw } = await ctx.params;
  const icao = normalizeIcao(raw);
  if (icao.length < 3) {
    return NextResponse.json({ error: "Invalid ICAO" }, { status: 400 });
  }
  let airport;
  try {
    airport = await resolveAirport(icao);
  } catch {
    return NextResponse.json(
      { error: "Airport lookup unavailable", source: "demo" },
      { status: 503 }
    );
  }
  if (!airport) {
    return NextResponse.json({ error: "Airport not found" }, { status: 404 });
  }
  return NextResponse.json(airport);
}
