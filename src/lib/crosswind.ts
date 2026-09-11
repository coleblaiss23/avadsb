import type { Airport, AirportRunwayEnd } from "@/types";

export interface WindComponents {
  /** Positive = headwind, negative = tailwind (kt) */
  headwindKt: number;
  /** Absolute crosswind magnitude (kt) */
  crosswindKt: number;
  /** Signed crosswind: + from right, − from left */
  crosswindSignedKt: number;
  /** Angle between wind and runway heading (0–180°) */
  angleDeg: number;
}

/**
 * Parse runway number from ident (e.g. "17L" → 17, "H1" → null).
 */
export function runwayNumberFromIdent(ident: string): number | null {
  const m = ident.trim().toUpperCase().match(/^(\d{1,2})/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  if (!Number.isFinite(n) || n < 1 || n > 36) return null;
  return n;
}

/** Approximate magnetic heading from runway number (×10°). */
export function headingFromRunwayIdent(ident: string): number | null {
  const n = runwayNumberFromIdent(ident);
  if (n == null) return null;
  return (n * 10) % 360;
}

function normalizeAngleDiff(deg: number): number {
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}

/**
 * Crosswind / headwind for a runway heading and wind vector.
 * Wind angle and runway heading in true (or consistent) degrees.
 */
export function computeWindComponents(
  windDirDeg: number,
  windSpeedKt: number,
  runwayHeadingDeg: number
): WindComponents {
  const angle = normalizeAngleDiff(windDirDeg - runwayHeadingDeg);
  const rad = (angle * Math.PI) / 180;
  const headwindKt = windSpeedKt * Math.cos(rad);
  const crosswindSignedKt = windSpeedKt * Math.sin(rad);
  return {
    headwindKt: Math.round(headwindKt * 10) / 10,
    crosswindKt: Math.round(Math.abs(crosswindSignedKt) * 10) / 10,
    crosswindSignedKt: Math.round(crosswindSignedKt * 10) / 10,
    angleDeg: Math.round(Math.abs(angle) * 10) / 10,
  };
}

export function crosswindWarning(crosswindKt: number): {
  level: "ok" | "caution" | "warning";
  label: string;
} {
  if (crosswindKt >= 20)
    return { level: "warning", label: "Strong crosswind — check aircraft limits" };
  if (crosswindKt >= 12)
    return { level: "caution", label: "Moderate crosswind" };
  return { level: "ok", label: "Within typical GA limits" };
}

/**
 * Build runway ends from airport catalog (runways[]) or fall back to runwayIdent.
 */
export function runwayEndsForAirport(airport: Airport): AirportRunwayEnd[] {
  if (airport.runways && airport.runways.length > 0) {
    return airport.runways;
  }

  const ident = airport.runwayIdent || "";
  const parts = ident.split("/").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return [];

  return parts.map((id) => {
    const heading =
      headingFromRunwayIdent(id) ??
      0;
    return {
      ident: id,
      headingDegT: heading,
      lengthFt: airport.runwayLength,
      widthFt: airport.runwayWidth,
      surface: airport.surface,
    };
  });
}
