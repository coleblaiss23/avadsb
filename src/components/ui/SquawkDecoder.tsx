"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RadioTower } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmergencySquawkBanner } from "@/components/ui/EmergencySquawkBanner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  decodeSquawk,
  EMERGENCY_SQUAWKS,
  normalizeSquawk,
  type SquawkSeverity,
} from "@/lib/squawk";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/planner-store";

const SEVERITY_STYLE: Record<
  SquawkSeverity,
  { border: string; bg: string; text: string; badge: string }
> = {
  info: {
    border: "border-[var(--ink-border)]",
    bg: "bg-[var(--ink-elevated)]",
    text: "text-slate-300",
    badge:
      "bg-emerald-500/10 text-[var(--signal-green)] border-emerald-500/30",
  },
  caution: {
    border: "border-amber-500/40",
    bg: "bg-amber-950/35",
    text: "text-amber-100",
    badge: "bg-amber-500/15 text-[var(--signal-amber)] border-amber-500/35",
  },
  emergency: {
    border: "border-red-500/50",
    bg: "bg-red-950/45",
    text: "text-red-100",
    badge: "bg-red-500/15 text-red-300 border-red-500/40",
  },
};

const QUICK = ["1200", "7500", "7600", "7700"] as const;

type SquawkDecoderProps = {
  /** When true, toggles planner store emergency radar filter. */
  showMapFilter?: boolean;
  className?: string;
};

/**
 * Instant 4-digit Mode-A squawk lookup (+ optional emergency traffic filter).
 */
export function SquawkDecoder({
  showMapFilter = true,
  className,
}: SquawkDecoderProps) {
  const [raw, setRaw] = useState("1200");
  const emergencyOnly = usePlannerStore((s) => s.emergencyTrafficOnly);
  const setEmergencyTrafficOnly = usePlannerStore(
    (s) => s.setEmergencyTrafficOnly
  );

  const code = normalizeSquawk(raw);
  const meaning = useMemo(
    () => decodeSquawk(code ?? raw),
    [code, raw]
  );
  const style = SEVERITY_STYLE[meaning.severity];

  return (
    <div
      className={cn(
        "instrument-panel space-y-5 p-5 sm:p-6",
        className
      )}
    >
      <div className="space-y-2">
        <Label htmlFor="squawk-input" className="text-slate-400">
          Squawk code
        </Label>
        <Input
          id="squawk-input"
          value={raw}
          inputMode="numeric"
          maxLength={4}
          placeholder="1200"
          className="border-[var(--ink-border)] bg-[var(--ink-elevated)] font-mono text-lg tracking-[0.2em] tabular-nums text-slate-100"
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, 4);
            setRaw(next);
          }}
        />
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map((c) => {
            const emergency = EMERGENCY_SQUAWKS.has(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => setRaw(c)}
                className={cn(
                  "rounded border px-2.5 py-1 font-mono tabular-nums transition",
                  emergency
                    ? "emergency-squawk text-[12px] font-bold"
                    : raw === c
                      ? "border-[var(--scope-cyan)]/50 bg-[var(--scope-cyan)]/10 text-[11px] text-[var(--scope-cyan)]"
                      : "border-[var(--ink-border)] bg-[var(--ink)] text-[11px] text-[var(--ink-muted)] hover:border-[var(--bezel)]"
                )}
              >
                {emergency ? `EMER ${c}` : c}
              </button>
            );
          })}
        </div>
      </div>

      {EMERGENCY_SQUAWKS.has(meaning.code) ? (
        <EmergencySquawkBanner
          code={meaning.code}
          title={meaning.title}
          summary={meaning.summary}
        />
      ) : (
        <div className={cn("rounded-sm border p-4", style.border, style.bg)}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-[var(--ink-text)]">
              {meaning.code}
            </span>
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                style.badge
              )}
            >
              {meaning.title}
            </span>
          </div>
          <p className={cn("mt-2 text-sm leading-relaxed", style.text)}>
            {meaning.summary}
          </p>
        </div>
      )}

      {showMapFilter ? (
        <>
          <Button
            type="button"
            variant={emergencyOnly ? "default" : "outline"}
            className={cn(
              "w-full font-semibold",
              emergencyOnly
                ? "emergency-squawk hover:bg-[#4a1614]"
                : "border-[#ff5a4a]/45 bg-[#2a1210] text-[#ffe8d8] hover:bg-[#3a1614]"
            )}
            onClick={() => setEmergencyTrafficOnly(!emergencyOnly)}
            aria-pressed={emergencyOnly}
          >
            <RadioTower className="mr-1.5 h-4 w-4" aria-hidden />
            {emergencyOnly
              ? "Showing emergency traffic only"
              : "Filter Active Emergency Traffic"}
          </Button>
          <p className="text-[11px] text-slate-500">
            Isolates map markers squawking 7500 / 7600 / 7700.{" "}
            <Link href="/" className="text-[var(--scope-cyan)] hover:underline">
              Open live radar →
            </Link>
          </p>
        </>
      ) : null}
    </div>
  );
}
