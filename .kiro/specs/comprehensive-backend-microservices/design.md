# AgroBridge Backend Microservices - Design Document

## Overview

AgroBridge is a comprehensive agricultural platform built on a microservices architecture to support farmers, buyers, NGOs, and government organizations across Africa. This design document outlines the technical architecture, service boundaries, data models, API specifications, and implementation strategies for the complete backend system.

### Design Principles

1. **Microservices Architecture**: Independent, loosely coupled services with clear boundaries
2. **API-First Design**: RESTful APIs with OpenAPI specifications for all services
3. **Event-Driven Communication**: Asynchronous messaging for service coordination
4. **Domain-Driven Design**: Services organized around business capabilities
5. **Security by Design**: Zero-trust architecture with defense in depth
6. **Scalability**: Horizontal scaling with stateless services
7. **Resilience**: Circuit breakers, retries, and graceful degradation
8. **Observability**: Comprehensive logging, monitoring, and tracing
9. **Data Sovereignty**: Region-specific data handling for compliance
10. **Mobile-First**: Optimized for low-bandwidth African networks

### Technology Stack

**Core Framework**: Django 5.2 with Django REST Framework
**Database**: PostgreSQL (primary), MongoDB (documents), Redis (cache), TimescaleDB (time-series)
**Message Queue**: RabbitMQ with Celery for async tasks
**API Gateway**: Kong or Traefik
**Service Discovery**: Consul or Eureka
**Caching**: Redis with Redis Cluster
**File Storage**: MinIO (S3-compatible) or AWS S3
**Search**: Elasticsearch
**Real-time**: Django Channels with WebSocket
**AI/ML**: PyTorch, TensorFlow, YOLOv5, OpenAI API
**Monitoring**: Prometheus, Grafana, ELK Stack
**Tracing**: Jaeger or Zipkin
**Container Orchestration**: Docker + Kubernetes
**CI/CD**: GitHub Actions, Jenkins, or GitLab CI

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer (NGINX)                    │
│                         SSL Termination                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                      API Gateway (Kong)                          │
│  - Authentication        - Rate Limiting      - Request Routing  │
│  - CORS                  - Logging            - Circuit Breaker  │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│  Authentication   │  │   User Service    │  │   Farm Service    │
│     Service       │  │                   │  │                   │
│  - JWT Auth       │  │  - Profiles       │  │  - Farm Mgmt      │
│  - OAuth 2.0      │  │  - Preferences    │  │  - Crop Data      │
│  - MFA            │  │  - Roles          │  │  - Field Mapping  │
└─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘
          │                      │                      │
┌─────────┴──────────────────────┴──────────────────────┴─────────┐
│                    Message Bus (RabbitMQ/Kafka)                  │
│              Event-Driven Communication Layer                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│   Marketplace     │  │   AI/ML Service   │  │  IoT Service      │
│     Service       │  │                   │  │                   │
│  - Products       │  │  - AgriGPT        │  │  - Sensors        │
│  - Orders         │  │  - Crop Detection │  │  - Monitoring     │
│  - Payments       │  │  - Predictions    │  │  - Alerts         │
└─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘
          │                      │                      │
┌─────────┴──────────────────────┴──────────────────────┴─────────┐
│                    Shared Infrastructure                         │
│  - Service Registry (Consul)  - Config Server                   │
│  - Secrets Manager (Vault)    - Distributed Cache (Redis)       │
└──────────────────────────────────────────────────────────────────┘
```

### Microservices Breakdown

#### Core Services (Layer 1 - Foundation)

1. **Authentication Service** (`authentication/`)
   - User registration, login, logout
   - JWT token generation and validation
   - OAuth 2.0 for third-party integrations
   - Multi-factor authentication
   - Password reset and email verification
   - Role-based access control (RBAC)

2. **User Service** (`users/`)
   - User profile management
   - User preferences and settings
   - Role management (Farmer, Buyer, NGO, Government)
   - User activity tracking
   - Data export and deletion (GDPR)

3. **API Gateway Service**
   - Request routing to microservices
   - Authentication and authorization
   - Rate limiting and throttling
   - Request/response transformation
   - Circuit breaker implementation
   - API versioning support

#### Business Services (Layer 2 - Core Features)

4. **Farm Management Service** (`farms/`)
   - Farm profile creation and management
   - Crop and field management
   - Farm location and boundaries
   - Crop calendar and planning
   - Farm statistics and metrics
   - Multi-farm support per user

5. **Marketplace Service** (`marketplace/`)
   - Product listing and management
   - Product search and filtering
   - Order creation and management
   - Seller and buyer interactions
   - Product reviews and ratings
   - Inventory management
   - Real-time marketplace updates via WebSocket

6. **AI Assistant Service** (`ai_assistant/`)
   - AgriGPT conversational AI
   - Voice command processing
   - Multi-language support (English, Twi, Hausa)
   - Context-aware recommendations
   - Agricultural knowledge base
   - Speech-to-text and text-to-speech

7. **Crop Detection Service** (`crop_detection/`)
   - Image upload and processing
   - YOLOv5-based disease detection
   - Disease identification and classification
   - Treatment recommendations
   - Detection history and analytics
   - Batch image processing

8. **Financial Management Service** (new: `financial/`)
   - Income and expense tracking
   - Budget creation and monitoring
   - Financial reports and analytics
   - Transaction history
   - Multi-currency support
   - Financial projections

9. **Learning Service** (new: `learning/`)
   - Course and tutorial management
   - Content delivery (video, articles, PDFs)
   - Progress tracking and quizzes
   - Certificate generation
   - Expert Q&A forums
   - Content recommendations

10. **Community Service** (new: `community/`)
    - Social posts and feeds
    - Comments, likes, and shares
    - User connections and following
    - Private messaging
    - Content moderation
    - Topic and region-based organization

#### Advanced Services (Layer 3 - Specialized Features)

11. **IoT Service** (new: `iot/`)
    - Device registration and provisioning
    - Sensor data ingestion
    - Real-time monitoring dashboards
    - Alert generation based on thresholds
    - Device management and firmware updates
    - Satellite and drone data integration

12. **Notification Service** (new: `notifications/`)
    - Real-time WebSocket notifications
    - Push notifications (FCM/APNS)
    - Email notifications
    - SMS notifications (Twilio/Africa's Talking)
    - Notification preferences management
    - Notification history and read status

13. **Analytics Service** (new: `analytics/`)
    - Dashboard metrics calculation
    - Predictive analytics (yield, weather, prices)
    - Time-series data analysis
    - Report generation
    - Data visualization support
    - Business intelligence queries

14. **Scheduling Service** (new: `scheduling/`)
    - Task creation and management
    - Recurring task support
    - Reminder notifications
    - Task completion tracking
    - Smart scheduling recommendations
    - Calendar integration

15. **Payment Service** (new: `payments/`)
    - Payment gateway integration (Stripe, PayPal, Flutterwave)
    - Transaction processing
    - Escrow management
    - Multi-currency support
    - Payment receipts and invoices
    - Dispute resolution

16. **Blockchain Service** (new: `blockchain/`)
    - Certificate generation and verification
    - Product traceability
    - Supply chain tracking
    - Immutable audit trails
    - QR code generation
    - External certification integration

17. **Export Documentation Service** (new: `export_docs/`)
    - Document template management
    - Export document generation
    - Compliance validation
    - Digital signatures
    - Customs integration
    - Shipment tracking

18. **Emergency Response Service** (new: `emergency/`)
    - Emergency alert creation and broadcasting
    - Multi-channel alert delivery
    - Geographic targeting
    - Emergency response guidelines
    - Incident reporting and aggregation
    - Post-incident analysis

#### Infrastructure Services (Layer 4 - Platform)

19. **File Storage Service** (new: `storage/`)
    - File upload and download
    - Image processing and thumbnails
    - Video transcoding
    - CDN integration
    - Malware scanning
    - Lifecycle management

20. **Admin Service** (new: `admin/`)
    - User management
    - Content moderation
    - System configuration
    - Analytics dashboards
    - Audit log viewing
    - Security incident management

21. **Monitoring Service** (infrastructure)
    - Centralized logging (ELK)
    - Metrics collection (Prometheus)
    - Distributed tracing (Jaeger)
    - Health checks
    - Alerting (PagerDuty/Slack)
    - Performance monitoring

22. **Backup Service** (infrastructure)
    - Automated database backups
    - File backup and archival
    - Point-in-time recovery
    - Multi-region replication
    - Disaster recovery orchestration
    - Backup verification


## Components and Interfaces

### Service Communication Patterns

#### Synchronous Communication (REST APIs)

All services expose RESTful APIs following these conventions:

**API Versioning**: `/api/v1/{resource}`
**Authentication**: Bearer token in Authorization header
**Response Format**: JSON with consistent structure
**Error Handling**: RFC 7807 Problem Details
**Pagination**: Cursor-based with `next` and `previous` links
**Filtering**: Query parameters for filtering and sorting

**Standard Response Structure**:
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2025-12-02T10:00:00Z",
    "request_id": "uuid",
    "version": "v1"
  },
  "pagination": {
    "next": "cursor",
    "previous": "cursor",
    "total": 100
  }
}
```

**Error Response Structure**:
```json
{
  "success": false,
  "error": {
    "type": "validation_error",
    "title": "Invalid Input",
    "status": 400,
    "detail": "Email format is invalid",
    "instance": "/api/v1/users/register",
    "errors": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-12-02T10:00:00Z",
    "request_id": "uuid"
  }
}
```

#### Asynchronous Communication (Message Queue)

**Event Types**:
- `user.registered` - New user registration
- `user.verified` - Email verification completed
- `farm.created` - New farm added
- `product.listed` - New product in marketplace
- `order.placed` - New order created
- `order.completed` - Order fulfilled
- `payment.processed` - Payment successful
- `disease.detected` - Crop disease identified
- `sensor.alert` - IoT sensor threshold exceeded
- `emergency.alert` - Emergency situation detected

**Event Structure**:
```json
{
  "event_id": "uuid",
  "event_type": "order.placed",
  "timestamp": "2025-12-02T10:00:00Z",
  "source_service": "marketplace",
  "version": "1.0",
  "data": {
    "order_id": "uuid",
    "buyer_id": "uuid",
    "seller_id": "uuid",
    "total_amount": 1500.00,
    "currency": "NGN"
  },
  "metadata": {
    "correlation_id": "uuid",
    "user_id": "uuid",
    "tenant_id": "uuid"
  }
}
```

#### Real-Time Communication (WebSocket)

**WebSocket Channels**:
- `/ws/notifications/{user_id}` - User-specific notifications
- `/ws/marketplace/live` - Live marketplace updates
- `/ws/farm/{farm_id}/sensors` - Real-time sensor data
- `/ws/chat/{conversation_id}` - Private messaging
- `/ws/emergency/alerts` - Emergency broadcasts

**WebSocket Message Format**:
```json
{
  "type": "notification",
  "action": "new_order",
  "timestamp": "2025-12-02T10:00:00Z",
  "data": {
    "notification_id": "uuid",
    "title": "New Order Received",
    "message": "You have a new order for Tomatoes",
    "priority": "high",
    "action_url": "/orders/uuid"
  }
}
```

### API Gateway Configuration

**Kong Gateway Routes**:

```yaml
routes:
  - name: authentication
    paths: ["/api/v1/auth/*"]
    service: authentication-service
    plugins:
      - rate-limiting:
          minute: 10
          policy: local
      - request-transformer:
          add:
            headers: ["X-Service:authentication"]
  
  - name: marketplace
    paths: ["/api/v1/marketplace/*"]
    service: marketplace-service
    plugins:
      - jwt:
          claims_to_verify: ["exp"]
      - rate-limiting:
          minute: 100
      - cors:
          origins: ["*"]
          methods: ["GET", "POST", "PUT", "DELETE"]
  
  - name: ai-assistant
    paths: ["/api/v1/ai/*"]
    service: ai-assistant-service
    plugins:
      - jwt:
          claims_to_verify: ["exp"]
      - rate-limiting:
          minute: 30
      - request-size-limiting:
          allowed_payload_size: 10
```

### Service Discovery

**Consul Service Registration**:

```python
# Example service registration in Django
from consul import Consul

def register_service():
    consul = Consul(host='consul', port=8500)
    
    service_config = {
        'name': 'marketplace-service',
        'id': f'marketplace-{instance_id}',
        'address': service_host,
        'port': service_port,
        'tags': ['marketplace', 'v1', 'django'],
        'check': {
            'http': f'http://{service_host}:{service_port}/health',
            'interval': '10s',
            'timeout': '5s'
        }
    }
    
    consul.agent.service.register(**service_config)
```

### Circuit Breaker Pattern

```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=60)
def call_external_service(url, data):
    """
    Circuit breaker for external service calls
    - Opens after 5 consecutive failures
    - Attempts recovery after 60 seconds
    """
    response = requests.post(url, json=data, timeout=5)
    response.raise_for_status()
    return response.json()
```

### Inter-Service Authentication

**Service-to-Service JWT**:

```python
import jwt
from datetime import datetime, timedelta

def generate_service_token(service_name):
    """Generate JWT for service-to-service communication"""
    payload = {
        'service': service_name,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(minutes=5),
        'type': 'service'
    }
    return jwt.encode(payload, SERVICE_SECRET_KEY, algorithm='HS256')

def verify_service_token(token):
    """Verify service JWT"""
    try:
        payload = jwt.decode(token, SERVICE_SECRET_KEY, algorithms=['HS256'])
        return payload.get('type') == 'service'
    except jwt.ExpiredSignatureError:
        return False
```


## Data Models

### Database Strategy

**Database per Service Pattern**:
- Each microservice owns its database
- No direct database access between services
- Data consistency via events and sagas

**Database Technologies**:

1. **PostgreSQL** - Transactional data
   - Users, authentication, farms, marketplace, financial records
   - ACID compliance for critical operations
   - Full-text search capabilities

2. **MongoDB** - Document storage
   - AI conversation history
   - Logs and audit trails
   - Flexible schema for evolving data

3. **Redis** - Caching and sessions
   - Session storage
   - API response caching
   - Real-time data (sensor readings)
   - Rate limiting counters

4. **TimescaleDB** - Time-series data
   - IoT sensor readings
   - Farm monitoring metrics
   - Analytics time-series
   - Automatic data retention

5. **Elasticsearch** - Search and analytics
   - Product search
   - Full-text content search
   - Log aggregation
   - Analytics queries

### Core Data Models

#### Authentication Service

```python
# models.py
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
import uuid

class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    
    # User type
    USER_TYPES = [
        ('farmer', 'Farmer'),
        ('poultry_keeper', 'Poultry Keeper'),
        ('buyer', 'Buyer'),
        ('ngo', 'NGO'),
        ('government', 'Government'),
    ]
    user_type = models.CharField(max_length=20, choices=USER_TYPES)
    
    # Status
    is_active = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    verification_token = models.CharField(max_length=255, null=True, blank=True)
    password_reset_token = models.CharField(max_length=255, null=True, blank=True)
    password_reset_expires = models.DateTimeField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['user_type']
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['user_type']),
            models.Index(fields=['created_at']),
        ]

class RefreshToken(models.Model):
    """JWT refresh token storage"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='refresh_tokens')
    token = models.CharField(max_length=500, unique=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    revoked = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'refresh_tokens'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'revoked']),
        ]
```

#### User Service

```python
class UserProfile(models.Model):
    """Extended user profile information"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(unique=True, db_index=True)  # Reference to auth service
    
    # Personal information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')])
    
    # Location
    country = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    address = models.TextField(null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Preferences
    language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    currency = models.CharField(max_length=3, default='USD')
    
    # Profile
    avatar_url = models.URLField(null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
        indexes = [
            models.Index(fields=['user_id']),
            models.Index(fields=['country', 'region']),
        ]

class UserPreferences(models.Model):
    """User notification and system preferences"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(unique=True, db_index=True)
    
    # Notification preferences
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    
    # Notification types
    order_notifications = models.BooleanField(default=True)
    message_notifications = models.BooleanField(default=True)
    alert_notifications = models.BooleanField(default=True)
    marketing_notifications = models.BooleanField(default=False)
    
    # Display preferences
    theme = models.CharField(max_length=10, default='light', choices=[('light', 'Light'), ('dark', 'Dark')])
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_preferences'
```

#### Farm Service

```python
class Farm(models.Model):
    """Farm information"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner_id = models.UUIDField(db_index=True)  # Reference to user
    
    # Basic information
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    farm_type = models.CharField(max_length=50, choices=[
        ('crop', 'Crop Farming'),
        ('livestock', 'Livestock'),
        ('poultry', 'Poultry'),
        ('mixed', 'Mixed Farming'),
    ])
    
    # Location
    country = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    
    # Size
    total_area = models.DecimalField(max_digits=10, decimal_places=2)  # in hectares
    cultivated_area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Soil information
    soil_type = models.CharField(max_length=100, null=True, blank=True)
    soil_ph = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'farms'
        indexes = [
            models.Index(fields=['owner_id']),
            models.Index(fields=['country', 'region']),
            models.Index(fields=['farm_type']),
        ]

class Field(models.Model):
    """Individual field within a farm"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='fields')
    
    name = models.CharField(max_length=200)
    area = models.DecimalField(max_digits=10, decimal_places=2)  # in hectares
    
    # Geometry (GeoJSON polygon)
    boundary = models.JSONField(null=True, blank=True)
    
    # Current crop
    current_crop = models.CharField(max_length=100, null=True, blank=True)
    planting_date = models.DateField(null=True, blank=True)
    expected_harvest_date = models.DateField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'fields'
        indexes = [
            models.Index(fields=['farm']),
            models.Index(fields=['current_crop']),
        ]

class Crop(models.Model):
    """Crop information and tracking"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    field = models.ForeignKey(Field, on_delete=models.CASCADE, related_name='crops')
    
    # Crop details
    crop_name = models.CharField(max_length=100)
    variety = models.CharField(max_length=100, null=True, blank=True)
    
    # Lifecycle
    planting_date = models.DateField()
    expected_harvest_date = models.DateField()
    actual_harvest_date = models.DateField(null=True, blank=True)
    
    # Quantities
    planted_area = models.DecimalField(max_digits=10, decimal_places=2)
    expected_yield = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    actual_yield = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    yield_unit = models.CharField(max_length=20, default='kg')
    
    # Status
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('planted', 'Planted'),
        ('growing', 'Growing'),
        ('harvesting', 'Harvesting'),
        ('harvested', 'Harvested'),
        ('failed', 'Failed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'crops'
        indexes = [
            models.Index(fields=['field']),
            models.Index(fields=['status']),
            models.Index(fields=['planting_date']),
        ]
```


#### Marketplace Service

```python
class Product(models.Model):
    """Marketplace product listing"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller_id = models.UUIDField(db_index=True)
    farm_id = models.UUIDField(null=True, blank=True)
    
    # Product details
    name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100)
    subcategory = models.CharField(max_length=100, null=True, blank=True)
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    unit = models.CharField(max_length=20)  # kg, ton, piece, etc.
    
    # Inventory
    quantity_available = models.DecimalField(max_digits=10, decimal_places=2)
    minimum_order = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    
    # Quality
    quality_grade = models.CharField(max_length=20, null=True, blank=True)
    organic_certified = models.BooleanField(default=False)
    
    # Location
    location = models.CharField(max_length=200)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Metrics
    views_count = models.IntegerField(default=0)
    orders_count = models.IntegerField(default=0)
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products'
        indexes = [
            models.Index(fields=['seller_id']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active', 'created_at']),
            models.Index(fields=['price']),
        ]

class ProductImage(models.Model):
    """Product images"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    
    image_url = models.URLField()
    thumbnail_url = models.URLField(null=True, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'product_images'
        ordering = ['order']

class Order(models.Model):
    """Marketplace order"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    
    # Parties
    buyer_id = models.UUIDField(db_index=True)
    seller_id = models.UUIDField(db_index=True)
    
    # Order details
    product_id = models.UUIDField()
    product_name = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3)
    
    # Status
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Payment
    payment_status = models.CharField(max_length=20, default='pending')
    payment_method = models.CharField(max_length=50, null=True, blank=True)
    payment_id = models.CharField(max_length=200, null=True, blank=True)
    
    # Delivery
    delivery_address = models.TextField()
    delivery_notes = models.TextField(null=True, blank=True)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'orders'
        indexes = [
            models.Index(fields=['buyer_id', 'status']),
            models.Index(fields=['seller_id', 'status']),
            models.Index(fields=['order_number']),
            models.Index(fields=['created_at']),
        ]

class Review(models.Model):
    """Product review"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product_id = models.UUIDField(db_index=True)
    order_id = models.UUIDField(db_index=True)
    reviewer_id = models.UUIDField(db_index=True)
    
    rating = models.IntegerField()  # 1-5
    title = models.CharField(max_length=200, null=True, blank=True)
    comment = models.TextField(null=True, blank=True)
    
    # Moderation
    is_verified_purchase = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reviews'
        unique_together = [['order_id', 'reviewer_id']]
        indexes = [
            models.Index(fields=['product_id', 'is_approved']),
        ]
```

#### IoT Service

```python
class IoTDevice(models.Model):
    """IoT device registration"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device_id = models.CharField(max_length=100, unique=True, db_index=True)
    
    # Ownership
    owner_id = models.UUIDField(db_index=True)
    farm_id = models.UUIDField(db_index=True)
    field_id = models.UUIDField(null=True, blank=True)
    
    # Device information
    device_name = models.CharField(max_length=200)
    device_type = models.CharField(max_length=50)  # soil_moisture, temperature, etc.
    manufacturer = models.CharField(max_length=100, null=True, blank=True)
    model = models.CharField(max_length=100, null=True, blank=True)
    firmware_version = models.CharField(max_length=50, null=True, blank=True)
    
    # Location
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)
    battery_level = models.IntegerField(null=True, blank=True)  # 0-100
    
    # Configuration
    reading_interval = models.IntegerField(default=300)  # seconds
    alert_thresholds = models.JSONField(default=dict)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'iot_devices'
        indexes = [
            models.Index(fields=['owner_id']),
            models.Index(fields=['farm_id']),
            models.Index(fields=['device_type']),
        ]

# TimescaleDB model for sensor readings
class SensorReading(models.Model):
    """Time-series sensor data"""
    id = models.BigAutoField(primary_key=True)
    device_id = models.UUIDField(db_index=True)
    
    # Reading data
    timestamp = models.DateTimeField(db_index=True)
    sensor_type = models.CharField(max_length=50)
    value = models.DecimalField(max_digits=10, decimal_places=4)
    unit = models.CharField(max_length=20)
    
    # Metadata
    quality = models.CharField(max_length=20, default='good')  # good, fair, poor
    
    class Meta:
        db_table = 'sensor_readings'
        indexes = [
            models.Index(fields=['device_id', 'timestamp']),
            models.Index(fields=['sensor_type', 'timestamp']),
        ]
        # TimescaleDB hypertable configuration
        # CREATE HYPERTABLE sensor_readings (timestamp)

class SensorAlert(models.Model):
    """Sensor threshold alerts"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device_id = models.UUIDField(db_index=True)
    
    # Alert details
    alert_type = models.CharField(max_length=50)
    severity = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ])
    message = models.TextField()
    
    # Threshold information
    sensor_type = models.CharField(max_length=50)
    threshold_value = models.DecimalField(max_digits=10, decimal_places=4)
    actual_value = models.DecimalField(max_digits=10, decimal_places=4)
    
    # Status
    is_acknowledged = models.BooleanField(default=False)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by = models.UUIDField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'sensor_alerts'
        indexes = [
            models.Index(fields=['device_id', 'created_at']),
            models.Index(fields=['severity', 'is_acknowledged']),
        ]
```


#### Notification Service

```python
class Notification(models.Model):
    """User notifications"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True)
    
    # Notification details
    NOTIFICATION_TYPES = [
        ('order', 'Order'),
        ('message', 'Message'),
        ('alert', 'Alert'),
        ('system', 'System'),
        ('emergency', 'Emergency'),
    ]
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Priority
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Action
    action_url = models.CharField(max_length=500, null=True, blank=True)
    action_data = models.JSONField(null=True, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Delivery
    delivered_push = models.BooleanField(default=False)
    delivered_email = models.BooleanField(default=False)
    delivered_sms = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notifications'
        indexes = [
            models.Index(fields=['user_id', 'is_read', 'created_at']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['priority']),
        ]
```

#### Financial Service

```python
class FinancialRecord(models.Model):
    """Income and expense tracking"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True)
    farm_id = models.UUIDField(null=True, blank=True, db_index=True)
    
    # Transaction details
    TRANSACTION_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    
    category = models.CharField(max_length=100)
    subcategory = models.CharField(max_length=100, null=True, blank=True)
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3)
    
    description = models.TextField(null=True, blank=True)
    
    # Date
    transaction_date = models.DateField()
    
    # References
    order_id = models.UUIDField(null=True, blank=True)
    payment_id = models.CharField(max_length=200, null=True, blank=True)
    
    # Attachments
    receipt_url = models.URLField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'financial_records'
        indexes = [
            models.Index(fields=['user_id', 'transaction_date']),
            models.Index(fields=['farm_id', 'transaction_date']),
            models.Index(fields=['transaction_type', 'category']),
        ]

class Budget(models.Model):
    """Budget planning"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True)
    farm_id = models.UUIDField(null=True, blank=True)
    
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    
    # Period
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Budget amounts
    total_budget = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'budgets'
        indexes = [
            models.Index(fields=['user_id', 'is_active']),
        ]

class BudgetCategory(models.Model):
    """Budget category allocations"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='categories')
    
    category = models.CharField(max_length=100)
    allocated_amount = models.DecimalField(max_digits=12, decimal_places=2)
    spent_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    class Meta:
        db_table = 'budget_categories'
```

#### AI Assistant Service (MongoDB)

```python
# MongoDB document structure (using mongoengine)
from mongoengine import Document, fields

class Conversation(Document):
    """AI assistant conversation history"""
    conversation_id = fields.UUIDField(required=True, unique=True)
    user_id = fields.UUIDField(required=True)
    
    # Conversation metadata
    title = fields.StringField(max_length=200)
    language = fields.StringField(default='en')
    
    # Messages
    messages = fields.ListField(fields.DictField())
    # Message structure:
    # {
    #     "role": "user" | "assistant",
    #     "content": "message text",
    #     "timestamp": "ISO datetime",
    #     "metadata": {
    #         "voice_input": bool,
    #         "location": {"lat": float, "lon": float},
    #         "farm_context": "farm_id"
    #     }
    # }
    
    # Context
    farm_context = fields.UUIDField()
    user_context = fields.DictField()
    
    # Status
    is_active = fields.BooleanField(default=True)
    
    # Timestamps
    created_at = fields.DateTimeField()
    updated_at = fields.DateTimeField()
    last_message_at = fields.DateTimeField()
    
    meta = {
        'collection': 'conversations',
        'indexes': [
            'user_id',
            'conversation_id',
            {'fields': ['user_id', 'is_active']},
            {'fields': ['last_message_at'], 'expireAfterSeconds': 7776000}  # 90 days
        ]
    }

class CropDetectionResult(Document):
    """Crop disease detection results"""
    detection_id = fields.UUIDField(required=True, unique=True)
    user_id = fields.UUIDField(required=True)
    farm_id = fields.UUIDField()
    field_id = fields.UUIDField()
    
    # Image information
    image_url = fields.StringField(required=True)
    image_metadata = fields.DictField()
    
    # Detection results
    detections = fields.ListField(fields.DictField())
    # Detection structure:
    # {
    #     "disease_name": "string",
    #     "confidence": float,
    #     "severity": "low" | "medium" | "high",
    #     "bounding_box": {"x": int, "y": int, "width": int, "height": int},
    #     "treatment_recommendations": ["string"]
    # }
    
    # Model information
    model_version = fields.StringField()
    processing_time_ms = fields.IntField()
    
    # Location
    location = fields.PointField()
    
    # Timestamps
    created_at = fields.DateTimeField()
    
    meta = {
        'collection': 'crop_detections',
        'indexes': [
            'user_id',
            'farm_id',
            'detection_id',
            {'fields': ['created_at']}
        ]
    }
```


## Error Handling

### Error Response Standards

All services follow RFC 7807 Problem Details for HTTP APIs:

```python
# errors.py
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import uuid
from datetime import datetime

def custom_exception_handler(exc, context):
    """Custom exception handler for consistent error responses"""
    response = exception_handler(exc, context)
    
    if response is not None:
        error_response = {
            "success": False,
            "error": {
                "type": get_error_type(exc),
                "title": get_error_title(exc),
                "status": response.status_code,
                "detail": str(exc),
                "instance": context['request'].path,
            },
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + 'Z',
                "request_id": str(uuid.uuid4()),
            }
        }
        
        # Add field-specific errors for validation errors
        if hasattr(exc, 'detail') and isinstance(exc.detail, dict):
            error_response["error"]["errors"] = [
                {"field": field, "message": str(messages[0]) if isinstance(messages, list) else str(messages)}
                for field, messages in exc.detail.items()
            ]
        
        response.data = error_response
    
    return response

def get_error_type(exc):
    """Map exception to error type"""
    error_types = {
        'ValidationError': 'validation_error',
        'AuthenticationFailed': 'authentication_error',
        'PermissionDenied': 'authorization_error',
        'NotFound': 'not_found',
        'MethodNotAllowed': 'method_not_allowed',
        'Throttled': 'rate_limit_exceeded',
    }
    return error_types.get(exc.__class__.__name__, 'server_error')

def get_error_title(exc):
    """Get human-readable error title"""
    titles = {
        'ValidationError': 'Validation Error',
        'AuthenticationFailed': 'Authentication Failed',
        'PermissionDenied': 'Permission Denied',
        'NotFound': 'Resource Not Found',
        'MethodNotAllowed': 'Method Not Allowed',
        'Throttled': 'Rate Limit Exceeded',
    }
    return titles.get(exc.__class__.__name__, 'Internal Server Error')
```

### Custom Exceptions

```python
# exceptions.py
from rest_framework.exceptions import APIException
from rest_framework import status

class ServiceUnavailableException(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'Service temporarily unavailable.'
    default_code = 'service_unavailable'

class ExternalServiceException(APIException):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = 'External service error.'
    default_code = 'external_service_error'

class BusinessLogicException(APIException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = 'Business logic validation failed.'
    default_code = 'business_logic_error'

class InsufficientFundsException(BusinessLogicException):
    default_detail = 'Insufficient funds for this transaction.'
    default_code = 'insufficient_funds'

class ProductOutOfStockException(BusinessLogicException):
    default_detail = 'Product is out of stock.'
    default_code = 'out_of_stock'
```

### Retry Logic

```python
# retry.py
import time
from functools import wraps
import logging

logger = logging.getLogger(__name__)

def retry_with_backoff(max_retries=3, base_delay=1, max_delay=60, exceptions=(Exception,)):
    """
    Decorator for retrying functions with exponential backoff
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    retries += 1
                    if retries >= max_retries:
                        logger.error(f"Max retries ({max_retries}) exceeded for {func.__name__}")
                        raise
                    
                    delay = min(base_delay * (2 ** (retries - 1)), max_delay)
                    logger.warning(f"Retry {retries}/{max_retries} for {func.__name__} after {delay}s. Error: {str(e)}")
                    time.sleep(delay)
            
            return None
        return wrapper
    return decorator

# Usage example
@retry_with_backoff(max_retries=3, base_delay=2, exceptions=(requests.RequestException,))
def call_external_api(url, data):
    response = requests.post(url, json=data, timeout=10)
    response.raise_for_status()
    return response.json()
```

### Graceful Degradation

```python
# degradation.py
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class GracefulDegradation:
    """Handle service degradation gracefully"""
    
    @staticmethod
    def get_with_fallback(primary_func, fallback_func, cache_key=None, cache_timeout=300):
        """
        Try primary function, fall back to secondary if it fails
        Optionally cache the result
        """
        try:
            # Try to get from cache first
            if cache_key:
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    return cached_result
            
            # Try primary function
            result = primary_func()
            
            # Cache successful result
            if cache_key:
                cache.set(cache_key, result, cache_timeout)
            
            return result
            
        except Exception as e:
            logger.warning(f"Primary function failed: {str(e)}. Using fallback.")
            
            try:
                # Try fallback function
                result = fallback_func()
                return result
            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {str(fallback_error)}")
                raise

# Usage example
def get_weather_forecast(location):
    """Get weather from primary service"""
    def primary():
        return external_weather_api.get_forecast(location)
    
    def fallback():
        # Return cached historical data or default forecast
        return {
            "temperature": 25,
            "condition": "partly_cloudy",
            "source": "fallback"
        }
    
    return GracefulDegradation.get_with_fallback(
        primary,
        fallback,
        cache_key=f"weather:{location}",
        cache_timeout=3600
    )
```

## Testing Strategy

### Testing Pyramid

```
                    /\
                   /  \
                  / E2E \          10% - End-to-End Tests
                 /______\
                /        \
               /Integration\       30% - Integration Tests
              /____________\
             /              \
            /   Unit Tests   \     60% - Unit Tests
           /__________________\
```

### Unit Testing

```python
# tests/test_marketplace.py
from django.test import TestCase
from unittest.mock import patch, MagicMock
from marketplace.services import OrderService
from marketplace.models import Order, Product
import uuid

class OrderServiceTestCase(TestCase):
    """Unit tests for OrderService"""
    
    def setUp(self):
        self.order_service = OrderService()
        self.buyer_id = uuid.uuid4()
        self.seller_id = uuid.uuid4()
        self.product_id = uuid.uuid4()
    
    def test_create_order_success(self):
        """Test successful order creation"""
        order_data = {
            'buyer_id': self.buyer_id,
            'product_id': self.product_id,
            'quantity': 10,
        }
        
        with patch('marketplace.services.Product.objects.get') as mock_get_product:
            mock_product = MagicMock()
            mock_product.id = self.product_id
            mock_product.seller_id = self.seller_id
            mock_product.price = 100
            mock_product.quantity_available = 50
            mock_get_product.return_value = mock_product
            
            order = self.order_service.create_order(order_data)
            
            self.assertIsNotNone(order)
            self.assertEqual(order.buyer_id, self.buyer_id)
            self.assertEqual(order.quantity, 10)
            self.assertEqual(order.total_amount, 1000)
    
    def test_create_order_insufficient_stock(self):
        """Test order creation with insufficient stock"""
        order_data = {
            'buyer_id': self.buyer_id,
            'product_id': self.product_id,
            'quantity': 100,
        }
        
        with patch('marketplace.services.Product.objects.get') as mock_get_product:
            mock_product = MagicMock()
            mock_product.quantity_available = 50
            mock_get_product.return_value = mock_product
            
            with self.assertRaises(ProductOutOfStockException):
                self.order_service.create_order(order_data)
```

### Integration Testing

```python
# tests/test_integration_marketplace.py
from django.test import TestCase, TransactionTestCase
from rest_framework.test import APIClient
from rest_framework import status
from authentication.models import User
from marketplace.models import Product, Order
import uuid

class MarketplaceIntegrationTestCase(TransactionTestCase):
    """Integration tests for marketplace API"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test users
        self.seller = User.objects.create_user(
            email='seller@test.com',
            password='testpass123',
            user_type='farmer'
        )
        self.buyer = User.objects.create_user(
            email='buyer@test.com',
            password='testpass123',
            user_type='buyer'
        )
        
        # Create test product
        self.product = Product.objects.create(
            seller_id=self.seller.id,
            name='Test Tomatoes',
            price=100,
            quantity_available=50,
            unit='kg'
        )
    
    def test_complete_order_flow(self):
        """Test complete order flow from creation to completion"""
        # Authenticate as buyer
        self.client.force_authenticate(user=self.buyer)
        
        # Create order
        order_data = {
            'product_id': str(self.product.id),
            'quantity': 10
        }
        response = self.client.post('/api/v1/marketplace/orders/', order_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order_id = response.data['data']['id']
        
        # Verify order created
        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, 'pending')
        
        # Authenticate as seller
        self.client.force_authenticate(user=self.seller)
        
        # Confirm order
        response = self.client.post(f'/api/v1/marketplace/orders/{order_id}/confirm/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify order confirmed
        order.refresh_from_db()
        self.assertEqual(order.status, 'confirmed')
        
        # Verify inventory updated
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity_available, 40)
```

### API Contract Testing

```python
# tests/test_api_contracts.py
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
import json

class APIContractTestCase(TestCase):
    """Test API contracts match specifications"""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_product_list_response_schema(self):
        """Test product list endpoint returns correct schema"""
        response = self.client.get('/api/v1/marketplace/products/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Verify response structure
        self.assertIn('success', data)
        self.assertIn('data', data)
        self.assertIn('meta', data)
        self.assertIn('pagination', data)
        
        # Verify data is a list
        self.assertIsInstance(data['data'], list)
        
        # Verify product schema if products exist
        if len(data['data']) > 0:
            product = data['data'][0]
            required_fields = ['id', 'name', 'price', 'quantity_available', 'seller_id']
            for field in required_fields:
                self.assertIn(field, product)
```

### Performance Testing

```python
# tests/test_performance.py
from django.test import TestCase
from django.test.utils import override_settings
from rest_framework.test import APIClient
import time

class PerformanceTestCase(TestCase):
    """Performance tests for critical endpoints"""
    
    def setUp(self):
        self.client = APIClient()
    
    @override_settings(DEBUG=False)
    def test_product_list_performance(self):
        """Test product list endpoint responds within SLA"""
        # Create 100 test products
        # ... product creation code ...
        
        start_time = time.time()
        response = self.client.get('/api/v1/marketplace/products/')
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # Convert to ms
        
        self.assertEqual(response.status_code, 200)
        self.assertLess(response_time, 200, f"Response time {response_time}ms exceeds 200ms SLA")
```


## Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API_Gateway
    participant Auth_Service
    participant User_Service
    participant Redis

    Client->>API_Gateway: POST /api/v1/auth/login
    API_Gateway->>Auth_Service: Forward request
    Auth_Service->>Auth_Service: Validate credentials
    Auth_Service->>Redis: Check rate limit
    Redis-->>Auth_Service: Rate limit OK
    Auth_Service->>Auth_Service: Generate JWT tokens
    Auth_Service->>Redis: Store refresh token
    Auth_Service-->>API_Gateway: Return tokens
    API_Gateway-->>Client: 200 OK + tokens
    
    Client->>API_Gateway: GET /api/v1/users/profile (Bearer token)
    API_Gateway->>API_Gateway: Validate JWT
    API_Gateway->>User_Service: Forward request
    User_Service-->>API_Gateway: User profile
    API_Gateway-->>Client: 200 OK + profile
```

### JWT Token Structure

```python
# authentication/tokens.py
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta

def get_tokens_for_user(user):
    """Generate access and refresh tokens for user"""
    refresh = RefreshToken.for_user(user)
    
    # Add custom claims
    refresh['user_type'] = user.user_type
    refresh['email'] = user.email
    refresh['is_verified'] = user.is_verified
    
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'access_expires_in': int(timedelta(minutes=15).total_seconds()),
        'refresh_expires_in': int(timedelta(days=7).total_seconds()),
    }
```

### Role-Based Access Control (RBAC)

```python
# permissions.py
from rest_framework import permissions

class IsFarmer(permissions.BasePermission):
    """Permission for farmer-only endpoints"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'farmer'

class IsBuyer(permissions.BasePermission):
    """Permission for buyer-only endpoints"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'buyer'

class IsOwnerOrReadOnly(permissions.BasePermission):
    """Permission to only allow owners to edit objects"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner_id == request.user.id

class CanManageFarm(permissions.BasePermission):
    """Permission to manage farm resources"""
    def has_object_permission(self, request, view, obj):
        # Check if user owns the farm or is a farm manager
        return (
            obj.owner_id == request.user.id or
            obj.managers.filter(id=request.user.id).exists()
        )

# Usage in views
class FarmViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), CanManageFarm()]
        return super().get_permissions()
```

### Data Encryption

```python
# encryption.py
from cryptography.fernet import Fernet
from django.conf import settings
import base64

class FieldEncryption:
    """Encrypt sensitive database fields"""
    
    def __init__(self):
        self.cipher = Fernet(settings.FIELD_ENCRYPTION_KEY.encode())
    
    def encrypt(self, value):
        """Encrypt a value"""
        if value is None:
            return None
        return self.cipher.encrypt(value.encode()).decode()
    
    def decrypt(self, encrypted_value):
        """Decrypt a value"""
        if encrypted_value is None:
            return None
        return self.cipher.decrypt(encrypted_value.encode()).decode()

# Usage in models
class SensitiveData(models.Model):
    _encrypted_field = models.TextField(db_column='encrypted_field')
    
    @property
    def encrypted_field(self):
        encryptor = FieldEncryption()
        return encryptor.decrypt(self._encrypted_field)
    
    @encrypted_field.setter
    def encrypted_field(self, value):
        encryptor = FieldEncryption()
        self._encrypted_field = encryptor.encrypt(value)
```

### API Rate Limiting

```python
# throttling.py
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

class BurstRateThrottle(UserRateThrottle):
    """Allow burst of requests"""
    scope = 'burst'
    rate = '60/min'

class SustainedRateThrottle(UserRateThrottle):
    """Sustained rate limit"""
    scope = 'sustained'
    rate = '2000/hour'

class LoginRateThrottle(AnonRateThrottle):
    """Rate limit for login attempts"""
    scope = 'login'
    rate = '10/min'

# Usage in views
class LoginView(APIView):
    throttle_classes = [LoginRateThrottle]
    
    def post(self, request):
        # Login logic
        pass
```

### Input Validation and Sanitization

```python
# validators.py
from django.core.validators import RegexValidator
from rest_framework import serializers
import bleach

class PhoneNumberValidator(RegexValidator):
    """Validate phone numbers"""
    regex = r'^\+?1?\d{9,15}$'
    message = 'Phone number must be entered in the format: "+999999999". Up to 15 digits allowed.'

def sanitize_html(value):
    """Sanitize HTML input to prevent XSS"""
    allowed_tags = ['p', 'br', 'strong', 'em', 'u']
    allowed_attributes = {}
    return bleach.clean(value, tags=allowed_tags, attributes=allowed_attributes, strip=True)

class ProductSerializer(serializers.ModelSerializer):
    """Product serializer with validation"""
    
    def validate_price(self, value):
        """Validate price is positive"""
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero")
        return value
    
    def validate_description(self, value):
        """Sanitize description HTML"""
        return sanitize_html(value)
    
    def validate(self, data):
        """Cross-field validation"""
        if data.get('quantity_available', 0) < data.get('minimum_order', 0):
            raise serializers.ValidationError(
                "Quantity available must be greater than minimum order"
            )
        return data
```

### Secrets Management

```python
# secrets.py
import hvac
from django.conf import settings

class SecretsManager:
    """Manage secrets using HashiCorp Vault"""
    
    def __init__(self):
        self.client = hvac.Client(
            url=settings.VAULT_URL,
            token=settings.VAULT_TOKEN
        )
    
    def get_secret(self, path):
        """Retrieve secret from Vault"""
        try:
            secret = self.client.secrets.kv.v2.read_secret_version(path=path)
            return secret['data']['data']
        except Exception as e:
            logger.error(f"Failed to retrieve secret from {path}: {str(e)}")
            raise
    
    def set_secret(self, path, secret_data):
        """Store secret in Vault"""
        try:
            self.client.secrets.kv.v2.create_or_update_secret(
                path=path,
                secret=secret_data
            )
        except Exception as e:
            logger.error(f"Failed to store secret at {path}: {str(e)}")
            raise

# Usage
secrets_manager = SecretsManager()
database_credentials = secrets_manager.get_secret('database/postgres')
```

## Deployment Architecture

### Kubernetes Deployment

```yaml
# kubernetes/marketplace-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: marketplace-service
  namespace: agrobridge
spec:
  replicas: 3
  selector:
    matchLabels:
      app: marketplace-service
  template:
    metadata:
      labels:
        app: marketplace-service
        version: v1
    spec:
      containers:
      - name: marketplace
        image: agrobridge/marketplace-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: marketplace-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: marketplace-config
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: marketplace-service
  namespace: agrobridge
spec:
  selector:
    app: marketplace-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: marketplace-hpa
  namespace: agrobridge
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: marketplace-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: agrobridge
      POSTGRES_USER: agrobridge
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
  
  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: agrobridge
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
  
  auth-service:
    build:
      context: ./backend/authentication
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://agrobridge:${DB_PASSWORD}@postgres:5432/auth_db
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      - postgres
      - redis
    ports:
      - "8001:8000"
  
  marketplace-service:
    build:
      context: ./backend/marketplace
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://agrobridge:${DB_PASSWORD}@postgres:5432/marketplace_db
      REDIS_URL: redis://redis:6379/1
      RABBITMQ_URL: amqp://agrobridge:${RABBITMQ_PASSWORD}@rabbitmq:5672/
    depends_on:
      - postgres
      - redis
      - rabbitmq
    ports:
      - "8002:8000"
  
  api-gateway:
    image: kong:latest
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: postgres
      KONG_PG_USER: agrobridge
      KONG_PG_PASSWORD: ${DB_PASSWORD}
    depends_on:
      - postgres
    ports:
      - "8000:8000"
      - "8443:8443"
      - "8001:8001"

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Microservices

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install -r requirements-dev.txt
    
    - name: Run linting
      run: |
        flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
        black --check .
    
    - name: Run tests
      run: |
        pytest --cov=. --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
  
  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ghcr.io/${{ github.repository }}/marketplace-service:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to Kubernetes
      uses: azure/k8s-deploy@v4
      with:
        manifests: |
          kubernetes/marketplace-deployment.yaml
        images: |
          ghcr.io/${{ github.repository }}/marketplace-service:${{ github.sha }}
        kubectl-version: 'latest'
```


## Monitoring and Observability

### Logging Strategy

```python
# logging_config.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """Format logs as JSON for structured logging"""
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'service': 'marketplace-service',
            'environment': settings.ENVIRONMENT,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        if hasattr(record, 'duration_ms'):
            log_data['duration_ms'] = record.duration_ms
        
        return json.dumps(log_data)

# Django settings
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'logging_config.JSONFormatter',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/agrobridge/marketplace.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'json',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'marketplace': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
```

### Request Logging Middleware

```python
# middleware.py
import logging
import time
import uuid
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(MiddlewareMixin):
    """Log all requests with timing and context"""
    
    def process_request(self, request):
        request.request_id = str(uuid.uuid4())
        request.start_time = time.time()
        
        # Log incoming request
        logger.info(
            'Incoming request',
            extra={
                'request_id': request.request_id,
                'method': request.method,
                'path': request.path,
                'user_id': str(request.user.id) if request.user.is_authenticated else None,
                'ip_address': self.get_client_ip(request),
            }
        )
    
    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration_ms = (time.time() - request.start_time) * 1000
            
            # Log response
            logger.info(
                'Request completed',
                extra={
                    'request_id': getattr(request, 'request_id', None),
                    'method': request.method,
                    'path': request.path,
                    'status_code': response.status_code,
                    'duration_ms': round(duration_ms, 2),
                    'user_id': str(request.user.id) if request.user.is_authenticated else None,
                }
            )
        
        # Add request ID to response headers
        if hasattr(request, 'request_id'):
            response['X-Request-ID'] = request.request_id
        
        return response
    
    @staticmethod
    def get_client_ip(request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
```

### Distributed Tracing

```python
# tracing.py
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.django import DjangoInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

def setup_tracing(service_name):
    """Setup distributed tracing with Jaeger"""
    resource = Resource(attributes={
        SERVICE_NAME: service_name
    })
    
    provider = TracerProvider(resource=resource)
    
    jaeger_exporter = JaegerExporter(
        agent_host_name='jaeger',
        agent_port=6831,
    )
    
    processor = BatchSpanProcessor(jaeger_exporter)
    provider.add_span_processor(processor)
    
    trace.set_tracer_provider(provider)
    
    # Instrument Django and requests
    DjangoInstrumentor().instrument()
    RequestsInstrumentor().instrument()

# Usage in Django settings
setup_tracing('marketplace-service')

# Manual tracing
tracer = trace.get_tracer(__name__)

def process_order(order_id):
    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order.id", str(order_id))
        
        # Business logic
        with tracer.start_as_current_span("validate_order"):
            validate_order(order_id)
        
        with tracer.start_as_current_span("update_inventory"):
            update_inventory(order_id)
        
        span.set_attribute("order.status", "completed")
```

### Metrics Collection

```python
# metrics.py
from prometheus_client import Counter, Histogram, Gauge
from django.conf import settings

# Define metrics
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

active_users = Gauge(
    'active_users_total',
    'Number of active users'
)

order_count = Counter(
    'orders_total',
    'Total orders created',
    ['status']
)

# Middleware to collect metrics
class MetricsMiddleware(MiddlewareMixin):
    """Collect Prometheus metrics"""
    
    def process_request(self, request):
        request._metrics_start_time = time.time()
    
    def process_response(self, request, response):
        if hasattr(request, '_metrics_start_time'):
            duration = time.time() - request._metrics_start_time
            
            request_count.labels(
                method=request.method,
                endpoint=request.path,
                status=response.status_code
            ).inc()
            
            request_duration.labels(
                method=request.method,
                endpoint=request.path
            ).observe(duration)
        
        return response

# Expose metrics endpoint
from django.http import HttpResponse
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

def metrics_view(request):
    """Prometheus metrics endpoint"""
    return HttpResponse(
        generate_latest(),
        content_type=CONTENT_TYPE_LATEST
    )
```

### Health Checks

```python
# health.py
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import redis

def health_check(request):
    """Basic health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'marketplace-service',
        'version': '1.0.0'
    })

def readiness_check(request):
    """Readiness check with dependency verification"""
    checks = {
        'database': check_database(),
        'cache': check_cache(),
        'message_queue': check_message_queue(),
    }
    
    all_healthy = all(checks.values())
    status_code = 200 if all_healthy else 503
    
    return JsonResponse({
        'status': 'ready' if all_healthy else 'not_ready',
        'checks': checks
    }, status=status_code)

def check_database():
    """Check database connectivity"""
    try:
        connection.ensure_connection()
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return False

def check_cache():
    """Check Redis connectivity"""
    try:
        cache.set('health_check', 'ok', 10)
        return cache.get('health_check') == 'ok'
    except Exception as e:
        logger.error(f"Cache health check failed: {str(e)}")
        return False

def check_message_queue():
    """Check RabbitMQ connectivity"""
    try:
        # Implement RabbitMQ connection check
        return True
    except Exception as e:
        logger.error(f"Message queue health check failed: {str(e)}")
        return False
```

### Alerting Configuration

```yaml
# prometheus/alerts.yml
groups:
  - name: agrobridge_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} for {{ $labels.service }}"
      
      # High response time
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"
      
      # Service down
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "{{ $labels.service }} has been down for more than 1 minute"
      
      # Database connection issues
      - alert: DatabaseConnectionIssues
        expr: |
          rate(database_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database connection issues"
          description: "High rate of database errors: {{ $value }}"
      
      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"
      
      # High CPU usage
      - alert: HighCPUUsage
        expr: |
          rate(container_cpu_usage_seconds_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value | humanizePercentage }}"
```

## Performance Optimization

### Database Optimization

```python
# optimization.py
from django.db import models
from django.core.cache import cache

class OptimizedQueryMixin:
    """Mixin for optimized database queries"""
    
    @classmethod
    def get_with_cache(cls, cache_key, pk, timeout=300):
        """Get object with caching"""
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        obj = cls.objects.get(pk=pk)
        cache.set(cache_key, obj, timeout)
        return obj
    
    @classmethod
    def bulk_create_optimized(cls, objects, batch_size=1000):
        """Optimized bulk create"""
        return cls.objects.bulk_create(objects, batch_size=batch_size)
    
    @classmethod
    def bulk_update_optimized(cls, objects, fields, batch_size=1000):
        """Optimized bulk update"""
        return cls.objects.bulk_update(objects, fields, batch_size=batch_size)

# Query optimization examples
class ProductQuerySet(models.QuerySet):
    """Optimized product queries"""
    
    def with_seller_info(self):
        """Prefetch seller information"""
        return self.select_related('seller')
    
    def with_images(self):
        """Prefetch product images"""
        return self.prefetch_related('images')
    
    def active_products(self):
        """Filter active products"""
        return self.filter(is_active=True)
    
    def search(self, query):
        """Full-text search"""
        return self.filter(
            models.Q(name__icontains=query) |
            models.Q(description__icontains=query)
        )

class Product(models.Model):
    objects = ProductQuerySet.as_manager()
    
    # ... model fields ...
    
    class Meta:
        indexes = [
            models.Index(fields=['name', 'category']),
            models.Index(fields=['seller_id', 'is_active']),
            models.Index(fields=['-created_at']),
        ]
```

### Caching Strategy

```python
# caching.py
from django.core.cache import cache
from functools import wraps
import hashlib
import json

def cache_result(timeout=300, key_prefix=''):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{hash_args(args, kwargs)}"
            
            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache result
            cache.set(cache_key, result, timeout)
            return result
        return wrapper
    return decorator

def hash_args(args, kwargs):
    """Generate hash from function arguments"""
    key_data = json.dumps({'args': args, 'kwargs': kwargs}, sort_keys=True)
    return hashlib.md5(key_data.encode()).hexdigest()

# Usage
@cache_result(timeout=600, key_prefix='product')
def get_product_details(product_id):
    return Product.objects.get(id=product_id)

# Cache invalidation
def invalidate_product_cache(product_id):
    """Invalidate product cache"""
    cache_pattern = f"product:get_product_details:*{product_id}*"
    cache.delete_pattern(cache_pattern)
```

### API Response Optimization

```python
# serializers.py
from rest_framework import serializers

class OptimizedProductSerializer(serializers.ModelSerializer):
    """Optimized product serializer"""
    
    # Use SerializerMethodField sparingly (they're slow)
    seller_name = serializers.CharField(source='seller.name', read_only=True)
    
    # Prefetch images
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'seller_name', 'images']
    
    def get_images(self, obj):
        # Use prefetched data
        if hasattr(obj, '_prefetched_objects_cache') and 'images' in obj._prefetched_objects_cache:
            return [img.image_url for img in obj.images.all()]
        return []

# Pagination for large datasets
from rest_framework.pagination import CursorPagination

class ProductCursorPagination(CursorPagination):
    """Cursor-based pagination for better performance"""
    page_size = 20
    ordering = '-created_at'
    cursor_query_param = 'cursor'
```

---

## Summary

This design document provides a comprehensive blueprint for implementing the AgroBridge backend microservices architecture. Key highlights include:

1. **22 Microservices** organized in 4 layers (Core, Business, Advanced, Infrastructure)
2. **Multiple Database Technologies** (PostgreSQL, MongoDB, Redis, TimescaleDB, Elasticsearch)
3. **Event-Driven Architecture** with RabbitMQ for asynchronous communication
4. **Comprehensive Security** with JWT authentication, RBAC, encryption, and secrets management
5. **Production-Ready Infrastructure** with Kubernetes, Docker, and CI/CD pipelines
6. **Full Observability** with structured logging, distributed tracing, and metrics
7. **Performance Optimization** through caching, query optimization, and CDN integration
8. **Robust Testing Strategy** covering unit, integration, contract, and performance tests

The architecture is designed to be scalable, resilient, and maintainable while supporting the diverse needs of African agricultural stakeholders.
