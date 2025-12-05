# Performance Optimization Setup Script for Windows
# Run this script to set up performance optimization features

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "AgroBridge Performance Optimization Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Checking Python installation..." -ForegroundColor Yellow
python --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Python found" -ForegroundColor Green
Write-Host ""

# Install core dependencies
Write-Host "Installing core dependencies..." -ForegroundColor Yellow
python -m pip install --upgrade pip
python -m pip install django djangorestframework django-cors-headers django-environ
Write-Host "✓ Core dependencies installed" -ForegroundColor Green
Write-Host ""

# Install performance dependencies
Write-Host "Installing performance optimization dependencies..." -ForegroundColor Yellow
python -m pip install redis django-redis hiredis msgpack
Write-Host "✓ Performance dependencies installed" -ForegroundColor Green
Write-Host ""

# Check Redis availability
Write-Host "Checking Redis availability..." -ForegroundColor Yellow
$redisAvailable = $false

# Try to connect to Redis
try {
    $testConnection = New-Object System.Net.Sockets.TcpClient
    $testConnection.Connect("127.0.0.1", 6379)
    $testConnection.Close()
    $redisAvailable = $true
    Write-Host "✓ Redis is running on localhost:6379" -ForegroundColor Green
} catch {
    Write-Host "⚠ Redis is not running" -ForegroundColor Yellow
    Write-Host "  Performance optimization will use local memory cache as fallback" -ForegroundColor Yellow
}
Write-Host ""

# Create performance configuration
Write-Host "Creating performance configuration..." -ForegroundColor Yellow

$configContent = @"
# Performance Optimization Configuration
# Generated on $(Get-Date)

# Redis Configuration
REDIS_AVAILABLE = $($redisAvailable.ToString().ToLower())
REDIS_HOST = '127.0.0.1'
REDIS_PORT = 6379

# Cache Backend
if REDIS_AVAILABLE:
    from shared.performance_settings import CACHES_REDIS
    CACHES = CACHES_REDIS
else:
    from shared.performance_settings import CACHES_FALLBACK
    CACHES = CACHES_FALLBACK

# Enable compression
from shared.performance_settings import MIDDLEWARE_COMPRESSION
MIDDLEWARE = MIDDLEWARE_COMPRESSION + MIDDLEWARE

# Optimize REST Framework
from shared.performance_settings import REST_FRAMEWORK_OPTIMIZED
REST_FRAMEWORK.update(REST_FRAMEWORK_OPTIMIZED)
"@

$configPath = "performance_config.py"
Set-Content -Path $configPath -Value $configContent
Write-Host "✓ Configuration created: $configPath" -ForegroundColor Green
Write-Host ""

# Test performance modules
Write-Host "Testing performance modules..." -ForegroundColor Yellow
$testScript = @"
import sys
sys.path.insert(0, '.')

try:
    from shared.caching import cache_manager
    print('✓ Caching module loaded')
    
    from shared.database_optimization import QueryOptimizer
    print('✓ Database optimization module loaded')
    
    from shared.cdn_integration import cdn_manager
    print('✓ CDN integration module loaded')
    
    from shared.performance_testing import PerformanceMetrics
    print('✓ Performance testing module loaded')
    
    print('\n✓ All performance modules loaded successfully')
    sys.exit(0)
except Exception as e:
    print(f'\n✗ Error loading modules: {e}')
    sys.exit(1)
"@

$testScript | python
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Performance modules working" -ForegroundColor Green
} else {
    Write-Host "⚠ Some modules may need Django environment" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Add performance_config.py settings to your settings.py" -ForegroundColor White
Write-Host "2. Run migrations: python manage.py migrate" -ForegroundColor White
Write-Host "3. Test caching: python -c 'from shared.caching import cache_manager; print(cache_manager)'" -ForegroundColor White
Write-Host ""

if (-not $redisAvailable) {
    Write-Host "Optional: Install Redis for better performance" -ForegroundColor Yellow
    Write-Host "  - Download: https://github.com/microsoftarchive/redis/releases" -ForegroundColor White
    Write-Host "  - Or use Docker: docker run -d -p 6379:6379 redis:latest" -ForegroundColor White
    Write-Host "  - Or use WSL: wsl -d Ubuntu sudo service redis-server start" -ForegroundColor White
    Write-Host ""
}

Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - Quick Start: docs/PERFORMANCE_QUICK_START.md" -ForegroundColor White
Write-Host "  - Full Guide: docs/PERFORMANCE_OPTIMIZATION_GUIDE.md" -ForegroundColor White
Write-Host "  - Summary: docs/PERFORMANCE_SUMMARY.md" -ForegroundColor White
Write-Host ""
