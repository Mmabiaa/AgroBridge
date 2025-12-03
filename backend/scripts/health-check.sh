#!/bin/bash

# Health Check Script for Blue-Green Deployment
# Verifies all services are healthy before switching traffic

set -e

ENVIRONMENT=$1
COLOR=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$COLOR" ]; then
  echo "Usage: $0 {staging|production} {blue|green}"
  exit 1
fi

NAMESPACE="agrobridge-$ENVIRONMENT"

echo "Running health checks for $COLOR environment in $NAMESPACE..."

# List of services to check
SERVICES=(
  "authentication-service"
  "user-service"
  "marketplace-service"
  "farm-management-service"
  "ai-assistant-service"
  "notification-service"
)

# Check each service
for service in "${SERVICES[@]}"; do
  echo "Checking $service..."
  
  # Get pod status
  status=$(kubectl get pods -n $NAMESPACE -l app=$service,color=$COLOR -o jsonpath='{.items[0].status.phase}')
  
  if [ "$status" != "Running" ]; then
    echo "✗ $service is not running (status: $status)"
    exit 1
  fi
  
  # Check readiness
  ready=$(kubectl get pods -n $NAMESPACE -l app=$service,color=$COLOR -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}')
  
  if [ "$ready" != "True" ]; then
    echo "✗ $service is not ready"
    exit 1
  fi
  
  echo "✓ $service is healthy"
done

echo ""
echo "✓ All services are healthy in $COLOR environment!"
