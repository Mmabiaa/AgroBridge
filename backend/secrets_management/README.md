# HashiCorp Vault Secrets Management for AgroBridge

This directory contains the HashiCorp Vault secrets management infrastructure for the AgroBridge microservices platform. Vault provides centralized, secure storage for all sensitive data including passwords, API keys, and certificates.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Secret Organization](#secret-organization)
- [Python Client](#python-client)
- [Django Integration](#django-integration)
- [Secret Rotation](#secret-rotation)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Overview

### What is Vault?

HashiCorp Vault is a secrets management tool that provides:

- **Centralized Storage**: All secrets in one secure location
- **Encryption**: AES-256-GCM encryption at rest
- **Access Control**: Policy-based access control
- **Audit Logging**: Complete audit trail of all access
- **Secret Versioning**: Multiple versions with rollback
- **Dynamic Secrets**: Generate temporary credentials
- **Lease Management**: Automatic credential expiration

### Why Vault?

- **Security**: Industry-standard encryption and access control
- **Compliance**: Audit logging for SOC 2, GDPR, PCI DSS
- **Automation**: Dynamic secrets and automatic rotation
- **Integration**: Easy integration with applications
- **Scalability**: Handles thousands of secrets efficiently

## Quick Start

See [QUICK_START.md](QUICK_START.md) for a 5-minute setup guide.

### Basic Setup

```bash
# 1. Start Vault
./setup-vault.sh setup

# 2. Verify
./setup-vault.sh status

# 3. Access UI
# http://localhost:8200
```

### Use in Python

```python
from shared.vault_client import get_database_config

config = get_database_config('postgres')
print(config)
```

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Vault Server                             │
│  - KV Secrets Engine (v2)                                    │
│  - AppRole Authentication                                    │
│  - Policy Engine                                             │
│  - Audit Logging                                             │
│  - UI (http://localhost:8200)                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Auth Service │    │  Marketplace  │    │  AI Assistant │
│  AppRole Auth │    │  AppRole Auth │    │  AppRole Auth │
│  Read Secrets │    │  Read Secrets │    │  Read Secrets │
└───────────────┘    └───────────────┘    └───────────────┘
```

### Secret Flow

1. **Service Starts**: Microservice initializes
2. **Authenticate**: Service authenticates with AppRole
3. **Get Token**: Vault returns access token
4. **Read Secrets**: Service reads required secrets
5. **Use Secrets**: Service uses secrets (DB password, API keys)
6. **Token Expires**: Token expires after TTL (1-4 hours)
7. **Renew/Re-auth**: Service renews token or re-authenticates

## Secret Organization

All secrets are stored under the `secret/` path:

### Database Secrets

```
secret/database/
├── postgres          # PostgreSQL configuration
├── mongodb           # MongoDB configuration
├── redis             # Redis configuration
├── timescaledb       # TimescaleDB configuration
└── elasticsearch     # Elasticsearch configuration
```

Example:
```bash
vault kv get secret/database/postgres
# Returns: host, port, username, password, database
```

### Message Queue Secrets

```
secret/rabbitmq/
└── default           # RabbitMQ configuration
```

### Authentication Secrets

```
secret/jwt/
└── default           # JWT secret keys and config
```

### API Keys

```
secret/api-keys/
├── openai            # OpenAI API key
├── twilio            # Twilio credentials
├── stripe            # Stripe payment keys
└── flutterwave       # Flutterwave payment keys
```

### Service-Specific Secrets

```
secret/services/
├── authentication    # Auth service config
├── user              # User service config
├── marketplace       # Marketplace service config
├── ai-assistant      # AI service config
└── ...               # One per service
```

## Python Client

### VaultClient Class

```python
from shared.vault_client import VaultClient

# Initialize client
client = VaultClient(
    url='http://localhost:8200',
    token='your-token'
)

# Get a secret
secret = client.get_secret('database/postgres')
print(secret['password'])

# Store a secret
client.set_secret('api-keys/custom', {
    'api_key': 'xxx',
    'api_secret': 'yyy'
})

# List secrets
secrets = client.list_secrets('database')
print(secrets)  # ['postgres', 'mongodb', 'redis', ...]

# Delete a secret
client.delete_secret('api-keys/custom')

# Health check
if client.health_check():
    print("Vault is healthy")
```

### Convenience Functions

```python
from shared.vault_client import (
    get_database_config,
    get_api_key,
    store_secret
)

# Get database config
db_config = get_database_config('postgres')

# Get API key
openai_key = get_api_key('openai', 'api_key')

# Store secret
store_secret('my-service/config', key1='value1', key2='value2')
```

### Dynamic Database Credentials

```python
# Generate temporary database credentials
creds = client.generate_database_credentials('readonly-role')

print(f"Username: {creds['username']}")
print(f"Password: {creds['password']}")
print(f"Lease ID: {creds['lease_id']}")
print(f"Expires in: {creds['lease_duration']} seconds")

# Renew lease
client.renew_lease(creds['lease_id'], increment=3600)

# Revoke lease
client.revoke_lease(creds['lease_id'])
```

## Django Integration

### Settings Configuration

```python
# settings.py
from shared.vault_client import VaultClient
import os

# Initialize Vault client
vault = VaultClient(
    url=os.getenv('VAULT_ADDR', 'http://localhost:8200'),
    token=os.getenv('VAULT_TOKEN')
)

# Get database configuration
db_config = vault.get_secret('database/postgres')

if db_config:
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

# Get JWT secret
jwt_config = vault.get_secret('jwt/default')
if jwt_config:
    SECRET_KEY = jwt_config['secret_key']

# Get Redis configuration
redis_config = vault.get_secret('database/redis')
if redis_config:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': f"redis://:{redis_config['password']}@{redis_config['host']}:{redis_config['port']}/0",
        }
    }
```

### Service Integration

```python
# marketplace/services/payment_service.py
from shared.vault_client import get_api_key
import stripe

class PaymentService:
    def __init__(self):
        # Get Stripe API key from Vault
        self.stripe_key = get_api_key('stripe', 'secret_key')
        stripe.api_key = self.stripe_key
    
    def create_payment_intent(self, amount, currency='usd'):
        return stripe.PaymentIntent.create(
            amount=amount,
            currency=currency
        )
```

### AppRole Authentication

```python
# For production services, use AppRole instead of root token
import hvac
import json

# Load AppRole credentials
with open('approle-marketplace.json') as f:
    approle = json.load(f)

# Authenticate with AppRole
client = hvac.Client(url='http://localhost:8200')
response = client.auth.approle.login(
    role_id=approle['role_id'],
    secret_id=approle['secret_id']
)

# Use the token
client.token = response['auth']['client_token']

# Now read secrets
secret = client.secrets.kv.v2.read_secret_version(path='database/postgres')
```

## Secret Rotation

### Manual Rotation

```bash
# Update a secret
./setup-vault.sh set database/postgres password=new_password

# Restart services to pick up new secret
docker-compose restart marketplace-service
```

### Automatic Rotation

For dynamic secrets (database credentials):

1. Service requests credentials from Vault
2. Vault generates temporary credentials
3. Credentials expire after lease duration
4. Service requests new credentials before expiry

### Rotation Schedule

| Secret Type | Rotation Frequency |
|-------------|-------------------|
| Database Passwords | Every 90 days |
| API Keys | Every 180 days |
| JWT Secrets | Every 365 days |
| Service Tokens | Every 1-4 hours (dynamic) |

## Security

### Encryption

- **At Rest**: AES-256-GCM encryption
- **In Transit**: TLS (enable in production)
- **Seal/Unseal**: Shamir's Secret Sharing (5 keys, 3 threshold)

### Access Control

**Service Policy** (Read-Only):
```hcl
path "secret/data/database/*" {
  capabilities = ["read"]
}

path "secret/data/api-keys/*" {
  capabilities = ["read"]
}
```

**Admin Policy** (Full Access):
```hcl
path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
```

### Audit Logging

All operations are logged:
- Who accessed what secret
- When it was accessed
- What operation was performed
- Success or failure

View audit logs:
```bash
docker exec agrobridge-vault cat /vault/logs/audit.log | jq
```

### Best Practices

✅ **DO**:
- Use AppRole authentication for services
- Enable TLS in production
- Rotate secrets regularly
- Monitor audit logs
- Backup unseal keys securely
- Use least-privilege policies

❌ **DON'T**:
- Commit `vault-keys.json` to git
- Use root token in production
- Share tokens between services
- Store secrets in code
- Disable audit logging

## Troubleshooting

### Vault is Sealed

**Problem**: Vault shows as sealed after restart

**Solution**:
```bash
./setup-vault.sh unseal
```

### Cannot Access Secrets

**Problem**: Permission denied when reading secrets

**Solutions**:
1. Check authentication: `vault token lookup`
2. Verify policy: `vault token capabilities secret/data/database/postgres`
3. Login with correct token: `./setup-vault.sh login`

### Lost Root Token

**Problem**: Cannot find root token

**Solutions**:
1. Check `vault-keys.json` file
2. If lost, need to reinitialize Vault (loses all data)
3. Generate new root token (requires unseal keys)

### Vault Not Starting

**Problem**: Vault container fails to start

**Solutions**:
1. Check logs: `./setup-vault.sh logs`
2. Verify configuration: `./setup-vault.sh validate`
3. Check port conflicts (8200)
4. Ensure sufficient disk space

## CLI Commands

```bash
# Setup and Management
./setup-vault.sh setup              # Complete setup
./setup-vault.sh start              # Start Vault
./setup-vault.sh stop               # Stop Vault
./setup-vault.sh restart            # Restart Vault
./setup-vault.sh status             # Show status

# Secret Operations
./setup-vault.sh list [path]        # List secrets
./setup-vault.sh get <path>         # Get secret
./setup-vault.sh set <path> k=v     # Set secret
./setup-vault.sh delete <path>      # Delete secret

# Vault Operations
./setup-vault.sh initialize         # Initialize Vault
./setup-vault.sh unseal             # Unseal Vault
./setup-vault.sh seal               # Seal Vault
./setup-vault.sh login              # Login to Vault

# Monitoring
./setup-vault.sh logs               # View logs
./setup-vault.sh validate           # Validate config
```

## Additional Resources

- [Vault Documentation](https://www.vaultproject.io/docs)
- [Vault API Reference](https://www.vaultproject.io/api-docs)
- [HVAC Python Client](https://hvac.readthedocs.io/)
- [Vault Best Practices](https://www.vaultproject.io/docs/internals/security)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Vault logs: `./setup-vault.sh logs`
3. Consult the official Vault documentation
4. Contact the AgroBridge infrastructure team

---

**Last Updated**: December 3, 2025  
**Version**: 1.0.0  
**Maintainer**: AgroBridge Infrastructure Team
