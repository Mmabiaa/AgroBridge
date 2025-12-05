# AgroBridge Security Hardening Service

This directory contains the security hardening implementation for the AgroBridge microservices platform.

## Overview

The Security Hardening Service implements comprehensive security controls including:

- **Zero-Trust Architecture**: Mutual TLS for service-to-service communication
- **Web Application Firewall (WAF)**: Protection against OWASP Top 10 vulnerabilities
- **SIEM Integration**: Security Information and Event Management for threat detection
- **Security Testing**: Automated security scans and penetration testing
- **DDoS Protection**: Rate limiting and traffic filtering

## Requirements Fulfilled

This implementation satisfies the following requirements:
- **34.1**: Zero-trust architecture with mutual TLS
- **34.5**: Web Application Firewall (WAF) configuration
- **34.6**: SIEM integration for security monitoring
- **34.7**: Automated security testing and penetration testing
- **34.8**: DDoS protection with rate limiting and traffic filtering
- **30.4**: Security testing requirements

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    External Traffic                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DDoS Protection Layer                         │
│  - Rate Limiting (IP-based, User-based)                         │
│  - Traffic Filtering                                             │
│  - Geo-blocking                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Web Application Firewall (ModSecurity)              │
│  - OWASP Core Rule Set                                          │
│  - SQL Injection Protection                                      │
│  - XSS Protection                                                │
│  - CSRF Protection                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Kong API Gateway                            │
│  - JWT Authentication                                            │
│  - Rate Limiting                                                 │
│  - CORS                                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Service A  │◄──►│   Service B  │◄──►│   Service C  │
│   (mTLS)     │    │   (mTLS)     │    │   (mTLS)     │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  SIEM System    │
                  │  (Wazuh/ELK)    │
                  │  - Log Analysis │
                  │  - Threat Intel │
                  │  - Alerting     │
                  └─────────────────┘
```

## Components

### 1. Zero-Trust Architecture (mTLS)

**Location**: `mtls/`

Implements mutual TLS authentication for all service-to-service communication:
- Certificate Authority (CA) setup
- Service certificate generation
- Automatic certificate rotation
- Certificate validation

**Files**:
- `mtls/ca-config.json` - CA configuration
- `mtls/generate-certs.sh` - Certificate generation script
- `mtls/rotate-certs.sh` - Certificate rotation script
- `mtls/verify-mtls.py` - mTLS verification tool

### 2. Web Application Firewall (WAF)

**Location**: `waf/`

ModSecurity-based WAF with OWASP Core Rule Set:
- SQL injection protection
- XSS protection
- CSRF protection
- File upload validation
- Request size limits

**Files**:
- `waf/modsecurity.conf` - ModSecurity configuration
- `waf/crs-setup.conf` - OWASP CRS setup
- `waf/custom-rules.conf` - Custom security rules
- `waf/whitelist.conf` - Whitelisted IPs/patterns

### 3. SIEM Integration

**Location**: `siem/`

Security Information and Event Management integration:
- Wazuh agent configuration
- Log forwarding to ELK stack
- Security event correlation
- Threat intelligence feeds
- Automated alerting

**Files**:
- `siem/wazuh-agent.conf` - Wazuh agent configuration
- `siem/ossec-rules.xml` - Custom security rules
- `siem/filebeat-security.yml` - Security log shipping
- `siem/security-dashboards.json` - Kibana dashboards

### 4. Security Testing

**Location**: `testing/`

Automated security testing tools:
- OWASP ZAP integration
- Dependency vulnerability scanning
- Container image scanning
- Penetration testing scripts

**Files**:
- `testing/zap-scan.py` - OWASP ZAP automation
- `testing/dependency-check.sh` - Dependency scanning
- `testing/container-scan.sh` - Container security scan
- `testing/pentest-suite.py` - Penetration testing suite

### 5. DDoS Protection

**Location**: `ddos/`

DDoS mitigation and traffic filtering:
- Rate limiting rules
- IP reputation checking
- Geo-blocking
- Traffic pattern analysis

**Files**:
- `ddos/rate-limits.conf` - Rate limiting configuration
- `ddos/ip-blacklist.txt` - Blocked IP addresses
- `ddos/geo-blocking.conf` - Geographic restrictions
- `ddos/traffic-monitor.py` - Traffic analysis tool

## Setup and Deployment

### Prerequisites

- Docker and Docker Compose
- OpenSSL (for certificate generation)
- Python 3.9+
- Kong Gateway (already configured)

### Installation Steps

#### 1. Generate mTLS Certificates

```bash
cd backend/security/mtls
./generate-certs.sh
```

This creates:
- Root CA certificate
- Service certificates for all microservices
- Client certificates for testing

#### 2. Configure WAF

```bash
cd backend/security/waf
docker-compose up -d modsecurity
```

#### 3. Set Up SIEM

```bash
cd backend/security/siem
docker-compose up -d wazuh-manager wazuh-agent
```

#### 4. Configure DDoS Protection

```bash
cd backend/security/ddos
python setup-ddos-protection.py
```

#### 5. Run Security Tests

```bash
cd backend/security/testing
python run-security-tests.py
```

### Verification

1. **Verify mTLS**
   ```bash
   python mtls/verify-mtls.py
   ```

2. **Test WAF**
   ```bash
   curl -X POST http://localhost:8000/api/v1/test \
     -d "username=admin' OR '1'='1"
   # Should be blocked by WAF
   ```

3. **Check SIEM Logs**
   ```bash
   curl http://localhost:5601/app/kibana#/discover
   ```

4. **Test DDoS Protection**
   ```bash
   python ddos/test-rate-limits.py
   ```

## Configuration

### Environment Variables

```bash
# mTLS Configuration
MTLS_ENABLED=true
MTLS_CA_CERT=/certs/ca.crt
MTLS_CERT_DIR=/certs/services
MTLS_VERIFY_DEPTH=2

# WAF Configuration
WAF_ENABLED=true
WAF_PARANOIA_LEVEL=2
WAF_ANOMALY_THRESHOLD=5
WAF_LOG_LEVEL=warn

# SIEM Configuration
SIEM_ENABLED=true
WAZUH_MANAGER_HOST=wazuh-manager
WAZUH_MANAGER_PORT=1514
SIEM_LOG_LEVEL=info

# DDoS Protection
DDOS_ENABLED=true
DDOS_RATE_LIMIT_GLOBAL=1000
DDOS_RATE_LIMIT_PER_IP=100
DDOS_BAN_DURATION=3600
```

### Kong WAF Plugin Configuration

Add to `kong.yml`:

```yaml
plugins:
  - name: modsecurity
    config:
      enabled: true
      paranoia_level: 2
      anomaly_threshold: 5
      rules:
        - /etc/modsecurity/crs-setup.conf
        - /etc/modsecurity/rules/*.conf
```

## Security Policies

### 1. Certificate Management

- **Rotation Period**: 90 days
- **Key Size**: 4096 bits RSA
- **Algorithm**: SHA-256
- **Validity**: 1 year
- **Auto-renewal**: 30 days before expiry

### 2. WAF Rules

- **Paranoia Level**: 2 (balanced security/false positives)
- **Anomaly Threshold**: 5 points
- **Block Mode**: On (not just detect)
- **Custom Rules**: Application-specific rules

### 3. Rate Limiting

- **Global**: 1000 req/sec
- **Per IP**: 100 req/sec
- **Per User**: 2000 req/hour
- **Burst**: 50 requests
- **Ban Duration**: 1 hour

### 4. Geo-Blocking

- **Allowed Regions**: Africa, Europe, North America
- **Blocked Countries**: High-risk countries (configurable)
- **Exceptions**: Whitelisted IPs

## Monitoring and Alerting

### Security Metrics

1. **WAF Metrics**
   - Blocked requests per minute
   - Attack types detected
   - False positive rate

2. **mTLS Metrics**
   - Certificate expiry dates
   - Failed authentication attempts
   - Certificate validation errors

3. **DDoS Metrics**
   - Request rate per IP
   - Banned IPs count
   - Traffic patterns

4. **SIEM Metrics**
   - Security events per hour
   - Critical alerts
   - Threat intelligence matches

### Alerting Rules

1. **Critical Alerts**
   - Multiple failed authentication attempts
   - SQL injection attempts
   - Certificate expiry < 7 days
   - DDoS attack detected

2. **Warning Alerts**
   - High rate of WAF blocks
   - Unusual traffic patterns
   - Certificate expiry < 30 days

3. **Info Alerts**
   - New IP addresses
   - Configuration changes
   - Certificate rotations

## Security Testing

### Automated Tests

1. **OWASP ZAP Scan**
   - Full site scan
   - API security testing
   - Authentication testing

2. **Dependency Scanning**
   - Python packages (Safety, Bandit)
   - Docker images (Trivy, Clair)
   - JavaScript packages (npm audit)

3. **Penetration Testing**
   - SQL injection tests
   - XSS tests
   - CSRF tests
   - Authentication bypass tests

### Manual Testing

1. **Quarterly Penetration Tests**
   - External security firm
   - Full scope testing
   - Report and remediation

2. **Bug Bounty Program**
   - Public program on HackerOne
   - Scope: All production services
   - Rewards: $100 - $10,000

## Incident Response

### Security Incident Workflow

1. **Detection**
   - SIEM alerts
   - WAF blocks
   - User reports

2. **Analysis**
   - Log review
   - Impact assessment
   - Root cause analysis

3. **Containment**
   - Block malicious IPs
   - Disable compromised accounts
   - Isolate affected services

4. **Eradication**
   - Remove malware
   - Patch vulnerabilities
   - Update security rules

5. **Recovery**
   - Restore services
   - Verify security
   - Monitor for recurrence

6. **Post-Incident**
   - Document incident
   - Update procedures
   - Implement improvements

## Compliance

### Standards Compliance

- **OWASP Top 10**: Full coverage
- **PCI DSS**: Payment security (if applicable)
- **GDPR**: Data protection (EU users)
- **ISO 27001**: Information security management

### Audit Logging

All security events are logged:
- Authentication attempts
- Authorization failures
- WAF blocks
- Certificate operations
- Configuration changes

Logs are:
- Immutable (write-once)
- Encrypted at rest
- Retained for 1 year
- Backed up daily

## Troubleshooting

### Common Issues

1. **mTLS Connection Failures**
   - Check certificate validity
   - Verify CA trust chain
   - Check certificate permissions

2. **WAF False Positives**
   - Review blocked requests
   - Add whitelist rules
   - Adjust paranoia level

3. **SIEM Not Receiving Logs**
   - Check Filebeat status
   - Verify network connectivity
   - Check Wazuh agent status

4. **Rate Limiting Too Aggressive**
   - Review rate limit logs
   - Adjust limits per endpoint
   - Add user exemptions

### Debug Commands

```bash
# Check mTLS certificates
openssl x509 -in /certs/service.crt -text -noout

# Test WAF rules
curl -X POST http://localhost:8000/test -d "test=<script>alert(1)</script>"

# Check SIEM status
docker exec wazuh-manager /var/ossec/bin/agent_control -l

# View rate limit stats
redis-cli --scan --pattern "rate_limit:*"
```

## Performance Impact

### Expected Overhead

- **mTLS**: ~5-10ms per request
- **WAF**: ~2-5ms per request
- **SIEM Logging**: ~1-2ms per request
- **Total**: ~8-17ms additional latency

### Optimization Tips

1. **Certificate Caching**: Cache validated certificates
2. **WAF Tuning**: Disable unnecessary rules
3. **Async Logging**: Use async SIEM logging
4. **Connection Pooling**: Reuse TLS connections

## Maintenance

### Regular Tasks

**Daily**:
- Review security alerts
- Check blocked IPs
- Monitor false positives

**Weekly**:
- Review WAF logs
- Update IP blacklists
- Check certificate expiry

**Monthly**:
- Update WAF rules
- Review security policies
- Conduct security drills

**Quarterly**:
- Rotate secrets
- Penetration testing
- Security audit

## Support

For security issues:
- **Email**: security@agrobridge.com
- **Bug Bounty**: https://hackerone.com/agrobridge
- **Emergency**: +1-XXX-XXX-XXXX (24/7)

## License

Copyright © 2025 AgroBridge. All rights reserved.
