/**
 * @file engagement.ts — early behavioral quality signal. Pure.
 *
 * Before ordinal evidence accumulates, aggregate behavior (conversion + CTR)
 * is a quality prior. Strong smoothing (a=b → baseline 0.5). Its weight fades
 * as reviews grow (see `coldStart` in scoring) and is 0 by default (honesty
 * rule: counters must be instrumented before the signal earns weight).
 *
 * Funnel-coherence fix: ratios are only proportions if the numerator counts a
 * subset of the denominator. Until `quoteStarts`/`impressions` are tracked,
 * coherence is forced with max() and the result clamped to [0,1] — without
 * this, the day `orders`/`views` grow the signal explodes (>1) and dominates
 * the score with the LEAST reliable evidence.
 */

export interface EngagementCounters {
    impressions?: number;
    views?: number;
    quoteStarts?: number;
    orders?: number;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** f_eng ∈ [0,1] = ½·smoothed conversion + ½·smoothed CTR. */
export function engagementScore(
    e: EngagementCounters | undefined,
    smoothing: { a: number; b: number }
): number {
    const { a, b } = smoothing;
    const orders = Math.max(0, e?.orders ?? 0);
    const views = Math.max(0, e?.views ?? 0);
    // Funnel coherence: a denominator is never smaller than its numerator.
    const quotes = Math.max(e?.quoteStarts ?? 0, orders);
    const impressions = Math.max(e?.impressions ?? 0, views);

    const conv = (orders + a) / (quotes + a + b);
    const ctr = (views + a) / (impressions + a + b);
    return clamp01(0.5 * conv + 0.5 * ctr);
}
