# Service Discovery Integration Guide

This guide helps developers integrate their microservices with Consul service discovery.

## Table of Contents

1. [Quick Integration](#quick-integration)
2. [Django Integration](#django-integration)
3. [Health Check Implementation](#health-check-implementation)
4. [Service Discovery Usage](#service-discovery-usage)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Quick Integration

### Step 1: Install Dependencies

```bash
pip install python-consul
```

### Step 2: Register Your Service

Add to your Django app's `apps.py`:

```python
from django.apps import AppConfig
from service_discovery.service_registration_template import (
    register_with_consul,
    ServiceNames
)
import logging

logger = logging.getLogger(__name__)

class YourServiceConfig(AppConfig):
    name = 'your_service'
    
    def ready(self):
        import sys
        # Don't register during migrations
        if 'migrate' not in sys.argv and 'makemigrations' not in sys.argv:
            try:
                register_with_consul(
                    service_name=ServiceNames.YOUR_SERVICE,
                    port=8000,  # Your service port
                    tags=['v1', 'django'],
                    health_check_path='/api/v1/health'
                )
                logger.info("Service registered with Consul")
            except Exception as e:
                logger.error(f"Failed to register with Consul: {e}")
```

### Step 3: Add Health Check Endpoint

Add to your `urls.py`:

```python
from django.urls import path
from shared.health_check import create_health_check_view

urlpatterns = [
    path('api/v1/health/', create_health_check_view('your-service', '1.0.0')),
    # ... other urls
]
```

### Step 4: Discover Other Services

```python
from service_discovery.service_registration_template import (
    discover_service,
    ServiceNames
)
import requests

# Discover authentication service
auth_address = discover_service(ServiceNames.AUTHENTICATION)
if auth_address:
    response = requests.post(
        f'http://{auth_address}/api/v1/auth/verify',
        headers={'Authorization': f'Bearer {token}'}
    )
```

## Django Integration

### Complete Example: Marketplace Service

#### 1. App Configuration (`marketplace/apps.py`)

```python
from django.apps import AppConfig
from service_discovery.service_registration_template import (
    register_with_consul,
    ServiceNames
)
import logging
import os

logger = logging.getLogger(__name__)

class MarketplaceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'marketplace'
    
    def ready(self):
        """Register service with Consul when Django app is ready"""
        import sys
        
        # Skip registration during management commands
        skip_commands = ['migrate', 'makemigrations', 'collectstatic', 'test']
        if any(cmd in sys.argv for cmd in skip_commands):
            return
        
        # Only register in appropriate environments
        environment = os.getenv('ENVIRONMENT', 'development')
        if environment in ['development', 'staging', 'production']:
            try:
                port = int(os.getenv('SERVICE_PORT', '8004'))
                version = os.getenv('SERVICE_VERSION', '1.0.0')
                
                success = register_with_consul(
                    service_name=ServiceNames.MARKETPLACE,
                    port=port,
                    tags=['marketplace', 'v1', 'django', environment],
                    meta={
                        'version': version,
                        'environment': environment,
                        'description': 'Marketplace service for product listings and orders'
                    },
                    health_check_path='/api/v1/health'
                )
                
                if success:
                    logger.info(
                        f"Marketplace service registered with Consul "
                        f"(port: {port}, env: {environment})"
                    )
                else:
                    logger.warning("Failed to register with Consul")
                    
            except Exception as e:
                logger.error(f"Error registering with Consul: {e}", exc_info=True)
```

#### 2. URL Configuration (`marketplace/urls.py`)

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from shared.health_check import create_health_check_view
from . import views

router = DefaultRouter()
router.register(r'products', views.ProductViewSet)
router.register(r'orders', views.OrderViewSet)

urlpatterns = [
    # Health check endpoint for Consul
    path('api/v1/health/', create_health_check_view('marketplace-service', '1.0.0')),
    
    # API endpoints
    path('api/v1/', include(router.urls)),
]
```

#### 3. Service Client (`marketplace/services/auth_client.py`)

```python
"""
Authentication service client using Consul service discovery
"""

import requests
import logging
from typing import Optional, Dict, Any
from service_discovery.service_registration_template import (
    discover_service,
    ServiceNames
)

logger = logging.getLogger(__name__)

class AuthServiceClient:
    """Client for authentication service"""
    
    def __init__(self):
        self.service_name = ServiceNames.AUTHENTICATION
        self._cached_address = None
        self._cache_time = 0
        self._cache_ttl = 60  # Cache for 60 seconds
    
    def _get_service_address(self) -> Optional[str]:
        """Get authentication service address with caching"""
        import time
        
        # Use cached address if still valid
        if self._cached_address and (time.time() - self._cache_time) < self._cache_ttl:
            return self._cached_address
        
        # Discover service
        address = discover_service(self.service_name)
        
        if address:
            self._cached_address = address
            self._cache_time = time.time()
            logger.debug(f"Discovered auth service at: {address}")
        else:
            logger.warning("Authentication service not found in Consul")
        
        return address
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify JWT token with authentication service
        
        Args:
            token: JWT token to verify
            
        Returns:
            User data if token is valid, None otherwise
        """
        address = self._get_service_address()
        if not address:
            logger.error("Cannot verify token: auth service not available")
            return None
        
        try:
            response = requests.post(
                f'http://{address}/api/v1/auth/verify',
                headers={'Authorization': f'Bearer {token}'},
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"Token verification failed: {response.status_code}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Error calling auth service: {e}")
            return None
    
    def get_user_info(self, user_id: int, token: str) -> Optional[Dict[str, Any]]:
        """
        Get user information from authentication service
        
        Args:
            user_id: User ID
            token: JWT token for authentication
            
        Returns:
            User data if found, None otherwise
        """
        address = self._get_service_address()
        if not address:
            return None
        
        try:
            response = requests.get(
                f'http://{address}/api/v1/users/{user_id}',
                headers={'Authorization': f'Bearer {token}'},
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
                
        except requests.RequestException as e:
            logger.error(f"Error getting user info: {e}")
            return None


# Singleton instance
auth_client = AuthServiceClient()
```

## Health Check Implementation

### Basic Health Check

```python
from shared.health_check import create_health_check_view

# In urls.py
urlpatterns = [
    path('health/', create_health_check_view('my-service', '1.0.0')),
]
```

### Custom Health Check

```python
from shared.health_check import HealthCheck

# Create custom health checker
health_checker = HealthCheck('my-service', '1.0.0')

# Add custom check
def check_external_api():
    """Check if external API is available"""
    try:
        import requests
        response = requests.get('https://api.example.com/health', timeout=2)
        return response.status_code == 200, f"API status: {response.status_code}"
    except Exception as e:
        return False, f"API error: {str(e)}"

health_checker.add_check(check_external_api)

# Use in view
def health_view(request):
    return health_checker.get_response()
```

### Advanced Health Check

```python
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import requests

def health_check(request):
    """Comprehensive health check"""
    checks = {}
    overall_healthy = True
    
    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks['database'] = {'status': 'healthy', 'message': 'OK'}
    except Exception as e:
        checks['database'] = {'status': 'unhealthy', 'message': str(e)}
        overall_healthy = False
    
    # Check cache
    try:
        cache.set('health_check', 'ok', 10)
        result = cache.get('health_check')
        if result == 'ok':
            checks['cache'] = {'status': 'healthy', 'message': 'OK'}
        else:
            checks['cache'] = {'status': 'unhealthy', 'message': 'Read/write failed'}
            overall_healthy = False
    except Exception as e:
        checks['cache'] = {'status': 'unhealthy', 'message': str(e)}
        overall_healthy = False
    
    # Check external dependencies
    try:
        from service_discovery.service_registration_template import discover_service
        auth_address = discover_service('authentication-service')
        if auth_address:
            checks['auth_service'] = {'status': 'healthy', 'message': f'Available at {auth_address}'}
        else:
            checks['auth_service'] = {'status': 'degraded', 'message': 'Not found'}
    except Exception as e:
        checks['auth_service'] = {'status': 'unhealthy', 'message': str(e)}
    
    status_code = 200 if overall_healthy else 503
    
    return JsonResponse({
        'service': 'my-service',
        'version': '1.0.0',
        'status': 'healthy' if overall_healthy else 'unhealthy',
        'checks': checks
    }, status=status_code)
```

## Service Discovery Usage

### Discover Single Service

```python
from service_discovery.service_registration_template import discover_service

# Simple discovery
address = discover_service('marketplace-service')
if address:
    print(f"Service at: {address}")
```

### Discover with Caching

```python
import time
from typing import Optional

class ServiceDiscoveryCache:
    """Cache service addresses to reduce Consul queries"""
    
    def __init__(self, ttl: int = 60):
        self.ttl = ttl
        self.cache = {}
    
    def get_service(self, service_name: str) -> Optional[str]:
        """Get service address with caching"""
        now = time.time()
        
        # Check cache
        if service_name in self.cache:
            address, timestamp = self.cache[service_name]
            if now - timestamp < self.ttl:
                return address
        
        # Discover service
        from service_discovery.service_registration_template import discover_service
        address = discover_service(service_name)
        
        if address:
            self.cache[service_name] = (address, now)
        
        return address

# Usage
cache = ServiceDiscoveryCache(ttl=60)
address = cache.get_service('marketplace-service')
```

### Discover Multiple Instances

```python
from shared.consul_client import ConsulClient

client = ConsulClient()

# Get all instances
instances = client.discover_service('marketplace-service')

for instance in instances:
    print(f"Instance: {instance['service_id']}")
    print(f"Address: {instance['address']}:{instance['port']}")
    print(f"Tags: {instance['tags']}")
    print(f"Health: {instance['checks']}")
```

### Load Balancing

```python
import random
from shared.consul_client import ConsulClient

def get_service_with_load_balancing(service_name: str) -> Optional[str]:
    """Get service address with random load balancing"""
    client = ConsulClient()
    instances = client.discover_service(service_name, passing_only=True)
    
    if not instances:
        return None
    
    # Random selection for load balancing
    instance = random.choice(instances)
    return f"{instance['address']}:{instance['port']}"
```

## Best Practices

### 1. Service Registration

✅ **DO**:
- Register services in `apps.py` `ready()` method
- Skip registration during migrations and tests
- Use environment-specific tags
- Include version information
- Provide meaningful metadata

❌ **DON'T**:
- Register in `__init__.py` (runs multiple times)
- Register during management commands
- Use hardcoded service addresses
- Forget to handle registration failures

### 2. Health Checks

✅ **DO**:
- Keep health checks fast (< 1 second)
- Check critical dependencies only
- Return detailed status information
- Use appropriate HTTP status codes (200/503)
- Test health endpoints regularly

❌ **DON'T**:
- Make external API calls in health checks
- Check non-critical dependencies
- Return 200 when service is unhealthy
- Perform expensive operations

### 3. Service Discovery

✅ **DO**:
- Cache discovered addresses (30-60 seconds)
- Handle service unavailability gracefully
- Use circuit breakers for resilience
- Implement retry logic with backoff
- Log discovery failures

❌ **DON'T**:
- Query Consul on every request
- Fail hard when service not found
- Ignore discovery errors
- Use stale cached addresses indefinitely

### 4. Error Handling

```python
from service_discovery.service_registration_template import discover_service
import requests
import logging

logger = logging.getLogger(__name__)

def call_service_safely(service_name: str, endpoint: str, **kwargs):
    """Call a service with proper error handling"""
    try:
        # Discover service
        address = discover_service(service_name)
        if not address:
            logger.error(f"Service {service_name} not found")
            return None
        
        # Make request with timeout
        url = f'http://{address}{endpoint}'
        response = requests.request(timeout=5, **kwargs)
        response.raise_for_status()
        
        return response.json()
        
    except requests.Timeout:
        logger.error(f"Timeout calling {service_name}")
        return None
    except requests.RequestException as e:
        logger.error(f"Error calling {service_name}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return None
```

## Troubleshooting

### Service Not Registering

**Problem**: Service doesn't appear in Consul

**Solutions**:
1. Check Consul is running: `./setup-consul.sh status`
2. Verify registration code is in `apps.py` `ready()` method
3. Check logs for registration errors
4. Ensure health endpoint is accessible
5. Verify network connectivity to Consul

### Service Shows as Unhealthy

**Problem**: Service registered but marked unhealthy

**Solutions**:
1. Test health endpoint: `curl http://localhost:8000/health`
2. Check health check returns 200 status code
3. Verify health check completes within timeout (5s)
4. Review service logs for errors
5. Check database/cache connectivity

### Service Not Discoverable

**Problem**: Cannot find service via discovery

**Solutions**:
1. Verify service is registered: `./setup-consul.sh services`
2. Check service health: `./setup-consul.sh health <service-name>`
3. Ensure `passing_only=True` isn't filtering all instances
4. Verify service name is correct
5. Check Consul connectivity

### Stale Service Instances

**Problem**: Discovering dead service instances

**Solutions**:
1. Use `passing_only=True` in discovery
2. Implement health checks properly
3. Ensure services deregister on shutdown
4. Check Consul deregistration timeout (30s)
5. Manually deregister: `./setup-consul.sh deregister <service-id>`

## Additional Resources

- [Consul Documentation](https://www.consul.io/docs)
- [Service Discovery README](../../service_discovery/README.md)
- [Quick Start Guide](../../service_discovery/QUICK_START.md)
- [Health Check Utilities](../../shared/health_check.py)
- [Consul Client](../../shared/consul_client.py)

---

**Last Updated**: December 3, 2025  
**Maintained by**: AgroBridge Infrastructure Team
