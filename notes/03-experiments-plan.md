# Plan experimental de A1

## Principio

La sección de evaluación de A1 reutiliza los seis experimentos de la tesis (§7.1.3, pipeline en `chambit-app-v2/python_resultados/`) y añade lo necesario para blindar el artículo ante revisores de revista.

## E1–E6: existentes (tesis)

| # | Experimento | Resultado clave (tesis) | Figura tesis |
|---|---|---|---|
| E1 | Corrección con candidato dominante sembrado | 1.º en 200/200 consultas; degradación trazable por señal (rango medio ~1.1) | — |
| E2 | Contraste vs distancia pura | 1.º difiere 52.5 %; ρ de rangos 0.76 | Fig 20 |
| E3 | Dinámicas (arranque frío, densidad, urgencia) | convergencia honesta; α_eff se expande/contrae; urgencia reordena (0.28→0.35) | Fig 21 |
| E4 | Costo vs tamaño de catálogo | 200→20 000 candidatos: ~160 evaluados, <1 ms (vs lineal exhaustivo) | Fig 22 |
| E5 | Robustez multi-semilla | 30 poblaciones, 1200 consultas: divergencia 46 % ± 3.3; ρ 0.77 ± 0.004; dominante 97.8 % | Fig 23a,b |
| E6 | Ablación de señales | distancia domina (importancia 0.31, ~86 % cambio de 1.º); ninguna señal prescindible; reconstrucción lineal residuo 0 | Fig 23c |

## E7–E9: nuevos para A1 (por orden de prioridad)

### E7. Línea base adicional: puntuación sin compuerta (aísla el valor de G) — PRIORITARIO
Comparar tres sistemas sobre el mismo escenario: (a) HIVE completo; (b) misma S lineal SIN compuerta (todo candidato del disco se puntúa; la infactibilidad solo penaliza vía señales); (c) distancia pura. Métricas: tasa de primeros resultados infactibles (fuera de cobertura o fuera de foco) de (b), NDCG contra el orden de (a) tomado como referencia con candidato dominante sembrado. Demuestra que la separación factibilidad/conveniencia no es cosmética: sin G, candidatos inviables ocupan posiciones.
**Costo**: bajo (variación del pipeline existente).

### E8. Geografía y densidades reales — PRIORITARIO
Repetir E2, E4 y E6 sobre una distribución de oferta anclada a datos públicos reales, no uniforme al azar:
- Opción A (recomendada): OpenStreetMap para Cali/Colombia — POIs de comercios/servicios como proxy de distribución espacial de oferta real (descarga Overpass, reproducible).
- Opción B: densidades de población por celda desde datos abiertos (IDESC/DANE) para muestrear posiciones de oferta y demanda.
- Opción C: conjunto abierto de Yelp (categorías + coordenadas + reseñas reales) — más lejos del dominio pero con evidencia ordinal REAL para los priors.
La afirmación deja de ser "sobre población sintética uniforme" y pasa a "sobre la geografía real de una ciudad".
**Costo**: medio (adaptador de datos + re-ejecución).

### E9. Sensibilidad de pesos — DESEABLE
Perturbar cada w_i ±50 % y medir estabilidad del primer resultado y ρ de rangos. Responde a "¿los pesos son arbitrarios?": muestra qué conclusiones dependen de la magnitud exacta y cuáles solo del signo/orden.
**Costo**: bajo.

## Paridad librería ↔ pipeline

Antes de correr E7–E9: verificar que `hive-core` (TS) y `python_resultados/` (Py) producen los mismos números sobre un caso de contraste fijo (misma semilla, mismos candidatos → mismo orden y mismos scores a tolerancia 1e-9). Si el pipeline Python reimplementa, la paridad es el argumento de que "lo medido es el modelo real".
