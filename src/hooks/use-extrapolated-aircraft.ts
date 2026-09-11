"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isAircraftOnGround } from "@/lib/aircraft-silhouettes";
import { destinationPoint } from "@/lib/geo";
import type { LiveAircraft } from "@/lib/traffic";

/** Don't coast forever on a stale sample. */
const MAX_EXTRAPOLATE_MS = 28_000;
/** UI update rate — smooth enough without thrashing React. */
const TICK_MS = 100;
/** Ignore near-zero groundspeed (taxi / parked). */
const MIN_GS_KT = 30;

type Sample = {
  ac: LiveAircraft;
  /** Wall time when this lat/lon was first observed (kept across identical polls). */
  reportedAt: number;
};

function samePosition(a: LiveAircraft, b: LiveAircraft): boolean {
  return (
    Math.abs(a.lat - b.lat) < 1e-7 &&
    Math.abs(a.lon - b.lon) < 1e-7
  );
}

function extrapolate(sample: Sample, now: number): LiveAircraft {
  const { ac, reportedAt } = sample;
  const ageMs = now - reportedAt;
  if (ageMs <= 40 || ageMs > MAX_EXTRAPOLATE_MS) return ac;
  if (ac.gs == null || ac.gs < MIN_GS_KT || ac.track == null) return ac;
  if (isAircraftOnGround(ac.alt_baro)) return ac;

  const distanceNm = (ac.gs * ageMs) / 3_600_000;
  if (distanceNm < 0.00005) return ac;

  const dest = destinationPoint(
    { lat: ac.lat, lng: ac.lon },
    ac.track,
    distanceNm
  );
  return { ...ac, lat: dest.lat, lon: dest.lng };
}

/**
 * Dead-reckon live ADS-B markers between polls using groundspeed + track
 * so aircraft appear to move continuously instead of snapping every few seconds.
 */
export function useExtrapolatedAircraft(
  aircraft: LiveAircraft[],
  enabled = true
): LiveAircraft[] {
  const samplesRef = useRef(new Map<string, Sample>());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const now = Date.now();
    const map = samplesRef.current;
    const seen = new Set<string>();

    for (const ac of aircraft) {
      seen.add(ac.hex);
      const prev = map.get(ac.hex);
      if (!prev) {
        map.set(ac.hex, { ac, reportedAt: now });
        continue;
      }
      if (samePosition(prev.ac, ac)) {
        // Same coords (often a cached poll) — keep the clock so coasting continues.
        map.set(ac.hex, {
          ac: { ...ac, lat: prev.ac.lat, lon: prev.ac.lon },
          reportedAt: prev.reportedAt,
        });
      } else {
        map.set(ac.hex, { ac, reportedAt: now });
      }
    }

    for (const hex of [...map.keys()]) {
      if (!seen.has(hex)) map.delete(hex);
    }
  }, [aircraft]);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let lastEmit = 0;
    const loop = (t: number) => {
      if (t - lastEmit >= TICK_MS) {
        lastEmit = t;
        setTick((n) => n + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  return useMemo(() => {
    if (!enabled) return aircraft;
    const now = Date.now();
    const map = samplesRef.current;
    if (map.size === 0) return aircraft;

    const out: LiveAircraft[] = [];
    const order = new Map(aircraft.map((ac, i) => [ac.hex, i]));
    for (const sample of map.values()) {
      out.push(extrapolate(sample, now));
    }
    out.sort(
      (a, b) => (order.get(a.hex) ?? 0) - (order.get(b.hex) ?? 0)
    );
    return out;
    // tick drives the animation; aircraft syncs sample map above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tick, aircraft]);
}
