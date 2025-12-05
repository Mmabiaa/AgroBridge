#!/bin/bash

# AgroBridge Kubernetes Deployment Script
# Deploys all microservices to Kubernetes cluster
# Requirements: Infrastructure deployment, 30.8

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "$SCRIPT_DIR")"
NAMESPACE="agrobridge"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
    ___                 ____       _     __           
   /   | ____ ________  / __ )_____(_)___/ /___ ____  
  / /| |/ __ `/ ___/ / / __  / ___/ / __  / __ `/ _ \ 
 / ___ / /_/ / /  / /_/ / /_/ / /  / / /_/ / /_/ /  __/ 
/_/  |_\__, /_/   \____/_____/_/  /_/\__,_/\__, /\___/  
      /____/                              /____/        
                                                        
    Kubernetes Deployment
EOF
echo -e "${NC}"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}Error: kubectl is not installed${NC}"; exit 1; }
command -v helm >/dev/null 2>&1 || { echo -e "${RED}Error: helm is not installed${NC}"; exit 1; }
command -v istioctl >/dev/null 2>&1 || { echo -e "${RED}Error: istioctl is not installed${NC}"; exit 1; }

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Function to wait for pods
wait_for_pods() {
    local label=$1
    local timeout=${2:-300}
    
    echo -e "${YELLOW}Waiting for pods with label ${label}...${NC}"
    kubectl wait --for=condition=ready pod -l "${label}" -n ${NAMESPACE} --timeout=${timeout}s
    echo -e "${GREEN}✓ Pods ready${NC}"
}

# Step 1: Create namespace
echo ""
echo -e "${BLUE}=== Step 1: Creating Namespace ===${NC}"
kubectl apply -f "${K8S_DIR}/base/namespace.yaml"
echo -e "${GREEN}✓ Namespace created${NC}"

# Step 2: Install Istio
echo ""
echo -e "${BLUE}=== Step 2: Installing Istio Service Mesh ===${NC}"
if ! istioctl version &> /dev/null; then
    echo "Installing Istio..."
    istioctl install --set profile=production -y
    kubectl label namespace ${NAMESPACE} istio-injection=enabled --overwrite
    echo -e "${GREEN}✓ Istio installed${NC}"
else
    echo -e "${GREEN}✓ Istio already installed${NC}"
fi

# Step 3: Create ConfigMaps
echo ""
echo -e "${BLUE}=== Step 3: Creating ConfigMaps ===${NC}"
if [ -d "${K8S_DIR}/base/configmaps" ]; then
    kubectl apply -f "${K8S_DIR}/base/configmaps/"
    echo -e "${GREEN}✓ ConfigMaps created${NC}"
else
    echo -e "${YELLOW}⚠ ConfigMaps directory not found, skipping${NC}"
fi

# Step 4: Create Secrets
echo ""
echo -e "${BLUE}=== Step 4: Creating Secrets ===${NC}"
if [ -d "${K8S_DIR}/base/secrets" ]; then
    kubectl apply -f "${K8S_DIR}/base/secrets/"
    echo -e "${GREEN}✓ Secrets created${NC}"
else
    echo -e "${YELLOW}⚠ Secrets directory not found, skipping${NC}"
fi

# Step 5: Deploy StatefulSets (Databases)
echo ""
echo -e "${BLUE}=== Step 5: Deploying Databases (StatefulSets) ===${NC}"
if [ -d "${K8S_DIR}/statefulsets" ]; then
    kubectl apply -f "${K8S_DIR}/statefulsets/"
    
    # Wait for PostgreSQL
    if kubectl get statefulset postgresql -n ${NAMESPACE} &> /dev/null; then
        wait_for_pods "app=postgresql" 600
    fi
    
    # Wait for MongoDB
    if kubectl get statefulset mongodb -n ${NAMESPACE} &> /dev/null; then
        wait_for_pods "app=mongodb" 600
    fi
    
    # Wait for Redis
    if kubectl get statefulset redis -n ${NAMESPACE} &> /dev/null; then
        wait_for_pods "app=redis" 300
    fi
    
    echo -e "${GREEN}✓ Databases deployed${NC}"
else
    echo -e "${YELLOW}⚠ StatefulSets directory not found, skipping${NC}"
fi

# Step 6: Deploy Microservices
echo ""
echo -e "${BLUE}=== Step 6: Deploying Microservices ===${NC}"
if [ -d "${K8S_DIR}/deployments" ]; then
    kubectl apply -f "${K8S_DIR}/deployments/"
    
    # Wait for critical services
    echo "Waiting for critical services..."
    wait_for_pods "app=authentication" 300
    wait_for_pods "app=api-gateway" 300
    
    echo -e "${GREEN}✓ Microservices deployed${NC}"
else
    echo -e "${RED}✗ Deployments directory not found${NC}"
    exit 1
fi

# Step 7: Create Services
echo ""
echo -e "${BLUE}=== Step 7: Creating Services ===${NC}"
if [ -d "${K8S_DIR}/services" ]; then
    kubectl apply -f "${K8S_DIR}/services/"
    echo -e "${GREEN}✓ Services created${NC}"
else
    echo -e "${YELLOW}⚠ Services directory not found, using services from deployments${NC}"
fi

# Step 8: Configure Istio
echo ""
echo -e "${BLUE}=== Step 8: Configuring Istio ===${NC}"
if [ -d "${K8S_DIR}/istio" ]; then
    kubectl apply -f "${K8S_DIR}/istio/"
    echo -e "${GREEN}✓ Istio configured${NC}"
else
    echo -e "${YELLOW}⚠ Istio directory not found, skipping${NC}"
fi

# Step 9: Configure Ingress
echo ""
echo -e "${BLUE}=== Step 9: Configuring Ingress ===${NC}"
if [ -d "${K8S_DIR}/ingress" ]; then
    kubectl apply -f "${K8S_DIR}/ingress/"
    echo -e "${GREEN}✓ Ingress configured${NC}"
else
    echo -e "${YELLOW}⚠ Ingress directory not found, skipping${NC}"
fi

# Step 10: Set up Auto-Scaling
echo ""
echo -e "${BLUE}=== Step 10: Setting Up Auto-Scaling ===${NC}"
if [ -d "${K8S_DIR}/autoscaling" ]; then
    kubectl apply -f "${K8S_DIR}/autoscaling/"
    echo -e "${GREEN}✓ Auto-scaling configured${NC}"
else
    echo -e "${YELLOW}⚠ Autoscaling directory not found, skipping${NC}"
fi

# Step 11: Deploy Monitoring
echo ""
echo -e "${BLUE}=== Step 11: Deploying Monitoring ===${NC}"
if [ -d "${K8S_DIR}/monitoring" ]; then
    kubectl apply -f "${K8S_DIR}/monitoring/"
    echo -e "${GREEN}✓ Monitoring deployed${NC}"
else
    echo -e "${YELLOW}⚠ Monitoring directory not found, skipping${NC}"
fi

# Step 12: Apply Security Policies
echo ""
echo -e "${BLUE}=== Step 12: Applying Security Policies ===${NC}"
if [ -d "${K8S_DIR}/security" ]; then
    kubectl apply -f "${K8S_DIR}/security/"
    echo -e "${GREEN}✓ Security policies applied${NC}"
else
    echo -e "${YELLOW}⚠ Security directory not found, skipping${NC}"
fi

# Step 13: Verify Deployment
echo ""
echo -e "${BLUE}=== Step 13: Verifying Deployment ===${NC}"

echo "Checking pods..."
kubectl get pods -n ${NAMESPACE}

echo ""
echo "Checking services..."
kubectl get services -n ${NAMESPACE}

echo ""
echo "Checking ingress..."
kubectl get ingress -n ${NAMESPACE}

echo ""
echo "Checking HPA..."
kubectl get hpa -n ${NAMESPACE}

# Check pod health
echo ""
echo "Checking pod health..."
NOT_READY=$(kubectl get pods -n ${NAMESPACE} --field-selector=status.phase!=Running --no-headers 2>/dev/null | wc -l)

if [ "$NOT_READY" -eq 0 ]; then
    echo -e "${GREEN}✓ All pods are running${NC}"
else
    echo -e "${YELLOW}⚠ ${NOT_READY} pods are not ready${NC}"
    kubectl get pods -n ${NAMESPACE} --field-selector=status.phase!=Running
fi

# Display access information
echo ""
echo -e "${BLUE}=== Deployment Complete ===${NC}"
echo ""
echo -e "${GREEN}✅ AgroBridge deployed successfully!${NC}"
echo ""
echo -e "${BLUE}Access Information:${NC}"
echo ""

# Get ingress IP
INGRESS_IP=$(kubectl get svc istio-ingressgateway -n istio-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
if [ -z "$INGRESS_IP" ]; then
    INGRESS_IP=$(kubectl get svc istio-ingressgateway -n istio-system -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
fi

if [ -n "$INGRESS_IP" ]; then
    echo "  API Endpoint: http://${INGRESS_IP}"
    echo "  HTTPS Endpoint: https://${INGRESS_IP}"
else
    echo "  Ingress IP not yet assigned. Check with:"
    echo "  kubectl get svc istio-ingressgateway -n istio-system"
fi

echo ""
echo "  Grafana Dashboard:"
echo "    kubectl port-forward -n ${NAMESPACE} svc/grafana 3000:3000"
echo "    http://localhost:3000"
echo ""
echo "  Prometheus:"
echo "    kubectl port-forward -n ${NAMESPACE} svc/prometheus 9090:9090"
echo "    http://localhost:9090"
echo ""
echo "  Jaeger Tracing:"
echo "    kubectl port-forward -n ${NAMESPACE} svc/jaeger-query 16686:16686"
echo "    http://localhost:16686"
echo ""
echo "  Kiali Service Mesh:"
echo "    kubectl port-forward -n istio-system svc/kiali 20001:20001"
echo "    http://localhost:20001"
echo ""

echo -e "${BLUE}Useful Commands:${NC}"
echo ""
echo "  # View all resources"
echo "  kubectl get all -n ${NAMESPACE}"
echo ""
echo "  # View logs"
echo "  kubectl logs -f <pod-name> -n ${NAMESPACE}"
echo ""
echo "  # Scale deployment"
echo "  kubectl scale deployment <deployment-name> --replicas=5 -n ${NAMESPACE}"
echo ""
echo "  # Rollback deployment"
echo "  kubectl rollout undo deployment/<deployment-name> -n ${NAMESPACE}"
echo ""
echo "  # Check rollout status"
echo "  kubectl rollout status deployment/<deployment-name> -n ${NAMESPACE}"
echo ""
echo "  # Exec into pod"
echo "  kubectl exec -it <pod-name> -n ${NAMESPACE} -- /bin/bash"
echo ""

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
