import { describe, it, expect } from "vitest";
import { logLogistic, alphaEff, expDecay, haversineKm } from "../src/decay";
import { ALPHA_BOUNDS } from "../src/config";

describe("logLogistic spatial decay", () => {
    it("is 1 at the origin and 0.5 at d=α", () => {
        expect(logLogistic(0, 2.5, 2)).toBe(1);
        expect(logLogistic(2.5, 2.5, 2)).toBeCloseTo(0.5, 10);
    });

    it("is strictly decreasing in distance", () => {
        let prev = logLogistic(0.01, 2.5, 2);
        for (let d = 0.5; d <= 30; d += 0.5) {
            const v = logLogistic(d, 2.5, 2);
            expect(v).toBeLessThan(prev);
            prev = v;
        }
    });

    it("keeps a heavy tail: f(4α) ≈ 0.06", () => {
        expect(logLogistic(10, 2.5, 2)).toBeCloseTo(1 / 17, 3);
    });

    it("handles degenerate inputs without NaN", () => {
        expect(logLogistic(NaN, 2.5, 2)).toBe(1);
        expect(logLogistic(5, 0, 2)).toBe(0);
    });
});

describe("alphaEff density modulation", () => {
    it("expands the scale where supply is scarce and tightens where dense", () => {
        const scarce = alphaEff(2.5, 3);   // S < S_ref → looks farther
        const neutral = alphaEff(2.5, 12); // S = S_ref → factor 1
        const dense = alphaEff(2.5, 48);   // S > S_ref → tightens
        expect(scarce).toBeGreaterThan(neutral);
        expect(dense).toBeLessThan(neutral);
        expect(neutral).toBeCloseTo(2.5, 10);
    });

    it("degrades to the pure kernel without a density figure", () => {
        expect(alphaEff(2.5, undefined)).toBeCloseTo(2.5, 10);
    });

    it("stays within design bounds", () => {
        expect(alphaEff(100, undefined)).toBeLessThanOrEqual(ALPHA_BOUNDS.maxKm);
        expect(alphaEff(0.1, undefined)).toBeGreaterThanOrEqual(ALPHA_BOUNDS.minKm);
    });
});

describe("expDecay", () => {
    it("is 1 at age 0 and 0.5 at one half-life", () => {
        expect(expDecay(0, 48)).toBe(1);
        expect(expDecay(48, 48)).toBeCloseTo(0.5, 10);
    });
});

describe("haversineKm", () => {
    it("measures a known distance (Cali → Bogotá ≈ 300 km)", () => {
        const d = haversineKm(3.4516, -76.532, 4.711, -74.0721);
        expect(d).toBeGreaterThan(280);
        expect(d).toBeLessThan(320);
    });
});
