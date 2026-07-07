/**
 * @file price.ts — economic compatibility price↔budget. Pure.
 *
 * Uses the FULL three-level band `{min, acceptable, desired}` a candidate
 * declares per charging unit: negotiation zone (linear), satisfaction zone
 * (gentle slope toward `desired`) and saturation at 1 from `desired` upward.
 * Continuous and monotone. The same fit serves the forward direction
 * (candidate band vs seeker budget) and the reverse one (request budget vs
 * candidate band).
 */

import { UNIT_MISMATCH_FIT } from "./config";

/**
 * Three-level negotiation band. Not a statistical range: each value plays a
 * distinct negotiation role (internal floor, public expected value, target).
 */
export interface PriceBand {
    /** The minimum the candidate would accept. Internal negotiation floor. */
    min: number;
    /** Acceptable/expected value. The publicly shown price. */
    acceptable: number;
    /** Ideal/desired price. Ceiling and negotiation anchor. */
    desired: number;
}

/** Bands per charging unit (e.g. "hour" | "day" | "activity" — deployment-defined). */
export type PricingByUnit = Partial<Record<string, PriceBand>>;

/**
 * f_price ∈ [0,1]:
 *   - no budget (browse) → 1 (neutral)
 *   - no band for the requested unit → UNIT_MISMATCH_FIT (explicit uncertainty)
 *   - B ≥ desired              → 1                                  (desire zone)
 *   - acceptable ≤ B < desired → 0.85 + 0.15·(B−acc)/(des−acc)      (satisfaction)
 *   - min ≤ B < acceptable     → 0.85·(B−min)/(acc−min)             (negotiation)
 *   - B < min                  → 0                                  (out of range)
 */
export function priceFit(budget: number | undefined, band: PriceBand | undefined): number {
    if (!budget || budget <= 0) return 1; // browse / no budget: neutral
    if (!band) return UNIT_MISMATCH_FIT;

    const min = band.min ?? 0;
    const acc = Math.max(min, band.acceptable ?? min);
    const des = Math.max(acc, band.desired ?? acc);

    if (budget >= des) return 1;
    if (budget >= acc) {
        const span = des - acc;
        return span > 0 ? 0.85 + 0.15 * ((budget - acc) / span) : 1;
    }
    if (budget >= min) {
        const span = acc - min;
        return span > 0 ? 0.85 * ((budget - min) / span) : 0.85;
    }
    return 0;
}

/**
 * Fit of an ACTUAL offered amount vs the seeker's budget (offer ranking): 1 if
 * within budget, decaying linearly to 0 at double the budget. Unknown budget →
 * neutral 0.5.
 */
export function offerPriceFit(budget: number | undefined, offeredAmount: number): number {
    if (!budget || budget <= 0) return 0.5;
    if (!Number.isFinite(offeredAmount) || offeredAmount <= 0) return 0.5;
    if (offeredAmount <= budget) return 1;
    return Math.max(0, 1 - (offeredAmount - budget) / budget);
}
