"use client";

import { useEffect, useState } from "react";
import type { LiveAircraft } from "@/lib/traffic";

export type TrailPoint = [number, number];

const MAX_POINTS = 32;
const MIN_MOVE_DEG = 0.00008;

/**
 * Keep a short in-memory track history per Mode-S hex (ADSBX-style trails).
 */
export function useAircraftTrails(
  aircraft: LiveAircraft[],
  enabled: boolean
): Map<string, TrailPoint[]> {
  const [trails, setTrails] = useState(() => new Map<string, TrailPoint[]>());

  useEffect(() => {
    if (!enabled) {
      setTrails((prev) => (prev.size === 0 ? prev : new Map()));
      return;
    }

    setTrails((prev) => {
      const next = new Map(prev);
      const nowSeen = new Set<string>();
      let changed = false;

      for (const ac of aircraft) {
        nowSeen.add(ac.hex);
        const hist = next.get(ac.hex) ?? [];
        const last = hist[hist.length - 1];
        if (
          last &&
          Math.abs(last[0] - ac.lat) < MIN_MOVE_DEG &&
          Math.abs(last[1] - ac.lon) < MIN_MOVE_DEG
        ) {
          continue;
        }
        next.set(
          ac.hex,
          [...hist, [ac.lat, ac.lon] as TrailPoint].slice(-MAX_POINTS)
        );
        changed = true;
      }

      for (const hex of [...next.keys()]) {
        if (nowSeen.has(hex)) continue;
        const hist = next.get(hex)!;
        if (hist.length <= 2) {
          next.delete(hex);
        } else {
          next.set(hex, hist.slice(2));
        }
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [aircraft, enabled]);

  return trails;
}
