/**
 * @file scoring.ts — scoring functions of the engine (the heart).
 *
 * Several directions, ONE mathematics (full bidirectionality):
 *   - `scoreCandidate`   — forward: ranks situated candidates for a query.
 *   - `scoreOpportunity` — reverse: ranks open needs for one provider.
 *   - `scoreOffer`       — offer pass: ranks incoming offers for the seeker.
 *
 * Design decisions carried from the audited production model: native
 * hexagonal metric with Haversine fallback, text-softened gate (rescue of
 * miscategorized candidates), graded topic focus, decay α from the learned
 * kernel + density (never from self-declared coverage), three-level price
 * bands, coverage removed from the score (gate + LTR slack only), dead
 * signals at weight 0 (honesty rule) and optional Thompson sampling. Pure.
 */

import {
    WEIGHTS,
    REVERSE_WEIGHTS,
    REVERSE_RECENCY_HALFLIFE_H,
    OFFER_WEIGHTS,
    TEXT,
    ACTIVITY_HALFLIFE_H,
    RECENCY_HALFLIFE_H,
    ENGAGEMENT_SMOOTHING,
    REPUTATION_MATURITY_N,
    DENSITY,
    REVERSE_KERNEL,
    MODEL_VERSION,
    isUnlimitedCoverage,
    type Alpha5,
    type WeightProfile,
} from "./config";
import {
    expectedRating,
    ratingVariance,
    consistency,
    totalCounts,
    deriveCountsFromLegacy,
    sampleExpectedRating,
} from "./dirichlet";
import { logLogistic, alphaEff, haversineKm, expDecay } from "./decay";
import { hexDistanceKm, rotationTieBreak } from "./hexMetric";
import { priceFit, offerPriceFit } from "./price";
import { engagementScore } from "./engagement";
import { traitConsistencyScore } from "./traits";
import { textScore } from "./text";
import { DEFAULT_KERNEL } from "./kernel";
import {
    type SituatedQuery,
    type SituatedCandidate,
    type OpenNeed,
    type ProviderContext,
    type OfferFeatures,
    resolveUnit,
    weightProfileFor,
} from "./contracts";

export interface ScoreResult {
    /** Passed the gate (focus/text + coverage). If false, the caller discards. */
    passedGate: boolean;
    score: number;
    distanceKm: number;
    expectedRating: number; // E[R]
    variance: number; // Var[R]
    consistency: number; // 1/(1+Var)
    /** Lexical relevance query↔candidate ∈ [0,1]. */
    textScore: number;
    /** Fair rotating tie-break (lower first) among equal scores. */
    tieBreak: number;
    components: Record<string, number>;
    /** LTR vector x_p ∈ ℝ¹⁴ (for interaction telemetry when it lands). */
    featureVector: number[];
    /** Model version that produced this ordering (the `v` of telemetry tuples). */
    modelVersion: string;
}

const FAIL: Omit<ScoreResult, "distanceKm" | "expectedRating" | "variance" | "consistency" | "textScore" | "tieBreak"> = {
    passedGate: false,
    score: -Infinity,
    components: {},
    featureVector: [],
    modelVersion: MODEL_VERSION,
};

/** Model distance: native hexagonal if cells exist; Haversine otherwise. */
function modelDistanceKm(
    centerCell: string | undefined,
    center: { lat: number; lng: number },
    cell: string | undefined,
    lat: number,
    lng: number
): number {
    const hex = hexDistanceKm(centerCell, cell);
    if (hex !== null) return hex;
    return haversineKm(center.lat, center.lng, lat, lng);
}

export function scoreCandidate(
    c: SituatedCandidate,
    q: SituatedQuery,
    alpha: Alpha5,
    profile: WeightProfile = weightProfileFor(q)
): ScoreResult {
    const now = q.nowMs ?? Date.now();
    const distanceKm = modelDistanceKm(q.centerCell, q.center, c.cell, c.lat, c.lng);
    const unlimited = isUnlimitedCoverage(c.coverageRadiusKm);

    // ── Text (evaluated before the gate: it can rescue miscategorized) ───────
    const txt = textScore(q.text, c.textDoc);

    // ── Gate: thematic pertinence (hard or via text) + coverage ──────────────
    const topicMatch = q.focusTopicIds.includes(c.topicId);
    const domainMatch = !!q.focusDomainId && q.focusDomainId === c.domainId;
    const rescued =
        !topicMatch && !domainMatch &&
        txt.score >= TEXT.tau &&
        (!TEXT.gateNeedsTitleHit || txt.titleHits > 0);
    const focusOk = q.discovery === true || topicMatch || domainMatch || rescued;
    const coverageOk = unlimited || distanceKm <= c.coverageRadiusKm;
    if (!focusOk || !coverageOk) {
        return { ...FAIL, distanceKm, expectedRating: 0, variance: 0, consistency: 1, textScore: txt.score, tieBreak: 1 };
    }

    // ── Reputation (Dirichlet–Multinomial) ───────────────────────────────────
    const N = totalCounts(c.ratingCounts);
    const eR = expectedRating(c.ratingCounts, alpha);
    const vR = ratingVariance(c.ratingCounts, alpha);
    const cons = consistency(vR);

    // ── Signals ──────────────────────────────────────────────────────────────
    const kernel = q.kernel ?? DEFAULT_KERNEL;
    const aKm = alphaEff(kernel.alphaKm, q.localSupply);
    const f_dist = logLogistic(distanceKm, aKm, kernel.beta);
    const f_eR = eR / 5;
    const f_pen = Math.min(vR / 2, 1);
    const f_text = txt.score;
    // Graded focus: exact topic > same domain (text refines) > text rescue.
    // In discovery mode, matches are rewarded softly.
    const f_topic = q.discovery
        ? topicMatch ? 1.0 : domainMatch ? 0.85 : 0.7
        : topicMatch ? 1.0 : domainMatch ? 0.6 + 0.4 * f_text : Math.max(0.4, f_text);
    const f_act = c.lastActiveMs ? expDecay((now - c.lastActiveMs) / 3.6e6, ACTIVITY_HALFLIFE_H) : 0.5;
    const f_rec = c.createdMs ? expDecay((now - c.createdMs) / 3.6e6, RECENCY_HALFLIFE_H) : 0.5;
    const unit = resolveUnit(q, c.primaryUnit);
    const band = c.pricing?.[unit];
    const f_price = priceFit(q.budget, band);
    const unitMismatch = !!q.budget && q.budget > 0 && !band ? 1 : 0;
    const f_eng = engagementScore(c.engagement, ENGAGEMENT_SMOOTHING);
    // Engagement fades as real reputation grows (anti feedback-loop).
    const coldStart = Math.max(0, 1 - N / REPUTATION_MATURITY_N);
    const f_trait = traitConsistencyScore(c.traitCounts).score;
    // Coverage slack: LTR feature ONLY (removed from the score by design).
    const covSlack = unlimited ? 1 : Math.max(0, 1 - distanceKm / Math.max(1, c.coverageRadiusKm));
    const supplyNorm = Math.min(1, (q.localSupply ?? 0) / (2 * DENSITY.refSupply));

    const w = WEIGHTS[profile];
    const score =
        w.distance * f_dist +
        w.expectedRating * f_eR -
        w.varPenalty * f_pen +
        w.text * f_text +
        w.topicMatch * f_topic +
        w.activity * f_act +
        w.recency * f_rec +
        w.price * f_price +
        w.engagement * f_eng * coldStart +
        w.traits * f_trait +
        w.affinity * 0; // latent-affinity slot (graph embeddings)

    return {
        passedGate: true,
        score,
        distanceKm,
        expectedRating: eR,
        variance: vR,
        consistency: cons,
        textScore: f_text,
        tieBreak: rotationTieBreak(c.id, now),
        components: { f_dist, f_eR, f_pen, f_text, f_topic, f_act, f_rec, f_price, f_eng, f_trait, coldStart, rescued: rescued ? 1 : 0 },
        // x_p ∈ ℝ¹⁴
        featureVector: [f_dist, distanceKm, f_eR, vR, cons, f_text, f_topic, f_act, f_rec, f_price, unitMismatch, covSlack, supplyNorm, f_trait],
        modelVersion: MODEL_VERSION,
    };
}

/**
 * Exploration adjustment (Thompson sampling): re-scores a candidate replacing
 * the fraction λ of its reputation term with a SAMPLE from the posterior. The
 * caller applies it only below the protected top, with an RNG seeded by
 * (day, candidate) so the ranking does not "dance" between renders.
 *
 * Reproducibility: build the RNG with `explorationRng(c.id, q.nowMs)` — the
 * day must derive from the frozen evaluation clock, not from `Date.now()`,
 * or the exploratory phase of an experiment cannot be replayed.
 */
export function explorationScore(
    base: ScoreResult,
    c: SituatedCandidate,
    alpha: Alpha5,
    profile: WeightProfile,
    lambda: number,
    rand: () => number
): number {
    if (!base.passedGate) return base.score;
    const sampled = sampleExpectedRating(c.ratingCounts, alpha, rand);
    const w = WEIGHTS[profile];
    return base.score + w.expectedRating * lambda * (sampled - base.expectedRating) / 5;
}

/* ─── Reverse direction (provider→open needs) ──────────────────────────────── */

export interface OpportunityScore {
    passedGate: boolean;
    score: number;
    distanceKm: number;
    /** Provider topic that matched (to label the opportunity). */
    matchedTopicId?: string;
    components: Record<string, number>;
}

const OPP_FAIL: OpportunityScore = { passedGate: false, score: -Infinity, distanceKm: 0, components: {} };

/**
 * Ranks an open need for ONE provider's feed, with the same core primitives:
 * spatial decay, inverted price fit (need's budget vs provider's band), text
 * need↔trade, graded focus, short-half-life recency and urgency boost.
 * Signals without context (no pricing/textDocs from the caller) stay neutral.
 */
export function scoreOpportunity(o: OpenNeed, ctx: ProviderContext): OpportunityScore {
    const now = ctx.nowMs ?? Date.now();

    // ── Text: the need against the provider's trade documents ────────────────
    let f_text = 0;
    let titleHits = 0;
    if (o.text && ctx.textDocs?.length) {
        for (const doc of ctx.textDocs) {
            const t = textScore(o.text, doc);
            if (t.score > f_text) {
                f_text = t.score;
                titleHits = t.titleHits;
            }
        }
    }

    // ── Thematic gate: structured trade or text rescue ───────────────────────
    const topicSet = new Set(ctx.offeredTopicIds);
    const matchedTopic = o.topicIds.find((id) => topicSet.has(id));
    const domainHit = ctx.offeredDomainIds.includes(o.domainId);
    const rescued =
        matchedTopic === undefined && !domainHit &&
        f_text >= TEXT.tau &&
        (!TEXT.gateNeedsTitleHit || titleHits > 0);
    if (matchedTopic === undefined && !domainHit && !rescued) return OPP_FAIL;

    // ── Spatial gate: within the provider's reach ────────────────────────────
    let distanceKm = 0;
    if (ctx.center && (o.cell || (o.lat !== undefined && o.lng !== undefined))) {
        distanceKm = modelDistanceKm(
            ctx.centerCell,
            ctx.center,
            o.cell,
            o.lat ?? ctx.center.lat,
            o.lng ?? ctx.center.lng
        );
    }
    if (distanceKm > ctx.maxDistanceKm) return OPP_FAIL;

    // ── Signals ──────────────────────────────────────────────────────────────
    const f_dist = logLogistic(distanceKm, REVERSE_KERNEL.alphaKm, REVERSE_KERNEL.beta);
    const band = o.unit ? ctx.pricing?.[o.unit] : undefined;
    // Without pricing context the signal is constant (neutral across needs).
    const f_price = ctx.pricing && o.unit ? priceFit(o.budget, band) : 1;
    const urgent = o.urgent === true;
    const halfLife = urgent ? REVERSE_RECENCY_HALFLIFE_H.urgent : REVERSE_RECENCY_HALFLIFE_H.scheduled;
    const ageH = Math.max(0, (now - o.createdMs) / 3.6e6);
    const f_rec = expDecay(ageH, halfLife);
    const f_focus = matchedTopic !== undefined ? 1 : domainHit ? 0.7 : Math.max(0.4, f_text);

    const rw = REVERSE_WEIGHTS;
    const score =
        (rw.distance * f_dist +
            rw.price * f_price +
            rw.text * f_text +
            rw.focus * f_focus +
            rw.recency * f_rec) * (urgent ? rw.urgentBoost : 1);

    return {
        passedGate: true,
        score,
        distanceKm,
        matchedTopicId: matchedTopic,
        components: { f_dist, f_price, f_text, f_focus, f_rec, urgent: urgent ? 1 : 0, rescued: rescued ? 1 : 0 },
    };
}

/* ─── Offer pass (seeker→incoming offers) ──────────────────────────────────── */

/**
 * Ranks a real incoming offer for the seeker's screen: offered amount vs
 * budget + the offering candidate's Dirichlet reputation (derived from the
 * scalar with capped effective N) − variance penalty.
 */
export function scoreOffer(p: OfferFeatures, alpha: Alpha5): number {
    const counts = deriveCountsFromLegacy(p.candidateRating, p.candidateMatchCount);
    const eR = expectedRating(counts, alpha);
    const vR = ratingVariance(counts, alpha);
    const f_price = offerPriceFit(p.budget, p.amount);

    const pw = OFFER_WEIGHTS;
    return pw.price * f_price + pw.expectedRating * (eR / 5) - pw.varPenalty * Math.min(vR / 2, 1);
}
