import "server-only";
import { randomBytes } from "node:crypto";
import {
  isSupabaseConfigured,
  readSupabaseError,
  supabaseAdminFetch,
} from "@/lib/supabase-admin";
import { checkTrackableIdent } from "@/lib/adsb-privacy";
import {
  normalizeAircraft,
  parseAirplanesLiveResponse,
  type LiveAircraft,
} from "@/lib/traffic";

export type FlightTrackShare = {
  id: string;
  tailNumber: string;
  label: string | null;
  createdAt: string;
  expiresAt: string;
};

export type TrackLivePayload = {
  ok: true;
  expired: false;
  share: FlightTrackShare;
  aircraft: LiveAircraft | null;
  trail: [number, number][];
  status: "airborne" | "ground" | "not_seen";
  source: string;
  fetchedAt: string;
};

export type TrackExpiredPayload = {
  ok: false;
  expired: true;
  error: string;
};

const DEFAULT_TTL_MS = 24 * 60 * 60_000;
const TRAIL_MAX = 48;

/** In-memory fallback when Supabase isn’t configured (local demos). */
const memoryShares = new Map<string, FlightTrackShare>();
const memoryTrails = new Map<string, [number, number][]>();

function newToken(): string {
  return randomBytes(18).toString("base64url");
}

function normalizeTail(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function isExpired(share: FlightTrackShare, now = Date.now()): boolean {
  return Date.parse(share.expiresAt) <= now;
}

function pushTrail(token: string, lat: number, lon: number): [number, number][] {
  const prev = memoryTrails.get(token) ?? [];
  const last = prev[prev.length - 1];
  if (
    last &&
    Math.abs(last[0] - lat) < 0.00008 &&
    Math.abs(last[1] - lon) < 0.00008
  ) {
    return prev;
  }
  const next = [...prev, [lat, lon] as [number, number]].slice(-TRAIL_MAX);
  memoryTrails.set(token, next);
  return next;
}

async function insertShare(
  share: FlightTrackShare
): Promise<FlightTrackShare> {
  if (!isSupabaseConfigured()) {
    memoryShares.set(share.id, share);
    return share;
  }

  const res = await supabaseAdminFetch("flight_track_shares", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      id: share.id,
      tail_number: share.tailNumber,
      label: share.label,
      created_at: share.createdAt,
      expires_at: share.expiresAt,
    }),
  });

  if (!res.ok) {
    throw new Error(await readSupabaseError(res));
  }

  return share;
}

async function readShare(token: string): Promise<FlightTrackShare | null> {
  if (!isSupabaseConfigured()) {
    return memoryShares.get(token) ?? null;
  }

  const res = await supabaseAdminFetch(
    `flight_track_shares?id=eq.${encodeURIComponent(token)}&select=id,tail_number,label,created_at,expires_at&limit=1`
  );
  if (!res.ok) {
    throw new Error(await readSupabaseError(res));
  }
  const rows = (await res.json()) as Array<{
    id: string;
    tail_number: string;
    label: string | null;
    created_at: string;
    expires_at: string;
  }>;
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    tailNumber: row.tail_number,
    label: row.label,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

const LOOKUP_HOSTS = [
  { host: "https://api.adsb.lol", label: "adsb.lol" },
  { host: "https://api.airplanes.live", label: "airplanes.live" },
] as const;

async function lookupByRegistration(
  tail: string
): Promise<{ aircraft: LiveAircraft | null; source: string }> {
  for (const { host, label } of LOOKUP_HOSTS) {
    try {
      const res = await fetch(
        `${host}/v2/reg/${encodeURIComponent(tail)}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "AvADSB/0.1 (opt-in flight track share)",
          },
          cache: "no-store",
        }
      );
      if (!res.ok) continue;
      const json = (await res.json()) as unknown;
      const aircraft = parseAirplanesLiveResponse(json);
      if (aircraft[0]) return { aircraft: aircraft[0], source: label };
      // Some hosts return a single `ac` object shape we already parse;
      // also try raw first row if present without positions filtered.
      if (json && typeof json === "object" && Array.isArray((json as { ac?: unknown }).ac)) {
        const row = (json as { ac: unknown[] }).ac[0];
        if (row && typeof row === "object") {
          const normalized = normalizeAircraft(
            row as Parameters<typeof normalizeAircraft>[0]
          );
          if (normalized) return { aircraft: normalized, source: label };
        }
      }
    } catch {
      // try next host
    }
  }
  return { aircraft: null, source: "demo" };
}

export type CreateTrackResult =
  | { ok: true; share: FlightTrackShare; urlPath: string }
  | { ok: false; status: number; error: string };

export async function createFlightTrackShare(input: {
  tailNumber: string;
  label?: string | null;
}): Promise<CreateTrackResult> {
  const tailNumber = normalizeTail(input.tailNumber);
  if (tailNumber.length < 2 || tailNumber.length > 12) {
    return { ok: false, status: 400, error: "Enter a valid tail number." };
  }
  if (!/^[A-Z0-9-]+$/.test(tailNumber)) {
    return { ok: false, status: 400, error: "Tail number has invalid characters." };
  }

  const privacy = await checkTrackableIdent(tailNumber);
  if (!privacy.trackable) {
    return { ok: false, status: 403, error: privacy.message };
  }

  const label =
    typeof input.label === "string" && input.label.trim()
      ? input.label.trim().slice(0, 80)
      : null;

  const now = Date.now();
  const share: FlightTrackShare = {
    id: newToken(),
    tailNumber,
    label,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + DEFAULT_TTL_MS).toISOString(),
  };

  try {
    await insertShare(share);
  } catch (err) {
    return {
      ok: false,
      status: 503,
      error:
        err instanceof Error
          ? err.message
          : "Could not create tracking link.",
    };
  }

  return { ok: true, share, urlPath: `/track/${share.id}` };
}

export async function getFlightTrackLive(
  token: string
): Promise<TrackLivePayload | TrackExpiredPayload> {
  const clean = token.trim();
  if (!clean || clean.length < 8 || clean.length > 64) {
    return {
      ok: false,
      expired: true,
      error: "This tracking link has expired or is invalid.",
    };
  }

  let share: FlightTrackShare | null;
  try {
    share = await readShare(clean);
  } catch {
    return {
      ok: false,
      expired: true,
      error: "This tracking link has expired or is unavailable.",
    };
  }

  if (!share) {
    return {
      ok: false,
      expired: true,
      error: "This tracking link has expired or is invalid.",
    };
  }

  if (isExpired(share)) {
    memoryTrails.delete(share.id);
    return {
      ok: false,
      expired: true,
      error: "This tracking link has expired.",
    };
  }

  const privacy = await checkTrackableIdent(share.tailNumber);
  if (!privacy.trackable) {
    return {
      ok: false,
      expired: true,
      error: privacy.message,
    };
  }

  const { aircraft, source } = await lookupByRegistration(share.tailNumber);
  let trail: [number, number][] = memoryTrails.get(share.id) ?? [];
  let status: TrackLivePayload["status"] = "not_seen";

  if (aircraft) {
    trail = pushTrail(share.id, aircraft.lat, aircraft.lon);
    status = aircraft.alt_baro === 0 ? "ground" : "airborne";
  }

  return {
    ok: true,
    expired: false,
    share,
    aircraft,
    trail,
    status,
    source,
    fetchedAt: new Date().toISOString(),
  };
}
