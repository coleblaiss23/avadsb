"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMap } from "react-leaflet";
import { cn } from "@/lib/utils";

export type AircraftScreenPos = {
  x: number;
  y: number;
  mapW: number;
  mapH: number;
};

type DockCorner = {
  horizontal: "left" | "right";
  vertical: "top" | "bottom";
};

type DockStyle = {
  top: number;
  left: number;
};

const PAD = 12;
const SEARCH_CLEARANCE = 76;
const LEGEND_CLEARANCE = 148;
/** Width of the Radar / TFR / Airspace control column (top-right). */
const CONTROLS_COL = 152;
/**
 * Fallback vertical drop when the map is too narrow for a side gutter —
 * covers Radar + TFRs + Airspace + status + altitude filter block.
 */
const CONTROLS_STACK = 248;
const HYSTERESIS_PX = 48;
const CARD_W_FALLBACK = 320;
const CARD_H_FALLBACK = 400;

/** Projects an aircraft lat/lon into map-container pixels for docking UI. */
export function MapAircraftProjector({
  lat,
  lon,
  onProject,
}: {
  lat: number;
  lon: number;
  onProject: (pos: AircraftScreenPos | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const project = () => {
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        onProject(null);
        return;
      }
      const pt = map.latLngToContainerPoint([lat, lon]);
      const size = map.getSize();
      onProject({ x: pt.x, y: pt.y, mapW: size.x, mapH: size.y });
    };

    project();
    map.on("move", project);
    map.on("zoom", project);
    map.on("resize", project);
    map.on("moveend", project);
    map.on("zoomend", project);
    return () => {
      map.off("move", project);
      map.off("zoom", project);
      map.off("resize", project);
      map.off("moveend", project);
      map.off("zoomend", project);
    };
  }, [map, lat, lon, onProject]);

  return null;
}

function coversAircraft(
  dock: DockStyle,
  cardW: number,
  cardH: number,
  x: number,
  y: number,
  clearance = 36
): boolean {
  return (
    x >= dock.left - clearance &&
    x <= dock.left + cardW + clearance &&
    y >= dock.top - clearance &&
    y <= dock.top + cardH + clearance
  );
}

function cornerToStyle(
  corner: DockCorner,
  pos: AircraftScreenPos,
  cardW: number,
  cardH: number,
  clearLegend: boolean
): DockStyle {
  const { mapW, mapH } = pos;
  const maxLeft = Math.max(PAD, mapW - cardW - PAD);
  const maxTop = Math.max(PAD, mapH - cardH - PAD);

  let left = corner.horizontal === "left" ? PAD : maxLeft;
  let top = corner.vertical === "top" ? PAD : maxTop;

  // Keep clear of fixed chrome on each corner.
  if (corner.horizontal === "left" && corner.vertical === "top") {
    top = Math.min(maxTop, Math.max(top, PAD + SEARCH_CLEARANCE));
  }
  if (corner.horizontal === "right") {
    // Layer toggles sit in a top-right column. Any right-docked card whose
    // top edge reaches that stack needs a side gutter (tall bottom-right
    // cards still collide with Radar / TFRs / Airspace).
    const intersectsControls = top < PAD + CONTROLS_STACK;
    if (intersectsControls) {
      const gutterLeft = mapW - cardW - PAD - CONTROLS_COL;
      if (gutterLeft >= PAD) {
        left = Math.min(left, gutterLeft);
      } else if (corner.vertical === "top") {
        top = Math.min(maxTop, Math.max(top, PAD + CONTROLS_STACK));
      }
    }
  }
  if (corner.horizontal === "left" && corner.vertical === "bottom" && clearLegend) {
    top = Math.max(PAD, Math.min(top, mapH - cardH - PAD - LEGEND_CLEARANCE));
  }

  return {
    left: Math.max(PAD, Math.min(left, maxLeft)),
    top: Math.max(PAD, Math.min(top, maxTop)),
  };
}

function oppositeCorner(pos: AircraftScreenPos): DockCorner {
  return {
    // Put the card on the opposite half so it doesn't sit on the plane.
    horizontal: pos.x < pos.mapW / 2 ? "right" : "left",
    vertical: pos.y < pos.mapH / 2 ? "bottom" : "top",
  };
}

function withHysteresis(
  preferred: DockCorner,
  locked: DockCorner | null,
  pos: AircraftScreenPos
): DockCorner {
  if (!locked) return preferred;

  const hMid = pos.mapW / 2;
  const vMid = pos.mapH / 2;
  let horizontal = locked.horizontal;
  let vertical = locked.vertical;

  if (locked.horizontal === "right" && pos.x > hMid + HYSTERESIS_PX) {
    horizontal = "left";
  } else if (locked.horizontal === "left" && pos.x < hMid - HYSTERESIS_PX) {
    horizontal = "right";
  }

  if (locked.vertical === "bottom" && pos.y > vMid + HYSTERESIS_PX) {
    vertical = "top";
  } else if (locked.vertical === "top" && pos.y < vMid - HYSTERESIS_PX) {
    vertical = "bottom";
  }

  return { horizontal, vertical };
}

const CORNER_ORDER: DockCorner[] = [
  { horizontal: "right", vertical: "bottom" },
  { horizontal: "left", vertical: "bottom" },
  { horizontal: "right", vertical: "top" },
  { horizontal: "left", vertical: "top" },
];

export function pickAircraftCardDock(
  pos: AircraftScreenPos,
  cardW: number,
  cardH: number,
  opts: {
    clearLegend?: boolean;
    lockedCorner?: DockCorner | null;
  } = {}
): { style: DockStyle; corner: DockCorner } {
  const clearLegend = opts.clearLegend ?? false;
  const preferred = withHysteresis(
    oppositeCorner(pos),
    opts.lockedCorner ?? null,
    pos
  );

  const tryCorner = (corner: DockCorner) =>
    cornerToStyle(corner, pos, cardW, cardH, clearLegend);

  let corner = preferred;
  let style = tryCorner(corner);

  if (coversAircraft(style, cardW, cardH, pos.x, pos.y)) {
    const fallbacks = [
      preferred,
      ...CORNER_ORDER.filter(
        (c) =>
          c.horizontal !== preferred.horizontal ||
          c.vertical !== preferred.vertical
      ),
    ];
    for (const candidate of fallbacks) {
      const next = tryCorner(candidate);
      if (!coversAircraft(next, cardW, cardH, pos.x, pos.y)) {
        corner = candidate;
        style = next;
        break;
      }
    }
  }

  return { style, corner };
}

type AircraftFloatingCardProps = {
  hex: string;
  screenPos: AircraftScreenPos | null;
  clearLegend?: boolean;
  /** Hover previews must not capture the pointer (avoids twitch). */
  interactive?: boolean;
  children: ReactNode;
  className?: string;
};

/** Absolutely docks the aircraft detail card away from the live target. */
export function AircraftFloatingCard({
  hex,
  screenPos,
  clearLegend = false,
  interactive = true,
  children,
  className,
}: AircraftFloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const lockedCornerRef = useRef<{ hex: string; corner: DockCorner } | null>(
    null
  );
  const [size, setSize] = useState({
    w: CARD_W_FALLBACK,
    h: CARD_H_FALLBACK,
  });
  const [dock, setDock] = useState<DockStyle>({
    top: PAD + SEARCH_CLEARANCE,
    left: PAD,
  });

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const sync = () => {
      setSize({
        w: el.offsetWidth || CARD_W_FALLBACK,
        h: el.offsetHeight || CARD_H_FALLBACK,
      });
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hex]);

  useEffect(() => {
    if (lockedCornerRef.current?.hex !== hex) {
      lockedCornerRef.current = null;
    }
  }, [hex]);

  useLayoutEffect(() => {
    if (!screenPos) {
      setDock({ top: PAD + SEARCH_CLEARANCE, left: PAD });
      return;
    }
    const locked =
      lockedCornerRef.current?.hex === hex
        ? lockedCornerRef.current.corner
        : null;
    const next = pickAircraftCardDock(screenPos, size.w, size.h, {
      clearLegend,
      lockedCorner: locked,
    });
    lockedCornerRef.current = { hex, corner: next.corner };
    setDock(next.style);
  }, [hex, screenPos, size.w, size.h, clearLegend]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "absolute z-[1100] w-[min(100%-1.5rem,24rem)] scope-bezel p-3",
        interactive ? "pointer-events-auto" : "pointer-events-none",
        className
      )}
      style={{
        top: dock.top,
        left: dock.left,
      }}
    >
      {children}
    </div>
  );
}
