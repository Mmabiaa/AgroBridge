# Message Queue Quick Reference

## Setup

```bash
# Start infrastructure
./scripts/setup-messaging.sh  # Linux/Mac
.\scripts\setup-messaging.ps1  # Windows

# Initialize RabbitMQ
python manage.py setup_rabbitmq
```

## Start Workers

```bash
# Default worker
python manage.py celery_worker

# Specific queue
python manage.py celery_worker --queue=email

# With autoscaling
python manage.py celery_worker --autoscale=10,3

# Multiple queues
celery -A shared.messaging.celery_config worker -Q email,notifications
```

## Monitoring

```bash
# Start Flower
celery -A shared.messaging.celery_config flower
# → http://localhost:5555

# RabbitMQ Management UI
# → http://localhost:15672
# Username: agrobridge
# Password: agrobridge_password

# Check active tasks
celery -A shared.messaging.celery_config inspect active

# Check worker stats
celery -A shared.messaging.celery_config inspect stats

# List queues
rabbitmqctl list_queues name messages consumers
```

## Usage

### Celery Tasks

```python
# Import tasks
from shared.tasks import send_email, process_image, send_notification

# Queue a task
send_email.delay(
    to_email='user@example.com',
    subject='Welcome',
    body='Thank you!'
)

# With result tracking
result = process_image.apply_async(
    args=['image.jpg', ['resize']],
    queue='image_processing'
)
processed = result.get(timeout=30)
```

### Events

```python
# Publish event
from shared.messaging import publish_event

publish_event(
    event_type='user.registered',
    data={'user_id': 'uuid', 'email': 'user@example.com'},
    priority=5
)

# Subscribe to events
from shared.messaging import subscribe_to_events

def handle_event(event):
    print(f"Received: {event['event_type']}")

subscribe_to_events(
    event_handlers={'user.*': handle_event},
    routing_keys=['user.*', 'order.*']
)
```

### Custom Tasks

```python
from shared.messaging.celery_config import celery_app

@celery_app.task(
    name='myapp.tasks.my_task',
    bind=True,
    max_retries=3,
    default_retry_delay=60
)
def my_task(self, arg1, arg2):
    try:
        result = do_work(arg1, arg2)
        return result
    except Exception as exc:
        raise self.retry(exc=exc)

# Usage
my_task.delay('value1', 'value2')
```

## Queues

| Queue | Purpose | Routing Key |
|-------|---------|-------------|
| `default` | General tasks | `task.default` |
| `high_priority` | Urgent tasks | `task.high` |
| `email` | Email sending | `task.email` |
| `image_processing` | Image ops | `task.image` |
| `ai_processing` | AI/ML tasks | `task.ai` |
| `notifications` | Push notifications | `task.notification` |
| `analytics` | Analytics | `task.analytics` |
| `reports` | Report generation | `task.report` |

## Task Routing

Tasks auto-route based on name:
- `shared.tasks.email.*` → email queue
- `*.tasks.send_email` → email queue
- `*.tasks.process_image` → image_processing queue
- `ai_assistant.tasks.*` → ai_processing queue
- `*.tasks.emergency_alert` → high_priority queue

## Environment Variables

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

## Troubleshooting

```bash
# Check RabbitMQ status
docker ps | grep rabbitmq
docker logs agrobridge-rabbitmq

# Check Redis status
docker exec agrobridge-redis redis-cli -a password ping

# Restart services
docker-compose -f docker-compose.infrastructure.yml restart rabbitmq redis

# Purge queue
celery -A shared.messaging.celery_config purge

# Reset RabbitMQ
python manage.py setup_rabbitmq --reset
```

## Common Commands

```bash
# List active workers
celery -A shared.messaging.celery_config inspect active

# Ping workers
celery -A shared.messaging.celery_config inspect ping

# Show registered tasks
celery -A shared.messaging.celery_config inspect registered

# Revoke task
celery -A shared.messaging.celery_config control revoke <task_id>

# Shutdown worker
celery -A shared.messaging.celery_config control shutdown

# View events
celery -A shared.messaging.celery_config events
```

## Production Deployment

```bash
# Systemd service
sudo systemctl start celery-worker
sudo systemctl enable celery-worker
sudo systemctl status celery-worker

# Docker
docker-compose -f docker-compose.prod.yml up -d celery-worker

# Kubernetes
kubectl apply -f celery-worker-deployment.yaml
kubectl scale deployment celery-worker --replicas=4
```

## Documentation

- Full Guide: `docs/infrastructure/MESSAGE_QUEUE_SETUP.md`
- Completion Report: `docs/tasks/TASK_1_3_COMPLETION.md`
- Module README: `shared/messaging/README.md`

## Support

- RabbitMQ UI: http://localhost:15672
- Flower: http://localhost:5555
- Logs: `docker logs agrobridge-rabbitmq`
- Worker logs: Check console output or log files
