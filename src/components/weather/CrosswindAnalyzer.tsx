"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Navigation2, Plane } from "lucide-react";
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
  runwayEndsForAirport,
} from "@/lib/crosswind";
import { cn, normalizeIcao } from "@/lib/utils";
import type { Airport, ParsedMetar } from "@/types";

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

function RunwayGraphic({
  runwayHeading,
  windDir,
  crosswindKt,
  headwindKt,
}: {
  runwayHeading: number;
  windDir: number | null;
  crosswindKt: number;
  headwindKt: number;
}) {
  const warn = crosswindWarning(crosswindKt);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[240px]">
      <div className="absolute inset-0 rounded-full border border-[var(--ink-border)] bg-[#0a0d13]" />
      {["N", "E", "S", "W"].map((label, i) => (
        <span
          key={label}
          className="absolute left-1/2 top-1/2 font-avionics text-[10px] font-semibold text-slate-500"
          style={{
            transform: `rotate(${i * 90}deg) translateY(-96px) rotate(${-i * 90}deg) translateX(-50%)`,
          }}
        >
          {label}
        </span>
      ))}
      <div
        className="absolute left-1/2 top-1/2 h-[70%] w-8 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-slate-600 shadow-sm"
        style={{ transform: `translate(-50%, -50%) rotate(${runwayHeading}deg)` }}
      >
        <div className="absolute inset-x-1 top-2 bottom-2 border-x border-dashed border-[#c4a46a]/45" />
        <Plane
          className="absolute left-1/2 top-3 h-4 w-4 -translate-x-1/2 text-[var(--ink-text)]"
          style={{ transform: "translateX(-50%)" }}
        />
      </div>
      {windDir != null && (
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `rotate(${windDir}deg) translateY(-78px)`,
          }}
        >
          <Navigation2
            className={cn(
              "h-5 w-5 -rotate-45",
              warn.level === "warning"
                ? "text-[var(--signal-red)]"
                : warn.level === "caution"
                  ? "text-[var(--signal-amber)]"
                  : "text-[var(--signal-green)]"
            )}
            fill="currentColor"
          />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-2 text-center">
        <p className="font-avionics text-xs font-semibold text-slate-200">
          XW {crosswindKt.toFixed(1)} kt ·{" "}
          {headwindKt >= 0 ? "HW" : "TW"} {Math.abs(headwindKt).toFixed(1)} kt
        </p>
      </div>
    </div>
  );
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

  const selected = useMemo(() => {
    if (!ends.length) return null;
    return ends.find((e) => e.ident === selectedEnd) ?? ends[0];
  }, [ends, selectedEnd]);

  const components = useMemo(() => {
    const metar = metarQuery.data;
    if (!selected || !metar || metar.windDirDeg == null) return null;
    return computeWindComponents(
      metar.windDirDeg,
      metar.windSpeedKt,
      selected.headingDegT
    );
  }, [selected, metarQuery.data]);

  const warn = components ? crosswindWarning(components.crosswindKt) : null;

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

      {ends.length > 0 && (
        <div className="space-y-2">
          <Label className={dark ? "text-slate-400" : undefined}>
            Runway end
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {ends.map((end) => (
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
                    dark ? "text-slate-500" : "text-slate-400"
                  )}
                >
                  {Math.round(end.headingDegT)}°
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
          <RunwayGraphic
            runwayHeading={selected.headingDegT}
            windDir={metarQuery.data.windDirDeg}
            crosswindKt={components.crosswindKt}
            headwindKt={components.headwindKt}
          />
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
            Wind components from live METAR against catalog runway headings
            (true).
          </DialogDescription>
        </DialogHeader>
        <CrosswindBody defaultIcao={defaultIcao} active={open} tone="dark" />
      </DialogContent>
    </Dialog>
  );
}
