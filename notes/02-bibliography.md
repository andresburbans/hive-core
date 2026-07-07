# Bibliografía de trabajo para A1

Estado: curada de la tesis + hallazgos de búsqueda 2026-07-07. Meta A1: 30–45 referencias. Marcar ✔ cuando se verifique el texto completo y el dato bibliográfico exacto. NO citar nada no verificado.

## Núcleo (heredadas de la tesis — ya leídas y citadas allí)

### Recuperación por etapas / sistemas industriales
- Covington, P., Adams, J., & Sargin, E. (2016). Deep neural networks for YouTube recommendations. RecSys '16. — patrón embudo candidate generation → ranking.
- Robertson, S., & Zaragoza, H. (2009). The probabilistic relevance framework: BM25 and beyond. Foundations and Trends in IR.
- Liu, T.-Y. (2009). Learning to rank for information retrieval. Foundations and Trends in IR.
- Burges, C. (2010). From RankNet to LambdaRank to LambdaMART: An overview. MSR-TR.
- Joachims, T. (2002). Optimizing search engines using clickthrough data. KDD '02.
- Craswell, N., Zoeter, O., Taylor, M., & Ramsey, B. (2008). An experimental comparison of click position-bias models. WSDM '08.

### Geografía / accesibilidad / decisión espacial
- Geurs, K. T., & van Wee, B. (2004). Accessibility evaluation of land-use and transport strategies. Journal of Transport Geography. — fricción de la distancia.
- Malczewski, J., & Rinner, C. (2015). Multicriteria decision analysis in geographic information science. Springer. — combinación lineal ponderada.
- Sahr, K., White, D., & Kimerling, A. J. (2003). Geodesic discrete global grid systems. Cartography and Geographic Information Science.
- Birch, C. P. D., Oom, S. P., & Beecham, J. A. (2007). Rectangular and hexagonal grids used for observation, experiment and simulation in ecology. Ecological Modelling.
- Uber Technologies (2018). H3: A hexagonal hierarchical geospatial indexing system. https://h3geo.org/ (documentación técnica; citar junto a Sahr et al. para el fundamento académico).
- Bondaruk, B., Roberts, S. A., & Robertson, C. (2020). Assessing the state of the art in Discrete Global Grid Systems: OGC criteria and present functionality. Geomatica. https://cdnsciencepub.com/doi/abs/10.1139/geomat-2019-0015

### Crowdsourcing espacial / matching bajo demanda
- Gummidi, S. R. B., Xie, X., & Pedersen, T. B. (2019). A survey of spatial crowdsourcing. ACM TODS.
- Tong, Y., Zhou, Z., Zeng, Y., Chen, L., & Shahabi, C. (2020). Spatial crowdsourcing: a survey. The VLDB Journal.
- Yang, H., et al. (2020). Optimizing matching time interval and matching radius in on-demand ride-sourcing markets. Transportation Research Part B.

### Reputación bayesiana / inferencia
- Jøsang, A., & Haller, J. (2007). Dirichlet reputation systems. ARES '07.
- Gelman, A., et al. (2013). Bayesian Data Analysis (3.ª ed.). CRC Press.
- Thompson, W. R. (1933). On the likelihood that one unknown probability exceeds another... Biometrika.
- Chapelle, O., & Li, L. (2011). An empirical evaluation of Thompson sampling. NeurIPS.

### Recomendación sensible al contexto
- Adomavicius, G., & Tuzhilin, A. (2011). Context-aware recommender systems. Recommender Systems Handbook.
- Sánchez, P., & Bellogín, A. (2022). Point-of-interest recommender systems based on location-based social networks: a survey from an experimental perspective. ACM Computing Surveys (ver también arXiv:2106.10069). https://arxiv.org/abs/2106.10069

### Privacidad locacional
- Gruteser, M., & Grunwald, D. (2003). Anonymous usage of location-based services through spatial and temporal cloaking. MobiSys '03.
- Cavoukian, A. (2011). Privacy by design: The 7 foundational principles.
- Congreso de la República de Colombia (2012). Ley 1581 (régimen de protección de datos) — solo si A1 conserva la discusión regulatoria; probablemente va en A2.

### Metodología
- Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. MIS Quarterly.
- Marsaglia, G., & Tsang, W. W. (2000). A simple method for generating gamma variables. ACM TOMS. — (nueva: respalda el muestreo de la librería)
- Koren, Y., Bell, R., & Volinsky, C. (2009). Matrix factorization techniques for recommender systems. Computer. — solo para la extensión f_aff.
- Ying, R., et al. (2018). Graph convolutional neural networks for web-scale recommender systems. KDD '18. — ídem.

## Nuevas candidatas (búsqueda 2026-07-07 — VERIFICAR texto completo antes de citar)

### POI / recomendación geográfica reciente
- Survey on Point-of-Interest Recommendation: Models, Architectures, and Security. IEEE TKDE (2025). https://dl.acm.org/doi/10.1109/TKDE.2025.3551292 y arXiv:2410.02191 — encuesta reciente; útil para afirmar que la localización se trata como característica contextual y no como restricción primaria (nuestro contraste central).
- A Survey on Point-of-Interest Recommendations Leveraging Heterogeneous Data (2023). arXiv:2308.07426 — cobertura 2021–2023.
- CAPRI: Context-Aware Interpretable Point-of-Interest Recommendation Framework (2023). arXiv:2306.11395 — interpretabilidad en recomendación geográfica; conecta con nuestro argumento de auditabilidad.

### Crowdsourcing espacial reciente (asignación)
- Three-sided online stable task assignment in spatial crowdsourcing. Information Sciences (2023). https://www.sciencedirect.com/science/article/abs/pii/S0020025523014639 — estado del arte de ASIGNACIÓN; nuestro contraste: ordenar para decisión humana, no asignar.
- Multi-stage complex task assignment in spatial crowdsourcing. Information Sciences (2021). https://www.sciencedirect.com/science/article/abs/pii/S0020025521012068
- Fair task assignment in spatial crowdsourcing. PVLDB (2020). https://dl.acm.org/doi/10.14778/3407790.3407839 — equidad de exposición; conecta con nuestro desempate rotativo y Thompson.

### Privacidad locacional reciente
- User Customizable and Robust Geo-Indistinguishability for Location Privacy (2022). arXiv:2206.08396 — línea de ruido calibrado; nuestro contraste: anonimización ESTRUCTURAL por celda vs ruido a posteriori.
- Adaptive cloaking for contextual privacy in spatial crowdsourcing applications. Social Network Analysis and Mining (2025). https://link.springer.com/article/10.1007/s13278-025-01573-1 — cloaking adaptativo por rejilla; el más cercano a nuestro enfoque, contrastar con cuidado.
- Spatial K-anonymity: A Privacy-preserving Method for COVID-19 Related Geospatial Technologies (2021). arXiv:2101.02556

### DGGS
- Discrete Global Grid Systems as scalable geospatial frameworks... PMC8958999 (2022) — DGGS como marco escalable; respaldo del uso analítico.

## Huecos por cubrir (buscar en fase de redacción §2)

- [ ] Un trabajo 2023+ que use H3 específicamente en matching/recomendación (para mostrar que existe uso pero no la cuádruple función).
- [ ] Literatura de "feasibility filtering" o "hard constraints in recommender systems" (constraint-based recommenders, Felfernig & Burke) — el pariente conceptual de G en RecSys clásico.
- [ ] Un survey de gig economy / on-demand service platforms (matching, no asignación) 2023+.
- [ ] Learned distance decay / mobility kernel estimation empírica (transporte, movilidad urbana) 2022+.
- [ ] Verificar si existe algo publicado EXACTAMENTE como "geography-first retrieval" (defensa del claim de novedad).
