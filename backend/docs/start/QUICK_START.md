# AgroBridge Microservices - Quick Start Guide

## Prerequisites

- Python 3.10 or higher
- pip (Python package manager)
- Git

## Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd agrobridge/backend
```

### 2. Set Up Virtual Environment

**Windows (PowerShell):**
```powershell
.\setup_venv.ps1
```

**Linux/Mac:**
```bash
chmod +x setup_venv.sh
./setup_venv.sh
```

### 3. Activate Virtual Environment

**Windows:**
```powershell
venv\Scripts\Activate.ps1
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 4. Create Service Structures (Optional)
If you need to create new services:
```bash
python setup_microservices.py
```

## Project Structure

```
backend/
├── services/           # All 22 microservices
│   ├── authentication/ # User auth and JWT
│   ├── users/         # User profiles
│   ├── farms/         # Farm management
│   ├── marketplace/   # Products and orders
│   ├── ai_assistant/  # AgriGPT
│   ├── crop_detection/# Disease detection
│   ├── financial/     # Financial tracking
│   ├── learning/      # Courses
│   ├── community/     # Social features
│   ├── iot/          # IoT devices
│   ├── notifications/ # Real-time notifications
│   ├── analytics/     # Dashboards
│   ├── scheduling/    # Task management
│   ├── payments/      # Payment processing
│   ├── blockchain/    # Certificates
│   ├── export_docs/   # Export documentation
│   ├── emergency/     # Emergency alerts
│   ├── storage/       # File storage
│   └── admin/         # Admin panel
│
└── shared/            # Shared libraries
    ├── common/        # Base classes and constants
    ├── events/        # Event system
    ├── utils/         # Utilities
    └── middleware/    # Custom middleware
```

## Using Shared Libraries

### Base Models
```python
from shared.common.base_models import BaseModel

class MyModel(BaseModel):
    name = models.CharField(max_length=100)
    # Inherits: id, created_at, updated_at
```

### Base Views
```python
from shared.common.base_views import BaseViewSet

class MyViewSet(BaseViewSet):
    def list(self, request):
        data = {'items': []}
        return self.create_response(data=data)
```

### Constants
```python
from shared.common.constants import USER_TYPES, ORDER_STATUSES

user_type = USER_TYPES[0][0]  # 'farmer'
```

### Events
```python
from shared.events.publisher import EventPublisher
from shared.events.event_types import EVENT_USER_REGISTERED

publisher = EventPublisher('my_service')
publisher.publish(EVENT_USER_REGISTERED, {'user_id': str(user.id)})
```

### Responses
```python
from shared.utils.response import success_response, error_response

# Success
return success_response(data={'user': user_data})

# Error
return error_response(
    error_type='validation_error',
    title='Invalid Input',
    detail='Email is required'
)
```

### Validators
```python
from shared.utils.validators import validate_email, validate_phone_number

if not validate_email(email):
    raise ValidationError('Invalid email format')
```

## Running the Application

### Development Server
```bash
python manage.py runserver
```

### Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Create Superuser
```bash
python manage.py createsuperuser
```

### Run Tests
```bash
# All tests
python manage.py test

# Specific service
python manage.py test services.authentication

# With coverage
coverage run --source='.' manage.py test
coverage report
```

## API Standards

### Request Format
```
GET /api/v1/users/
Authorization: Bearer <token>
```

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe"
  },
  "meta": {
    "timestamp": "2025-12-03T10:00:00Z",
    "version": "v1"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "type": "validation_error",
    "title": "Invalid Input",
    "status": 400,
    "detail": "Email format is invalid"
  },
  "meta": {
    "timestamp": "2025-12-03T10:00:00Z"
  }
}
```

## Common Commands

### Create a New Service
```bash
# Edit setup_microservices.py to add your service
python setup_microservices.py
```

### Install New Dependencies
```bash
# Add to requirements.txt or shared/requirements.txt
pip install -r requirements.txt
```

### Database Operations
```bash
# Create migrations
python manage.py makemigrations service_name

# Apply migrations
python manage.py migrate

# Show migrations
python manage.py showmigrations

# Rollback migration
python manage.py migrate service_name 0001
```

### Shell Access
```bash
# Django shell
python manage.py shell

# Database shell
python manage.py dbshell
```

## Troubleshooting

### Virtual Environment Issues
```bash
# Deactivate
deactivate

# Remove and recreate
rm -rf venv
python -m venv venv
```

### Import Errors
Make sure the virtual environment is activated and all dependencies are installed:
```bash
pip install -r requirements.txt
pip install -r shared/requirements.txt
```

### Database Connection Issues
Check your database settings in `settings.py` and ensure the database server is running.

## Documentation

- **Architecture**: See `MICROSERVICES_ARCHITECTURE.md`
- **Task Completion**: See `TASK_1_COMPLETION.md`
- **Service Structure**: See `services/STRUCTURE.md`
- **Service List**: See `services/README.md`

## Next Steps

1. Review the architecture documentation
2. Explore the shared libraries
3. Start implementing your service
4. Write tests
5. Document your APIs

## Getting Help

- Check the documentation files
- Review existing service implementations
- Look at the shared library examples
- Consult the Django REST Framework documentation

## Best Practices

1. ✅ Use shared base classes
2. ✅ Follow the standard service structure
3. ✅ Write tests for all functionality
4. ✅ Use standardized responses
5. ✅ Validate all inputs
6. ✅ Log appropriately
7. ✅ Handle errors gracefully
8. ✅ Document your code
9. ✅ Keep services independent
10. ✅ Use events for inter-service communication
