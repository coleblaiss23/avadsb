import type { Metadata } from "next";
import Link from "next/link";
import { AppNav } from "@/components/layout/AppNav";
import { CONTACT_EMAIL, LAUNCH_DISCLAIMER, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms for using ${SITE_NAME}. Informational tools only — not a flight briefing.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="night-ui tool-atmosphere flex min-h-0 flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-display text-3xl font-semibold text-slate-100">
          Terms of use
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated September 10, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="space-y-2">
            <h2 className="font-display text-lg text-slate-100">
              Informational use only
            </h2>
            <p>
              {SITE_NAME} provides convenience tools for pilots and students:
              traffic display, weather decode, crosswind math, quiz practice,
              and fuel-stop estimates. {LAUNCH_DISCLAIMER} Official sources
              include 1800wxbrief, ForeFlight or another approved briefing, the
              FBO, and the FAA.
            </p>
            <p>
              Fuel prices may be synthetic demo quotes, vendor feeds, or
              unverified pilot reports. Weather, NOTAMs, and TFRs can be
              delayed, incomplete, or replaced with clearly tagged demo data
              when a live feed fails. Do not use this site as your only source
              for a go/no-go decision.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg text-slate-100">No warranty</h2>
            <p>
              The site is provided as is, without warranty of accuracy,
              availability, or fitness for a particular flight. To the fullest
              extent the law allows, the operator is not liable for decisions
              you make from this data, including fuel purchases, routing, or
              regulatory compliance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg text-slate-100">
              Price reports
            </h2>
            <p>
              If you submit a fuel price, you confirm it is a price you observed
              and you are not impersonating an FBO. We may discard reports. You
              keep no ownership claim that would stop us from displaying the
              figure you sent.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg text-slate-100">Ads</h2>
            <p>
              Third-party ads, when enabled, are delivered by Google AdSense.
              Their use of cookies is described in the{" "}
              <Link href="/privacy" className="text-[var(--scope-cyan)] hover:underline">
                privacy policy
              </Link>
              . We do not control ad creative.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg text-slate-100">Acceptable use</h2>
            <p>
              Do not abuse the APIs, scrape in a way that degrades the service,
              or submit false prices to manipulate a route ranking. We may rate
              limit or refuse requests.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg text-slate-100">Contact</h2>
            {CONTACT_EMAIL ? (
              <p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-[var(--scope-cyan)] hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            ) : (
              <p>
                Publish a contact address with{" "}
                <code>NEXT_PUBLIC_CONTACT_EMAIL</code> before this site is
                offered to the public.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
