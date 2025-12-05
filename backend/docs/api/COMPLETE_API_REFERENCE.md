# Complete API Reference

## Overview

This document provides a comprehensive reference for all AgroBridge API endpoints across all microservices.

## Table of Contents

1. [Authentication Service](#authentication-service)
2. [User Service](#user-service)
3. [Farm Management Service](#farm-management-service)
4. [Marketplace Service](#marketplace-service)
5. [AI Assistant Service](#ai-assistant-service)
6. [Crop Detection Service](#crop-detection-service)
7. [IoT Service](#iot-service)
8. [Notification Service](#notification-service)
9. [Financial Service](#financial-service)
10. [Learning Service](#learning-service)
11. [Community Service](#community-service)
12. [Scheduling Service](#scheduling-service)
13. [Analytics Service](#analytics-service)
14. [Payment Service](#payment-service)
15. [Blockchain Service](#blockchain-service)
16. [Export Documentation Service](#export-documentation-service)
17. [Emergency Response Service](#emergency-response-service)
18. [Admin Service](#admin-service)

## Base URLs

```
Production: https://api.agrobridge.com/v1
Staging: https://staging-api.agrobridge.com/v1
Development: http://localhost:8000/api/v1
```

## Authentication

All endpoints (except public ones) require JWT authentication:

```http
Authorization: Bearer <access_token>
```

## Common Response Formats

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
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {...}
  }
}
```

### Paginated Response
```json
{
  "count": 100,
  "next": "https://api.agrobridge.com/v1/resource/?page=2",
  "previous": null,
  "results": [...]
}
```

## Authentication Service

Base path: `/api/v1/auth`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/verify-email` | Verify email address | No |
| POST | `/login` | User login | No |
| POST | `/refresh` | Refresh access token | No |
| POST | `/logout` | User logout | Yes |
| POST | `/password-reset/request` | Request password reset | No |
| POST | `/password-reset/confirm` | Confirm password reset | No |
| POST | `/password-change` | Change password | Yes |
| GET | `/me` | Get current user | Yes |

See [Authentication API Documentation](./authentication.md) for detailed information.

## User Service

Base path: `/api/v1/users`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| PATCH | `/profile` | Partial update profile | Yes |
| POST | `/profile/avatar` | Upload avatar | Yes |
| GET | `/preferences` | Get user preferences | Yes |
| PUT | `/preferences` | Update preferences | Yes |
| GET | `/search` | Search users | Yes |
| GET | `/export-data` | Export user data (GDPR) | Yes |
| POST | `/delete-account` | Request account deletion | Yes |

## Farm Management Service

Base path: `/api/v1/farms`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List farms | Yes |
| POST | `/` | Create farm | Yes |
| GET | `/{id}` | Get farm details | Yes |
| PUT | `/{id}` | Update farm | Yes |
| DELETE | `/{id}` | Delete farm | Yes |
| GET | `/{id}/statistics` | Get farm statistics | Yes |
| GET | `/{id}/fields` | List farm fields | Yes |
| POST | `/{id}/fields` | Create field | Yes |
| GET | `/fields/{id}` | Get field details | Yes |
| PUT | `/fields/{id}` | Update field | Yes |
| DELETE | `/fields/{id}` | Delete field | Yes |
| GET | `/{id}/crops` | List crops | Yes |
| POST | `/{id}/crops` | Plant crop | Yes |
| GET | `/crops/{id}` | Get crop details | Yes |
| PUT | `/crops/{id}` | Update crop | Yes |
| DELETE | `/crops/{id}` | Remove crop | Yes |

## Marketplace Service

Base path: `/api/v1/marketplace`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | List products | No |
| POST | `/products` | Create product listing | Yes |
| GET | `/products/{id}` | Get product details | No |
| PUT | `/products/{id}` | Update product | Yes |
| DELETE | `/products/{id}` | Delete product | Yes |
| POST | `/products/{id}/activate` | Activate product | Yes |
| POST | `/products/{id}/deactivate` | Deactivate product | Yes |
| GET | `/orders` | List orders | Yes |
| POST | `/orders` | Create order | Yes |
| GET | `/orders/{id}` | Get order details | Yes |
| PUT | `/orders/{id}/status` | Update order status | Yes |
| POST | `/orders/{id}/cancel` | Cancel order | Yes |
| GET | `/products/{id}/reviews` | List product reviews | No |
| POST | `/products/{id}/reviews` | Create review | Yes |
| GET | `/analytics/trending` | Get trending products | No |
| GET | `/analytics/price-trends` | Get price trends | Yes |

## AI Assistant Service

Base path: `/api/v1/ai`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/chat` | Send chat message | Yes |
| GET | `/conversations` | List conversations | Yes |
| GET | `/conversations/{id}` | Get conversation | Yes |
| DELETE | `/conversations/{id}` | Delete conversation | Yes |
| POST | `/voice/transcribe` | Transcribe voice | Yes |
| POST | `/voice/synthesize` | Text to speech | Yes |
| POST | `/recommendations` | Get AI recommendations | Yes |

## Crop Detection Service

Base path: `/api/v1/crop-detection`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/detect` | Detect crop disease | Yes |
| POST | `/batch-detect` | Batch disease detection | Yes |
| GET | `/history` | Get detection history | Yes |
| GET | `/history/{id}` | Get detection details | Yes |
| GET | `/diseases` | List known diseases | No |
| GET | `/diseases/{id}` | Get disease info | No |
| GET | `/treatments/{disease_id}` | Get treatments | No |

## IoT Service

Base path: `/api/v1/iot`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/devices` | List devices | Yes |
| POST | `/devices` | Register device | Yes |
| GET | `/devices/{id}` | Get device details | Yes |
| PUT | `/devices/{id}` | Update device | Yes |
| DELETE | `/devices/{id}` | Delete device | Yes |
| POST | `/devices/{id}/data` | Submit sensor data | Device Auth |
| GET | `/devices/{id}/data` | Get sensor data | Yes |
| GET | `/devices/{id}/alerts` | Get device alerts | Yes |
| POST | `/devices/{id}/firmware` | Update firmware | Yes |
| WS | `/ws/devices/{id}` | Real-time data stream | Yes |

## Notification Service

Base path: `/api/v1/notifications`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List notifications | Yes |
| GET | `/{id}` | Get notification | Yes |
| PUT | `/{id}/read` | Mark as read | Yes |
| PUT | `/mark-all-read` | Mark all as read | Yes |
| DELETE | `/{id}` | Delete notification | Yes |
| GET | `/preferences` | Get notification preferences | Yes |
| PUT | `/preferences` | Update preferences | Yes |
| POST | `/devices/register` | Register push device | Yes |
| WS | `/ws/notifications` | Real-time notifications | Yes |

## Financial Service

Base path: `/api/v1/financial`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/records` | List financial records | Yes |
| POST | `/records` | Create record | Yes |
| GET | `/records/{id}` | Get record details | Yes |
| PUT | `/records/{id}` | Update record | Yes |
| DELETE | `/records/{id}` | Delete record | Yes |
| GET | `/budgets` | List budgets | Yes |
| POST | `/budgets` | Create budget | Yes |
| GET | `/budgets/{id}` | Get budget details | Yes |
| PUT | `/budgets/{id}` | Update budget | Yes |
| GET | `/reports/profit-loss` | Profit/loss report | Yes |
| GET | `/reports/cash-flow` | Cash flow report | Yes |
| GET | `/reports/expenses` | Expense breakdown | Yes |
| POST | `/export` | Export financial data | Yes |

## Learning Service

Base path: `/api/v1/learning`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/courses` | List courses | No |
| GET | `/courses/{id}` | Get course details | No |
| POST | `/courses/{id}/enroll` | Enroll in course | Yes |
| GET | `/enrollments` | List enrollments | Yes |
| GET | `/courses/{id}/lessons` | List lessons | Yes |
| GET | `/lessons/{id}` | Get lesson content | Yes |
| POST | `/lessons/{id}/complete` | Mark lesson complete | Yes |
| GET | `/progress` | Get learning progress | Yes |
| POST | `/quizzes/{id}/submit` | Submit quiz | Yes |
| GET | `/certificates` | List certificates | Yes |
| GET | `/certificates/{id}` | Get certificate | Yes |
| GET | `/recommendations` | Get course recommendations | Yes |
| GET | `/forum/questions` | List questions | No |
| POST | `/forum/questions` | Post question | Yes |
| POST | `/forum/questions/{id}/answers` | Answer question | Yes |

## Community Service

Base path: `/api/v1/community`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/posts` | List posts | Yes |
| POST | `/posts` | Create post | Yes |
| GET | `/posts/{id}` | Get post details | Yes |
| PUT | `/posts/{id}` | Update post | Yes |
| DELETE | `/posts/{id}` | Delete post | Yes |
| POST | `/posts/{id}/like` | Like post | Yes |
| POST | `/posts/{id}/comments` | Comment on post | Yes |
| GET | `/posts/{id}/comments` | List comments | Yes |
| POST | `/users/{id}/follow` | Follow user | Yes |
| POST | `/users/{id}/unfollow` | Unfollow user | Yes |
| GET | `/feed` | Get personalized feed | Yes |
| GET | `/messages` | List conversations | Yes |
| POST | `/messages` | Send message | Yes |
| GET | `/messages/{id}` | Get conversation | Yes |
| POST | `/posts/{id}/report` | Report post | Yes |

## Scheduling Service

Base path: `/api/v1/scheduling`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/tasks` | List tasks | Yes |
| POST | `/tasks` | Create task | Yes |
| GET | `/tasks/{id}` | Get task details | Yes |
| PUT | `/tasks/{id}` | Update task | Yes |
| DELETE | `/tasks/{id}` | Delete task | Yes |
| POST | `/tasks/{id}/complete` | Mark task complete | Yes |
| GET | `/calendar` | Get calendar view | Yes |
| GET | `/upcoming` | Get upcoming tasks | Yes |
| POST | `/tasks/{id}/snooze` | Snooze task | Yes |
| GET | `/suggestions` | Get task suggestions | Yes |

## Analytics Service

Base path: `/api/v1/analytics`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard` | Get dashboard metrics | Yes |
| GET | `/farm-performance` | Farm performance metrics | Yes |
| GET | `/yield-predictions` | Yield predictions | Yes |
| GET | `/weather-forecast` | Weather forecast | Yes |
| GET | `/market-prices` | Market price trends | Yes |
| GET | `/reports/custom` | Generate custom report | Yes |
| POST | `/reports/schedule` | Schedule report | Yes |

## Payment Service

Base path: `/api/v1/payment`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/initialize` | Initialize payment | Yes |
| POST | `/verify` | Verify payment | Yes |
| GET | `/transactions` | List transactions | Yes |
| GET | `/transactions/{id}` | Get transaction details | Yes |
| POST | `/refund` | Request refund | Yes |
| GET | `/methods` | List payment methods | Yes |
| POST | `/methods` | Add payment method | Yes |
| DELETE | `/methods/{id}` | Remove payment method | Yes |
| GET | `/balance` | Get wallet balance | Yes |
| POST | `/withdraw` | Withdraw funds | Yes |

## Blockchain Service

Base path: `/api/v1/blockchain`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/certificates` | Issue certificate | Yes |
| GET | `/certificates/{id}` | Get certificate | No |
| POST | `/certificates/{id}/verify` | Verify certificate | No |
| POST | `/supply-chain/record` | Record supply chain event | Yes |
| GET | `/supply-chain/{product_id}` | Get supply chain history | No |
| GET | `/transactions` | List blockchain transactions | Yes |

## Export Documentation Service

Base path: `/api/v1/export-docs`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/generate` | Generate export document | Yes |
| GET | `/documents` | List documents | Yes |
| GET | `/documents/{id}` | Get document | Yes |
| GET | `/documents/{id}/download` | Download document | Yes |
| GET | `/templates` | List document templates | Yes |
| POST | `/verify` | Verify document | No |

## Emergency Response Service

Base path: `/api/v1/emergency`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/alerts` | Create emergency alert | Yes |
| GET | `/alerts` | List alerts | Yes |
| GET | `/alerts/{id}` | Get alert details | Yes |
| PUT | `/alerts/{id}/status` | Update alert status | Yes |
| POST | `/incidents` | Report incident | Yes |
| GET | `/incidents` | List incidents | Yes |
| GET | `/incidents/{id}` | Get incident details | Yes |
| POST | `/incidents/{id}/respond` | Respond to incident | Yes |
| GET | `/resources` | List emergency resources | Yes |

## Admin Service

Base path: `/api/v1/admin`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | List all users | Admin |
| GET | `/users/{id}` | Get user details | Admin |
| PUT | `/users/{id}` | Update user | Admin |
| POST | `/users/{id}/suspend` | Suspend user | Admin |
| POST | `/users/{id}/activate` | Activate user | Admin |
| GET | `/system/health` | System health check | Admin |
| GET | `/system/metrics` | System metrics | Admin |
| GET | `/logs` | View system logs | Admin |
| GET | `/audit-trail` | View audit trail | Admin |
| POST | `/content/moderate` | Moderate content | Admin |

## Rate Limiting

All endpoints are rate-limited based on user tier:

| Tier | Requests/Hour | Burst |
|------|---------------|-------|
| Free | 100 | 10 |
| Basic | 1,000 | 50 |
| Premium | 10,000 | 200 |
| Enterprise | Unlimited | Unlimited |

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Error Codes

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_001` | 401 | Invalid credentials |
| `AUTH_002` | 401 | Email not verified |
| `AUTH_003` | 401 | Token expired |
| `AUTH_004` | 401 | Invalid token |
| `AUTH_009` | 403 | Insufficient permissions |
| `VAL_001` | 400 | Validation error |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT` | 429 | Rate limit exceeded |
| `SERVER_ERROR` | 500 | Internal server error |

## Webhooks

Subscribe to events via webhooks. Configure webhook URLs in your account settings.

### Available Events

- `user.created`
- `user.updated`
- `order.created`
- `order.completed`
- `order.cancelled`
- `payment.succeeded`
- `payment.failed`
- `alert.created`
- `device.offline`
- `task.due`

### Webhook Payload

```json
{
  "event": "order.created",
  "timestamp": "2025-12-05T10:30:00Z",
  "data": {
    "id": "order-id",
    "...": "..."
  },
  "signature": "hmac-sha256-signature"
}
```

### Webhook Security

Verify webhook signatures using your webhook secret:

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

## SDKs

### Python SDK

```bash
pip install agrobridge-sdk
```

```python
from agrobridge import AgroBridge

client = AgroBridge(api_key="your-api-key")

# List farms
farms = client.farms.list()

# Create farm
farm = client.farms.create(
    name="My Farm",
    location={"lat": 5.6037, "lng": -0.1870},
    area=10.5
)
```

### JavaScript SDK

```bash
npm install @agrobridge/sdk
```

```javascript
import AgroBridge from '@agrobridge/sdk';

const client = new AgroBridge({ apiKey: 'your-api-key' });

// List farms
const farms = await client.farms.list();

// Create farm
const farm = await client.farms.create({
  name: 'My Farm',
  location: { lat: 5.6037, lng: -0.1870 },
  area: 10.5
});
```

## Support

- **API Status**: https://status.agrobridge.com
- **Documentation**: https://docs.agrobridge.com
- **Support Email**: api-support@agrobridge.com
- **Developer Forum**: https://forum.agrobridge.com

## Changelog

See [API Changelog](./CHANGELOG.md) for version history and breaking changes.
