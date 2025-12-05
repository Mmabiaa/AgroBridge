# OpenAPI Documentation Guide

## Overview

AgroBridge provides comprehensive API documentation using OpenAPI 3.0 specification with interactive Swagger UI and ReDoc interfaces.

## Accessing API Documentation

### Interactive Swagger UI
```
Development: http://localhost:8000/api/docs/
Staging: https://staging-api.agrobridge.com/api/docs/
Production: https://api.agrobridge.com/api/docs/
```

### ReDoc Documentation
```
Development: http://localhost:8000/api/redoc/
Staging: https://staging-api.agrobridge.com/api/redoc/
Production: https://api.agrobridge.com/api/redoc/
```

### OpenAPI JSON Schema
```
Development: http://localhost:8000/api/docs/?format=openapi
```

## Authentication in Swagger UI

### Step 1: Obtain Access Token

1. Navigate to the Authentication section
2. Use the `/api/v1/auth/login/` endpoint
3. Provide credentials:
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```
4. Copy the `access` token from the response

### Step 2: Authorize

1. Click the "Authorize" button at the top of Swagger UI
2. Enter: `Bearer <your_access_token>`
3. Click "Authorize"
4. All subsequent requests will include the token

## Code Examples

### Python

#### Using requests library
```python
import requests

# Base URL
BASE_URL = "https://api.agrobridge.com/api/v1"

# Login
response = requests.post(
    f"{BASE_URL}/auth/login/",
    json={
        "email": "farmer@example.com",
        "password": "secure_password"
    }
)
tokens = response.json()
access_token = tokens['access']

# Make authenticated request
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# Get user profile
profile = requests.get(
    f"{BASE_URL}/users/profile/",
    headers=headers
)
print(profile.json())

# Create a farm
farm_data = {
    "name": "Green Valley Farm",
    "location": {
        "type": "Point",
        "coordinates": [-1.2921, 36.8219]
    },
    "size": 50.5,
    "size_unit": "hectares"
}

farm = requests.post(
    f"{BASE_URL}/farms/",
    headers=headers,
    json=farm_data
)
print(farm.json())
```

### JavaScript/TypeScript

#### Using fetch API
```javascript
const BASE_URL = 'https://api.agrobridge.com/api/v1';

// Login
async function login(email, password) {
  const response = await fetch(`${BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  return data.access;
}

// Make authenticated request
async function getProfile(token) {
  const response = await fetch(`${BASE_URL}/users/profile/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
}

// Create a farm
async function createFarm(token, farmData) {
  const response = await fetch(`${BASE_URL}/farms/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(farmData),
  });
  
  return await response.json();
}

// Usage
(async () => {
  const token = await login('farmer@example.com', 'secure_password');
  const profile = await getProfile(token);
  console.log(profile);
  
  const farm = await createFarm(token, {
    name: 'Green Valley Farm',
    location: {
      type: 'Point',
      coordinates: [-1.2921, 36.8219]
    },
    size: 50.5,
    size_unit: 'hectares'
  });
  console.log(farm);
})();
```

#### Using axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.agrobridge.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
async function login(email, password) {
  const { data } = await api.post('/auth/login/', { email, password });
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  return data;
}

// Refresh token
async function refreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  const { data } = await api.post('/auth/token/refresh/', { refresh });
  localStorage.setItem('access_token', data.access);
  return data;
}

// Get farms
async function getFarms() {
  const { data } = await api.get('/farms/');
  return data;
}

// Create product listing
async function createProduct(productData) {
  const { data } = await api.post('/marketplace/products/', productData);
  return data;
}
```

### cURL

#### Login
```bash
curl -X POST https://api.agrobridge.com/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "secure_password"
  }'
```

#### Get Profile
```bash
curl -X GET https://api.agrobridge.com/api/v1/users/profile/ \
  -H "Authorization: Bearer <your_access_token>"
```

#### Create Farm
```bash
curl -X POST https://api.agrobridge.com/api/v1/farms/ \
  -H "Authorization: Bearer <your_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Green Valley Farm",
    "location": {
      "type": "Point",
      "coordinates": [-1.2921, 36.8219]
    },
    "size": 50.5,
    "size_unit": "hectares"
  }'
```

#### Upload Image for Crop Detection
```bash
curl -X POST https://api.agrobridge.com/api/v1/crop-detection/detect/ \
  -H "Authorization: Bearer <your_access_token>" \
  -F "image=@/path/to/crop_image.jpg"
```

### Mobile (React Native)

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://api.agrobridge.com/api/v1';

class AgroBridgeAPI {
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    await AsyncStorage.setItem('access_token', data.access);
    await AsyncStorage.setItem('refresh_token', data.refresh);
    return data;
  }
  
  async getAuthHeaders() {
    const token = await AsyncStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
  
  async getFarms() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/farms/`, { headers });
    return await response.json();
  }
  
  async uploadCropImage(imageUri) {
    const headers = await this.getAuthHeaders();
    delete headers['Content-Type']; // Let browser set it for FormData
    
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'crop.jpg',
    });
    
    const response = await fetch(
      `${API_BASE_URL}/crop-detection/detect/`,
      {
        method: 'POST',
        headers,
        body: formData,
      }
    );
    
    return await response.json();
  }
}

export default new AgroBridgeAPI();
```

## Common Workflows

### 1. User Registration and Authentication

```python
# 1. Register
response = requests.post(f"{BASE_URL}/auth/register/", json={
    "email": "newfarmer@example.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+254712345678",
    "role": "farmer"
})

# 2. Verify email (check email for verification link)
# User clicks link or you can call:
verification_token = "token_from_email"
requests.post(f"{BASE_URL}/auth/verify-email/", json={
    "token": verification_token
})

# 3. Login
response = requests.post(f"{BASE_URL}/auth/login/", json={
    "email": "newfarmer@example.com",
    "password": "SecurePass123!"
})
tokens = response.json()

# 4. Use access token
headers = {"Authorization": f"Bearer {tokens['access']}"}
```

### 2. Farm Management

```python
# Create farm
farm = requests.post(f"{BASE_URL}/farms/", headers=headers, json={
    "name": "Sunrise Farm",
    "location": {"type": "Point", "coordinates": [-1.2921, 36.8219]},
    "size": 25.5,
    "size_unit": "hectares"
}).json()

farm_id = farm['id']

# Add field to farm
field = requests.post(f"{BASE_URL}/farms/{farm_id}/fields/", headers=headers, json={
    "name": "North Field",
    "boundary": {
        "type": "Polygon",
        "coordinates": [[
            [-1.2921, 36.8219],
            [-1.2920, 36.8219],
            [-1.2920, 36.8220],
            [-1.2921, 36.8220],
            [-1.2921, 36.8219]
        ]]
    },
    "size": 5.0,
    "size_unit": "hectares"
}).json()

# Plant crop
crop = requests.post(f"{BASE_URL}/farms/{farm_id}/crops/", headers=headers, json={
    "field": field['id'],
    "crop_type": "maize",
    "variety": "Hybrid 614",
    "planting_date": "2024-03-15",
    "expected_harvest_date": "2024-07-15",
    "quantity": 1000,
    "quantity_unit": "kg"
}).json()
```

### 3. Marketplace Operations

```python
# List a product
product = requests.post(f"{BASE_URL}/marketplace/products/", headers=headers, json={
    "name": "Fresh Tomatoes",
    "description": "Organic tomatoes from my farm",
    "category": "vegetables",
    "price": 150.00,
    "currency": "KES",
    "quantity": 500,
    "unit": "kg",
    "location": {"type": "Point", "coordinates": [-1.2921, 36.8219]}
}).json()

# Search products
products = requests.get(
    f"{BASE_URL}/marketplace/products/",
    headers=headers,
    params={
        "category": "vegetables",
        "min_price": 100,
        "max_price": 200,
        "location": "-1.2921,36.8219",
        "radius": 50  # km
    }
).json()

# Place order
order = requests.post(f"{BASE_URL}/marketplace/orders/", headers=headers, json={
    "product": product['id'],
    "quantity": 50,
    "delivery_address": "123 Farm Road, Nairobi"
}).json()
```

### 4. AI Assistant

```python
# Start conversation
conversation = requests.post(f"{BASE_URL}/ai/conversations/", headers=headers, json={
    "title": "Pest Control Advice"
}).json()

# Send message
message = requests.post(
    f"{BASE_URL}/ai/conversations/{conversation['id']}/messages/",
    headers=headers,
    json={
        "content": "What's the best way to control aphids on tomatoes?"
    }
).json()

# Get AI response
response = message['ai_response']
print(response['content'])
```

### 5. Crop Disease Detection

```python
# Upload image for detection
with open('crop_image.jpg', 'rb') as img:
    files = {'image': img}
    detection = requests.post(
        f"{BASE_URL}/crop-detection/detect/",
        headers={"Authorization": f"Bearer {tokens['access']}"},
        files=files
    ).json()

# Check results
if detection['diseases_detected']:
    for disease in detection['diseases']:
        print(f"Disease: {disease['name']}")
        print(f"Confidence: {disease['confidence']}%")
        print(f"Treatment: {disease['treatment']}")
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["This field is required"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | No authentication token provided |
| `INVALID_TOKEN` | 401 | Token is invalid or expired |
| `PERMISSION_DENIED` | 403 | User lacks required permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

### Error Handling Example

```python
try:
    response = requests.get(f"{BASE_URL}/farms/", headers=headers)
    response.raise_for_status()
    farms = response.json()
except requests.exceptions.HTTPError as e:
    if e.response.status_code == 401:
        # Token expired, refresh it
        refresh_response = requests.post(
            f"{BASE_URL}/auth/token/refresh/",
            json={"refresh": refresh_token}
        )
        new_token = refresh_response.json()['access']
        headers['Authorization'] = f"Bearer {new_token}"
        # Retry request
        response = requests.get(f"{BASE_URL}/farms/", headers=headers)
        farms = response.json()
    else:
        print(f"Error: {e.response.json()}")
```

## Rate Limiting

### Headers
Every response includes rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

### Handling Rate Limits

```python
import time

def make_request_with_retry(url, headers, max_retries=3):
    for attempt in range(max_retries):
        response = requests.get(url, headers=headers)
        
        if response.status_code == 429:
            # Rate limited
            reset_time = int(response.headers.get('X-RateLimit-Reset', 0))
            wait_time = reset_time - time.time()
            if wait_time > 0:
                print(f"Rate limited. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
                continue
        
        return response
    
    raise Exception("Max retries exceeded")
```

## Pagination

### Request
```python
response = requests.get(
    f"{BASE_URL}/marketplace/products/",
    headers=headers,
    params={
        "page": 1,
        "page_size": 20
    }
)
```

### Response
```json
{
  "count": 150,
  "next": "https://api.agrobridge.com/api/v1/marketplace/products/?page=2",
  "previous": null,
  "results": [...]
}
```

## WebSocket Connections

### Real-time Notifications

```javascript
const ws = new WebSocket(
  `wss://api.agrobridge.com/ws/notifications/?token=${accessToken}`
);

ws.onopen = () => {
  console.log('Connected to notifications');
};

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('New notification:', notification);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from notifications');
};
```

## Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (never in localStorage for sensitive apps)
3. **Implement token refresh** before expiration
4. **Handle errors gracefully** with proper user feedback
5. **Respect rate limits** and implement backoff strategies
6. **Validate input** on client side before sending
7. **Use pagination** for large datasets
8. **Implement request timeouts**
9. **Log API errors** for debugging
10. **Keep API client libraries updated**

## SDK Libraries

### Official SDKs (Coming Soon)
- Python SDK: `pip install agrobridge-sdk`
- JavaScript SDK: `npm install @agrobridge/sdk`
- Mobile SDK: React Native, Flutter

### Community SDKs
Check our GitHub organization for community-maintained SDKs.

## Support

- **Documentation**: https://docs.agrobridge.com
- **API Status**: https://status.agrobridge.com
- **Support Email**: api-support@agrobridge.com
- **Developer Forum**: https://forum.agrobridge.com
- **GitHub Issues**: https://github.com/agrobridge/api/issues

## Changelog

See [API_CHANGELOG.md](./API_CHANGELOG.md) for version history and breaking changes.
