# PowerShell script for Windows users
# Setup script for database infrastructure

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "AgroBridge Database Infrastructure Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker is not installed" -ForegroundColor Red
    Write-Host "Please install Docker Desktop: https://docs.docker.com/desktop/install/windows-install/"
    exit 1
}

# Check if Docker Compose is available
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker Compose is not installed" -ForegroundColor Red
    Write-Host "Please install Docker Compose or use Docker Desktop which includes it"
    exit 1
}

# Create .env.infrastructure if it doesn't exist
if (-not (Test-Path .env.infrastructure)) {
    Write-Host "Creating .env.infrastructure from example..." -ForegroundColor Yellow
    Copy-Item .env.infrastructure.example .env.infrastructure
    Write-Host "✓ Created .env.infrastructure" -ForegroundColor Green
    Write-Host "Please update .env.infrastructure with your configuration" -ForegroundColor Yellow
}

# Create necessary directories
Write-Host ""
Write-Host "Creating directories..."
New-Item -ItemType Directory -Force -Path scripts, config, logs, backups | Out-Null
Write-Host "✓ Directories created" -ForegroundColor Green

# Start infrastructure services
Write-Host ""
Write-Host "Starting database infrastructure..."
Write-Host "This may take a few minutes on first run..."
Write-Host ""

docker-compose -f docker-compose.infrastructure.yml up -d

# Wait for services to be healthy
Write-Host ""
Write-Host "Waiting for services to be ready..."
Start-Sleep -Seconds 10

# Check service health
Write-Host ""
Write-Host "Checking service health..."

$services = @("postgres", "mongodb", "redis", "elasticsearch")
$allHealthy = $true

foreach ($service in $services) {
    $container = docker ps --filter "name=agrobridge-$service" --filter "health=healthy" --format "{{.Names}}"
    if ($container -match "agrobridge-$service") {
        Write-Host "✓ $service is healthy" -ForegroundColor Green
    } else {
        Write-Host "⚠ $service is starting..." -ForegroundColor Yellow
        $allHealthy = $false
    }
}

if (-not $allHealthy) {
    Write-Host ""
    Write-Host "Some services are still starting. Run 'docker-compose -f docker-compose.infrastructure.yml ps' to check status" -ForegroundColor Yellow
}

# Display connection information
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Database Infrastructure Ready!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connection Information:"
Write-Host "----------------------"
Write-Host "PostgreSQL:"
Write-Host "  Host: localhost"
Write-Host "  Port: 5432"
Write-Host "  User: agrobridge"
Write-Host "  Databases: agrobridge_* (one per service)"
Write-Host ""
Write-Host "TimescaleDB:"
Write-Host "  Host: localhost"
Write-Host "  Port: 5433"
Write-Host "  User: agrobridge"
Write-Host "  Database: agrobridge_iot_timeseries"
Write-Host ""
Write-Host "MongoDB:"
Write-Host "  URI: mongodb://localhost:27017/"
Write-Host "  User: agrobridge"
Write-Host ""
Write-Host "Redis:"
Write-Host "  Host: localhost"
Write-Host "  Port: 6379"
Write-Host ""
Write-Host "Elasticsearch:"
Write-Host "  URL: http://localhost:9200"
Write-Host ""
Write-Host "Management Tools (dev profile):"
Write-Host "  PgAdmin: http://localhost:5050"
Write-Host "  Mongo Express: http://localhost:8081"
Write-Host "  Redis Commander: http://localhost:8082"
Write-Host "  Kibana: http://localhost:5601"
Write-Host ""
Write-Host "To start with dev tools:"
Write-Host "  docker-compose -f docker-compose.infrastructure.yml --profile dev up -d"
Write-Host ""
Write-Host "To stop all services:"
Write-Host "  docker-compose -f docker-compose.infrastructure.yml down"
Write-Host ""
Write-Host "To view logs:"
Write-Host "  docker-compose -f docker-compose.infrastructure.yml logs -f [service-name]"
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Update .env.infrastructure with production credentials"
Write-Host "2. Run Django migrations: python manage.py migrate --database=all"
Write-Host "3. Initialize MongoDB indexes: python manage.py setup_mongodb"
Write-Host "4. Initialize Elasticsearch indexes: python manage.py setup_elasticsearch"
