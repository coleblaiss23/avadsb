import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corridor Fuel Matrix",
  description:
    "Find the cheapest 100LL and Jet-A along your route corridor with live map overlays and savings ranking.",
  alternates: { canonical: "/fuel" },
};

export default function FuelPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-semibold text-slate-100">
        Fuel prices coming soon
      </h1>
      <p className="max-w-md text-sm text-slate-400">
        We&apos;re still building out verified fuel pricing. Check back soon —
        in the meantime, try the live radar, METAR, or crosswind tools.
      </p>
    </div>
  );
}