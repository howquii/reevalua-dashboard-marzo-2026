import requests
import json
import csv
import sys
import base64
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

# ── Credenciales Mixpanel ──
SERVICE_ACCOUNT_USER = "Claudeadsmcp.fbeaff.mp-service-account"
SERVICE_ACCOUNT_SECRET = "iHjVHn8EJgvME9EhvcYQ25BxuUlGlKVm"
PROJECT_ID = 3968749  # Reevalua Prod

# Auth header (Basic Auth con service account)
credentials = base64.b64encode(f"{SERVICE_ACCOUNT_USER}:{SERVICE_ACCOUNT_SECRET}".encode()).decode()
HEADERS = {
    "Authorization": f"Basic {credentials}",
    "Accept": "application/json",
}

OUTPUT_CSV = r"C:\Users\juaga\Documents\CLAUDE\leads_bancarizacion_optimizacion.csv"

print("=" * 60)
print("REEVALUA - Extracción de perfiles Mixpanel")
print("Perfiles: Bancarización y Optimización")
print("=" * 60)

# ── Paso 1: Obtener usuarios que hicieron "Client type changed" ──
# con New client type = Bancarización o Optimización
# Usamos la API de JQL (Data Export) para obtener los distinct_ids

print("\n📡 Consultando eventos 'Client type changed'...")

# Usar Engage API para buscar perfiles de usuario
# Primero obtenemos los distinct_ids del evento con la Export API
export_url = f"https://data.mixpanel.com/api/2.0/export"

# Buscar eventos de los últimos 6 meses
from datetime import timedelta
today = datetime.now()
six_months_ago = today - timedelta(days=180)

params = {
    "project_id": PROJECT_ID,
    "from_date": six_months_ago.strftime("%Y-%m-%d"),
    "to_date": today.strftime("%Y-%m-%d"),
    "event": json.dumps(["Client type changed"]),
}

print(f"  Periodo: {six_months_ago.strftime('%Y-%m-%d')} al {today.strftime('%Y-%m-%d')}")

response = requests.get(export_url, headers=HEADERS, params=params)

if response.status_code != 200:
    print(f"❌ Error en Export API: {response.status_code}")
    print(response.text[:500])
    sys.exit(1)

# Parsear eventos JSONL (una línea por evento)
bancarizacion_ids = set()
optimizacion_ids = set()
all_target_ids = set()

for line in response.text.strip().split("\n"):
    if not line.strip():
        continue
    try:
        event = json.loads(line)
        props = event.get("properties", {})
        new_type = props.get("New client type", "")
        distinct_id = props.get("distinct_id", "")

        if new_type == "Bancarización" and distinct_id:
            bancarizacion_ids.add(distinct_id)
            all_target_ids.add(distinct_id)
        elif new_type == "Optimización" and distinct_id:
            optimizacion_ids.add(distinct_id)
            all_target_ids.add(distinct_id)
    except json.JSONDecodeError:
        continue

print(f"\n✅ Usuarios encontrados:")
print(f"  Bancarización: {len(bancarizacion_ids)}")
print(f"  Optimización: {len(optimizacion_ids)}")
print(f"  Total únicos: {len(all_target_ids)}")

if len(all_target_ids) == 0:
    print("\n⚠️ No se encontraron usuarios. Verificando con Credit request created...")

    params["event"] = json.dumps(["Credit request created"])
    response = requests.get(export_url, headers=HEADERS, params=params)

    for line in response.text.strip().split("\n"):
        if not line.strip():
            continue
        try:
            event = json.loads(line)
            props = event.get("properties", {})
            distinct_id = props.get("distinct_id", "")
            if distinct_id:
                all_target_ids.add(distinct_id)
        except json.JSONDecodeError:
            continue

    print(f"  Credit request created: {len(all_target_ids)} usuarios")

# ── Paso 2: Obtener perfiles de usuario (email, nombre, teléfono) ──
print(f"\n📡 Obteniendo perfiles de {len(all_target_ids)} usuarios...")

engage_url = f"https://mixpanel.com/api/2.0/engage"

# Crear mapping de tipo de cliente
user_types = {}
for uid in bancarizacion_ids:
    user_types[uid] = "Bancarización"
for uid in optimizacion_ids:
    user_types[uid] = "Optimización"

# Obtener perfiles en lotes
all_profiles = []
distinct_id_list = list(all_target_ids)

# Consultar perfiles usando filtros
batch_size = 100
session_id = None
page = 0

# Usar el endpoint engage con filtro por distinct_id
for i in range(0, len(distinct_id_list), batch_size):
    batch = distinct_id_list[i:i+batch_size]

    # Construir filtro OR para los distinct_ids del batch
    filter_expr = " or ".join([f'properties["$distinct_id"] == "{did}"' for did in batch])

    engage_params = {
        "project_id": PROJECT_ID,
        "filter": filter_expr,
        "output_properties": json.dumps([
            "$email", "$first_name", "$last_name", "$name",
            "Name", "Phone", "Contact ID", "Entity Name"
        ]),
        "page_size": batch_size,
    }

    if session_id:
        engage_params["session_id"] = session_id
        engage_params["page"] = page

    resp = requests.post(engage_url, headers=HEADERS, data=engage_params)

    if resp.status_code != 200:
        print(f"  ⚠️ Error en batch {i//batch_size + 1}: {resp.status_code}")
        # Intentar método alternativo: consultar uno por uno los primeros
        continue

    data = resp.json()
    results = data.get("results", [])
    session_id = data.get("session_id")

    for profile in results:
        props = profile.get("$properties", {})
        did = profile.get("$distinct_id", "")

        email = props.get("$email", "")
        first_name = props.get("$first_name", "")
        last_name = props.get("$last_name", "")
        name = props.get("$name", "") or props.get("Name", "")
        phone = props.get("Phone", "")
        contact_id = props.get("Contact ID", "")
        entity = props.get("Entity Name", "")

        full_name = name or f"{first_name} {last_name}".strip()
        client_type = user_types.get(did, "Desconocido")

        if email or phone:  # Solo incluir si tienen algún dato de contacto
            all_profiles.append({
                "distinct_id": did,
                "perfil": client_type,
                "email": email,
                "nombre": full_name,
                "telefono": phone,
                "contact_id": contact_id,
                "entidad": entity,
            })

    print(f"  Batch {i//batch_size + 1}: {len(results)} perfiles obtenidos")

# ── Paso 3: Si no se obtuvieron perfiles con engage, intentar método alternativo ──
if len(all_profiles) == 0:
    print("\n🔄 Intentando método alternativo (engage query global)...")

    for perfil_tipo in ["Bancarización", "Optimización"]:
        engage_params = {
            "project_id": PROJECT_ID,
            "filter": f'(properties["$email"] != "" or properties["Phone"] != "")',
            "output_properties": json.dumps([
                "$email", "$first_name", "$last_name", "$name",
                "Name", "Phone", "Contact ID", "Entity Name"
            ]),
            "page_size": 1000,
        }

        resp = requests.post(engage_url, headers=HEADERS, data=engage_params)

        if resp.status_code == 200:
            data = resp.json()
            results = data.get("results", [])
            target_ids = bancarizacion_ids if perfil_tipo == "Bancarización" else optimizacion_ids

            for profile in results:
                did = profile.get("$distinct_id", "")
                if did in target_ids:
                    props = profile.get("$properties", {})
                    email = props.get("$email", "")
                    name = props.get("$name", "") or props.get("Name", "")
                    first_name = props.get("$first_name", "")
                    last_name = props.get("$last_name", "")
                    phone = props.get("Phone", "")
                    contact_id = props.get("Contact ID", "")
                    entity = props.get("Entity Name", "")
                    full_name = name or f"{first_name} {last_name}".strip()

                    if email or phone:
                        all_profiles.append({
                            "distinct_id": did,
                            "perfil": perfil_tipo,
                            "email": email,
                            "nombre": full_name,
                            "telefono": phone,
                            "contact_id": contact_id,
                            "entidad": entity,
                        })

            total_pages = data.get("total", 0)
            print(f"  {perfil_tipo}: {len([p for p in all_profiles if p['perfil'] == perfil_tipo])} perfiles con datos de contacto (de {total_pages} total)")

# ── Paso 4: Guardar en CSV ──
print(f"\n📊 Total perfiles con datos de contacto: {len(all_profiles)}")

if len(all_profiles) > 0:
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["perfil", "email", "nombre", "telefono", "contact_id", "entidad", "distinct_id"])
        writer.writeheader()
        writer.writerows(all_profiles)

    print(f"\n✅ ARCHIVO GENERADO: {OUTPUT_CSV}")
    print(f"\nResumen por perfil:")

    banc_count = len([p for p in all_profiles if p["perfil"] == "Bancarización"])
    opt_count = len([p for p in all_profiles if p["perfil"] == "Optimización"])

    print(f"  Bancarización: {banc_count}")
    print(f"  Optimización: {opt_count}")

    print(f"\nPrimeros 5 registros:")
    for p in all_profiles[:5]:
        print(f"  {p['perfil']} | {p['email']} | {p['nombre']} | {p['telefono']}")
else:
    print("\n⚠️ No se encontraron perfiles con datos de contacto.")
    print("Esto puede significar que los perfiles no tienen email/teléfono registrado en Mixpanel.")

print("\n" + "=" * 60)
