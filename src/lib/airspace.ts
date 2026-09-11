/**
 * FAA Class Airspace styling for the night-vision radar palette.
 * Sectional conventions (blue B, magenta C, dashed blue D) adapted to amber/cyan outlines.
 */

export type AirspaceClass = "B" | "C" | "D" | "E";

export type AirspaceProperties = {
  name: string | null;
  class: AirspaceClass;
  ident: string | null;
  localType: string | null;
  lowerVal: number | null;
  upperVal: number | null;
  lowerUom: string | null;
  upperUom: string | null;
  lowerCode: string | null;
  upperCode: string | null;
};

export type AirspaceFeature = {
  type: "Feature";
  properties: AirspaceProperties;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
};

export type AirspaceCollection = {
  type: "FeatureCollection";
  features: AirspaceFeature[];
};

export type AirspaceStyle = {
  stroke: string;
  fill: string;
  weight: number;
  dashArray?: string;
  fillOpacity: number;
  opacity: number;
};

/** Low-opacity fills so traffic underneath stays readable. */
export const AIRSPACE_STYLE: Record<AirspaceClass, AirspaceStyle> = {
  B: {
    // Sectional: solid blue → cyan outline on dark scope
    stroke: "#7a9eaa",
    fill: "#7a9eaa",
    weight: 1.6,
    fillOpacity: 0.06,
    opacity: 0.85,
  },
  C: {
    // Sectional: magenta → amber/magenta mix
    stroke: "#c989a8",
    fill: "#c989a8",
    weight: 1.4,
    fillOpacity: 0.05,
    opacity: 0.8,
  },
  D: {
    // Sectional: dashed blue
    stroke: "#8eb4c0",
    fill: "#8eb4c0",
    weight: 1.2,
    dashArray: "6 5",
    fillOpacity: 0.04,
    opacity: 0.75,
  },
  E: {
    // Surface E — soft amber dashed
    stroke: "#c4a574",
    fill: "#c4a574",
    weight: 1,
    dashArray: "4 6",
    fillOpacity: 0.03,
    opacity: 0.65,
  },
};

function fmtLevel(
  val: number | null,
  uom: string | null,
  code: string | null
): string {
  if (code) {
    const c = code.toUpperCase();
    if (c === "SFC" || c === "GND" || c === "GROUND") return "SFC";
    if (c === "UNLTD" || c === "UNLIMITED") return "UNL";
  }
  if (val == null || !Number.isFinite(val)) return "?";
  // FAA sentinel for “unlimited / not charted that way”
  if (val <= -9000) return "UNL";
  if (val === 0) return "SFC";
  const unit = (uom || "FT").toUpperCase();
  if (unit.startsWith("FL") || unit === "FL") {
    return `FL${String(Math.round(val)).padStart(3, "0")}`;
  }
  // Values stored as feet MSL in this dataset
  if (val >= 18_000) return `FL${String(Math.round(val / 100)).padStart(3, "0")}`;
  return `${Math.round(val).toLocaleString()}′`;
}

/** Floor/ceiling label for high-zoom overlays. */
export function airspaceAltLabel(props: AirspaceProperties): string {
  const lo = fmtLevel(props.lowerVal, props.lowerUom, props.lowerCode);
  const hi = fmtLevel(props.upperVal, props.upperUom, props.upperCode);
  return `${props.class} ${lo}–${hi}`;
}

export function isAirspaceClass(v: unknown): v is AirspaceClass {
  return v === "B" || v === "C" || v === "D" || v === "E";
}

/** Leaflet path options for a class. */
export function airspacePathOptions(cls: AirspaceClass) {
  const s = AIRSPACE_STYLE[cls];
  return {
    color: s.stroke,
    fillColor: s.fill,
    weight: s.weight,
    opacity: s.opacity,
    fillOpacity: s.fillOpacity,
    dashArray: s.dashArray,
    lineCap: "round" as const,
    lineJoin: "round" as const,
  };
}
