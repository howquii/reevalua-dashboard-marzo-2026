// ============================================
// META ADS MCP SERVER - Reevalúa
// ============================================
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const axios = require("axios");
const { z } = require("zod");

const TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID;
const BASE_URL = "https://graph.facebook.com/v19.0";

const server = new McpServer({
  name: "meta-ads",
  version: "1.0.0",
});

const crypto = require("crypto");

// ── Funciones helper para llamadas a la API ──
async function metaGet(path, params = {}) {
  try {
    const res = await axios.get(`${BASE_URL}${path}`, {
      params: { access_token: TOKEN, ...params },
    });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    throw new Error(`Meta API Error: ${msg}`);
  }
}

async function metaPost(path, data = {}) {
  try {
    const res = await axios.post(`${BASE_URL}${path}`, {
      access_token: TOKEN,
      ...data,
    });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    throw new Error(`Meta API Error: ${msg}`);
  }
}

async function metaDelete(path) {
  try {
    const res = await axios.delete(`${BASE_URL}${path}`, {
      params: { access_token: TOKEN },
    });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    throw new Error(`Meta API Error: ${msg}`);
  }
}

// ══════════════════════════════════════════════
// HERRAMIENTA 1: Ver todas las campañas
// ══════════════════════════════════════════════
server.tool(
  "get_campaigns",
  "Muestra todas las campañas de Meta Ads con su estado y presupuesto",
  {
    status: z.enum(["ACTIVE", "PAUSED", "ALL"]).default("ALL").describe("Filtrar por estado"),
  },
  async ({ status }) => {
    const filtering =
      status === "ALL"
        ? []
        : [{ field: "effective_status", operator: "IN", value: [status] }];

    const data = await metaGet(`/${AD_ACCOUNT}/campaigns`, {
      fields: "id,name,status,effective_status,daily_budget,lifetime_budget,objective",
      filtering: JSON.stringify(filtering),
      limit: 50,
    });

    if (!data.data || data.data.length === 0) {
      return { content: [{ type: "text", text: "No se encontraron campañas." }] };
    }

    const lines = data.data.map((c) => {
      const budget = c.daily_budget
        ? `Presupuesto diario: S/ ${(c.daily_budget / 100).toFixed(2)}`
        : c.lifetime_budget
        ? `Presupuesto total: S/ ${(c.lifetime_budget / 100).toFixed(2)}`
        : "Sin presupuesto definido";
      return `• ${c.name}\n  Estado: ${c.effective_status} | ${budget} | Objetivo: ${c.objective || "N/A"}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `📊 CAMPAÑAS (${data.data.length} encontradas)\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 2: Métricas por rango de fechas
// ══════════════════════════════════════════════
server.tool(
  "get_insights",
  "Obtiene métricas de rendimiento (gasto, impresiones, clics, CPM, CTR) de tus campañas",
  {
    since: z.string().describe("Fecha inicio en formato YYYY-MM-DD, ej: 2024-03-01"),
    until: z.string().describe("Fecha fin en formato YYYY-MM-DD, ej: 2024-03-31"),
    level: z.enum(["account", "campaign", "adset", "ad"]).default("campaign").describe("Nivel de desglose"),
  },
  async ({ since, until, level }) => {
    const data = await metaGet(`/${AD_ACCOUNT}/insights`, {
      fields: "campaign_name,adset_name,ad_name,spend,impressions,clicks,cpm,ctr,reach,actions",
      time_range: JSON.stringify({ since, until }),
      level,
      limit: 50,
    });

    if (!data.data || data.data.length === 0) {
      return { content: [{ type: "text", text: `Sin datos para el período ${since} al ${until}.` }] };
    }

    const lines = data.data.map((d) => {
      const name = d.campaign_name || d.adset_name || d.ad_name || "Sin nombre";
      const conversions = (d.actions || []).find((a) => a.action_type === "offsite_conversion.fb_pixel_purchase");
      const convText = conversions ? `\n  Conversiones: ${conversions.value}` : "";
      return `• ${name}
  Gasto: S/ ${parseFloat(d.spend || 0).toFixed(2)} | Alcance: ${parseInt(d.reach || 0).toLocaleString()}
  Impresiones: ${parseInt(d.impressions || 0).toLocaleString()} | Clics: ${parseInt(d.clicks || 0).toLocaleString()}
  CTR: ${parseFloat(d.ctr || 0).toFixed(2)}% | CPM: S/ ${parseFloat(d.cpm || 0).toFixed(2)}${convText}`;
    });

    const totalGasto = data.data.reduce((s, d) => s + parseFloat(d.spend || 0), 0);

    return {
      content: [
        {
          type: "text",
          text: `📈 MÉTRICAS DEL ${since} AL ${until}\nGasto total: S/ ${totalGasto.toFixed(2)}\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 3: Resumen de hoy
// ══════════════════════════════════════════════
server.tool(
  "get_today",
  "Resumen rápido de métricas del día de hoy",
  {},
  async () => {
    const today = new Date().toISOString().split("T")[0];
    const data = await metaGet(`/${AD_ACCOUNT}/insights`, {
      fields: "spend,impressions,clicks,cpm,ctr,reach",
      date_preset: "today",
      level: "account",
    });

    if (!data.data || data.data.length === 0) {
      return { content: [{ type: "text", text: "Sin datos por hoy todavía." }] };
    }

    const d = data.data[0];
    return {
      content: [
        {
          type: "text",
          text: `📅 HOY (${today})\n\n💰 Gasto: S/ ${parseFloat(d.spend || 0).toFixed(2)}\n👁️ Alcance: ${parseInt(d.reach || 0).toLocaleString()}\n📢 Impresiones: ${parseInt(d.impressions || 0).toLocaleString()}\n🖱️ Clics: ${parseInt(d.clicks || 0).toLocaleString()}\n📊 CTR: ${parseFloat(d.ctr || 0).toFixed(2)}%\n💲 CPM: S/ ${parseFloat(d.cpm || 0).toFixed(2)}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 4: Ad Sets de una campaña
// ══════════════════════════════════════════════
server.tool(
  "get_adsets",
  "Muestra los conjuntos de anuncios (Ad Sets) de una campaña específica",
  {
    campaign_id: z.string().describe("ID de la campaña, ej: 120200000000000"),
  },
  async ({ campaign_id }) => {
    const data = await metaGet(`/${campaign_id}/adsets`, {
      fields: "id,name,status,daily_budget,optimization_goal,targeting",
      limit: 50,
    });

    if (!data.data || data.data.length === 0) {
      return { content: [{ type: "text", text: "No se encontraron ad sets para esta campaña." }] };
    }

    const lines = data.data.map((a) => {
      const budget = a.daily_budget ? `S/ ${(a.daily_budget / 100).toFixed(2)}/día` : "Sin presupuesto";
      return `• ${a.name}\n  Estado: ${a.status} | Presupuesto: ${budget} | Objetivo: ${a.optimization_goal || "N/A"}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `🎯 AD SETS (${data.data.length} encontrados)\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 5: Ver anuncios activos
// ══════════════════════════════════════════════
server.tool(
  "get_ads",
  "Lista todos los anuncios activos con su estado",
  {},
  async () => {
    const data = await metaGet(`/${AD_ACCOUNT}/ads`, {
      fields: "id,name,status,effective_status,creative{title,body}",
      filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE"] }]),
      limit: 30,
    });

    if (!data.data || data.data.length === 0) {
      return { content: [{ type: "text", text: "No hay anuncios activos en este momento." }] };
    }

    const lines = data.data.map((a) => {
      const titulo = a.creative?.title || "Sin título";
      return `• ${a.name}\n  Estado: ${a.effective_status} | Título del anuncio: "${titulo}"`;
    });

    return {
      content: [
        {
          type: "text",
          text: `📣 ANUNCIOS ACTIVOS (${data.data.length})\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 6: Obtener Pixels de la cuenta
// ══════════════════════════════════════════════
server.tool(
  "get_pixels",
  "Obtiene los Meta Pixels configurados en la cuenta publicitaria",
  {},
  async () => {
    const data = await metaGet(`/${AD_ACCOUNT}/adspixels`, {
      fields: "id,name,last_fired_time,is_created_by_app",
    });

    if (!data.data || data.data.length === 0) {
      return { content: [{ type: "text", text: "No se encontraron pixels en esta cuenta." }] };
    }

    const lines = data.data.map((p) => {
      const lastFired = p.last_fired_time
        ? new Date(p.last_fired_time * 1000).toLocaleString()
        : "Nunca";
      return `• ${p.name}\n  ID: ${p.id} | Último disparo: ${lastFired}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `🔥 PIXELS (${data.data.length} encontrados)\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 7: Listar audiencias personalizadas
// ══════════════════════════════════════════════
server.tool(
  "list_audiences",
  "Lista todas las audiencias personalizadas (Custom Audiences) de la cuenta",
  {
    subtype: z
      .enum(["WEBSITE", "CUSTOM", "LOOKALIKE", "ALL"])
      .default("ALL")
      .describe("Filtrar por tipo de audiencia"),
  },
  async ({ subtype }) => {
    const params = {
      fields: "id,name,approximate_count_lower_bound,approximate_count_upper_bound,delivery_status,description,subtype,time_created,time_updated",
      limit: 100,
    };

    const data = await metaGet(`/${AD_ACCOUNT}/customaudiences`, params);

    if (!data.data || data.data.length === 0) {
      return { content: [{ type: "text", text: "No se encontraron audiencias." }] };
    }

    let audiences = data.data;
    if (subtype !== "ALL") {
      audiences = audiences.filter((a) => a.subtype === subtype);
    }

    if (audiences.length === 0) {
      return { content: [{ type: "text", text: `No se encontraron audiencias de tipo ${subtype}.` }] };
    }

    const lines = audiences.map((a) => {
      const lower = a.approximate_count_lower_bound || 0;
      const upper = a.approximate_count_upper_bound || 0;
      const size = lower > 0 ? `${lower.toLocaleString()} - ${upper.toLocaleString()}` : "Calculando...";
      const status = a.delivery_status?.description || "N/A";
      const updated = a.time_updated
        ? new Date(a.time_updated * 1000).toLocaleDateString()
        : "N/A";
      return `• ${a.name}\n  ID: ${a.id} | Tamaño: ${size} | Tipo: ${a.subtype} | Estado: ${status} | Actualizado: ${updated}${a.description ? `\n  Descripción: ${a.description}` : ""}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `👥 AUDIENCIAS (${audiences.length} encontradas)\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 8: Crear audiencia Website (Pixel)
// ══════════════════════════════════════════════
server.tool(
  "create_website_audience",
  "Crea una audiencia personalizada basada en el Meta Pixel (visitantes web, eventos). Se actualiza automáticamente.",
  {
    name: z.string().describe("Nombre de la audiencia, ej: 'Reevalua New - Pixel'"),
    description: z.string().optional().describe("Descripción de la audiencia"),
    pixel_id: z.string().describe("ID del Meta Pixel (obtenido de get_pixels)"),
    retention_days: z
      .number()
      .min(1)
      .max(180)
      .default(30)
      .describe("Días que un usuario permanece en la audiencia (1-180)"),
    rule_type: z
      .enum(["url_contains", "url_equals", "event"])
      .describe("Tipo de regla: url_contains, url_equals, o event (evento del pixel)"),
    rule_value: z
      .string()
      .describe("Valor de la regla: patrón de URL o nombre de evento (ej: 'CompleteRegistration', '/registro-exitoso')"),
  },
  async ({ name, description, pixel_id, retention_days, rule_type, rule_value }) => {
    // Construir el objeto de reglas según el tipo
    let filter;
    if (rule_type === "url_contains") {
      filter = {
        operator: "and",
        filters: [{ field: "url", operator: "i_contains", value: rule_value }],
      };
    } else if (rule_type === "url_equals") {
      filter = {
        operator: "and",
        filters: [{ field: "url", operator: "i_is", value: rule_value }],
      };
    } else {
      // event
      filter = {
        operator: "and",
        filters: [{ field: "event", operator: "eq", value: rule_value }],
      };
    }

    const rule = {
      inclusions: {
        operator: "or",
        rules: [
          {
            event_sources: [{ type: "pixel", id: parseInt(pixel_id) }],
            retention_seconds: retention_days * 86400,
            filter,
          },
        ],
      },
    };

    const data = await metaPost(`/${AD_ACCOUNT}/customaudiences`, {
      name,
      description: description || "",
      rule: JSON.stringify(rule),
      prefill: true,
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ AUDIENCIA WEBSITE CREADA\n\n📋 Nombre: ${name}\n🆔 ID: ${data.id}\n🔧 Regla: ${rule_type} → "${rule_value}"\n📅 Retención: ${retention_days} días\n\n⏳ Meta comenzará a poblar la audiencia en las próximas 24-48 horas.`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 9: Crear audiencia Customer List (emails)
// ══════════════════════════════════════════════
server.tool(
  "create_customer_list_audience",
  "Crea una audiencia vacía de tipo Customer List para luego poblarla con emails (desde Mixpanel u otra fuente)",
  {
    name: z.string().describe("Nombre de la audiencia, ej: 'Reevalua New - Mixpanel'"),
    description: z.string().optional().describe("Descripción de la audiencia"),
  },
  async ({ name, description }) => {
    const data = await metaPost(`/${AD_ACCOUNT}/customaudiences`, {
      name,
      description: description || "",
      subtype: "CUSTOM",
      customer_file_source: "USER_PROVIDED_ONLY",
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ AUDIENCIA CUSTOMER LIST CREADA\n\n📋 Nombre: ${name}\n🆔 ID: ${data.id}\n\n📧 Ahora usa 'add_users_to_audience' para agregar emails a esta audiencia.`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 10: Agregar usuarios a una audiencia
// ══════════════════════════════════════════════
server.tool(
  "add_users_to_audience",
  "Agrega emails a una audiencia Customer List. Los emails se hashean con SHA256 automáticamente antes de enviarlos a Meta.",
  {
    audience_id: z.string().describe("ID de la audiencia Customer List"),
    emails: z.array(z.string()).describe("Lista de emails a agregar, ej: ['user1@email.com', 'user2@email.com']"),
  },
  async ({ audience_id, emails }) => {
    // Normalizar y hashear emails
    const hashedData = emails.map((email) => {
      const normalized = email.trim().toLowerCase();
      const hash = crypto.createHash("sha256").update(normalized).digest("hex");
      return [hash];
    });

    const payload = {
      schema: ["EMAIL"],
      data: hashedData,
    };

    const data = await metaPost(`/${audience_id}/users`, {
      payload: JSON.stringify(payload),
    });

    const added = data.num_received || emails.length;
    const invalid = data.num_invalid_entries || 0;

    return {
      content: [
        {
          type: "text",
          text: `📧 USUARIOS AGREGADOS A AUDIENCIA\n\n🆔 Audiencia: ${audience_id}\n✅ Recibidos: ${added}\n❌ Inválidos: ${invalid}\n📊 Total enviados: ${emails.length}\n\n⏳ Meta procesará los datos en las próximas horas.`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 11: Detalle de una audiencia
// ══════════════════════════════════════════════
server.tool(
  "get_audience_details",
  "Muestra detalles completos de una audiencia: tamaño, reglas, estado de entrega",
  {
    audience_id: z.string().describe("ID de la audiencia"),
  },
  async ({ audience_id }) => {
    const data = await metaGet(`/${audience_id}`, {
      fields:
        "id,name,approximate_count_lower_bound,approximate_count_upper_bound,delivery_status,description,subtype,rule,time_created,time_updated,operation_status,permission_for_actions",
    });

    const lower = data.approximate_count_lower_bound || 0;
    const upper = data.approximate_count_upper_bound || 0;
    const size = lower > 0 ? `${lower.toLocaleString()} - ${upper.toLocaleString()}` : "Calculando...";
    const status = data.delivery_status?.description || "N/A";
    const created = data.time_created
      ? new Date(data.time_created * 1000).toLocaleString()
      : "N/A";
    const updated = data.time_updated
      ? new Date(data.time_updated * 1000).toLocaleString()
      : "N/A";
    const opStatus = data.operation_status?.status
      ? data.operation_status.status
      : "N/A";

    // Parsear reglas si existen
    let ruleText = "Sin reglas (Customer List)";
    if (data.rule) {
      try {
        const ruleObj = typeof data.rule === "string" ? JSON.parse(data.rule) : data.rule;
        const rules = ruleObj.inclusions?.rules || [];
        ruleText = rules
          .map((r) => {
            const retention = r.retention_seconds ? `${r.retention_seconds / 86400} días` : "N/A";
            const filters = r.filter?.filters || [];
            const filterText = filters
              .map((f) => `${f.field} ${f.operator} "${f.value}"`)
              .join(" AND ");
            return `Retención: ${retention} | Filtro: ${filterText}`;
          })
          .join("\n  ");
      } catch {
        ruleText = "No se pudo parsear";
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `🔍 DETALLE DE AUDIENCIA\n\n📋 Nombre: ${data.name}\n🆔 ID: ${data.id}\n📊 Tamaño aproximado: ${size}\n🏷️ Tipo: ${data.subtype}\n📡 Estado de entrega: ${status}\n⚙️ Estado de operación: ${opStatus}\n📅 Creada: ${created}\n🔄 Actualizada: ${updated}\n${data.description ? `📝 Descripción: ${data.description}\n` : ""}📐 Reglas: ${ruleText}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 12: Eliminar una audiencia
// ══════════════════════════════════════════════
server.tool(
  "delete_audience",
  "Elimina una audiencia personalizada de la cuenta",
  {
    audience_id: z.string().describe("ID de la audiencia a eliminar"),
  },
  async ({ audience_id }) => {
    const data = await metaDelete(`/${audience_id}`);

    if (data.success) {
      return {
        content: [
          {
            type: "text",
            text: `🗑️ Audiencia ${audience_id} eliminada exitosamente.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `⚠️ No se pudo confirmar la eliminación de la audiencia ${audience_id}. Verifica en Meta Ads Manager.`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 13: Pausar / Activar campaña
// ══════════════════════════════════════════════
server.tool(
  "update_campaign_status",
  "Activa o pausa una campaña de Meta Ads",
  {
    campaign_id: z.string().describe("ID de la campaña, ej: 120200000000000"),
    status: z.enum(["ACTIVE", "PAUSED"]).describe("Nuevo estado: ACTIVE o PAUSED"),
  },
  async ({ campaign_id, status }) => {
    const data = await metaPost(`/${campaign_id}`, { status });
    const emoji = status === "ACTIVE" ? "▶️" : "⏸️";
    const texto = status === "ACTIVE" ? "ACTIVADA" : "PAUSADA";
    return {
      content: [
        {
          type: "text",
          text: `${emoji} Campaña ${campaign_id} ${texto} exitosamente.`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 14: Actualizar presupuesto de campaña
// ══════════════════════════════════════════════
server.tool(
  "update_campaign_budget",
  "Cambia el presupuesto diario o total de una campaña",
  {
    campaign_id: z.string().describe("ID de la campaña"),
    daily_budget: z.number().optional().describe("Nuevo presupuesto diario en soles (ej: 50 = S/50.00)"),
    lifetime_budget: z.number().optional().describe("Nuevo presupuesto total en soles (ej: 500 = S/500.00)"),
  },
  async ({ campaign_id, daily_budget, lifetime_budget }) => {
    const updates = {};
    if (daily_budget !== undefined) updates.daily_budget = Math.round(daily_budget * 100);
    if (lifetime_budget !== undefined) updates.lifetime_budget = Math.round(lifetime_budget * 100);

    if (Object.keys(updates).length === 0) {
      return { content: [{ type: "text", text: "⚠️ Debes especificar daily_budget o lifetime_budget." }] };
    }

    await metaPost(`/${campaign_id}`, updates);

    const budgetText = daily_budget
      ? `S/ ${daily_budget.toFixed(2)}/día`
      : `S/ ${lifetime_budget.toFixed(2)} total`;

    return {
      content: [
        {
          type: "text",
          text: `💰 PRESUPUESTO ACTUALIZADO\n\nCampaña: ${campaign_id}\nNuevo presupuesto: ${budgetText}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 15: Actualizar presupuesto de Ad Set
// ══════════════════════════════════════════════
server.tool(
  "update_adset_budget",
  "Cambia el presupuesto diario de un Ad Set",
  {
    adset_id: z.string().describe("ID del Ad Set"),
    daily_budget: z.number().describe("Nuevo presupuesto diario en soles (ej: 30 = S/30.00)"),
  },
  async ({ adset_id, daily_budget }) => {
    await metaPost(`/${adset_id}`, {
      daily_budget: Math.round(daily_budget * 100),
    });

    return {
      content: [
        {
          type: "text",
          text: `💰 Ad Set ${adset_id} actualizado a S/ ${daily_budget.toFixed(2)}/día`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 16: Pausar / Activar Ad Set
// ══════════════════════════════════════════════
server.tool(
  "update_adset_status",
  "Activa o pausa un Ad Set de Meta Ads",
  {
    adset_id: z.string().describe("ID del Ad Set"),
    status: z.enum(["ACTIVE", "PAUSED"]).describe("Nuevo estado"),
  },
  async ({ adset_id, status }) => {
    await metaPost(`/${adset_id}`, { status });
    const emoji = status === "ACTIVE" ? "▶️" : "⏸️";
    const texto = status === "ACTIVE" ? "ACTIVADO" : "PAUSADO";
    return {
      content: [{ type: "text", text: `${emoji} Ad Set ${adset_id} ${texto} exitosamente.` }],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 17: Pausar / Activar anuncio
// ══════════════════════════════════════════════
server.tool(
  "update_ad_status",
  "Activa o pausa un anuncio específico de Meta Ads",
  {
    ad_id: z.string().describe("ID del anuncio"),
    status: z.enum(["ACTIVE", "PAUSED"]).describe("Nuevo estado"),
  },
  async ({ ad_id, status }) => {
    await metaPost(`/${ad_id}`, { status });
    const emoji = status === "ACTIVE" ? "▶️" : "⏸️";
    const texto = status === "ACTIVE" ? "ACTIVADO" : "PAUSADO";
    return {
      content: [{ type: "text", text: `${emoji} Anuncio ${ad_id} ${texto} exitosamente.` }],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 18: Crear campaña
// ══════════════════════════════════════════════
server.tool(
  "create_campaign",
  "Crea una nueva campaña en Meta Ads",
  {
    name: z.string().describe("Nombre de la campaña"),
    objective: z
      .enum([
        "OUTCOME_AWARENESS", "OUTCOME_TRAFFIC", "OUTCOME_ENGAGEMENT",
        "OUTCOME_LEADS", "OUTCOME_APP_PROMOTION", "OUTCOME_SALES",
      ])
      .describe("Objetivo: OUTCOME_AWARENESS, OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, OUTCOME_APP_PROMOTION, OUTCOME_SALES"),
    daily_budget: z.number().optional().describe("Presupuesto diario en soles (ej: 50)"),
    lifetime_budget: z.number().optional().describe("Presupuesto total en soles (ej: 500)"),
    status: z.enum(["ACTIVE", "PAUSED"]).default("PAUSED").describe("Estado inicial (PAUSED por defecto para revisar antes de activar)"),
    special_ad_categories: z
      .array(z.enum(["NONE", "EMPLOYMENT", "HOUSING", "CREDIT", "ISSUES_ELECTIONS_POLITICS"]))
      .default(["NONE"])
      .describe("Categorías especiales (NONE para la mayoría)"),
  },
  async ({ name, objective, daily_budget, lifetime_budget, status, special_ad_categories }) => {
    const body = {
      name,
      objective,
      status,
      special_ad_categories,
    };

    if (daily_budget) body.daily_budget = Math.round(daily_budget * 100);
    if (lifetime_budget) body.lifetime_budget = Math.round(lifetime_budget * 100);

    const data = await metaPost(`/${AD_ACCOUNT}/campaigns`, body);

    const budgetText = daily_budget
      ? `S/ ${daily_budget.toFixed(2)}/día`
      : lifetime_budget
      ? `S/ ${lifetime_budget.toFixed(2)} total`
      : "Sin presupuesto (se define en Ad Set)";

    return {
      content: [
        {
          type: "text",
          text: `✅ CAMPAÑA CREADA\n\n📋 Nombre: ${name}\n🆔 ID: ${data.id}\n🎯 Objetivo: ${objective}\n💰 Presupuesto: ${budgetText}\n📊 Estado: ${status}\n\n📝 Siguiente paso: Crea un Ad Set con 'create_adset' usando el campaign_id: ${data.id}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 19: Crear Ad Set
// ══════════════════════════════════════════════
server.tool(
  "create_adset",
  "Crea un Ad Set (conjunto de anuncios) dentro de una campaña existente",
  {
    campaign_id: z.string().describe("ID de la campaña"),
    name: z.string().describe("Nombre del Ad Set"),
    daily_budget: z.number().describe("Presupuesto diario en soles (ej: 30)"),
    optimization_goal: z
      .enum(["LINK_CLICKS", "LANDING_PAGE_VIEWS", "IMPRESSIONS", "REACH", "OFFSITE_CONVERSIONS", "LEAD_GENERATION", "VALUE"])
      .default("LINK_CLICKS")
      .describe("Objetivo de optimización"),
    billing_event: z.enum(["IMPRESSIONS", "LINK_CLICKS"]).default("IMPRESSIONS").describe("Evento de facturación"),
    bid_amount: z.number().optional().describe("Monto de puja en soles (opcional, Meta auto-bid por defecto)"),
    targeting_countries: z
      .array(z.string())
      .default(["PE"])
      .describe("Países objetivo, ej: ['PE'] para Perú, ['PE','CO'] para Perú y Colombia"),
    targeting_age_min: z.number().default(18).describe("Edad mínima (18-65)"),
    targeting_age_max: z.number().default(65).describe("Edad máxima (18-65)"),
    targeting_genders: z
      .array(z.number())
      .default([0])
      .describe("Género: [0] = todos, [1] = hombres, [2] = mujeres"),
    pixel_id: z.string().optional().describe("ID del Meta Pixel para tracking de conversiones"),
    custom_audiences: z.array(z.string()).optional().describe("IDs de audiencias personalizadas para targeting"),
    excluded_audiences: z.array(z.string()).optional().describe("IDs de audiencias para excluir"),
    start_time: z.string().optional().describe("Fecha/hora inicio ISO 8601, ej: 2025-03-18T00:00:00-0500"),
    end_time: z.string().optional().describe("Fecha/hora fin (opcional para continuo)"),
    status: z.enum(["ACTIVE", "PAUSED"]).default("PAUSED"),
  },
  async ({ campaign_id, name, daily_budget, optimization_goal, billing_event, bid_amount, targeting_countries, targeting_age_min, targeting_age_max, targeting_genders, pixel_id, custom_audiences, excluded_audiences, start_time, end_time, status }) => {
    const targeting = {
      geo_locations: { countries: targeting_countries },
      age_min: targeting_age_min,
      age_max: targeting_age_max,
      genders: targeting_genders,
    };

    if (custom_audiences && custom_audiences.length > 0) {
      targeting.custom_audiences = custom_audiences.map((id) => ({ id }));
    }
    if (excluded_audiences && excluded_audiences.length > 0) {
      targeting.excluded_custom_audiences = excluded_audiences.map((id) => ({ id }));
    }

    const body = {
      campaign_id,
      name,
      daily_budget: Math.round(daily_budget * 100),
      optimization_goal,
      billing_event,
      targeting: JSON.stringify(targeting),
      status,
    };

    if (bid_amount) body.bid_amount = Math.round(bid_amount * 100);
    if (pixel_id) body.promoted_object = JSON.stringify({ pixel_id, custom_event_type: "OTHER" });
    if (start_time) body.start_time = start_time;
    if (end_time) body.end_time = end_time;

    const data = await metaPost(`/${AD_ACCOUNT}/adsets`, body);

    return {
      content: [
        {
          type: "text",
          text: `✅ AD SET CREADO\n\n📋 Nombre: ${name}\n🆔 ID: ${data.id}\n🎯 Optimización: ${optimization_goal}\n💰 Presupuesto: S/ ${daily_budget.toFixed(2)}/día\n🌎 Países: ${targeting_countries.join(", ")}\n👥 Edad: ${targeting_age_min}-${targeting_age_max}\n📊 Estado: ${status}\n\n📝 Siguiente paso: Crea un anuncio con 'create_ad' usando el adset_id: ${data.id}`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 20: Crear anuncio
// ══════════════════════════════════════════════
server.tool(
  "create_ad",
  "Crea un anuncio dentro de un Ad Set existente. Necesitas un creative_id o los campos para crear uno.",
  {
    adset_id: z.string().describe("ID del Ad Set"),
    name: z.string().describe("Nombre del anuncio"),
    creative_id: z.string().optional().describe("ID de un creative existente (si ya lo tienes)"),
    page_id: z.string().optional().describe("ID de la página de Facebook para el anuncio"),
    link: z.string().optional().describe("URL de destino, ej: https://reevalua.com/landing"),
    message: z.string().optional().describe("Texto del anuncio (post copy)"),
    headline: z.string().optional().describe("Título del anuncio"),
    description: z.string().optional().describe("Descripción debajo del título"),
    call_to_action: z
      .enum(["LEARN_MORE", "SIGN_UP", "APPLY_NOW", "SHOP_NOW", "CONTACT_US", "DOWNLOAD", "GET_QUOTE", "SUBSCRIBE", "NO_BUTTON"])
      .default("LEARN_MORE")
      .describe("Botón de acción"),
    image_hash: z.string().optional().describe("Hash de imagen subida (de ad_images)"),
    video_id: z.string().optional().describe("ID de video subido"),
    status: z.enum(["ACTIVE", "PAUSED"]).default("PAUSED"),
  },
  async ({ adset_id, name, creative_id, page_id, link, message, headline, description, call_to_action, image_hash, video_id, status }) => {
    const body = { name, adset_id, status };

    if (creative_id) {
      body.creative = JSON.stringify({ creative_id });
    } else {
      const creative = {};
      if (page_id) creative.object_story_spec = {};

      if (page_id && (image_hash || video_id)) {
        if (image_hash) {
          creative.object_story_spec = {
            page_id,
            link_data: {
              link: link || "https://reevalua.com",
              message: message || "",
              name: headline || "",
              description: description || "",
              call_to_action: { type: call_to_action },
              image_hash,
            },
          };
        } else if (video_id) {
          creative.object_story_spec = {
            page_id,
            video_data: {
              video_id,
              call_to_action: { type: call_to_action, value: { link: link || "https://reevalua.com" } },
              message: message || "",
              title: headline || "",
            },
          };
        }
      }

      if (Object.keys(creative).length > 0) {
        body.creative = JSON.stringify(creative);
      }
    }

    const data = await metaPost(`/${AD_ACCOUNT}/ads`, body);

    return {
      content: [
        {
          type: "text",
          text: `✅ ANUNCIO CREADO\n\n📋 Nombre: ${name}\n🆔 ID: ${data.id}\n🔗 Landing: ${link || "N/A"}\n🔘 CTA: ${call_to_action}\n📊 Estado: ${status}\n\n⏳ Meta revisará el anuncio antes de activarlo (puede tomar hasta 24h).`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 21: Duplicar campaña
// ══════════════════════════════════════════════
server.tool(
  "duplicate_campaign",
  "Duplica una campaña existente con todos sus ad sets y anuncios",
  {
    campaign_id: z.string().describe("ID de la campaña a duplicar"),
    new_name: z.string().optional().describe("Nombre de la nueva campaña (opcional)"),
  },
  async ({ campaign_id, new_name }) => {
    // Paso 1: Obtener datos de la campaña original
    const original = await metaGet(`/${campaign_id}`, {
      fields: "name,objective,status,daily_budget,lifetime_budget,special_ad_categories",
    });

    // Paso 2: Crear nueva campaña
    const newCampaign = {
      name: new_name || `${original.name} (copia)`,
      objective: original.objective,
      status: "PAUSED",
      special_ad_categories: original.special_ad_categories || ["NONE"],
    };
    if (original.daily_budget) newCampaign.daily_budget = original.daily_budget;
    if (original.lifetime_budget) newCampaign.lifetime_budget = original.lifetime_budget;

    const campaignData = await metaPost(`/${AD_ACCOUNT}/campaigns`, newCampaign);
    const newCampaignId = campaignData.id;

    // Paso 3: Obtener y duplicar ad sets
    const adsets = await metaGet(`/${campaign_id}/adsets`, {
      fields: "name,daily_budget,lifetime_budget,optimization_goal,billing_event,targeting,status,promoted_object,bid_amount",
    });

    let adsetCount = 0;
    let adCount = 0;

    for (const adset of (adsets.data || [])) {
      const newAdset = {
        campaign_id: newCampaignId,
        name: adset.name,
        optimization_goal: adset.optimization_goal,
        billing_event: adset.billing_event,
        targeting: JSON.stringify(adset.targeting),
        status: "PAUSED",
      };
      if (adset.daily_budget) newAdset.daily_budget = adset.daily_budget;
      if (adset.lifetime_budget) newAdset.lifetime_budget = adset.lifetime_budget;
      if (adset.bid_amount) newAdset.bid_amount = adset.bid_amount;
      if (adset.promoted_object) newAdset.promoted_object = JSON.stringify(adset.promoted_object);

      const adsetData = await metaPost(`/${AD_ACCOUNT}/adsets`, newAdset);
      adsetCount++;

      // Paso 4: Duplicar anuncios del ad set
      const ads = await metaGet(`/${adset.id}/ads`, {
        fields: "name,creative{id},status",
      });

      for (const ad of (ads.data || [])) {
        if (ad.creative?.id) {
          await metaPost(`/${AD_ACCOUNT}/ads`, {
            name: ad.name,
            adset_id: adsetData.id,
            creative: JSON.stringify({ creative_id: ad.creative.id }),
            status: "PAUSED",
          });
          adCount++;
        }
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `✅ CAMPAÑA DUPLICADA\n\n📋 Original: ${original.name}\n📋 Copia: ${newCampaign.name}\n🆔 Nuevo ID: ${newCampaignId}\n🎯 Ad Sets copiados: ${adsetCount}\n📣 Anuncios copiados: ${adCount}\n📊 Estado: PAUSED (todos los elementos)\n\n💡 Revisa la copia y actívala cuando estés listo con 'update_campaign_status'.`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 22: Renombrar campaña
// ══════════════════════════════════════════════
server.tool(
  "rename_campaign",
  "Cambia el nombre de una campaña de Meta Ads",
  {
    campaign_id: z.string().describe("ID de la campaña"),
    new_name: z.string().describe("Nuevo nombre de la campaña"),
  },
  async ({ campaign_id, new_name }) => {
    await metaPost(`/${campaign_id}`, { name: new_name });
    return {
      content: [
        { type: "text", text: `✏️ Campaña ${campaign_id} renombrada a: "${new_name}"` },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 23: Crear Lookalike Audience
// ══════════════════════════════════════════════
server.tool(
  "create_lookalike_audience",
  "Crea una audiencia similar (Lookalike) basada en una audiencia fuente existente",
  {
    name: z.string().describe("Nombre de la nueva audiencia Lookalike"),
    source_audience_id: z.string().describe("ID de la audiencia fuente (Custom Audience)"),
    country: z.string().default("PE").describe("Código de país para el Lookalike, ej: PE, CO, MX"),
    ratio: z.number().min(0.01).max(0.20).default(0.01).describe("Porcentaje de la población del país (0.01 = 1%, 0.10 = 10%)"),
  },
  async ({ name, source_audience_id, country, ratio }) => {
    const data = await metaPost(`/${AD_ACCOUNT}/customaudiences`, {
      name,
      subtype: "LOOKALIKE",
      origin_audience_id: source_audience_id,
      lookalike_spec: JSON.stringify({
        country,
        ratio,
        type: "similarity",
      }),
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ LOOKALIKE AUDIENCE CREADA\n\n📋 Nombre: ${name}\n🆔 ID: ${data.id}\n🌎 País: ${country}\n📊 Ratio: ${(ratio * 100).toFixed(0)}%\n🔗 Fuente: ${source_audience_id}\n\n⏳ Meta tardará 24-48 horas en poblar esta audiencia.`,
        },
      ],
    };
  }
);

// ══════════════════════════════════════════════
// HERRAMIENTA 24: Subir imagen para anuncios
// ══════════════════════════════════════════════
server.tool(
  "get_ad_images",
  "Lista las imágenes disponibles en la cuenta para usar en anuncios (con su hash)",
  {},
  async () => {
    const data = await metaGet(`/${AD_ACCOUNT}/adimages`, {
      fields: "id,hash,name,url_128,created_time",
    });

    if (!data.data || data.data.length === 0) {
      return { content: [{ type: "text", text: "No se encontraron imágenes." }] };
    }

    const lines = data.data.slice(0, 30).map((img) => {
      const created = img.created_time ? new Date(img.created_time).toLocaleDateString() : "N/A";
      return `• ${img.name || "Sin nombre"}\n  Hash: ${img.hash} | Creada: ${created}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `🖼️ IMÁGENES DISPONIBLES (${data.data.length} encontradas)\n\n${lines.join("\n\n")}\n\n💡 Usa el 'hash' al crear anuncios con 'create_ad'.`,
        },
      ],
    };
  }
);

// ── Iniciar el servidor ──
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Meta Ads MCP Server iniciado correctamente");
}

main().catch((err) => {
  console.error("❌ Error al iniciar:", err);
  process.exit(1);
});
