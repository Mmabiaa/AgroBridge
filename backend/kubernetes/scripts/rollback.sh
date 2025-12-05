#!/bin/bash

# AgroBridge Kubernetes Rollback Script
# Rolls back deployments to previous version
# Requirements: 30.8

set -e

NAMESPACE="agrobridge"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== AgroBridge Kubernetes Rollback ===${NC}"
echo ""

# Check if deployment name is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <deployment-name> [revision]${NC}"
    echo ""
    echo "Available deployments:"
    kubectl get deployments -n ${NAMESPACE} -o name | sed 's/deployment.apps\///'
    exit 1
fi

DEPLOYMENT=$1
REVISION=${2:-0}  # 0 means previous revision

# Check if deployment exists
if ! kubectl get deployment ${DEPLOYMENT} -n ${NAMESPACE} &> /dev/null; then
    echo -e "${RED}Error: Deployment '${DEPLOYMENT}' not found in namespace '${NAMESPACE}'${NC}"
    exit 1
fi

# Show rollout history
echo -e "${BLUE}Rollout History:${NC}"
kubectl rollout history deployment/${DEPLOYMENT} -n ${NAMESPACE}
echo ""

# Confirm rollback
if [ "$REVISION" -eq 0 ]; then
    echo -e "${YELLOW}Rolling back ${DEPLOYMENT} to previous revision...${NC}"
else
    echo -e "${YELLOW}Rolling back ${DEPLOYMENT} to revision ${REVISION}...${NC}"
fi

read -p "Are you sure? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Rollback cancelled"
    exit 0
fi

# Perform rollback
echo -e "${BLUE}Performing rollback...${NC}"

if [ "$REVISION" -eq 0 ]; then
    kubectl rollout undo deployment/${DEPLOYMENT} -n ${NAMESPACE}
else
    kubectl rollout undo deployment/${DEPLOYMENT} --to-revision=${REVISION} -n ${NAMESPACE}
fi

# Wait for rollback to complete
echo ""
echo -e "${YELLOW}Waiting for rollback to complete...${NC}"
kubectl rollout status deployment/${DEPLOYMENT} -n ${NAMESPACE}

# Verify pods are running
echo ""
echo -e "${BLUE}Verifying pods...${NC}"
kubectl get pods -l app=${DEPLOYMENT} -n ${NAMESPACE}

# Check pod health
NOT_READY=$(kubectl get pods -l app=${DEPLOYMENT} -n ${NAMESPACE} --field-selector=status.phase!=Running --no-headers 2>/dev/null | wc -l)

if [ "$NOT_READY" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Rollback completed successfully!${NC}"
    echo -e "${GREEN}✓ All pods are running${NC}"
else
    echo ""
    echo -e "${RED}✗ Rollback completed but ${NOT_READY} pods are not ready${NC}"
    echo "Check pod status with: kubectl describe pods -l app=${DEPLOYMENT} -n ${NAMESPACE}"
    exit 1
fi

echo ""
echo -e "${BLUE}Current Revision:${NC}"
kubectl rollout history deployment/${DEPLOYMENT} -n ${NAMESPACE} | tail -n 1

echo ""
