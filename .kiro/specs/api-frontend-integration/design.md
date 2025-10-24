# API Frontend Integration Design Document

## Overview

This design document outlines the specific fixes needed for critical API and frontend integration issues in the AgroBridge platform. The focus is on resolving registration throttling problems, fixing marketplace navigation, integrating OpenAI API for AI conversations, and ensuring all frontend API calls match backend endpoints properly.

## Architecture

### Problem-Solution Architecture

```mermaid
graph TB
    subgraph "Current Issues"
        A[429 Registration Errors]
        B[Marketplace Navigation Fails]
        C[AI Assistant No OpenAI]
        D[Frontend API Mismatches]
    end
    
    subgraph "Solutions"
        E[Adjusted Rate Limiting]
        F[Fixed Marketplace Routes]
        G[OpenAI Integration]
        H[Endpoint Alignment]
    end
    
    subgraph "Implementation Areas"
        I[Django Settings]
        J[Frontend Routing]
        K[AI Assistant API]
        L[API Client Updates]
    end
    
    A --> E --> I
    B --> F --> J
    C --> G --> K
    D --> H --> L
```

### API Architecture Patterns

- **RESTful Design**: Following REST principles with proper HTTP methods and status codes
- **JWT Authentication**: Stateless authentication with access and refresh tokens
- **Pagination**: Cursor-based pagination for large datasets
- **Filtering & Sorting**: Query parameter-based filtering and sorting
- **API Versioning**: URL-based versioning (e.g., `/api/v1/`)
- **Rate Limiting**: Role-based rate limiting to prevent abuse

## Components and Interfaces

### 1. Rate Limiting Configuration Fix

#### Current Problem
```python
# Current settings.py - TOO RESTRICTIVE
'DEFAULT_THROTTLE_RATES': {
    'registration': '3/hour',  # Blocks legitimate users
    'login': '5/min',
    'user': '1000/hour',
}
```

#### Solution Design
```python
# Updated settings.py - BALANCED APPROACH
'DEFAULT_THROTTLE_RATES': {
    'anon': '200/hour',           # Increased for anonymous users
    'user': '2000/hour',          # Increased for authenticated users
    'login': '10/min',            # More login attempts allowed
    'registration': '10/hour',     # Reasonable registration limit
    'password_reset': '5/hour',    # Reasonable password reset limit
    'email_verification': '15/hour', # More verification attempts
    'user_actions': '500/hour',    # General user actions
}
```

#### Custom Throttling Classes
```python
class RegistrationThrottle(UserRateThrottle):
    scope = 'registration'
    
    def allow_request(self, request, view):
        # Allow more lenient throttling for legitimate users
        if request.user.is_authenticated:
            return True
        return super().allow_request(request, view)

class IntelligentThrottle(AnonRateThrottle):
    def get_cache_key(self, request, view):
        # Use IP + User-Agent for better identification
        ident = self.get_ident(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        return f"{self.cache_format % {'scope': self.scope, 'ident': ident}}_{hash(user_agent)}"
```

### 2. Marketplace Navigation Fix

#### Current Problem
Frontend routing fails when navigating to marketplace, likely due to:
- Missing or incorrect route definitions
- API endpoint mismatches
- Component loading errors

#### Solution Design

**Frontend Route Configuration**
```typescript
// src/routes/AppRoutes.tsx
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/farms/*" element={<FarmRoutes />} />
      <Route path="/marketplace/*" element={<MarketplaceRoutes />} />
      <Route path="/ai-assistant" element={<AIAssistant />} />
      <Route path="/crop-detection" element={<CropDetection />} />
    </Routes>
  );
};

// src/routes/MarketplaceRoutes.tsx
const MarketplaceRoutes = () => {
  return (
    <Routes>
      <Route index element={<MarketplaceHome />} />
      <Route path="products" element={<ProductList />} />
      <Route path="products/:id" element={<ProductDetail />} />
      <Route path="orders" element={<OrderHistory />} />
      <Route path="sell" element={<CreateProduct />} />
    </Routes>
  );
};
```

**API Endpoint Verification**
```typescript
// src/services/marketplaceApi.ts
export const marketplaceApi = {
  // Ensure these match backend URLs exactly
  getProducts: () => api.get('/api/v1/marketplace/products/'),
  getProduct: (id: string) => api.get(`/api/v1/marketplace/products/${id}/`),
  createProduct: (data: ProductData) => api.post('/api/v1/marketplace/products/', data),
  getOrders: () => api.get('/api/v1/marketplace/orders/'),
  createOrder: (data: OrderData) => api.post('/api/v1/marketplace/orders/', data),
};
```

### 3. OpenAI API Integration for AI Assistant

#### Current Problem
AI assistant endpoint `/api/v1/ai/conversations/` exists but doesn't use the OpenAI API key for actual AI responses.

#### Solution Design

**Backend OpenAI Integration**
```python
# ai_assistant/services.py
import openai
from django.conf import settings

class OpenAIService:
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY
    
    def generate_response(self, messages, user_context=None):
        try:
            # Prepare system message for agricultural context
            system_message = {
                "role": "system",
                "content": "You are AgriGPT, an AI assistant specialized in agriculture. Provide helpful, accurate advice about farming, crops, livestock, and agricultural practices."
            }
            
            # Add user context if available (farm data, location, etc.)
            if user_context:
                system_message["content"] += f" User context: {user_context}"
            
            # Prepare messages for OpenAI
            openai_messages = [system_message] + messages
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=openai_messages,
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            # Fallback response when OpenAI is unavailable
            return "I'm sorry, I'm having trouble connecting to my AI service right now. Please try again later."

# ai_assistant/views.py
class ConversationMessageCreateView(CreateAPIView):
    def create(self, request, *args, **kwargs):
        conversation_id = kwargs.get('conversation_id')
        user_message = request.data.get('content')
        
        # Save user message
        user_msg = ChatMessage.objects.create(
            conversation_id=conversation_id,
            role='user',
            content=user_message
        )
        
        # Get conversation history
        messages = ChatMessage.objects.filter(
            conversation_id=conversation_id
        ).order_by('timestamp')
        
        # Format for OpenAI
        openai_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
        
        # Generate AI response
        openai_service = OpenAIService()
        ai_response = openai_service.generate_response(
            openai_messages,
            user_context=self.get_user_context(request.user)
        )
        
        # Save AI response
        ai_msg = ChatMessage.objects.create(
            conversation_id=conversation_id,
            role='assistant',
            content=ai_response
        )
        
        return Response({
            'user_message': ChatMessageSerializer(user_msg).data,
            'ai_response': ChatMessageSerializer(ai_msg).data
        })
```

**Environment Configuration**
```python
# settings.py - Ensure OpenAI key is loaded
OPENAI_API_KEY = env('OPENAI_API_KEY')

# Add to requirements.txt
openai==0.28.1
```

### 4. Frontend-Backend Endpoint Alignment

#### Current Problem
Frontend API calls may not match backend endpoint patterns, causing 404 errors and functionality failures.

#### Solution Design

**API Client Standardization**
```typescript
// src/services/api.ts - Base API configuration
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh
      await refreshToken();
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

**Endpoint Mapping Verification**
```typescript
// src/services/endpoints.ts - Centralized endpoint definitions
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/v1/auth/login/',
    REGISTER: '/api/v1/auth/register/',
    REFRESH: '/api/v1/auth/refresh/',
    LOGOUT: '/api/v1/auth/logout/',
    ME: '/api/v1/auth/me/',
  },
  
  // Farms
  FARMS: {
    LIST: '/api/v1/farms/',
    DETAIL: (id: string) => `/api/v1/farms/${id}/`,
    CROPS: (id: string) => `/api/v1/farms/${id}/crops/`,
    LIVESTOCK: (id: string) => `/api/v1/farms/${id}/livestock/`,
  },
  
  // Marketplace
  MARKETPLACE: {
    PRODUCTS: '/api/v1/marketplace/products/',
    PRODUCT_DETAIL: (id: string) => `/api/v1/marketplace/products/${id}/`,
    ORDERS: '/api/v1/marketplace/orders/',
    ORDER_DETAIL: (id: string) => `/api/v1/marketplace/orders/${id}/`,
  },
  
  // AI Assistant
  AI: {
    CONVERSATIONS: '/api/v1/ai/conversations/',
    CONVERSATION_MESSAGES: (id: string) => `/api/v1/ai/conversations/${id}/messages/`,
    SEND_MESSAGE: (id: string) => `/api/v1/ai/conversations/${id}/messages/`,
  },
  
  // Crop Detection
  CROP_DETECTION: {
    ANALYZE: '/api/v1/crop-detection/analyze/',
    HISTORY: '/api/v1/crop-detection/history/',
    DISEASES: '/api/v1/crop-detection/diseases/',
  },
};
```

**Service Layer Implementation**
```typescript
// src/services/authService.ts
export const authService = {
  login: (credentials: LoginData) => 
    api.post(ENDPOINTS.AUTH.LOGIN, credentials),
  
  register: (userData: RegisterData) => 
    api.post(ENDPOINTS.AUTH.REGISTER, userData),
  
  refreshToken: (refreshToken: string) => 
    api.post(ENDPOINTS.AUTH.REFRESH, { refresh: refreshToken }),
  
  logout: () => 
    api.post(ENDPOINTS.AUTH.LOGOUT),
  
  getCurrentUser: () => 
    api.get(ENDPOINTS.AUTH.ME),
};

// src/services/marketplaceService.ts
export const marketplaceService = {
  getProducts: (params?: ProductFilters) => 
    api.get(ENDPOINTS.MARKETPLACE.PRODUCTS, { params }),
  
  getProduct: (id: string) => 
    api.get(ENDPOINTS.MARKETPLACE.PRODUCT_DETAIL(id)),
  
  createProduct: (productData: ProductData) => 
    api.post(ENDPOINTS.MARKETPLACE.PRODUCTS, productData),
  
  getOrders: () => 
    api.get(ENDPOINTS.MARKETPLACE.ORDERS),
  
  createOrder: (orderData: OrderData) => 
    api.post(ENDPOINTS.MARKETPLACE.ORDERS, orderData),
};
```

### 5. Crop Detection API

#### API Endpoints
- `POST /api/v1/crop-detection/analyze/` - Upload and analyze crop image
- `GET /api/v1/crop-detection/history/` - User's detection history
- `GET /api/v1/crop-detection/diseases/` - Disease database
- `GET /api/v1/crop-detection/treatments/{disease_id}/` - Treatment recommendations

### 6. Real-time Services

#### WebSocket Endpoints
- `/ws/notifications/{user_id}/` - Personal notifications
- `/ws/marketplace/` - Marketplace updates
- `/ws/chat/{conversation_id}/` - Chat messages
- `/ws/farm-monitoring/{farm_id}/` - Farm sensor data

#### Frontend WebSocket Client
```typescript
class WebSocketClient {
  private connections: Map<string, WebSocket> = new Map();
  
  connect(endpoint: string, token: string): Promise<WebSocket>;
  disconnect(endpoint: string): void;
  send(endpoint: string, data: any): void;
  onMessage(endpoint: string, callback: (data: any) => void): void;
}
```

## Data Models

### Frontend TypeScript Interfaces

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
  permissions: string[];
}

interface Farm {
  id: string;
  name: string;
  location: Location;
  size_hectares: number;
  crops: Crop[];
  livestock: Livestock[];
  analytics: FarmAnalytics;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price_per_unit: number;
  quantity_available: number;
  seller: User;
  images: string[];
  location: Location;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

## Error Handling

### Rate Limiting Error Handling
```python
# Custom exception handler for better rate limiting messages
def custom_exception_handler(exc, context):
    if isinstance(exc, Throttled):
        custom_response_data = {
            'error': {
                'code': 'RATE_LIMIT_EXCEEDED',
                'message': 'Too many requests. Please try again later.',
                'retry_after': exc.wait,
                'details': f'Rate limit exceeded. Try again in {exc.wait} seconds.'
            }
        }
        return Response(custom_response_data, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    return drf_default_exception_handler(exc, context)
```

### Frontend Error Handling for Specific Issues
```typescript
// src/utils/errorHandler.ts
export const handleApiError = (error: AxiosError) => {
  if (error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    return {
      message: `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
      type: 'rate_limit',
      retryAfter: parseInt(retryAfter) || 60,
    };
  }
  
  if (error.response?.status === 404) {
    return {
      message: 'The requested resource was not found. Please check the URL.',
      type: 'not_found',
    };
  }
  
  if (error.code === 'NETWORK_ERROR') {
    return {
      message: 'Network error. Please check your connection and try again.',
      type: 'network',
    };
  }
  
  return {
    message: 'An unexpected error occurred. Please try again.',
    type: 'unknown',
  };
};
```

## Testing Strategy

### Rate Limiting Testing
```python
# tests/test_throttling.py
class TestRateLimiting(APITestCase):
    def test_registration_rate_limit(self):
        # Test that legitimate users can register
        for i in range(5):  # Should allow 5 registrations
            response = self.client.post('/api/v1/auth/register/', {
                'username': f'user{i}',
                'email': f'user{i}@test.com',
                'password': 'testpass123'
            })
            self.assertIn(response.status_code, [201, 400])  # 400 for duplicate users
    
    def test_rate_limit_reset(self):
        # Test that rate limits reset properly
        pass
```

### Endpoint Integration Testing
```typescript
// src/tests/api.test.ts
describe('API Endpoint Integration', () => {
  test('marketplace endpoints work correctly', async () => {
    const products = await marketplaceService.getProducts();
    expect(products.status).toBe(200);
    expect(products.data).toHaveProperty('results');
  });
  
  test('AI conversation endpoint works', async () => {
    const conversation = await aiService.createConversation();
    const message = await aiService.sendMessage(conversation.id, 'Hello');
    expect(message.data).toHaveProperty('ai_response');
  });
});
```

### Navigation Testing
```typescript
// src/tests/navigation.test.tsx
describe('Navigation', () => {
  test('marketplace navigation works', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Marketplace'));
    expect(screen.getByText('Products')).toBeInTheDocument();
  });
});
```

## Implementation Priority

### Phase 1: Critical Fixes (Immediate)
1. **Rate Limiting Adjustment**: Update Django settings to allow reasonable registration attempts
2. **Marketplace Navigation**: Fix frontend routing and ensure all marketplace pages load
3. **OpenAI Integration**: Implement actual OpenAI API calls in AI assistant

### Phase 2: Endpoint Alignment (Next)
1. **API Endpoint Audit**: Verify all frontend API calls match backend URLs
2. **Error Handling**: Implement proper error handling for all API interactions
3. **Testing**: Add tests to prevent regression of these fixes

### Configuration Changes Required

**Django Settings Updates**
```python
# Immediate changes needed in settings.py
'DEFAULT_THROTTLE_RATES': {
    'anon': '200/hour',
    'user': '2000/hour', 
    'login': '10/min',
    'registration': '10/hour',  # Increased from 3/hour
    'password_reset': '5/hour',
    'email_verification': '15/hour',
}
```

**Environment Variables**
```bash
# Ensure these are set in .env
OPENAI_API_KEY=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
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

## Security Considerations

### Authentication & Authorization
- **JWT Security**: Short-lived access tokens with refresh tokens
- **Role-Based Access Control**: Granular permissions system
- **Rate Limiting**: Prevent API abuse and brute force attacks
- **Input Validation**: Comprehensive input sanitization
- **CORS Configuration**: Proper cross-origin resource sharing

### Data Protection
- **HTTPS Only**: All API communication over HTTPS
- **Data Encryption**: Encrypt sensitive data at rest
- **File Upload Security**: Validate and scan uploaded files
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Protection**: Sanitize user-generated content

## Deployment and Monitoring

### API Monitoring
- **Health Checks**: Endpoint monitoring and alerting
- **Performance Metrics**: Response time and throughput tracking
- **Error Tracking**: Centralized error logging and alerting
- **Usage Analytics**: API usage patterns and optimization insights

### Frontend Monitoring
- **Error Tracking**: JavaScript error monitoring
- **Performance Monitoring**: Core Web Vitals tracking
- **User Analytics**: User behavior and feature usage
- **Real User Monitoring**: Actual user experience metrics