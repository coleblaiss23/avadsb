"use client";

import { useQuery } from "@tanstack/react-query";
import { BRIEFING_DISCLAIMER } from "@/lib/site";
import { briefingTag, type NotamPayload } from "@/lib/briefing";

function formatWhen(value: string | null): string {
  if (!value) return "Until further notice";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadNotams(icao: string): Promise<NotamPayload> {
  const res = await fetch(`/api/notams?icao=${encodeURIComponent(icao)}`);
  const data = (await res.json()) as NotamPayload & { error?: string };
  if (!res.ok) throw new Error(data.error || "NOTAMs unavailable");
  return data;
}

export function NotamList({ icao }: { icao: string }) {
  const query = useQuery({
    queryKey: ["notams", icao],
    queryFn: () => loadNotams(icao),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const data = query.data;
  const tag = data ? briefingTag(data.fetchedAt, data.source) : null;

  return (
    <section className="instrument-panel p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--ink-text)]">NOTAMs</h2>
        <p className="font-avionics text-[10px] text-[var(--ink-muted)]">
          {query.isError ? "Unavailable" : tag ?? "Loading…"}
          {data?.source === "demo" ? (
            <span className="ml-2 uppercase tracking-wide text-[var(--signal-amber)]">
              Demo
            </span>
          ) : null}
        </p>
      </div>

      {query.isError ? (
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          Could not load NOTAMs for {icao}.
        </p>
      ) : !data ? (
        <p className="mt-3 text-sm text-[var(--ink-muted)]">Loading NOTAMs…</p>
      ) : data.notams.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          No active NOTAMs in this result for {icao}.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-panel-border">
          {data.notams.map((notam) => (
            <li key={notam.id} className="py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-avionics text-xs font-semibold text-[var(--signal-amber)]">
                  {notam.notamNumber}
                </p>
                <p className="font-avionics text-[10px] text-[var(--ink-muted)]">
                  {formatWhen(notam.effectiveStart)}
                  {notam.effectiveEnd ? ` – ${formatWhen(notam.effectiveEnd)}` : ""}
                </p>
              </div>
              <p className="mt-1 text-sm text-[var(--ink-text)]">{notam.plain}</p>
              <p className="mt-1 font-avionics text-[11px] leading-relaxed text-[var(--ink-muted)]">
                {notam.raw}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-[var(--ink-muted)]">
        {BRIEFING_DISCLAIMER}{" "}
        <a
          href="https://notams.aim.faa.gov/notamSearch/"
          className="text-[var(--scope-cyan)] hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          FAA NOTAM Search
        </a>
      </p>
    </section>
  );
}
