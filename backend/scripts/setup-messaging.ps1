# Setup Message Queue Infrastructure
# This script initializes RabbitMQ and Celery for the AgroBridge platform

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "AgroBridge Message Queue Infrastructure Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Start RabbitMQ and Redis
Write-Host "Starting RabbitMQ and Redis..." -ForegroundColor Yellow
docker-compose -f docker-compose.infrastructure.yml up -d rabbitmq redis

# Wait for RabbitMQ to be ready
Write-Host ""
Write-Host "Waiting for RabbitMQ to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    try {
        docker exec agrobridge-rabbitmq rabbitmq-diagnostics -q ping 2>$null | Out-Null
        Write-Host "✓ RabbitMQ is ready" -ForegroundColor Green
        break
    } catch {
        $attempt++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
}

if ($attempt -eq $maxAttempts) {
    Write-Host ""
    Write-Host "❌ RabbitMQ failed to start" -ForegroundColor Red
    exit 1
}

# Wait for Redis to be ready
Write-Host ""
Write-Host "Waiting for Redis to be ready..." -ForegroundColor Yellow
$attempt = 0
$redisPassword = if ($env:REDIS_PASSWORD) { $env:REDIS_PASSWORD } else { "agrobridge_redis" }

while ($attempt -lt $maxAttempts) {
    try {
        docker exec agrobridge-redis redis-cli -a $redisPassword ping 2>$null | Out-Null
        Write-Host "✓ Redis is ready" -ForegroundColor Green
        break
    } catch {
        $attempt++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
}

if ($attempt -eq $maxAttempts) {
    Write-Host ""
    Write-Host "❌ Redis failed to start" -ForegroundColor Red
    exit 1
}

# Setup RabbitMQ exchanges and queues
Write-Host ""
Write-Host "Setting up RabbitMQ exchanges and queues..." -ForegroundColor Yellow
try {
    python manage.py setup_rabbitmq
    Write-Host "✓ RabbitMQ setup completed" -ForegroundColor Green
} catch {
    Write-Host "❌ RabbitMQ setup failed" -ForegroundColor Red
    exit 1
}

# Display connection information
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Message Queue Infrastructure Ready!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "RabbitMQ:" -ForegroundColor Yellow
Write-Host "  AMQP Port:       5672"
Write-Host "  Management UI:   http://localhost:15672"
Write-Host "  Username:        agrobridge"
Write-Host "  Password:        agrobridge_password"
Write-Host ""
Write-Host "Redis:" -ForegroundColor Yellow
Write-Host "  Port:            6379"
Write-Host "  Password:        agrobridge_redis"
Write-Host ""
Write-Host "Celery:" -ForegroundColor Yellow
Write-Host "  Broker:          amqp://agrobridge:***@localhost:5672/agrobridge"
Write-Host "  Result Backend:  redis://localhost:6379/1"
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start Celery worker:"
Write-Host "   python manage.py celery_worker"
Write-Host ""
Write-Host "2. Start Celery worker for specific queue:"
Write-Host "   python manage.py celery_worker --queue=email"
Write-Host ""
Write-Host "3. Start Flower monitoring:"
Write-Host "   celery -A shared.messaging.celery_config flower"
Write-Host "   Access at: http://localhost:5555"
Write-Host ""
Write-Host "4. Test task execution:"
Write-Host "   python manage.py shell"
Write-Host "   >>> from shared.tasks import send_email"
Write-Host "   >>> send_email.delay('test@example.com', 'Test', 'Body')"
Write-Host ""
Write-Host "5. View documentation:"
Write-Host "   Get-Content docs\infrastructure\MESSAGE_QUEUE_SETUP.md"
Write-Host ""
Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
