# Vault Secrets Management - Quick Start Guide

Get started with HashiCorp Vault secrets management in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- Python 3.10+ installed
- Backend infrastructure directory
- jq installed (for JSON parsing)

## Step 1: Install Python Package

```bash
pip install hvac
```

## Step 2: Start Vault

**Linux/Mac:**
```bash
cd backend/secrets_management
chmod +x setup-vault.sh
./setup-vault.sh setup
```

This will:
- Start Vault container
- Initialize Vault (creates 5 unseal keys)
- Unseal Vault (uses 3 keys)
- Enable KV secrets engine
- Create secret paths for all services
- Set up policies and AppRoles
- Enable audit logging

## Step 3: Verify Installation

```bash
# Check status
./setup-vault.sh status

# Open Vault UI
# Browser: http://localhost:8200
```

## Step 4: Login to Vault UI

1. Open http://localhost:8200
2. Get root token from `vault-keys.json`:
   ```bash
   cat vault-keys.json | jq -r '.root_token'
   ```
3. Enter token in UI

## Step 5: Use Secrets in Python

```python
from shared.vault_client import get_database_config, get_api_key

# Get database configuration
db_config = get_database_config('postgres')
print(f"Database: {db_config['database']}")
print(f"Host: {db_config['host']}")

# Get API key
openai_key = get_api_key('openai', 'api_key')
print(f"OpenAI Key: {openai_key}")
```

## Step 6: Use in Django Settings

```python
# settings.py
from shared.vault_client import VaultClient
import os

vault = VaultClient()

# Get database config from Vault
db_config = vault.get_secret('database/postgres')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': db_config['database'],
        'USER': db_config['username'],
        'PASSWORD': db_config['password'],
        'HOST': db_config['host'],
        'PORT': db_config['port'],
    }
}

# Get JWT secret from Vault
jwt_config = vault.get_secret('jwt/default')
SECRET_KEY = jwt_config['secret_key']
```

## That's It!

Your secrets are now:
- ✅ Stored securely in Vault
- ✅ Encrypted at rest
- ✅ Versioned for rollback
- ✅ Audit logged
- ✅ Accessible via Python client

## Common Commands

```bash
# Start Vault
./setup-vault.sh start

# Stop Vault
./setup-vault.sh stop

# View status
./setup-vault.sh status

# List all secrets
./setup-vault.sh list

# Get a secret
./setup-vault.sh get database/postgres

# Set a secret
./setup-vault.sh set api-keys/custom api_key=xxx

# View logs
./setup-vault.sh logs

# Unseal after restart
./setup-vault.sh unseal
```

## Secret Paths

All secrets are organized under `secret/`:

**Databases:**
- `secret/database/postgres`
- `secret/database/mongodb`
- `secret/database/redis`
- `secret/database/timescaledb`
- `secret/database/elasticsearch`

**Message Queue:**
- `secret/rabbitmq/default`

**Authentication:**
- `secret/jwt/default`

**API Keys:**
- `secret/api-keys/openai`
- `secret/api-keys/twilio`
- `secret/api-keys/stripe`
- `secret/api-keys/flutterwave`

**Services:**
- `secret/services/authentication`
- `secret/services/marketplace`
- `secret/services/ai-assistant`
- ... (one per service)

## Troubleshooting

**Vault sealed after restart?**
```bash
./setup-vault.sh unseal
```

**Can't access secrets?**
- Check Vault is running: `./setup-vault.sh status`
- Verify token: `echo $VAULT_TOKEN`
- Login: `./setup-vault.sh login`

**Need to update a secret?**
```bash
./setup-vault.sh set database/postgres password=new_password
```

**Lost root token?**
- Check `vault-keys.json` file
- If lost, need to reinitialize Vault

## Security Notes

⚠️ **IMPORTANT**: 
- Backup `vault-keys.json` securely
- Never commit `vault-keys.json` to git
- Delete `vault-keys.json` after backing up
- Use AppRole authentication for services (not root token)
- Enable TLS in production

## Next Steps

1. **Backup Keys**: Store `vault-keys.json` securely
2. **Update Secrets**: Replace placeholder values with real secrets
3. **Distribute AppRoles**: Give each service its AppRole credentials
4. **Enable TLS**: Configure TLS for production
5. **Set Up Rotation**: Configure automatic secret rotation

---

**Quick Reference**

| Action | Command |
|--------|---------|
| Start Vault | `./setup-vault.sh start` |
| Check Status | `./setup-vault.sh status` |
| List Secrets | `./setup-vault.sh list` |
| Get Secret | `./setup-vault.sh get <path>` |
| Set Secret | `./setup-vault.sh set <path> k=v` |
| Vault UI | http://localhost:8200 |
| Unseal | `./setup-vault.sh unseal` |
