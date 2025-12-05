# Admin Service - Quick Start Guide

Get the Admin Service up and running in minutes.

## Prerequisites

- Django project set up
- PostgreSQL database configured
- Redis for caching (optional)
- Admin user account

## Installation

### 1. Add to Installed Apps

The service is already added to `INSTALLED_APPS` in `settings.py`:

```python
INSTALLED_APPS = [
    ...
    'admin_service',
]
```

### 2. Add URL Configuration

The service is already added to `urls.py`:

```python
urlpatterns = [
    ...
    path('api/v1/admin/', include('admin_service.urls')),
]
```

### 3. Run Migrations

```bash
python manage.py makemigrations admin_service
python manage.py migrate admin_service
```

### 4. Create Superuser (if not exists)

```bash
python manage.py createsuperuser
```

## Basic Usage

### 1. Access Admin Dashboard

Navigate to: `http://localhost:8000/api/v1/admin/dashboard/overview/`

You'll need to authenticate with admin credentials.

### 2. User Management

**List all users:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/admin/users/
```

**Activate a user:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/admin/users/1/activate/
```

**Update user role:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}' \
  http://localhost:8000/api/v1/admin/users/1/update_role/
```

### 3. System Configuration

**Create configuration:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "max_upload_size",
    "value": "10485760",
    "description": "Maximum file upload size in bytes",
    "category": "storage"
  }' \
  http://localhost:8000/api/v1/admin/config/
```

**List configurations:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/admin/config/
```

### 4. Feature Flags

**Create feature flag:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "new_dashboard",
    "description": "New dashboard UI",
    "is_enabled": true,
    "rollout_percentage": 50
  }' \
  http://localhost:8000/api/v1/admin/feature-flags/
```

**Toggle feature flag:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/admin/feature-flags/1/toggle/
```

### 5. Content Moderation

**List moderation queue:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/admin/moderation/?status=pending
```

**Moderate content:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "review_notes": "Content looks good"
  }' \
  http://localhost:8000/api/v1/admin/moderation/1/moderate/
```

**Bulk moderation:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_ids": [1, 2, 3],
    "action": "approve",
    "review_notes": "Bulk approval"
  }' \
  http://localhost:8000/api/v1/admin/moderation/bulk_moderate/
```

### 6. Security Monitoring

**List security incidents:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/admin/security/?severity=high
```

**Create security incident:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "incident_type": "unauthorized_access",
    "severity": "high",
    "description": "Multiple failed login attempts detected",
    "detection_method": "automated"
  }' \
  http://localhost:8000/api/v1/admin/security/
```

**Resolve incident:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "User account locked, password reset required"
  }' \
  http://localhost:8000/api/v1/admin/security/1/resolve/
```

### 7. Audit Logs

**View audit logs:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/admin/audit-logs/
```

**Export audit logs:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/v1/admin/audit-logs/export/?start_date=2025-01-01&end_date=2025-12-31"
```

### 8. Platform Metrics

**View latest metrics:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/admin/metrics/latest/
```

**View metrics by category:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/admin/metrics/latest/?category=users
```

## Management Commands

### Collect Platform Metrics

Run this hourly via cron:

```bash
python manage.py collect_platform_metrics
```

### Cleanup Old Logs

Run this daily via cron:

```bash
python manage.py cleanup_old_logs --days 90 --metrics-days 365
```

### Generate Admin Report

Run this weekly:

```bash
python manage.py generate_admin_report --days 7
```

## Python Usage

### In Your Code

```python
from admin_service.services import (
    UserManagementService,
    ModerationService,
    SecurityMonitoringService,
    AnalyticsService
)

# Activate a user
result = UserManagementService.activate_user(user, admin_user)

# Moderate content
result = ModerationService.moderate_content(
    item, 'approve', moderator, 'Looks good'
)

# Track failed login
SecurityMonitoringService.track_failed_login(
    user, ip_address, user_agent
)

# Get dashboard overview
overview = AnalyticsService.get_dashboard_overview()
```

### Check Feature Flag

```python
from admin_service.models import FeatureFlag

flag = FeatureFlag.objects.get(name='new_dashboard')
if flag.is_enabled_for_user(request.user):
    # Show new dashboard
    pass
```

### Create Audit Log

```python
from admin_service.models import AuditLog

AuditLog.objects.create(
    user=request.user,
    action_type='update',
    description='Updated user profile',
    changes={'email': {'from': 'old@email.com', 'to': 'new@email.com'}},
    ip_address=request.META.get('REMOTE_ADDR'),
    user_agent=request.META.get('HTTP_USER_AGENT')
)
```

## Scheduled Tasks Setup

### Using Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add these lines
0 * * * * cd /path/to/project && python manage.py collect_platform_metrics
0 2 * * * cd /path/to/project && python manage.py cleanup_old_logs
0 9 * * 1 cd /path/to/project && python manage.py generate_admin_report --days 7
```

### Using Celery Beat

```python
# In celerybeat_schedule
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'collect-metrics': {
        'task': 'admin_service.tasks.collect_metrics',
        'schedule': crontab(minute=0),  # Every hour
    },
    'cleanup-logs': {
        'task': 'admin_service.tasks.cleanup_logs',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
    'generate-report': {
        'task': 'admin_service.tasks.generate_report',
        'schedule': crontab(hour=9, minute=0, day_of_week=1),  # Monday at 9 AM
    },
}
```

## Testing

Run the test suite:

```bash
# All tests
python manage.py test admin_service

# Specific test
python manage.py test admin_service.tests.AdminServiceTestCase.test_user_management_list

# With coverage
coverage run --source='admin_service' manage.py test admin_service
coverage report
```

## Troubleshooting

### Issue: Permission Denied

**Solution:** Ensure you're authenticated as an admin user:

```python
# Check if user is admin
if request.user.is_staff:
    # User is admin
    pass
```

### Issue: Migrations Not Applied

**Solution:** Run migrations:

```bash
python manage.py migrate admin_service
```

### Issue: Service Not Registered with Consul

**Solution:** Register manually:

```python
from admin_service.service_registration import register_service
register_service()
```

## Next Steps

1. **Set up monitoring dashboards** in Grafana
2. **Configure alerts** for security incidents
3. **Customize moderation workflows** for your content types
4. **Create custom feature flags** for your features
5. **Set up automated reports** via email

## Support

For issues or questions:
- Check the main README.md
- Review the API documentation at `/api/docs/`
- Check audit logs for debugging

## Security Notes

- Always use HTTPS in production
- Implement rate limiting on admin endpoints
- Consider IP whitelisting for admin access
- Regularly review audit logs
- Monitor security incidents
- Keep sensitive configurations encrypted

---

**You're all set!** The Admin Service is now ready to use.
