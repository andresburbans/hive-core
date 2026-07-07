/**
 * @file prior.ts — Dirichlet prior resolution with a fallback chain. Pure.
 *
 * Chain (most specific to most general): topic → cell (spatial prior) →
 * domain → city → country → global fallback. While a deployment accumulates
 * real data, learned levels do not exist and resolution falls through to
 * `GLOBAL_FALLBACK_ALPHA` at zero cost. Once priors are re-estimated, the
 * caller passes the docs in priority order.
 */

import { GLOBAL_FALLBACK_ALPHA, PRIOR_MIN_SAMPLES, type Alpha5 } from "./config";

/** `cell` = spatial prior (topic × coarse cell): quality expectation varies
 * over the territory and is inherited hierarchically. */
export type PriorScope = "topic" | "cell" | "domain" | "city" | "country" | "global";

export interface PriorDoc {
    scope: PriorScope;
    alpha: Alpha5;
    totalSamples: number;
}

/**
 * Returns the first prior with enough samples following the given order (most
 * specific first); if none qualifies, the global fallback. Passing `[]`
 * (initial deployment state) ⇒ immediate fallback, zero cost.
 */
export function resolveAlpha(
    candidatesInPriority: ReadonlyArray<PriorDoc | null | undefined>,
    minSamples = PRIOR_MIN_SAMPLES
): { alpha: Alpha5; source: PriorScope | "hardcoded-fallback" } {
    for (const p of candidatesInPriority) {
        if (p && Array.isArray(p.alpha) && p.alpha.length === 5 && p.totalSamples >= minSamples) {
            return { alpha: p.alpha, source: p.scope };
        }
    }
    return { alpha: GLOBAL_FALLBACK_ALPHA, source: "hardcoded-fallback" };
}
