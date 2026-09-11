import type { Metadata } from "next";
import { TrackFlightLoader } from "@/components/track/TrackFlightLoader";
import { SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  return {
    title: `Flight track`,
    description: `Private, time-limited flight track on ${SITE_NAME}.`,
    robots: { index: false, follow: false },
    other: { "track-token": token.slice(0, 8) },
  };
}

export default async function TrackPage({ params }: Props) {
  const { token } = await params;
  return <TrackFlightLoader token={token} />;
}
