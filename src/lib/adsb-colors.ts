/**
 * Altitude coloring snapped to legend buckets — no RGB interpolation.
 * Fills are slightly less saturated than raw neon so icons stay the brightest
 * thing on a muted basemap without looking washed or filmy.
 */

export const ADSB_GROUND_COLOR = "#657165";
export const ADSB_UNKNOWN_COLOR = "#6F777F";

/** Legend stops used by the map altitude scale (feet MSL). */
export const ADSB_ALT_LEGEND: { ft: number; label: string; color: string }[] = [
  { ft: 0, label: "GND", color: ADSB_GROUND_COLOR },
  { ft: 500, label: "500 ft", color: "#7717BA" },
  { ft: 2000, label: "2,000 ft", color: "#1717BA" },
  { ft: 5000, label: "5,000 ft", color: "#1797BA" },
  { ft: 10000, label: "10,000 ft", color: "#17BA17" },
  { ft: 20000, label: "20,000 ft", color: "#BABA17" },
  { ft: 30000, label: "30,000 ft", color: "#BA9717" },
  { ft: 40000, label: "40,000 ft", color: "#BA1717" },
];

const AIR_BUCKETS = ADSB_ALT_LEGEND.filter((row) => row.ft > 0);

/** Nearest legend stop — exact swatch hex, never a blend between buckets. */
export function altitudeRainbowColor(altBaro: number | null): string {
  if (altBaro === 0) return ADSB_GROUND_COLOR;
  if (altBaro == null || !Number.isFinite(altBaro) || altBaro < 0) {
    return ADSB_UNKNOWN_COLOR;
  }

  let nearest = AIR_BUCKETS[0];
  let best = Math.abs(altBaro - nearest.ft);
  for (let i = 1; i < AIR_BUCKETS.length; i++) {
    const row = AIR_BUCKETS[i];
    const dist = Math.abs(altBaro - row.ft);
    if (dist < best) {
      nearest = row;
      best = dist;
    }
  }
  return nearest.color;
}

/** Bucket id so marker icons rebuild only when the swatch changes. */
export function altitudeRainbowBand(altBaro: number | null): string {
  if (altBaro === 0) return "GND";
  if (altBaro == null || !Number.isFinite(altBaro)) return "unk";
  return altitudeRainbowColor(altBaro);
}
