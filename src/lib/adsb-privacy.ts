import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * ADS-B privacy (PIA / LADD) — important facts for track-share links
 * ------------------------------------------------------------------
 * Our live feed (airplanes.live, with adsb.lol fallback) is an *unfiltered*
 * community aggregator of raw receiver data. It does **not** honor the FAA’s
 * Limiting Aircraft Data Displayed (LADD) list, and Privacy ICAO Address (PIA)
 * aircraft still appear (often with a temporary hex / non-registry callsign).
 *
 * LADD is a policy agreement for FAA feed subscribers — the official Industry
 * LADD list is distributed via FAA ADX and is not a public API. We therefore:
 *  1. Never invent a workaround to “find” a blocked aircraft.
 *  2. Refuse track-link creation when the tail/callsign is on our local
 *     blocklist (env + optional public/data/ladd-blocklist.json).
 *  3. Surface a clear “not trackable” message instead of silently proceeding.
 */

export type PrivacyCheck =
  | { trackable: true }
  | {
      trackable: false;
      reason: "ladd_blocklist" | "privacy_flag";
      message: string;
    };

let fileBlocklist: Set<string> | null = null;
let fileLoadedAt = 0;
const FILE_TTL_MS = 15 * 60_000;

function normalizeIdent(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "").replace(/^N(?=\d)/, "N");
}

function envBlocklist(): Set<string> {
  const raw = process.env.ADS_B_PRIVACY_BLOCKLIST?.trim() ?? "";
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[,;\s]+/)
      .map(normalizeIdent)
      .filter((s) => s.length >= 2)
  );
}

async function loadFileBlocklist(): Promise<Set<string>> {
  const now = Date.now();
  if (fileBlocklist && now - fileLoadedAt < FILE_TTL_MS) return fileBlocklist;

  const filePath = path.join(
    process.cwd(),
    "public/data/ladd-blocklist.json"
  );
  try {
    const text = await readFile(filePath, "utf8");
    const parsed = JSON.parse(text) as unknown;
    const list = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          Array.isArray((parsed as { registrations?: unknown }).registrations)
        ? (parsed as { registrations: unknown[] }).registrations
        : [];
    fileBlocklist = new Set(
      list
        .filter((v): v is string => typeof v === "string")
        .map(normalizeIdent)
        .filter((s) => s.length >= 2)
    );
  } catch {
    fileBlocklist = new Set();
  }
  fileLoadedAt = now;
  return fileBlocklist;
}

/**
 * Returns whether a tail number / callsign may be used for a public track link.
 * Opt-in share links still must not target privacy-blocked aircraft.
 */
export async function checkTrackableIdent(
  ident: string
): Promise<PrivacyCheck> {
  const key = normalizeIdent(ident);
  if (key.length < 2) {
    return {
      trackable: false,
      reason: "privacy_flag",
      message: "Aircraft isn’t trackable — invalid identifier.",
    };
  }

  const blocked = new Set([...envBlocklist(), ...(await loadFileBlocklist())]);
  if (blocked.has(key)) {
    return {
      trackable: false,
      reason: "ladd_blocklist",
      message:
        "This aircraft isn’t trackable — it appears on a privacy blocklist (LADD / owner opt-out). We won’t generate a share link.",
    };
  }

  return { trackable: true };
}

/** Feed disclosure for UI / docs. */
export const ADSB_FEED_PRIVACY_NOTE =
  "Live traffic comes from unfiltered community ADS-B aggregators (airplanes.live / adsb.lol). Those feeds do not apply FAA LADD filtering; PIA aircraft may still appear under temporary identities. Track-share links are refused for identifiers on our local privacy blocklist.";
