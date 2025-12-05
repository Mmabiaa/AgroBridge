# Complete Django Setup Script for AgroBridge
# This script sets up the full Django environment with all dependencies

param(
    [switch]$SkipVenv,
    [switch]$SkipMigrations,
    [switch]$SkipStaticFiles,
    [switch]$CreateSuperuser
)

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     AgroBridge Django Full Environment Setup               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Function to print section header
function Print-Section {
    param($Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
}

function Print-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Print-Warning {
    param($Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# Step 1: Check Python
Print-Section "Checking Prerequisites"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Print-Error "Python is not installed. Please install Python 3.11 or higher."
    exit 1
}

$pythonVersion = python --version
Print-Success "Python found: $pythonVersion"

# Step 2: Create/Activate Virtual Environment
if (-not $SkipVenv) {
    Print-Section "Setting Up Virtual Environment"
    
    if (-not (Test-Path "venv")) {
        Write-Host "Creating virtual environment..."
        python -m venv venv
        Print-Success "Virtual environment created"
    } else {
        Print-Success "Virtual environment already exists"
    }
    
    Write-Host "Activating virtual environment..."
    & .\venv\Scripts\Activate.ps1
    Print-Success "Virtual environment activated"
} else {
    Print-Warning "Skipping virtual environment setup"
}

# Step 3: Upgrade pip
Print-Section "Upgrading pip"
python -m pip install --upgrade pip
Print-Success "pip upgraded"

# Step 4: Install Dependencies
Print-Section "Installing Dependencies"

Write-Host "Installing core requirements..."
pip install -r requirements.txt
Print-Success "Core requirements installed"

Write-Host "Installing database requirements..."
if (Test-Path "requirements-database.txt") {
    pip install -r requirements-database.txt
    Print-Success "Database requirements installed"
}

Write-Host "Installing messaging requirements..."
if (Test-Path "requirements-messaging.txt") {
    pip install -r requirements-messaging.txt
    Print-Success "Messaging requirements installed"
}

Write-Host "Installing test requirements..."
if (Test-Path "requirements-test.txt") {
    pip install -r requirements-test.txt
    Print-Success "Test requirements installed"
}

# Install psycopg2 for PostgreSQL support
Write-Host "Installing PostgreSQL driver..."
pip install psycopg2-binary
Print-Success "PostgreSQL driver installed"

# Step 5: Setup Environment File
Print-Section "Setting Up Environment Configuration"

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.development") {
        Copy-Item ".env.development" ".env"
        Print-Success "Created .env from .env.development"
    } elseif (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Print-Success "Created .env from .env.example"
    } else {
        Print-Warning ".env file not found. Creating minimal .env..."
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

# Step 6: Create Required Directories
Print-Section "Creating Required Directories"

$directories = @("logs", "media", "staticfiles", "media/uploads", "media/avatars", "media/products")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Print-Success "Created directory: $dir"
    }
}

# Step 7: Run Migrations
if (-not $SkipMigrations) {
    Print-Section "Running Database Migrations"
    
    Write-Host "Making migrations..."
    python manage.py makemigrations
    
    Write-Host "Applying migrations..."
    python manage.py migrate
    Print-Success "Database migrations completed"
} else {
    Print-Warning "Skipping database migrations"
}

# Step 8: Collect Static Files
if (-not $SkipStaticFiles) {
    Print-Section "Collecting Static Files"
    
    python manage.py collectstatic --noinput
    Print-Success "Static files collected"
} else {
    Print-Warning "Skipping static files collection"
}

# Step 9: Create Superuser
if ($CreateSuperuser) {
    Print-Section "Creating Superuser"
    
    Write-Host "Creating superuser account..."
    python manage.py createsuperuser
    Print-Success "Superuser created"
}

# Step 10: Check Django Configuration
Print-Section "Checking Django Configuration"

Write-Host "Running Django system check..."
python manage.py check
Print-Success "Django configuration is valid"

# Step 11: Display Installed Apps
Print-Section "Installed Django Apps"

python manage.py showmigrations --list | Select-Object -First 30

# Step 12: Test Database Connection
Print-Section "Testing Database Connection"

python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection(); print('✓ Database connection successful')"

# Step 13: Display Summary
Print-Section "Setup Summary"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Setup Completed Successfully!                 ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start the development server:" -ForegroundColor White
Write-Host "   python manage.py runserver" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Access the application:" -ForegroundColor White
Write-Host "   - API: http://localhost:8000/api/" -ForegroundColor Cyan
Write-Host "   - Admin: http://localhost:8000/admin/" -ForegroundColor Cyan
Write-Host "   - API Docs: http://localhost:8000/swagger/" -ForegroundColor Cyan
Write-Host "   - Health Check: http://localhost:8000/health/" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Run tests:" -ForegroundColor White
Write-Host "   cd tests" -ForegroundColor Cyan
Write-Host "   .\run_all_tests.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Create superuser (if not done):" -ForegroundColor White
Write-Host "   python manage.py createsuperuser" -ForegroundColor Cyan
Write-Host ""

# Display environment info
Write-Host "Environment Information:" -ForegroundColor Yellow
Write-Host "  Python: $pythonVersion" -ForegroundColor White
$djangoVersion = python -c "import django; print(django.get_version())"
Write-Host "  Django: $djangoVersion" -ForegroundColor White
Write-Host "  Database: SQLite (db.sqlite3)" -ForegroundColor White
Write-Host "  Debug Mode: Enabled" -ForegroundColor White
Write-Host ""

Print-Success "Django environment is ready for development!"
