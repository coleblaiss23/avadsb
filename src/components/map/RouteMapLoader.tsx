"use client";

import dynamic from "next/dynamic";

const RouteMap = dynamic(
  () => import("@/components/map/RouteMap").then((m) => m.RouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[420px] w-full items-center justify-center bg-slate-900 text-sm text-slate-400">
        Loading map…
      </div>
    ),
  }
);

export function RouteMapLoader() {
  return <RouteMap />;
}
