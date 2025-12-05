# AgroBridge Security - Quick Start Guide

This guide will help you quickly set up and deploy the security hardening infrastructure for AgroBridge.

## Prerequisites

- Docker and Docker Compose installed
- OpenSSL installed
- Python 3.9+ installed
- At least 4GB RAM available
- 10GB disk space

## Quick Setup (5 minutes)

### Step 1: Generate Certificates

```bash
cd backend/security/mtls
chmod +x generate-certs.sh
./generate-certs.sh
```

This generates:
- Root CA certificate
- Service certificates for all 22 microservices
- Client test certificates

### Step 2: Start Security Services

```bash
cd backend/security
docker-compose -f docker-compose.security.yml up -d
```

This starts:
- ModSecurity WAF
- Nginx DDoS Protection
- Wazuh SIEM
- Filebeat Log Shipping
- Security Dashboard

### Step 3: Verify Installation

```bash
# Check all services are running
docker-compose -f docker-compose.security.yml ps

# Verify certificates
python3 mtls/verify-mtls.py

# Test WAF
curl http://localhost/health

# Access security dashboard
open http://localhost:5601
```

## Testing Security

### Run Security Tests

```bash
cd backend/security/testing
python3 run-security-tests.py --target http://localhost:8000
```

### Test WAF Protection

```bash
# This should be blocked by WAF
curl -X POST http://localhost/api/v1/test \
  -d "username=admin' OR '1'='1"

# This should also be blocked
curl http://localhost/api/v1/test?id=<script>alert(1)</script>
```

### Test Rate Limiting

```bash
# This should trigger rate limiting after 5 attempts
for i in {1..10}; do
  curl -X POST http://localhost/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

## Accessing Dashboards

### Wazuh Security Dashboard
- URL: http://localhost:5601
- Username: admin
- Password: SecretPassword

### Grafana Security Metrics
- URL: http://localhost:3001
- Username: admin
- Password: admin

### OWASP ZAP (Testing)
- URL: http://localhost:8080
- Start with: `docker-compose --profile testing up zap`

## Common Tasks

### View Security Logs

```bash
# WAF logs
docker exec agrobridge-waf tail -f /var/log/modsecurity/audit.log

# DDoS logs
docker exec agrobridge-ddos tail -f /var/log/nginx/ddos_access.log

# Wazuh logs
docker exec agrobridge-wazuh-manager tail -f /var/ossec/logs/alerts/alerts.log
```

### Rotate Certificates

```bash
cd backend/security/mtls
chmod +x rotate-certs.sh
./rotate-certs.sh
```

### Update WAF Rules

```bash
# Edit custom rules
nano backend/security/waf/custom-rules.conf

# Restart WAF
docker-compose -f docker-compose.security.yml restart modsecurity
```

### Add IP to Blacklist

```bash
# Edit blacklist
nano backend/security/ddos/ip-blacklist.txt

# Add IP address
echo "192.168.1.100" >> backend/security/ddos/ip-blacklist.txt

# Reload Nginx
docker exec agrobridge-ddos nginx -s reload
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.security.yml logs

# Check disk space
df -h

# Check memory
free -h
```

### WAF Blocking Legitimate Traffic

```bash
# Check WAF logs
docker exec agrobridge-waf tail -f /var/log/modsecurity/audit.log

# Add whitelist rule in waf/whitelist.conf
# Restart WAF
docker-compose -f docker-compose.security.yml restart modsecurity
```

### Certificate Errors

```bash
# Verify certificates
python3 mtls/verify-mtls.py

# Check certificate expiry
openssl x509 -in mtls/certs/services/authentication/authentication-cert.pem -noout -dates

# Regenerate if needed
cd mtls
./generate-certs.sh
```

### High Memory Usage

```bash
# Check resource usage
docker stats

# Reduce Wazuh memory
# Edit docker-compose.security.yml
# Change OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m to lower values

# Restart services
docker-compose -f docker-compose.security.yml restart
```

## Security Checklist

Before going to production:

- [ ] All certificates generated and verified
- [ ] WAF rules tested and tuned
- [ ] Rate limits configured appropriately
- [ ] SIEM alerts configured
- [ ] Security dashboards accessible
- [ ] Backup procedures tested
- [ ] Incident response plan documented
- [ ] Security tests passing
- [ ] Monitoring alerts working
- [ ] Team trained on security procedures

## Next Steps

1. **Configure Alerts**: Set up email/SMS alerts for critical security events
2. **Tune WAF**: Adjust paranoia level and rules based on your traffic
3. **Schedule Scans**: Set up automated security scans (weekly)
4. **Document Procedures**: Create runbooks for common security tasks
5. **Train Team**: Ensure team knows how to respond to security incidents

## Support

For security issues:
- Email: security@agrobridge.com
- Emergency: +1-XXX-XXX-XXXX (24/7)
- Documentation: See README.md for detailed information

## Additional Resources

- [Full Documentation](README.md)
- [mTLS Setup Guide](mtls/README.md)
- [WAF Configuration](waf/README.md)
- [SIEM Integration](siem/README.md)
- [Security Testing](testing/README.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
