/**
 * @file config.ts — weights and parameters of the HIVE geo-contextual engine.
 *
 * Pure, isomorphic module (no I/O, no DOM): the same code runs on-device and
 * server-side. Values are code-first defaults; a deployment may override them
 * (e.g. with learned kernels or re-estimated priors) without touching the math.
 *
 * HONESTY RULE: a signal without real data behind it receives an explicit
 * weight of 0 — never a nominal weight over a constant, which moves no
 * positions and merely fakes sophistication. `WEIGHTS` is the LIVE profile
 * (signals with data today); `WEIGHTS_FULL` preserves the complete design so
 * that activating a signal is a switch, not a redesign.
 */

export type Alpha5 = readonly [number, number, number, number, number];

export interface ScoringWeights {
    distance: number;
    expectedRating: number;
    varPenalty: number;
    /** Lexical relevance query↔candidate (f_text). */
    text: number;
    topicMatch: number;
    activity: number;
    recency: number;
    price: number;
    engagement: number;
    /** Categorical-trait consistency. Reserved until traits travel with candidates. */
    traits: number;
    /** Latent affinity (graph embeddings). Reserved slot — 0 by default. */
    affinity: number;
}

/**
 * Weight profile per flow and urgency:
 *  - `browse`   — the seeker explores the catalog (no budget commitment).
 *  - `request`  — the seeker broadcasts a concrete need (budget matters more).
 *  - `request_urgent` — same, under urgency (space and availability dominate).
 *
 * Urgency does NOT enter the score as an additive term: context does not
 * change the facts of a candidate, only their relative importance.
 */
export type WeightProfile = "browse" | "request" | "request_urgent";

/**
 * LIVE profile: only signals with real data today (hexagonal distance, derived
 * reputation, text, topic focus, recency, price). Coverage is NOT a score term
 * (it was collinear with distance and rewarded over-declaration) — it remains
 * as a gate plus a slack feature in the LTR vector.
 */
export const WEIGHTS: Record<WeightProfile, ScoringWeights> = {
    browse: {
        distance: 0.30, expectedRating: 0.25, varPenalty: 0.07, text: 0.14,
        topicMatch: 0.11, activity: 0, recency: 0.06, price: 0.07,
        engagement: 0, traits: 0, affinity: 0,
    },
    request: {
        distance: 0.28, expectedRating: 0.23, varPenalty: 0.07, text: 0.13,
        topicMatch: 0.09, activity: 0, recency: 0.04, price: 0.16,
        engagement: 0, traits: 0, affinity: 0,
    },
    request_urgent: {
        distance: 0.35, expectedRating: 0.20, varPenalty: 0.05, text: 0.09,
        topicMatch: 0.07, activity: 0, recency: 0.03, price: 0.14,
        engagement: 0, traits: 0, affinity: 0,
    },
};

/**
 * FULL design profile: activated signal-by-signal as instrumentation lands.
 * Not used in production yet.
 */
export const WEIGHTS_FULL: Record<WeightProfile, ScoringWeights> = {
    browse: {
        distance: 0.26, expectedRating: 0.20, varPenalty: 0.06, text: 0.12,
        topicMatch: 0.10, activity: 0.06, recency: 0.04, price: 0.06,
        engagement: 0.03, traits: 0.03, affinity: 0,
    },
    request: {
        distance: 0.26, expectedRating: 0.20, varPenalty: 0.06, text: 0.12,
        topicMatch: 0.08, activity: 0.06, recency: 0.03, price: 0.13,
        engagement: 0.03, traits: 0.03, affinity: 0,
    },
    request_urgent: {
        distance: 0.32, expectedRating: 0.18, varPenalty: 0.05, text: 0.08,
        topicMatch: 0.06, activity: 0.12, recency: 0.02, price: 0.09,
        engagement: 0.02, traits: 0.02, affinity: 0,
    },
};

/**
 * Reverse-direction weights (provider→open requests): the same primitives rank
 * open needs as opportunities for one provider.
 */
export const REVERSE_WEIGHTS = {
    distance: 0.30,
    price: 0.26,
    text: 0.16,
    focus: 0.10,
    recency: 0.18,
    /** Multiplicative boost applied to urgent requests on the final score. */
    urgentBoost: 1.15,
} as const;

/** Recency half-life in the reverse direction: an open need expires fast as an opportunity. */
export const REVERSE_RECENCY_HALFLIFE_H = { urgent: 12, scheduled: 72 } as const;

/** Offer-ranking weights (seeker→incoming offers on a broadcast need). */
export const OFFER_WEIGHTS = {
    price: 0.50,
    expectedRating: 0.38,
    varPenalty: 0.12,
} as const;

/* ─── Distance / space ─────────────────────────────────────────────────────── */

/**
 * Bounds of the effective decay scale α. The base α comes from the mobility
 * KERNEL (learned or by design) and is modulated by local supply DENSITY —
 * never by the candidate's self-declared coverage (a manipulable incentive).
 */
export const ALPHA_BOUNDS = { minKm: 1.2, maxKm: 9 } as const;

/**
 * Local-supply modulation: α_eff = α·clamp((S_ref/S)^γ). Scarce market → the
 * model "looks farther"; dense → it tightens. Without a density figure the
 * factor is 1 (degrades to the pure kernel).
 */
export const DENSITY = { gamma: 0.5, refSupply: 12, factorMin: 0.7, factorMax: 1.8 } as const;

/* ─── Text ─────────────────────────────────────────────────────────────────── */

/**
 * Text-softened gate (rescue of miscategorized candidates): a candidate whose
 * declared topic does not match may still enter if f_text ≥ tau AND at least
 * one query token hit the candidate's TITLE (conservative).
 */
export const TEXT = { tau: 0.55, gateNeedsTitleHit: true } as const;

/* ─── Exploration (Thompson sampling) ──────────────────────────────────────── */

/**
 * Sample from the Dirichlet posterior instead of using its mean, only below a
 * protected top. Off by default: enable once behavioral evidence exists that
 * the feedback loop could distort.
 */
export const THOMPSON = { enabled: false, lambda: 0.3, protectTop: 3 } as const;

/* ─── Time ─────────────────────────────────────────────────────────────────── */

export const ACTIVITY_HALFLIFE_H = 48; // availability
export const RECENCY_HALFLIFE_H = 90 * 24; // listing freshness

/* ─── Behavior ─────────────────────────────────────────────────────────────── */

/** Engagement smoothing. a=b → neutral baseline 0.5 (does not punish newcomers). */
export const ENGAGEMENT_SMOOTHING = { a: 5, b: 5 } as const;

/** Review count at which Dirichlet reputation dominates and engagement switches off. */
export const REPUTATION_MATURITY_N = 10;

/* ─── Reputation ───────────────────────────────────────────────────────────── */

/**
 * Cap on the effective N when deriving counts from a legacy scalar rating:
 * completed jobs are NOT reviews; treating them 1:1 concentrates the posterior
 * with evidence that does not exist (overconfidence).
 */
export const LEGACY_NEFF_CAP = 8;

/** Global fallback prior (J-curve typical of marketplaces). α0 = 7. */
export const GLOBAL_FALLBACK_ALPHA: Alpha5 = [1, 1, 1, 2, 2];

/** Minimum samples to trust a learned prior (below this, the fallback stands). */
export const PRIOR_MIN_SAMPLES = 30;

/* ─── Price ────────────────────────────────────────────────────────────────── */

/**
 * Fit when the candidate publishes no rate for the requested unit: explicit
 * uncertainty (not perfect neutrality). Applies only when a budget exists.
 */
export const UNIT_MISMATCH_FIT = 0.65;

/* ─── Coverage ─────────────────────────────────────────────────────────────── */

/** Radii at or beyond this threshold are treated as "unlimited" in the gate. */
export const UNLIMITED_COVERAGE_KM = 1000;

/** True if the radius amounts to unlimited coverage. */
export function isUnlimitedCoverage(km: number): boolean {
    return km >= UNLIMITED_COVERAGE_KM;
}

export const MODEL_VERSION = "hive-1/lib-0.1";
