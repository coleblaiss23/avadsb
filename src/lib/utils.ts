import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PriceSeverity } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, digits = 2): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(digits)}`;
}

export function formatNm(nm: number): string {
  return `${nm.toFixed(1)} NM`;
}

export function formatHours(hours: number): string {
  if (hours < 1) {
    return `${(hours * 60).toFixed(1)} min`;
  }
  return `${hours.toFixed(2)} hr`;
}

export function getPriceSeverity(pricePerGallon: number): PriceSeverity {
  if (pricePerGallon < 5.5) return "low";
  if (pricePerGallon <= 6.8) return "average";
  return "high";
}

export const PRICE_SEVERITY_COLORS: Record<
  PriceSeverity,
  { fill: string; label: string; tw: string; pillClass: string }
> = {
  low: {
    fill: "#00A36C",
    label: "Lowest percentile",
    tw: "text-accent",
    pillClass: "afm-pill--low",
  },
  average: {
    fill: "#64748B",
    label: "Average",
    tw: "text-slate-500",
    pillClass: "afm-pill--average",
  },
  high: {
    fill: "#DC2626",
    label: "High",
    tw: "text-ifr",
    pillClass: "afm-pill--high",
  },
};

export type FuelDisplayFilter = "top" | "under6" | "profitable" | "all";

export const FUEL_DISPLAY_FILTERS: { id: FuelDisplayFilter; label: string }[] = [
  { id: "top", label: "Top 8" },
  { id: "under6", label: "Under $6" },
  { id: "profitable", label: "Saves money" },
  { id: "all", label: "All stops" },
];

/** Whether a corridor stop should keep a price label under the current filter. */
export function fuelStopLabeled(
  filter: FuelDisplayFilter,
  opts: {
    always?: boolean;
    rank?: number;
    price?: number | null;
    netSavings?: number | null;
  }
): boolean {
  if (opts.always) return true;
  if (filter === "all") return true;
  if (filter === "top") return (opts.rank ?? 99) <= 8;
  if (filter === "under6") return opts.price != null && opts.price < 6;
  return (opts.netSavings ?? -1) > 0;
}

/** Map price tags. The ranked table carries the rest — labels must not stack. */
export const MAP_PRICE_LABEL_CAP = 6;

export function normalizeIcao(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
}
