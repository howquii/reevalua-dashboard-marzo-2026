// ============================================
// TIKTOK ADS - Script de Autorización OAuth
// Ejecutar: npm run auth
// ============================================
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const axios = require("axios");
const http = require("http");
const fs = require("fs");

const APP_ID = process.env.TIKTOK_APP_ID;
const APP_SECRET = process.env.TIKTOK_APP_SECRET;
const REDIRECT_URI = "http://localhost:3456/callback";

console.log("\n🔐 TIKTOK ADS - Autorización OAuth\n");
console.log("Paso 1: Abre esta URL en tu navegador:\n");
console.log(`https://business-api.tiktok.com/portal/auth?app_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=reevalua\n`);
console.log("Paso 2: Autoriza la app con tu cuenta de TikTok Ads");
console.log("Paso 3: Serás redirigido automáticamente...\n");
console.log("⏳ Esperando callback en http://localhost:3456 ...\n");

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/callback")) return;

  const url = new URL(req.url, "http://localhost:3456");
  const authCode = url.searchParams.get("auth_code");

  if (!authCode) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>❌ Error: No se recibió auth_code</h1>");
    console.error("❌ No se recibió auth_code en el callback");
    server.close();
    return;
  }

  console.log(`✅ Auth code recibido: ${authCode.substring(0, 10)}...`);
  console.log("🔄 Intercambiando por access token...\n");

  try {
    const response = await axios.post(
      "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
      {
        app_id: APP_ID,
        secret: APP_SECRET,
        auth_code: authCode,
        grant_type: "authorization_code",
      }
    );

    const data = response.data;

    if (data.code !== 0) {
      throw new Error(`TikTok API Error: ${data.message}`);
    }

    const accessToken = data.data.access_token;
    const advertiserId = data.data.advertiser_ids?.[0] || process.env.TIKTOK_ADVERTISER_ID;

    // Actualizar el .env con el token
    const envPath = path.join(__dirname, ".env");
    let envContent = fs.readFileSync(envPath, "utf-8");
    envContent = envContent.replace(
      /TIKTOK_ACCESS_TOKEN=.*/,
      `TIKTOK_ACCESS_TOKEN=${accessToken}`
    );
    if (advertiserId) {
      envContent = envContent.replace(
        /TIKTOK_ADVERTISER_ID=.*/,
        `TIKTOK_ADVERTISER_ID=${advertiserId}`
      );
    }
    fs.writeFileSync(envPath, envContent);

    console.log("✅ ¡Autorización exitosa!\n");
    console.log(`📋 Access Token: ${accessToken.substring(0, 20)}...`);
    console.log(`🆔 Advertiser ID: ${advertiserId}`);
    console.log(`\n💾 Token guardado en .env automáticamente.`);
    console.log(`\n🚀 Ya puedes usar el servidor MCP de TikTok Ads.`);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <html><body style="font-family:sans-serif;text-align:center;padding:50px">
        <h1>✅ ¡Autorización exitosa!</h1>
        <p>Token guardado. Ya puedes cerrar esta ventana.</p>
        <p>Advertiser ID: <code>${advertiserId}</code></p>
      </body></html>
    `);
  } catch (err) {
    console.error("❌ Error al obtener token:", err.response?.data || err.message);
    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h1>❌ Error</h1><pre>${err.message}</pre>`);
  }

  setTimeout(() => server.close(), 1000);
});

server.listen(3456, () => {
  console.log("🌐 Servidor local escuchando en puerto 3456...");
});
