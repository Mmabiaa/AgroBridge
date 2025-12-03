#!/bin/bash

# Vault Initialization Script for AgroBridge
# This script initializes Vault, creates secret paths, and configures policies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Wait for Vault to be ready
wait_for_vault() {
    print_info "Waiting for Vault to be ready..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:8200/v1/sys/health > /dev/null 2>&1; then
            print_success "Vault is ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_error "Vault failed to become ready after ${max_attempts} attempts"
    return 1
}

# Initialize Vault
initialize_vault() {
    print_info "Initializing Vault..."
    
    # Check if already initialized
    if vault status 2>/dev/null | grep -q "Initialized.*true"; then
        print_warning "Vault is already initialized"
        return 0
    fi
    
    # Initialize with 5 key shares and 3 key threshold
    vault operator init \
        -key-shares=5 \
        -key-threshold=3 \
        -format=json > "$SCRIPT_DIR/vault-keys.json"
    
    if [ $? -eq 0 ]; then
        print_success "Vault initialized successfully"
        print_warning "IMPORTANT: Vault keys saved to vault-keys.json"
        print_warning "Store these keys securely and delete this file after backing up!"
        return 0
    else
        print_error "Failed to initialize Vault"
        return 1
    fi
}

# Unseal Vault
unseal_vault() {
    print_info "Unsealing Vault..."
    
    if [ ! -f "$SCRIPT_DIR/vault-keys.json" ]; then
        print_error "vault-keys.json not found. Cannot unseal Vault."
        return 1
    fi
    
    # Extract unseal keys
    local unseal_key_1=$(jq -r '.unseal_keys_b64[0]' "$SCRIPT_DIR/vault-keys.json")
    local unseal_key_2=$(jq -r '.unseal_keys_b64[1]' "$SCRIPT_DIR/vault-keys.json")
    local unseal_key_3=$(jq -r '.unseal_keys_b64[2]' "$SCRIPT_DIR/vault-keys.json")
    
    # Unseal with 3 keys
    vault operator unseal "$unseal_key_1" > /dev/null
    vault operator unseal "$unseal_key_2" > /dev/null
    vault operator unseal "$unseal_key_3" > /dev/null
    
    if vault status | grep -q "Sealed.*false"; then
        print_success "Vault unsealed successfully"
        return 0
    else
        print_error "Failed to unseal Vault"
        return 1
    fi
}

# Login to Vault
login_vault() {
    print_info "Logging in to Vault..."
    
    if [ ! -f "$SCRIPT_DIR/vault-keys.json" ]; then
        print_error "vault-keys.json not found. Cannot login."
        return 1
    fi
    
    # Extract root token
    local root_token=$(jq -r '.root_token' "$SCRIPT_DIR/vault-keys.json")
    
    vault login "$root_token" > /dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Logged in to Vault successfully"
        export VAULT_TOKEN="$root_token"
        return 0
    else
        print_error "Failed to login to Vault"
        return 1
    fi
}

# Enable KV secrets engine
enable_kv_engine() {
    print_info "Enabling KV secrets engine..."
    
    # Check if already enabled
    if vault secrets list | grep -q "^secret/"; then
        print_warning "KV secrets engine already enabled at secret/"
        return 0
    fi
    
    vault secrets enable -path=secret kv-v2
    
    if [ $? -eq 0 ]; then
        print_success "KV secrets engine enabled at secret/"
        return 0
    else
        print_error "Failed to enable KV secrets engine"
        return 1
    fi
}

# Create secret paths for all services
create_secret_paths() {
    print_info "Creating secret paths for all services..."
    
    # Database secrets
    print_info "Creating database secrets..."
    
    vault kv put secret/database/postgres \
        host="postgres" \
        port="5432" \
        username="agrobridge" \
        password="agrobridge_password_change_in_production" \
        database="agrobridge_default"
    
    vault kv put secret/database/mongodb \
        host="mongodb" \
        port="27017" \
        username="agrobridge" \
        password="agrobridge_password_change_in_production" \
        database="agrobridge_default"
    
    vault kv put secret/database/redis \
        host="redis" \
        port="6379" \
        password="agrobridge_redis_change_in_production"
    
    vault kv put secret/database/timescaledb \
        host="timescaledb" \
        port="5432" \
        username="agrobridge" \
        password="agrobridge_password_change_in_production" \
        database="agrobridge_iot_timeseries"
    
    vault kv put secret/database/elasticsearch \
        host="elasticsearch" \
        port="9200" \
        username="elastic" \
        password=""
    
    # RabbitMQ secrets
    print_info "Creating RabbitMQ secrets..."
    
    vault kv put secret/rabbitmq/default \
        host="rabbitmq" \
        port="5672" \
        username="agrobridge" \
        password="agrobridge_password_change_in_production" \
        vhost="agrobridge"
    
    # JWT secrets
    print_info "Creating JWT secrets..."
    
    vault kv put secret/jwt/default \
        secret_key="your-secret-key-change-in-production-min-32-chars" \
        algorithm="HS256" \
        access_token_expiry="900" \
        refresh_token_expiry="604800"
    
    # API keys for external services
    print_info "Creating API key placeholders..."
    
    vault kv put secret/api-keys/openai \
        api_key="your-openai-api-key-here"
    
    vault kv put secret/api-keys/twilio \
        account_sid="your-twilio-account-sid" \
        auth_token="your-twilio-auth-token"
    
    vault kv put secret/api-keys/stripe \
        publishable_key="your-stripe-publishable-key" \
        secret_key="your-stripe-secret-key"
    
    vault kv put secret/api-keys/flutterwave \
        public_key="your-flutterwave-public-key" \
        secret_key="your-flutterwave-secret-key"
    
    # Service-specific secrets
    print_info "Creating service-specific secrets..."
    
    for service in authentication user farm-management marketplace ai-assistant \
                   crop-detection iot notification financial learning \
                   community scheduling analytics payment admin; do
        vault kv put secret/services/$service \
            service_name="$service-service" \
            environment="development" \
            version="1.0.0"
    done
    
    print_success "Secret paths created successfully"
}

# Create Vault policies
create_policies() {
    print_info "Creating Vault policies..."
    
    # Service policy - read-only access to service secrets
    cat > "$SCRIPT_DIR/service-policy.hcl" <<EOF
# Policy for microservices
# Allows read access to service-specific secrets

# Read database secrets
path "secret/data/database/*" {
  capabilities = ["read"]
}

# Read RabbitMQ secrets
path "secret/data/rabbitmq/*" {
  capabilities = ["read"]
}

# Read JWT secrets
path "secret/data/jwt/*" {
  capabilities = ["read"]
}

# Read API keys
path "secret/data/api-keys/*" {
  capabilities = ["read"]
}

# Read service-specific secrets
path "secret/data/services/*" {
  capabilities = ["read"]
}

# List secrets
path "secret/metadata/*" {
  capabilities = ["list"]
}
EOF
    
    vault policy write service-policy "$SCRIPT_DIR/service-policy.hcl"
    
    # Admin policy - full access
    cat > "$SCRIPT_DIR/admin-policy.hcl" <<EOF
# Policy for administrators
# Allows full access to all secrets

path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "sys/*" {
  capabilities = ["read", "list"]
}
EOF
    
    vault policy write admin-policy "$SCRIPT_DIR/admin-policy.hcl"
    
    print_success "Policies created successfully"
}

# Enable AppRole authentication
enable_approle() {
    print_info "Enabling AppRole authentication..."
    
    # Check if already enabled
    if vault auth list | grep -q "^approle/"; then
        print_warning "AppRole authentication already enabled"
        return 0
    fi
    
    vault auth enable approle
    
    if [ $? -eq 0 ]; then
        print_success "AppRole authentication enabled"
        return 0
    else
        print_error "Failed to enable AppRole authentication"
        return 1
    fi
}

# Create AppRole for services
create_approles() {
    print_info "Creating AppRoles for services..."
    
    # Create AppRole for each service
    for service in authentication user farm-management marketplace ai-assistant \
                   crop-detection iot notification financial learning \
                   community scheduling analytics payment admin; do
        
        vault write auth/approle/role/$service-service \
            token_policies="service-policy" \
            token_ttl=1h \
            token_max_ttl=4h \
            secret_id_ttl=0
        
        # Get role ID
        role_id=$(vault read -field=role_id auth/approle/role/$service-service/role-id)
        
        # Generate secret ID
        secret_id=$(vault write -field=secret_id -f auth/approle/role/$service-service/secret-id)
        
        # Save to file
        echo "{\"role_id\": \"$role_id\", \"secret_id\": \"$secret_id\"}" > "$SCRIPT_DIR/approle-$service.json"
        
        print_success "Created AppRole for $service-service"
    done
    
    print_warning "AppRole credentials saved to approle-*.json files"
    print_warning "Store these securely and delete after distributing to services!"
}

# Enable audit logging
enable_audit() {
    print_info "Enabling audit logging..."
    
    # Check if already enabled
    if vault audit list | grep -q "^file/"; then
        print_warning "Audit logging already enabled"
        return 0
    fi
    
    vault audit enable file file_path=/vault/logs/audit.log
    
    if [ $? -eq 0 ]; then
        print_success "Audit logging enabled"
        return 0
    else
        print_error "Failed to enable audit logging"
        return 1
    fi
}

# Main setup function
setup_vault() {
    print_info "Starting Vault setup..."
    
    # Set Vault address
    export VAULT_ADDR='http://localhost:8200'
    
    # Wait for Vault to be ready
    wait_for_vault || return 1
    
    # Initialize Vault
    initialize_vault || return 1
    
    # Unseal Vault
    unseal_vault || return 1
    
    # Login to Vault
    login_vault || return 1
    
    # Enable KV secrets engine
    enable_kv_engine || return 1
    
    # Create secret paths
    create_secret_paths || return 1
    
    # Create policies
    create_policies || return 1
    
    # Enable AppRole authentication
    enable_approle || return 1
    
    # Create AppRoles
    create_approles || return 1
    
    # Enable audit logging
    enable_audit || return 1
    
    print_success "Vault setup completed successfully!"
    echo ""
    print_info "Next steps:"
    echo "  1. Backup vault-keys.json securely"
    echo "  2. Distribute AppRole credentials to services"
    echo "  3. Update production secrets in Vault"
    echo "  4. Delete vault-keys.json and approle-*.json after backing up"
    echo ""
    print_info "Vault UI: http://localhost:8200"
    print_info "Root token: $(jq -r '.root_token' "$SCRIPT_DIR/vault-keys.json")"
}

# Run setup
setup_vault
