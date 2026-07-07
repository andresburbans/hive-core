/**
 * @file traits.ts — traceable categorical quality as a signal (f_trait). Pure.
 *
 * Categorical quality traits (single bidirectional vote per completed match,
 * e.g. "punctual", "tidy") extend numeric reputation toward the categorical.
 * f_trait measures the CONSISTENCY of the dominant trait with uniform
 * Dirichlet smoothing: a candidate voted "punctual" 9 of 10 times ≠ one with
 * scattered votes. Signal held in reserve (weight 0) until counts travel with
 * the candidate; it already feeds the LTR feature vector.
 */

export interface TraitScore {
    /** Consistency ∈ [0,1]. 0.5 = neutral (no votes). */
    score: number;
    /** Dominant trait (to explain the ranking), if any votes exist. */
    topTrait?: string;
}

export function traitConsistencyScore(counts: Record<string, number> | undefined): TraitScore {
    if (!counts) return { score: 0.5 };
    let total = 0;
    let max = 0;
    let top: string | undefined;
    let k = 0;
    for (const [trait, raw] of Object.entries(counts)) {
        const v = Math.max(0, Math.floor(raw ?? 0));
        if (v <= 0) continue;
        total += v;
        k++;
        if (v > max) {
            max = v;
            top = trait;
        }
    }
    if (total === 0) return { score: 0.5 };
    // Uniform Dirichlet posterior over the k voted traits (minimum 2 so a
    // single vote cannot claim perfect consistency).
    const kEff = Math.max(2, k);
    return { score: Math.min(1, (max + 1) / (total + kEff)), topTrait: top };
}
