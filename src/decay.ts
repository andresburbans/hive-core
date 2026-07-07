/**
 * @file decay.ts — spatial and temporal decay functions (pure).
 *
 * The decay scale α does NOT adapt to the candidate's self-declared coverage
 * (a manipulable incentive): it comes from the mobility kernel (learned per
 * topic, see `kernel.ts`) and is modulated by local supply density (`alphaEff`).
 */

import { ALPHA_BOUNDS, DENSITY } from "./config";
import { DEFAULT_KERNEL } from "./kernel";

/**
 * Log-logistic decay (heavy tail): f(d) = 1 / (1 + (d/α)^β).
 * f(0)=1, f(α)=0.5, f(4α)≈0.06. Models urban friction better than a Gaussian.
 */
export function logLogistic(d: number, alpha: number = DEFAULT_KERNEL.alphaKm, beta: number = DEFAULT_KERNEL.beta): number {
    if (!Number.isFinite(d) || d <= 0) return 1;
    if (!Number.isFinite(alpha) || alpha <= 0) return 0;
    if (beta === 2) {
        const r = d / alpha;
        return 1 / (1 + r * r);
    }
    return 1 / (1 + Math.pow(d / alpha, beta));
}

/**
 * Effective α: kernel scale (learned or by design) modulated by local market
 * density — α_eff = α_kernel · clamp((S_ref/S)^γ) — and bounded. In a scarce
 * market the model "looks farther"; in a dense one it tightens. Without a
 * density figure the factor is 1: degrades to the pure kernel.
 */
export function alphaEff(kernelAlphaKm: number, localSupply?: number): number {
    let factor = 1;
    if (localSupply !== undefined && Number.isFinite(localSupply) && localSupply > 0) {
        factor = Math.pow(DENSITY.refSupply / localSupply, DENSITY.gamma);
        factor = Math.min(DENSITY.factorMax, Math.max(DENSITY.factorMin, factor));
    }
    const a = kernelAlphaKm * factor;
    return Math.min(ALPHA_BOUNDS.maxKm, Math.max(ALPHA_BOUNDS.minKm, a));
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle (Haversine) distance in km. Fallback of the hexagonal metric. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Exponential decay by age (activity/recency). f(0)=1. */
export function expDecay(ageHours: number, halfLifeHours: number): number {
    if (!Number.isFinite(ageHours) || ageHours < 0) return 1;
    if (!Number.isFinite(halfLifeHours) || halfLifeHours <= 0) return 0;
    return Math.exp(-(Math.LN2 / halfLifeHours) * ageHours);
}
