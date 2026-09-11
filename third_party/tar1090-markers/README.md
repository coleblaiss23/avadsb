# tar1090 aircraft markers (GPL-2.0-or-later)

SVG planform paths used by [tar1090](https://github.com/wiedehopf/tar1090)
(the map UI behind ADS-B Exchange and many local ADS-B receivers).

## License

These assets are licensed under the **GNU GPL v2 or later**, same as tar1090 /
FlightAware dump1090. See [`LICENSE`](./LICENSE).

If you distribute AvADSB (or a build that includes these files), you must keep
this directory’s license notices and make the corresponding source for these
GPL-licensed files available under GPL-2.0-or-later.

## Attribution

- [wiedehopf/tar1090](https://github.com/wiedehopf/tar1090) — Matthias Wirth
- [flightaware/dump1090](https://github.com/flightaware/dump1090) — FlightAware LLC
- Additional shape contributors credited in upstream `html/markers.js`

## What we changed

- Extracted a small subset of generic shapes (`heavy_2e`, `airliner`,
  `jet_swept`, `twin_small`, `cessna`, `helicopter`, `balloon`, `blimp`)
- Mapped them to AvADSB silhouette categories in `shapes.ts`
- Rendering helpers live in `src/lib/aircraft-silhouettes.ts` (AvADSB code that
  *consumes* these GPL paths; the path data itself remains GPL)
