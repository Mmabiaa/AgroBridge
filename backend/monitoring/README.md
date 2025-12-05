# AgroBridge Monitoring Service

Comprehensive monitoring solution for AgroBridge microservices platform using Prometheus, Grafana, ELK Stack, and Jaeger.

## Overview

The monitoring service provides:
- **Metrics Collection**: Prometheus for time-series metrics
- **Visualization**: Grafana dashboards for metrics and logs
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana) for centralized logging
- **Tracing**: Jaeger for distributed tracing
- **Alerting**: Alertmanager for intelligent alert routing
- **Health Checks**: Standardized health endpoints for all services

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 8GB RAM available
- Ports 3000, 5601, 9090, 9093, 9200, 16686 available

### Setup

**Linux/Mac:**
```bash
cd backend
chmod +x monitoring/setup-monitoring.sh
./monitoring/setup-monitoring.sh
```

**Windows:**
```powershell
cd backend
.\monitoring\setup-monitoring.ps1
```

### Access Monitoring Tools

| Tool | URL | Credentials |
|------|-----|-------------|
| Grafana | http://localhost:3000 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| Alertmanager | http://localhost:9093 | - |
| Kibana | http://localhost:5601 | - |
| Jaeger | http://localhost:16686 | - |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring Stack                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Prometheus  │───▶│   Grafana    │◀───│     Loki     │  │
│  │   (Metrics)  │    │ (Dashboards) │    │    (Logs)    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Alertmanager │    │    Jaeger    │    │Elasticsearch │  │
│  │   (Alerts)   │    │   (Traces)   │    │    (Logs)    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
└─────────┼────────────────────┼────────────────────┼──────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Microservices Layer                        │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │Auth  │  │User  │  │Farm  │  │Market│  │ IoT  │  ...    │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Prometheus (Metrics)

**Purpose**: Collect and store time-series metrics from all services

**Configuration**: `monitoring/prometheus/prometheus.yml`

**Metrics Collected**:
- HTTP request rate, duration, status codes
- Database query performance
- Cache hit/miss rates
- Business metrics (registrations, orders, payments)
- System metrics (CPU, memory, disk, network)

**Scrape Targets**:
- All microservices (via `/metrics` endpoint)
- PostgreSQL, MongoDB, Redis
- RabbitMQ, Kong, Consul, Vault
- Node Exporter (system metrics)

### 2. Grafana (Visualization)

**Purpose**: Visualize metrics and logs with interactive dashboards

**Configuration**: `monitoring/grafana/provisioning/`

**Pre-built Dashboards**:
1. **Service Health Overview** - Service uptime, request rates, response times, error rates
2. **Business Metrics** - User registrations, orders, revenue, marketplace activity
3. **Infrastructure Metrics** - Database connections, cache performance, queue depth

**Features**:
- Real-time metric visualization
- Custom dashboard creation
- Alert configuration
- Multi-datasource support

### 3. ELK Stack (Logging)

**Purpose**: Centralized log aggregation, processing, and visualization

**Components**:
- **Elasticsearch**: Log storage and search
- **Logstash**: Log processing and enrichment
- **Kibana**: Log visualization and analysis

**Configuration**:
- Elasticsearch: `docker-compose.infrastructure.yml`
- Logstash: `monitoring/logstash/pipeline/logstash.conf`
- Kibana: Auto-configured

**Log Format**: JSON with structured fields
```json
{
  "timestamp": "2025-12-05T10:30:00Z",
  "service": "marketplace-service",
  "level": "INFO",
  "message": "Order created",
  "user_id": "123",
  "order_id": "456",
  "trace_id": "abc123"
}
```

### 4. Jaeger (Distributed Tracing)

**Purpose**: Track requests across microservices

**Configuration**: `monitoring/jaeger/jaeger-config.yml`

**Features**:
- Request flow visualization
- Performance bottleneck identification
- Service dependency mapping
- Error tracking

**Integration**: OpenTelemetry instrumentation in all services

### 5. Alertmanager (Alerting)

**Purpose**: Intelligent alert routing and notification

**Configuration**: `monitoring/alertmanager/config.yml`

**Alert Rules**: `monitoring/prometheus/rules/alerts.yml`

**Notification Channels**:
- Email
- Slack
- PagerDuty
- Webhook

**Alert Categories**:
- Infrastructure (CPU, memory, disk)
- Database (connections, slow queries)
- Application (error rates, latency)
- Business (failed payments, low inventory)

## Service Integration

### Adding Metrics to a Service

1. **Install metrics client**:
```python
# Already included in requirements.txt
from shared.metrics_client import MetricsMiddleware, metrics_view
```

2. **Configure Django settings**:
```python
# settings.py
MIDDLEWARE = [
    'shared.metrics_client.MetricsMiddleware',
    # ... other middleware
]
```

3. **Add metrics endpoint**:
```python
# urls.py
from shared.metrics_client import metrics_view

urlpatterns = [
    path('metrics/', metrics_view),
    # ... other urls
]
```

4. **Custom metrics**:
```python
from shared.metrics_client import (
    counter_metric,
    histogram_metric,
    gauge_metric
)

# Counter - for counting events
orders_created = counter_metric(
    'orders_created_total',
    'Total number of orders created'
)
orders_created.inc()

# Histogram - for measuring durations
request_duration = histogram_metric(
    'request_duration_seconds',
    'Request duration in seconds'
)
with request_duration.time():
    # ... process request

# Gauge - for current values
active_users = gauge_metric(
    'active_users_total',
    'Number of active users'
)
active_users.set(150)
```

### Adding Health Checks

1. **Use shared health check utility**:
```python
# urls.py
from shared.health_check import create_health_check_view

urlpatterns = [
    path('health/', create_health_check_view('my-service', '1.0.0')),
]
```

2. **Add custom checks**:
```python
from shared.health_check import HealthCheck

health_checker = HealthCheck('my-service', '1.0.0')

def check_external_api():
    # Check external dependency
    return True, "External API OK"

health_checker.add_check(check_external_api)
```

### Adding Distributed Tracing

1. **Install OpenTelemetry**:
```bash
pip install opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation-django
```

2. **Configure tracing**:
```python
# settings.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter

# Set up Jaeger exporter
jaeger_exporter = JaegerExporter(
    agent_host_name='jaeger',
    agent_port=6831,
)

# Configure tracer
trace.set_tracer_provider(TracerProvider())
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(jaeger_exporter)
)
```

3. **Instrument Django**:
```python
from opentelemetry.instrumentation.django import DjangoInstrumentor

DjangoInstrumentor().instrument()
```

### Adding Structured Logging

1. **Configure logging**:
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/service.log',
            'formatter': 'json',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
        }
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    }
}
```

2. **Use structured logging**:
```python
import logging

logger = logging.getLogger(__name__)

logger.info('Order created', extra={
    'user_id': user.id,
    'order_id': order.id,
    'amount': order.total,
    'trace_id': trace_id
})
```

## Alert Rules

### Infrastructure Alerts

- **High CPU Usage**: CPU > 80% for 5 minutes
- **High Memory Usage**: Memory > 85% for 5 minutes
- **Disk Space Low**: Disk usage > 90%
- **Service Down**: Service unavailable for 1 minute

### Database Alerts

- **High Connection Count**: Connections > 80% of max
- **Slow Queries**: Query duration > 1 second
- **Replication Lag**: Lag > 10 seconds

### Application Alerts

- **High Error Rate**: Error rate > 5% for 5 minutes
- **High Latency**: P95 latency > 2 seconds
- **Failed Requests**: 5xx errors > 10/minute

### Business Alerts

- **Payment Failures**: Failed payments > 5/minute
- **Low Inventory**: Product stock < 10 units
- **Unusual Activity**: Request rate spike > 200%

## Dashboards

### Service Health Dashboard

Monitors overall service health:
- Service uptime and availability
- Request rate and throughput
- Response time (p50, p95, p99)
- Error rate by service
- CPU and memory usage

### Business Metrics Dashboard

Tracks key business metrics:
- User registrations (daily, weekly, monthly)
- Active users
- Orders created and completed
- Revenue and transaction volume
- Marketplace activity
- AI assistant usage
- IoT sensor readings
- Crop disease detections

### Infrastructure Dashboard

Monitors infrastructure components:
- PostgreSQL connections and queries
- MongoDB operations
- Redis hit rate and memory
- RabbitMQ queue depth
- Kong API Gateway requests
- Consul service health
- Vault status
- Elasticsearch cluster health

## Troubleshooting

### Prometheus Not Scraping Metrics

1. Check service is exposing `/metrics` endpoint
2. Verify service is registered in `prometheus.yml`
3. Check network connectivity: `docker exec prometheus wget -O- http://service:port/metrics`
4. Review Prometheus logs: `docker logs prometheus`

### Grafana Dashboard Not Loading

1. Verify datasource configuration in Grafana
2. Check Prometheus is accessible: http://localhost:9090
3. Test query in Prometheus UI first
4. Review Grafana logs: `docker logs grafana`

### Logs Not Appearing in Kibana

1. Check Elasticsearch is running: http://localhost:9200
2. Verify Logstash is processing logs: `docker logs logstash`
3. Create index pattern in Kibana: `logstash-*`
4. Check log format is JSON

### Traces Not Appearing in Jaeger

1. Verify Jaeger is running: http://localhost:16686
2. Check service is instrumented with OpenTelemetry
3. Verify Jaeger agent is accessible from service
4. Review Jaeger logs: `docker logs jaeger`

### Alerts Not Firing

1. Check alert rules in Prometheus: http://localhost:9090/alerts
2. Verify Alertmanager is running: http://localhost:9093
3. Check alert routing configuration
4. Test notification channels

## Performance Tuning

### Prometheus

- **Retention**: Default 30 days, adjust in `prometheus.yml`
- **Scrape Interval**: Default 15s, increase for less load
- **Storage**: Monitor disk usage, increase volume size if needed

### Elasticsearch

- **Heap Size**: Set to 50% of available RAM (max 32GB)
- **Shards**: Use 1 shard per 50GB of data
- **Retention**: Configure ILM policies for log rotation

### Grafana

- **Query Caching**: Enable for frequently accessed dashboards
- **Concurrent Queries**: Limit to prevent overload
- **Dashboard Refresh**: Set appropriate intervals (30s-5m)

## Security

### Authentication

- **Grafana**: Change default admin password immediately
- **Prometheus**: Enable basic auth in production
- **Kibana**: Configure authentication in production
- **Alertmanager**: Secure webhook endpoints

### Network Security

- Use internal Docker networks
- Expose only necessary ports
- Enable TLS for external access
- Use firewall rules

### Data Security

- Encrypt data at rest
- Use secure communication (HTTPS/TLS)
- Implement access controls
- Regular security audits

## Maintenance

### Daily Tasks

- Review critical alerts
- Check service health dashboards
- Monitor error rates

### Weekly Tasks

- Review alert trends
- Analyze performance metrics
- Check disk space usage
- Update dashboards as needed

### Monthly Tasks

- Review and update alert rules
- Optimize slow queries
- Clean up old logs
- Update monitoring stack
- Conduct DR drills

## Support

For issues or questions:
1. Check this documentation
2. Review service logs
3. Check Prometheus/Grafana for metrics
4. Contact DevOps team

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Elasticsearch Documentation](https://www.elastic.co/guide/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
