#!/bin/bash

# AgroBridge mTLS Certificate Generation Script
# Generates CA and service certificates for zero-trust architecture
# Requirements: 34.1

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="${SCRIPT_DIR}/certs"
CA_DIR="${CERTS_DIR}/ca"
SERVICES_DIR="${CERTS_DIR}/services"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== AgroBridge mTLS Certificate Generation ===${NC}"
echo ""

# Create directory structure
echo -e "${YELLOW}Creating directory structure...${NC}"
mkdir -p "${CA_DIR}"
mkdir -p "${SERVICES_DIR}"

# List of all microservices
SERVICES=(
    "authentication"
    "users"
    "farms"
    "marketplace"
    "ai-assistant"
    "crop-detection"
    "iot"
    "notifications"
    "financial"
    "learning"
    "community"
    "scheduling"
    "analytics"
    "payments"
    "admin"
    "blockchain"
    "export-docs"
    "emergency"
    "file-storage"
    "api-gateway"
    "monitoring"
    "backup"
)

# Generate CA certificate
echo -e "${YELLOW}Generating Certificate Authority (CA)...${NC}"
if [ ! -f "${CA_DIR}/ca-key.pem" ]; then
    openssl genrsa -out "${CA_DIR}/ca-key.pem" 4096
    
    openssl req -new -x509 -days 3650 -key "${CA_DIR}/ca-key.pem" \
        -out "${CA_DIR}/ca-cert.pem" \
        -subj "/C=GH/ST=Greater Accra/L=Accra/O=AgroBridge/OU=Security/CN=AgroBridge Root CA"
    
    echo -e "${GREEN}✓ CA certificate generated${NC}"
else
    echo -e "${GREEN}✓ CA certificate already exists${NC}"
fi

# Generate service certificates
echo ""
echo -e "${YELLOW}Generating service certificates...${NC}"

for service in "${SERVICES[@]}"; do
    SERVICE_DIR="${SERVICES_DIR}/${service}"
    mkdir -p "${SERVICE_DIR}"
    
    if [ ! -f "${SERVICE_DIR}/${service}-key.pem" ]; then
        echo -e "  Generating certificate for ${service}..."
        
        # Generate private key
        openssl genrsa -out "${SERVICE_DIR}/${service}-key.pem" 4096
        
        # Generate CSR
        openssl req -new -key "${SERVICE_DIR}/${service}-key.pem" \
            -out "${SERVICE_DIR}/${service}-csr.pem" \
            -subj "/C=GH/ST=Greater Accra/L=Accra/O=AgroBridge/OU=${service}/CN=${service}.agrobridge.local"
        
        # Create extensions file for SAN
        cat > "${SERVICE_DIR}/${service}-ext.cnf" <<EOF
subjectAltName = DNS:${service},DNS:${service}.agrobridge.local,DNS:${service}.default.svc.cluster.local,DNS:localhost,IP:127.0.0.1
extendedKeyUsage = serverAuth,clientAuth
EOF
        
        # Sign certificate with CA
        openssl x509 -req -in "${SERVICE_DIR}/${service}-csr.pem" \
            -CA "${CA_DIR}/ca-cert.pem" \
            -CAkey "${CA_DIR}/ca-key.pem" \
            -CAcreateserial \
            -out "${SERVICE_DIR}/${service}-cert.pem" \
            -days 365 \
            -sha256 \
            -extfile "${SERVICE_DIR}/${service}-ext.cnf"
        
        # Verify certificate
        openssl verify -CAfile "${CA_DIR}/ca-cert.pem" "${SERVICE_DIR}/${service}-cert.pem" > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✓ Certificate for ${service} generated and verified${NC}"
        else
            echo -e "  ${RED}✗ Certificate verification failed for ${service}${NC}"
            exit 1
        fi
        
        # Set proper permissions
        chmod 600 "${SERVICE_DIR}/${service}-key.pem"
        chmod 644 "${SERVICE_DIR}/${service}-cert.pem"
    else
        echo -e "  ${GREEN}✓ Certificate for ${service} already exists${NC}"
    fi
done

# Generate client certificate for testing
echo ""
echo -e "${YELLOW}Generating client test certificate...${NC}"
CLIENT_DIR="${CERTS_DIR}/client"
mkdir -p "${CLIENT_DIR}"

if [ ! -f "${CLIENT_DIR}/client-key.pem" ]; then
    openssl genrsa -out "${CLIENT_DIR}/client-key.pem" 4096
    
    openssl req -new -key "${CLIENT_DIR}/client-key.pem" \
        -out "${CLIENT_DIR}/client-csr.pem" \
        -subj "/C=GH/ST=Greater Accra/L=Accra/O=AgroBridge/OU=Testing/CN=test-client"
    
    cat > "${CLIENT_DIR}/client-ext.cnf" <<EOF
extendedKeyUsage = clientAuth
EOF
    
    openssl x509 -req -in "${CLIENT_DIR}/client-csr.pem" \
        -CA "${CA_DIR}/ca-cert.pem" \
        -CAkey "${CA_DIR}/ca-key.pem" \
        -CAcreateserial \
        -out "${CLIENT_DIR}/client-cert.pem" \
        -days 365 \
        -sha256 \
        -extfile "${CLIENT_DIR}/client-ext.cnf"
    
    chmod 600 "${CLIENT_DIR}/client-key.pem"
    chmod 644 "${CLIENT_DIR}/client-cert.pem"
    
    echo -e "${GREEN}✓ Client certificate generated${NC}"
else
    echo -e "${GREEN}✓ Client certificate already exists${NC}"
fi

# Create certificate bundles
echo ""
echo -e "${YELLOW}Creating certificate bundles...${NC}"

for service in "${SERVICES[@]}"; do
    SERVICE_DIR="${SERVICES_DIR}/${service}"
    
    # Create full chain certificate
    cat "${SERVICE_DIR}/${service}-cert.pem" "${CA_DIR}/ca-cert.pem" > "${SERVICE_DIR}/${service}-fullchain.pem"
    
    # Create PKCS12 bundle (for some applications)
    openssl pkcs12 -export \
        -in "${SERVICE_DIR}/${service}-cert.pem" \
        -inkey "${SERVICE_DIR}/${service}-key.pem" \
        -out "${SERVICE_DIR}/${service}.p12" \
        -name "${service}" \
        -CAfile "${CA_DIR}/ca-cert.pem" \
        -caname "AgroBridge Root CA" \
        -password pass:agrobridge
done

echo -e "${GREEN}✓ Certificate bundles created${NC}"

# Generate certificate inventory
echo ""
echo -e "${YELLOW}Generating certificate inventory...${NC}"

cat > "${CERTS_DIR}/inventory.txt" <<EOF
AgroBridge mTLS Certificate Inventory
Generated: $(date)

Certificate Authority:
  Location: ${CA_DIR}/ca-cert.pem
  Subject: $(openssl x509 -in "${CA_DIR}/ca-cert.pem" -noout -subject)
  Valid Until: $(openssl x509 -in "${CA_DIR}/ca-cert.pem" -noout -enddate)

Service Certificates:
EOF

for service in "${SERVICES[@]}"; do
    SERVICE_DIR="${SERVICES_DIR}/${service}"
    EXPIRY=$(openssl x509 -in "${SERVICE_DIR}/${service}-cert.pem" -noout -enddate | cut -d= -f2)
    
    cat >> "${CERTS_DIR}/inventory.txt" <<EOF

  ${service}:
    Certificate: ${SERVICE_DIR}/${service}-cert.pem
    Private Key: ${SERVICE_DIR}/${service}-key.pem
    Full Chain: ${SERVICE_DIR}/${service}-fullchain.pem
    PKCS12: ${SERVICE_DIR}/${service}.p12
    Valid Until: ${EXPIRY}
EOF
done

echo -e "${GREEN}✓ Certificate inventory created${NC}"

# Create Docker volume mount script
echo ""
echo -e "${YELLOW}Creating Docker volume mount configuration...${NC}"

cat > "${CERTS_DIR}/docker-volumes.yml" <<EOF
# Add these volume mounts to your docker-compose.yml for each service

volumes:
  # CA certificate (read-only)
  - ./security/mtls/certs/ca/ca-cert.pem:/certs/ca.crt:ro
  
  # Service-specific certificates
  # Replace 'service-name' with actual service name
  - ./security/mtls/certs/services/service-name/service-name-cert.pem:/certs/tls.crt:ro
  - ./security/mtls/certs/services/service-name/service-name-key.pem:/certs/tls.key:ro
  - ./security/mtls/certs/services/service-name/service-name-fullchain.pem:/certs/fullchain.pem:ro

environment:
  # mTLS configuration
  - MTLS_ENABLED=true
  - MTLS_CA_CERT=/certs/ca.crt
  - MTLS_CERT=/certs/tls.crt
  - MTLS_KEY=/certs/tls.key
  - MTLS_VERIFY_DEPTH=2
EOF

echo -e "${GREEN}✓ Docker configuration created${NC}"

# Summary
echo ""
echo -e "${GREEN}=== Certificate Generation Complete ===${NC}"
echo ""
echo "Certificates generated for ${#SERVICES[@]} services"
echo "CA Certificate: ${CA_DIR}/ca-cert.pem"
echo "Service Certificates: ${SERVICES_DIR}/"
echo "Certificate Inventory: ${CERTS_DIR}/inventory.txt"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review certificate inventory: cat ${CERTS_DIR}/inventory.txt"
echo "2. Configure services to use mTLS (see docker-volumes.yml)"
echo "3. Test mTLS: python verify-mtls.py"
echo "4. Set up certificate rotation: ./rotate-certs.sh"
echo ""
echo -e "${YELLOW}Security Notes:${NC}"
echo "- Keep CA private key secure: ${CA_DIR}/ca-key.pem"
echo "- Certificates expire in 1 year"
echo "- Rotate certificates 30 days before expiry"
echo "- Never commit private keys to version control"
echo ""
