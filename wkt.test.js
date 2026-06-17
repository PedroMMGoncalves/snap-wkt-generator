import { describe, it, expect } from 'vitest';
import * as WKT from './wkt.js';

const {
    fmt, inRange, buildBboxWKT, buildPolygonWKT,
    parseWKTPolygon, bboxFromPoints, isAxisAlignedRectangle, validateBounds,
    bboxDimensions
} = WKT;

describe('fmt', () => {
    it('formats to 5 decimals', () => {
        expect(fmt(1)).toBe('1.00000');
        expect(fmt(-9.5)).toBe('-9.50000');
        expect(fmt(1.234567)).toBe('1.23457');
    });
});

describe('inRange', () => {
    it('accepts a valid lat/lng', () => expect(inRange(40, -8)).toBe(true));
    it('accepts the extremes', () => {
        expect(inRange(90, 180)).toBe(true);
        expect(inRange(-90, -180)).toBe(true);
    });
    it('rejects an out-of-range latitude', () => expect(inRange(91, 0)).toBe(false));
    it('rejects an out-of-range longitude', () => expect(inRange(0, 181)).toBe(false));
});

describe('buildBboxWKT', () => {
    it('emits a closed ring in lng lat order', () => {
        expect(buildBboxWKT(42.2, 36.9, -6.2, -9.5)).toBe(
            'POLYGON ((-9.50000 42.20000, -6.20000 42.20000, -6.20000 36.90000, -9.50000 36.90000, -9.50000 42.20000))'
        );
    });
});

describe('buildPolygonWKT', () => {
    it('closes an open ring', () => {
        expect(buildPolygonWKT([[0, 0], [1, 0], [1, 1]])).toBe(
            'POLYGON ((0.00000 0.00000, 1.00000 0.00000, 1.00000 1.00000, 0.00000 0.00000))'
        );
    });
    it('leaves an already-closed ring closed (no duplicate vertex added)', () => {
        const wkt = buildPolygonWKT([[0, 0], [1, 0], [1, 1], [0, 0]]);
        expect(wkt).toBe('POLYGON ((0.00000 0.00000, 1.00000 0.00000, 1.00000 1.00000, 0.00000 0.00000))');
    });
});

describe('parseWKTPolygon', () => {
    it('parses a rectangle ring', () => {
        const pts = parseWKTPolygon('POLYGON ((-9.5 42.2, -6.2 42.2, -6.2 36.9, -9.5 36.9, -9.5 42.2))');
        expect(pts).toHaveLength(5);
        expect(pts[0]).toEqual([-9.5, 42.2]);
    });
    it('tolerates extra whitespace and lower case', () => {
        expect(parseWKTPolygon('  polygon ((1 2, 3 4 ,5 6))  ')).toEqual([[1, 2], [3, 4], [5, 6]]);
    });
    it('returns null for non-POLYGON input', () => {
        expect(parseWKTPolygon('POINT (1 2)')).toBeNull();
        expect(parseWKTPolygon('garbage')).toBeNull();
        expect(parseWKTPolygon('')).toBeNull();
    });
});

describe('bboxFromPoints', () => {
    it('computes the extent', () => {
        expect(bboxFromPoints([[-9.5, 42.2], [-6.2, 36.9], [-7.0, 40.0]]))
            .toEqual({ n: 42.2, s: 36.9, e: -6.2, w: -9.5 });
    });
});

describe('isAxisAlignedRectangle', () => {
    it('detects a closed 5-point axis-aligned rectangle', () => {
        expect(isAxisAlignedRectangle(
            [[-9.5, 42.2], [-6.2, 42.2], [-6.2, 36.9], [-9.5, 36.9], [-9.5, 42.2]]
        )).toBe(true);
    });
    it('rejects a triangle', () => {
        expect(isAxisAlignedRectangle([[0, 0], [1, 0], [1, 1], [0, 0]])).toBe(false);
    });
    it('rejects a 5-point non-rectangular ring', () => {
        expect(isAxisAlignedRectangle([[0, 0], [2, 0], [2, 2], [1, 3], [0, 2]])).toBe(false);
    });
});

describe('validateBounds', () => {
    it('passes a valid box', () => expect(validateBounds(42.2, 36.9, -6.2, -9.5)).toBeNull());
    it('flags missing/NaN values', () => expect(validateBounds(NaN, 1, 2, 0)).toBe('missingValues'));
    it('flags out-of-range coordinates', () => expect(validateBounds(91, 0, 10, 0)).toBe('invalidRange'));
    it('flags N <= S', () => expect(validateBounds(10, 20, 5, 0)).toBe('invalidOrder'));
    it('flags E <= W', () => expect(validateBounds(20, 10, 0, 5)).toBe('invalidOrder'));
});

describe('bboxDimensions', () => {
    it('gives ~111 km per degree of latitude for height', () => {
        const d = bboxDimensions(1, 0, 1, 0);
        expect(d.heightKm).toBeCloseTo(111.19, 1);
    });
    it('narrows width by cos(latitude)', () => {
        const atEquator = bboxDimensions(0.5, -0.5, 1, 0).widthKm;
        const at60 = bboxDimensions(60.5, 59.5, 1, 0).widthKm;
        expect(at60).toBeCloseTo(atEquator * Math.cos(60 * Math.PI / 180), 1);
    });
    it('area is width times height', () => {
        const d = bboxDimensions(10, 0, 10, 0);
        expect(d.areaKm2).toBeCloseTo(d.widthKm * d.heightKm, 6);
    });
});
