# AvADSB — third-party & original assets

## Radar marker silhouettes (GPL-2.0-or-later)

Map aircraft / balloon / blimp markers use SVG planforms extracted from
[wiedehopf/tar1090](https://github.com/wiedehopf/tar1090) `html/markers.js`
(the same marker family used by ADS-B Exchange and many local ADS-B receivers).

Vendored files live in [`third_party/tar1090-markers/`](third_party/tar1090-markers/)
under **GPL-2.0-or-later**. See that directory’s `LICENSE` and `README.md`.

Attribution:

- Matthias Wirth / tar1090 contributors
- FlightAware LLC (dump1090)

Classification (which shape to show) uses public standards only:

- ICAO Doc 8643 aircraft type designators (e.g. `BALL`, `SHIP`, `B738`)
- ADS-B emitter categories from RTCA DO-260B / ICAO Doc 9871 (e.g. `A7` rotorcraft, `B2` lighter-than-air)

## Live traffic data

Live positions are fetched from community aggregators (`airplanes.live`,
`adsb.lol`) under those services’ own terms. AvADSB does not scrape or
redistribute ADS-B Exchange’s website, API, or proprietary non-GPL assets.

## Branding

AvADSB is an independent product name and is not affiliated with ADS-B Exchange,
FlightAware, or dump1090/tar1090 maintainers.
