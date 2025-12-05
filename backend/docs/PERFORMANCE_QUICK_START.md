# Performance Optimization - Quick Start Guide

Get started with AgroBridge performance optimizations in 5 minutes.

---

## Prerequisites

- Python 3.10+
- Redis server (optional, but recommended)
- PostgreSQL (optional, for production)

---

## Installation

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Key packages installed:
- `django-redis` - Redis cache backend
- `redis` - Redis client
- `hiredis` - Fast Redis protocol parser
- `msgpack` - Fast serialization

### 2. Start Redis (Optional)

```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or install locally
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis

# Windows
# Download from https://redis.io/download
```

---

## Configuration

### 1. Update Settings

Add to your `settings.py`:

```python
# Import performance settings
from shared.performance_settings import (
    CACHES_REDIS,
    CACHES_FALLBACK,
    MIDDLEWARE_COMPRESSION,
    REST_FRAMEWORK_OPTIMIZED
)

# Enable Redis caching (or fallback to local memory)
try:
    import redis
    redis_client = redis.Redis(host='127.0.0.1', port=6379)
    redis_client.ping()
    CACHES = CACHES_REDIS
except:
    CACHES = CACHES_FALLBACK

# Enable compression
MIDDLEWARE = MIDDLEWARE_COMPRESSION + MIDDLEWARE

# Optimize REST Framework
REST_FRAMEWORK.update(REST_FRAMEWORK_OPTIMIZED)

# Redis configuration
REDIS_HOST = '127.0.0.1'
REDIS_PORT = 6379
REDIS_DB = 0
```

### 2. Enable Database Optimization

```python
from shared.performance_settings import DATABASE_POOL_CONFIG

# Apply connection pooling
DATABASES['default'].update(DATABASE_POOL_CONFIG)
```

---

## Usage

### 1. Cache Data

```python
from shared.caching import cached, cache_manager

# Cache function results
@cached(ttl=300, key_prefix="user")
def get_user(user_id):
    return User.objects.get(id=user_id)

# Manual caching
cache_manager.set('my_key', {'data': 'value'}, ttl=300)
data = cache_manager.get('my_key')
```

### 2. Optimize Queries

```python
from shared.database_optimization import QueryOptimizer

# Use optimized querysets
users = QueryOptimizer.get_optimized_user_queryset()
products = QueryOptimizer.get_optimized_product_queryset()
```

### 3. Run Performance Tests

```bash
# Test cache performance
python manage.py performance_test --test cache

# Test database performance
python manage.py performance_test --test database

# Run load test
python manage.py performance_test --test load --requests 100 --concurrent 10
```

---

## Quick Examples

### Example 1: Cache User Profile

```python
from shared.caching import cached, CacheKeyGenerator

@cached(ttl=300, key_prefix="user_profile")
def get_user_profile(user_id):
    user = User.objects.select_related('profile').get(id=user_id)
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'profile': {
            'bio': user.profile.bio,
            'avatar': user.profile.avatar_url,
        }
    }

# Use it
profile = get_user_profile(user_id=1)
```

### Example 2: Optimize Product Query

```python
from shared.database_optimization import QueryOptimizer

def get_products():
    # Optimized query with select_related and prefetch_related
    products = QueryOptimizer.get_optimized_product_queryset()
    
    # Filter and paginate
    products = products.filter(is_active=True)[:20]
    
    return products
```

### Example 3: Profile Slow Function

```python
from shared.database_optimization import profile_queries

@profile_queries("Get user orders")
def get_user_orders(user_id):
    orders = Order.objects.filter(user_id=user_id)
    return list(orders)

# This will log: "Get user orders: X queries in Y seconds"
```

---

## Verification

### 1. Check Redis Connection

```python
from shared.caching import cache_manager

# Test cache
cache_manager.set('test', 'value', ttl=60)
value = cache_manager.get('test')
print(f"Cache working: {value == 'value'}")
```

### 2. Run Performance Tests

```bash
python manage.py performance_test --test all
```

Expected output:
```
--- Cache Performance Test ---
Cache SET: 0.001s
Cache GET: 0.0005s
Cache DELETE: 0.001s
✓ Cache performance test completed

--- Database Performance Test ---
Unoptimized Query: 0.150s
Optimized Query: 0.030s
Performance Improvement: 80.00%
✓ Database performance test completed
```

### 3. Check Metrics

```python
from shared.performance_testing import benchmark_function

def my_function():
    # Your code here
    pass

results = benchmark_function(my_function, iterations=100)
print(results)
```

---

## Common Issues

### Redis Connection Failed

**Problem**: Cannot connect to Redis

**Solution**:
1. Check if Redis is running: `redis-cli ping`
2. Verify host/port in settings
3. Use fallback cache: `CACHES = CACHES_FALLBACK`

### Slow Queries

**Problem**: Database queries are slow

**Solution**:
1. Use optimized querysets
2. Add select_related/prefetch_related
3. Profile queries with `@profile_queries`
4. Add database indexes

### Low Cache Hit Rate

**Problem**: Cache hit rate is low

**Solution**:
1. Increase TTL for stable data
2. Warm cache on startup
3. Check cache invalidation logic
4. Monitor cache memory

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure Redis
3. ✅ Update settings
4. ✅ Run performance tests
5. ⏳ Monitor metrics in production
6. ⏳ Tune based on usage patterns

---

## Resources

- **Full Guide**: `docs/PERFORMANCE_OPTIMIZATION_GUIDE.md`
- **Completion Report**: `docs/tasks/TASK_24_COMPLETION.md`
- **Caching Module**: `shared/caching.py`
- **Database Optimization**: `shared/database_optimization.py`
- **Performance Testing**: `shared/performance_testing.py`

---

## Performance Targets

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| Response Time (P95) | < 1.0s | Cache + Query optimization |
| Cache Hit Rate | > 80% | Proper TTLs + Cache warming |
| Throughput | > 100 req/s | All optimizations |
| Success Rate | > 99.9% | Error handling + Monitoring |

---

## Quick Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Start Redis
docker run -d -p 6379:6379 redis:latest

# Run performance tests
python manage.py performance_test --test all

# Test cache
python manage.py performance_test --test cache

# Test database
python manage.py performance_test --test database

# Load test
python manage.py performance_test --test load --requests 1000 --concurrent 20
```

---

**Ready to optimize!** 🚀

For detailed information, see the [Performance Optimization Guide](PERFORMANCE_OPTIMIZATION_GUIDE.md).
