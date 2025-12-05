# Monitoring Service - Quick Start Guide

Get the AgroBridge monitoring stack up and running in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- At least 8GB RAM available
- Ports 3000, 5601, 9090, 9093, 9200, 16686 available

## Step 1: Start Monitoring Stack

### Linux/Mac
```bash
cd backend
chmod +x monitoring/setup-monitoring.sh
./monitoring/setup-monitoring.sh
```

### Windows
```powershell
cd backend
.\monitoring\setup-monitoring.ps1
```

## Step 2: Access Monitoring Tools

Open your browser and navigate to:

- **Grafana**: http://localhost:3000 (login: admin/admin)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601
- **Jaeger**: http://localhost:16686

## Step 3: Explore Dashboards

In Grafana:
1. Click "Dashboards" in the left menu
2. Open "AgroBridge" folder
3. Explore the pre-built dashboards:
   - Service Health Overview
   - Business Metrics
   - Infrastructure Metrics

## Step 4: Test Monitoring

Run the test suite to verify everything is working:

```bash
cd backend
pip install requests
python monitoring/test-monitoring.py
```

Expected output:
```
✓ Prometheus is healthy
✓ Grafana is healthy
✓ Elasticsearch is healthy
✓ Jaeger is healthy
...
All tests passed! Monitoring is fully operational.
```

## Step 5: Add Monitoring to Your Service

### 1. Add metrics endpoint

```python
# urls.py
from shared.metrics_client import metrics_view

urlpatterns = [
    path('metrics/', metrics_view),
]
```

### 2. Add health check

```python
# urls.py
from shared.health_check import create_health_check_view

urlpatterns = [
    path('health/', create_health_check_view('my-service', '1.0.0')),
]
```

### 3. Add middleware

```python
# settings.py
MIDDLEWARE = [
    'shared.metrics_client.MetricsMiddleware',
    # ... other middleware
]
```

### 4. Configure JSON logging

```python
# settings.py
LOGGING = {
    'version': 1,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        }
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    }
}
```

## Common Tasks

### View Service Metrics

1. Open Prometheus: http://localhost:9090
2. Enter a query: `http_requests_total`
3. Click "Execute"

### View Service Logs

1. Open Kibana: http://localhost:5601
2. Create index pattern: `logstash-*`
3. Go to "Discover" to view logs

### View Traces

1. Open Jaeger: http://localhost:16686
2. Select a service from dropdown
3. Click "Find Traces"

### Create Custom Dashboard

1. Open Grafana: http://localhost:3000
2. Click "+" → "Dashboard"
3. Add panels with Prometheus queries
4. Save dashboard

## Troubleshooting

### Services not starting

```bash
# Check Docker is running
docker info

# Check logs
docker-compose -f docker-compose.infrastructure.yml logs prometheus
```

### Metrics not appearing

```bash
# Check service is exposing metrics
curl http://localhost:8000/metrics

# Check Prometheus targets
# Open http://localhost:9090/targets
```

### Dashboards empty

1. Wait 1-2 minutes for data collection
2. Check Prometheus has data: http://localhost:9090
3. Verify datasource in Grafana settings

## Stop Monitoring

```bash
cd backend
docker-compose -f docker-compose.infrastructure.yml down
```

## Next Steps

- Read the full [Monitoring README](README.md)
- Configure alert channels
- Create custom dashboards
- Add tracing to services

## Support

For issues:
1. Check [README.md](README.md) troubleshooting section
2. Run test suite: `python monitoring/test-monitoring.py`
3. Check service logs
4. Contact DevOps team
