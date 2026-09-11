import { findNearestAirport } from "@/lib/airports-db";
import type { NotamPayload, NotamRecord } from "@/lib/briefing";

export type { BriefingSource, NotamPayload, NotamRecord } from "@/lib/briefing";
export { briefingTag } from "@/lib/briefing";

export type NotamQuery =
  | { icao: string; lat?: undefined; lng?: undefined; radiusNm?: undefined }
  | { icao?: undefined; lat: number; lng: number; radiusNm: number };

const NMS_AUTH = "https://api-nms.aim.faa.gov/v1/auth/token";
const NMS_NOTAMS = "https://api-nms.aim.faa.gov/nmsapi/v1/notams";
const LEGACY_NOTAMS = "https://external-api.faa.gov/notamapi/v1/notams";

const CONTRACTIONS: Record<string, string> = {
  RWY: "runway",
  TWY: "taxiway",
  TXL: "taxilane",
  CLSD: "closed",
  WEF: "with effect from",
  TIL: "until",
  UFN: "until further notice",
  BTN: "between",
  AD: "airport",
  APCH: "approach",
  DEP: "departure",
  SFC: "surface",
  AGL: "above ground level",
  MSL: "mean sea level",
  LGT: "light",
  LGTD: "lighted",
  UNLGTD: "unlighted",
  OTS: "out of service",
  "U/S": "unserviceable",
  US: "unserviceable",
  UNAVBL: "unavailable",
  AVBL: "available",
  WIP: "work in progress",
  PAEW: "personnel and equipment working",
  NAV: "navigation",
  PPR: "prior permission required",
  CTC: "contact",
  EXC: "except",
  TEMPO: "temporary",
  OPR: "operating",
  HLDG: "holding",
  HOLD: "holding",
  DLA: "delayed",
  OBSC: "obscured",
  NM: "nautical miles",
  FT: "feet",
  INT: "intersection",
  THR: "threshold",
  PAPI: "PAPI",
  VASI: "VASI",
  ILS: "ILS",
  RNAV: "RNAV",
  GPS: "GPS",
  LOC: "localizer",
  GS: "glideslope",
  NIGHT: "at night",
  DAY: "during daylight",
  HR: "hours",
  EST: "estimated",
  PERM: "permanent",
};

let tokenCache: { token: string; expiresAt: number } | null = null;

function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function locationDesignator(icao: string): string {
  const code = icao.toUpperCase();
  if (code.length === 4 && code.startsWith("K")) return code.slice(1);
  return code;
}

export function decodeNotamText(raw: string): string {
  return raw
    .split(/(\s+|\/)/)
    .map((token) => {
      const key = token.toUpperCase();
      return CONTRACTIONS[key] ?? token;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchNotams(query: NotamQuery): Promise<NotamPayload> {
  try {
    const live = await fetchLiveNotams(query);
    if (live) {
      return { notams: live, source: "faa", fetchedAt: new Date().toISOString() };
    }
  } catch {
    // fall through to demo — never serve a stale live cache as current
  }
  return getMockNotams(query);
}

export async function getMockNotams(query: NotamQuery): Promise<NotamPayload> {
  if (query.icao) {
    return {
      notams: mockNotamsForIcao(query.icao),
      source: "demo",
      fetchedAt: new Date().toISOString(),
    };
  }

  if (query.lat == null || query.lng == null) {
    return { notams: [], source: "demo", fetchedAt: new Date().toISOString() };
  }
  const hit = await findNearestAirport(query.lat, query.lng, {
    maxNm: query.radiusNm ?? 25,
  });
  if (!hit) {
    return { notams: [], source: "demo", fetchedAt: new Date().toISOString() };
  }
  return {
    notams: mockNotamsForIcao(hit.airport.icao),
    source: "demo",
    fetchedAt: new Date().toISOString(),
  };
}

function mockNotamsForIcao(icao: string): NotamRecord[] {
  const code = icao.toUpperCase();
  const n = hash01(`${code}:notam`);
  if (n < 0.18) return [];

  const rwy = String(10 + Math.floor(hash01(`${code}:rwy`) * 18)).padStart(2, "0");
  const year = new Date().getUTCFullYear().toString().slice(-2);
  const number = `${year}/${String(1000 + Math.floor(hash01(`${code}:num`) * 8000))}`;
  const start = new Date(Date.now() - 6 * 3600_000).toISOString();
  const end = new Date(Date.now() + 36 * 3600_000).toISOString();
  const out: NotamRecord[] = [];

  const rwyRaw = `!${code} ${number} ${code} RWY ${rwy}/${String((Number(rwy) + 18) % 36 || 36).padStart(2, "0")} CLSD WEF ${start.slice(0, 16)}Z TIL ${end.slice(0, 16)}Z`;
  out.push(makeRecord(code, number, rwyRaw, start, end));

  if (n > 0.45) {
    const twyRaw = `!${code} ${number} ${code} TWY A CLSD BTN TWY B AND TWY C WIP PAEW`;
    out.push(makeRecord(code, `${number}-A`, twyRaw, start, null));
  }
  if (n > 0.72) {
    const ilsRaw = `!${code} ${number} ${code} ILS RWY ${rwy} U/S`;
    out.push(makeRecord(code, `${number}-B`, ilsRaw, start, end));
  }
  return out;
}

function makeRecord(
  icao: string,
  notamNumber: string,
  raw: string,
  effectiveStart: string | null,
  effectiveEnd: string | null
): NotamRecord {
  return {
    id: `${icao}-${notamNumber}`,
    notamNumber,
    icao,
    raw,
    plain: decodeNotamText(raw.replace(/^![A-Z0-9]+\s+\S+\s+[A-Z0-9]+\s+/, "")),
    effectiveStart,
    effectiveEnd,
    issuedAt: effectiveStart,
  };
}

async function fetchLiveNotams(query: NotamQuery): Promise<NotamRecord[] | null> {
  const clientId = process.env.FAA_NOTAM_CLIENT_ID?.trim();
  const clientSecret = process.env.FAA_NOTAM_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  try {
    const token = await nmsToken(clientId, clientSecret);
    const json = await nmsSearch(token, query);
    const parsed = parseNotamPayload(json, query.icao ?? "");
    if (parsed) return parsed;
  } catch {
    // try the older external API before giving up
  }

  const legacy = await legacySearch(clientId, clientSecret, query);
  return parseNotamPayload(legacy, query.icao ?? "");
}

async function nmsToken(clientId: string, clientSecret: string): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  const res = await fetch(NMS_AUTH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`NOTAM token ${res.status}`);
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("NOTAM token missing");
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, (data.expires_in ?? 300) - 60) * 1000,
  };
  return data.access_token;
}

async function nmsSearch(token: string, query: NotamQuery): Promise<unknown> {
  const params = new URLSearchParams();
  if (query.icao) params.set("location", locationDesignator(query.icao));
  if (query.lat != null && query.lng != null && query.radiusNm != null) {
    params.set("latitude", String(query.lat));
    params.set("longitude", String(query.lng));
    params.set("radius", String(query.radiusNm));
  }
  const res = await fetch(`${NMS_NOTAMS}?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      nmsResponseFormat: "GEOJSON",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`NMS ${res.status}`);
  return res.json();
}

async function legacySearch(
  clientId: string,
  clientSecret: string,
  query: NotamQuery
): Promise<unknown> {
  const params = new URLSearchParams({ responseFormat: "geoJson" });
  if (query.icao) params.set("icaoLocation", query.icao);
  if (query.lat != null && query.lng != null && query.radiusNm != null) {
    params.set("latitude", String(query.lat));
    params.set("longitude", String(query.lng));
    params.set("radius", String(query.radiusNm));
  }
  const res = await fetch(`${LEGACY_NOTAMS}?${params}`, {
    headers: {
      client_id: clientId,
      client_secret: clientSecret,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`legacy NOTAM ${res.status}`);
  return res.json();
}

function parseNotamPayload(json: unknown, fallbackIcao: string): NotamRecord[] | null {
  const items = collectNotamItems(json);
  if (!items) return null;
  const out: NotamRecord[] = [];
  for (const item of items) {
    const rec = normalizeNotam(item, fallbackIcao);
    if (rec) out.push(rec);
  }
  return out;
}

function collectNotamItems(json: unknown): unknown[] | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;
  if (Array.isArray(root.features)) return root.features;
  if (Array.isArray(root.notams)) return root.notams;
  if (Array.isArray(root.items)) return root.items;
  const data = root.data;
  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;
    if (Array.isArray(nested.geojson)) return nested.geojson;
    if (Array.isArray(nested.features)) return nested.features;
    if (Array.isArray(nested.notams)) return nested.notams;
  }
  if (Array.isArray(json)) return json;
  return null;
}

function normalizeNotam(item: unknown, fallbackIcao: string): NotamRecord | null {
  if (!item || typeof item !== "object") return null;
  const obj = item as Record<string, unknown>;
  const props =
    obj.properties && typeof obj.properties === "object"
      ? (obj.properties as Record<string, unknown>)
      : obj;
  const raw = firstString(props, [
    "text",
    "traditionalMessage",
    "traditional_message",
    "icaoMessage",
    "message",
    "notamText",
    "raw",
  ]);
  if (!raw) return null;
  const icao =
    firstString(props, ["icao", "location", "locationDesignator", "airport"]) ||
    fallbackIcao ||
    "ZZZZ";
  const notamNumber =
    firstString(props, ["notamNumber", "number", "id", "nmsId", "notam_id"]) ||
    raw.slice(0, 24);
  const start = firstString(props, [
    "effectiveStart",
    "effectiveStartDate",
    "startDate",
    "start",
  ]);
  const end = firstString(props, [
    "effectiveEnd",
    "effectiveEndDate",
    "endDate",
    "end",
  ]);
  return {
    id: `${icao}-${notamNumber}`,
    notamNumber,
    icao: icao.toUpperCase(),
    raw,
    plain: decodeNotamText(raw),
    effectiveStart: start,
    effectiveEnd: end,
    issuedAt: firstString(props, ["issuedAt", "issued", "created"]) || start,
  };
}

function firstString(props: Record<string, unknown>, keys: string[]): string | null {
  const wanted = new Set(keys.map((k) => k.toLowerCase()));
  for (const [key, value] of Object.entries(props)) {
    if (!wanted.has(key.toLowerCase())) continue;
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}
