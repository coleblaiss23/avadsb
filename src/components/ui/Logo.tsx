import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /** Show the 1090 MHz live pulse badge (default true). */
  showLiveBadge?: boolean;
  /** Wrap in a home link (default true). */
  href?: string | null;
};

/**
 * Cirrus three-quarter silhouette — from the brand aircraft photo.
 * Soft radar ring keeps the ADS-B cue without cluttering the mark.
 */
function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-8 w-8 shrink-0 items-center justify-center",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="20"
          cy="20"
          r="18.5"
          stroke="#5a8a9a"
          strokeWidth="1"
          strokeOpacity="0.22"
        />
      </svg>
      <Image
        src="/logo-mark.png"
        alt=""
        width={32}
        height={32}
        className="relative h-7 w-7 object-contain"
        priority
      />
    </span>
  );
}

/**
 * AvADSB brand mark — Cirrus silhouette + soft radar ring.
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
