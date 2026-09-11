import { NextResponse } from "next/server";
import {
  getFuelEligibleAirports,
  resolveAirport,
} from "@/lib/airports-db";
import { optimizeFuelStops } from "@/lib/fuel-optimizer";
import { buildCorridor, isWithinCorridor } from "@/lib/geo";
import { resolveFuelPrice } from "@/lib/fuel-pricing";
import type {
  AircraftSpecs,
  AirportWithFuel,
  FuelType,
  RoutePlannerInput,
} from "@/types";

export const runtime = "nodejs";

interface OptimizeBody {
  originIcao: string;
  destinationIcao: string;
  aircraft: AircraftSpecs;
  maxDetourNm: number;
  fuelType: FuelType;
}

export async function POST(request: Request) {
  let body: OptimizeBody;
  try {
    body = (await request.json()) as OptimizeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const origin = await resolveAirport(body.originIcao);
  const destination = await resolveAirport(body.destinationIcao);
  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Unknown origin or destination airport" },
      { status: 404 }
    );
  }

  const fuelType = body.fuelType || "100LL";
  const maxDetourNm = body.maxDetourNm || 25;

  const originPt = { lat: origin.latitude, lng: origin.longitude };
  const destPt = { lat: destination.latitude, lng: destination.longitude };
  const corridor = buildCorridor(originPt, destPt, maxDetourNm);

  const eligible = await getFuelEligibleAirports();
  const inCorridor = eligible.filter((a) => {
    if (a.icao === origin.icao || a.icao === destination.icao) return false;
    return isWithinCorridor(
      originPt,
      destPt,
      { lat: a.latitude, lng: a.longitude },
      maxDetourNm,
      corridor.directDistanceNm
    );
  });

  // Cap priced candidates for response latency
  const toPrice = [origin, destination, ...inCorridor.slice(0, 400)];

  const withFuel: AirportWithFuel[] = await Promise.all(
    toPrice.map(async (a) => ({
      ...a,
      fuel: await resolveFuelPrice(a.icao, fuelType),
    }))
  );

  const input: RoutePlannerInput = {
    originIcao: origin.icao,
    destinationIcao: destination.icao,
    aircraft: body.aircraft,
    maxDetourNm,
    fuelType,
  };

  try {
    const result = optimizeFuelStops({ airports: withFuel, input });
    return NextResponse.json({
      ...result,
      meta: {
        corridorCandidates: inCorridor.length,
        priced: toPrice.length,
        airportDbSize: eligible.length,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Optimize failed" },
      { status: 400 }
    );
  }
}
