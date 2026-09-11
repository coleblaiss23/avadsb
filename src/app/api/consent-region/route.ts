import { NextResponse } from "next/server";
import { consentRequiredForCountry, countryFromHeaders } from "@/lib/consent";

export const runtime = "nodejs";

/** Geo from the host's edge header only. No third-party lookup, no IP stored. */
export async function GET(request: Request) {
  const country = countryFromHeaders(request.headers);
  const confirmed = country != null;
  return NextResponse.json({
    country,
    confirmed,
    consentRequired: !confirmed || consentRequiredForCountry(country),
  });
}
