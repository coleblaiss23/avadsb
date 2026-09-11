"use client";

import { useTransition } from "react";
import { Search } from "lucide-react";
import { AirportAutocomplete } from "@/components/planner/AirportAutocomplete";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { usePlannerStore } from "@/store/planner-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { FuelType, RouteOptimizationResult } from "@/types";

const DETOUR_OPTIONS = [10, 25, 50] as const;

export function RoutePlannerForm() {
  const [pending, startTransition] = useTransition();
  const {
    originIcao,
    destinationIcao,
    maxDetourNm,
    fuelType,
    error,
    setOrigin,
    setDestination,
    setMaxDetourNm,
    setFuelType,
    setResult,
    setError,
    setIsCalculating,
    setSelectedStop,
    setActivePanel,
    getInput,
  } = usePlannerStore();

  function onCalculate(e: React.FormEvent) {
    e.preventDefault();
    setActivePanel("fuel");
    setIsCalculating(true);
    setError(null);
    startTransition(async () => {
      try {
        const input = getInput();
        const res = await fetch("/api/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Optimization failed");
        }
        const result = data as RouteOptimizationResult;
        setResult(result);
        setSelectedStop(result.candidates[0]?.airport.icao ?? null);
        track(ANALYTICS_EVENTS.fuelSearch, {
          origin: input.originIcao,
          destination: input.destinationIcao,
          fuelType: input.fuelType,
        });
      } catch (err) {
        setResult(null);
        setError(err instanceof Error ? err.message : "Calculation failed");
      } finally {
        setIsCalculating(false);
      }
    });
  }

  return (
    <form onSubmit={onCalculate} className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-100">Plan a route</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Search 24,000+ US fields by ICAO or FAA ID
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AirportAutocomplete
          id="origin-icao"
          label="Origin"
          value={originIcao}
          onChange={setOrigin}
          placeholder="KAPA / APA"
        />
        <AirportAutocomplete
          id="dest-icao"
          label="Destination"
          value={destinationIcao}
          onChange={setDestination}
          placeholder="KSDL / SDL"
        />
      </div>

      <div className="space-y-2">
        <Label>Corridor width</Label>
        <div className="flex gap-2">
          {DETOUR_OPTIONS.map((nm) => (
            <Button
              key={nm}
              type="button"
              size="sm"
              variant={maxDetourNm === nm ? "default" : "outline"}
              className="font-avionics flex-1 border-[var(--ink-border)] bg-transparent text-slate-200 hover:bg-[var(--ink)] data-[state=on]:bg-[var(--scope-cyan)]"
              onClick={() => setMaxDetourNm(nm)}
            >
              {nm} NM
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Fuel type</Label>
        <div className="flex gap-2">
          {(["100LL", "Jet-A"] as FuelType[]).map((t) => (
            <Button
              key={t}
              type="button"
              size="sm"
              variant={fuelType === t ? "default" : "outline"}
              className="font-avionics flex-1 border-[var(--ink-border)] bg-transparent text-slate-200 hover:bg-[var(--ink)]"
              onClick={() => setFuelType(t)}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-sm border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        <Search className="h-4 w-4" />
        {pending ? "Searching corridor…" : "Find cheapest fuel stops"}
      </Button>
    </form>
  );
}
