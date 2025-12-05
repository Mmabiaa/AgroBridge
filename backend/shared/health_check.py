"""
Health Check Utilities for AgroBridge Microservices

This module provides standardized health check functionality
for all microservices to use with Consul service discovery.
"""

from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import logging
import time
from typing import Dict, Any, List, Callable

logger = logging.getLogger(__name__)


class HealthCheckStatus:
    """Health check status constants"""
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    DEGRADED = "degraded"


class HealthCheck:
    """
    Health check manager for microservices
    
    Performs comprehensive health checks including:
    - Database connectivity
    - Cache availability
    - External service dependencies
    - Custom checks
    """
    
    def __init__(self, service_name: str, version: str = "1.0.0"):
        """
        Initialize health check manager
        
        Args:
            service_name: Name of the microservice
            version: Service version
        """
        self.service_name = service_name
        self.version = version
        self.custom_checks: List[Callable] = []
    
    def add_check(self, check_func: Callable) -> None:
        """
        Add a custom health check function
        
        Args:
            check_func: Function that returns (bool, str) - (is_healthy, message)
        """
        self.custom_checks.append(check_func)
    
    def check_database(self) -> tuple[bool, str]:
        """
        Check database connectivity
        
        Returns:
            Tuple of (is_healthy, message)
        """
        try:
            start_time = time.time()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            elapsed = (time.time() - start_time) * 1000
            
            return True, f"Database OK ({elapsed:.2f}ms)"
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False, f"Database error: {str(e)}"
    
    def check_cache(self) -> tuple[bool, str]:
        """
        Check cache connectivity
        
        Returns:
            Tuple of (is_healthy, message)
        """
        try:
            start_time = time.time()
            test_key = f"health_check_{self.service_name}"
            test_value = "ok"
            
            # Test write
            cache.set(test_key, test_value, timeout=10)
            
            # Test read
            result = cache.get(test_key)
            
            # Test delete
            cache.delete(test_key)
            
            elapsed = (time.time() - start_time) * 1000
            
            if result == test_value:
                return True, f"Cache OK ({elapsed:.2f}ms)"
            else:
                return False, "Cache read/write mismatch"
                
        except Exception as e:
            logger.error(f"Cache health check failed: {e}")
            return False, f"Cache error: {str(e)}"
    
    def perform_checks(self) -> Dict[str, Any]:
        """
        Perform all health checks
        
        Returns:
            Dictionary with health check results
        """
        checks = {}
        overall_healthy = True
        
        # Check database
        db_healthy, db_message = self.check_database()
        checks['database'] = {
            'status': HealthCheckStatus.HEALTHY if db_healthy else HealthCheckStatus.UNHEALTHY,
            'message': db_message
        }
        if not db_healthy:
            overall_healthy = False
        
        # Check cache
        cache_healthy, cache_message = self.check_cache()
        checks['cache'] = {
            'status': HealthCheckStatus.HEALTHY if cache_healthy else HealthCheckStatus.UNHEALTHY,
            'message': cache_message
        }
        if not cache_healthy:
            overall_healthy = False
        
        # Run custom checks
        for i, check_func in enumerate(self.custom_checks):
            try:
                is_healthy, message = check_func()
                check_name = getattr(check_func, '__name__', f'custom_check_{i}')
                checks[check_name] = {
                    'status': HealthCheckStatus.HEALTHY if is_healthy else HealthCheckStatus.UNHEALTHY,
                    'message': message
                }
                if not is_healthy:
                    overall_healthy = False
            except Exception as e:
                logger.error(f"Custom health check failed: {e}")
                checks[f'custom_check_{i}'] = {
                    'status': HealthCheckStatus.UNHEALTHY,
                    'message': f"Check error: {str(e)}"
                }
                overall_healthy = False
        
        return {
            'service': self.service_name,
            'version': self.version,
            'status': HealthCheckStatus.HEALTHY if overall_healthy else HealthCheckStatus.UNHEALTHY,
            'timestamp': time.time(),
            'checks': checks
        }
    
    def get_response(self) -> JsonResponse:
        """
        Get health check response for HTTP endpoint
        
        Returns:
            JsonResponse with health check results
        """
        result = self.perform_checks()
        status_code = 200 if result['status'] == HealthCheckStatus.HEALTHY else 503
        return JsonResponse(result, status=status_code)


def create_health_check_view(service_name: str, version: str = "1.0.0"):
    """
    Create a health check view for Django
    
    Args:
        service_name: Name of the microservice
        version: Service version
        
    Returns:
        Django view function
        
    Example:
        # In urls.py
        from shared.health_check import create_health_check_view
        
        urlpatterns = [
            path('health/', create_health_check_view('marketplace-service', '1.0.0')),
        ]
    """
    health_checker = HealthCheck(service_name, version)
    
    def health_check_view(request):
        return health_checker.get_response()
    
    return health_check_view


# Example custom health check functions

def check_external_api() -> tuple[bool, str]:
    """
    Example: Check external API availability
    
    Returns:
        Tuple of (is_healthy, message)
    """
    try:
        import requests
        response = requests.get('https://api.example.com/health', timeout=2)
        if response.status_code == 200:
            return True, "External API OK"
        else:
            return False, f"External API returned {response.status_code}"
    except Exception as e:
        return False, f"External API error: {str(e)}"


def check_message_queue() -> tuple[bool, str]:
    """
    Example: Check RabbitMQ connectivity
    
    Returns:
        Tuple of (is_healthy, message)
    """
    try:
        from celery import current_app
        
        # Try to inspect Celery
        inspect = current_app.control.inspect()
        stats = inspect.stats()
        
        if stats:
            return True, "Message queue OK"
        else:
            return False, "No workers available"
    except Exception as e:
        return False, f"Message queue error: {str(e)}"


def check_storage() -> tuple[bool, str]:
    """
    Example: Check file storage availability
    
    Returns:
        Tuple of (is_healthy, message)
    """
    try:
        from django.core.files.storage import default_storage
        
        # Try to write and read a test file
        test_file = 'health_check_test.txt'
        test_content = b'test'
        
        default_storage.save(test_file, test_content)
        exists = default_storage.exists(test_file)
        default_storage.delete(test_file)
        
        if exists:
            return True, "Storage OK"
        else:
            return False, "Storage read/write failed"
    except Exception as e:
        return False, f"Storage error: {str(e)}"
