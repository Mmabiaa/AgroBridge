# PowerShell script to start both backend and frontend servers for phone testing
# This script binds servers to all network interfaces so they're accessible from your phone

Write-Host "🚀 Starting AgroBridge Development Servers for Phone Testing" -ForegroundColor Green
Write-Host ""

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*" } | Select-Object -First 1).IPAddress

if (-not $localIP) {
    $localIP = "127.0.0.1"
    Write-Host "⚠️  Could not detect local network IP. Using 127.0.0.1" -ForegroundColor Yellow
    Write-Host "   You may need to manually find your IP address using: ipconfig" -ForegroundColor Yellow
} else {
    Write-Host "📱 Your local IP address: $localIP" -ForegroundColor Cyan
    Write-Host ""
}

# Check if .env file exists in root
$rootEnvPath = ".\.env"
if (Test-Path $rootEnvPath) {
    Write-Host "📝 Updating .env file with local IP..." -ForegroundColor Cyan
    
    # Read current .env
    $envContent = Get-Content $rootEnvPath -Raw
    
    # Update VITE_API_URL if it exists, otherwise add it
    if ($envContent -match "VITE_API_URL=.*") {
        $envContent = $envContent -replace "VITE_API_URL=.*", "VITE_API_URL=http://$localIP`:8000/api/v1"
    } else {
        $envContent += "`nVITE_API_URL=http://$localIP`:8000/api/v1`n"
    }
    
    # Write back
    Set-Content -Path $rootEnvPath -Value $envContent
    Write-Host "✅ Updated VITE_API_URL to http://$localIP`:8000/api/v1" -ForegroundColor Green
}

# Check if frontend .env.local file exists (Vite prioritizes .env.local)
$frontendEnvLocalPath = ".\frontend\.env.local"
$frontendEnvPath = ".\frontend\.env"

if (Test-Path $frontendEnvLocalPath) {
    Write-Host "📝 Updating frontend .env.local file with local IP..." -ForegroundColor Cyan
    
    $envContent = Get-Content $frontendEnvLocalPath -Raw
    
    if ($envContent -match "VITE_API_URL=.*") {
        $envContent = $envContent -replace "VITE_API_URL=.*", "VITE_API_URL=http://$localIP`:8000/api/v1"
    } else {
        $envContent += "`nVITE_API_URL=http://$localIP`:8000/api/v1`n"
    }
    
    # Also update WebSocket URL if it exists
    if ($envContent -match "VITE_WEBSOCKET_URL=.*") {
        $envContent = $envContent -replace "VITE_WEBSOCKET_URL=.*", "VITE_WEBSOCKET_URL=ws://$localIP`:8000/ws/"
    }
    
    Set-Content -Path $frontendEnvLocalPath -Value $envContent
    Write-Host "✅ Updated frontend .env.local VITE_API_URL" -ForegroundColor Green
} elseif (Test-Path $frontendEnvPath) {
    Write-Host "📝 Updating frontend .env file with local IP..." -ForegroundColor Cyan
    
    $envContent = Get-Content $frontendEnvPath -Raw
    
    if ($envContent -match "VITE_API_URL=.*") {
        $envContent = $envContent -replace "VITE_API_URL=.*", "VITE_API_URL=http://$localIP`:8000/api/v1"
    } else {
        $envContent += "`nVITE_API_URL=http://$localIP`:8000/api/v1`n"
    }
    
    Set-Content -Path $frontendEnvPath -Value $envContent
    Write-Host "✅ Updated frontend .env VITE_API_URL" -ForegroundColor Green
} else {
    # Create frontend .env.local if it doesn't exist (Vite prioritizes this)
    Write-Host "📝 Creating frontend .env.local file..." -ForegroundColor Cyan
    $frontendEnvContent = "VITE_API_URL=http://$localIP`:8000/api/v1`nVITE_WEBSOCKET_URL=ws://$localIP`:8000/ws/`n"
    Set-Content -Path $frontendEnvLocalPath -Value $frontendEnvContent
    Write-Host "✅ Created frontend .env.local file" -ForegroundColor Green
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📱 PHONE ACCESS INFORMATION" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "Frontend URL: http://$localIP`:8080" -ForegroundColor Green
Write-Host "Backend API:  http://$localIP`:8000/api/v1" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Make sure your phone is on the same Wi-Fi network!" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Function to start backend
function Start-Backend {
    Write-Host "🔧 Starting Backend Server..." -ForegroundColor Cyan
    Set-Location backend
    
    # Activate virtual environment if it exists
    if (Test-Path ".\venv\Scripts\Activate.ps1") {
        & .\venv\Scripts\Activate.ps1
    } elseif (Test-Path "..\venv\Scripts\Activate.ps1") {
        & ..\venv\Scripts\Activate.ps1
    }
    
    # Start Django server on all interfaces
    Write-Host "   Backend will be available at: http://$localIP`:8000" -ForegroundColor Gray
    python manage.py runserver 0.0.0.0:8000
}

# Function to start frontend
function Start-Frontend {
    Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan
    Set-Location frontend
    
    Write-Host "   Frontend will be available at: http://$localIP`:8080" -ForegroundColor Gray
    npm run dev
}

# Start both servers in separate windows
Write-Host "Starting servers in new windows..." -ForegroundColor Cyan
Write-Host ""

# Start backend in new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; if (Test-Path '.\venv\Scripts\Activate.ps1') { .\venv\Scripts\Activate.ps1 }; python manage.py runserver 0.0.0.0:8000"

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend in new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "✅ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

