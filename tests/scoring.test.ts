import { describe, it, expect } from "vitest";
import { scoreCandidate, scoreOpportunity, scoreOffer, explorationScore } from "../src/scoring";
import { explorationRng } from "../src/random";
import { GLOBAL_FALLBACK_ALPHA, WEIGHTS } from "../src/config";
import { buildTextDoc, buildTextQuery, computeLocalIdf } from "../src/text";
import type { SituatedQuery, SituatedCandidate, OpenNeed, ProviderContext } from "../src/contracts";

const ALPHA = GLOBAL_FALLBACK_ALPHA;

/** Base query situated in Cali, focused on one topic. */
function makeQuery(over: Partial<SituatedQuery> = {}): SituatedQuery {
    return {
        focusTopicIds: ["plumbing.repair"],
        focusDomainId: "home",
        center: { lat: 3.4516, lng: -76.532 },
        flow: "browse",
        ...over,
    };
}

/** Base candidate: nearby, on-topic, well reputed, in-budget. */
function makeCandidate(over: Partial<SituatedCandidate> = {}): SituatedCandidate {
    return {
        id: "c1",
        lat: 3.4550, // ≈ 0.4 km away
        lng: -76.5300,
        domainId: "home",
        topicId: "plumbing.repair",
        pricing: { activity: { min: 50, acceptable: 80, desired: 120 } },
        primaryUnit: "activity",
        coverageRadiusKm: 10,
        ratingCounts: [0, 0, 1, 5, 20],
        ...over,
    };
}

describe("feasibility gate G (a non-candidate is never scored)", () => {
    it("expels a candidate whose coverage does not reach the seeker", () => {
        const far = makeCandidate({ lat: 3.60, lng: -76.30, coverageRadiusKm: 2 }); // ≈ 30 km, covers 2
        const r = scoreCandidate(far, makeQuery(), ALPHA);
        expect(r.passedGate).toBe(false);
        expect(r.score).toBe(-Infinity);
    });

    it("expels an off-topic candidate without text rescue", () => {
        const offTopic = makeCandidate({ topicId: "gardening.pruning", domainId: "outdoors" });
        const r = scoreCandidate(offTopic, makeQuery(), ALPHA);
        expect(r.passedGate).toBe(false);
    });

    it("rescues a miscategorized candidate through the text channel", () => {
        const doc = buildTextDoc("Reparación de tuberías y fugas de agua", "plomería general", []);
        const query = buildTextQuery("reparacion tuberias fugas");
        const offTopic = makeCandidate({ topicId: "misc.other", domainId: "misc", textDoc: doc });
        const r = scoreCandidate(offTopic, makeQuery({ text: query }), ALPHA);
        expect(r.passedGate).toBe(true);
        expect(r.components.rescued).toBe(1);
    });

    it("unlimited coverage passes the spatial gate at any distance", () => {
        const remote = makeCandidate({ lat: 4.711, lng: -74.0721, coverageRadiusKm: 1000 }); // Bogotá
        const r = scoreCandidate(remote, makeQuery(), ALPHA);
        expect(r.passedGate).toBe(true);
    });

    it("discovery mode requires only coverage", () => {
        const offTopic = makeCandidate({ topicId: "gardening.pruning", domainId: "outdoors" });
        const r = scoreCandidate(offTopic, makeQuery({ discovery: true, focusTopicIds: [], focusDomainId: "" }), ALPHA);
        expect(r.passedGate).toBe(true);
    });
});

describe("multi-signal ranking correctness (seeded dominant candidate)", () => {
    /** A population where c-dominant is best on every signal. */
    function population(): SituatedCandidate[] {
        return [
            makeCandidate({ id: "dominant" }), // near, on-topic, reputed, in-budget
            makeCandidate({ id: "far", lat: 3.52, lng: -76.48, coverageRadiusKm: 30 }), // ≈ 9 km
            makeCandidate({ id: "new", ratingCounts: [0, 0, 0, 0, 0] }),
            makeCandidate({ id: "pricey", pricing: { activity: { min: 500, acceptable: 800, desired: 1200 } } }),
            makeCandidate({ id: "polarized", ratingCounts: [10, 0, 0, 0, 12] }),
        ];
    }

    it("ranks the dominant candidate first under a budgeted request", () => {
        const q = makeQuery({ flow: "request", budget: 100, unit: "activity" });
        const ranked = population()
            .map((c) => ({ id: c.id, r: scoreCandidate(c, q, ALPHA) }))
            .filter((x) => x.r.passedGate)
            .sort((a, b) => b.r.score - a.r.score);
        expect(ranked[0]!.id).toBe("dominant");
    });

    it("degrading a single signal demotes predictably (price out of band)", () => {
        const q = makeQuery({ flow: "request", budget: 100, unit: "activity" });
        const base = scoreCandidate(makeCandidate(), q, ALPHA);
        const pricey = scoreCandidate(
            makeCandidate({ pricing: { activity: { min: 500, acceptable: 800, desired: 1200 } } }),
            q,
            ALPHA
        );
        expect(pricey.passedGate).toBe(true); // a bad candidate, not a non-candidate
        expect(pricey.score).toBeLessThan(base.score);
    });

    it("urgency raises the relative weight of distance (profile switch, not a term)", () => {
        expect(WEIGHTS.request_urgent.distance).toBeGreaterThan(WEIGHTS.request.distance);
        // Near-but-new vs far-but-reputed: urgency must favor the near one more.
        const near = makeCandidate({ id: "near-new", ratingCounts: [0, 0, 0, 0, 0] });
        const far = makeCandidate({ id: "far-reputed", lat: 3.505, lng: -76.49, coverageRadiusKm: 30 });
        const qNormal = makeQuery({ flow: "request", budget: 100, unit: "activity" });
        const qUrgent = makeQuery({ flow: "request", budget: 100, unit: "activity", urgent: true });
        const gapNormal =
            scoreCandidate(near, qNormal, ALPHA).score - scoreCandidate(far, qNormal, ALPHA).score;
        const gapUrgent =
            scoreCandidate(near, qUrgent, ALPHA).score - scoreCandidate(far, qUrgent, ALPHA).score;
        expect(gapUrgent).toBeGreaterThan(gapNormal);
    });

    it("P2: coverage gates but never scores — ∂S/∂ρ = 0 inside the gate", () => {
        // Same candidate, three declared radii that all contain the seeker
        // (≈0.4 km away): identical score. Over-declaring coverage buys nothing.
        const q = makeQuery({ flow: "request", budget: 100, unit: "activity", nowMs: 1700000000000 });
        const scores = [5, 50, 1000].map((km) =>
            scoreCandidate(makeCandidate({ coverageRadiusKm: km }), q, ALPHA)
        );
        expect(scores[0]!.passedGate).toBe(true);
        expect(scores[1]!.score).toBe(scores[0]!.score);
        expect(scores[2]!.score).toBe(scores[0]!.score);
        // The slack differs only in the LTR feature vector (reserved, weight 0).
        expect(scores[1]!.featureVector[11]).not.toBe(scores[0]!.featureVector[11]);
    });

    it("is fully deterministic under a frozen evaluation clock", () => {
        const q = makeQuery({
            flow: "request", budget: 100, unit: "activity", nowMs: 1700000000000,
        });
        const c = makeCandidate({
            lastActiveMs: 1700000000000 - 24 * 3.6e6,
            createdMs: 1700000000000 - 30 * 24 * 3.6e6,
        });
        const a = scoreCandidate(c, q, ALPHA);
        const b = scoreCandidate(c, q, ALPHA);
        expect(b).toEqual(a);
        expect(a.modelVersion).toBeTruthy();
    });

    it("P4: a candidate with zero evidence is scorable from design priors alone", () => {
        // No ratings, no bands, no activity, no text: the full cold-start
        // rollback. The model must still produce a finite, gate-passing score
        // whose reputation term is exactly the prior mean E[R] = 24/7.
        const bare = makeCandidate({
            ratingCounts: [0, 0, 0, 0, 0],
            pricing: {},
            lastActiveMs: undefined,
            createdMs: undefined,
            engagement: undefined,
            traitCounts: undefined,
            textDoc: undefined,
        });
        const r = scoreCandidate(bare, makeQuery({ nowMs: 1700000000000 }), ALPHA);
        expect(r.passedGate).toBe(true);
        expect(Number.isFinite(r.score)).toBe(true);
        expect(r.expectedRating).toBeCloseTo(24 / 7, 10); // Dir(1,1,1,2,2) prior mean
        for (const x of r.featureVector) expect(Number.isFinite(x)).toBe(true);
    });

    it("exploration is reproducible when the RNG derives from the frozen clock", () => {
        const q = makeQuery({ nowMs: 1700000000000 });
        const c = makeCandidate();
        const base = scoreCandidate(c, q, ALPHA);
        const s1 = explorationScore(base, c, ALPHA, "browse", 0.3, explorationRng(c.id, q.nowMs));
        const s2 = explorationScore(base, c, ALPHA, "browse", 0.3, explorationRng(c.id, q.nowMs));
        expect(s2).toBe(s1);
        expect(Number.isFinite(s1)).toBe(true);
    });

    it("emits the 14-component LTR feature vector for every scored candidate", () => {
        const r = scoreCandidate(makeCandidate(), makeQuery(), ALPHA);
        expect(r.featureVector).toHaveLength(14);
        for (const x of r.featureVector) expect(Number.isFinite(x)).toBe(true);
    });

    it("every position is decomposable into its signal contributions", () => {
        const q = makeQuery({ flow: "request", budget: 100, unit: "activity" });
        const r = scoreCandidate(makeCandidate(), q, ALPHA);
        const w = WEIGHTS.request;
        const cmp = r.components;
        const rebuilt =
            w.distance * cmp.f_dist! +
            w.expectedRating * cmp.f_eR! -
            w.varPenalty * cmp.f_pen! +
            w.text * cmp.f_text! +
            w.topicMatch * cmp.f_topic! +
            w.activity * cmp.f_act! +
            w.recency * cmp.f_rec! +
            w.price * cmp.f_price! +
            w.engagement * cmp.f_eng! * cmp.coldStart! +
            w.traits * cmp.f_trait!;
        expect(rebuilt).toBeCloseTo(r.score, 10);
    });
});

describe("text channel discriminates within the neighborhood", () => {
    it("local IDF favors the discriminant term", () => {
        const docs = [
            buildTextDoc("Plomería general", "reparaciones de todo tipo"),
            buildTextDoc("Plomería y drywall", "instalación de drywall y plomería"),
        ];
        const query = buildTextQuery("plomeria drywall");
        query.idf = computeLocalIdf(query, docs);
        // "plomeria" appears in both docs (low idf); "drywall" only in one.
        const idfDrywall = query.idf.get("drywall") ?? 0;
        const idfPlomeria = query.idf.get("plomeria") ?? 0;
        expect(idfDrywall).toBeGreaterThan(idfPlomeria);
    });
});

describe("reverse direction (provider→open needs)", () => {
    const ctx: ProviderContext = {
        center: { lat: 3.4516, lng: -76.532 },
        offeredDomainIds: ["home"],
        offeredTopicIds: ["plumbing.repair"],
        maxDistanceKm: 15,
    };

    function makeNeed(over: Partial<OpenNeed> = {}): OpenNeed {
        return {
            id: "n1",
            lat: 3.4550,
            lng: -76.5300,
            domainId: "home",
            topicIds: ["plumbing.repair"],
            budget: 100,
            createdMs: Date.now() - 3.6e6, // 1 h old
            ...over,
        };
    }

    it("gates out needs beyond the provider's reach", () => {
        const far = makeNeed({ lat: 4.711, lng: -74.0721 }); // Bogotá ≈ 300 km
        expect(scoreOpportunity(far, ctx).passedGate).toBe(false);
    });

    it("gates out off-trade needs", () => {
        const off = makeNeed({ domainId: "outdoors", topicIds: ["gardening.pruning"] });
        expect(scoreOpportunity(off, ctx).passedGate).toBe(false);
    });

    it("boosts urgent needs and decays stale ones", () => {
        const fresh = scoreOpportunity(makeNeed(), ctx);
        const urgent = scoreOpportunity(makeNeed({ urgent: true }), ctx);
        const stale = scoreOpportunity(makeNeed({ createdMs: Date.now() - 10 * 24 * 3.6e6 }), ctx);
        expect(urgent.score).toBeGreaterThan(fresh.score);
        expect(stale.score).toBeLessThan(fresh.score);
    });
});

describe("offer pass (seeker→incoming offers)", () => {
    it("prefers an in-budget offer from a reputed candidate", () => {
        const good = scoreOffer({ amount: 90, budget: 100, candidateRating: 4.8, candidateMatchCount: 20 }, ALPHA);
        const overpriced = scoreOffer({ amount: 180, budget: 100, candidateRating: 4.8, candidateMatchCount: 20 }, ALPHA);
        const unproven = scoreOffer({ amount: 90, budget: 100 }, ALPHA);
        expect(good).toBeGreaterThan(overpriced);
        expect(good).toBeGreaterThan(unproven);
    });
});
