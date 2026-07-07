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
- [x] Crear repo GitHub público `andresburbans/hive-core` y publicar. (hecho 2026-07-07; npm publish pendiente de login)
- [ ] Presupuesto APC / preferencia por revista sin costo.
- [ ] Fuente de datos reales para el experimento adicional (opciones en `03-experiments-plan.md`).

## Pendientes técnicos (míos)

- [x] CI (GitHub Actions: typecheck + test) al crear el repo. (verde en Actions, 2026-07-07)
- [x] Ejemplo ejecutable `examples/` que reproduzca el pipeline sintético. (quickstart.ts)
- [~] Versión etiquetada v0.1.0 subida; DOI Zenodo pendiente (conectar Zenodo → crear Release).
- [ ] Puerto/verificación de paridad numérica con `python_resultados/` (mismo escenario, mismos números).

## 2026-07-07 (noche) — Publicación + re-revisión GLM-5.2

**Publicado**: repo público `github.com/andresburbans/hive-core` (main + tag v0.1.0, CI verde en Actions). `hive-core` estaba OCUPADO en npm (hive.js) → el paquete es **`@andresburbans/hive-core`** (`publishConfig.access: public`; README e imports actualizados). El repo de GitHub conserva el nombre corto. `npm publish` pendiente solo de `npm login` del usuario. Zenodo: conectar ANTES de crear el GitHub Release de v0.1.0 (archiva al publicar release, no al pushear tag). El usuario retiró `article/` del repo público antes del sometimiento (commit db4d568) — los borradores viven solo en local.

**Re-revisión GLM-5.2**: 10/10 propuestas confirmadas. De las 5 observaciones residuales:
1. ~~`ScoreResult.modelVersion` no declarado~~ — **falso positivo**: la interfaz lo declara (scoring.ts:74-75) desde la pasada anterior.
2. **Test P4 añadido** (cold-start full rollback): candidato sin evidencia alguna (conteos cero, sin bandas, sin actividad, sin texto) → pasa gate, score finito, E[R] = 24/7 exacto (prior Dir(1,1,1,2,2)).
3. **`explorationRng(candidateId, nowMs)`** exportado desde `random.ts`: RNG canónico (día UTC derivado del reloj congelado, no de Date.now()) — cierra el determinismo de la fase exploratoria; test de reproducibilidad añadido; JSDoc de `explorationScore` documenta la convención.
4. **REVERSE_KERNEL** anotado en `01-formalization.md` §2.3: citar en A1 como parámetro propio de la dirección reversa, no como «2× del forward».
5. tsconfig incluye `examples/` en el typecheck — correcto hoy; **backlog**: tsconfig separado si examples/ crece con material experimental pesado.

**Empaquetado/uso**: `sideEffects: false` (tree-shaking), `engines.node >= 20` (coherente con la matriz CI), `homepage`/`bugs` en package.json.

**Crédito de IA**: sección "AI-assisted development disclosure" en README — Claude (Fable 5, Anthropic) como asistente de código bajo dirección/revisión del autor humano; trailers `Co-Authored-By` en commits; la IA no figura como autor (COPE/políticas editoriales); replicar la declaración en A1 al someter.

**Backlog no crítico** (de la re-revisión): E0 paridad numérica hive-core ↔ `python_resultados/` con fixture compartido; TypeDoc → GitHub Pages; tsconfig de examples; REST demo opcional v0.2.
