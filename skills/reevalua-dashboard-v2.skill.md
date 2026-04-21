# Skill: Analytics Dashboard Builder v2
### Sistema completo para dashboards de adquisición y performance — Reevalua / cualquier empresa

---

## Propósito

Genera, mantiene y actualiza dashboards HTML autocontenidos que consolidan datos de Meta Ads, TikTok Ads, Mixpanel (y cualquier fuente vía Windsor.ai / MCP) en un único archivo publicable. Sin servidor, sin build, sin dependencias externas excepto Chart.js + Inter desde CDN.

**Resultado:** Un `.html` con 7+ tabs, gráficas interactivas, filtros reactivos, KPIs en tiempo real, dark mode y diseño de nivel producto.

---

## Cuándo usar

- Crear un nuevo dashboard de marketing / performance desde cero
- Actualizar semanalmente un dashboard existente con datos frescos
- Agregar un nuevo tab / módulo a un dashboard existente
- Construir un reporte ejecutivo visual para stakeholders
- Migrar datos de una hoja de cálculo a una visualización interactiva

---

## Fuentes de Datos & MCPs disponibles

| Fuente | MCP / Herramienta | Datos clave |
|--------|-------------------|-------------|
| Meta Ads | `mcp__5439f833__get_campaign_analytics` | spend, impressions, clicks, CTR, CPM, conversions |
| Meta Ads | `mcp__5439f833__get_crm_objects` | campañas activas, estado, presupuesto |
| TikTok Ads | Windsor.ai `get_data(connector:"tiktok")` | spend PEN, conversions, clics, CTR por campaña/día |
| Meta Ads | Windsor.ai `get_data(connector:"facebook")` | spend, impressions, clics, CTR por campaña/día |
| Mixpanel | `mcp__5dd3ee06__Run-Query` | eventos diarios, embudos, UTMs, retención |
| Mixpanel | `mcp__5dd3ee06__Get-Events` | lista de eventos disponibles |
| Mixpanel | `mcp__5dd3ee06__Get-Property-Values` | valores únicos de propiedades (UTM source, medium, etc.) |

**Proyecto Mixpanel Reevalua Prod:** ID `3968749` (SIEMPRE usar este, NO 3729160 ni 3880888)

**Orden de consulta para datos de la semana:**
1. Windsor.ai `get_data` (rango fecha exacto) → más fiable para series diarias
2. `Run-Query` Mixpanel (insights con `dateRange.type:"between"`)
3. `get_today` / `get_insights` (semana) → fallback

---

## Arquitectura de archivo

```
dashboard_[periodo].html                          ← UN SOLO ARCHIVO
│
├── <head>
│   ├── Google Fonts: Inter (pesos 300-800)
│   ├── Chart.js 4.4.1 (CDN jsdelivr)
│   ├── chartjs-plugin-annotation (CDN)
│   └── <style>: CSS variables + todos los componentes
│
├── <header class="header">
│   ├── Gradiente púrpura 135deg
│   ├── h1 + .subtitle + .date-range pill
│   └── #darkToggle (botón dark mode, top-right)
│
├── <div class="tabs-container"> (sticky top:0)
│   └── Tab 1 · Tab 2 · Tab 3 · ... · Tab N
│
└── <div class="main">
    ├── #tab-resumen       → KPIs + fuentes + campañas activas
    ├── #tab-diarias       → tendencias diarias por canal
    ├── #tab-embudos       → funnel de conversión Mixpanel
    ├── #tab-clientes      → perfiles de usuario
    ├── #tab-cac           → CAC, ROI, eficiencia de inversión
    ├── #tab-utms          → atribución UTM source/medium
    └── #tab-q1 / #tab-q2 → histórico con filtros reactivos
    
    └── <script>           → todos los datos como const JS inline
```

---

## Sistema de Diseño Completo

### Paleta de colores (CSS variables — copiar íntegra)

```css
:root {
  /* Púrpura — color primario de marca */
  --purple-900: #2d1b69;
  --purple-800: #3a2080;
  --purple-700: #4c2889;
  --purple-600: #6b3fa0;
  --purple-500: #7c3aed;   /* primary accent */
  --purple-400: #a78bfa;
  --purple-300: #c4b5fd;
  --purple-200: #ddd6fe;
  --purple-100: #ede9fe;
  --purple-50:  #f5f3ff;

  /* Grises */
  --gray-900: #111827;
  --gray-700: #374151;
  --gray-600: #4b5563;
  --gray-500: #6b7280;
  --gray-400: #9ca3af;
  --gray-300: #d1d5db;
  --gray-200: #e5e7eb;
  --gray-100: #f3f4f6;
  --gray-50:  #f9fafb;

  /* Semánticos */
  --green-500:  #22c55e;
  --green-100:  #dcfce7;
  --red-500:    #ef4444;
  --red-100:    #fee2e2;
  --yellow-500: #eab308;
  --yellow-600: #ca8a04;
  --yellow-100: #fef9c3;
  --blue-500:   #3b82f6;
  --blue-100:   #dbeafe;
  --teal-500:   #14b8a6;
  --orange-500: #f97316;
  --pink-500:   #ec4899;
}

/* Dark mode */
[data-theme="dark"] {
  --bg: #0f172a;
  --surface: #1e293b;
  --surface-2: #263350;
  --border: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
}
```

### Colores semánticos por canal

```
Meta Ads:    azul  → #1877f2 / badge-meta  → #e7f0fe bg, #1877f2 text
TikTok Ads:  rosa  → #fe2c55 / badge-tiktok → #f0fdf4 bg, #059669 text
Orgánico:    verde → #22c55e / badge-organic → purple-100 bg
B2B / QR:    naranja → #f97316 / badge-b2b  → #fff7ed bg, #c2410c text
```

### Colores por mes (tablas Q1/Q2)

```
Enero:  fondo #ede9fe (violeta)  →  texto via var(--purple-700)
Febrero: fondo #dbeafe (azul)
Marzo:  fondo #ccfbf1 (teal)
Cierre semana final: fondo #a7f3d0 (verde)
Q2 / Abril: fondo #fef9c3 (amarillo)
Parcial / en curso: fondo #ede9fe opacity 0.75
Total:  fondo var(--purple-50), font-weight 700
```

### Tipografía

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
/* Pesos: 300 light, 400 regular, 500 medium, 600 semibold, 700 bold, 800 extrabold */

/* Escalas */
h1 header:   28px / 800 / letter-spacing -0.5px
tab label:   13.5px / 500→600 active
kpi-label:   12px / 600 / uppercase / letter-spacing 0.5px
kpi-value:   32px / 800
kpi-sub:     13px / 400
card-title:  13px / 600 / uppercase / letter-spacing 0.5px / gray-500
section-title: 14px / 600 / gray-700
table th:    12px / 600 / uppercase / letter-spacing 0.4px
table td:    13px / 400
badge/chip:  11px / 600
```

---

## Componentes HTML — Biblioteca completa

### 1. KPI Card

```html
<div class="kpi-card [purple|blue|green|orange|teal|pink|red]">
  <div class="kpi-label">ETIQUETA UPPERCASE</div>
  <div class="kpi-value" id="kpiId">3,436</div>
  <div class="kpi-sub">572 / día · +8.9% vs mes anterior</div>
  <div class="kpi-change up">▲ +253 vs semana pasada</div>
  <!-- o -->
  <div class="kpi-change down">▼ -21% vs S14</div>
</div>
```

**Grid recomendado:** `kpi-grid` → `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`
**Regla UX:** Máximo 4 KPIs en la primera fila visible sin scroll. Usar `kpi-reactive` para los que cambian con filtros.

### 2. Hero Strip (4 KPIs ejecutivos)

```html
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
  <div style="background:white;border:1px solid var(--gray-200);border-top:3px solid var(--purple-500);border-radius:10px;padding:16px 18px;">
    <div style="font-size:10px;font-weight:700;color:var(--gray-500);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;">Métrica Principal</div>
    <div style="font-size:26px;font-weight:800;color:var(--gray-900);">16,293</div>
    <div style="font-size:12px;color:var(--gray-500);margin-top:2px;">Contexto / periodo</div>
    <div style="font-size:12px;color:var(--green-500);margin-top:4px;font-weight:600;">▲ Tendencia vs anterior</div>
  </div>
</div>
```

### 3. Alert Banner

```html
<!-- Informativo (actualización) -->
<div class="alert" style="background:#ede9fe;border:1px solid #a78bfa;color:#4c1d95;margin-bottom:16px;">
  <div class="alert-icon">📅</div>
  <div class="alert-content">
    <strong>Actualización [fecha] — [periodo]</strong><br>
    Dato principal: <strong>N,NNN registros</strong> · Meta: S/XXX · TikTok: S/XXX<br>
    <span style="font-size:12px;">Notas técnicas menores aquí</span>
  </div>
</div>

<!-- Éxito (datos confirmados) -->
<div class="alert" style="background:#dcfce7;border:1px solid #86efac;color:#166534;...">

<!-- Advertencia (estimado / token vencido) -->
<div class="alert" style="background:#fef9c3;border:1px solid #fde047;color:#713f12;...">

<!-- Error (sin datos) -->
<div class="alert" style="background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;...">
```

### 4. Source Cards (distribución por canal)

```html
<div class="source-cards">  <!-- grid-template-columns: repeat(4,1fr) -->
  <div class="source-card meta" style="border-top-color:#1877f2;">
    <div class="source-icon" style="background:#e7f0fe;color:#1877f2;">M</div>
    <div class="source-name">Meta Ads</div>
    <div class="source-value">5,378</div>
    <div class="source-pct">55.5% del total</div>
    <div class="source-daily">~178 / día promedio</div>
    <div style="font-size:11px;color:var(--gray-400);margin-top:4px;">CPA $0.41 · S/1.52</div>
  </div>
</div>
```

### 5. Analysis Box (insights con grid 3 cols)

```html
<div class="analysis-box">
  <h4>🎯 Diagnóstico del Periodo</h4>
  <div class="analysis-grid">
    <div class="insight-item">
      <div class="i-label">MÉTRICA CLAVE</div>
      <div class="i-value">9.02%</div>
      <div class="i-sub">Descripción breve · contexto</div>
    </div>
    <div class="insight-item">...</div>
    <div class="insight-item">...</div>
  </div>
</div>
```

### 6. Data Table

```html
<table class="data-table">
  <thead>
    <tr>
      <th>Semana</th>
      <th>Fechas</th>
      <th class="num">Inversión (USD)</th>
      <th class="num">CTR</th>
      <th class="num">Registros est.</th>
    </tr>
  </thead>
  <tbody>
    <!-- Filas con color por periodo (ver paleta de meses arriba) -->
    <tr style="background:#ede9fe;">
      <td><strong>S1</strong></td>
      <td>Ene 1–7</td>
      <td class="num">$1,832</td>
      <td class="num">5.12%</td>
      <td class="num">~4,631</td>
    </tr>
    <!-- Fila de total siempre al final -->
    <tr style="font-weight:700;background:var(--purple-50);">
      <td><strong>TOTAL Q1</strong></td>
      <td><strong>13 semanas</strong></td>
      <td class="num"><strong>$12,124</strong></td>
      <td class="num"><strong>5.68% prom.</strong></td>
      <td class="num"><strong>~31,296</strong></td>
    </tr>
  </tbody>
</table>
<div style="margin-top:8px;font-size:12px;color:var(--gray-500);">Fuente de datos · Metodología · Notas sobre estimados</div>
```

### 7. Filter Panel

```html
<div class="filter-panel">
  <!-- Grupo de período -->
  <div class="filter-group">
    <label class="filter-label">Período</label>
    <div class="filter-presets">
      <button class="fbtn active" onclick="showSection('mar')">Mar 2026</button>
      <button class="fbtn" onclick="showSection('abr')">Abr 1–6</button>
      <button class="fbtn" onclick="showSection('comb')">Combinado</button>
    </div>
  </div>
  <div class="filter-divider"></div>
  <!-- Grupo de canal (chips) -->
  <div class="filter-group">
    <label class="filter-label">Canal</label>
    <div class="filter-chips">
      <span class="chip meta active" onclick="toggleChip(this,'meta')">Meta</span>
      <span class="chip tiktok active" onclick="toggleChip(this,'tiktok')">TikTok</span>
      <span class="chip organic active" onclick="toggleChip(this,'organic')">Orgánico</span>
    </div>
  </div>
  <div class="filter-divider"></div>
  <!-- Info estática -->
  <div class="filter-group">
    <label class="filter-label">Actualizado</label>
    <div style="font-size:12px;color:var(--gray-500);padding-top:6px;font-weight:600;">20 Abr 2026</div>
  </div>
</div>
```

### 8. Chart Container

```html
<div class="card" style="margin-bottom:20px;">
  <div class="card-title">Título del Gráfico — Fuente y Periodo</div>
  <div class="chart-container" style="height:300px;">
    <canvas id="chartNombreUnico"></canvas>
  </div>
  <div style="margin-top:8px;font-size:12px;color:var(--gray-500);">
    Fuente: Mixpanel Prod / Meta API / TikTok Ads Manager · Nota metodológica
  </div>
</div>
```

### 9. Section Title (separador visual)

```html
<div class="section-title" style="margin-top:28px;">
  <span class="dot" style="background:var(--purple-500);"></span>
  Título de Sección
  <span style="font-size:12px;color:var(--gray-500);font-weight:400;">Subtítulo explicativo opcional</span>
</div>
```

### 10. Grid Layouts

```html
<div class="grid-2">...</div>       <!-- 2 columnas iguales -->
<div class="grid-3">...</div>       <!-- 3 columnas iguales -->
<div class="grid-2-1">...</div>     <!-- 2fr + 1fr -->
<div class="grid-1-2">...</div>     <!-- 1fr + 2fr -->
<div class="source-cards">...</div> <!-- 4 columnas (2 en tablet, 1 en mobile) -->
<div class="kpi-grid">...</div>     <!-- auto-fit minmax(220px) -->
```

---

## Arquitectura de Datos JS

### Convenciones de nomenclatura

```javascript
// Diarios (31 o 89 elementos)
const metaDailySpendUSD = [83.91, 84.11, ...];   // Meta gasto diario USD
const ttDailyCostPEN    = [184.22, 191.83, ...]; // TikTok gasto diario PEN
const mxDailyRegs       = [316, 298, ...];       // Mixpanel registros diarios

// Semanales (13 elementos = Q1 completo)
const metaWeeklySpendUSD   = [1832, 1412, ...];
const ttWeeklySpendPEN     = [543, 1115, ...];
const weekLabels           = ['S1 Ene1-7', 'S2 Ene8-14', ...];

// Q2 semanales (4 semanas)
const weekLabelsQ2         = ['S13 Mar26-31','S14 Abr1-6','S15 Abr7-13','S16 Abr14-20'];
const ttQ2WeeklySpendPEN   = [1134, 1134, 159.90, 1102.78];
const ttQ2MicroSpendPEN    = [0, 409, 0, 419.62];
const ttQ2GratisSpendPEN   = [0, 725, 0, 683.16];
const metaQ2WeeklySpendUSD = [108.16, 21.23, 98.32, 0];

// Mensuales
const q1MetaSpendUSD = [7233.67, 2737.29, 2184.69]; // Ene, Feb, Mar
const q1Labels       = ['Enero', 'Febrero', 'Marzo'];

// Embudos (pasos del funnel)
const funnelSteps  = ['Registro', 'Datos Básicos', 'Credit Options', 'Completo'];
const funnelValues = [16293, 12847, 10275, 45];

// Constante de conversión
const USD_PEN = 3.70; // Actualizar según TC vigente
```

### Filtros reactivos (patrón central)

```javascript
// Estado global de filtros
const F = {
  dateFrom: 0,       // índice 0 = día 1 del periodo
  dateTo: 88,        // índice 88 = último día Q1
  channel: ['meta','tiktok','organic'],
  preset: 'q1',      // 'ene' | 'feb' | 'mar' | 'q1' | 'q2'
  week: 'all',
  metric: 'spend',   // 'spend' | 'conv' | 'ctr'
  spendRange: 'all'  // 'all' | 'low' | 'mid' | 'high'
};

// Mapa de índices por preset
function applyPreset(p) {
  const map = { ene:{from:0,to:30}, feb:{from:31,to:58}, mar:{from:59,to:88}, q1:{from:0,to:88} };
  if(map[p]) { F.dateFrom=map[p].from; F.dateTo=map[p].to; F.preset=p; }
  buildCharts();
  updateKPIs();
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.toggle('active', b.dataset.p===p));
}

// Patrón de actualización de KPIs reactivos
function updateKPIs() {
  const slice = metaDailySpendUSD.slice(F.dateFrom, F.dateTo+1);
  const totalSpend = slice.reduce((a,b)=>a+b,0);
  document.getElementById('kpiMetaSpend').textContent = '$' + totalSpend.toLocaleString('en-US',{maximumFractionDigits:0});
}

// Destruir charts antes de redibujar (obligatorio)
const Q1Charts = {};
function buildCharts() {
  Object.values(Q1Charts).forEach(c => c && c.destroy());
  Q1Charts.main = new Chart(document.getElementById('chartQ1Main'), { ... });
}
```

### Chart.js patterns estándar

```javascript
// Chart de línea con múltiples datasets
new Chart(ctx, {
  type: 'line',
  data: {
    labels: dayLabels,
    datasets: [
      {
        label: 'Meta Ads',
        data: metaDailySpendUSD,
        borderColor: '#1877f2',
        backgroundColor: 'rgba(24,119,242,0.08)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3
      },
      {
        label: 'TikTok Ads (PEN)',
        data: ttDailyCostPEN,
        borderColor: '#fe2c55',
        backgroundColor: 'rgba(254,44,85,0.06)',
        fill: true,
        tension: 0.3,
        yAxisID: 'y1'  // eje secundario para moneda diferente
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: c => (c.datasetIndex === 0 ? '$' : 'S/') + c.raw?.toLocaleString('en-US',{maximumFractionDigits:2})
        }
      }
    },
    scales: {
      x: { ticks: { maxTicksLimit: 15 } },
      y:  { title: { display: true, text: 'USD' }, ticks: { callback: v => '$'+v } },
      y1: { position: 'right', title: { display: true, text: 'PEN' }, ticks: { callback: v => 'S/'+v }, grid: { drawOnChartArea: false } }
    }
  }
});

// Bar chart de campaña (agrupado)
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: campaignLabels,
    datasets: [{
      label: 'Inversión S/ PEN',
      data: campaignSpend,
      backgroundColor: ['rgba(124,58,237,0.8)', 'rgba(254,44,85,0.8)', 'rgba(20,184,166,0.8)'],
      borderRadius: 6
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { ticks: { callback: v => 'S/'+v } } }
  }
});

// Doughnut con leyenda personalizada
new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: ['Meta Ads','TikTok Ads','Orgánico','B2B'],
    datasets: [{
      data: [5378, 4022, 4862, 2031],
      backgroundColor: ['rgba(24,119,242,0.85)','rgba(254,44,85,0.85)','rgba(34,197,94,0.85)','rgba(249,115,22,0.8)'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { font: { size: 12 }, padding: 16 } },
      tooltip: { callbacks: { label: c => c.label + ': ' + c.raw.toLocaleString() + ' (' + ((c.raw/c.dataset.data.reduce((a,b)=>a+b,0))*100).toFixed(1)+'%)' } }
    },
    cutout: '65%'
  }
});
```

---

## Cálculos estándar

```javascript
const USD_PEN = 3.70;

// Métricas derivadas
const cpmUSD    = (spendUSD / impressions) * 1000;
const ctrPct    = (clicks / impressions) * 100;
const cpaUSD    = spendUSD / conversions;
const cpaPEN    = spendPEN / conversions;
const regEst    = spendUSD / CPA_HISTORICO;  // usar 0.40 USD si no hay dato

// Conversión de moneda
const spendUSD  = spendPEN / USD_PEN;
const spendPEN  = spendUSD * USD_PEN;

// Tasa de conversión funnel
const convRate  = (step2 / step1) * 100;

// Delta vs periodo anterior
const deltaStr = (curr, prev) => {
  const pct = ((curr - prev) / prev * 100).toFixed(1);
  return (pct > 0 ? '▲ +' : '▼ ') + pct + '%';
};
```

---

## Manejo de datos faltantes / estimados

| Situación | Estrategia | Marcador visual |
|-----------|-----------|-----------------|
| TikTok token vencido | Último dato * días transcurridos; alert amarilla | `~est.`, fondo `#fef9c3` |
| Meta conector desconectado | Marcar `N/A`, nota en footer de tabla | `N/A`, alert naranja |
| Dato parcial (día en curso) | Incluir con aclaración, opacidad 0.75 | `◆ (parcial)` |
| Semana incompleta | Fila con fondo amarillo, label "(en curso)" | `S[n] en curso` |
| Mixpanel sin proyecto | Fallback a último valor conocido | `(sin acceso MCP)` |
| API real confirmado | Label verde, negrita | `(API real)`, fondo `#dcfce7` |

**Símbolos estándar:**
- `✓` — confirmado por API
- `◆` — parcial o dato tardío
- `★` — incluye estimado
- `~est.` — completamente estimado
- `(API real)` — dato confirmado

---

## Flujo de actualización semanal

```
Cada lunes (o al ejecutar scheduled task):

1. RECOLECCIÓN
   a. Mixpanel Run-Query: Credit request created, Landing Page Viewed, Credit options showed, Flow completed
      → dateRange.type:"between", from:"YYYY-MM-DD", to:"YYYY-MM-DD", unit:"day"
   b. Windsor.ai TikTok: get_data(connector:"tiktok", fields:[date,campaign_name,spend,clicks,conversions,impressions], date_from, date_to)
   c. Windsor.ai Meta: get_data(connector:"facebook", ...) si conector activo
   d. Si Windsor falla → documentar en banner + mantener último conocido

2. CÁLCULOS
   - Sumar totales de semana (7 días)
   - CPA = spend / conversions
   - Conv rate = credit_options / credit_requests * 100
   - % cambio vs semana anterior

3. EDITAR HTML (en orden)
   a. <title> → "actualizado [fecha]"
   b. Header .date-range → fecha actualizada
   c. Banner de status → datos completos de la semana
   d. KPI S[n] card → actualizar value + sub + kpi-change
   e. Tabla diaria → agregar filas nuevas + actualizar total
   f. Tabla histórica → nueva fila S[n], actualizar TOTAL
   g. JS arrays → ttQ2WeeklySpendPEN[n], ttQ2MicroSpendPEN[n], etc.

4. COMMIT
   "Dashboard [Empresa]: actualización [fecha] — S[n] [periodo]"

5. ACTUALIZAR MEMORY
   - Registros diarios por día
   - Gasto TikTok por campaña y día
   - Meta si disponible
   - "Próxima actualización: ~[fecha]"
```

---

## Reglas de UX / diseño

### Jerarquía visual por tab

```
1. Alert banner   → estado del update / advertencias críticas (siempre primero)
2. Hero 4-KPI     → métricas ejecutivas (sin scroll)
3. Source cards   → distribución por canal (visual rápido)
4. Gráficas       → tendencias (line > bar para tiempo, doughnut para proporciones)
5. Analysis box   → diagnóstico automático (3 insights en grid)
6. Tablas         → detalle completo, siempre con fila TOTAL al final
```

### Espaciado y bordes

```
card border-radius:    12px (cards grandes) / 8-10px (items internos) / 6px (chips, badges)
card padding:          24px (charts) / 20px 24px (KPI cards) / 16px 20px (analysis box)
sección gap:           24px entre bloques principales
kpi-grid gap:          16px
chart container:       height explícita en px (nunca auto): 250–400px
```

### Indicadores de tendencia

```html
<!-- Más es mejor (registros, conversiones) -->
<div class="kpi-change up">▲ +8.9% vs semana anterior</div>

<!-- Menos es mejor (CPA, CPM) -->
<div class="kpi-change up">▲ CPA bajó -12% — mejora</div>

<!-- Peor que el anterior -->
<div class="kpi-change down">▼ -21% vs S14 · investigar causa</div>

<!-- Neutro / informativo -->
<div class="kpi-change" style="color:var(--purple-600);font-weight:600;">S16 en curso (Abr 14–20)</div>
```

### Notas de fuente (siempre al pie de cada chart/tabla)

```html
<div style="margin-top:8px;font-size:12px;color:var(--gray-500);">
  Fuente: [API / Mixpanel Prod / TikTok Ads Manager / Estimado].
  [Metodología]. [Advertencias sobre estimados].
</div>
```

---

## Checklist de creación desde cero

```
SETUP
[ ] Un solo archivo .html — sin carpetas de assets
[ ] Inter desde Google Fonts (pesos 300-800)
[ ] Chart.js 4.4.1 desde CDN jsdelivr
[ ] chartjs-plugin-annotation desde CDN
[ ] CSS variables completas en :root
[ ] Dark mode variables en [data-theme="dark"]
[ ] Responsive breakpoints: 1024px y 640px

ESTRUCTURA
[ ] Header con gradiente púrpura + title + date-range pill + darkToggle
[ ] Tabs sticky con ID únicos por tab
[ ] Función showTab() que alterna display:block/none y clases .active

CADA TAB
[ ] filter-panel con período + canal + fecha actualización
[ ] Alert banner de estado (primero visible)
[ ] Mínimo 4 KPI cards relevantes
[ ] Al menos 1 chart
[ ] Notas de fuente al pie de cada card

DATOS JS
[ ] Todos los datos como const inline en <script>
[ ] Ningún fetch() ni llamada externa a runtime
[ ] Canvas con IDs únicos (nunca repetidos)
[ ] Height explícita en todos los contenedores de charts
[ ] Destruir charts antes de redibujar (reactive)

CALIDAD
[ ] Fila TOTAL en todas las tablas
[ ] class="num" en columnas numéricas (alineación derecha)
[ ] Marcadores de estimado (★ ◆ ~est.) en datos no confirmados
[ ] Nota metodológica en cada gráfica
[ ] Probar tabs en mobile (overflow-x: auto en .tabs)
[ ] Verificar dark mode
```

---

## Scheduled Task (configuración)

**Archivo:** `C:\Users\juaga\.claude\scheduled-tasks\analitica-dashboard-2026\SKILL.md`

**Frencuencia recomendada:** Lunes ~9am (inicio de semana, datos de semana anterior confirmados)

**Qué hace:**
1. Consulta Mixpanel (Run-Query) para la semana cerrada
2. Consulta Windsor.ai TikTok (y Meta si disponible)
3. Edita dashboard_marzo_2026.html con los nuevos datos
4. Commit al repo
5. Actualiza memory `project_reevalua_analytics.md`

---

## Estructura de archivos del proyecto

```
C:\Users\juaga\Documents\CLAUDE\
├── projects/
│   └── dashboard-reevalua/
│       └── dashboard_marzo_2026.html    ← dashboard principal
├── skills/
│   ├── reevalua-dashboard-v2.skill.md   ← esta skill
│   └── reevalua_dashboard_skill.md      ← skill v1 (referencia)
├── assets/
│   └── dashboard-prompts-guide.md       ← guía de prompts por tab
└── .claude/
    ├── memory/
    │   └── project_reevalua_analytics.md
    └── scheduled-tasks/
        └── analitica-dashboard-2026/
            └── SKILL.md
```
