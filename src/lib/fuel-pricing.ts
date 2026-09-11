import "server-only";
import { resolveAirport } from "@/lib/airports-db";
import {
  isSupabaseConfigured,
  readSupabaseError,
  supabaseAdminFetch,
} from "@/lib/supabase-admin";
import type { Airport, FuelPrice, FuelPriceSource, FuelType } from "@/types";

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

export function demoFuelPrice(icao: string, fuelType: FuelType): FuelPrice {
  return syntheticPrice(icao, fuelType);
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

type PriceReportRow = {
  id: string;
  airport_icao: string;
  fuel_type: FuelType;
  reported_price: number | string;
  is_self_serve: boolean;
  fbo_name: string | null;
  created_at: string;
};

function rowToCrowdPrice(row: PriceReportRow): FuelPrice {
  const price = Number(row.reported_price);
  return {
    id: row.id,
    airportIcao: row.airport_icao,
    fboName: row.fbo_name?.trim() || "Crowdsourced",
    fuelType: row.fuel_type,
    pricePerGallon: Math.round(price * 100) / 100,
    isSelfServe: Boolean(row.is_self_serve),
    source: "Pilot_Crowdsource",
    updatedAt: row.created_at,
  };
}

async function ensureAirportRow(airport: Airport): Promise<void> {
  const res = await supabaseAdminFetch("airports?on_conflict=icao", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify({
      icao: airport.icao,
      faa: airport.faa || null,
      ident: airport.ident || airport.icao,
      name: airport.name,
      city: airport.city || null,
      state: airport.state || null,
      latitude: airport.latitude,
      longitude: airport.longitude,
      elevation: airport.elevation ?? null,
      runway_length: airport.runwayLength || null,
      runway_width: airport.runwayWidth || null,
      runway_ident: airport.runwayIdent || null,
      surface_type: airport.surface || null,
      facility_type: airport.type || null,
    }),
  });
  if (res.ok || res.status === 409) return;
  const message = await readSupabaseError(res);
  if (message.includes("23505")) return;
  throw new Error(`Could not ensure airport ${airport.icao}: ${message}`);
}

/**
 * Newest pilot report for this airport + fuel type within maxAgeMs.
 * Reads public.price_reports. Returns null when Supabase is unset or has no match.
 */
async function latestCrowdPrice(
  icao: string,
  fuelType: FuelType,
  maxAgeMs: number
): Promise<FuelPrice | null> {
  if (!isSupabaseConfigured()) return null;

  const since = new Date(Date.now() - maxAgeMs).toISOString();
  const query = new URLSearchParams({
    select:
      "id,airport_icao,fuel_type,reported_price,is_self_serve,fbo_name,created_at",
    airport_icao: `eq.${icao}`,
    fuel_type: `eq.${fuelType}`,
    created_at: `gte.${since}`,
    order: "created_at.desc",
    limit: "1",
  });

  try {
    const res = await supabaseAdminFetch(`price_reports?${query.toString()}`);
    if (!res.ok) {
      console.warn(
        `[fuel-pricing] crowd price lookup failed (${res.status}); falling through`
      );
      return null;
    }
    const rows = (await res.json()) as PriceReportRow[];
    const row = rows[0];
    if (!row) return null;
    return rowToCrowdPrice(row);
  } catch (err) {
    console.warn(
      "[fuel-pricing] crowd price lookup failed; falling through",
      err instanceof Error ? err.message : ""
    );
    return null;
  }
}

const SEVENTY_TWO_HOURS = 72 * 3600_000;

/**
 * Pricing strategy (no synthetic quotes):
 * 1. AirNav / FBO API
 * 2. Supabase crowd reports (price_reports) ≤ 72h
 * Returns null when neither source has a real price.
 */
export async function resolveFuelPrice(
  icao: string,
  fuelType: FuelType
): Promise<FuelPrice | null> {
  const code = icao.toUpperCase();

  const live = await fetchAirNavPrice(code, fuelType);
  if (live) return live;

  const crowd = await latestCrowdPrice(code, fuelType, SEVENTY_TWO_HOURS);
  if (crowd) return { ...crowd, source: "Pilot_Crowdsource" };

  return null;
}

/** Only includes airports that have a verified (non-demo) price. */
export async function resolveFuelPrices(
  icaos: string[],
  fuelType: FuelType
): Promise<Map<string, FuelPrice>> {
  const map = new Map<string, FuelPrice>();
  await Promise.all(
    icaos.map(async (icao) => {
      const price = await resolveFuelPrice(icao, fuelType);
      if (price) map.set(icao.toUpperCase(), price);
    })
  );
  return map;
}

/**
 * Records a pilot-submitted price. The reporter's IP is accepted here only so
 * callers keep a consistent signature with the rate limiter — it is never
 * written to Supabase or attached to the stored record, matching the privacy
 * policy's promise.
 */
export async function recordCrowdPrice(
  input: Omit<FuelPrice, "id" | "source" | "updatedAt"> & {
    id?: string;
    notes?: string;
    reporterIp?: string;
  }
): Promise<FuelPrice> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const airportIcao = input.airportIcao.toUpperCase();
  const airport = await resolveAirport(airportIcao);
  if (!airport) {
    throw new Error(`Unknown airport ${airportIcao}`);
  }
  await ensureAirportRow(airport);

  const fboName = input.fboName.trim().slice(0, 120) || "Crowdsourced";
  const notes = input.notes?.trim().slice(0, 1000) || null;
  const res = await supabaseAdminFetch("price_reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      airport_icao: airport.icao,
      fuel_type: input.fuelType,
      reported_price: input.pricePerGallon,
      is_self_serve: input.isSelfServe,
      fbo_name: fboName,
      notes,
    }),
  });
  if (!res.ok) {
    throw new Error(await readSupabaseError(res));
  }

  const rows = (await res.json()) as PriceReportRow[];
  const row = rows[0];
  if (!row) {
    throw new Error("Supabase did not return the saved price report");
  }
  return rowToCrowdPrice(row);
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