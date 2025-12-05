#!/bin/bash
# AgroBridge Monitoring Service Setup Script
# Sets up Prometheus, Grafana, ELK Stack, and Jaeger

set -e

echo "========================================="
echo "AgroBridge Monitoring Service Setup"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Create necessary directories
echo ""
echo "Creating monitoring directories..."
mkdir -p monitoring/grafana/provisioning/dashboards/json
mkdir -p monitoring/prometheus/data
mkdir -p monitoring/elasticsearch/data
mkdir -p monitoring/jaeger/data
mkdir -p logs

echo -e "${GREEN}✓ Directories created${NC}"

# Set permissions
echo ""
echo "Setting permissions..."
chmod -R 755 monitoring/
chmod +x monitoring/setup-monitoring.sh

echo -e "${GREEN}✓ Permissions set${NC}"

# Start monitoring services
echo ""
echo "Starting monitoring services..."
echo ""

# Start Prometheus
echo "Starting Prometheus..."
docker-compose -f docker-compose.infrastructure.yml up -d prometheus
sleep 5
echo -e "${GREEN}✓ Prometheus started on http://localhost:9090${NC}"

# Start Grafana
echo "Starting Grafana..."
docker-compose -f docker-compose.infrastructure.yml up -d grafana
sleep 5
echo -e "${GREEN}✓ Grafana started on http://localhost:3000 (admin/admin)${NC}"

# Start Alertmanager
echo "Starting Alertmanager..."
docker-compose -f docker-compose.infrastructure.yml up -d alertmanager
sleep 3
echo -e "${GREEN}✓ Alertmanager started on http://localhost:9093${NC}"

# Start Elasticsearch
echo "Starting Elasticsearch..."
docker-compose -f docker-compose.infrastructure.yml up -d elasticsearch
sleep 10
echo -e "${GREEN}✓ Elasticsearch started on http://localhost:9200${NC}"

# Start Logstash
echo "Starting Logstash..."
docker-compose -f docker-compose.infrastructure.yml up -d logstash
sleep 5
echo -e "${GREEN}✓ Logstash started on port 5044${NC}"

# Start Kibana
echo "Starting Kibana..."
docker-compose -f docker-compose.infrastructure.yml up -d kibana
sleep 10
echo -e "${GREEN}✓ Kibana started on http://localhost:5601${NC}"

# Start Jaeger
echo "Starting Jaeger..."
docker-compose -f docker-compose.infrastructure.yml up -d jaeger
sleep 5
echo -e "${GREEN}✓ Jaeger started on http://localhost:16686${NC}"

# Start Loki
echo "Starting Loki..."
docker-compose -f docker-compose.infrastructure.yml up -d loki
sleep 3
echo -e "${GREEN}✓ Loki started on port 3100${NC}"

# Start Node Exporter
echo "Starting Node Exporter..."
docker-compose -f docker-compose.infrastructure.yml up -d node-exporter
sleep 2
echo -e "${GREEN}✓ Node Exporter started on port 9100${NC}"

# Verify services
echo ""
echo "Verifying services..."
echo ""

# Check Prometheus
if curl -s http://localhost:9090/-/healthy > /dev/null; then
    echo -e "${GREEN}✓ Prometheus is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Prometheus health check failed${NC}"
fi

# Check Grafana
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✓ Grafana is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Grafana health check failed${NC}"
fi

# Check Elasticsearch
if curl -s http://localhost:9200/_cluster/health > /dev/null; then
    echo -e "${GREEN}✓ Elasticsearch is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Elasticsearch health check failed${NC}"
fi

# Check Jaeger
if curl -s http://localhost:16686/ > /dev/null; then
    echo -e "${GREEN}✓ Jaeger is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Jaeger health check failed${NC}"
fi

echo ""
echo "========================================="
echo "Monitoring Setup Complete!"
echo "========================================="
echo ""
echo "Access the monitoring tools:"
echo ""
echo "  Grafana:       http://localhost:3000 (admin/admin)"
echo "  Prometheus:    http://localhost:9090"
echo "  Alertmanager:  http://localhost:9093"
echo "  Kibana:        http://localhost:5601"
echo "  Jaeger:        http://localhost:16686"
echo ""
echo "Next steps:"
echo "  1. Log in to Grafana and explore dashboards"
echo "  2. Configure alert channels in Alertmanager"
echo "  3. Set up Kibana index patterns"
echo "  4. Instrument services with tracing"
echo ""
echo "To stop monitoring services:"
echo "  docker-compose -f docker-compose.infrastructure.yml down"
echo ""
