"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CloudSun, Link2, Share2 } from "lucide-react";
import { altitudeRainbowColor } from "@/lib/adsb-colors";
import {
  SILHOUETTE_STYLE,
  isAircraftOnGround,
  silhouetteSvgMarkup,
} from "@/lib/aircraft-silhouettes";
import { EmergencySquawkBanner } from "@/components/ui/EmergencySquawkBanner";
import { decodeSquawk, isEmergencySquawk } from "@/lib/squawk";
import type { LiveAircraft } from "@/lib/traffic";
import { cn } from "@/lib/utils";

function fmtAlt(ft: number | null): string {
  if (ft == null) return "—";
  if (ft === 0) return "GND";
  return `${Math.round(ft).toLocaleString()} ft`;
}

function fmtRate(fpm: number | null): string {
  if (fpm == null) return "—";
  const rounded = Math.round(fpm);
  if (rounded === 0) return "LEVEL";
  return `${rounded > 0 ? "+" : ""}${rounded} fpm`;
}

type FlightRouteEnds = {
  origin: { icao: string; name: string };
  destination: { icao: string; name: string };
};

type PhotoReady = {
  thumbnailUrl: string;
  photographer: string;
  link: string;
};

type TrackShareState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "ready"; path: string; expiresAt: string }
  | { status: "error"; message: string };

type NearestAirport = {
  icao: string;
  name: string;
  distanceNm: number;
};

/** Bucket coords so we refetch nearest airport only after meaningful movement. */
function nearestQueryKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

async function fetchNearestAirport(
  lat: number,
  lon: number
): Promise<NearestAirport | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  });
  const res = await fetch(`/api/airports/nearest?${params}`);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    icao?: string;
    name?: string;
    distanceNm?: number;
  };
  if (!data.icao || data.icao.length < 3) return null;
  return {
    icao: data.icao.toUpperCase(),
    name: data.name ?? data.icao,
    distanceNm: data.distanceNm ?? 0,
  };
}

async function fetchAircraftPhoto(
  hex: string,
  registration: string | null
): Promise<PhotoReady | null> {
  const params = new URLSearchParams();
  if (hex) params.set("hex", hex);
  if (registration) params.set("reg", registration);
  const res = await fetch(`/api/aircraft-photo?${params.toString()}`);
  const data = (await res.json()) as {
    found?: boolean;
    photo?: {
      thumbnailUrl?: string;
      photographer?: string;
      link?: string;
    } | null;
  };
  if (
    data.found &&
    data.photo?.thumbnailUrl &&
    data.photo.photographer &&
    data.photo.link
  ) {
    return {
      thumbnailUrl: data.photo.thumbnailUrl,
      photographer: data.photo.photographer,
      link: data.photo.link,
    };
  }
  return null;
}

type AircraftInfoCardProps = {
  ac: LiveAircraft;
  onClose?: () => void;
  compact?: boolean;
  /** Follow-toggle while a flight is pinned on the map. */
  following?: boolean;
  onToggleFollow?: () => void;
  route?: FlightRouteEnds | null;
  /** Show opt-in “Track this flight” share action (pinned selection). */
  allowTrackShare?: boolean;
};

/** Shared ADS-B detail block (popup + tracked aircraft panel). */
export function AircraftInfoCard({
  ac,
  onClose,
  compact = false,
  following,
  onToggleFollow,
  route,
  allowTrackShare = false,
}: AircraftInfoCardProps) {
  const cat = SILHOUETTE_STYLE[ac.category];
  const markerColor = altitudeRainbowColor(ac.alt_baro);
  const onGround = isAircraftOnGround(ac.alt_baro);
  const title = ac.flight;
  const reg =
    ac.registration && ac.registration !== ac.flight ? ac.registration : null;
  const shareTail =
    ac.registration || (/^N[0-9A-Z]+$/i.test(ac.flight) ? ac.flight : null);
  const squawkMeaning = ac.squawk ? decodeSquawk(ac.squawk) : null;
  const emergency = isEmergencySquawk(ac.squawk);

  const nearestKey = nearestQueryKey(ac.lat, ac.lon);
  const nearestQuery = useQuery({
    queryKey: ["nearest-airport", nearestKey],
    queryFn: () => fetchNearestAirport(ac.lat, ac.lon),
    staleTime: 60_000,
    retry: 1,
  });
  const atisIcao = nearestQuery.data?.icao ?? null;

  const photoQuery = useQuery({
    queryKey: ["aircraft-photo", ac.hex, ac.registration],
    queryFn: () => fetchAircraftPhoto(ac.hex, ac.registration),
    staleTime: 60 * 60_000,
    retry: 1,
  });

  const [brokenForHex, setBrokenForHex] = useState<string | null>(null);
  const [trackByHex, setTrackByHex] = useState<{
    hex: string;
    state: TrackShareState;
  }>({ hex: ac.hex, state: { status: "idle" } });
  const [copied, setCopied] = useState(false);

  const trackShare =
    trackByHex.hex === ac.hex ? trackByHex.state : { status: "idle" as const };
  const imgBroken = brokenForHex === ac.hex;
  const photoReady = photoQuery.data && !imgBroken ? photoQuery.data : null;
  const photo =
    photoQuery.isPending
      ? ({ status: "loading" } as const)
      : photoReady
        ? ({ status: "ready", ...photoReady } as const)
        : ({ status: "missing" } as const);

  async function createTrackShare() {
    if (!shareTail || trackShare.status === "pending") return;
    setTrackByHex({ hex: ac.hex, state: { status: "pending" } });
    try {
      const label =
        route?.origin.icao && route?.destination.icao
          ? `${route.origin.icao} to ${route.destination.icao}`
          : undefined;
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tailNumber: shareTail, label }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        path?: string;
        expiresAt?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.path || !data.expiresAt) {
        setTrackByHex({
          hex: ac.hex,
          state: {
            status: "error",
            message: data.error || "Could not create tracking link.",
          },
        });
        return;
      }
      setTrackByHex({
        hex: ac.hex,
        state: {
          status: "ready",
          path: data.path,
          expiresAt: data.expiresAt,
        },
      });
    } catch {
      setTrackByHex({
        hex: ac.hex,
        state: {
          status: "error",
          message: "Could not create tracking link.",
        },
      });
    }
  }

  async function copyShareLink(path: string) {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const showPhoto = photo.status === "ready" ? photo : null;
  const fallbackSvg = silhouetteSvgMarkup(
    ac.category,
    markerColor,
    compact ? 56 : 72,
    "#0a0a0a"
  );

  return (
    <div
      className={cn(
        "text-slate-200",
        compact ? "space-y-1.5 text-sm" : "space-y-2 text-sm"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-sm border border-[var(--ink-border)] bg-[var(--ink)]",
            compact ? "h-16 w-[7.25rem]" : "h-[4.5rem] w-36"
          )}
        >
          {showPhoto ? (
            <Image
              src={showPhoto.thumbnailUrl}
              alt={`${title} aircraft photo`}
              fill
              unoptimized
              className="object-cover"
              sizes="144px"
              onError={() => setBrokenForHex(ac.hex)}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center opacity-90"
              aria-hidden={photo.status === "loading"}
              dangerouslySetInnerHTML={{ __html: fallbackSvg }}
            />
          )}
          {photo.status === "loading" && (
            <div className="absolute inset-0 animate-pulse bg-[var(--ink-elevated)]/50" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-base font-bold text-slate-50">
                {title}
              </p>
              {reg && (
                <p className="font-mono text-xs text-slate-400">Tail {reg}</p>
              )}
              <p
                className="text-[11px] font-medium"
                style={{ color: markerColor }}
              >
                {onGround ? "On ground" : cat.label}
                {ac.type ? ` — ${ac.type}` : ""}
              </p>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-800 hover:text-slate-200"
              >
                Close
              </button>
            )}
          </div>
          {showPhoto ? (
            <p className="mt-1 text-[10px] leading-snug text-slate-500">
              Photo{" "}
              <a
                href={showPhoto.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--scope-cyan)] underline-offset-2 hover:underline"
              >
                {showPhoto.photographer}
              </a>{" "}
              via{" "}
              <a
                href="https://www.planespotters.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--scope-cyan)] underline-offset-2 hover:underline"
              >
                planespotters.net
              </a>
            </p>
          ) : photo.status === "missing" || imgBroken ? (
            <p className="mt-1 text-[10px] text-slate-500">
              No spotter photo — type silhouette
            </p>
          ) : null}
        </div>
      </div>

      {emergency && ac.squawk ? (
        <EmergencySquawkBanner
          compact
          code={ac.squawk}
          title={squawkMeaning?.title ?? "Emergency discrete"}
        />
      ) : null}

      <dl className="grid grid-cols-[7.5rem_1fr] gap-x-2 gap-y-1 text-xs">
        <dt className="text-[var(--ink-muted)]">Altitude (ft)</dt>
        <dd className="font-mono tabular-nums text-[var(--ink-text)]">
          {fmtAlt(ac.alt_baro)}
        </dd>
        <dt className="text-[var(--ink-muted)]">Groundspeed (kt)</dt>
        <dd className="font-mono tabular-nums text-[var(--ink-text)]">
          {ac.gs != null ? `${Math.round(ac.gs)} kt` : "—"}
        </dd>
        <dt className="text-[var(--ink-muted)]">Track (°)</dt>
        <dd className="font-mono tabular-nums text-[var(--ink-text)]">
          {ac.track != null
            ? `${String(Math.round(ac.track)).padStart(3, "0")}°`
            : "—"}
        </dd>
        <dt className="text-[var(--ink-muted)]">Vertical speed (fpm)</dt>
        <dd className="font-mono tabular-nums text-[var(--ink-text)]">
          {fmtRate(ac.baro_rate)}
        </dd>
        <dt className="text-[var(--ink-muted)]">Squawk</dt>
        <dd className="font-mono tabular-nums text-[var(--ink-text)]">
          {emergency ? (
            <span className="font-bold text-[#ffb4a8]">
              {ac.squawk} emergency
            </span>
          ) : (
            <>
              {ac.squawk ?? "—"}
              {squawkMeaning ? (
                <span className="ml-1.5 text-[10px] font-sans font-medium text-[var(--ink-muted)]">
                  {squawkMeaning.title}
                </span>
              ) : null}
            </>
          )}
        </dd>
        <dt className="text-slate-500">Origin</dt>
        <dd className="font-mono tabular-nums text-slate-100">
          {route?.origin.icao ?? "—"}
          {route?.origin.name ? (
            <span className="ml-1.5 font-sans text-[10px] font-medium text-slate-400">
              {route.origin.name}
            </span>
          ) : null}
        </dd>
        <dt className="text-slate-500">Destination</dt>
        <dd className="font-mono tabular-nums text-slate-100">
          {route?.destination.icao ?? "—"}
          {route?.destination.name ? (
            <span className="ml-1.5 font-sans text-[10px] font-medium text-slate-400">
              {route.destination.name}
            </span>
          ) : null}
        </dd>
        <dt className="text-slate-500">Type</dt>
        <dd className="font-mono tabular-nums text-slate-100">
          {ac.type ?? "—"}
        </dd>
        <dt className="text-slate-500">Mode-S</dt>
        <dd className="font-mono tabular-nums text-slate-100">
          {ac.hex.toUpperCase()}
        </dd>
        <dt className="text-slate-500">Position</dt>
        <dd className="font-mono tabular-nums text-slate-100">
          {ac.lat.toFixed(4)}, {ac.lon.toFixed(4)}
        </dd>
      </dl>

      <div className="flex flex-col gap-1.5 pt-1">
        {onToggleFollow ? (
          <button
            type="button"
            onClick={onToggleFollow}
            className={cn(
              "inline-flex items-center justify-center rounded-sm px-2.5 py-1.5 text-[11px] font-semibold",
              following
                ? "bg-[var(--scope-cyan)] text-[#0e1116] hover:bg-[var(--scope-cyan-dim)] hover:text-slate-100"
                : "border border-[var(--ink-border)] bg-[var(--ink)] text-slate-200 hover:border-[var(--bezel)]"
            )}
          >
            {following ? "Following — tap to stop" : "Follow aircraft"}
          </button>
        ) : null}

        {allowTrackShare && shareTail ? (
          <div className="space-y-1.5">
            {trackShare.status === "ready" ? (
              <div className="rounded-sm border border-[var(--ink-border)] bg-[var(--ink)] px-2.5 py-2">
                <p className="text-[10px] font-medium text-slate-400">
                  Read-only link · expires{" "}
                  {new Date(trackShare.expiresAt).toLocaleString()}
                </p>
                <div className="mt-1.5 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => void copyShareLink(trackShare.path)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-[var(--scope-cyan)] px-2.5 py-1.5 text-[11px] font-semibold text-[#0e1116] hover:bg-[var(--scope-cyan-dim)] hover:text-slate-100"
                  >
                    <Link2 className="h-3.5 w-3.5" aria-hidden />
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <Link
                    href={trackShare.path}
                    target="_blank"
                    className="inline-flex items-center justify-center rounded-sm border border-[var(--ink-border)] px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-[var(--bezel)]"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void createTrackShare()}
                disabled={trackShare.status === "pending"}
                className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-[var(--ink-border)] bg-[var(--ink)] px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-[var(--bezel)] disabled:opacity-50"
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden />
                {trackShare.status === "pending"
                  ? "Creating link…"
                  : "Track this flight"}
              </button>
            )}
            {trackShare.status === "error" ? (
              <p className="text-[10px] leading-snug text-[#ffb4a8]">
                {trackShare.message}
              </p>
            ) : (
              <p className="text-[10px] leading-snug text-slate-500">
                Opt-in share for {shareTail} · expires in 24 hours · one aircraft
                only
              </p>
            )}
          </div>
        ) : null}

        {atisIcao ? (
          <Link
            href={`/weather/${atisIcao}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-[var(--ink-border)] bg-[var(--ink)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--scope-cyan)] hover:border-[var(--bezel)]"
          >
            <CloudSun className="h-3.5 w-3.5" aria-hidden />
            View {atisIcao} ATIS / METAR
            {nearestQuery.data && nearestQuery.data.distanceNm < 40 ? (
              <span className="font-mono text-[10px] font-normal text-slate-500">
                · {nearestQuery.data.distanceNm.toFixed(1)} nm
              </span>
            ) : null}
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-[var(--ink-border)] bg-[var(--ink)] px-2.5 py-1.5 text-[11px] font-semibold text-slate-500">
            <CloudSun className="h-3.5 w-3.5" aria-hidden />
            {nearestQuery.isPending
              ? "Finding nearest METAR…"
              : "Nearest METAR unavailable"}
          </span>
        )}
      </div>
    </div>
  );
}
