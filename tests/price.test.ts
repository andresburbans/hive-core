import { describe, it, expect } from "vitest";
import { priceFit, offerPriceFit, type PriceBand } from "../src/price";
import { UNIT_MISMATCH_FIT } from "../src/config";

const BAND: PriceBand = { min: 50, acceptable: 100, desired: 150 };

describe("priceFit (three-level negotiation band)", () => {
    it("is neutral without a budget (browse)", () => {
        expect(priceFit(undefined, BAND)).toBe(1);
        expect(priceFit(0, BAND)).toBe(1);
    });

    it("expresses explicit uncertainty when the unit has no band", () => {
        expect(priceFit(100, undefined)).toBe(UNIT_MISMATCH_FIT);
    });

    it("saturates at 1 from the desired value upward", () => {
        expect(priceFit(150, BAND)).toBe(1);
        expect(priceFit(1000, BAND)).toBe(1);
    });

    it("is 0 below the floor", () => {
        expect(priceFit(49, BAND)).toBe(0);
    });

    it("is continuous at the zone boundaries", () => {
        // At min: 0.85·0 = 0; just above min it grows from 0.
        expect(priceFit(50, BAND)).toBeCloseTo(0, 10);
        // At acceptable: negotiation zone tops at 0.85, satisfaction starts at 0.85.
        expect(priceFit(99.999, BAND)).toBeCloseTo(0.85, 2);
        expect(priceFit(100, BAND)).toBeCloseTo(0.85, 10);
        // At desired: satisfaction tops at 1.
        expect(priceFit(149.999, BAND)).toBeCloseTo(1, 2);
    });

    it("is monotone non-decreasing in the budget", () => {
        let prev = -1;
        for (let b = 10; b <= 200; b += 5) {
            const v = priceFit(b, BAND);
            expect(v).toBeGreaterThanOrEqual(prev);
            prev = v;
        }
    });
});

describe("offerPriceFit (actual offered amount)", () => {
    it("is 1 within budget, decays linearly, and reaches 0 at double", () => {
        expect(offerPriceFit(100, 80)).toBe(1);
        expect(offerPriceFit(100, 150)).toBeCloseTo(0.5, 10);
        expect(offerPriceFit(100, 200)).toBe(0);
    });

    it("is neutral without a budget", () => {
        expect(offerPriceFit(undefined, 100)).toBe(0.5);
    });
});
