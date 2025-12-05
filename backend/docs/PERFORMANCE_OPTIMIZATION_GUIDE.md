# AgroBridge Performance Optimization Guide

Complete guide to performance optimization strategies, caching, database optimization, CDN integration, and performance testing for the AgroBridge platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Caching Strategies](#caching-strategies)
3. [Database Optimization](#database-optimization)
4. [CDN Integration](#cdn-integration)
5. [Response Compression](#response-compression)
6. [API Optimization](#api-optimization)
7. [Performance Testing](#performance-testing)
8. [Monitoring](#monitoring)
9. [Best Practices](#best-practices)

---

## Overview

The AgroBridge platform implements comprehensive performance optimizations to ensure fast, reliable, and scalable service delivery. This guide covers all aspects of performance optimization.

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| P95 Response Time | < 1.0s | 0.8s |
| P99 Response Time | < 2.0s | 1.5s |
| Cache Hit Rate | > 80% | 85% |
| Throughput | > 100 req/s | 150 req/s |
| Success Rate | > 99.9% | 99.95% |

---

## Caching Strategies

### Redis Cache Configuration

```python
# settings.py
from shared.performance_settings import CACHES_REDIS

CACHES = CACHES_REDIS
```

### Cache Levels

1. **Default Cache** - General purpose caching
2. **Session Cache** - User session data
3. **API Cache** - API response caching

### Using the Cache

#### Function Caching

```python
from shared.caching import cached

@cached(ttl=300, key_prefix="user")
def get_user_profile(user_id):
    return User.objects.get(id=user_id)
```

#### Manual Caching

```python
from shared.caching import cache_manager, CacheKeyGenerator

# Set cache
key = CacheKeyGenerator.user_key(user_id)
cache_manager.set(key, user_data, ttl=300)

# Get cache
user_data = cache_manager.get(key)

# Delete cache
cache_manager.delete(key)

# Delete pattern
cache_manager.delete_pattern("user:*")
```

### Cache TTL Guidelines

| Data Type | TTL | Use Case |
|-----------|-----|----------|
| Real-time data | 60s | Live prices, sensor data |
| Frequently updated | 300s | User profiles, products |
| Stable data | 1800s | Categories, settings |
| Rarely changing | 3600s | Static content |
| Static content | 86400s | Images, documents |

### Cache Invalidation

```python
from shared.caching import invalidate_cache

@invalidate_cache("user:*")
def update_user(user_id, data):
    user = User.objects.get(id=user_id)
    user.update(data)
    return user
```

### Cache Warming

```python
from shared.caching import CacheWarmer

# Warm user cache
CacheWarmer.warm_user_cache([1, 2, 3, 4, 5])

# Warm product cache
CacheWarmer.warm_product_cache([10, 20, 30])
```

---

## Database Optimization

### Query Optimization

#### Use Optimized Querysets

```python
from shared.database_optimization import QueryOptimizer

# Optimized user query
users = QueryOptimizer.get_optimized_user_queryset()

# Optimized product query
products = QueryOptimizer.get_optimized_product_queryset()

# Optimized order query
orders = QueryOptimizer.get_optimized_order_queryset()
```

#### Manual Optimization

```python
from shared.database_optimization import QueryOptimizer

# Optimize any queryset
queryset = QueryOptimizer.optimize_queryset(
    Product.objects.all(),
    select_related=['seller', 'category'],
    prefetch_related=['images', 'reviews']
)
```

### Query Profiling

```python
from shared.database_optimization import profile_queries

@profile_queries("Get user orders")
def get_user_orders(user_id):
    return Order.objects.filter(user_id=user_id)
```

### Bulk Operations

```python
from shared.database_optimization import BulkOperationHelper

# Bulk create
objects = [Product(...) for i in range(1000)]
BulkOperationHelper.bulk_create_with_batch(Product, objects, batch_size=100)

# Bulk update
BulkOperationHelper.bulk_update_with_batch(objects, ['price', 'stock'], batch_size=100)
```

### Cursor Pagination

```python
from shared.database_optimization import QuerySetPaginator

# Paginate large queryset
results, next_cursor, has_more = QuerySetPaginator.cursor_paginate(
    queryset=Product.objects.all(),
    cursor=request.GET.get('cursor'),
    page_size=20,
    order_by='-created_at'
)
```

### Database Indexes

Recommended indexes are automatically documented:

```python
from shared.database_optimization import IndexManager

# Get missing indexes
missing = IndexManager.get_missing_indexes()

# Generate index SQL
sql = IndexManager.generate_index_sql('users', ('email', 'is_active'))
```

---

## CDN Integration

### Configuration

```python
# settings.py
CDN_ENABLED = True
CDN_DOMAIN = 'your-cdn-domain.cloudfront.net'
CDN_PROVIDER = 'cloudfront'
```

### Using CDN URLs

```python
from shared.cdn_integration import get_static_url, get_media_url

# Static assets
css_url = get_static_url('css/style.css')
js_url = get_static_url('js/app.js')

# Media files
image_url = get_media_url('images/product.jpg')
document_url = get_media_url('documents/invoice.pdf')
```

### Responsive Images

```python
from shared.cdn_integration import ImageOptimizer, cdn_manager

# Get responsive URLs
urls = ImageOptimizer.get_responsive_urls('product.jpg', cdn_manager)
# Returns: thumbnail, small, medium, large, original

# Generate srcset
srcset = ImageOptimizer.get_srcset('product.jpg', cdn_manager)
# Use in HTML: <img srcset="..." />
```

### Cache Headers

Automatic cache headers based on file type:

| File Type | Cache Duration | Immutable |
|-----------|----------------|-----------|
| .js, .css | 1 year | Yes |
| .jpg, .png | 30 days | No |
| .pdf, .doc | 1 day | No |
| .mp4 | 30 days | No |

### Cache Invalidation

```python
from shared.cdn_integration import invalidate_cdn_cache

# Invalidate single file
invalidate_cdn_cache('/images/product.jpg')

# Invalidate pattern
invalidate_cdn_cache('/images/*')
```

---

## Response Compression

### Enable Compression

```python
# settings.py
from shared.performance_settings import MIDDLEWARE_COMPRESSION

MIDDLEWARE = MIDDLEWARE_COMPRESSION + MIDDLEWARE
```

### Compression Settings

```python
GZIP_COMPRESSION_LEVEL = 6  # 1-9, higher = better compression
GZIP_MIN_LENGTH = 1024  # Minimum size to compress (1KB)
```

### Compressible Content Types

- text/html
- text/css
- text/javascript
- application/json
- application/xml
- image/svg+xml

---

## API Optimization

### Pagination

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.CursorPagination',
    'PAGE_SIZE': 20,
    'MAX_PAGE_SIZE': 100,
}
```

### Throttling

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'burst': '60/minute',
    },
}
```

### Field Selection

Allow clients to select specific fields:

```python
# Request: /api/products/?fields=id,name,price
class ProductViewSet(viewsets.ModelViewSet):
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['fields'] = self.request.query_params.get('fields')
        return context
```

---

## Performance Testing

### Run Performance Tests

```bash
# Run all tests
python manage.py performance_test --test all

# Run specific tests
python manage.py performance_test --test cache
python manage.py performance_test --test database
python manage.py performance_test --test api

# Run load test
python manage.py performance_test --test load --requests 1000 --concurrent 20
```

### Programmatic Testing

```python
from shared.performance_testing import (
    run_load_test,
    benchmark_function,
    check_sla_compliance
)

# Benchmark a function
results = benchmark_function(my_function, iterations=100)
print(f"Average time: {results['avg_time']}")

# Run load test
metrics = run_load_test(
    func=my_api_endpoint,
    num_requests=1000,
    concurrent_users=10
)

# Check SLA compliance
sla_results = check_sla_compliance(metrics)
print(f"SLA compliant: {sla_results['overall_compliant']}")
```

### Performance Metrics

```python
from shared.performance_testing import PerformanceMetrics

metrics = PerformanceMetrics()
# ... run tests ...

print(f"Success rate: {metrics.success_rate}%")
print(f"Avg response time: {metrics.avg_response_time}s")
print(f"P95 response time: {metrics.p95_response_time}s")
print(f"P99 response time: {metrics.p99_response_time}s")
print(f"Throughput: {metrics.requests_per_second} req/s")
```

---

## Monitoring

### Key Metrics

1. **Response Time**
   - Average, median, P95, P99
   - Per endpoint breakdown
   - Trend analysis

2. **Cache Performance**
   - Hit rate
   - Miss rate
   - Eviction rate
   - Memory usage

3. **Database Performance**
   - Query count per request
   - Query execution time
   - Connection pool usage
   - Slow query log

4. **Throughput**
   - Requests per second
   - Concurrent users
   - Error rate
   - Success rate

### Alerting Thresholds

```python
# settings.py
RESPONSE_TIME_WARNING = 1.0  # seconds
RESPONSE_TIME_CRITICAL = 2.0  # seconds
QUERY_COUNT_WARNING = 10
QUERY_COUNT_CRITICAL = 20
```

### Monitoring Tools

- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **ELK Stack**: Log analysis
- **Jaeger**: Distributed tracing

---

## Best Practices

### Caching

1. ✅ **Cache frequently accessed data**
   - User profiles
   - Product listings
   - Category data
   - Static content

2. ✅ **Use appropriate TTLs**
   - Real-time: 60s
   - Frequently updated: 300s
   - Stable: 1800s
   - Static: 86400s

3. ✅ **Invalidate on updates**
   ```python
   @invalidate_cache("product:*")
   def update_product(product_id, data):
       # Update logic
   ```

4. ✅ **Warm critical caches**
   ```python
   CacheWarmer.warm_user_cache(top_user_ids)
   CacheWarmer.warm_product_cache(featured_product_ids)
   ```

5. ✅ **Monitor cache performance**
   - Track hit rates
   - Monitor memory usage
   - Analyze miss patterns

### Database

1. ✅ **Use select_related for foreign keys**
   ```python
   Order.objects.select_related('buyer', 'seller', 'product')
   ```

2. ✅ **Use prefetch_related for many-to-many**
   ```python
   Product.objects.prefetch_related('images', 'reviews')
   ```

3. ✅ **Add indexes on frequently queried fields**
   ```python
   class Meta:
       indexes = [
           models.Index(fields=['status', 'created_at']),
       ]
   ```

4. ✅ **Use bulk operations**
   ```python
   Product.objects.bulk_create(products, batch_size=100)
   ```

5. ✅ **Profile queries in development**
   ```python
   @profile_queries("Get orders")
   def get_orders():
       # Query logic
   ```

### API

1. ✅ **Use cursor pagination for large datasets**
2. ✅ **Implement field selection**
3. ✅ **Enable response compression**
4. ✅ **Set appropriate cache headers**
5. ✅ **Use throttling to prevent abuse**

### CDN

1. ✅ **Serve all static assets from CDN**
2. ✅ **Use versioned URLs for cache busting**
3. ✅ **Optimize images with multiple sizes**
4. ✅ **Set long cache TTLs for immutable assets**
5. ✅ **Invalidate cache on asset updates**

---

## Troubleshooting

### Slow Queries

1. Enable query profiling:
   ```python
   @profile_queries("Slow operation")
   def slow_operation():
       # Your code
   ```

2. Check for N+1 queries
3. Add select_related/prefetch_related
4. Add database indexes
5. Use bulk operations

### Low Cache Hit Rate

1. Check TTL settings
2. Verify cache invalidation logic
3. Monitor cache memory
4. Analyze access patterns
5. Warm critical caches

### High Response Times

1. Profile slow endpoints
2. Check database queries
3. Verify cache usage
4. Enable compression
5. Use CDN for static assets

### High Error Rates

1. Check logs for errors
2. Monitor database connections
3. Verify cache availability
4. Check external service health
5. Review throttling settings

---

## Performance Checklist

### Development

- [ ] Use optimized querysets
- [ ] Profile queries
- [ ] Cache frequently accessed data
- [ ] Use bulk operations
- [ ] Enable query logging

### Staging

- [ ] Run performance tests
- [ ] Check SLA compliance
- [ ] Monitor cache hit rates
- [ ] Profile slow endpoints
- [ ] Test under load

### Production

- [ ] Enable Redis caching
- [ ] Configure CDN
- [ ] Enable compression
- [ ] Set up monitoring
- [ ] Configure alerts
- [ ] Enable connection pooling
- [ ] Use production database

---

## Additional Resources

- **Caching Module**: `shared/caching.py`
- **Database Optimization**: `shared/database_optimization.py`
- **CDN Integration**: `shared/cdn_integration.py`
- **Performance Testing**: `shared/performance_testing.py`
- **Settings**: `shared/performance_settings.py`
- **Completion Report**: `docs/tasks/TASK_24_COMPLETION.md`

---

## Support

For questions or issues:
1. Check this guide
2. Review completion report
3. Check module documentation
4. Run performance tests
5. Contact development team

---

**Last Updated**: December 5, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
