# Message Queue Infrastructure Setup

## Overview

This document describes the RabbitMQ and Celery infrastructure for asynchronous task processing and event-driven communication in the AgroBridge platform.

## Architecture

### Components

1. **RabbitMQ** - Message broker for reliable message delivery
2. **Celery** - Distributed task queue for async processing
3. **Redis** - Result backend for Celery task results
4. **Flower** - Web-based monitoring tool for Celery

### Message Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Django App │────▶│   RabbitMQ   │────▶│   Celery    │────▶│    Redis     │
│  (Producer) │     │   (Broker)   │     │   Worker    │     │  (Results)   │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Dead Letter  │
                    │    Queue     │
                    └──────────────┘
```

## Quick Start

### 1. Start Infrastructure

```bash
# Start all infrastructure services
cd backend
./scripts/setup-infrastructure.sh

# Or with Docker Compose directly
docker-compose -f docker-compose.infrastructure.yml up -d rabbitmq redis
```

### 2. Setup RabbitMQ

```bash
# Initialize exchanges and queues
python manage.py setup_rabbitmq

# Reset and recreate (if needed)
python manage.py setup_rabbitmq --reset
```

### 3. Start Celery Workers

```bash
# Start default worker
python manage.py celery_worker

# Start worker for specific queue
python manage.py celery_worker --queue=email

# Start with autoscaling
python manage.py celery_worker --autoscale=10,3

# Or use Celery directly
celery -A shared.messaging.celery_config worker --loglevel=info
```

### 4. Monitor with Flower

```bash
# Start Flower monitoring
celery -A shared.messaging.celery_config flower --port=5555

# Access at http://localhost:5555
```

## Configuration

### Environment Variables

Add to your `.env.infrastructure` file:

```bash
# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=agrobridge
RABBITMQ_PASSWORD=your_secure_password
RABBITMQ_VHOST=agrobridge

# Celery
CELERY_BROKER_URL=amqp://agrobridge:password@localhost:5672/agrobridge
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

### Django Settings Integration

```python
# settings.py
from shared.messaging.celery_config import celery_app

# Celery is automatically configured
# Just ensure your app is in INSTALLED_APPS
```

## Exchanges and Queues

### Exchanges

1. **agrobridge.default** (topic)
   - For Celery task routing
   - Durable, persistent

2. **agrobridge.events** (topic)
   - For event-driven communication
   - Durable, persistent

3. **agrobridge.dlx** (topic)
   - Dead letter exchange for failed messages
   - Durable, persistent

### Queues

#### Task Queues

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

#### Dead Letter Queues

All task queues have corresponding DLQs:
- `dlq.default`
- `dlq.high`
- `dlq.email`
- `dlq.image`
- `dlq.ai`
- `dlq.notification`
- `dlq.analytics`
- `dlq.report`

### Queue Features

- **Message TTL**: 24 hours (86400000 ms)
- **Dead Letter Exchange**: Automatic routing on failure
- **Priority**: High priority queue supports 0-10 priority levels
- **Durability**: All queues are durable (survive broker restart)

## Usage Examples

### Publishing Tasks

#### Using Celery Tasks

```python
from shared.tasks import send_email, process_image

# Send email asynchronously
send_email.delay(
    to_email='user@example.com',
    subject='Welcome to AgroBridge',
    body='Thank you for registering!'
)

# Process image with callback
result = process_image.apply_async(
    args=['https://example.com/image.jpg', ['resize', 'thumbnail']],
    queue='image_processing',
)

# Get result (blocking)
processed_image = result.get(timeout=30)
```

#### Using RabbitMQ Events

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

### Subscribing to Events

```python
from shared.messaging import subscribe_to_events

def handle_user_registered(event):
    """Handle user registration event"""
    user_id = event['data']['user_id']
    print(f"New user registered: {user_id}")
    # Send welcome email, create profile, etc.

def handle_order_placed(event):
    """Handle order placement event"""
    order_id = event['data']['order_id']
    print(f"New order placed: {order_id}")
    # Process payment, send notifications, etc.

# Subscribe to events
event_handlers = {
    'user.registered': handle_user_registered,
    'order.placed': handle_order_placed,
}

subscribe_to_events(
    event_handlers=event_handlers,
    queue_name='my_service_events',
    routing_keys=['user.*', 'order.*']
)
```

### Creating Custom Tasks

```python
# myapp/tasks.py
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
        # Your task logic here
        result = do_something(arg1, arg2)
        return result
    except Exception as exc:
        # Retry on failure
        raise self.retry(exc=exc)

# Usage
custom_task.delay(arg1='value1', arg2='value2')
```

## Task Routing

Tasks are automatically routed based on naming conventions:

```python
# Automatic routing examples
'shared.tasks.email.*'          → email queue
'*.tasks.send_email'            → email queue
'*.tasks.process_image'         → image_processing queue
'ai_assistant.tasks.*'          → ai_processing queue
'notifications.tasks.*'         → notifications queue
'*.tasks.emergency_alert'       → high_priority queue
```

## Monitoring

### RabbitMQ Management UI

Access at: http://localhost:15672
- Username: `agrobridge`
- Password: `agrobridge_password`

Features:
- View queues, exchanges, and bindings
- Monitor message rates
- Manage connections and channels
- View queue depths and consumer counts

### Flower (Celery Monitoring)

```bash
# Start Flower
celery -A shared.messaging.celery_config flower

# Access at http://localhost:5555
```

Features:
- Real-time task monitoring
- Worker status and statistics
- Task history and results
- Task rate limiting
- Worker pool management

### Celery Events

```bash
# Monitor Celery events
celery -A shared.messaging.celery_config events

# Capture events to file
celery -A shared.messaging.celery_config events --dump
```

## Dead Letter Queue Handling

### Automatic Retry

Tasks automatically retry up to 3 times with exponential backoff:

```python
@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,  # 1 minute
)
def my_task(self):
    try:
        # Task logic
        pass
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
```

### Manual DLQ Processing

```python
from shared.messaging import RabbitMQSubscriber

def process_dlq_message(event):
    """Process failed message from DLQ"""
    print(f"Processing DLQ message: {event}")
    # Analyze failure, fix issue, and requeue if needed

# Subscribe to DLQ
subscriber = RabbitMQSubscriber(
    exchange_name='agrobridge.dlx',
    queue_name='dlq.email',
    routing_keys=['dlq.email']
)
subscriber.register_callback('*', process_dlq_message)
subscriber.start_consuming()
```

## Performance Tuning

### Worker Configuration

```bash
# Multiple workers for different queues
celery -A shared.messaging.celery_config worker -Q email -c 4 &
celery -A shared.messaging.celery_config worker -Q image_processing -c 2 &
celery -A shared.messaging.celery_config worker -Q ai_processing -c 1 &

# Autoscaling workers
celery -A shared.messaging.celery_config worker --autoscale=10,3

# Pool types
celery -A shared.messaging.celery_config worker --pool=prefork  # Default
celery -A shared.messaging.celery_config worker --pool=gevent   # For I/O bound
celery -A shared.messaging.celery_config worker --pool=solo     # Single process
```

### RabbitMQ Tuning

```bash
# Increase connection limit
rabbitmqctl set_vm_memory_high_watermark 0.6

# Set disk free limit
rabbitmqctl set_disk_free_limit 2GB

# Enable lazy queues for large backlogs
rabbitmqctl set_policy lazy-queue "^lazy-" '{"queue-mode":"lazy"}' --apply-to queues
```

## High Availability

### RabbitMQ Clustering

```yaml
# docker-compose.yml
services:
  rabbitmq1:
    image: rabbitmq:3.12-management
    hostname: rabbitmq1
    environment:
      RABBITMQ_ERLANG_COOKIE: 'secret_cookie'
    
  rabbitmq2:
    image: rabbitmq:3.12-management
    hostname: rabbitmq2
    environment:
      RABBITMQ_ERLANG_COOKIE: 'secret_cookie'
    depends_on:
      - rabbitmq1
```

### Celery Worker Redundancy

```bash
# Run multiple workers
for i in {1..4}; do
    celery -A shared.messaging.celery_config worker \
        --hostname=worker$i@%h \
        --loglevel=info &
done
```

## Security

### Authentication

- RabbitMQ uses username/password authentication
- Credentials stored in environment variables
- Virtual host isolation (`agrobridge` vhost)

### Encryption

For production, enable TLS:

```python
# celery_config.py
BROKER_URL = 'amqps://user:pass@host:5671/vhost'
BROKER_USE_SSL = {
    'keyfile': '/path/to/key.pem',
    'certfile': '/path/to/cert.pem',
    'ca_certs': '/path/to/ca.pem',
    'cert_reqs': ssl.CERT_REQUIRED
}
```

### Access Control

```bash
# Create user with limited permissions
rabbitmqctl add_user worker worker_password
rabbitmqctl set_permissions -p agrobridge worker ".*" ".*" ".*"
rabbitmqctl set_user_tags worker monitoring
```

## Troubleshooting

### Check RabbitMQ Status

```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# View RabbitMQ logs
docker logs agrobridge-rabbitmq

# Check queue status
rabbitmqctl list_queues name messages consumers
```

### Check Celery Workers

```bash
# List active workers
celery -A shared.messaging.celery_config inspect active

# Check worker stats
celery -A shared.messaging.celery_config inspect stats

# Ping workers
celery -A shared.messaging.celery_config inspect ping
```

### Common Issues

#### Connection Refused

```bash
# Check if RabbitMQ is running
docker-compose -f docker-compose.infrastructure.yml ps rabbitmq

# Restart RabbitMQ
docker-compose -f docker-compose.infrastructure.yml restart rabbitmq
```

#### Tasks Not Processing

```bash
# Check if workers are running
celery -A shared.messaging.celery_config inspect active

# Check queue depth
rabbitmqctl list_queues

# Purge queue if needed
celery -A shared.messaging.celery_config purge
```

#### Memory Issues

```bash
# Check RabbitMQ memory usage
rabbitmqctl status | grep memory

# Increase memory limit
rabbitmqctl set_vm_memory_high_watermark 0.8
```

## Production Deployment

### Systemd Service (Linux)

```ini
# /etc/systemd/system/celery-worker.service
[Unit]
Description=Celery Worker
After=network.target rabbitmq.service redis.service

[Service]
Type=forking
User=agrobridge
Group=agrobridge
WorkingDirectory=/opt/agrobridge/backend
Environment="PATH=/opt/agrobridge/venv/bin"
ExecStart=/opt/agrobridge/venv/bin/celery -A shared.messaging.celery_config worker \
    --loglevel=info \
    --pidfile=/var/run/celery/worker.pid \
    --logfile=/var/log/celery/worker.log
ExecStop=/opt/agrobridge/venv/bin/celery -A shared.messaging.celery_config control shutdown
Restart=always

[Install]
WantedBy=multi-user.target
```

### Docker Deployment

```yaml
# docker-compose.prod.yml
services:
  celery-worker:
    build: .
    command: celery -A shared.messaging.celery_config worker --loglevel=info
    environment:
      - CELERY_BROKER_URL=${CELERY_BROKER_URL}
      - CELERY_RESULT_BACKEND=${CELERY_RESULT_BACKEND}
    depends_on:
      - rabbitmq
      - redis
    restart: always
    deploy:
      replicas: 4
```

### Kubernetes Deployment

```yaml
# celery-worker-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-worker
spec:
  replicas: 4
  selector:
    matchLabels:
      app: celery-worker
  template:
    metadata:
      labels:
        app: celery-worker
    spec:
      containers:
      - name: worker
        image: agrobridge/backend:latest
        command: ["celery", "-A", "shared.messaging.celery_config", "worker"]
        env:
        - name: CELERY_BROKER_URL
          valueFrom:
            secretKeyRef:
              name: celery-secrets
              key: broker-url
```

## Best Practices

1. **Task Idempotency**: Design tasks to be idempotent (safe to retry)
2. **Task Timeouts**: Always set time limits to prevent hanging tasks
3. **Result Expiry**: Set appropriate result expiry times
4. **Queue Separation**: Use separate queues for different task types
5. **Monitoring**: Always monitor queue depths and worker health
6. **Error Handling**: Implement proper error handling and logging
7. **Testing**: Test tasks in isolation before deployment
8. **Documentation**: Document task parameters and expected behavior

## Next Steps

- [Task 1.4: Configure API Gateway](./API_GATEWAY_SETUP.md)
- [Task 1.5: Set up Service Discovery](./SERVICE_DISCOVERY_SETUP.md)
- [Implement Microservices](../tasks/TASK_2_COMPLETION.md)

## References

- [Celery Documentation](https://docs.celeryproject.org/)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Flower Documentation](https://flower.readthedocs.io/)
- [Kombu Documentation](https://kombu.readthedocs.io/)
