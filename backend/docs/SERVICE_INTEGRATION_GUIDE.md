# Service Integration Guide

Comprehensive guide for implementing event-driven communication, saga patterns, outbox pattern, circuit breakers, and API versioning in AgroBridge microservices.

## Table of Contents

1. [Event-Driven Communication](#event-driven-communication)
2. [Saga Pattern](#saga-pattern)
3. [Outbox Pattern](#outbox-pattern)
4. [Circuit Breaker](#circuit-breaker)
5. [API Versioning](#api-versioning)
6. [Best Practices](#best-practices)

## Event-Driven Communication

### Overview

Event-driven architecture enables loose coupling between microservices through asynchronous message passing.

### Publishing Events

```python
from shared.events import publish_event, EventType

# Publish an event
event_id = publish_event(
    event_type=EventType.ORDER_CREATED,
    data={
        'order_id': '12345',
        'user_id': 'user-123',
        'total_amount': 99.99,
        'items': [...]
    },
    service='marketplace',
    correlation_id='correlation-123'
)
```

### Consuming Events

```python
from shared.events import get_event_consumer, EventType, Event

# Create consumer
consumer = get_event_consumer('payment_service')

# Define event handler
def handle_order_created(event: Event):
    order_data = event.data
    # Process payment for order
    process_payment(order_data)

# Subscribe to events
consumer.subscribe(EventType.ORDER_CREATED, handle_order_created)

# Start consuming
consumer.start_consuming()
```

### Event Types

Standard event types are defined in `EventType` enum:

- **User Events**: `USER_REGISTERED`, `USER_UPDATED`, `USER_DELETED`
- **Order Events**: `ORDER_CREATED`, `ORDER_CONFIRMED`, `ORDER_CANCELLED`, `ORDER_COMPLETED`
- **Payment Events**: `PAYMENT_INITIATED`, `PAYMENT_COMPLETED`, `PAYMENT_FAILED`, `PAYMENT_REFUNDED`
- **Inventory Events**: `INVENTORY_RESERVED`, `INVENTORY_RELEASED`, `INVENTORY_UPDATED`
- **Farm Events**: `FARM_CREATED`, `FARM_UPDATED`, `CROP_PLANTED`, `HARVEST_RECORDED`
- **IoT Events**: `SENSOR_READING`, `ALERT_TRIGGERED`, `DEVICE_REGISTERED`
- **Emergency Events**: `EMERGENCY_ALERT`, `INCIDENT_REPORTED`

### Event Structure

```python
{
    "event_id": "uuid",
    "event_type": "order.created",
    "timestamp": "2025-12-05T10:00:00Z",
    "service": "marketplace",
    "data": {...},
    "correlation_id": "uuid",
    "causation_id": "uuid",
    "metadata": {...}
}
```

## Saga Pattern

### Overview

Saga pattern manages distributed transactions across multiple services with compensation logic.

### Creating a Saga

```python
from shared.saga import get_saga_orchestrator, create_order_saga

# Create order saga
saga = create_order_saga({
    'user_id': 'user-123',
    'items': [...],
    'total_amount': 99.99
})

# Execute saga
orchestrator = get_saga_orchestrator()
success = orchestrator.execute_saga(saga)

if success:
    print(f"Order created: {saga.context['order_id']}")
else:
    print("Order creation failed, compensated")
```

### Custom Saga Definition

```python
from shared.saga import get_saga_orchestrator

# Create custom saga
orchestrator = get_saga_orchestrator()
saga = orchestrator.create_saga("custom_workflow", context={'data': 'value'})

# Add steps
def step1_action(context):
    # Perform action
    return {'step1_result': 'success'}

def step1_compensation(context):
    # Undo action
    pass

saga.add_step(
    name="step1",
    action=step1_action,
    compensation=step1_compensation,
    max_retries=3
)

# Execute
success = orchestrator.execute_saga(saga)
```

### Saga Lifecycle

1. **PENDING**: Saga created, not started
2. **IN_PROGRESS**: Executing steps
3. **COMPLETED**: All steps succeeded
4. **COMPENSATING**: Rolling back due to failure
5. **COMPENSATED**: Rollback completed
6. **FAILED**: Saga failed

### Built-in Sagas

#### Order Creation Saga

```python
from shared.saga import create_order_saga

saga = create_order_saga({
    'user_id': 'user-123',
    'items': [{'product_id': 'p1', 'quantity': 2}],
    'total_amount': 99.99
})
```

Steps:
1. Reserve inventory
2. Process payment
3. Create order
4. Send notification

#### Payment Saga

```python
from shared.saga import create_payment_saga

saga = create_payment_saga({
    'order_id': 'order-123',
    'amount': 99.99,
    'payment_method': 'card'
})
```

Steps:
1. Validate payment
2. Hold funds in escrow
3. Update order status
4. Send confirmation

## Outbox Pattern

### Overview

Outbox pattern ensures reliable message delivery by storing events in a database table before publishing.

### Using Outbox Pattern

```python
from django.db import transaction
from shared.outbox import get_outbox_publisher

# Within a transaction
with transaction.atomic():
    # Create order in database
    order = Order.objects.create(...)
    
    # Save event to outbox
    publisher = get_outbox_publisher()
    publisher.save_to_outbox(
        event_type="order.created",
        aggregate_type="order",
        aggregate_id=str(order.id),
        payload={
            'order_id': str(order.id),
            'user_id': str(order.user_id),
            'total_amount': float(order.total_amount)
        }
    )
```

### Using Decorator

```python
from shared.outbox import with_outbox

@with_outbox(event_type="order.created", aggregate_type="order")
def create_order(order_data):
    order = Order.objects.create(**order_data)
    return order
```

### Processing Outbox Messages

Run the outbox processor as a background service:

```bash
python manage.py process_outbox --interval 5 --batch-size 100
```

Or programmatically:

```python
from shared.outbox import OutboxProcessor

processor = OutboxProcessor()
processor.run(interval_seconds=5, batch_size=100)
```

### Outbox Message Model

```python
class OutboxMessage(models.Model):
    id = models.UUIDField(primary_key=True)
    event_type = models.CharField(max_length=255)
    aggregate_type = models.CharField(max_length=255)
    aggregate_id = models.CharField(max_length=255)
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True)
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
```

## Circuit Breaker

### Overview

Circuit breaker prevents cascading failures by stopping requests to failing services.

### Using Circuit Breaker Decorator

```python
from shared.circuit_breaker import circuit_breaker

@circuit_breaker(
    name="payment_service",
    failure_threshold=3,
    success_threshold=2,
    timeout=30,
    fallback=lambda *args, **kwargs: {"status": "unavailable"}
)
def call_payment_service(amount):
    # Make API call
    response = requests.post(
        "https://payment-service/charge",
        json={"amount": amount}
    )
    response.raise_for_status()
    return response.json()
```

### Circuit Breaker States

1. **CLOSED**: Normal operation, requests pass through
2. **OPEN**: Service failing, requests rejected immediately
3. **HALF_OPEN**: Testing if service recovered

### Configuration

```python
from shared.circuit_breaker import CircuitBreakerConfig, CircuitBreaker

config = CircuitBreakerConfig(
    failure_threshold=5,  # Open after 5 failures
    success_threshold=2,  # Close after 2 successes in half-open
    timeout=60,  # Wait 60s before trying again
    expected_exception=requests.exceptions.RequestException
)

breaker = CircuitBreaker(config)
```

### Monitoring Circuit Breakers

```python
from shared.circuit_breaker import get_circuit_breaker_status

# Get status of all circuit breakers
status = get_circuit_breaker_status()
print(status)
# {
#     'payment_service': {
#         'state': 'closed',
#         'failure_count': 0,
#         'success_count': 0,
#         'last_failure_time': None
#     }
# }
```

### Manual Reset

```python
from shared.circuit_breaker import get_circuit_breaker_registry

registry = get_circuit_breaker_registry()

# Reset specific breaker
registry.reset_breaker('payment_service')

# Reset all breakers
registry.reset_all()
```

## API Versioning

### Overview

API versioning allows multiple API versions to coexist, enabling backward compatibility.

### URL Path Versioning

```python
# urls.py
from django.urls import path
from shared.api_versioning import get_api_router

router = get_api_router()

# Register v1 endpoint
router.register(
    version='v1',
    path_pattern='users/',
    view=get_users_v1,
    name='users-list-v1'
)

# Register v2 endpoint
router.register(
    version='v2',
    path_pattern='users/',
    view=get_users_v2,
    name='users-list-v2'
)

# Get all versioned URLs
urlpatterns = router.get_all_urls()
```

URLs will be:
- `/api/v1/users/`
- `/api/v2/users/`

### Header Versioning

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_VERSIONING_CLASS': 'shared.api_versioning.HeaderVersioning',
}

# Request with header
# X-API-Version: v1
```

### Accept Header Versioning

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_VERSIONING_CLASS': 'shared.api_versioning.AcceptHeaderVersioning',
}

# Request with header
# Accept: application/vnd.agrobridge.v1+json
```

### Version-Specific Views

```python
from shared.api_versioning import VersionedAPIView

class UserListView(VersionedAPIView):
    def get_v1(self, request):
        # Version 1 implementation
        return Response({'users': [...]})
    
    def get_v2(self, request):
        # Version 2 implementation with pagination
        return Response({
            'users': [...],
            'pagination': {...}
        })
```

### Version Decorator

```python
from shared.api_versioning import api_version

@api_version(min_version='v1', max_version='v2', deprecated=True)
def legacy_endpoint(request):
    # Endpoint implementation
    return JsonResponse({'data': 'value'})
```

### Deprecation Policy

```python
from shared.api_versioning import get_deprecation_policy

policy = get_deprecation_policy()

# Mark endpoint as deprecated
policy.deprecate(
    endpoint='/api/v1/users/',
    version='v1',
    removal_version='v3',
    alternative='/api/v2/users/',
    reason='Enhanced features in v2'
)

# Check if deprecated
is_deprecated = policy.is_deprecated('/api/v1/users/')

# Get deprecation info
info = policy.get_deprecation_info('/api/v1/users/')
```

## Best Practices

### Event-Driven Communication

1. **Use correlation IDs** for tracking related events
2. **Keep events small** and focused
3. **Make events immutable** - never modify published events
4. **Use event versioning** for schema evolution
5. **Implement idempotent handlers** to handle duplicate events

### Saga Pattern

1. **Keep sagas short** - limit to 3-5 steps
2. **Design compensations carefully** - ensure they can undo actions
3. **Use timeouts** to prevent hanging sagas
4. **Log saga execution** for debugging
5. **Test failure scenarios** thoroughly

### Outbox Pattern

1. **Process outbox regularly** - run processor as background service
2. **Monitor outbox size** - alert on growing backlog
3. **Clean up old messages** - remove processed messages periodically
4. **Handle failures gracefully** - implement retry logic
5. **Use transactions** - always save to outbox within database transaction

### Circuit Breaker

1. **Set appropriate thresholds** - based on service SLAs
2. **Implement fallbacks** - provide degraded functionality
3. **Monitor circuit state** - alert on open circuits
4. **Test circuit behavior** - verify it opens and closes correctly
5. **Use different breakers** - one per external dependency

### API Versioning

1. **Version from day one** - start with v1
2. **Maintain backward compatibility** within major versions
3. **Document breaking changes** clearly
4. **Provide migration guides** for version upgrades
5. **Deprecate gradually** - give users time to migrate
6. **Support N-1 versions** - maintain at least previous version

## Integration Examples

### Complete Order Flow

```python
from django.db import transaction
from shared.events import publish_event, EventType
from shared.outbox import get_outbox_publisher
from shared.saga import create_order_saga, get_saga_orchestrator
from shared.circuit_breaker import circuit_breaker

@circuit_breaker(name="order_creation", failure_threshold=5)
def create_order_with_integration(order_data):
    # Create saga
    saga = create_order_saga(order_data)
    
    # Execute saga
    orchestrator = get_saga_orchestrator()
    success = orchestrator.execute_saga(saga)
    
    if success:
        # Save event to outbox within transaction
        with transaction.atomic():
            order_id = saga.context['order_id']
            
            publisher = get_outbox_publisher()
            publisher.save_to_outbox(
                event_type=EventType.ORDER_CREATED.value,
                aggregate_type="order",
                aggregate_id=order_id,
                payload=saga.context
            )
        
        return {'success': True, 'order_id': order_id}
    else:
        return {'success': False, 'error': 'Order creation failed'}
```

### Service-to-Service Communication

```python
from shared.circuit_breaker import circuit_breaker
import requests

@circuit_breaker(
    name="inventory_service",
    failure_threshold=3,
    timeout=30,
    fallback=lambda *args, **kwargs: {"available": False}
)
def check_inventory_availability(product_id, quantity):
    response = requests.get(
        f"http://inventory-service/api/v1/products/{product_id}/availability",
        params={"quantity": quantity},
        timeout=5
    )
    response.raise_for_status()
    return response.json()
```

## Monitoring and Observability

### Metrics to Track

1. **Event Publishing**:
   - Events published per second
   - Event publishing failures
   - Event processing latency

2. **Saga Execution**:
   - Saga success rate
   - Saga duration
   - Compensation frequency

3. **Outbox Processing**:
   - Outbox message count
   - Processing latency
   - Failed message count

4. **Circuit Breakers**:
   - Circuit state changes
   - Request success/failure rate
   - Fallback invocations

5. **API Versions**:
   - Requests per version
   - Deprecated endpoint usage
   - Version adoption rate

## Troubleshooting

### Event Not Received

1. Check RabbitMQ connection
2. Verify queue bindings
3. Check consumer is running
4. Verify event type matches subscription

### Saga Compensation Failed

1. Check compensation logic
2. Verify service availability
3. Review saga logs
4. Check for data inconsistencies

### Outbox Messages Not Processing

1. Verify outbox processor is running
2. Check database connection
3. Review error messages in outbox table
4. Check event publisher connection

### Circuit Breaker Stuck Open

1. Verify service is healthy
2. Check timeout configuration
3. Manually reset circuit breaker
4. Review failure threshold settings

### API Version Conflicts

1. Check version header/path
2. Verify version is supported
3. Review deprecation policy
4. Check version routing configuration

## References

- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [API Versioning](https://www.django-rest-framework.org/api-guide/versioning/)

---

**Last Updated**: December 5, 2025  
**Version**: 1.0.0
