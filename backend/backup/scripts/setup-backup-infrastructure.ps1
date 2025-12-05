# Setup Backup Infrastructure (PowerShell)
# Configures automated backups, replication, and monitoring for Windows

param(
    [string]$Environment = "development",
    [switch]$SkipDependencies = $false
)

# Colors
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Green }
function Write-Warn { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Step { Write-Host "[STEP] $args" -ForegroundColor Blue }

# Banner
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  AgroBridge Backup Infrastructure Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warn "This script should be run as Administrator for full functionality"
    $continue = Read-Host "Continue anyway? (yes/no)"
    if ($continue -ne "yes") {
        exit 1
    }
}

# Step 1: Install dependencies
if (-not $SkipDependencies) {
    Write-Step "Step 1: Installing dependencies..."
    
    # Check for Chocolatey
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Info "Installing Chocolatey..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
    }
    
    # Install required tools
    Write-Info "Installing backup tools..."
    choco install -y postgresql mongodb-shell redis awscli python3
    
    # Install MinIO client
    if (-not (Get-Command mc -ErrorAction SilentlyContinue)) {
        Write-Info "Installing MinIO client..."
        Invoke-WebRequest -Uri "https://dl.min.io/client/mc/release/windows-amd64/mc.exe" -OutFile "$env:ProgramFiles\mc.exe"
        $env:Path += ";$env:ProgramFiles"
    }
    
    Write-Info "Dependencies installed successfully"
} else {
    Write-Info "Skipping dependency installation"
}

# Step 2: Create backup directories
Write-Step "Step 2: Creating backup directories..."

$backupDirs = @(
    "C:\backups\postgresql",
    "C:\backups\mongodb",
    "C:\backups\redis",
    "C:\backups\files",
    "C:\backups\logs"
)

foreach ($dir in $backupDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Info "Created: $dir"
    } else {
        Write-Info "Already exists: $dir"
    }
}

Write-Info "Backup directories created successfully"

# Step 3: Configure PostgreSQL
Write-Step "Step 3: Configuring PostgreSQL..."

$pgDataDir = "C:\Program Files\PostgreSQL\*\data"
$pgConfPath = Get-ChildItem -Path $pgDataDir -Filter "postgresql.conf" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

if ($pgConfPath) {
    Write-Info "Found PostgreSQL config: $($pgConfPath.FullName)"
    
    # Backup original config
    Copy-Item $pgConfPath.FullName "$($pgConfPath.FullName).backup.$(Get-Date -Format 'yyyyMMdd')"
    
    # Add WAL archiving configuration
    $walConfig = @"

# WAL Archiving Configuration (Added by backup setup)
wal_level = replica
archive_mode = on
archive_command = 'copy "%p" "C:\backups\postgresql\wal_archive\%f"'
archive_timeout = 300
max_wal_senders = 10
wal_keep_size = 1GB
hot_standby = on
"@
    
    Add-Content -Path $pgConfPath.FullName -Value $walConfig
    Write-Info "PostgreSQL WAL archiving configured"
    Write-Warn "Restart PostgreSQL service to apply changes"
} else {
    Write-Warn "PostgreSQL config not found. Configure manually if needed."
}

# Step 4: Configure Redis
Write-Step "Step 4: Configuring Redis..."

$redisConfPath = "C:\Program Files\Redis\redis.windows.conf"
if (Test-Path $redisConfPath) {
    Write-Info "Found Redis config: $redisConfPath"
    
    # Backup original config
    Copy-Item $redisConfPath "$redisConfPath.backup.$(Get-Date -Format 'yyyyMMdd')"
    
    # Enable persistence
    (Get-Content $redisConfPath) -replace '^save.*', 'save 900 1' | Set-Content $redisConfPath
    (Get-Content $redisConfPath) -replace '^appendonly no', 'appendonly yes' | Set-Content $redisConfPath
    
    Write-Info "Redis persistence configured"
    Write-Warn "Restart Redis service to apply changes"
} else {
    Write-Warn "Redis config not found. Configure manually if needed."
}

# Step 5: Configure backup storage
Write-Step "Step 5: Configuring backup storage..."

$storageType = Read-Host "Configure AWS S3 or MinIO? (s3/minio/skip)"

if ($storageType -eq "s3") {
    Write-Info "Configuring AWS S3..."
    $accessKey = Read-Host "AWS Access Key ID"
    $secretKey = Read-Host "AWS Secret Access Key" -AsSecureString
    $region = Read-Host "AWS Region"
    $bucket = Read-Host "S3 Bucket Name"
    
    # Configure AWS CLI
    aws configure set aws_access_key_id $accessKey
    aws configure set aws_secret_access_key ([System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey)))
    aws configure set region $region
    
    # Create bucket
    aws s3 mb "s3://$bucket" 2>$null
    
    # Enable versioning
    aws s3api put-bucket-versioning --bucket $bucket --versioning-configuration Status=Enabled
    
    Write-Info "AWS S3 configured successfully"
    
} elseif ($storageType -eq "minio") {
    Write-Info "Configuring MinIO..."
    $endpoint = Read-Host "MinIO Endpoint (e.g., http://localhost:9000)"
    $accessKey = Read-Host "MinIO Access Key"
    $secretKey = Read-Host "MinIO Secret Key" -AsSecureString
    $bucket = Read-Host "MinIO Bucket Name"
    
    # Configure MinIO client
    mc alias set backup $endpoint $accessKey ([System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey)))
    
    # Create bucket
    mc mb "backup/$bucket" 2>$null
    
    # Enable versioning
    mc version enable "backup/$bucket"
    
    Write-Info "MinIO configured successfully"
} else {
    Write-Warn "Skipping backup storage configuration"
}

# Step 6: Setup scheduled tasks
Write-Step "Step 6: Setting up backup schedules..."

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# PostgreSQL backup - Daily at 2:00 AM
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$scriptDir\backup-postgresql.ps1`""
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
Register-ScheduledTask -TaskName "AgroBridge-PostgreSQL-Backup" -Action $action -Trigger $trigger -Description "Daily PostgreSQL backup" -Force | Out-Null
Write-Info "Scheduled PostgreSQL backup task"

# MongoDB backup - Daily at 3:00 AM
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$scriptDir\backup-mongodb.ps1`""
$trigger = New-ScheduledTaskTrigger -Daily -At 3:00AM
Register-ScheduledTask -TaskName "AgroBridge-MongoDB-Backup" -Action $action -Trigger $trigger -Description "Daily MongoDB backup" -Force | Out-Null
Write-Info "Scheduled MongoDB backup task"

# Redis backup - Every 6 hours
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$scriptDir\backup-redis.ps1`""
$trigger = New-ScheduledTaskTrigger -Once -At 12:00AM -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration ([TimeSpan]::MaxValue)
Register-ScheduledTask -TaskName "AgroBridge-Redis-Backup" -Action $action -Trigger $trigger -Description "Redis backup every 6 hours" -Force | Out-Null
Write-Info "Scheduled Redis backup task"

# File storage backup - Daily at 4:00 AM
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$scriptDir\backup-files.ps1`""
$trigger = New-ScheduledTaskTrigger -Daily -At 4:00AM
Register-ScheduledTask -TaskName "AgroBridge-Files-Backup" -Action $action -Trigger $trigger -Description "Daily file storage backup" -Force | Out-Null
Write-Info "Scheduled file storage backup task"

Write-Info "Backup schedules configured"

# Step 7: Test configuration
Write-Step "Step 7: Testing backup configuration..."

Write-Info "Backup infrastructure setup complete!"
Write-Info "Run manual backups to test configuration"

# Summary
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Backup Infrastructure Setup Complete" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Info "Backup directories: C:\backups\"
Write-Info "Backup scripts: $scriptDir"
Write-Info "Scheduled tasks: Task Scheduler"
Write-Host ""
Write-Info "Next steps:"
Write-Host "  1. Restart PostgreSQL service"
Write-Host "  2. Restart Redis service"
Write-Host "  3. Test backup scripts manually"
Write-Host "  4. Configure MongoDB replica set if needed"
Write-Host "  5. Schedule DR drills"
Write-Host ""
Write-Info "For more information, see: backend\backup\README.md"
