#!/bin/bash

# Entrypoint script for AgroBridge microservices
# Handles initialization, migrations, and service startup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Wait for database
wait_for_db() {
    print_info "Waiting for database..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if python -c "import psycopg2; psycopg2.connect('$DATABASE_URL')" 2>/dev/null; then
            print_success "Database is ready"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_error "Database not available after $max_attempts attempts"
    return 1
}

# Wait for Redis
wait_for_redis() {
    print_info "Waiting for Redis..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if redis-cli -u "$REDIS_URL" ping 2>/dev/null | grep -q PONG; then
            print_success "Redis is ready"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_error "Redis not available after $max_attempts attempts"
    return 1
}

# Wait for RabbitMQ
wait_for_rabbitmq() {
    print_info "Waiting for RabbitMQ..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if python -c "import pika; pika.BlockingConnection(pika.URLParameters('$RABBITMQ_URL'))" 2>/dev/null; then
            print_success "RabbitMQ is ready"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_error "RabbitMQ not available after $max_attempts attempts"
    return 1
}

# Register with Consul
register_with_consul() {
    if [ -n "$CONSUL_HOST" ]; then
        print_info "Registering with Consul..."
        python -c "
from service_discovery.service_registration_template import register_with_consul
register_with_consul(
    service_name='${SERVICE_NAME}-service',
    port=${SERVICE_PORT},
    tags=['${SERVICE_NAME}', 'v1', 'django']
)
" || print_error "Failed to register with Consul"
    fi
}

# Run database migrations
run_migrations() {
    print_info "Running database migrations..."
    python manage.py migrate --noinput
    print_success "Migrations complete"
}

# Collect static files
collect_static() {
    print_info "Collecting static files..."
    python manage.py collectstatic --noinput
    print_success "Static files collected"
}

# Create superuser if needed
create_superuser() {
    if [ "$CREATE_SUPERUSER" = "true" ]; then
        print_info "Creating superuser..."
        python manage.py createsuperuser --noinput || true
    fi
}

# Main entrypoint logic
main() {
    print_info "Starting ${SERVICE_NAME} service..."
    
    # Wait for dependencies
    if [ -n "$DATABASE_URL" ]; then
        wait_for_db || exit 1
    fi
    
    if [ -n "$REDIS_URL" ]; then
        wait_for_redis || exit 1
    fi
    
    if [ -n "$RABBITMQ_URL" ]; then
        wait_for_rabbitmq || exit 1
    fi
    
    # Run initialization tasks
    run_migrations
    collect_static
    create_superuser
    
    # Register with service discovery
    register_with_consul
    
    print_success "${SERVICE_NAME} service initialized"
    
    # Execute the main command
    exec "$@"
}

# Run main function
main "$@"
