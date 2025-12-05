#!/bin/bash

# Setup script for database infrastructure
# This script initializes all database services and creates necessary configurations

set -e

echo "=========================================="
echo "AgroBridge Database Infrastructure Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
    exit 1
fi

# Create .env.infrastructure if it doesn't exist
if [ ! -f .env.infrastructure ]; then
    echo -e "${YELLOW}Creating .env.infrastructure from example...${NC}"
    cp .env.infrastructure.example .env.infrastructure
    echo -e "${GREEN}✓ Created .env.infrastructure${NC}"
    echo -e "${YELLOW}Please update .env.infrastructure with your configuration${NC}"
fi

# Create necessary directories
echo ""
echo "Creating directories..."
mkdir -p scripts config logs backups

# Make init script executable
chmod +x scripts/init-databases.sh

echo -e "${GREEN}✓ Directories created${NC}"

# Start infrastructure services
echo ""
echo "Starting database infrastructure..."
echo "This may take a few minutes on first run..."
echo ""

docker-compose -f docker-compose.infrastructure.yml up -d

# Wait for services to be healthy
echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "Checking service health..."

services=("postgres" "mongodb" "redis" "elasticsearch")
all_healthy=true

for service in "${services[@]}"; do
    if docker ps --filter "name=agrobridge-$service" --filter "health=healthy" | grep -q "agrobridge-$service"; then
        echo -e "${GREEN}✓ $service is healthy${NC}"
    else
        echo -e "${YELLOW}⚠ $service is starting...${NC}"
        all_healthy=false
    fi
done

if [ "$all_healthy" = false ]; then
    echo ""
    echo -e "${YELLOW}Some services are still starting. Run 'docker-compose -f docker-compose.infrastructure.yml ps' to check status${NC}"
fi

# Display connection information
echo ""
echo "=========================================="
echo "Database Infrastructure Ready!"
echo "=========================================="
echo ""
echo "Connection Information:"
echo "----------------------"
echo "PostgreSQL:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  User: agrobridge"
echo "  Databases: agrobridge_* (one per service)"
echo ""
echo "TimescaleDB:"
echo "  Host: localhost"
echo "  Port: 5433"
echo "  User: agrobridge"
echo "  Database: agrobridge_iot_timeseries"
echo ""
echo "MongoDB:"
echo "  URI: mongodb://localhost:27017/"
echo "  User: agrobridge"
echo ""
echo "Redis:"
echo "  Host: localhost"
echo "  Port: 6379"
echo ""
echo "Elasticsearch:"
echo "  URL: http://localhost:9200"
echo ""
echo "Management Tools (dev profile):"
echo "  PgAdmin: http://localhost:5050"
echo "  Mongo Express: http://localhost:8081"
echo "  Redis Commander: http://localhost:8082"
echo "  Kibana: http://localhost:5601"
echo ""
echo "To start with dev tools:"
echo "  docker-compose -f docker-compose.infrastructure.yml --profile dev up -d"
echo ""
echo "To stop all services:"
echo "  docker-compose -f docker-compose.infrastructure.yml down"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.infrastructure.yml logs -f [service-name]"
echo ""
echo "=========================================="
echo ""
echo -e "${GREEN}Setup completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env.infrastructure with production credentials"
echo "2. Run Django migrations: python manage.py migrate --database=all"
echo "3. Initialize MongoDB indexes: python manage.py setup_mongodb"
echo "4. Initialize Elasticsearch indexes: python manage.py setup_elasticsearch"
