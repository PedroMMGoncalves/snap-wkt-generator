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

// Approximate width/height (km) and area (km^2) of a bounding box on a sphere.
// Width uses the cosine of the mid-latitude; good enough for an AOI readout,
// not a geodesic-grade figure.
function bboxDimensions(n, s, e, w) {
    const R = 6371; // mean Earth radius, km
    const rad = Math.PI / 180;
    const heightKm = Math.abs(n - s) * rad * R;
    const midLat = ((n + s) / 2) * rad;
    const widthKm = Math.abs(e - w) * rad * R * Math.cos(midLat);
    return { widthKm, heightKm, areaKm2: widthKm * heightKm };
}

// --- GeoJSON / KML interchange (single-ring polygons) -------------------

// Close a ring of [lng, lat] vertices if it is not already closed.
function closeRing(points) {
    const ring = points.map(p => [Number(p[0]), Number(p[1])]);
    const a = ring[0], b = ring[ring.length - 1];
    if (ring.length && (a[0] !== b[0] || a[1] !== b[1])) ring.push([a[0], a[1]]);
    return ring;
}

// A GeoJSON Polygon Feature from [lng, lat] vertices.
function pointsToGeoJSON(points) {
    return {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [closeRing(points)] }
    };
}

// Extract the first polygon's outer ring from a GeoJSON object as
// [[lng, lat], ...]; null when there is no usable polygon.
function geoJSONToPoints(obj) {
    if (!obj || typeof obj !== 'object') return null;
    let geom = null;
    if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
        const f = obj.features.find(x => x && x.geometry && /Polygon$/.test(x.geometry.type));
        geom = f ? f.geometry : null;
    } else if (obj.type === 'Feature') {
        geom = obj.geometry;
    } else if (obj.type) {
        geom = obj; // bare geometry
    }
    if (!geom) return null;
    let ring = null;
    if (geom.type === 'Polygon') ring = geom.coordinates && geom.coordinates[0];
    else if (geom.type === 'MultiPolygon') ring = geom.coordinates && geom.coordinates[0] && geom.coordinates[0][0];
    if (!Array.isArray(ring)) return null;
    const pts = ring.map(c => [Number(c[0]), Number(c[1])])
        .filter(c => Number.isFinite(c[0]) && Number.isFinite(c[1]));
    return pts.length ? pts : null;
}

// A minimal KML document with one Polygon Placemark.
function pointsToKML(points) {
    const coords = closeRing(points).map(p => `${p[0]},${p[1]}`).join(' ');
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<kml xmlns="http://www.opengis.net/kml/2.2">\n' +
        '  <Placemark>\n' +
        '    <name>AOI</name>\n' +
        '    <Polygon><outerBoundaryIs><LinearRing>' +
        `<coordinates>${coords}</coordinates>` +
        '</LinearRing></outerBoundaryIs></Polygon>\n' +
        '  </Placemark>\n' +
        '</kml>\n';
}

// Parse the first <coordinates> block of a KML string into [[lng, lat], ...].
// Altitude, if present, is ignored. Null when no coordinates are found.
function kmlToPoints(kml) {
    const block = String(kml).match(/<coordinates>([\s\S]*?)<\/coordinates>/i);
    if (!block) return null;
    const pts = block[1].trim().split(/\s+/)
        .map(tok => tok.split(',').map(Number))
        .map(c => [c[0], c[1]])
        .filter(c => Number.isFinite(c[0]) && Number.isFinite(c[1]));
    return pts.length ? pts : null;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fmt, inRange, buildBboxWKT, buildPolygonWKT,
        parseWKTPolygon, bboxFromPoints, isAxisAlignedRectangle, validateBounds,
        bboxDimensions,
        closeRing, pointsToGeoJSON, geoJSONToPoints, pointsToKML, kmlToPoints
    };
}
