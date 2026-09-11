"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Polygon, Popup, useMap } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import { briefingTag } from "@/lib/briefing";
import { BRIEFING_DISCLAIMER } from "@/lib/site";
import { tfrStroke, type TfrCollection, type TfrFeature } from "@/lib/tfrs";

function formatWindow(feature: TfrFeature): string {
  const p = feature.properties;
  if (p.effectiveLabel) {
    return p.timeZone && !p.effectiveLabel.toUpperCase().includes(p.timeZone.toUpperCase())
      ? `${p.effectiveLabel} ${p.timeZone}`
      : p.effectiveLabel;
  }
  if (!p.effectiveStart && !p.effectiveEnd) return "Times not in FAA list feed";
  const tz = p.timeZone ? ` ${p.timeZone}` : "";
  if (p.effectiveStart && p.effectiveEnd) {
    return `${p.effectiveStart} through ${p.effectiveEnd}${tz}`;
  }
  return `${p.effectiveStart ?? "start unknown"}${tz}`;
}

async function fetchTfrs(): Promise<TfrCollection> {
  const res = await fetch("/api/tfrs");
  const data = (await res.json()) as TfrCollection & { error?: string };
  if (!res.ok || !Array.isArray(data.features)) {
    throw new Error(data.error || "TFRs unavailable");
  }
  return data;
}

/**
 * Same activity gating as useLiveTraffic: poll while the tab is visible and
 * the user has interacted recently, pause after two minutes idle.
 * Cadence is 60s — TFRs are not a 6-second radar stream.
 */
export function useTfrOverlay(enabled: boolean) {
  const [tabVisible, setTabVisible] = useState(true);
  const [userActive, setUserActive] = useState(true);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bumpActivity = useCallback(() => {
    setUserActive(true);
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => setUserActive(false), 120_000);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    bumpActivity();
    const onVis = () => {
      const vis = document.visibilityState === "visible";
      setTabVisible(vis);
      if (vis) bumpActivity();
    };
    const onInteract = () => bumpActivity();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointerdown", onInteract);
    window.addEventListener("keydown", onInteract);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      if (idleRef.current) clearTimeout(idleRef.current);
    };
  }, [enabled, bumpActivity]);

  const canFetch = enabled && tabVisible;
  const shouldPoll = canFetch && userActive;

  const query = useQuery({
    queryKey: ["tfrs"],
    queryFn: fetchTfrs,
    enabled: canFetch,
    refetchInterval: shouldPoll ? 60_000 : false,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    retry: 1,
  });

  return {
    features: query.data?.features ?? [],
    source: query.data?.source,
    fetchedAt: query.data?.fetchedAt,
    isFetching: query.isFetching,
    isError: query.isError,
    bumpActivity,
  };
}

function EnsureTfrPane() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("tfr")) {
      const pane = map.createPane("tfr");
      pane.style.zIndex = "340";
    }
  }, [map]);
  return null;
}

function TfrPolygon({
  feature,
  source,
}: {
  feature: TfrFeature;
  source?: string;
}) {
  const color = tfrStroke(feature.properties.reason);
  const positions = feature.geometry.coordinates.map((ring) =>
    ring.map(([lon, lat]) => [lat, lon] as [number, number])
  );
  const p = feature.properties;

  return (
    <Polygon
      positions={positions}
      pane="tfr"
      pathOptions={{
        color,
        weight: 1.75,
        opacity: 0.92,
        fillColor: color,
        fillOpacity: 0.14,
      }}
    >
      <Popup className="afm-dark-popup" maxWidth={280}>
        <div className="min-w-[220px] space-y-1.5 text-sm text-[var(--ink-text)]">
          <p className="font-avionics text-[11px] font-semibold text-[var(--signal-amber)]">
            {p.notamNumber}
            {p.reason ? ` · ${p.reason}` : ""}
            {source === "demo" ? " · DEMO" : ""}
          </p>
          <p className="font-medium">{p.title}</p>
          <p className="text-xs text-[var(--ink-muted)]">{formatWindow(feature)}</p>
          <p className="font-avionics text-[11px] text-[var(--ink-muted)]">
            {p.floorLabel} – {p.ceilingLabel}
          </p>
          <a
            href={p.detailUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-[11px] text-[var(--scope-cyan)] hover:underline"
          >
            Full text on FAA TFR page
          </a>
          <p className="text-[10px] leading-relaxed text-[var(--ink-muted)]">
            {BRIEFING_DISCLAIMER}
          </p>
        </div>
      </Popup>
    </Polygon>
  );
}

export function TFRLayer({
  features,
  source,
}: {
  features: TfrFeature[];
  source?: string;
}) {
  return (
    <>
      <EnsureTfrPane />
      {features.map((feature, index) => (
        <TfrPolygon
          key={`${feature.id}:${index}`}
          feature={feature}
          source={source}
        />
      ))}
    </>
  );
}

export function tfrStatusLine(opts: {
  count: number;
  source?: string;
  fetchedAt?: string;
  isFetching: boolean;
  isError: boolean;
}): string {
  if (opts.isError) return "TFRs unavailable";
  if (!opts.fetchedAt) return opts.isFetching ? "Loading TFRs…" : "TFRs off";
  const tag = briefingTag(opts.fetchedAt, opts.source === "demo" ? "demo" : "faa");
  return `${opts.count} TFR${opts.count === 1 ? "" : "s"} · ${tag}`;
}
