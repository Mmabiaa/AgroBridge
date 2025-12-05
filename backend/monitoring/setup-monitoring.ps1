# AgroBridge Monitoring Service Setup Script (PowerShell)
# Sets up Prometheus, Grafana, ELK Stack, and Jaeger

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "AgroBridge Monitoring Service Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker is not running" -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host ""
Write-Host "Creating monitoring directories..."
New-Item -ItemType Directory -Force -Path "monitoring\grafana\provisioning\dashboards\json" | Out-Null
New-Item -ItemType Directory -Force -Path "monitoring\prometheus\data" | Out-Null
New-Item -ItemType Directory -Force -Path "monitoring\elasticsearch\data" | Out-Null
New-Item -ItemType Directory -Force -Path "monitoring\jaeger\data" | Out-Null
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

Write-Host "✓ Directories created" -ForegroundColor Green

# Start monitoring services
Write-Host ""
Write-Host "Starting monitoring services..."
Write-Host ""

# Start Prometheus
Write-Host "Starting Prometheus..."
docker-compose -f docker-compose.infrastructure.yml up -d prometheus
Start-Sleep -Seconds 5
Write-Host "✓ Prometheus started on http://localhost:9090" -ForegroundColor Green

# Start Grafana
Write-Host "Starting Grafana..."
docker-compose -f docker-compose.infrastructure.yml up -d grafana
Start-Sleep -Seconds 5
Write-Host "✓ Grafana started on http://localhost:3000 (admin/admin)" -ForegroundColor Green

# Start Alertmanager
Write-Host "Starting Alertmanager..."
docker-compose -f docker-compose.infrastructure.yml up -d alertmanager
Start-Sleep -Seconds 3
Write-Host "✓ Alertmanager started on http://localhost:9093" -ForegroundColor Green

# Start Elasticsearch
Write-Host "Starting Elasticsearch..."
docker-compose -f docker-compose.infrastructure.yml up -d elasticsearch
Start-Sleep -Seconds 10
Write-Host "✓ Elasticsearch started on http://localhost:9200" -ForegroundColor Green

# Start Logstash
Write-Host "Starting Logstash..."
docker-compose -f docker-compose.infrastructure.yml up -d logstash
Start-Sleep -Seconds 5
Write-Host "✓ Logstash started on port 5044" -ForegroundColor Green

# Start Kibana
Write-Host "Starting Kibana..."
docker-compose -f docker-compose.infrastructure.yml up -d kibana
Start-Sleep -Seconds 10
Write-Host "✓ Kibana started on http://localhost:5601" -ForegroundColor Green

# Start Jaeger
Write-Host "Starting Jaeger..."
docker-compose -f docker-compose.infrastructure.yml up -d jaeger
Start-Sleep -Seconds 5
Write-Host "✓ Jaeger started on http://localhost:16686" -ForegroundColor Green

# Start Loki
Write-Host "Starting Loki..."
docker-compose -f docker-compose.infrastructure.yml up -d loki
Start-Sleep -Seconds 3
Write-Host "✓ Loki started on port 3100" -ForegroundColor Green

# Start Node Exporter
Write-Host "Starting Node Exporter..."
docker-compose -f docker-compose.infrastructure.yml up -d node-exporter
Start-Sleep -Seconds 2
Write-Host "✓ Node Exporter started on port 9100" -ForegroundColor Green

# Verify services
Write-Host ""
Write-Host "Verifying services..."
Write-Host ""

# Check Prometheus
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9090/-/healthy" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Prometheus is healthy" -ForegroundColor Green
} catch {
    Write-Host "⚠ Prometheus health check failed" -ForegroundColor Yellow
}

# Check Grafana
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Grafana is healthy" -ForegroundColor Green
} catch {
    Write-Host "⚠ Grafana health check failed" -ForegroundColor Yellow
}

# Check Elasticsearch
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9200/_cluster/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Elasticsearch is healthy" -ForegroundColor Green
} catch {
    Write-Host "⚠ Elasticsearch health check failed" -ForegroundColor Yellow
}

# Check Jaeger
try {
    $response = Invoke-WebRequest -Uri "http://localhost:16686/" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Jaeger is healthy" -ForegroundColor Green
} catch {
    Write-Host "⚠ Jaeger health check failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Monitoring Setup Complete!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the monitoring tools:"
Write-Host ""
Write-Host "  Grafana:       http://localhost:3000 (admin/admin)" -ForegroundColor White
Write-Host "  Prometheus:    http://localhost:9090" -ForegroundColor White
Write-Host "  Alertmanager:  http://localhost:9093" -ForegroundColor White
Write-Host "  Kibana:        http://localhost:5601" -ForegroundColor White
Write-Host "  Jaeger:        http://localhost:16686" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Log in to Grafana and explore dashboards"
Write-Host "  2. Configure alert channels in Alertmanager"
Write-Host "  3. Set up Kibana index patterns"
Write-Host "  4. Instrument services with tracing"
Write-Host ""
Write-Host "To stop monitoring services:"
Write-Host "  docker-compose -f docker-compose.infrastructure.yml down"
Write-Host ""
