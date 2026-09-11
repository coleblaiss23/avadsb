import type { CorridorGeometry, LatLng } from "@/types";

/** Earth radius in nautical miles */
const EARTH_RADIUS_NM = 3440.065;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Vertical pixel offsets so nearby map tags don't occupy the same slot.
 * Earlier points keep slot 0; later ones step up the leader line.
 */
export function labelCollisionOffsets(
  points: { id: string; lat: number; lng: number }[],
  minSeparationNm = 14
): Map<string, number> {
  const placed: { lat: number; lng: number; slot: number }[] = [];
  const offsets = new Map<string, number>();
  for (const p of points) {
    let slot = 0;
    while (
      slot < 5 &&
      placed.some(
        (q) =>
          q.slot === slot &&
          haversineNm(
            { lat: p.lat, lng: p.lng },
            { lat: q.lat, lng: q.lng }
          ) < minSeparationNm
      )
    ) {
      slot += 1;
    }
    placed.push({ lat: p.lat, lng: p.lng, slot });
    offsets.set(p.id, slot * 28);
  }
  return offsets;
}

/** Haversine great-circle distance in nautical miles. */
export function haversineNm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_NM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial true course (degrees) from a → b. */
export function initialBearingDeg(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Smallest absolute difference between two bearings (0–180). */
export function bearingDiffDeg(a: number, b: number): number {
  return Math.abs(((((a - b) % 360) + 540) % 360) - 180);
}

/** Destination point given start, bearing (deg), and distance (nm). */
export function destinationPoint(
  start: LatLng,
  bearingDeg: number,
  distanceNm: number
): LatLng {
  const δ = distanceNm / EARTH_RADIUS_NM;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(start.lat);
  const λ1 = toRad(start.lng);

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );

  return { lat: toDeg(φ2), lng: ((toDeg(λ2) + 540) % 360) - 180 };
}

/**
 * Cross-track distance (nm) of point P from great-circle A→B.
 * Positive = right of track, negative = left.
 */
export function crossTrackNm(origin: LatLng, dest: LatLng, point: LatLng): number {
  const d13 = haversineNm(origin, point) / EARTH_RADIUS_NM;
  const θ13 = toRad(initialBearingDeg(origin, point));
  const θ12 = toRad(initialBearingDeg(origin, dest));

  return (
    Math.asin(Math.sin(d13) * Math.sin(θ13 - θ12)) * EARTH_RADIUS_NM
  );
}

/** Along-track distance (nm) from origin toward dest to the closest point on track to P. */
export function alongTrackNm(origin: LatLng, dest: LatLng, point: LatLng): number {
  const d13 = haversineNm(origin, point) / EARTH_RADIUS_NM;
  const xt = crossTrackNm(origin, dest, point) / EARTH_RADIUS_NM;
  return Math.acos(Math.cos(d13) / Math.cos(xt)) * EARTH_RADIUS_NM;
}

/**
 * Build a corridor polygon: rectangular buffer of `halfWidthNm` around the
 * great-circle from origin to destination (plus end caps).
 */
export function buildCorridor(
  origin: LatLng,
  dest: LatLng,
  halfWidthNm: number
): CorridorGeometry {
  const directDistanceNm = haversineNm(origin, dest);
  const course = initialBearingDeg(origin, dest);
  const left = (course + 270) % 360;
  const right = (course + 90) % 360;
  const back = (course + 180) % 360;

  // Slight end-cap extension so origin/dest airports aren't clipped.
  const pad = Math.min(halfWidthNm, 5);
  const start = destinationPoint(origin, back, pad);
  const end = destinationPoint(dest, course, pad);

  const sw = destinationPoint(start, left, halfWidthNm);
  const se = destinationPoint(start, right, halfWidthNm);
  const ne = destinationPoint(end, right, halfWidthNm);
  const nw = destinationPoint(end, left, halfWidthNm);

  return {
    directLine: [origin, dest],
    polygon: [sw, se, ne, nw, sw],
    directDistanceNm,
  };
}

/**
 * True if airport is within the corridor: cross-track ≤ halfWidth and
 * along-track between 0 and direct distance (with small pad).
 */
export function isWithinCorridor(
  origin: LatLng,
  dest: LatLng,
  point: LatLng,
  halfWidthNm: number,
  directDistanceNm: number
): boolean {
  const xt = Math.abs(crossTrackNm(origin, dest, point));
  if (xt > halfWidthNm) return false;

  const at = alongTrackNm(origin, dest, point);
  const pad = halfWidthNm * 0.5;
  return at >= -pad && at <= directDistanceNm + pad;
}

/** Great-circle samples from a → b (inclusive), for drawing a route arc. */
export function greatCirclePath(
  a: LatLng,
  b: LatLng,
  steps = 32
): LatLng[] {
  const lat1 = toRad(a.lat);
  const lon1 = toRad(a.lng);
  const lat2 = toRad(b.lat);
  const lon2 = toRad(b.lng);
  const d = 2 * Math.asin(
    Math.min(
      1,
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
      )
    )
  );
  if (d < 1e-6) return [a, b];

  const points: LatLng[] = [];
  const n = Math.max(2, steps);
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    points.push({
      lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
      lng: ((toDeg(Math.atan2(y, x)) + 540) % 360) - 180,
    });
  }
  return points;
}

/** Extra path distance (nm) for origin → stop → dest vs direct. */
export function detourExtraNm(
  origin: LatLng,
  stop: LatLng,
  dest: LatLng,
  directNm: number
): number {
  return haversineNm(origin, stop) + haversineNm(stop, dest) - directNm;
}
