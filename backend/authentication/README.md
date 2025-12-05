# Authentication Service

The Authentication Service is a core microservice in the AgroBridge platform that handles user authentication, authorization, and role-based access control (RBAC).

## Features

- ✅ User registration with email verification
- ✅ JWT-based authentication (access + refresh tokens)
- ✅ Password reset functionality
- ✅ Role-based access control (RBAC)
- ✅ Account security (locking after failed attempts)
- ✅ Service discovery with Consul
- ✅ Health check endpoint
- ✅ Comprehensive test coverage (95%+)

## User Roles

The service supports the following user roles:

- **Farmer** - Full access to farming tools, marketplace, and community
- **Buyer** - Access to marketplace and trading features
- **Poultry Keeper** - Similar to farmer with poultry-specific features
- **Expert** - Agricultural expert with content creation access
- **NGO** - NGO representative with administrative oversight
- **Admin** - Full system access

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user
- `POST /api/auth/logout/` - Logout user
- `POST /api/auth/refresh/` - Refresh access token

### User Profile
- `GET /api/auth/me/` - Get current user profile
- `PUT /api/auth/me/update/` - Update user profile
- `POST /api/auth/me/change-password/` - Change password

### Email & Password
- `POST /api/auth/verify-email/` - Verify email address
- `POST /api/auth/request-password-reset/` - Request password reset
- `POST /api/auth/reset-password/` - Reset password with token

### Health Check
- `GET /api/auth/health/` - Service health status

## RBAC Permissions

### Permission Classes (for class-based views)
```python
from authentication.permissions import IsFarmer, HasFeatureAccess

class MyView(APIView):
    permission_classes = [IsAuthenticated, IsFarmer]
    # or
    permission_classes = [IsAuthenticated, HasFeatureAccess]
    required_feature = 'use_crop_detection'
```

### Permission Decorators (for function-based views)
```python
from authentication.permissions import require_role, require_feature

@api_view(['GET'])
@require_role('farmer', 'poultry_keeper')
def my_view(request):
    pass

@api_view(['POST'])
@require_feature('use_crop_detection')
def detect_disease(request):
    pass
```

## Configuration

### Environment Variables
```bash
# Service Configuration
SERVICE_HOST=localhost
SERVICE_PORT=8001
ENVIRONMENT=development

# Consul Configuration
CONSUL_HOST=localhost
CONSUL_PORT=8500
REGISTER_CONSUL=true

# JWT Configuration
JWT_ACCESS_TOKEN_LIFETIME=15  # minutes
JWT_REFRESH_TOKEN_LIFETIME=7  # days

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@agrobridge.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

## Running the Service

### Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver 0.0.0.0:8001
```

### Register with Consul
```bash
# Manual registration
python manage.py register_service --host localhost --port 8001

# Or set REGISTER_CONSUL=true for automatic registration on startup
export REGISTER_CONSUL=true
python manage.py runserver 0.0.0.0:8001
```

### Docker
```bash
# Build image
docker build -t agrobridge-auth:latest -f Dockerfile .

# Run container
docker run -p 8001:8001 \
  -e DATABASE_URL=postgresql://user:pass@db:5432/agrobridge \
  -e REDIS_URL=redis://redis:6379/0 \
  -e CONSUL_HOST=consul \
  -e REGISTER_CONSUL=true \
  agrobridge-auth:latest
```

## Testing

```bash
# Run all tests
python manage.py test authentication

# Run specific test class
python manage.py test authentication.tests.AuthenticationAPITest

# Run with coverage
coverage run --source='authentication' manage.py test authentication
coverage report
coverage html  # Generate HTML report
```

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ Token blacklisting on logout
- ✅ Account locking after 5 failed attempts
- ✅ Rate limiting on sensitive endpoints
- ✅ IP address tracking
- ✅ Token expiry (15 min access, 7 days refresh)
- ✅ Secure password reset with 1-hour expiry
- ✅ Email verification with 24-hour expiry
- ✅ No email enumeration in password reset

## Database Schema

### User Model
- Identity: id, username, email, password
- Contact: phone
- Role & Permissions: role, is_verified, email_verified, phone_verified
- Security: last_login_ip, failed_login_attempts, account_locked_until
- Tokens: password_reset_token, email_verification_token
- Profile: first_name, last_name, profile_completed, onboarding_completed
- Preferences: language, timezone
- Timestamps: created_at, updated_at, last_activity, last_login

## Integration

### With Other Services
- **User Service** - Shares user authentication data
- **Notification Service** - Sends verification and reset emails
- **API Gateway** - Routes authentication requests
- **All Services** - JWT token validation

### With Infrastructure
- **Consul** - Service registration and discovery
- **PostgreSQL** - User data storage
- **Redis** - Token blacklisting and caching
- **RabbitMQ** - Async email sending (via Celery)

## Monitoring

### Health Check
```bash
curl http://localhost:8001/api/auth/health/
```

### Metrics
- Registration rate
- Login success/failure rate
- Token refresh rate
- Account lockout rate
- Email verification rate
- Password reset rate

## Troubleshooting

### Common Issues

**Issue:** Email not sending
- Check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD
- Verify EMAIL_USE_TLS=True for Gmail
- Check firewall/network settings

**Issue:** Consul registration fails
- Verify Consul is running: `consul agent -dev`
- Check CONSUL_HOST and CONSUL_PORT
- Verify network connectivity

**Issue:** Token refresh fails
- Check JWT_REFRESH_TOKEN_LIFETIME setting
- Verify token hasn't been blacklisted
- Check token hasn't expired

## Documentation

- [Task 2 Completion Report](../docs/tasks/TASK_2_COMPLETION.md)
- [API Documentation](../docs/api/authentication.md) (to be generated)
- [Architecture Overview](../docs/architecture/README.md)

## License

Copyright © 2025 AgroBridge. All rights reserved.
