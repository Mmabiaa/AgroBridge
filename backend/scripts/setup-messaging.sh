#!/bin/bash

# Setup Message Queue Infrastructure
# This script initializes RabbitMQ and Celery for the AgroBridge platform

set -e

echo "=================================================="
echo "AgroBridge Message Queue Infrastructure Setup"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Start RabbitMQ and Redis
echo "Starting RabbitMQ and Redis..."
docker-compose -f docker-compose.infrastructure.yml up -d rabbitmq redis

# Wait for RabbitMQ to be ready
echo ""
echo "Waiting for RabbitMQ to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker exec agrobridge-rabbitmq rabbitmq-diagnostics -q ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ RabbitMQ is ready${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ RabbitMQ failed to start${NC}"
    exit 1
fi

# Wait for Redis to be ready
echo ""
echo "Waiting for Redis to be ready..."
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker exec agrobridge-redis redis-cli -a "${REDIS_PASSWORD:-agrobridge_redis}" ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis is ready${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ Redis failed to start${NC}"
    exit 1
fi

# Setup RabbitMQ exchanges and queues
echo ""
echo "Setting up RabbitMQ exchanges and queues..."
if python manage.py setup_rabbitmq; then
    echo -e "${GREEN}✓ RabbitMQ setup completed${NC}"
else
    echo -e "${RED}❌ RabbitMQ setup failed${NC}"
    exit 1
fi

# Display connection information
echo ""
echo "=================================================="
echo "Message Queue Infrastructure Ready!"
echo "=================================================="
echo ""
echo "RabbitMQ:"
echo "  AMQP Port:       5672"
echo "  Management UI:   http://localhost:15672"
echo "  Username:        agrobridge"
echo "  Password:        agrobridge_password"
echo ""
echo "Redis:"
echo "  Port:            6379"
echo "  Password:        agrobridge_redis"
echo ""
echo "Celery:"
echo "  Broker:          amqp://agrobridge:***@localhost:5672/agrobridge"
echo "  Result Backend:  redis://localhost:6379/1"
echo ""
echo "=================================================="
echo "Next Steps:"
echo "=================================================="
echo ""
echo "1. Start Celery worker:"
echo "   python manage.py celery_worker"
echo ""
echo "2. Start Celery worker for specific queue:"
echo "   python manage.py celery_worker --queue=email"
echo ""
echo "3. Start Flower monitoring:"
echo "   celery -A shared.messaging.celery_config flower"
echo "   Access at: http://localhost:5555"
echo ""
echo "4. Test task execution:"
echo "   python manage.py shell"
echo "   >>> from shared.tasks import send_email"
echo "   >>> send_email.delay('test@example.com', 'Test', 'Body')"
echo ""
echo "5. View documentation:"
echo "   cat docs/infrastructure/MESSAGE_QUEUE_SETUP.md"
echo ""
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
