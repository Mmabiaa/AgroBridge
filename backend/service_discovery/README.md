# Consul Service Discovery for AgroBridge

This directory contains the Consul service discovery infrastructure for the AgroBridge microservices platform. Consul provides automatic service registration, health checking, and dynamic service discovery.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Service Registration](#service-registration)
- [Service Discovery](#service-discovery)
- [Health Checks](#health-checks)
- [DNS Integration](#dns-integration)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

### What is Service Discovery?

Service discovery is a mechanism that allows microservices to find and communicate with each other dynamically without hardcoding network locations. Consul provides:

- **Service Registration**: Services automatically register themselves on startup
- **Health Checking**: Continuous monitoring of service health
- **Service Discovery**: Dynamic lookup of service locations
- **DNS Integration**: Services accessible via DNS queries
- **Key-Value Store**: Distributed configuration storage
- **Service Mesh**: Secure service-to-service communication

### Why Consul?

- **Production-Ready**: Battle-tested by thousands of companies
- **Multi-Datacenter**: Supports multiple datacenters out of the box
- **Service Mesh**: Built-in support for secure service communication
- **Rich API**: HTTP API and DNS interface
- **UI Dashboard**: Web-based management interface
- **Health Checks**: Multiple health check types (HTTP, TCP, script)

## Architecture

### Consul Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Consul Server                            │
│  - Service Registry                                          │
│  - Health Check Manager                                      │
│  - DNS Server (port 8600)                                    │
│  - HTTP API (port 8500)                                      │
│  - UI Dashboard (http://localhost:8500)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Registration & Discovery
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Auth Service │    │  Marketplace  │    │  AI Assistant │
│  Port: 8001   │    │  Port: 8004   │    │  Port: 8005   │
│  /health      │    │  /health      │    │  /health      │
└───────────────┘    └───────────────┘    └───────────────┘
```

### Service Registration Flow

1. **Service Starts**: Microservice initializes
2. **Register**: Service registers with Consul (name, address, port, health check)
3. **Health Check**: Consul periodically checks service health
4. **Discovery**: Other services query Consul to find service instances
5. **Deregister**: Service deregisters on shutdown

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Python 3.10+ with `python-consul` package
- Backend infrastructure running

### 1. Install Python Dependencies

```bash
cd backend
pip install python-consul
```

Or add to your `requirements.txt`:
```
python-consul==1.1.0
```

### 2. Start Consul

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

### 3. Verify Installation

```bash
# Check Consul status
./setup-consul.sh status

# Access Consul UI
# Open browser: http://localhost:8500
```

### 4. Register Your First Service

```python
from service_discovery.service_registration_template import register_with_consul

# Register service on startup
register_with_consul(
    service_name='my-service',
    port=8000,
    tags=['v1', 'django'],
    health_check_path='/health'
)
```

## Configuration

### Consul Configuration File

**File**: `consul-config.json`

```json
{
  "datacenter": "agrobridge-dc1",
  "data_dir": "/consul/data",
  "log_level": "INFO",
  "server": true,
  "bootstrap_expect": 1,
  "ui_config": {
    "enabled": true
  },
  "ports": {
    "dns": 8600,
    "http": 8500,
    "grpc": 8502
  },
  "connect": {
    "enabled": true
  }
}
```

### Environment Variables

```bash
# Consul connection
CONSUL_HOST=localhost
CONSUL_PORT=8500
CONSUL_TOKEN=          # Optional ACL token

# Service configuration
SERVICE_VERSION=1.0.0
ENVIRONMENT=development
```

## Service Registration

### Basic Registration

```python
from service_discovery.service_registration_template import (
    register_with_consul,
    ServiceNames
)

# Register marketplace service
register_with_consul(
    service_name=ServiceNames.MARKETPLACE,
    port=8004,
    tags=['marketplace', 'v1', 'django'],
    meta={
        'version': '1.0.0',
        'description': 'Marketplace service for product listings'
    }
)
```

### Django Integration

**File**: `marketplace/apps.py`

```python
from django.apps import AppConfig
from service_discovery.service_registration_template import (
    register_with_consul,
    ServiceNames
)
import logging

logger = logging.getLogger(__name__)

class MarketplaceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'marketplace'

    def ready(self):
        """Register service with Consul when Django app is ready"""
        try:
            # Only register in production/staging, not during migrations
            import sys
            if 'migrate' not in sys.argv and 'makemigrations' not in sys.argv:
                success = register_with_consul(
                    service_name=ServiceNames.MARKETPLACE,
                    port=8004,
                    tags=['marketplace', 'v1', 'django'],
                    health_check_path='/api/v1/health'
                )
                
                if success:
                    logger.info("Marketplace service registered with Consul")
                else:
                    logger.warning("Failed to register with Consul")
        except Exception as e:
            logger.error(f"Error registering with Consul: {e}")
```

### Advanced Registration

```python
from shared.consul_client import ConsulClient, ServiceConfig

# Create custom configuration
config = ServiceConfig(
    name='marketplace-service',
    service_id='marketplace-prod-01',
    host='192.168.1.100',
    port=8004,
    tags=['marketplace', 'v1', 'production'],
    meta={
        'version': '1.0.0',
        'region': 'us-west',
        'datacenter': 'dc1'
    },
    health_check_path='/health',
    health_check_interval='10s',
    health_check_timeout='5s',
    health_check_deregister_critical_after='30s'
)

# Register with custom config
client = ConsulClient()
client.register_service(config)
```

## Service Discovery

### Discover Services

```python
from service_discovery.service_registration_template import (
    discover_service,
    ServiceNames
)

# Discover authentication service
auth_address = discover_service(ServiceNames.AUTHENTICATION)
if auth_address:
    print(f"Auth service at: {auth_address}")
    # Output: Auth service at: 172.20.0.10:8001
```

### Get All Service Instances

```python
from shared.consul_client import ConsulClient

client = ConsulClient()

# Get all instances of marketplace service
instances = client.discover_service('marketplace-service')

for instance in instances:
    print(f"Instance: {instance['service_id']}")
    print(f"Address: {instance['address']}:{instance['port']}")
    print(f"Tags: {instance['tags']}")
    print(f"Health: {instance['checks']}")
```

### Filter by Tags

```python
# Discover only production instances
instances = client.discover_service(
    'marketplace-service',
    tag='production',
    passing_only=True
)
```

### Making Service Calls

```python
import requests
from service_discovery.service_registration_template import discover_service

# Discover and call authentication service
auth_address = discover_service('authentication-service')
if auth_address:
    response = requests.post(
        f'http://{auth_address}/api/v1/auth/login',
        json={'email': 'user@example.com', 'password': 'password'}
    )
    print(response.json())
```

## Health Checks

### Health Check Endpoint

Every service must implement a health check endpoint:

```python
# Django view example
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    """Health check endpoint for Consul"""
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            'status': 'healthy',
            'service': 'marketplace-service',
            'version': '1.0.0'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=503)
```

### Health Check Types

Consul supports multiple health check types:

1. **HTTP Check** (Recommended)
   ```python
   check = consul.Check.http(
       url='http://localhost:8004/health',
       interval='10s',
       timeout='5s'
   )
   ```

2. **TCP Check**
   ```python
   check = consul.Check.tcp(
       host='localhost',
       port=8004,
       interval='10s',
       timeout='5s'
   )
   ```

3. **TTL Check**
   ```python
   check = consul.Check.ttl('30s')
   ```

### Health Check Best Practices

- **Fast Checks**: Keep health checks under 1 second
- **Comprehensive**: Check critical dependencies (database, cache)
- **Graceful**: Don't fail on temporary issues
- **Informative**: Return detailed status information

## DNS Integration

### DNS Queries

Consul provides DNS interface on port 8600:

```bash
# Query service by name
dig @localhost -p 8600 marketplace-service.service.consul

# Query with tag filter
dig @localhost -p 8600 production.marketplace-service.service.consul

# Get SRV records (includes port)
dig @localhost -p 8600 marketplace-service.service.consul SRV
```

### DNS Configuration

Configure your application to use Consul DNS:

```python
# /etc/resolv.conf
nameserver 127.0.0.1
port 8600
```

### Service URLs

Services are accessible via DNS:

```
<service-name>.service.consul
<tag>.<service-name>.service.consul
```

Examples:
- `marketplace-service.service.consul`
- `production.marketplace-service.service.consul`

## Monitoring

### Consul UI

Access the Consul UI at: http://localhost:8500

Features:
- View all registered services
- Check service health status
- Browse key-value store
- View cluster members
- Monitor service checks

### CLI Commands

```bash
# List all services
./setup-consul.sh services

# Get service details
./setup-consul.sh service marketplace-service

# Check service health
./setup-consul.sh health marketplace-service

# View cluster members
docker exec agrobridge-consul consul members

# Check Consul status
./setup-consul.sh status
```

### Metrics

Consul exposes Prometheus metrics:

```bash
# Enable Prometheus metrics
curl http://localhost:8500/v1/agent/metrics?format=prometheus
```

## Troubleshooting

### Service Not Registering

**Problem**: Service fails to register with Consul

**Solutions**:
1. Check Consul is running: `./setup-consul.sh status`
2. Verify network connectivity: `curl http://localhost:8500/v1/status/leader`
3. Check service logs for errors
4. Verify health check endpoint is accessible

### Service Shows as Unhealthy

**Problem**: Service registered but marked as unhealthy

**Solutions**:
1. Test health check endpoint: `curl http://localhost:8004/health`
2. Check health check configuration (timeout, interval)
3. Review service logs for errors
4. Verify all dependencies are available

### Service Not Discoverable

**Problem**: Cannot discover service instances

**Solutions**:
1. Verify service is registered: `./setup-consul.sh services`
2. Check service health: `./setup-consul.sh health <service-name>`
3. Ensure passing_only=True isn't filtering all instances
4. Verify tag filters are correct

### Consul Not Starting

**Problem**: Consul container fails to start

**Solutions**:
1. Check Docker logs: `docker logs agrobridge-consul`
2. Verify configuration: `./setup-consul.sh validate`
3. Check port conflicts (8500, 8600)
4. Ensure sufficient disk space

## Best Practices

### Service Registration

1. **Register on Startup**: Register as soon as service is ready
2. **Deregister on Shutdown**: Clean up on graceful shutdown
3. **Unique IDs**: Use unique service instance IDs
4. **Meaningful Tags**: Use tags for versioning and filtering
5. **Rich Metadata**: Include version, environment, region

### Health Checks

1. **Fast Checks**: Keep under 1 second
2. **Appropriate Intervals**: 10s for most services
3. **Reasonable Timeouts**: 5s timeout is usually sufficient
4. **Check Dependencies**: Verify database, cache, etc.
5. **Graceful Degradation**: Don't fail on minor issues

### Service Discovery

1. **Cache Results**: Cache discovered addresses briefly
2. **Handle Failures**: Implement fallback mechanisms
3. **Load Balancing**: Rotate through multiple instances
4. **Circuit Breakers**: Protect against cascading failures
5. **Retry Logic**: Retry failed requests with backoff

### Security

1. **ACL Tokens**: Use ACL tokens in production
2. **TLS Encryption**: Enable TLS for Consul communication
3. **Network Segmentation**: Isolate Consul network
4. **Audit Logging**: Enable audit logs
5. **Regular Updates**: Keep Consul updated

## Service Names Reference

All AgroBridge microservices:

| Service | Name | Port |
|---------|------|------|
| Authentication | `authentication-service` | 8001 |
| User | `user-service` | 8002 |
| Farm Management | `farm-management-service` | 8003 |
| Marketplace | `marketplace-service` | 8004 |
| AI Assistant | `ai-assistant-service` | 8005 |
| Crop Detection | `crop-detection-service` | 8006 |
| IoT | `iot-service` | 8007 |
| Notification | `notification-service` | 8008 |
| Financial | `financial-service` | 8009 |
| Learning | `learning-service` | 8010 |
| Community | `community-service` | 8011 |
| Scheduling | `scheduling-service` | 8012 |
| Analytics | `analytics-service` | 8013 |
| Payment | `payment-service` | 8014 |
| Admin | `admin-service` | 8015 |

## Additional Resources

- [Consul Documentation](https://www.consul.io/docs)
- [Service Discovery Patterns](https://microservices.io/patterns/service-registry.html)
- [Health Check Best Practices](https://www.consul.io/docs/discovery/checks)
- [Consul DNS Interface](https://www.consul.io/docs/discovery/dns)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Consul logs: `./setup-consul.sh logs`
3. Consult the official Consul documentation
4. Contact the AgroBridge infrastructure team

---

**Last Updated**: December 3, 2025  
**Version**: 1.0.0  
**Maintainer**: AgroBridge Infrastructure Team
