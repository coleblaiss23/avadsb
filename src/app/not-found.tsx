import Link from "next/link";
import { AppNav } from "@/components/layout/AppNav";

export default function NotFound() {
  return (
    <div className="night-ui tool-atmosphere flex min-h-0 flex-1 flex-col">
      <AppNav />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16 text-center">
        <p className="font-avionics text-xs uppercase tracking-[0.16em] text-slate-500">
          404
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-slate-100">
          That page is not on the chart
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          The airport, route, or tool you asked for is not here. Check the
          identifier, or start from the radar.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
          <Link
            href="/"
            className="border border-[var(--scope-cyan)]/50 px-3 py-1.5 font-semibold text-[var(--scope-cyan)]"
          >
            Radar
          </Link>
          <Link href="/fuel" className="px-3 py-1.5 text-slate-300 hover:text-slate-100">
            Fuel
          </Link>
          <Link href="/weather" className="px-3 py-1.5 text-slate-300 hover:text-slate-100">
            METAR
          </Link>
        </div>
      </main>
    </div>
  );
}
