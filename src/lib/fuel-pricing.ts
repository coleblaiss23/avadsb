import type { FuelPrice, FuelPriceSource, FuelType } from "@/types";

/** In-memory crowdsourced reports (swap for Supabase in production). */
const crowdReports: FuelPrice[] = [];

function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

const FBO_NAMES = [
  "Atlantic Aviation",
  "Signature Flight Support",
  "Million Air",
  "Sheltair",
  "Ross Aviation",
  "Modern Aviation",
  "City FBO",
  "Self-Serve Island",
];

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

function syntheticPrice(icao: string, fuelType: FuelType): FuelPrice {
  const base = fuelType === "100LL" ? 5.15 : 4.9;
  const span = fuelType === "100LL" ? 2.6 : 2.3;
  const n = hash01(`${icao}:${fuelType}:v2`);
  const price = Math.round((base + n * span) * 100) / 100;
  const fbo = FBO_NAMES[Math.floor(hash01(`${icao}:fbo`) * FBO_NAMES.length)]!;
  const ageHours = Math.floor(hash01(`${icao}:${fuelType}:age`) * 36) + 1;
  return {
    id: `syn-${icao}-${fuelType}`,
    airportIcao: icao,
    fboName: fbo,
    fuelType,
    pricePerGallon: price,
    isSelfServe: fuelType === "100LL" && hash01(`${icao}:ss`) > 0.5,
    source: "Demo_Synthetic",
    updatedAt: hoursAgoIso(ageHours),
  };
}

/**
 * Primary: AirNav / FBO live API when AIRNAV_API_KEY is configured.
 * Documented stub — wire your vendor HTTP client here.
 */
async function fetchAirNavPrice(
  icao: string,
  fuelType: FuelType
): Promise<FuelPrice | null> {
  const key = process.env.AIRNAV_API_KEY;
  if (!key) return null;

  const endpoint = process.env.AIRNAV_API_URL;
  if (!endpoint) {
    // Key present but no endpoint — treat as unavailable
    return null;
  }

  try {
    const url = new URL(endpoint);
    url.searchParams.set("airport", icao);
    url.searchParams.set("fuel", fuelType);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      next: { revalidate: 900 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      price?: number;
      fbo?: string;
      selfServe?: boolean;
      updatedAt?: string;
    };
    if (typeof data.price !== "number" || data.price <= 0) return null;
    return {
      id: `airnav-${icao}-${fuelType}`,
      airportIcao: icao,
      fboName: data.fbo || "AirNav FBO",
      fuelType,
      pricePerGallon: Math.round(data.price * 100) / 100,
      isSelfServe: Boolean(data.selfServe),
      source: "AirNav_API",
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function latestCrowdPrice(
  icao: string,
  fuelType: FuelType,
  maxAgeMs: number
): FuelPrice | null {
  const now = Date.now();
  const matches = crowdReports
    .filter(
      (r) =>
        r.airportIcao === icao &&
        r.fuelType === fuelType &&
        now - new Date(r.updatedAt).getTime() <= maxAgeMs
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  return matches[0] ?? null;
}

const SEVENTY_TWO_HOURS = 72 * 3600_000;

/**
 * Fallback pricing strategy:
 * 1. AirNav / FBO API
 * 2. Crowd-verified pilot submissions ≤ 72h
 * 3. Deterministic demo synthetic quote
 */
export async function resolveFuelPrice(
  icao: string,
  fuelType: FuelType
): Promise<FuelPrice> {
  const code = icao.toUpperCase();

  const live = await fetchAirNavPrice(code, fuelType);
  if (live) return live;

  const crowd = latestCrowdPrice(code, fuelType, SEVENTY_TWO_HOURS);
  if (crowd) return { ...crowd, source: "Pilot_Crowdsource" };

  return syntheticPrice(code, fuelType);
}

export async function resolveFuelPrices(
  icaos: string[],
  fuelType: FuelType
): Promise<Map<string, FuelPrice>> {
  const map = new Map<string, FuelPrice>();
  await Promise.all(
    icaos.map(async (icao) => {
      map.set(icao.toUpperCase(), await resolveFuelPrice(icao, fuelType));
    })
  );
  return map;
}

export function recordCrowdPrice(
  input: Omit<FuelPrice, "id" | "source" | "updatedAt"> & {
    id?: string;
  }
): FuelPrice {
  const price: FuelPrice = {
    id: input.id ?? `crowd-${Date.now()}`,
    airportIcao: input.airportIcao.toUpperCase(),
    fboName: input.fboName,
    fuelType: input.fuelType,
    pricePerGallon: input.pricePerGallon,
    isSelfServe: input.isSelfServe,
    source: "Pilot_Crowdsource",
    updatedAt: new Date().toISOString(),
  };
  crowdReports.unshift(price);
  // Cap memory
  if (crowdReports.length > 5000) crowdReports.length = 5000;
  return price;
}

export function formatPriceAge(updatedAt: string): string {
  const ms = Date.now() - new Date(updatedAt).getTime();
  const hours = Math.max(0, Math.floor(ms / 3600_000));
  if (hours < 1) return "Updated <1 hr ago";
  if (hours < 24) return `Updated ${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
}

export function sourceLabel(source: FuelPriceSource): string {
  switch (source) {
    case "AirNav_API":
      return "via AirNav";
    case "FBO_Direct":
      return "via FBO Direct";
    case "Pilot_Crowdsource":
      return "via Pilot Crowdsource";
    case "Demo_Synthetic":
      return "via Demo Quote";
  }
}

export function verificationTag(price: FuelPrice): string {
  return `${formatPriceAge(price.updatedAt)} ${sourceLabel(price.source)}`;
}
