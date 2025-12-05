#!/bin/bash

# Build All Microservices Docker Images
# This script builds Docker images for all AgroBridge microservices

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Image tag
TAG="${1:-latest}"
REGISTRY="${2:-agrobridge}"

print_info "Building AgroBridge microservices images..."
print_info "Tag: $TAG"
print_info "Registry: $REGISTRY"

cd "$BACKEND_DIR"

# Build base image first
print_info "Building base image..."
docker build -t ${REGISTRY}/base:${TAG} -f docker/Dockerfile.base .
print_success "Base image built"

# List of services
SERVICES=(
    "authentication:8001"
    "user:8002"
    "farm_management:8003"
    "marketplace:8004"
    "ai_assistant:8005"
    "crop_detection:8006"
    "iot:8007"
    "notification:8008"
    "financial:8009"
    "learning:8010"
    "community:8011"
    "scheduling:8012"
    "analytics:8013"
    "payment:8014"
    "admin:8015"
)

# Build each service
for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r service port <<< "$service_info"
    
    print_info "Building $service service..."
    
    # Check if service has custom Dockerfile
    if [ -f "$service/Dockerfile" ]; then
        docker build \
            -t ${REGISTRY}/${service}-service:${TAG} \
            -f ${service}/Dockerfile \
            .
    else
        # Use template Dockerfile
        docker build \
            -t ${REGISTRY}/${service}-service:${TAG} \
            -f docker/Dockerfile.service \
            --build-arg SERVICE_NAME=${service} \
            --build-arg SERVICE_PORT=${port} \
            .
    fi
    
    print_success "$service service built"
done

print_success "All microservices built successfully!"

# Show images
print_info "Built images:"
docker images | grep ${REGISTRY}

# Optional: Push to registry
read -p "Push images to registry? (y/n): " push_confirm
if [ "$push_confirm" = "y" ]; then
    print_info "Pushing images to registry..."
    
    docker push ${REGISTRY}/base:${TAG}
    
    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r service port <<< "$service_info"
        docker push ${REGISTRY}/${service}-service:${TAG}
    done
    
    print_success "All images pushed to registry"
fi

print_success "Build complete!"
