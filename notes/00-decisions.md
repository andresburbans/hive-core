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
8. **Pruebas**: 56 pruebas de propiedad pasando (decay, dirichlet, kernel-recovery, price, gate/scoring/ablación de score reconstruible, retrieval). La prueba de recuperación del kernel replica el experimento de la Figura 15 de la tesis.

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
