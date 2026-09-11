"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { haversineNm } from "@/lib/geo";
import type { LiveAircraft } from "@/lib/traffic";

type TrafficResponse = {
  aircraft: LiveAircraft[];
  count: number;
  source?: string;
  error?: string;
};

type QueryPoint = {
  lat: number;
  lon: number;
  radiusNm: number;
};

function clampRadiusNm(nm: number): number {
  return Math.min(250, Math.max(20, Math.round(nm)));
}

/** Radius covering the visible map (corner distance), with a little pad. */
function radiusFromBounds(map: LeafletMap): number {
  const b = map.getBounds();
  const c = map.getCenter();
  const cornerNm = haversineNm(
    { lat: c.lat, lng: c.lng },
    { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng }
  );
  return clampRadiusNm(cornerNm * 1.15);
}

async function fetchTraffic(point: QueryPoint): Promise<TrafficResponse> {
  const params = new URLSearchParams({
    lat: String(point.lat),
    lon: String(point.lon),
    radius: String(point.radiusNm),
  });
  const res = await fetch(`/api/traffic/live?${params}`);
  const data = (await res.json()) as TrafficResponse;
  if (!res.ok && !Array.isArray(data.aircraft)) {
    throw new Error(data.error || "Traffic unavailable");
  }
  return data;
}

function pointsEqual(a: QueryPoint, b: QueryPoint): boolean {
  return (
    a.lat === b.lat && a.lon === b.lon && a.radiusNm === b.radiusNm
  );
}

/** New view is already inside the last fetch — no need to blank and refetch. */
function viewCovered(fetched: QueryPoint, next: QueryPoint): boolean {
  const moved = haversineNm(
    { lat: fetched.lat, lng: fetched.lon },
    { lat: next.lat, lng: next.lon }
  );
  return (
    next.radiusNm <= fetched.radiusNm * 1.08 &&
    moved <= fetched.radiusNm * 0.28
  );
}

/**
 * Syncs map center/radius into traffic queries whenever the user pans or zooms.
 * Must render inside MapContainer.
 */
export function TrafficMapSync({
  enabled,
  onPoint,
  onActivity,
  resyncNonce = 0,
}: {
  enabled: boolean;
  onPoint: (point: QueryPoint) => void;
  /** Keep live polling awake while the user moves the map. */
  onActivity?: () => void;
  /** Bump to re-read the current map and refetch even if the center is unchanged. */
  resyncNonce?: number;
}) {
  const map = useMap();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef<QueryPoint | null>(null);

  const syncPoint = useCallback(
    (force = false) => {
      if (!enabled) return;
      const c = map.getCenter();
      const next: QueryPoint = {
        lat: Number(c.lat.toFixed(4)),
        lon: Number(c.lng.toFixed(4)),
        radiusNm: radiusFromBounds(map),
      };
      if (!force && lastSent.current && pointsEqual(lastSent.current, next)) {
        return;
      }
      lastSent.current = next;
      onPoint(next);
    },
    [map, onPoint, enabled]
  );

  const scheduleSync = useCallback(() => {
    onActivity?.();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Wait until the gesture settles so a scroll doesn't fire a request per tick.
    debounceRef.current = setTimeout(() => syncPoint(false), 180);
  }, [syncPoint, onActivity]);

  useMapEvents({
    moveend: scheduleSync,
    zoomend: scheduleSync,
    dragend: scheduleSync,
  });

  // Scroll-wheel zoom doesn't always fire pointerdown on window
  useEffect(() => {
    if (!enabled) return;
    const el = map.getContainer();
    const onWheel = () => onActivity?.();
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, [map, enabled, onActivity]);

  useEffect(() => {
    if (!enabled) return;
    syncPoint(false);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [enabled, syncPoint]);

  useEffect(() => {
    if (!enabled || resyncNonce <= 0) return;
    syncPoint(true);
  }, [resyncNonce, enabled, syncPoint]);

  return null;
}

export function useLiveTraffic(enabled: boolean, point: QueryPoint | null) {
  const [tabVisible, setTabVisible] = useState(true);
  const [userActive, setUserActive] = useState(true);
  const [fetchPoint, setFetchPoint] = useState<QueryPoint | null>(point);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef = useRef(
    new Map<string, { ac: LiveAircraft; seen: number }>()
  );
  const [cacheTick, setCacheTick] = useState(0);

  const bumpActivity = useCallback(() => {
    setUserActive(true);
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => setUserActive(false), 120_000);
  }, []);

  // Only change the network query when the viewport leaves the last fetch.
  useEffect(() => {
    if (!point) return;
    if (fetchPoint && viewCovered(fetchPoint, point)) return;
    const t = window.setTimeout(() => setFetchPoint(point), 220);
    return () => window.clearTimeout(t);
  }, [point, fetchPoint]);

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

  // Always fetch when the map area changes; only pause background polling when idle.
  const canFetch = enabled && tabVisible && !!fetchPoint;
  const shouldPoll = canFetch && userActive;

  const query = useQuery({
    queryKey: [
      "traffic-live",
      fetchPoint?.lat,
      fetchPoint?.lon,
      fetchPoint?.radiusNm,
    ],
    queryFn: () => fetchTraffic(fetchPoint!),
    enabled: canFetch,
    refetchInterval: shouldPoll ? 4_000 : false,
    staleTime: 2_500,
    placeholderData: (previous) => previous,
    retry: 1,
  });

  useEffect(() => {
    const rows = query.data?.aircraft;
    if (!rows) return;
    const now = Date.now();
    const cache = cacheRef.current;
    for (const ac of rows) cache.set(ac.hex, { ac, seen: now });
    setCacheTick((n) => n + 1);
  }, [query.data]);

  const aircraft = useMemo(() => {
    if (!point) return query.data?.aircraft ?? [];
    const now = Date.now();
    const cache = cacheRef.current;
    const out: LiveAircraft[] = [];
    for (const [hex, row] of cache) {
      if (now - row.seen > 75_000) {
        cache.delete(hex);
        continue;
      }
      const d = haversineNm(
        { lat: point.lat, lng: point.lon },
        { lat: row.ac.lat, lng: row.ac.lon }
      );
      if (d <= point.radiusNm * 1.08) out.push(row.ac);
    }
    return out;
    // cacheTick refreshes the list when a fetch merges into the cache
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point, cacheTick, query.dataUpdatedAt]);

  const refresh = useCallback(() => {
    if (point) setFetchPoint(point);
    void query.refetch();
  }, [point, query]);

  const ingest = useCallback((rows: LiveAircraft[]) => {
    if (rows.length === 0) return;
    const now = Date.now();
    for (const ac of rows) cacheRef.current.set(ac.hex, { ac, seen: now });
    setCacheTick((n) => n + 1);
  }, []);

  return {
    aircraft,
    source: query.data?.source,
    isFetching: query.isFetching,
    isError: query.isError,
    bumpActivity,
    refresh,
    ingest,
  };
}

export type { QueryPoint };
