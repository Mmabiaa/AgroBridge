# Performance Optimization Setup Instructions

Quick guide to set up performance optimization on your system.

---

## Current Issues & Solutions

### Issue 1: Virtual Environment Path Mismatch

**Problem**: Your venv is looking for files in the wrong location.

**Solution**:
```powershell
# Recreate virtual environment in the correct location
cd C:\Users\dell\OneDrive\Documents\Programming\Web\AgroBridge\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Issue 2: Missing Dependencies

**Problem**: psycopg2 and other packages not installed.

**Solution**:
```powershell
# Install only required dependencies (without PostgreSQL)
python -m pip install --upgrade pip
python -m pip install django djangorestframework django-cors-headers
python -m pip install django-environ django-filter djangorestframework-simplejwt
python -m pip install redis django-redis hiredis msgpack
python -m pip install channels channels-redis
```

### Issue 3: Redis Not Available

**Problem**: Docker not installed, Redis not running.

**Solution** (Choose one):

**Option A: Use Local Memory Cache (No Redis needed)**
```python
# In settings.py - Already configured as fallback
from shared.performance_settings import CACHES_FALLBACK
CACHES = CACHES_FALLBACK
```

**Option B: Install Redis on Windows**
```powershell
# Download Redis for Windows
# https://github.com/microsoftarchive/redis/releases
# Extract and run: redis-server.exe
```

**Option C: Use WSL (Windows Subsystem for Linux)**
```powershell
# Install WSL if not already installed
wsl --install

# In WSL terminal:
sudo apt-get update
sudo apt-get install redis-server
sudo service redis-server start
```

---

## Quick Setup (Without Redis)

### Step 1: Fix Virtual Environment

```powershell
cd backend
python -m venv venv --clear
.\venv\Scripts\Activate.ps1
```

### Step 2: Install Core Dependencies

```powershell
python -m pip install --upgrade pip
python -m pip install django djangorestframework django-cors-headers django-environ
```

### Step 3: Install Performance Dependencies

```powershell
python -m pip install redis django-redis hiredis msgpack
```

### Step 4: Test Performance Modules

```powershell
# Run simple test (no Django required)
python test_performance_simple.py
```

### Step 5: Update Settings

Add to your `agrobridge_backend/settings.py`:

```python
# Performance Optimization
from shared.performance_settings import CACHES_FALLBACK, MIDDLEWARE_COMPRESSION

# Use local memory cache (no Redis needed)
CACHES = CACHES_FALLBACK

# Enable compression
MIDDLEWARE = MIDDLEWARE_COMPRESSION + MIDDLEWARE
```

### Step 6: Test with Django

```powershell
# This should work now
python manage.py check
```

---

## Full Setup (With Redis)

### Step 1-3: Same as Quick Setup

### Step 4: Install Redis

**Windows (using Chocolatey)**:
```powershell
choco install redis-64
redis-server
```

**Or download manually**:
- Download: https://github.com/microsoftarchive/redis/releases
- Extract and run `redis-server.exe`

### Step 5: Test Redis Connection

```powershell
# In another terminal
redis-cli ping
# Should return: PONG
```

### Step 6: Update Settings for Redis

```python
# In settings.py
from shared.performance_settings import CACHES_REDIS, MIDDLEWARE_COMPRESSION

# Use Redis cache
CACHES = CACHES_REDIS

# Enable compression
MIDDLEWARE = MIDDLEWARE_COMPRESSION + MIDDLEWARE

# Redis configuration
REDIS_HOST = '127.0.0.1'
REDIS_PORT = 6379
REDIS_DB = 0
```

### Step 7: Run Performance Tests

```powershell
python manage.py performance_test --test all
```

---

## Automated Setup

Run the setup script:

```powershell
.\setup_performance.ps1
```

This will:
1. Check Python installation
2. Install dependencies
3. Check Redis availability
4. Create configuration
5. Test modules

---

## Verification

### Test 1: Import Modules

```powershell
python test_performance_simple.py
```

Expected output:
```
✓ All modules imported successfully
✓ Cache key generation working
✓ Performance metrics working
✓ Benchmark working
✓ CDN configuration working
✓ Cache TTL configuration working
```

### Test 2: Django Integration

```powershell
python manage.py check
```

Should show no errors.

### Test 3: Performance Tests (if Django is configured)

```powershell
python manage.py performance_test --test cache
```

---

## Troubleshooting

### Error: "No module named 'psycopg2'"

**Cause**: Some models use PostgreSQL-specific fields but you're using SQLite.

**Solution**: Comment out PostgreSQL-specific imports temporarily:

```python
# In emergency_response/models.py
# from django.contrib.postgres.fields import ArrayField
# Use JSONField instead
```

Or install psycopg2:
```powershell
python -m pip install psycopg2-binary
```

### Error: "Redis connection failed"

**Cause**: Redis not running or not installed.

**Solution**: Use fallback cache (already configured):
```python
CACHES = CACHES_FALLBACK  # Uses local memory
```

### Error: "Virtual environment path not found"

**Cause**: Virtual environment created in wrong location.

**Solution**: Recreate venv:
```powershell
cd backend
python -m venv venv --clear
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

---

## Minimal Working Configuration

If you just want to test the performance modules without full setup:

```python
# minimal_test.py
import sys
sys.path.insert(0, '.')

from shared.caching import CacheKeyGenerator
from shared.performance_testing import PerformanceMetrics

# Generate cache keys
key = CacheKeyGenerator.user_key(123)
print(f"Cache key: {key}")

# Create metrics
metrics = PerformanceMetrics()
metrics.total_requests = 100
metrics.successful_requests = 95
print(f"Success rate: {metrics.success_rate}%")

print("✓ Performance modules working!")
```

Run:
```powershell
python minimal_test.py
```

---

## Next Steps

1. ✅ Fix virtual environment
2. ✅ Install dependencies
3. ✅ Test modules
4. ⏳ Configure Redis (optional)
5. ⏳ Update Django settings
6. ⏳ Run performance tests
7. ⏳ Monitor in production

---

## Support

- **Quick Start**: `docs/PERFORMANCE_QUICK_START.md`
- **Full Guide**: `docs/PERFORMANCE_OPTIMIZATION_GUIDE.md`
- **Module Test**: `test_performance_simple.py`
- **Setup Script**: `setup_performance.ps1`

---

## Summary

**Without Redis** (Recommended for testing):
1. Fix venv: `python -m venv venv --clear`
2. Install deps: `pip install django redis django-redis`
3. Use fallback cache in settings
4. Test: `python test_performance_simple.py`

**With Redis** (Recommended for production):
1. Install Redis
2. Start Redis server
3. Use Redis cache in settings
4. Test: `python manage.py performance_test --test all`

Both configurations work! Redis provides better performance but local memory cache is fine for development and testing.
