"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
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
import { computeHobbsSplit } from "@/lib/hobbs-splitter";
import { formatCurrency } from "@/lib/utils";
import { usePlannerStore } from "@/store/planner-store";
import { cn } from "@/lib/utils";

type HobbsSplitterProps = {
  /** Dialog trigger (legacy) vs always-visible page form. */
  mode?: "dialog" | "page";
  triggerClassName?: string;
  className?: string;
};

export function HobbsSplitter({
  mode = "dialog",
  triggerClassName,
  className,
}: HobbsSplitterProps) {
  const aircraft = usePlannerStore((s) => s.aircraft);
  const [open, setOpen] = useState(false);
  const [hobbsStart, setHobbsStart] = useState("0.0");
  const [hobbsEnd, setHobbsEnd] = useState("1.5");
  const [fuelBurnGph, setFuelBurnGph] = useState(
    String(aircraft.fuelBurnGph)
  );
  const [fuelPrice, setFuelPrice] = useState("6.25");
  const [dryRate, setDryRate] = useState(
    String(aircraft.hourlyOperatingCost || 175)
  );
  const [engineReserve, setEngineReserve] = useState("25");
  const [passengers, setPassengers] = useState("2");

  const result = useMemo(() => {
    return computeHobbsSplit({
      hobbsStart: Number(hobbsStart),
      hobbsEnd: Number(hobbsEnd),
      fuelBurnGph: Number(fuelBurnGph),
      fuelPricePerGal: Number(fuelPrice),
      dryRatePerHour: Number(dryRate),
      engineReservePerHour: Number(engineReserve),
      passengers: Math.max(1, Math.floor(Number(passengers) || 1)),
    });
  }, [
    hobbsStart,
    hobbsEnd,
    fuelBurnGph,
    fuelPrice,
    dryRate,
    engineReserve,
    passengers,
  ]);

  const form = (
    <HobbsForm
      hobbsStart={hobbsStart}
      setHobbsStart={setHobbsStart}
      hobbsEnd={hobbsEnd}
      setHobbsEnd={setHobbsEnd}
      fuelBurnGph={fuelBurnGph}
      setFuelBurnGph={setFuelBurnGph}
      fuelPrice={fuelPrice}
      setFuelPrice={setFuelPrice}
      dryRate={dryRate}
      setDryRate={setDryRate}
      engineReserve={engineReserve}
      setEngineReserve={setEngineReserve}
      passengers={passengers}
      setPassengers={setPassengers}
      result={result}
      tone="dark"
    />
  );

  if (mode === "page") {
    return <div className={cn("space-y-6", className)}>{form}</div>;
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
          <Calculator className="h-3.5 w-3.5" />
          Hobbs Splitter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wet / Dry Flight Cost Splitter</DialogTitle>
          <DialogDescription>
            Split Hobbs time, fuel, dry rate, and engine reserve across pilots
            and passengers.
          </DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}

/** @deprecated Prefer HobbsSplitter — kept for existing imports. */
export function HobbsSplitterDrawer(props: {
  triggerClassName?: string;
}) {
  return <HobbsSplitter mode="dialog" {...props} />;
}

function HobbsForm({
  hobbsStart,
  setHobbsStart,
  hobbsEnd,
  setHobbsEnd,
  fuelBurnGph,
  setFuelBurnGph,
  fuelPrice,
  setFuelPrice,
  dryRate,
  setDryRate,
  engineReserve,
  setEngineReserve,
  passengers,
  setPassengers,
  result,
  tone,
}: {
  hobbsStart: string;
  setHobbsStart: (v: string) => void;
  hobbsEnd: string;
  setHobbsEnd: (v: string) => void;
  fuelBurnGph: string;
  setFuelBurnGph: (v: string) => void;
  fuelPrice: string;
  setFuelPrice: (v: string) => void;
  dryRate: string;
  setDryRate: (v: string) => void;
  engineReserve: string;
  setEngineReserve: (v: string) => void;
  passengers: string;
  setPassengers: (v: string) => void;
  result: ReturnType<typeof computeHobbsSplit>;
  tone: "light" | "dark";
}) {
  const dark = tone === "dark";

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="hobbs-start"
          label="Hobbs start (hr)"
          value={hobbsStart}
          onChange={setHobbsStart}
          step="0.1"
          dark={dark}
        />
        <Field
          id="hobbs-end"
          label="Hobbs end (hr)"
          value={hobbsEnd}
          onChange={setHobbsEnd}
          step="0.1"
          dark={dark}
        />
        <Field
          id="burn"
          label="Fuel burn (gal/hr)"
          value={fuelBurnGph}
          onChange={setFuelBurnGph}
          step="0.1"
          dark={dark}
        />
        <Field
          id="fuel-price"
          label="Fuel price ($/gal)"
          value={fuelPrice}
          onChange={setFuelPrice}
          step="0.01"
          dark={dark}
        />
        <Field
          id="dry-rate"
          label="Rental / dry rate ($/hr)"
          value={dryRate}
          onChange={setDryRate}
          step="1"
          dark={dark}
        />
        <Field
          id="reserve"
          label="Engine reserve ($/hr)"
          value={engineReserve}
          onChange={setEngineReserve}
          step="1"
          dark={dark}
        />
        <Field
          id="pax"
          label="Pilots / passengers"
          value={passengers}
          onChange={setPassengers}
          step="1"
          min="1"
          dark={dark}
        />
      </div>

      {result ? (
        <div
          className={cn(
            "rounded-xl border p-4",
            dark
              ? "instrument-inset border-[var(--ink-border)]"
              : "border-panel-border bg-slate-50"
          )}
        >
          <p
            className={cn(
              "text-xs font-medium uppercase tracking-wide",
              dark ? "text-slate-500" : "text-slate-400"
            )}
          >
            Results · {result.flightHours.toFixed(2)} hr Hobbs
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <ResultRow
              label="Fuel used (gal)"
              value={`${result.fuelGallons} gal`}
              dark={dark}
            />
            <ResultRow
              label="Total fuel cost"
              value={formatCurrency(result.totalFuelCost)}
              dark={dark}
            />
            <ResultRow
              label="Total rental (dry)"
              value={formatCurrency(result.totalRentalFee)}
              dark={dark}
            />
            <ResultRow
              label="Engine reserve"
              value={formatCurrency(result.engineReserve)}
              dark={dark}
            />
            <ResultRow
              label="Wet-rate equiv."
              value={`${formatCurrency(result.wetRateEquivalent)}/hr`}
              dark={dark}
            />
            <ResultRow
              label="Grand total"
              value={formatCurrency(result.totalCost)}
              emphasize
              dark={dark}
            />
            <ResultRow
              label="Cost per person"
              value={formatCurrency(result.costPerPerson)}
              emphasize
              dark={dark}
            />
          </dl>
        </div>
      ) : (
        <p className={cn("text-sm", dark ? "text-slate-500" : "text-slate-500")}>
          Enter a Hobbs end greater than start to calculate.
        </p>
      )}
    </>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  step,
  min,
  dark,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  min?: string;
  dark?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className={dark ? "text-slate-400" : undefined}
      >
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "font-mono tabular-nums",
          dark &&
            "border-[var(--ink-border)] bg-[var(--ink-elevated)] text-slate-100 placeholder:text-slate-600"
        )}
      />
    </div>
  );
}

function ResultRow({
  label,
  value,
  emphasize,
  dark,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  dark?: boolean;
}) {
  return (
    <div>
      <dt className={cn("text-xs", dark ? "text-slate-500" : "text-slate-400")}>
        {label}
      </dt>
      <dd
        className={
          emphasize
            ? "font-mono text-base font-bold tabular-nums text-[var(--signal-green)]"
            : cn(
                "font-mono font-semibold tabular-nums",
                dark ? "text-slate-100" : "text-slate-900"
              )
        }
      >
        {value}
      </dd>
    </div>
  );
}
