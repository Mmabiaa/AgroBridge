#!/bin/bash

# AgroBridge Security Setup Script
# One-command setup for all security components
# Requirements: 34.1, 34.5, 34.6, 34.7, 34.8

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
                                                        
    Security Hardening Setup
EOF
echo -e "${NC}"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

command -v docker >/dev/null 2>&1 || { echo -e "${RED}Error: docker is not installed${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Error: docker-compose is not installed${NC}"; exit 1; }
command -v openssl >/dev/null 2>&1 || { echo -e "${RED}Error: openssl is not installed${NC}"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}Error: python3 is not installed${NC}"; exit 1; }

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Step 1: Generate mTLS certificates
echo ""
echo -e "${BLUE}=== Step 1: Generating mTLS Certificates ===${NC}"
cd "${SCRIPT_DIR}/mtls"
chmod +x generate-certs.sh
./generate-certs.sh

# Step 2: Create necessary directories
echo ""
echo -e "${BLUE}=== Step 2: Creating Directories ===${NC}"
mkdir -p "${SCRIPT_DIR}/waf/logs"
mkdir -p "${SCRIPT_DIR}/ddos/logs"
mkdir -p "${SCRIPT_DIR}/siem/logs"
mkdir -p "${SCRIPT_DIR}/testing/reports"
echo -e "${GREEN}✓ Directories created${NC}"

# Step 3: Set up Docker network
echo ""
echo -e "${BLUE}=== Step 3: Setting Up Docker Network ===${NC}"
docker network create agrobridge-network 2>/dev/null || echo "Network already exists"
docker network create agrobridge-security 2>/dev/null || echo "Security network already exists"
echo -e "${GREEN}✓ Networks ready${NC}"

# Step 4: Start security services
echo ""
echo -e "${BLUE}=== Step 4: Starting Security Services ===${NC}"
cd "${SCRIPT_DIR}"
docker-compose -f docker-compose.security.yml up -d

# Wait for services to be ready
echo ""
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Step 5: Verify installation
echo ""
echo -e "${BLUE}=== Step 5: Verifying Installation ===${NC}"

# Check if services are running
services=(
    "agrobridge-waf"
    "agrobridge-ddos"
    "agrobridge-wazuh-manager"
    "agrobridge-wazuh-indexer"
    "agrobridge-wazuh-dashboard"
    "agrobridge-filebeat"
)

all_running=true
for service in "${services[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${service}$"; then
        echo -e "${GREEN}✓ ${service} is running${NC}"
    else
        echo -e "${RED}✗ ${service} is not running${NC}"
        all_running=false
    fi
done

# Verify certificates
echo ""
echo -e "${YELLOW}Verifying certificates...${NC}"
cd "${SCRIPT_DIR}/mtls"
if python3 verify-mtls.py; then
    echo -e "${GREEN}✓ Certificates verified${NC}"
else
    echo -e "${RED}✗ Certificate verification failed${NC}"
    all_running=false
fi

# Step 6: Display access information
echo ""
echo -e "${BLUE}=== Setup Complete ===${NC}"
echo ""

if [ "$all_running" = true ]; then
    echo -e "${GREEN}✅ All security services are running!${NC}"
else
    echo -e "${YELLOW}⚠️  Some services failed to start. Check logs with:${NC}"
    echo "   docker-compose -f docker-compose.security.yml logs"
fi

echo ""
echo -e "${BLUE}Access Information:${NC}"
echo ""
echo "  Wazuh Security Dashboard:"
echo "    URL: http://localhost:5601"
echo "    Username: admin"
echo "    Password: SecretPassword"
echo ""
echo "  Grafana Security Metrics:"
echo "    URL: http://localhost:3001"
echo "    Username: admin"
echo "    Password: admin"
echo ""
echo "  WAF (ModSecurity):"
echo "    Proxy: http://localhost:80"
echo "    Logs: docker logs agrobridge-waf"
echo ""
echo "  DDoS Protection:"
echo "    Proxy: http://localhost:80"
echo "    Logs: docker logs agrobridge-ddos"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "  1. Access Wazuh dashboard and configure alerts"
echo "  2. Review WAF logs and tune rules if needed"
echo "  3. Run security tests:"
echo "     cd ${SCRIPT_DIR}/testing"
echo "     python3 run-security-tests.py"
echo ""
echo "  4. Set up certificate rotation cron job:"
echo "     0 0 * * 0 ${SCRIPT_DIR}/mtls/rotate-certs.sh"
echo ""
echo "  5. Configure monitoring alerts"
echo "  6. Review security policies"
echo ""

echo -e "${BLUE}Documentation:${NC}"
echo ""
echo "  Quick Start: ${SCRIPT_DIR}/QUICK_START.md"
echo "  Full Docs:   ${SCRIPT_DIR}/README.md"
echo "  Completion:  ${SCRIPT_DIR}/../docs/tasks/TASK_25_COMPLETION.md"
echo ""

echo -e "${BLUE}Useful Commands:${NC}"
echo ""
echo "  # View all security logs"
echo "  docker-compose -f docker-compose.security.yml logs -f"
echo ""
echo "  # Stop all security services"
echo "  docker-compose -f docker-compose.security.yml down"
echo ""
echo "  # Restart a specific service"
echo "  docker-compose -f docker-compose.security.yml restart <service>"
echo ""
echo "  # Run security tests"
echo "  cd testing && python3 run-security-tests.py"
echo ""
echo "  # Rotate certificates"
echo "  cd mtls && ./rotate-certs.sh"
echo ""

echo -e "${GREEN}Setup completed successfully!${NC}"
echo ""
