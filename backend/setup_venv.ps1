# PowerShell setup script for Python virtual environments

Write-Host "Setting up Python virtual environments for AgroBridge microservices..." -ForegroundColor Green

# Create main virtual environment
if (-not (Test-Path "venv")) {
    Write-Host "Creating main virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✓ Main virtual environment created" -ForegroundColor Green
} else {
    Write-Host "✓ Main virtual environment already exists" -ForegroundColor Green
}

# Activate virtual environment
& "venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install shared dependencies
Write-Host "Installing shared dependencies..." -ForegroundColor Yellow
pip install -r shared/requirements.txt

# Install main requirements
Write-Host "Installing main requirements..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host ""
Write-Host "✓ Virtual environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To activate the virtual environment, run:" -ForegroundColor Cyan
Write-Host "  venv\Scripts\Activate.ps1" -ForegroundColor White
