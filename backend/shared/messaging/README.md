# Message Queue Infrastructure

This module provides RabbitMQ and Celery integration for asynchronous task processing and event-driven communication across AgroBridge microservices.

## Quick Start

### 1. Setup Infrastructure

```bash
# Start RabbitMQ and Redis
cd backend
./scripts/setup-messaging.sh

# Or on Windows
.\scripts\setup-messaging.ps1
```

### 2. Start Workers

```bash
# Start default worker
python manage.py celery_worker

# Start worker for specific queue
python manage.py celery_worker --queue=email --concurrency=4

# Start with autoscaling
python manage.py celery_worker --autoscale=10,3
```

### 3. Monitor

```bash
# Start Flower monitoring UI
celery -A shared.messaging.celery_config flower

# Access at http://localhost:5555
```

## Usage

### Celery Tasks

```python
from shared.tasks import send_email, process_image, send_notification

# Queue a task
send_email.delay(
    to_email='user@example.com',
    subject='Welcome',
    body='Thank you for registering!'
)

# Queue with result tracking
result = process_image.apply_async(
    args=['image.jpg', ['resize', 'thumbnail']],
    queue='image_processing',
)

# Get result (blocking)
processed = result.get(timeout=30)
```

### Event Publishing

```python
from shared.messaging import publish_event

# Publish an event
publish_event(
    event_type='user.registered',
    data={
        'user_id': 'uuid',
        'email': 'user@example.com',
        'timestamp': '2025-12-03T10:00:00Z'
    },
    priority=5,
    metadata={'source': 'authentication_service'}
)
```

### Event Subscription

```python
from shared.messaging import subscribe_to_events

def handle_user_registered(event):
    """Handle user registration event"""
    user_id = event['data']['user_id']
    print(f"New user: {user_id}")
    # Send welcome email, create profile, etc.

def handle_order_placed(event):
    """Handle order placement event"""
    order_id = event['data']['order_id']
    print(f"New order: {order_id}")
    # Process payment, send notifications, etc.

# Subscribe to events
subscribe_to_events(
    event_handlers={
        'user.registered': handle_user_registered,
        'order.placed': handle_order_placed,
    },
    routing_keys=['user.*', 'order.*']
)
```

### Custom Tasks

```python
from shared.messaging.celery_config import celery_app

@celery_app.task(
    name='myapp.tasks.custom_task',
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def custom_task(self, arg1, arg2):
    """Custom async task"""
    try:
        result = do_something(arg1, arg2)
        return result
    except Exception as exc:
        # Retry on failure
        raise self.retry(exc=exc)

# Usage
custom_task.delay(arg1='value1', arg2='value2')
```

## Architecture

### Exchanges

- **agrobridge.default** (topic) - Celery task routing
- **agrobridge.events** (topic) - Event-driven communication
- **agrobridge.dlx** (topic) - Dead letter exchange

### Queues

| Queue | Purpose | Routing Key |
|-------|---------|-------------|
| `default` | General tasks | `task.default` |
| `high_priority` | Urgent tasks | `task.high` |
| `email` | Email sending | `task.email` |
| `image_processing` | Image operations | `task.image` |
| `ai_processing` | AI/ML tasks | `task.ai` |
| `notifications` | Push notifications | `task.notification` |
| `analytics` | Analytics calculations | `task.analytics` |
| `reports` | Report generation | `task.report` |

### Dead Letter Queues

All queues have corresponding DLQs for failed messages:
- `dlq.default`, `dlq.high`, `dlq.email`, etc.

## Configuration

### Environment Variables

```bash
# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=agrobridge
RABBITMQ_PASSWORD=your_password
RABBITMQ_VHOST=agrobridge

# Celery
CELERY_BROKER_URL=amqp://user:pass@host:5672/vhost
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

### Task Routing

Tasks are automatically routed based on naming:

```python
'shared.tasks.email.*'          → email queue
'*.tasks.send_email'            → email queue
'*.tasks.process_image'         → image_processing queue
'ai_assistant.tasks.*'          → ai_processing queue
'notifications.tasks.*'         → notifications queue
'*.tasks.emergency_alert'       → high_priority queue
```

## Monitoring

### RabbitMQ Management UI

- URL: http://localhost:15672
- Username: `agrobridge`
- Password: `agrobridge_password`

### Flower (Celery Monitoring)

```bash
celery -A shared.messaging.celery_config flower
# Access at http://localhost:5555
```

### Command Line

```bash
# Check active tasks
celery -A shared.messaging.celery_config inspect active

# Check worker stats
celery -A shared.messaging.celery_config inspect stats

# List queues
rabbitmqctl list_queues name messages consumers
```

## Features

### Automatic Retry

- Failed tasks retry up to 3 times
- Exponential backoff (60s, 120s, 240s)
- Dead letter queue after final failure

### Message Persistence

- All messages are persistent
- Survive broker restarts
- Durable queues and exchanges

### Priority Support

- High priority queue supports 0-10 priority levels
- Urgent tasks processed first

### Connection Pooling

- RabbitMQ connection pool (10 connections)
- Automatic reconnection on failure
- Heartbeat monitoring (60s)

## Documentation

For detailed documentation, see:
- [Message Queue Setup Guide](../../docs/infrastructure/MESSAGE_QUEUE_SETUP.md)
- [Task 1.3 Completion Report](../../docs/tasks/TASK_1_3_COMPLETION.md)

## Dependencies

Install with:

```bash
pip install -r requirements-messaging.txt
```

Key dependencies:
- `celery[redis]==5.3.4`
- `pika==1.3.2`
- `kombu==5.3.4`
- `redis==5.0.1`
- `flower==2.0.1`

## Support

For issues or questions:
1. Check the [troubleshooting guide](../../docs/infrastructure/MESSAGE_QUEUE_SETUP.md#troubleshooting)
2. View RabbitMQ logs: `docker logs agrobridge-rabbitmq`
3. Check worker status: `celery -A shared.messaging.celery_config inspect ping`
