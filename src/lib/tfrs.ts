import { destinationPoint, haversineNm } from "@/lib/geo";
import type { BriefingSource } from "@/lib/briefing";
import type { LatLng } from "@/types";

export type TfrProperties = {
  id: string;
  notamNumber: string;
  reason: string;
  type: string;
  title: string;
  facility: string | null;
  state: string | null;
  effectiveStart: string | null;
  effectiveEnd: string | null;
  timeZone: "UTC" | "Local" | null;
  effectiveLabel: string | null;
  floorFt: number | null;
  ceilingFt: number | null;
  floorLabel: string;
  ceilingLabel: string;
  detailUrl: string;
  description: string;
};

export type TfrFeature = {
  type: "Feature";
  id: string;
  geometry: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
  properties: TfrProperties;
};

export type TfrCollection = {
  type: "FeatureCollection";
  features: TfrFeature[];
  source: BriefingSource;
  fetchedAt: string;
};

type TfrListRow = {
  notam_id?: string;
  type?: string;
  facility?: string;
  state?: string;
  description?: string;
};

const WFS_URL =
  "https://tfr.faa.gov/geoserver/TFR/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=TFR:V_TFR_LOC&outputFormat=application/json&maxFeatures=400";
const LIST_URL = "https://tfr.faa.gov/tfrapi/exportTfrList";

const UA = "AvADSB/0.1 (TFR overlay; convenience briefing, not a certified source)";

let freshCache: { at: number; payload: TfrCollection } | null = null;
const CACHE_MS = 60_000;

export async function fetchTfrs(filter?: {
  lat: number;
  lng: number;
  radiusNm: number;
}): Promise<TfrCollection> {
  const all = await loadTfrs();
  if (!filter) return all;
  return {
    ...all,
    features: all.features.filter((feature) =>
      featureIntersects(feature, filter.lat, filter.lng, filter.radiusNm)
    ),
  };
}

async function loadTfrs(): Promise<TfrCollection> {
  if (freshCache && Date.now() - freshCache.at < CACHE_MS) {
    return freshCache.payload;
  }
  try {
    const live = await fetchLiveTfrs();
    if (live.features.length > 0) {
      const payload: TfrCollection = {
        type: "FeatureCollection",
        features: live.features,
        source: "faa",
        fetchedAt: new Date().toISOString(),
      };
      freshCache = { at: Date.now(), payload };
      return payload;
    }
  } catch {
    // fall through — do not replay an expired FAA pull as if it were live
  }
  return getMockTfrs();
}

export function getMockTfrs(): TfrCollection {
  const now = Date.now();
  const start = new Date(now - 2 * 3600_000).toISOString();
  const end = new Date(now + 20 * 3600_000).toISOString();
  const features: TfrFeature[] = [
    demoTfr({
      id: "DEMO/1",
      reason: "Stadium / airshow",
      type: "AIR SHOWS/SPORTS",
      title: "Demo stadium TFR — Phoenix, AZ",
      lat: 33.4455,
      lng: -112.0667,
      radiusNm: 3,
      floorFt: 0,
      ceilingFt: 3000,
      start,
      end,
      timeZone: "Local",
    }),
    demoTfr({
      id: "DEMO/2",
      reason: "VIP movement",
      type: "VIP",
      title: "Demo VIP TFR — Washington, DC",
      lat: 38.8895,
      lng: -77.0353,
      radiusNm: 8,
      floorFt: 0,
      ceilingFt: 17999,
      start,
      end,
      timeZone: "Local",
    }),
    demoTfr({
      id: "DEMO/3",
      reason: "Wildfire",
      type: "HAZARDS",
      title: "Demo hazard TFR — wildfire, CO",
      lat: 39.55,
      lng: -105.2,
      radiusNm: 12,
      floorFt: 0,
      ceilingFt: 12500,
      start,
      end,
      timeZone: "UTC",
    }),
  ];
  return {
    type: "FeatureCollection",
    features,
    source: "demo",
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchLiveTfrs(): Promise<{ features: TfrFeature[] }> {
  const [wfsRes, listRes] = await Promise.all([
    fetch(WFS_URL, {
      headers: { Accept: "application/json", "User-Agent": UA },
      signal: AbortSignal.timeout(18_000),
    }),
    fetch(LIST_URL, {
      headers: { Accept: "application/json", "User-Agent": UA },
      signal: AbortSignal.timeout(18_000),
    }),
  ]);
  if (!wfsRes.ok) throw new Error(`TFR WFS ${wfsRes.status}`);
  const wfs = (await wfsRes.json()) as {
    features?: {
      geometry?: { type?: string; coordinates?: unknown };
      properties?: Record<string, unknown>;
    }[];
  };
  const list = listRes.ok ? ((await listRes.json()) as TfrListRow[]) : [];
  const byId = new Map<string, TfrListRow>();
  if (Array.isArray(list)) {
    for (const row of list) {
      if (row.notam_id) byId.set(row.notam_id, row);
    }
  }
  const features: TfrFeature[] = [];
  // FAA returns one WFS feature per area of a NOTAM, all sharing the same
  // NOTAM_KEY. The part index has to be unique across the whole collection,
  // not just within one feature's rings.
  const partByNotam = new Map<string, number>();
  for (const raw of wfs.features ?? []) {
    const props = raw.properties ?? {};
    const key = String(props.NOTAM_KEY ?? "");
    const notamNumber = key.match(/^(\d+\/\d+)/)?.[1] ?? key;
    if (!notamNumber || !raw.geometry) continue;
    const meta = byId.get(notamNumber);
    for (const rings of polygonRings(raw.geometry)) {
      const part = partByNotam.get(notamNumber) ?? 0;
      partByNotam.set(notamNumber, part + 1);
      features.push(buildFeature(notamNumber, props, meta, rings, part));
    }
  }
  return { features };
}

function buildFeature(
  notamNumber: string,
  props: Record<string, unknown>,
  meta: TfrListRow | undefined,
  rings: [number, number][][],
  index: number
): TfrFeature {
  const title = String(props.TITLE ?? meta?.description ?? "Temporary flight restriction");
  const type = String(meta?.type ?? props.LEGAL ?? "TFR");
  const description = meta?.description ?? title;
  const window = parseWindow(description);
  const id = index === 0 ? notamNumber : `${notamNumber}-${index + 1}`;
  return {
    type: "Feature",
    id,
    geometry: { type: "Polygon", coordinates: rings },
    properties: {
      id,
      notamNumber,
      reason: reasonFromType(type, title),
      type,
      title,
      facility: meta?.facility ?? (props.CNS_LOCATION_ID ? String(props.CNS_LOCATION_ID) : null),
      state: meta?.state ?? (props.STATE ? String(props.STATE) : null),
      effectiveStart: window.start,
      effectiveEnd: window.end,
      timeZone: window.timeZone,
      effectiveLabel: window.label,
      floorFt: null,
      ceilingFt: null,
      floorLabel: "Not in FAA map feed",
      ceilingLabel: "Not in FAA map feed",
      detailUrl: `https://tfr.faa.gov/tfr3/?page=detail_${notamNumber.replace("/", "_")}.html`,
      description,
    },
  };
}

function reasonFromType(type: string, title: string): string {
  const t = type.toUpperCase();
  if (t.includes("VIP")) return "VIP movement";
  if (t.includes("HAZARD")) {
    return /FIRE|WILDFIRE/i.test(`${title} ${type}`) ? "Wildfire" : "Hazard";
  }
  if (t.includes("SPORT") || t.includes("AIR SHOW") || t.includes("AIRSHOW")) {
    return "Stadium / airshow";
  }
  if (t.includes("UAS") || t.includes("GATHER")) return "Public gathering";
  if (t.includes("SPACE")) return "Space operations";
  if (t.includes("SECURITY")) return "Security";
  return type || "Temporary flight restriction";
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseWindow(description: string): {
  start: string | null;
  end: string | null;
  timeZone: "UTC" | "Local" | null;
  label: string | null;
} {
  const dates = [...description.matchAll(
    /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/g
  )];
  const iso = dates.map((match) => {
    const month = MONTHS.indexOf(match[1]) + 1;
    return `${match[3]}-${String(month).padStart(2, "0")}-${String(match[2]).padStart(2, "0")}`;
  });
  const timeZone = /UTC/i.test(description)
    ? "UTC"
    : /Local/i.test(description)
      ? "Local"
      : null;
  const through = /through/i.test(description);
  const labelMatch = description.match(
    /((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+\w+\s+\d{1,2},\s+\d{4}(?:\s+through\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+\w+\s+\d{1,2},\s+\d{4})?(?:\s+(?:UTC|Local))?)/i
  );
  return {
    start: iso[0] ?? null,
    end: through ? (iso[1] ?? iso[0] ?? null) : (iso[1] ?? null),
    timeZone,
    label: labelMatch?.[1] ?? null,
  };
}

function polygonRings(geometry: {
  type?: string;
  coordinates?: unknown;
}): [number, number][][][] {
  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates)) {
    const rings = asRings(geometry.coordinates);
    return rings ? [rings] : [];
  }
  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
    const out: [number, number][][][] = [];
    for (const poly of geometry.coordinates) {
      const rings = asRings(poly);
      if (rings) out.push(rings);
    }
    return out;
  }
  return [];
}

function asRings(value: unknown): [number, number][][] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const rings: [number, number][][] = [];
  for (const ring of value) {
    if (!Array.isArray(ring)) return null;
    const points: [number, number][] = [];
    for (const pair of ring) {
      if (!Array.isArray(pair) || pair.length < 2) continue;
      const lon = Number(pair[0]);
      const lat = Number(pair[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      points.push([lon, lat]);
    }
    if (points.length >= 3) rings.push(points);
  }
  return rings.length ? rings : null;
}

function featureIntersects(
  feature: TfrFeature,
  lat: number,
  lng: number,
  radiusNm: number
): boolean {
  const point = { lat, lng };
  for (const ring of feature.geometry.coordinates) {
    const latlng = ring.map(([lon, y]) => ({ lat: y, lng: lon }));
    if (pointInRing(point, latlng)) return true;
    for (const vertex of latlng) {
      if (haversineNm(point, vertex) <= radiusNm) return true;
    }
  }
  const center = centroid(feature);
  return center != null && haversineNm(point, center) <= radiusNm;
}

function pointInRing(point: LatLng, ring: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const yi = ring[i].lat;
    const xi = ring[i].lng;
    const yj = ring[j].lat;
    const xj = ring[j].lng;
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function centroid(feature: TfrFeature): LatLng | null {
  const ring = feature.geometry.coordinates[0];
  if (!ring?.length) return null;
  let lat = 0;
  let lng = 0;
  for (const [lon, y] of ring) {
    lat += y;
    lng += lon;
  }
  return { lat: lat / ring.length, lng: lng / ring.length };
}

function demoTfr(opts: {
  id: string;
  reason: string;
  type: string;
  title: string;
  lat: number;
  lng: number;
  radiusNm: number;
  floorFt: number;
  ceilingFt: number;
  start: string;
  end: string;
  timeZone: "UTC" | "Local";
}): TfrFeature {
  const ring: [number, number][] = [];
  for (let i = 0; i <= 36; i++) {
    const p = destinationPoint({ lat: opts.lat, lng: opts.lng }, (i / 36) * 360, opts.radiusNm);
    ring.push([p.lng, p.lat]);
  }
  return {
    type: "Feature",
    id: opts.id,
    geometry: { type: "Polygon", coordinates: [ring] },
    properties: {
      id: opts.id,
      notamNumber: opts.id,
      reason: opts.reason,
      type: opts.type,
      title: opts.title,
      facility: null,
      state: null,
      effectiveStart: opts.start.slice(0, 10),
      effectiveEnd: opts.end.slice(0, 10),
      timeZone: opts.timeZone,
      effectiveLabel: `${opts.start.slice(0, 16)}Z through ${opts.end.slice(0, 16)}Z`,
      floorFt: opts.floorFt,
      ceilingFt: opts.ceilingFt,
      floorLabel: formatAltitude(opts.floorFt, "floor"),
      ceilingLabel: formatAltitude(opts.ceilingFt, "ceiling"),
      detailUrl: "https://tfr.faa.gov/tfr3/?page=list",
      description: opts.title,
    },
  };
}

export function formatAltitude(ft: number | null, kind: "floor" | "ceiling"): string {
  if (ft == null) return "Not in FAA map feed";
  if (kind === "floor" && ft <= 0) return "SFC";
  if (ft >= 60000) return "UNL";
  if (ft >= 18000) return `FL${String(Math.round(ft / 100)).padStart(3, "0")}`;
  return `${ft.toLocaleString()} ft`;
}

export function tfrStroke(reason: string): string {
  const r = reason.toLowerCase();
  if (r.includes("vip") || r.includes("security")) return "#ff5a4a";
  return "#e0b15a";
}
