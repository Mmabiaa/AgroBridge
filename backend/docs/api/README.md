# AgroBridge API Documentation

## Overview

AgroBridge provides a comprehensive RESTful API for managing agricultural operations, marketplace transactions, IoT devices, and more. All APIs follow REST principles and return JSON responses.

## Base URL

```
Production: https://api.agrobridge.com/v1
Staging: https://staging-api.agrobridge.com/v1
Development: http://localhost:8000/api/v1
```

## Authentication

All API requests require authentication using JWT tokens.

### Getting Started

1. **Register**: Create an account via `/auth/register`
2. **Login**: Obtain access token via `/auth/login`
3. **Use Token**: Include in Authorization header: `Bearer <token>`

### Token Lifecycle

- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days
- **Refresh**: Use `/auth/refresh` to get new access token

## API Services

### Core Services

1. **[Authentication Service](./authentication.md)** - User authentication and authorization
2. **[User Service](./users.md)** - User profile and preferences management
3. **[Farm Management Service](./farms.md)** - Farm, field, and crop management
4. **[Marketplace Service](./marketplace.md)** - Product listings and orders
5. **[AI Assistant Service](./ai-assistant.md)** - AgriGPT chat and voice commands

### Advanced Services

6. **[Crop Detection Service](./crop-detection.md)** - Disease detection and recommendations
7. **[IoT Service](./iot.md)** - IoT device and sensor data management
8. **[Notification Service](./notifications.md)** - Multi-channel notifications
9. **[Financial Service](./financial.md)** - Financial records and budgeting
10. **[Learning Service](./learning.md)** - Courses and educational content

### Community & Collaboration

11. **[Community Service](./community.md)** - Social posts and messaging
12. **[Scheduling Service](./scheduling.md)** - Task and calendar management
13. **[Analytics Service](./analytics.md)** - Insights and predictions

### Specialized Services

14. **[Payment Service](./payment.md)** - Payment processing and escrow
15. **[Blockchain Service](./blockchain.md)** - Certificates and supply chain
16. **[Export Documentation Service](./export-docs.md)** - Export compliance documents
17. **[Emergency Response Service](./emergency.md)** - Alerts and incident reporting
18. **[File Storage Service](./storage.md)** - File upload and management

### Platform Services

19. **[Admin Service](./admin.md)** - Platform administration
20. **[Monitoring Service](./monitoring.md)** - System health and metrics

## Common Patterns

### Pagination

All list endpoints support pagination:

```json
{
  "count": 100,
  "next": "https://api.agrobridge.com/v1/farms/?page=2",
  "previous": null,
  "results": [...]
}
```

Query parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

### Filtering

Use query parameters for filtering:

```
GET /api/v1/products/?category=seeds&min_price=100&max_price=500
```

### Sorting

Use `ordering` parameter:

```
GET /api/v1/products/?ordering=-created_at
```

Use `-` prefix for descending order.

### Field Selection

Request specific fields only:

```
GET /api/v1/farms/?fields=id,name,location
```

### Search

Use `search` parameter:

```
GET /api/v1/products/?search=tomato
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["This field is required"]
    }
  }
}
```

### HTTP Status Codes

- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

API requests are rate-limited per user:

- **Free Tier**: 100 requests/hour
- **Basic Tier**: 1,000 requests/hour
- **Premium Tier**: 10,000 requests/hour
- **Enterprise**: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Webhooks

Subscribe to events via webhooks:

### Available Events

- `order.created`
- `order.completed`
- `payment.succeeded`
- `payment.failed`
- `alert.created`
- `device.offline`

### Webhook Payload

```json
{
  "event": "order.created",
  "timestamp": "2025-12-05T10:30:00Z",
  "data": {...}
}
```

## SDKs and Libraries

### Official SDKs

- **Python**: `pip install agrobridge-sdk`
- **JavaScript**: `npm install @agrobridge/sdk`
- **Mobile**: React Native SDK

### Code Examples

See [examples](./examples/) directory for:
- Python examples
- JavaScript examples
- cURL examples
- Postman collection

## Interactive Documentation

Access interactive API documentation:

- **Swagger UI**: https://api.agrobridge.com/docs
- **ReDoc**: https://api.agrobridge.com/redoc
- **OpenAPI Spec**: https://api.agrobridge.com/openapi.json

## Versioning

API versions are specified in the URL path:

- Current: `/v1/`
- Beta: `/v2-beta/`

### Deprecation Policy

- 6 months notice before deprecation
- 12 months support for deprecated versions
- Migration guides provided

## Support

- **API Status**: https://status.agrobridge.com
- **Developer Forum**: https://forum.agrobridge.com
- **Email**: api-support@agrobridge.com
- **Discord**: https://discord.gg/agrobridge

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for API changes and updates.

## Terms of Service

By using the AgroBridge API, you agree to our [Terms of Service](https://agrobridge.com/terms) and [Privacy Policy](https://agrobridge.com/privacy).
