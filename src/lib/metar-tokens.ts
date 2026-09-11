/**
 * Plain-English explanations for common METAR tokens (hover / tap tooltips).
 */

export type MetarTokenExplain = {
  token: string;
  title: string;
  detail: string;
};

const WX_PHENOMENA: Record<string, string> = {
  RA: "Rain",
  DZ: "Drizzle",
  SN: "Snow",
  SG: "Snow grains",
  IC: "Ice crystals",
  PL: "Ice pellets",
  GR: "Hail",
  GS: "Small hail / snow pellets",
  UP: "Unknown precipitation",
  BR: "Mist (visibility ≥ 5/8 SM)",
  FG: "Fog (visibility < 5/8 SM)",
  FU: "Smoke",
  VA: "Volcanic ash",
  DU: "Dust",
  SA: "Sand",
  HZ: "Haze",
  PY: "Spray",
  PO: "Dust/sand whirls",
  SQ: "Squalls",
  FC: "Funnel cloud / tornado / waterspout",
  SS: "Sandstorm",
  DS: "Duststorm",
  TS: "Thunderstorm",
  SH: "Showers",
  FZ: "Freezing",
  BL: "Blowing",
  DR: "Low drifting",
  MI: "Shallow",
  BC: "Patches",
  PR: "Partial",
  VC: "In the vicinity",
};

function explainWind(token: string): MetarTokenExplain | null {
  const m = token.match(/^(\d{3}|VRB)(\d{2,3})(G(\d{2,3}))?KT$/i);
  if (!m) return null;
  const dir = m[1].toUpperCase();
  const spd = Number(m[2]);
  const gust = m[4] ? Number(m[4]) : null;
  const dirText =
    dir === "VRB"
      ? "variable direction"
      : `from ${dir}° true (${String(dir).padStart(3, "0")})`;
  const gustText =
    gust != null ? `, gusting to ${gust} knots` : "";
  return {
    token,
    title: "Wind",
    detail: `Wind ${dirText} at ${spd} knots${gustText}.`,
  };
}

function explainVisibility(token: string): MetarTokenExplain | null {
  if (/^P?\d+SM$/i.test(token) || /^\d+\/\d+SM$/i.test(token)) {
    const body = token.replace(/SM$/i, "");
    const plus = body.startsWith("P") ? "greater than " : "";
    const val = body.replace(/^P/, "");
    return {
      token,
      title: "Visibility",
      detail: `Prevailing visibility ${plus}${val} statute miles.`,
    };
  }
  if (/^\d{4}$/.test(token)) {
    return {
      token,
      title: "Visibility",
      detail: `Visibility ${Number(token)} meters (ICAO format).`,
    };
  }
  return null;
}

function explainCloud(token: string): MetarTokenExplain | null {
  const m = token.match(/^(FEW|SCT|BKN|OVC|VV|CLR|SKC|NSC|NCD|CAVOK)(\d{3})?(CB|TCU)?$/i);
  if (!m) return null;
  const cover = m[1].toUpperCase();
  const base = m[2] ? Number(m[2]) * 100 : null;
  const type = m[3]?.toUpperCase();

  const coverWords: Record<string, string> = {
    FEW: "Few clouds (1–2 oktas)",
    SCT: "Scattered clouds (3–4 oktas)",
    BKN: "Broken clouds (5–7 oktas) — this is a ceiling",
    OVC: "Overcast (8 oktas) — this is a ceiling",
    VV: "Vertical visibility (into obscuration)",
    CLR: "Clear below 12,000 ft (automated)",
    SKC: "Sky clear",
    NSC: "No significant cloud",
    NCD: "No cloud detected",
    CAVOK: "Ceiling and visibility OK (ICAO)",
  };

  let detail = coverWords[cover] ?? cover;
  if (base != null) detail += ` with base around ${base.toLocaleString()} ft AGL`;
  if (type === "CB") detail += ", cumulonimbus";
  if (type === "TCU") detail += ", towering cumulus";
  detail += ".";

  return { token, title: "Sky condition", detail };
}

function explainAltimeter(token: string): MetarTokenExplain | null {
  const us = token.match(/^A(\d{4})$/i);
  if (us) {
    const inHg = (Number(us[1]) / 100).toFixed(2);
    return {
      token,
      title: "Altimeter",
      detail: `Altimeter setting ${inHg} inHg.`,
    };
  }
  const q = token.match(/^Q(\d{4})$/i);
  if (q) {
    return {
      token,
      title: "QNH",
      detail: `Altimeter setting ${q[1]} hPa (QNH).`,
    };
  }
  return null;
}

function explainTempDew(token: string): MetarTokenExplain | null {
  const m = token.match(/^(M?\d{2})\/(M?\d{2})$/i);
  if (!m) return null;
  const parse = (s: string) =>
    s.toUpperCase().startsWith("M") ? -Number(s.slice(1)) : Number(s);
  const t = parse(m[1]);
  const d = parse(m[2]);
  return {
    token,
    title: "Temperature / dewpoint",
    detail: `Temperature ${t}°C, dewpoint ${d}°C.`,
  };
}

function explainWeather(token: string): MetarTokenExplain | null {
  const m = token.match(/^([+-]|VC)?((?:MI|PR|BC|DR|BL|SH|TS|FZ)*)((?:[A-Z]{2})+)$/i);
  if (!m) return null;
  const intensity = m[1]?.toUpperCase() ?? "";
  const descriptors = m[2]?.toUpperCase() ?? "";
  const phenom = m[3]?.toUpperCase() ?? "";

  const intensityWord =
    intensity === "+"
      ? "Heavy "
      : intensity === "-"
        ? "Light "
        : intensity === "VC"
          ? "Vicinity "
          : "";

  const parts: string[] = [];
  for (let i = 0; i < descriptors.length; i += 2) {
    const d = descriptors.slice(i, i + 2);
    if (WX_PHENOMENA[d]) parts.push(WX_PHENOMENA[d].toLowerCase());
  }
  for (let i = 0; i < phenom.length; i += 2) {
    const p = phenom.slice(i, i + 2);
    if (WX_PHENOMENA[p]) parts.push(WX_PHENOMENA[p].toLowerCase());
  }
  if (!parts.length) return null;

  return {
    token,
    title: "Weather",
    detail: `${intensityWord}${parts.join(", ")}.`,
  };
}

function explainRvr(token: string): MetarTokenExplain | null {
  if (!/^R\d{2}[LCR]?\/P?\d{4}/i.test(token)) return null;
  return {
    token,
    title: "RVR",
    detail: "Runway visual range for the indicated runway (feet or meters per report).",
  };
}

/** Explain a single METAR token, or null if unknown. */
export function explainMetarToken(token: string): MetarTokenExplain | null {
  const t = token.trim();
  if (!t) return null;

  return (
    explainWind(t) ||
    explainVisibility(t) ||
    explainCloud(t) ||
    explainAltimeter(t) ||
    explainTempDew(t) ||
    explainRvr(t) ||
    explainWeather(t) ||
    (/^AUTO$/i.test(t)
      ? {
          token: t,
          title: "Automated",
          detail: "Observation from an automated station (ASOS/AWOS).",
        }
      : null) ||
    (/^SPECI$/i.test(t)
      ? {
          token: t,
          title: "Special",
          detail: "Special observation issued between routine METARs.",
        }
      : null) ||
    (/^[A-Z]{4}$/.test(t)
      ? {
          token: t,
          title: "Station",
          detail: `ICAO station identifier ${t}.`,
        }
      : null)
  );
}

/** Split a raw METAR into tokens for interactive decoding. */
export function tokenizeMetar(raw: string): string[] {
  return raw.trim().split(/\s+/).filter(Boolean);
}
