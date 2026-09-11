"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Navigation2, Wind } from "lucide-react";
import { MetarBadge } from "@/components/weather/MetarBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  computeWindComponents,
  crosswindWarning,
  rankRunwaysForWind,
  runwayEndsForAirport,
  type WindComponents,
} from "@/lib/crosswind";
import { cn, normalizeIcao } from "@/lib/utils";
import type { Airport, AirportRunwayEnd, ParsedMetar } from "@/types";

type CrosswindAnalyzerProps = {
  defaultIcao?: string;
  triggerClassName?: string;
  /** Dialog trigger vs always-on page workspace. */
  mode?: "dialog" | "page";
  className?: string;
};

async function loadAirport(icao: string): Promise<Airport | null> {
  const res = await fetch(`/api/airports/${encodeURIComponent(icao)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Airport lookup failed");
  return res.json();
}

async function loadMetar(icao: string): Promise<ParsedMetar | null> {
  const res = await fetch(`/api/metar?icao=${encodeURIComponent(icao)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.metar ?? null;
}

function CrosswindBody({
  defaultIcao,
  active,
  tone = "light",
}: {
  defaultIcao: string;
  active: boolean;
  tone?: "light" | "dark";
}) {
  const [icaoInput, setIcaoInput] = useState(defaultIcao);
  const [activeIcao, setActiveIcao] = useState(normalizeIcao(defaultIcao));
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const dark = tone === "dark";

  const airportQuery = useQuery({
    queryKey: ["airport-detail", activeIcao],
    queryFn: () => loadAirport(activeIcao),
    enabled: active && activeIcao.length >= 3,
  });

  const metarQuery = useQuery({
    queryKey: ["metar", activeIcao],
    queryFn: () => loadMetar(activeIcao),
    enabled: active && activeIcao.length >= 3,
    staleTime: 5 * 60_000,
  });

  const ends = useMemo(() => {
    if (!airportQuery.data) return [];
    return runwayEndsForAirport(airportQuery.data);
  }, [airportQuery.data]);

  const ranked = useMemo(() => {
    const metar = metarQuery.data;
    if (!ends.length || !metar || metar.windDirDeg == null) return [];
    return rankRunwaysForWind(ends, metar.windDirDeg, metar.windSpeedKt);
  }, [ends, metarQuery.data]);

  // Prefer the best into-wind runway when wind/airport data arrives.
  useEffect(() => {
    if (selectedEnd) return;
    const best = ranked.find((r) => r.recommended) ?? ranked[0];
    if (best) setSelectedEnd(best.ident);
  }, [ranked, selectedEnd]);

  const selectedRanked = useMemo(() => {
    if (!ranked.length) return null;
    return ranked.find((e) => e.ident === selectedEnd) ?? ranked[0] ?? null;
  }, [ranked, selectedEnd]);

  const selectedBasic: AirportRunwayEnd | null = useMemo(() => {
    if (selectedRanked) return selectedRanked;
    if (!ends.length) return null;
    return ends.find((e) => e.ident === selectedEnd) ?? ends[0] ?? null;
  }, [selectedRanked, ends, selectedEnd]);

  const components: WindComponents | null = useMemo(() => {
    if (selectedRanked) {
      return {
        headwindKt: selectedRanked.headwindKt,
        crosswindKt: selectedRanked.crosswindKt,
        crosswindSignedKt: selectedRanked.crosswindSignedKt,
        angleDeg: selectedRanked.angleDeg,
      };
    }
    const metar = metarQuery.data;
    if (!selectedBasic || !metar || metar.windDirDeg == null) return null;
    return computeWindComponents(
      metar.windDirDeg,
      metar.windSpeedKt,
      selectedBasic.headingDegT
    );
  }, [selectedRanked, selectedBasic, metarQuery.data]);

  const warn = components ? crosswindWarning(components.crosswindKt) : null;
  const recommended = ranked.filter((r) => r.recommended);
  const selected = selectedBasic;

  function applyIcao() {
    const next = normalizeIcao(icaoInput);
    if (next.length >= 3) {
      setActiveIcao(next);
      setSelectedEnd(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[140px] flex-1 space-y-1.5">
          <Label
            htmlFor="xw-icao"
            className={dark ? "text-slate-400" : undefined}
          >
            Airport ICAO
          </Label>
          <Input
            id="xw-icao"
            value={icaoInput}
            onChange={(e) => setIcaoInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && applyIcao()}
            className={cn(
              "font-avionics uppercase",
              dark &&
                "border-[var(--ink-border)] bg-[var(--ink-elevated)] text-slate-100"
            )}
            maxLength={4}
          />
        </div>
        <Button type="button" onClick={applyIcao}>
          Load
        </Button>
      </div>

      <div className={dark ? "rounded-sm" : undefined}>
        <MetarBadge airportIcao={activeIcao} variant="card" />
      </div>

      {airportQuery.isLoading && (
        <p className={cn("text-sm", dark ? "text-slate-500" : "text-slate-500")}>
          Loading runways…
        </p>
      )}
      {airportQuery.data && ends.length === 0 && (
        <p className="text-sm text-slate-500">No runway data for this field.</p>
      )}

      {metarQuery.data?.windDirDeg == null && ends.length > 0 && (
        <p className="text-sm text-slate-500">
          Waiting on wind direction to recommend a runway (calm / VRB METAR).
        </p>
      )}

      {recommended.length > 0 && (
        <div
          className={cn(
            "space-y-3 rounded-xl border p-4",
            dark
              ? "instrument-inset border-[var(--ink-border)]"
              : "border-panel-border bg-slate-50"
          )}
        >
          <div className="flex items-start gap-2">
            <Wind
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                dark ? "text-[var(--signal-green)]" : "text-accent"
              )}
            />
            <div>
              <p
                className={cn(
                  "font-avionics text-sm font-semibold",
                  dark ? "text-slate-100" : "text-slate-900"
                )}
              >
                Recommended runway
                {recommended.length > 1 ? "s" : ""} — land into the wind
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Wind from {metarQuery.data?.windDirDeg}° at{" "}
                {metarQuery.data?.windSpeedKt ?? "—"} kt. Prefer the end with the
                most headwind.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {recommended.map((rwy, i) => (
              <button
                key={`rec-${rwy.ident}`}
                type="button"
                onClick={() => setSelectedEnd(rwy.ident)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition",
                  selected?.ident === rwy.ident
                    ? dark
                      ? "border-[var(--signal-green)]/55 bg-emerald-950/45"
                      : "border-accent bg-emerald-50"
                    : dark
                      ? "border-[var(--ink-border)] bg-[var(--ink-elevated)] hover:border-slate-600"
                      : "border-[var(--ink-border)] bg-white hover:border-[var(--bezel)]"
                )}
              >
                <div>
                  <p
                    className={cn(
                      "font-avionics text-base font-semibold",
                      dark ? "text-slate-100" : "text-slate-900"
                    )}
                  >
                    RWY {rwy.ident}
                    {i === 0 && (
                      <span
                        className={cn(
                          "ml-2 text-[10px] font-bold uppercase tracking-wide",
                          dark ? "text-[var(--signal-green)]" : "text-accent"
                        )}
                      >
                        Best
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Hdg {Math.round(rwy.headingDegT)}°T ·{" "}
                    {rwy.lengthFt.toLocaleString()} × {rwy.widthFt} ft
                  </p>
                </div>
                <div className="text-right font-avionics text-xs">
                  <p
                    className={cn(
                      "font-semibold",
                      dark ? "text-slate-100" : "text-slate-900"
                    )}
                  >
                    HW {rwy.headwindKt.toFixed(1)} kt
                  </p>
                  <p className="text-slate-500">
                    XW {rwy.crosswindKt.toFixed(1)} kt
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {ranked.length > 0 && (
        <div className="space-y-2">
          <Label className={dark ? "text-slate-400" : undefined}>
            All runway ends
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {ranked.map((end) => (
              <button
                key={`${end.ident}-${end.headingDegT}`}
                type="button"
                onClick={() => setSelectedEnd(end.ident)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 font-avionics text-xs font-semibold transition",
                  selected?.ident === end.ident
                    ? dark
                      ? "border-[var(--signal-green)]/50 bg-emerald-950/40 text-[var(--signal-green)]"
                      : "border-accent bg-emerald-50 text-accent"
                    : dark
                      ? "border-[var(--ink-border)] bg-[var(--ink-elevated)] text-slate-300 hover:border-slate-600"
                      : "border-[var(--ink-border)] bg-[var(--ink-elevated)] text-[var(--ink-text)] hover:border-[var(--bezel)]"
                )}
              >
                RWY {end.ident}
                <span
                  className={cn(
                    "ml-1 font-normal",
                    end.headwindKt >= 0
                      ? dark
                        ? "text-[var(--signal-green)]/80"
                        : "text-accent"
                      : dark
                        ? "text-slate-500"
                        : "text-slate-400"
                  )}
                >
                  {end.headwindKt >= 0 ? "HW" : "TW"}{" "}
                  {Math.abs(end.headwindKt).toFixed(0)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && components && metarQuery.data && (
        <div
          className={cn(
            "space-y-3 rounded-xl border p-4",
            dark
              ? "instrument-inset border-[var(--ink-border)]"
              : "border-panel-border bg-slate-50"
          )}
        >
          <p
            className={cn(
              "font-avionics text-sm font-semibold",
              dark ? "text-slate-100" : "text-slate-900"
            )}
          >
            RWY {selected.ident} components
          </p>
          {warn && warn.level !== "ok" && (
            <p
              className={cn(
                "flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
                warn.level === "warning"
                  ? dark
                    ? "bg-red-950/50 text-red-200"
                    : "bg-red-50 text-red-800"
                  : dark
                    ? "bg-amber-950/40 text-amber-100"
                    : "bg-amber-50 text-amber-900"
              )}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {warn.label}
            </p>
          )}
          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-[var(--ink-muted)]">Crosswind (kt)</dt>
              <dd
                className={cn(
                  "font-avionics text-sm font-semibold",
                  dark ? "text-slate-100" : "text-slate-900"
                )}
              >
                {components.crosswindKt.toFixed(1)} kt
                <span className="ml-1 font-normal text-slate-500">
                  {components.crosswindSignedKt >= 0 ? "R" : "L"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">
                {components.headwindKt >= 0 ? "Headwind (kt)" : "Tailwind (kt)"}
              </dt>
              <dd
                className={cn(
                  "font-avionics text-sm font-semibold",
                  dark ? "text-slate-100" : "text-slate-900"
                )}
              >
                {Math.abs(components.headwindKt).toFixed(1)} kt
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Wind angle (°)</dt>
              <dd
                className={cn(
                  "font-avionics text-sm font-semibold",
                  dark ? "text-slate-100" : "text-slate-900"
                )}
              >
                {components.angleDeg.toFixed(0)}°
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Runway (ft)</dt>
              <dd
                className={cn(
                  "font-avionics text-sm font-semibold",
                  dark ? "text-slate-100" : "text-slate-900"
                )}
              >
                {selected.lengthFt.toLocaleString()} × {selected.widthFt} ft
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

export function CrosswindAnalyzer({
  defaultIcao = "KAPA",
  triggerClassName,
  mode = "dialog",
  className,
}: CrosswindAnalyzerProps) {
  const [open, setOpen] = useState(false);

  if (mode === "page") {
    return (
      <div className={cn("instrument-panel p-5 sm:p-6", className)}>
        <CrosswindBody defaultIcao={defaultIcao} active tone="dark" />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={triggerClassName}
          type="button"
        >
          <Navigation2 className="h-3.5 w-3.5" />
          Runway & Crosswind
        </Button>
      </DialogTrigger>
      <DialogContent className="night-ui max-h-[90vh] max-w-xl overflow-y-auto border-[var(--ink-border)] bg-[var(--ink)] text-[var(--ink-text)]">
        <DialogHeader>
          <DialogTitle>Runway & Crosswind Analyzer</DialogTitle>
          <DialogDescription>
            Recommended into-the-wind runways from live METAR and catalog
            headings (true).
          </DialogDescription>
        </DialogHeader>
        <CrosswindBody defaultIcao={defaultIcao} active={open} tone="dark" />
      </DialogContent>
    </Dialog>
  );
}
