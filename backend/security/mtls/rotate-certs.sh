#!/bin/bash

# AgroBridge Certificate Rotation Script
# Automatically rotates certificates nearing expiry
# Requirements: 34.1

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="${SCRIPT_DIR}/certs"
WARNING_DAYS=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== AgroBridge Certificate Rotation ===${NC}"
echo ""

# Check if certificates exist
if [ ! -d "${CERTS_DIR}" ]; then
    echo -e "${RED}Error: Certificates directory not found${NC}"
    echo "Run ./generate-certs.sh first"
    exit 1
fi

# Function to check certificate expiry
check_expiry() {
    local cert_file=$1
    local service_name=$2
    
    # Get expiry date
    expiry_date=$(openssl x509 -in "${cert_file}" -noout -enddate | cut -d= -f2)
    expiry_epoch=$(date -d "${expiry_date}" +%s)
    current_epoch=$(date +%s)
    days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    if [ ${days_until_expiry} -lt ${WARNING_DAYS} ]; then
        echo -e "${YELLOW}⚠ ${service_name}: ${days_until_expiry} days until expiry${NC}"
        return 0  # Needs rotation
    else
        echo -e "${GREEN}✓ ${service_name}: ${days_until_expiry} days until expiry${NC}"
        return 1  # No rotation needed
    fi
}

# Check CA certificate
echo "Checking CA certificate..."
if check_expiry "${CERTS_DIR}/ca/ca-cert.pem" "CA"; then
    echo -e "${RED}ERROR: CA certificate needs renewal!${NC}"
    echo "CA certificate rotation requires manual intervention"
    exit 1
fi

# Check service certificates
SERVICES=(
    "authentication" "users" "farms" "marketplace" "ai-assistant"
    "crop-detection" "iot" "notifications" "financial" "learning"
    "community" "scheduling" "analytics" "payments" "admin"
    "blockchain" "export-docs" "emergency" "file-storage"
    "api-gateway" "monitoring" "backup"
)

ROTATE_NEEDED=()

echo ""
echo "Checking service certificates..."
for service in "${SERVICES[@]}"; do
    cert_file="${CERTS_DIR}/services/${service}/${service}-cert.pem"
    if [ -f "${cert_file}" ]; then
        if check_expiry "${cert_file}" "${service}"; then
            ROTATE_NEEDED+=("${service}")
        fi
    fi
done

# Rotate certificates if needed
if [ ${#ROTATE_NEEDED[@]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}No certificates need rotation${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Rotating ${#ROTATE_NEEDED[@]} certificates...${NC}"

for service in "${ROTATE_NEEDED[@]}"; do
    echo ""
    echo "Rotating certificate for ${service}..."
    
    SERVICE_DIR="${CERTS_DIR}/services/${service}"
    
    # Backup old certificate
    BACKUP_DIR="${SERVICE_DIR}/backup"
    mkdir -p "${BACKUP_DIR}"
    timestamp=$(date +%Y%m%d_%H%M%S)
    
    cp "${SERVICE_DIR}/${service}-cert.pem" "${BACKUP_DIR}/${service}-cert-${timestamp}.pem"
    cp "${SERVICE_DIR}/${service}-key.pem" "${BACKUP_DIR}/${service}-key-${timestamp}.pem"
    
    # Generate new private key
    openssl genrsa -out "${SERVICE_DIR}/${service}-key.pem" 4096
    
    # Generate new CSR
    openssl req -new -key "${SERVICE_DIR}/${service}-key.pem" \
        -out "${SERVICE_DIR}/${service}-csr.pem" \
        -subj "/C=GH/ST=Greater Accra/L=Accra/O=AgroBridge/OU=${service}/CN=${service}.agrobridge.local"
    
    # Sign with CA
    openssl x509 -req -in "${SERVICE_DIR}/${service}-csr.pem" \
        -CA "${CERTS_DIR}/ca/ca-cert.pem" \
        -CAkey "${CERTS_DIR}/ca/ca-key.pem" \
        -CAcreateserial \
        -out "${SERVICE_DIR}/${service}-cert.pem" \
        -days 365 \
        -sha256 \
        -extfile "${SERVICE_DIR}/${service}-ext.cnf"
    
    # Verify new certificate
    if openssl verify -CAfile "${CERTS_DIR}/ca/ca-cert.pem" "${SERVICE_DIR}/${service}-cert.pem" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Certificate rotated successfully${NC}"
        
        # Update full chain
        cat "${SERVICE_DIR}/${service}-cert.pem" "${CERTS_DIR}/ca/ca-cert.pem" > "${SERVICE_DIR}/${service}-fullchain.pem"
        
        # Update PKCS12
        openssl pkcs12 -export \
            -in "${SERVICE_DIR}/${service}-cert.pem" \
            -inkey "${SERVICE_DIR}/${service}-key.pem" \
            -out "${SERVICE_DIR}/${service}.p12" \
            -name "${service}" \
            -CAfile "${CERTS_DIR}/ca/ca-cert.pem" \
            -caname "AgroBridge Root CA" \
            -password pass:agrobridge
        
        # Set permissions
        chmod 600 "${SERVICE_DIR}/${service}-key.pem"
        chmod 644 "${SERVICE_DIR}/${service}-cert.pem"
    else
        echo -e "${RED}✗ Certificate verification failed${NC}"
        # Restore backup
        cp "${BACKUP_DIR}/${service}-cert-${timestamp}.pem" "${SERVICE_DIR}/${service}-cert.pem"
        cp "${BACKUP_DIR}/${service}-key-${timestamp}.pem" "${SERVICE_DIR}/${service}-key.pem"
        echo -e "${YELLOW}Restored backup certificate${NC}"
    fi
done

echo ""
echo -e "${GREEN}=== Certificate Rotation Complete ===${NC}"
echo ""
echo "Rotated certificates: ${#ROTATE_NEEDED[@]}"
echo "Backup location: ${CERTS_DIR}/services/*/backup/"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Restart affected services to load new certificates"
echo "2. Verify services are working correctly"
echo "3. Monitor logs for certificate errors"
echo ""
