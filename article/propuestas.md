# Propuestas de artículo científico derivadas de la tesis (HIVE 1)

Fecha: 2026-07-07
Fuente: `tesis/redaccion-tesis/redaccion_tesis_v4.md` (versión vigente) y validación experimental de `python_resultados/`.
Estado: documento de decisión. Aquí se razona qué artículos son posibles, con qué enfoque, contra qué crítica de revisores, y qué se necesita para cada ruta. La ruta se elige después de leer esto.

---

## 1. Diagnóstico: qué tenemos y qué es publicable

### 1.1. La contribución real (aislada con precisión)

La tesis no aporta "una búsqueda geocontextual" (ese término, aislado, ya existe bajo los nombres de recuperación sensible al contexto, recomendación de puntos de interés, crowdsourcing espacial y GeoAI). Lo que sí aporta, y que ningún trabajo de la literatura revisada reúne, son cuatro cosas concretas:

1. **Un modelo formal de recuperación por etapas donde la geografía antecede toda decisión** (ecuación 13 de la tesis): P →F_geo→ C →G→ C′ →S→ C″ →orden→ R. La posición no es una señal más que ajusta un ordenamiento; es la restricción que define el conjunto sobre el que se decide. La compuerta de factibilidad G materializa la distinción entre un mal candidato y un no candidato, distinción que los sistemas de recomendación sensibles al contexto no hacen (allí la localización pondera, no veta).

2. **Una propiedad de costo demostrada empíricamente**: la complejidad de la consulta depende de la densidad local y no del tamaño del universo (experimento 4: de 200 a 20 000 candidatos, ~160 evaluados, tiempo submilisegundo). Esto es una propiedad estructural del embudo hexagonal, no una optimización.

3. **La pirámide H3 como triple mecanismo simultáneo**: computacional (vecindad discreta en lugar de cálculo masivo de distancias), de privacidad (anonimización estructural por celda, análoga a k-anonimidad locacional, la coordenada cruda nunca persiste) e interoperabilidad (reversibilidad celda→centroide que habilita reproyección a marcos institucionales como MAGNA-SIRGAS). La literatura de rejillas discretas usa estas funciones por separado; aquí la resolución es a la vez índice de búsqueda, métrica de decisión, unidad de agregación y mecanismo de anonimización (§7.2.2 de la tesis lo llama cuádruple función).

4. **Tratamiento explícito de la incertidumbre en el ordenamiento**: reputación como posterior Dirichlet (nivel y riesgo separados: E[R] y Var[R]), cadena de arranque en frío con retroceso jerárquico, kernel de fricción espacial aprendible (log-logístico estimable por regresión logística, verificado con recuperación de parámetros), exploración por muestreo de Thompson, y una cuarta etapa de aprendizaje de ordenamiento estructuralmente preparada (vector Φ ∈ R¹⁴, ecuaciones 19-21).

### 1.2. La pregunta científica que el artículo debe responder

> **¿Cómo debe modelarse la recuperación de información cuando la geografía determina la viabilidad de la respuesta (y no solo su orden)?**

Formulación de la tesis central del artículo:

> Se propone un modelo formal de recuperación geocontextual para mercados de correspondencia presencial (necesidad situada ↔ capacidad situada) donde la localización constituye la restricción primaria de recuperación y no un criterio posterior de ordenamiento; el modelo separa explícitamente factibilidad (compuerta) de conveniencia (puntuación), acota el costo por densidad local mediante vecindad hexagonal discreta, y trata la incertidumbre de cada señal como objeto de primera clase.

### 1.3. El activo que falta y que decide la publicabilidad: la librería

El código del modelo ya vive como módulo puro compartido entre cliente PWA y funciones en la nube (§6.4.6 de la tesis lo declara como evolución prevista). Convertirlo en librería pública en GitHub cumple tres funciones para el artículo:

- **Reproducibilidad**: los revisores de revistas GIScience valoran (y crecientemente exigen) artefacto ejecutable con datos y semillas. Ya existe `python_resultados/` (pipeline geo-core → JSON → figuras) y el repositorio demo público (chambit-pmv-demo); la librería es la consolidación natural.
- **Demostración de agnosticismo de dominio**: la afirmación de generalización (§7.2.4: rescate, logística, cuadrillas catastrales, salud domiciliaria) solo es creíble si la API de la librería no menciona "expertos" ni "servicios", sino consultas situadas y candidatos situados. La librería ES la prueba de que el modelo es un motor de emparejamiento necesidad-solución y no una función de la aplicación Chambit.
- **Un artículo adicional casi gratuito**: las revistas de software (JOSS, SoftwareX) publican artículos cortos revisados por pares sobre la librería misma (ver propuesta A3).

### 1.4. Las críticas que recibiremos (y cómo el diseño del artículo las neutraliza)

| Crítica probable del revisor | Neutralización |
|---|---|
| "Es una integración de técnicas existentes (H3, Huff, Dirichlet, LTR); ¿qué inventó el autor?" | No vender la integración: vender el **modelo formal con propiedades definidas y demostradas** (precedencia espacial, separación factibilidad/conveniencia, costo acotado por densidad, anonimización estructural sin pérdida de utilidad). Enunciarlas como proposiciones, probarlas analítica y experimentalmente. |
| "La validación es solo sintética" | (a) Presentarlo honestamente como ciencia del diseño (Hevner) con evaluación analítica + experimental controlada; (b) el despliegue real chambit.co es evidencia de implementabilidad; (c) **añadir al menos un experimento sobre datos públicos reales** (ver §4.2) para la versión de revista. Es la inversión con mejor relación costo/beneficio. |
| "La búsqueda geocontextual ya existe" | No reclamar el término. Reclamar la inversión de jerarquía: en la literatura la localización ajusta la recomendación; aquí define qué es recomendable. Contrastar explícitamente con recomendación sensible al contexto, crowdsourcing espacial (que asigna, no ordena para decisión humana) y transporte bajo demanda. |
| "El componente de aprendizaje no está activado" | Presentarlo como diseño preparado para el aprendizaje (learning-ready), con el vector de características y la telemetría especificados y el caso lineal como caso particular demostrado de F. Es defendible si no se sobrevende. |
| "El decaimiento log-logístico y los pesos son arbitrarios" | Mostrar la recuperación de parámetros del kernel (experimento de la Figura 15), la ablación de señales (experimento 6) y la robustez multi-semilla (experimento 5). Ya existen. |

---

## 2. Propuestas de artículo

### A1 (principal). El modelo formal de recuperación geocontextual

**Título de trabajo**: *Geography-First Retrieval: A Formal Geo-Contextual Model for Matching Situated Needs to Situated Capabilities under Uncertainty*
(alternativa: *HIVE: A Hyper-local Intelligent Vicinity Engine for Geo-Contextual Retrieval where Location Determines Feasibility*)

**Idea única del artículo**: cuando la geografía determina la viabilidad de la respuesta, la recuperación debe modelarse como un embudo donde el espacio filtra antes de que cualquier señal puntúe, la factibilidad se separa de la conveniencia, y toda señal incierta porta su incertidumbre. Se formaliza el modelo, se enuncian sus propiedades, se demuestra su costo y se valida experimentalmente.

**Estructura tentativa** (10-14 páginas):
1. Introducción: la inversión de jerarquía (localización como restricción primaria, no como contexto).
2. Trabajo relacionado: recomendación sensible al contexto, crowdsourcing espacial, LBS, transporte bajo demanda, rejillas discretas. Tabla comparativa de en qué etapa entra el espacio en cada familia.
3. El modelo: embudo formal (ec. 13), filtro por vecindad discreta y filtro inverso de cobertura (ec. 14), compuerta de factibilidad (ec. 15), puntuación multiseñal con incertidumbre (ecs. 16-17), capa dinámica (kernel aprendible, modulación por densidad, Thompson) y ordenamiento preparado para el aprendizaje (ecs. 19-21, como extensión, no como resultado).
4. Propiedades: (P1) precedencia espacial; (P2) separación factibilidad/conveniencia y su consecuencia anti-manipulación (la cobertura declarada nunca premia); (P3) costo O(densidad local), no O(|P|); (P4) degradación honesta con evidencia nula (priors jerárquicos); (P5) privacidad estructural sin pérdida de utilidad de búsqueda.
5. Evaluación: los seis experimentos existentes (corrección con candidato sembrado, contraste con distancia pura, dinámicas, escalabilidad, robustez multi-semilla, ablación) + el experimento sobre datos reales que se añada.
6. La librería como artefacto (referencia al repositorio, no protagonista).
7. Discusión: generalización (rescate, logística, despacho), limitaciones (distancia isótropa, posición PWA, sintético).

**Qué queda FUERA deliberadamente**: Firebase, Next.js, la PWA, Cali como producto, la negociación, la verificación de identidad. Todo eso es implementación; el artículo es el modelo.

**Revistas candidatas** (en orden de recomendación):
| Revista | Cuartil aprox. | Por qué encaja | Riesgo |
|---|---|---|---|
| *ISPRS International Journal of Geo-Information* (MDPI) | Q2 | Acceso abierto, recibe modelos GIScience aplicados, revisión rápida (4-8 semanas), muy citada en H3/DGGS | APC (~1 900 CHF; existen exenciones parciales) |
| *Transactions in GIS* (Wiley) | Q2-Q1 | Tradición en modelos formales de análisis espacial y accesibilidad | Revisión más lenta |
| *GeoInformatica* (Springer) | Q2 | Perfil computacional (índices espaciales, consultas), audiencia exacta para el embudo y el costo | Exige rigor algorítmico alto |
| *International Journal of Geographical Information Science* (IJGIS, Q1) | Q1 | El objetivo aspiracional; la inversión de jerarquía es tesis de su gusto | Tasa de aceptación baja; conviene tras fortalecer con datos reales |
| *ACM SIGSPATIAL* (conferencia) | núcleo A | Ruta conferencia→revista: publicar versión corta y luego extender | Ciclo anual de fechas límite |

### A2. La pirámide H3 como triple mecanismo (computación, privacidad, interoperabilidad)

**Título de trabajo**: *One Grid, Three Guarantees: Hierarchical Hexagonal Resolution as a Simultaneous Mechanism for Computation, Location Privacy, and Geodetic Interoperability*

**Idea única**: la resolución de una rejilla jerárquica discreta puede formalizarse como un único instrumento que resuelve a la vez (a) la eficiencia de la consulta de proximidad (pertenencia a conjuntos en lugar de distancias), (b) la privacidad posicional por diseño (la celda gruesa es una k-anonimidad estructural, no un ruido añadido a posteriori) y (c) la interoperabilidad institucional (reversibilidad celda→centroide→reproyección a marcos nacionales, caso MAGNA-SIRGAS). Se formaliza la pirámide res 12/9/8/7 con la escala territorial de cada nivel, se cuantifica la degradación deliberada de precisión frente a la utilidad de búsqueda conservada, y se contrasta con las técnicas de ofuscación clásicas (geo-indistinguibilidad, ruido laplaciano) que degradan la utilidad sin dar garantías estructurales.

- **Fortaleza**: es el aporte más autocontenido y el que un revisor externo señaló como publicable por sí mismo. Requiere pocos experimentos nuevos (análisis de anonimato por celda con densidades reales de población, error de distancia inducido por centroides, presupuesto de reidentificación).
- **Revistas candidatas**: *ISPRS IJGI*, *Journal of Location Based Services* (Taylor & Francis), *Computers, Environment and Urban Systems* (si se enfatiza la lectura urbana agregada), o el congreso *ACM SIGSPATIAL* (taller de privacidad locacional).
- **Relación con A1**: A1 la usa y la cita; A2 la profundiza. No hay autoplagio si A1 la trata en dos párrafos y A2 en profundidad, pero conviene escribir A1 primero y acotar allí el tratamiento.

### A3. Artículo de software: la librería

**Título de trabajo**: *hive-core: An Open-Source Library for Geography-First Retrieval on Discrete Hexagonal Grids*

**Idea**: cuando la librería exista (véase §4.1), someterla a *JOSS* (Journal of Open Source Software: gratuito, revisión pública en GitHub, artículo corto de 1-2 páginas + revisión del repositorio) o a *SoftwareX* (Elsevier). Da una publicación revisada por pares adicional, un DOI citable para que A1 y A2 citen la librería, y evidencia de adopción para un expediente (EB-2 NIW incluido).

- **Requisitos JOSS**: licencia OSI, documentación de instalación y uso, pruebas automatizadas, declaración de necesidad (statement of need), ejemplos. Esfuerzo incremental bajo si la librería se hace bien desde el inicio.
- **Orden**: se somete después de que la librería tenga API estable, idealmente en paralelo con la revisión de A1.

### A4 (reserva, para después). Generalización como motor de emparejamiento necesidad-solución

**Título de trabajo**: *From Service Marketplaces to Emergency Dispatch: A Domain-Agnostic Geo-Contextual Matching Engine*

**Idea**: demostrar la transferibilidad con dos o tres estudios de caso instanciados sobre la librería (despacho de socorristas con datos abiertos de emergencias, asignación de cuadrillas de campo, logística de proveedores). Cada dominio cambia solo fuentes de datos y distribuciones a priori; la matemática no se toca.

- **Por qué no primero**: sin A1 publicado no hay modelo que citar, y los estudios de caso exigen conseguir y limpiar datos de dominios ajenos (el mayor costo). Es el artículo natural número 3 o 4, y el que más fortalece la narrativa de impacto amplio.
- **Revistas candidatas**: *Computers, Environment and Urban Systems*, *International Journal of Disaster Risk Reduction* (si el caso fuerte es emergencias), *Applied Geography*.

### Descartado como artículo independiente (por ahora)

- **La reputación bayesiana con cadena de arranque en frío**: es sólida pero incremental frente a Jøsang & Haller; funciona mejor como sección de A1 que como artículo propio ante revisores de sistemas de reputación.
- **La arquitectura serverless PWA-SIG**: es ingeniería de implementación; serviría para una revista de ingeniería de software aplicada, pero diluye el perfil de investigación (IA aplicada a sistemas geoespaciales) que conviene construir coherente.

---

## 3. Rutas posibles (elegir una)

**Ruta A (recomendada): A1 → A3 → A2 → A4.**
El artículo insignia primero, con la librería desarrollándose en paralelo como su artefacto de reproducibilidad. Al someter A1, la librería ya existe y se cita; mientras A1 está en revisión se somete A3 (JOSS) y se escribe A2. Maximiza coherencia del perfil y cada pieza apalanca la anterior.

**Ruta B (rápida): versión corta de A1 en conferencia (SIGSPATIAL o AGILE) → extensión a revista.**
Publica antes (los congresos aceptan más y dan retroalimentación de revisores reales), pero el ciclo depende de fechas límite anuales y la versión de revista exige 30-40 % de material nuevo.

**Ruta C (mínimo esfuerzo primero): A2 solo.**
La pirámide H3 es lo más autocontenido y lo más rápido de escribir. Pero deja el aporte mayor (el modelo) sin reclamar, y otro grupo podría publicar algo cercano mientras tanto.

**Ruta D (software primero): librería + A3, luego A1.**
Asegura el artefacto y una publicación temprana de bajo riesgo, pero JOSS pesa menos que una revista GIScience y retrasa el reclamo conceptual.

---

## 4. Qué se necesita (plan de trabajo para la ruta A)

### 4.1. La librería (condición habilitante, 3-5 semanas de trabajo efectivo)

1. **Extraer el módulo puro** de `src/lib/services/matching.service.ts` y el geo-core a un repositorio nuevo (nombre tentativo: `hive-core`), sin ninguna referencia a Chambit, expertos ni servicios. API en términos de `SituatedQuery` (posición, foco, restricciones opcionales) y `SituatedCandidate` (celda, atributos temáticos, cobertura, evidencia ordinal, marcas de actividad).
2. **Decidir lenguaje**: TypeScript (es el código real que corre en producción, argumento de implementabilidad) + espejo Python del pipeline de validación (ya existe en `python_resultados/`). Publicar en npm y PyPI si el espejo se consolida; con npm basta para A1/A3.
3. **Calidad publicable**: licencia (MIT o Apache-2.0), README con statement of need, documentación de API, pruebas (portar las unitarias existentes: monotonicidad del decaimiento, convergencia Dirichlet, recuperación del kernel), integración continua, ejemplos ejecutables que reproduzcan las figuras de la tesis, versión etiquetada y DOI vía Zenodo.
4. **Cuidado con la propiedad intelectual**: verificar el reglamento de la universidad sobre resultados de tesis antes de liberar (normalmente el autor conserva derechos, pero conviene confirmarlo por escrito).

### 4.2. Fortalecimiento experimental (2-3 semanas)

- **Un experimento sobre datos públicos reales** para blindar A1 contra la crítica de validación solo sintética. Candidatos: registros abiertos de puntos de interés y reseñas (conjunto abierto de Yelp, OpenStreetMap + reseñas sintéticas ancladas a densidades reales, o datos abiertos de Cali del portal IDESC para densidades de población por celda). El objetivo no es medir satisfacción de usuarios sino repetir los experimentos 2, 4 y 6 sobre una geografía y una distribución de oferta reales.
- **Una línea base adicional**: además de distancia pura, comparar contra una puntuación lineal SIN compuerta de factibilidad (para aislar el valor de G) y contra un ordenamiento tipo puntuación ponderada estándar de recomendación geográfica. Esto convierte "el embudo importa" de afirmación en resultado.
- Los seis experimentos existentes se conservan; ya cubren corrección, contraste, dinámica, costo, robustez y ablación.

### 4.3. Redacción de A1 (4-6 semanas)

- **Idioma**: inglés (obligatorio para las revistas listadas). Escribir directamente en inglés, no traducir la tesis.
- **Formalización adicional**: convertir las propiedades P1-P5 en proposiciones enunciadas formalmente, con demostración corta o argumento de complejidad donde aplique (P3 es demostrable: el costo es O(k² · densidad) con k anillos).
- **Revisión de literatura dirigida**: 30-45 referencias; profundizar en spatial matching / task assignment reciente (2022-2026) que la tesis no necesitaba cubrir con esa densidad.
- **Coautoría**: decidir si invitar a la directora de tesis como coautora (recomendable: facilita metodología, respuesta a revisores y elección de revista; el autor principal y de correspondencia eres tú). Definir afiliación (universidad, o independiente + universidad).
- **Preprint**: subir a arXiv (cs.IR + cs.DB o físico-espacial) o EarthArXiv al someter, para fecha cierta de prioridad.

### 4.4. Sometimiento y ciclo de revisión

- Elegir revista objetivo (propuesta: ISPRS IJGI como primer intento por velocidad y encaje; IJGIS si tras el experimento real el paquete queda muy fuerte).
- Preparar carta de presentación (cover letter) centrada en la inversión de jerarquía y la reproducibilidad total.
- Presupuestar la revisión: 1-2 rondas de cambios mayores es lo normal; responder punto por punto.
- Costo: APC de MDPI (~1 900 CHF, con descuentos posibles); Transactions in GIS y GeoInformatica tienen vía por suscripción sin costo para el autor.

### 4.5. Calendario realista (ruta A)

| Mes | Hito |
|---|---|
| 1 | Librería `hive-core` extraída, con pruebas y ejemplos; decisión de coautoría y revista |
| 2 | Experimento con datos reales + líneas base adicionales; esqueleto de A1 en inglés |
| 3 | Borrador completo de A1; librería v1.0 con DOI; preprint en arXiv; sometimiento de A1 |
| 4 | Sometimiento de A3 a JOSS; inicio de A2 |
| 5-8 | Ciclo de revisión de A1 (cambios mayores probables); sometimiento de A2 |

---

## 5. Decisiones pendientes (las que hay que tomar para arrancar)

1. **Ruta** (A, B, C o D). Recomendación: A.
2. **Revista objetivo del primer intento de A1** (ISPRS IJGI vs. apuntar directo a IJGIS). Recomendación: ISPRS IJGI, y reservar IJGIS para A4 o una extensión.
3. **Coautoría** con la directora de tesis: sí o no.
4. **Nombre y licencia de la librería** (`hive-core`, MIT) y verificación de la política de propiedad intelectual de la universidad.
5. **Presupuesto de APC** (si ISPRS IJGI) o preferencia por revista sin costo.
6. **Alcance del experimento con datos reales** (qué fuente de datos, cuánto invertir).
