#!/bin/bash

# Smoke Tests for AgroBridge
# Quick tests to verify basic functionality after deployment

set -e

BASE_URL=${1:-"http://localhost:8000"}

echo "Running smoke tests against $BASE_URL"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $response)"
        ((FAILED++))
    fi
}

# Run tests
echo "=== Health Checks ==="
test_endpoint "API Gateway Health" "/health" 200
test_endpoint "Authentication Health" "/api/v1/auth/health" 200
test_endpoint "Users Health" "/api/v1/users/health" 200
test_endpoint "Farms Health" "/api/v1/farms/health" 200
test_endpoint "Marketplace Health" "/api/v1/marketplace/health" 200

echo ""
echo "=== API Endpoints ==="
test_endpoint "Authentication Login" "/api/v1/auth/login" 405  # POST only
test_endpoint "User Profile" "/api/v1/users/profile" 401  # Requires auth
test_endpoint "Farms List" "/api/v1/farms" 401  # Requires auth
test_endpoint "Marketplace Products" "/api/v1/marketplace/products" 200

echo ""
echo "=== Static Assets ==="
test_endpoint "API Documentation" "/docs" 200
test_endpoint "API Schema" "/api/schema" 200

echo ""
echo "=== Summary ==="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Smoke tests failed!${NC}"
    exit 1
else
    echo -e "${GREEN}All smoke tests passed!${NC}"
    exit 0
fi
