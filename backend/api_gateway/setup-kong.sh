#!/bin/bash

# AgroBridge Kong Gateway Setup Script
# This script automates the setup and configuration of Kong API Gateway

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$BACKEND_DIR/docker-compose.infrastructure.yml"
KONG_CONFIG="$SCRIPT_DIR/kong.yml"

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_info "Docker and Docker Compose are installed"
}

check_kong_config() {
    if [ ! -f "$KONG_CONFIG" ]; then
        print_error "Kong configuration file not found: $KONG_CONFIG"
        exit 1
    fi
    print_info "Kong configuration file found"
}

start_kong_database() {
    print_info "Starting Kong database..."
    docker-compose -f "$COMPOSE_FILE" up -d kong-database
    
    print_info "Waiting for Kong database to be ready..."
    sleep 10
    
    # Wait for database to be healthy
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f "$COMPOSE_FILE" ps kong-database | grep -q "healthy"; then
            print_info "Kong database is ready"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_error "Kong database failed to start"
    exit 1
}

run_kong_migrations() {
    print_info "Running Kong database migrations..."
    docker-compose -f "$COMPOSE_FILE" up kong-migration
    
    if [ $? -eq 0 ]; then
        print_info "Kong migrations completed successfully"
    else
        print_error "Kong migrations failed"
        exit 1
    fi
}

start_kong() {
    print_info "Starting Kong Gateway..."
    docker-compose -f "$COMPOSE_FILE" up -d kong
    
    print_info "Waiting for Kong to be ready..."
    sleep 10
    
    # Wait for Kong to be healthy
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:8001/status > /dev/null 2>&1; then
            print_info "Kong Gateway is ready"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_error "Kong Gateway failed to start"
    exit 1
}

validate_kong_config() {
    print_info "Validating Kong configuration..."
    
    docker run --rm -v "$SCRIPT_DIR:/kong" kong/deck:latest validate --state /kong/kong.yml
    
    if [ $? -eq 0 ]; then
        print_info "Kong configuration is valid"
    else
        print_error "Kong configuration validation failed"
        exit 1
    fi
}

apply_kong_config() {
    print_info "Applying Kong configuration..."
    
    docker-compose -f "$COMPOSE_FILE" --profile sync up deck
    
    if [ $? -eq 0 ]; then
        print_info "Kong configuration applied successfully"
    else
        print_error "Failed to apply Kong configuration"
        exit 1
    fi
}

verify_kong_setup() {
    print_info "Verifying Kong setup..."
    
    # Check Kong status
    local status=$(curl -s http://localhost:8001/status)
    if [ -z "$status" ]; then
        print_error "Cannot connect to Kong Admin API"
        return 1
    fi
    print_info "Kong Admin API is accessible"
    
    # Check services
    local services=$(curl -s http://localhost:8001/services | grep -o '"name"' | wc -l)
    print_info "Configured services: $services"
    
    # Check routes
    local routes=$(curl -s http://localhost:8001/routes | grep -o '"name"' | wc -l)
    print_info "Configured routes: $routes"
    
    # Check plugins
    local plugins=$(curl -s http://localhost:8001/plugins | grep -o '"name"' | wc -l)
    print_info "Configured plugins: $plugins"
    
    print_info "Kong setup verification completed"
}

show_kong_info() {
    echo ""
    echo "=========================================="
    echo "Kong Gateway Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Kong Proxy (HTTP):  http://localhost:8000"
    echo "Kong Proxy (HTTPS): https://localhost:8443"
    echo "Kong Admin API:     http://localhost:8001"
    echo "Kong Admin GUI:     http://localhost:8002"
    echo ""
    echo "Test the gateway:"
    echo "  curl http://localhost:8000/health"
    echo ""
    echo "View services:"
    echo "  curl http://localhost:8001/services"
    echo ""
    echo "View routes:"
    echo "  curl http://localhost:8001/routes"
    echo ""
    echo "View logs:"
    echo "  docker logs agrobridge-kong -f"
    echo ""
    echo "=========================================="
}

stop_kong() {
    print_info "Stopping Kong Gateway..."
    docker-compose -f "$COMPOSE_FILE" stop kong deck
    print_info "Kong Gateway stopped"
}

remove_kong() {
    print_warning "This will remove Kong Gateway and its database"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Removing Kong Gateway..."
        docker-compose -f "$COMPOSE_FILE" down kong deck kong-migration kong-database
        docker volume rm agrobridge_kong_data 2>/dev/null || true
        print_info "Kong Gateway removed"
    else
        print_info "Removal cancelled"
    fi
}

show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup       - Complete Kong setup (database, migrations, gateway, config)"
    echo "  start       - Start Kong Gateway"
    echo "  stop        - Stop Kong Gateway"
    echo "  restart     - Restart Kong Gateway"
    echo "  status      - Show Kong status"
    echo "  validate    - Validate Kong configuration"
    echo "  apply       - Apply Kong configuration"
    echo "  logs        - Show Kong logs"
    echo "  remove      - Remove Kong Gateway and database"
    echo "  help        - Show this help message"
    echo ""
}

# Main script
case "${1:-setup}" in
    setup)
        print_info "Starting Kong Gateway setup..."
        check_docker
        check_kong_config
        start_kong_database
        run_kong_migrations
        start_kong
        validate_kong_config
        apply_kong_config
        verify_kong_setup
        show_kong_info
        ;;
    
    start)
        print_info "Starting Kong Gateway..."
        docker-compose -f "$COMPOSE_FILE" up -d kong-database kong
        sleep 5
        verify_kong_setup
        ;;
    
    stop)
        stop_kong
        ;;
    
    restart)
        stop_kong
        sleep 2
        docker-compose -f "$COMPOSE_FILE" up -d kong
        sleep 5
        verify_kong_setup
        ;;
    
    status)
        verify_kong_setup
        ;;
    
    validate)
        check_kong_config
        validate_kong_config
        ;;
    
    apply)
        check_kong_config
        validate_kong_config
        apply_kong_config
        verify_kong_setup
        ;;
    
    logs)
        docker logs agrobridge-kong -f
        ;;
    
    remove)
        remove_kong
        ;;
    
    help|--help|-h)
        show_usage
        ;;
    
    *)
        print_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac
