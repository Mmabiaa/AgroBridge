# Admin Service

Comprehensive administrative service for the AgroBridge platform providing user management, content moderation, system configuration, security monitoring, and analytics.

## Features

### 1. User Management (Requirement 17.2)
- User listing and search
- User activation/deactivation
- Role assignment and management
- User activity tracking
- User statistics and analytics

### 2. Content Moderation (Requirement 17.3)
- Moderation queue management
- Bulk moderation actions
- Automated content flagging
- Review workflow
- Moderation statistics

### 3. System Configuration (Requirement 17.4)
- Configuration key-value store
- Category-based organization
- Sensitive value protection
- Runtime configuration changes
- Configuration history tracking

### 4. Feature Flags (Requirement 17.4)
- Feature toggle management
- Gradual rollout support
- User targeting
- A/B testing capabilities
- Rollout percentage control

### 5. Analytics Dashboards (Requirement 17.5)
- Platform usage metrics
- User growth analytics
- Performance metrics
- Error rate tracking
- Real-time dashboards

### 6. Security Monitoring (Requirement 17.6)
- Security incident tracking
- Failed login monitoring
- Threat detection
- Incident investigation tools
- Security statistics

### 7. Audit Logging (Requirement 17.7, 29.5)
- Comprehensive action logging
- User activity tracking
- Change history
- Audit log search and export
- Compliance reporting

## API Endpoints

### User Management
```
GET    /api/admin/users/                    - List users
GET    /api/admin/users/{id}/               - Get user details
POST   /api/admin/users/{id}/activate/      - Activate user
POST   /api/admin/users/{id}/deactivate/    - Deactivate user
POST   /api/admin/users/{id}/update_role/   - Update user role
GET    /api/admin/users/{id}/activity_log/  - Get user activity
GET    /api/admin/users/statistics/         - Get user statistics
```

### System Configuration
```
GET    /api/admin/config/                   - List configurations
POST   /api/admin/config/                   - Create configuration
GET    /api/admin/config/{id}/              - Get configuration
PUT    /api/admin/config/{id}/              - Update configuration
DELETE /api/admin/config/{id}/              - Delete configuration
GET    /api/admin/config/categories/        - List categories
```

### Feature Flags
```
GET    /api/admin/feature-flags/            - List feature flags
POST   /api/admin/feature-flags/            - Create feature flag
GET    /api/admin/feature-flags/{id}/       - Get feature flag
PUT    /api/admin/feature-flags/{id}/       - Update feature flag
POST   /api/admin/feature-flags/{id}/toggle/ - Toggle flag
POST   /api/admin/feature-flags/{id}/add_users/ - Add target users
```

### Content Moderation
```
GET    /api/admin/moderation/               - List moderation queue
GET    /api/admin/moderation/{id}/          - Get moderation item
POST   /api/admin/moderation/{id}/moderate/ - Moderate item
POST   /api/admin/moderation/bulk_moderate/ - Bulk moderation
GET    /api/admin/moderation/statistics/    - Moderation statistics
```

### Audit Logs
```
GET    /api/admin/audit-logs/               - List audit logs
GET    /api/admin/audit-logs/{id}/          - Get audit log
GET    /api/admin/audit-logs/export/        - Export audit logs
```

### Security Incidents
```
GET    /api/admin/security/                 - List incidents
POST   /api/admin/security/                 - Create incident
GET    /api/admin/security/{id}/            - Get incident
PUT    /api/admin/security/{id}/            - Update incident
POST   /api/admin/security/{id}/assign/     - Assign incident
POST   /api/admin/security/{id}/resolve/    - Resolve incident
GET    /api/admin/security/statistics/      - Security statistics
```

### Platform Metrics
```
GET    /api/admin/metrics/                  - List metrics
GET    /api/admin/metrics/latest/           - Get latest metrics
```

### Dashboard
```
GET    /api/admin/dashboard/overview/       - Dashboard overview
GET    /api/admin/dashboard/user_growth/    - User growth data
GET    /api/admin/dashboard/platform_health/ - Platform health
GET    /api/admin/dashboard/error_rates/    - Error rates
```

## Models

### SystemConfiguration
- System-wide configuration settings
- Category-based organization
- Sensitive value protection
- Change tracking

### FeatureFlag
- Feature toggle management
- Gradual rollout support
- User targeting
- Rollout percentage

### ModerationQueue
- Content moderation queue
- Multiple content types
- Priority-based ordering
- Review workflow

### AuditLog
- Comprehensive audit logging
- Action tracking
- Change history
- IP and user agent tracking

### SecurityIncident
- Security incident tracking
- Severity levels
- Investigation workflow
- Resolution tracking

### PlatformMetrics
- Platform metrics storage
- Time-series data
- Category-based organization
- Aggregated statistics

### UserActivity
- User activity tracking
- Activity type classification
- IP and user agent logging
- Analytics support

## Management Commands

### Collect Platform Metrics
```bash
python manage.py collect_platform_metrics
```
Collects and stores platform metrics including user counts, content statistics, and system health indicators.

### Cleanup Old Logs
```bash
python manage.py cleanup_old_logs --days 90 --metrics-days 365
```
Cleans up old audit logs, user activity, and metrics based on retention policies.

### Generate Admin Report
```bash
python manage.py generate_admin_report --days 7
```
Generates a comprehensive admin report with user statistics, moderation stats, security incidents, and platform health.

## Services

### UserManagementService
- User activation/deactivation
- Role management
- User statistics
- Activity tracking

### ModerationService
- Content moderation
- Bulk operations
- Moderation statistics
- Workflow management

### SecurityMonitoringService
- Security incident tracking
- Failed login monitoring
- Threat detection
- Security statistics

### AnalyticsService
- Dashboard overview
- User growth analytics
- Platform health monitoring
- Error rate tracking

## Permissions

### IsAdminOrReadOnly
- Read access for authenticated users
- Write access for admin users

### IsSuperAdmin
- Full access for superadmin users only

### CanModerateContent
- Access for staff and admin role users

## Usage Examples

### Activate a User
```python
from admin_service.services import UserManagementService

result = UserManagementService.activate_user(user, admin_user)
```

### Moderate Content
```python
from admin_service.services import ModerationService

result = ModerationService.moderate_content(
    item, 'approve', moderator, 'Looks good'
)
```

### Track Failed Login
```python
from admin_service.services import SecurityMonitoringService

SecurityMonitoringService.track_failed_login(
    user, ip_address, user_agent
)
```

### Get Dashboard Overview
```python
from admin_service.services import AnalyticsService

overview = AnalyticsService.get_dashboard_overview()
```

## Configuration

Add to `INSTALLED_APPS` in settings.py:
```python
INSTALLED_APPS = [
    ...
    'admin_service',
]
```

Add to URL configuration:
```python
urlpatterns = [
    ...
    path('api/admin/', include('admin_service.urls')),
]
```

## Testing

Run tests:
```bash
python manage.py test admin_service
```

Run specific test:
```bash
python manage.py test admin_service.tests.AdminServiceTestCase.test_user_management_list
```

## Security Considerations

1. **Access Control**: All endpoints require admin authentication
2. **Sensitive Data**: Sensitive configuration values are hidden in API responses
3. **Audit Logging**: All admin actions are logged for compliance
4. **Rate Limiting**: Implement rate limiting on admin endpoints
5. **IP Whitelisting**: Consider IP whitelisting for admin access

## Monitoring

The service integrates with:
- Prometheus for metrics collection
- Grafana for dashboards
- ELK stack for log aggregation
- Jaeger for distributed tracing

## Service Registration

The service automatically registers with Consul for service discovery:
```python
from admin_service.service_registration import register_service

register_service()
```

## Dependencies

- Django REST Framework
- django-filters
- PostgreSQL (for relational data)
- Redis (for caching)
- Consul (for service discovery)

## Future Enhancements

1. Advanced analytics and reporting
2. Custom dashboard widgets
3. Automated incident response
4. Machine learning for anomaly detection
5. Advanced user segmentation
6. Real-time alerting system
7. Integration with external monitoring tools
8. Custom moderation workflows
9. Advanced audit log analysis
10. Compliance reporting automation
