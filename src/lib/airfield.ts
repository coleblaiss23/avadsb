import { bearingDiffDeg, destinationPoint, haversineNm, initialBearingDeg } from "@/lib/geo";
import type { LatLng } from "@/types";

const METERS_PER_NM = 1852;

export type AirfieldKind = "runway" | "taxiway";

export type AirfieldPavement = {
  id: string;
  kind: AirfieldKind;
  ref: string | null;
  /** [lat, lon] along the way. Closed rings repeat the first point. */
  path: [number, number][];
  area: boolean;
  widthM: number;
  closed: boolean;
};

export type PavementLabel = {
  id: string;
  kind: AirfieldKind;
  text: string;
  lat: number;
  lon: number;
};

type OverpassElement = {
  type?: string;
  id?: number;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
};

const DEFAULT_RUNWAY_WIDTH_M = 30;
const DEFAULT_TAXIWAY_WIDTH_M = 18;

export function parseOverpassAirfield(json: unknown): AirfieldPavement[] {
  const elements = (json as { elements?: OverpassElement[] } | null)?.elements;
  if (!Array.isArray(elements)) return [];

  const out: AirfieldPavement[] = [];
  for (const el of elements) {
    if (el.type !== "way" || el.id == null || !el.geometry || el.geometry.length < 2) {
      continue;
    }
    const tags = el.tags ?? {};
    const aeroway = tags.aeroway;
    if (aeroway !== "runway" && aeroway !== "taxiway" && aeroway !== "taxilane") {
      continue;
    }
    const path: [number, number][] = [];
    for (const p of el.geometry) {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;
      path.push([p.lat, p.lon]);
    }
    if (path.length < 2) continue;

    const kind: AirfieldKind = aeroway === "runway" ? "runway" : "taxiway";
    const area = isClosedRing(path);
    out.push({
      id: String(el.id),
      kind,
      ref: pavementRef(tags),
      path,
      area,
      widthM: parseWidthMeters(tags.width) ?? (kind === "runway" ? DEFAULT_RUNWAY_WIDTH_M : DEFAULT_TAXIWAY_WIDTH_M),
      closed: tags.abandoned === "yes" || tags.disused === "yes",
    });
    if (out.length >= 900) break;
  }
  return out;
}

export function runwayPolygon(feature: AirfieldPavement): [number, number][] | null {
  if (feature.kind !== "runway" || feature.path.length < 2) return null;
  if (feature.area && feature.path.length >= 4) return feature.path;
  const ends = lineEnds(feature.path);
  if (!ends) return null;
  return bufferSegment(ends[0], ends[1], feature.widthM);
}

export function pavementLabels(features: AirfieldPavement[]): PavementLabel[] {
  const labels: PavementLabel[] = [];
  for (const feature of features) {
    if (!feature.ref || feature.closed) continue;
    if (feature.kind === "runway") {
      const ends = feature.area ? thresholdEnds(feature.path) : lineEnds(feature.path);
      if (!ends) continue;
      const [start, end] = ends;
      const assigned = assignRunwayNumbers(feature.ref, start, end);
      for (const item of assigned) {
        const nudged = nudgeOutward(item.at, item.at === start ? end : start, 55);
        labels.push({
          id: `${feature.id}-${item.text}`,
          kind: "runway",
          text: item.text,
          lat: nudged.lat,
          lon: nudged.lng,
        });
      }
      continue;
    }
    const spots = sampleAlong(feature.path, 280);
    spots.forEach((at, index) => {
      labels.push({
        id: `${feature.id}-${feature.ref}-${index}`,
        kind: "taxiway",
        text: feature.ref!,
        lat: at.lat,
        lon: at.lng,
      });
    });
  }
  return labels;
}

function pavementRef(tags: Record<string, string>): string | null {
  const ref = (tags.ref || "").trim().toUpperCase();
  if (ref && ref.length <= 8 && !ref.includes(" ")) return ref;
  const name = (tags.name || "").trim().toUpperCase();
  const fromName = name.replace(/^TAXIWAY\s+/, "").replace(/^RWY\s+/, "");
  if (fromName && fromName.length <= 7 && !fromName.includes(" ")) return fromName;
  return null;
}

function parseWidthMeters(raw: string | undefined): number | null {
  if (!raw) return null;
  const text = raw.trim().toLowerCase();
  const n = Number.parseFloat(text);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (text.includes("ft") || text.includes("'")) return n * 0.3048;
  if (n > 200) return n * 0.3048;
  return n;
}

function isClosedRing(path: [number, number][]): boolean {
  if (path.length < 4) return false;
  const a = path[0];
  const b = path[path.length - 1];
  return Math.abs(a[0] - b[0]) < 1e-5 && Math.abs(a[1] - b[1]) < 1e-5;
}

function toLatLng(p: [number, number]): LatLng {
  return { lat: p[0], lng: p[1] };
}

function lineEnds(path: [number, number][]): [LatLng, LatLng] | null {
  if (path.length < 2) return null;
  return [toLatLng(path[0]), toLatLng(path[path.length - 1])];
}

function sampleAlong(path: [number, number][], spacingM: number): LatLng[] {
  if (path.length < 2) return [];
  const points: LatLng[] = [];
  let since = spacingM * 0.45;
  let prev = toLatLng(path[0]);
  for (let i = 1; i < path.length; i++) {
    const cur = toLatLng(path[i]);
    const seg = haversineNm(prev, cur) * METERS_PER_NM;
    if (seg <= 1) {
      prev = cur;
      continue;
    }
    let walked = 0;
    while (since + (seg - walked) >= spacingM) {
      const need = spacingM - since;
      const t = (walked + need) / seg;
      points.push({
        lat: prev.lat + (cur.lat - prev.lat) * t,
        lng: prev.lng + (cur.lng - prev.lng) * t,
      });
      walked += need;
      since = 0;
      if (points.length >= 24) return points;
    }
    since += seg - walked;
    prev = cur;
  }
  if (points.length === 0) {
    const mid = midpoint(path);
    if (mid) points.push(mid);
  }
  return points;
}

function midpoint(path: [number, number][]): LatLng | null {
  if (path.length === 0) return null;
  const i = Math.floor((path.length - 1) / 2);
  const a = path[i];
  const b = path[Math.min(i + 1, path.length - 1)];
  return { lat: (a[0] + b[0]) / 2, lng: (a[1] + b[1]) / 2 };
}

function bufferSegment(start: LatLng, end: LatLng, widthM: number): [number, number][] {
  const bearing = initialBearingDeg(start, end);
  const halfNm = Math.max(widthM, 12) / 2 / METERS_PER_NM;
  const left = (bearing + 270) % 360;
  const right = (bearing + 90) % 360;
  const a = destinationPoint(start, left, halfNm);
  const b = destinationPoint(end, left, halfNm);
  const c = destinationPoint(end, right, halfNm);
  const d = destinationPoint(start, right, halfNm);
  return [
    [a.lat, a.lng],
    [b.lat, b.lng],
    [c.lat, c.lng],
    [d.lat, d.lng],
  ];
}

function thresholdEnds(path: [number, number][]): [LatLng, LatLng] | null {
  const pts = isClosedRing(path) ? path.slice(0, -1) : path;
  if (pts.length < 2) return null;
  if (pts.length < 4) return lineEnds(path);

  const edges = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const a = toLatLng(p);
    const b = toLatLng(q);
    return {
      len: haversineNm(a, b),
      mid: { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 },
      bearing: initialBearingDeg(a, b),
    };
  });
  const longest = edges.reduce((best, edge) => (edge.len > best.len ? edge : best));
  const shorts = edges.filter((edge) => {
    const diff = bearingDiffDeg(edge.bearing, longest.bearing);
    return diff > 55 && diff < 125;
  });
  let best: [LatLng, LatLng] | null = null;
  let bestD = 0;
  for (let i = 0; i < shorts.length; i++) {
    for (let j = i + 1; j < shorts.length; j++) {
      const d = haversineNm(shorts[i].mid, shorts[j].mid);
      if (d > bestD) {
        bestD = d;
        best = [shorts[i].mid, shorts[j].mid];
      }
    }
  }
  return best ?? lineEnds(path);
}

function runwayHeadingFromIdent(ident: string): number | null {
  const match = ident.trim().toUpperCase().match(/^(\d{1,2})/);
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  if (!Number.isFinite(n) || n < 1 || n > 36) return null;
  return (n * 10) % 360;
}

function assignRunwayNumbers(
  ref: string,
  start: LatLng,
  end: LatLng
): { text: string; at: LatLng }[] {
  const parts = ref
    .split(/[\/;]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return [];
  if (parts.length === 1) return [{ text: parts[0], at: start }];

  const bearing = initialBearingDeg(start, end);
  const h0 = runwayHeadingFromIdent(parts[0]);
  const h1 = runwayHeadingFromIdent(parts[1]);
  if (h0 == null || h1 == null) {
    return [
      { text: parts[0], at: start },
      { text: parts[1], at: end },
    ];
  }
  const startGetsFirst = bearingDiffDeg(bearing, h0) <= bearingDiffDeg(bearing, h1);
  return startGetsFirst
    ? [
        { text: parts[0], at: start },
        { text: parts[1], at: end },
      ]
    : [
        { text: parts[1], at: start },
        { text: parts[0], at: end },
      ];
}

function nudgeOutward(point: LatLng, other: LatLng, meters: number): LatLng {
  const bearing = initialBearingDeg(other, point);
  return destinationPoint(point, bearing, meters / METERS_PER_NM);
}
