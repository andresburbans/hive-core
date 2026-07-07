/**
 * quickstart.ts — end-to-end use of hive-core without any backend.
 *
 * Run from the repo root:  npx tsx examples/quickstart.ts
 *
 * A deployment would replace the in-memory array with its own store, using
 * `neighborhoodCells` (forward) or `computeCoverageIndex` (reverse) as the
 * index keys. The engine itself never performs I/O.
 */

import {
    searchCell,
    neighborhoodCells,
    ringsForRadius,
    scoreCandidate,
    GLOBAL_FALLBACK_ALPHA,
    buildTextDoc,
    buildTextQuery,
    computeLocalIdf,
    type SituatedQuery,
    type SituatedCandidate,
} from "../src/index";

// ── A tiny situated catalog (three capabilities around Cali) ────────────────
const NOW = Date.parse("2026-07-07T12:00:00Z");

const mk = (
    id: string,
    lat: number,
    lng: number,
    topicId: string,
    title: string,
    acceptable: number,
    ratingCounts: SituatedCandidate["ratingCounts"]
): SituatedCandidate => ({
    id,
    lat,
    lng,
    cell: searchCell(lat, lng),
    domainId: "home",
    topicId,
    pricing: { activity: { min: acceptable * 0.6, acceptable, desired: acceptable * 1.5 } },
    primaryUnit: "activity",
    coverageRadiusKm: 10,
    ratingCounts,
    textDoc: buildTextDoc(title, "", []),
    createdMs: NOW - 20 * 24 * 3.6e6,
    lastActiveMs: NOW - 6 * 3.6e6,
});

const catalog: SituatedCandidate[] = [
    mk("near-reputed", 3.4550, -76.5300, "plumbing.repair", "Reparación de tuberías y fugas", 80, [0, 0, 1, 5, 20]),
    mk("nearest-pricey", 3.4530, -76.5310, "plumbing.repair", "Plomería general", 400, [0, 0, 0, 3, 4]),
    mk("far-new", 3.4900, -76.5100, "plumbing.repair", "Destapes y fugas de agua", 70, [0, 0, 0, 0, 0]),
];

// ── The situated need ───────────────────────────────────────────────────────
const query: SituatedQuery = {
    flow: "request",
    focusDomainId: "home",
    focusTopicIds: ["plumbing.repair"],
    center: { lat: 3.4516, lng: -76.532 },
    centerCell: searchCell(3.4516, -76.532),
    budget: 100,
    unit: "activity",
    urgent: false,
    text: buildTextQuery("fuga de agua en la cocina"),
    nowMs: NOW, // frozen clock → fully deterministic output
};

// ── F_geo: which cells would we fetch from a store? ────────────────────────
const cells = neighborhoodCells(query.centerCell!, ringsForRadius(6));
console.log(`F_geo: ${cells.length} cells cover a 6 km neighborhood\n`);

// Local IDF over THIS candidate set (no global index).
query.text!.idf = computeLocalIdf(query.text!, catalog.map((c) => c.textDoc!));

// ── G + S + order ───────────────────────────────────────────────────────────
const ranked = catalog
    .map((c) => ({ c, r: scoreCandidate(c, query, GLOBAL_FALLBACK_ALPHA) }))
    .filter((x) => x.r.passedGate)
    .sort((a, b) => b.r.score - a.r.score || a.r.tieBreak - b.r.tieBreak);

for (const { c, r } of ranked) {
    console.log(
        `${c.id.padEnd(16)} score=${r.score.toFixed(4)}  d=${r.distanceKm.toFixed(2)}km  ` +
        `E[R]=${r.expectedRating.toFixed(2)}±${Math.sqrt(r.variance).toFixed(2)}  ` +
        `price=${r.components.f_price?.toFixed(2)}  (model ${r.modelVersion})`
    );
}
