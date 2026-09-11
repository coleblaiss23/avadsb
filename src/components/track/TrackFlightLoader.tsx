"use client";

import dynamic from "next/dynamic";

const TrackFlightView = dynamic(
  () =>
    import("@/components/track/TrackFlightView").then((m) => m.TrackFlightView),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--ink)] text-sm text-slate-400">
        Loading track…
      </div>
    ),
  }
);

export function TrackFlightLoader({ token }: { token: string }) {
  return <TrackFlightView token={token} />;
}
