import { describe, it, expect } from "vitest";
import { fitMobilityKernel, shrinkKernel, DEFAULT_KERNEL, type KernelSample } from "../src/kernel";
import { mulberry32 } from "../src/random";

/** Generates synthetic acceptance data from a true log-logistic kernel. */
function syntheticSamples(alphaKm: number, beta: number, n: number, seed: number): KernelSample[] {
    const rand = mulberry32(seed);
    const out: KernelSample[] = [];
    for (let i = 0; i < n; i++) {
        const d = 0.2 + rand() * 15; // distances 0.2–15.2 km
        const p = 1 / (1 + Math.pow(d / alphaKm, beta));
        out.push({ distanceKm: d, accepted: rand() < p });
    }
    return out;
}

describe("mobility kernel learning (spatial friction is learnable)", () => {
    it("recovers the true (α, β) from synthetic acceptance data within tolerance", () => {
        const TRUE_ALPHA = 3.0;
        const TRUE_BETA = 2.0;
        const fit = fitMobilityKernel(syntheticSamples(TRUE_ALPHA, TRUE_BETA, 5000, 42));
        expect(fit).not.toBeNull();
        expect(fit!.alphaKm).toBeGreaterThan(TRUE_ALPHA * 0.85);
        expect(fit!.alphaKm).toBeLessThan(TRUE_ALPHA * 1.15);
        expect(fit!.beta).toBeGreaterThan(TRUE_BETA * 0.85);
        expect(fit!.beta).toBeLessThan(TRUE_BETA * 1.15);
    });

    it("recovers a different regime (tight urban kernel)", () => {
        const fit = fitMobilityKernel(syntheticSamples(1.5, 3.0, 5000, 7));
        expect(fit).not.toBeNull();
        expect(fit!.alphaKm).toBeGreaterThan(1.5 * 0.8);
        expect(fit!.alphaKm).toBeLessThan(1.5 * 1.2);
    });

    it("returns null on insufficient or degenerate samples", () => {
        expect(fitMobilityKernel(syntheticSamples(3, 2, 10, 1))).toBeNull();
        const allAccepted: KernelSample[] = Array.from({ length: 100 }, (_, i) => ({
            distanceKm: 0.5 + i * 0.1,
            accepted: true,
        }));
        expect(fitMobilityKernel(allAccepted)).toBeNull();
    });

    it("with zero data, shrinkage degrades EXACTLY to the design kernel", () => {
        const k = shrinkKernel(null);
        expect(k).toEqual(DEFAULT_KERNEL);
    });

    it("shrinkage blends monotonically toward the fit as n grows", () => {
        const fitSmall = { alphaKm: 5, beta: 3, n: 10 };
        const fitLarge = { alphaKm: 5, beta: 3, n: 1000 };
        const kSmall = shrinkKernel(fitSmall);
        const kLarge = shrinkKernel(fitLarge);
        // Small sample stays near design (2.5), large sample near the fit (5).
        expect(Math.abs(kSmall.alphaKm - DEFAULT_KERNEL.alphaKm)).toBeLessThan(
            Math.abs(kLarge.alphaKm - DEFAULT_KERNEL.alphaKm)
        );
        expect(kLarge.alphaKm).toBeGreaterThan(4.5);
    });
});
