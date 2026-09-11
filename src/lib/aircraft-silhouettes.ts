/**
 * Birds-eye traffic silhouettes for the live radar layer.
 *
 * Marker planforms are GPL-2.0-or-later shapes from wiedehopf/tar1090
 * (same family ADS-B Exchange uses). See `third_party/tar1090-markers/`.
 * Classification rules use public ICAO type designators and ADS-B emitter
 * categories (DO-260B).
 */

import { TAR1090_SHAPES } from "../../third_party/tar1090-markers/shapes";

export type AircraftSilhouette =
  | "heavy_jet"
  | "midsize_jet"
  | "small_jet"
  | "piston_twin"
  | "piston_single"
  | "helicopter"
  | "balloon"
  | "blimp";

export type SilhouetteDef = {
  label: string;
  color: string;
  className: string;
  /**
   * Overall map scale multiplier applied to the upstream tar1090 `w`/`h`
   * (those values are already tuned as pixel sizes at scale=1).
   */
  scale: number;
  /** Balloons drift — don't spin the icon with ADS-B track. */
  noRotate?: boolean;
};

/** Visual metadata + sizing; SVG geometry comes from tar1090 shapes. */
export const SILHOUETTE_STYLE: Record<AircraftSilhouette, SilhouetteDef> = {
  heavy_jet: {
    label: "Heavy",
    color: "#1D4ED8",
    className: "afm-ac--heavy-jet",
    scale: 1.15,
  },
  midsize_jet: {
    label: "Airliner",
    color: "#2563EB",
    className: "afm-ac--midsize-jet",
    scale: 1.12,
  },
  small_jet: {
    label: "Bizjet",
    color: "#60A5FA",
    className: "afm-ac--small-jet",
    scale: 1.2,
  },
  piston_twin: {
    label: "Twin Prop",
    color: "#10B981",
    className: "afm-ac--piston-twin",
    scale: 1.2,
  },
  piston_single: {
    label: "Single Prop",
    color: "#059669",
    className: "afm-ac--piston-single",
    scale: 1.18,
  },
  helicopter: {
    label: "Helicopter",
    color: "#F97316",
    className: "afm-ac--helicopter",
    scale: 1.15,
  },
  balloon: {
    label: "Balloon",
    color: "#F472B6",
    className: "afm-ac--balloon",
    scale: 1.35,
    noRotate: true,
  },
  blimp: {
    label: "Blimp",
    color: "#A78BFA",
    className: "afm-ac--blimp",
    scale: 1.05,
  },
};

/** Pixel size for a silhouette at the given zoom/selection scale. */
export function silhouetteSize(
  kind: AircraftSilhouette,
  zoomScale: number = 1
): { width: number; height: number } {
  const shape = TAR1090_SHAPES[kind];
  const s = SILHOUETTE_STYLE[kind].scale * zoomScale;
  return {
    width: Math.round(shape.w * s),
    height: Math.round(shape.h * s),
  };
}

/** @deprecated Prefer silhouetteSize() / TAR1090_SHAPES */
export const SILHOUETTE_SVG: Record<AircraftSilhouette, string> = {
  heavy_jet: TAR1090_SHAPES.heavy_jet.path,
  midsize_jet: TAR1090_SHAPES.midsize_jet.path,
  small_jet: TAR1090_SHAPES.small_jet.path,
  piston_twin: TAR1090_SHAPES.piston_twin.path,
  piston_single: TAR1090_SHAPES.piston_single.path,
  helicopter: TAR1090_SHAPES.helicopter.path,
  balloon: TAR1090_SHAPES.balloon.path,
  blimp: TAR1090_SHAPES.blimp.path,
};

/** ICAO type designator → silhouette overrides (public Doc 8643 codes). */
const TYPE_OVERRIDES: Record<string, AircraftSilhouette> = {
  A10: "small_jet", A148: "small_jet", A225: "heavy_jet", A3: "small_jet", A37: "small_jet",
  A5: "piston_single", A6: "small_jet", A700: "small_jet", AC80: "piston_twin", AC90: "piston_twin",
  AC95: "piston_twin", AJ27: "small_jet", AJET: "small_jet", AN28: "piston_twin", ARCE: "small_jet",
  AT3: "small_jet", ATG1: "small_jet", B18T: "piston_twin", B190: "piston_twin", B25: "piston_twin",
  B350: "piston_twin", B52: "heavy_jet", B712: "small_jet", B721: "midsize_jet", B722: "midsize_jet",
  BE10: "piston_twin", BE20: "piston_twin", BE30: "piston_twin", BE32: "piston_twin", BE40: "small_jet",
  BE99: "piston_twin", BE9L: "piston_twin", BE9T: "piston_twin", BN2T: "piston_twin", BPOD: "small_jet",
  BU20: "piston_twin", C08T: "small_jet", C125: "piston_twin", C212: "piston_twin", C21T: "piston_twin",
  C22J: "small_jet", C25A: "small_jet", C25B: "small_jet", C25C: "small_jet", C25M: "small_jet",
  C425: "piston_twin", C441: "piston_twin", C46: "piston_twin", C500: "small_jet", C501: "small_jet",
  C510: "small_jet", C525: "small_jet", C526: "small_jet", C550: "small_jet", C551: "small_jet",
  C55B: "small_jet", C560: "small_jet", C56X: "small_jet", C650: "small_jet", C680: "small_jet",
  C68A: "small_jet", C750: "small_jet", C82: "piston_twin", CKUO: "small_jet", CL30: "small_jet",
  CL35: "small_jet", CL60: "small_jet", CRJ1: "small_jet", CRJ2: "small_jet", CRJ7: "small_jet",
  CRJ9: "small_jet", CRJX: "small_jet", CVLP: "piston_twin", D228: "piston_twin", DA36: "small_jet",
  DA50: "midsize_jet", DC10: "heavy_jet", DC3: "piston_twin", DC3S: "piston_twin", DHA3: "piston_twin",
  DHC4: "piston_twin", DHC6: "piston_twin", DLH2: "small_jet", E110: "piston_twin", E135: "small_jet",
  E145: "small_jet", E29E: "small_jet", E45X: "small_jet", E500: "small_jet", E50P: "small_jet",
  E545: "small_jet", E55P: "small_jet", EA50: "small_jet", EFAN: "small_jet", EFUS: "small_jet",
  ELIT: "small_jet", EUFI: "small_jet", F1: "small_jet", F100: "small_jet", F111: "small_jet",
  F117: "small_jet", F14: "small_jet", F15: "small_jet", F22: "small_jet", F2TH: "small_jet",
  F4: "small_jet", F406: "piston_twin", F5: "small_jet", F900: "small_jet", FA50: "small_jet",
  FA5X: "small_jet", FA7X: "small_jet", FA8X: "small_jet", FJ10: "small_jet", FOUG: "small_jet",
  FURY: "small_jet", G150: "small_jet", G3: "midsize_jet", GENI: "small_jet", GL5T: "small_jet",
  GLEX: "small_jet", GLF2: "small_jet", GLF3: "small_jet", GLF4: "small_jet", GLF5: "small_jet",
  GLF6: "small_jet", GSPN: "small_jet", H25A: "small_jet", H25B: "small_jet", H25C: "small_jet",
  HA4T: "midsize_jet", HDJT: "small_jet", HERN: "small_jet", J8A: "small_jet", J8B: "small_jet",
  JH7: "small_jet", JS31: "piston_twin", JS32: "piston_twin", JU52: "piston_twin", L101: "heavy_jet",
  LAE1: "small_jet", LEOP: "small_jet", LJ23: "small_jet", LJ24: "small_jet", LJ25: "small_jet",
  LJ28: "small_jet", LJ31: "small_jet", LJ35: "small_jet", LJ40: "small_jet", LJ45: "small_jet",
  LJ55: "small_jet", LJ60: "small_jet", LJ70: "small_jet", LJ75: "small_jet", LJ85: "small_jet",
  LTNG: "small_jet", M28: "piston_twin", MD11: "heavy_jet", MD81: "small_jet", MD82: "small_jet",
  MD83: "small_jet", MD87: "small_jet", MD88: "small_jet", MD90: "small_jet", ME62: "small_jet",
  METR: "small_jet", MG19: "small_jet", MG25: "small_jet", MG29: "small_jet", MG31: "small_jet",
  MG44: "small_jet", MH02: "small_jet", MS76: "small_jet", MT2: "small_jet", MU2: "piston_twin",
  P180: "piston_twin", P2: "piston_twin", P68T: "piston_twin", PA47: "small_jet", PAT4: "piston_twin",
  PAY1: "piston_twin", PAY2: "piston_twin", PAY3: "piston_twin", PAY4: "piston_twin", PIAE: "small_jet",
  PIT4: "small_jet", PITE: "small_jet", PRM1: "small_jet", PRTS: "small_jet", Q5: "small_jet",
  R721: "midsize_jet", R722: "midsize_jet", RFAL: "small_jet", ROAR: "small_jet", S3: "small_jet",
  S32E: "small_jet", S37: "small_jet", S601: "small_jet", SATA: "small_jet", SB05: "small_jet",
  SC7: "piston_twin", SF50: "small_jet", SJ30: "small_jet", SLCH: "heavy_jet", SM60: "piston_twin",
  SOL1: "small_jet", SOL2: "small_jet", SP33: "small_jet", SR71: "small_jet", SS2: "small_jet",
  SU15: "small_jet", SU24: "small_jet", SU25: "small_jet", SU27: "small_jet", SW2: "piston_twin",
  SW3: "piston_twin", SW4: "piston_twin", T154: "midsize_jet", T2: "small_jet", T22M: "small_jet",
  T37: "small_jet", T38: "small_jet", T4: "small_jet", TJET: "small_jet", TOR: "small_jet",
  TRIM: "piston_twin", TRIS: "piston_twin", TRMA: "piston_twin", TU22: "small_jet", VAUT: "small_jet",
  Y130: "small_jet", Y141: "midsize_jet", YK28: "small_jet", YK38: "midsize_jet", YK40: "midsize_jet",
  YK42: "midsize_jet", YURO: "small_jet",
  BALL: "balloon", SHIP: "blimp",
};

/** Hot-air / gas balloon ICAO types (BALL + AX size classes). */
const BALLOON_RE = /^(BALL|AX[0-9]{1,2}|BB[0-9]|FB[0-9])/i;

/** Airship / blimp ICAO types (SHIP + common Goodyear / Zeppelin codes). */
const BLIMP_RE = /^(SHIP|ZEP|ASRG|GZ20|GZ22|GZ23|N2A|AIRSHIP)/i;

const HELI_RE =
  /^(EC|AS[0-9]|BK|R22|R44|R66|B06|B407|B412|B429|S76|S92|H60|UH60|UH1|AH64|AH1|CH47|CH53|MH60|MD50|MD52|MD60|MD90|A109|A119|A139|A169|AW139|AW169|AW189|H130|H145|H125|H135|H155|H175|S300|B212|B407|B505|EC20|EC30|EC35|EC45|EC55)/i;

const HEAVY_RE =
  /^(B74|B77|B78|A38|A34|A33|A35|A36|A359|A35K|MD11|DC10|B1B|C17(?![0-9])|C5M|C5$|KC10|A124|A225|IL96|IL76|L101|B52)/i;

/** Underwing-engine airliners / large regionals */
const AIRLINER_RE =
  /^(A318|A319|A320|A321|A20N|A21N|A19N|B71|B72|B73|B75|B76|MD8|MD9|BCS1|BCS3|E170|E75[LSW]?|E190|E195|E290|E295|A310|A30B|A306)/i;

/** Aft-engine bizjets, light jets, CRJs, high-performance */
const BIZJET_RE =
  /^(GLF|G[456]|G[27]5|C25|C510|C525|C55B|C560|C56X|C650|C68|C70|C75|CL3|CL6|FA[4578]|F2TH|F900|LJ|EA50|BE40|BE4W|HA4T|HDJT|E50P|E55P|PRM1|MU30|FA10|FA20|SBR1|ASTR|WW24|CRJ|E13|E14|RJ[187]|GALX|H25|SF50|PC24|F15|F16|F18|F22|F35|T38|T45|A10|AJ27)/i;

const TWIN_PROP_RE =
  /^(PA34|PA44|BE55|BE58|BE76|BE95|BE10|BE20|BE30|BE9L|BE9T|BE99|B350|C310|C320|C337|C340|C402|C404|C414|C421|C425|C441|DA42|DA62|P68|BN2|AC50|AC90|AC95|PA30|PA23|PA31|DHC6|DH8A|DH8B|DH8C|DH8D|AT43|AT45|AT72|AT75|SF34|E110|E120|JS31|JS32|MU2|P180|B190|C212|D228)/i;

function normalizeType(raw: string | null | undefined): string {
  return (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Map ICAO type + ADS-B emitter category to a birds-eye silhouette.
 *
 * Lighter-than-air (balloons / blimps) come from:
 * - ICAO special types `BALL` / `SHIP`
 * - ADS-B emitter category `B2` (DO-260B Set B: lighter-than-air)
 * - Groundspeed heuristic when B2 lacks a specific type (slow = balloon)
 */
export function classifySilhouette(
  typeCode: string | null | undefined,
  emitterCategory?: string | null,
  dbFlags?: number,
  groundspeedKt?: number | null
): AircraftSilhouette {
  const type = normalizeType(typeCode);
  const emitter = (emitterCategory ?? "").toUpperCase();

  if (type && TYPE_OVERRIDES[type]) {
    return TYPE_OVERRIDES[type];
  }

  if (type && BALLOON_RE.test(type)) return "balloon";
  if (type && BLIMP_RE.test(type)) return "blimp";

  // ADS-B DO-260B Set B: B2 = lighter-than-air (airship or balloon).
  if (emitter === "B2") {
    if (
      groundspeedKt != null &&
      Number.isFinite(groundspeedKt) &&
      groundspeedKt >= 35
    ) {
      return "blimp";
    }
    return "balloon";
  }

  if (emitter === "A7" || (type && HELI_RE.test(type))) {
    return "helicopter";
  }

  if (type && HEAVY_RE.test(type)) return "heavy_jet";
  if (emitter === "A5" || emitter === "A4") return "heavy_jet";

  if (type && AIRLINER_RE.test(type)) return "midsize_jet";
  if (emitter === "A3") return "midsize_jet";

  if (type && BIZJET_RE.test(type)) return "small_jet";
  if (emitter === "A6") return "small_jet";

  if (type && TWIN_PROP_RE.test(type)) return "piston_twin";

  // ADS-B A2 = Small (15.5k–75k lb): light jets & larger GA
  if (emitter === "A2") {
    if (type && /^(C|L|BE|EA|MU|FA|HA|PR|SF|PC|HD|WW|SB|AS)/.test(type)) {
      return "small_jet";
    }
    return "piston_twin";
  }

  if ((dbFlags ?? 0) & 1) return "small_jet";

  return "piston_single";
}

/**
 * Render a tar1090 marker SVG the same way upstream does
 * (`svgShapeToSVG`: stroke = 2 × base × strokeScale, paint-order stroke).
 *
 * @param sizePx  Target max dimension in CSS pixels (defaults to scaled w/h).
 */
export function silhouetteSvgMarkup(
  kind: AircraftSilhouette,
  color: string,
  sizePx?: number,
  stroke: string = "#0a0a0a"
): string {
  const shape = TAR1090_SHAPES[kind];
  const native = silhouetteSize(kind, 1);
  const maxNative = Math.max(native.width, native.height);
  const target = sizePx ?? maxNative;
  const scale = target / Math.max(shape.w, shape.h);
  const wi = Math.round(shape.w * scale);
  const he = Math.round(shape.h * scale);
  // Match tar1090 stroke formula with a ~0.55 base so heli (strokeScale 3) stays sane
  const strokeWidth = 2 * 0.55 * shape.strokeScale;
  return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="${shape.viewBox}" width="${wi}" height="${he}" aria-hidden="true"><path paint-order="stroke" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" d="${shape.path}"/></svg>`;
}

/** ADS-B reports `alt_baro: "ground"` which we normalize to 0. */
export function isAircraftOnGround(altBaro: number | null): boolean {
  return altBaro === 0;
}

const GROUND_FILL = "#94A3B8";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/** Mix toward black (amount 0–1) or white (negative amount = lighten via invert). */
function shadeHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (amount >= 0) {
    // Darken toward black
    const t = clamp01(amount);
    return rgbToHex(r * (1 - t), g * (1 - t), b * (1 - t));
  }
  // Lighten toward white
  const t = clamp01(-amount);
  return rgbToHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
}

/**
 * Ground = slate gray. Airborne = category hue, darker near the surface and
 * lighter at cruise / high altitude (roughly surface → FL450).
 * Prefer altitudeRainbowColor() for the live radar palette.
 */
export function aircraftMarkerColor(
  category: AircraftSilhouette,
  altBaro: number | null
): string {
  if (isAircraftOnGround(altBaro)) return GROUND_FILL;
  const base = SILHOUETTE_STYLE[category].color;
  if (altBaro == null || !Number.isFinite(altBaro)) return base;

  const clamped = Math.max(100, Math.min(45000, altBaro));
  const t = (clamped - 100) / (45000 - 100);
  const shade = 0.22 - t * 0.5;
  return shadeHex(base, shade);
}

/** Coarse band so marker icons rebuild when altitude changes meaningfully. */
export function altitudeColorBand(altBaro: number | null): string {
  if (isAircraftOnGround(altBaro)) return "gnd";
  if (altBaro == null) return "unk";
  return String(Math.floor(altBaro / 2500));
}
