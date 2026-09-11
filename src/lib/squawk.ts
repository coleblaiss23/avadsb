/** Common Mode-A squawk meanings (US / ICAO discrete codes). */

export type SquawkSeverity = "info" | "caution" | "emergency";

export type SquawkMeaning = {
  code: string;
  title: string;
  summary: string;
  severity: SquawkSeverity;
};

const KNOWN: Record<string, Omit<SquawkMeaning, "code">> = {
  "1200": {
    title: "VFR",
    summary: "Standard VFR squawk in the United States when not assigned a discrete code.",
    severity: "info",
  },
  "1202": {
    title: "Glider",
    summary: "Often used by gliders operating under VFR (local procedures may vary).",
    severity: "info",
  },
  "1234": {
    title: "Practice / test",
    summary: "Common practice or equipment-test code; not an emergency discrete.",
    severity: "info",
  },
  "1255": {
    title: "Firefighting",
    summary: "Firefighting aircraft (US) when assigned this discrete.",
    severity: "caution",
  },
  "1277": {
    title: "Search & rescue",
    summary: "Search and rescue aircraft (US) when assigned this discrete.",
    severity: "caution",
  },
  "4000": {
    title: "VFR high altitude",
    summary: "Sometimes used for VFR above certain altitudes; confirm with ATC/AIM.",
    severity: "info",
  },
  "7500": {
    title: "Hijack / unlawful interference",
    summary: "Aircraft is indicating unlawful interference (hijack). ATC / intercept procedures apply.",
    severity: "emergency",
  },
  "7600": {
    title: "Communications failure",
    summary: "Radio failure. Squawk 7600 and follow lost-comm procedures (AIM / FAR 91.185).",
    severity: "emergency",
  },
  "7700": {
    title: "General emergency",
    summary: "General emergency. Declared or indicated emergency — highest priority traffic.",
    severity: "emergency",
  },
};

/** Discrete codes that should isolate the radar when emergency filter is on. */
export const EMERGENCY_SQUAWKS = new Set(["7500", "7600", "7700"]);

export function normalizeSquawk(raw: string): string | null {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length !== 4) return null;
  // Mode A octal digits 0–7 only
  if (/[89]/.test(digits)) return null;
  return digits;
}

export function decodeSquawk(raw: string): SquawkMeaning {
  const code = normalizeSquawk(raw) ?? raw.trim().padStart(4, "0").slice(0, 4);
  const known = KNOWN[code];
  if (known) return { code, ...known };

  if (EMERGENCY_SQUAWKS.has(code)) {
    return {
      code,
      title: "Emergency discrete",
      summary: "Recognized emergency / urgency squawk.",
      severity: "emergency",
    };
  }

  return {
    code,
    title: "Discrete / assigned",
    summary:
      "Likely an ATC-assigned discrete code. Meaning depends on the facility and flight strip — not a standard VFR/emergency discrete.",
    severity: "info",
  };
}

export function isEmergencySquawk(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const code = normalizeSquawk(raw);
  return code != null && EMERGENCY_SQUAWKS.has(code);
}
