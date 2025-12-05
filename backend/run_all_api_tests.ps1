#!/usr/bin/env pwsh
# Complete API testing script for AgroBridge

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AgroBridge Complete API Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Check if server is running
Write-Host "Checking if Django server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health/" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✓ Server is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Server is not running!" -ForegroundColor Red
    Write-Host "Please start the server with: python manage.py runserver" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Starting server now..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; python manage.py runserver"
    Write-Host "Waiting for server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running Live API Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run live tests
python tests/test_endpoints_live.py

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running Comprehensive API Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run comprehensive tests
python tests/test_endpoints_comprehensive.py

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test results have been saved to:" -ForegroundColor Green
Write-Host "  - tests/TEST_RESULTS_COMPREHENSIVE.md" -ForegroundColor White
Write-Host ""
Write-Host "View API documentation at:" -ForegroundColor Green
Write-Host "  - http://127.0.0.1:8000/api/docs/ (Swagger)" -ForegroundColor White
Write-Host "  - http://127.0.0.1:8000/api/redoc/ (ReDoc)" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
