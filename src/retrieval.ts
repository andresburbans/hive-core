/**
 * @file retrieval.ts — the F_geo stage: discrete-neighborhood retrieval and
 * the reverse coverage index.
 *
 * Forward retrieval: the seeker's position normalizes to a search cell and a
 * disk of neighbor rings is expanded — the candidate set is a set-membership
 * query, not a mass distance computation. Its cost depends on LOCAL density,
 * not on catalog size.
 *
 * Reverse coverage index ("radius containment"): each candidate declares how
 * far they travel, with heterogeneous radii, so a disk around the seeker
 * cannot capture them all. Instead, on publish each offer precomputes the
 * coarse cells its coverage disk spans; the seeker retrieves, with a single
 * indexed query, the offers whose coverage contains their own cell. Very wide
 * coverages are not "celled" (the array would explode): they are flagged
 * `wideCoverage` and fetched through a separate bucket. The write cost (tens
 * to hundreds of cells) is paid once per publish; the hot read path stays
 * O(1) in queries and indexes. The fine gate in `scoreCandidate` (distance ≤
 * radius) trims any grid over-coverage, so over-celling is harmless.
 */

import { latLngToCell, cellToLatLng, cellToParent, gridDisk, getResolution } from "h3-js";
import { haversineKm } from "./decay";
import { isUnlimitedCoverage } from "./config";
import { SEARCH_RES, kmPerCell } from "./hexMetric";

/** Resolution of the coverage index. res 6 ≈ 36 km²/cell, edge ≈ 3.2 km. */
export const COVERAGE_CELL_RES = 6;
/** Approximate center-to-center spacing of res-6 cells (km). To size k. */
const RES6_RING_KM = 5.2;

/**
 * Coverages at or beyond this threshold (km) are NOT celled: the array would
 * hold thousands of cells. They are flagged `wideCoverage` and fetched by bucket.
 */
export const WIDE_COVERAGE_KM = 60;

/** H3 cell of a point at search resolution (the query's center cell). */
export function searchCell(lat: number, lng: number, res: number = SEARCH_RES): string {
    return latLngToCell(lat, lng, res);
}

/**
 * Forward neighborhood N_k(h): the disk of cells within k rings of the center
 * cell. The candidate set C_k(u) is every active candidate whose cell belongs
 * to this disk (set membership — the deployment's index resolves it).
 */
export function neighborhoodCells(centerCell: string, k: number): string[] {
    return gridDisk(centerCell, Math.max(0, Math.floor(k)));
}

/** Rings needed so the disk spans `radiusKm` at resolution `res`. */
export function ringsForRadius(radiusKm: number, res: number = SEARCH_RES): number {
    return Math.max(1, Math.ceil(radiusKm / kmPerCell(res)));
}

/** H3 res-6 cell of a point (the seeker's coverage-lookup cell). */
export function coverageLookupCell(lat: number, lng: number): string {
    return latLngToCell(lat, lng, COVERAGE_CELL_RES);
}

/** Brings any cell to its res-6 parent (derives the lookup cell without lat/lng). */
export function toCoverageRes(cell: string): string | null {
    if (!cell) return null;
    try {
        const r = getResolution(cell);
        if (r === COVERAGE_CELL_RES) return cell;
        if (r > COVERAGE_CELL_RES) return cellToParent(cell, COVERAGE_CELL_RES);
        return null; // coarser than res 6: cannot refine safely
    } catch {
        return null;
    }
}

export interface CoverageIndex {
    /** true if coverage is so wide it is fetched by bucket (not by cells). */
    wideCoverage: boolean;
    /** res-6 cells spanned by the coverage disk (empty if `wideCoverage`). */
    coverageCells: string[];
}

/**
 * Computes an offer's coverage index given its point and radius. For bounded
 * coverages, generates a res-6 `gridDisk` sized to the radius and trims it to
 * cells whose center falls within `km + buffer` (tightens the array).
 */
export function computeCoverageIndex(lat: number, lng: number, km: number): CoverageIndex {
    if (isUnlimitedCoverage(km) || km >= WIDE_COVERAGE_KM) {
        return { wideCoverage: true, coverageCells: [] };
    }
    const center = coverageLookupCell(lat, lng);
    // +1 safety ring so disk edges are not lost.
    const k = Math.max(1, Math.ceil(km / RES6_RING_KM) + 1);
    const buffer = km + RES6_RING_KM; // edge tolerance (≈ half a cell)
    const cells = gridDisk(center, k).filter((c) => {
        const [clat, clng] = cellToLatLng(c);
        return haversineKm(lat, lng, clat, clng) <= buffer;
    });
    // The point's own cell is always included.
    if (!cells.includes(center)) cells.push(center);
    return { wideCoverage: false, coverageCells: cells };
}

/** Same as {@link computeCoverageIndex} but starting from an H3 cell (uses its center). */
export function computeCoverageIndexFromCell(cell: string, km: number): CoverageIndex {
    const res6 = toCoverageRes(cell);
    if (!res6) return { wideCoverage: isUnlimitedCoverage(km) || km >= WIDE_COVERAGE_KM, coverageCells: [] };
    const [lat, lng] = cellToLatLng(res6);
    return computeCoverageIndex(lat, lng, km);
}
