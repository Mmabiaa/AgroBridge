# User Service

The User Service handles user profile management, preferences, user discovery, and GDPR compliance features for the AgroBridge platform.

## Features

### 1. User Profile Management
- **Profile Creation**: Automatically created when users register
- **Profile Updates**: Users can update personal information, location, and agricultural details
- **Avatar Upload**: Support for profile picture uploads with validation
- **Privacy Controls**: Users can control profile visibility and information sharing

### 2. User Preferences
- **Notification Settings**: Email, SMS, and push notification preferences
- **Display Preferences**: Language, timezone, and currency settings
- **Privacy Preferences**: Data sharing and consent management
- **Do Not Disturb**: Configurable quiet hours

### 3. User Discovery & Search
- **Advanced Search**: Search users by name, location, role, and specialization
- **Filtering**: Filter by experience level, location, and agricultural focus
- **Public Profiles**: View public profile information
- **Privacy Respect**: Honors user privacy settings

### 4. GDPR Compliance
- **Data Export**: Users can request full or partial data exports
- **Data Deletion**: Users can request account and data deletion
- **Consent Management**: Track and manage user consents
- **Audit Logging**: Complete activity tracking for compliance

### 5. Activity Tracking
- **User Activities**: Track login, profile updates, and other actions
- **Security Monitoring**: IP address and user agent logging
- **Audit Trail**: Complete history for security and compliance

## API Endpoints

### Profile Management
- `GET /api/users/profile/` - Get current user's profile
- `PUT /api/users/profile/` - Update current user's profile
- `POST /api/users/upload-avatar/` - Upload profile picture

### Preferences
- `GET /api/users/preferences/` - Get user preferences
- `PUT /api/users/preferences/` - Update user preferences

### User Discovery
- `GET /api/users/search/` - Search and discover users
- `GET /api/users/public/{user_id}/` - Get public profile

### Activity & History
- `GET /api/users/activities/` - Get user activity history

### GDPR Compliance
- `POST /api/users/export/request/` - Request data export
- `GET /api/users/export/requests/` - Get export request status
- `POST /api/users/deletion/request/` - Request data deletion
- `GET /api/users/deletion/requests/` - Get deletion request status

### Health Check
- `GET /api/users/health/` - Service health check

## Models

### UserProfile
Extended user profile with agricultural and location information:
- Personal information (name, bio, avatar)
- Location data (address, coordinates)
- Agricultural details (experience, specialization, farm size)
- Social links and website
- Privacy settings

### UserPreferences
User notification and display preferences:
- Notification settings (email, SMS, push)
- Specific notification types (marketplace, farm alerts, etc.)
- Display preferences (language, timezone, currency)
- Privacy and consent settings
- Do Not Disturb configuration

### UserActivity
Activity tracking for audit and security:
- Activity types (login, profile updates, etc.)
- IP address and user agent tracking
- Timestamps and descriptions

### DataExportRequest
GDPR data export requests:
- Export types (full, profile, activity)
- Processing status and file paths
- Expiration dates for downloads

### DataDeletionRequest
GDPR data deletion requests:
- Deletion options (profile, activity, content)
- Approval workflow
- Processing status and admin notes

## Management Commands

### Process Data Exports
```bash
python manage.py process_data_exports
python manage.py process_data_exports --request-id <uuid>
```

### Process Data Deletions
```bash
python manage.py process_data_deletions
python manage.py process_data_deletions --request-id <uuid>
python manage.py process_data_deletions --dry-run
```

## Service Registration

The User Service automatically registers with Consul when `REGISTER_SERVICES=true` is set in environment variables.

### Manual Registration
```bash
cd backend/users
python service_registration.py register
python service_registration.py deregister
python service_registration.py health
```

## Configuration

### Environment Variables
- `USER_SERVICE_HOST` - Service host (default: localhost)
- `USER_SERVICE_PORT` - Service port (default: 8001)
- `CONSUL_URL` - Consul server URL (default: http://localhost:8500)
- `REGISTER_SERVICES` - Auto-register with Consul (default: false)

### Django Settings
The service integrates with Django settings for:
- Database configuration
- Media file handling
- Authentication settings
- Cache configuration

## Testing

Run the comprehensive test suite:

```bash
# Run all user service tests
python manage.py test users

# Run specific test classes
python manage.py test users.tests.UserProfileModelTest
python manage.py test users.tests.UserServiceAPITest
python manage.py test users.tests.GDPRComplianceTest

# Run with coverage
coverage run --source='.' manage.py test users
coverage report -m
```

## Security Features

### Data Protection
- Input validation and sanitization
- File upload security (type and size validation)
- SQL injection prevention through ORM
- XSS protection through serializers

### Privacy Controls
- Profile visibility settings (public, friends, private)
- Granular information sharing controls
- Location data protection
- Contact information privacy

### Audit & Compliance
- Complete activity logging
- IP address tracking
- User agent logging
- GDPR compliance features

## Performance Considerations

### Database Optimization
- Indexed fields for common queries
- Efficient query patterns with select_related
- Pagination for large result sets
- Optimized search queries

### Caching Strategy
- Profile data caching
- Search result caching
- Activity data optimization
- Media file CDN integration

### Scalability
- Stateless service design
- Horizontal scaling support
- Database connection pooling
- Async task processing for exports

## Integration Points

### Authentication Service
- User model integration
- JWT token validation
- Permission checking

### Notification Service
- Activity notifications
- GDPR request notifications
- Privacy setting updates

### File Storage Service
- Avatar upload handling
- Export file storage
- Media file management

### Analytics Service
- User behavior tracking
- Profile completion metrics
- Search analytics

## Monitoring & Health Checks

### Health Check Endpoint
The service provides comprehensive health checks:
- Database connectivity
- Cache availability
- Model accessibility
- Service status

### Metrics
- Profile completion rates
- Search query performance
- Export request processing
- User activity patterns

### Logging
- Structured logging for all operations
- Error tracking and alerting
- Performance monitoring
- Security event logging

## Development

### Local Development
1. Ensure Django is configured
2. Run migrations: `python manage.py migrate users`
3. Create test data: `python manage.py shell`
4. Start development server
5. Access API at `/api/users/`

### Testing
- Unit tests for all models and views
- Integration tests for API endpoints
- GDPR compliance testing
- Performance testing for search

### Code Quality
- Type hints for better code clarity
- Comprehensive docstrings
- PEP 8 compliance
- Security best practices

## Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Media storage configured
- [ ] Service registration enabled
- [ ] Health checks configured
- [ ] Monitoring setup
- [ ] Backup procedures in place
- [ ] GDPR compliance verified

### Docker Support
The service includes Docker configuration for containerized deployment with proper health checks and service discovery integration.