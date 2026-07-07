/**
 * @file dirichlet.ts — Dirichlet–Multinomial reputation model (pure).
 *
 * Ordinal evidence (e.g. 1–5 star counts) is treated as a distribution, not an
 * average: level and risk are separated. Notation:
 *   n = (n1..n5) per-level counts · α = (α1..α5) prior · N=Σn · α0=Σα
 *   Posterior θ ~ Dir(α+n). R = Σ k·θ_k has closed-form mean/variance.
 */

import type { Alpha5 } from "./config";
import { LEGACY_NEFF_CAP } from "./config";
import { sampleGamma } from "./random";

export type Counts5 = readonly [number, number, number, number, number];

const LEVELS = [1, 2, 3, 4, 5] as const;

/** E[R | n, α] under the Dirichlet–Multinomial posterior. Range [1,5]. */
export function expectedRating(n: Counts5, a: Alpha5): number {
    const N = n[0] + n[1] + n[2] + n[3] + n[4];
    const a0 = a[0] + a[1] + a[2] + a[3] + a[4];
    const denom = N + a0;
    if (denom <= 0) return 0;
    let s = 0;
    for (let i = 0; i < 5; i++) s += (LEVELS[i] * (n[i] + a[i])) / denom;
    return s;
}

/** Var[R | n, α]. Doubles as a polarization/risk metric for the candidate. */
export function ratingVariance(n: Counts5, a: Alpha5): number {
    const N = n[0] + n[1] + n[2] + n[3] + n[4];
    const a0 = a[0] + a[1] + a[2] + a[3] + a[4];
    const denom = N + a0;
    if (denom <= 0) return 0;
    let er = 0;
    const p = new Array<number>(5);
    for (let i = 0; i < 5; i++) {
        p[i] = (n[i] + a[i]) / denom;
        er += LEVELS[i] * p[i];
    }
    let v = 0;
    for (let i = 0; i < 5; i++) {
        const diff = LEVELS[i] - er;
        v += diff * diff * p[i];
    }
    return v;
}

/** Consistency score ∈ (0,1]. 1 = consistent, → 0 = polarized. */
export function consistency(varR: number): number {
    if (!Number.isFinite(varR) || varR < 0) return 1;
    return 1 / (1 + varR);
}

/** Total observations in a count vector. */
export function totalCounts(n: Counts5): number {
    return n[0] + n[1] + n[2] + n[3] + n[4];
}

/**
 * Cold-start fallback: derives a count vector from a scalar `(rating, count)`
 * pair when true per-level counts do not exist yet. Splits the count between
 * floor/ceil of the average so the implied mean matches.
 *
 * The effective N is CAPPED (`LEGACY_NEFF_CAP`) because scalar counts often
 * come from completed transactions, which are NOT reviews — treating them 1:1
 * concentrates the posterior with evidence that does not exist.
 */
export function deriveCountsFromLegacy(
    rating: number | undefined,
    ratingCount: number | undefined,
    maxN: number = LEGACY_NEFF_CAP
): Counts5 {
    const total = Math.min(Math.max(0, Math.floor(ratingCount ?? 0)), Math.max(0, maxN));
    if (total === 0) return [0, 0, 0, 0, 0];
    const r = Math.max(1, Math.min(5, rating ?? 3));
    const lo = Math.floor(r);
    const hi = Math.ceil(r);
    const out = [0, 0, 0, 0, 0];
    if (lo === hi) {
        out[lo - 1] = total;
    } else {
        const nHi = Math.round(total * (r - lo));
        out[lo - 1] = total - nHi;
        out[hi - 1] = nHi;
    }
    return [out[0], out[1], out[2], out[3], out[4]];
}

/**
 * Sample of the expected rating under the posterior (Thompson sampling):
 * θ ~ Dir(α+n) via Gamma draws, R̃ = Σ k·θ_k ∈ [1,5]. A candidate with little
 * evidence has a wide posterior → sometimes samples high → earns exposure
 * proportional to its uncertainty. `rand` is seedable for reproducibility.
 */
export function sampleExpectedRating(n: Counts5, a: Alpha5, rand: () => number): number {
    const g = new Array<number>(5);
    let sum = 0;
    for (let i = 0; i < 5; i++) {
        g[i] = sampleGamma(Math.max(1e-3, n[i] + a[i]), rand);
        sum += g[i];
    }
    if (sum <= 0) return expectedRating(n, a);
    let r = 0;
    for (let i = 0; i < 5; i++) r += LEVELS[i] * (g[i] / sum);
    return r;
}

/**
 * Method-of-Moments estimator of the prior α given a set of observed rating
 * distributions (one per candidate). Used by server-side prior re-estimation.
 * α0 = p̄(1-p̄)/s² − 1, α_k = α0·p̄_k. Returns null if the sample is
 * insufficient or degenerate.
 */
export function estimatePriorMoM(
    samples: ReadonlyArray<Counts5>,
    minSamples = 30
): { alpha: Alpha5; totalSamples: number } | null {
    const informative: Counts5[] = [];
    let total = 0;
    for (const s of samples) {
        const t = totalCounts(s);
        if (t > 0) {
            informative.push(s);
            total += t;
        }
    }
    if (informative.length < minSamples) return null;

    const ps = informative.map((s) => {
        const t = totalCounts(s);
        return [s[0] / t, s[1] / t, s[2] / t, s[3] / t, s[4] / t];
    });

    const pbar = [0, 0, 0, 0, 0];
    for (const p of ps) for (let i = 0; i < 5; i++) pbar[i] += p[i];
    for (let i = 0; i < 5; i++) pbar[i] /= ps.length;

    const s2 = [0, 0, 0, 0, 0];
    for (const p of ps) for (let i = 0; i < 5; i++) {
        const d = p[i] - pbar[i];
        s2[i] += d * d;
    }
    for (let i = 0; i < 5; i++) s2[i] /= Math.max(1, ps.length - 1);

    let acc = 0;
    let cnt = 0;
    for (let i = 0; i < 5; i++) {
        if (s2[i] <= 1e-9) continue;
        const a0i = (pbar[i] * (1 - pbar[i])) / s2[i] - 1;
        if (a0i > 0 && Number.isFinite(a0i)) {
            acc += a0i;
            cnt += 1;
        }
    }
    if (cnt === 0) return null;
    const a0 = acc / cnt;
    if (!(a0 > 0) || !Number.isFinite(a0)) return null;

    const alpha: Alpha5 = [
        Math.max(1e-3, a0 * pbar[0]),
        Math.max(1e-3, a0 * pbar[1]),
        Math.max(1e-3, a0 * pbar[2]),
        Math.max(1e-3, a0 * pbar[3]),
        Math.max(1e-3, a0 * pbar[4]),
    ];
    return { alpha, totalSamples: total };
}
