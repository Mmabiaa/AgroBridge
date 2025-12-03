# API Gateway Setup Guide

## Overview

This guide covers the setup and configuration of Kong API Gateway for the AgroBridge microservices platform.

## Architecture

Kong API Gateway serves as the single entry point for all client requests, providing:
- Request routing to 15 microservices
- JWT authentication and authorization
- Rate limiting (200 req/hour anonymous, 2000 req/hour authenticated)
- CORS handling
- Security headers
- Request/response transformation
- Load balancing and circuit breaking

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database for Kong (included in infrastructure setup)
- All microservices configured and ready to deploy

## Quick Setup

### 1. Start Kong Infrastructure

```bash
cd backend/api_gateway
./setup-kong.sh setup
```

This will:
1. Start Kong database (PostgreSQL)
2. Run Kong migrations
3. Start Kong Gateway
4. Validate configuration
5. Apply declarative configuration
6. Verify setup

### 2. Verify Installation

```bash
# Check Kong status
curl http://localhost:8001/status

# Test health endpoint
curl http://localhost:8000/health

# List configured services
curl http://localhost:8001/services

# List configured routes
curl http://localhost:8001/routes
```

### 3. Access Admin Interfaces

- **Kong Proxy**: http://localhost:8000
- **Kong Admin API**: http://localhost:8001
- **Kong Admin GUI**: http://localhost:8002

## Configuration

### Services Configured

The following 15 microservices are configured:

1. **Authentication Service** (port 8001) - User authentication and authorization
2. **User Service** (port 8002) - User profiles and preferences
3. **Farm Management Service** (port 8003) - Farm, field, and crop management
4. **Marketplace Service** (port 8004) - Product listings and orders
5. **AI Assistant Service** (port 8005) - AgriGPT chat and voice commands
6. **Crop Detection Service** (port 8006) - Disease detection and analysis
7. **IoT Service** (port 8007) - Device management and sensor data
8. **Notification Service** (port 8008) - Real-time notifications
9. **Financial Service** (port 8009) - Financial records and budgets
10. **Learning Service** (port 8010) - Courses and educational content
11. **Community Service** (port 8011) - Social posts and messaging
12. **Scheduling Service** (port 8012) - Task management and reminders
13. **Analytics Service** (port 8013) - Dashboard metrics and predictions
14. **Payment Service** (port 8014) - Payment processing
15. **Admin Service** (port 8015) - Administrative functions

### Rate Limiting

#### Anonymous Users
- Registration: 10 requests/minute
- Login: 20 requests/minute
- General API: 200 requests/hour

#### Authenticated Users
- General API: 2000 requests/hour
- AI Chat: 30 requests/minute
- Crop Detection: 20 requests/minute
- IoT Sensor Data: 1000 requests/minute

### Security Features

1. **Global Security Headers**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Strict-Transport-Security: max-age=31536000
   - Content-Security-Policy: default-src 'self'

2. **Request Size Limits**
   - Global: 10MB
   - AI Voice: 10MB
   - Crop Detection: 20MB
   - IoT Sensor Data: 1MB

3. **JWT Authentication**
   - Algorithm: HS256
   - Claims verified: exp (expiration)
   - Token location: Authorization header

4. **CORS Configuration**
   - Origins: Configurable
   - Methods: GET, POST, PUT, DELETE, OPTIONS
   - Credentials: Enabled

## Management

### Apply Configuration Changes

```bash
# 1. Edit configuration
vim backend/api_gateway/kong.yml

# 2. Validate
./setup-kong.sh validate

# 3. Apply
./setup-kong.sh apply
```

### Start/Stop Gateway

```bash
# Start
./setup-kong.sh start

# Stop
./setup-kong.sh stop

# Restart
./setup-kong.sh restart
```

### View Logs

```bash
./setup-kong.sh logs
```

### Check Status

```bash
./setup-kong.sh status
```

## Monitoring

### Health Checks

```bash
# Kong health
curl http://localhost:8001/status

# Service health
curl http://localhost:8001/services

# Route health
curl http://localhost:8001/routes
```

### Metrics

Kong exposes metrics at:
```bash
curl http://localhost:8001/metrics
```

### Logs

View real-time logs:
```bash
docker logs agrobridge-kong -f
```

## Troubleshooting

### Kong Won't Start

1. Check database connection:
   ```bash
   docker-compose -f docker-compose.infrastructure.yml ps kong-database
   ```

2. Check logs:
   ```bash
   docker logs agrobridge-kong
   ```

3. Verify migrations:
   ```bash
   docker-compose -f docker-compose.infrastructure.yml up kong-migration
   ```

### Routes Not Working

1. Verify service is running:
   ```bash
   docker ps | grep agrobridge
   ```

2. Check route configuration:
   ```bash
   curl http://localhost:8001/routes
   ```

3. Test service directly (bypass Kong):
   ```bash
   curl http://localhost:8001/health
   ```

### Rate Limiting Issues

1. Check plugin configuration:
   ```bash
   curl http://localhost:8001/plugins
   ```

2. View rate limit headers:
   ```bash
   curl -i http://localhost:8000/api/v1/auth/login
   ```

### JWT Authentication Failing

1. Verify token format (Bearer token)
2. Check token expiration (15 minutes)
3. Verify JWT secret matches across services

## Production Deployment

### SSL/TLS Configuration

1. Obtain SSL certificates
2. Configure Kong for HTTPS:
   ```yaml
   services:
     kong:
       environment:
         KONG_SSL_CERT: /path/to/cert.pem
         KONG_SSL_CERT_KEY: /path/to/key.pem
   ```

### Redis for Distributed Rate Limiting

1. Update rate limiting policy:
   ```yaml
   plugins:
     - name: rate-limiting
       config:
         policy: redis
         redis_host: redis
         redis_port: 6379
   ```

### IP Whitelisting for Admin API

1. Restrict admin API access:
   ```yaml
   plugins:
     - name: ip-restriction
       config:
         allow:
           - 10.0.0.0/8
           - 172.16.0.0/12
   ```

### Monitoring Integration

1. Configure Prometheus plugin:
   ```yaml
   plugins:
     - name: prometheus
   ```

2. Configure logging to ELK:
   ```yaml
   plugins:
     - name: file-log
       config:
         path: /var/log/kong/access.log
   ```

## Environment Variables

Configure in `.env` file:

```bash
# Kong Database
KONG_PG_HOST=kong-database
KONG_PG_PORT=5432
KONG_PG_USER=kong
KONG_PG_PASSWORD=kong_password
KONG_PG_DATABASE=kong

# Kong Ports
KONG_PROXY_PORT=8000
KONG_PROXY_SSL_PORT=8443
KONG_ADMIN_PORT=8001
KONG_ADMIN_GUI_PORT=8002

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
```

## Best Practices

1. **Use HTTPS in Production**
   - Configure SSL certificates
   - Redirect HTTP to HTTPS
   - Enable HSTS

2. **Secure Admin API**
   - Use IP whitelisting
   - Enable authentication
   - Use separate network

3. **Monitor Rate Limits**
   - Track violations
   - Adjust based on usage
   - Alert on suspicious patterns

4. **Regular Updates**
   - Keep Kong updated
   - Test in staging first
   - Monitor changelog

5. **Backup Configuration**
   - Version control kong.yml
   - Regular database backups
   - Document changes

## References

- [Kong Documentation](https://docs.konghq.com/)
- [API Gateway README](../../api_gateway/README.md)
- [Quick Start Guide](../../api_gateway/QUICK_START.md)
- [Task 1.4 Completion Report](../tasks/TASK_1_4_COMPLETION.md)

## Support

For issues or questions:
- Check logs: `docker logs agrobridge-kong -f`
- Review configuration: `curl http://localhost:8001/services`
- Consult documentation: See references above

---

**Last Updated**: December 3, 2025  
**Version**: 1.0  
**Status**: Production Ready
