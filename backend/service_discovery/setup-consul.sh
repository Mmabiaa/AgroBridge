#!/bin/bash

# AgroBridge Consul Service Discovery Setup Script
# This script manages Consul service discovery infrastructure

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

# Function to check if Consul is running
check_consul_running() {
    if docker ps | grep -q agrobridge-consul; then
        return 0
    else
        return 1
    fi
}

# Function to check if Consul is healthy
check_consul_healthy() {
    if docker exec agrobridge-consul consul members &>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to start Consul
start_consul() {
    print_info "Starting Consul service discovery..."
    
    cd "$BACKEND_DIR"
    
    if check_consul_running; then
        print_warning "Consul is already running"
        return 0
    fi
    
    docker-compose -f docker-compose.infrastructure.yml up -d consul
    
    print_info "Waiting for Consul to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if check_consul_healthy; then
            print_success "Consul is healthy and ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_error "Consul failed to become healthy after ${max_attempts} attempts"
    return 1
}

# Function to stop Consul
stop_consul() {
    print_info "Stopping Consul service discovery..."
    
    cd "$BACKEND_DIR"
    
    if ! check_consul_running; then
        print_warning "Consul is not running"
        return 0
    fi
    
    docker-compose -f docker-compose.infrastructure.yml stop consul
    print_success "Consul stopped successfully"
}

# Function to restart Consul
restart_consul() {
    print_info "Restarting Consul service discovery..."
    stop_consul
    sleep 2
    start_consul
}

# Function to show Consul status
show_status() {
    print_info "Checking Consul status..."
    
    if ! check_consul_running; then
        print_error "Consul is not running"
        return 1
    fi
    
    if check_consul_healthy; then
        print_success "Consul is running and healthy"
    else
        print_warning "Consul is running but not healthy"
    fi
    
    echo ""
    print_info "Consul cluster members:"
    docker exec agrobridge-consul consul members
    
    echo ""
    print_info "Registered services:"
    docker exec agrobridge-consul consul catalog services
    
    echo ""
    print_info "Consul UI: http://localhost:8500"
}

# Function to show Consul logs
show_logs() {
    print_info "Showing Consul logs (Ctrl+C to exit)..."
    docker logs -f agrobridge-consul
}

# Function to list all registered services
list_services() {
    print_info "Listing all registered services..."
    
    if ! check_consul_running; then
        print_error "Consul is not running"
        return 1
    fi
    
    docker exec agrobridge-consul consul catalog services -tags
}

# Function to get service details
get_service_details() {
    local service_name=$1
    
    if [ -z "$service_name" ]; then
        print_error "Service name is required"
        echo "Usage: $0 service <service-name>"
        return 1
    fi
    
    print_info "Getting details for service: $service_name"
    
    if ! check_consul_running; then
        print_error "Consul is not running"
        return 1
    fi
    
    docker exec agrobridge-consul consul catalog service "$service_name"
}

# Function to check service health
check_service_health() {
    local service_name=$1
    
    if [ -z "$service_name" ]; then
        print_error "Service name is required"
        echo "Usage: $0 health <service-name>"
        return 1
    fi
    
    print_info "Checking health for service: $service_name"
    
    if ! check_consul_running; then
        print_error "Consul is not running"
        return 1
    fi
    
    docker exec agrobridge-consul consul health service "$service_name"
}

# Function to deregister a service
deregister_service() {
    local service_id=$1
    
    if [ -z "$service_id" ]; then
        print_error "Service ID is required"
        echo "Usage: $0 deregister <service-id>"
        return 1
    fi
    
    print_info "Deregistering service: $service_id"
    
    if ! check_consul_running; then
        print_error "Consul is not running"
        return 1
    fi
    
    docker exec agrobridge-consul consul services deregister -id="$service_id"
    print_success "Service deregistered successfully"
}

# Function to validate Consul configuration
validate_config() {
    print_info "Validating Consul configuration..."
    
    if [ ! -f "$SCRIPT_DIR/consul-config.json" ]; then
        print_error "Configuration file not found: consul-config.json"
        return 1
    fi
    
    # Check if jq is installed for JSON validation
    if command -v jq &>/dev/null; then
        if jq empty "$SCRIPT_DIR/consul-config.json" &>/dev/null; then
            print_success "Configuration file is valid JSON"
        else
            print_error "Configuration file contains invalid JSON"
            return 1
        fi
    else
        print_warning "jq not installed, skipping JSON validation"
    fi
    
    print_success "Configuration validation complete"
}

# Function to setup complete Consul infrastructure
setup_consul() {
    print_info "Setting up Consul service discovery infrastructure..."
    
    # Validate configuration
    validate_config || return 1
    
    # Start Consul
    start_consul || return 1
    
    # Wait a bit for Consul to fully initialize
    sleep 3
    
    # Show status
    show_status
    
    print_success "Consul setup complete!"
    echo ""
    print_info "Next steps:"
    echo "  1. Access Consul UI at: http://localhost:8500"
    echo "  2. Register your services using the Python client"
    echo "  3. Use service discovery in your microservices"
    echo ""
    print_info "Example service registration:"
    echo "  python service_discovery/service-registration-template.py"
}

# Function to remove Consul completely
remove_consul() {
    print_warning "This will remove Consul and all its data!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Removal cancelled"
        return 0
    fi
    
    print_info "Removing Consul..."
    
    cd "$BACKEND_DIR"
    
    # Stop and remove container
    docker-compose -f docker-compose.infrastructure.yml rm -sf consul
    
    # Remove volume
    docker volume rm agrobridge_consul_data 2>/dev/null || true
    
    print_success "Consul removed successfully"
}

# Function to show help
show_help() {
    echo "AgroBridge Consul Service Discovery Management"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  setup              Complete Consul setup (recommended for first time)"
    echo "  start              Start Consul service"
    echo "  stop               Stop Consul service"
    echo "  restart            Restart Consul service"
    echo "  status             Show Consul status and cluster info"
    echo "  logs               Show Consul logs (follow mode)"
    echo "  validate           Validate Consul configuration"
    echo "  services           List all registered services"
    echo "  service <name>     Get details for a specific service"
    echo "  health <name>      Check health of a specific service"
    echo "  deregister <id>    Deregister a service by ID"
    echo "  remove             Remove Consul completely (including data)"
    echo "  help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup                           # Initial setup"
    echo "  $0 start                           # Start Consul"
    echo "  $0 status                          # Check status"
    echo "  $0 services                        # List all services"
    echo "  $0 service marketplace-service     # Get service details"
    echo "  $0 health marketplace-service      # Check service health"
    echo ""
    echo "Consul UI: http://localhost:8500"
}

# Main script logic
case "${1:-help}" in
    setup)
        setup_consul
        ;;
    start)
        start_consul
        ;;
    stop)
        stop_consul
        ;;
    restart)
        restart_consul
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
    services)
        list_services
        ;;
    service)
        get_service_details "$2"
        ;;
    health)
        check_service_health "$2"
        ;;
    deregister)
        deregister_service "$2"
        ;;
    remove)
        remove_consul
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
