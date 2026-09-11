import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /** Show the 1090 MHz live pulse badge (default true). */
  showLiveBadge?: boolean;
  /** Wrap in a home link (default true). */
  href?: string | null;
};

function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8 shrink-0", className)}
      aria-hidden
    >
      <circle
        cx="20"
        cy="20"
        r="15.5"
        stroke="#5a8a9a"
        strokeWidth="1.25"
        strokeOpacity="0.4"
      />
      <circle
        cx="20"
        cy="20"
        r="10.5"
        stroke="#5a8a9a"
        strokeWidth="1"
        strokeOpacity="0.28"
      />
      <path
        d="M20 20 L20 5 A15 15 0 0 1 33.5 13.5 Z"
        fill="#5a8a9a"
        fillOpacity="0.18"
      />
      <path
        d="M20 20 L20 5"
        stroke="#5a8a9a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M20 9.5 L23.6 18.2 L29.5 19.5 L23.6 20.8 L20 29.5 L16.4 20.8 L10.5 19.5 L16.4 18.2 Z"
        fill="#5a8a9a"
      />
      <circle cx="20" cy="20" r="1.5" fill="#c4a46a" />
    </svg>
  );
}

/**
 * AvADSB brand mark — radar sweep + aircraft glyph.
 */
export function Logo({
  className,
  showLiveBadge = true,
  href = "/",
}: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-display text-[1.35rem] font-semibold leading-none tracking-tight text-slate-100">
          Av<span className="text-[var(--scope-cyan)]">ADSB</span>
        </span>
        {showLiveBadge ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--signal-amber)]" />
            </span>
            <span className="font-mono tabular-nums">1090 MHz</span>
            <span className="text-slate-600">live</span>
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="group inline-flex shrink-0 items-center outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[var(--scope-cyan)]/50"
      aria-label="AvADSB home"
    >
      {content}
    </Link>
  );
}
