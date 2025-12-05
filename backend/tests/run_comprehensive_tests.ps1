#!/usr/bin/env pwsh
# Comprehensive test runner for AgroBridge API endpoints

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AgroBridge Comprehensive API Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
Set-Location -Path $PSScriptRoot\..

# Check if virtual environment exists
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "Virtual environment not found. Creating..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Green
& .\venv\Scripts\Activate.ps1

# Install/upgrade dependencies
Write-Host "Installing dependencies..." -ForegroundColor Green
pip install -q -r requirements.txt
pip install -q -r requirements-test.txt

# Set environment variables
$env:DJANGO_SETTINGS_MODULE = "agrobridge_backend.settings"
$env:PYTHONPATH = $PWD

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Database Migrations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check migrations
Write-Host "Checking migrations..." -ForegroundColor Green
python manage.py showmigrations

# Apply migrations
Write-Host "Applying migrations..." -ForegroundColor Green
python manage.py migrate --noinput

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2: Running Infrastructure Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

pytest tests/test_infrastructure.py -v --tb=short

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 3: Running Endpoint Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Run all endpoint tests with detailed output
pytest tests/test_all_endpoints.py -v --tb=short --maxfail=5

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 4: Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Run all tests with coverage
pytest tests/test_all_endpoints.py --tb=line -v --color=yes

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tests Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
