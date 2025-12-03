# Kong API Gateway - Quick Start Guide

## 5-Minute Setup

### 1. Start Kong
```bash
cd backend/api_gateway
./setup-kong.sh setup
```

**Windows:**
```powershell
cd backend/api_gateway
.\setup-kong.ps1 setup
```

### 2. Test Gateway
```bash
# Health check
curl http://localhost:8000/health

# List services
curl http://localhost:8001/services

# Test authentication endpoint
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Common Operations

### View Logs
```bash
docker logs agrobridge-kong -f
```

### Restart Gateway
```bash
./setup-kong.sh restart
```

### Apply Configuration Changes
```bash
# 1. Edit kong.yml
vim kong.yml

# 2. Validate
./setup-kong.sh validate

# 3. Apply
./setup-kong.sh apply
```

### Stop Gateway
```bash
./setup-kong.sh stop
```

## API Endpoints

### Gateway URLs
- **HTTP Proxy**: http://localhost:8000
- **HTTPS Proxy**: https://localhost:8443
- **Admin API**: http://localhost:8001
- **Admin GUI**: http://localhost:8002

### Service Routes

#### Authentication (No JWT Required)
```bash
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/verify-email
POST /api/v1/auth/password-reset
```

#### User Profile (JWT Required)
```bash
GET    /api/v1/users/profile
PUT    /api/v1/users/profile
GET    /api/v1/users/preferences
PUT    /api/v1/users/preferences
```

#### Farms (JWT Required)
```bash
GET    /api/v1/farms
POST   /api/v1/farms
GET    /api/v1/farms/{id}
PUT    /api/v1/farms/{id}
DELETE /api/v1/farms/{id}
```

#### Marketplace (Mixed Auth)
```bash
GET    /api/v1/marketplace/products        # No JWT
POST   /api/v1/marketplace/products        # JWT required
GET    /api/v1/marketplace/orders          # JWT required
POST   /api/v1/marketplace/orders          # JWT required
```

#### AI Assistant (JWT Required)
```bash
POST   /api/v1/ai/chat
POST   /api/v1/ai/voice
GET    /api/v1/ai/conversations
```

#### Crop Detection (JWT Required)
```bash
POST   /api/v1/crop-detection/detect
GET    /api/v1/crop-detection/history
```

## Authentication

### Get JWT Token
```bash
# 1. Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response:
# {
#   "access_token": "eyJhbGc...",
#   "refresh_token": "eyJhbGc...",
#   "expires_in": 900
# }
```

### Use JWT Token
```bash
curl -X GET http://localhost:8000/api/v1/users/profile \
  -H "Authorization: Bearer eyJhbGc..."
```

### Refresh Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"eyJhbGc..."}'
```

## Rate Limits

### Anonymous Users
- Registration: 10 req/min
- Login: 20 req/min
- General: 200 req/hour

### Authenticated Users
- General: 2000 req/hour
- AI Chat: 30 req/min
- Crop Detection: 20 req/min
- IoT Data: 1000 req/min

### Rate Limit Response
```json
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit-Minute: 10
X-RateLimit-Remaining-Minute: 0

{
  "message": "API rate limit exceeded"
}
```

## Troubleshooting

### Kong Won't Start
```bash
# Check database
docker-compose -f ../docker-compose.infrastructure.yml ps kong-database

# Check logs
docker logs agrobridge-kong

# Restart
./setup-kong.sh restart
```

### Routes Not Working
```bash
# Verify service is running
docker ps | grep agrobridge

# Check Kong configuration
curl http://localhost:8001/routes

# Test service directly (bypass Kong)
curl http://localhost:8001/health
```

### Rate Limiting Issues
```bash
# Check plugin configuration
curl http://localhost:8001/plugins

# View rate limit status
curl -i http://localhost:8000/api/v1/auth/login
# Look for X-RateLimit-* headers
```

### JWT Authentication Failing
```bash
# Verify token format
echo "Bearer eyJhbGc..." | base64 -d

# Check token expiration
# JWT tokens expire after 15 minutes

# Get new token
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -d '{"refresh_token":"..."}'
```

## Configuration Tips

### Add New Service
```yaml
services:
  - name: my-new-service
    url: http://my-service:8016
    retries: 3
    connect_timeout: 5000
    routes:
      - name: my-route
        paths:
          - /api/v1/my-service
        methods:
          - GET
          - POST
        plugins:
          - name: jwt
          - name: rate-limiting
            config:
              minute: 100
```

### Add New Route
```yaml
routes:
  - name: my-new-route
    paths:
      - /api/v1/my-endpoint
    methods:
      - GET
    strip_path: false
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 50
```

### Adjust Rate Limits
```yaml
plugins:
  - name: rate-limiting
    config:
      minute: 100    # Requests per minute
      hour: 2000     # Requests per hour
      policy: local  # or 'redis' for distributed
```

## Monitoring

### Check Gateway Status
```bash
curl http://localhost:8001/status
```

### View Metrics
```bash
# Service health
curl http://localhost:8001/services

# Route statistics
curl http://localhost:8001/routes

# Plugin status
curl http://localhost:8001/plugins
```

### Access Admin GUI
Open browser: http://localhost:8002

## Environment Variables

Create `.env` file in backend directory:
```bash
# Kong Database
KONG_PG_USER=kong
KONG_PG_PASSWORD=kong_password
KONG_PG_DATABASE=kong
KONG_PG_PORT=5434

# Kong Ports
KONG_PROXY_PORT=8000
KONG_PROXY_SSL_PORT=8443
KONG_ADMIN_PORT=8001
KONG_ADMIN_GUI_PORT=8002

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
```

## Next Steps

1. **Set up SSL/TLS** for production
2. **Configure Redis** for distributed rate limiting
3. **Integrate Consul** for service discovery
4. **Add monitoring** with Prometheus/Grafana
5. **Set up logging** with ELK stack

## Support

- **Documentation**: See [README.md](README.md)
- **Logs**: `docker logs agrobridge-kong -f`
- **Admin API**: http://localhost:8001
- **Kong Docs**: https://docs.konghq.com/

## Quick Commands Reference

```bash
# Setup
./setup-kong.sh setup

# Start/Stop
./setup-kong.sh start
./setup-kong.sh stop
./setup-kong.sh restart

# Configuration
./setup-kong.sh validate
./setup-kong.sh apply

# Monitoring
./setup-kong.sh status
./setup-kong.sh logs

# Cleanup
./setup-kong.sh remove
```
