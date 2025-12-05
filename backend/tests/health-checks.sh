#!/bin/bash

# Health Checks for AgroBridge
# Comprehensive health checks for all services

set -e

BASE_URL=${1:-"http://localhost:8000"}

echo "Running health checks against $BASE_URL"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVICES=(
    "auth:/api/v1/auth/health"
    "users:/api/v1/users/health"
    "farms:/api/v1/farms/health"
    "marketplace:/api/v1/marketplace/health"
    "ai:/api/v1/ai/health"
    "crop-detection:/api/v1/crop-detection/health"
    "iot:/api/v1/iot/health"
    "notifications:/api/v1/notifications/health"
    "financial:/api/v1/financial/health"
    "learning:/api/v1/learning/health"
    "community:/api/v1/community/health"
    "scheduling:/api/v1/scheduling/health"
    "analytics:/api/v1/analytics/health"
    "payments:/api/v1/payments/health"
    "admin:/api/v1/admin/health"
)

PASSED=0
FAILED=0
WARNINGS=0

check_service() {
    local service_name=$1
    local endpoint=$2
    
    echo -n "Checking $service_name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL$endpoint" 2>/dev/null)
    
    if [ "$response" -eq 200 ]; then
        echo -e "${GREEN}✓ HEALTHY${NC}"
        ((PASSED++))
    elif [ "$response" -eq 503 ]; then
        echo -e "${YELLOW}⚠ DEGRADED${NC}"
        ((WARNINGS++))
    else
        echo -e "${RED}✗ UNHEALTHY${NC} (HTTP $response)"
        ((FAILED++))
    fi
}

echo "=== Service Health Checks ==="
for service in "${SERVICES[@]}"; do
    IFS=':' read -r name endpoint <<< "$service"
    check_service "$name" "$endpoint"
done

echo ""
echo "=== Database Connectivity ==="
check_service "PostgreSQL" "/api/v1/health/db"
check_service "Redis" "/api/v1/health/cache"
check_service "RabbitMQ" "/api/v1/health/queue"

echo ""
echo "=== External Services ==="
check_service "Storage" "/api/v1/health/storage"
check_service "Email" "/api/v1/health/email"

echo ""
echo "=== Summary ==="
echo -e "Healthy: ${GREEN}$PASSED${NC}"
echo -e "Degraded: ${YELLOW}$WARNINGS${NC}"
echo -e "Unhealthy: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Health checks failed!${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Some services are degraded${NC}"
    exit 0
else
    echo -e "${GREEN}All services are healthy!${NC}"
    exit 0
fi
