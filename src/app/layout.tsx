import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { Plausible } from "@/components/analytics/Plausible";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { ConsentProvider } from "@/components/consent/ConsentProvider";
import { DemoDataBanner } from "@/components/dev/DemoDataBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  SITE_DEFAULT_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE_TEMPLATE,
  siteOrigin,
} from "@/lib/site";
import { Providers } from "./providers";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const ibmPlex = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: SITE_DEFAULT_TITLE,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    title: SITE_DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlex.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
        <DemoDataBanner />
        <ConsentProvider>
          <Providers>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </Providers>
          <SiteFooter />
          <ConsentBanner />
          <AdSenseScript />
        </ConsentProvider>
        <Plausible />
      </body>
    </html>
  );
}
