import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-4 py-6 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Traffic data © ADSB.lol (ODbL 1.0). Weather via AviationWeather.gov.
          Map tiles © Esri.
        </p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-2 max-w-6xl">
        Informational use only — verify all data (fuel prices, weather,
        NOTAMs, TFRs) with official sources before flight.
      </p>
    </footer>
  );
}