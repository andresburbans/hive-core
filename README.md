# hive-core

**HIVE — Hyper-local Intelligent Vicinity Engine.** A geography-first retrieval and ranking model for matching **situated needs** to **situated capabilities** on discrete hexagonal grids (H3), with first-class uncertainty.

> Location is the **primary retrieval constraint**, not a post-hoc ordering criterion.

```
P ──F_geo──▶ C ──G──▶ C′ ──S──▶ C″ ──order──▶ R
```

- **F_geo** — discrete-neighborhood retrieval: the query's position normalizes to an H3 cell and candidates are recovered by set membership, so query cost depends on *local density*, never on catalog size.
- **G** — feasibility gate: thematic pertinence (structured or rescued through text) **and** coverage containment. A non-candidate is never scored — the gate separates *infeasible* from *inconvenient*.
- **S** — multi-signal affinity: log-logistic spatial friction (learnable from behavior), Dirichlet–multinomial reputation with explicit variance, lexical relevance with query-local IDF, three-level price-band compatibility, activity/recency decay. Context (urgency) switches the weight profile; it never fabricates a signal.
- **order** — interpretable linear form today; learning-ready by construction (every scored candidate emits a 14-component feature vector, and the linear form is the special case of the learned ranker).

## Statement of need

Recommender systems treat location as one contextual feature that *adjusts* a ranking. In markets where the service is physically delivered — home services, emergency dispatch, field-crew allocation, urban logistics — an out-of-reach candidate is not a worse answer; it is **not an answer**. hive-core inverts the usual hierarchy: geography defines *what is recommendable* before any signal scores *how recommendable it is*. The grid resolution simultaneously provides the computational index, structural location privacy (coordinates never persist; cells do), and geodetic interoperability (cell → centroid → reprojection to national frames).

## Install

```bash
npm install hive-core h3-js
```

## Quick start

```ts
import {
  searchCell, neighborhoodCells, ringsForRadius,      // F_geo
  scoreCandidate, GLOBAL_FALLBACK_ALPHA,              // G + S
  buildTextDoc, buildTextQuery, computeLocalIdf,      // text channel
  type SituatedQuery, type SituatedCandidate,
} from "hive-core";

// 1. The situated query (a need at a position).
const query: SituatedQuery = {
  flow: "request",
  focusDomainId: "home",
  focusTopicIds: ["plumbing.repair"],
  center: { lat: 3.4516, lng: -76.532 },
  centerCell: searchCell(3.4516, -76.532),
  budget: 100, unit: "activity", urgent: true,
  text: buildTextQuery("water leak under the sink"),
};

// 2. F_geo: fetch candidates whose cell ∈ N_k(query cell) from YOUR store.
const cells = neighborhoodCells(query.centerCell!, ringsForRadius(6));
const candidates: SituatedCandidate[] = await fetchByCells(cells); // your adapter

// 3. G + S: gate and score. Non-candidates return passedGate=false.
const ranked = candidates
  .map((c) => ({ c, r: scoreCandidate(c, query, GLOBAL_FALLBACK_ALPHA) }))
  .filter((x) => x.r.passedGate)
  .sort((a, b) => b.r.score - a.r.score || a.r.tieBreak - b.r.tieBreak);

// Every position is explainable: x.r.components, and LTR-ready: x.r.featureVector
```

The engine is **pure** (no I/O, no framework): you bring the storage adapter. The reverse coverage index (`computeCoverageIndex`) supports candidates with heterogeneous travel radii through a single indexed containment query.

## Directions

The same mathematics ranks in every direction of a matching market:

| Function | Direction | Use |
|---|---|---|
| `scoreCandidate` | need → capabilities | catalog search, broadcast dispatch |
| `scoreOpportunity` | capability → open needs | provider opportunity feed |
| `scoreOffer` | need → incoming offers | ranking responses to a broadcast |

## Design guarantees

1. **Spatial precedence** — no signal is evaluated for a candidate outside the geographic funnel.
2. **Feasibility/preference separation** — declared coverage gates but never scores (it is a manipulable, self-declared parameter).
3. **Cost bounded by local density** — candidates examined ≤ active offers in `3k²+3k+1` cells, independent of catalog size.
4. **Honest degradation** — with zero evidence the model runs on design values (kernel α=2.5 km, β=2; marketplace J-curve prior) and improves monotonically with data; new candidates present as *new*, never as fake averages.
5. **Structural privacy** — the model never touches raw coordinates: cells in, cells out.

## Origin and evidence

hive-core is the engine formalized in the research *A geography-first retrieval model for presential service markets* (article in preparation) and validated in a deployed marketplace PWA. Validation included formal property tests (this repo's test suite), parameter recovery of the mobility kernel from synthetic acceptance data, and six controlled experiments on a synthetic replica of Cali, Colombia (ranking correctness, divergence from distance-only baselines, cold start, density modulation, catalog-size invariance, multi-seed robustness and signal ablation).

```bash
npm test        # 56 property tests
npm run build   # emit dist/
```

## License

MIT © 2026 Andrés Burbano
