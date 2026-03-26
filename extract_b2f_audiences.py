import pandas as pd
import hashlib
import json
import requests
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

# Config
EXCEL_PATH = r'C:\Users\juaga\Documents\CLAUDE\Consolidado_Leads_DicEneFeb_2025-26_v1.xlsx'
ENV_PATH = r'C:\Users\juaga\Documents\CLAUDE\meta-ads-mcp\.env'

# Load env
env = {}
with open(ENV_PATH) as f:
    for line in f:
        if '=' in line:
            k, v = line.strip().split('=', 1)
            env[k] = v

TOKEN = env['META_ACCESS_TOKEN']
AD_ACCOUNT = env['META_AD_ACCOUNT_ID']
API_BASE = 'https://graph.facebook.com/v19.0'

# Load Excel
df = pd.read_excel(EXCEL_PATH, sheet_name='Leads Consolidados', header=2)
has_email = df['Email'].notna() & df['Email'].astype(str).str.contains('@', na=False)
is_reg = df['Registrado'].astype(str).str.upper().str.strip().isin(['SI', 'SÍ', 'Sí'])
is_des = df['Desembolsado'].astype(str).str.upper().str.strip().isin(['SI', 'SÍ', 'Sí'])

# Segments
seed_mask = (is_des | (df['Rango Score'].isin(['Alto', 'Muy Alto']) & is_reg)) & has_email
excl_riesgo_mask = (df['Perfil Riesgo'] == 'Alto Riesgo') & has_email
excl_score_mask = (df['Rango Score'] == 'Muy Bajo') & has_email

segments = {
    'B2F Desembolsados + High Score - Seed Lookalike': seed_mask,
    'B2F Alto Riesgo - Excluir': excl_riesgo_mask,
    'B2F Score Muy Bajo - Excluir': excl_score_mask,
}

def normalize_email(email):
    return str(email).strip().lower()

def hash_email(email):
    return hashlib.sha256(normalize_email(email).encode('utf-8')).hexdigest()

def create_audience(name):
    url = f'{API_BASE}/{AD_ACCOUNT}/customaudiences'
    payload = {
        'name': name,
        'subtype': 'CUSTOM',
        'customer_file_source': 'USER_PROVIDED_ONLY',
        'access_token': TOKEN,
    }
    r = requests.post(url, data=payload)
    data = r.json()
    if 'error' in data:
        print(f'  ERROR creating audience: {data["error"]["message"]}')
        return None
    return data.get('id')

def upload_emails(audience_id, emails):
    hashed = [hash_email(e) for e in emails]
    batch_size = 5000
    total_uploaded = 0
    for i in range(0, len(hashed), batch_size):
        batch = hashed[i:i+batch_size]
        url = f'{API_BASE}/{audience_id}/users'
        payload_data = {
            'schema': 'EMAIL_SHA256',
            'data': batch,
        }
        data = {
            'payload': json.dumps(payload_data),
            'access_token': TOKEN,
        }
        r = requests.post(url, data=data)
        result = r.json()
        if 'error' in result:
            print(f'  ERROR uploading batch {i}: {result["error"]["message"]}')
        else:
            num = result.get('num_received', len(batch))
            total_uploaded += num
            print(f'  Batch {i//batch_size + 1}: {num} emails uploaded')
    return total_uploaded

print('=' * 60)
print('REEVALUA B2F - Audience Creator')
print('=' * 60)
print(f'Excel: {len(df)} leads')
print(f'Token: ...{TOKEN[-10:]}')
print(f'Account: {AD_ACCOUNT}')
print()

results = {}
for name, mask in segments.items():
    emails = df.loc[mask, 'Email'].dropna().unique().tolist()
    print(f'\n--- {name} ---')
    print(f'Emails: {len(emails)}')

    audience_id = create_audience(name)
    if audience_id:
        print(f'Audience ID: {audience_id}')
        uploaded = upload_emails(audience_id, emails)
        print(f'Total uploaded: {uploaded}')
        results[name] = {'id': audience_id, 'emails': len(emails), 'uploaded': uploaded}
    else:
        results[name] = {'id': None, 'emails': len(emails), 'uploaded': 0}

print('\n' + '=' * 60)
print('RESUMEN')
print('=' * 60)
for name, info in results.items():
    status = 'OK' if info['id'] else 'FAILED'
    print(f'{status} | {name}: {info["emails"]} emails | ID: {info["id"]}')
