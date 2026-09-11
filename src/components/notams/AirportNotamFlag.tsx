"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { briefingTag, type NotamPayload } from "@/lib/briefing";

async function loadNotams(icao: string): Promise<NotamPayload> {
  const res = await fetch(`/api/notams?icao=${encodeURIComponent(icao)}`);
  const data = (await res.json()) as NotamPayload;
  if (!res.ok) throw new Error("NOTAMs unavailable");
  return data;
}

export function AirportNotamFlag({
  icao,
  role,
}: {
  icao: string;
  role?: string;
}) {
  const code = icao.trim().toUpperCase();
  const query = useQuery({
    queryKey: ["notams", code],
    queryFn: () => loadNotams(code),
    enabled: code.length >= 3,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const count = query.data?.notams.length ?? 0;
  if (!query.data || count === 0) return null;

  const demo = query.data.source === "demo";

  return (
    <Link
      href={`/airports/${code}`}
      className="pointer-events-auto inline-flex max-w-full items-center gap-1.5 border border-[var(--signal-amber)]/40 bg-[#2a2418] px-2 py-1 font-avionics text-[10px] text-[var(--signal-amber)] hover:border-[var(--signal-amber)]"
    >
      <span>
        {role ? `${role} ` : ""}
        {code} · {count} NOTAM{count === 1 ? "" : "s"}
        {demo ? " · demo" : ""}
      </span>
      <span className="text-[var(--ink-muted)]">
        {briefingTag(query.data.fetchedAt, query.data.source)}
      </span>
    </Link>
  );
}
