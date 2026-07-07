/**
 * @file kernel.ts — LEARNED mobility kernel (pure).
 *
 * The log-logistic acceptance curve P(y=1|d) = 1/(1+(d/α)^β) is equivalent to
 * a logistic regression on ln d (slope −β, intercept β·lnα): the spatial decay
 * parameters are ESTIMATED from real actor behavior (matches accepted/declined
 * at distance d) per topic, with hierarchical shrinkage toward the global
 * kernel when the sample is scarce — the same philosophy as the Dirichlet
 * priors, applied to the spatial parameter.
 *
 * With 0 data it degrades EXACTLY to the design behavior (α=2.5 km, β=2):
 * ready for a scarce catalog, improving monotonically with evidence.
 */

/** Spatial decay parameters of a topic (or the global default). */
export interface MobilityKernel {
    alphaKm: number;
    beta: number;
    /** Observations backing the fit (0 = design value). */
    n: number;
}

/** Fallback kernel: the classic design behavior. */
export const DEFAULT_KERNEL: MobilityKernel = { alphaKm: 2.5, beta: 2, n: 0 };

export interface KernelSample {
    distanceKm: number;
    accepted: boolean;
}

/** Sanity bounds of the fit (outside these, data weighs less than design). */
const BETA_MIN = 0.4;
const BETA_MAX = 8;
const ALPHA_FIT_MIN_KM = 0.3;
const ALPHA_FIT_MAX_KM = 60;
const MIN_SAMPLES = 30;

/**
 * Fits (α, β) by maximum likelihood: logistic regression of `accepted` on
 * x = ln(d) via Newton–Raphson (2×2 IRLS, no external libraries). Returns null
 * if the sample is insufficient, degenerate (single class) or the fit unsound.
 */
export function fitMobilityKernel(samples: ReadonlyArray<KernelSample>): MobilityKernel | null {
    const xs: number[] = [];
    const ys: number[] = [];
    let pos = 0;
    for (const s of samples) {
        if (!Number.isFinite(s.distanceKm) || s.distanceKm <= 0) continue;
        xs.push(Math.log(s.distanceKm));
        ys.push(s.accepted ? 1 : 0);
        if (s.accepted) pos++;
    }
    const n = xs.length;
    if (n < MIN_SAMPLES || pos === 0 || pos === n) return null;

    // logit P = b0 + b1·x  (we expect b1 < 0). Start: b0=logit(base rate), b1=0.
    let b0 = Math.log(pos / (n - pos));
    let b1 = 0;
    for (let iter = 0; iter < 50; iter++) {
        // Gradient and Hessian of the log-likelihood.
        let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0;
        for (let i = 0; i < n; i++) {
            const x = xs[i]!;
            const z = b0 + b1 * x;
            const p = 1 / (1 + Math.exp(-z));
            const r = ys[i]! - p;
            const w = Math.max(1e-9, p * (1 - p));
            g0 += r;
            g1 += r * x;
            h00 += w;
            h01 += w * x;
            h11 += w * x * x;
        }
        const det = h00 * h11 - h01 * h01;
        if (!Number.isFinite(det) || Math.abs(det) < 1e-12) return null;
        const d0 = (h11 * g0 - h01 * g1) / det;
        const d1 = (h00 * g1 - h01 * g0) / det;
        b0 += d0;
        b1 += d1;
        if (Math.abs(d0) < 1e-7 && Math.abs(d1) < 1e-7) break;
    }

    const beta = -b1;
    if (!Number.isFinite(beta) || beta < BETA_MIN || beta > BETA_MAX) return null;
    const alphaKm = Math.exp(b0 / beta);
    if (!Number.isFinite(alphaKm) || alphaKm < ALPHA_FIT_MIN_KM || alphaKm > ALPHA_FIT_MAX_KM) return null;
    return { alphaKm, beta, n };
}

/**
 * Hierarchical shrinkage: with n_c observations, the topic kernel blends with
 * the global one by ω = n/(n+n0). With n=0 it returns the global exactly.
 */
export function shrinkKernel(
    fit: MobilityKernel | null,
    global: MobilityKernel = DEFAULT_KERNEL,
    n0 = 50
): MobilityKernel {
    if (!fit || fit.n <= 0) return global;
    const w = fit.n / (fit.n + n0);
    return {
        alphaKm: w * fit.alphaKm + (1 - w) * global.alphaKm,
        beta: w * fit.beta + (1 - w) * global.beta,
        n: fit.n,
    };
}

/* ─── Per-cell market state ────────────────────────────────────────────────── */

/** Aggregate per (coarse cell × topic). Maintained by a periodic job. */
export interface CellStats {
    activeCandidates?: number;
    openRequests30d?: number;
    searches30d?: number;
    matches90d?: number;
}

/**
 * Expected competition for the reverse direction: with K eligible competitors
 * for a request, the expected value of responding decays 1/(1+K/K0). Spreads
 * attention away from over-bidding and toward unmet demand.
 */
export function competitionFactor(expectedCompetitors: number | undefined, k0 = 6): number {
    if (expectedCompetitors === undefined || !Number.isFinite(expectedCompetitors)) return 0.5; // neutral
    return 1 / (1 + Math.max(0, expectedCompetitors) / k0);
}
