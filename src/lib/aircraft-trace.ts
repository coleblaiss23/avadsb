/**
 * readsb / adsb.lol globe trace helpers (recent + full day JSON).
 * Trace rows: [offsetSec, lat, lon, alt_baro, gs, track, ...]
 */

export type TraceLatLng = [number, number];

type TraceRow = {
  lat: number;
  lon: number;
  alt: number | null;
  ground: boolean;
};

function isGroundAlt(alt: unknown): boolean {
  if (alt == null) return false;
  if (typeof alt === "string") return alt.toLowerCase() === "ground";
  return typeof alt === "number" && Number.isFinite(alt) && alt <= 0;
}

function parseAlt(alt: unknown): number | null {
  if (alt == null) return null;
  if (typeof alt === "string") {
    if (alt.toLowerCase() === "ground") return 0;
    const n = Number(alt);
    return Number.isFinite(n) ? n : null;
  }
  return typeof alt === "number" && Number.isFinite(alt) ? alt : null;
}

/** Parse a readsb trace payload into ordered lat/lon rows. */
export function parseReadsbTrace(payload: unknown): TraceRow[] {
  if (!payload || typeof payload !== "object") return [];
  const trace = (payload as { trace?: unknown }).trace;
  if (!Array.isArray(trace)) return [];

  const out: TraceRow[] = [];
  for (const row of trace) {
    if (!Array.isArray(row) || row.length < 3) continue;
    const lat = Number(row[1]);
    const lon = Number(row[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    const ground = isGroundAlt(row[3]);
    out.push({ lat, lon, alt: parseAlt(row[3]), ground });
  }
  return out;
}

/**
 * Keep the current flight: from the last takeoff (ground → airborne)
 * through the latest point. Falls back to the full day if no takeoff found.
 */
export function sliceCurrentFlight(rows: TraceRow[]): TraceLatLng[] {
  if (rows.length === 0) return [];

  let takeoffIdx = 0;
  for (let i = 0; i < rows.length - 1; i++) {
    if (rows[i]!.ground && !rows[i + 1]!.ground) {
      takeoffIdx = i;
    }
  }

  const slice = rows.slice(takeoffIdx);
  return slice.map((r) => [r.lat, r.lon] as TraceLatLng);
}

/** Evenly thin a polyline so Leaflet stays snappy. */
export function downsampleTrace(
  points: TraceLatLng[],
  maxPoints = 700
): TraceLatLng[] {
  if (points.length <= maxPoints) return points;
  const stride = Math.ceil(points.length / maxPoints);
  const out: TraceLatLng[] = [];
  for (let i = 0; i < points.length; i += stride) {
    out.push(points[i]!);
  }
  const last = points[points.length - 1]!;
  const prev = out[out.length - 1];
  if (!prev || prev[0] !== last[0] || prev[1] !== last[1]) {
    out.push(last);
  }
  return out;
}

export function buildFlightPath(payload: unknown): TraceLatLng[] {
  const rows = parseReadsbTrace(payload);
  return downsampleTrace(sliceCurrentFlight(rows));
}
