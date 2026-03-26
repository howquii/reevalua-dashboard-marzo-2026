// ============================================
// GOOGLE MCP SERVER - Search Console + GA4
// Reevalúa
// ============================================
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const axios = require("axios");
const { z } = require("zod");
const fs = require("fs");

let ACCESS_TOKEN = process.env.GOOGLE_ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SITE_URL = process.env.GOOGLE_SITE_URL || "https://reevalua.com/";
const GA4_PROPERTY = process.env.GOOGLE_GA4_PROPERTY_ID;

const server = new McpServer({
  name: "google-seo",
  version: "1.0.0",
});

// ── Auto-refresh del token ──
async function refreshAccessToken() {
  if (!REFRESH_TOKEN) throw new Error("No hay refresh token. Ejecuta 'npm run auth' primero.");
  try {
    const res = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    });
    ACCESS_TOKEN = res.data.access_token;
    // Guardar en .env
    const envPath = path.join(__dirname, ".env");
    let envContent = fs.readFileSync(envPath, "utf-8");
    envContent = envContent.replace(/GOOGLE_ACCESS_TOKEN=.*/, `GOOGLE_ACCESS_TOKEN=${ACCESS_TOKEN}`);
    fs.writeFileSync(envPath, envContent);
    return ACCESS_TOKEN;
  } catch (err) {
    throw new Error(`Error refreshing token: ${err.response?.data?.error_description || err.message}`);
  }
}

// ── Helper para llamadas a Google APIs ──
async function googleGet(url, params = {}) {
  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      params,
    });
    return res.data;
  } catch (err) {
    if (err.response?.status === 401) {
      // Token expirado, refrescar
      await refreshAccessToken();
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        params,
      });
      return res.data;
    }
    const msg = err.response?.data?.error?.message || err.message;
    throw new Error(`Google API Error: ${msg}`);
  }
}

async function googlePost(url, body = {}) {
  try {
    const res = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (err) {
    if (err.response?.status === 401) {
      await refreshAccessToken();
      const res = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
      return res.data;
    }
    const msg = err.response?.data?.error?.message || err.message;
    throw new Error(`Google API Error: ${msg}`);
  }
}

function fmtNum(val) {
  if (!val) return "0";
  return parseFloat(val).toLocaleString();
}

function fmtPct(val) {
  if (!val) return "0.00%";
  return (parseFloat(val) * 100).toFixed(2) + "%";
}

// ╔══════════════════════════════════════════════╗
// ║        GOOGLE SEARCH CONSOLE                 ║
// ╚══════════════════════════════════════════════╝

// ══════════════════════════════════════════════
// SC-1: Queries de búsqueda (Performance)
// ══════════════════════════════════════════════
server.tool(
  "sc_search_queries",
  "Muestra las queries de búsqueda de Google Search Console: posición, clics, impresiones y CTR para reevalua.com",
  {
    since: z.string().describe("Fecha inicio YYYY-MM-DD, ej: 2025-03-01"),
    until: z.string().describe("Fecha fin YYYY-MM-DD, ej: 2025-03-17"),
    limit: z.number().default(25).describe("Cantidad de queries a mostrar (max 25000)"),
  },
  async ({ since, until, limit }) => {
    const data = await googlePost(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      {
        startDate: since,
        endDate: until,
        dimensions: ["query"],
        rowLimit: limit,
        type: "web",
      }
    );

    const rows = data.rows || [];
    if (rows.length === 0) {
      return { content: [{ type: "text", text: `Sin datos de Search Console para ${since} al ${until}.` }] };
    }

    const lines = rows.map((r, i) => {
      return `${i + 1}. "${r.keys[0]}"
   Clics: ${fmtNum(r.clicks)} | Impresiones: ${fmtNum(r.impressions)} | CTR: ${fmtPct(r.ctr)} | Posición: ${r.position.toFixed(1)}`;
    });

    const totalClics = rows.reduce((s, r) => s + r.clicks, 0);
    const totalImpr = rows.reduce((s, r) => s + r.impressions, 0);

    return {
      content: [
        {
          type: "text",
          text: `🔍 SEARCH CONSOLE — Queries (${since} al ${until})\n🖱️ Total clics: ${fmtNum(totalClics)} | 👁️ Total impresiones: ${fmtNum(totalImpr)}\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// SC-2: Páginas más visitadas desde Google
// ══════════════════════════════════════════════
server.tool(
  "sc_top_pages",
  "Muestra las páginas de reevalua.com con más tráfico orgánico desde Google",
  {
    since: z.string().describe("Fecha inicio YYYY-MM-DD"),
    until: z.string().describe("Fecha fin YYYY-MM-DD"),
    limit: z.number().default(20).describe("Cantidad de páginas"),
  },
  async ({ since, until, limit }) => {
    const data = await googlePost(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      {
        startDate: since,
        endDate: until,
        dimensions: ["page"],
        rowLimit: limit,
        type: "web",
      }
    );

    const rows = data.rows || [];
    if (rows.length === 0) {
      return { content: [{ type: "text", text: "Sin datos de páginas." }] };
    }

    const lines = rows.map((r, i) => {
      const page = r.keys[0].replace(SITE_URL, "/").replace("https://reevalua.com", "");
      return `${i + 1}. ${page || "/"}
   Clics: ${fmtNum(r.clicks)} | Impresiones: ${fmtNum(r.impressions)} | CTR: ${fmtPct(r.ctr)} | Posición: ${r.position.toFixed(1)}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `📄 SEARCH CONSOLE — Top Páginas (${since} al ${until})\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// SC-3: Rendimiento por país
// ══════════════════════════════════════════════
server.tool(
  "sc_by_country",
  "Rendimiento de búsqueda de Google por país",
  {
    since: z.string().describe("Fecha inicio YYYY-MM-DD"),
    until: z.string().describe("Fecha fin YYYY-MM-DD"),
  },
  async ({ since, until }) => {
    const data = await googlePost(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      {
        startDate: since,
        endDate: until,
        dimensions: ["country"],
        rowLimit: 20,
        type: "web",
      }
    );

    const rows = data.rows || [];
    if (rows.length === 0) {
      return { content: [{ type: "text", text: "Sin datos por país." }] };
    }

    const lines = rows.map((r, i) => {
      return `${i + 1}. 🌎 ${r.keys[0]} — Clics: ${fmtNum(r.clicks)} | Impresiones: ${fmtNum(r.impressions)} | CTR: ${fmtPct(r.ctr)} | Posición: ${r.position.toFixed(1)}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `🌍 SEARCH CONSOLE — Por País (${since} al ${until})\n\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// SC-4: Rendimiento por dispositivo
// ══════════════════════════════════════════════
server.tool(
  "sc_by_device",
  "Rendimiento de búsqueda de Google por tipo de dispositivo (móvil, desktop, tablet)",
  {
    since: z.string().describe("Fecha inicio YYYY-MM-DD"),
    until: z.string().describe("Fecha fin YYYY-MM-DD"),
  },
  async ({ since, until }) => {
    const data = await googlePost(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      {
        startDate: since,
        endDate: until,
        dimensions: ["device"],
        type: "web",
      }
    );

    const rows = data.rows || [];
    if (rows.length === 0) {
      return { content: [{ type: "text", text: "Sin datos por dispositivo." }] };
    }

    const deviceEmoji = { MOBILE: "📱", DESKTOP: "💻", TABLET: "📟" };
    const lines = rows.map((r) => {
      const device = r.keys[0];
      return `${deviceEmoji[device] || "📊"} ${device} — Clics: ${fmtNum(r.clicks)} | Impresiones: ${fmtNum(r.impressions)} | CTR: ${fmtPct(r.ctr)} | Posición: ${r.position.toFixed(1)}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `📱 SEARCH CONSOLE — Por Dispositivo (${since} al ${until})\n\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// SC-5: Tendencia diaria
// ══════════════════════════════════════════════
server.tool(
  "sc_daily_trend",
  "Tendencia diaria de clics e impresiones en Google Search",
  {
    since: z.string().describe("Fecha inicio YYYY-MM-DD"),
    until: z.string().describe("Fecha fin YYYY-MM-DD"),
  },
  async ({ since, until }) => {
    const data = await googlePost(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      {
        startDate: since,
        endDate: until,
        dimensions: ["date"],
        type: "web",
      }
    );

    const rows = data.rows || [];
    if (rows.length === 0) {
      return { content: [{ type: "text", text: "Sin datos diarios." }] };
    }

    rows.sort((a, b) => a.keys[0].localeCompare(b.keys[0]));

    const lines = rows.map((r) => {
      return `📆 ${r.keys[0]} | Clics: ${fmtNum(r.clicks)} | Impr: ${fmtNum(r.impressions)} | CTR: ${fmtPct(r.ctr)} | Pos: ${r.position.toFixed(1)}`;
    });

    const totalClics = rows.reduce((s, r) => s + r.clicks, 0);
    const totalImpr = rows.reduce((s, r) => s + r.impressions, 0);

    return {
      content: [
        {
          type: "text",
          text: `📈 SEARCH CONSOLE — Tendencia Diaria (${since} al ${until})\n🖱️ Total clics: ${fmtNum(totalClics)} | 👁️ Total impresiones: ${fmtNum(totalImpr)}\n\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// SC-6: Estado de indexación
// ══════════════════════════════════════════════
server.tool(
  "sc_sitemaps",
  "Muestra los sitemaps enviados a Google y su estado de indexación",
  {},
  async () => {
    const data = await googleGet(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps`
    );

    const sitemaps = data.sitemap || [];
    if (sitemaps.length === 0) {
      return { content: [{ type: "text", text: "No hay sitemaps enviados a Search Console." }] };
    }

    const lines = sitemaps.map((s) => {
      const submitted = s.lastSubmitted ? new Date(s.lastSubmitted).toLocaleDateString() : "N/A";
      const downloaded = s.lastDownloaded ? new Date(s.lastDownloaded).toLocaleDateString() : "N/A";
      return `• ${s.path}
  Tipo: ${s.type} | Enviado: ${submitted} | Descargado: ${downloaded}
  URLs: ${s.contents?.map((c) => `${c.type}: ${c.submitted} enviadas / ${c.indexed || "?"} indexadas`).join(", ") || "N/A"}
  Errores: ${s.errors || 0} | Advertencias: ${s.warnings || 0}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `🗺️ SITEMAPS DE SEARCH CONSOLE\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// SC-7: Query + Página combinado (oportunidades SEO)
// ══════════════════════════════════════════════
server.tool(
  "sc_query_page",
  "Muestra qué queries llevan a qué páginas — útil para encontrar oportunidades SEO (queries con alta impresión pero bajo CTR)",
  {
    since: z.string().describe("Fecha inicio YYYY-MM-DD"),
    until: z.string().describe("Fecha fin YYYY-MM-DD"),
    min_impressions: z.number().default(10).describe("Filtrar queries con mínimo de impresiones"),
    max_position: z.number().default(20).describe("Solo queries con posición hasta N (ej: 20 = primeras 2 páginas)"),
    limit: z.number().default(30).describe("Cantidad de resultados"),
  },
  async ({ since, until, min_impressions, max_position, limit }) => {
    const data = await googlePost(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      {
        startDate: since,
        endDate: until,
        dimensions: ["query", "page"],
        rowLimit: 5000,
        type: "web",
      }
    );

    let rows = data.rows || [];
    // Filtrar por impresiones mínimas y posición máxima
    rows = rows.filter((r) => r.impressions >= min_impressions && r.position <= max_position);
    // Ordenar por impresiones desc (oportunidades con más volumen primero)
    rows.sort((a, b) => b.impressions - a.impressions);
    rows = rows.slice(0, limit);

    if (rows.length === 0) {
      return { content: [{ type: "text", text: "No se encontraron oportunidades con esos filtros." }] };
    }

    const lines = rows.map((r, i) => {
      const page = r.keys[1].replace(SITE_URL, "/").replace("https://reevalua.com", "");
      const opportunity = r.position > 3 && r.position <= 10 ? " ⭐ OPORTUNIDAD" : r.position > 10 ? " 🎯 MEJORAR" : " ✅ TOP 3";
      return `${i + 1}. "${r.keys[0]}"${opportunity}
   Página: ${page || "/"}
   Pos: ${r.position.toFixed(1)} | Clics: ${fmtNum(r.clicks)} | Impr: ${fmtNum(r.impressions)} | CTR: ${fmtPct(r.ctr)}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `🎯 OPORTUNIDADES SEO — Query + Página (${since} al ${until})\n⭐ = Posición 4-10 (oportunidad de subir a top 3)\n🎯 = Posición 11-20 (mejorar contenido)\n✅ = Ya en top 3\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ╔══════════════════════════════════════════════╗
// ║        GOOGLE ANALYTICS GA4                  ║
// ╚══════════════════════════════════════════════╝

// ══════════════════════════════════════════════
// GA-1: Resumen general de tráfico
// ══════════════════════════════════════════════
server.tool(
  "ga_overview",
  "Resumen general de tráfico de Google Analytics GA4: usuarios, sesiones, conversiones, bounce rate",
  {
    since: z.string().describe("Fecha inicio YYYY-MM-DD"),
    until: z.string().describe("Fecha fin YYYY-MM-DD"),
  },
  async ({ since, until }) => {
    if (!GA4_PROPERTY) {
      return { content: [{ type: "text", text: "⚠️ Falta GOOGLE_GA4_PROPERTY_ID en .env. Ejecuta 'npm run auth' de nuevo." }] };
    }

    const data = await googlePost(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY}:runReport`,
      {
        dateRanges: [{ startDate: since, endDate: until }],
        metrics: [
          { name: "activeUsers" },
          { name: "newUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
          { name: "conversions" },
          { name: "totalRevenue" },
        ],
      }
    );

    const row = data.rows?.[0];
    if (!row) {
      return { content: [{ type: "text", text: "Sin datos de GA4 para ese período." }] };
    }

    const v = row.metricValues.map((m) => m.value);
    const duration = parseFloat(v[5] || 0);
    const mins = Math.floor(duration / 60);
    const secs = Math.round(duration % 60);

    return {
      content: [
        {
          type: "text",
          text: `📊 GOOGLE ANALYTICS GA4 — Resumen (${since} al ${until})\n\n👥 Usuarios activos: ${fmtNum(v[0])}\n🆕 Usuarios nuevos: ${fmtNum(v[1])}\n📱 Sesiones: ${fmtNum(v[2])}\n📄 Páginas vistas: ${fmtNum(v[3])}\n↩️ Bounce rate: ${(parseFloat(v[4]) * 100).toFixed(1)}%\n⏱️ Duración media: ${mins}m ${secs}s\n🎯 Conversiones: ${fmtNum(v[6])}\n💰 Revenue: $ ${parseFloat(v[7] || 0).toFixed(2)}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// GA-2: Fuentes de tráfico
// ══════════════════════════════════════════════
server.tool(
  "ga_traffic_sources",
  "Muestra las fuentes de tráfico (orgánico, directo, social, referral, paid) de GA4",
  {
    since: z.string().describe("Fecha inicio YYYY-MM-DD"),
    until: z.string().describe("Fecha fin YYYY-MM-DD"),
  },
  async ({ since, until }) => {
    if (!GA4_PROPERTY) {
      return { content: [{ type: "text", text: "⚠️ Falta GOOGLE_GA4_PROPERTY_ID en .env." }] };
    }

    const data = await googlePost(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY}:runReport`,
      {
        dateRanges: [{ startDate: since, endDate: until }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "conversions" },
          { name: "bounceRate" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 15,
      }
    );

    const rows = data.rows || [];
    if (rows.length === 0) {
      return { content: [{ type: "text", text: "Sin datos de fuentes de tráfico." }] };
    }

    const channelEmoji = {
      "Organic Search": "🔍",
      "Direct": "🔗",
      "Organic Social": "📱",
      "Paid Search": "💰",
      "Paid Social": "💳",
      "Referral": "🌐",
      "Email": "📧",
      "Display": "🖼️",
    };

    const lines = rows.map((r, i) => {
      const channel = r.dimensionValues[0].value;
      const emoji = channelEmoji[channel] || "📊";
      const v = r.metricValues.map((m) => m.value);
      return `${i + 1}. ${emoji} ${channel}\n   Usuarios: ${fmtNum(v[0])} | Sesiones: ${fmtNum(v[1])} | Conversiones: ${fmtNum(v[2])} | Bounce: ${(parseFloat(v[3]) * 100).toFixed(1)}%`;
    });

    return {
      content: [
        {
          type: "text",
          text: `🌐 GA4 — Fuentes de Tráfico (${since} al ${until})\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// GA-3: Páginas más vistas
// ══════════════════════════════════════════════
server.tool(
  "ga_top_pages",
  "Páginas más vistas de reevalua.com en Google Analytics GA4",
  {
    since: z.string().describe("Fecha inicio YYYY-MM-DD"),
    until: z.string().describe("Fecha fin YYYY-MM-DD"),
    limit: z.number().default(20).describe("Cantidad de páginas"),
  },
  async ({ since, until, limit }) => {
    if (!GA4_PROPERTY) {
      return { content: [{ type: "text", text: "⚠️ Falta GOOGLE_GA4_PROPERTY_ID en .env." }] };
    }

    const data = await googlePost(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY}:runReport`,
      {
        dateRanges: [{ startDate: since, endDate: until }],
        dimensions: [{ name: "pagePath" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "activeUsers" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit,
      }
    );

    const rows = data.rows || [];
    if (rows.length === 0) {
      return { content: [{ type: "text", text: "Sin datos de páginas." }] };
    }

    const lines = rows.map((r, i) => {
      const page = r.dimensionValues[0].value;
      const v = r.metricValues.map((m) => m.value);
      const duration = parseFloat(v[2] || 0);
      const mins = Math.floor(duration / 60);
      const secs = Math.round(duration % 60);
      return `${i + 1}. ${page}\n   Vistas: ${fmtNum(v[0])} | Usuarios: ${fmtNum(v[1])} | Duración: ${mins}m ${secs}s | Bounce: ${(parseFloat(v[3]) * 100).toFixed(1)}%`;
    });

    return {
      content: [
        {
          type: "text",
          text: `📄 GA4 — Top Páginas (${since} al ${until})\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// GA-4: Tendencia diaria de usuarios
// ══════════════════════════════════════════════
server.tool(
  "ga_daily_trend",
  "Tendencia diaria de usuarios y sesiones en GA4",
  {
    since: z.string().describe("Fecha inicio YYYY-MM-DD"),
    until: z.string().describe("Fecha fin YYYY-MM-DD"),
  },
  async ({ since, until }) => {
    if (!GA4_PROPERTY) {
      return { content: [{ type: "text", text: "⚠️ Falta GOOGLE_GA4_PROPERTY_ID en .env." }] };
    }

    const data = await googlePost(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY}:runReport`,
      {
        dateRanges: [{ startDate: since, endDate: until }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "conversions" },
          { name: "screenPageViews" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
        limit: 90,
      }
    );

    const rows = data.rows || [];
    if (rows.length === 0) {
      return { content: [{ type: "text", text: "Sin datos diarios." }] };
    }

    const lines = rows.map((r) => {
      const raw = r.dimensionValues[0].value;
      const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
      const v = r.metricValues.map((m) => m.value);
      return `📆 ${date} | 👥 ${fmtNum(v[0])} usuarios | 📱 ${fmtNum(v[1])} sesiones | 🎯 ${fmtNum(v[2])} conv | 📄 ${fmtNum(v[3])} vistas`;
    });

    const totalUsers = rows.reduce((s, r) => s + parseInt(r.metricValues[0].value || 0), 0);

    return {
      content: [
        {
          type: "text",
          text: `📈 GA4 — Tendencia Diaria (${since} al ${until})\n👥 Total usuarios: ${fmtNum(totalUsers)}\n\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// GA-5: Datos demográficos (país/ciudad)
// ══════════════════════════════════════════════
server.tool(
  "ga_demographics",
  "Datos demográficos de los visitantes: países y ciudades principales",
  {
    since: z.string().describe("Fecha inicio YYYY-MM-DD"),
    until: z.string().describe("Fecha fin YYYY-MM-DD"),
    dimension: z.enum(["country", "city"]).default("country").describe("Ver por país o ciudad"),
  },
  async ({ since, until, dimension }) => {
    if (!GA4_PROPERTY) {
      return { content: [{ type: "text", text: "⚠️ Falta GOOGLE_GA4_PROPERTY_ID en .env." }] };
    }

    const data = await googlePost(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY}:runReport`,
      {
        dateRanges: [{ startDate: since, endDate: until }],
        dimensions: [{ name: dimension }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "conversions" },
        ],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 20,
      }
    );

    const rows = data.rows || [];
    if (rows.length === 0) {
      return { content: [{ type: "text", text: "Sin datos demográficos." }] };
    }

    const lines = rows.map((r, i) => {
      const name = r.dimensionValues[0].value;
      const v = r.metricValues.map((m) => m.value);
      return `${i + 1}. 🌎 ${name} — Usuarios: ${fmtNum(v[0])} | Sesiones: ${fmtNum(v[1])} | Conversiones: ${fmtNum(v[2])}`;
    });

    const label = dimension === "country" ? "País" : "Ciudad";
    return {
      content: [
        {
          type: "text",
          text: `🌍 GA4 — Por ${label} (${since} al ${until})\n\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// GA-6: Eventos y conversiones
// ══════════════════════════════════════════════
server.tool(
  "ga_events",
  "Muestra los eventos principales de GA4 (conversiones, clics, form_submit, etc.)",
  {
    since: z.string().describe("Fecha inicio YYYY-MM-DD"),
    until: z.string().describe("Fecha fin YYYY-MM-DD"),
  },
  async ({ since, until }) => {
    if (!GA4_PROPERTY) {
      return { content: [{ type: "text", text: "⚠️ Falta GOOGLE_GA4_PROPERTY_ID en .env." }] };
    }

    const data = await googlePost(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY}:runReport`,
      {
        dateRanges: [{ startDate: since, endDate: until }],
        dimensions: [{ name: "eventName" }],
        metrics: [
          { name: "eventCount" },
          { name: "totalUsers" },
        ],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 30,
      }
    );

    const rows = data.rows || [];
    if (rows.length === 0) {
      return { content: [{ type: "text", text: "Sin datos de eventos." }] };
    }

    const lines = rows.map((r, i) => {
      const event = r.dimensionValues[0].value;
      const v = r.metricValues.map((m) => m.value);
      return `${i + 1}. 🎯 ${event} — Cantidad: ${fmtNum(v[0])} | Usuarios: ${fmtNum(v[1])}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `🎯 GA4 — Eventos (${since} al ${until})\n\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// GA-7: Realtime (usuarios ahora)
// ══════════════════════════════════════════════
server.tool(
  "ga_realtime",
  "Muestra los usuarios activos en este momento en reevalua.com (tiempo real)",
  {},
  async () => {
    if (!GA4_PROPERTY) {
      return { content: [{ type: "text", text: "⚠️ Falta GOOGLE_GA4_PROPERTY_ID en .env." }] };
    }

    const data = await googlePost(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY}:runRealtimeReport`,
      {
        dimensions: [{ name: "unifiedScreenName" }],
        metrics: [{ name: "activeUsers" }],
        limit: 10,
      }
    );

    const rows = data.rows || [];
    const totalUsers = rows.reduce((s, r) => s + parseInt(r.metricValues[0].value || 0), 0);

    if (totalUsers === 0) {
      return { content: [{ type: "text", text: "👀 No hay usuarios activos en este momento." }] };
    }

    const lines = rows.map((r) => {
      return `  📄 ${r.dimensionValues[0].value} — ${fmtNum(r.metricValues[0].value)} usuarios`;
    });

    return {
      content: [
        {
          type: "text",
          text: `⚡ GA4 TIEMPO REAL\n\n👥 ${fmtNum(totalUsers)} usuarios activos ahora\n\nPáginas que están viendo:\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

// ── Iniciar servidor ──
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Google MCP Server (Search Console + GA4) iniciado correctamente");
}

main().catch((err) => {
  console.error("❌ Error al iniciar:", err);
  process.exit(1);
});
