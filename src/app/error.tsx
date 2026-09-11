"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="night-ui flex min-h-0 flex-1 flex-col items-center justify-center bg-[var(--ink)] px-4 py-16 text-center">
      <p className="font-avionics text-xs uppercase tracking-[0.16em] text-slate-500">
        Unavailable
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-slate-100">
        This view did not load
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-400">
        A page or data request failed. You can try again. Fuel, weather, and
        traffic may be on a tagged demo fallback until the live source returns.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => retry()}
          className="border border-[var(--scope-cyan)]/50 px-3 py-1.5 font-semibold text-[var(--scope-cyan)]"
        >
          Try again
        </button>
        <Link href="/" className="px-3 py-1.5 text-slate-300 hover:text-slate-100">
          Back to radar
        </Link>
      </div>
    </div>
  );
}
