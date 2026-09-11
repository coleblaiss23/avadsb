export type FuelType = "100LL" | "Jet-A";

export type FuelPriceSource =
  | "AirNav_API"
  | "FBO_Direct"
  | "Pilot_Crowdsource"
  | "Demo_Synthetic";

export type ServeType = "self-serve" | "full-serve";

/** One runway end with true heading (from OurAirports). */
export interface AirportRunwayEnd {
  ident: string;
  headingDegT: number;
  lengthFt: number;
  widthFt: number;
  surface: string;
}

export interface Airport {
  id: string;
  /** Preferred display / ICAO-style code (KAPA, E37, …) */
  icao: string;
  /** FAA LID / local code (APA, SDL, 38E) */
  faa: string;
  /** OurAirports / NASR ident */
  ident: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  elevation: number;
  runwayLength: number;
  runwayIdent: string;
  runwayWidth: number;
  surface: string;
  type: string;
  /** All open runway ends with true headings (when catalog includes them). */
  runways?: AirportRunwayEnd[];
}

export type FlightCategory = "VFR" | "MVFR" | "IFR" | "LIFR";

export interface MetarSnapshot {
  icao: string;
  category: FlightCategory;
  raw: string;
  wind: string;
  visibilitySm: number;
  ceilingFt: number | null;
  observedAt: string;
}

/** Extended METAR with parsed metrics for UI widgets. */
export interface ParsedMetar extends MetarSnapshot {
  windDirDeg: number | null;
  windSpeedKt: number;
  windGustKt: number | null;
  tempC: number | null;
  dewpointC: number | null;
  tempDewSpreadC: number | null;
  altimeterInHg: number | null;
  elevationFt: number | null;
  densityAltitudeFt: number | null;
  stationName: string | null;
}

export interface AircraftProfile {
  id: string;
  label: string;
  cruiseSpeedKts: number;
  fuelBurnGph: number;
  tankCapacityGal: number;
  hourlyOperatingCost: number;
}

export interface FuelPrice {
  id: string;
  airportIcao: string;
  fboName: string;
  fuelType: FuelType;
  pricePerGallon: number;
  isSelfServe: boolean;
  source: FuelPriceSource;
  updatedAt: string;
}

export interface AirportWithFuel extends Airport {
  fuel: FuelPrice | null;
}

export interface AircraftSpecs {
  cruiseSpeedKts: number;
  fuelBurnGph: number;
  tankCapacityGal: number;
  hourlyOperatingCost: number;
}

export interface RoutePlannerInput {
  originIcao: string;
  destinationIcao: string;
  aircraft: AircraftSpecs;
  maxDetourNm: number;
  fuelType: FuelType;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface CorridorGeometry {
  directLine: [LatLng, LatLng];
  polygon: LatLng[];
  directDistanceNm: number;
}

export interface FuelStopCandidate {
  airport: AirportWithFuel;
  detourNm: number;
  detourTimeHours: number;
  fuelNeededGal: number;
  priceDelta: number;
  fuelSavings: number;
  operatingCostPenalty: number;
  /** Estimated total fill cost at this stop */
  totalFillCost: number;
  netSavings: number;
  rank: number;
  alongTrackNm: number;
  crossTrackNm: number;
}

export interface RouteOptimizationResult {
  origin: AirportWithFuel;
  destination: AirportWithFuel;
  corridor: CorridorGeometry;
  candidates: FuelStopCandidate[];
  destinationPrice: number;
  generatedAt: string;
}

export interface PriceReportPayload {
  airportIcao: string;
  fuelType: FuelType;
  reportedPrice: number;
  isSelfServe: boolean;
  notes?: string;
  fboName?: string;
}

export interface PriceReportResponse {
  success: boolean;
  message: string;
  id?: string;
}

export type PriceSeverity = "low" | "average" | "high";

export interface AirportSearchHit {
  icao: string;
  faa: string;
  name: string;
  city: string;
  state: string;
  label: string;
}

export type {
  LiveAircraft,
  TrafficCategory,
  AircraftSilhouette,
} from "@/lib/traffic";

