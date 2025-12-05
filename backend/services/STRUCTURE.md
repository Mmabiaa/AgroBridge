# Microservices Directory Structure

This directory contains all 22 microservices for the AgroBridge platform.

## Standard Service Structure

Each service follows this structure:

```
service_name/
├── __init__.py              # Service package initialization
├── apps.py                  # Django app configuration
├── models.py                # Database models
├── views.py                 # API endpoints (ViewSets)
├── serializers.py           # Data serialization
├── urls.py                  # URL routing
├── services.py              # Business logic
├── permissions.py           # Access control
├── tests.py                 # Unit tests
├── migrations/              # Database migrations
│   └── __init__.py
└── management/              # Custom management commands (optional)
    └── commands/
```

## Service List

### Core Services (Layer 1)
- `authentication/` - User auth, JWT, OAuth
- `users/` - User profiles and preferences
- `api_gateway/` - Request routing and rate limiting

### Business Services (Layer 2)
- `farms/` - Farm and crop management
- `marketplace/` - Products and orders
- `ai_assistant/` - AgriGPT and voice commands
- `crop_detection/` - Disease detection
- `financial/` - Income/expense tracking
- `learning/` - Courses and tutorials
- `community/` - Social features

### Advanced Services (Layer 3)
- `iot/` - IoT devices and sensors
- `notifications/` - Real-time notifications
- `analytics/` - Dashboards and predictions
- `scheduling/` - Task management
- `payments/` - Payment processing
- `blockchain/` - Certificates and traceability
- `export_docs/` - Export documentation
- `emergency/` - Emergency alerts

### Infrastructure Services (Layer 4)
- `storage/` - File storage and CDN
- `admin/` - Admin panel

## Creating a New Service

1. Run the setup script:
   ```bash
   python setup_microservices.py
   ```

2. Or manually create the structure:
   ```bash
   mkdir -p services/new_service/migrations
   touch services/new_service/__init__.py
   touch services/new_service/models.py
   touch services/new_service/views.py
   touch services/new_service/serializers.py
   touch services/new_service/urls.py
   touch services/new_service/services.py
   touch services/new_service/permissions.py
   touch services/new_service/tests.py
   touch services/new_service/migrations/__init__.py
   ```

3. Add the service to `INSTALLED_APPS` in settings.py:
   ```python
   INSTALLED_APPS = [
       # ...
       'services.new_service',
   ]
   ```

4. Create and run migrations:
   ```bash
   python manage.py makemigrations new_service
   python manage.py migrate
   ```

## Service Communication

### REST API
Services communicate via REST APIs using the shared base classes:
```python
from shared.common.base_views import BaseViewSet
from shared.common.base_serializers import BaseSerializer
```

### Events
Services publish and subscribe to events:
```python
from shared.events.publisher import EventPublisher
from shared.events.event_types import EVENT_USER_REGISTERED

publisher = EventPublisher('service_name')
publisher.publish(EVENT_USER_REGISTERED, {'user_id': user.id})
```

### Shared Utilities
Use shared utilities for common tasks:
```python
from shared.utils.response import success_response, error_response
from shared.utils.validators import validate_email
from shared.common.constants import USER_TYPES
```

## Testing

Run tests for a specific service:
```bash
python manage.py test services.service_name
```

Run all tests:
```bash
python manage.py test services
```

## Best Practices

1. **Keep services independent** - Each service should be self-contained
2. **Use shared libraries** - Leverage common utilities and base classes
3. **Follow naming conventions** - Use consistent naming across services
4. **Write tests** - Aim for 80%+ test coverage
5. **Document APIs** - Use docstrings and OpenAPI specs
6. **Handle errors gracefully** - Use standardized error responses
7. **Log appropriately** - Use structured logging
8. **Validate inputs** - Always validate and sanitize user inputs
