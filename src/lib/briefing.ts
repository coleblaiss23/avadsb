/** Client-safe briefing tags. Do not import Node-only modules here. */

export type BriefingSource = "faa" | "demo";

export type NotamRecord = {
  id: string;
  notamNumber: string;
  icao: string;
  raw: string;
  plain: string;
  effectiveStart: string | null;
  effectiveEnd: string | null;
  issuedAt: string | null;
};

export type NotamPayload = {
  notams: NotamRecord[];
  source: BriefingSource;
  fetchedAt: string;
};

export function briefingTag(fetchedAt: string, source: BriefingSource): string {
  const then = Date.parse(fetchedAt);
  const mins = Number.isFinite(then)
    ? Math.max(0, Math.round((Date.now() - then) / 60_000))
    : 0;
  const age =
    mins < 1
      ? "Updated just now"
      : mins < 60
        ? `Updated ${mins} min ago`
        : mins < 60 * 48
          ? `Updated ${Math.round(mins / 60)} hr ago`
          : `Updated ${Math.round(mins / 1440)} days ago`;
  return source === "demo" ? `${age} via Demo` : `${age} via FAA`;
}
