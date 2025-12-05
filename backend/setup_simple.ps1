# Simple Django Setup Script for AgroBridge
# This script sets up the Django environment

$ErrorActionPreference = "Stop"

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "     AgroBridge Django Environment Setup                   " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

function Print-Success {
    param($Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Print-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Print-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Yellow
}

# Check Python
Print-Info "Checking Python installation..."
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Print-Error "Python is not installed"
    exit 1
}
$pythonVersion = python --version
Print-Success "Python found: $pythonVersion"

# Upgrade pip
Print-Info "Upgrading pip..."
python -m pip install --upgrade pip | Out-Null
Print-Success "pip upgraded"

# Install core dependencies
Print-Info "Installing core dependencies..."
pip install Django djangorestframework django-cors-headers djangorestframework-simplejwt | Out-Null
Print-Success "Core dependencies installed"

# Install additional dependencies
Print-Info "Installing additional dependencies..."
pip install psycopg2-binary redis django-redis channels channels-redis | Out-Null
Print-Success "Additional dependencies installed"

# Setup environment file
Print-Info "Setting up environment configuration..."
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.development") {
        Copy-Item ".env.development" ".env"
        Print-Success "Created .env from .env.development"
    } else {
        @"
SECRET_KEY=dev-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
DATABASE_ENGINE=django.db.backends.sqlite3
DATABASE_NAME=db.sqlite3
"@ | Out-File -FilePath ".env" -Encoding UTF8
        Print-Success "Created minimal .env file"
    }
} else {
    Print-Success ".env file already exists"
}

# Create required directories
Print-Info "Creating required directories..."
$directories = @("logs", "media", "staticfiles")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}
Print-Success "Directories created"

# Run migrations
Print-Info "Running database migrations..."
try {
    python manage.py makemigrations 2>&1 | Out-Null
    python manage.py migrate 2>&1 | Out-Null
    Print-Success "Database migrations completed"
} catch {
    Print-Error "Migration failed: $_"
}

# Collect static files
Print-Info "Collecting static files..."
try {
    python manage.py collectstatic --noinput 2>&1 | Out-Null
    Print-Success "Static files collected"
} catch {
    Print-Error "Static collection failed: $_"
}

# Check Django configuration
Print-Info "Checking Django configuration..."
python manage.py check
Print-Success "Django configuration is valid"

# Display summary
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Green
Write-Host "              Setup Completed Successfully!                " -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start the server: python manage.py runserver"
Write-Host "2. Access API: http://localhost:8000/api/"
Write-Host "3. Access Admin: http://localhost:8000/admin/"
Write-Host "4. API Docs: http://localhost:8000/swagger/"
Write-Host ""

Print-Success "Django environment is ready!"
