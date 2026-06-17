'use strict';

/*
 * Pure geometry/WKT helpers shared by the app and the unit tests.
 *
 * Loaded in the browser as a classic <script> (so it still works from a
 * file:// double-click, unlike an ES module) where the functions live in the
 * shared global scope. The same file exports a CommonJS module under Node so
 * Vitest can import and test the logic in isolation, with no DOM.
 */

// Format a number to the app's fixed 5-decimal precision.
function fmt(v) {
    return Number(v).toFixed(5);
}

// Valid WGS84 pair: latitude within +/-90, longitude within +/-180.
function inRange(lat, lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Closed bounding-box ring, "POLYGON ((W N, E N, E S, W S, W N))".
function buildBboxWKT(n, s, e, w) {
    return `POLYGON ((${fmt(w)} ${fmt(n)}, ${fmt(e)} ${fmt(n)}, ${fmt(e)} ${fmt(s)}, ${fmt(w)} ${fmt(s)}, ${fmt(w)} ${fmt(n)}))`;
}

// Closed "POLYGON ((...))" from an array of [lng, lat] vertices. The ring is
// closed automatically (first vertex repeated) if it is not already.
function buildPolygonWKT(points) {
    const ring = points.map(p => `${fmt(p[0])} ${fmt(p[1])}`);
    if (ring.length && ring[0] !== ring[ring.length - 1]) ring.push(ring[0]);
    return `POLYGON ((${ring.join(', ')}))`;
}

// Parse a single-ring POLYGON into [[lng, lat], ...]. Returns null when the
// text is not a single-ring POLYGON or holds no usable vertices.
function parseWKTPolygon(wkt) {
    const ring = String(wkt).trim().match(/POLYGON\s*\(\(\s*(.+?)\s*\)\)/i);
    if (!ring) return null;
    const pts = ring[1].split(',')
        .map(pair => pair.trim().split(/\s+/).map(Number))
        .filter(p => p.length >= 2 && !p.slice(0, 2).some(Number.isNaN));
    return pts.length ? pts : null;
}

// Extent {n, s, e, w} of an array of [lng, lat] vertices.
function bboxFromPoints(points) {
    const lngs = points.map(p => p[0]);
    const lats = points.map(p => p[1]);
    return { n: Math.max(...lats), s: Math.min(...lats), e: Math.max(...lngs), w: Math.min(...lngs) };
}

// True for a closed 5-vertex ring with exactly two distinct lats and lngs,
// i.e. an axis-aligned rectangle that can round-trip as a bounding box.
function isAxisAlignedRectangle(points) {
    if (points.length !== 5) return false;
    const lats = new Set(points.map(p => fmt(p[1])));
    const lngs = new Set(points.map(p => fmt(p[0])));
    return lats.size === 2 && lngs.size === 2;
}

// Validate a bounding box. Returns null when valid, otherwise an i18n key
// naming the problem ('missingValues' | 'invalidRange' | 'invalidOrder').
function validateBounds(n, s, e, w) {
    if ([n, s, e, w].some(v => !Number.isFinite(v))) return 'missingValues';
    if (!inRange(n, e) || !inRange(s, w)) return 'invalidRange';
    if (n <= s || e <= w) return 'invalidOrder';
    return null;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fmt, inRange, buildBboxWKT, buildPolygonWKT,
        parseWKTPolygon, bboxFromPoints, isAxisAlignedRectangle, validateBounds
    };
}
