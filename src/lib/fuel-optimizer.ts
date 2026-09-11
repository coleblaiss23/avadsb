import {
  alongTrackNm,
  buildCorridor,
  crossTrackNm,
  detourExtraNm,
  haversineNm,
  isWithinCorridor,
} from "@/lib/geo";
import type {
  AirportWithFuel,
  FuelStopCandidate,
  FuelType,
  RouteOptimizationResult,
  RoutePlannerInput,
} from "@/types";

export interface OptimizeOptions {
  airports: AirportWithFuel[];
  input: RoutePlannerInput;
}

function resolveInList(
  airports: AirportWithFuel[],
  code: string
): AirportWithFuel | undefined {
  const k = code.trim().toUpperCase();
  return airports.find(
    (a) =>
      a.icao === k ||
      a.faa === k ||
      a.ident === k ||
      (k.length === 3 && a.icao === `K${k}`) ||
      (k.length === 4 && k.startsWith("K") && a.faa === k.slice(1))
  );
}

function priceForType(
  airport: AirportWithFuel,
  fuelType: FuelType
): number | null {
  if (!airport.fuel) return null;
  if (airport.fuel.fuelType !== fuelType) return null;
  return airport.fuel.pricePerGallon;
}

/**
 * Net Fuel Savings Matrix:
 * Net Savings = (Fuel Gallons Needed * Price Delta) - (Detour Time Hours * Hourly DOC)
 */
export function optimizeFuelStops({
  airports,
  input,
}: OptimizeOptions): RouteOptimizationResult {
  const origin = resolveInList(airports, input.originIcao);
  const destination = resolveInList(airports, input.destinationIcao);

  if (!origin) {
    throw new Error(`Unknown origin airport: ${input.originIcao}`);
  }
  if (!destination) {
    throw new Error(`Unknown destination airport: ${input.destinationIcao}`);
  }
  if (origin.icao === destination.icao) {
    throw new Error("Origin and destination must be different.");
  }

  const originPt = { lat: origin.latitude, lng: origin.longitude };
  const destPt = { lat: destination.latitude, lng: destination.longitude };
  const corridor = buildCorridor(originPt, destPt, input.maxDetourNm);

  const destinationPrice = priceForType(destination, input.fuelType);
  if (destinationPrice == null) {
    throw new Error(
      `No ${input.fuelType} price available at destination ${destination.icao}`
    );
  }

  const { cruiseSpeedKts, fuelBurnGph, tankCapacityGal, hourlyOperatingCost } =
    input.aircraft;

  if (cruiseSpeedKts <= 0 || fuelBurnGph <= 0) {
    throw new Error("Cruise speed and fuel burn must be positive.");
  }

  const candidates: Omit<FuelStopCandidate, "rank">[] = [];

  for (const airport of airports) {
    if (airport.icao === origin.icao || airport.icao === destination.icao) {
      continue;
    }

    const stopPt = { lat: airport.latitude, lng: airport.longitude };
    if (
      !isWithinCorridor(
        originPt,
        destPt,
        stopPt,
        input.maxDetourNm,
        corridor.directDistanceNm
      )
    ) {
      continue;
    }

    const stopPrice = priceForType(airport, input.fuelType);
    if (stopPrice == null) continue;

    const detourNm = detourExtraNm(
      originPt,
      stopPt,
      destPt,
      corridor.directDistanceNm
    );
    const detourTimeHours = detourNm / cruiseSpeedKts;

    const remainingNm = haversineNm(stopPt, destPt);
    const flightHoursToDest = remainingNm / cruiseSpeedKts;
    const reserveHours = 0.75;
    const fuelNeededGal = Math.min(
      tankCapacityGal * 0.9,
      fuelBurnGph * (flightHoursToDest + reserveHours)
    );

    const priceDelta = destinationPrice - stopPrice;
    const fuelSavings = fuelNeededGal * priceDelta;
    const operatingCostPenalty = detourTimeHours * hourlyOperatingCost;
    const netSavings = fuelSavings - operatingCostPenalty;
    const totalFillCost = fuelNeededGal * stopPrice;

    candidates.push({
      airport,
      detourNm,
      detourTimeHours,
      fuelNeededGal,
      priceDelta,
      fuelSavings,
      operatingCostPenalty,
      totalFillCost,
      netSavings,
      alongTrackNm: alongTrackNm(originPt, destPt, stopPt),
      crossTrackNm: Math.abs(crossTrackNm(originPt, destPt, stopPt)),
    });
  }

  candidates.sort((a, b) => b.netSavings - a.netSavings);

  return {
    origin,
    destination,
    corridor,
    candidates: candidates.map((c, i) => ({ ...c, rank: i + 1 })),
    destinationPrice,
    generatedAt: new Date().toISOString(),
  };
}
