/**
 * @file random.ts — deterministic RNG + Gamma sampling (pure).
 *
 * Supports Thompson-sampling exploration: sampling from a Dirichlet posterior
 * requires Gamma draws. The RNG is seedable so a re-rendered ranking does not
 * "dance" (seed = hash(day + candidate)).
 */

/** 32-bit FNV-1a hash of a string → numeric seed. */
export function hashSeed(s: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

/** mulberry32 PRNG: fast, deterministic, sufficient for exploration. */
export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Canonical RNG for Thompson exploration: seeded by (candidate, UTC day).
 * Derive the day from the SAME frozen clock used for scoring
 * (`SituatedQuery.nowMs`) and exploratory rankings become reproducible;
 * with the wall clock the ranking rotates daily but never within a day.
 */
export function explorationRng(candidateId: string, nowMs: number = Date.now()): () => number {
    const day = Math.floor(nowMs / 86_400_000);
    return mulberry32(hashSeed(`${candidateId}:${day}`));
}

/** Standard normal via Box-Muller (consumes 2 uniforms). */
function sampleNormal(rand: () => number): number {
    let u = 0;
    let v = 0;
    while (u <= 1e-12) u = rand();
    while (v <= 1e-12) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Gamma(shape, 1) draw by Marsaglia–Tsang (2000). For shape < 1 uses the
 * standard boost: Gamma(a) = Gamma(a+1) · U^(1/a).
 */
export function sampleGamma(shape: number, rand: () => number): number {
    if (!Number.isFinite(shape) || shape <= 0) return 0;
    if (shape < 1) {
        const u = Math.max(1e-12, rand());
        return sampleGamma(shape + 1, rand) * Math.pow(u, 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (let i = 0; i < 100; i++) {
        const x = sampleNormal(rand);
        const v = Math.pow(1 + c * x, 3);
        if (v <= 0) continue;
        const u = rand();
        if (u < 1 - 0.0331 * x * x * x * x) return d * v;
        if (Math.log(Math.max(1e-12, u)) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
    return d; // degenerate fallback (vanishingly unlikely)
}
