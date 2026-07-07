# Geography-First Retrieval: A Formal Geo-Contextual Model for Matching Situated Needs to Situated Capabilities under Uncertainty

> **Working draft v0.1 — 2026-07-07.** Target venue: ISPRS International Journal of Geo-Information (first attempt); alternates: Transactions in GIS, GeoInformatica. Status markers: `[TODO]` pending work, `[REF?]` citation to verify, `[E#]` experiment reference (see `notes/03-experiments-plan.md`).

**Authors:** Andrés Burbano¹ `[TODO: confirm legal name, affiliation, ORCID]`; `[TODO: thesis director as co-author — pending decision]`

**Candidate short title:** *HIVE: Geography-First Retrieval on Hexagonal Grids*

---

## Abstract

`[Draft — 190 words; tighten to venue limit]`

Recommender and retrieval systems treat location as one contextual feature among many: a signal that adjusts a ranking computed over the full catalog. In markets where the answer must be physically delivered — presential services, emergency response, field-crew allocation, urban logistics — this hierarchy is wrong: a candidate out of geographic reach is not a worse answer but a non-answer. We propose a formal geo-contextual retrieval model in which location is the primary retrieval constraint rather than a post-hoc ordering criterion. The model composes four stages — discrete-neighborhood retrieval on a hierarchical hexagonal grid (H3), a feasibility gate that separates the infeasible from the inconvenient, a multi-signal affinity function with first-class uncertainty (Dirichlet–multinomial reputation, learnable log-logistic mobility kernel, budget-band compatibility), and a learning-ready ordering stage — and we prove five structural properties: spatial precedence, feasibility/preference separation (with a no-manipulation corollary for self-declared coverage), query cost bounded by local density rather than catalog size, honest degradation under zero evidence, and structural location privacy without loss of search utility. Controlled experiments on synthetic and real-geography populations show the model recovers correct rankings, diverges substantially from distance-only baselines (≈46–52% of first results), and holds sub-millisecond query cost as the catalog grows 100-fold. An open-source TypeScript implementation (hive-core), extracted from a deployed marketplace, accompanies the paper.

**Keywords:** geo-contextual retrieval; spatial matching; discrete global grid systems; H3; location privacy; Bayesian reputation; gig economy; feasibility gating

---

## 1. Introduction

`[Prose draft — needs one more pass for venue tone]`

Information retrieval has a default architecture: gather candidates by topical relevance, then adjust their order with context. Location, when present, enters as one such adjustment — a feature with a learned or hand-tuned weight, a filter radius applied for efficiency, a distance column in the feature vector. This architecture is inherited from settings where every candidate can, in principle, satisfy the need: a movie can be streamed anywhere; a product can be shipped.

There is a class of markets where that premise fails. When the need is *situated* — a burst pipe, a medical emergency, a cadastral survey crew, a last-mile delivery — and the capability is equally situated, geography does not modulate the quality of an answer; it determines whether an answer exists at all. A plumber whose coverage does not reach the seeker is not a poorly ranked candidate. Treating them as one (scoring them, letting distance penalties push them down) produces three well-known pathologies: rankings polluted by infeasible results, query cost proportional to catalog size, and incentives for providers to over-declare their reach.

This paper asks: **how should information retrieval be modeled when geography determines the viability of the answer?**

Our answer is a formal model in which the usual hierarchy is inverted. Location is the *structuring constraint* of the retrieval process — it defines the candidate set, gates feasibility, shapes the dominant affinity signal, and carries the market's state — rather than one contextual variable among many. Concretely, retrieval is a composition

$$
P \xrightarrow{\,F_{geo}\,} C \xrightarrow{\,G\,} C' \xrightarrow{\,S\,} C'' \xrightarrow{\,\mathrm{order}\,} R
$$

where the universe $P$ is never scanned: $F_{geo}$ recovers candidates by set membership on a discrete hexagonal grid; $G$ eliminates non-candidates *before* any scoring, so that infeasibility is never traded against convenience; $S$ evaluates a multi-signal affinity in which every uncertain signal carries its uncertainty; and the ordering stage is interpretable today and learning-ready by construction.

The model's contributions are not its individual ingredients — hexagonal indexes, distance decay, Dirichlet reputation and learning-to-rank all exist — but the formal architecture that composes them and the properties that the composition guarantees:

1. **P1 — Spatial precedence.** No signal of a candidate outside the geographic funnel is ever evaluated.
2. **P2 — Feasibility/preference separation.** Declared coverage gates but never scores: the only free parameter a ranked actor declares has zero gradient on its own rank (a no-manipulation guarantee).
3. **P3 — Cost bounded by local density.** Query cost is $O(k^2\bar\delta)$ in the ring count $k$ and mean cell occupancy $\bar\delta$ — independent of catalog size.
4. **P4 — Honest degradation.** With zero evidence the model runs exactly on its design values and improves monotonically as evidence accrues; new candidates present as new, not as fabricated averages.
5. **P5 — Structural privacy.** The model is a function of grid cells, never raw coordinates; anonymization is not post-hoc noise but the substitution of position by the same discrete unit the model computes with — so search loses nothing the model ever used.

We validate the model with `[six → nine]` controlled experiments — ranking correctness against seeded ground truth, divergence from distance-only ordering, cold-start/density/urgency dynamics, catalog-size invariance, multi-seed robustness, signal ablation `[E7: gate-ablation baseline; E8: real-geography population; E9: weight sensitivity — TODO]` — and release the engine as an open-source, dependency-light TypeScript library (*hive-core*) extracted verbatim from a marketplace deployment that operates it in production.

`[TODO: paragraph mapping paper structure.]`

## 2. Related work

`[Skeleton with positioning claims — each paragraph has its citations identified in notes/02-bibliography.md; verify before submission]`

**Context-aware recommendation and POI recommendation.** Context-aware recommender systems incorporate location as a contextual dimension that conditions preference estimation `[Adomavicius & Tuzhilin 2011]`; POI recommenders exploit geographical influence as a signal in the ranking function `[Sánchez & Bellogín 2022; TKDE 2025 survey REF?]`. In both families, the candidate space is defined thematically and location adjusts scores. Our model inverts this: location defines what is recommendable; theme and preference order what location admits. `[TODO: 2–3 recent POI works using distance decay as a scored feature, to make the contrast concrete.]`

**Spatial crowdsourcing and task assignment.** Spatial crowdsourcing formalizes matching between located tasks and located workers `[Gummidi et al. 2019; Tong et al. 2020]`, typically as an assignment problem optimizing a system objective (total utility, stability, fairness) with recent three-sided and online-stable variants `[Inf. Sci. 2023 REF?]`. Two differences separate our setting: the platform *ranks and exposes* rather than assigns — the decision remains human, which shifts the objective from system efficiency to the quality of delivered information — and negotiation economics (three-level price bands) enter the affinity itself, which assignment literature treats marginally. `[TODO: verify the three-sided stable assignment paper's objective function for a precise contrast.]`

**On-demand transport.** Ride-sourcing research established that matching radii should depend on market state `[Yang et al. 2020]`; we transport that principle to a domain with explicit negotiation and human agency, and make the radius-analogue (the decay scale α) *learnable per topic* with hierarchical shrinkage.

**Discrete global grid systems.** DGGS theory and the H3 system provide hierarchical hexagonal tessellations with well-understood geometric properties `[Sahr et al. 2003; Birch et al. 2007; Uber 2018; Bondaruk et al. 2020]`. Applications typically use one function at a time: indexing, aggregation, or anonymization. Our model documents a *simultaneous quadruple use* of the same hierarchy — search index, decision metric, analytic aggregation unit, and structural anonymization mechanism — and derives properties (P3, P5) precisely from that simultaneity.

**Location privacy.** The dominant approaches perturb (geo-indistinguishability `[arXiv:2206.08396 REF?]`) or cloak `[Gruteser & Grunwald 2003; adaptive cloaking 2025 REF?]` a location that the system otherwise consumes raw. Structural cell substitution differs in kind: the protected representation *is* the computational representation, so the utility/privacy trade-off does not degrade the ranking the system computes (P5). `[TODO: position against the 2025 adaptive-cloaking-for-crowdsourcing paper carefully — closest neighbor.]`

**Constraint-based and feasibility-aware recommendation.** `[TODO: Felfernig/Burke constraint-based recommenders — the closest RecSys relative of gate G; find recent treatment of hard constraints vs soft preferences in ranking.]`

**Positioning table.** `[TODO: table — rows: family (CARS/POI, spatial crowdsourcing, ride-sourcing, constraint-based RecSys, this work); columns: where space enters (score / assignment objective / gate+index+metric), decision-maker (system/human), uncertainty treatment, privacy treatment.]`

## 3. The model

`[The full formalization lives in notes/01-formalization.md and ports to this section nearly 1:1. Summary of subsections:]`

### 3.1 Setting and notation
Situated queries $q=(u_{loc}, \mathcal{F}_q, t_q, B_q, \varepsilon_q)$; situated candidates $p=(p_{loc}, \theta_p, \rho_p, \mathbf{n}_p, \pi_p, \tau_p)$; discretization operator $H_r$; the resolution pyramid $\{7,8,9,12\}$ (calc/profile/search/aggregation) with raw coordinates as transient input only.

### 3.2 Stage 1 — Discrete-neighborhood retrieval ($F_{geo}$)
Direct form $C_k(u)$ by ring-disk membership ($|N_k| = 3k^2+3k+1$); inverse form by coverage containment (each offer precomputes the coarse cells its declared disk spans; heterogeneous radii resolved by a single indexed query; wide coverages bucketed). Grid distance as the native metric, nominal km only where semantics demand.

### 3.3 Stage 2 — Feasibility gate ($G$)
$G(p,q)=1 \iff (\text{topic match} \vee f_{lex} \ge \tau \text{ with title hit}) \wedge (d \le \rho_p \vee \text{unlimited})$. The gate distinguishes the *non-candidate* from the *bad candidate*; text softens the thematic condition because taxonomy assignment is self-reported and a cataloguing error must not equal commercial non-existence; coverage gates and never scores.

### 3.4 Stage 3 — Multi-signal affinity ($S$)
Linear form over signals in $[0,1]$ with context-selected weight profiles (urgency switches profiles, never fabricates signals). Spatial friction: log-logistic heavy-tail decay with $\alpha_{eff}$ modulated by local supply. Reputation: Dirichlet–multinomial posterior with expectation and variance as separate signals (level vs risk), cold-start chain (capped legacy derivation → hierarchical priors → honest "new"). Text: BM25-style with query-local IDF (no global index). Economics: continuous, monotone fit over a three-level negotiation band; explicit uncertainty (not neutrality) when the band is missing.

### 3.5 Dynamics
The acceptance log-logistic is a logistic regression in $\ln d$: the spatial friction is *learnable* from actor behavior by maximum likelihood, with hierarchical shrinkage to the global kernel ($\omega = n/(n+n_0)$) — zero data degrades exactly to the design kernel. Thompson sampling over the reputation posterior spreads exposure proportionally to uncertainty below a protected top; same-cell candidates rotate deterministically (exposure equity instead of pseudo-precision).

### 3.6 Stage 4 — Learning-ready ordering
Every scored pair emits $\Phi(q,p) \in \mathbb{R}^{14}$ (signals + raw support variables); interaction telemetry $e=(u,q,\Phi,r,a,v)$ suffices to reconstruct implicit preference with position-bias correction; the pairwise loss $\mathcal{L}(F)$ defines the learned stage, of which the current linear form is the additive fixed-weight special case — the transition preserves signal semantics. We state the three reasons the learned stage ships *prepared but inactive* (statistical: position bias under cold start; auditability; continuity).

## 4. Properties

`[Each proposition with a short proof or argument; full statements in notes/01-formalization.md §3]`

- **Proposition 1 (Spatial precedence).**
- **Proposition 2 (Feasibility/preference separation; no-manipulation corollary $\partial S/\partial \rho_p = 0$).**
- **Proposition 3 (Cost $O(k^2\bar\delta)$, catalog-size invariance).**
- **Proposition 4 (Honest degradation / monotone improvement — posterior contraction + kernel shrinkage).**
- **Proposition 5 (Structural privacy without search-utility loss; cell-level k-anonymity).**

## 5. Evaluation

`[Design-science framing: the artifact is evaluated analytically (Section 4 + property test suite) and experimentally (controlled populations). Six experiments exist with results and a reproducible Python pipeline; three are planned for this paper.]`

- **E1 Ranking correctness** (seeded dominant candidate): first position in 200/200 queries; single-signal degradation demotes predictably (mean rank ≈1.1); coverage expulsion is total (gate, not penalty).
- **E2 Divergence from distance-only ordering**: first result differs in 52.5% of queries; mean rank correlation ρ=0.76 — sensitive to proximity without reducing to it.
- **E3 Dynamics**: honest cold-start convergence; α_eff expands under scarcity and tightens under density; urgency reorders by profile switch (distance weight 0.28→0.35).
- **E4 Catalog-size invariance**: 200→20,000 candidates at constant local density: ~160 candidates examined, sub-millisecond scoring, versus linear growth of exhaustive evaluation. `[Empirical face of P3]`
- **E5 Multi-seed robustness**: 30 independent populations, 1,200 queries: divergence 46% (95% CI ±3.3 pp), ρ=0.77 (±0.004); seeded dominant first in 97.8%.
- **E6 Signal ablation**: distance dominates (importance 0.31; first result changes in ~86% of queries when removed), one order of magnitude above alphanumeric signals; no signal is dead weight; exact linear reconstruction (zero residual) certifies the ablation ran on the deployed math.
- **E7 `[TODO]` Gate ablation** (same S without G): rate of infeasible first results, NDCG vs gated reference — isolates the value of feasibility separation (P2 empirically).
- **E8 `[TODO]` Real geography**: repeat E2/E4/E6 over supply distributions anchored to OpenStreetMap/official density data for Cali `[option A in notes/03-experiments-plan.md]`.
- **E9 `[TODO]` Weight sensitivity**: ±50% per-weight perturbation; stability of headline metrics.

`[TODO: figures — funnel diagram; decay/posterior/price-fit behavior; E2 case study; E4 cost curves; E5/E6 robustness+ablation panel. The thesis pipeline (python_resultados/) regenerates all of these; re-export in venue style.]`

## 6. Implementation: hive-core

The model ships as *hive-core*, an open-source TypeScript library (MIT) with a single runtime dependency (h3-js). The engine is pure and isomorphic — the same code executes in the browser of a progressive web app and in serverless functions — and exposes the model through domain-agnostic contracts (`SituatedQuery`, `SituatedCandidate`), which is the operational form of the model's domain-agnosticism claim: emergency dispatch, field-crew allocation or logistics instantiate the same mathematics by mapping their data to the contracts and re-estimating priors. A 56-test property suite executes the analytic claims (decay monotonicity and bounds, posterior convergence and level/risk separation, kernel parameter recovery from synthetic behavior, price-fit continuity, gate behavior, score decomposability, retrieval-index containment). `[TODO: repo URL, version, DOI (Zenodo), companion JOSS submission note.]`

The reference deployment (a presential-services marketplace PWA operating in Cali, Colombia) resolves its highest-frequency query on-device at near-zero server cost — an architectural consequence of P3 worth reporting: cost bounded by local density is what makes client-side execution of the full model viable.

## 7. Discussion

- **Generalization.** The model is domain-agnostic by construction (contract argument + E8 evidence). Candidate domains: emergency/rescue designation, home healthcare dispatch, cadastral field-crew coordination, distributed-supplier logistics. `[Keep short here; the case-study paper is A4.]`
- **Limitations.** Isotropic straight-line/grid distance ignores street-network friction; PWA geolocation limits positional precision indoors; no hardware attestation against GPS spoofing (the gate bounds but does not certify); synthetic + real-geography validation is not live-traffic validation — telemetry was deliberately deferred (cost honesty) and constitutes future work; learned stage inactive by design under cold start.
- **Ethics/privacy.** Structural anonymization is default-on; cell-level k-anonymity depends on local density `[quantify in E8 with real densities — or defer the full treatment to A2]`.

## 8. Conclusion

`[TODO — mirror the five properties + evidence + library as the three-legged contribution: formal model, guarantees, artifact.]`

---

## References

`[Verified core — extend from notes/02-bibliography.md as sections firm up]`

- Adomavicius, G., & Tuzhilin, A. (2011). Context-aware recommender systems. In *Recommender Systems Handbook*. Springer.
- Birch, C. P. D., Oom, S. P., & Beecham, J. A. (2007). Rectangular and hexagonal grids used for observation, experiment and simulation in ecology. *Ecological Modelling*, 206(3–4).
- Bondaruk, B., Roberts, S. A., & Robertson, C. (2020). Assessing the state of the art in Discrete Global Grid Systems: OGC criteria and present functionality. *Geomatica*, 74(1).
- Burges, C. J. C. (2010). *From RankNet to LambdaRank to LambdaMART: An overview* (MSR-TR-2010-82).
- Chapelle, O., & Li, L. (2011). An empirical evaluation of Thompson sampling. *NeurIPS 24*.
- Covington, P., Adams, J., & Sargin, E. (2016). Deep neural networks for YouTube recommendations. *RecSys '16*.
- Craswell, N., Zoeter, O., Taylor, M., & Ramsey, B. (2008). An experimental comparison of click position-bias models. *WSDM '08*.
- Gelman, A., Carlin, J. B., Stern, H. S., Dunson, D. B., Vehtari, A., & Rubin, D. B. (2013). *Bayesian Data Analysis* (3rd ed.). CRC Press.
- Geurs, K. T., & van Wee, B. (2004). Accessibility evaluation of land-use and transport strategies: review and research directions. *Journal of Transport Geography*, 12(2).
- Gruteser, M., & Grunwald, D. (2003). Anonymous usage of location-based services through spatial and temporal cloaking. *MobiSys '03*.
- Gummidi, S. R. B., Xie, X., & Pedersen, T. B. (2019). A survey of spatial crowdsourcing. *ACM Transactions on Database Systems*, 44(2).
- Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly*, 28(1).
- Joachims, T. (2002). Optimizing search engines using clickthrough data. *KDD '02*.
- Jøsang, A., & Haller, J. (2007). Dirichlet reputation systems. *ARES '07*.
- Liu, T.-Y. (2009). Learning to rank for information retrieval. *Foundations and Trends in Information Retrieval*, 3(3).
- Malczewski, J., & Rinner, C. (2015). *Multicriteria Decision Analysis in Geographic Information Science*. Springer.
- Marsaglia, G., & Tsang, W. W. (2000). A simple method for generating gamma variables. *ACM Transactions on Mathematical Software*, 26(3).
- Robertson, S., & Zaragoza, H. (2009). The probabilistic relevance framework: BM25 and beyond. *Foundations and Trends in Information Retrieval*, 3(4).
- Sahr, K., White, D., & Kimerling, A. J. (2003). Geodesic discrete global grid systems. *Cartography and Geographic Information Science*, 30(2).
- Sánchez, P., & Bellogín, A. (2022). Point-of-interest recommender systems based on location-based social networks: a survey from an experimental perspective. *ACM Computing Surveys*, 54(11s).
- Thompson, W. R. (1933). On the likelihood that one unknown probability exceeds another in view of the evidence of two samples. *Biometrika*, 25(3–4).
- Tong, Y., Zhou, Z., Zeng, Y., Chen, L., & Shahabi, C. (2020). Spatial crowdsourcing: a survey. *The VLDB Journal*, 29.
- Yang, H., Qin, X., Ke, J., & Ye, J. (2020). Optimizing matching time interval and matching radius in on-demand ride-sourcing markets. *Transportation Research Part B*, 131.
