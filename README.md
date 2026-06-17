# snap-wkt-generator

> Interactive, single-file web map to draw an area of interest and generate the Bounding Box and WKT polygon coordinates needed by ESA SNAP — no install, no build step.

[![Live demo](https://img.shields.io/badge/Live_demo-GitHub_Pages-2ea44f.svg)](https://pedrommgoncalves.github.io/snap-wkt-generator/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900.svg)](https://leafletjs.com)
[![Leaflet.draw](https://img.shields.io/badge/Leaflet.draw-1.0.4-199900.svg)](https://github.com/Leaflet/Leaflet.draw)
[![Languages](https://img.shields.io/badge/i18n-EN_%7C_PT-blue.svg)](#internationalisation)
[![Platform](https://img.shields.io/badge/Platform-Web-lightgrey.svg)](https://pedrommgoncalves.github.io/snap-wkt-generator/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

A self-contained HTML page (`index.html`) that turns a map selection into ready-to-paste coordinates. Draw a rectangle or polygon, or type the four bounds by hand, and the tool produces a [WKT](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) `POLYGON` and a North/South/East/West bounding box. Built for preparing subset and graph inputs in the [ESA SNAP](https://step.esa.int/main/toolboxes/snap/) toolbox, but the output works anywhere WKT is accepted.

Everything runs in the browser. There is no backend, no API key, and no build — the whole app is one file plus a banner image.

![SNAP Bounding Box Generator](banner.png)

## Contents

[Quick start](#quick-start) - [Features](#features) - [Usage](#usage) - [WKT output](#wkt-output) - [Internationalisation](#internationalisation) - [Sharing](#sharing) - [Run locally](#run-locally) - [Tech stack](#tech-stack) - [Limitations and notes](#limitations-and-notes) - [License](#license)

---

## Quick start

1. **Open the app:** <https://pedrommgoncalves.github.io/snap-wkt-generator/>
2. **Draw an area.** Use the rectangle or polygon tool on the top-right of the map.
3. **Copy the WKT.** The `POLYGON ((...))` text and the bounding box fields fill in automatically — click **Copy WKT**.
4. **Paste into SNAP** (for example in a subset operator or a `geoRegion` parameter).

No registration, no install. Works offline once the page and its CDN assets are cached.

---

## Features

- **Draw or type.** Draw a rectangle or a free polygon on the map, or enter North / South / East / West manually and click **Apply to Map**.
- **Live WKT.** A valid WKT `POLYGON` is generated from any input, with consistent 5-decimal precision.
- **WKT round-trip.** Paste a WKT `POLYGON` (rectangle *or* arbitrary polygon) back into the output box and it is drawn on the map.
- **Bilingual UI.** English and Portuguese, auto-detected from the browser and switchable with one click.
- **Light / dark theme.** Follows your OS preference on first visit, then remembers your choice.
- **Multiple basemaps.** Carto Light, Carto Dark, Esri Satellite, and OpenStreetMap — your selection is remembered.
- **Shareable links.** Encode the current box in the URL (`?bbox=...`) and copy it with **Share Link**.
- **Persistent state.** Your last box, theme, language, and basemap are stored in `localStorage`.
- **Input validation.** Coordinates are range-checked (lat ±90, lng ±180) and ordered (N > S, E > W) before being applied.

---

## Usage

| Action | How |
| --- | --- |
| Draw a rectangle | Rectangle tool (top-right), drag on the map |
| Draw a polygon | Polygon tool (top-right), click vertices, close the ring |
| Enter bounds manually | Fill North/South/East/West, click **Apply to Map** |
| Load existing WKT | Paste into the **WKT Output** box and click away (on `change`) |
| Copy the WKT | **Copy WKT** |
| Copy a shareable link | **Share Link** |
| Reset everything | **Clear** |
| Switch language | Language button in the header (`EN` / `PT`) |
| Switch theme | Sun/moon button in the header |

---

## WKT output

The bounding box is emitted as a closed WKT polygon in `lng lat` order (X then Y), starting and ending at the same vertex:

```
POLYGON ((W N, E N, E S, W S, W N))
```

For example, a box over mainland Portugal:

```
POLYGON ((-9.50000 42.20000, -6.20000 42.20000, -6.20000 36.90000, -9.50000 36.90000, -9.50000 42.20000))
```

Free-drawn polygons keep all their vertices; the four bounding-box fields then show the polygon's extent.

---

## Internationalisation

The interface ships in **English** and **Portuguese**. On first visit the language is chosen from the browser locale (`pt*` → Portuguese, otherwise English) and can be toggled at any time with the header button; the choice is saved to `localStorage`. All labels, button titles, basemap names, and toast messages are translated through a single `I18N` table in `index.html`, so adding another language is a matter of adding one more entry.

---

## Sharing

Clicking **Share Link** (or any change that updates the box) writes the bounds into the URL as `?bbox=west,south,east,north`. Opening that URL restores the exact rectangle on the map, which makes it easy to send a precise area of interest to a colleague.

---

## Run locally

No build is required. Either open the file directly, or serve the folder so the banner and map tiles load over HTTP:

```bash
git clone https://github.com/PedroMMGoncalves/snap-wkt-generator.git
cd snap-wkt-generator

# option A: just open index.html in a browser

# option B: serve locally (any static server works)
python -m http.server 8000
# then visit http://localhost:8000
```

Deploying your own copy is as simple as enabling **GitHub Pages** on the `main` branch (root folder).

---

## Tech stack

- [Leaflet 1.9.4](https://leafletjs.com) — interactive map.
- [Leaflet.draw 1.0.4](https://github.com/Leaflet/Leaflet.draw) — rectangle and polygon drawing.
- Basemaps: [CARTO](https://carto.com/basemaps/), [Esri World Imagery](https://www.esri.com), [OpenStreetMap](https://www.openstreetmap.org).
- Plain HTML, CSS, and vanilla JavaScript — no framework, no bundler. Dependencies load from CDN.

---

## Limitations and notes

- Coordinates are **WGS84 (EPSG:4326)** longitude/latitude. Reproject before use if your SNAP workflow expects a different CRS.
- WKT parsing recognises a single-ring `POLYGON`; multi-polygons, holes, and other WKT geometry types are not handled.
- The clipboard uses the modern `navigator.clipboard` API with an `execCommand` fallback for non-secure contexts.
- An internet connection is needed the first time, to fetch Leaflet, the fonts, and the map tiles from their CDNs.

---

## License

Released under the MIT License. You are free to use, modify, and distribute it.
