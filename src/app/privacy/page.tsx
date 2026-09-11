import type { Metadata } from "next";
import Link from "next/link";
import { AppNav } from "@/components/layout/AppNav";
import { CONTACT_EMAIL, LAUNCH_DISCLAIMER, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} uses cookies, analytics, ads, and crowdsourced fuel price reports.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="night-ui tool-atmosphere flex min-h-0 flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-display text-3xl font-semibold text-slate-100">
          Privacy policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated September 10, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="space-y-2">
            <h2 className="font-display text-lg text-slate-100">Who we are</h2>
            <p>
              {SITE_NAME} is an informational aviation tool: live traffic radar,
              weather, and a corridor fuel planner. It is not a certified flight
              briefing. {LAUNCH_DISCLAIMER}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg text-slate-100">What we collect</h2>
            <p>
              We do not require an account. Airport search, METAR, radar, and
              route pages do not ask for your name or email.
            </p>
            <p>
              If you submit a crowdsourced fuel price, we store the airport
              identifier, the fuel type, the price, whether you marked it
              self-serve, an optional FBO name and notes you typed, and the
              time of the report, in our database. We do not ask for a name,
              email, tail number, or certificate number, and we never attach
              your IP address to the stored report.
            </p>
            <p>
              Your IP address is read only to apply a short rate limit on
              public API routes (including fuel reports), so one visitor can't
              flood the system with reports. It is never written to the
              database alongside your submitted price, and is not sent to
              advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg text-slate-100">Cookies</h2>
            <p>
              We set one first-party cookie, <code>afm_ad_consent</code>, only
              after you choose Allow or Reject on the ad banner. It remembers
              that choice. It is not an advertising identifier.
            </p>
            <p>
              The map remembers your last view and route airports in this
              browser’s local storage. That stays on your device and is not sent
              to an ad network.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg text-slate-100">Analytics</h2>
            <p>
              We use Plausible Analytics, a cookieless product. It records
              pageviews and a few product events (a fuel search, opening the
              radar, finishing a quiz) so we can see which tools people return
              to. Plausible does not use cookies and does not build an ad
              profile. If a Plausible site domain is not configured, the script
              is not loaded.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg text-slate-100">
              Google AdSense
            </h2>
            <p>
              We intend to show ads with Google AdSense. Google and its
              partners use cookies to serve and measure ads, including
              personalized ads based on visits to this site and others. We do
              not load the AdSense script until you allow personalized ads, or
              until the host confirms you are outside a region that requires
              consent (the EU and the UK). If we cannot confirm your region, we
              wait for a choice.
            </p>
            <p>
              You can reject ads on this site from the banner or the Ad choices
              link in the footer. You can also opt out of personalized Google
              ads at{" "}
              <a
                href="https://adssettings.google.com/"
                className="text-[var(--scope-cyan)] hover:underline"
                rel="noreferrer"
                target="_blank"
              >
                Google Ad Settings
              </a>
              , and about Google’s advertising cookies at{" "}
              <a
                href="https://policies.google.com/technologies/ads"
                className="text-[var(--scope-cyan)] hover:underline"
                rel="noreferrer"
                target="_blank"
              >
                How Google uses cookies in advertising
              </a>
              . Industry opt-outs:{" "}
              <a
                href="https://www.aboutads.info/choices"
                className="text-[var(--scope-cyan)] hover:underline"
                rel="noreferrer"
                target="_blank"
              >
                aboutads.info
              </a>{" "}
              and{" "}
              <a
                href="https://www.youronlinechoices.eu/"
                className="text-[var(--scope-cyan)] hover:underline"
                rel="noreferrer"
                target="_blank"
              >
                Your Online Choices
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg text-slate-100">Contact</h2>
            {CONTACT_EMAIL ? (
              <p>
                Privacy questions:{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-[var(--scope-cyan)] hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            ) : (
              <p>
                A public contact email is not published yet. Set{" "}
                <code>NEXT_PUBLIC_CONTACT_EMAIL</code> before submitting this
                site to an ad network so this page has a working contact method.
              </p>
            )}
          </section>

          <p>
            <Link href="/terms" className="text-[var(--scope-cyan)] hover:underline">
              Terms of use
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
