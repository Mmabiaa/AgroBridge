#!/bin/bash

# Complete Kubernetes Setup Script
# Generates all manifests and deploys the complete AgroBridge platform

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== AgroBridge Kubernetes Complete Setup ==="
echo ""

# Step 1: Generate all service manifests
echo "Step 1: Generating service manifests..."
chmod +x "${SCRIPT_DIR}/generate-manifests.sh"
"${SCRIPT_DIR}/generate-manifests.sh"

# Step 2: Create necessary directories
echo ""
echo "Step 2: Creating directory structure..."
mkdir -p "${K8S_DIR}/base/secrets"
mkdir -p "${K8S_DIR}/overlays/development"
mkdir -p "${K8S_DIR}/overlays/staging"
mkdir -p "${K8S_DIR}/overlays/production"

# Step 3: Deploy everything
echo ""
echo "Step 3: Deploying to Kubernetes..."
chmod +x "${SCRIPT_DIR}/deploy.sh"
"${SCRIPT_DIR}/deploy.sh"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "All Kubernetes manifests have been generated and deployed!"
echo ""
echo "Summary:"
echo "  - 20+ microservice deployments"
echo "  - 20+ HPA configurations"
echo "  - StatefulSets for databases"
echo "  - Istio service mesh"
echo "  - Monitoring stack"
echo "  - Security policies"
echo ""
echo "Next steps:"
echo "  1. Verify all pods are running: kubectl get pods -n agrobridge"
echo "  2. Check services: kubectl get svc -n agrobridge"
echo "  3. Access dashboards (see QUICK_START.md)"
echo "  4. Configure DNS and TLS certificates"
echo ""
