import { NextResponse } from "next/server";
import { findAirportsInBBox } from "@/lib/airports-db";

export const runtime = "nodejs";

/**
 * GET /api/airports/bbox?south=&west=&north=&east=&minRunway=&pads=0&limit=120
 * Compact ICAO label payload for the radar map.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const south = Number(searchParams.get("south"));
  const west = Number(searchParams.get("west"));
  const north = Number(searchParams.get("north"));
  const east = Number(searchParams.get("east"));
  const minRunway = Number(searchParams.get("minRunway") || 0);
  const limit = Math.min(Number(searchParams.get("limit") || 120), 200);
  const includePads = searchParams.get("pads") === "1";

  if (
    ![south, west, north, east].every(Number.isFinite) ||
    south < -90 ||
    north > 90 ||
    south >= north
  ) {
    return NextResponse.json(
      { error: "south, west, north, east required (south < north)" },
      { status: 400 }
    );
  }

  try {
    const airports = await findAirportsInBBox({
      south,
      west,
      north,
      east,
      includePads,
      minRunwayFt: Number.isFinite(minRunway) ? Math.max(0, minRunway) : 0,
      limit,
    });
    return NextResponse.json({ airports });
  } catch {
    return NextResponse.json(
      { airports: [], source: "demo", error: "Airport catalog unavailable" },
      { status: 503 }
    );
  }
}
