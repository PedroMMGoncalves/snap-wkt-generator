# snap-wkt-generator

A browser tool for building the area-of-interest geometry that [ESA SNAP](https://step.esa.int/main/toolboxes/snap/) expects. Draw a box on a map, or type the four bounds, and copy out a WKT `POLYGON` together with its North/South/East/West values. The output is plain WKT text, so it works anywhere else that reads WKT, not just SNAP.

It is a static page: `index.html` for the UI, `wkt.js` for the geometry helpers, and a banner image. No backend, no API keys, no build step: open the file, or drop it on any static host.

[![Live demo](https://img.shields.io/badge/demo-GitHub_Pages-2ea44f.svg)](https://pedrommgoncalves.github.io/snap-wkt-generator/)
[![tests](https://github.com/PedroMMGoncalves/snap-wkt-generator/actions/workflows/tests.yml/badge.svg)](https://github.com/PedroMMGoncalves/snap-wkt-generator/actions/workflows/tests.yml)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900.svg)](https://leafletjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Live:** <https://pedrommgoncalves.github.io/snap-wkt-generator/>

![SNAP Bounding Box Generator](banner.png)

## What it does

Draw a rectangle or a polygon with the tools on the top-right of the map, or type North/South/East/West into the sidebar and press **Apply to Map**. The WKT field updates on every change, formatted to five decimals.

The flow also works backwards: paste a WKT `POLYGON` into the output box and it gets redrawn on the map. Rectangles snap back into the four bound fields; arbitrary single-ring polygons are drawn vertex for vertex, with the bound fields showing their extent.

A few things worth knowing:

- Input is validated before it's applied: latitude within ±90, longitude within ±180, North above South, East of West.
- The current box is written into the URL as `?bbox=west,south,east,north`, so a shared link reopens the exact same area. **Share Link** copies it.
- Last box, theme, language and basemap are remembered in `localStorage`.
- UI is available in English and Portuguese. The first load picks one from the browser locale; the header button switches it.
- Light and dark themes, following the OS preference on the first visit.

## Basemaps

Switchable from the layer control at the bottom-left:

- Carto Light / Carto Dark: clean reference maps
- Esri World Imagery: satellite
- Esri Imagery + place names: satellite with a labels/boundaries overlay
- OpenStreetMap

## WKT format

The bounding box is written as a closed ring in `lng lat` order (X then Y), with the first vertex repeated at the end:

```text
POLYGON ((W N, E N, E S, W S, W N))
```

For example, a box over mainland Portugal:

```text
POLYGON ((-9.50000 42.20000, -6.20000 42.20000, -6.20000 36.90000, -9.50000 36.90000, -9.50000 42.20000))
```

Coordinates are WGS84 (EPSG:4326), longitude/latitude in decimal degrees. Reproject if your SNAP graph works in another CRS. Parsing handles a single-ring `POLYGON` only; multipolygons, holes and other geometry types are not supported.

## Running locally

```bash
git clone https://github.com/PedroMMGoncalves/snap-wkt-generator.git
cd snap-wkt-generator
python -m http.server 8000   # then open http://localhost:8000
```

You can also just open `index.html` directly, but serving over HTTP is closer to production: the banner and map tiles load over the network, and the clipboard API needs a secure context (it falls back to `execCommand` when that's missing).

To publish your own copy, enable GitHub Pages on `main` from the repo root.

## Tests

The geometry and WKT logic lives in `wkt.js` so it can be tested without a browser. Unit tests run with [Vitest](https://vitest.dev):

```bash
npm install
npm test
```

The same suite runs in CI on every push and pull request (`.github/workflows/tests.yml`).

## Built with

Leaflet 1.9.4 and Leaflet.draw 1.0.4, plain HTML/CSS/JS, no framework or bundler. `wkt.js` is a plain classic script in the browser and a CommonJS module under Node, so the page needs no build and the tests need no DOM. Tiles come from CARTO, Esri and OpenStreetMap, fonts from Google Fonts; all of it loads from a CDN, so the first load needs a connection. Strings are kept in a single `I18N` table near the top of the script, so adding a language is one more entry.

## License

MIT. See [LICENSE](LICENSE).
