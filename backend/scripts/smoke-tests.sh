#!/bin/bash

# Smoke Tests for AgroBridge Deployment
# Verifies basic functionality after deployment

set -e

ENVIRONMENT=$1
BASE_URL=""

case $ENVIRONMENT in
  staging)
    BASE_URL="https://staging.agrobridge.com"
    ;;
  production)
    BASE_URL="https://agrobridge.com"
    ;;
  *)
    echo "Usage: $0 {staging|production}"
    exit 1
    ;;
esac

echo "Running smoke tests against $BASE_URL..."

# Test API Gateway health
echo "Testing API Gateway..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ $response -eq 200 ]; then
  echo "✓ API Gateway is healthy"
else
  echo "✗ API Gateway health check failed (HTTP $response)"
  exit 1
fi

# Test Authentication Service
echo "Testing Authentication Service..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/v1/auth/health)
if [ $response -eq 200 ]; then
  echo "✓ Authentication Service is healthy"
else
  echo "✗ Authentication Service health check failed"
  exit 1
fi

# Test Marketplace Service
echo "Testing Marketplace Service..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/v1/marketplace/health)
if [ $response -eq 200 ]; then
  echo "✓ Marketplace Service is healthy"
else
  echo "✗ Marketplace Service health check failed"
  exit 1
fi

# Test Database Connectivity
echo "Testing Database Connectivity..."
response=$(curl -s $BASE_URL/api/v1/health/database | jq -r '.status')
if [ "$response" = "healthy" ]; then
  echo "✓ Database is accessible"
else
  echo "✗ Database connectivity failed"
  exit 1
fi

# Test Redis Connectivity
echo "Testing Redis Connectivity..."
response=$(curl -s $BASE_URL/api/v1/health/redis | jq -r '.status')
if [ "$response" = "healthy" ]; then
  echo "✓ Redis is accessible"
else
  echo "✗ Redis connectivity failed"
  exit 1
fi

echo ""
echo "✓ All smoke tests passed!"
