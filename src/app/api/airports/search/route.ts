import { NextResponse } from "next/server";
import { searchAirports } from "@/lib/airports-db";

export const runtime = "nodejs";

/** GET /api/airports/search?q=APA */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") || 8), 20);

  if (q.trim().length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const hits = await searchAirports(q, limit);
    return NextResponse.json({
    results: hits.map((a) => ({
      icao: a.icao,
      faa: a.faa,
      name: a.name,
      city: a.city,
      state: a.state,
      label: `${a.icao}${a.faa && a.faa !== a.icao ? ` / ${a.faa}` : ""} — ${a.name}, ${a.city} ${a.state}`.trim(),
    })),
    });
  } catch {
    return NextResponse.json({ results: [], source: "demo" });
  }
}
