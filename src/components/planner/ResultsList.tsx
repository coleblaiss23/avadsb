"use client";

import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { PriceUpdateModal } from "@/components/fuel/PriceUpdateModal";
import { Button } from "@/components/ui/button";
import {
  buildFlightPlanGpx,
  buildSkyVectorUrl,
  downloadGpx,
  formatDetourPenalty,
} from "@/lib/export-plan";
import { verificationTag } from "@/lib/fuel-pricing-client";
import {
  formatCurrency,
  formatNm,
  getPriceSeverity,
  PRICE_SEVERITY_COLORS,
  fuelStopLabeled,
  FUEL_DISPLAY_FILTERS,
} from "@/lib/utils";
import { usePlannerStore } from "@/store/planner-store";
import type { FuelStopCandidate } from "@/types";

export function ResultsList() {
  const result = usePlannerStore((s) => s.result);
  const selectedStopIcao = usePlannerStore((s) => s.selectedStopIcao);
  const selectCandidate = usePlannerStore((s) => s.selectCandidate);
  const fuelType = usePlannerStore((s) => s.fuelType);
  const fuelMapFilter = usePlannerStore((s) => s.fuelMapFilter);
  const setFuelMapFilter = usePlannerStore((s) => s.setFuelMapFilter);

  const [reportIcao, setReportIcao] = useState<string | null>(null);
  const [reportName, setReportName] = useState<string | undefined>();

  if (!result) {
    return (
      <div className="rounded-sm border border-dashed border-[var(--ink-border)] bg-[var(--ink)] px-4 py-6 text-center text-sm text-slate-500">
        Enter origin and destination, then search the corridor. Try{" "}
        <span className="font-avionics text-slate-300">origin → destination</span> with a
        25 NM corridor.
      </div>
    );
  }

  const profitable = result.candidates.filter((c) => c.netSavings > 0);
  const shown = result.candidates
    .filter((c) =>
      fuelStopLabeled(fuelMapFilter, {
        always: c.airport.icao === selectedStopIcao,
        rank: c.rank,
        price: c.airport.fuel?.pricePerGallon,
        netSavings: c.netSavings,
      })
    )
    .slice(0, fuelMapFilter === "all" ? 20 : 12);
  const selectedStop =
    result.candidates.find((c) => c.airport.icao === selectedStopIcao)
      ?.airport ?? result.candidates[0]?.airport;

  function exportGpx() {
    const gpx = buildFlightPlanGpx(result!, selectedStopIcao);
    const stop = selectedStopIcao ?? "DIRECT";
    downloadGpx(
      `AVFUEL-${result!.origin.icao}-${stop}-${result!.destination.icao}.gpx`,
      gpx
    );
  }

  function openSkyVector() {
    const stop = selectedStop
      ? {
          lat: selectedStop.latitude,
          lng: selectedStop.longitude,
          icao: selectedStop.icao,
        }
      : null;
    window.open(
      buildSkyVectorUrl(
        {
          lat: result!.origin.latitude,
          lng: result!.origin.longitude,
          icao: result!.origin.icao,
        },
        {
          lat: result!.destination.latitude,
          lng: result!.destination.longitude,
          icao: result!.destination.icao,
        },
        stop
      ),
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Ranked savings
          </h2>
          <p className="mt-0.5 font-avionics text-xs text-slate-500">
            {formatNm(result.corridor.directDistanceNm)} direct — Dest{" "}
            {formatCurrency(result.destinationPrice)}/gal — {shown.length} shown
            / {profitable.length} profitable
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {FUEL_DISPLAY_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFuelMapFilter(item.id)}
              className={
                fuelMapFilter === item.id
                  ? "border border-[var(--scope-cyan)]/40 bg-[var(--scope-cyan)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--scope-cyan)]"
                  : "border border-[var(--ink-border)] px-2 py-0.5 text-[10px] text-slate-400 hover:text-slate-200"
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-[var(--ink-border)] bg-transparent text-slate-200 hover:bg-[var(--ink)]"
            onClick={exportGpx}
          >
            <Download className="h-3.5 w-3.5" />
            GPX
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-[var(--ink-border)] bg-transparent text-slate-200 hover:bg-[var(--ink)]"
            onClick={openSkyVector}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            SkyVector
          </Button>
        </div>
      </div>

      <div className="max-h-[min(48vh,480px)] overflow-auto border border-[var(--ink-border)] bg-[var(--ink)]">
        <table className="deck-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Airport</th>
              <th>Detour (NM)</th>
              <th>Price ($/gal)</th>
              <th>Fill ($)</th>
              <th>Net ($)</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No runway-capable stops in this corridor.
                </td>
              </tr>
            )}
            {shown.map((c) => (
              <MatrixRow
                key={c.airport.icao}
                candidate={c}
                selected={selectedStopIcao === c.airport.icao}
                onSelect={() => selectCandidate(c)}
                onReport={() => {
                  setReportIcao(c.airport.icao);
                  setReportName(c.airport.name);
                }}
              />
            ))}
          </tbody>
        </table>
      </div>

      {reportIcao && (
        <PriceUpdateModal
          open={!!reportIcao}
          onOpenChange={(o) => !o && setReportIcao(null)}
          airportIcao={reportIcao}
          airportName={reportName}
          defaultFuelType={fuelType}
        />
      )}
    </div>
  );
}

function MatrixRow({
  candidate: c,
  selected,
  onSelect,
  onReport,
}: {
  candidate: FuelStopCandidate;
  selected: boolean;
  onSelect: () => void;
  onReport: () => void;
}) {
  const price = c.airport.fuel?.pricePerGallon ?? 0;
  const severity = getPriceSeverity(price);
  const priceColor = PRICE_SEVERITY_COLORS[severity];
  const verify = c.airport.fuel ? verificationTag(c.airport.fuel) : "";

  return (
    <tr className={selected ? "is-selected" : undefined} onClick={onSelect}>
      <td className="font-avionics text-slate-400">{c.rank}</td>
      <td>
        <div className="font-avionics font-semibold text-slate-100">
          {c.airport.icao}
          {c.airport.faa && c.airport.faa !== c.airport.icao ? (
            <span className="font-normal text-slate-500"> / {c.airport.faa}</span>
          ) : null}
        </div>
        <div className="max-w-[140px] truncate text-[11px] text-slate-500">
          {c.airport.name}
        </div>
      </td>
      <td className="font-avionics text-[11px] text-slate-400">
        {formatDetourPenalty(c.detourNm, c.detourTimeHours)}
      </td>
      <td>
        <div className={`font-avionics font-semibold ${priceColor.tw}`}>
          {formatCurrency(price)}
          <span className="font-normal text-slate-400">/gal</span>
        </div>
        <button
          type="button"
          className="block max-w-[150px] truncate text-left text-[10px] text-slate-400 hover:text-accent"
          title={verify}
          onClick={(e) => {
            e.stopPropagation();
            onReport();
          }}
        >
          {verify}
        </button>
      </td>
      <td className="font-avionics text-slate-400">
        {formatCurrency(c.totalFillCost)}
      </td>
      <td
        className={`font-avionics text-sm font-bold ${
          c.netSavings >= 0 ? "text-accent" : "text-ifr"
        }`}
      >
        {c.netSavings >= 0 ? "+" : ""}
        {formatCurrency(c.netSavings)}
      </td>
    </tr>
  );
}
