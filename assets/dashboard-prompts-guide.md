# Guía de Prompts por Tab — Dashboard Analytics Reevalua
### Criterios de diseño, qué incluir en cada módulo y prompts listos para usar

---

## Filosofía general del sistema

Antes de ver los prompts tab por tab, estos son los principios que guían **cada decisión de diseño**:

### Principio 1 — Un solo archivo, cero infraestructura
El dashboard es un `.html` estático. Esto no es limitación, es ventaja: se comparte por email, se publica en GitHub Pages en 30 segundos, no necesita servidor, y Claude puede editarlo directamente. **Nunca separar CSS/JS en archivos externos.**

### Principio 2 — Los datos viven inline como `const` JS
Todos los arrays de datos están en el `<script>` al final del HTML. Esto permite que el archivo sea autocontenido Y que Claude pueda leer + editar los valores directamente en cada actualización semanal.

### Principio 3 — Jerarquía: alerta → KPI → visual → tabla
Cada tab sigue el mismo flujo visual descendente:
1. **Alert banner** — estado inmediato (¿datos frescos? ¿estimado? ¿problema?)
2. **KPIs** — 4-6 números que el CEO lee en 10 segundos
3. **Charts** — tendencia y distribución
4. **Analysis box** — diagnóstico automático de 3 insights clave
5. **Tablas** — detalle completo para quien quiere profundizar

### Principio 4 — Cada métrica tiene fuente explícita
Ninguna gráfica ni tabla existe sin su nota de fuente al pie. "¿De dónde viene este número?" nunca debe ser una pregunta.

### Principio 5 — Los datos inciertos se marcan, no se ocultan
`~est.`, `★`, `◆`, `(API real)` — el usuario siempre sabe qué es real y qué es estimado. Un dashboard que mezcla confirmados con estimados sin etiquetarlos destruye la confianza.

### Principio 6 — El diseño sigue los datos, no al revés
No construir tabs vacíos "por si acaso". Cada tab justifica su existencia con datos reales o una necesidad de análisis específica. Si no hay datos de funnels, no hay tab de Embudos.

---

## TAB 1 — Resumen General

### Propósito
Primera vista que ve cualquier stakeholder. Responde en 30 segundos: ¿cuántos registros? ¿cuánto gastamos? ¿qué canal domina? ¿cómo va esta semana?

### Qué incluir (en orden)
1. **Alert banner de actualización** — siempre el más reciente, fecha visible, estado de datos
2. **Hero strip 4 KPIs** — Registros totales / Canal dominante / Tasa de conversión funnel / Inversión total
3. **Source cards** — distribución por canal (Meta / TikTok / Orgánico / B2B) con % y daily avg
4. **KPI grid Q2** — desglose semanal activo: S14 cerrado / S15 cerrado / S16 en curso o cerrado
5. **Tabla de campañas activas** — toggle Mar/Abr/Combinado, con CPA y estado
6. **Analysis box** — 3 insights del periodo actual (CTR más alto, canal más eficiente, anomalía)

### Qué NO incluir
- Detalle de UTMs (→ Tab UTMs)
- Embudos completos paso a paso (→ Tab Embudos)
- Series diarias de 89 días (→ Tab Diarias o Q1 Histórico)

### Prompts

**Crear tab Resumen desde cero:**
```
Crea el Tab 1 "Resumen General" del dashboard con estos datos:

Meta Ads (API real):
- Mes [X]: S/[XXX] · [N] clics · CTR [X]% · CPM S/[X]
- Semana [S14/S15/S16]: S/[XXX] · [N] clics · CTR [X]%

TikTok Ads (Windsor.ai):
- Campaña CP-15.01 Micro: S/[XXX] · [N] conv
- Campaña CP Registro Gratis: S/[XXX] · [N] conv

Mixpanel Prod (3968749):
- Registros totales: [N] ([N]/día)
- Conv rate: [X]% (Credit request → Credit options)
- Flow completed: [N]

Incluir:
- Alert banner informativo con la fecha de hoy y resumen de todas las fuentes
- Hero strip con 4 KPIs principales
- Source cards para los 4 canales
- Tabla de campañas activas con toggle Mar/Abr
- Analysis box con 3 insights del periodo

Seguir el sistema de diseño de reevalua-dashboard-v2.skill.md
```

**Actualizar solo el banner de estado:**
```
Actualiza el alert banner del Tab Resumen con los datos de la semana [S16, Abr 14-20]:
- Mixpanel: [N] regs ([N]/día · ±X% vs semana anterior)
- TikTok: S/[X] · [N] conv · CPA S/[X]
- Meta: [dato o N/A si no disponible]

Mantén el resto del tab igual. Fecha: [hoy].
```

**Agregar un nuevo KPI card:**
```
Agrega un KPI card de color [teal] al kpi-grid del Tab Resumen mostrando:
- Label: "S16 CERRADO (Abr 14–19)"
- Valor: "3,399"
- Sub: "566/día · +7.1% vs S15 · Conv 61.9%"
- kpi-change: verde con "▲ TikTok S/1,102.78 · CPA S/1.75"
```

---

## TAB 2 — Métricas Diarias

### Propósito
Permite ver la granularidad día a día para detectar picos, caídas y anomalías. Responde: ¿qué días fueron mejor? ¿cuándo cayó el volumen? ¿hay correlación entre gasto y registros?

### Qué incluir
1. **Filter panel** con toggle Mar / Abr / Mar+Abr (secciones separadas que se muestran/ocultan con JS)
2. **Chart de registros diarios (línea)** — Credit request created, Mixpanel Prod
3. **Chart de área apilada** — canales por día (Meta / TikTok / Orgánico / B2B)
4. **Charts por canal** — uno por Meta, uno por TikTok (conversiones + gasto en eje dual Y)
5. **Tabla diaria** — columnas: Fecha | Regs (Mx) | Meta (S/) | TikTok (S/) | Total (S/)
   - Filas con color por semana (alternando verde/azul por S14/S15/S16)
   - Fila TOTAL al final de cada semana
   - Marcadores ◆ para parciales, ✓ para confirmados

### Criterio de diseño
- Los charts de línea son mejores que los de barras para series temporales largas (>14 días)
- El eje Y secundario es obligatorio cuando se grafica Meta en USD y TikTok en PEN en el mismo chart
- Las tablas van debajo de los charts, nunca encima (el chart es resumen, la tabla es detalle)

### Prompts

**Crear tabla diaria con datos de S16:**
```
Agrega las filas de la semana S16 (Abr 14-20) a la tabla de Métricas Diarias.

Datos por día:
| Fecha  | Regs (Mx) | TikTok (S/) | Meta (S/) |
|--------|-----------|-------------|-----------|
| Abr 14 | 488       | 206.33      | N/A       |
| Abr 15 | 596       | 183.55      | N/A       |
| Abr 16 | 657       | 173.63      | N/A       |
| Abr 17 | 590       | 185.85      | N/A       |
| Abr 18 | 557       | 182.95      | N/A       |
| Abr 19 | 511       | 170.47      | N/A       |
| Abr 20 | 82 ◆      | 28.81       | N/A       |

- Usar fondo #ede9fe para S16
- Fila totales: 3,399 regs / S/1,102.78 TikTok / N/A Meta
- Agregar fila de Abr 20 con opacity 0.75 y label "◆ parcial"
- Mantener el pie de nota con fuente y metodología
```

**Actualizar los arrays JS del chart diario:**
```
Actualiza los arrays JS del chart de registros diarios para incluir Abr 14-20:

Datos actuales (truncar si necesario):
const abrDailyRegs = [585, 531, 481, 598, 587, 654,   // S14 Abr 1-6
                      609, 480, 422, 419, 385, 395, 465, // S15 Abr 7-13
                      488, 596, 657, 590, 557, 511, 82]; // S16 Abr 14-20 ◆

const ttAbrDailyCostPEN = [184.22, 191.83, 192.29, 180.53, 176.46, 208.51,
                           159.90, 0, 0, 0, 0, 0, 0,  // S15 TikTok API expirado
                           206.33, 183.55, 173.63, 185.85, 182.95, 170.47, 28.81];

Agrega también etiquetas al eje X: del "Abr 14" al "Abr 20 ◆"
```

**Crear chart dual-axis Meta+TikTok:**
```
Crea un Chart.js de línea dual-axis que muestre:
- Eje Y izquierdo (USD): Meta Ads gasto diario → color #1877f2
- Eje Y derecho (PEN): TikTok Ads gasto diario → color #fe2c55
- Eje X: labels de Abr 1-20
- Tooltips personalizados: Meta "$X.XX", TikTok "S/X.XX"
- Título del card: "Inversión Diaria — Meta USD vs TikTok PEN (Abr 2026)"
- Altura container: 300px
- Nota al pie: "Meta: API Windsor.ai / TikTok: API Windsor.ai · Abr 20 = dato parcial"
```

---

## TAB 3 — Embudos Mixpanel

### Propósito
Analiza la tasa de conversión en cada paso del proceso de solicitud de crédito. Responde: ¿dónde se pierde más gente? ¿qué segmento convierte mejor? ¿mejoró el funnel vs el mes pasado?

### Qué incluir
1. **Funnel principal** (chart de barras horizontal o vertical) — todos los pasos en orden
2. **Conv rates entre pasos** — como badges o en el mismo chart con anotación
3. **Funnel por segmento de cliente** — Pérdida / Bancarización / Optimización / Pago de Deudas
4. **Comparativa periodos** — Mar vs Abr, semana actual vs anterior
5. **Chart de Flow Completed diario** — ver si la tasa de completación varía día a día

### Pasos del funnel Reevalua (en orden)
```
1. Landing Page Viewed (entrada)
2. Credit request created (registro inicio)
3. [Pasos intermedios de Tracking flow step]
4. Credit options showed (usuario ve opciones)
5. Flow completed (proceso terminado)
```

### Criterio de diseño
- El funnel se visualiza mejor como barras horizontales (van de arriba a abajo visualmente)
- Incluir siempre el % de cada paso vs el paso anterior Y vs el total del funnel
- La nota crítica de UTM: los datos de atribución solo viven en `Landing Page Viewed`, no en `Credit request created`

### Prompts

**Crear funnel principal:**
```
Crea el funnel de conversión para Mixpanel Prod (3968749) con datos de [periodo].

Pasos y valores:
1. Landing Page Viewed: [N] (entrada total)
2. Credit request created: [N] (registros inicio)
3. Credit options showed: [N] (usuarios que ven opciones)
4. Flow completed: [N] (flujo terminado)

Mostrar como chart de barras horizontal con:
- % de conversión entre cada paso (ej: "paso 1→2: 18.2%")
- % global vs el primer paso
- Colores: púrpura degradado de oscuro (paso 1) a claro (paso final)
- Nota: "⚠️ UTM solo disponible en Landing Page Viewed — no en Credit request created"
- Nota metodológica: "Fuente: Mixpanel Prod 3968749 · evento por evento"
```

**Agregar comparativa de periodos:**
```
Agrega una sección de "Comparativa Mar vs Abr" al Tab Embudos con:

Mar 2026: 16,293 regs → 10,275 credit opts (63.1%) → 45 flow completed
Abr S14:   3,436 regs →  2,383 credit opts (69.4%) →  7 flow completed
Abr S16:   3,399 regs →  2,105 credit opts (61.9%) →  7 flow completed

Mostrar como chart de barras agrupadas (3 grupos: Mar/S14/S16)
Incluir una analysis-box con diagnóstico:
- S14 fue el mejor mes en conv rate (69.4%)
- S16 bajó 7.5pp vs S14 → investigar causa
- Flow completed muy bajo (0.2%) → oportunidad de mejora
```

---

## TAB 4 — Perfil de Clientes

### Propósito
Entiende quién es el usuario que se registra. Segmentación por tipo de cliente para personalizar mensajes, landing pages y campañas.

### Tipos de cliente en Reevalua
```
Pérdida         → usuarios con historial de mora / deuda castigada    color: #ef4444
Bancarización   → no bancarizados, primera vez con crédito formal     color: #7c3aed
Optimización    → ya tienen crédito, quieren mejores condiciones      color: #22c55e
Pago de Deudas  → consolidan múltiples deudas en un solo crédito      color: #3b82f6
```

### Qué incluir
1. **Doughnut / Pie** — distribución por tipo (% del total)
2. **Tendencia diaria** — líneas por tipo (ver si cambia la composición semana a semana)
3. **Área apilada** — composición diaria (igual que líneas pero más visual)
4. **Tabla resumen** — Tipo | Total | % | Prom/día | Día máx | Día mín

### Criterio de diseño
- El doughnut es mejor que el pie chart para proporciones con 4 categorías
- Colores por tipo de cliente son fijos — nunca cambiarlos (el equipo ya los reconoce)
- La tabla permite comparar entre tipos de forma más precisa que las gráficas

### Prompts

**Crear tab de perfil con datos mensuales:**
```
Crea el Tab "Perfil de Clientes" con datos de [mes] Mixpanel Prod.

Distribución mensual:
- Bancarización: [N] regs ([X]%)
- Pérdida: [N] regs ([X]%)
- Optimización: [N] regs ([X]%)
- Pago de Deudas: [N] regs ([X]%)
- Total: [N]

Datos diarios (arrays de 31 días por tipo):
const bancDailyMar = [103, 160, ...];
const perdDailyMar = [...];
const optDailyMar  = [...];
const pagoDailyMar = [...];

Incluir doughnut + área apilada + tabla resumen.
Colores fijos: Banc=#7c3aed · Pérd=#ef4444 · Opt=#22c55e · Pago=#3b82f6
```

---

## TAB 5 — CAC & ROI

### Propósito
Responde la pregunta más importante para el equipo de marketing: ¿cuánto nos cuesta adquirir cada registro y cada cliente? ¿Está mejorando o empeorando?

### Métricas clave
```
CPA Meta     = gasto Meta / conversiones Meta  → en USD y S/PEN
CPA TikTok   = gasto TikTok / conversiones TT  → en S/PEN
CPA Combinado = (Meta+TikTok gasto) / (Meta+TT conv)
CAC Real     = (gasto publicitario total) / registros Mixpanel
Efficiency   = registros / S/ gastado
```

### Qué incluir
1. **KPIs ejecutivos** — CPA Meta / CPA TikTok / CPA combinado / Inversión total
2. **Chart de CPA mensual** — evolución mes a mes para ver tendencia
3. **Chart de inversión por canal** — barras apiladas Meta vs TikTok por semana
4. **Tabla de campaña** — CPA por campaña individual + estado activa/pausada
5. **Analysis box** — "¿Qué canal da mejor ROI?" y "¿Cuándo fue el CPA mínimo?"

### Criterio de diseño
- CPA se expresa siempre en la moneda local (S/PEN para Perú)
- Si Meta y TikTok tienen monedas diferentes, siempre normalizar a PEN para comparar
- El chart de evolución de CPA es el más importante de este tab — ponlo primero

### Prompts

**Crear sección de comparativa CPA por semana:**
```
Crea una tabla de "CPA por Semana Q2" con estos datos:

| Semana | TikTok Gasto (S/) | TikTok Conv | TikTok CPA | Meta Gasto (S/) | Meta Conv | Meta CPA |
|--------|-------------------|-------------|------------|-----------------|-----------|----------|
| S14 Abr 1-6  | 1,133.84 | 964 | S/1.18 | 469.12 | ~1,173 | S/0.40 |
| S15 Abr 7-13 | ~159.90  | ~N/D | ~N/D  | 363.79 | ~910   | S/0.40 |
| S16 Abr 14-19| 1,102.78 | 629 | S/1.75 | N/A    | N/A    | N/A    |

- Highlight el S14 (CPA más bajo TikTok) en verde
- Nota al pie: "Meta conversiones = estimado proporcional · TikTok S15 = API token expirado"
- Agregar fila de tendencia: "▲ CPA TikTok subió +48% de S14 a S16 — revisar audiencias"
```

**Crear chart de inversión semanal Q2:**
```
Crea un bar chart apilado para Q2 con:
- Labels: ['S13 Mar26-31','S14 Abr1-6','S15 Abr7-13','S16 Abr14-20']
- Dataset 1 "TikTok Micro" (S/PEN): [0, 409, 0, 419.62] → color #14b8a6
- Dataset 2 "TikTok Gratis" (S/PEN): [0, 725, 0, 683.16] → color #fe2c55
- Dataset 3 "Meta" (S/PEN): [400, 469.12*3.70, 363.79, 0] → color #1877f2

Incluir:
- Anotación en S15: "TikTok API no disponible"
- Anotación en S16: "Meta no conectado"
- Tooltip: "S/X.XX"
- Nota al pie: fuente de cada dato
```

---

## TAB 6 — UTMs & Canales

### Propósito
Responde: ¿de dónde viene el tráfico real? ¿qué UTM medium genera más registros? ¿cómo ha cambiado la distribución en el tiempo?

### Estructura de UTMs en Reevalua
```
utm_medium (por importancia):
- paid_social     → TikTok + Meta pagado (~65% en Abr)
- b2fclientepotencial → canal B2B potencial (~20% en Mar, bajando)
- undefined       → sin UTM (~10%) — señal de tracking roto
- paid            → genérico (~5%)

utm_source (principales):
- tiktok / tiktok.com → TikTok orgánico + paid
- fb / facebook / ig / instagram → Meta Ads
- merite / creditoemprendedor → nombres de campaña como source (bug)
```

### Gap crítico a documentar siempre
**UTM Medium solo se captura en `Landing Page Viewed` — NO en `Credit request created`.** Todos los registros tienen UTM=undefined en Mixpanel porque el UTM se pierde al cruzar al evento de registro. Para análisis de atribución usar siempre `Landing Page Viewed`.

### Qué incluir
1. **Pie/Doughnut de UTM Medium** — distribución del periodo
2. **Pie/Doughnut de UTM Source** — plataformas específicas
3. **Chart de evolución semanal** — cómo cambia la distribución semana a semana
4. **Tabla de eficiencia por UTM** — LP Views / Regs Funnel / Conv% / % del total
5. **Comparativa pre/post fix** — si hubo un fix de tracking, mostrar antes vs después

### Prompts

**Crear análisis de UTM Medium:**
```
Crea el Tab de UTMs con datos de Mixpanel "Landing Page Viewed" (NO de Credit request created).

Distribución UTM Medium (Mar+Abr combinado):
- paid_social: 65.3% (Mar 48% → Abr 91.7%)
- b2fclientepotencial: 19.8% (Mar 31.3% → Abr 1.9%)
- undefined: 10.1%
- paid: 4.8%

UTM Source (LP Views total Mar 1 – Abr 7):
- TikTok: 57,327 (58.4%)
- Meta (fb+facebook+ig+meta): ~30,805 (31.4%)
- Otros: ~10,979 (10.2%)

Incluir:
- Doughnut de Medium + Doughnut de Source (lado a lado en grid-2)
- Tabla de eficiencia: Medium | LP Views | Regs | Conv% | % total
- Alert amarilla con nota: "⚠️ UTM Medium no disponible en Credit request created — usar siempre Landing Page Viewed para atribución"
- Bug Meta: variables {{site_source_name}} y __PLACEMENT__ sin resolver (645 vistas)
```

**Agregar evolución semanal de UTM Medium:**
```
Agrega un chart de líneas de área apilada mostrando la evolución semanal de UTM Medium en Landing Page Viewed.

Semanas: Mar 9-15 / Mar 16-22 / Mar 23-29 / Mar 30-Abr 5 / Abr 6-12
paid_social: [X, X, X, X, X]
b2fclientepotencial: [X, X, X, X, X]
undefined: [X, X, X, X, X]
paid: [X, X, X, X, X]

Usar colores: paid_social=#7c3aed · b2fc=#3b82f6 · undefined=#9ca3af · paid=#f97316
Insight clave en analysis-box: "paid_social subió de 48% (Mar) a 91.7% (Abr) → TikTok dominando adquisición"
```

---

## TAB 7 — Q1/Q2 Histórico (con filtros reactivos)

### Propósito
El tab más complejo. Permite al equipo explorar cualquier ventana de tiempo de Q1 o Q2 con filtros que actualizan KPIs y charts al instante. Reemplaza un spreadsheet de reportes semanales.

### Qué incluye (es el más completo)
1. **Filter panel reactivo** — presets: Ene / Feb / Mar / Q1 / Q2; canales: Meta / TikTok / Orgánico; métrica: Gasto / Conversiones / CTR; rango de gasto
2. **KPIs reactivos** — se actualizan al cambiar filtros (con `document.getElementById('kpiId').textContent = ...`)
3. **Chart principal** — inversión diaria Meta (90 días, coloreado por mes)
4. **Chart de LP Views** — visitas diarias Mixpanel (90 días)
5. **Chart semanal Meta vs TikTok** — barras agrupadas + línea CTR (dual axis)
6. **Chart CTR/CPM semanal** — evolución de eficiencia
7. **Tabla semanal Meta** — 13 semanas completas con totales
8. **Tabla semanal TikTok** — 13 semanas Q1 con CPA y vs Meta
9. **Tabla mensual Meta** — Jan / Feb / Mar totales
10. **Tabla mensual TikTok** — mismos meses

### El patrón de filtros reactivos (crítico)

```javascript
// Estado central — UN solo objeto
const F = {
  dateFrom: 0, dateTo: 88,
  channel: ['meta','tiktok','organic'],
  preset: 'q1',
  week: 'all',
  metric: 'spend',
  spendRange: 'all'
};

// Función de filtrado de índices
function getFilteredIndices() {
  const idx = [];
  for(let i = F.dateFrom; i <= F.dateTo; i++) {
    if(F.spendRange !== 'all') {
      const s = allMetaSpendUSD[i] || 0;
      if(F.spendRange === 'low'  && s >= 70)  continue;
      if(F.spendRange === 'mid'  && (s < 70 || s > 150)) continue;
      if(F.spendRange === 'high' && s <= 150) continue;
    }
    idx.push(i);
  }
  return idx;
}

// Presets de periodo
function applyPreset(p) {
  const map = { ene:{f:0,t:30}, feb:{f:31,t:58}, mar:{f:59,t:88}, q1:{f:0,t:88} };
  if(map[p]) { F.dateFrom=map[p].f; F.dateTo=map[p].t; }
  F.preset = p;
  // Update botones
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.toggle('active', b.dataset.p===p));
  buildQ1Charts();
  updateKPIs();
}

// Destruir siempre antes de redibujar
const Q1Charts = { main:null, weekly:null, lp:null };
function buildQ1Charts() {
  Object.values(Q1Charts).forEach(c => { if(c) c.destroy(); });
  const idx = getFilteredIndices();
  // ... redibujar con idx
}
```

### Criterio de diseño para este tab
- **Colores por mes en arrays de 84/89 días:**
  ```javascript
  backgroundColor: data.map((_, i) => i < 31 ? '#7c3aed' : i < 59 ? '#3b82f6' : '#14b8a6')
  // Ene=púrpura · Feb=azul · Mar=teal
  ```
- `ticks: { maxTicksLimit: 15 }` obligatorio en series de 89 días (evita labels solapados)
- Las tablas semanales son el contenido más consultado — ponerlas antes de las gráficas de 89 días
- El TOTAL de la tabla debe tener `font-weight:700` y `background:var(--purple-50)` siempre

### Prompts

**Crear tabla semanal Meta de 13 semanas:**
```
Crea la tabla semanal de Meta Ads Q1 (13 semanas) con estas columnas:
Semana | Fechas | Inversión (USD) | Inversión (S/PEN) | Impresiones | Clics | CTR | CPM (USD) | Reg. est. | CPA est.

Datos:
S1: Ene 1-7   · $1,832 · S/6,778 · 455,220 · 20,978 · 4.61% · $4.02 · ~4,631 · $0.40
S2: Ene 8-14  · $1,412 · S/5,224 · 377,849 · 18,032 · 4.77% · $3.74 · ~3,573 · $0.40
[... resto de semanas]
S13: Mar 26-31 · $334  · S/1,237 · 38,285  · 2,651  · 6.92% · $8.73 · ~854  · $0.39

Colores:
- S1-S4 (Enero): fondo #ede9fe
- S5-S8 (Febrero): fondo #dbeafe
- S9-S13 (Marzo): fondo #ccfbf1
- S13 (cierre): fondo #a7f3d0
- Total Q1: fondo var(--purple-50), font-weight 700

Leyenda debajo: "★ semanas con estimado · ◆ dato parcial · API real = Meta Ads Manager"
```

**Implementar filtros reactivos desde cero:**
```
Implementa el sistema de filtros reactivos para el Tab Q1 Histórico.

Estado inicial: { dateFrom:0, dateTo:88, channel:['meta','tiktok','organic'], preset:'q1' }

Presets disponibles: Ene (0-30) / Feb (31-58) / Mar (59-88) / Q1 (0-88)

KPIs que deben actualizarse:
- #kpiQ1Spend → suma de allMetaSpendUSD[dateFrom..dateTo]
- #kpiQ1Conv  → suma de estimReg[dateFrom..dateTo]
- #kpiQ1CTR   → promedio de dailyCTR[dateFrom..dateTo]
- #kpiQ1CPA   → kpiQ1Spend / kpiQ1Conv

Charts que deben redibujar:
- chartQ1Main (línea, spend diario)
- chartQ1Weekly (barras, agrupadas por semana dentro del rango)

Incluir botones .preset-btn con data-p="ene|feb|mar|q1" y función applyPreset().
Destruir charts siempre antes de redibujar con .destroy().
```

**Agregar nueva semana Q2 a la tabla histórica:**
```
Agrega la fila de la semana S16 (Abr 14-20) a la tabla de semanas Q2.

Datos S16 confirmados:
- Mixpanel: 3,399 regs (566/día, +7.1% vs S15)
- TikTok: S/1,102.78 · 629 conv · CPA S/1.75
- Meta: N/A (conector no conectado)

HTML de la fila:
<tr style="background:#fef9c3;">
  <td><strong>S16 ★</strong></td>
  <td>Abr 14–19</td>
  <td class="num">N/A</td>
  <td class="num">S/1,102.78</td>
  <td class="num">3,399</td>
  <td class="num">S/1.75</td>
</tr>

Actualizar también la nota al pie de la tabla con la fuente y fecha.
```

---

## Módulos adicionales opcionales

### Módulo: Comparativa Campañas (dentro de Tab Resumen o CAC)

```
Crea una tabla de campañas activas con toggle entre periodos.

Columnas: Campaña | Plataforma | Estado | Inversión | Conversiones | CPA | CTR | Período

Usar badges:
- Meta: badge-meta azul
- TikTok: badge-tiktok rosa
- Activa: badge-organic verde
- Pausada: fondo gris

Toggle JS:
<button onclick="showCampTable('mar')">Mar 2026</button>
<button onclick="showCampTable('abr')">Abr 2026</button>
<button onclick="showCampTable('comb')">Combinado</button>

Secciones: #camp-mar-section / #camp-abr-section / #camp-comb-section
```

### Módulo: Dark Mode

```
Agrega dark mode toggle al dashboard.

Botón en header (top-right):
<button id="darkToggle" onclick="toggleDark()" style="position:absolute;top:24px;right:40px;...">🌙</button>

JS:
function toggleDark() {
  const dark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', dark ? 'light' : 'dark');
  document.getElementById('darkToggle').textContent = dark ? '🌙' : '☀️';
  localStorage.setItem('theme', dark ? 'light' : 'dark');
}
// Persistir preferencia:
if(localStorage.getItem('theme') === 'dark') document.body.setAttribute('data-theme','dark');

CSS variables dark en [data-theme="dark"]:
--bg: #0f172a; --surface: #1e293b; --border: #334155; --text-primary: #f1f5f9;
Aplicar a: body, .card, .kpi-card, .tabs-container, .data-table, .filter-panel, .header
```

### Módulo: Exportar / Compartir

```
Agrega un botón "Exportar PDF" usando window.print() con estilos optimizados para impresión.

@media print {
  .tabs-container { display: none; }
  .tab-content { display: block !important; }
  .filter-panel { display: none; }
  .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .chart-container { break-inside: avoid; }
}

Botón:
<button onclick="window.print()" style="...">📄 Exportar PDF</button>
```

---

## Prompt maestro — Crear dashboard completo desde cero

```
Crea un dashboard HTML completo de analytics de adquisición para [empresa].

DATOS DISPONIBLES:
---
Meta Ads (Windsor.ai / API):
[pegar salida de get_data o get_insights]

TikTok Ads (Windsor.ai):
[pegar salida de get_data]

Mixpanel (MCP Run-Query):
[pegar resultado de queries de eventos]
---

PERIODO: [mes actual] + histórico Q1/Q2 si disponible

TABS A INCLUIR:
1. Resumen General — KPIs + fuentes + campañas activas
2. Métricas Diarias — tendencias day-by-day por canal
3. Embudos — funnel de conversión completo
4. CAC & ROI — eficiencia de inversión
5. UTMs & Canales — atribución por fuente
6. Q[n] Histórico — tablas semanales con filtros reactivos

SISTEMA DE DISEÑO: seguir reevalua-dashboard-v2.skill.md
- Paleta: púrpura primario (#7c3aed)
- Fuente: Inter desde Google Fonts
- Chart.js 4.4.1 desde CDN
- Sin archivos externos — UN solo .html
- Dark mode incluido
- Responsive para mobile

REGLAS:
- Todos los datos como const JS inline
- Alert banner de actualización como primera sección del Tab 1
- Marcar datos estimados con ★ y datos confirmados con (API real)
- Notas de fuente al pie de cada chart y tabla
- Fila TOTAL en todas las tablas
- class="num" en todas las columnas numéricas

NOMBRE DEL ARCHIVO: dashboard_[mes]_[año].html
```

---

## Checklist rápido por tab antes de publicar

| | Tab | ✓ Tiene alert banner | ✓ Tiene 4+ KPIs | ✓ Tiene chart | ✓ Tiene nota de fuente | ✓ Tiene tabla con TOTAL |
|-|-----|---------------------|-----------------|---------------|------------------------|-------------------------|
| 1 | Resumen | ✓ con fecha | ✓ hero strip | ✓ source cards | ✓ | ✓ campañas |
| 2 | Diarias | ✓ con toggle período | ✓ KPIs semana | ✓ líneas diarias | ✓ | ✓ tabla diaria |
| 3 | Embudos | ✓ nota UTM gap | ✓ conv rates | ✓ funnel chart | ✓ Mixpanel Prod | — |
| 4 | Clientes | — | ✓ por tipo | ✓ área apilada | ✓ Mixpanel Prod | ✓ por tipo |
| 5 | CAC & ROI | — | ✓ CPA x canal | ✓ evolución CPA | ✓ API + est. | ✓ por campaña |
| 6 | UTMs | ✓ nota crítica | ✓ distribución | ✓ doughnut | ✓ Landing Page Viewed | ✓ eficiencia |
| 7 | Histórico | — | ✓ reactivos | ✓ 4+ charts | ✓ por fuente | ✓ semanal + mensual |
