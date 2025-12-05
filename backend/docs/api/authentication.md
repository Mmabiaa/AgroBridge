# Authentication Service API

## Overview

The Authentication Service handles user registration, login, token management, and role-based access control.

## Base Path

```
/api/v1/auth
```

## Endpoints

### Register User

Create a new user account.

```http
POST /auth/register
```

**Request Body:**

```json
{
  "email": "farmer@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "farmer",
  "phone": "+233501234567"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "user_id": "uuid-here",
    "email": "farmer@example.com",
    "verification_sent": true
  },
  "message": "Registration successful. Please verify your email."
}
```

**Roles:**
- `farmer`: Farm owner/operator
- `buyer`: Product buyer/trader
- `ngo`: NGO representative
- `government`: Government official
- `admin`: Platform administrator

### Verify Email

Verify user email address.

```http
POST /auth/verify-email
```

**Request Body:**

```json
{
  "token": "verification-token-here"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Login

Authenticate user and receive tokens.

```http
POST /auth/login
```

**Request Body:**

```json
{
  "email": "farmer@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": "uuid-here",
      "email": "farmer@example.com",
      "role": "farmer",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

### Refresh Token

Get new access token using refresh token.

```http
POST /auth/refresh
```

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 900
  }
}
```

### Logout

Invalidate refresh token.

```http
POST /auth/logout
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Request Password Reset

Request password reset email.

```http
POST /auth/password-reset/request
```

**Request Body:**

```json
{
  "email": "farmer@example.com"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Reset Password

Reset password using token.

```http
POST /auth/password-reset/confirm
```

**Request Body:**

```json
{
  "token": "reset-token-here",
  "password": "NewSecurePass123!",
  "password_confirm": "NewSecurePass123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### Change Password

Change password for authenticated user.

```http
POST /auth/password-change
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "old_password": "OldPass123!",
  "new_password": "NewPass123!",
  "new_password_confirm": "NewPass123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Get Current User

Get authenticated user information.

```http
GET /auth/me
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "email": "farmer@example.com",
    "role": "farmer",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+233501234567",
    "email_verified": true,
    "created_at": "2025-01-01T00:00:00Z",
    "permissions": ["farm:read", "farm:write", "product:read"]
  }
}
```

## Authentication

All endpoints except `/register`, `/login`, `/verify-email`, and `/password-reset/*` require authentication.

**Header Format:**
```
Authorization: Bearer <access_token>
```

## Permissions

### Role-Based Permissions

**Farmer:**
- Manage own farms
- Create product listings
- Access marketplace
- Use AI assistant

**Buyer:**
- Browse marketplace
- Place orders
- View analytics

**NGO:**
- View farmer data (with consent)
- Access analytics
- Manage programs

**Government:**
- View aggregated data
- Access reports
- Manage regulations

**Admin:**
- Full platform access
- User management
- System configuration

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid credentials |
| `AUTH_002` | Email not verified |
| `AUTH_003` | Token expired |
| `AUTH_004` | Invalid token |
| `AUTH_005` | User not found |
| `AUTH_006` | Email already exists |
| `AUTH_007` | Weak password |
| `AUTH_008` | Too many login attempts |
| `AUTH_009` | Insufficient permissions |

## Security

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Security

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens are invalidated on logout
- Automatic token rotation on refresh

### Rate Limiting

- Login: 5 attempts per 15 minutes
- Registration: 3 attempts per hour
- Password reset: 3 attempts per hour

## Examples

### Python

```python
import requests

# Register
response = requests.post(
    'https://api.agrobridge.com/v1/auth/register',
    json={
        'email': 'farmer@example.com',
        'password': 'SecurePass123!',
        'password_confirm': 'SecurePass123!',
        'first_name': 'John',
        'last_name': 'Doe',
        'role': 'farmer'
    }
)

# Login
response = requests.post(
    'https://api.agrobridge.com/v1/auth/login',
    json={
        'email': 'farmer@example.com',
        'password': 'SecurePass123!'
    }
)
tokens = response.json()['data']

# Use token
headers = {'Authorization': f"Bearer {tokens['access_token']}"}
response = requests.get(
    'https://api.agrobridge.com/v1/auth/me',
    headers=headers
)
```

### JavaScript

```javascript
// Register
const response = await fetch('https://api.agrobridge.com/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'farmer@example.com',
    password: 'SecurePass123!',
    password_confirm: 'SecurePass123!',
    first_name: 'John',
    last_name: 'Doe',
    role: 'farmer'
  })
});

// Login
const loginResponse = await fetch('https://api.agrobridge.com/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'farmer@example.com',
    password: 'SecurePass123!'
  })
});
const { data } = await loginResponse.json();

// Use token
const userResponse = await fetch('https://api.agrobridge.com/v1/auth/me', {
  headers: { 'Authorization': `Bearer ${data.access_token}` }
});
```

### cURL

```bash
# Register
curl -X POST https://api.agrobridge.com/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "role": "farmer"
  }'

# Login
curl -X POST https://api.agrobridge.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "SecurePass123!"
  }'

# Use token
curl -X GET https://api.agrobridge.com/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```
