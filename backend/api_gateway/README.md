# AgroBridge API Gateway

This directory contains the Kong Gateway configuration for the AgroBridge microservices platform.

## Overview

The API Gateway serves as the single entry point for all client requests to the AgroBridge backend services. It provides:

- **Request Routing**: Routes requests to appropriate microservices
- **Authentication & Authorization**: JWT token validation
- **Rate Limiting**: Protects services from abuse (200 req/hour anonymous, 2000 req/hour authenticated)
- **CORS Handling**: Cross-Origin Resource Sharing configuration
- **Security Headers**: Adds security headers to all responses
- **Circuit Breaking**: Prevents cascading failures
- **Request/Response Transformation**: Adds correlation IDs and service headers

## Requirements Fulfilled

This implementation satisfies the following requirements:
- **21.1**: Rate limiting (200 req/hour anonymous, 2000 req/hour authenticated)
- **21.2**: HTTP 429 status with retry-after header on rate limit exceeded
- **26.1**: Service registration and dynamic routing
- **26.3**: Load balancing across service instances
- **26.5**: Circuit breaker pattern implementation
- **26.6**: Cross-cutting concerns (authentication, rate limiting, logging, CORS)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client Applications                           │
│              (Web, Mobile, IoT Devices)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS/HTTP
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Kong API Gateway                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Global Plugins:                                          │  │
│  │  - Correlation ID (X-Request-ID)                         │  │
│  │  - Request Size Limiting (10MB)                          │  │
│  │  - Security Headers (HSTS, CSP, X-Frame-Options)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Route-Specific Plugins:                                 │  │
│  │  - JWT Authentication                                     │  │
│  │  - Rate Limiting (per route)                             │  │
│  │  - CORS                                                   │  │
│  │  - Request Transformer                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Auth Service │    │ Farm Service │    │   Marketplace│
│   :8001      │    │   :8003      │    │   :8004      │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Services Configuration

### Configured Services

1. **Authentication Service** (port 8001)
   - User registration, login, logout
   - Email verification, password reset
   - Token refresh

2. **User Service** (port 8002)
   - User profiles and preferences
   - User search
   - GDPR data export

3. **Farm Management Service** (port 8003)
   - Farm CRUD operations
   - Field and crop management
   - Farm statistics

4. **Marketplace Service** (port 8004)
   - Product listings
   - Order management
   - Reviews and ratings

5. **AI Assistant Service** (port 8005)
   - AgriGPT chat
   - Voice command processing
   - Conversation history

6. **Crop Detection Service** (port 8006)
   - Disease detection
   - Detection history

7. **IoT Service** (port 8007)
   - Device management
   - Sensor data ingestion
   - Real-time readings

8. **Notification Service** (port 8008)
   - Notification retrieval
   - Read status management
   - Notification preferences

9. **Financial Service** (port 8009)
   - Financial records
   - Budget management
   - Financial reports

10. **Learning Service** (port 8010)
    - Course catalog
    - Enrollment management
    - Progress tracking

11. **Community Service** (port 8011)
    - Social posts
    - Private messaging

12. **Scheduling Service** (port 8012)
    - Task management
    - Reminders

13. **Analytics Service** (port 8013)
    - Dashboard metrics
    - Predictive analytics

14. **Payment Service** (port 8014)
    - Payment processing
    - Transaction history
    - Webhook handling

15. **Admin Service** (port 8015)
    - User management
    - Content moderation
    - IP-restricted access

## Rate Limiting Configuration

### Anonymous Users
- **10 requests/minute** for registration
- **20 requests/minute** for login
- **200 requests/minute** for general API access

### Authenticated Users
- **2000 requests/hour** for general API access
- **30 requests/minute** for AI chat
- **20 requests/minute** for crop detection
- **1000 requests/minute** for IoT sensor data ingestion

### Special Cases
- **3 requests/minute** for password reset
- **5 requests/minute** for email verification
- **1 request/minute** for data export

## Security Features

### Global Security Headers
All responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'`

### Request Size Limits
- **Global**: 10MB maximum payload
- **AI Voice**: 10MB (audio files)
- **Crop Detection**: 20MB (image files)
- **IoT Sensor Data**: 1MB (batch uploads)
- **AI Chat**: 5MB (text and context)

### CORS Configuration
- **Origins**: Configurable (default: all origins for development)
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Accept, Authorization, Content-Type
- **Credentials**: Enabled
- **Max Age**: 3600 seconds

### JWT Authentication
- **Algorithm**: HS256
- **Claims Verified**: exp (expiration)
- **Token Location**: Authorization header (Bearer token)
- **Excluded Routes**: Registration, login, public endpoints

## Setup and Deployment

### Prerequisites
- Docker and Docker Compose
- PostgreSQL (for Kong database)

### Installation Steps

1. **Start Infrastructure Services**
   ```bash
   cd backend
   docker-compose -f docker-compose.infrastructure.yml up -d kong-database
   ```

2. **Run Kong Migrations**
   ```bash
   docker-compose -f docker-compose.infrastructure.yml up kong-migration
   ```

3. **Start Kong Gateway**
   ```bash
   docker-compose -f docker-compose.infrastructure.yml up -d kong
   ```

4. **Apply Configuration**
   ```bash
   docker-compose -f docker-compose.infrastructure.yml --profile sync up deck
   ```

### Verify Installation

1. **Check Kong Health**
   ```bash
   curl http://localhost:8001/status
   ```

2. **List Services**
   ```bash
   curl http://localhost:8001/services
   ```

3. **List Routes**
   ```bash
   curl http://localhost:8001/routes
   ```

4. **Test a Route**
   ```bash
   curl http://localhost:8000/health
   ```

## Configuration Management

### Using Deck (Declarative Configuration)

The `kong.yml` file contains the complete declarative configuration. To apply changes:

```bash
# Validate configuration
docker run --rm -v $(pwd)/api_gateway:/kong kong/deck validate --state /kong/kong.yml

# Sync configuration to Kong
docker-compose -f docker-compose.infrastructure.yml --profile sync up deck

# Or manually with deck
docker run --rm --network agrobridge-network -v $(pwd)/api_gateway:/kong kong/deck sync \
  --kong-addr http://kong:8001 \
  --state /kong/kong.yml
```

### Using Kong Admin API

Alternatively, configure Kong via the Admin API:

```bash
# Add a service
curl -i -X POST http://localhost:8001/services \
  --data name=my-service \
  --data url=http://my-service:8000

# Add a route
curl -i -X POST http://localhost:8001/services/my-service/routes \
  --data paths[]=/api/v1/my-service \
  --data methods[]=GET \
  --data methods[]=POST

# Add rate limiting plugin
curl -i -X POST http://localhost:8001/routes/{route-id}/plugins \
  --data name=rate-limiting \
  --data config.minute=100 \
  --data config.hour=2000
```

## Monitoring and Logging

### Access Logs
Kong logs all requests to stdout:
```bash
docker logs agrobridge-kong -f
```

### Admin API Endpoints
- **Status**: `GET http://localhost:8001/status`
- **Services**: `GET http://localhost:8001/services`
- **Routes**: `GET http://localhost:8001/routes`
- **Plugins**: `GET http://localhost:8001/plugins`
- **Consumers**: `GET http://localhost:8001/consumers`

### Metrics
Kong exposes metrics at:
- **Prometheus**: `GET http://localhost:8001/metrics`

## Troubleshooting

### Common Issues

1. **Kong won't start**
   - Check database connection
   - Verify migrations completed
   - Check logs: `docker logs agrobridge-kong`

2. **Routes not working**
   - Verify service is running
   - Check route configuration
   - Test service directly (bypass Kong)

3. **Rate limiting not working**
   - Check plugin configuration
   - Verify policy is set to 'local' or 'redis'
   - Check Redis connection if using Redis policy

4. **JWT authentication failing**
   - Verify token format (Bearer token)
   - Check token expiration
   - Verify JWT secret matches

### Debug Mode

Enable debug logging:
```bash
docker-compose -f docker-compose.infrastructure.yml up kong -e KONG_LOG_LEVEL=debug
```

## Performance Tuning

### Connection Timeouts
- **Connect Timeout**: 5000ms (10000ms for AI/ML services)
- **Write Timeout**: 60000ms (120000ms for AI/ML services)
- **Read Timeout**: 60000ms (120000ms for AI/ML services)

### Retries
- **Retry Count**: 3 attempts
- **Retry Conditions**: Connection errors, timeouts

### Load Balancing
Kong automatically load balances across multiple service instances using round-robin algorithm.

## Security Best Practices

1. **Use HTTPS in Production**
   - Configure SSL certificates
   - Redirect HTTP to HTTPS
   - Enable HSTS

2. **Restrict Admin API Access**
   - Use IP whitelisting
   - Enable authentication
   - Use separate network

3. **Rotate Secrets Regularly**
   - JWT secrets
   - Database passwords
   - API keys

4. **Monitor Rate Limits**
   - Track rate limit violations
   - Adjust limits based on usage
   - Alert on suspicious patterns

5. **Keep Kong Updated**
   - Regular security updates
   - Test updates in staging
   - Monitor changelog

## Environment Variables

Configure Kong using these environment variables in `.env`:

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

## API Documentation

For detailed API documentation, see:
- [Authentication API](../docs/api/authentication.md)
- [User API](../docs/api/users.md)
- [Farm API](../docs/api/farms.md)
- [Marketplace API](../docs/api/marketplace.md)

## Support

For issues or questions:
- Check logs: `docker logs agrobridge-kong`
- Review Kong documentation: https://docs.konghq.com/
- Open an issue in the project repository

## License

Copyright © 2025 AgroBridge. All rights reserved.
