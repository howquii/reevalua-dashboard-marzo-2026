import requests
import base64
import json
import csv
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

# Credenciales
SA_USER = "Claudeadsmcp.fbeaff.mp-service-account"
SA_SECRET = "iHjVHn8EJgvME9EhvcYQ25BxuUlGlKVm"
creds = base64.b64encode(f"{SA_USER}:{SA_SECRET}".encode()).decode()
HEADERS = {"Authorization": f"Basic {creds}", "Accept": "application/json"}

PROJECT_ID = 3968749
OUTPUT = r"C:\Users\juaga\Documents\CLAUDE\leads_bancarizacion_optimizacion.csv"

print("=" * 60)
print("EXTRACCION MIXPANEL - Bancarizacion y Optimizacion")
print("Periodo: Enero 2026 - Hoy")
print("=" * 60)

# ── Paso 1: Obtener distinct_ids del evento Client type changed ──
print("\nPaso 1: Descargando eventos Client type changed...")
params = {
    "project_id": PROJECT_ID,
    "from_date": "2026-01-01",
    "to_date": "2026-03-17",
    "event": json.dumps(["Client type changed"]),
}
r = requests.get("https://data.mixpanel.com/api/2.0/export", headers=HEADERS, params=params, timeout=180)
print(f"  Status: {r.status_code}")

users = {}
for line in r.text.strip().split("\n"):
    if not line.strip():
        continue
    try:
        evt = json.loads(line)
        p = evt.get("properties", {})
        nt = p.get("New client type", "")
        did = p.get("distinct_id", "")
        uid = p.get("$user_id", "")
        score = p.get("Financial score", "")

        if "ancariza" in nt:
            users[did] = {"perfil": "Bancarizacion", "user_id": uid or did, "financial_score": score}
        elif "ptimiza" in nt:
            users[did] = {"perfil": "Optimizacion", "user_id": uid or did, "financial_score": score}
    except Exception:
        continue

print(f"  Bancarizacion: {len([u for u in users.values() if u['perfil'] == 'Bancarizacion'])}")
print(f"  Optimizacion: {len([u for u in users.values() if u['perfil'] == 'Optimizacion'])}")
print(f"  Total unicos: {len(users)}")

# ── Paso 2: Obtener perfiles con Engage API (con espera para rate limit) ──
print("\nPaso 2: Esperando 60s para reset de rate limit...")
time.sleep(60)

print("Obteniendo perfiles de usuario (Engage API)...")
engage_url = "https://mixpanel.com/api/2.0/engage"

all_profiles = []
session_id = None
page = 0
total_fetched = 0

while True:
    engage_params = {
        "project_id": PROJECT_ID,
        "output_properties": json.dumps(["$email", "$first_name", "$last_name", "$name", "Name", "Phone", "Contact ID", "Entity Name"]),
        "page_size": 1000,
    }
    if session_id:
        engage_params["session_id"] = session_id
        engage_params["page"] = page

    success = False
    for attempt in range(5):
        resp = requests.post(engage_url, headers=HEADERS, data=engage_params, timeout=60)
        if resp.status_code == 200:
            success = True
            break
        elif resp.status_code == 429:
            wait = 10 * (attempt + 1)
            print(f"  Rate limited, esperando {wait}s... (intento {attempt+1}/5)")
            time.sleep(wait)
        else:
            print(f"  Error {resp.status_code}: {resp.text[:200]}")
            break

    if not success:
        print("  No se pudo obtener datos de Engage API.")
        break

    data = resp.json()
    results = data.get("results", [])
    session_id = data.get("session_id")
    total = data.get("total", 0)

    for profile in results:
        did = profile.get("$distinct_id", "")
        if did not in users:
            continue

        props = profile.get("$properties", {})
        email = props.get("$email", "")
        name = props.get("$name", "") or props.get("Name", "")
        fn = props.get("$first_name", "")
        ln = props.get("$last_name", "")
        phone = props.get("Phone", "")
        contact_id = props.get("Contact ID", "")
        entity = props.get("Entity Name", "")
        full_name = name or f"{fn} {ln}".strip()

        info = users[did]
        all_profiles.append({
            "perfil": info["perfil"],
            "email": email,
            "nombre": full_name,
            "telefono": phone,
            "contact_id": contact_id,
            "entidad": entity,
            "financial_score": info.get("financial_score", ""),
            "user_id": info.get("user_id", did),
        })

    total_fetched += len(results)
    matched = len(all_profiles)
    print(f"  Pag {page+1}: escaneados {total_fetched}/{total} | matches: {matched}")

    if len(results) < 1000 or total_fetched >= total:
        break
    page += 1
    time.sleep(1)

# ── Paso 3: Guardar CSV ──
print(f"\n{'=' * 60}")
print("RESULTADOS")
print(f"{'=' * 60}")

banc_p = [p for p in all_profiles if p["perfil"] == "Bancarizacion"]
opt_p = [p for p in all_profiles if p["perfil"] == "Optimizacion"]
print(f"Bancarizacion: {len(banc_p)}")
print(f"Optimizacion: {len(opt_p)}")
print(f"Total con datos: {len(all_profiles)}")

if all_profiles:
    fieldnames = ["perfil", "email", "nombre", "telefono", "contact_id", "entidad", "financial_score", "user_id"]
    with open(OUTPUT, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(all_profiles)

    print(f"\nCSV guardado: {OUTPUT}")
    print("\nPrimeros 10:")
    for p in all_profiles[:10]:
        print(f"  {p['perfil']} | {p['email']} | {p['nombre']} | {p['telefono']}")
else:
    print("\nNo se encontraron perfiles con datos de contacto.")
    print("Guardando al menos los IDs...")

    fieldnames = ["perfil", "user_id", "financial_score"]
    rows = [{"perfil": v["perfil"], "user_id": v["user_id"], "financial_score": v.get("financial_score", "")} for v in users.values()]
    with open(OUTPUT, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f"CSV con IDs guardado: {OUTPUT}")
    print(f"Total IDs: {len(rows)}")
