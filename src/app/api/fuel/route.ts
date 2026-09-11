import { NextResponse } from "next/server";
import { resolveAirport } from "@/lib/airports-db";
import {
  recordCrowdPrice,
  resolveFuelPrice,
  resolveFuelPrices,
  verificationTag,
} from "@/lib/fuel-pricing";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import type { FuelType, PriceReportPayload, PriceReportResponse } from "@/types";

export const runtime = "nodejs";

const FUEL_TYPES: FuelType[] = ["100LL", "Jet-A"];

/**
 * GET /api/fuel?icao=KAPA&fuelType=100LL
 * GET /api/fuel?icaos=KAPA,KSDL,E37&fuelType=100LL
 *
 * Fallback: AirNav → crowdsource ≤72h → demo synthetic.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fuelType = (searchParams.get("fuelType") || "100LL") as FuelType;
  if (!FUEL_TYPES.includes(fuelType)) {
    return NextResponse.json({ error: "Invalid fuelType" }, { status: 400 });
  }

  const multi = searchParams.get("icaos");
  if (multi) {
    const codes = multi
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 200);
    const prices = await resolveFuelPrices(codes, fuelType);
    const payload = Object.fromEntries(
      [...prices.entries()].map(([icao, price]) => [
        icao,
        { ...price, verification: verificationTag(price) },
      ])
    );
    return NextResponse.json({ fuelType, prices: payload });
  }

  const icao = (searchParams.get("icao") || "").trim().toUpperCase();
  if (!icao) {
    return NextResponse.json(
      { error: "Provide icao or icaos query param" },
      { status: 400 }
    );
  }

  const airport = await resolveAirport(icao);
  if (!airport) {
    return NextResponse.json({ error: `Unknown airport ${icao}` }, { status: 404 });
  }

  const price = await resolveFuelPrice(airport.icao, fuelType);
  return NextResponse.json({
    airport: {
      icao: airport.icao,
      faa: airport.faa,
      name: airport.name,
    },
    price: { ...price, verification: verificationTag(price) },
  });
}

/**
 * POST /api/fuel — crowdsource price report (also available at /api/fuel-updates).
 */
export async function POST(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const limit = rateLimit(`fuel:${ip}`, 8, 60_000);
  if (!limit.allowed) {
    const body: PriceReportResponse = {
      success: false,
      message: `Rate limit exceeded. Retry in ${limit.retryAfterSec}s.`,
    };
    return NextResponse.json(body, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON" } satisfies PriceReportResponse,
      { status: 400 }
    );
  }

  const b = json as Partial<PriceReportPayload>;
  if (
    typeof b.airportIcao !== "string" ||
    !FUEL_TYPES.includes(b.fuelType as FuelType) ||
    typeof b.reportedPrice !== "number" ||
    b.reportedPrice <= 0 ||
    typeof b.isSelfServe !== "boolean"
  ) {
    return NextResponse.json(
      { success: false, message: "Invalid payload" } satisfies PriceReportResponse,
      { status: 400 }
    );
  }

  const airport = await resolveAirport(b.airportIcao);
  if (!airport) {
    return NextResponse.json(
      { success: false, message: "Unknown airport" } satisfies PriceReportResponse,
      { status: 404 }
    );
  }

  const saved = recordCrowdPrice({
    airportIcao: airport.icao,
    fboName: b.fboName?.trim() || "Crowdsourced",
    fuelType: b.fuelType as FuelType,
    pricePerGallon: Math.round(b.reportedPrice * 100) / 100,
    isSelfServe: b.isSelfServe,
  });

  return NextResponse.json(
    {
      success: true,
      message: `Recorded ${saved.fuelType} @ ${saved.airportIcao}: $${saved.pricePerGallon.toFixed(2)}/gal.`,
      id: saved.id,
      verification: verificationTag(saved),
    } satisfies PriceReportResponse & { verification: string },
    { status: 201 }
  );
}
