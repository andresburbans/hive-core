import { describe, it, expect } from "vitest";
import {
    searchCell,
    neighborhoodCells,
    ringsForRadius,
    coverageLookupCell,
    computeCoverageIndex,
    computeCoverageIndexFromCell,
    toCoverageRes,
    WIDE_COVERAGE_KM,
} from "../src/retrieval";
import { hexDistanceKm, KM_PER_HEX_RES8, rotationTieBreak } from "../src/hexMetric";

const CALI = { lat: 3.4516, lng: -76.532 };

describe("forward neighborhood retrieval (F_geo)", () => {
    it("normalizes a position to its search cell deterministically", () => {
        const a = searchCell(CALI.lat, CALI.lng);
        const b = searchCell(CALI.lat, CALI.lng);
        expect(a).toBe(b);
        expect(a).toMatch(/^8/); // res-8 H3 index
    });

    it("N_k grows with local density bound 3k²+3k+1, independent of catalog size", () => {
        const center = searchCell(CALI.lat, CALI.lng);
        for (const k of [1, 2, 5]) {
            const cells = neighborhoodCells(center, k);
            expect(cells.length).toBeLessThanOrEqual(3 * k * k + 3 * k + 1);
            expect(cells).toContain(center);
        }
    });

    it("sizes rings to a target radius", () => {
        const k = ringsForRadius(5);
        expect(k * KM_PER_HEX_RES8).toBeGreaterThanOrEqual(5);
    });
});

describe("hexagonal metric", () => {
    it("distance to self is 0 and grows with ring separation", () => {
        const center = searchCell(CALI.lat, CALI.lng);
        expect(hexDistanceKm(center, center)).toBe(0);
        const ring2 = neighborhoodCells(center, 2).filter(
            (c) => !neighborhoodCells(center, 1).includes(c)
        );
        expect(hexDistanceKm(center, ring2[0])).toBeCloseTo(2 * KM_PER_HEX_RES8, 5);
    });

    it("tie-break is deterministic within a day and bounded in [0,1)", () => {
        const t = rotationTieBreak("cand-1", 1700000000000);
        expect(t).toBe(rotationTieBreak("cand-1", 1700000000000));
        expect(t).toBeGreaterThanOrEqual(0);
        expect(t).toBeLessThan(1);
        expect(t).not.toBe(rotationTieBreak("cand-2", 1700000000000));
    });
});

describe("reverse coverage index (radius containment)", () => {
    it("always contains the offer's own cell", () => {
        const idx = computeCoverageIndex(CALI.lat, CALI.lng, 10);
        expect(idx.wideCoverage).toBe(false);
        expect(idx.coverageCells).toContain(coverageLookupCell(CALI.lat, CALI.lng));
    });

    it("covers the declared radius: a point at the edge is reachable", () => {
        const idx = computeCoverageIndex(CALI.lat, CALI.lng, 20);
        // A point ≈ 18 km north must fall in some covered cell.
        const northCell = coverageLookupCell(CALI.lat + 0.162, CALI.lng);
        expect(idx.coverageCells).toContain(northCell);
    });

    it("flags wide coverages instead of celling them", () => {
        const idx = computeCoverageIndex(CALI.lat, CALI.lng, WIDE_COVERAGE_KM);
        expect(idx.wideCoverage).toBe(true);
        expect(idx.coverageCells).toHaveLength(0);
    });

    it("write cost is bounded (tens–hundreds of cells, not thousands)", () => {
        const idx = computeCoverageIndex(CALI.lat, CALI.lng, 50);
        expect(idx.coverageCells.length).toBeGreaterThan(10);
        expect(idx.coverageCells.length).toBeLessThan(500);
    });

    it("derives the index from a cell when no coordinates exist", () => {
        const cell = searchCell(CALI.lat, CALI.lng);
        const idx = computeCoverageIndexFromCell(cell, 10);
        expect(idx.wideCoverage).toBe(false);
        expect(idx.coverageCells.length).toBeGreaterThan(0);
        expect(toCoverageRes(cell)).not.toBeNull();
    });
});
