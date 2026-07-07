/**
 * @file hexMetric.ts — native hexagonal metric of the model.
 *
 * The model reasons over the DISCRETE H3 space, not the continuous lat/lng
 * plane: the internal distance is `gridDistance` (integer, exact, cheap)
 * converted to nominal km only where semantics demand it (the coverage gate).
 * Epistemic honesty: cell-level anonymization already destroyed sub-cell
 * precision, and the metric acknowledges it — candidates in the same cell are
 * indistinguishable by design and are tie-broken by fair deterministic
 * ROTATION (exposure equity), not by pseudo-precise centroids. Falls back to
 * Haversine if `gridDistance` fails (icosahedron face crossings/pentagons —
 * irrelevant at urban scale).
 */

import { gridDistance, getResolution, cellToParent, cellToLatLng, getHexagonEdgeLengthAvg, UNITS } from "h3-js";
import { haversineKm } from "./decay";
import { hashSeed } from "./random";

/** Default search resolution (H3 res 8 ≈ neighborhood scale, edge ≈ 461 m). */
export const SEARCH_RES = 8;

/** Mean center-to-center spacing of res-8 cells (≈ edge 461 m × √3). */
export const KM_PER_HEX_RES8 = 0.798;

/** Center-to-center spacing (km) for an arbitrary resolution. */
export function kmPerCell(res: number): number {
    if (res === SEARCH_RES) return KM_PER_HEX_RES8;
    return getHexagonEdgeLengthAvg(res, UNITS.km) * Math.sqrt(3);
}

/** Brings a cell to the search resolution (up to its parent if finer). Null if impossible. */
function asSearchRes(cell: string, res: number): string | null {
    try {
        const r = getResolution(cell);
        if (r === res) return cell;
        if (r > res) return cellToParent(cell, res);
        return null;
    } catch {
        return null;
    }
}

/**
 * Hexagonal distance between two cells, in nominal km (cells × spacing).
 *
 * PRECONDITION: both cells must be at the search resolution or FINER (finer
 * cells are lifted to their parent). A cell coarser than the search resolution
 * cannot be refined safely, so this returns null and the caller falls back to
 * centroid Haversine — the native metric never activates for such deployments.
 * Also returns null if either cell is invalid or `gridDistance` fails.
 */
export function hexDistanceKm(
    cellA: string | undefined,
    cellB: string | undefined,
    res: number = SEARCH_RES
): number | null {
    if (!cellA || !cellB) return null;
    const a = asSearchRes(cellA, res);
    const b = asSearchRes(cellB, res);
    if (!a || !b) return null;
    try {
        const cells = gridDistance(a, b);
        if (!Number.isFinite(cells) || cells < 0) return null;
        return cells * kmPerCell(res);
    } catch {
        // Known H3 failure across icosahedron faces → continuous metric.
        try {
            const [alat, alng] = cellToLatLng(a);
            const [blat, blng] = cellToLatLng(b);
            return haversineKm(alat, alng, blat, blng);
        } catch {
            return null;
        }
    }
}

/**
 * Fair rotating tie-break between spatially indistinguishable candidates:
 * deterministic hash of (id + Julian day) ∈ [0,1). Daily rotation spreads
 * exposure among exact neighbors instead of freezing an arbitrary order.
 */
export function rotationTieBreak(id: string, nowMs: number = Date.now()): number {
    const day = Math.floor(nowMs / 86_400_000);
    return hashSeed(`${id}:${day}`) / 4294967296;
}
