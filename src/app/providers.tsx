"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLayoutEffect, useState } from "react";
import { loadMapSession } from "@/lib/map-session";
import { usePlannerStore } from "@/store/planner-store";

export function Providers({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    const session = loadMapSession();
    if (!session) return;
    usePlannerStore.setState((s) => ({
      originIcao: session.originIcao,
      destinationIcao: session.destinationIcao,
      homeAirport: session.pinned ?? s.homeAirport,
      mapView: { lat: session.lat, lng: session.lng, zoom: session.zoom },
    }));
  }, []);

  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
