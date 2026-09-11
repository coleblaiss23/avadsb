"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CONSENT_COOKIE,
  adsAllowed,
  readConsentCookie,
  type AdConsent,
} from "@/lib/consent";

type Region = {
  country: string | null;
  confirmed: boolean;
  consentRequired: boolean;
};

type ConsentContextValue = {
  consent: AdConsent | null;
  region: Region;
  adsAllowed: boolean;
  bannerOpen: boolean;
  setConsent: (value: AdConsent) => void;
  openBanner: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

const YEAR = 60 * 60 * 24 * 365;

function writeConsent(value: AdConsent) {
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${YEAR}; SameSite=Lax`;
}

function consentFromDocument(): AdConsent | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CONSENT_COOKIE}=(granted|denied)`)
  );
  return readConsentCookie(match?.[1]);
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<AdConsent | null>(null);
  const [region, setRegion] = useState<Region>({
    country: null,
    confirmed: false,
    consentRequired: true,
  });
  const [bannerOpen, setBannerOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = consentFromDocument();
    setConsentState(stored);
    if (stored) setReady(true);
    let cancelled = false;
    fetch("/api/consent-region")
      .then((res) => res.json())
      .then((data: { country?: string | null; confirmed?: boolean; consentRequired?: boolean }) => {
        if (cancelled) return;
        setRegion({
          country: data.country ?? null,
          confirmed: Boolean(data.confirmed),
          consentRequired: data.consentRequired !== false,
        });
        if (!stored && data.consentRequired !== false) setBannerOpen(true);
      })
      .catch(() => {
        if (!cancelled && !stored) setBannerOpen(true);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setConsent = useCallback((value: AdConsent) => {
    writeConsent(value);
    setConsentState(value);
    setBannerOpen(false);
  }, []);

  const openBanner = useCallback(() => setBannerOpen(true), []);

  const allowed = ready
    ? adsAllowed({
        consent,
        country: region.country,
        regionConfirmed: region.confirmed,
      })
    : false;

  const value = useMemo(
    () => ({
      consent,
      region,
      adsAllowed: allowed,
      bannerOpen,
      setConsent,
      openBanner,
    }),
    [allowed, bannerOpen, consent, region, setConsent, openBanner]
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used inside ConsentProvider");
  }
  return ctx;
}
