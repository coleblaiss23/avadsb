import { NextResponse } from "next/server";
import { findNearestAirport } from "@/lib/airports-db";

export const runtime = "nodejs";

/** GET /api/airports/nearest?lat=39.7&lon=-104.9 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "lat and lon query params required" },
      { status: 400 }
    );
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "lat/lon out of range" }, { status: 400 });
  }

  const hit = await findNearestAirport(lat, lon);
  if (!hit) {
    return NextResponse.json({ error: "No nearby airport found" }, { status: 404 });
  }

  const { airport, distanceNm } = hit;
  return NextResponse.json({
    icao: airport.icao,
    faa: airport.faa,
    name: airport.name,
    city: airport.city,
    state: airport.state,
    latitude: airport.latitude,
    longitude: airport.longitude,
    elevation: airport.elevation,
    distanceNm: Math.round(distanceNm * 10) / 10,
  });
}
