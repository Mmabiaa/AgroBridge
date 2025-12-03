# AgroBridge Kong Gateway Setup Script (PowerShell)
# This script automates the setup and configuration of Kong API Gateway

param(
    [Parameter(Position=0)]
    [ValidateSet('setup', 'start', 'stop', 'restart', 'status', 'validate', 'apply', 'logs', 'remove', 'help')]
    [string]$Command = 'setup'
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Split-Path -Parent $ScriptDir
$ComposeFile = Join-Path $BackendDir "docker-compose.infrastructure.yml"
$KongConfig = Join-Path $ScriptDir "kong.yml"

# Functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Docker {
    Write-Info "Checking Docker installation..."
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    }
    
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    }
    
    Write-Info "Docker and Docker Compose are installed"
}

function Test-KongConfig {
    if (-not (Test-Path $KongConfig)) {
        Write-Error "Kong configuration file not found: $KongConfig"
        exit 1
    }
    Write-Info "Kong configuration file found"
}

function Start-KongDatabase {
    Write-Info "Starting Kong database..."
    docker-compose -f $ComposeFile up -d kong-database
    
    Write-Info "Waiting for Kong database to be ready..."
    Start-Sleep -Seconds 10
    
    # Wait for database to be healthy
    $maxAttempts = 30
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        $status = docker-compose -f $ComposeFile ps kong-database
        if ($status -match "healthy") {
            Write-Info "Kong database is ready"
            return
        }
        $attempt++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
    
    Write-Error "Kong database failed to start"
    exit 1
}

function Start-KongMigrations {
    Write-Info "Running Kong database migrations..."
    docker-compose -f $ComposeFile up kong-migration
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Kong migrations completed successfully"
    } else {
        Write-Error "Kong migrations failed"
        exit 1
    }
}

function Start-Kong {
    Write-Info "Starting Kong Gateway..."
    docker-compose -f $ComposeFile up -d kong
    
    Write-Info "Waiting for Kong to be ready..."
    Start-Sleep -Seconds 10
    
    # Wait for Kong to be healthy
    $maxAttempts = 30
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8001/status" -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Info "Kong Gateway is ready"
                return
            }
        } catch {
            # Continue waiting
        }
        $attempt++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
    
    Write-Error "Kong Gateway failed to start"
    exit 1
}

function Test-KongConfig {
    Write-Info "Validating Kong configuration..."
    
    docker run --rm -v "${ScriptDir}:/kong" kong/deck:latest validate --state /kong/kong.yml
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Kong configuration is valid"
    } else {
        Write-Error "Kong configuration validation failed"
        exit 1
    }
}

function Apply-KongConfig {
    Write-Info "Applying Kong configuration..."
    
    docker-compose -f $ComposeFile --profile sync up deck
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Kong configuration applied successfully"
    } else {
        Write-Error "Failed to apply Kong configuration"
        exit 1
    }
}

function Test-KongSetup {
    Write-Info "Verifying Kong setup..."
    
    try {
        # Check Kong status
        $status = Invoke-RestMethod -Uri "http://localhost:8001/status" -UseBasicParsing
        Write-Info "Kong Admin API is accessible"
        
        # Check services
        $services = Invoke-RestMethod -Uri "http://localhost:8001/services" -UseBasicParsing
        $serviceCount = $services.data.Count
        Write-Info "Configured services: $serviceCount"
        
        # Check routes
        $routes = Invoke-RestMethod -Uri "http://localhost:8001/routes" -UseBasicParsing
        $routeCount = $routes.data.Count
        Write-Info "Configured routes: $routeCount"
        
        # Check plugins
        $plugins = Invoke-RestMethod -Uri "http://localhost:8001/plugins" -UseBasicParsing
        $pluginCount = $plugins.data.Count
        Write-Info "Configured plugins: $pluginCount"
        
        Write-Info "Kong setup verification completed"
    } catch {
        Write-Error "Cannot connect to Kong Admin API"
        return
    }
}

function Show-KongInfo {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Kong Gateway Setup Complete!" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Kong Proxy (HTTP):  http://localhost:8000"
    Write-Host "Kong Proxy (HTTPS): https://localhost:8443"
    Write-Host "Kong Admin API:     http://localhost:8001"
    Write-Host "Kong Admin GUI:     http://localhost:8002"
    Write-Host ""
    Write-Host "Test the gateway:"
    Write-Host "  curl http://localhost:8000/health"
    Write-Host ""
    Write-Host "View services:"
    Write-Host "  curl http://localhost:8001/services"
    Write-Host ""
    Write-Host "View routes:"
    Write-Host "  curl http://localhost:8001/routes"
    Write-Host ""
    Write-Host "View logs:"
    Write-Host "  docker logs agrobridge-kong -f"
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
}

function Stop-Kong {
    Write-Info "Stopping Kong Gateway..."
    docker-compose -f $ComposeFile stop kong deck
    Write-Info "Kong Gateway stopped"
}

function Remove-Kong {
    Write-Warning "This will remove Kong Gateway and its database"
    $confirmation = Read-Host "Are you sure? (y/N)"
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        Write-Info "Removing Kong Gateway..."
        docker-compose -f $ComposeFile down kong deck kong-migration kong-database
        docker volume rm agrobridge_kong_data 2>$null
        Write-Info "Kong Gateway removed"
    } else {
        Write-Info "Removal cancelled"
    }
}

function Show-Usage {
    Write-Host "Usage: .\setup-kong.ps1 [command]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  setup       - Complete Kong setup (database, migrations, gateway, config)"
    Write-Host "  start       - Start Kong Gateway"
    Write-Host "  stop        - Stop Kong Gateway"
    Write-Host "  restart     - Restart Kong Gateway"
    Write-Host "  status      - Show Kong status"
    Write-Host "  validate    - Validate Kong configuration"
    Write-Host "  apply       - Apply Kong configuration"
    Write-Host "  logs        - Show Kong logs"
    Write-Host "  remove      - Remove Kong Gateway and database"
    Write-Host "  help        - Show this help message"
    Write-Host ""
}

# Main script
switch ($Command) {
    'setup' {
        Write-Info "Starting Kong Gateway setup..."
        Test-Docker
        Test-KongConfig
        Start-KongDatabase
        Start-KongMigrations
        Start-Kong
        Test-KongConfig
        Apply-KongConfig
        Test-KongSetup
        Show-KongInfo
    }
    
    'start' {
        Write-Info "Starting Kong Gateway..."
        docker-compose -f $ComposeFile up -d kong-database kong
        Start-Sleep -Seconds 5
        Test-KongSetup
    }
    
    'stop' {
        Stop-Kong
    }
    
    'restart' {
        Stop-Kong
        Start-Sleep -Seconds 2
        docker-compose -f $ComposeFile up -d kong
        Start-Sleep -Seconds 5
        Test-KongSetup
    }
    
    'status' {
        Test-KongSetup
    }
    
    'validate' {
        Test-KongConfig
        Test-KongConfig
    }
    
    'apply' {
        Test-KongConfig
        Test-KongConfig
        Apply-KongConfig
        Test-KongSetup
    }
    
    'logs' {
        docker logs agrobridge-kong -f
    }
    
    'remove' {
        Remove-Kong
    }
    
    'help' {
        Show-Usage
    }
    
    default {
        Write-Error "Unknown command: $Command"
        Show-Usage
        exit 1
    }
}
