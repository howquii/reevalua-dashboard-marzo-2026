# Guía de Instalación: Meta Ads + Claude Desktop

---

## LO QUE NECESITAS ANTES DE EMPEZAR

- ✅ Node.js instalado (verifica con: `node --version` en PowerShell)
- ✅ Claude Desktop instalado
- ✅ Tu Access Token de Meta (el texto larguísimo)
- ✅ Tu Ad Account ID (formato: act_XXXXXXXXXX)

---

## PASO 1: Crear la carpeta y copiar el archivo

1. Abre el **Explorador de Windows** (Windows + E)
2. Ve al disco **C:\**
3. Crea una carpeta nueva llamada: `meta-ads-mcp`
4. Copia el archivo `server.js` dentro de esa carpeta

   Resultado: `C:\meta-ads-mcp\server.js`

---

## PASO 2: Instalar dependencias (solo una vez)

1. Abre **PowerShell** (busca "PowerShell" en el menú inicio)
2. Escribe estos comandos **uno por uno**, presionando Enter después de cada uno:

```
cd C:\meta-ads-mcp
```

```
npm init -y
```

```
npm install @modelcontextprotocol/sdk axios dotenv zod
```

⏳ El último comando tarda 1-2 minutos. Espera hasta ver el cursor `>` de nuevo.

---

## PASO 3: Configurar Claude Desktop

1. Abre el **Explorador de Windows**
2. En la barra de dirección arriba, pega exactamente esto y presiona Enter:

```
%APPDATA%\Claude
```

3. Si ves el archivo `claude_desktop_config.json`, ábrelo con el Bloc de notas
   Si NO existe, crea un archivo nuevo con ese nombre exacto

4. **Borra todo lo que haya** y pega esto (reemplaza los valores):

```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "node",
      "args": ["C:\\meta-ads-mcp\\server.js"],
      "env": {
        "META_ACCESS_TOKEN": "PEGA_AQUI_TU_TOKEN_COMPLETO",
        "META_AD_ACCOUNT_ID": "act_PEGA_AQUI_TU_NUMERO"
      }
    }
  }
}
```

5. Reemplaza:
   - `PEGA_AQUI_TU_TOKEN_COMPLETO` → tu token de Meta (el texto larguísimo)
   - `act_PEGA_AQUI_TU_NUMERO` → tu Ad Account ID (ejemplo: act_123456789)

6. Guarda el archivo (Ctrl + S)

---

## PASO 4: Reiniciar Claude Desktop

1. Cierra Claude Desktop completamente
2. En la barra de tareas (abajo a la derecha), haz clic derecho en el ícono de Claude
3. Selecciona "Salir" o "Quit"
4. Vuelve a abrir Claude Desktop

---

## PASO 5: Verificar que funciona

En Claude Desktop, escribe:

> "Muéstrame todas mis campañas de Meta Ads"

Si ves un ícono de 🔧 (herramientas) antes de responder, ¡está conectado!

---

## PREGUNTAS QUE PUEDES HACER A CLAUDE

Una vez conectado, puedes preguntar:

- "¿Cuánto gasté hoy en Meta Ads?"
- "Muéstrame las métricas de esta semana"
- "¿Qué campañas están activas?"
- "¿Cuál es el CTR de mis campañas este mes?"
- "Muéstrame los anuncios activos"

---

## SI ALGO NO FUNCIONA

**Error: "node no se reconoce"**
→ Node.js no está instalado correctamente. Descárgalo de nodejs.org y reinstala.

**No aparece el ícono de herramientas**
→ Verifica que el archivo config esté en: `C:\Users\TU_USUARIO\AppData\Roaming\Claude\`
→ Revisa que el JSON no tenga errores (comas mal puestas, etc.)

**Error de token**
→ Tu token expiró. Ve a Graph API Explorer y genera uno nuevo.
