// ============================================
// TIKTOK ADS MCP SERVER - Reevalúa
// ============================================
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const axios = require("axios");
const { z } = require("zod");

const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
const ADVERTISER_ID = process.env.TIKTOK_ADVERTISER_ID;
const BASE_URL = "https://business-api.tiktok.com/open_api/v1.3";

const server = new McpServer({
  name: "tiktok-ads",
  version: "1.0.0",
});

// ── Helpers para la API de TikTok ──
async function tiktokGet(endpoint, params = {}) {
  try {
    const res = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: { "Access-Token": ACCESS_TOKEN },
      params: { advertiser_id: ADVERTISER_ID, ...params },
    });
    if (res.data.code !== 0) {
      throw new Error(`TikTok API Error (${res.data.code}): ${res.data.message}`);
    }
    return res.data.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`TikTok API Error: ${msg}`);
  }
}

async function tiktokPost(endpoint, body = {}) {
  try {
    const res = await axios.post(
      `${BASE_URL}${endpoint}`,
      { advertiser_id: ADVERTISER_ID, ...body },
      { headers: { "Access-Token": ACCESS_TOKEN, "Content-Type": "application/json" } }
    );
    if (res.data.code !== 0) {
      throw new Error(`TikTok API Error (${res.data.code}): ${res.data.message}`);
    }
    return res.data.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`TikTok API Error: ${msg}`);
  }
}

// Formatear moneda (TikTok usa valores decimales directos, en USD por defecto)
function fmtMoney(val) {
  if (!val) return "N/A";
  return `$ ${parseFloat(val).toFixed(2)}`;
}

function fmtNum(val) {
  if (!val) return "0";
  return parseInt(val).toLocaleString();
}

// ══════════════════════════════════════════════
// 1. CONSULTAR CAMPAÑAS
// ══════════════════════════════════════════════
server.tool(
  "get_campaigns",
  "Lista todas las campañas de TikTok Ads con estado, presupuesto y objetivo",
  {
    status: z
      .enum(["ACTIVE", "PAUSED", "ALL", "DELETED", "NOT_DELETE"])
      .default("ALL")
      .describe("Filtrar por estado: ACTIVE, PAUSED, ALL, NOT_DELETE"),
  },
  async ({ status }) => {
    const params = { page_size: 100, page: 1 };
    if (status !== "ALL") {
      params.filtering = JSON.stringify({
        primary_status: status,
      });
    }

    const data = await tiktokGet("/campaign/get/", params);
    const campaigns = data.list || [];

    if (campaigns.length === 0) {
      return { content: [{ type: "text", text: "No se encontraron campañas." }] };
    }

    const lines = campaigns.map((c) => {
      const budget =
        c.budget_mode === "BUDGET_MODE_DAY"
          ? `Presupuesto diario: ${fmtMoney(c.budget)}`
          : c.budget_mode === "BUDGET_MODE_TOTAL"
          ? `Presupuesto total: ${fmtMoney(c.budget)}`
          : "Sin presupuesto";
      return `• ${c.campaign_name}
  ID: ${c.campaign_id}
  Estado: ${c.primary_status || c.operation_status} | ${budget}
  Objetivo: ${c.objective_type || "N/A"}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `📊 CAMPAÑAS TIKTOK (${campaigns.length} encontradas)\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// 2. VER AD GROUPS DE UNA CAMPAÑA
// ══════════════════════════════════════════════
server.tool(
  "get_adgroups",
  "Muestra los grupos de anuncios (Ad Groups) de una campaña o de toda la cuenta",
  {
    campaign_id: z.string().optional().describe("ID de campaña para filtrar (opcional)"),
  },
  async ({ campaign_id }) => {
    const params = { page_size: 100, page: 1 };
    if (campaign_id) {
      params.filtering = JSON.stringify({ campaign_ids: [campaign_id] });
    }

    const data = await tiktokGet("/adgroup/get/", params);
    const adgroups = data.list || [];

    if (adgroups.length === 0) {
      return { content: [{ type: "text", text: "No se encontraron Ad Groups." }] };
    }

    const lines = adgroups.map((ag) => {
      const budget =
        ag.budget_mode === "BUDGET_MODE_DAY"
          ? `${fmtMoney(ag.budget)}/día`
          : ag.budget_mode === "BUDGET_MODE_TOTAL"
          ? `${fmtMoney(ag.budget)} total`
          : "Sin presupuesto";
      return `• ${ag.adgroup_name}
  ID: ${ag.adgroup_id} | Campaña: ${ag.campaign_id}
  Estado: ${ag.primary_status || ag.operation_status} | Presupuesto: ${budget}
  Puja: ${ag.bid_type || "N/A"} ${ag.bid_price ? `- ${fmtMoney(ag.bid_price)}` : ""}
  Optimización: ${ag.optimization_goal || "N/A"}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `🎯 AD GROUPS TIKTOK (${adgroups.length} encontrados)\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// 3. VER ANUNCIOS
// ══════════════════════════════════════════════
server.tool(
  "get_ads",
  "Lista los anuncios de TikTok Ads con su estado y creative",
  {
    campaign_id: z.string().optional().describe("Filtrar por campaña (opcional)"),
    adgroup_id: z.string().optional().describe("Filtrar por Ad Group (opcional)"),
  },
  async ({ campaign_id, adgroup_id }) => {
    const params = { page_size: 100, page: 1 };
    const filtering = {};
    if (campaign_id) filtering.campaign_ids = [campaign_id];
    if (adgroup_id) filtering.adgroup_ids = [adgroup_id];
    if (Object.keys(filtering).length > 0) {
      params.filtering = JSON.stringify(filtering);
    }

    const data = await tiktokGet("/ad/get/", params);
    const ads = data.list || [];

    if (ads.length === 0) {
      return { content: [{ type: "text", text: "No se encontraron anuncios." }] };
    }

    const lines = ads.map((ad) => {
      return `• ${ad.ad_name}
  ID: ${ad.ad_id} | Ad Group: ${ad.adgroup_id}
  Estado: ${ad.primary_status || ad.operation_status}
  Texto: "${ad.ad_text || "Sin texto"}"
  CTA: ${ad.call_to_action || "N/A"}
  Landing: ${ad.landing_page_url || "N/A"}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `📣 ANUNCIOS TIKTOK (${ads.length} encontrados)\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// 4. MÉTRICAS / REPORTES DE RENDIMIENTO
// ══════════════════════════════════════════════
server.tool(
  "get_insights",
  "Obtiene métricas de rendimiento (gasto, impresiones, clics, CTR, CPM, CPC, conversiones) por campaña, adgroup o anuncio",
  {
    since: z.string().describe("Fecha inicio YYYY-MM-DD, ej: 2025-03-01"),
    until: z.string().describe("Fecha fin YYYY-MM-DD, ej: 2025-03-17"),
    level: z
      .enum(["AUCTION_CAMPAIGN", "AUCTION_ADGROUP", "AUCTION_AD"])
      .default("AUCTION_CAMPAIGN")
      .describe("Nivel: AUCTION_CAMPAIGN, AUCTION_ADGROUP, o AUCTION_AD"),
  },
  async ({ since, until, level }) => {
    const metrics = [
      "campaign_name",
      "adgroup_name",
      "ad_name",
      "spend",
      "impressions",
      "clicks",
      "ctr",
      "cpm",
      "cpc",
      "reach",
      "conversion",
      "cost_per_conversion",
      "conversion_rate",
    ];

    const dimensions = ["stat_time_day"];

    const body = {
      report_type: "BASIC",
      data_level: level,
      dimensions: JSON.stringify(dimensions),
      metrics: JSON.stringify(metrics),
      start_date: since,
      end_date: until,
      page_size: 100,
      page: 1,
    };

    const data = await tiktokGet("/report/integrated/get/", body);
    const rows = data.list || [];

    if (rows.length === 0) {
      return {
        content: [{ type: "text", text: `Sin datos para el período ${since} al ${until}.` }],
      };
    }

    // Agrupar por nombre (sumando métricas)
    const grouped = {};
    rows.forEach((row) => {
      const m = row.metrics;
      const name = m.campaign_name || m.adgroup_name || m.ad_name || "Sin nombre";
      if (!grouped[name]) {
        grouped[name] = {
          spend: 0, impressions: 0, clicks: 0, reach: 0,
          conversion: 0, ctr: 0, cpm: 0, cpc: 0,
          cost_per_conversion: 0, count: 0,
        };
      }
      const g = grouped[name];
      g.spend += parseFloat(m.spend || 0);
      g.impressions += parseInt(m.impressions || 0);
      g.clicks += parseInt(m.clicks || 0);
      g.reach += parseInt(m.reach || 0);
      g.conversion += parseInt(m.conversion || 0);
      g.count++;
    });

    const lines = Object.entries(grouped).map(([name, g]) => {
      const ctr = g.impressions > 0 ? ((g.clicks / g.impressions) * 100).toFixed(2) : "0.00";
      const cpm = g.impressions > 0 ? ((g.spend / g.impressions) * 1000).toFixed(2) : "0.00";
      const cpc = g.clicks > 0 ? (g.spend / g.clicks).toFixed(2) : "0.00";
      const cpa = g.conversion > 0 ? (g.spend / g.conversion).toFixed(2) : "N/A";
      return `• ${name}
  Gasto: ${fmtMoney(g.spend)} | Alcance: ${fmtNum(g.reach)}
  Impresiones: ${fmtNum(g.impressions)} | Clics: ${fmtNum(g.clicks)}
  CTR: ${ctr}% | CPM: ${fmtMoney(cpm)} | CPC: ${fmtMoney(cpc)}
  Conversiones: ${fmtNum(g.conversion)} | CPA: ${cpa === "N/A" ? cpa : fmtMoney(cpa)}`;
    });

    const totalSpend = Object.values(grouped).reduce((s, g) => s + g.spend, 0);
    const totalConv = Object.values(grouped).reduce((s, g) => s + g.conversion, 0);

    return {
      content: [
        {
          type: "text",
          text: `📈 MÉTRICAS TIKTOK ADS — ${since} al ${until}\n💰 Gasto total: ${fmtMoney(totalSpend)} | Conversiones totales: ${fmtNum(totalConv)}\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// 5. RESUMEN DE HOY
// ══════════════════════════════════════════════
server.tool(
  "get_today",
  "Resumen rápido de métricas de TikTok Ads del día de hoy",
  {},
  async () => {
    const today = new Date().toISOString().split("T")[0];

    const body = {
      report_type: "BASIC",
      data_level: "AUCTION_ADVERTISER",
      dimensions: JSON.stringify(["stat_time_day"]),
      metrics: JSON.stringify([
        "spend", "impressions", "clicks", "ctr", "cpm", "cpc",
        "reach", "conversion", "cost_per_conversion",
      ]),
      start_date: today,
      end_date: today,
      page_size: 10,
      page: 1,
    };

    const data = await tiktokGet("/report/integrated/get/", body);
    const rows = data.list || [];

    if (rows.length === 0) {
      return { content: [{ type: "text", text: "Sin datos para hoy todavía." }] };
    }

    const m = rows[0].metrics;
    return {
      content: [
        {
          type: "text",
          text: `📅 TIKTOK ADS — HOY (${today})\n\n💰 Gasto: ${fmtMoney(m.spend)}\n👁️ Alcance: ${fmtNum(m.reach)}\n📢 Impresiones: ${fmtNum(m.impressions)}\n🖱️ Clics: ${fmtNum(m.clicks)}\n📊 CTR: ${parseFloat(m.ctr || 0).toFixed(2)}%\n💲 CPM: ${fmtMoney(m.cpm)}\n🔗 CPC: ${fmtMoney(m.cpc)}\n🎯 Conversiones: ${fmtNum(m.conversion)}\n💵 CPA: ${fmtMoney(m.cost_per_conversion)}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// 6. REPORTE POR DÍAS (tendencia)
// ══════════════════════════════════════════════
server.tool(
  "get_daily_report",
  "Reporte día a día con métricas de rendimiento para ver tendencias",
  {
    since: z.string().describe("Fecha inicio YYYY-MM-DD"),
    until: z.string().describe("Fecha fin YYYY-MM-DD"),
  },
  async ({ since, until }) => {
    const body = {
      report_type: "BASIC",
      data_level: "AUCTION_ADVERTISER",
      dimensions: JSON.stringify(["stat_time_day"]),
      metrics: JSON.stringify([
        "spend", "impressions", "clicks", "ctr", "cpm",
        "reach", "conversion", "cost_per_conversion",
      ]),
      start_date: since,
      end_date: until,
      page_size: 100,
      page: 1,
    };

    const data = await tiktokGet("/report/integrated/get/", body);
    const rows = data.list || [];

    if (rows.length === 0) {
      return {
        content: [{ type: "text", text: `Sin datos para ${since} al ${until}.` }],
      };
    }

    // Ordenar por fecha
    rows.sort((a, b) => a.dimensions.stat_time_day.localeCompare(b.dimensions.stat_time_day));

    const lines = rows.map((row) => {
      const date = row.dimensions.stat_time_day.split(" ")[0];
      const m = row.metrics;
      return `📆 ${date} | Gasto: ${fmtMoney(m.spend)} | Impr: ${fmtNum(m.impressions)} | Clics: ${fmtNum(m.clicks)} | CTR: ${parseFloat(m.ctr || 0).toFixed(2)}% | Conv: ${fmtNum(m.conversion)}`;
    });

    const totalSpend = rows.reduce((s, r) => s + parseFloat(r.metrics.spend || 0), 0);

    return {
      content: [
        {
          type: "text",
          text: `📊 REPORTE DIARIO TIKTOK — ${since} al ${until}\n💰 Gasto total: ${fmtMoney(totalSpend)}\n\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// 7. CREAR CAMPAÑA
// ══════════════════════════════════════════════
server.tool(
  "create_campaign",
  "Crea una nueva campaña en TikTok Ads",
  {
    name: z.string().describe("Nombre de la campaña"),
    objective: z
      .enum([
        "REACH", "TRAFFIC", "VIDEO_VIEWS", "LEAD_GENERATION",
        "COMMUNITY_INTERACTION", "APP_PROMOTION", "WEB_CONVERSIONS",
        "PRODUCT_SALES",
      ])
      .describe("Objetivo de la campaña"),
    budget: z.number().optional().describe("Presupuesto diario en USD (ej: 50). Si no se pone, sin límite"),
    budget_mode: z
      .enum(["BUDGET_MODE_DAY", "BUDGET_MODE_TOTAL", "BUDGET_MODE_INFINITE"])
      .default("BUDGET_MODE_DAY")
      .describe("Tipo de presupuesto"),
  },
  async ({ name, objective, budget, budget_mode }) => {
    const body = {
      campaign_name: name,
      objective_type: objective,
      budget_mode: budget_mode,
    };
    if (budget && budget_mode !== "BUDGET_MODE_INFINITE") {
      body.budget = budget;
    }

    const data = await tiktokPost("/campaign/create/", body);

    return {
      content: [
        {
          type: "text",
          text: `✅ CAMPAÑA CREADA EN TIKTOK\n\n📋 Nombre: ${name}\n🆔 ID: ${data.campaign_id}\n🎯 Objetivo: ${objective}\n💰 Presupuesto: ${budget ? fmtMoney(budget) + (budget_mode === "BUDGET_MODE_DAY" ? "/día" : " total") : "Sin límite"}\n\n📝 Siguiente paso: Crea un Ad Group con 'create_adgroup' usando este campaign_id.`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// 8. CREAR AD GROUP
// ══════════════════════════════════════════════
server.tool(
  "create_adgroup",
  "Crea un grupo de anuncios dentro de una campaña existente",
  {
    campaign_id: z.string().describe("ID de la campaña"),
    name: z.string().describe("Nombre del Ad Group"),
    budget: z.number().describe("Presupuesto diario en USD"),
    bid_price: z.number().optional().describe("Precio de puja (opcional para autobid)"),
    optimization_goal: z
      .enum(["CLICK", "CONVERT", "REACH", "IMPRESSION", "VIDEO_VIEW", "LEAD_GENERATION"])
      .default("CLICK")
      .describe("Objetivo de optimización"),
    placement: z
      .enum(["AUTOMATIC", "TIKTOK"])
      .default("AUTOMATIC")
      .describe("Ubicación: AUTOMATIC o solo TIKTOK"),
    age_groups: z
      .array(z.enum(["AGE_13_17", "AGE_18_24", "AGE_25_34", "AGE_35_44", "AGE_45_54", "AGE_55_100"]))
      .optional()
      .describe("Rangos de edad (opcional)"),
    gender: z.enum(["GENDER_MALE", "GENDER_FEMALE", "GENDER_UNLIMITED"]).default("GENDER_UNLIMITED"),
    schedule_start: z.string().describe("Fecha/hora inicio YYYY-MM-DD HH:MM:SS"),
    schedule_end: z.string().optional().describe("Fecha/hora fin (opcional para continuo)"),
  },
  async ({ campaign_id, name, budget, bid_price, optimization_goal, placement, age_groups, gender, schedule_start, schedule_end }) => {
    const body = {
      campaign_id,
      adgroup_name: name,
      budget_mode: "BUDGET_MODE_DAY",
      budget,
      optimization_goal,
      bid_type: bid_price ? "BID_TYPE_CUSTOM" : "BID_TYPE_NO_BID",
      billing_event: optimization_goal === "CLICK" ? "CPC" : "CPM",
      schedule_type: schedule_end ? "SCHEDULE_START_END" : "SCHEDULE_FROM_NOW",
      schedule_start_time: schedule_start,
      gender,
    };

    if (bid_price) body.bid_price = bid_price;
    if (schedule_end) body.schedule_end_time = schedule_end;
    if (age_groups) body.age_groups = age_groups;

    if (placement === "AUTOMATIC") {
      body.placement_type = "PLACEMENT_TYPE_AUTOMATIC";
    } else {
      body.placement_type = "PLACEMENT_TYPE_NORMAL";
      body.placements = ["PLACEMENT_TIKTOK"];
    }

    const data = await tiktokPost("/adgroup/create/", body);

    return {
      content: [
        {
          type: "text",
          text: `✅ AD GROUP CREADO\n\n📋 Nombre: ${name}\n🆔 ID: ${data.adgroup_id}\n🎯 Optimización: ${optimization_goal}\n💰 Presupuesto: ${fmtMoney(budget)}/día\n📅 Inicio: ${schedule_start}\n\n📝 Siguiente paso: Crea un anuncio con 'create_ad' usando este adgroup_id.`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// 9. CREAR ANUNCIO
// ══════════════════════════════════════════════
server.tool(
  "create_ad",
  "Crea un anuncio dentro de un Ad Group existente",
  {
    adgroup_id: z.string().describe("ID del Ad Group"),
    name: z.string().describe("Nombre del anuncio"),
    ad_text: z.string().describe("Texto principal del anuncio"),
    landing_page_url: z.string().describe("URL de destino, ej: https://reevalua.com/landing"),
    call_to_action: z
      .enum(["LEARN_MORE", "SIGN_UP", "SHOP_NOW", "APPLY_NOW", "CONTACT_US", "DOWNLOAD", "GET_QUOTE"])
      .default("LEARN_MORE")
      .describe("Botón de acción"),
    image_id: z.string().optional().describe("ID de imagen subida previamente (opcional)"),
    video_id: z.string().optional().describe("ID de video subido previamente (opcional)"),
  },
  async ({ adgroup_id, name, ad_text, landing_page_url, call_to_action, image_id, video_id }) => {
    const body = {
      adgroup_id,
      ad_name: name,
      ad_text,
      landing_page_url,
      call_to_action,
      ad_format: video_id ? "SINGLE_VIDEO" : "SINGLE_IMAGE",
    };

    if (video_id) body.video_id = video_id;
    if (image_id) body.image_ids = [image_id];

    const data = await tiktokPost("/ad/create/", body);

    return {
      content: [
        {
          type: "text",
          text: `✅ ANUNCIO CREADO\n\n📋 Nombre: ${name}\n🆔 ID: ${data.ad_id}\n📝 Texto: "${ad_text}"\n🔗 Landing: ${landing_page_url}\n🔘 CTA: ${call_to_action}\n\n⏳ El anuncio entrará en revisión de TikTok antes de activarse.`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// 10. LISTAR AUDIENCIAS PERSONALIZADAS
// ══════════════════════════════════════════════
server.tool(
  "list_audiences",
  "Lista todas las audiencias personalizadas (Custom Audiences) de TikTok Ads",
  {},
  async () => {
    const data = await tiktokGet("/dmp/custom_audience/list/", {
      page_size: 100,
      page: 1,
    });

    const audiences = data.list || [];

    if (audiences.length === 0) {
      return { content: [{ type: "text", text: "No se encontraron audiencias." }] };
    }

    const lines = audiences.map((a) => {
      return `• ${a.custom_audience_name}
  ID: ${a.custom_audience_id}
  Tamaño: ${fmtNum(a.audience_size)} | Tipo: ${a.audience_type || "N/A"}
  Estado: ${a.is_valid ? "Válida" : "Inválida"} | Cobertura: ${a.cover_num ? fmtNum(a.cover_num) : "N/A"}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `👥 AUDIENCIAS TIKTOK (${audiences.length} encontradas)\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// 11. CREAR AUDIENCIA PERSONALIZADA (Customer File)
// ══════════════════════════════════════════════
server.tool(
  "create_audience",
  "Crea una audiencia personalizada subiendo una lista de emails o phone numbers hasheados",
  {
    name: z.string().describe("Nombre de la audiencia, ej: 'Reevalúa - Leads Marzo'"),
    file_type: z
      .enum(["FILE_TYPE_EMAIL", "FILE_TYPE_PHONE"])
      .default("FILE_TYPE_EMAIL")
      .describe("Tipo de datos: emails o teléfonos"),
    data_list: z
      .array(z.string())
      .describe("Lista de emails o teléfonos a incluir, ej: ['user@email.com', 'user2@email.com']"),
  },
  async ({ name, file_type, data_list }) => {
    const crypto = require("crypto");

    // Hashear datos con SHA256
    const hashedList = data_list.map((item) => {
      const normalized = item.trim().toLowerCase();
      return crypto.createHash("sha256").update(normalized).digest("hex");
    });

    // Paso 1: Crear la audiencia
    const createData = await tiktokPost("/dmp/custom_audience/create/", {
      custom_audience_name: name,
      audience_type: "customer_file",
      file_type: file_type,
    });

    const audienceId = createData.custom_audience_id;

    // Paso 2: Subir datos en lotes de 5000
    const batchSize = 5000;
    let totalUploaded = 0;

    for (let i = 0; i < hashedList.length; i += batchSize) {
      const batch = hashedList.slice(i, i + batchSize);
      await tiktokPost("/dmp/custom_audience/update/", {
        custom_audience_id: audienceId,
        action: "APPEND",
        file_type: file_type,
        data_for_hashed: batch,
      });
      totalUploaded += batch.length;
    }

    return {
      content: [
        {
          type: "text",
          text: `✅ AUDIENCIA CREADA EN TIKTOK\n\n📋 Nombre: ${name}\n🆔 ID: ${audienceId}\n📧 Registros subidos: ${fmtNum(totalUploaded)}\n🔒 Datos hasheados con SHA256\n\n⏳ TikTok procesará la audiencia en las próximas 24-48 horas.`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// 12. AGREGAR USUARIOS A AUDIENCIA EXISTENTE
// ══════════════════════════════════════════════
server.tool(
  "add_users_to_audience",
  "Agrega más emails/teléfonos a una audiencia personalizada existente",
  {
    audience_id: z.string().describe("ID de la audiencia"),
    file_type: z
      .enum(["FILE_TYPE_EMAIL", "FILE_TYPE_PHONE"])
      .default("FILE_TYPE_EMAIL"),
    data_list: z
      .array(z.string())
      .describe("Lista de emails o teléfonos a agregar"),
  },
  async ({ audience_id, file_type, data_list }) => {
    const crypto = require("crypto");
    const hashedList = data_list.map((item) => {
      const normalized = item.trim().toLowerCase();
      return crypto.createHash("sha256").update(normalized).digest("hex");
    });

    const batchSize = 5000;
    let totalUploaded = 0;

    for (let i = 0; i < hashedList.length; i += batchSize) {
      const batch = hashedList.slice(i, i + batchSize);
      await tiktokPost("/dmp/custom_audience/update/", {
        custom_audience_id: audience_id,
        action: "APPEND",
        file_type: file_type,
        data_for_hashed: batch,
      });
      totalUploaded += batch.length;
    }

    return {
      content: [
        {
          type: "text",
          text: `📧 USUARIOS AGREGADOS A AUDIENCIA\n\n🆔 Audiencia: ${audience_id}\n✅ Agregados: ${fmtNum(totalUploaded)}\n🔒 Datos hasheados con SHA256\n\n⏳ TikTok procesará los datos en las próximas horas.`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// 13. ELIMINAR AUDIENCIA
// ══════════════════════════════════════════════
server.tool(
  "delete_audience",
  "Elimina una audiencia personalizada de TikTok Ads",
  {
    audience_id: z.string().describe("ID de la audiencia a eliminar"),
  },
  async ({ audience_id }) => {
    await tiktokPost("/dmp/custom_audience/delete/", {
      custom_audience_id: audience_id,
    });

    return {
      content: [
        {
          type: "text",
          text: `🗑️ Audiencia ${audience_id} eliminada exitosamente.`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// 14. PAUSAR / ACTIVAR CAMPAÑA
// ══════════════════════════════════════════════
server.tool(
  "update_campaign_status",
  "Activa, pausa o elimina una campaña de TikTok Ads",
  {
    campaign_id: z.string().describe("ID de la campaña"),
    action: z
      .enum(["ENABLE", "DISABLE", "DELETE"])
      .describe("ENABLE = activar, DISABLE = pausar, DELETE = eliminar"),
  },
  async ({ campaign_id, action }) => {
    const statusMap = {
      ENABLE: "ENABLE",
      DISABLE: "DISABLE",
      DELETE: "DELETE",
    };

    await tiktokPost("/campaign/status/update/", {
      campaign_ids: [campaign_id],
      opt_status: statusMap[action],
    });

    const actionText = {
      ENABLE: "✅ ACTIVADA",
      DISABLE: "⏸️ PAUSADA",
      DELETE: "🗑️ ELIMINADA",
    };

    return {
      content: [
        {
          type: "text",
          text: `${actionText[action]}\n\nCampaña ${campaign_id} ${actionText[action].toLowerCase()} exitosamente.`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// 15. INFORMACIÓN DE LA CUENTA
// ══════════════════════════════════════════════
server.tool(
  "get_account_info",
  "Muestra información general de la cuenta publicitaria de TikTok Ads (balance, estado, zona horaria)",
  {},
  async () => {
    const data = await tiktokGet("/advertiser/info/", {
      advertiser_ids: JSON.stringify([ADVERTISER_ID]),
    });

    const accounts = data.list || [];
    if (accounts.length === 0) {
      return { content: [{ type: "text", text: "No se pudo obtener info de la cuenta." }] };
    }

    const acc = accounts[0];
    return {
      content: [
        {
          type: "text",
          text: `🏢 CUENTA TIKTOK ADS\n\n📋 Nombre: ${acc.advertiser_name || "N/A"}\n🆔 ID: ${acc.advertiser_id}\n💰 Balance: ${fmtMoney(acc.balance)}\n💳 Moneda: ${acc.currency || "N/A"}\n🌐 Zona horaria: ${acc.timezone || "N/A"}\n📊 Estado: ${acc.status || "N/A"}\n🏷️ Industria: ${acc.industry || "N/A"}`,
        },
      ],
    };
  }
);

// ── Iniciar servidor ──
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ TikTok Ads MCP Server iniciado correctamente");
}

main().catch((err) => {
  console.error("❌ Error al iniciar:", err);
  process.exit(1);
});
