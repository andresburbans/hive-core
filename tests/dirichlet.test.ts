import { describe, it, expect } from "vitest";
import {
    expectedRating,
    ratingVariance,
    consistency,
    deriveCountsFromLegacy,
    sampleExpectedRating,
    estimatePriorMoM,
    type Counts5,
} from "../src/dirichlet";
import { GLOBAL_FALLBACK_ALPHA, LEGACY_NEFF_CAP } from "../src/config";
import { mulberry32 } from "../src/random";

const ALPHA = GLOBAL_FALLBACK_ALPHA;

describe("Dirichlet–Multinomial reputation", () => {
    it("with zero evidence returns the prior mean (honest cold start)", () => {
        const e = expectedRating([0, 0, 0, 0, 0], ALPHA);
        // prior [1,1,1,2,2] → E = (1+2+3+8+10)/7
        expect(e).toBeCloseTo(24 / 7, 10);
    });

    it("converges monotonically toward the empirical mean as evidence grows", () => {
        // A true 5-star candidate: E[R] must rise toward 5 without overshooting.
        let prev = expectedRating([0, 0, 0, 0, 0], ALPHA);
        for (const n of [1, 3, 10, 30, 100, 1000]) {
            const e = expectedRating([0, 0, 0, 0, n], ALPHA);
            expect(e).toBeGreaterThan(prev);
            expect(e).toBeLessThan(5);
            prev = e;
        }
        expect(prev).toBeGreaterThan(4.9);
    });

    it("separates level from risk: same mean, different variance", () => {
        const consistent: Counts5 = [0, 0, 0, 20, 0];   // all 4s
        const polarized: Counts5 = [10, 0, 0, 0, 10];   // 1s and 5s
        const vC = ratingVariance(consistent, ALPHA);
        const vP = ratingVariance(polarized, ALPHA);
        expect(vP).toBeGreaterThan(vC);
        expect(consistency(vP)).toBeLessThan(consistency(vC));
    });

    it("caps the effective N of legacy scalars (no fake confidence)", () => {
        const counts = deriveCountsFromLegacy(4.8, 500);
        const total = counts.reduce((a, b) => a + b, 0);
        expect(total).toBe(LEGACY_NEFF_CAP);
    });

    it("legacy derivation preserves the implied mean", () => {
        const counts = deriveCountsFromLegacy(4.5, 8);
        const implied = counts.reduce((s, n, i) => s + n * (i + 1), 0) / 8;
        expect(implied).toBeCloseTo(4.5, 1);
    });

    it("Thompson samples are reproducible and centered near the posterior mean", () => {
        const n: Counts5 = [0, 1, 2, 10, 20];
        const e = expectedRating(n, ALPHA);
        const rand = mulberry32(42);
        const draws = Array.from({ length: 2000 }, () => sampleExpectedRating(n, ALPHA, rand));
        const mean = draws.reduce((a, b) => a + b, 0) / draws.length;
        expect(mean).toBeCloseTo(e, 1);
        // Determinism: same seed → same first draw.
        expect(sampleExpectedRating(n, ALPHA, mulberry32(7))).toBe(
            sampleExpectedRating(n, ALPHA, mulberry32(7))
        );
    });

    it("wider posteriors produce wider Thompson samples (exploration ∝ uncertainty)", () => {
        const sd = (n: Counts5, seed: number) => {
            const rand = mulberry32(seed);
            const draws = Array.from({ length: 2000 }, () => sampleExpectedRating(n, ALPHA, rand));
            const m = draws.reduce((a, b) => a + b, 0) / draws.length;
            return Math.sqrt(draws.reduce((a, b) => a + (b - m) ** 2, 0) / draws.length);
        };
        expect(sd([0, 0, 0, 1, 1], 1)).toBeGreaterThan(sd([0, 0, 0, 50, 50], 1));
    });

    it("MoM prior estimation returns null for insufficient samples", () => {
        expect(estimatePriorMoM([[0, 0, 0, 5, 5]], 30)).toBeNull();
    });

    it("MoM prior estimation recovers a plausible alpha from many samples", () => {
        // Population concentrated on 4–5 stars with some dispersion.
        const rand = mulberry32(123);
        const samples: Counts5[] = Array.from({ length: 100 }, () => {
            const n4 = Math.floor(rand() * 20) + 1;
            const n5 = Math.floor(rand() * 20) + 1;
            const n3 = Math.floor(rand() * 5);
            return [0, 0, n3, n4, n5] as Counts5;
        });
        const est = estimatePriorMoM(samples, 30);
        expect(est).not.toBeNull();
        const a = est!.alpha;
        // Mass concentrated on the upper levels.
        expect(a[3] + a[4]).toBeGreaterThan(a[0] + a[1] + a[2]);
    });
});
