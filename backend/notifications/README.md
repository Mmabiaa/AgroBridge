# Notification Service

The Notification Service provides comprehensive real-time and asynchronous notification delivery across multiple channels for the AgroBridge platform.

## Features

### Core Functionality
- **Multi-Channel Delivery**: WebSocket, Push (FCM), Email, SMS, In-App
- **Real-Time Notifications**: WebSocket-based instant delivery
- **Notification Types**: System, Alert, Reminder, Social, Marketing, Emergency, IoT Alert, Crop Disease, Weather, Marketplace, Payment, Learning, Community
- **Priority Levels**: Low (1), Normal (5), High (8), Critical (10)
- **User Preferences**: Granular control over notification channels and types
- **Do Not Disturb**: Time-based notification filtering
- **Scheduled Notifications**: Send notifications at specific times
- **Notification Expiry**: Automatic cleanup of expired notifications
- **Template System**: Reusable notification templates with variable substitution
- **Delivery Tracking**: Track delivery status across all channels
- **Retry Logic**: Automatic retry for failed deliveries

### API Endpoints

#### Notifications
- `GET /api/v1/notifications/` - List user notifications
- `POST /api/v1/notifications/` - Create notification
- `GET /api/v1/notifications/{id}/` - Get notification details
- `POST /api/v1/notifications/{id}/mark_read/` - Mark as read
- `POST /api/v1/notifications/{id}/mark_unread/` - Mark as unread
- `POST /api/v1/notifications/bulk_action/` - Bulk operations
- `GET /api/v1/notifications/stats/` - Get user statistics
- `GET /api/v1/notifications/unread_count/` - Get unread count

#### Preferences
- `GET /api/v1/preferences/me/` - Get user preferences
- `PUT /api/v1/preferences/me/` - Update preferences
- `POST /api/v1/preferences/register_fcm_token/` - Register FCM token
- `POST /api/v1/preferences/unregister_fcm_token/` - Unregister FCM token

#### Templates (Admin Only)
- `GET /api/v1/templates/` - List templates
- `POST /api/v1/templates/` - Create template
- `GET /api/v1/templates/{id}/` - Get template
- `PUT /api/v1/templates/{id}/` - Update template
- `DELETE /api/v1/templates/{id}/` - Delete template
- `POST /api/v1/templates/{id}/test_render/` - Test template rendering

#### Admin
- `GET /api/v1/admin/system_stats/` - Get system statistics
- `POST /api/v1/admin/cleanup_expired/` - Cleanup expired notifications
- `POST /api/v1/admin/retry_failed/` - Retry failed deliveries
- `POST /api/v1/admin/send_test/` - Send test notification

### WebSocket Endpoints

#### User Notifications
```
ws://localhost:8007/ws/notifications/?token=<jwt_token>
```

**Client Messages:**
```json
{
  "type": "mark_read",
  "notification_ids": ["uuid1", "uuid2"]
}

{
  "type": "get_unread_count"
}

{
  "type": "ping"
}
```

**Server Messages:**
```json
{
  "type": "notification",
  "notification": {
    "id": "uuid",
    "title": "Notification Title",
    "message": "Notification message",
    "notification_type": "system",
    "priority": 5,
    "created_at": "2024-01-01T00:00:00Z"
  }
}

{
  "type": "unread_count",
  "count": 5
}
```

#### Admin Notifications
```
ws://localhost:8007/ws/notifications/admin/?token=<jwt_token>
```

## Configuration

### Environment Variables

```bash
# Service Configuration
SERVICE_NAME=notification-service
SERVICE_HOST=localhost
SERVICE_PORT=8007

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=noreply@agrobridge.com

# SMS Configuration (Choose one)
SMS_PROVIDER=twilio  # or 'africastalking'

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890

# Africa's Talking
AFRICASTALKING_USERNAME=your-username
AFRICASTALKING_API_KEY=your-api-key
AFRICASTALKING_SENDER_ID=AgroBridge

# Push Notifications (FCM)
FCM_SERVER_KEY=your-fcm-server-key

# Redis (for Channels)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Django Settings

```python
# settings.py

INSTALLED_APPS = [
    # ...
    'channels',
    'notifications',
]

# Channels Configuration
ASGI_APPLICATION = 'config.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('localhost', 6379)],
        },
    },
}

# Celery Configuration
CELERY_BEAT_SCHEDULE = {
    'send-scheduled-notifications': {
        'task': 'notifications.tasks.send_scheduled_notifications',
        'schedule': 60.0,  # Every minute
    },
    'cleanup-expired-notifications': {
        'task': 'notifications.tasks.cleanup_expired_notifications',
        'schedule': 3600.0,  # Every hour
    },
    'retry-failed-deliveries': {
        'task': 'notifications.tasks.retry_failed_deliveries',
        'schedule': 300.0,  # Every 5 minutes
    },
    'send-digest-notifications': {
        'task': 'notifications.tasks.send_digest_notifications',
        'schedule': crontab(hour=8, minute=0),  # Daily at 8 AM
    },
}
```

## Usage Examples

### Creating Notifications

#### Via Service
```python
from notifications.services import NotificationService
from notifications.models import NotificationType, NotificationPriority

service = NotificationService()

# Simple notification
notification = service.create_notification(
    user=user,
    title='Welcome!',
    message='Thank you for joining AgroBridge',
    notification_type=NotificationType.SYSTEM,
    priority=NotificationPriority.NORMAL,
    channels=['websocket', 'push', 'email']
)

# From template
notification = service.create_from_template(
    template_name='welcome_template',
    user=user,
    context={
        'user_name': user.first_name,
        'site_name': 'AgroBridge'
    }
)

# Scheduled notification
notification = service.create_notification(
    user=user,
    title='Reminder',
    message='Time to water your crops',
    scheduled_at=timezone.now() + timedelta(hours=24),
    expires_at=timezone.now() + timedelta(days=2)
)
```

#### Via API
```python
import requests

# Create notification
response = requests.post(
    'http://localhost:8007/api/v1/notifications/',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'title': 'Test Notification',
        'message': 'This is a test',
        'notification_type': 'system',
        'priority': 5,
        'channels': ['websocket', 'push'],
        'user_ids': ['user-uuid-1', 'user-uuid-2']
    }
)
```

### Managing Preferences

```python
from notifications.services import NotificationService

service = NotificationService()
preferences = service.get_user_preferences(user)

# Update preferences
preferences.enable_push = True
preferences.enable_sms = False
preferences.dnd_enabled = True
preferences.dnd_start_time = '22:00'
preferences.dnd_end_time = '06:00'
preferences.save()

# Update notification type preferences
preferences.notification_types = {
    'system': {
        'enabled': True,
        'channels': {
            'websocket': True,
            'push': True,
            'email': False,
            'sms': False
        }
    },
    'emergency': {
        'enabled': True,
        'channels': {
            'websocket': True,
            'push': True,
            'email': True,
            'sms': True
        }
    }
}
preferences.save()
```

### WebSocket Client Example

```javascript
// Connect to WebSocket
const token = 'your-jwt-token';
const ws = new WebSocket(`ws://localhost:8007/ws/notifications/?token=${token}`);

// Handle connection
ws.onopen = () => {
  console.log('Connected to notifications');
};

// Handle incoming notifications
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'notification') {
    console.log('New notification:', data.notification);
    // Display notification to user
    showNotification(data.notification);
  } else if (data.type === 'unread_count') {
    console.log('Unread count:', data.count);
    updateBadge(data.count);
  }
};

// Mark notifications as read
function markAsRead(notificationIds) {
  ws.send(JSON.stringify({
    type: 'mark_read',
    notification_ids: notificationIds
  }));
}

// Get unread count
function getUnreadCount() {
  ws.send(JSON.stringify({
    type: 'get_unread_count'
  }));
}
```

### Event-Driven Notifications

```python
# In another service, trigger notification via event
from notifications.signals import EVENT_HANDLERS

# Trigger order placed notification
event_data = {
    'event_type': 'order.placed',
    'data': {
        'user_id': str(user.id),
        'order_id': str(order.id),
        'amount': order.total_amount
    }
}

# The notification service will automatically handle this
handler = EVENT_HANDLERS.get('order.placed')
if handler:
    handler(event_data)
```

## Testing

Run tests:
```bash
# All tests
python manage.py test notifications

# Specific test class
python manage.py test notifications.tests.NotificationServiceTests

# With coverage
coverage run --source='notifications' manage.py test notifications
coverage report
```

## Monitoring

### Metrics
- Total notifications sent
- Notifications by type
- Notifications by priority
- Delivery success rate by channel
- Average delivery time
- Failed delivery count
- Unread notification count

### Health Check
```bash
curl http://localhost:8007/api/v1/notifications/health/
```

## Troubleshooting

### WebSocket Connection Issues
1. Verify Redis is running
2. Check JWT token is valid
3. Ensure CORS settings allow WebSocket connections
4. Check firewall rules

### Email Delivery Issues
1. Verify SMTP credentials
2. Check email backend configuration
3. Review email service logs
4. Test with console backend for development

### SMS Delivery Issues
1. Verify SMS provider credentials
2. Check phone number format
3. Ensure sufficient credits
4. Review SMS provider logs

### Push Notification Issues
1. Verify FCM server key
2. Check FCM token validity
3. Ensure app is configured for push notifications
4. Review FCM console for errors

## Architecture

### Components
- **Models**: Data models for notifications, preferences, templates, deliveries
- **Services**: Business logic for notification creation and delivery
- **Views**: REST API endpoints
- **Consumers**: WebSocket handlers
- **Tasks**: Celery tasks for async processing
- **Signals**: Event handlers for automatic notifications

### Data Flow
1. Notification created via API or service
2. User preferences checked
3. Notification stored in database
4. Delivery records created for each channel
5. Notifications sent via appropriate channels
6. Delivery status tracked
7. Failed deliveries retried automatically

## Performance Considerations

- Use Celery for async notification sending
- Implement connection pooling for database
- Use Redis for WebSocket channel layer
- Batch notification creation for bulk operations
- Index database tables appropriately
- Implement rate limiting for API endpoints
- Cache user preferences
- Use CDN for static assets in email templates

## Security

- JWT authentication for WebSocket connections
- Permission-based access control
- Input validation and sanitization
- Rate limiting on notification creation
- Secure storage of API keys and credentials
- HTTPS for all API endpoints
- WSS for WebSocket connections

## Future Enhancements

- [ ] Rich media notifications (images, videos)
- [ ] Notification categories and filtering
- [ ] Advanced scheduling (recurring patterns)
- [ ] A/B testing for notification content
- [ ] Analytics dashboard
- [ ] Notification sound customization
- [ ] Notification grouping
- [ ] Interactive notifications (action buttons)
- [ ] Notification translation
- [ ] Voice notifications
