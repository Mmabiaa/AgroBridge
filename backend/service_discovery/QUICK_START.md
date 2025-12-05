# Consul Service Discovery - Quick Start Guide

Get started with Consul service discovery in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- Python 3.10+ installed
- Backend infrastructure directory

## Step 1: Install Python Package

```bash
pip install python-consul
```

## Step 2: Start Consul

**Linux/Mac:**
```bash
cd backend/service_discovery
chmod +x setup-consul.sh
./setup-consul.sh setup
```

**Windows:**
```powershell
cd backend\service_discovery
.\setup-consul.ps1 setup
```

## Step 3: Verify Installation

```bash
# Check status
./setup-consul.sh status

# Open Consul UI
# Browser: http://localhost:8500
```

## Step 4: Register Your Service

Add to your Django `apps.py`:

```python
from django.apps import AppConfig
from service_discovery.service_registration_template import register_with_consul

class MyServiceConfig(AppConfig):
    name = 'my_service'
    
    def ready(self):
        import sys
        if 'migrate' not in sys.argv:
            register_with_consul(
                service_name='my-service',
                port=8000,
                tags=['v1', 'django']
            )
```

## Step 5: Add Health Check Endpoint

Add to your `urls.py`:

```python
from django.urls import path
from shared.health_check import create_health_check_view

urlpatterns = [
    path('health/', create_health_check_view('my-service', '1.0.0')),
    # ... other urls
]
```

## Step 6: Discover Other Services

```python
from service_discovery.service_registration_template import discover_service

# Find authentication service
auth_address = discover_service('authentication-service')
print(f"Auth service at: {auth_address}")
```

## That's It!

Your service is now:
- ✅ Registered with Consul
- ✅ Health checked every 10 seconds
- ✅ Discoverable by other services
- ✅ Automatically deregistered on shutdown

## Next Steps

- Read the full [README.md](README.md) for advanced features
- Explore the [Consul UI](http://localhost:8500)
- Check service health: `./setup-consul.sh health my-service`
- View all services: `./setup-consul.sh services`

## Common Commands

```bash
# Start Consul
./setup-consul.sh start

# Stop Consul
./setup-consul.sh stop

# View logs
./setup-consul.sh logs

# List services
./setup-consul.sh services

# Check service health
./setup-consul.sh health <service-name>
```

## Troubleshooting

**Service not registering?**
- Check Consul is running: `./setup-consul.sh status`
- Verify health endpoint: `curl http://localhost:8000/health`

**Service unhealthy?**
- Test health check: `curl http://localhost:8000/health`
- Check service logs for errors

**Need help?**
- See [README.md](README.md) troubleshooting section
- Check Consul logs: `./setup-consul.sh logs`

---

**Quick Reference**

| Action | Command |
|--------|---------|
| Start Consul | `./setup-consul.sh start` |
| Check Status | `./setup-consul.sh status` |
| View Services | `./setup-consul.sh services` |
| Consul UI | http://localhost:8500 |
| Health Check | `./setup-consul.sh health <name>` |
