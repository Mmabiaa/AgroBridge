#!/bin/bash

# AgroBridge Vault Secrets Management Setup Script
# This script manages HashiCorp Vault infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

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

# Function to check if Vault is running
check_vault_running() {
    if docker ps | grep -q agrobridge-vault; then
        return 0
    else
        return 1
    fi
}

# Function to check if Vault is healthy
check_vault_healthy() {
    if curl -s http://localhost:8200/v1/sys/health > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start Vault
start_vault() {
    print_info "Starting Vault secrets management..."
    
    cd "$BACKEND_DIR"
    
    if check_vault_running; then
        print_warning "Vault is already running"
        return 0
    fi
    
    docker-compose -f docker-compose.infrastructure.yml up -d vault
    
    print_info "Waiting for Vault to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if check_vault_healthy; then
            print_success "Vault is healthy and ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_error "Vault failed to become healthy after ${max_attempts} attempts"
    return 1
}

# Function to stop Vault
stop_vault() {
    print_info "Stopping Vault secrets management..."
    
    cd "$BACKEND_DIR"
    
    if ! check_vault_running; then
        print_warning "Vault is not running"
        return 0
    fi
    
    docker-compose -f docker-compose.infrastructure.yml stop vault
    print_success "Vault stopped successfully"
}

# Function to restart Vault
restart_vault() {
    print_info "Restarting Vault secrets management..."
    stop_vault
    sleep 2
    start_vault
}

# Function to show Vault status
show_status() {
    print_info "Checking Vault status..."
    
    if ! check_vault_running; then
        print_error "Vault is not running"
        return 1
    fi
    
    if check_vault_healthy; then
        print_success "Vault is running and healthy"
    else
        print_warning "Vault is running but not healthy"
    fi
    
    echo ""
    print_info "Vault status:"
    export VAULT_ADDR='http://localhost:8200'
    vault status 2>/dev/null || echo "Vault CLI not available or not authenticated"
    
    echo ""
    print_info "Vault UI: http://localhost:8200"
}

# Function to show Vault logs
show_logs() {
    print_info "Showing Vault logs (Ctrl+C to exit)..."
    docker logs -f agrobridge-vault
}

# Function to initialize Vault
initialize() {
    print_info "Initializing Vault..."
    
    if ! check_vault_running; then
        print_error "Vault is not running. Start it first with: $0 start"
        return 1
    fi
    
    export VAULT_ADDR='http://localhost:8200'
    
    # Run initialization script
    bash "$SCRIPT_DIR/init-vault.sh"
}

# Function to unseal Vault
unseal() {
    print_info "Unsealing Vault..."
    
    if [ ! -f "$SCRIPT_DIR/vault-keys.json" ]; then
        print_error "vault-keys.json not found. Initialize Vault first."
        return 1
    fi
    
    export VAULT_ADDR='http://localhost:8200'
    
    # Extract unseal keys
    local unseal_key_1=$(jq -r '.unseal_keys_b64[0]' "$SCRIPT_DIR/vault-keys.json")
    local unseal_key_2=$(jq -r '.unseal_keys_b64[1]' "$SCRIPT_DIR/vault-keys.json")
    local unseal_key_3=$(jq -r '.unseal_keys_b64[2]' "$SCRIPT_DIR/vault-keys.json")
    
    # Unseal with 3 keys
    vault operator unseal "$unseal_key_1"
    vault operator unseal "$unseal_key_2"
    vault operator unseal "$unseal_key_3"
    
    print_success "Vault unsealed successfully"
}

# Function to seal Vault
seal() {
    print_info "Sealing Vault..."
    
    export VAULT_ADDR='http://localhost:8200'
    
    vault operator seal
    
    print_success "Vault sealed successfully"
}

# Function to login to Vault
login() {
    print_info "Logging in to Vault..."
    
    if [ ! -f "$SCRIPT_DIR/vault-keys.json" ]; then
        print_error "vault-keys.json not found. Initialize Vault first."
        return 1
    fi
    
    export VAULT_ADDR='http://localhost:8200'
    
    # Extract root token
    local root_token=$(jq -r '.root_token' "$SCRIPT_DIR/vault-keys.json")
    
    vault login "$root_token"
    
    print_success "Logged in to Vault successfully"
    print_info "Token exported to VAULT_TOKEN environment variable"
}

# Function to list secrets
list_secrets() {
    local path=${1:-""}
    
    print_info "Listing secrets at path: secret/$path"
    
    export VAULT_ADDR='http://localhost:8200'
    
    if [ ! -f "$SCRIPT_DIR/vault-keys.json" ]; then
        print_error "vault-keys.json not found. Initialize Vault first."
        return 1
    fi
    
    local root_token=$(jq -r '.root_token' "$SCRIPT_DIR/vault-keys.json")
    export VAULT_TOKEN="$root_token"
    
    vault kv list "secret/$path"
}

# Function to get a secret
get_secret() {
    local path=$1
    
    if [ -z "$path" ]; then
        print_error "Secret path is required"
        echo "Usage: $0 get <path>"
        return 1
    fi
    
    print_info "Getting secret at path: secret/$path"
    
    export VAULT_ADDR='http://localhost:8200'
    
    if [ ! -f "$SCRIPT_DIR/vault-keys.json" ]; then
        print_error "vault-keys.json not found. Initialize Vault first."
        return 1
    fi
    
    local root_token=$(jq -r '.root_token' "$SCRIPT_DIR/vault-keys.json")
    export VAULT_TOKEN="$root_token"
    
    vault kv get "secret/$path"
}

# Function to set a secret
set_secret() {
    local path=$1
    shift
    local data="$@"
    
    if [ -z "$path" ] || [ -z "$data" ]; then
        print_error "Secret path and data are required"
        echo "Usage: $0 set <path> key1=value1 key2=value2 ..."
        return 1
    fi
    
    print_info "Setting secret at path: secret/$path"
    
    export VAULT_ADDR='http://localhost:8200'
    
    if [ ! -f "$SCRIPT_DIR/vault-keys.json" ]; then
        print_error "vault-keys.json not found. Initialize Vault first."
        return 1
    fi
    
    local root_token=$(jq -r '.root_token' "$SCRIPT_DIR/vault-keys.json")
    export VAULT_TOKEN="$root_token"
    
    vault kv put "secret/$path" $data
    
    print_success "Secret set successfully"
}

# Function to delete a secret
delete_secret() {
    local path=$1
    
    if [ -z "$path" ]; then
        print_error "Secret path is required"
        echo "Usage: $0 delete <path>"
        return 1
    fi
    
    print_warning "This will delete the secret at: secret/$path"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Deletion cancelled"
        return 0
    fi
    
    export VAULT_ADDR='http://localhost:8200'
    
    if [ ! -f "$SCRIPT_DIR/vault-keys.json" ]; then
        print_error "vault-keys.json not found. Initialize Vault first."
        return 1
    fi
    
    local root_token=$(jq -r '.root_token' "$SCRIPT_DIR/vault-keys.json")
    export VAULT_TOKEN="$root_token"
    
    vault kv delete "secret/$path"
    
    print_success "Secret deleted successfully"
}

# Function to validate Vault configuration
validate_config() {
    print_info "Validating Vault configuration..."
    
    if [ ! -f "$SCRIPT_DIR/vault-config.hcl" ]; then
        print_error "Configuration file not found: vault-config.hcl"
        return 1
    fi
    
    # Basic validation - check if file is readable
    if [ -r "$SCRIPT_DIR/vault-config.hcl" ]; then
        print_success "Configuration file is readable"
    else
        print_error "Configuration file is not readable"
        return 1
    fi
    
    print_success "Configuration validation complete"
}

# Function to setup complete Vault infrastructure
setup_vault() {
    print_info "Setting up Vault secrets management infrastructure..."
    
    # Validate configuration
    validate_config || return 1
    
    # Start Vault
    start_vault || return 1
    
    # Wait a bit for Vault to fully initialize
    sleep 3
    
    # Initialize Vault
    initialize || return 1
    
    # Show status
    show_status
    
    print_success "Vault setup complete!"
    echo ""
    print_info "Next steps:"
    echo "  1. Access Vault UI at: http://localhost:8200"
    echo "  2. Backup vault-keys.json securely"
    echo "  3. Update production secrets"
    echo "  4. Integrate services with Vault"
    echo ""
    print_info "Example secret retrieval:"
    echo "  python -c 'from shared.vault_client import get_database_config; print(get_database_config(\"postgres\"))'"
}

# Function to remove Vault completely
remove_vault() {
    print_warning "This will remove Vault and all its data!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Removal cancelled"
        return 0
    fi
    
    print_info "Removing Vault..."
    
    cd "$BACKEND_DIR"
    
    # Stop and remove container
    docker-compose -f docker-compose.infrastructure.yml rm -sf vault
    
    # Remove volume
    docker volume rm agrobridge_vault_data 2>/dev/null || true
    docker volume rm agrobridge_vault_logs 2>/dev/null || true
    
    print_success "Vault removed successfully"
}

# Function to show help
show_help() {
    echo "AgroBridge Vault Secrets Management"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  setup              Complete Vault setup (recommended for first time)"
    echo "  start              Start Vault service"
    echo "  stop               Stop Vault service"
    echo "  restart            Restart Vault service"
    echo "  status             Show Vault status"
    echo "  logs               Show Vault logs (follow mode)"
    echo "  validate           Validate Vault configuration"
    echo "  initialize         Initialize Vault (creates keys)"
    echo "  unseal             Unseal Vault"
    echo "  seal               Seal Vault"
    echo "  login              Login to Vault"
    echo "  list [path]        List secrets at path"
    echo "  get <path>         Get secret at path"
    echo "  set <path> k=v...  Set secret at path"
    echo "  delete <path>      Delete secret at path"
    echo "  remove             Remove Vault completely (including data)"
    echo "  help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup                                    # Initial setup"
    echo "  $0 start                                    # Start Vault"
    echo "  $0 status                                   # Check status"
    echo "  $0 list database                            # List database secrets"
    echo "  $0 get database/postgres                    # Get Postgres config"
    echo "  $0 set api-keys/openai api_key=sk-xxx      # Set OpenAI key"
    echo ""
    echo "Vault UI: http://localhost:8200"
}

# Main script logic
case "${1:-help}" in
    setup)
        setup_vault
        ;;
    start)
        start_vault
        ;;
    stop)
        stop_vault
        ;;
    restart)
        restart_vault
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    validate)
        validate_config
        ;;
    initialize)
        initialize
        ;;
    unseal)
        unseal
        ;;
    seal)
        seal
        ;;
    login)
        login
        ;;
    list)
        list_secrets "$2"
        ;;
    get)
        get_secret "$2"
        ;;
    set)
        shift
        set_secret "$@"
        ;;
    delete)
        delete_secret "$2"
        ;;
    remove)
        remove_vault
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
