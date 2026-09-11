import type { Metadata } from "next";
import Link from "next/link";
import { FuelWorkspace } from "@/components/planner/FuelWorkspace";
import { POPULAR_ROUTES } from "@/lib/airports-db-client";

export const metadata: Metadata = {
  title: "Corridor Fuel Matrix",
  description:
    "Find the cheapest 100LL and Jet-A along your route corridor with live map overlays and savings ranking.",
  alternates: { canonical: "/fuel" },
};

export default function FuelPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section className="night-ui shrink-0 border-b border-[var(--ink-border)] bg-[var(--ink)] px-4 py-3">
        <div className="mx-auto max-w-[1600px]">
          <p className="text-sm text-slate-400">
            Rank 100LL and Jet-A stops inside your route corridor. Popular
            corridors:{" "}
            {POPULAR_ROUTES.map((route, index) => (
              <span key={route.slug}>
                {index > 0 ? " · " : null}
                <Link
                  href={`/routes/${route.slug}`}
                  className="font-medium text-accent hover:underline"
                >
                  {route.origin}→{route.destination}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </section>
      <FuelWorkspace />
    </div>
  );
}
