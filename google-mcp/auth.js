// ============================================
// GOOGLE MCP - Script de Autorización OAuth2
// Ejecutar: npm run auth
// ============================================
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const axios = require("axios");
const http = require("http");
const fs = require("fs");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3457/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/analytics",
].join(" ");

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&prompt=consent`;

console.log("\n🔐 GOOGLE MCP - Autorización OAuth2\n");
console.log("Paso 1: Abre esta URL en tu navegador:\n");
console.log(authUrl);
console.log("\nPaso 2: Inicia sesión con tu cuenta de Google");
console.log("Paso 3: Autoriza los permisos de Search Console y Analytics");
console.log("Paso 4: Serás redirigido automáticamente...\n");
console.log("⏳ Esperando callback en http://localhost:3457 ...\n");

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/callback")) return;

  const url = new URL(req.url, "http://localhost:3457");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h1>❌ Error: ${error}</h1>`);
    console.error(`❌ Error de autorización: ${error}`);
    server.close();
    return;
  }

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>❌ No se recibió código de autorización</h1>");
    console.error("❌ No se recibió código");
    server.close();
    return;
  }

  console.log("✅ Código de autorización recibido");
  console.log("🔄 Intercambiando por tokens...\n");

  try {
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const { access_token, refresh_token } = tokenRes.data;

    // Actualizar .env
    const envPath = path.join(__dirname, ".env");
    let envContent = fs.readFileSync(envPath, "utf-8");
    envContent = envContent.replace(/GOOGLE_ACCESS_TOKEN=.*/, `GOOGLE_ACCESS_TOKEN=${access_token}`);
    if (refresh_token) {
      envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/, `GOOGLE_REFRESH_TOKEN=${refresh_token}`);
    }
    fs.writeFileSync(envPath, envContent);

    // Intentar obtener el GA4 Property ID automáticamente
    let ga4Info = "";
    try {
      const accountsRes = await axios.get(
        "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      const summaries = accountsRes.data.accountSummaries || [];
      if (summaries.length > 0) {
        const properties = summaries[0].propertySummaries || [];
        if (properties.length > 0) {
          const propertyId = properties[0].property.replace("properties/", "");
          const propertyName = properties[0].displayName;
          envContent = envContent.replace(/GOOGLE_GA4_PROPERTY_ID=.*/, `GOOGLE_GA4_PROPERTY_ID=${propertyId}`);
          fs.writeFileSync(envPath, envContent);
          ga4Info = `\n🏠 GA4 Property: ${propertyName} (ID: ${propertyId})`;
          console.log(`🏠 GA4 Property detectada: ${propertyName} (${propertyId})`);

          // Mostrar todas las propiedades encontradas
          if (properties.length > 1) {
            console.log(`\n📋 Se encontraron ${properties.length} propiedades GA4:`);
            properties.forEach((p, i) => {
              const pid = p.property.replace("properties/", "");
              console.log(`  ${i + 1}. ${p.displayName} (ID: ${pid})`);
            });
            console.log(`\n  Se seleccionó la primera. Si necesitas otra, edita GOOGLE_GA4_PROPERTY_ID en .env`);
          }
        }
      }
    } catch (gaErr) {
      console.log("⚠️ No se pudo detectar GA4 automáticamente. Edita GOOGLE_GA4_PROPERTY_ID en .env manualmente.");
    }

    console.log("\n✅ ¡Autorización exitosa!\n");
    console.log(`📋 Access Token: ${access_token.substring(0, 30)}...`);
    console.log(`🔄 Refresh Token: ${refresh_token ? refresh_token.substring(0, 30) + "..." : "No proporcionado"}`);
    console.log(ga4Info);
    console.log("\n💾 Tokens guardados en .env automáticamente.");
    console.log("🚀 Ya puedes usar el servidor MCP de Google.\n");

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <html><body style="font-family:sans-serif;text-align:center;padding:50px">
        <h1>✅ ¡Autorización exitosa!</h1>
        <p>Tokens guardados. Ya puedes cerrar esta ventana.</p>
        ${ga4Info ? `<p>GA4 Property detectada automáticamente</p>` : "<p>⚠️ Edita GOOGLE_GA4_PROPERTY_ID en .env</p>"}
        <p style="color:green;font-size:1.2em">Search Console ✅ | Analytics GA4 ✅</p>
      </body></html>
    `);
  } catch (err) {
    console.error("❌ Error al obtener tokens:", err.response?.data || err.message);
    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h1>❌ Error</h1><pre>${JSON.stringify(err.response?.data || err.message, null, 2)}</pre>`);
  }

  setTimeout(() => server.close(), 1000);
});

server.listen(3457, () => {
  console.log("🌐 Servidor local escuchando en puerto 3457...");
});
