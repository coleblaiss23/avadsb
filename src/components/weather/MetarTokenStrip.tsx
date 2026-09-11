"use client";

import { useState } from "react";
import {
  explainMetarToken,
  tokenizeMetar,
} from "@/lib/metar-tokens";
import { cn } from "@/lib/utils";

type MetarTokenStripProps = {
  raw: string;
  className?: string;
};

/**
 * Interactive raw METAR: hover/tap a token for a plain-English tooltip.
 */
export function MetarTokenStrip({ raw, className }: MetarTokenStripProps) {
  const tokens = tokenizeMetar(raw);
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className={cn("relative", className)}>
      <p className="flex flex-wrap gap-x-1.5 gap-y-1 font-mono text-[11px] leading-relaxed text-[var(--ink-text)]">
        {tokens.map((token, i) => {
          const tip = explainMetarToken(token);
          const isActive = active === i;
          if (!tip) {
            return (
              <span key={`${token}-${i}`} className="text-[var(--ink-muted)]">
                {token}
              </span>
            );
          }
          return (
            <button
              key={`${token}-${i}`}
              type="button"
              className={cn(
                "rounded px-0.5 underline decoration-dotted decoration-slate-400 underline-offset-2 transition",
                "hover:bg-[var(--scope-cyan)]/15 hover:text-[var(--ink-text)] hover:decoration-[var(--scope-cyan)]",
                isActive && "bg-[var(--scope-cyan)]/20 text-[var(--ink-text)] decoration-[var(--scope-cyan)]"
              )}
              aria-expanded={isActive}
              aria-label={`${token}: ${tip.title}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive((cur) => (cur === i ? null : cur))}
              onFocus={() => setActive(i)}
              onBlur={() => setActive((cur) => (cur === i ? null : cur))}
              onClick={() => setActive((cur) => (cur === i ? null : i))}
            >
              {token}
            </button>
          );
        })}
      </p>
      {active != null &&
        (() => {
          const tip = explainMetarToken(tokens[active] ?? "");
          if (!tip) return null;
          return (
            <div
              role="tooltip"
              className="mt-2 rounded-sm border border-[var(--ink-border)] bg-[var(--ink)] px-3 py-2 text-xs"
            >
              <p className="font-semibold text-[var(--ink-text)]">{tip.title}</p>
              <p className="mt-0.5 font-mono text-[10px] text-[var(--scope-cyan)]">
                {tip.token}
              </p>
              <p className="mt-1 leading-relaxed text-[var(--ink-muted)]">{tip.detail}</p>
            </div>
          );
        })()}
      <p className="mt-1.5 text-[10px] text-[var(--ink-muted)]">
        Tap or hover a highlighted token for a plain-English decode.
      </p>
    </div>
  );
}
