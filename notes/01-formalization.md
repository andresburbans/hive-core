# Formalización del modelo (memoria de cálculo para A1)

Fuente de verdad matemática: `src/` de este repo (portado 1:1 del motor en producción). Este documento enuncia el modelo en notación de artículo y formula las proposiciones P1–P5 con sus argumentos. Todo LaTeX aquí es reutilizable en el manuscrito.

## 1. Objetos

- $U$: espacio de consultas situadas. Una consulta $q = (u_{loc}, \mathcal{F}_q, t_q, B_q, \varepsilon_q)$ con posición $u_{loc}$, foco temático $\mathcal{F}_q$ (posiblemente vacío), texto libre $t_q$, presupuesto opcional $B_q$ y contexto de urgencia $\varepsilon_q$.
- $P$: universo de candidatos situados. Un candidato $p = (p_{loc}, \theta_p, \rho_p, \mathbf{n}_p, \pi_p, \tau_p)$ con posición $p_{loc}$, tema $\theta_p$, radio de cobertura declarado $\rho_p$, evidencia ordinal $\mathbf{n}_p \in \mathbb{N}^5$, banda de precios $\pi_p$ y marcas temporales $\tau_p$.
- $H_r(\cdot)$: operador de discretización a la celda H3 de resolución $r$. El modelo **nunca** ve $u_{loc}$ ni $p_{loc}$ crudas: opera sobre $H_8$ (búsqueda) y las persiste en la pirámide $\{7, 8, 9, 12\}$.

## 2. El embudo (ecuación central)

$$
P \xrightarrow{\;F_{geo}\;} C \xrightarrow{\;G\;} C' \xrightarrow{\;S\;} C'' \xrightarrow{\;\mathrm{order}\;} R
$$

### 2.1 $F_{geo}$: recuperación por vecindad discreta

Forma directa (disco de anillos):
$$
C_k(u) = \{\, p \in P \mid H_8(p_{loc}) \in N_k(H_8(u_{loc})) \,\wedge\, \mathrm{active}(p) \,\}
$$
donde $N_k(h)$ es el disco de $k$ anillos alrededor de $h$, con $|N_k(h)| = 3k^2 + 3k + 1$.

Forma inversa (contención de cobertura, radios heterogéneos): cada oferta precalcula al publicarse $\mathrm{cov}(p) = \{ h \in \mathcal{H}_6 : d(h, H_6(p_{loc})) \le \rho_p + \epsilon \}$ y la consulta recupera $\{ p : H_6(u_{loc}) \in \mathrm{cov}(p) \}$ con una sola consulta indexada. Coberturas $\ge$ 60 km van por cubeta aparte (`wideCoverage`). Implementación: `src/retrieval.ts`.

La distancia interna es la distancia de rejilla $d_{hex}(h_1, h_2)$ (entera, exacta) convertida a km nominales ($\times 0.798$ en res 8) solo donde la semántica lo exige. Implementación: `src/hexMetric.ts`.

### 2.2 $G$: compuerta de factibilidad

$$
G(p, q) = 1 \iff \big(\mathcal{F}_q \cap \mathrm{tema}(p) \neq \emptyset \;\vee\; f_{lex}(q,p) \ge \tau \big) \;\wedge\; \big(d(u,p) \le \rho_p \;\vee\; \mathrm{ilimitada}(p)\big)
$$

- Pertinencia temática **ablandada por texto** (rescate): la clasificación la hace el propio candidato y un error de catalogación no equivale a inexistencia. Rescate exige $f_{lex} \ge \tau = 0.55$ **y** al menos un acierto de título (conservador).
- La cobertura opera **únicamente** como compuerta, nunca como premio (ver P2).
- Un $p$ con $G=0$ recibe $-\infty$: es un *no candidato*, distinto de un mal candidato.

### 2.3 $S$: puntuación multiseñal con incertidumbre

$$
S(p \mid q) = w_1 f_{esp} + w_2 f_{rep} - w_3 f_{disp} + w_4 f_{lex} + w_5 f_{tem} + w_6 f_{act} + w_7 f_{fre} + w_8 f_{eco} + w_9 f_{cal}
$$

con $f_i \in [0,1]$, $w_i \ge 0$ y el perfil $\mathbf{w}$ seleccionado por el contexto (urgencia cambia pesos, no hechos).

Señales:
- **Fricción espacial** (log-logística, cola pesada): $f_{esp}(d) = \dfrac{1}{1 + (d/\alpha_{eff})^\beta}$, con $\alpha_{eff} = \alpha_{kernel} \cdot \mathrm{clamp}\big((S_{ref}/S_{local})^\gamma\big)$ acotado. El $\alpha$ jamás depende de $\rho_p$ (autodeclarado).
- **Reputación** (Dirichlet–multinomial): posterior $\theta \sim \mathrm{Dir}(\boldsymbol\alpha + \mathbf{n}_p)$,
$$
E[R_p] = \sum_k k \cdot \frac{n_k + \alpha_k}{N + \alpha_0}, \qquad
\mathrm{Var}[R_p] = \sum_k k^2 \cdot \frac{n_k + \alpha_k}{N + \alpha_0} - E[R_p]^2
$$
$f_{rep} = E[R_p]/5$ y $f_{disp} = \min(\mathrm{Var}[R_p]/2, 1)$: nivel y riesgo separados. Cadena de arranque en frío: conteos derivados del escalar con $N_{eff}$ acotado → prior jerárquico (tema → celda → dominio → ciudad → global) → presentación honesta como «nuevo».
- **Texto**: BM25-lite con IDF local al conjunto de candidatos de la consulta (sin índice global): los términos que todos comparten se auto-anulan.
- **Economía**: banda de tres niveles $\{m, a, s\}$ (mínimo, aceptable, deseado); $f_{eco}(B)$ continua, monótona, con zona de negociación lineal $[m, a)$, zona de satisfacción $[a, s)$ y saturación en $s$. Sin banda en la unidad pedida: incertidumbre explícita (0.65), no neutralidad perfecta.
- **Actividad/frescura**: decaimiento exponencial con semividas de diseño.

### 2.4 Capa dinámica

- **Kernel aprendible**: $\log \frac{P(y=1|d)}{1-P(y=1|d)} = \beta\ln\alpha - \beta\ln d$ — la log-logística de aceptación es una regresión logística en $\ln d$; se estima por máxima verosimilitud (Newton–Raphson 2×2) con contracción jerárquica $\omega = n/(n+n_0)$ hacia el kernel global. Con $n=0$ degrada exactamente al diseño. Implementación y verificación de recuperación de parámetros: `src/kernel.ts`, `tests/kernel.test.ts`.
- **Exploración** (Thompson): en posiciones no protegidas, $\tilde S = S + w_2\lambda\,(\tilde R - E[R])/5$ con $\tilde R$ muestreado del posterior vía draws Gamma (Marsaglia–Tsang), RNG sembrado por (día, candidato).
- **Desempate rotativo**: candidatos en la misma celda son indistinguibles por diseño; se desempatan con hash determinista (id, día) — equidad de exposición, no pseudo-precisión.

### 2.5 Ordenamiento preparado para el aprendizaje

Vector por par (consulta, candidato):
$$
\Phi(q,p) = \big(f_{esp}, d, f_{rep}, \mathrm{Var}[R_p], \mathrm{Cons}_p, f_{lex}, f_{tem}, f_{act}, f_{fre}, f_{eco}, m_{pago}, h_{cob}, \rho_{loc}, f_{cal}\big) \in \mathbb{R}^{14}
$$
Telemetría $e = (u, q, \Phi(q,p), r, a, v)$ y pérdida por pares
$$
\mathcal{L}(F) = \sum_{(p^+, p^-) \in \mathcal{P}_q} \ell\big(F(\Phi(q,p^+)) - F(\Phi(q,p^-))\big)
$$
La combinación lineal vigente es el caso particular de $F$ aditivo con pesos fijos: la transición conserva la semántica de las señales.

## 3. Proposiciones (P1–P5)

**P1 (Precedencia espacial).** Para todo $p \notin C_k(u)$, ninguna señal de $p$ se evalúa. *Argumento*: por construcción, $S$ solo se aplica a la imagen de $F_{geo}$; la pertenencia a $C_k(u)$ es consulta de conjuntos, no cálculo de distancias. La geografía define el dominio de la decisión, no un término de ella.

**P2 (Separación factibilidad/conveniencia; no manipulabilidad de la cobertura).** $\partial S / \partial \rho_p = 0$ en todo el dominio factible. *Argumento*: $\rho_p$ aparece solo en $G$ (binaria) y como holgura $h_{cob}$ en $\Phi$ (reservada para el aprendizaje, peso 0). Corolario: sobredeclarar cobertura no mejora ninguna posición; solo expande el conjunto donde el candidato compite (donde su $f_{esp}$ será menor). El único parámetro que el actor ordenado declara libremente no tiene gradiente sobre su propio orden.

**P3 (Costo acotado por densidad local).** El costo de una consulta es $O\!\big((3k^2+3k+1)\cdot \bar\delta\big)$ con $\bar\delta$ la densidad media de ofertas activas por celda del disco — independiente de $|P|$. *Argumento*: $|C_k(u)| \le \sum_{h \in N_k} \mathrm{active}(h)$; la evaluación de $G$ y $S$ es $O(1)$ por candidato. Evidencia empírica: experimento 4 de la tesis (200 → 20 000 candidatos, ~160 evaluados, < 1 ms).

**P4 (Degradación honesta / mejora monótona).** Con evidencia nula el modelo ejecuta exactamente sus valores de diseño ($\alpha = 2.5$, $\beta = 2$; prior de respaldo $\boldsymbol\alpha = (1,1,1,2,2)$) y toda acumulación de evidencia contrae el posterior hacia el valor empírico. *Argumento*: contracción posterior estándar Dirichlet–multinomial ($E[R]$ es media ponderada de prior y empírica con pesos $\alpha_0/(N+\alpha_0)$ y $N/(N+\alpha_0)$); contracción jerárquica del kernel con $\omega = n/(n+n_0) \to 0$ cuando $n \to 0$. Verificado en `tests/dirichlet.test.ts`, `tests/kernel.test.ts`.

**P5 (Privacidad estructural sin pérdida de utilidad de búsqueda).** El modelo es una función de $H_8(u_{loc}), H_8(p_{loc})$ y atributos alfanuméricos; las coordenadas crudas no son entrada de ninguna etapa. *Argumento*: la anonimización no es ruido añadido a posteriori (geo-indistinguibilidad) sino sustitución estructural de la coordenada por su celda; la garantía es de tipo k-anonimidad locacional con $k$ = actores co-localizados en la celda. La utilidad de búsqueda se conserva porque la propia métrica del modelo es la de rejilla: la búsqueda no pierde nada que el modelo usara. La honestidad epistémica es visible en el desempate: candidatos co-celda son indistinguibles y rotan.

## 4. Correspondencia código ↔ ecuaciones

| Ecuación (tesis) | Concepto | Módulo |
|---|---|---|
| 13 | embudo | `index.ts` (doc), pipeline del consumidor |
| 14 | $C_k(u)$ + índice inverso | `retrieval.ts` |
| 15 | compuerta $G$ | `scoring.ts` (gate) |
| 16 | $S(p\|q)$ | `scoring.ts` + `config.ts` (perfiles) |
| 17 | posterior Dirichlet | `dirichlet.ts` |
| 18 | kernel aprendible | `kernel.ts` |
| 19 | $\Phi \in \mathbb{R}^{14}$ | `scoring.ts` (featureVector) |
| 20 | telemetría $e$ | contrato (no en librería: es del despliegue) |
| 21 | pérdida por pares | futura fase LTR (documentada) |

## 5. Renombres dominio-agnósticos (glosario tesis → librería → artículo)

| Tesis (Chambit) | Librería | Artículo |
|---|---|---|
| experto / listing | `SituatedCandidate` | situated capability / candidate |
| cliente / consulta | `SituatedQuery` | situated need / query |
| categoría / subcategoría | `domainId` / `topicId` | domain / topic |
| buscar / solicitar / urgente | `browse` / `request` / `request_urgent` | browse / dispatch / urgent dispatch |
| radar del experto | `scoreOpportunity` (reverse) | reverse direction |
| pase B (propuestas) | `scoreOffer` | offer pass |
| chips de cualidad | `traits` | categorical quality traits |
| banda min/aceptable/deseado | `PriceBand {min, acceptable, desired}` | three-level negotiation band |
