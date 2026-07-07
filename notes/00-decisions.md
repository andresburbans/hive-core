# Registro de decisiones (bitácora de coinvestigación)

Ruta elegida: **A** (A1 modelo formal → A3 JOSS → A2 pirámide H3 → A4 generalización). Ver `D:\Dev\chambit-app-v2\articulo\propuestas.md`.

## 2026-07-07 — Arranque

1. **Orden de trabajo**: librería primero, redacción en paralelo. Razón: el artículo afirma propiedades (P1–P5) que la librería demuestra con pruebas; extraer el código real de producción garantiza que lo publicado es lo que corre desplegado (argumento anti-crítica "toy model").
2. **Nombre**: `hive-core` (repositorio y paquete npm). HIVE = Hyper-local Intelligent Vicinity Engine, como en la tesis (§6.4.7). PENDIENTE verificar disponibilidad del nombre en npm antes de publicar; alternativas: `@hive-engine/core`, `hive1-core`.
3. **Lenguaje**: TypeScript puro (es el código que corre en producción; argumento de implementabilidad). El espejo Python de validación ya existe en `chambit-app-v2/python_resultados/` y se referenciará como pipeline de reproducción de figuras.
4. **Licencia**: MIT. PENDIENTE (usuario): confirmar nombre legal completo para LICENSE/paper y política de propiedad intelectual de la universidad sobre resultados de tesis.
5. **Vocabulario dominio-agnóstico**: cero menciones a Chambit/expertos/servicios en la API. Glosario en `01-formalization.md` §5. La app Chambit pasa a ser "reference deployment" en el artículo.
6. **Semánticas alteradas conscientemente al generalizar** (documentar en A3 si aplica):
   - `paymentTypeId (1|2|3)` → `unit: string` genérica (el adaptador del despliegue mapea).
   - `urgencyTypeId (1|2)` → `urgent: boolean`.
   - En `scoreOpportunity`, si la necesidad no trae `unit`, la señal de precio queda neutra (antes caía a "activity", que era semántica Chambit).
   - `chips` → `traits`; `scoreProposal` → `scoreOffer`; `RADAR_WEIGHTS` → `REVERSE_WEIGHTS`.
   - `isNationalCoverage` → `isUnlimitedCoverage` (umbral 1000 km en config).
   - `hexMetric` parametriza la resolución de búsqueda (default 8) con `kmPerCell(res)` dinámico vía h3-js.
7. **Todo lo demás portado 1:1** (pesos, umbrales, formas funcionales, fixes de auditoría H1–H10). La matemática NO se tocó.
8. **Pruebas**: 58 pruebas de propiedad pasando (decay, dirichlet, kernel-recovery, price, gate/scoring/ablación de score reconstruible, retrieval, P2 no-manipulabilidad, determinismo con reloj congelado). La prueba de recuperación del kernel replica el experimento de la Figura 15 de la tesis. La librería son 14 módulos funcionales + barril (`index.ts`).

## 2026-07-07 — Revisión externa (GLM-5.2) aplicada

Los 10 hallazgos, resueltos:
1. **Pureza**: `SituatedQuery.nowMs` añadido; `scoreCandidate` ya no llama `Date.now()` cuando el llamador congela el reloj (f_act, f_rec y tieBreak usan el mismo `now`). Prueba de determinismo añadida.
2. **P2 con prueba**: test "coverage gates but never scores" — radios 5/50/1000 km (todos dentro del gate) → score idéntico; solo difiere el slack en el vector LTR (peso 0).
3. **MODEL_VERSION** alineado a `0.1.0` (lockstep con package.json), documentado como el campo `v` de la telemetría y estampado en cada `ScoreResult.modelVersion`.
4. **Conteos corregidos**: 14 módulos + barril; 58 pruebas (README y esta bitácora).
5. **REVERSE_KERNEL** extraído a config con justificación (el actor ordenado es quien viaja; el gate `maxDistanceKm` acota, no el decaimiento).
6. **Precondición de la métrica hexagonal** documentada (celdas a res de búsqueda o más finas; más gruesas → fallback Haversine) en `hexMetric.ts`, `contracts.ts` y README.
7. **LICENSE/package.json** en ASCII ("Andres Burbano") — evita mojibake en lectores no-UTF8; nombre legal sigue pendiente.
8. **Colisión de barril** eliminada: `contracts.ts` ya no reexporta `PriceBand`/`PricingByUnit` (única fuente: `price.ts`).
9. **noUncheckedIndexedAccess: true** activado; accesos de bucle sobre tuplas de longitud fija con aserción explícita.
10. **README Install** marcado pre-release (clone + test + build); `npm install` queda para cuando se publique.

Añadidos en la misma pasada: `.github/workflows/ci.yml` (Node 20/22: typecheck+test+build), `CITATION.cff` (TODO nombre/ORCID), `examples/quickstart.ts` ejecutable con `npx tsx` (verificado: el más cercano fuera de presupuesto cede el 1.er lugar — el caso de la Fig 20 de la tesis en miniatura).

## Plan de publicación (GitHub + "servir como API")

**GitHub** (cuando el usuario apruebe): crear repo público `andresburbans/hive-core` → `git remote add origin ... && git push -u origin main` → Actions corre CI → tag `v0.1.0` → conectar Zenodo (webhook de releases) → DOI en README/CITATION → `npm publish` (verificar nombre libre; si está tomado: `@andresburbans/hive-core`).

**"API" para revisores**: lo que exigen JOSS/revistas es la **API programática documentada** (no un servicio web): referencia generada con TypeDoc → GitHub Pages, ejemplos ejecutables, pruebas en CI y statement of need. Un endpoint REST de demostración es OPCIONAL (nice-to-have para el artículo): envoltorio mínimo (`examples/server.ts` con Hono/Express o una Cloud Function) que exponga `POST /rank` recibiendo `{query, candidates}` y devolviendo el orden — la librería es pura, así que el wrapper son ~40 líneas. Decidir si se incluye en v0.2.

## Pendientes que decide el usuario

- [ ] Nombre legal para LICENSE y autoría del artículo.
- [ ] Coautoría de la directora de tesis (recomendado sí).
- [ ] Revista objetivo primer intento (recomendado: ISPRS IJGI).
- [ ] Crear repo GitHub público `andresburbans/hive-core` y publicar (cuando el usuario lo apruebe).
- [ ] Presupuesto APC / preferencia por revista sin costo.
- [ ] Fuente de datos reales para el experimento adicional (opciones en `03-experiments-plan.md`).

## Pendientes técnicos (míos)

- [ ] CI (GitHub Actions: typecheck + test) al crear el repo.
- [ ] Ejemplo ejecutable `examples/` que reproduzca el pipeline sintético.
- [ ] Versión etiquetada v0.1.0 + DOI Zenodo al publicar el repo.
- [ ] Puerto/verificación de paridad numérica con `python_resultados/` (mismo escenario, mismos números).
