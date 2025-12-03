# AgroBridge Consul Service Discovery Setup Script (PowerShell)
# This script manages Consul service discovery infrastructure on Windows

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Argument = ""
)

# Script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Split-Path -Parent $ScriptDir

# Function to print colored output
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if Consul is running
function Test-ConsulRunning {
    $container = docker ps --filter "name=agrobridge-consul" --format "{{.Names}}"
    return $container -eq "agrobridge-consul"
}

# Function to check if Consul is healthy
function Test-ConsulHealthy {
    try {
        docker exec agrobridge-consul consul members 2>&1 | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to start Consul
function Start-Consul {
    Write-Info "Starting Consul service discovery..."
    
    Set-Location $BackendDir
    
    if (Test-ConsulRunning) {
        Write-Warning "Consul is already running"
        return $true
    }
    
    docker-compose -f docker-compose.infrastructure.yml up -d consul
    
    Write-Info "Waiting for Consul to be healthy..."
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        if (Test-ConsulHealthy) {
            Write-Success "Consul is healthy and ready!"
            return $true
        }
        
        $attempt++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
    
    Write-Host ""
    Write-ErrorMsg "Consul failed to become healthy after $maxAttempts attempts"
    return $false
}

# Function to stop Consul
function Stop-Consul {
    Write-Info "Stopping Consul service discovery..."
    
    Set-Location $BackendDir
    
    if (-not (Test-ConsulRunning)) {
        Write-Warning "Consul is not running"
        return $true
    }
    
    docker-compose -f docker-compose.infrastructure.yml stop consul
    Write-Success "Consul stopped successfully"
    return $true
}

# Function to restart Consul
function Restart-Consul {
    Write-Info "Restarting Consul service discovery..."
    Stop-Consul
    Start-Sleep -Seconds 2
    Start-Consul
}

# Function to show Consul status
function Show-Status {
    Write-Info "Checking Consul status..."
    
    if (-not (Test-ConsulRunning)) {
        Write-ErrorMsg "Consul is not running"
        return $false
    }
    
    if (Test-ConsulHealthy) {
        Write-Success "Consul is running and healthy"
    }
    else {
        Write-Warning "Consul is running but not healthy"
    }
    
    Write-Host ""
    Write-Info "Consul cluster members:"
    docker exec agrobridge-consul consul members
    
    Write-Host ""
    Write-Info "Registered services:"
    docker exec agrobridge-consul consul catalog services
    
    Write-Host ""
    Write-Info "Consul UI: http://localhost:8500"
    return $true
}

# Function to show Consul logs
function Show-Logs {
    Write-Info "Showing Consul logs (Ctrl+C to exit)..."
    docker logs -f agrobridge-consul
}

# Function to list all registered services
function Get-Services {
    Write-Info "Listing all registered services..."
    
    if (-not (Test-ConsulRunning)) {
        Write-ErrorMsg "Consul is not running"
        return $false
    }
    
    docker exec agrobridge-consul consul catalog services -tags
    return $true
}

# Function to get service details
function Get-ServiceDetails {
    param([string]$ServiceName)
    
    if ([string]::IsNullOrEmpty($ServiceName)) {
        Write-ErrorMsg "Service name is required"
        Write-Host "Usage: .\setup-consul.ps1 service <service-name>"
        return $false
    }
    
    Write-Info "Getting details for service: $ServiceName"
    
    if (-not (Test-ConsulRunning)) {
        Write-ErrorMsg "Consul is not running"
        return $false
    }
    
    docker exec agrobridge-consul consul catalog service $ServiceName
    return $true
}

# Function to check service health
function Test-ServiceHealth {
    param([string]$ServiceName)
    
    if ([string]::IsNullOrEmpty($ServiceName)) {
        Write-ErrorMsg "Service name is required"
        Write-Host "Usage: .\setup-consul.ps1 health <service-name>"
        return $false
    }
    
    Write-Info "Checking health for service: $ServiceName"
    
    if (-not (Test-ConsulRunning)) {
        Write-ErrorMsg "Consul is not running"
        return $false
    }
    
    docker exec agrobridge-consul consul health service $ServiceName
    return $true
}

# Function to deregister a service
function Remove-Service {
    param([string]$ServiceId)
    
    if ([string]::IsNullOrEmpty($ServiceId)) {
        Write-ErrorMsg "Service ID is required"
        Write-Host "Usage: .\setup-consul.ps1 deregister <service-id>"
        return $false
    }
    
    Write-Info "Deregistering service: $ServiceId"
    
    if (-not (Test-ConsulRunning)) {
        Write-ErrorMsg "Consul is not running"
        return $false
    }
    
    docker exec agrobridge-consul consul services deregister -id="$ServiceId"
    Write-Success "Service deregistered successfully"
    return $true
}

# Function to validate Consul configuration
function Test-Config {
    Write-Info "Validating Consul configuration..."
    
    $configFile = Join-Path $ScriptDir "consul-config.json"
    
    if (-not (Test-Path $configFile)) {
        Write-ErrorMsg "Configuration file not found: consul-config.json"
        return $false
    }
    
    # Try to parse JSON
    try {
        $null = Get-Content $configFile | ConvertFrom-Json
        Write-Success "Configuration file is valid JSON"
    }
    catch {
        Write-ErrorMsg "Configuration file contains invalid JSON"
        return $false
    }
    
    Write-Success "Configuration validation complete"
    return $true
}

# Function to setup complete Consul infrastructure
function Initialize-Consul {
    Write-Info "Setting up Consul service discovery infrastructure..."
    
    # Validate configuration
    if (-not (Test-Config)) {
        return $false
    }
    
    # Start Consul
    if (-not (Start-Consul)) {
        return $false
    }
    
    # Wait a bit for Consul to fully initialize
    Start-Sleep -Seconds 3
    
    # Show status
    Show-Status
    
    Write-Success "Consul setup complete!"
    Write-Host ""
    Write-Info "Next steps:"
    Write-Host "  1. Access Consul UI at: http://localhost:8500"
    Write-Host "  2. Register your services using the Python client"
    Write-Host "  3. Use service discovery in your microservices"
    Write-Host ""
    Write-Info "Example service registration:"
    Write-Host "  python service_discovery/service-registration-template.py"
    
    return $true
}

# Function to remove Consul completely
function Remove-Consul {
    Write-Warning "This will remove Consul and all its data!"
    $confirm = Read-Host "Are you sure? (yes/no)"
    
    if ($confirm -ne "yes") {
        Write-Info "Removal cancelled"
        return $true
    }
    
    Write-Info "Removing Consul..."
    
    Set-Location $BackendDir
    
    # Stop and remove container
    docker-compose -f docker-compose.infrastructure.yml rm -sf consul
    
    # Remove volume
    docker volume rm agrobridge_consul_data 2>$null
    
    Write-Success "Consul removed successfully"
    return $true
}

# Function to show help
function Show-Help {
    Write-Host "AgroBridge Consul Service Discovery Management"
    Write-Host ""
    Write-Host "Usage: .\setup-consul.ps1 <command> [options]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  setup              Complete Consul setup (recommended for first time)"
    Write-Host "  start              Start Consul service"
    Write-Host "  stop               Stop Consul service"
    Write-Host "  restart            Restart Consul service"
    Write-Host "  status             Show Consul status and cluster info"
    Write-Host "  logs               Show Consul logs (follow mode)"
    Write-Host "  validate           Validate Consul configuration"
    Write-Host "  services           List all registered services"
    Write-Host "  service <name>     Get details for a specific service"
    Write-Host "  health <name>      Check health of a specific service"
    Write-Host "  deregister <id>    Deregister a service by ID"
    Write-Host "  remove             Remove Consul completely (including data)"
    Write-Host "  help               Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\setup-consul.ps1 setup                           # Initial setup"
    Write-Host "  .\setup-consul.ps1 start                           # Start Consul"
    Write-Host "  .\setup-consul.ps1 status                          # Check status"
    Write-Host "  .\setup-consul.ps1 services                        # List all services"
    Write-Host "  .\setup-consul.ps1 service marketplace-service     # Get service details"
    Write-Host "  .\setup-consul.ps1 health marketplace-service      # Check service health"
    Write-Host ""
    Write-Host "Consul UI: http://localhost:8500"
}

# Main script logic
switch ($Command.ToLower()) {
    "setup" {
        Initialize-Consul
    }
    "start" {
        Start-Consul
    }
    "stop" {
        Stop-Consul
    }
    "restart" {
        Restart-Consul
    }
    "status" {
        Show-Status
    }
    "logs" {
        Show-Logs
    }
    "validate" {
        Test-Config
    }
    "services" {
        Get-Services
    }
    "service" {
        Get-ServiceDetails -ServiceName $Argument
    }
    "health" {
        Test-ServiceHealth -ServiceName $Argument
    }
    "deregister" {
        Remove-Service -ServiceId $Argument
    }
    "remove" {
        Remove-Consul
    }
    "help" {
        Show-Help
    }
    default {
        Write-ErrorMsg "Unknown command: $Command"
        Write-Host ""
        Show-Help
        exit 1
    }
}
