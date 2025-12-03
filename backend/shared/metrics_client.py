"""
Prometheus Metrics Client for AgroBridge Microservices

This module provides utilities for exposing Prometheus metrics
from Django applications.
"""

import time
import logging
from functools import wraps
from typing import Callable
from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    Summary,
    Info,
    generate_latest,
    REGISTRY,
    CollectorRegistry
)
from django.http import HttpResponse

logger = logging.getLogger(__name__)

# Request metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

http_requests_in_progress = Gauge(
    'http_requests_in_progress',
    'HTTP requests in progress',
    ['method', 'endpoint']
)

# Database metrics
db_queries_total = Counter(
    'db_queries_total',
    'Total database queries',
    ['database', 'operation']
)

db_query_duration_seconds = Histogram(
    'db_query_duration_seconds',
    'Database query duration',
    ['database', 'operation']
)

# Cache metrics
cache_hits_total = Counter(
    'cache_hits_total',
    'Total cache hits',
    ['cache_name']
)

cache_misses_total = Counter(
    'cache_misses_total',
    'Total cache misses',
    ['cache_name']
)

# Business metrics
user_registrations_total = Counter(
    'user_registrations_total',
    'Total user registrations'
)

orders_total = Counter(
    'orders_total',
    'Total orders',
    ['status']
)

payments_total = Counter(
    'payments_total',
    'Total payments',
    ['status', 'method']
)

# Service info
service_info = Info(
    'service',
    'Service information'
)


class MetricsMiddleware:
    """
    Django middleware for collecting HTTP metrics
    
    Add to MIDDLEWARE in settings.py:
        MIDDLEWARE = [
            ...
            'shared.metrics_client.MetricsMiddleware',
        ]
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Skip metrics endpoint
        if request.path == '/metrics':
            return self.get_response(request)
        
        method = request.method
        endpoint = request.path
        
        # Track in-progress requests
        http_requests_in_progress.labels(method=method, endpoint=endpoint).inc()
        
        # Track request duration
        start_time = time.time()
        
        try:
            response = self.get_response(request)
            status = response.status_code
        except Exception as e:
            status = 500
            raise
        finally:
            # Record metrics
            duration = time.time() - start_time
            
            http_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status=status
            ).inc()
            
            http_request_duration_seconds.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
            
            http_requests_in_progress.labels(
                method=method,
                endpoint=endpoint
            ).dec()
        
        return response


def metrics_view(request):
    """
    Django view for exposing Prometheus metrics
    
    Add to urls.py:
        from shared.metrics_client import metrics_view
        
        urlpatterns = [
            path('metrics', metrics_view),
        ]
    """
    metrics = generate_latest(REGISTRY)
    return HttpResponse(
        metrics,
        content_type='text/plain; version=0.0.4; charset=utf-8'
    )


def track_time(metric: Histogram):
    """
    Decorator to track function execution time
    
    Usage:
        @track_time(http_request_duration_seconds.labels(method='GET', endpoint='/api/users'))
        def get_users():
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                return func(*args, **kwargs)
            finally:
                duration = time.time() - start_time
                metric.observe(duration)
        return wrapper
    return decorator


def count_calls(metric: Counter):
    """
    Decorator to count function calls
    
    Usage:
        @count_calls(user_registrations_total)
        def register_user():
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            metric.inc()
            return result
        return wrapper
    return decorator


def set_service_info(name: str, version: str, **kwargs):
    """
    Set service information
    
    Usage:
        set_service_info(
            name='marketplace-service',
            version='1.0.0',
            environment='production'
        )
    """
    info = {
        'name': name,
        'version': version,
        **kwargs
    }
    service_info.info(info)


# Example usage functions

def track_database_query(database: str, operation: str):
    """
    Context manager for tracking database queries
    
    Usage:
        with track_database_query('postgres', 'SELECT'):
            # Execute query
            pass
    """
    class DatabaseQueryTracker:
        def __enter__(self):
            self.start_time = time.time()
            return self
        
        def __exit__(self, exc_type, exc_val, exc_tb):
            duration = time.time() - self.start_time
            db_queries_total.labels(database=database, operation=operation).inc()
            db_query_duration_seconds.labels(database=database, operation=operation).observe(duration)
    
    return DatabaseQueryTracker()


def track_cache_access(cache_name: str, hit: bool):
    """
    Track cache hit/miss
    
    Usage:
        result = cache.get(key)
        track_cache_access('redis', result is not None)
    """
    if hit:
        cache_hits_total.labels(cache_name=cache_name).inc()
    else:
        cache_misses_total.labels(cache_name=cache_name).inc()


def track_order(status: str):
    """
    Track order creation
    
    Usage:
        track_order('completed')
    """
    orders_total.labels(status=status).inc()


def track_payment(status: str, method: str):
    """
    Track payment
    
    Usage:
        track_payment('success', 'stripe')
    """
    payments_total.labels(status=status, method=method).inc()
