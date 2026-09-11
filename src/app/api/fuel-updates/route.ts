import { NextResponse } from "next/server";
import { resolveAirport } from "@/lib/airports-db";
import { recordCrowdPrice, verificationTag } from "@/lib/fuel-pricing";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import type { FuelType, PriceReportPayload, PriceReportResponse } from "@/types";

export const runtime = "nodejs";

const FUEL_TYPES: FuelType[] = ["100LL", "Jet-A"];

/** @deprecated Prefer POST /api/fuel — kept for backward compatibility. */
export async function POST(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const limit = rateLimit(`fuel-updates:${ip}`, 8, 60_000);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: `Rate limit exceeded. Retry in ${limit.retryAfterSec}s.`,
      } satisfies PriceReportResponse,
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." } satisfies PriceReportResponse,
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
      { success: false, message: "Invalid payload." } satisfies PriceReportResponse,
      { status: 400 }
    );
  }

  let airport;
  try {
    airport = await resolveAirport(b.airportIcao);
  } catch {
    return NextResponse.json(
      { success: false, message: "Airport lookup failed." } satisfies PriceReportResponse,
      { status: 503 }
    );
  }
  if (!airport) {
    return NextResponse.json(
      { success: false, message: "Unknown airport." } satisfies PriceReportResponse,
      { status: 404 }
    );
  }

  let saved;
  try {
    saved = await recordCrowdPrice({
      airportIcao: airport.icao,
      fboName: b.fboName?.trim() || "Crowdsourced",
      fuelType: b.fuelType as FuelType,
      pricePerGallon: Math.round(b.reportedPrice * 100) / 100,
      isSelfServe: b.isSelfServe,
      notes: b.notes,
      reporterIp: ip,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Could not record the report." } satisfies PriceReportResponse,
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: `Recorded ${saved.fuelType} @ ${saved.airportIcao}: $${saved.pricePerGallon.toFixed(2)}/gal. ${verificationTag(saved)}`,
      id: saved.id,
    } satisfies PriceReportResponse,
    { status: 201 }
  );
}
